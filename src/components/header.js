// ============================================================
//  HEADER COMPONENT
// ============================================================
import { navigate } from '../lib/router.js';
import { toggleMobileSidebar } from './sidebar.js';
import { getUserInfo, signOut } from '../lib/auth.js';
import { showSuccess, showError } from './toast.js';
import { confirm } from './modal.js';

const PAGE_TITLES = {
  dashboard:   { title: 'Dashboard',          icon: 'fa-gauge-high' },
  proyek:      { title: 'Daftar Proyek SLF',  icon: 'fa-folder-open' },
  'proyek-baru':{ title: 'Proyek Baru',       icon: 'fa-plus-circle' },
  'proyek-detail':{ title: 'Detail Proyek',   icon: 'fa-building' },
  checklist:   { title: 'Checklist Pemeriksaan', icon: 'fa-clipboard-check' },
  analisis:    { title: 'Analisis AI',         icon: 'fa-brain' },
  'multi-agent':{ title: 'Multi-Agent Analysis', icon: 'fa-network-wired' },
  laporan:     { title: 'Laporan Kajian SLF',  icon: 'fa-file-contract' },
  todo:        { title: 'TODO Board',           icon: 'fa-list-check' },
  executive:   { title: 'Executive Dashboard', icon: 'fa-chart-line' },
  settings:    { title: 'Pengaturan',           icon: 'fa-gear' },
};

export function renderHeader(route = 'dashboard') {
  const info = PAGE_TITLES[route] || { title: 'Smart AI SLF', icon: 'fa-building' };
  const user = getUserInfo();
  const isOnline = navigator.onLine;

  return `
    <header class="app-header" id="app-header">
      <div class="header-left">
        <!-- Sidebar toggle (Mobile & Desktop) -->
        <button class="btn-icon" id="sidebar-toggle" aria-label="Toggle mobile sidebar">
          <i class="fas fa-bars"></i>
        </button>
        <button class="btn-icon" id="sidebar-toggle-desktop" aria-label="Toggle desktop sidebar">
          <i class="fas fa-indent"></i>
        </button>

        <div class="header-breadcrumb">
          <div class="breadcrumb-item">
            <i class="fas ${info.icon}" style="color:var(--brand-400)"></i>
            <span>${info.title}</span>
          </div>
        </div>
      </div>

      <div class="header-right">
        <!-- Sync Status -->
        <div class="sync-status ${isOnline ? 'online' : 'offline'}" id="header-sync-status" title="${isOnline ? 'Sistem Terhubung (Cloud Sync Aktif)' : 'Mode Offline (Data disimpan lokal)'}">
          <div class="sync-indicator"></div>
          <span class="sync-label">${isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div class="divider-v"></div>

        <!-- Search -->
        <div class="header-search">
          <i class="fas fa-search search-icon"></i>
          <input type="text"
                 id="global-search"
                 placeholder="Cari..."
                 autocomplete="off" />
        </div>

        <!-- Quick Add -->
        <button class="btn btn-primary btn-sm" id="btn-quick-add" style="padding:0 12px; height:36px; border-radius:var(--radius-md)">
          <i class="fas fa-plus"></i>
        </button>

        <!-- Notifications -->
        <button class="btn-icon" id="btn-notif" aria-label="Notifikasi" title="Notifikasi">
          <i class="fas fa-bell"></i>
          <span class="notif-dot"></span>
        </button>

        <div class="divider-v"></div>

        <!-- User Profile Dropdown -->
        <div class="user-profile-dropdown" id="user-profile-dropdown">
          <button class="profile-trigger" id="profile-trigger">
            <div class="avatar-sm">
              ${user?.initials || 'U'}
            </div>
            <div class="profile-info-mini">
              <span class="p-mini-name">${user?.name?.split(' ')[0] || 'User'}</span>
              <i class="fas fa-chevron-down"></i>
            </div>
          </button>
          
          <div class="profile-menu" id="profile-menu">
            <div class="profile-menu-header">
              <div class="p-name">${user?.name || 'User'}</div>
              <div class="p-email">${user?.email || ''}</div>
              <div class="p-role-badge">${user?.role || 'Pengkaji Teknis'}</div>
            </div>
            <div class="profile-menu-divider"></div>
            <button class="profile-menu-item" onclick="window.navigate('settings')">
              <i class="fas fa-user-circle"></i> Pengaturan Akun
            </button>
            <button class="profile-menu-item" onclick="window.navigate('settings')">
              <i class="fas fa-sliders"></i> Pengaturan Aplikasi
            </button>
            <div class="profile-menu-divider"></div>
            <button class="profile-menu-item logout" id="btn-logout-header">
              <i class="fas fa-right-from-bracket"></i> Keluar
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function bindHeaderEvents() {
  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
    toggleBtn.addEventListener('click', toggleMobileSidebar);
  }

  const desktopToggle = document.getElementById('sidebar-toggle-desktop');
  if (desktopToggle) {
    desktopToggle.style.display = window.innerWidth > 768 ? 'flex' : 'none';
    desktopToggle.addEventListener('click', () => {
      document.getElementById('app-layout')?.classList.toggle('sidebar-collapsed');
      const icon = desktopToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-indent');
        icon.classList.toggle('fa-outdent');
      }
    });
  }

  // Profile Dropdown Toggle
  const profileTrigger = document.getElementById('profile-trigger');
  const profileMenu = document.getElementById('profile-menu');
  
  profileTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu?.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    profileMenu?.classList.remove('show');
  });

  // Logout from Header
  document.getElementById('btn-logout-header')?.addEventListener('click', async () => {
    const ok = await confirm({
      title: 'Keluar Akun',
      message: `Anda akan keluar dari sesi ini. Lanjutkan?`,
      confirmText: 'Keluar',
      danger: true,
    });
    if (ok) {
      try {
        await signOut();
        showSuccess('Berhasil keluar.');
        navigate('login');
      } catch {
        showError('Gagal keluar.');
      }
    }
  });

  // Quick add
  document.getElementById('btn-quick-add')?.addEventListener('click', () => {
    navigate('proyek-baru');
  });

  // Global search
  const searchEl = document.getElementById('global-search');
  let debounceTimer;
  searchEl?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = e.target.value.trim();
      if (q.length >= 2) {
        window.dispatchEvent(new CustomEvent('global-search', { detail: { q } }));
      }
    }, 350);
  });

  // Notifications placeholder
  document.getElementById('btn-notif')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-notifications'));
  });

  // Handle Online/Offline Status
  window.addEventListener('online', () => updateSyncIndicator(true));
  window.addEventListener('offline', () => updateSyncIndicator(false));
}

function updateSyncIndicator(isOnline) {
  const el = document.getElementById('header-sync-status');
  if (el) {
    el.className = `sync-status ${isOnline ? 'online' : 'offline'}`;
    el.title = isOnline ? 'Sistem Terhubung (Cloud Sync Aktif)' : 'Mode Offline (Data disimpan lokal)';
    const label = el.querySelector('.sync-label');
    if (label) label.innerText = isOnline ? 'Online' : 'Offline';
  }
}

export function updateHeaderTitle(route) {
  const info = PAGE_TITLES[route] || { title: 'Smart AI SLF', icon: 'fa-building' };
  const el = document.querySelector('.header-breadcrumb span');
  const iconEl = document.querySelector('.header-breadcrumb i');
  if (el) el.innerText = info.title;
  if (iconEl) {
    iconEl.className = `fas ${info.icon}`;
  }
}
