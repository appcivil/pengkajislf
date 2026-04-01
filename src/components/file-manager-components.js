/**
 * FILE MANAGER COMPONENTS
 * Reusable UI templates for the Project Files management.
 * Quartz Premium Edition (Dark Mode)
 */
import { escHtml } from '../lib/utils.js';

/**
 * Sidebar Categories
 */
export function renderFileSidebar(categories, activeCat) {
  return `
    <aside class="fm-sidebar" style="width:260px; background:hsla(220, 20%, 100%, 0.02); padding:var(--space-6); display:flex; flex-direction:column; gap:var(--space-2); border-right:1px solid hsla(220, 20%, 100%, 0.05)">
      <div style="font-family:var(--font-mono); font-size:0.75rem; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:var(--space-6); padding:0 var(--space-2); letter-spacing:1.5px">
        <i class="fas fa-layer-group" style="margin-right:8px; color:var(--brand-400)"></i> Data Repository
      </div>
      ${categories.map(cat => {
        const isActive = activeCat === cat.id;
        return `
          <button class="fm-nav-item ${isActive ? 'active' : ''}" 
                  id="fm-nav-${cat.id}" 
                  onclick="window._changePageFolder('${cat.id}')"
                  style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; border:none; background:${isActive ? 'hsla(220, 95%, 52%, 0.1)' : 'transparent'}; color:${isActive ? 'white' : 'var(--text-secondary)'}; cursor:pointer; transition:all 0.3s; width:100%; text-align:left; font-weight:${isActive ? '700' : '500'}">
            <i class="fas ${cat.icon}" style="width:20px; font-size:0.9rem; color:${isActive ? 'var(--brand-400)' : 'var(--text-tertiary)'}"></i>
            <span style="font-size:0.85rem">${cat.label}</span>
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
    <main class="fm-main" style="flex:1; display:flex; flex-direction:column; position:relative; background:var(--gradient-dark)">
      
      <!-- Sync Progress Overlay (Real-time) -->
      ${isSyncing ? `
        <div class="sync-overlay" style="position:absolute; top:0; left:0; width:100%; height:3px; z-index:100; overflow:hidden">
           <div class="sync-bar" style="height:100%; width:${syncProgress}%; background:var(--gradient-brand); transition: width 0.3s ease; box-shadow:0 0 10px var(--brand-500)"></div>
        </div>
      ` : ''}

      <header class="fm-toolbar" style="padding:var(--space-4) var(--space-8); border-bottom:1px solid hsla(220, 20%, 100%, 0.05); display:flex; justify-content:space-between; align-items:center; backdrop-filter:blur(10px); background:hsla(220, 20%, 5%, 0.4)">
        <div class="fm-breadcrumb" style="font-family:'Outfit', sans-serif; font-size:1rem; font-weight:800; color:white">
           <span style="color:var(--text-tertiary); font-weight:400">Library /</span> ${activeCatLabel}
        </div>
        
        <div style="display:flex; gap:16px; align-items:center">
           <div style="position:relative">
              <i class="fas fa-search" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--text-tertiary); font-size:0.8rem"></i>
              <input type="text" id="fm-search" placeholder="Cari rujukan..." 
                     oninput="window._handleSearch(this.value)" value="${searchQuery || ''}"
                     style="padding: 12px 16px 12px 42px; border-radius: 12px; border: 1px solid hsla(220, 20%, 100%, 0.1); font-size: 0.85rem; width:280px; background:hsla(220, 20%, 100%, 0.05); color:white; outline:none; transition:border-color 0.3s">
           </div>
           <button class="btn btn-primary" onclick="window._openUploadModal()" id="btn-universal-upload" style="border-radius:12px; height:44px; padding:0 20px; font-weight:700">
              <i class="fas fa-paperclip" style="margin-right:8px"></i> Lampirkan
           </button>
        </div>
      </header>

      <div class="fm-grid" id="fm-page-grid" style="flex:1; padding:var(--space-8); overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:var(--space-6); align-content:start">
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
     return `<div class="empty-state" style="grid-column:1/-1; text-align:center; padding:var(--space-12); opacity:0.5">
        <i class="fas fa-folder-open" style="font-size:3.5rem; color:var(--text-tertiary); margin-bottom:20px"></i>
        <p style="font-family:'Outfit', sans-serif; font-weight:600">Arsip Dokumentasi Kosong</p>
     </div>`;
  }

  // Files from DB
  const fileCards = files.map(file => {
    const isImage = file?.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    return `
      <div class="card-quartz clickable fm-file-card ready" onclick="window._quickLookFile('${file.id}')" style="padding:var(--space-4); display:flex; align-items:center; gap:var(--space-4); animation: fade-in-up 0.5s ease-out">
        <div class="fm-file-icon ${isImage ? 'image' : ''}" style="width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:hsla(220, 20%, 100%, 0.05); color:${isImage ? 'var(--brand-400)' : 'var(--danger-400)'}; border:1px solid hsla(220, 20%, 100%, 0.05)">
           <i class="fas ${isImage ? 'fa-file-image' : 'fa-file-pdf'}" style="font-size:1.6rem"></i>
        </div>
        <div class="fm-file-info" style="flex:1; overflow:hidden">
           <div class="fm-file-name" title="${file.subcategory}" style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.9rem; color:white; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${file.subcategory}</div>
           <div class="fm-file-meta" style="font-family:var(--font-mono); font-size:0.65rem; color:var(--text-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escHtml(file.name)}</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px">
           <span class="badge" style="font-size:9px; background:hsla(220, 95%, 52%, 0.1); border:1px solid hsla(220, 95%, 52%, 0.2); color:var(--brand-300); font-weight:800">${file.ai_status || 'READY'}</span>
           <div style="display:flex; gap:6px">
             <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); window.open('${file.file_url}', '_blank')" title="Buka di Tab Baru" style="padding:6px">
               <i class="fas fa-external-link-alt" style="font-size:0.75rem"></i>
             </button>
             <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); window._deletePageFile('${file.id}')" title="Hapus" style="color:var(--danger-400); padding:6px">
               <i class="fas fa-trash-can" style="font-size:0.75rem"></i>
             </button>
           </div>
        </div>
      </div>
    `;
  }).join('');

  // Checklist of required items for this category
  const checklistHtml = (catItems || []).length > 0 ? `
    <div style="grid-column:1 / -1; margin-bottom:24px; background:hsla(220, 20%, 100%, 0.02); border:1px dashed hsla(220, 20%, 100%, 0.1); border-radius:16px; padding:24px">
       <div style="font-family:var(--font-mono); font-size:0.75rem; font-weight:800; color:var(--gold-400); text-transform:uppercase; margin-bottom:16px; letter-spacing:1.5px">
          <i class="fas fa-shield-halved" style="margin-right:8px"></i> Matrix Kelengkapan SIMBG
       </div>
       <div style="display:flex; gap:10px; flex-wrap:wrap">
          ${catItems.map(item => {
             const uploaded = files.some(f => f.subcategory === item);
             return `
               <div style="background:${uploaded ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(220, 20%, 100%, 0.03)'}; border:1px solid ${uploaded ? 'hsla(158, 85%, 45%, 0.2)' : 'hsla(220, 20%, 100%, 0.06)'}; color:${uploaded ? 'var(--success-400)' : 'var(--text-tertiary)'}; font-size:0.75rem; padding:6px 14px; border-radius:30px; display:flex; align-items:center; gap:8px; font-weight:700">
                  <i class="fas ${uploaded ? 'fa-circle-check' : 'fa-circle-notch'}" style="${uploaded ? '' : 'opacity:0.4'}"></i> ${item}
               </div>`;
          }).join('')}
       </div>
    </div>
  ` : '';

  return checklistHtml + fileCards;
}

