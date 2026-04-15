// ============================================================
//  MAIN APPLICATION ENTRY POINT (Composition Root)
// ============================================================

// [GLOBAL SHIMS] Mencegah error 'exports is not defined' pada GitHub Pages / Production
if (typeof global === 'undefined') { window.global = window; }
if (typeof exports === 'undefined') { window.exports = {}; }
if (typeof module === 'undefined') { window.module = { exports: window.exports }; }

import './styles/main.css';
import { initAuth, onAuthChange, isAuthenticated, getUserInfo } from './lib/auth.js';
import { route, startRouter, navigate } from './lib/router.js';
import { renderAppShell, getPageRoot, onRouteChange, destroyAppShell } from './components/layout.js';
import { initNotifications, destroyNotifications } from './components/notification.js';

// Infrastructure & Use Cases (dipertahankan tidak lazy — critical path)
import { SupabaseChecklistRepository, SupabaseFileRepository, BrowserNotificationService } from './infrastructure/persistence/Implementations.js';
import { DatabaseAuditLogger } from './infrastructure/security/AuditLogger.js';
import { OpenRouterAIService } from './infrastructure/ai/OpenRouterService.js';
import { SyncData } from './application/use-cases/SyncData.js';
import { AnalisisDokumenAI } from './application/use-cases/AnalisisDokumenAI.js';
import { ForensicAnalysis } from './application/use-cases/ForensicAnalysis.js';
import { MemoryService } from './infrastructure/memory/MemoryService.js';
import { SupabaseAIMemoryRepository } from './infrastructure/persistence/SupabaseAIMemoryRepository.js';
import { getCurrentRoute } from './lib/router.js';
import { APP_CONFIG } from './lib/config.js';
import { startBackgroundSync } from './lib/sync.js';
import { supabase, isSupabaseConfigured } from './lib/supabase.js';
import { uploadToGoogleDrive } from './lib/drive.js';
import { initSyncIndicator } from './components/sync-ui.js';
import { floatingChatStyles } from './components/chatbot/index.js';

// SmartAI Pipeline Integration
import { initializePipeline, getPipelineIntegration } from './infrastructure/pipeline/pipeline-integration.js';

// Dependency Injection Setup
const checklistRepo       = new SupabaseChecklistRepository();
const fileRepo            = new SupabaseFileRepository();
const auditLogger         = new DatabaseAuditLogger();
const notificationService = new BrowserNotificationService();

// AI Memory Setup
const aiMemoryRepo        = new SupabaseAIMemoryRepository();
const memoryService       = new MemoryService(aiMemoryRepo);

// AI Service dengan Memory
const aiService           = new OpenRouterAIService();
// Inject memory service ke ai service akan dilakukan setelah instance creation

const syncDataUseCase = new SyncData(checklistRepo, notificationService);
const analyseUseCase  = new AnalisisDokumenAI(fileRepo, aiService, notificationService, auditLogger);
const forensicUseCase = new ForensicAnalysis(checklistRepo, fileRepo, notificationService, auditLogger);

// Global Navigation
window.navigate = (path, params = {}) => navigate(path, params);
window.forensicUseCase = forensicUseCase; // Expose for UI pages
window.memoryService = memoryService; // Expose memory service untuk chatbot

// AI Processing UI Controls
window.showAIOverlay = (title = 'AI Analisis Sedang Berjalan') => {
  let overlay = document.getElementById('ai-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ai-overlay';
    overlay.className = 'ai-processing-overlay';
    overlay.innerHTML = `
      <div class="ai-processing-card">
        <div class="ai-spinner-wrap"><i class="fas fa-brain ai-spinner-icon"></i></div>
        <div class="ai-status-title">${title}</div>
        <div class="ai-status-text" id="ai-status-text">Menghubungkan ke Neural Engine...</div>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.querySelector('.ai-status-title').innerText = title;
  }
  setTimeout(() => overlay.classList.add('show'), 10);
};

window.hideAIOverlay = () => {
  const overlay = document.getElementById('ai-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 400);
  }
};

window.updateAIStatus = (text) => {
  const el = document.getElementById('ai-status-text');
  if (el) el.innerText = text;
};

window.analyseFile = async (id) => {
  window.showAIOverlay();
  try {
    window.updateAIStatus('Membaca konteks berkas...');
    const result = await analyseUseCase.execute(id);
    window.updateAIStatus('Berhasil menganalisis.');
    return result;
  } finally {
    setTimeout(window.hideAIOverlay, 1500);
  }
};

window.doGlobalSync = async () => {
  const btn = document.getElementById('btn-global-sync');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mensinkronisasi...'; }
  try {
    await syncDataUseCase.execute();
    updateSyncUI();
  } catch {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Coba Lagi'; }
  }
};

// ── App Lifecycle ─────────────────────────────────────────────
const loadingEl  = document.getElementById('loading-screen');
const progressEl = document.getElementById('loading-progress');
const statusEl   = document.getElementById('loading-status');
let _initialized = false;

function updateProgress(pct, statusText) {
  if (progressEl) progressEl.style.width = `${pct}%`;
  if (statusText && statusEl) statusEl.innerText = statusText;
}

function hideLoading() {
  if (loadingEl) {
    loadingEl.style.opacity = '0';
    setTimeout(() => { loadingEl.style.display = 'none'; }, 800);
  }
}

// ── Lazy Page Loaders ─────────────────────────────────────────
// PERFORMANCE FIX: Semua halaman diload secara lazy (on-demand)
// Ini mengurangi bundle awal secara signifikan.

// CRITICAL MODULES: Preload untuk memastikan tab switching lancar
const CRITICAL_INSPECTION_MODULES = [
  'electricalInspection',
  'lpsInspection', 
  'fireProtectionInspection',
  'egressInspection',
  'buildingIntensityInspection',
  'architecturalInspection',
  'environmentalInspection',
  'accessibilityInspection',
  'comfortInspection',
  'stormwaterInspection',
  'waterInspection',
  'wastewaterInspection',
  'disasterInspection',
];

const pages = {
  login:             () => import('./pages/login.js'),
  dashboard:         () => import('./pages/dashboard.js'),
  proyekList:        () => import('./pages/proyek-list.js'),
  proyekForm:        () => import('./pages/proyek-form.js'),
  proyekDetail:      () => import('./pages/proyek-detail.js'),
  proyekFiles:       () => import('./pages/proyek-files.js'),
  checklist:         () => import('./pages/checklist.js'),
  tierChecklist:     () => import('./pages/tier-checklist.js'),
  kondisi:           () => import('./pages/kondisi.js'),
  analisis:          () => import('./pages/analisis.js'),
  ndtCalculator:     () => import('./pages/ndt-calculator.js'),
  seismicCalculator: () => import('./pages/seismic-calculator.js'),
  multiAgent:        () => import('./pages/multi-agent.js'),
  laporan:           () => import('./pages/laporan/index.js'),
  suratPernyataan:   () => import('./pages/surat-pernyataan.js'),
  suratPernyataanList:() => import('./pages/surat-pernyataan-list.js'),
  verify:            () => import('./pages/verify.js'),
  files:             () => import('./pages/files.js'),
  todo:              () => import('./pages/todo.js'),
  timKerja:          () => import('./pages/tim-kerja.js'),
  pengaturan:        () => import('./pages/pengaturan.js'),
  placeholder:       () => import('./pages/placeholder.js'),
  galeri:            () => import('./pages/proyek-galeri.js'),
  taskDetail:        () => import('./pages/task-detail.js'),
  passwordModal:     () => import('./components/password-modal.js'),
  simulation:        () => import('./pages/simulation.js'),
  electricalInspection: () => import('./pages/electrical-inspection.js'),
  lpsInspection:       () => import('./pages/lps-inspection.js'),
  fireProtectionInspection: () => import('./pages/fire-protection-inspection.js'),
  comfortInspection:   () => import('./pages/comfort-inspection.js'),
  sanitationInspection: () => import('./pages/sanitation-inspection.js'),
  egressInspection:    () => import('./pages/egress-inspection.js'),
  buildingIntensityInspection: () => import('./pages/building-intensity-inspection.js'),
  architecturalInspection: () => import('./pages/architectural-inspection.js'),
  environmentalInspection: () => import('./pages/environmental-inspection.js'),
  accessibilityInspection: () => import('./pages/accessibility-inspection.js'),
  lightingSimulation:     () => import('./pages/lighting-simulation.js'),
  stormwaterInspection: () => import('./pages/stormwater-inspection.js'),
  wastewaterInspection:   () => import('./pages/wastewater-inspection.js'),
  disasterInspection:   () => import('./pages/disaster-inspection.js'),
  smartAIDashboard:   () => import('./pages/smart-ai-dashboard.js'),
  chatbot:            () => import('./pages/chatbot.js'),
  canvaStudio:        () => import('./pages/canva-studio.js'),
};

// Pre-fetch halaman yang paling sering diakses setelah login
function prefetchCriticalPages() {
  setTimeout(() => {
    pages.dashboard();
    pages.proyekList();
  }, 3000);
}

// PRELOAD INSPECTION MODULES: Dipanggil saat user masuk proyek-detail
// untuk memastikan semua tab modul siap digunakan
export function preloadInspectionModules() {
  console.log('[Preload] Starting inspection modules preload...');
  
  // Preload semua inspection modules secara parallel
  const preloadPromises = CRITICAL_INSPECTION_MODULES.map(moduleName => {
    if (pages[moduleName]) {
      return pages[moduleName]().catch(err => {
        console.warn(`[Preload] Failed to load ${moduleName}:`, err);
        return null;
      });
    }
    return Promise.resolve();
  });
  
  Promise.all(preloadPromises).then(() => {
    console.log('[Preload] All inspection modules loaded successfully');
  }).catch(err => {
    console.error('[Preload] Error loading inspection modules:', err);
  });
}

// Preload saat user navigasi ke proyek-detail (predictive prefetching)
export function onProyekDetailEnter() {
  // Preload inspection modules dengan delay kecil
  setTimeout(preloadInspectionModules, 500);
}

// ── Routing ───────────────────────────────────────────────────
function registerRoutes() {
  route('login', async () => {
    if (isAuthenticated()) { navigate('dashboard'); return ''; }
    const { loginPage } = await pages.login();
    return await loginPage();
  });

  route('dashboard', async () => {
    const { dashboardPage, afterDashboardRender } = await pages.dashboard();
    const h = await dashboardPage();
    setTimeout(afterDashboardRender, 50);
    return h;
  });

  route('proyek', async () => {
    const { proyekListPage, afterProyekListRender } = await pages.proyekList();
    const h = await proyekListPage();
    setTimeout(afterProyekListRender, 50);
    return h;
  });

  route('proyek-baru', async () => {
    const { proyekFormPage } = await pages.proyekForm();
    return await proyekFormPage();
  });

  route('proyek-edit', async (p) => {
    const { proyekFormPage } = await pages.proyekForm();
    return await proyekFormPage(p);
  });

  route('proyek-detail', async (p) => {
    const { proyekDetailPage } = await pages.proyekDetail();
    return await proyekDetailPage(p);
  });

  route('checklist', async (p) => {
    const { checklistPage, afterChecklistRender } = await pages.checklist();
    const h = await checklistPage(p);
    setTimeout(() => afterChecklistRender(p), 50);
    return h;
  });

  route('tier-checklist', async (p) => {
    const { tierChecklistPage, afterTierChecklistRender } = await pages.tierChecklist();
    const h = await tierChecklistPage(p);
    setTimeout(() => afterTierChecklistRender(p), 50);
    return h;
  });

  route('multi-agent', async (p) => {
    const { multiAgentPage, afterMultiAgentRender } = await pages.multiAgent();
    const h = await multiAgentPage(p);
    setTimeout(afterMultiAgentRender, 50);
    return h;
  });

  route('analisis', async (p) => {
    const { analisisPage, afterAnalisisRender } = await pages.analisis();
    const h = await analisisPage(p);
    setTimeout(() => afterAnalisisRender(p), 50);
    return h;
  });

  route('ndt-calculator', async (p) => {
    const { ndtCalculatorPage } = await pages.ndtCalculator();
    return await ndtCalculatorPage(p);
  });

  route('seismic-calculator', async (p) => {
    const { seismicCalculatorPage } = await pages.seismicCalculator();
    return await seismicCalculatorPage(p);
  });

  route('files', async () => {
    const { filesPage } = await pages.files();
    return await filesPage();
  });

  route('tim-kerja', async () => {
    const { timKerjaPage, afterTimKerjaRender } = await pages.timKerja();
    const h = await timKerjaPage();
    setTimeout(afterTimKerjaRender, 50);
    return h;
  });

  route('todo', async (p) => {
    const { todoPage, afterTodoRender } = await pages.todo();
    const h = await todoPage(p);
    setTimeout(() => afterTodoRender(p), 50);
    return h;
  });

  route('settings', async () => {
    const { pengaturanPage } = await pages.pengaturan();
    return await pengaturanPage();
  });

  route('surat-pernyataan-list', async () => {
    const { suratPernyataanListPage } = await pages.suratPernyataanList();
    return await suratPernyataanListPage();
  });

  route('surat-pernyataan', async (p) => {
    const { suratPernyataanPage } = await pages.suratPernyataan();
    return await suratPernyataanPage(p);
  });

  route('laporan', async (p) => {
    const { laporanPage } = await pages.laporan();
    return await laporanPage(p);
  });

  route('verify', async (p) => {
    const { verifyPage } = await pages.verify();
    return await verifyPage(p);
  });

  route('kondisi', async (p) => {
    const { kondisiPage } = await pages.kondisi();
    return await kondisiPage(p);
  });

  route('galeri', async (p) => {
    const { galeriPage } = await pages.galeri();
    return await galeriPage(p);
  });

  route('simulation', async () => {
    const { simulationPage, afterSimulationRender } = await pages.simulation();
    const h = await simulationPage();
    setTimeout(afterSimulationRender, 50);
    return h;
  });

  route('proyek-files', async (p) => {
    const { proyekFilesPage } = await pages.proyekFiles();
    return await proyekFilesPage(p);
  });

  route('electrical-inspection', async (p) => {
    const { electricalInspectionPage, afterElectricalInspectionRender } = await pages.electricalInspection();
    const h = await electricalInspectionPage(p);
    setTimeout(() => afterElectricalInspectionRender(p), 50);
    return h;
  });

  // Module routes - redirect to proyek-detail with module tab
  route('lps-inspection', async (p) => {
    const { lpsInspectionPage, afterLPSInspectionRender } = await pages.lpsInspection();
    const h = await lpsInspectionPage(p);
    setTimeout(() => afterLPSInspectionRender(p), 50);
    return h;
  });

  route('fire-protection', async (p) => {
    const { fireProtectionInspectionPage, afterFireProtectionInspectionRender } = await pages.fireProtectionInspection();
    const h = await fireProtectionInspectionPage(p);
    setTimeout(() => afterFireProtectionInspectionRender(p), 50);
    return h;
  });

  route('building-intensity', async (p) => {
    const { buildingIntensityInspectionPage, afterBuildingIntensityInspectionRender } = await pages.buildingIntensityInspection();
    const h = await buildingIntensityInspectionPage(p);
    setTimeout(() => afterBuildingIntensityInspectionRender(p), 50);
    return h;
  });

  route('architectural', async (p) => {
    const { architecturalInspectionPage, afterArchitecturalInspectionRender } = await pages.architecturalInspection();
    const h = await architecturalInspectionPage(p);
    setTimeout(() => afterArchitecturalInspectionRender(p), 50);
    return h;
  });

  route('egress-system', async (p) => {
    const { egressInspectionPage, afterEgressInspectionRender } = await pages.egressInspection();
    const h = await egressInspectionPage(p);
    setTimeout(() => afterEgressInspectionRender(p), 50);
    return h;
  });

  route('environmental', async (p) => {
    const { environmentalInspectionPage, afterEnvironmentalInspectionRender } = await pages.environmentalInspection();
    const h = await environmentalInspectionPage(p);
    setTimeout(() => afterEnvironmentalInspectionRender(p), 50);
    return h;
  });

  route('accessibility', async (p) => {
    const { accessibilityInspectionPage, afterAccessibilityInspectionRender } = await pages.accessibilityInspection();
    const h = await accessibilityInspectionPage(p);
    setTimeout(() => afterAccessibilityInspectionRender(p), 50);
    return h;
  });

  route('lighting-simulation', async (p) => {
    const { lightingSimulationPage, afterLightingSimulationRender, cleanup } = await pages.lightingSimulation();
    const h = await lightingSimulationPage(p);
    setTimeout(() => afterLightingSimulationRender(p), 50);
    // Cleanup when route changes
    const cleanupHandler = () => {
      cleanup?.();
      window.removeEventListener('route-changed', cleanupHandler);
    };
    window.addEventListener('route-changed', cleanupHandler);
    return h;
  });

  route('water-inspection', async (p) => {
    const { waterInspectionPage, afterWaterInspectionRender } = await pages.waterInspection();
    const h = await waterInspectionPage(p);
    setTimeout(() => afterWaterInspectionRender(p), 50);
    return h;
  });

  route('wastewater-inspection', async (p) => {
    const { wastewaterInspectionPage, afterWastewaterInspectionRender } = await pages.wastewaterInspection();
    const h = await wastewaterInspectionPage(p);
    setTimeout(() => afterWastewaterInspectionRender(p), 50);
    return h;
  });

  route('environmental-impact', async (p) => {
    navigate('proyek-detail', { id: p.id, tab: 'environmental' });
    return '';
  });

  route('stormwater', async (p) => {
    const { stormwaterInspectionPage, afterStormwaterInspectionRender } = await pages.stormwaterInspection();
    const h = await stormwaterInspectionPage(p);
    setTimeout(() => afterStormwaterInspectionRender(p), 50);
    return h;
  });

  route('sanitation-inspection', async (p) => {
    const { sanitationInspectionPage, afterSanitationInspectionRender } = await pages.sanitationInspection();
    const h = await sanitationInspectionPage(p);
    setTimeout(() => afterSanitationInspectionRender(p), 50);
    return h;
  });

  route('disaster-mitigation', async (p) => {
    const { disasterInspectionPage, afterDisasterInspectionRender } = await pages.disasterInspection();
    const h = await disasterInspectionPage(p);
    setTimeout(() => afterDisasterInspectionRender(p), 50);
    return h;
  });

  // SmartAI Pipeline Dashboard
  route('smart-ai', async () => {
    const { smartAIDashboardPage, afterSmartAIDashboardRender } = await pages.smartAIDashboard();
    const h = await smartAIDashboardPage();
    setTimeout(afterSmartAIDashboardRender, 50);
    return h;
  });

  // AI Chatbot
  route('chatbot', async (p) => {
    const { chatbotPage, afterChatbotRender } = await pages.chatbot();
    const h = await chatbotPage(p);
    setTimeout(() => afterChatbotRender(p), 50);
    return h;
  });

  // Canva AI Studio
  route('canva-studio', async (p) => {
    const { canvaStudioPage, afterCanvaStudioRender } = await pages.canvaStudio();
    const h = await canvaStudioPage(p);
    setTimeout(() => afterCanvaStudioRender(p), 50);
    return h;
  });

  const taskRoute = async (p) => {
    const { taskDetailPage, afterTaskDetailRender } = await pages.taskDetail();
    const h = await taskDetailPage(p);
    setTimeout(() => afterTaskDetailRender(p), 50);
    return h;
  };
  route('task', taskRoute);
  route('todo-detail', taskRoute);
  route('404', async () => {
    const { placeholderPage } = await pages.placeholder();
    return placeholderPage({ title: '404', icon: 'fa-map-signs' });
  });
}

// ── Initialization ─────────────────────────────────────────────
async function bootstrap() {
  // BOOTSTRAP FIX: Cek konfigurasi Supabase sebelum melanjutkan
  if (!isSupabaseConfigured()) {
    updateProgress(10, 'Konfigurasi server tidak lengkap...');
    // Tampilkan error yang informatif di loading screen
    if (statusEl) {
      statusEl.innerHTML = `
        <span style="color:#f87171">⚠ Konfigurasi .env tidak lengkap</span><br>
        <small style="opacity:0.7;font-size:11px">Pastikan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY ada di file .env</small>
      `;
    }
    // Jangan stuck — tetap hide loading setelah 3 detik, tampilkan login page
    setTimeout(() => {
      hideLoading();
      const appEl = document.getElementById('app');
      if (appEl) appEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;font-family:Inter,sans-serif">
          <div>
            <div style="font-size:3rem;margin-bottom:1rem">⚙️</div>
            <h2 style="color:#f1f5f9;margin-bottom:0.5rem">Konfigurasi Diperlukan</h2>
            <p style="color:#94a3b8;margin-bottom:1.5rem">File <code>.env</code> tidak ditemukan atau tidak lengkap.<br>Isi <code>VITE_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code> lalu restart server.</p>
            <a href="PANDUAN_LENGKAP.md" style="color:#60a5fa">Lihat Panduan Lengkap →</a>
          </div>
        </div>`;
    }, 3000);
    return; // Hentikan bootstrap — jangan panggil Supabase dengan config kosong
  }

  // AI engine diinisialisasi di background — jangan block UI
  import('./infrastructure/ai/deep-reasoning-integration.js')
    .then(({ initializeSmartAIIntegration }) => initializeSmartAIIntegration())
    .catch(e => console.error('[App] Background AI initialization failed:', e));

  // Initialize SmartAI Pipeline (background, non-blocking)
  initializePipeline()
    .then(() => {
      console.log('[App] SmartAI Pipeline initialized');
      // Expose ke global untuk akses dari UI
      window.smartAIPipeline = getPipelineIntegration();
    })
    .catch(e => console.error('[App] SmartAI Pipeline initialization failed:', e));

  registerRoutes();

  updateProgress(20, 'Menghubungkan ke server...');

  // Safety net: jika koneksi sangat lambat, perbarui status setiap 2 detik
  let retryCount = 0;
  const statusMessages = [
    'Menghubungkan ke server...',
    'Masih menghubungkan... (koneksi lambat)',
    'Hampir selesai...',
  ];
  const statusInterval = setInterval(() => {
    retryCount++;
    const msg = statusMessages[retryCount] || 'Menghubungkan ke server...';
    if (retryCount < statusMessages.length) updateProgress(20 + retryCount * 5, msg);
  }, 2000);

  const user = await initAuth();
  clearInterval(statusInterval);
  updateProgress(60, 'Autentikasi...');

  const appEl = document.getElementById('app');
  const isPublicRoute = (path) => ['login', 'verify'].includes(path);
  const initialRoute  = window.location.hash.slice(2).split('?')[0] || 'dashboard';

  onAuthChange(async (user) => {
    if (user && !_initialized) {
      _initialized = true;
      const routeNow = getCurrentRoute() || initialRoute;
      renderAppShell(appEl, routeNow === 'verify');
      initNotifications();
      const root = getPageRoot();
      if (root) startRouter(root);

      // Cek force password change
      const userInfo = getUserInfo();
      if (userInfo?.force_password_change) {
        const { renderPasswordChangeModal } = await pages.passwordModal();
        setTimeout(() => renderPasswordChangeModal(userInfo), 1000);
      }

      // Pre-fetch halaman populer di background
      prefetchCriticalPages();

    } else if (!user && _initialized) {
      _initialized = false;
      if (!isPublicRoute(getCurrentRoute() || initialRoute)) {
        destroyAppShell(appEl);
        const { loginPage } = await pages.login();
        loginPage();
      } else if ((getCurrentRoute() || initialRoute) === 'verify') {
        renderAppShell(appEl, true);
        const root = getPageRoot();
        if (root) startRouter(root);
      }
    } else if (!user && !_initialized) {
      if (initialRoute === 'verify') {
        renderAppShell(appEl, true);
        const root = getPageRoot();
        if (root) startRouter(root);
      } else {
        const { loginPage } = await pages.login();
        loginPage();
      }
    }
  });

  updateProgress(100, 'Sistem Siap.');
  setTimeout(hideLoading, 400);

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => console.log('[SW] Registered:', reg))
      .catch((err) => console.log('[SW] Registration failed:', err));
  }

  // Sync hanya setelah UI stabil
  setTimeout(() => {
    if (isAuthenticated()) startBackgroundSync(supabase, uploadToGoogleDrive);
  }, 2000);

  // Inject floating chat styles
  if (!document.getElementById('floating-chat-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'floating-chat-styles';
    styleEl.textContent = floatingChatStyles;
    document.head.appendChild(styleEl);
  }

  // Initialize floating chat button (lazy load)
  setTimeout(() => {
    if (isAuthenticated()) {
      import('./components/chatbot/FloatingChatButton.js').then(({ FloatingChatButton }) => {
        const fab = new FloatingChatButton();
        const fabEl = fab.render();
        document.body.appendChild(fabEl);
        
        // Store reference for cleanup
        window._floatingChatButton = fab;
      }).catch(err => {
        console.error('[App] Failed to load floating chat button:', err);
      });
    }
  }, 3000);

  window.addEventListener('online', updateSyncUI);
  window.addEventListener('offline', updateSyncUI);
  window.addEventListener('route-changed', (e) => {
    updateSyncUI();
    onRouteChange(e.detail.path);
  });

  const initialPath = window.location.hash.slice(2).split('?')[0] || 'dashboard';
  onRouteChange(initialPath);

  updateSyncUI();
  initSyncIndicator();

  if (navigator.onLine) startBackgroundSync(supabase, uploadToGoogleDrive);
}

async function updateSyncUI() {
  const bannerContainer = document.getElementById('sync-banner-container');
  if (!bannerContainer) return;

  const isOnline    = navigator.onLine;
  const pending     = await checklistRepo.getPendingDrafts();
  const pendingCount = pending.length;

  if (!isOnline) {
    bannerContainer.innerHTML = `<div class="sync-banner offline">Mode Offline: Data disimpan di perangkat.</div>`;
  } else if (pendingCount > 0) {
    bannerContainer.innerHTML = `
      <div class="sync-banner pending">
        <span>Ada <b>${pendingCount}</b> data belum tersinkronisasi.</span>
        <button class="btn btn-sm" onclick="window.doGlobalSync()" id="btn-global-sync">Sinkronkan</button>
      </div>`;
  } else {
    bannerContainer.innerHTML = '';
  }
}

bootstrap().catch(console.error);
