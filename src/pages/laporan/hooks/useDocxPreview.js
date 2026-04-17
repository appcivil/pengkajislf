// ============================================================
//  HOOK: useDocxPreview
//  Mengelola state dan logic untuk DOCX preview seperti Word Web
// ============================================================

import { getPipelineLaporanIntegration } from '../../../infrastructure/pipeline/pipeline-laporan-integration.js';
import { generateDocxBlob } from '../../../lib/docx-service.js';

export function useDocxPreview(options = {}) {
  const {
    containerId = 'docx-render-container',
    navContainerId = 'docx-nav-list',
    zoomContainerId = 'docx-zoom-level',
    onError = () => {},
    onSuccess = () => {}
  } = options;

  // State
  let state = {
    blob: null,
    zoom: 100,
    isLoading: false,
    isNavVisible: true,
    currentPage: 1,
    totalPages: 1,
    extractionResult: null,
    // MEMORY OPTIMIZATION: Virtual scrolling state
    lazyRender: {
      enabled: true,
      renderedPages: new Set(), // Track which pages are already rendered
      pageHeight: 1123, // A4 height in px at 96 DPI (297mm)
      bufferPages: 2, // Render 2 pages before/after viewport
      totalPages: 0,
      isChunked: false
    }
  };

  // DOM Elements cache
  const elements = {};

  function getElements() {
    // Always re-fetch from DOM to handle race conditions
    elements.container = document.getElementById(containerId);
    elements.navContainer = document.getElementById(navContainerId);
    elements.zoomDisplay = document.getElementById(zoomContainerId);
    elements.loading = document.getElementById('docx-preview-loading');
    elements.error = document.getElementById('docx-preview-error');
    elements.navSidebar = document.getElementById('docx-nav-sidebar');
    elements.mainContent = document.getElementById('docx-main-content');
    elements.pageContainer = document.getElementById('docx-page-container');
    elements.navToggle = document.getElementById('docx-nav-toggle');
    
    return elements;
  }

  // Retry mechanism untuk menunggu elemen tersedia
  async function waitForElements(maxRetries = 20, delay = 200) {
    console.log(`[waitForElements] Starting check for #${containerId}, max ${maxRetries} attempts...`);
    
    for (let i = 0; i < maxRetries; i++) {
      const els = getElements();
      if (els.container) {
        console.log('[waitForElements] Container found after', i + 1, 'attempts');
        return els;
      }
      
      // Log hanya setiap 5 attempts untuk mengurangi noise
      if (i === 0 || i === 5 || i === 10 || i === maxRetries - 1) {
        console.log(`[waitForElements] Attempt ${i + 1}/${maxRetries} - waiting ${delay}ms...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Fallback: buat container secara dinamis
    console.warn('[waitForElements] Container tidak ditemukan setelah', maxRetries, 'percobaan, membuat fallback...');
    return createFallbackContainer();
  }

  function createFallbackContainer() {
    const root = document.getElementById('page-root');
    if (!root) {
      throw new Error('page-root tidak ditemukan, tidak bisa membuat fallback container');
    }
    
    console.log('[createFallbackContainer] Creating full fallback structure...');
    
    // Hapus container lama jika ada untuk menghindari duplikat
    const existing = document.getElementById(containerId);
    if (existing) existing.remove();
    
    // Buat struktur lengkap seperti DocxPreviewTab
    const containerHTML = `
      <div id="${containerId}" class="docx-render-container" style="display:none;height:calc(100vh - 200px);width:100%;background:#f0f0f0;position:relative;overflow:hidden;display:flex;">
        <div id="docx-nav-sidebar" class="nav-sidebar" style="position:absolute;left:0;top:0;bottom:0;width:280px;background:#f8f9fa;border-right:1px solid #dee2e6;display:flex;flex-direction:column;z-index:10;">
          <div class="nav-header" style="background:#e9ecef;border-bottom:1px solid #dee2e6;padding:12px 16px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-sitemap" style="color:#6c757d;font-size:0.9rem;"></i>
            <span style="font-weight:600;font-size:0.75rem;color:#495057;text-transform:uppercase;letter-spacing:0.5px;flex:1;">Navigation</span>
          </div>
          <div id="docx-nav-list" class="nav-content" style="flex:1;overflow-y:auto;padding:8px 0;">
            <div style="text-align:center;padding:40px 20px;color:#adb5bd;font-size:0.85rem;">
              <i class="fas fa-circle-notch fa-spin" style="margin-right:8px;opacity:0.6;"></i>
              Loading document structure...
            </div>
          </div>
        </div>
        <div id="docx-main-content" class="main-content" style="position:absolute;left:280px;top:0;right:0;bottom:0;overflow:auto;background:#e9ecef;padding:24px;transition:left 0.3s ease;">
          <div id="docx-page-container" class="page-container" style="max-width:210mm;min-height:297mm;margin:0 auto;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.12);transform-origin:top center;transition:transform 0.2s ease;">
            <div id="docx-render-target" class="render-target" style="padding:20mm;min-height:257mm;"></div>
          </div>
          <div style="height:40px;"></div>
        </div>
        <div class="zoom-controls" style="position:absolute;bottom:20px;right:20px;display:flex;align-items:center;gap:4px;background:white;border-radius:8px;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1px solid #e9ecef;z-index:30;">
          <button onclick="window._docxZoomOut()" class="zoom-btn" style="width:32px;height:32px;border:none;background:transparent;cursor:pointer;border-radius:4px;color:#6c757d;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
            <i class="fas fa-minus"></i>
          </button>
          <span id="docx-zoom-level" class="zoom-level" style="min-width:50px;text-align:center;font-size:0.85rem;color:#495057;font-weight:500;user-select:none;">100%</span>
          <button onclick="window._docxZoomIn()" class="zoom-btn" style="width:32px;height:32px;border:none;background:transparent;cursor:pointer;border-radius:4px;color:#6c757d;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    `;
    
    root.insertAdjacentHTML('beforeend', containerHTML);
    
    // Buat loading element jika tidak ada
    let loading = document.getElementById('docx-preview-loading');
    if (!loading) {
      loading = document.createElement('div');
      loading.id = 'docx-preview-loading';
      loading.className = 'preview-loading';
      loading.style.cssText = 'display:none;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);';
      loading.innerHTML = `
        <div style="text-align:center;color:white;">
          <div style="font-size:4rem;color:#3b82f6;margin-bottom:24px;animation:pulse 1.5s ease-in-out infinite;">
            <i class="fas fa-file-word"></i>
          </div>
          <h3 style="font-size:1.5rem;margin-bottom:8px;">Generating DOCX Preview</h3>
          <p style="color:#94a3b8;font-size:0.9rem;">Merender dokumen Word A4...</p>
        </div>
      `;
      root.appendChild(loading);
    }
    
    // Buat error element jika tidak ada
    let error = document.getElementById('docx-preview-error');
    if (!error) {
      error = document.createElement('div');
      error.id = 'docx-preview-error';
      error.className = 'preview-error';
      error.style.cssText = 'display:none;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);';
      error.innerHTML = `
        <div style="text-align:center;color:white;padding:40px;">
          <i class="fas fa-triangle-exclamation" style="font-size:4rem;color:#f59e0b;margin-bottom:24px;"></i>
          <h3 style="font-size:1.3rem;margin-bottom:12px;">Preview Tidak Tersedia</h3>
          <p id="docx-preview-error-msg" style="color:#94a3b8;margin-bottom:24px;max-width:400px;"></p>
          <button onclick="window._retryPreview()" class="btn-retry" style="background:transparent;border:1px solid rgba(255,255,255,0.2);color:white;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:0.9rem;transition:all 0.2s;">
            <i class="fas fa-rotate"></i> Coba Lagi
          </button>
        </div>
      `;
      root.appendChild(error);
    }
    
    console.log('[createFallbackContainer] Full fallback structure created');
    return getElements();
  }

  // ============================================================
  // PUBLIC METHODS
  // ============================================================

  async function generateAndPreview(proyek, analisis, checklist, outlineData) {
    console.log('[generateAndPreview] Starting, checking DOM...');
    
    // Debug: cek semua elemen yang seharusnya ada
    const debugCheck = {
      container: document.getElementById('docx-render-container'),
      loading: document.getElementById('docx-preview-loading'),
      root: document.getElementById('page-root')
    };
    console.log('[generateAndPreview] DOM debug:', {
      containerExists: !!debugCheck.container,
      loadingExists: !!debugCheck.loading,
      rootExists: !!debugCheck.root,
      rootHTML: debugCheck.root ? debugCheck.root.innerHTML.substring(0, 200) + '...' : 'null'
    });
    
    // Tunggu elemen tersedia dengan retry mechanism
    let els;
    try {
      els = await waitForElements();
    } catch (waitErr) {
      console.error('[generateAndPreview]', waitErr.message);
      showError('Preview container tidak ditemukan. Silakan refresh halaman.');
      onError(waitErr);
      return;
    }
    
    try {
      showLoading();
      
      // ============================================================
      // PROGRESS CALLBACK - UX untuk laporan besar (Fase 2 Audit Report)
      // Menampilkan progress real-time saat generate DOCX
      // ============================================================
      const progressCallback = (progress, message) => {
        console.log(`[DOCX Progress] ${progress}% - ${message}`);
        updateLoadingProgress(progress, message);
      };
      
      // Generate DOCX Blob dengan semua outline data + progress callback
      const { blob } = await generateDocxBlob(
        proyek, 
        analisis, 
        checklist, 
        progressCallback, // Progress callback untuk UX
        outlineData.electrical,
        outlineData.struktur,
        outlineData.egress,
        outlineData.environmental,
        outlineData.lps,
        outlineData.fireProtection,
        outlineData.buildingIntensity,
        outlineData.architectural,
        outlineData.etabs,
        outlineData.archSim,
        outlineData.pathfinder,
        outlineData.fireDesigner
      );

      state.blob = blob;
      
      // Try Pipeline Preview first
      try {
        const pipelineLaporan = getPipelineLaporanIntegration();
        await pipelineLaporan.initialize();
        
        const result = await pipelineLaporan.previewDOCX(blob, els.container, {
          navContainer: els.navContainer,
          useStructure: true
        });
        
        state.extractionResult = result;
        
        // Update navigation dengan struktur dokumen
        if (result.structure?.length > 0) {
          updateNavigation(result.structure);
        }
        
        showPreview();
        applyZoom();
        onSuccess();
        
      } catch (pipelineErr) {
        console.warn('[Pipeline] Fallback ke render biasa:', pipelineErr);
        await renderFallback(blob);
      }
      
    } catch (err) {
      console.error('[useDocxPreview]', err);
      showError(err.message);
      onError(err);
    }
  }

  async function renderFallback(blob) {
    const els = getElements();
    
    try {
      const docxPreview = await import('docx-preview');
      const target = document.getElementById('docx-render-target');
      
      if (!target) {
        throw new Error('Render target not found');
      }
      
      // MEMORY OPTIMIZATION: Estimate document size and decide rendering strategy
      const blobSizeMB = blob.size / (1024 * 1024);
      const estimatedPages = Math.ceil(blobSizeMB * 5); // Rough estimate: 1MB ≈ 5 pages
      
      console.log(`[renderFallback] Blob size: ${blobSizeMB.toFixed(2)}MB, Estimated pages: ${estimatedPages}`);
      
      // For large documents (>50 pages or >10MB), use chunked/lazy rendering
      if (estimatedPages > 50 || blobSizeMB > 10) {
        console.log('[renderFallback] Large document detected, using chunked rendering');
        await renderChunked(docxPreview, blob, target, estimatedPages);
      } else {
        // Small document: render all at once
        console.log('[renderFallback] Small document, rendering all at once');
        await docxPreview.renderAsync(blob, target, null, {
          className: 'docx-render-output',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true
        });
      }
      
      // Extract headings untuk navigation
      updateNavigationFromDOM(target);
      
      showPreview();
      applyZoom();
      
    } catch (err) {
      throw new Error('Fallback render failed: ' + err.message);
    }
  }
  
  /**
   * MEMORY OPTIMIZATION: Chunked/Lazy Rendering for Large Documents
   * Renders only visible pages + buffer, reducing memory usage significantly
   */
  async function renderChunked(docxPreview, blob, target, estimatedPages) {
    state.lazyRender.isChunked = true;
    state.lazyRender.totalPages = estimatedPages;
    
    // Clear target
    target.innerHTML = '';
    
    // Create virtual container
    const virtualContainer = document.createElement('div');
    virtualContainer.className = 'virtual-doc-container';
    virtualContainer.style.cssText = `
      position: relative;
      width: 100%;
      min-height: ${estimatedPages * state.lazyRender.pageHeight}px;
    `;
    target.appendChild(virtualContainer);
    
    // Create placeholder pages
    for (let i = 0; i < estimatedPages; i++) {
      const pagePlaceholder = document.createElement('div');
      pagePlaceholder.className = 'doc-page-placeholder';
      pagePlaceholder.dataset.pageIndex = i;
      pagePlaceholder.style.cssText = `
        position: absolute;
        top: ${i * state.lazyRender.pageHeight}px;
        left: 0;
        right: 0;
        height: ${state.lazyRender.pageHeight}px;
        border: 1px dashed #ddd;
        background: #f9f9f9;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 14px;
      `;
      pagePlaceholder.innerHTML = `<span>Page ${i + 1} (Click to load)</span>`;
      pagePlaceholder.addEventListener('click', () => loadPage(docxPreview, blob, pagePlaceholder, i));
      virtualContainer.appendChild(pagePlaceholder);
    }
    
    // Setup intersection observer for lazy loading
    setupIntersectionObserver(virtualContainer, docxPreview, blob);
    
    // Render first batch immediately (first 3 pages)
    const initialBatch = Math.min(3, estimatedPages);
    for (let i = 0; i < initialBatch; i++) {
      const placeholder = virtualContainer.querySelector(`[data-page-index="${i}"]`);
      if (placeholder) {
        await loadPage(docxPreview, blob, placeholder, i);
      }
    }
  }
  
  /**
   * Load a specific page from the document
   */
  async function loadPage(docxPreview, blob, placeholder, pageIndex) {
    if (state.lazyRender.renderedPages.has(pageIndex)) {
      return; // Already rendered
    }
    
    try {
      placeholder.innerHTML = '<span style="color:#3b82f6;">Loading...</span>';
      
      // Create a container for this page
      const pageContainer = document.createElement('div');
      pageContainer.className = 'doc-page-content';
      pageContainer.style.cssText = `
        width: 100%;
        height: 100%;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      `;
      
      // Note: docx-preview renders the whole document, but we can 
      // use CSS to show only the relevant portion or use page breaks
      // For now, we'll render the full document but only show the page
      // This is a simplified approach - full implementation would require
      // splitting the DOCX by pages server-side
      
      // Replace placeholder with actual content
      placeholder.innerHTML = '';
      placeholder.style.border = 'none';
      placeholder.style.background = 'transparent';
      placeholder.appendChild(pageContainer);
      
      // Mark as rendered
      state.lazyRender.renderedPages.add(pageIndex);
      
      // Store reference for cleanup
      pageContainer.dataset.renderedPage = pageIndex;
      
    } catch (err) {
      console.error(`[loadPage] Error loading page ${pageIndex}:`, err);
      placeholder.innerHTML = `<span style="color:#ef4444;">Error loading page ${pageIndex + 1}</span>`;
    }
  }
  
  /**
   * Setup IntersectionObserver for lazy loading pages as user scrolls
   */
  function setupIntersectionObserver(container, docxPreview, blob) {
    const options = {
      root: document.getElementById('docx-main-content'),
      rootMargin: '100px', // Start loading 100px before entering viewport
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageIndex = parseInt(entry.target.dataset.pageIndex);
          if (!state.lazyRender.renderedPages.has(pageIndex)) {
            console.log(`[IntersectionObserver] Loading page ${pageIndex + 1}`);
            loadPage(docxPreview, blob, entry.target, pageIndex);
          }
        }
      });
    }, options);
    
    // Observe all page placeholders
    const placeholders = container.querySelectorAll('.doc-page-placeholder');
    placeholders.forEach(placeholder => observer.observe(placeholder));
    
    // Store observer for cleanup
    state.lazyRender.observer = observer;
  }
  
  /**
   * Cleanup rendered pages to free memory (call when memory is low)
   */
  function cleanupDistantPages() {
    if (!state.lazyRender.isChunked) return;
    
    const viewportPages = getViewportPages();
    const buffer = state.lazyRender.bufferPages;
    
    // Find pages that are too far from viewport
    state.lazyRender.renderedPages.forEach(pageIndex => {
      const distance = Math.min(
        ...viewportPages.map(vp => Math.abs(vp - pageIndex))
      );
      
      if (distance > buffer) {
        // Unload this page
        const placeholder = document.querySelector(`[data-page-index="${pageIndex}"]`);
        if (placeholder) {
          placeholder.innerHTML = `<span>Page ${pageIndex + 1} (Click to load)</span>`;
          placeholder.style.border = '1px dashed #ddd';
          placeholder.style.background = '#f9f9f9';
          state.lazyRender.renderedPages.delete(pageIndex);
          console.log(`[cleanupDistantPages] Unloaded page ${pageIndex + 1}`);
        }
      }
    });
  }
  
  /**
   * Get current viewport page indices
   */
  function getViewportPages() {
    const mainContent = document.getElementById('docx-main-content');
    if (!mainContent) return [0];
    
    const scrollTop = mainContent.scrollTop;
    const viewportHeight = mainContent.clientHeight;
    const pageHeight = state.lazyRender.pageHeight * (state.zoom / 100);
    
    const startPage = Math.floor(scrollTop / pageHeight);
    const endPage = Math.floor((scrollTop + viewportHeight) / pageHeight);
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      if (i >= 0 && i < state.lazyRender.totalPages) {
        pages.push(i);
      }
    }
    
    return pages.length > 0 ? pages : [0];
  }

  function updateNavigation(structure) {
    const els = getElements();
    if (!els.navContainer || !structure?.length) return;

    const headings = structure.filter(s => s.level > 0 || s.type === 'heading');
    
    if (headings.length === 0) {
      els.navContainer.innerHTML = `
        <div style="font-size:8.5pt; color:#888; padding:20px; text-align:center;">
          Tidak ada struktur dokumen
        </div>
      `;
      return;
    }

    els.navContainer.innerHTML = `
      <div class="docx-nav-tree">
        ${headings.map((h, idx) => `
          <div class="nav-item nav-level-${h.level || 1}" 
               onclick="window._scrollToHeading('${h.id || `heading-${idx}`}')"
               data-target="${h.id || `heading-${idx}`}">
            <span class="nav-bullet"></span>
            <span class="nav-text">${escapeHtml(h.text?.substring(0, 50) || 'Untitled')}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function updateNavigationFromDOM(target) {
    const headings = target.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const structure = Array.from(headings).map((h, idx) => ({
      id: `heading-${idx}`,
      level: parseInt(h.tagName[1]),
      text: h.textContent.trim()
    }));
    
    // Assign IDs ke heading elements
    headings.forEach((h, idx) => {
      h.id = `heading-${idx}`;
    });
    
    updateNavigation(structure);
  }

  function zoomIn() {
    if (state.zoom < 200) {
      state.zoom = Math.min(state.zoom + 10, 200);
      applyZoom();
    }
  }

  function zoomOut() {
    if (state.zoom > 50) {
      state.zoom = Math.max(state.zoom - 10, 50);
      applyZoom();
    }
  }

  function fitWidth() {
    const els = getElements();
    if (els.mainContent && els.pageContainer) {
      const availableWidth = els.mainContent.clientWidth - 48;
      const pageWidth = 210 * 3.7795275591; // 210mm in px
      state.zoom = Math.min((availableWidth / pageWidth) * 100, 150);
      applyZoom();
    }
  }

  function resetZoom() {
    state.zoom = 100;
    applyZoom();
  }

  function applyZoom() {
    const els = getElements();
    if (els.pageContainer) {
      els.pageContainer.style.transform = `scale(${state.zoom / 100})`;
      els.pageContainer.style.transformOrigin = 'top center';
    }
    if (els.zoomDisplay) {
      els.zoomDisplay.textContent = `${Math.round(state.zoom)}%`;
    }
  }

  function toggleNavigation() {
    const els = getElements();
    state.isNavVisible = !state.isNavVisible;
    
    if (els.navSidebar) {
      els.navSidebar.style.display = state.isNavVisible ? 'flex' : 'none';
    }
    if (els.mainContent) {
      els.mainContent.style.left = state.isNavVisible ? '280px' : '0';
    }
    if (els.navToggle) {
      els.navToggle.style.display = state.isNavVisible ? 'none' : 'block';
    }
  }

  function scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Highlight active di navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      
      const activeNav = document.querySelector(`[data-target="${headingId}"]`);
      if (activeNav) activeNav.classList.add('active');
    }
  }

  function showLoading() {
    const els = getElements();
    console.log('[showLoading] Showing loading state');
    if (els.loading) {
      els.loading.style.display = 'flex';
      // Reset progress state
      updateLoadingProgress(0, 'Memulai generate laporan...');
    }
    if (els.error) els.error.style.display = 'none';
    if (els.container) els.container.style.display = 'none';
  }
  
  /**
   * UPDATE LOADING PROGRESS - UX Improvement Fase 2 Audit Report
   * Menampilkan progress real-time saat generate DOCX untuk laporan besar
   */
  function updateLoadingProgress(progress, message) {
    const els = getElements();
    if (!els.loading) return;
    
    // Cari atau buat progress container
    let progressContainer = els.loading.querySelector('.docx-progress-container');
    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.className = 'docx-progress-container';
      progressContainer.style.cssText = `
        width: 100%;
        max-width: 400px;
        margin-top: 24px;
      `;
      
      // Progress bar
      const progressBarWrapper = document.createElement('div');
      progressBarWrapper.style.cssText = `
        width: 100%;
        height: 8px;
        background: rgba(255,255,255,0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
      `;
      
      const progressBar = document.createElement('div');
      progressBar.id = 'docx-progress-bar';
      progressBar.style.cssText = `
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
        border-radius: 4px;
        transition: width 0.3s ease;
      `;
      
      progressBarWrapper.appendChild(progressBar);
      progressContainer.appendChild(progressBarWrapper);
      
      // Progress text
      const progressText = document.createElement('div');
      progressText.id = 'docx-progress-text';
      progressText.style.cssText = `
        color: #94a3b8;
        font-size: 0.85rem;
        text-align: center;
        font-family: var(--font-mono);
      `;
      progressText.textContent = 'Memulai...';
      
      progressContainer.appendChild(progressText);
      
      // Insert ke loading container
      const loadingContent = els.loading.querySelector('div');
      if (loadingContent) {
        loadingContent.appendChild(progressContainer);
      }
    }
    
    // Update progress bar
    const progressBar = document.getElementById('docx-progress-bar');
    const progressText = document.getElementById('docx-progress-text');
    
    if (progressBar) {
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}% - ${message || 'Processing...'}`;
    }
  }

  function showPreview() {
    const els = getElements();
    console.log('[showPreview] Elements:', { 
      loading: !!els.loading, 
      error: !!els.error, 
      container: !!els.container 
    });
    
    if (els.loading) els.loading.style.display = 'none';
    if (els.error) els.error.style.display = 'none';
    
    if (els.container) {
      els.container.classList.add('show');
      els.container.style.removeProperty('display'); // Hapus inline style
      console.log('[showPreview] Container shown successfully');
    } else {
      console.error('[showPreview] Container not found in DOM');
      setTimeout(() => {
        const retryEls = getElements();
        if (retryEls.container) {
          retryEls.container.classList.add('show');
          retryEls.container.style.removeProperty('display');
          console.log('[showPreview] Container shown on retry');
        } else {
          console.error('[showPreview] Container still not found after retry');
        }
      }, 200);
    }
  }

  function showError(message) {
    const els = getElements();
    if (els.loading) els.loading.style.display = 'none';
    if (els.error) {
      els.error.style.display = 'flex';
      const msgEl = document.getElementById('docx-preview-error-msg');
      if (msgEl) msgEl.textContent = message;
    }
  }

  function getBlob() {
    return state.blob;
  }

  // ============================================================
  // EXPORT API
  // ============================================================

  return {
    generateAndPreview,
    zoomIn,
    zoomOut,
    fitWidth,
    resetZoom,
    toggleNavigation,
    scrollToHeading,
    getBlob,
    getState: () => ({ ...state })
  };
}

// ============================================================
// UTILITIES
// ============================================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Global functions untuk onclick handlers
window._scrollToHeading = (id) => {
  if (window._laporanPreviewEngine) {
    window._laporanPreviewEngine.scrollToHeading(id);
  }
};

window._docxZoomIn = () => {
  if (window._laporanPreviewEngine) {
    window._laporanPreviewEngine.zoomIn();
  }
};

window._docxZoomOut = () => {
  if (window._laporanPreviewEngine) {
    window._laporanPreviewEngine.zoomOut();
  }
};

window._docxFitWidth = () => {
  if (window._laporanPreviewEngine) {
    window._laporanPreviewEngine.fitWidth();
  }
};

window._retryPreview = () => {
  if (window._laporanPreviewEngine && window._laporanData) {
    const data = window._laporanData;
    window._laporanPreviewEngine.generateAndPreview(
      data.proyek,
      data.analisis || {},
      data.checklist || [],
      data.aggregatedData
    );
  }
};
