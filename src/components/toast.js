import { prefersReducedMotion, announce } from '../lib/a11y.js';

// ============================================================
//  TOAST NOTIFICATION COMPONENT
// ============================================================
//
//  Komponen ini sudah dipakai 77 berkas, jadi bentuk pemanggilannya
//  (message, type, duration) DIPERTAHANKAN. Yang diperbaiki adalah
//  perilakunya:
//
//   1. Tombol tutup. Sebelumnya toast tidak bisa ditutup — pengguna harus
//      menunggu, dan pesan galat yang panjang sering hilang sebelum selesai
//      dibaca. Sekarang ada tombol tutup, dan galat TIDAK hilang sendiri.
//   2. Jeda saat kursor/fokus berada di atas toast, supaya pesan tidak
//      lenyap tepat ketika sedang dibaca.
//   3. Diumumkan ke pembaca layar. Sebelumnya toast hanya berupa elemen
//      visual: pengguna pembaca layar tidak pernah tahu "Berhasil disimpan"
//      muncul.
//   4. Menghormati prefers-reduced-motion — durasi diperpanjang karena
//      animasinya dimatikan oleh lapisan CSS.
//   5. Judul berbahasa Indonesia ("Gagal", bukan "Error"), dan teks pesan
//      memakai textContent sehingga isi dari server tidak dapat menjadi
//      markah.
//   6. Aksi opsional ("Coba lagi", "Batalkan") supaya pengguna dapat
//      langsung bertindak, bukan hanya diberi tahu.

let _container = null;

function ensureContainer() {
  if (_container && document.body.contains(_container)) return _container;
  _container = document.createElement('div');
  _container.className = 'toast-container';
  document.body.appendChild(_container);
  return _container;
}

const ICONS = {
  success: 'fa-circle-check',
  error:   'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info',
};

/** Judul dalam Bahasa Indonesia — teks yang dilihat pengguna. */
const TITLES = {
  success: 'Berhasil',
  error:   'Gagal',
  warning: 'Perhatian',
  info:    'Informasi',
};

/**
 * Tampilkan notifikasi singkat yang tidak memblokir.
 *
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='info']
 * @param {number} [duration] ms. `0` = harus ditutup manual.
 *        Bawaannya: galat & peringatan TIDAK hilang sendiri (0), sisanya
 *        3500–5000 ms — pesan yang lebih panjang butuh waktu baca lebih lama.
 * @param {{label: string, onClick: () => void}} [action]
 * @returns {() => void} fungsi untuk menutup lebih awal
 */
export function toast(message, type = 'info', duration, action) {
  const text = String(message ?? '').trim();
  if (!text) return () => {};

  const kind = ICONS[type] ? type : 'info';
  const container = ensureContainer();

  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  // Galat & peringatan diumumkan segera; kabar baik cukup menunggu giliran.
  el.setAttribute('role', kind === 'error' || kind === 'warning' ? 'alert' : 'status');

  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  const i = document.createElement('i');
  i.className = `fas ${ICONS[kind]}`;
  icon.appendChild(i);

  const body = document.createElement('div');
  body.className = 'toast-body';
  const title = document.createElement('div');
  title.className = 'toast-title';
  title.textContent = TITLES[kind];
  const msg = document.createElement('div');
  msg.className = 'toast-msg';
  // textContent, bukan innerHTML: pesan sering memuat teks dari pengguna
  // atau dari galat server.
  msg.textContent = text;
  body.append(title, msg);

  el.append(icon, body);

  if (action && typeof action.onClick === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label ?? 'Lakukan';
    btn.addEventListener('click', () => { action.onClick(); dismiss(); });
    el.appendChild(btn);
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'toast-close';
  close.setAttribute('aria-label', 'Tutup notifikasi');
  close.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';
  el.appendChild(close);

  container.appendChild(el);

  let timer = null;
  let closed = false;

  function dismiss() {
    if (closed) return;
    closed = true;
    if (timer) clearTimeout(timer);
    el.classList.remove('show');
    el.classList.add('hide');
    const wait = prefersReducedMotion() ? 0 : 400;
    setTimeout(() => el.remove(), wait);
  }

  close.addEventListener('click', dismiss);

  // Jeda saat kursor atau fokus berada di atas toast.
  const pause = () => { if (timer) { clearTimeout(timer); timer = null; } };
  el.addEventListener('mouseenter', pause);
  el.addEventListener('focusin', pause);

  // Animasi masuk.
  requestAnimationFrame(() => el.classList.add('show'));

  // Durasi bawaan berbeda per jenis.
  //   - kegagalan: TIDAK hilang sendiri. Pengguna perlu waktu membaca apa
  //     yang salah dan bagaimana memperbaikinya.
  //   - peringatan: 7 detik
  //   - sukses/informasi: menyesuaikan panjang teks, minimal 3,5 detik.
  const base = duration !== undefined
    ? duration
    : kind === 'error' ? 0
    : kind === 'warning' ? 7000
    : Math.min(9000, Math.max(3500, text.length * 55));

  // Kalau pengguna meminta gerakan dikurangi, animasi dimatikan oleh CSS
  // sehingga pesan terasa muncul-hilang mendadak. Beri waktu baca lebih.
  const adjusted = base > 0 && prefersReducedMotion() ? Math.round(base * 1.5) : base;

  if (adjusted > 0) timer = setTimeout(dismiss, adjusted);

  // Pastikan pembaca layar menerima pesannya walau toast tidak difokuskan.
  announce(text, { assertive: kind === 'error' });

  return dismiss;
}

export const showSuccess = (msg, duration, action) => toast(msg, 'success', duration, action);
export const showError   = (msg, duration, action) => toast(msg, 'error', duration, action);
export const showWarning = (msg, duration, action) => toast(msg, 'warning', duration, action);
export const showInfo    = (msg, duration, action) => toast(msg, 'info', duration, action);

/** Hapus semua toast yang sedang tampil (mis. saat berpindah halaman). */
export function clearToasts() {
  if (_container) _container.replaceChildren();
}

/**
 * Pasang pintasan global.
 *
 * Sebagian besar tombol memakai atribut `onclick` inline di dalam template
 * literal, sehingga tidak punya akses ke impor modul. `window.showToast`
 * membuat atribut tersebut dapat diperbaiki tanpa harus mengubah
 * strukturnya menjadi pendengar peristiwa.
 */
export function installToast() {
  window.showToast = toast;
  window.toast = toast;
}
