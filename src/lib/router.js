// ============================================================
//  SPA ROUTER
//  Hash-based router untuk GitHub Pages compatibility
// ============================================================
import { isAuthenticated } from '../lib/auth.js';

const _routes = new Map();
let _currentRoute = null;
let _beforeEach = null;

// Route guard types
const PUBLIC_ROUTES = new Set(['login', 'verify']);

// Register a route
export function route(path, handler) {
  _routes.set(path, handler);
}

// Set global before-each guard
export function beforeEach(fn) {
  _beforeEach = fn;
}

// Navigate to a path
export function navigate(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const hash  = query ? `#/${path}?${query}` : `#/${path}`;
  window.location.hash = hash;
}

// Get current params from hash
export function getParams() {
  const hash  = window.location.hash.slice(1); // remove '#'
  const [base, qs] = hash.split('?');
  const params = {};
  if (qs) {
    new URLSearchParams(qs).forEach((v, k) => { params[k] = v; });
  }
  return params;
}

// Get current route name
export function getCurrentRoute() {
  return _currentRoute;
}

// Parse hash route name
function parseHash() {
  const hash = window.location.hash.slice(2) || ''; // remove '#/'
  return hash.split('?')[0] || 'dashboard';
}

// Start the router
export function startRouter(mountEl) {
  async function resolve() {
    const path = parseHash();
    _currentRoute = path;

    // Auth guard
    if (!PUBLIC_ROUTES.has(path) && !isAuthenticated()) {
      navigate('login');
      return;
    }
    if (path === 'login' && isAuthenticated()) {
      navigate('dashboard');
      return;
    }

    // Run before-each guard
    if (_beforeEach) {
      const cont = await _beforeEach(path);
      if (cont === false) return;
    }

    // Find handler
    const handler = _routes.get(path) || _routes.get('404');
    if (!handler) {
      mountEl.innerHTML = renderNotFound();
      return;
    }

    // Render
    try {
      const content = await handler(getParams());
      if (typeof content === 'string') {
        mountEl.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        mountEl.innerHTML = '';
        mountEl.appendChild(content);
      }
      // Scroll to top on route change
      window.scrollTo(0, 0);
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('route-changed', { detail: { path } }));
    } catch (err) {
      console.error(`[Router] Error rendering route "${path}":`, err);
      mountEl.innerHTML = renderError(err);
    }
  }

  // GitHub Pages SPA Redirect Support
  // Logic: Check if we were redirected from 404.html via '?/' pattern
  const search = window.location.search;
  if (search.startsWith('?/')) {
    const redirectPath = search.slice(2).replace(/~and~/g, '&');
    window.history.replaceState(null, null, window.location.pathname.slice(0, -1) + window.location.hash);
    window.location.hash = '#/' + redirectPath;
  }

  window.addEventListener('hashchange', resolve);
  resolve(); // initial resolve

  return () => window.removeEventListener('hashchange', resolve);
}

function renderNotFound() {
  return `
    <div class="empty-state" style="min-height:100vh">
      <div class="empty-icon"><i class="fas fa-map-signs"></i></div>
      <h2 class="empty-title">Halaman Tidak Ditemukan</h2>
      <p class="empty-desc">Route yang Anda tuju tidak tersedia.</p>
      <button class="btn btn-primary mt-4" onclick="navigate('dashboard')">
        <i class="fas fa-home"></i> Kembali ke Dashboard
      </button>
    </div>
  `;
}

function renderError(err) {
  return `
    <div class="empty-state" style="min-height:100vh">
      <div class="empty-icon" style="color:var(--danger-400)"><i class="fas fa-triangle-exclamation"></i></div>
      <h2 class="empty-title">Terjadi Kesalahan</h2>
      <p class="empty-desc">${err.message}</p>
      <button class="btn btn-secondary mt-4" onclick="window.location.reload()">
        <i class="fas fa-rotate"></i> Muat Ulang
      </button>
    </div>
  `;
}
