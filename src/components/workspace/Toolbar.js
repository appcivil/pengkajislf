/**
 * WORKSPACE TOOLBAR
 * Breadcrumbs, view controls, and global search.
 */
import { store, updateWorkspace, updateUI } from '../../lib/store.js';

import { escapeHtml } from '../../lib/safe-markdown.js';
export function renderToolbar() {
  const { workspace, ui } = store.get();
  
  return `
    <header class="drive-toolbar">
      <div class="drive-breadcrumb" id="workspace-crumbs">
         <span class="crumb active">AI File Nexus</span>
         <i class="fas fa-chevron-right" style="font-size:0.6rem; opacity:0.3" aria-hidden="true"></i>
         <span class="crumb">${escapeHtml(workspace.activeView)}</span>
      </div>
      
      <div style="display:flex; gap:16px; align-items:center; flex:1; justify-content:flex-end">
         <!-- View Switcher -->
         <div class="flex bg-secondary p-1 rounded-lg" style="background:#f2f2f7; gap:2px" role="group" aria-label="Mode Tampilan">
            <button class="btn btn-ghost btn-xs ${workspace.viewMode === 'grid' ? 'active shadow-sm bg-white' : ''}" 
                    onclick="window._changeViewMode('grid')"
                    aria-label="Grid View"
                    title="Grid View">
               <i class="fas fa-th-large"></i>
            </button>
            <button class="btn btn-ghost btn-xs ${workspace.viewMode === 'list' ? 'active shadow-sm bg-white' : ''}" 
                    onclick="window._changeViewMode('list')"
                    aria-label="Tampilan Daftar"
                    title="Tampilan Daftar">
               <i class="fas fa-list"></i>
            </button>
            <button class="btn btn-ghost btn-xs ${workspace.viewMode === 'columns' ? 'active shadow-sm bg-white' : ''}" 
                    onclick="window._changeViewMode('columns')"
                    aria-label="Tampilan Kolom"
                    title="Tampilan Kolom">
               <i class="fas fa-columns"></i>
            </button>
         </div>

         <!-- Search -->
         <div class="drive-search" style="width:240px">
            <i class="fas fa-search" aria-hidden="true"></i>
            <input type="text" placeholder="Cari file, isi, atau analisis..." 
                   id="workspace-search-input"
                   aria-label="Search documents"
                   oninput="window._handleWorkspaceSearch(this.value)" 
                   value="${escapeHtml(workspace.searchQuery || '')}">
         </div>

         <!-- Actions -->
         <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" style="border-radius:6px; font-weight:700" onclick="window._openCommandPalette()" aria-label="Open Command Palette" title="Command Palette (Ctrl+K)">
               <i class="fas fa-terminal"></i>
            </button>
            <button class="btn btn-primary btn-sm" style="border-radius:6px; font-weight:700" onclick="window._openUploadWorkspace()" aria-label="Unggah Berkas Baru" title="Unggah Dokumen">
               <i class="fas fa-plus"></i> Upload
            </button>
            <button class="btn btn-ghost btn-sm" style="border-radius:6px" 
                    onclick="window._toggleInspector()"
                    aria-label="Toggle Intelligence Panel"
                    title="Toggle Inspector">
               <i class="fas fa-info-circle ${ui.inspectorOpen ? 'text-brand-500' : ''}"></i>
            </button>
         </div>
      </div>
    </header>
  `;
}

window._changeViewMode = (mode) => {
  updateWorkspace({ viewMode: mode });
};

window._toggleInspector = () => {
  const { ui } = store.get();
  updateUI({ inspectorOpen: !ui.inspectorOpen });
};

let searchTimeout;
window._handleWorkspaceSearch = (val) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    updateWorkspace({ searchQuery: val });
  }, 300);
};

window._openCommandPalette = () => {
  // To be implemented in Task 5
  console.log("Command Palette Triggered");
};
