// ============================================================
//  LAPORAN PAGE - STABLE FRONTEND RENDERING
//  Menggunakan DocumentFragment untuk render yang stabil
// ============================================================

import { supabase } from '../../lib/supabase.js';
import { navigate } from '../../lib/router.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';
import { generateDocxBlob } from '../../lib/docx-service.js';
import { getPipelineLaporanIntegration } from '../../infrastructure/pipeline/pipeline-laporan-integration.js';
import { fetchAllOutlineData } from './services/laporanService.js';
import { aggregateOutlineData } from './utils/outlineAggregator.js';
import { useDocxPreview } from './hooks/useDocxPreview.js';

// ============================================================
// STABLE DOM RENDERING UTILITIES
// ============================================================

/**
 * Membuat elemen dengan atribut dan children
 * Lebih stabil daripada innerHTML
 */
function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  
  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  // Append children
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });
  
  return el;
}

/**
 * Mount component ke container menggunakan DocumentFragment
 * Lebih stabil dan atomic daripada innerHTML
 */
function mountComponent(container, componentFn, data) {
  // Create fragment untuk batch insert
  const fragment = document.createDocumentFragment();
  
  // Buat wrapper untuk menerima HTML string dari component
  const wrapper = document.createElement('div');
  wrapper.innerHTML = componentFn(data);
  
  // Transfer semua children ke fragment
  while (wrapper.firstChild) {
    fragment.appendChild(wrapper.firstChild);
  }
  
  // Atomic insert
  container.appendChild(fragment);
  
  return container;
}

/**
 * Render skeleton loading state
 */
function renderSkeleton() {
  return createElement('div', { class: 'page-laporan' }, [
    createElement('div', { class: 'skeleton-header' }),
    createElement('div', { class: 'skeleton-content' }, [
      createElement('div', { class: 'skeleton-sidebar' }),
      createElement('div', { class: 'skeleton-main' })
    ]),
    createElement('style', {}, [`
      .page-laporan { padding: 24px; }
      .skeleton-header { height: 60px; background: hsla(220,20%,100%,0.05); border-radius: 12px; margin-bottom: 20px; animation: pulse 1.5s ease-in-out infinite; }
      .skeleton-content { display: grid; grid-template-columns: 280px 1fr; gap: 20px; height: calc(100vh - 140px); }
      .skeleton-sidebar { background: hsla(220,20%,100%,0.03); border-radius: 12px; animation: pulse 1.5s ease-in-out infinite; }
      .skeleton-main { background: hsla(220,20%,100%,0.03); border-radius: 12px; animation: pulse 1.5s ease-in-out infinite 0.2s; }
      @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
    `])
  ]);
}

/**
 * Render error state
 */
function renderErrorState(message) {
  return createElement('div', { 
    style: { padding: '40px', textAlign: 'center' } 
  }, [
    createElement('i', { 
      class: 'fas fa-triangle-exclamation',
      style: { fontSize: '3rem', color: 'var(--warning-400)', marginBottom: '16px' }
    }),
    createElement('h3', { style: { color: 'white', marginBottom: '8px' } }, ['Gagal Memuat Laporan']),
    createElement('p', { style: { color: 'var(--text-tertiary)' } }, [message]),
    createElement('button', {
      class: 'btn-primary',
      style: { marginTop: '20px' },
      onclick: () => navigate('proyek')
    }, ['Kembali ke Daftar Proyek'])
  ]);
}

// ============================================================
// COMPONENT RENDERERS (Stable String-based)
// ============================================================

function renderControlBarStable(proyek, data) {
  const summary = data.summary || {};
  const hasAiEnhancement = summary.hasSimulations;
  
  return `
    <div class="control-bar" style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: hsla(224,25%,4%,0.6);
      border: 1px solid hsla(220,20%,100%,0.05);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    ">
      <div class="control-left" style="display: flex; align-items: center; gap: 16px;">
        <div class="brand-icon" style="
          width: 44px;
          height: 44px;
          background: hsla(210,95%,52%,0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          border: 1px solid hsla(210,95%,52%,0.25);
          font-size: 1.2rem;
        ">
          <i class="fas fa-file-word"></i>
        </div>
        <div class="brand-text" style="display: flex; flex-direction: column; gap: 2px;">
          <div class="brand-title" style="
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
          ">
            DOCX LIVE PREVIEW
            <span class="pipeline-badge ${hasAiEnhancement ? 'ai-active' : ''}" style="
              padding: 2px 8px;
              border-radius: 4px;
              background: ${hasAiEnhancement ? 'hsla(210,95%,52%,0.2)' : 'hsla(220,20%,100%,0.1)'};
              color: ${hasAiEnhancement ? '#60a5fa' : 'var(--text-tertiary)'};
              font-family: var(--font-mono);
              font-size: 8px;
              letter-spacing: 1px;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <i class="fas ${hasAiEnhancement ? 'fa-robot' : 'fa-circle'}"></i>
              ${hasAiEnhancement ? 'AI-Enhanced' : 'Standard'}
            </span>
          </div>
          <div class="brand-subtitle" style="
            font-family: var(--font-mono);
            font-size: 9px;
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 1px;
          ">
            Render identik dengan format Microsoft Word A4
            ${summary.totalSections ? `• ${summary.totalSections} sections loaded` : ''}
          </div>
        </div>
      </div>
      
      <div class="control-right" style="display: flex; align-items: center; gap: 8px;">
        <button onclick="window._refreshPreview()" class="btn-control" title="Refresh Preview" style="
          height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1px solid hsla(220,20%,100%,0.1);
          background: hsla(220,20%,100%,0.05);
          color: white;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        ">
          <i class="fas fa-arrows-rotate"></i>
          <span>Refresh</span>
        </button>
        
        <button onclick="window._applyTTE()" class="btn-control btn-primary" title="Terapkan TTE" style="
          height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px hsla(210,95%,52%,0.25);
          transition: all 0.2s;
        ">
          <i class="fas fa-signature"></i>
          <span>TTE</span>
        </button>
        
        <div class="dropdown" style="position: relative; z-index: 2000;">
          <button onclick="window._toggleExportMenu()" class="btn-control btn-ai" style="
            height: 40px;
            padding: 0 16px;
            border-radius: 10px;
            border: 1px solid hsla(210,95%,52%,0.25);
            background: hsla(210,95%,52%,0.15);
            color: #60a5fa;
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
          ">
            <i class="fas fa-robot"></i>
            <span>Export</span>
            <i class="fas fa-chevron-down" style="margin-left:4px;font-size:10px;"></i>
          </button>
          <div id="export-dropdown" class="dropdown-menu" style="
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            background: hsla(224,25%,8%,0.98);
            border: 1px solid hsla(220,20%,100%,0.1);
            border-radius: 10px;
            padding: 8px;
            min-width: 200px;
            z-index: 2001;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          ">
            <button onclick="window._exportDOCX()" class="dropdown-item" style="
              width: 100%;
              padding: 10px 12px;
              border: none;
              background: transparent;
              color: white;
              font-family: var(--font-mono);
              font-size: 12px;
              cursor: pointer;
              text-align: left;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 10px;
              transition: background 0.15s;
            ">
              <i class="fas fa-file-word" style="color:#3b82f6;"></i>
              <span>Export DOCX</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPreviewStable(proyek) {
  return `
    <div class="docx-preview-container" style="
      flex: 1;
      min-height: 0;
      background: #f0f0f0;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    ">
      <!-- Loading State -->
      <div id="docx-preview-loading" class="preview-loading" style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      ">
        <div style="text-align: center; color: white;">
          <div style="font-size: 4rem; color: #3b82f6; margin-bottom: 24px; animation: pulse 1.5s ease-in-out infinite;">
            <i class="fas fa-file-word"></i>
          </div>
          <h3 style="font-size: 1.5rem; margin-bottom: 8px;">Generating DOCX Preview</h3>
          <p style="color: #94a3b8; font-size: 0.9rem;">Merender dokumen Word A4...</p>
          <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 24px; overflow: hidden;">
            <div style="height: 100%; background: #3b82f6; border-radius: 2px; animation: loading 1.5s ease-in-out infinite;"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div id="docx-preview-error" class="preview-error" style="display:none; align-items:center; justify-content:center; height:100%; background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);">
        <div style="text-align: center; color: white; padding: 40px;">
          <i class="fas fa-triangle-exclamation" style="font-size:4rem;color:#f59e0b;margin-bottom:24px;"></i>
          <h3 style="font-size:1.3rem;margin-bottom:12px;">Preview Tidak Tersedia</h3>
          <p id="docx-preview-error-msg" style="color:#94a3b8;margin-bottom:24px;max-width:400px;"></p>
          <button onclick="window._retryPreview()" style="background:transparent;border:1px solid rgba(255,255,255,0.2);color:white;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:0.9rem;transition:all 0.2s;">
            <i class="fas fa-rotate"></i> Coba Lagi
          </button>
        </div>
      </div>

      <!-- Main Preview Container -->
      <div id="docx-render-container" class="docx-render-container" style="display:none; height:100%; width:100%; position:absolute; top:0; left:0; overflow:hidden; font-family:'Segoe UI',Arial,sans-serif;">
        <div id="docx-nav-sidebar" class="nav-sidebar" style="position:absolute;left:0;top:0;bottom:0;width:280px;background:#f8f9fa;border-right:1px solid #dee2e6;display:flex;flex-direction:column;z-index:10;">
          <div style="background:#e9ecef;border-bottom:1px solid #dee2e6;padding:12px 16px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-sitemap" style="color:#6c757d;font-size:0.9rem;"></i>
            <span style="font-weight:600;font-size:0.75rem;color:#495057;text-transform:uppercase;letter-spacing:0.5px;flex:1;">Navigation</span>
          </div>
          <div id="docx-nav-list" style="flex:1;overflow-y:auto;padding:8px 0;">
            <div style="text-align:center;padding:40px 20px;color:#adb5bd;font-size:0.85rem;">
              <i class="fas fa-circle-notch fa-spin" style="margin-right:8px;opacity:0.6;"></i>
              Loading document structure...
            </div>
          </div>
        </div>
        <div id="docx-main-content" style="position:absolute;left:280px;top:0;right:0;bottom:0;overflow-y:auto;overflow-x:hidden;background:#e9ecef;padding:24px;transition:left 0.3s ease; -webkit-overflow-scrolling: touch;">
          <div id="docx-page-container" style="max-width:210mm;min-height:297mm;margin:0 auto;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.12);transform-origin:top center;transition:transform 0.2s ease; overflow: visible;">
            <div id="docx-render-target" style="padding:20mm;min-height:257mm; overflow: visible;"></div>
          </div>
          <div style="height:40px; flex-shrink: 0;"></div>
        </div>
        <div style="position:absolute;bottom:20px;right:20px;display:flex;align-items:center;gap:4px;background:white;border-radius:8px;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1px solid #e9ecef;z-index:30;">
          <button onclick="window._docxZoomOut()" style="width:32px;height:32px;border:none;background:transparent;cursor:pointer;border-radius:4px;color:#6c757d;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
            <i class="fas fa-minus"></i>
          </button>
          <span id="docx-zoom-level" style="min-width:50px;text-align:center;font-size:0.85rem;color:#495057;font-weight:500;user-select:none;">100%</span>
          <button onclick="window._docxZoomIn()" style="width:32px;height:32px;border:none;background:transparent;cursor:pointer;border-radius:4px;color:#6c757d;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
    <style>
      @keyframes loading { 0% { width: 0%; margin-left: 0%; } 50% { width: 30%; margin-left: 0%; } 100% { width: 0%; margin-left: 100%; } }
      @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }
    </style>
  `;
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export async function laporanPage(params = {}) {
  const id = params.id;
  if (!id) { 
    navigate('proyek'); 
    return; 
  }

  const root = document.getElementById('page-root');
  if (!root) {
    console.error('[LaporanPage] Root element not found');
    return;
  }

  // Show skeleton immediately
  root.innerHTML = '';
  root.appendChild(renderSkeleton());

  try {
    console.log('[LaporanPage] Fetching data for project:', id);
    const outlineData = await fetchAllOutlineData(id);
    
    if (!outlineData.proyek) {
      console.error('[LaporanPage] Project data is null');
      root.innerHTML = '';
      root.appendChild(renderErrorState('Data proyek tidak ditemukan'));
      return;
    }

    const aggregatedData = aggregateOutlineData(outlineData) || {
      electrical: null, struktur: null, egress: null, environmental: null,
      lps: null, fireProtection: null, buildingIntensity: null, architectural: null,
      etabs: null, archSim: null, pathfinder: null, fireDesigner: null,
      summary: { totalSections: 0, sections: [], hasSimulations: false, hasFullAnalysis: false }
    };

    console.log('[LaporanPage] Building page with DocumentFragment...');
    
    // Clear skeleton
    root.innerHTML = '';
    
    // Build page using DocumentFragment for atomic render
    const fragment = document.createDocumentFragment();
    
    // Create container
    const container = createElement('div', {
      class: 'laporan-container',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative'
      }
    });
    
    // Mount components
    mountComponent(container, () => renderControlBarStable(outlineData.proyek, aggregatedData), null);
    mountComponent(container, () => renderPreviewStable(outlineData.proyek), null);
    
    fragment.appendChild(container);
    root.appendChild(fragment);
    
    console.log('[LaporanPage] Page mounted to DOM');
    
    // Wait for DOM stabilization
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify container
    const previewContainer = document.getElementById('docx-render-container');
    console.log('[LaporanPage] Container verification:', { exists: !!previewContainer });
    
    if (!previewContainer) {
      console.error('[LaporanPage] Container not found after mount');
      showError('Gagal memuat preview container');
      return;
    }
    
    // Initialize preview engine
    const previewEngine = useDocxPreview({
      containerId: 'docx-render-container',
      navContainerId: 'docx-nav-list',
      onError: (err) => {
        console.error('[PreviewEngine] Error:', err);
        showError('Preview Error: ' + err.message);
      },
      onSuccess: () => {
        console.log('[PreviewEngine] Success');
        showSuccess('DOCX Preview siap');
      }
    });

    // Store globally
    window._laporanPreviewEngine = previewEngine;
    window._laporanData = { proyek: outlineData.proyek, aggregatedData };

    // Generate preview
    console.log('[LaporanPage] Generating preview...');
    await previewEngine.generateAndPreview(
      outlineData.proyek,
      outlineData.analisis || {},
      outlineData.checklist || [],
      aggregatedData
    );
    
  } catch (err) {
    console.error('[LaporanPage] Error:', err);
    root.innerHTML = '';
    root.appendChild(renderErrorState(err.message || 'Terjadi kesalahan'));
  }
}

// ============================================================
// GLOBAL HANDLERS
// ============================================================

window._toggleExportMenu = () => {
  const menu = document.getElementById('export-dropdown');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
};

window._exportDOCX = async () => {
  const engine = window._laporanPreviewEngine;
  const data = window._laporanData;
  if (!engine || !data) return;
  
  const blob = engine.getBlob();
  if (!blob) {
    showError('DOCX belum siap. Tunggu preview selesai.');
    return;
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Kajian_${data.proyek.nama?.replace(/\s+/g, '_') || 'Proyek'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showSuccess('DOCX berhasil diunduh!');
};

window._refreshPreview = async () => {
  const engine = window._laporanPreviewEngine;
  const data = window._laporanData;
  if (engine && data) {
    showInfo('Memperbarui preview...');
    await engine.generateAndPreview(
      data.proyek,
      data.aggregatedData.analisis || {},
      data.aggregatedData.checklist || [],
      data.aggregatedData
    );
  }
};

window._retryPreview = () => window._refreshPreview();
window._applyTTE = () => showInfo('Fitur TTE dalam pengembangan');
window._docxZoomIn = () => window._laporanPreviewEngine?.zoomIn();
window._docxZoomOut = () => window._laporanPreviewEngine?.zoomOut();

export default laporanPage;
