import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
// Folder keluaran dibuat otomatis agar skrip dapat dijalankan pada checkout baru.
mkdirSync('tangkapan-dalam', { recursive: true });
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await c.newPage();
await p.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2000);
if (await p.locator('#btn-dev-bypass').count()) { await p.click('#btn-dev-bypass'); await p.waitForTimeout(1500); }
await p.evaluate(() => { window.location.hash = '#/dashboard'; });
await p.waitForTimeout(3000);
const r = await p.evaluate(() => {
  const sb = document.querySelector('#app-sidebar');
  const s = sb.getBoundingClientRect();
  const keluar = [...sb.querySelectorAll('*')].filter((el) => {
    const b = el.getBoundingClientRect();
    if (b.width === 0) return false;
    const gaya = getComputedStyle(el);
    return gaya.display !== 'none' && (b.left < s.left - 1 || b.right > s.right + 1);
  }).map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} (${Math.round(el.getBoundingClientRect().left)}–${Math.round(el.getBoundingClientRect().right)} vs rel ${Math.round(s.left)}–${Math.round(s.right)})`);
  return { lebar: Math.round(s.width), keluar: [...new Set(keluar)] };
});
console.log(`  sidebar ${r.lebar}px · elemen keluar rel: ${r.keluar.length}${r.keluar.length ? '\n   ' + r.keluar.join('\n   ') : ' ✅'}`);
await p.screenshot({ path: 'tangkapan-dalam/kaki-sidebar-setelah.png', clip: { x: 0, y: 740, width: 300, height: 160 } });
await p.screenshot({ path: 'tangkapan-dalam/dashboard-setelah.png' });
await b.close();
