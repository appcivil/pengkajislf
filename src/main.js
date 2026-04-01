// ============================================================
//  MAIN APPLICATION ENTRY POINT (Composition Root)
//  Orchestrates: auth, layout, router, pages, sync
// ============================================================
import './styles/main.css';
import { initAuth, onAuthChange, isAuthenticated } from './lib/auth.js';
import { route, startRouter, navigate } from './lib/router.js';
import { renderAppShell, getPageRoot, onRouteChange, destroyAppShell } from './components/layout.js';
import { initNotifications, destroyNotifications } from './components/notification.js';

// Infrastructure & Use Cases
import { SupabaseChecklistRepository, SupabaseFileRepository, BrowserNotificationService } from './infrastructure/persistence/Implementations.js';
import { DatabaseAuditLogger } from './infrastructure/security/AuditLogger.js';
import { OpenRouterAIService } from './infrastructure/ai/OpenRouterService.js';
import { SyncData } from './application/use-cases/SyncData.js';
import { AnalisisDokumenAI } from './application/use-cases/AnalisisDokumenAI.js';
import { getCurrentRoute } from './lib/router.js';

// Pages
import { loginPage } from './pages/login.js';
import { dashboardPage } from './pages/dashboard.js';
import { proyekListPage, afterProyekListRender } from './pages/proyek-list.js';
import { proyekDetailPage } from './pages/proyek-detail.js';
import { proyekFormPage } from './pages/proyek-form.js';
import { proyekFilesPage } from './pages/proyek-files.js';
import { checklistPage } from './pages/checklist.js';
import { kondisiPage } from './pages/kondisi.js';
import { analisisPage } from './pages/analisis.js';
import { multiAgentPage, afterMultiAgentRender } from './pages/multi-agent.js';
import { laporanPage } from './pages/laporan.js';
import { suratPernyataanPage } from './pages/surat-pernyataan.js';
import { suratPernyataanListPage } from './pages/surat-pernyataan-list.js';
import { verifyPage } from './pages/verify.js';
import { legalPage } from './pages/legal.js';
import { filesPage } from './pages/files.js';
import { todoPage } from './pages/todo.js';
import { todoDetailPage } from './pages/todo-detail.js';
import { timKerjaPage } from './pages/tim-kerja.js';
import { executivePage } from './pages/executive.js';
import { pengaturanPage } from './pages/pengaturan.js';
import { placeholderPage } from './pages/placeholder.js';
import { galeriPage } from './pages/proyek-galeri.js';

import { APP_CONFIG } from './lib/config.js';
import { startBackgroundSync } from './lib/sync.js';
import { supabase } from './lib/supabase.js';
import { uploadToGoogleDrive } from './lib/drive.js';
import { initSyncIndicator } from './components/sync-ui.js';

// Dependency Injection Setup
const checklistRepo = new SupabaseChecklistRepository();
const fileRepo = new SupabaseFileRepository();
const auditLogger = new DatabaseAuditLogger();
const aiService = new OpenRouterAIService();
const notificationService = new BrowserNotificationService();

const syncDataUseCase = new SyncData(checklistRepo, notificationService);
const analyseUseCase = new AnalisisDokumenAI(fileRepo, aiService, notificationService, auditLogger);

// Global Navigation
window.navigate = (path, params = {}) => navigate(path, params);

// AI Processing UI Controls
window.showAIOverlay = (title = 'AI Analisis Sedang Berjalan') => {
    let overlay = document.getElementById('ai-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ai-overlay';
        overlay.className = 'ai-processing-overlay';
        overlay.innerHTML = `
            <div class="ai-processing-card">
                <div class="ai-spinner-wrap">
                    <i class="fas fa-brain ai-spinner-icon"></i>
                </div>
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
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mensinkronisasi...';
    }
    try {
        await syncDataUseCase.execute();
        updateSyncUI();
    } catch {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Coba Lagi';
        }
    }
};

// ── App Lifecycle ─────────────────────────────────────────────
const loadingEl  = document.getElementById('loading-screen');
const progressEl = document.getElementById('loading-progress');
const statusEl   = document.getElementById('loading-status');
let _initialized = false;

function updateProgress(pct, statusText) {
    if (progressEl) progressEl.style.width = `${pct}%`;
    if (statusText && statusEl) {
        statusEl.innerText = statusText;
    }
}

function hideLoading() {
    if (loadingEl) {
        loadingEl.style.opacity = '0';
        setTimeout(() => { loadingEl.style.display = 'none'; }, 800);
    }
}

// ── Routing ───────────────────────────────────────────────────
function registerRoutes() {
    route('login', async () => {
        if (isAuthenticated()) { navigate('dashboard'); return ''; }
        await loginPage(); return '';
    });
    route('dashboard', async () => await dashboardPage());
    route('proyek', async () => {
        const h = await proyekListPage();
        setTimeout(afterProyekListRender, 50);
        return h;
    });
    route('proyek-baru', async () => await proyekFormPage());
    route('proyek-detail', async (p) => await proyekDetailPage(p));
    route('checklist', async (p) => await checklistPage(p));
    route('multi-agent', async (p) => {
        const h = await multiAgentPage(p);
        setTimeout(afterMultiAgentRender, 50);
        return h;
    });
    route('analisis', async (p) => await analisisPage(p));
    route('files', async () => await filesPage());
    route('tim-kerja', async () => await timKerjaPage());
    route('settings', async () => await pengaturanPage());
    route('surat-pernyataan-list', async () => await suratPernyataanListPage());
    route('surat-pernyataan', async (p) => await suratPernyataanPage(p));
    route('laporan', async (p) => await laporanPage(p));
    route('verify', async (p) => await verifyPage(p));
    route('kondisi', async (p) => await kondisiPage(p));
    route('galeri', async (p) => await galeriPage(p));
    route('proyek-files', async (p) => await proyekFilesPage(p));
    route('todo', async (p) => await todoPage(p));
    
    // Fallback for other routes (Simplified for brevity in refactor)
    route('404', async () => placeholderPage({ title: '404', icon: 'fa-map-signs' }));
}

// ── Initialization ─────────────────────────────────────────────
async function bootstrap() {
    updateProgress(10, 'Inisialisasi Sistem...');
    registerRoutes();
    
    const user = await initAuth();
    updateProgress(60, 'Autentikasi...');

    const appEl = document.getElementById('app');
    const isPublicRoute = (path) => ['login', 'verify'].includes(path);
    const initialRoute = window.location.hash.slice(2).split('?')[0] || 'dashboard';

    onAuthChange((user) => {
        if (user && !_initialized) {
            _initialized = true;
            renderAppShell(appEl);
            initNotifications();
            const root = getPageRoot();
            if (root) startRouter(root);
        } else if (!user) {
            _initialized = false;
            const current = getCurrentRoute() || initialRoute;
            if (!isPublicRoute(current)) {
                destroyAppShell(appEl);
                loginPage();
            } else if (current === 'verify') {
                renderAppShell(appEl, true); // Public shell
                const root = getPageRoot();
                if (root) startRouter(root);
            }
        }
    });

    if (user) {
        renderAppShell(appEl);
    } else {
        if (initialRoute === 'verify') {
            renderAppShell(appEl, true);
        } else {
            await loginPage();
        }
    }

    initNotifications();
    const root = getPageRoot();
    if (root) startRouter(root);

    updateProgress(100, 'Sistem Siap.');
    hideLoading();

    window.addEventListener('online',  updateSyncUI);
    window.addEventListener('offline', updateSyncUI);
    window.addEventListener('route-changed', (e) => {
        updateSyncUI();
        onRouteChange(e.detail.path);
    });
    
    // Initial call for current hash
    const initialPath = window.location.hash.slice(2).split('?')[0] || 'dashboard';
    onRouteChange(initialPath);
    
    updateSyncUI();
    initSyncIndicator();

    // PWA & Background Sync
    if (navigator.onLine) startBackgroundSync(supabase, uploadToGoogleDrive);
}

async function updateSyncUI() {
    const bannerContainer = document.getElementById('sync-banner-container');
    if (!bannerContainer) return;

    const isOnline = navigator.onLine;
    const pending = await checklistRepo.getPendingDrafts();
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
