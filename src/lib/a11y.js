// ============================================================
//  A11Y — LAPISAN AKSESIBILITAS BERSAMA
// ============================================================
//
//  KENAPA BERKAS INI ADA
//  ---------------------
//  Audit UI/UX menemukan pola berikut berulang di puluhan berkas:
//
//    - 0 wilayah pengumuman (aria-live), sehingga pengguna pembaca layar
//      tidak pernah tahu kapan pekerjaan asinkron selesai;
//    - elemen <div onclick> yang tidak dapat dicapai maupun diaktifkan
//      dengan keyboard;
//    - dialog tanpa role="dialog", tanpa jebakan fokus, dan tanpa Escape;
//    - tidak ada yang menghormati setelan sistem "kurangi gerakan".
//
//  Memperbaiki satu per satu di tiap berkas tidak menyelesaikan akarnya:
//  kode baru akan mengulangi kesalahan yang sama. Karena itu sebagian
//  perbaikan ditaruh di sini sebagai perilaku sistem — dan sebagian lagi
//  memang harus dikerjakan per berkas (nama aksesibel, teks alternatif),
//  karena hanya penulisnya yang tahu maksudnya.
//
//  Semua pemasang bersifat idempoten dan mengembalikan fungsi pembersih.

let _liveRegion = null;
let _observer = null;
const _dialogStack = [];

// ─────────────────────────────────────────────────────────────
//  1. Wilayah pengumuman (screen reader)
// ─────────────────────────────────────────────────────────────

/**
 * Buat (sekali) dua wilayah pengumuman: satu sopan, satu mendesak.
 * Ditempatkan di luar alur visual tetapi tetap dibaca pembaca layar.
 */
function ensureLiveRegion() {
  if (_liveRegion && document.body.contains(_liveRegion)) return _liveRegion;

  const wrap = document.createElement('div');
  wrap.className = 'sr-only';
  wrap.setAttribute('data-a11y-live', 'root');

  // role="status" untuk kabar biasa (tidak memotong ucapan berjalan),
  // role="alert" untuk hal mendesak seperti kegagalan.
  for (const role of ['status', 'alert']) {
    const el = document.createElement('div');
    el.setAttribute('role', role);
    el.setAttribute('aria-live', role === 'alert' ? 'assertive' : 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.id = `a11y-live-${role}`;
    wrap.appendChild(el);
  }

  document.body.appendChild(wrap);
  _liveRegion = wrap;
  return wrap;
}

/**
 * Umumkan pesan kepada pembaca layar.
 *
 * Teks dikosongkan lebih dulu lalu diisi ulang, karena sebagian pembaca
 * layar mengabaikan perubahan bila isinya kebetulan sama dengan sebelumnya.
 *
 * @param {string} message
 * @param {{assertive?: boolean}} [opts] assertive untuk kegagalan/peringatan
 */
export function announce(message, opts = {}) {
  const text = String(message ?? '').trim();
  if (!text) return;
  const root = ensureLiveRegion();
  const el = root.querySelector(opts.assertive ? '[role="alert"]' : '[role="status"]');
  if (!el) return;

  el.textContent = '';
  // Satu putaran event loop agar perubahan benar-benar terdeteksi.
  setTimeout(() => { el.textContent = text; }, 60);
}

// ─────────────────────────────────────────────────────────────
//  2. Operabilitas keyboard untuk elemen yang hanya punya onclick
// ─────────────────────────────────────────────────────────────

const NATIVELY_FOCUSABLE = new Set([
  'A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY', 'DETAILS', 'IFRAME', 'AUDIO', 'VIDEO',
]);

/**
 * Beri role/tabindex/penanganan keyboard pada setiap elemen yang punya
 * atribut `onclick` tetapi bukan kontrol asli.
 *
 * Dipasang sebagai MutationObserver supaya markah yang dirakit belakangan
 * (seluruh aplikasi ini membangun DOM dari template literal) juga ikut
 * tertangani — bukan hanya yang ada saat halaman pertama dimuat.
 *
 * Enter dan Space sengaja diperlakukan sama: itu yang diharapkan pengguna
 * dari apa pun yang tampak seperti tombol.
 *
 * @returns {() => void} fungsi untuk menghentikan pengamatan
 */
export function installKeyboardEnhancer(root = document.body) {
  const enhance = () => {
    let nodes;
    try {
      nodes = root.querySelectorAll('[onclick]:not([data-a11y-kb])');
    } catch {
      return;
    }

    for (const el of nodes) {
      el.setAttribute('data-a11y-kb', '1');
      // Elemen interaktif bawaan sudah bisa difokus dan diaktifkan.
      if (NATIVELY_FOCUSABLE.has(el.tagName)) continue;
      // Kalau sudah punya role+tabindex sendiri, hormati penulisnya.
      if (el.hasAttribute('role') && el.hasAttribute('tabindex')) continue;

      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');

      el.addEventListener('keydown', (ev) => {
        // Hanya tangani bila fokus memang ada di elemen ini, bukan di anaknya
        // (mencegah aksi terpanggil dua kali untuk kontrol bersarang).
        if (ev.target !== el) return;
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
          ev.preventDefault();
          el.click();
        }
      });
    }
  };

  enhance();
  if (_observer) _observer.disconnect();
  _observer = new MutationObserver(enhance);
  _observer.observe(root, { childList: true, subtree: true });

  return () => { if (_observer) _observer.disconnect(); };
}

// ─────────────────────────────────────────────────────────────
//  3. Dialog: peran, jebakan fokus, Escape, pemulihan fokus
// ─────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Apakah elemen benar-benar terlihat pengguna.
 *
 * JANGAN memakai `offsetParent` sebagai penentu. jsdom tidak menghitung tata
 * letak sehingga nilainya selalu null — pengujian otomatis akan menganggap
 * seluruh kontrol tidak terlihat, dan jebakan fokus diam-diam tidak bekerja.
 * `checkVisibility()` dipakai bila peramban mendukungnya (Chrome 105+,
 * Safari 17.4+); selain itu jatuh ke pemeriksaan atribut dan gaya terhitung,
 * yang benar di peramban mana pun.
 */
function isVisible(el) {
  if (el.hasAttribute('hidden')) return false;
  if (el.closest('[hidden]')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  if (el.closest('[aria-hidden="true"]')) return false;

  let style;
  try { style = getComputedStyle(el); } catch { return true; }
  if (style) {
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.opacity !== undefined && style.opacity === '0') return false;
  }

  if (typeof el.checkVisibility === 'function') {
    try {
      return el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: false });
    } catch {
      /* jatuh ke kesimpulan di bawah */
    }
  }
  return true;
}

/** Elemen yang dapat difokus di dalam suatu wadah. */
function focusableWithin(container) {
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)]
    .filter((el) => isVisible(el) && !el.hasAttribute('disabled'));
}

/**
 * Tandai sebuah elemen sebagai dialog dan pasang perilaku yang diharapkan
 * pengguna pembaca layar maupun keyboard:
 *
 *   - role="dialog" + aria-modal="true" + nama dari judulnya;
 *   - fokus dipindahkan ke dalam dialog;
 *   - Tab berputar di dalam dialog (tidak bocor ke halaman belakang);
 *   - Escape menutup dialog;
 *   - fokus dikembalikan ke elemen pemicu saat dialog ditutup.
 *
 * @param {HTMLElement} el        wadah dialog
 * @param {object}      [opts]
 * @param {() => void}  [opts.onClose]   dipanggil saat Escape ditekan
 * @param {string}      [opts.labelledBy] id elemen judul
 * @param {boolean}     [opts.initialFocus] fokuskan elemen pertama otomatis
 * @returns {() => void} fungsi untuk melepas seluruh perilaku
 */
export function makeDialog(el, opts = {}) {
  if (!el) return () => {};
  const { onClose, labelledBy, initialFocus = true } = opts;

  const previouslyFocused = document.activeElement;
  const hadRole = el.hasAttribute('role');
  const hadModal = el.hasAttribute('aria-modal');

  if (!el.hasAttribute('role')) el.setAttribute('role', 'dialog');
  if (!el.hasAttribute('aria-modal')) el.setAttribute('aria-modal', 'true');
  if (labelledBy && !el.hasAttribute('aria-labelledby')) el.setAttribute('aria-labelledby', labelledBy);
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');

  if (initialFocus) {
    const first = focusableWithin(el)[0] || el;
    // Dijalankan setelah elemen benar-benar terpasang di dokumen.
    requestAnimationFrame(() => { try { first.focus(); } catch { /* diabaikan */ } });
  }

  const onKeydown = (ev) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      if (typeof onClose === 'function') onClose();
      return;
    }
    if (ev.key !== 'Tab') return;

    const items = focusableWithin(el);
    if (!items.length) { ev.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (!el.contains(document.activeElement)) { ev.preventDefault(); first.focus(); return; }
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  };

  el.addEventListener('keydown', onKeydown);

  const entry = { el, onKeydown };
  _dialogStack.push(entry);

  return () => {
    el.removeEventListener('keydown', onKeydown);
    const i = _dialogStack.indexOf(entry);
    if (i >= 0) _dialogStack.splice(i, 1);

    // Hanya rapikan atribut milik kita sendiri.
    if (!hadRole) el.removeAttribute('role');
    if (!hadModal) el.removeAttribute('aria-modal');

    // Kembalikan fokus ke tempat pengguna tadi berada — tanpa ini, pengguna
    // keyboard terlempar ke awal dokumen setiap kali menutup dialog.
    if (previouslyFocused && document.contains(previouslyFocused)) {
      try { previouslyFocused.focus(); } catch { /* diabaikan */ }
    }
  };
}

/**
 * Pemasang Escape global sebagai jaring pengaman.
 *
 * Banyak dialog di aplikasi ini dirakit ad-hoc dan langsung ditambahkan ke
 * <body>, sehingga tidak lewat makeDialog(). Pemanggil ini mencari dialog
 * terakhir yang masih terlihat lalu menutupnya melalui tombol tutupnya —
 * sehingga tetap terkendali tanpa perlu menyentuh puluhan berkas.
 *
 * @returns {() => void}
 */
export function installDialogEscapeHandler() {
  const onKeydown = (ev) => {
    if (ev.key !== 'Escape') return;
    if (_dialogStack.length) return; // sudah ditangani makeDialog()

    // `.modal` ikut disertakan: sebagian kode membuat wadah `.modal` tanpa
    // `.modal-overlay` di luarnya.
    const overlays = [...document.querySelectorAll(
      '.modal-overlay, [class*="modal-overlay"], [role="dialog"], .modal'
    )].filter((el) => isVisible(el) && !el.closest('[data-no-escape]'));
    if (!overlays.length) return;
    if (!overlays.length) return;

    const top = overlays[overlays.length - 1];

    // Urutan pencarian dari penanda paling eksplisit ke paling longgar.
    // Semuanya hanya cocok dengan TOMBOL, supaya jaring pengaman ini tidak
    // pernah menekan sesuatu yang bukan kontrol penutup.
    const closeSelectors = [
      '[data-close]',
      '[data-dismiss]',
      '.modal-close',
      'button[aria-label*="Tutup" i]',
      'button[aria-label*="Batal" i]',
      'button[aria-label*="Close" i]',
      'button[aria-label*="Cancel" i]',
      'button[class*="close" i]',
      // Tombol yang jelas menutup lewat handler-nya, mis. onclick="closeModal()"
      // atau onclick="window._closeSignature()".
      'button[onclick*="close" i]',
      'button[onclick*="tutup" i]',
      'button[onclick*="cancel" i]',
      'button[onclick*="batal" i]',
    ];
    let closeBtn = null;
    for (const sel of closeSelectors) {
      const found = top.querySelector(sel);
      if (found) { closeBtn = found; break; }
    }
    // Sebagian dialog menaruh tombolnya di dalam wadah kartu, bukan langsung
    // di overlay — periksa juga tingkat dokumen sebagai upaya terakhir.
    if (!closeBtn) {
      for (const sel of closeSelectors) {
        const found = document.querySelector(`${sel}`);
        if (found && top.contains(found)) { closeBtn = found; break; }
      }
    }
    if (closeBtn) {
      ev.preventDefault();
      closeBtn.click();
      return;
    }

    // Tidak ada tombol tutup? Jangan tebak-tebakan: umpan balik supaya
    // pengguna tidak merasa Escape-nya rusak.
    announce('Dialog ini belum punya tombol tutup yang dikenali. Gunakan tombol Batal.',
      { assertive: true });
  };

  document.addEventListener('keydown', onKeydown);
  return () => document.removeEventListener('keydown', onKeydown);
}

// ─────────────────────────────────────────────────────────────
//  4. Utilitas
// ─────────────────────────────────────────────────────────────

/** Apakah pengguna meminta gerakan diminimalkan. */
export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Tandai tombol sebagai sedang bekerja.
 *
 * Mencegah pengiriman ganda (dua permintaan AI, dua baris tersimpan) dan
 * memberi tahu pembaca layar bahwa ada proses berjalan.
 *
 * @param {HTMLElement} btn
 * @param {boolean} busy
 * @param {string} [busyLabel]
 * @returns {() => void} kembalikan ke keadaan semula
 */
export function setBusy(btn, busy = true, busyLabel) {
  if (!btn) return () => {};

  const restore = () => {
    // Keadaan asal disimpan di atribut data saat masuk keadaan sibuk.
    // Kalau diambil dari `btn.disabled` pada saat pemulihan, nilainya sudah
    // true — akibatnya tombol TIDAK PERNAH aktif kembali dan formulir
    // terkunci permanen hanya karena satu permintaan gagal.
    if (btn.dataset.prevDisabled !== undefined) {
      btn.disabled = btn.dataset.prevDisabled === '1';
      delete btn.dataset.prevDisabled;
    } else {
      btn.disabled = false;
    }
    btn.removeAttribute('aria-busy');
    if (btn.dataset.prevText !== undefined) {
      btn.textContent = btn.dataset.prevText;
      delete btn.dataset.prevText;
    }
    if (btn.dataset.prevAria !== undefined) {
      if (btn.dataset.prevAria === '') btn.removeAttribute('aria-label');
      else btn.setAttribute('aria-label', btn.dataset.prevAria);
      delete btn.dataset.prevAria;
    }
  };

  if (busy) {
    // Hanya rekam sekali, supaya pemanggilan berulang tidak menimpa
    // keadaan asal dengan keadaan sibuk.
    if (btn.dataset.prevDisabled === undefined) {
      btn.dataset.prevDisabled = btn.disabled ? '1' : '0';
      btn.dataset.prevText = btn.textContent;
      btn.dataset.prevAria = btn.getAttribute('aria-label') ?? '';
    }
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    if (busyLabel) btn.textContent = busyLabel;
    announce(busyLabel || 'Sedang memproses…');
  } else {
    restore();
  }

  return restore;
}

/**
 * Pemasang dasar. Dipanggil sekali dari main.js.
 * @returns {() => void} pembesih
 */
export function installA11y() {
  ensureLiveRegion();
  const stopKeyboard = installKeyboardEnhancer();
  const stopEscape = installDialogEscapeHandler();
  return () => { stopKeyboard(); stopEscape(); };
}

export const _internals = {
  ensureLiveRegion,
  focusableWithin,
  isVisible,
  dialogDepth: () => _dialogStack.length,
  /**
   * Kosongkan catatan dialog.
   *
   * HANYA untuk pengujian: tumpukan dialog bersifat tingkat-modul, sehingga
   * dialog yang tidak dilepas pada satu tes akan membuat tes berikutnya
   * melihat keadaan yang tidak seharusnya (jaring pengaman Escape berhenti
   * bekerja karena mengira masih ada dialog aktif).
   */
  resetDialogs: () => { _dialogStack.length = 0; },
};
