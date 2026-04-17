// ============================================================
// BASE INSPECTION CLASS - Clean Architecture State Management
// Menggantikan variabel global yang membahayakan Garbage Collector
// Optimized untuk sesi inspeksi panjang dengan memory management
// ============================================================

import { navigate } from '../../lib/router.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';
import { InspectionRepository } from '../../infrastructure/persistence/InspectionRepository.js';

// ============================================================
// CROSS-MODULE VALIDATION HOOKS SYSTEM
// ============================================================

/**
 * Registry untuk validasi lintas modul (Cross-Module Validation).
 * Memungkinkan modul inspeksi saling memvalidasi dependensi data.
 */
export class CrossModuleValidationRegistry {
  constructor() {
    this.validators = new Map();
    this.dependencies = new Map();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 menit cache
  }

  /**
   * Register validator untuk modul tertentu
   * @param {string} moduleName - Nama modul
   * @param {Function} validatorFn - Fungsi validator (async) yang mengembalikan { valid: boolean, errors: string[], warnings: string[] }
   * @param {string[]} dependsOn - Array nama modul yang menjadi dependensi
   */
  register(moduleName, validatorFn, dependsOn = []) {
    this.validators.set(moduleName, validatorFn);
    this.dependencies.set(moduleName, dependsOn);
    console.log(`[CrossModuleValidation] Registered: ${moduleName} (deps: ${dependsOn.join(', ') || 'none'})`);
  }

  /**
   * Unregister validator modul
   * @param {string} moduleName - Nama modul
   */
  unregister(moduleName) {
    this.validators.delete(moduleName);
    this.dependencies.delete(moduleName);
    this.cache.delete(moduleName);
  }

  /**
   * Jalankan validasi untuk modul tertentu dengan dependency resolution
   * @param {string} moduleName - Nama modul yang divalidasi
   * @param {string} projectId - ID proyek
   * @returns {Promise<{valid: boolean, errors: string[], warnings: string[], dependencies: Object}>}
   */
  async validate(moduleName, projectId) {
    const cacheKey = `${moduleName}:${projectId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`[CrossModuleValidation] Cache hit: ${moduleName}`);
      return cached.result;
    }

    const validator = this.validators.get(moduleName);
    if (!validator) {
      return { valid: true, errors: [], warnings: [], dependencies: {} };
    }

    // Resolve dependencies terlebih dahulu
    const deps = this.dependencies.get(moduleName) || [];
    const dependencyResults = {};
    
    for (const dep of deps) {
      const depResult = await this.validate(dep, projectId);
      dependencyResults[dep] = depResult;
    }

    // Jalankan validator dengan context dependencies
    try {
      const result = await validator(projectId, dependencyResults);
      const fullResult = { 
        ...result, 
        dependencies: dependencyResults,
        validatedAt: new Date().toISOString()
      };

      // Cache hasil
      this.cache.set(cacheKey, { result: fullResult, timestamp: Date.now() });
      
      return fullResult;
    } catch (error) {
      console.error(`[CrossModuleValidation] Error validating ${moduleName}:`, error);
      return { 
        valid: false, 
        errors: [`Validasi gagal: ${error.message}`], 
        warnings: [],
        dependencies: dependencyResults
      };
    }
  }

  /**
   * Invalidate cache untuk modul tertentu
   * @param {string} moduleName - Nama modul
   * @param {string} projectId - ID proyek (opsional)
   */
  invalidateCache(moduleName, projectId = null) {
    if (projectId) {
      this.cache.delete(`${moduleName}:${projectId}`);
    } else {
      // Hapus semua cache untuk modul ini
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${moduleName}:`)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Cleanup semua cache dan registry
   */
  clear() {
    this.validators.clear();
    this.dependencies.clear();
    this.cache.clear();
  }
}

// Singleton instance
export const crossModuleValidator = new CrossModuleValidationRegistry();

// ============================================================
// MEMORY-OPTIMIZED STATE MANAGER
// ============================================================

/**
 * State manager dengan memory optimization untuk sesi panjang.
 * Menggunakan WeakRef untuk data besar dan auto-cleanup.
 */
class OptimizedStateManager {
  constructor(moduleName, maxCacheSize = 50) {
    this.moduleName = moduleName;
    this.state = new Map();
    this.accessHistory = new Map();
    this.maxCacheSize = maxCacheSize;
    this.weakRefs = new Map();
  }

  set(key, value, options = {}) {
    const { largeData = false, ttl = null } = options;
    
    // Track access time
    this.accessHistory.set(key, Date.now());

    // Untuk data besar, gunakan WeakRef
    if (largeData && typeof value === 'object') {
      const ref = new WeakRef(value);
      this.weakRefs.set(key, { ref, original: value });
      this.state.set(key, { type: 'weak', largeData: true });
    } else {
      this.state.set(key, { value, type: 'strong', ttl });
    }

    // Auto-cleanup jika cache terlalu besar
    if (this.state.size > this.maxCacheSize) {
      this._cleanupLRU();
    }
  }

  get(key) {
    const entry = this.state.get(key);
    if (!entry) return undefined;

    // Update access time
    this.accessHistory.set(key, Date.now());

    // Handle weak reference
    if (entry.type === 'weak') {
      const weakEntry = this.weakRefs.get(key);
      if (weakEntry) {
        const deref = weakEntry.ref.deref();
        if (deref) return deref;
        // Object sudah di-GC, hapus dari state
        this.state.delete(key);
        this.weakRefs.delete(key);
        return undefined;
      }
    }

    // Check TTL
    if (entry.ttl && Date.now() > entry.ttl) {
      this.delete(key);
      return undefined;
    }

    return entry.value;
  }

  delete(key) {
    this.state.delete(key);
    this.accessHistory.delete(key);
    this.weakRefs.delete(key);
  }

  clear() {
    this.state.clear();
    this.accessHistory.clear();
    this.weakRefs.clear();
  }

  /**
   * Cleanup data yang jarang diakses (Least Recently Used)
   * @private
   */
  _cleanupLRU() {
    const entries = Array.from(this.accessHistory.entries());
    entries.sort((a, b) => a[1] - b[1]);
    
    // Hapus 20% data tertua
    const toDelete = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toDelete; i++) {
      const [key] = entries[i];
      this.delete(key);
      console.log(`[${this.moduleName}] LRU cleanup: ${key}`);
    }
  }

  getStats() {
    return {
      size: this.state.size,
      weakRefs: this.weakRefs.size,
      maxSize: this.maxCacheSize
    };
  }
}

/**
 * Abstract base class untuk semua modul pemeriksaan SLF.
 * Mengisolasi state dan mencegah memory leak.
 * 
 * @abstract
 * @example
 * class ComfortInspection extends BaseInspection {
 *   constructor() {
 *     super({
 *       moduleName: 'comfort',
 *       phaseCode: 'PHASE 02D',
 *       title: 'Pemeriksaan Aspek Kenyamanan',
 *       badge: 'PP 16/2021',
 *       icon: 'couch',
 *       accentColor: 'var(--success-400)'
 *     });
 *   }
 *   
 *   async loadData() {
 *     // Custom data loading
 *   }
 *   
 *   getTabs() {
 *     return [
 *       { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
 *       { id: 'occupancy', icon: 'users', label: 'RUANG' }
 *     ];
 *   }
 * }
 */
export class BaseInspection {
  /**
   * @param {Object} config - Konfigurasi modul inspection
   * @param {string} config.moduleName - Nama unik modul
   * @param {string} config.phaseCode - Kode phase (e.g., 'PHASE 02D')
   * @param {string} config.title - Judul pemeriksaan
   * @param {string} config.badge - Badge regulasi
   * @param {string} config.icon - FontAwesome icon
   * @param {string} config.accentColor - CSS color variable
   * @param {string} config.description - Deskripsi pemeriksaan
   * @param {Array} config.tables - Array nama tabel yang digunakan
   */
  constructor(config) {
    if (new.target === BaseInspection) {
      throw new Error('BaseInspection adalah abstract class dan tidak bisa diinstansiasi langsung');
    }

    this.config = {
      moduleName: '',
      phaseCode: 'PHASE',
      title: 'Pemeriksaan',
      badge: 'SLF',
      icon: 'clipboard-check',
      accentColor: 'var(--brand-400)',
      description: '',
      tables: [],
      ...config
    };

    // Repository untuk database operations
    this.repository = new InspectionRepository();

    // Optimized State Manager untuk memory-efficient state management
    this._stateManager = new OptimizedStateManager(this.config.moduleName, 100);
    
    // State base yang terisolasi (primitive values only)
    this._state = {
      projectId: null,
      projectName: '',
      projectData: null,
      currentTab: 'dashboard',
      isLoading: false,
      error: null
    };

    // Event handlers untuk cleanup
    this._eventHandlers = new Map();
    this._initialized = false;
    
    // Cross-module validation integration
    this._validationHooks = [];
    
    // Session performance tracking
    this._sessionStats = {
      initializedAt: null,
      dataLoadCount: 0,
      renderCount: 0,
      lastActivity: null
    };
  }

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  /**
   * Get current state (immutable copy)
   * @returns {Object} State saat ini
   */
  getState() {
    return { ...this._state };
  }

  /**
   * Update state secara immutable
   * @param {Object} updates - Object dengan perubahan state
   * @protected
   */
  _setState(updates) {
    this._state = { ...this._state, ...updates };
    this._notifyStateChange();
  }

  /**
   * Set data spesifik modul dengan memory optimization
   * @param {string} key - Key data
   * @param {*} value - Nilai data
   * @param {Object} options - Options { largeData: boolean, ttl: number }
   * @protected
   */
  _setData(key, value, options = {}) {
    const isLargeData = options.largeData || this._isLargeData(value);
    this._stateManager.set(key, value, { 
      largeData: isLargeData, 
      ttl: options.ttl 
    });
  }

  /**
   * Get data spesifik modul
   * @param {string} key - Key data
   * @returns {*} Nilai data
   * @protected
   */
  _getData(key) {
    return this._stateManager.get(key);
  }

  /**
   * Check if value is considered large data
   * @private
   */
  _isLargeData(value) {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.length > 100;
    if (value instanceof Map || value instanceof Set) return value.size > 100;
    return Object.keys(value).length > 50;
  }

  /**
   * Register cross-module validation hook
   * @param {Function} validator - Async function(projectId, dependencies) => { valid, errors, warnings }
   * @param {string[]} dependsOn - Array of module names this depends on
   * @protected
   */
  _registerValidationHook(validator, dependsOn = []) {
    this._validationHooks.push({ validator, dependsOn });
    
    // Register ke global validator registry
    crossModuleValidator.register(
      this.config.moduleName,
      validator,
      dependsOn
    );
  }

  /**
   * Run cross-module validation
   * @returns {Promise<{valid: boolean, errors: string[], warnings: string[]}>}
   * @protected
   */
  async _runCrossModuleValidation() {
    if (!this._state.projectId) {
      return { valid: false, errors: ['Project ID tidak tersedia'], warnings: [] };
    }

    return await crossModuleValidator.validate(
      this.config.moduleName,
      this._state.projectId
    );
  }

  /**
   * Invalidate validation cache untuk modul ini
   * @protected
   */
  _invalidateValidationCache() {
    crossModuleValidator.invalidateCache(
      this.config.moduleName,
      this._state.projectId
    );
  }

  /**
   * Get memory and performance stats
   * @returns {Object} Stats object
   * @protected
   */
  _getSessionStats() {
    return {
      ...this._sessionStats,
      stateManager: this._stateManager.getStats(),
      uptime: this._sessionStats.initializedAt 
        ? Date.now() - this._sessionStats.initializedAt 
        : 0
    };
  }

  /**
   * Notify subscribers tentang perubahan state.
   * Override di subclass jika perlu custom behavior.
   * @protected
   */
  _notifyStateChange() {
    // To be overridden by subclasses
  }

  // ============================================================
  // LIFECYCLE METHODS
  // ============================================================

  /**
   * Inisialisasi modul inspection.
   * Entry point utama yang dipanggil saat halaman di-render.
   * 
   * @param {Object} params - Route parameters
   * @param {string} params.id - Project ID
   * @returns {Promise<string>} HTML string untuk render
   */
  async initialize(params = {}) {
    try {
      // Track session start
      this._sessionStats.initializedAt = Date.now();
      this._sessionStats.lastActivity = Date.now();
      
      this._setState({ isLoading: true, error: null });

      // Extract project ID
      const projectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
      
      if (!projectId) {
        navigate('proyek');
        showError('Pilih proyek terlebih dahulu');
        return '';
      }

      this._setState({ projectId });

      // Load project info
      await this._loadProjectInfo();

      // Load modul-specific data
      await this.loadData();
      this._sessionStats.dataLoadCount++;

      // Run cross-module validation jika ada hooks
      if (this._validationHooks.length > 0) {
        const validation = await this._runCrossModuleValidation();
        if (!validation.valid) {
          console.warn(`[${this.config.moduleName}] Cross-module validation warnings:`, validation.warnings);
        }
      }

      this._setState({ isLoading: false });
      this._initialized = true;

      return this.renderPage();

    } catch (error) {
      this._setState({ isLoading: false, error: error.message });
      showError(`Gagal memuat data: ${error.message}`);
      console.error(`[${this.config.moduleName}] Initialization error:`, error);
      return this.renderError(error);
    }
  }

  /**
   * Method yang wajib di-override oleh subclass untuk load data spesifik.
   * @abstract
   * @protected
   */
  async loadData() {
    throw new Error('Subclass must implement loadData() method');
  }

  /**
   * Method yang wajib di-override oleh subclass untuk mendefinisikan tabs.
   * @abstract
   * @returns {Array<TabConfig>}
   * @protected
   */
  getTabs() {
    throw new Error('Subclass must implement getTabs() method');
  }

  /**
   * Render tab content berdasarkan tab aktif.
   * @abstract
   * @param {string} tabId - ID tab yang aktif
   * @returns {string} HTML content
   * @protected
   */
  renderTabContent(tabId) {
    throw new Error('Subclass must implement renderTabContent() method');
  }

  /**
   * Cleanup saat modul di-destroy (navigate away).
   * Mencegah memory leak dengan proper cleanup dan nullifikasi large objects.
   *
   * CRITICAL: Method ini harus dipanggil saat user navigate away dari inspection page
   * untuk memastikan GC dapat reclaim memory dari large datasets (ETABS, images, etc).
   */
  destroy() {
    // Log session stats sebelum cleanup
    const stats = this._getSessionStats();
    console.log(`[${this.config.moduleName}] Session stats:`, {
      uptime: `${Math.round(stats.uptime / 1000)}s`,
      dataLoads: stats.dataLoadCount,
      renders: stats.renderCount,
      stateSize: stats.stateManager?.size
    });

    // Remove all event listeners
    this._eventHandlers.forEach((handler, element) => {
      if (element && typeof element.removeEventListener === 'function') {
        handler.events.forEach(({ event, fn }) => {
          element.removeEventListener(event, fn);
        });
      }
    });
    this._eventHandlers.clear();

    // Clear optimized state manager (large data dengan WeakRef)
    this._stateManager.clear();

    // Unregister dari cross-module validator
    crossModuleValidator.unregister(this.config.moduleName);

    // Nullify large object references untuk GC (CRITICAL untuk memory management)
    if (this.repository && typeof this.repository.destroy === 'function') {
      this.repository.destroy();
    }
    this.repository = null;

    // Cleanup DOM references untuk prevent detached DOM nodes
    const pageElement = document.getElementById(`${this.config.moduleName}-inspection-page`);
    if (pageElement) {
      // Remove inline event handlers
      pageElement.querySelectorAll('[onclick]').forEach(el => {
        el.onclick = null;
      });
      // Clear content untuk memicu DOM GC
      pageElement.innerHTML = '';
    }

    // Clear state dengan null (bukan empty values) untuk GC hints
    this._state = null;

    // Nullify config references (tidak dihapus, tapi dereference large arrays)
    if (this.config && this.config.tables) {
      this.config.tables = null;
    }

    this._initialized = false;
    this._validationHooks = null;
    this._sessionStats = null;

    // Force GC hint (opsional, browser-dependent)
    if (window.gc) {
      try { window.gc(); } catch (e) { /* ignore */ }
    }

    console.log(`[${this.config.moduleName}] Destroyed and cleaned up (GC optimized)`);
  }

  // ============================================================
  // DATA LOADING (Protected)
  // ============================================================

  /**
   * Load project info dari repository.
   * @protected
   */
  async _loadProjectInfo() {
    try {
      const project = await this.repository.getProject(this._state.projectId);
      if (project) {
        this._setState({ 
          projectName: project.nama_bangunan,
          projectData: project
        });
      } else {
        this._setState({ projectName: 'Proyek Tidak Dikenal' });
      }
    } catch (error) {
      console.warn(`[${this.config.moduleName}] Failed to load project info:`, error);
      this._setState({ projectName: 'Proyek Tidak Dikenal' });
    }
  }

  // ============================================================
  // RENDERING METHODS
  // ============================================================

  /**
   * Render halaman utama.
   * @returns {string} HTML string
   */
  renderPage() {
    if (this._state.isLoading) {
      return this.renderLoading();
    }

    if (this._state.error) {
      return this.renderError(new Error(this._state.error));
    }

    return `
      <div id="${this.config.moduleName}-inspection-page" class="inspection-page" style="padding: var(--space-6); max-width: 1600px; margin: 0 auto;">
        ${this.renderHeader()}
        <div id="${this.config.moduleName}-content" class="inspection-content">
          ${this.renderTabContent(this._state.currentTab)}
        </div>
        ${this.renderModals()}
      </div>
    `;
  }

  /**
   * Render header card dengan metadata modul.
   * @returns {string} HTML string
   */
  renderHeader() {
    const { phaseCode, title, badge, icon, accentColor, description, moduleName } = this.config;
    const { projectId } = this._state;

    return `
      <div class="card-quartz inspection-header-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
        <div class="flex-between" style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, ${accentColor}25, ${accentColor}15); display: flex; align-items: center; justify-content: center; color: ${accentColor};">
              <i class="fas fa-${icon}" style="font-size: 1.4rem;"></i>
            </div>
            <div>
              <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: ${accentColor};">${phaseCode}</div>
              <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">${title}</h3>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <span class="badge" style="background: ${accentColor}15; color: ${accentColor}; border: 1px solid ${accentColor}30; font-size: 10px;">
              <i class="fas fa-book" style="margin-right: 6px;"></i>${badge}
            </span>
            <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${projectId}'}" style="color: var(--text-tertiary);">
              <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
            </button>
          </div>
        </div>
        
        ${description ? `
        <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
          ${description}
        </p>
        ` : ''}

        ${this.renderTabNavigation()}
      </div>
    `;
  }

  /**
   * Render tab navigation.
   * @returns {string} HTML string
   */
  renderTabNavigation() {
    const tabs = this.getTabs();
    const activeTab = this._state.currentTab;

    const tabsHtml = tabs.map(tab => {
      const isActive = tab.id === activeTab;
      const activeStyle = isActive 
        ? 'background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);'
        : 'color: var(--text-tertiary);';
      
      return `
        <button onclick="window._inspectionControllers['${this.config.moduleName}'].switchTab('${tab.id}')" 
                class="inspection-tab-item ${isActive ? 'active' : ''}"
                data-tab="${tab.id}"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; ${activeStyle}">
          <i class="fas fa-${tab.icon}"></i> ${tab.label}
        </button>
      `;
    }).join('');

    return `
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        ${tabsHtml}
      </div>
    `;
  }

  /**
   * Render loading state.
   * @returns {string} HTML string
   */
  renderLoading() {
    return `
      <div id="${this.config.moduleName}-inspection-page" class="inspection-page" style="padding: var(--space-6); max-width: 1600px; margin: 0 auto;">
        <div class="inspection-loading-skeleton">
          <div style="padding: var(--space-6); background: var(--card-bg); border-radius: 16px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
              <div class="skeleton" style="width: 48px; height: 48px; border-radius: 14px;"></div>
              <div style="flex: 1;">
                <div class="skeleton" style="width: 80px; height: 12px; border-radius: 4px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 250px; height: 20px; border-radius: 4px;"></div>
              </div>
            </div>
            <div class="skeleton" style="height: 44px; border-radius: 10px;"></div>
          </div>
        </div>
        <style>
          .skeleton {
            background: linear-gradient(90deg, hsla(220, 20%, 20%, 0.5) 25%, hsla(220, 20%, 30%, 0.5) 50%, hsla(220, 20%, 20%, 0.5) 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
          }
          @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        </style>
      </div>
    `;
  }

  /**
   * Render error state.
   * @param {Error} error - Error object
   * @returns {string} HTML string
   */
  renderError(error) {
    return `
      <div id="${this.config.moduleName}-inspection-page" class="inspection-page" style="padding: var(--space-6); max-width: 1600px; margin: 0 auto;">
        <div class="card-quartz" style="padding: 60px 40px; text-align: center;">
          <div style="width: 80px; height: 80px; border-radius: 24px; background: hsla(0, 80%, 60%, 0.15); display: flex; align-items: center; justify-content: center; color: var(--danger-400); margin: 0 auto 24px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
          </div>
          <h3 style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.3rem; color: white; margin-bottom: 12px;">Terjadi Kesalahan</h3>
          <p style="font-size: 0.9rem; color: var(--text-tertiary); max-width: 400px; margin: 0 auto 24px;">${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary" style="padding: 12px 24px; border-radius: 10px; background: var(--gradient-brand); color: white; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 12px; font-weight: 700;">
            <i class="fas fa-redo" style="margin-right: 8px;"></i>Muat Ulang Halaman
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render modals (override di subclass jika perlu).
   * @returns {string} HTML string
   */
  renderModals() {
    return '';
  }

  // ============================================================
  // EVENT HANDLING
  // ============================================================

  /**
   * Register event listener dengan auto-cleanup.
   * @param {HTMLElement} element - Element DOM
   * @param {string} event - Nama event
   * @param {Function} handler - Event handler
   * @protected
   */
  _addEventListener(element, event, handler) {
    if (!element) return;

    const wrappedHandler = (e) => {
      try {
        handler(e);
      } catch (error) {
        console.error(`[${this.config.moduleName}] Event handler error:`, error);
      }
    };

    element.addEventListener(event, wrappedHandler);

    // Track untuk cleanup
    if (!this._eventHandlers.has(element)) {
      this._eventHandlers.set(element, { events: [] });
    }
    this._eventHandlers.get(element).events.push({ event, fn: wrappedHandler });
  }

  /**
   * Switch tab dan render ulang content.
   * @param {string} tabId - ID tab tujuan
   */
  switchTab(tabId) {
    this._setState({ currentTab: tabId });
    
    // Update UI
    const contentDiv = document.getElementById(`${this.config.moduleName}-content`);
    if (contentDiv) {
      contentDiv.innerHTML = this.renderTabContent(tabId);
    }

    // Update tab navigation
    const tabContainer = document.querySelector(`#${this.config.moduleName}-inspection-page .inspection-header-card .card-quartz:last-child`);
    if (tabContainer) {
      tabContainer.outerHTML = this.renderTabNavigation();
    }

    // Call subclass hook
    this.onTabSwitch(tabId);
  }

  /**
   * Hook yang dipanggil saat tab switch.
   * Override di subclass jika perlu.
   * @param {string} tabId - ID tab yang aktif
   * @protected
   */
  onTabSwitch(tabId) {
    // To be overridden by subclasses
  }

  /**
   * Initialize event listeners setelah render.
   * Panggil ini di afterRender() page function.
   */
  afterRender() {
    // To be overridden by subclasses untuk custom event binding
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Show success toast.
   * @param {string} message - Pesan sukses
   * @protected
   */
  _showSuccess(message) {
    showSuccess(message);
  }

  /**
   * Show error toast.
   * @param {string} message - Pesan error
   * @protected
   */
  _showError(message) {
    showError(message);
  }

  /**
   * Show info toast.
   * @param {string} message - Pesan info
   * @protected
   */
  _showInfo(message) {
    showInfo(message);
  }

  /**
   * Navigate to route.
   * @param {string} route - Nama route
   * @param {Object} params - Route parameters
   * @protected
   */
  _navigate(route, params = {}) {
    navigate(route, params);
  }

  /**
   * Format number dengan separator.
   * @param {number} num - Angka
   * @param {number} decimals - Jumlah desimal
   * @returns {string} Angka terformat
   * @protected
   */
  _formatNumber(num, decimals = 0) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format date ke format Indonesia.
   * @param {string|Date} date - Date string atau object
   * @returns {string} Date terformat
   * @protected
   */
  _formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Check compliance status dari nilai.
   * @param {number} value - Nilai aktual
   * @param {number} min - Nilai minimum (opsional)
   * @param {number} max - Nilai maximum (opsional)
   * @returns {'compliant'|'non_compliant'|'partial'} Status compliance
   * @protected
   */
  _checkCompliance(value, min = null, max = null) {
    if (value === null || value === undefined) return 'pending';
    
    if (min !== null && max !== null) {
      if (value >= min && value <= max) return 'compliant';
      if (value >= min * 0.9 && value <= max * 1.1) return 'partial';
      return 'non_compliant';
    }
    
    if (min !== null && value < min) return 'non_compliant';
    if (max !== null && value > max) return 'non_compliant';
    
    return 'compliant';
  }
}

/**
 * Registry untuk global access (untuk tab switching dari HTML onclick).
 * Setiap subclass mendaftarkan instance-nya di sini.
 */
if (typeof window !== 'undefined') {
  window._inspectionControllers = window._inspectionControllers || {};
}

export default BaseInspection;
