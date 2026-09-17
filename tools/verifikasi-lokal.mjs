/**
 * Verifikasi perbaikan di peramban sungguhan, terhadap build lokal.
 * Empat hal yang tadi rusak, diuji ulang satu per satu.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
// Folder keluaran dibuat otomatis agar skrip dapat dijalankan pada checkout baru.
mkdirSync('tangkapan-live', { recursive: true });

const ALAMAT = process.argv[2] || 'http://localhost:5174/';
const browser = await chromium.launch();
let gagal = 0;
const cek = (nama, lulus, keterangan) => {
  console.log(`  ${lulus ? '✅' : '❌'} ${nama}${keterangan ? ` — ${keterangan}` : ''}`);
  if (!lulus) gagal++;
};

// ── 1. Ikon Font Awesome benar-benar tergambar ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const hal = await ctx.newPage();
  const gagalFont = [];
  hal.on('response', (r) => {
    if (/fa-[\w-]+\.woff2?/.test(r.url()) && r.status() >= 400) gagalFont.push(`${r.status()} ${r.url()}`);
  });
  await hal.goto(ALAMAT, { waitUntil: 'load' });
  await hal.waitForTimeout(3500);

  const info = await hal.evaluate(async () => {
    // Paksa font dimuat, lalu UKUR glifnya. Memeriksa document.fonts.check()
    // saja menyesatkan: bila belum ada ikon di layar, fontnya memang belum
    // dimuat sehingga hasilnya "unloaded" walaupun berkasnya sehat.
    let galat = null;
    try { await document.fonts.load('24px "Font Awesome 6 Free"', '\uf007'); } catch (e) { galat = e.message; }
    await document.fonts.ready;
    const i = document.createElement('i');
    i.className = 'fas fa-user';
    i.style.cssText = 'position:absolute;font-size:24px;visibility:hidden';
    document.body.appendChild(i);
    const lebar = i.getBoundingClientRect().width;
    const isi = getComputedStyle(i, '::before').content;
    document.body.removeChild(i);
    const fa = [...document.fonts].filter((f) => /Font Awesome 6 Free/i.test(f.family));
    return {
      tersedia: fa.some((f) => f.status === 'loaded'),
      terdaftar: fa.map((f) => `${f.family} ${f.status}`),
      lebar, isi, galat,
    };
  });
  cek('berkas font Font Awesome tidak 404', gagalFont.length === 0, gagalFont.join(', ') || 'tidak ada 404');
  cek('font Font Awesome termuat', info.tersedia, info.terdaftar.join(', ') || (info.galat || '(tidak ada @font-face)'));
  // Glif 0x f007 (ikon user). Bila font gagal, peramban memakai font cadangan
  // dan lebarnya berbeda jauh.
  cek('glif ikon tergambar dengan lebar wajar', info.lebar > 6 && info.lebar < 40, `lebar ${info.lebar.toFixed(1)} px · konten "${info.isi}"`);
  await ctx.close();
}

// ── 2. Tata letak halaman login di ponsel ──
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const hal = await ctx.newPage();
  await hal.goto(ALAMAT, { waitUntil: 'load' });
  await hal.waitForTimeout(4000);

  const ukur = await hal.evaluate(() => {
    const L = document.documentElement.clientWidth;
    const keluar = [];
    for (const el of document.querySelectorAll('#app *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > L + 1 || r.left < -1) keluar.push(`${el.className || el.tagName} (kanan ${Math.round(r.right)} > ${L})`);
    }
    const kartu = document.querySelector('.login-card-quartz');
    return {
      lebarLayar: L,
      lebarIsi: document.documentElement.scrollWidth,
      keluar: [...new Set(keluar)].slice(0, 5),
      kananKartu: kartu ? Math.round(kartu.getBoundingClientRect().right) : null,
    };
  });
  cek('tidak ada elemen keluar dari layar 390px', ukur.keluar.length === 0, ukur.keluar.join(' · ') || 'semua di dalam layar');
  cek('sisi kanan kartu login di dalam layar', ukur.kananKartu === null || ukur.kananKartu <= ukur.lebarLayar + 1, `kanan=${ukur.kananKartu} layar=${ukur.lebarLayar}`);
  await hal.screenshot({ path: 'tangkapan-live/ponsel-setelah-perbaikan.png' });
  await ctx.close();
}

// ── 3. Service worker terdaftar ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const hal = await ctx.newPage();
  const galatSW = [];
  hal.on('console', (m) => { if (/\[SW\]/.test(m.text())) galatSW.push(m.text().slice(0, 120)); });
  await hal.goto(ALAMAT, { waitUntil: 'load' });
  await hal.waitForTimeout(5000);
  const sw = await hal.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
    return { ada: !!reg, scope: reg?.scope || null, aktif: reg?.active?.state || reg?.installing?.state || null };
  });
  cek('service worker terdaftar', sw.ada, sw.scope ? `cakupan ${sw.scope} · status ${sw.aktif}` : 'tidak terdaftar');
  console.log(`     log konsol: ${galatSW.join(' | ') || '(tidak ada)'}`);
  await ctx.close();
}

// ── 4. Teks antarmuka halaman login sudah berbahasa Indonesia ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const hal = await ctx.newPage();
  await hal.goto(ALAMAT, { waitUntil: 'load' });
  await hal.waitForTimeout(3500);
  const teks = await hal.evaluate(() => (document.querySelector('#app')?.innerText || '').slice(0, 600));
  const inggris = (teks.match(/\b(the|and|is|are|will|your|you|this|that)\b/gi) || []).length;
  cek('tidak ada kalimat Inggris di layar login', inggris <= 2, `${inggris} kata fungsi Inggris ditemukan`);
  console.log(`     cuplikan: ${JSON.stringify(teks.replace(/\s+/g, ' ').slice(0, 150))}`);
  await hal.screenshot({ path: 'tangkapan-live/desktop-setelah-perbaikan.png' });
  await ctx.close();
}

await browser.close();
console.log(`\n  ${gagal === 0 ? '✅ semua pemeriksaan lulus' : `❌ ${gagal} pemeriksaan gagal`}`);
process.exit(gagal === 0 ? 0 : 1);
