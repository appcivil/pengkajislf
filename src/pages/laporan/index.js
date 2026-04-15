// ============================================================
// LAPORAN PAGE - Clean Rebuild
// ============================================================

import { supabase } from '../../lib/supabase.js';
import { navigate } from '../../lib/router.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';
import { fetchAllOutlineData } from './services/laporanService.js';
import { aggregateOutlineData } from './utils/outlineAggregator.js';
import { useDocxPreview } from './hooks/useDocxPreview.js';

// Import CSS
import './laporan.css';

// ============================================================
// COMPONENTS
// ============================================================

function SkeletonLoading() {
  return `
    <div class="page-laporan">
      <div class="skeleton-header"></div>
      <div class="skeleton-content">
        <div class="skeleton-sidebar"></div>
        <div class="skeleton-main"></div>
      </div>
    </div>
  `;
}

function ErrorState(message) {
  return `
    <div style="padding: 40px; text-align: center;">
      <i class="fas fa-triangle-exclamation" style="font-size: 3rem; color: var(--warning-400); margin-bottom: 16px;"></i>
      <h3 style="color: white; margin-bottom: 8px;">Gagal Memuat Laporan</h3>
      <p style="color: var(--text-tertiary);">${message}</p>
      <button onclick="navigate('proyek')" class="btn-primary" style="margin-top: 20px;">
        Kembali ke Daftar Proyek
      </button>
    </div>
  `;
}

function ControlBar(proyek, data) {
  const summary = data.summary || {};
  const hasAiEnhancement = summary.hasSimulations;
  
  return `
    <div class="control-bar">
      <div class="control-left">
        <div class="brand-icon">
          <i class="fas fa-file-word"></i>
        </div>
        <div class="brand-text">
          <div class="brand-title">
            DOCX LIVE PREVIEW
            <span class="pipeline-badge ${hasAiEnhancement ? 'ai-active' : ''}">
              <i class="fas ${hasAiEnhancement ? 'fa-robot' : 'fa-circle'}"></i>
              ${hasAiEnhancement ? 'AI-Enhanced' : 'Standard'}
            </span>
          </div>
          <div class="brand-subtitle">
            Render identik dengan format Microsoft Word A4
            ${summary.totalSections ? `• ${summary.totalSections} sections loaded` : ''}
          </div>
        </div>
      </div>
      
      <div class="control-right">
        <button onclick="window._refreshPreview()" class="btn-control">
          <i class="fas fa-arrows-rotate"></i>
          <span>Refresh</span>
        </button>
        
        <button onclick="window._applyTTE()" class="btn-control btn-primary">
          <i class="fas fa-signature"></i>
          <span>TTE</span>
        </button>
        
        <div class="dropdown">
          <button onclick="window._toggleExportMenu()" class="btn-control btn-ai">
            <i class="fas fa-robot"></i>
            <span>Export</span>
            <i class="fas fa-chevron-down" style="margin-left:4px; font-size:10px;"></i>
          </button>
          <div id="export-dropdown" class="dropdown-menu">
            <button onclick="window._exportDOCX()" class="dropdown-item">
              <i class="fas fa-file-word" style="color:#3b82f6;"></i>
              <span>Export DOCX</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function PreviewContainer() {
  return `
    <div class="preview-wrapper">
      <!-- Loading State -->
      <div id="docx-preview-loading" class="preview-loading">
        <div style="text-align: center; color: white;">
          <div style="font-size: 4rem; color: #3b82f6; margin-bottom: 24px; animation: pulse 1.5s ease-in-out infinite;">
            <i class="fas fa-file-word"></i>
          </div>
          <h3 style="font-size: 1.5rem; margin-bottom: 8px;">Generating DOCX Preview</h3>
          <p style="color: #94a3b8; font-size: 0.9rem;">Merender dokumen Word A4...</p>
        </div>
      </div>

      <!-- Error State -->
      <div id="docx-preview-error" class="preview-error">
        <div style="text-align: center; color: white; padding: 40px;">
          <i class="fas fa-triangle-exclamation" style="font-size:4rem; color:#f59e0b; margin-bottom:24px;"></i>
          <h3 style="font-size:1.3rem; margin-bottom:12px;">Preview Tidak Tersedia</h3>
          <p id="docx-preview-error-msg" style="color:#94a3b8; margin-bottom:24px; max-width:400px;"></p>
          <button onclick="window._retryPreview()" class="btn-control">
            <i class="fas fa-rotate"></i> Coba Lagi
          </button>
        </div>
      </div>

      <!-- Main Preview -->
      <div id="docx-render-container" class="docx-render-container">
        <!-- Navigation Sidebar -->
        <div id="docx-nav-sidebar" class="nav-sidebar">
          <div class="nav-header">
            <i class="fas fa-sitemap" style="color:#6c757d; font-size:0.9rem;"></i>
            <span style="font-weight:600; font-size:0.75rem; color:#495057; text-transform:uppercase; letter-spacing:0.5px; flex:1;">Navigation</span>
          </div>
          <div id="docx-nav-list" class="nav-content">
            <div style="text-align:center; padding:40px 20px; color:#adb5bd; font-size:0.85rem;">
              <i class="fas fa-circle-notch fa-spin" style="margin-right:8px; opacity:0.6;"></i>
              Loading document structure...
            </div>
          </div>
        </div>
        
        <!-- Main Content -->
        <div id="docx-main-content" class="main-content">
          <div id="docx-page-container" class="page-container">
            <div id="docx-render-target" class="render-target"></div>
          </div>
          <div style="height:40px;"></div>
        </div>
        
        <!-- Zoom Controls -->
        <div class="zoom-controls">
          <button onclick="window._docxZoomOut()" class="zoom-btn">
            <i class="fas fa-minus"></i>
          </button>
          <span id="docx-zoom-level" class="zoom-level">100%</span>
          <button onclick="window._docxZoomIn()" class="zoom-btn">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// GLOBAL HANDLERS
// ============================================================

window._toggleExportMenu = () => {
  const menu = document.getElementById('export-dropdown');
  const btn = document.querySelector('.btn-ai');
  
  if (!menu) return;
  
  if (menu.classList.contains('show')) {
    menu.classList.remove('show');
    return;
  }
  
  // Position dropdown relative to button
  if (btn) {
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 8) + 'px';
    menu.style.left = (rect.left + rect.width / 2) + 'px';
    menu.style.transform = 'translateX(-50%)';
    menu.style.zIndex = '99999';
  }
  
  menu.classList.add('show');
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

// ============================================================
// MAIN PAGE
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

  // Show skeleton
  root.innerHTML = SkeletonLoading();

  try {
    console.log('[LaporanPage] Fetching data...');
    const outlineData = await fetchAllOutlineData(id);
    
    if (!outlineData.proyek) {
      root.innerHTML = ErrorState('Data proyek tidak ditemukan');
      return;
    }

    const aggregatedData = aggregateOutlineData(outlineData) || {
      summary: { totalSections: 0, hasSimulations: false }
    };

    // Build page
    root.innerHTML = `
      <div class="laporan-container">
        ${ControlBar(outlineData.proyek, aggregatedData)}
        ${PreviewContainer()}
      </div>
    `;

    console.log('[LaporanPage] Page rendered');
    
    // Debug: Check DOM elements
    setTimeout(() => {
      const container = document.getElementById('docx-render-container');
      const navSidebar = document.getElementById('docx-nav-sidebar');
      const navList = document.getElementById('docx-nav-list');
      const dropdown = document.getElementById('export-dropdown');
      
      console.log('[LaporanPage] DOM Debug:', {
        container: {
          exists: !!container,
          display: container?.style.display,
          visible: container?.offsetWidth > 0
        },
        navSidebar: {
          exists: !!navSidebar,
          width: navSidebar?.offsetWidth,
          left: navSidebar?.offsetLeft
        },
        navList: {
          exists: !!navList
        },
        dropdown: {
          exists: !!dropdown,
          parentZIndex: dropdown?.parentElement?.style.zIndex
        }
      });
    }, 1000);

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
    root.innerHTML = ErrorState(err.message || 'Terjadi kesalahan');
  }
}

export default laporanPage;
