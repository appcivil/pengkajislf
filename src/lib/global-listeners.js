/**
 * global-listeners.js — pemasangan listener pada `window`/`document` yang
 * otomatis dilepas saat rute berubah.
 *
 * MASALAH YANG DIPECAHKAN
 * -----------------------
 * Listener yang dipasang pada `window` atau `document` TIDAK ikut hilang
 * ketika halaman diganti — berbeda dengan listener yang menempel pada
 * elemen di dalam halaman, yang ikut terbuang bersama DOM-nya.
 *
 * Akibatnya, modul seperti `verify.js` atau `canva-studio.js` yang
 * memasang listener di dalam fungsi yang dipanggil pada setiap kunjungan
 * halaman akan menumpuk:
 *
 *   kunjungan ke-5 → satu event memicu handler 5x,
 *   memori tumbuh terus, dan handler lama masih memegang referensi DOM
 *   halaman yang sudah dibuang (kebocoran memori sungguhan).
 *
 * CARA PAKAI
 * ----------
 *   import { bindGlobal } from '../lib/global-listeners.js';
 *
 *   function initSomething() {
 *     bindGlobal(document, 'keydown', onKey);
 *     bindGlobal(window, 'resize', onResize);
 *   }
 *
 * Cukup itu. Pembersihan terjadi otomatis:
 *   - `bindGlobal` idempoten per (target, jenis, handler) — mendaftarkan
 *     handler yang sama dua kali tidak menghasilkan dua panggilan;
 *   - seluruh listener dilepas begitu rute berubah (`route-changed`),
 *     sehingga kunjungan berikutnya memasang versi yang masih segar.
 *
 * Catatan: modul ini SENGAJA hanya menyentuh listener milik halaman.
 * Listener tingkat aplikasi (mis. status online/offline di `store.js`)
 * memang harus hidup selama aplikasi berjalan — jangan dipindahkan ke sini.
 */

const registry = [];

/** Sudah dipasangkan pembersih otomatis pada event `route-changed`? */
let hooked = false;
let lastPath = null;

function hookOnce() {
  if (hooked) return;
  hooked = true;
  window.addEventListener('route-changed', (e) => {
    const next = e?.detail?.path || '';
    // Rute yang sama tidak perlu melepas apa pun (mis. render ulang tab).
    if (lastPath !== null && next !== lastPath) releaseGlobalListeners();
    lastPath = next;
  });
}

/**
 * Pasang listener pada `window`/`document` yang akan dilepas saat rute berubah.
 *
 * @param {EventTarget} target biasanya `window` atau `document`
 * @param {string} type jenis event
 * @param {Function} handler
 * @param {AddEventListenerOptions} [options]
 * @returns {Function} fungsi pelepas khusus listener ini
 */
export function bindGlobal(target, type, handler, options) {
  hookOnce();

  // Idempoten: hindari pemasangan ganda untuk kombinasi yang sama.
  const exists = registry.some(
    (r) => r.target === target && r.type === type && r.handler === handler
  );
  if (exists) return () => unbindGlobal(target, type, handler);

  target.addEventListener(type, handler, options);
  registry.push({ target, type, handler, options });
  return () => unbindGlobal(target, type, handler);
}

/** Lepas satu listener tertentu. */
export function unbindGlobal(target, type, handler) {
  for (let i = registry.length - 1; i >= 0; i--) {
    const r = registry[i];
    if (r.target === target && r.type === type && r.handler === handler) {
      target.removeEventListener(r.type, r.handler, r.options);
      registry.splice(i, 1);
    }
  }
}

/** Lepas SELURUH listener yang terdaftar. Dipanggil otomatis saat rute berubah. */
export function releaseGlobalListeners() {
  while (registry.length) {
    const { target, type, handler, options } = registry.pop();
    target.removeEventListener(type, handler, options);
  }
}

/** Jumlah listener yang sedang aktif — dipakai pengujian dan diagnostik. */
export function globalListenerCount() {
  return registry.length;
}
