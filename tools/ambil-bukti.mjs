import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
// Folder keluaran dibuat otomatis agar skrip dapat dijalankan pada checkout baru.
mkdirSync('tangkapan-live', { recursive: true });
const ALAMAT = process.argv[2] || 'https://appcivil.github.io/pengkajislf/';
const KELUAR = 'tangkapan-live';
const b = await chromium.launch();
for (const [nama, vp] of [['desktop-final', { width: 1440, height: 900 }], ['ponsel-final', { width: 390, height: 844 }]]) {
  const c = await b.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const p = await c.newPage();
  await p.goto(ALAMAT, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${KELUAR}/${nama}.png`, fullPage: true });
  // rekap ikon pada halaman ini
  const ikon = await p.evaluate(() => [...document.querySelectorAll('i[class*="fa-"]')]
    .map(el => { const s = getComputedStyle(el, '::before'); return { cls: [...el.classList].find(x => x.startsWith('fa-') && x !== 'fa-solid'), konten: s.content, w: +getComputedStyle(el).width.replace('px','') }; }));
  const rusak = ikon.filter(i => !i.konten || i.konten === 'none' || i.konten === 'normal' || i.w < 1);
  console.log(`  ${nama}: ${ikon.length} ikon · ${rusak.length} kotak kosong${rusak.length ? ' → ' + rusak.map(r => r.cls).join(', ') : ''}`);
  await c.close();
}
await b.close();
