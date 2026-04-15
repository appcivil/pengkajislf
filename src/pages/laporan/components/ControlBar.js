// ============================================================
//  COMPONENT: ControlBar
//  Toolbar atas untuk kontrol DOCX Preview
// ============================================================

export function renderControlBar(proyek, data) {
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
        <!-- Refresh Button -->
        <button onclick="window._refreshPreview()" class="btn-control" title="Refresh Preview">
          <i class="fas fa-arrows-rotate"></i>
          <span>Refresh</span>
        </button>
        
        <!-- TTE Button -->
        <button onclick="window._applyTTE()" class="btn-control btn-primary" title="Terapkan TTE">
          <i class="fas fa-signature"></i>
          <span>TTE</span>
        </button>
        
        <!-- Export Dropdown -->
        <div class="dropdown">
          <button onclick="window._toggleExportMenu()" class="btn-control btn-ai">
            <i class="fas fa-robot"></i>
            <span>Export</span>
            <i class="fas fa-chevron-down" style="margin-left:4px;font-size:10px;"></i>
          </button>
          <div id="export-dropdown" class="dropdown-menu">
            <button onclick="window._exportDOCX()" class="dropdown-item">
              <i class="fas fa-file-word" style="color:#3b82f6;"></i>
              <span>Export DOCX</span>
            </button>
            <button onclick="window._exportXLSX()" class="dropdown-item">
              <i class="fas fa-file-excel" style="color:#22c55e;"></i>
              <span>Export XLSX</span>
            </button>
            <button onclick="window._exportPDF()" class="dropdown-item">
              <i class="fas fa-file-pdf" style="color:#ef4444;"></i>
              <span>Export PDF</span>
            </button>
            <div class="dropdown-divider"></div>
            <button onclick="window._printDocument()" class="dropdown-item">
              <i class="fas fa-print" style="color:#6b7280;"></i>
              <span>Print</span>
            </button>
          </div>
        </div>
        
        <!-- Template Buttons -->
        <button onclick="window._downloadTemplate()" class="btn-control" title="Download Template">
          <i class="fas fa-file-download"></i>
        </button>
        <button onclick="window._uploadTemplate()" class="btn-control" title="Upload Template">
          <i class="fas fa-file-upload"></i>
        </button>
        
        <div class="divider"></div>
        
        <!-- AI Analysis Buttons -->
        <button onclick="window._extractStructure()" class="btn-control btn-ai-feature" title="Extract Structure">
          <i class="fas fa-sitemap"></i>
        </button>
        <button onclick="window._generateSummary()" class="btn-control btn-ai-feature" title="AI Summary">
          <i class="fas fa-brain"></i>
        </button>
      </div>
    </div>
    
    <style>
      .control-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 24px;
        background: hsla(224,25%,4%,0.6);
        border: 1px solid hsla(220,20%,100%,0.05);
        border-radius: 12px;
        backdrop-filter: blur(10px);
      }

      .control-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .brand-icon {
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
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .brand-title {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 1rem;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .pipeline-badge {
        padding: 2px 8px;
        border-radius: 4px;
        background: hsla(220,20%,100%,0.1);
        color: var(--text-tertiary);
        font-family: var(--font-mono);
        font-size: 8px;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.3s;
      }

      .pipeline-badge.ai-active {
        background: hsla(210,95%,52%,0.2);
        color: #60a5fa;
      }

      .brand-subtitle {
        font-family: var(--font-mono);
        font-size: 9px;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .control-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-control {
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
      }

      .btn-control:hover {
        background: hsla(220,20%,100%,0.1);
        border-color: hsla(220,20%,100%,0.2);
      }

      .btn-control.btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border: none;
        box-shadow: 0 4px 12px hsla(210,95%,52%,0.25);
      }

      .btn-control.btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px hsla(210,95%,52%,0.35);
      }

      .btn-control.btn-ai {
        background: hsla(210,95%,52%,0.15);
        color: #60a5fa;
        border-color: hsla(210,95%,52%,0.25);
      }

      .btn-control.btn-ai:hover {
        background: hsla(210,95%,52%,0.25);
      }

      .btn-control.btn-ai-feature {
        width: 40px;
        padding: 0;
        justify-content: center;
        color: #a855f7;
        border-color: hsla(270,80%,60%,0.25);
        background: hsla(270,80%,60%,0.08);
      }

      .btn-control.btn-ai-feature:hover {
        background: hsla(270,80%,60%,0.15);
      }

      .divider {
        width: 1px;
        height: 24px;
        background: hsla(220,20%,100%,0.1);
        margin: 0 4px;
      }

      /* Dropdown */
      .dropdown {
        position: relative;
      }

      .dropdown-menu {
        display: none;
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: hsla(224,25%,8%,0.98);
        border: 1px solid hsla(220,20%,100%,0.1);
        border-radius: 10px;
        padding: 8px;
        min-width: 200px;
        z-index: 1000;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      }

      .dropdown-menu.show {
        display: block;
      }

      .dropdown-item {
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
      }

      .dropdown-item:hover {
        background: hsla(220,20%,100%,0.05);
      }

      .dropdown-divider {
        height: 1px;
        background: hsla(220,20%,100%,0.1);
        margin: 8px 0;
      }
    </style>
  `;
}
