// ============================================================
//  TOAST NOTIFICATION COMPONENT
// ============================================================
let _container = null;

function ensureContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'toast-container';
    document.body.appendChild(_container);
  }
  return _container;
}

const ICONS = {
  success: 'fa-circle-check',
  error:   'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info',
};

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration ms
 */
export function toast(message, type = 'info', duration = 3500) {
  const container = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-icon"><i class="fas ${ICONS[type] || ICONS.info}"></i></div>
    <div>
      <div class="toast-title">${capitalize(type)}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button onclick="this.closest('.toast').remove()"
            style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:0.8rem;align-self:flex-start;">
      <i class="fas fa-xmark"></i>
    </button>
  `;
  container.appendChild(el);

  // Animate in
  requestAnimationFrame(() => el.classList.add('show'));

  // Auto remove
  setTimeout(() => {
    el.classList.add('hide');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, duration);
}

export const showSuccess = (msg) => toast(msg, 'success');
export const showError   = (msg) => toast(msg, 'error');
export const showWarning = (msg) => toast(msg, 'warning');
export const showInfo    = (msg) => toast(msg, 'info');

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
