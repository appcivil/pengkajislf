import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
// Folder keluaran dibuat otomatis agar skrip dapat dijalankan pada checkout baru.
mkdirSync('tangkapan-live', { recursive: true });
const ALAMAT = process.argv[2];
const b = await chromium.launch();
for (const [nama, vp] of [['desktop 1440×900', { width: 1440, height: 900 }], ['ponsel 390×844', { width: 390, height: 844 }]]) {
  const c = await b.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const p = await c.newPage();
  const galat = [];
  p.on('console', (m) => { if (m.type() === 'error') galat.push(m.text()); });
  await p.goto(ALAMAT, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const root = document.getElementById('sync-indicator-root');
    const slot = document.getElementById('login-sync-slot');
    const kartu = document.querySelector('.login-card-quartz');
    const diDalam = Boolean(root && slot && root.parentElement === slot);
    const k = kartu ? kartu.getBoundingClientRect() : null;
    const rk = root ? root.getBoundingClientRect() : null;
    const teksKartu = kartu ? kartu.innerText.replace(/\n+/g, ' | ') : '';
    const headerAda = Boolean(document.querySelector('.app-header'));
    const klip = [...document.querySelectorAll('*')].filter((el) => {
      const x = el.getBoundingClientRect();
      return x.width > 0 && (x.right > window.innerWidth + 1 || x.left < -1);
    }).map((el) => el.tagName + '.' + (el.className || '').toString().slice(0, 30));
    return {
      diDalamKartu: diDalam, kelas: root ? root.className : null,
      posisi: root ? getComputedStyle(root).position : null,
      dalamKartuSecaraVisual: Boolean(k && rk && rk.top >= k.top && rk.bottom <= k.bottom && rk.left >= k.left && rk.right <= k.right),
      teksStatus: root ? root.textContent.trim() : null,
      teksKartu, headerAda,
      tinggiHalaman: document.documentElement.scrollHeight, tinggiLayar: window.innerHeight,
      keluarLayar: klip.slice(0, 5), jumlahKeluarLayar: klip.length,
    };
  });
  console.log(`\n  ${nama}`);
  console.log(`    pil DI DALAM slot kartu: ${r.diDalamKartu ? 'YA' : 'tidak'} · kelas="${r.kelas}" · position=${r.posisi}`);
  console.log(`    pil berada di dalam batas kartu (visual): ${r.dalamKartuSecaraVisual ? 'YA' : 'tidak'}`);
  console.log(`    teks: "${r.teksStatus}" · .app-header ada di DOM: ${r.headerAda}`);
  console.log(`    tinggi halaman ${r.tinggiHalaman} vs layar ${r.tinggiLayar} → gulir kosong ${r.tinggiHalaman - r.tinggiLayar}px`);
  console.log(`    elemen keluar layar: ${r.jumlahKeluarLayar}${r.jumlahKeluarLayar ? ' → ' + r.keluarLayar.join(', ') : ''}`);
  console.log(`    teks kartu: ${r.teksKartu.slice(0, 420)}`);
  console.log(`    galat konsol: ${galat.length ? galat.slice(0, 3).join(' · ') : 'tidak ada'}`);
  await p.screenshot({ path: `tangkapan-live/${nama.startsWith('desktop') ? 'desktop' : 'ponsel'}-label-final.png`, fullPage: true });
  await c.close();
}
await b.close();
