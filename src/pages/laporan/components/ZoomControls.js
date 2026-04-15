// ============================================================
//  COMPONENT: ZoomControls
//  Kontrol zoom floating untuk DOCX preview
// ============================================================

export function renderZoomControls(zoom = 100) {
  return `
    <div class="zoom-controls-container">
      <button class="zoom-btn zoom-out" onclick="window._zoomOut()" title="Zoom Out">
        <i class="fas fa-minus"></i>
      </button>
      
      <span class="zoom-level" id="zoom-display">${zoom}%</span>
      
      <button class="zoom-btn zoom-in" onclick="window._zoomIn()" title="Zoom In">
        <i class="fas fa-plus"></i>
      </button>
      
      <button class="zoom-btn zoom-fit" onclick="window._fitWidth()" title="Fit Width">
        <i class="fas fa-compress-arrows-alt"></i>
      </button>
    </div>
  `;
}
