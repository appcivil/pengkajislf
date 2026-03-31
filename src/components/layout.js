// ============================================================
//  APP LAYOUT COMPONENT
//  Wraps sidebar + header + main content
// ============================================================
import { renderSidebar, bindSidebarEvents, updateActiveNav } from './sidebar.js';
import { renderHeader, bindHeaderEvents, updateHeaderTitle } from './header.js';
import { getUser } from '../lib/auth.js';
import { store } from '../lib/store.js';

let _layoutInitialized = false;

/**
 * Render the full app shell (sidebar + header + content slot)
 * @param {HTMLElement} appEl
 * @param {boolean} isPublic - If true, render a simplified shell without sidebar
 */
export function renderAppShell(appEl, isPublic = false) {
  if (_layoutInitialized) return;
  _layoutInitialized = true;

  if (isPublic) {
    appEl.innerHTML = `
      <div class="app-layout public-layout" id="app-layout">
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
      ${renderSidebar()}
      
      ${renderHeader('dashboard')}
      
      <div id="sync-banner-container"></div>
      
      <main class="main-content" id="main-content">
        <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
        
        <div class="page-container" id="page-root">
          <!-- Page content rendered here by router -->
        </div>
        
        ${renderBottomNav()}
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
  
  // Public Portal Mode (Hide Sidebar/Header)
  const appLayout = document.getElementById('app-layout');
  if (path === 'verify') {
    appLayout?.classList.add('public-portal');
  } else {
    appLayout?.classList.remove('public-portal');
  }
  
  // Close sidebar on mobile after navigation
  document.getElementById('app-sidebar')?.classList.remove('open');
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
