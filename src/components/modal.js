// ============================================================
//  MODAL COMPONENT
// ============================================================

let _activeModal = null;

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
    <div class="modal" style="max-width:${sizeMap[size] || sizeMap.md}">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" id="modal-close-btn">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  _activeModal = overlay;

  // Animate open
  requestAnimationFrame(() => overlay.classList.add('open'));

  // Close handlers
  overlay.querySelector('#modal-close-btn').addEventListener('click', () => {
    closeModal();
    onClose?.();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
      onClose?.();
    }
  });

  // ESC key
  const esc = (e) => { if (e.key === 'Escape') { closeModal(); onClose?.(); } };
  document.addEventListener('keydown', esc, { once: true });

  return overlay;
}

export function closeModal() {
  if (!_activeModal) return;
  _activeModal.classList.remove('open');
  _activeModal.addEventListener('transitionend', () => _activeModal?.remove(), { once: true });
  _activeModal = null;
}

/**
 * Confirm dialog
 * @returns {Promise<boolean>}
 */
export function confirm({ title = 'Konfirmasi', message = 'Apakah Anda yakin?', confirmText = 'Ya', danger = false } = {}) {
  return new Promise((resolve) => {
    openModal({
      title,
      body: `<p style="color:var(--text-secondary)">${message}</p>`,
      footer: `
        <button class="btn btn-secondary" id="confirm-cancel">Batal</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmText}</button>
      `,
      onClose: () => resolve(false),
    });
    document.getElementById('confirm-cancel')?.addEventListener('click', () => { closeModal(); resolve(false); });
    document.getElementById('confirm-ok')?.addEventListener('click', () => { closeModal(); resolve(true); });
  });
}
