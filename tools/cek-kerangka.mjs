import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
// Folder keluaran dibuat otomatis agar skrip dapat dijalankan pada checkout baru.
mkdirSync('tangkapan-dalam', { recursive: true });
const b = await chromium.launch();
const target = [
  ['dashboard', { width: 1600, height: 720 }],
  ['dashboard', { width: 1440, height: 900 }],
  ['dashboard', { width: 390, height: 844 }],
];
for (const [rute, vp] of target) {
  const c = await b.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const p = await c.newPage();
  await p.goto('http://localhost:5180/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  if (await p.locator('#btn-dev-bypass').count()) { await p.click('#btn-dev-bypass'); await p.waitForTimeout(1200); }
  await p.evaluate((r) => { window.location.hash = `#/${r}`; }, rute);
  await p.waitForTimeout(3000);
  await p.screenshot({ path: 'tangkapan-dalam/kerangka-dashboard.png' });
  const r = await p.evaluate(() => ({ hash: location.hash, judul: document.querySelector('.page-title, .page-header h1, h1')?.innerText?.trim() }));
  console.log(`  ${vp.width}×${vp.height}  ${rute.padEnd(12)} hash=${r.hash.padEnd(14)} judul="${r.judul || '(tidak ada)'}"`);
  await c.close();
}
await b.close();
