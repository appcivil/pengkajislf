/**
 * FILE MANAGER COMPONENTS
 * Reusable UI templates for the Project Files management.
 */
import { escHtml } from '../lib/utils.js';

/**
 * Sidebar Categories
 */
export function renderFileSidebar(categories, activeCat) {
  return `
    <aside class="fm-sidebar" style="width:260px; background:var(--bg-100); padding:var(--space-4); display:flex; flex-direction:column; gap:var(--space-2); border-right:1px solid var(--border-subtle)">
      <div style="font-size:0.7rem; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:var(--space-2); padding:0 var(--space-4)">Folder Berkas SIMBG</div>
      ${categories.map(cat => {
        const isActive = activeCat === cat.id;
        return `
          <button class="fm-nav-item ${isActive ? 'active' : ''}" 
                  id="fm-nav-${cat.id}" 
                  onclick="window._changePageFolder('${cat.id}')">
            <i class="fas ${cat.icon}" style="width:20px; text-align:center"></i>
            <span>${cat.label}</span>
          </button>
        `;
      }).join('')}
    </aside>
  `;
}

/**
 * File Grid & Search Toolbar
 */
export function renderFileMain(proyek, activeCatLabel, searchQuery, isSyncing, syncProgress) {
  return `
    <main class="fm-main" style="flex:1; display:flex; flex-direction:column; position:relative">
      
      <!-- Sync Progress Overlay (Real-time) -->
      ${isSyncing ? `
        <div class="sync-overlay" style="position:absolute; top:0; left:0; width:100%; height:4px; z-index:100; overflow:hidden">
           <div class="sync-bar" style="height:100%; width:${syncProgress}%; background:var(--brand-500); transition: width 0.3s ease; box-shadow:0 0 10px rgba(59,95,217,0.5)"></div>
        </div>
      ` : ''}

      <header class="fm-toolbar" style="padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; background:white">
        <div class="fm-breadcrumb" style="font-size:0.875rem; font-weight:700">
           <span style="color:var(--text-tertiary)">Drive Proyek /</span> ${activeCatLabel}
        </div>
        
        <div style="display:flex; gap:12px; align-items:center">
           <div style="position:relative">
              <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-tertiary); font-size:0.8rem"></i>
              <input type="text" id="fm-search" placeholder="Cari dokumen..." 
                     oninput="window._handleSearch(this.value)" value="${searchQuery}"
                     style="padding: 10px 12px 10px 36px; border-radius: 12px; border: 1px solid var(--border-subtle); font-size: 0.85rem; width:240px; background:var(--bg-card)">
           </div>
           <button class="btn btn-primary btn-sm" onclick="window._openUploadModal()" id="btn-universal-upload">
              <i class="fas fa-cloud-upload-alt"></i> Unggah Berkas
           </button>
        </div>
      </header>

      <div class="fm-grid" id="fm-page-grid" style="flex:1; padding:var(--space-6); overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:var(--space-4); align-content:start">
         <!-- Rendered by Grid function -->
      </div>
    </main>
  `;
}

/**
 * File Item Card Renderer
 */
export function renderFileGrid(files, catItems, search) {
  if (files.length === 0 && (!catItems || catItems.length === 0)) {
     return `<div class="empty-state" style="grid-column:1/-1; text-align:center; padding:var(--space-12)">
        <i class="fas fa-folder-open" style="font-size:3rem; color:var(--text-tertiary); opacity:0.3"></i>
        <p>Belum ada data integrasi tersimpan.</p>
     </div>`;
  }

  // Files from DB
  const fileCards = files.map(file => {
    const isImage = file?.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    return `
      <div class="fm-file-card ready" onclick="window._quickLookFile('${file.id}')">
        <div class="fm-file-icon ${isImage ? 'image' : ''}" style="width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--bg-100); color:var(--text-tertiary)">
           <i class="fas ${isImage ? 'fa-file-image' : 'fa-file-pdf'}" style="font-size:1.5rem"></i>
        </div>
        <div class="fm-file-info" style="flex:1; overflow:hidden">
           <div class="fm-file-name" title="${file.subcategory}">${file.subcategory}</div>
           <div class="fm-file-meta" style="font-size:0.7rem; color:var(--text-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escHtml(file.name)}</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
           <span class="badge ${file.ai_status === 'Ready' ? 'badge-success' : 'badge-info'}" style="font-size:0.6rem">${file.ai_status || 'Ready'}</span>
           <div style="display:flex; gap:4px">
             <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); window.open('${file.file_url}', '_blank')" title="Buka di Tab Baru">
               <i class="fas fa-external-link-alt"></i>
             </button>
             <button class="btn btn-ghost btn-xs text-danger" onclick="event.stopPropagation(); window._deletePageFile('${file.id}')" title="Hapus">
               <i class="fas fa-trash"></i>
             </button>
           </div>
        </div>
      </div>
    `;
  }).join('');

  // Checklist of required items for this category
  const checklistHtml = (catItems || []).length > 0 ? `
    <div style="grid-column:1 / -1; margin-bottom:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:12px; padding:16px">
       <div style="font-size:0.7rem; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:12px; letter-spacing:0.02em">
          <i class="fas fa-info-circle" style="color:var(--brand-500); margin-right:6px"></i> Checklist Kelengkapan SIMBG
       </div>
       <div style="display:flex; gap:8px; flex-wrap:wrap">
          ${catItems.map(item => {
             const uploaded = files.some(f => f.subcategory === item);
             return `<span class="badge" style="background:${uploaded ? 'hsla(160,65%,46%,0.08)' : 'white'}; border:1px solid ${uploaded ? 'hsla(160,65%,46%,0.2)' : 'var(--border-subtle)'}; color:${uploaded ? 'var(--success-500)' : 'var(--text-tertiary)'}; font-size:0.72rem; padding:4px 10px">
                <i class="fas ${uploaded ? 'fa-check-circle' : 'fa-clock'}"></i> ${item}
             </span>`;
          }).join('')}
       </div>
    </div>
  ` : '';

  return checklistHtml + fileCards;
}
