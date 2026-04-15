// ============================================================
//  COMPONENT: NavigationPane
//  Panel navigasi dokumen untuk DOCX preview
// ============================================================

export function renderNavigationPane(headings = []) {
  if (!headings || headings.length === 0) {
    return `
      <div class="nav-empty">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>Loading document structure...</span>
      </div>
    `;
  }

  return `
    <div class="nav-tree">
      ${headings.map((h, idx) => `
        <div class="nav-item nav-level-${h.level || 1}" 
             data-target="${h.id || `heading-${idx}`}"
             onclick="window._navigateToHeading('${h.id || `heading-${idx}`}')">
          <span class="nav-bullet"></span>
          <span class="nav-text">${escapeHtml(h.text?.substring(0, 50) || 'Untitled')}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
