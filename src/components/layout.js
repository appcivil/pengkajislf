// ============================================================
//  APP LAYOUT COMPONENT
//  Wraps sidebar + header + main content
// ============================================================
import { renderSidebar, bindSidebarEvents, updateActiveNav } from './sidebar.js';
import { renderHeader, bindHeaderEvents, updateHeaderTitle } from './header.js';
import { getUser } from '../lib/auth.js';
import { store } from '../lib/store.js';
import { navigate } from '../lib/router.js';

let _layoutInitialized = false;

/**
 * Pastikan `window.navigate` tersedia untuk atribut `onclick` di seluruh markup.
 *
 * Aplikasi ini memanggil `window.navigate(...)` dari **103 tempat** lewat atribut
 * `onclick`. Sebelumnya fungsi itu hanya dipasang di dalam `pages/dashboard.js`,
 * sehingga:
 *
 *   - setiap navigasi dari halaman SELAIN Dasbor gagal dengan galat
 *     "window.navigate is not a function" (mis. tombol PROYEK BARU, tab
 *     pemeriksaan, tombol keluar);
 *   - bahkan dari Dasbor pun tidak selalu ada, karena `dashboard.js` dimuat
 *     secara lazy — pengguna yang langsung membuka #/proyek dan menekan tombol
 *     tetap mendapat galat yang sama.
 *
 * Dipasang di sini (kerangka aplikasi), bukan di router, supaya router tetap
 * tidak menyentuh objek global.
 */
export function pasangNavigateGlobal() {
  if (typeof window !== 'undefined' && window.navigate !== navigate) {
    window.navigate = navigate;
  }
}

/**
 * Render the full app shell (sidebar + header + content slot)
 * @param {HTMLElement} appEl
 * @param {boolean} isPublic - If true, render a simplified shell without sidebar
 */
export function renderAppShell(appEl, isPublic = false) {
  pasangNavigateGlobal();
  if (_layoutInitialized) return;
  _layoutInitialized = true;

  if (isPublic) {
    appEl.innerHTML = `
      <div class="app-layout public-layout" id="app-layout">
        <a class="skip-link" href="#page-root">Lompat ke konten utama</a>
        <main class="main-content no-sidebar" id="main-content" style="margin-left:0; width:100%">
          <div class="page-container" id="page-root">
            <!-- Public page content -->
          </div>
        </main>
      </div>
    `;
    return;
  }

  appEl.innerHTML = `
    <div class="app-layout sidebar-collapsed" id="app-layout">
      <!-- Tanpa tautan ini, pengguna keyboard harus menekan Tab puluhan kali
           melewati sidebar dan header di SETIAP halaman (WCAG 2.4.1). -->
      <a class="skip-link" href="#page-root">Lompat ke konten utama</a>

      ${renderSidebar()}
      
      ${renderHeader('dashboard')}
      
      <main class="main-content" id="main-content" tabindex="-1">
        <div id="sync-banner-container"></div>
        <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
        
        <div class="page-container" id="page-root">
          <!-- Page content rendered here by router -->
        </div>
        
        ${isPublic ? '' : renderBottomNav()}
      </main>
    </div>
  `;

  bindSidebarEvents();
  bindHeaderEvents();
  checkBypassMode();
}

/**
 * Check if current user is bypassed and show fixed warning
 */
function checkBypassMode() {
  const user = getUser();
  const container = document.getElementById('sync-banner-container');
  if (user?.is_bypass && container) {
    container.innerHTML = `
      <div class="bypass-warning-banner">
        <i class="fas fa-triangle-exclamation"></i>
        <span><strong>Mode Pratinjau:</strong> Data Anda tidak akan tersimpan ke database karena Anda tidak login secara resmi.</span>
      </div>
    `;
  }
}

/**
 * Get the page root element (where router injects page content)
 */
export function getPageRoot() {
  return document.getElementById('page-root');
}

/**
 * Update layout for route change (active nav + header title)
 */
export function onRouteChange(path) {
  updateActiveNav(path);
  updateHeaderTitle(path);

  // Public Portal Mode (Hide Sidebar/Header)
  const appLayout = document.getElementById('app-layout');
  if (path === 'verify') {
    appLayout?.classList.add('public-portal');
  } else {
    appLayout?.classList.remove('public-portal');
  }

  // Close sidebar on mobile after navigation
  document.getElementById('app-sidebar')?.classList.remove('show');
  document.getElementById('sidebar-backdrop')?.classList.remove('show');

  // Update active state in bottom nav
  const bnavItems = document.querySelectorAll('.bnav-item');
  bnavItems.forEach(item => {
    const route = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (route && (path === route || path.startsWith(route + '-'))) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Scroll main content to top
  document.getElementById('main-content')?.scrollTo(0, 0);
}

/**
 * Render Bottom Navigation for mobile devices
 */
function renderBottomNav() {
  return `
    <nav class="bottom-nav">
      <a class="bnav-item" onclick="window.navigate('dashboard')">
        <i class="fas fa-home"></i>
        <span>Dasbor</span>
      </a>
      <a class="bnav-item" onclick="window.navigate('proyek')">
        <i class="fas fa-tasks"></i>
        <span>Proyek</span>
      </a>
      <a class="bnav-item" onclick="window.navigate('files')">
        <i class="fas fa-folder"></i>
        <span>Berkas</span>
      </a>
      <a class="bnav-item" onclick="window.navigate('multi-agent')">
        <i class="fas fa-robot"></i>
        <span>Hub AI</span>
      </a>
    </nav>
  `;
}

/**
 * Destroy app shell (used when user logs out)
 */
export function destroyAppShell(appEl) {
  _layoutInitialized = false;
  appEl.innerHTML = '';
}
