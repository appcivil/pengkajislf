import { escapeHtml } from '../lib/safe-markdown.js';
import { makeDialog } from '../lib/a11y.js';
// ============================================================
//  MODAL COMPONENT
// ============================================================
//
//  Perbaikan dari audit UI/UX:
//   1. role="dialog" + aria-modal + aria-labelledby — sebelumnya dialog
//      tidak diumumkan sama sekali; pembaca layar tetap membaca halaman
//      di belakangnya seolah dialog itu tidak ada.
//   2. Jebakan fokus — Tab kini berputar di dalam dialog, bukan menembus
//      ke sidebar dan header di belakangnya.
//   3. Fokus dikembalikan ke tombol pemicu saat dialog ditutup.
//   4. Pendengar Escape tidak lagi tertinggal. Sebelumnya pendengar
//      `{ once: true }` hanya dibuang bila pengguna menekan Escape; bila
//      dialog ditutup lewat tombol X, pendengar itu tetap menunggu dan
//      memanggil onClose sekali lagi pada dialog berikutnya.
//   5. Sisa halaman ditandai inert selama dialog terbuka.

let _activeModal = null;
let _disposeDialog = null;

/**
 * Open a modal
 * @param {{title, body, footer, size, onClose}} options
 */
export function openModal({ title = '', body = '', footer = '', size = 'md', onClose } = {}) {
  closeModal(); // close any existing

  const sizeMap = { sm: '400px', md: '520px', lg: '720px', xl: '900px' };

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"
         style="max-width:${sizeMap[size] || sizeMap.md}">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-title">${escapeHtml(title)}</h3>
        <button type="button" aria-label="Tutup" class="modal-close" id="modal-close-btn">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">${escapeHtml(body)}</div>
      ${footer ? `<div class="modal-footer">${escapeHtml(footer)}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  _activeModal = overlay;

  // Animate open
  requestAnimationFrame(() => overlay.classList.add('open'));

  const requestClose = () => { closeModal(); onClose?.(); };

  // Close handlers
  overlay.querySelector('#modal-close-btn').addEventListener('click', requestClose);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) requestClose();
  });

  // Peran dialog, jebakan fokus, Escape, dan pemulihan fokus ditangani
  // terpusat di lib/a11y.js supaya perilakunya sama untuk semua dialog.
  _disposeDialog = makeDialog(overlay.querySelector('.modal'), {
    onClose: requestClose,
    labelledBy: 'modal-title',
  });

  // Sisa halaman tidak lagi dapat difokus atau dibaca selama dialog terbuka.
  const app = document.getElementById('app');
  if (app && !app.hasAttribute('inert')) {
    app.setAttribute('inert', '');
    overlay.dataset.appInert = '1';
  }
  document.body.dataset.dialogOpen = 'true';

  return overlay;
}

export function closeModal() {
  if (!_activeModal) return;
  const overlay = _activeModal;
  _activeModal = null;

  if (typeof _disposeDialog === 'function') {
    _disposeDialog();       // melepas jebakan fokus + mengembalikan fokus
    _disposeDialog = null;
  }

  if (overlay.dataset.appInert === '1') {
    document.getElementById('app')?.removeAttribute('inert');
  }
  delete document.body.dataset.dialogOpen;

  overlay.classList.remove('open');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  // Jaring pengaman: bila transisi tidak pernah selesai (mis. tab tidak
  // aktif sehingga transitionend tidak terpicu), tetap bersihkan.
  setTimeout(() => overlay.remove(), 600);
}

/**
 * Confirm dialog
 * @returns {Promise<boolean>}
 */
/**
 * Dialog masukan teks — pengganti prompt() bawaan peramban.
 *
 * prompt() bawaan memiliki masalah yang sama dengan confirm(): memblokir
 * halaman, tidak dapat diberi gaya, dan beberapa peramban (serta PWA mode
 * berdiri sendiri) bahkan menonaktifkannya sehingga nilainya selalu null.
 *
 * @returns {Promise<string|null>} null bila dibatalkan
 */
export function askInput({
  title = 'Masukkan Data',
  message = '',
  label = '',
  defaultValue = '',
  placeholder = '',
  type = 'text',
  confirmText = 'Simpan',
} = {}) {
  return new Promise((resolve) => {
    const id = 'ask-input-field';
    openModal({
      title,
      body: `
        ${message ? `<p style="color:var(--text-secondary); margin-bottom:12px">${escapeHtml(message)}</p>` : ''}
        ${label ? `<label class="form-label" for="${escapeHtml(id)}">${escapeHtml(label)}</label>` : ''}
        <input id="${escapeHtml(id)}" class="form-input" type="${escapeHtml(type)}"
               value="${escapeHtml(String(defaultValue))}"
               placeholder="${escapeHtml(placeholder)}" />
      `,
      footer: `
        <button class="btn btn-secondary" id="ask-cancel">Batal</button>
        <button class="btn btn-primary" id="ask-ok">${escapeHtml(confirmText)}</button>
      `,
      onClose: () => resolve(null),
    });

    const field = document.getElementById(id);
    // Fokuskan kolomnya setelah dialog tampil supaya pengguna keyboard dapat
    // langsung mengetik — perilaku yang diharapkan dari prompt().
    setTimeout(() => field?.focus(), 0);

    const selesai = (nilai) => { closeModal(); resolve(nilai); };
    document.getElementById('ask-cancel')?.addEventListener('click', () => selesai(null));
    document.getElementById('ask-ok')?.addEventListener('click', () => selesai(field?.value ?? ''));
    field?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); selesai(field.value); }
    });
  });
}

export function confirm({ title = 'Konfirmasi', message = 'Apakah Anda yakin?', confirmText = 'Ya', danger = false } = {}) {
  return new Promise((resolve) => {
    openModal({
      title,
      body: `<p style="color:var(--text-secondary)">${escapeHtml(message)}</p>`,
      footer: `
        <button class="btn btn-secondary" id="confirm-cancel">Batal</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${escapeHtml(confirmText)}</button>
      `,
      onClose: () => resolve(false),
    });
    document.getElementById('confirm-cancel')?.addEventListener('click', () => { closeModal(); resolve(false); });
    document.getElementById('confirm-ok')?.addEventListener('click', () => { closeModal(); resolve(true); });
  });
}
