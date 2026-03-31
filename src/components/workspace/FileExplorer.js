/**
 * WORKSPACE FILE EXPLORER
 * Supports adaptive grid, list, and column views.
 */
import { store, updateWorkspace } from '../../lib/store.js';
import { escHtml } from '../../lib/utils.js';

export function renderFileExplorer() {
  const { files, workspace } = store.get();
  
  const filtered = (files.documents || []).filter(f => {
    // 1. Strict Project Filter (If in project context)
    if (workspace.selectedProjectId && f.proyek_id !== workspace.selectedProjectId) return false;

    // 2. Search Filter
    if (workspace.searchQuery) {
       const q = workspace.searchQuery.toLowerCase();
       const projName = f.proyek?.nama_bangunan || '';
       if (!f.name?.toLowerCase().includes(q) && 
           !f.subcategory?.toLowerCase().includes(q) && 
           !projName.toLowerCase().includes(q) &&
           !(f.ai_summary && f.ai_summary.toLowerCase().includes(q))) return false;
    }
    
    // 3. Smart Filters & Buckets
    if (workspace.smartFilter) {
       if (workspace.smartFilter === 'incomplete' && f.completeness >= 90) return false;
       if (workspace.smartFilter === 'review' && f.status !== 'In Review') return false;
       if (workspace.smartFilter === 'final' && f.status !== 'Final') return false;
       
       const categories = ['umum','tanah','arsitektur','struktur','mep','lapangan'];
       if (categories.includes(workspace.smartFilter) && f.category !== workspace.smartFilter) return false;
    }
    
    return true;
  });

  if (workspace.viewMode === 'list') {
    return renderListView(filtered, workspace.selectedFileId);
  } else if (workspace.viewMode === 'columns') {
    return renderColumnView(filtered, workspace.selectedFileId);
  } else {
    return renderGridView(filtered, workspace.selectedFileId);
  }
}

function renderGridView(files, selectedId) {
  if (files.length === 0) return emptyState();

  return `
    <div class="drive-grid" style="grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:16px; padding:20px; overflow-y:auto; flex:1">
      ${files.map(f => {
        const isSelected = f.id === selectedId;
        const icon = getFileIcon(f.name);
        
        return `
          <div class="folder-card ${isSelected ? 'active shadow-lg' : ''}" 
               style="position:relative; cursor:pointer" 
               onclick="window._handleWorkspaceSelect('${f.id}')"
               role="button"
               aria-label="File: ${escHtml(f.subcategory || f.name)}"
               tabindex="0"
               ondblclick="window.open('${f.file_url}', '_blank')">
            <div class="fm-file-icon has-file ${icon.cls}" style="width:64px; height:80px; margin-bottom:8px">
               <i class="fas ${icon.icon}"></i>
            </div>
            <div class="folder-name truncate" style="font-weight:700; font-size:0.75rem; width:100%; text-align:center">${escHtml(f.subcategory || 'File')}</div>
            <div class="text-xs text-tertiary truncate" style="font-size:0.65rem; width:100%; text-align:center">${escHtml(f.name)}</div>
            
            ${!store.get().workspace.selectedProjectId ? `
               <div class="text-xs text-brand-500 font-bold truncate mt-1" style="font-size:0.6rem; width:100%; text-align:center">
                  <i class="fas fa-building text-[0.55rem]"></i> ${escHtml(f.proyek?.nama_bangunan || 'Global')}
               </div>
            ` : ''}

            <div class="flex-center gap-1 mt-1">
               <div class="status-dot ${f.status === 'Final' ? 'green' : f.status === 'Needs Revision' ? 'red' : 'yellow'}" title="Status: ${f.status}"></div>
               <span style="font-size:0.6rem; font-weight:800; color:var(--tertiary)">${f.completeness || 0}%</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderListView(files, selectedId) {
  if (files.length === 0) return emptyState();

  return `
    <div class="list-view" style="flex:1; overflow-y:auto">
       <table style="width:100%; border-collapse: collapse; font-size: 0.8rem">
          <thead style="position:sticky; top:0; background:white; z-index:10; border-bottom:1px solid var(--border)">
             <tr style="text-align:left; color:var(--tertiary); font-weight:800; text-transform:uppercase; font-size:0.65rem">
                <th style="padding:12px; width:40px"></th>
                <th style="padding:12px">Nama File</th>
                ${!store.get().workspace.selectedProjectId ? '<th style="padding:12px">Proyek</th>' : ''}
                <th style="padding:12px">Status</th>
                <th style="padding:12px">Kelengkapan</th>
                <th style="padding:12px">Kategori</th>
                <th style="padding:12px">Tanggal</th>
             </tr>
          </thead>
          <tbody>
             ${files.map(f => {
                const isSelected = f.id === selectedId;
                const icon = getFileIcon(f.name);
                return `
                  <tr class="${isSelected ? 'bg-accent-bg' : ''} hover:bg-gray-50 cursor-pointer" 
                      onclick="window._handleWorkspaceSelect('${f.id}')"
                      role="button"
                      aria-label="File: ${escHtml(f.subcategory || f.name)}"
                      tabindex="0"
                      ondblclick="window.open('${f.file_url}', '_blank')"
                      style="border-bottom:1px solid var(--border); transition: 0.1s">
                     <td style="padding:8px 12px; text-align:center">
                        <i class="fas ${icon.icon}" style="opacity:0.6; color:#007aff"></i>
                     </td>
                     <td style="padding:8px 12px">
                        <div class="font-bold">${escHtml(f.subcategory)}</div>
                        <div class="text-xs text-tertiary">${escHtml(f.name)}</div>
                     </td>
                     ${!store.get().workspace.selectedProjectId ? `
                        <td style="padding:8px 12px">
                           <div class="flex items-center gap-2">
                              <i class="fas fa-building text-brand-500 opacity-0.6"></i>
                              <span class="font-bold text-xs">${escHtml(f.proyek?.nama_bangunan || 'Global')}</span>
                           </div>
                        </td>
                     ` : ''}
                     <td style="padding:8px 12px">
                        <span class="badge ${f.status === 'Final' ? 'badge-success' : 'badge-warning'}" style="font-size:0.6rem">${f.status || 'Draft'}</span>
                     </td>
                     <td style="padding:8px 12px">
                        <div class="flex items-center gap-2">
                           <div class="progress-wrap" style="width:60px; height:6px"><div class="progress-fill ${f.completeness > 80 ? 'green' : 'yellow'}" style="width:${f.completeness}%"></div></div>
                           <span class="font-bold" style="font-size:0.65rem">${f.completeness}%</span>
                        </div>
                     </td>
                     <td style="padding:8px 12px; opacity:0.6">${f.category}</td>
                     <td style="padding:8px 12px; opacity:0.6">${new Date(f.created_at).toLocaleDateString()}</td>
                  </tr>
                `;
             }).join('')}
          </tbody>
       </table>
    </div>
  `;
}

function renderColumnView(files, selectedId) {
  if (files.length === 0) return emptyState();

  return `
    <div class="column-view animate-fade-in" style="display:flex; height:100%; overflow-x:auto; background:white">
       <!-- Col 1: Categories -->
       <div style="width:200px; border-right:1px solid var(--border); overflow-y:auto">
          <div class="p-2 text-xs text-tertiary font-bold uppercase">Buckets</div>
          ${['umum','tanah','arsitektur','struktur','mep','lapangan'].map(c => `
            <div class="p-2 px-3 hover:bg-brand-50 cursor-pointer flex-between text-sm" onclick="window._handleWorkspaceNav('smart', '${c}')">
               <span>${c.charAt(0).toUpperCase() + c.slice(1)}</span>
               <i class="fas fa-chevron-right opacity-0.2"></i>
            </div>
          `).join('')}
       </div>
       
       <!-- Col 2: Files in Selected Category -->
       <div style="width:300px; border-right:1px solid var(--border); overflow-y:auto">
          <div class="p-2 text-xs text-tertiary font-bold uppercase">Files</div>
          ${files.map(f => `
            <div class="p-2 px-3 hover:bg-brand-50 cursor-pointer flex-between text-sm ${f.id === selectedId ? 'bg-brand-50 font-bold border-right' : ''}" 
                 onclick="window._handleWorkspaceSelect('${f.id}')">
               <div class="flex items-center gap-2 truncate">
                  <i class="fas ${getFileIcon(f.name).icon} opacity-0.5" style="color:#007aff"></i>
                  <span class="truncate">${escHtml(f.subcategory)}</span>
               </div>
               <i class="fas fa-chevron-right opacity-0.2"></i>
            </div>
          `).join('')}
       </div>

       <!-- Col 3: Quick Preview (Dynamic) -->
       <div style="flex:1; background:#f9fafb; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px">
          ${selectedId ? `
             <div class="animate-slide-in text-center">
                <i class="fas ${getFileIcon(files.find(f=>f.id===selectedId)?.name).icon} text-5xl mb-4 opacity-0.2"></i>
                <h3 class="font-bold">${escHtml(files.find(f=>f.id===selectedId)?.subcategory)}</h3>
                <p class="text-xs text-tertiary mb-6">${files.find(f=>f.id===selectedId)?.name}</p>
                <button class="btn btn-primary btn-sm" onclick="window._openQuickLook('${selectedId}')">Quick Look (Space)</button>
             </div>
          ` : `
             <i class="fas fa-columns text-4xl opacity-0.1 mb-3"></i>
             <p class="text-xs opacity-0.4">Select a file to preview</p>
          `}
       </div>
    </div>
  `;
}

function emptyState() {
  return `
    <div class="flex-center flex-column" style="flex:1; gap:16px; opacity:0.5">
       <i class="fas fa-search" style="font-size:3rem"></i>
       <p class="font-bold">Tidak ada file ditemukan</p>
       <button class="btn btn-ghost btn-sm" onclick="window._handleWorkspaceNav('smart')">Lihat Semua File</button>
    </div>
  `;
}

function getFileIcon(filename) {
  const isImage = filename?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const isPdf = filename?.toLowerCase().endsWith('.pdf');
  if (isImage) return { icon: 'fa-file-image', cls: 'image' };
  if (isPdf) return { icon: 'fa-file-pdf', cls: 'pdf' };
  return { icon: 'fa-file', cls: '' };
}

window._handleWorkspaceSelect = (id) => {
  updateWorkspace({ selectedFileId: id });
  // Handle Inspector Update via store notification
};
