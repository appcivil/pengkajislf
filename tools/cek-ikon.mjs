/**
 * Memeriksa setiap <i class="fa-…"> di halaman: apakah glifnya benar-benar tergambar?
 * Dipakai lebar elemen sebagai bukti — ikon tanpa aturan CSS tidak punya
 * konten ::before, sehingga elemennya runtuh menjadi lebar 0.
 */
import { chromium } from 'playwright';
const ALAMAT = process.argv[2];
const browser = await chromium.launch();
const hal = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await hal.goto(ALAMAT, { waitUntil: 'load' });
await hal.waitForTimeout(5000);

const hasil = await hal.evaluate(async () => {
  await document.fonts.load('24px "Font Awesome 6 Free"', '\uf007').catch(() => {});
  const ikon = [...document.querySelectorAll('i[class*="fa-"]')];
  return ikon.map((el) => {
    const kelas = (el.className.match(/fa-[a-z0-9-]+/g) || [])
      .filter((c) => !/^fa-(beat|bounce|fade|flip|shake|spin|pulse|fw|ul|li|2x|3x|lg|sm|xs|spin-pulse)$/.test(c));
    const utama = kelas[kelas.length - 1] || '(tak dikenal)';
    const cs = getComputedStyle(el, '::before');
    return {
      kelas: utama,
      konten: cs.content && cs.content !== 'none' && cs.content !== 'normal' ? 'ada' : 'kosong',
      lebar: Math.round(el.getBoundingClientRect().width * 10) / 10,
    };
  });
});

const rusak = hasil.filter((r) => r.konten === 'kosong' || r.lebar < 1);
console.log(`  ikon di halaman: ${hasil.length}`);
for (const r of hasil) {
  console.log(`    ${r.konten === 'ada' && r.lebar >= 1 ? '✅' : '❌'} ${r.kelas.padEnd(22)} konten ${r.konten.padEnd(7)} lebar ${r.lebar}px`);
}
console.log(`\n  ${rusak.length === 0 ? '✅ semua ikon tergambar' : `❌ ${rusak.length} ikon TIDAK tergambar: ${rusak.map((h) => h.kelas).join(', ')}`}`);
await browser.close();
