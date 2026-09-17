// ============================================================
//  HEADER COMPONENT
// ============================================================
import { navigate } from '../lib/router.js';
import { escapeHtml } from '../lib/safe-markdown.js';
import { toggleMobileSidebar } from './sidebar.js';
import { getUserInfo, signOut } from '../lib/auth.js';
import { showSuccess, showError } from './toast.js';
import { confirm } from './modal.js';

/**
 * Judul + ikon yang tampil di header untuk setiap rute.
 *
 * Daftar ini sengaja dibuat lengkap untuk SEMUA rute yang terdaftar di
 * src/main.js. Sebelumnya hanya 11 rute yang punya entri, sehingga 25 halaman
 * lain (Berkas, Galeri, Simulasi, Chatbot, seluruh halaman pemeriksaan, …)
 * menampilkan nama aplikasi "Smart AI SLF" sebagai judul — pengguna tidak dapat
 * memastikan sedang berada di halaman mana.
 */
const PAGE_TITLES = {
  dashboard:   { title: 'Dasbor',             icon: 'fa-gauge-high' },
  proyek:      { title: 'Daftar Proyek SLF',  icon: 'fa-folder-open' },
  'proyek-baru':{ title: 'Proyek Baru',       icon: 'fa-plus-circle' },
  'proyek-edit':{ title: 'Ubah Proyek',       icon: 'fa-pen-to-square' },
  'proyek-detail':{ title: 'Detail Proyek',   icon: 'fa-building' },
  'proyek-files':{ title: 'Berkas Proyek',    icon: 'fa-folder-tree' },
  checklist:   { title: 'Checklist Pemeriksaan', icon: 'fa-clipboard-check' },
  'tier-checklist':{ title: 'Periksa Bertingkat ASCE 41', icon: 'fa-layer-group' },
  analisis:    { title: 'Analisis AI',         icon: 'fa-brain' },
  'multi-agent':{ title: 'Analisis Multi-Agen', icon: 'fa-network-wired' },
  laporan:     { title: 'Laporan Kajian SLF',  icon: 'fa-file-contract' },
  todo:        { title: 'Papan Tugas',         icon: 'fa-list-check' },
  files:       { title: 'Berkas',              icon: 'fa-cloud-arrow-up' },
  galeri:      { title: 'Galeri',              icon: 'fa-images' },
  simulation:  { title: 'Pusat Simulasi',      icon: 'fa-flask-vial' },
  kondisi:     { title: 'Kondisi Bangunan',    icon: 'fa-clipboard-list' },
  'tim-kerja': { title: 'Tim Kerja',           icon: 'fa-users-gear' },
  'surat-pernyataan-list':{ title: 'Surat Pernyataan', icon: 'fa-file-signature' },
  'surat-pernyataan':{ title: 'Surat Pernyataan', icon: 'fa-file-signature' },
  settings:    { title: 'Pengaturan',          icon: 'fa-gear' },
  'smart-ai':  { title: 'Pipeline Smart AI',   icon: 'fa-microchip' },
  chatbot:     { title: 'Asisten AI',          icon: 'fa-robot' },
  'canva-studio':{ title: 'Studio Desain AI',  icon: 'fa-palette' },
  'ndt-calculator':{ title: 'Kalkulator NDT',  icon: 'fa-calculator' },
  'seismic-calculator':{ title: 'Kalkulator Seismik', icon: 'fa-chart-line' },
  verify:      { title: 'Verifikasi Dokumen',  icon: 'fa-shield-halved' },
  // Halaman pemeriksaan (modul inspeksi)
  'electrical-inspection':{ title: 'Pemeriksaan Kelistrikan', icon: 'fa-bolt' },
  'lps-inspection':{ title: 'Pemeriksaan Penangkal Petir', icon: 'fa-cloud-bolt' },
  'fire-protection':{ title: 'Proteksi Kebakaran', icon: 'fa-fire-extinguisher' },
  'building-intensity':{ title: 'Intensitas Bangunan', icon: 'fa-building-columns' },
  architectural:{ title: 'Pemeriksaan Arsitektur', icon: 'fa-ruler-combined' },
  'egress-system':{ title: 'Sistem Evakuasi',  icon: 'fa-person-running' },
  environmental:{ title: 'Pemeriksaan Lingkungan', icon: 'fa-leaf' },
  accessibility:{ title: 'Aksesibilitas',      icon: 'fa-wheelchair' },
  'comfort-inspection':{ title: 'Kenyamanan Ruang', icon: 'fa-temperature-half' },
  'lighting-simulation':{ title: 'Simulasi Pencahayaan', icon: 'fa-lightbulb' },
  'water-inspection':{ title: 'Pemeriksaan Air Bersih', icon: 'fa-droplet' },
  'wastewater-inspection':{ title: 'Air Limbah', icon: 'fa-water' },
  'environmental-impact':{ title: 'Dampak Lingkungan', icon: 'fa-recycle' },
  stormwater:  { title: 'Pengelolaan Air Hujan', icon: 'fa-cloud-rain' },
  'sanitation-inspection':{ title: 'Sanitasi', icon: 'fa-toilet' },
  'disaster-mitigation':{ title: 'Mitigasi Bencana', icon: 'fa-house-crack' },
};
export function renderHeader(route = 'dashboard') {
  const info = PAGE_TITLES[route] || { title: 'Smart AI SLF', icon: 'fa-building' };
  const user = getUserInfo();
  const isOnline = navigator.onLine;

  return `
    <header class="app-header" id="app-header" style="backdrop-filter: blur(var(--glass-blur)); background: hsla(224, 25%, 4%, 0.85); border-bottom: 1px solid var(--glass-border); z-index: 100;">
      <div class="header-left" style="display: flex; align-items: center; gap: var(--space-2); flex: 1; min-width: 0;">
        <!-- Sidebar toggle (Mobile & Desktop) -->
        <button class="btn-icon hide-desktop" id="sidebar-toggle" aria-label="Toggle mobile sidebar">
          <i class="fas fa-bars"></i>
        </button>
        <button class="btn-icon hide-mobile" id="sidebar-toggle-desktop" aria-label="Toggle desktop sidebar" style="color: var(--gold-400)">
          <i class="fas fa-indent"></i>
        </button>

        <div class="header-breadcrumb" style="margin-left: var(--space-4)">
          <div class="breadcrumb-item" style="display:flex; align-items:center; gap:12px">
            <div style="width:32px; height:32px; border-radius:8px; background:hsla(220, 95%, 52%, 0.1); display:flex; align-items:center; justify-content:center; border:1px solid hsla(220, 95%, 52%, 0.2)">
              <i class="fas ${info.icon}" style="color:var(--brand-400); font-size: 0.9rem"></i>
            </div>
            <span style="font-family:'Outfit', sans-serif; font-weight:700; letter-spacing:0.02em; color:var(--text-primary); font-size: 1.1rem">${escapeHtml(info.title)}</span>
          </div>
        </div>
      </div>

      <div class="header-right">
        <!-- Sync Status -->
        <div class="sync-status ${isOnline ? 'online' : 'offline'}" id="header-sync-status" title="${isOnline ? 'Sistem Terhubung (Cloud Sync Aktif)' : 'Mode Offline (Data disimpan lokal)'}" style="background: hsla(220, 20%, 50%, 0.05); border: 1px solid var(--border-subtle); padding: 4px 12px; border-radius: 50px;">
          <div class="sync-indicator"></div>
          <span class="sync-label" style="font-family:var(--font-mono); font-size: 10px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em">${isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div class="divider-v" style="height:24px; opacity:0.1"></div>

        <!-- Search -->
        <div class="header-search" style="background: hsla(220, 20%, 100%, 0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); transition: all 0.3s ease;">
          <i class="fas fa-search search-icon" style="color: var(--text-tertiary)"></i>
          <input type="text"
                 id="global-search"
                 placeholder="Search Intel..."
                 style="font-family: var(--font-sans); font-size: 0.85rem; color: var(--text-primary)"
                 autocomplete="off" />
        </div>

        <!-- Quick Add -->
        <button type="button" aria-label="Tambah" class="btn-presidential gold" id="btn-quick-add" style="height:40px; width:40px; padding:0; border-radius:10px; box-shadow: var(--shadow-sm)">
          <i class="fas fa-plus"></i>
        </button>

        <!-- Notifications -->
        <button class="btn-icon" id="btn-notif" aria-label="Notifikasi" title="Notifikasi" style="position:relative; width:40px; height:40px; border-radius:10px; background:hsla(220, 20%, 100%, 0.03)">
          <i class="fas fa-bell" style="font-size: 1.1rem; color: var(--text-secondary)"></i>
          <span class="notif-dot" style="background: var(--danger-400); border: 2px solid var(--bg-base); width:8px; height:8px"></span>
        </button>

        <div class="divider-v" style="height:24px; opacity:0.1"></div>

        <!-- User Profile Dropdown -->
        <div class="user-profile-dropdown" id="user-profile-dropdown">
          <button class="profile-trigger" id="profile-trigger" style="background: hsla(220, 95%, 52%, 0.1); border: 1px solid hsla(220, 95%, 52%, 0.2); padding: 4px 8px 4px 4px; border-radius: 50px;">
            <div class="avatar-sm" style="background: var(--gradient-brand); color: white; font-weight: 800; width:32px; height:32px; font-size: 0.75rem">
              ${user?.initials || 'U'}
            </div>
            <div class="profile-info-mini">
              <span class="p-mini-name" style="font-weight: 700; color: var(--brand-300)">${user?.name?.split(' ')[0] || 'User'}</span>
              <i class="fas fa-chevron-down" style="font-size: 0.7rem; color: var(--text-tertiary)"></i>
            </div>
          </button>
          
          <div class="profile-menu" id="profile-menu" style="background: var(--bg-card); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl)">
            <div class="profile-menu-header" style="background: hsla(220, 95%, 52%, 0.05); padding: 20px">
              <div class="p-name" style="font-weight: 800; color: white">${user?.name || 'User'}</div>
              <div class="p-email" style="font-size: 11px; opacity: 0.6; font-family:var(--font-mono)">${user?.email || ''}</div>
              <div class="p-role-badge" style="background: var(--gradient-gold); color: black; font-weight: 800; font-size: 9px; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 8px">${user?.role || 'Pengkaji Teknis'}</div>
            </div>
            <div class="profile-menu-divider" style="opacity: 0.05"></div>
            <div style="padding: 10px">
              <button class="profile-menu-item" onclick="window.navigate('settings')" style="border-radius: 8px">
                <i class="fas fa-user-circle"></i> Pengaturan Akun
              </button>
              <button class="profile-menu-item" onclick="window.navigate('settings')" style="border-radius: 8px">
                <i class="fas fa-sliders"></i> Pengaturan Aplikasi
              </button>
              <div class="profile-menu-divider" style="opacity: 0.05; margin: 10px 0"></div>
              <button class="profile-menu-item logout" id="btn-logout-header" style="border-radius: 8px">
                <i class="fas fa-right-from-bracket"></i> Keluar Sesi
              </button>
            </div>
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
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileSidebar();
    });
  }

  const desktopToggle = document.getElementById('sidebar-toggle-desktop');
  if (desktopToggle) {
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

  // Hanya listener ini yang menempel pada `document`. Elemen header dibuat
  // ulang setiap render, jadi tanpa guard handler ini menumpuk di setiap
  // render (sekali klik → N kali eksekusi).
  if (!bindHeaderEvents._docBound) {
    bindHeaderEvents._docBound = true;
    document.addEventListener('click', () => {
      profileMenu?.classList.remove('show');
    });
  }

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
