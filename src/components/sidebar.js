// ============================================================
//  SIDEBAR COMPONENT
// ============================================================
import { navigate, getCurrentRoute, getParams } from '../lib/router.js';
import { getUserInfo, signOut, isAdmin } from '../lib/auth.js';
import { APP_CONFIG } from '../lib/config.js';
import { confirm } from './modal.js';
import { showSuccess, showError } from './toast.js';

const GLOBAL_NAV = [
  { section: 'Utama', icon: 'fa-house-blank' },
  { path: 'dashboard',              label: 'Overview',           icon: 'fa-gauge-high' },
  { path: 'proyek',                 label: 'Daftar Proyek SLF',  icon: 'fa-folder-tree' },
  { path: 'surat-pernyataan-list',  label: 'Kumpulan Surat SP',  icon: 'fa-file-signature', badge: 'Global' },
  { path: 'files',                  label: 'SLFdrive',           icon: 'fa-cloud-arrow-up' },
  { path: 'multi-agent',            label: 'Multi Agent AI Hub', icon: 'fa-robot', badge: 'Baru' },

  { section: 'ADMINISTRASI', icon: 'fa-shield-halved', adminOnly: true },
  { path: 'todo',         label: 'TODO Board',          icon: 'fa-list-check', adminOnly: true },
  { path: 'tim-kerja',    label: 'Tim Kerja',           icon: 'fa-users-gear', adminOnly: true },

  { section: 'SISTEM', icon: 'fa-sliders' },
  { path: 'settings',     label: 'Pengaturan',          icon: 'fa-gear' },
];

const PROJECT_NAV = [
  { section: 'WORKSPACE PROYEK', icon: 'fa-microchip' },
  { path: 'proyek-detail', label: 'Ringkasan Gedung',  icon: 'fa-circle-info' },
  { path: 'files',         label: 'Dokumen SIMBG',      icon: 'fa-folder-open' },
  { path: 'checklist',     label: 'Checklist Teknis',  icon: 'fa-clipboard-check' },
  { path: 'analisis',      label: 'Analisis Smart AI', icon: 'fa-brain', badge: 'Active' },
  { path: 'laporan',       label: 'Laporan Final SLF', icon: 'fa-file-contract' },
];

export function renderSidebar() {
  const user = getUserInfo();
  const params = getParams();
  const projectId = params.id;
  const currentRoute = getCurrentRoute();

  // Unified Nav Logic: Always show Global, add Project if present
  let navItems = [...GLOBAL_NAV];
  if (projectId) {
    // Insert Project Nav after the Utama section or at position 6
    navItems.splice(5, 0, ...PROJECT_NAV);
  }

  const navHtml = navItems
    .filter(item => !item.adminOnly || isAdmin())
    .map((item, idx) => {
      if (item.section) {
        return `
          <div class="nav-section-label" style="${idx > 0 ? 'margin-top:20px' : ''}">
            <i class="fas ${item.icon} section-icon"></i>
            <span>${item.section}</span>
          </div>
        `;
      }
    const active = currentRoute === item.path ? 'active' : '';
    const badge  = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    
    // In project mode, only Workspace items strictly REQUIRE the project ID
    // Check if item is part of PROJECT_NAV
    const isProjectItem = PROJECT_NAV.some(p => p.path === item.path && !p.section);
    const finalParams = (projectId && isProjectItem) ? { id: projectId } : {};

    return `
      <a class="nav-item ${active}" data-route="${item.path}" data-params='${JSON.stringify(finalParams)}' role="button" tabindex="0">
        <i class="fas ${item.icon} nav-icon"></i>
        <span>${item.label}</span>
        ${badge}
      </a>
    `;
  }).join('');

  const avatarHtml = user?.avatar
    ? `<img src="${user.avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="avatar">`
    : `<div class="user-avatar">${user?.initials || '?'}</div>`;

  return `
    <aside class="sidebar" id="app-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/logo-app.png" alt="Logo" style="width:100%; height:100%; object-fit:contain; border-radius:var(--radius-md);">
        </div>
        <div>
          <div class="sidebar-title">${APP_CONFIG.name.split(' ').slice(0,3).join(' ')}</div>
          <div class="sidebar-subtitle">v${APP_CONFIG.version}</div>
        </div>
      </div>

      <nav class="sidebar-nav" id="sidebar-nav">
        ${navHtml}
      </nav>

      <div class="sidebar-footer">
        <div class="verified-badge">
          <div class="badge-icon">
            <i class="fas fa-shield"></i>
          </div>
          <div class="badge-text">
            PENGKAJI TERVERIFIKASI<br>
            <span class="badge-sub">ITE COMPLIANT v2.0</span>
          </div>
        </div>

        <div class="user-card" id="user-card-btn" title="Klik untuk logout">
          ${avatarHtml}
          <div class="user-info-wrap">
            <div class="user-name truncate">${user?.name || 'User'}</div>
            <div class="user-role truncate">${user?.email || ''}</div>
          </div>
          <i class="fas fa-right-from-bracket logout-icon"></i>
        </div>
      </div>
    </aside>
  `;
}

export function bindSidebarEvents() {
  // Navigation clicks
  document.querySelectorAll('.nav-item[data-route]').forEach(el => {
    const route = el.dataset.route;
    const params = JSON.parse(el.dataset.params || '{}');

    el.addEventListener('click', () => {
      navigate(route, params);
      closeMobileSidebar(); // Auto-close on mobile
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        navigate(route, params);
        closeMobileSidebar();
      }
    });
  });

  // Backdrop click to close
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeMobileSidebar);

  // Logout
  document.getElementById('user-card-btn')?.addEventListener('click', async () => {
    const ok = await confirm({
      title: 'Keluar Akun',
      message: `Anda akan keluar dari akun <strong>${getUserInfo()?.email}</strong>. Lanjutkan?`,
      confirmText: 'Keluar',
      danger: true,
    });
    if (ok) {
      try {
        await signOut();
        showSuccess('Berhasil keluar.');
        navigate('login');
      } catch {
        showError('Gagal keluar. Coba lagi.');
      }
    }
  });
}

// Update active nav state
export function refreshSidebar() {
  const navContainer = document.getElementById('sidebar-nav');
  if (!navContainer) return;
  
  const params = getParams();
  const projectId = params.id;
  const currentRoute = getCurrentRoute();
  
  // Re-calculate nav items
  let navItems = [...GLOBAL_NAV];
  if (projectId) {
    navItems.splice(5, 0, ...PROJECT_NAV);
  }

  // Re-render HTML
  navContainer.innerHTML = navItems
    .filter(item => !item.adminOnly || isAdmin())
    .map((item, idx) => {
      if (item.section) {
        return `<div class="nav-section-label" style="${idx > 0 ? 'margin-top:20px' : ''}"><i class="fas ${item.icon} section-icon"></i><span>${item.section}</span></div>`;
      }
      const active = currentRoute === item.path ? 'active' : '';
      const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
      const isProjectItem = PROJECT_NAV.some(p => p.path === item.path && !p.section);
      const finalParams = (projectId && isProjectItem) ? { id: projectId } : {};

      return `<a class="nav-item ${active}" data-route="${item.path}" data-params='${JSON.stringify(finalParams)}' role="button" tabindex="0"><i class="fas ${item.icon} nav-icon"></i><span>${item.label}</span>${badge}</a>`;
    }).join('');

  // Re-bind events
  bindSidebarEvents();
}

export function updateActiveNav(path) {
  refreshSidebar(); // Re-render everything to be safe and reactive
  document.querySelectorAll('.nav-item[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === path);
  });
}

// Mobile sidebar toggle
export function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.toggle('open');
  if (backdrop) backdrop.classList.toggle('show');
}

export function closeMobileSidebar() {
  if (window.innerWidth > 768) return; // Only close on mobile
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('show');
}
