// ============================================================
//  MAIN APPLICATION ENTRY POINT
//  Orchestrates: auth, layout, router, pages
// ============================================================
import './styles/main.css';
import { initAuth, onAuthChange, isAuthenticated } from './lib/auth.js';
import { route, startRouter, navigate } from './lib/router.js';
import { renderAppShell, getPageRoot, onRouteChange, destroyAppShell } from './components/layout.js';
import { initNotifications, destroyNotifications } from './components/notification.js';
import { loginPage } from './pages/login.js';
import { dashboardPage } from './pages/dashboard.js';
import { proyekListPage, afterProyekListRender } from './pages/proyek-list.js';
import { proyekFormPage } from './pages/proyek-form.js';
import { proyekDetailPage } from './pages/proyek-detail.js';
import { proyekFilesPage } from './pages/proyek-files.js';
import { checklistPage } from './pages/checklist.js';
import { analisisPage } from './pages/analisis.js';
import { laporanPage } from './pages/laporan.js';
import { todoPage } from './pages/todo.js';
import { todoDetailPage } from './pages/todo-detail.js';
import { executivePage } from './pages/executive.js';
import { multiAgentPage, afterMultiAgentRender } from './pages/multi-agent.js';
import { filesPage } from './pages/files.js';
import { pengaturanPage } from './pages/pengaturan.js';
import { timKerjaPage } from './pages/tim-kerja.js';
import { kondisiPage } from './pages/kondisi.js';
import { galeriPage } from './pages/proyek-galeri.js';
import { suratPernyataanPage } from './pages/surat-pernyataan.js';
import { verifyPage } from './pages/verify.js';
import { placeholderPage } from './pages/placeholder.js';
import { getUserInfo, signOut } from './lib/auth.js';
import { showSuccess, showError } from './components/toast.js';
import { confirm } from './components/modal.js';
import { APP_CONFIG } from './lib/config.js';
import { getPendingDrafts, clearSyncedDrafts, hasPendingDrafts, startBackgroundSync } from './lib/sync.js';
import { supabase } from './lib/supabase.js';
import { uploadToGoogleDrive } from './lib/drive.js';

// Make navigate globally accessible for onclick handlers
window.navigate = (path, params = {}) => navigate(path, params);

// ── Loading Progress ──────────────────────────────────────────
const loadingEl   = document.getElementById('loading-screen');
const progressEl  = document.getElementById('loading-progress');
const statusEl    = document.getElementById('loading-status');
let _initialized  = false;

function updateProgress(pct, statusText) {
  if (progressEl) progressEl.style.width = `${pct}%`;
  if (statusText && statusEl) {
    statusEl.style.animation = 'none';
    statusEl.offsetHeight; // trigger reflow
    statusEl.style.animation = 'status-fade 0.5s ease';
    statusEl.innerText = statusText;
  }
}

function hideLoading() {
  if (!loadingEl) return;
  loadingEl.style.opacity = '0';
  setTimeout(() => {
    loadingEl.style.display = 'none';
  }, 800);
}

// ── Chart.js Lazy Load ────────────────────────────────────────
async function loadChartJS() {
  if (window.Chart) return;
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

// ── Register Routes ───────────────────────────────────────────
function registerRoutes() {
  // Public
  route('login', async () => {
    if (isAuthenticated()) { navigate('dashboard'); return ''; }
    await loginPage();
    return '';
  });

  // Protected - Dashboard
  route('dashboard', async () => {
    await loadChartJS();
    const html = await dashboardPage();
    // After render, initialize charts
    setTimeout(async () => {
      const { fetchKPI } = await import('./pages/dashboard.js');
      // charts are initialized inside dashboardPage
    }, 50);
    return html;
  });

  // Protected - Proyek
  route('proyek', async () => {
    const html = await proyekListPage();
    setTimeout(afterProyekListRender, 50);
    return html;
  });

  route('proyek-baru', async () => {
    return await proyekFormPage();
  });

  route('proyek-edit', async (params) => {
    return await proyekFormPage(params);
  });

  route('proyek-detail', async (params) => {
    return await proyekDetailPage(params);
  });

  route('proyek-files', async (params) => {
    return await proyekFilesPage(params);
  });

  // Protected - Checklist
  route('checklist', async (params) => {
    return await checklistPage(params);
  });

  // Protected - Kondisi
  route('kondisi', async (params) => {
    return await kondisiPage(params);
  });

  // Protected - Files
  route('files', async () => {
    return await filesPage();
  });

  // Protected - Analisis
  route('analisis', async (params) => {
    return await analisisPage(params);
  });

  // Protected - Galeri
  route('galeri', async (params) => {
    return await galeriPage(params);
  });

  route('multi-agent', async (params) => {
    const html = await multiAgentPage(params);
    setTimeout(afterMultiAgentRender, 50);
    return html;
  });

  // Protected - Laporan
  route('laporan', async (params) => {
    return await laporanPage(params);
  });

  // Protected - Surat Pernyataan (PP 16/2021)
  route('surat-pernyataan', async (params) => {
    return await suratPernyataanPage(params);
  });

  // Public - TTE Verification
  route('verify', async (params) => {
    return await verifyPage(params);
  });

  // Protected - TODO
  route('todo', async () => {
    return await todoPage();
  });

  route('todo-detail', async (params) => {
    return await todoDetailPage(params);
  });

  // Protected - Team
  route('tim-kerja', async () => {
    return await timKerjaPage();
  });

  // Protected - Executive
  route('executive', async () => {
    return await executivePage();
  });

  // Protected - Settings
  route('settings', async () => {
    return await pengaturanPage();
  });

  // 404
  route('404', async () => placeholderPage({
    title: 'Halaman Tidak Ditemukan', icon: 'fa-map-signs',
    description: 'Halaman yang Anda tuju tidak ada.',
  }));
}

// ── App Bootstrap ─────────────────────────────────────────────
async function bootstrap() {
  updateProgress(10, 'Inisialisasi Sistem Core...');
  await new Promise(r => setTimeout(r, 400));

  // Register all routes
  registerRoutes();
  updateProgress(30, 'MENYIAPKAN MODUL...');
  await new Promise(r => setTimeout(r, 300));

  // Initialize auth
  const user = await initAuth();
  updateProgress(60, 'AUTENTIKASI PENGGUNA...');
  await new Promise(r => setTimeout(r, 400));

  const appEl = document.getElementById('app');

  // Listen to auth changes - render layout when needed
  onAuthChange((user) => {
    if (user && !_initialized) {
      _initialized = true;
      // Render app shell
      renderAppShell(appEl);
      initNotifications();
      // Start router with page-root as mount point
      const pageRoot = getPageRoot();
      if (pageRoot) startRouter(pageRoot);
    } else if (!user) {
      _initialized = false;
      destroyNotifications();
      destroyAppShell(appEl);
      // Render login directly
      loginPage();
    }
  });

  // Listen to route changes to update layout
  window.addEventListener('route-changed', (e) => {
    onRouteChange(e.detail.path);
  });

  // If not authenticated at start, show login
  if (!user) {
    updateProgress(100, 'SISTEM SIAP.');
    hideLoading();
    await loginPage();
    return;
  }

  // Authenticated: render app shell first then start router
  renderAppShell(appEl);
  initNotifications();
  const pageRoot = getPageRoot();
  if (pageRoot) {
    startRouter(pageRoot);
  }

  updateProgress(100, 'SISTEM SIAP.');
  hideLoading();

  // Register Service Worker (PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Gunakan base path yang sama dengan Vite config
      const swPath = `${APP_CONFIG.base}/sw.js`;
      navigator.serviceWorker.register(swPath)
        .then(reg => console.log('[SW] Registered:', reg.scope))
        .catch(err => {
          // Silent fail - SW tidak kritis untuk fungsi utama
          console.warn('[SW] Registration skipped:', err.message);
        });
    });
  }

  // Initial Sync Status
  initSyncSystem();
}

/**
 * PWA Offline & Sync Management
 */
function initSyncSystem() {
  window.addEventListener('online',  updateSyncUI);
  window.addEventListener('offline', updateSyncUI);
  
  // Periksa draft setiap kali rute berubah atau aplikasi dimuat
  window.addEventListener('route-changed', updateSyncUI);
  updateSyncUI();
}

async function updateSyncUI() {
  const bannerContainer = document.getElementById('sync-banner-container');
  if (!bannerContainer) return;

  const isOnline = navigator.onLine;
  const pendingCount = (await getPendingDrafts()).length;

  if (!isOnline) {
    bannerContainer.innerHTML = `
      <div style="background:var(--danger-bg); color:var(--danger-400); padding:8px 20px; font-size:0.8rem; text-align:center; border-bottom:1px solid var(--danger-500); display:flex; align-items:center; justify-content:center; gap:10px;">
        <i class="fas fa-plane-slash"></i> Mode Offline: Data akan disimpan di perangkat sementara.
      </div>
    `;
  } else if (pendingCount > 0) {
    bannerContainer.innerHTML = `
      <div style="background:var(--warning-bg); color:var(--warning-400); padding:8px 20px; font-size:0.8rem; text-align:center; border-bottom:1px solid var(--warning-500); display:flex; align-items:center; justify-content:center; gap:15px;">
        <span><i class="fas fa-cloud-upload-alt"></i> Ada <b>${pendingCount}</b> data inspeksi belum tersinkronisasi.</span>
        <button class="btn btn-primary btn-sm" onclick="window.doGlobalSync()" id="btn-global-sync" style="padding:4px 12px; font-size:0.75rem;">
          Sinkronkan Sekarang
        </button>
      </div>
    `;
  } else {
    bannerContainer.innerHTML = '';
  }
}

window.doGlobalSync = async function() {
  const btn = document.getElementById('btn-global-sync');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mensinkronisasi...';
  }

  try {
    const drafts = await getPendingDrafts();
    if (drafts.length === 0) return updateSyncUI();

    // Mapping ulang data agar sesuai skema DB (hapus ID IndexedDB)
    const payload = drafts.map(({ id, ...rest }) => ({
       ...rest,
       updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('checklist_items').upsert(payload, { onConflict: 'proyek_id, kode' });

    if (error) throw error;

    await clearSyncedDrafts(drafts.map(d => d.id));
    showSuccess('Semua data berhasil disinkronisasi ke Cloud!');
    updateSyncUI();
  } catch (err) {
    showError('Gagal sinkronisasi: ' + err.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Coba Lagi';
    }
  }
};


// Start the app
bootstrap().catch(err => {
  console.error('[App] Bootstrap error:', err);
  document.getElementById('loading-screen')?.classList.add('hidden');
  document.getElementById('app').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;background:#0a0c12;color:#e2e8f0">
      <div style="text-align:center;padding:2rem">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h2 style="font-size:1.4rem;margin-bottom:0.5rem">Terjadi Kesalahan Sistem</h2>
        <p style="color:#718096;margin-bottom:1.5rem">${err.message}</p>
        <button onclick="location.reload()" style="background:linear-gradient(135deg,#3b5fd9,#7c5ce7);color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:0.9rem">
          Muat Ulang
        </button>
      </div>
    </div>
  `;
});
// ── Offline Resilience & Sync Engine ─────────────────────────
window.addEventListener('online', () => {
  document.body.classList.remove('is-offline');
  showSuccess("Koneksi internet terdeteksi. Memulai sinkronisasi data...");
  startBackgroundSync(supabase, uploadToDrive);
});

window.addEventListener('offline', () => {
  document.body.classList.add('is-offline');
  showError("Mode Offline Aktif. Seluruh data yang Anda masukkan disimpan sementara di perangkat ini.");
});

function uploadToDrive(file, proyekId, kode, metadata) {
  // Adaptation for sync engine to use the existing driver
  return uploadToGoogleDrive(file, proyekId, kode, metadata);
}

// Initial check
if (!navigator.onLine) document.body.classList.add('is-offline');
else startBackgroundSync(supabase, uploadToDrive);
