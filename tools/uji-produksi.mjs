import { chromium } from 'playwright';
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await c.newPage();
const galat = [];
p.on('console', (m) => { if (m.type() === 'error' && !/ERR_NAME_NOT_RESOLVED|WebSocket/.test(m.text())) galat.push(m.text().slice(0, 110)); });
p.on('pageerror', (e) => galat.push('PAGEERROR ' + e.message.slice(0, 110)));
await p.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
// produksi: tombol bypass tidak ada (devBypass hanya di DEV) → suntik sesi lokal
await p.evaluate(() => {
  localStorage.setItem('slf_dev_user', JSON.stringify({ id: 'uji', email: 'uji@lokal', user_metadata: { full_name: 'Uji Produksi' }, is_bypass: true }));
});
await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);
await p.evaluate(() => { window.location.hash = '#/dashboard'; });
await p.waitForTimeout(3000);
const r = await p.evaluate(() => ({
  adaNavigate: typeof window.navigate === 'function',
  hash: location.hash,
  judulHeader: document.querySelector('.header-breadcrumb span')?.innerText,
  labelNav: [...document.querySelectorAll('.bnav-item span')].map((s) => s.innerText.trim()).slice(0, 8),
  galatToast: document.querySelectorAll('.toast').length,
  teksToast: [...document.querySelectorAll('.toast')].map((t) => t.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)),
}));
console.log(`  window.navigate tersedia di bundel produksi: ${r.adaNavigate ? 'YA ✅' : 'TIDAK ❌'}`);
console.log(`  judul header: "${r.judulHeader}"`);
console.log(`  label menu bawah: ${JSON.stringify(r.labelNav)}`);
console.log(`  notifikasi: ${r.galatToast}${r.galatToast ? ' → ' + r.teksToast.join(' | ') : ' ✅'}`);
// uji navigasi nyata lewat tombol window.navigate (rute lain)
await p.evaluate(() => window.navigate('proyek'));
await p.waitForTimeout(2500);
const r2 = await p.evaluate(() => ({ hash: location.hash, judul: document.querySelector('.page-title')?.innerText?.trim().slice(0, 40), hdr: document.querySelector('.header-breadcrumb span')?.innerText }));
console.log(`  setelah window.navigate('proyek'): hash=${r2.hash} · judul halaman="${r2.judul}" · header="${r2.hdr}" ${r2.hash === '#/proyek' ? '✅' : '❌'}`);
console.log(`  galat konsol (selain jaringan uji): ${galat.length ? galat.slice(0, 3).join(' || ') : 'tidak ada ✅'}`);
await b.close();
