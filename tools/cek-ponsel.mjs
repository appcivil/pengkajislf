import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
// Folder keluaran dibuat otomatis agar skrip dapat dijalankan pada checkout baru.
mkdirSync('tangkapan-dalam', { recursive: true });
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await c.newPage();
await p.goto('http://localhost:5180/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1800);
if (await p.locator('#btn-dev-bypass').count()) { await p.click('#btn-dev-bypass'); await p.waitForTimeout(1200); }
await p.evaluate(() => { window.location.hash = '#/dashboard'; });
await p.waitForTimeout(3000);
const r = await p.evaluate(() => {
  const doc = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const banner = document.querySelector('.bypass-warning-banner');
  const fab = document.querySelector('.floating-chat-btn');
  const nav = document.querySelector('.bottom-nav');
  const tumpang = (a, z) => { if (!a || !z) return null; const x = a.getBoundingClientRect(), y = z.getBoundingClientRect();
    const luas = Math.max(0, Math.min(x.right, y.right) - Math.max(x.left, y.left)) * Math.max(0, Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top));
    return Math.round(luas); };
  const g = (el) => el ? { display: getComputedStyle(el).display, bg: getComputedStyle(el).backgroundColor, radius: getComputedStyle(el).borderRadius } : null;
  return {
    docWidth: doc, gulirMendatar: doc - window.innerWidth,
    banner: g(banner), bannerTinggi: banner ? Math.round(banner.getBoundingClientRect().height) : null,
    bannerKeluarLayar: banner ? banner.getBoundingClientRect().right > window.innerWidth + 1 : null,
    fab: fab ? { bottom: Math.round(window.innerHeight - fab.getBoundingClientRect().bottom), kanan: Math.round(window.innerWidth - fab.getBoundingClientRect().right) } : null,
    navTinggi: nav ? Math.round(nav.getBoundingClientRect().height) : null,
    tumpangFabNav: tumpang(fab, nav),
    labelNav: [...document.querySelectorAll('.bnav-item span')].map((s) => s.innerText.trim()),
  };
});
console.log(`  lebar dokumen ${r.docWidth} (layar 390) → gulir mendatar ${r.gulirMendatar}px ${r.gulirMendatar <= 1 ? '✅' : '❌'}`);
console.log(`  banner Mode Pratinjau: ${JSON.stringify(r.banner)} · tinggi ${r.bannerTinggi}px · keluar layar: ${r.bannerKeluarLayar ? '❌' : 'tidak ✅'}`);
console.log(`  menu bawah: tinggi ${r.navTinggi}px · label ${JSON.stringify(r.labelNav)}`);
console.log(`  tombol chat: ${r.fab.bottom}px dari bawah · tumpang-tindih dengan menu: ${r.tumpangFabNav}px²  ${r.tumpangFabNav === 0 ? '✅' : '❌'}`);
await p.screenshot({ path: 'tangkapan-dalam/ponsel-dashboard-setelah.png', fullPage: false });
await b.close();
