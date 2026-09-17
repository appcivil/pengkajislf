import { chromium } from 'playwright';
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await c.newPage();
await p.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2000);
if (await p.locator('#btn-dev-bypass').count()) { await p.click('#btn-dev-bypass'); await p.waitForTimeout(1500); }
await p.evaluate(() => { window.location.hash = '#/dashboard'; });
await p.waitForTimeout(3500);
const r = await p.evaluate(() => {
  const out = [];
  const sb = document.querySelector('#app-sidebar');
  const judul = (el) => {
    const c = (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join(' ');
    const t = el.innerText ? el.innerText.replace(/\s+/g, ' ').trim().slice(0, 28) : '';
    return `${el.tagName.toLowerCase()}${c ? '.' + c : ''}${t ? ` "${t}"` : ''}`;
  };
  const jalan = (el, tingkat) => {
    for (const anak of el.children) {
      const b = anak.getBoundingClientRect();
      if (b.height > 0) out.push({ tingkat, nama: judul(anak), top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) });
      if (tingkat < 2 && anak.children.length) jalan(anak, tingkat + 1);
    }
  };
  jalan(sb, 0);
  return { sidebar: { h: Math.round(sb.getBoundingClientRect().height) }, out, layar: window.innerHeight };
});
console.log(`  sidebar tinggi ${r.sidebar.h} · layar ${r.layar}`);
for (const o of r.out) {
  const potong = o.bottom > r.layar + 1 ? '  ⚠ TERPOTONG' : '';
  const nempel = r.layar - o.bottom <= 2 ? '  ← nempel dasar layar' : '';
  console.log(`  ${'  '.repeat(o.tingkat)}${o.nama.padEnd(46)} ${String(o.top).padStart(4)}–${String(o.bottom).padStart(4)}${potong}${nempel}`);
}
await b.close();
