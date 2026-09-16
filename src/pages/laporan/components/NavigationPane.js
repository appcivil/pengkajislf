import { escapeHtml } from '../../../lib/safe-markdown.js';
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
        <div class="nav-item nav-level-${escapeHtml(h.level || 1)}" 
             data-target="${escapeHtml(h.id || `heading-${escapeHtml(idx)}`)}"
             onclick="window._navigateToHeading('${escapeHtml(h.id || `heading-${escapeHtml(idx)}`)}')">
          <span class="nav-bullet"></span>
          <span class="nav-text">${escapeHtml(h.text?.substring(0, 50) || 'Untitled')}</span>
        </div>
      `).join('')}
    </div>
  `;
}

