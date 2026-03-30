// ============================================================
//  APP LAYOUT COMPONENT
//  Wraps sidebar + header + main content
// ============================================================
import { renderSidebar, bindSidebarEvents, updateActiveNav } from './sidebar.js';
import { renderHeader, bindHeaderEvents, updateHeaderTitle } from './header.js';
import { getUser } from '../lib/auth.js';

let _layoutInitialized = false;

/**
 * Render the full app shell (sidebar + header + content slot)
 * Called once when user is authenticated.
 */
export function renderAppShell(appEl) {
  if (_layoutInitialized) return;
  _layoutInitialized = true;

  appEl.innerHTML = `
    <div class="app-layout" id="app-layout">
      ${renderSidebar()}
      <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
      ${renderHeader('dashboard')}
      <div id="sync-banner-container"></div>
      <main class="main-content" id="main-content">
        <div class="page-container" id="page-root">
          <!-- Page content rendered here by router -->
        </div>
      </main>
      ${renderBottomNav()}
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
        <i class="fas fa-exclamation-triangle"></i>
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
  
  // Close sidebar on mobile after navigation
  document.getElementById('sidebar')?.classList.remove('open');
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
        <span>Home</span>
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
        <span>AI Hub</span>
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
