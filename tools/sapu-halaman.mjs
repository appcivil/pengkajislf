/**
 * Sapu seluruh halaman aplikasi dengan peramban sungguhan, lalu ukur hal-hal
 * yang menentukan kesan "clean & profesional":
 *
 *   - elemen yang keluar dari layar (desktop 1440 maupun ponsel 390)
 *   - halaman yang gagal selesai memuat ("Memuat …" yang tidak berakhir)
 *   - jumlah dan susunan judul (h1 tidak boleh lebih dari satu)
 *   - ketidaksejajaran tepi kiri isi antarhalaman (padding halaman)
 *   - elemen yang menutupi isi (sticky/bottom nav)
 *   - teks terlalu redup (opasitas < 0.55 pada ukuran kecil)
 *   - galat konsol per halaman
 *
 * Pakai: node sapu-halaman.mjs <url-dasar> [desktop|ponsel]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASIS = process.argv[2] || 'http://localhost:5180/';
const MODE = process.argv[3] || 'desktop';
const KELUAR = 'tangkapan-dalam';

const HALAMAN = [
  'dashboard', 'proyek', 'proyek-baru', 'checklist', 'tier-checklist',
  'multi-agent', 'analisis', 'ndt-calculator', 'seismic-calculator',
  'files', 'tim-kerja', 'todo', 'laporan', 'galeri', 'simulation',
  'kondisi', 'surat-pernyataan-list', 'settings', 'smart-ai', 'chatbot',
  'canva-studio',
  'electrical-inspection', 'fire-protection', 'architectural', 'egress-system',
  'environmental', 'accessibility', 'comfort-inspection', 'lighting-simulation',
  'water-inspection', 'wastewater-inspection', 'environmental-impact',
  'stormwater', 'sanitation-inspection', 'disaster-mitigation',
  'verify', '404',
];
const VP = MODE === 'ponsel' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
mkdirSync(`${KELUAR}/${MODE}`, { recursive: true });

const b = await chromium.launch();
const c = await b.newContext({ viewport: VP });
const p = await c.newPage();

const ambil = async () => p.evaluate(() => {
  const terlihat = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 4 && r.height > 4;
  };
  const semua = [...document.querySelectorAll('body *')].filter(terlihat);

  // Ukuran yang menentukan apakah halaman "meluber" adalah lebar DOKUMEN, bukan
  // bounding box elemen: sidebar yang tersembunyi (transform) maupun elemen
  // fixed berhak berada di luar viewport tanpa memunculkan gulir. Karena itu
  // sinyal utamanya adalah docWidth, dan yang dihitung sebagai keluar-layar
  // hanya elemen yang membuat dokumen menjadi lebih lebar.
  const docWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const keluarLayar = docWidth > window.innerWidth + 1
    ? semua
      .filter((el) => {
        const gaya = getComputedStyle(el);
        if (gaya.position === 'fixed') return false;
        const r = el.getBoundingClientRect();
        return r.right > docWidth - 2 || r.left < 1;
      })
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`)
    : [];

  // Tepi kiri isi halaman (acuan keselarasan antarhalaman).
  const akar = document.querySelector('#page-root, #main-content, main, .page-container') || document.body;
  const blok = [...akar.children].filter(terlihat);
  const tepiKiri = blok.length ? Math.round(Math.min(...blok.map((el) => el.getBoundingClientRect().left))) : null;

  const judul = {
    h1: [...document.querySelectorAll('h1')].filter(terlihat).map((h) => h.innerText.trim().slice(0, 60)),
    h2: [...document.querySelectorAll('h2')].filter(terlihat).length,
    h3: [...document.querySelectorAll('h3')].filter(terlihat).length,
  };

  const redup = semua
    .filter((el) => el.children.length === 0 && el.textContent.trim().length > 3)
    .filter((el) => {
      const s = getComputedStyle(el);
      const op = parseFloat(s.opacity);
      const warnaDepan = s.color.match(/[\d.]+/g).map(Number);
      return op < 0.55 || (warnaDepan.length >= 3 && warnaDepan[3] !== undefined && warnaDepan[3] < 0.45);
    })
    .map((el) => `${(el.className || '').toString().split(' ')[0] || el.tagName.toLowerCase()}`);

  const memuat = /memuat|menyiapkan|loading/i.test(document.body.innerText.slice(0, 4000));

  // Elemen posisinya menutupi isi (mis. warna latar sama dengan latar halaman).
  const menu = document.querySelector('.bnav, .bottom-nav');
  const tinggiMenu = menu && getComputedStyle(menu).position === 'fixed' ? menu.getBoundingClientRect().height : 0;

  return {
    docWidth,
    gulirMendatar: docWidth - window.innerWidth,
    tinggiHalaman: document.documentElement.scrollHeight,
    tinggiLayar: window.innerHeight,
    keluarLayar: [...new Set(keluarLayar)].slice(0, 6),
    jumlahKeluar: keluarLayar.length,
    tepiKiri,
    judul,
    jumlahRedup: redup.length,
    contohRedup: [...new Set(redup)].slice(0, 4),
    memuat,
    tinggiMenu,
    teksAwal: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 150),
  };
});

await p.goto(BASIS, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
if (await p.locator('#btn-dev-bypass').count()) {
  await p.click('#btn-dev-bypass');
  await p.waitForTimeout(2500);
}
// Setelah bypass, navigate() gagal karena window.navigate belum terpasang saat itu;
// pakai navigasi hash langsung agar router memuat halaman.
await p.evaluate(() => { window.location.hash = '#/dashboard'; });
await p.waitForTimeout(2500);

const hasil = [];
for (const nama of HALAMAN) {
  const galat = [];
  const pendengar = (m) => { if (m.type() === 'error') galat.push(m.text().replace(/\s+/g, ' ').slice(0, 90)); };
  p.on('console', pendengar);
  await p.evaluate((n) => { window.location.hash = `#/${n}`; }, nama);
  await p.waitForTimeout(3200);
  const r = await ambil();
  await p.screenshot({ path: `${KELUAR}/${MODE}/${nama}.png`, fullPage: true });
  p.off('console', pendengar);
  hasil.push({ nama, galat: [...new Set(galat)].slice(0, 3), ...r });
  const tanda = [];
  if (r.gulirMendatar > 1) tanda.push(`MELUBER ${r.gulirMendatar}px`);
  if (r.memuat) tanda.push('MASIH MEMUAT');
  if (r.judul.h1.length > 1) tanda.push(`h1×${r.judul.h1.length}`);
  if (r.judul.h1.length === 0) tanda.push('tanpa h1');
  if (r.jumlahRedup > 3) tanda.push(`redup ${r.jumlahRedup}`);
  if (galat.length) tanda.push(`galat ${galat.length}`);
  console.log(
    `  ${nama.padEnd(26)} tepi ${String(r.tepiKiri).padStart(4)} · lebar ${String(r.docWidth).padStart(5)} · ` +
    `h1=${r.judul.h1.length} h2=${r.judul.h2} ` + (tanda.length ? `  ⚠ ${tanda.join(' · ')}` : '  ✅')
  );
  if (r.memuat) console.log(`      teks: ${r.teksAwal.slice(0, 110)}`);
  if (galat.length) console.log(`      galat: ${galat[0]}`);
}
await b.close();
console.log(`\n  tangkapan layar: ${KELUAR}/${MODE}/`);
