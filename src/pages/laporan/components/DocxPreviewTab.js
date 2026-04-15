// ============================================================
//  COMPONENT: DocxPreviewTab
//  Tab utama untuk DOCX Live Preview dengan desain Word Web
// ============================================================

export function renderDocxPreviewTab(proyek) {
  return `
    <div class="docx-preview-container">
      
      <!-- Loading State -->
      <div id="docx-preview-loading" class="preview-loading">
        <div class="loading-content">
          <div class="loading-icon">
            <i class="fas fa-file-word"></i>
          </div>
          <div class="loading-text">
            <h3>Generating DOCX Preview</h3>
            <p>Merender dokumen Word A4...</p>
          </div>
          <div class="loading-bar">
            <div class="loading-progress"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div id="docx-preview-error" class="preview-error" style="display:none;">
        <div class="error-content">
          <i class="fas fa-triangle-exclamation"></i>
          <h3>Preview Tidak Tersedia</h3>
          <p id="docx-preview-error-msg"></p>
          <button onclick="window._retryPreview()" class="btn-retry">
            <i class="fas fa-rotate"></i> Coba Lagi
          </button>
        </div>
      </div>

      <!-- Main Preview Container (Word Web Style) -->
      <div id="docx-render-container" class="docx-render-container" style="display:none;">
        
        <!-- Navigation Sidebar -->
        <div id="docx-nav-sidebar" class="nav-sidebar">
          <div class="nav-header">
            <i class="fas fa-sitemap"></i>
            <span>Navigation</span>
            <button onclick="window._toggleNavPane()" class="btn-toggle-nav" title="Sembunyikan">
              <i class="fas fa-chevron-left"></i>
            </button>
          </div>
          <div id="docx-nav-list" class="nav-content">
            <div class="nav-placeholder">
              <i class="fas fa-circle-notch fa-spin"></i>
              <span>Loading document structure...</span>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div id="docx-main-content" class="main-content">
          <!-- A4 Page Container -->
          <div id="docx-page-container" class="page-container">
            <div id="docx-render-target" class="render-target"></div>
          </div>
          <div class="page-spacer"></div>
        </div>

        <!-- Nav Toggle Button (when hidden) -->
        <button id="docx-nav-toggle" onclick="window._toggleNavPane()" class="nav-toggle-btn" style="display:none;" title="Tampilkan Navigation">
          <i class="fas fa-chevron-right"></i>
        </button>

        <!-- Floating Zoom Controls -->
        <div class="zoom-controls">
          <button onclick="window._docxZoomOut()" class="zoom-btn" title="Zoom Out">
            <i class="fas fa-minus"></i>
          </button>
          <span id="docx-zoom-level" class="zoom-level">100%</span>
          <button onclick="window._docxZoomIn()" class="zoom-btn" title="Zoom In">
            <i class="fas fa-plus"></i>
          </button>
          <button onclick="window._docxFitWidth()" class="zoom-btn zoom-fit" title="Fit Width">
            <i class="fas fa-compress-arrows-alt"></i>
          </button>
        </div>

      </div>
    </div>

    <style>
      .docx-preview-container {
        height: calc(100vh - 140px);
        background: #f0f0f0;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
      }

      /* Loading State */
      .preview-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      }

      .loading-content {
        text-align: center;
        color: white;
      }

      .loading-icon {
        font-size: 4rem;
        color: #3b82f6;
        margin-bottom: 24px;
        animation: pulse 1.5s ease-in-out infinite;
      }

      .loading-text h3 {
        font-size: 1.5rem;
        margin-bottom: 8px;
      }

      .loading-text p {
        color: #94a3b8;
        font-size: 0.9rem;
      }

      .loading-bar {
        width: 200px;
        height: 4px;
        background: rgba(255,255,255,0.1);
        border-radius: 2px;
        margin-top: 24px;
        overflow: hidden;
      }

      .loading-progress {
        height: 100%;
        background: #3b82f6;
        border-radius: 2px;
        animation: loading 1.5s ease-in-out infinite;
      }

      @keyframes loading {
        0% { width: 0%; margin-left: 0%; }
        50% { width: 30%; margin-left: 0%; }
        100% { width: 0%; margin-left: 100%; }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.95); }
      }

      /* Error State */
      .preview-error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      }

      .error-content {
        text-align: center;
        color: white;
        padding: 40px;
      }

      .error-content i {
        font-size: 4rem;
        color: #f59e0b;
        margin-bottom: 24px;
      }

      .error-content h3 {
        font-size: 1.3rem;
        margin-bottom: 12px;
      }

      .error-content p {
        color: #94a3b8;
        margin-bottom: 24px;
        max-width: 400px;
      }

      .btn-retry {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
      }

      .btn-retry:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.3);
      }

      /* Main Render Container */
      .docx-render-container {
        height: 100%;
        width: 100%;
        position: relative;
        overflow: hidden;
        font-family: 'Segoe UI', Arial, sans-serif;
        display: flex;
      }

      /* Navigation Sidebar */
      .nav-sidebar {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 280px;
        background: #f8f9fa;
        border-right: 1px solid #dee2e6;
        display: flex;
        flex-direction: column;
        z-index: 10;
      }

      .nav-header {
        background: #e9ecef;
        border-bottom: 1px solid #dee2e6;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .nav-header i {
        color: #6c757d;
        font-size: 0.9rem;
      }

      .nav-header span {
        font-weight: 600;
        font-size: 0.75rem;
        color: #495057;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex: 1;
      }

      .btn-toggle-nav {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        font-size: 0.7rem;
      }

      .btn-toggle-nav:hover {
        background: rgba(0,0,0,0.05);
      }

      .nav-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
      }

      .nav-placeholder {
        text-align: center;
        padding: 40px 20px;
        color: #adb5bd;
        font-size: 0.85rem;
      }

      .nav-placeholder i {
        margin-right: 8px;
        opacity: 0.6;
      }

      /* Navigation Tree */
      .docx-nav-tree {
        padding: 8px 0;
      }

      .nav-item {
        padding: 8px 16px 8px 24px;
        cursor: pointer;
        font-size: 0.85rem;
        color: #495057;
        border-left: 3px solid transparent;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .nav-item:hover {
        background: #e9ecef;
        border-left-color: #adb5bd;
      }

      .nav-item.active {
        background: #e7f3ff;
        border-left-color: #3b82f6;
        color: #1d4ed8;
      }

      .nav-level-1 { padding-left: 16px; font-weight: 600; }
      .nav-level-2 { padding-left: 32px; }
      .nav-level-3 { padding-left: 48px; font-size: 0.8rem; }
      .nav-level-4 { padding-left: 64px; font-size: 0.78rem; color: #6c757d; }

      .nav-bullet {
        width: 6px;
        height: 6px;
        background: #adb5bd;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .nav-item.active .nav-bullet {
        background: #3b82f6;
      }

      .nav-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Main Content */
      .main-content {
        position: absolute;
        left: 280px;
        top: 0;
        right: 0;
        bottom: 0;
        overflow: auto;
        background: #e9ecef;
        padding: 24px;
        transition: left 0.3s ease;
      }

      .main-content.nav-hidden {
        left: 0;
      }

      /* A4 Page */
      .page-container {
        max-width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        transform-origin: top center;
        transition: transform 0.2s ease;
      }

      .render-target {
        padding: 20mm;
        min-height: 257mm;
      }

      .page-spacer {
        height: 40px;
      }

      /* Nav Toggle Button */
      .nav-toggle-btn {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        background: #e9ecef;
        border: 1px solid #dee2e6;
        border-left: none;
        padding: 12px 8px;
        cursor: pointer;
        z-index: 20;
        border-radius: 0 4px 4px 0;
        color: #6c757d;
        font-size: 0.7rem;
      }

      .nav-toggle-btn:hover {
        background: #dee2e6;
      }

      /* Zoom Controls */
      .zoom-controls {
        position: absolute;
        bottom: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 4px;
        background: white;
        border-radius: 8px;
        padding: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border: 1px solid #e9ecef;
        z-index: 30;
      }

      .zoom-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 4px;
        color: #6c757d;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
      }

      .zoom-btn:hover {
        background: #e9ecef;
        color: #495057;
      }

      .zoom-fit {
        border-left: 1px solid #dee2e6;
        margin-left: 4px;
        padding-left: 8px;
      }

      .zoom-level {
        min-width: 50px;
        text-align: center;
        font-size: 0.85rem;
        color: #495057;
        font-weight: 500;
        user-select: none;
      }

      /* DOCX Render Output Styles */
      .docx-render-output {
        font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #333;
      }

      .docx-render-output h1 {
        font-size: 16pt;
        font-weight: bold;
        margin: 24pt 0 12pt 0;
        color: #1a1a2e;
      }

      .docx-render-output h2 {
        font-size: 14pt;
        font-weight: bold;
        margin: 18pt 0 9pt 0;
        color: #1e3a8a;
      }

      .docx-render-output h3 {
        font-size: 12pt;
        font-weight: bold;
        margin: 12pt 0 6pt 0;
        color: #374151;
      }

      .docx-render-output p {
        margin: 6pt 0;
        text-align: justify;
      }

      .docx-render-output table {
        width: 100%;
        border-collapse: collapse;
        margin: 12pt 0;
      }

      .docx-render-output td,
      .docx-render-output th {
        border: 1px solid #d1d5db;
        padding: 6pt;
        text-align: left;
      }

      .docx-render-output th {
        background: #f1f5f9;
        font-weight: bold;
      }
    </style>
  `;
}
