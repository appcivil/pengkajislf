import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [nama, vp] of [['desktop 1440×900', { width: 1440, height: 900 }], ['desktop 1440×760', { width: 1440, height: 760 }], ['ponsel 390×844', { width: 390, height: 844 }]]) {
  const c = await b.newContext({ viewport: vp });
  const p = await c.newPage();
  await p.goto('http://localhost:5180/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  if (await p.locator('#btn-dev-bypass').count()) { await p.click('#btn-dev-bypass'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { window.location.hash = '#/dashboard'; });
  await p.waitForTimeout(3500);
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const k = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height),
               gulir: el.scrollHeight, terlihat: el.clientHeight, bisaDigulir: el.scrollHeight > el.clientHeight + 1, position: s.position, overflowY: s.overflowY, z: s.zIndex }; };
    const nav = q('#sidebar-nav');
    const anakNav = nav ? [...nav.children] : [];
    const terakhir = anakNav[anakNav.length - 1];
    const footer = q('.sidebar-footer');
    const bnav = q('.bnav, .bottom-nav');
    const isi = q('#page-root');
    const itemTerakhirTerlihat = terakhir && nav ? (terakhir.getBoundingClientRect().bottom <= nav.getBoundingClientRect().bottom + 1) : null;
    // apakah isi halaman tertutup elemen tetap?
    let tertutup = null;
    if (bnav && getComputedStyle(bnav).position === 'fixed' && isi) {
      const bb = bnav.getBoundingClientRect(), ib = isi.getBoundingClientRect();
      tertutup = Math.max(0, Math.round(bb.top - ib.bottom));
    }
    return {
      sidebar: k(q('#app-sidebar')), nav: k(nav), footer: k(footer), bnav: k(bnav), isi: k(isi),
      jumlahItemNav: anakNav.length, itemTerakhirTerlihat,
      badgeBawah: k(footer?.lastElementChild),
      scrollBawah: nav ? Math.round(nav.scrollHeight - nav.clientHeight) : null,
      paddingBawahIsi: isi ? getComputedStyle(isi).paddingBottom : null,
    };
  });
  console.log(`\n  ${nama}`);
  console.log(`    sidebar   : ${r.sidebar ? `${r.sidebar.w}×${r.sidebar.h} overflowY=${r.sidebar.overflowY}` : 'tidak ada'}`);
  console.log(`    nav       : ${r.nav ? `tinggi terlihat ${r.nav.terlihat} · isi ${r.nav.gulir} · bisa digulir ${r.nav.bisaDigulir} (max ${r.scrollBawah}px)` : '-'} · ${r.jumlahItemNav} item`);
  console.log(`    item terakhir nav terlihat tanpa menggulir: ${r.itemTerakhirTerlihat}`);
  console.log(`    footer    : ${r.footer ? `top ${r.footer.top} bottom ${r.footer.bottom} (layar ${vp.height}) · tinggi ${r.footer.h}` : 'tidak ada'}`);
  if (r.footer && r.footer.bottom > vp.height + 1) console.log(`      ⚠ footer melewati dasar layar ${r.footer.bottom - vp.height}px → isinya terpotong`);
  console.log(`    bottom-nav: ${r.bnav ? `${r.bnav.w}×${r.bnav.h} posisi ${r.bnav.position}` : 'tidak' + ' ada'}`);
  console.log(`    isi halaman: padding-bottom ${r.paddingBawahIsi}${r.tertutup !== null ? ` · celah ke bottom-nav ${r.tertutup}px` : ''}`);
  await c.close();
}
await b.close();
