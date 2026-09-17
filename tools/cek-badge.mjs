import { chromium } from 'playwright';
const ALAMAT = process.argv[2];
const b = await chromium.launch();
for (const [nama, vp] of [['desktop 1440×900', { width: 1440, height: 900 }], ['ponsel 390×844', { width: 390, height: 844 }]]) {
  const c = await b.newContext({ viewport: vp });
  const p = await c.newPage();
  await p.goto(ALAMAT, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => {
    const root = document.getElementById('sync-indicator-root');
    if (!root) return { ada: false };
    const badge = root.querySelector('.sync-badge');
    const r = (root.getBoundingClientRect());
    const cs = badge ? getComputedStyle(badge) : null;
    const dot = root.querySelector('.sync-dot');
    const cd = dot ? getComputedStyle(dot) : null;
    return {
      ada: true,
      teks: root.textContent.replace(/\s+/g, ' ').trim(),
      kelas: badge ? badge.className : null,
      badgeGaya: cs ? { background: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderTopColor, padding: cs.padding, borderRadius: cs.borderRadius, position: cs.position, font: cs.fontFamily.split(',')[0] + ' ' + cs.fontSize } : null,
      dotGaya: cd ? { w: cd.width, h: cd.height, background: cd.backgroundColor, borderRadius: cd.borderRadius } : null,
      rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), tinggiHalaman: document.documentElement.scrollHeight, tinggiLayar: window.innerHeight },
      terlihatTanpaGulir: r.top < window.innerHeight && r.bottom > 0,
    };
  });
  console.log(`\n  ${nama}`);
  console.log(`    teks di DOM: "${info.teks}" · kelas: ${info.kelas}`);
  console.log(`    gaya .sync-badge : ${JSON.stringify(info.badgeGaya)}`);
  console.log(`    gaya .sync-dot   : ${JSON.stringify(info.dotGaya)}`);
  console.log(`    posisi: top=${info.rect.top} bottom=${info.rect.bottom} · tinggi halaman=${info.rect.tinggiHalaman} · tinggi layar=${info.rect.tinggiLayar}`);
  console.log(`    terlihat tanpa menggulir: ${info.terlihatTanpaGulir ? 'YA' : 'tidak (di bawah lipatan)'}`);
  await c.close();
}
await b.close();
