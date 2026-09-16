// ============================================================
//  SPA ROUTER
//  Hash-based router untuk GitHub Pages compatibility
//  SECURITY FIX: Semua innerHTML diproteksi dengan DOMPurify
// ============================================================
import { isAuthenticated } from '../lib/auth.js';
import { escapeHtml } from './safe-markdown.js';
import { announce } from './a11y.js';
import DOMPurify from 'dompurify';

const _routes = new Map();
let _currentRoute = null;
let _beforeEach = null;

/**
 * Berapa lama menunggu sebelum kerangka "memuat" ditampilkan.
 *
 * KENAPA ada jeda: banyak rute selesai dalam beberapa milidetik. Menampilkan
 * kerangka seketika membuat layar berkedip — terlihat seperti kerusakan,
 * bukan seperti kecepatan. Setelah 150 ms barulah masuk akal memberi tahu
 * pengguna bahwa ada sesuatu yang sedang berjalan.
 */
const LOADING_DELAY_MS = 150;

/**
 * Nama halaman untuk pengumuman pembaca layar dan judul tab.
 * Dipakai bersama oleh kerangka memuat dan pengumuman setelah render.
 */
const ROUTE_LABELS = {
  dashboard: 'Dasbor', proyek: 'Proyek', 'proyek-detail': 'Detail Proyek',
  'proyek-files': 'Berkas Proyek', checklist: 'Daftar Periksa',
  laporan: 'Laporan', analisis: 'Analisis', pengaturan: 'Pengaturan',
  'tim-kerja': 'Tim Kerja', todo: 'Tugas', 'todo-detail': 'Detail Tugas',
  legal: 'Ketentuan Layanan', login: 'Masuk', verify: 'Verifikasi',
  'multi-agent': 'Multi-Agen', 'task-detail': 'Detail Tugas',
  'seismic-calculator': 'Kalkulator Seismik', 404: 'Halaman Tidak Ditemukan',
};

function routeLabel(path) {
  return ROUTE_LABELS[path] || String(path || '').replace(/[-_]/g, ' ');
}

/**
 * Kerangka halaman yang sedang dimuat.
 *
 * Tanpa ini, selama rute asinkron berjalan (permintaan Supabase bisa memakan
 * beberapa detik pada jaringan lambat) pengguna hanya melihat halaman SEBELUMNYA
 * yang membeku — tidak ada satu pun tanda bahwa navigasinya berhasil. Sebagian
 * pengguna akan mengklik menu yang sama berulang kali.
 *
 * `aria-busy` dipasang pada wadahnya supaya pembaca layar menahan diri
 * mengumumkan isi yang belum siap, dan pesan singkat diumumkan sekali.
 */
function renderLoading(path) {
  const label = routeLabel(path);
  return `
    <div class="route-loading" role="status" aria-live="polite">
      <span class="visually-hidden">Memuat ${escapeHtml(label)}…</span>
      <div class="route-loading-head" aria-hidden="true">
        <span class="route-loading-title"></span>
        <span class="route-loading-sub"></span>
      </div>
      <div class="route-loading-grid" aria-hidden="true">
        ${'<span class="route-loading-card"></span>'.repeat(4)}
      </div>
    </div>
  `;
}

// Route guard types
const PUBLIC_ROUTES = new Set(['login', 'verify']);

// Register a route
export function route(path, handler) {
  _routes.set(path, handler);
}

// Ambil handler yang sudah terdaftar (dipakai untuk mendaftarkan alias rute)
export function getRouteHandler(path) {
  return _routes.get(path);
}

// Daftar nama rute yang terdaftar (untuk audit & debugging)
export function listRoutes() {
  return [..._routes.keys()];
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
    //
    // Kerangka memuat beserta jeda singkatnya. Timer dibersihkan pada semua
    // jalur keluar (berhasil maupun gagal) supaya kerangka tidak pernah
    // tertinggal di layar.
    let loadingTimer = null;
    let loadingShown = false;
    if (!mountEl.querySelector('.route-loading')) {
      loadingTimer = setTimeout(() => {
        loadingShown = true;
        mountEl.setAttribute('aria-busy', 'true');
        mountEl.innerHTML = renderLoading(path);
        announce(`Memuat ${routeLabel(path)}`, { assertive: false });
      }, LOADING_DELAY_MS);
    }
    const stopLoading = () => {
      if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null; }
      if (loadingShown) {
        mountEl.removeAttribute('aria-busy');
        loadingShown = false;
      }
    };

    try {
      const content = await handler(getParams());
      stopLoading();
      if (typeof content === 'string') {
        // SECURITY FIX: Sanitasi HTML sebelum inject ke DOM
        mountEl.innerHTML = DOMPurify.sanitize(content, {
          ADD_TAGS: ['canvas', 'svg', 'path', 'circle', 'text'],
          ADD_ATTR: [
            'onclick', 'onmouseenter', 'onmouseleave', 'onchange', 'oninput',
            'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'text-anchor',
            'font-family', 'font-weight', 'font-size',
          ],
          FORCE_BODY: false,
        });
      } else if (content instanceof HTMLElement) {
        mountEl.innerHTML = '';
        mountEl.appendChild(content);
      }
      // Scroll to top on route change
      window.scrollTo(0, 0);
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('route-changed', { detail: { path } }));
      // Sekali saja per navigasi: pembaca layar tahu halaman barunya.
      announce(routeLabel(path));
    } catch (err) {
      stopLoading();
      console.error(`[Router] Error rendering route "${path}":`, err);
      mountEl.innerHTML = renderError(err);
      // Galat harus diumumkan, bukan hanya terlihat. Pengguna pembaca layar
      // tidak tahu halaman gagal dimuat kalau pesannya hanya muncul di DOM.
      announce(`Gagal memuat ${routeLabel(path)}. ${String(err?.message || '').slice(0, 120)}`, { assertive: true });
    }
    // Timer wajib dibersihkan walau handler melempar SEBELUM baris di atas
    // sempat dijalankan (mis. galat di renderError itu sendiri).
    finally {
      if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null; }
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
  // SECURITY FIX: Jangan inject pesan error raw ke DOM
  const safeMessage = DOMPurify.sanitize(String(err?.message || 'Unknown error'));
  return `
    <div class="empty-state" style="min-height:100vh">
      <div class="empty-icon" style="color:var(--danger-400)"><i class="fas fa-triangle-exclamation"></i></div>
      <h2 class="empty-title">Terjadi Kesalahan</h2>
      <p class="empty-desc">${escapeHtml(safeMessage)}</p>
      <button class="btn btn-secondary mt-4" onclick="window.location.reload()">
        <i class="fas fa-rotate"></i> Muat Ulang
      </button>
    </div>
  `;
}
