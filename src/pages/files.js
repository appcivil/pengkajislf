// ============================================================
//  GLOBAL FILE REPOSITORY PAGE (SMART DRIVE GLOBAL)
//  A sophisticated, project-oriented cloud drive interface
//  Synchronized with SIMBG Folder Structure
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

export async function filesPage() {
  const root = document.getElementById('page-root');
  if (root) root.innerHTML = '<div class="p-8 text-center"><i class="fas fa-circle-notch fa-spin text-2xl"></i></div>';

  const SIMBG_CATEGORIES = [
    { id: 'umum', label: 'Data Umum', icon: 'fa-folder-open' },
    { id: 'tanah', label: 'Data Tanah & Lingkungan', icon: 'fa-map-marked-alt' },
    { id: 'arsitektur', label: 'Teknis Arsitektur', icon: 'fa-drafting-compass' },
    { id: 'struktur', label: 'Teknis Struktur', icon: 'fa-cubes' },
    { id: 'mep', label: 'Teknis MEP', icon: 'fa-bolt' },
    { id: 'lapangan', label: 'Data Pengujian & Lapangan', icon: 'fa-clipboard-check' }
  ];

  // 1. Load Data
  const [ { data: projects }, { data: allFiles } ] = await Promise.all([
    supabase.from('proyek').select('id, nama_bangunan, created_at, alamat').order('created_at', { ascending: false }),
    supabase.from('proyek_files').select('*, proyek(nama_bangunan)').order('created_at', { ascending: false })
  ]);
  
  window._allProjects = projects || [];
  window._allGlobalFiles = allFiles || [];
  window._currentView = window._currentView || 'projects'; // 'projects' | 'inner' | 'trash' | 'recent'
  window._selectedProject = window._selectedProject || null;
  window._selectedCategory = window._selectedCategory || 'umum';

  const html = `
    <style>
      .drive-layout { display: flex; height: calc(100vh - 180px); background: #fff; border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); }
      .drive-sidebar { width: 250px; background: #f8fafc; border-right: 1px solid var(--border-subtle); padding: 20px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
      .drive-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
      
      .drive-nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; color: #64748b; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: 0.2s; border: none; background: transparent; width: 100%; text-align: left; }
      .drive-nav-item:hover { background: #f1f5f9; color: #1e293b; }
      .drive-nav-item.active { background: #e0f2fe; color: #0284c7; }
      .sidebar-divider { height: 1px; background: #e2e8f0; margin: 15px 0; }
      .sidebar-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 0 14px 8px; }
      
      .drive-toolbar { padding: 16px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; gap: 20px; }
      .drive-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: #64748b; }
      .drive-breadcrumb .crumb { cursor: pointer; transition: 0.2s; }
      .drive-breadcrumb .crumb:hover { color: var(--brand-500); }
      .drive-breadcrumb .active { color: #1e293b; font-weight: 700; }
      
      .drive-search { position: relative; flex: 1; max-width: 400px; }
      .drive-search i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
      .drive-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-subtle); border-radius: 8px; font-size: 0.82rem; background: #f8fafc; }
      
      .drive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; padding: 24px; overflow-y: auto; flex: 1; align-content: start; }
      .folder-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: 0.2s; cursor: pointer; background: #fff; position: relative; }
      .folder-card:hover { border-color: #cbd5e1; transform: translateY(-3px); box-shadow: var(--shadow-sm); border-left: 4px solid #fbbf24; }
      .folder-icon { width: 44px; height: 36px; background: #fbbf24; border-radius: 4px 12px 4px 4px; position: relative; }
      .folder-icon::after { content: ''; position: absolute; top: -4px; left: 0; width: 15px; height: 6px; background: #fbbf24; border-radius: 3px 3px 0 0; }
      .folder-name { font-size: 0.85rem; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .folder-meta { font-size: 0.7rem; color: #94a3b8; }
      .fm-file-card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: 0.2s; position: relative; background: #fff; cursor: pointer; }
      .fm-file-card:hover { border-color: #cbd5e1; box-shadow: var(--shadow-md); transform: translateY(-3px); }
      
      .fm-file-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: #f1f5f9; color: #94a3b8; }
      .fm-file-icon.has-file { background: #fee2e2; color: #ef4444; }
      .fm-file-icon.image { background: #e0f2fe; color: #0ea5e9; }
      
      .fm-file-info { display: flex; flex-direction: column; gap: 4px; }
      .fm-file-name { font-size: 0.9375rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
      .fm-file-meta { font-size: 0.75rem; color: #94a3b8; }
      .fm-file-badge { position: absolute; top: 15px; right: 15px; font-size: 0.65rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.025em; }
      .badge-ready { background: #e0f2fe; color: #0284c7; }
      
      .fm-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #94a3b8; padding: 60px 20px; width: 100%; grid-column: 1 / -1; }
      .fm-empty-state i { font-size: 4rem; margin-bottom: 20px; opacity: 0.2; }
    </style>

    <div class="page-header" style="margin-bottom:15px">
       <h1 class="page-title">Drive Konsultan Global</h1>
       <p class="page-subtitle">Sistem manajemen berkas teknis tersinkronisasi SIMBG & Inspeksi Lapangan</p>
    </div>

    <div class="drive-layout">
       <aside class="drive-sidebar" id="drive-sidebar-content">
          <!-- Render Sidebar Content based on view -->
       </aside>

       <main class="drive-main">
          <header class="drive-toolbar">
             <div class="drive-breadcrumb" id="drive-crumbs"></div>
             <div class="drive-search">
                <i class="fas fa-search"></i>
                <input type="text" id="drive-search-input" placeholder="Cari berkas..." oninput="window._renderDriveGrid()">
             </div>
             <button class="btn btn-ghost btn-sm" onclick="location.reload()"><i class="fas fa-sync"></i></button>
          </header>

          <div class="drive-grid" id="drive-content-grid"></div>
       </main>
    </div>
  `;

  if (root) {
    root.innerHTML = html;
    window._simbgCategories = SIMBG_CATEGORIES;
    initDriveLogic();
  }
}

function initDriveLogic() {
  window._changeDriveView = (view, projectId = null, catId = null) => {
    window._currentView = view;
    if (projectId) window._selectedProject = projectId;
    if (catId) window._selectedCategory = catId;
    
    // Update Sidebar
    renderSidebar();

    // Update Crumbs
    const crumbs = document.getElementById('drive-crumbs');
    if (view === 'projects') {
       crumbs.innerHTML = '<span class="crumb active">Unit Komputer</span>';
    } else if (view === 'inner') {
       const p = window._allProjects.find(i => i.id === window._selectedProject);
       const c = window._simbgCategories.find(i => i.id === window._selectedCategory);
       crumbs.innerHTML = `
          <span class="crumb" onclick="window._changeDriveView('projects')">Unit Komputer</span>
          <i class="fas fa-chevron-right text-xs text-tertiary"></i>
          <span class="crumb" onclick="window._changeDriveView('inner', '${p?.id}')">${esc(p?.nama_bangunan || 'Folder')}</span>
          <i class="fas fa-chevron-right text-xs text-tertiary"></i>
          <span class="active">${esc(c?.label || 'Umum')}</span>
       `;
    } else {
       crumbs.innerHTML = `<span class="crumb active">${view === 'trash' ? 'Tempat Sampah' : 'Terbaru'}</span>`;
    }

    window._renderDriveGrid();
  };

  function renderSidebar() {
    const sidebar = document.getElementById('drive-sidebar-content');
    if (!sidebar) return;

    if (window._currentView === 'projects' || window._currentView === 'recent' || window._currentView === 'trash') {
      sidebar.innerHTML = `
        <div class="sidebar-label">Utama</div>
        <button class="drive-nav-item ${window._currentView === 'projects' ? 'active' : ''}" onclick="window._changeDriveView('projects')">
           <i class="fas fa-hdd"></i> <span>Drive Saya</span>
        </button>
        <button class="drive-nav-item ${window._currentView === 'recent' ? 'active' : ''}" onclick="window._changeDriveView('recent')">
           <i class="fas fa-clock"></i> <span>Terbaru</span>
        </button>
        <button class="drive-nav-item ${window._currentView === 'trash' ? 'active' : ''}" onclick="window._changeDriveView('trash')">
           <i class="fas fa-trash-alt"></i> <span>Tempat Sampah</span>
        </button>
        <div class="sidebar-divider"></div>
        <div class="sidebar-label">Penyimpanan Terpusat</div>
        <div style="padding:0 14px">
           <div class="text-xs text-tertiary mb-2 uppercase font-bold">Google Cloud (SIMBG)</div>
           <div class="progress-wrap" style="height:4px; opacity:0.6"><div class="progress-fill blue" style="width:78%"></div></div>
        </div>
      `;
    } else {
      // Sync Sidebar with SIMBG structure
      sidebar.innerHTML = `
        <button class="drive-nav-item" onclick="window._changeDriveView('projects')" style="margin-bottom:12px; color:var(--brand-500); font-weight:700">
           <i class="fas fa-arrow-left"></i> <span>Unit Komputer</span>
        </button>
        <div class="sidebar-label">Kategori Berkas</div>
        ${window._simbgCategories.map(c => `
          <button class="drive-nav-item ${window._selectedCategory === c.id ? 'active' : ''}" 
                  onclick="window._changeDriveView('inner', null, '${c.id}')">
             <i class="fas ${c.icon}"></i> <span>${c.label}</span>
          </button>
        `).join('')}
      `;
    }
  }

  window._renderDriveGrid = () => {
    const grid = document.getElementById('drive-content-grid');
    const search = document.getElementById('drive-search-input')?.value.toLowerCase() || '';
    if (!grid) return;

    if (window._currentView === 'projects') {
       const filtered = window._allProjects.filter(p => p.nama_bangunan.toLowerCase().includes(search));
       grid.innerHTML = filtered.length ? filtered.map(p => `
          <div class="folder-card" onclick="window._changeDriveView('inner', '${p.id}')">
             <div class="folder-icon"></div>
             <div class="folder-name">${esc(p.nama_bangunan)}</div>
             <div class="folder-meta">${window._allGlobalFiles.filter(f => f.proyek_id === p.id).length} berkas</div>
          </div>
       `).join('') : '<div class="fm-empty-state"><i class="fas fa-folder-open"></i><p>Tidak ada proyek</p></div>';
    } 
    else if (window._currentView === 'inner') {
       const files = window._allGlobalFiles.filter(f => f.proyek_id === window._selectedProject && f.category === window._selectedCategory);
       const filtered = files.filter(f => f.name.toLowerCase().includes(search));
       grid.innerHTML = filtered.length ? filtered.map(f => renderFileCard(f)).join('') : '<div class="fm-empty-state"><i class="fas fa-folder-open"></i><p>Belum ada berkas di kategori ini</p></div>';
    }
    else {
       grid.innerHTML = '<div class="fm-empty-state"><i class="fas fa-database"></i><p>Data tidak tersedia</p></div>';
    }
  };

  window._changeDriveView(window._currentView, window._selectedProject, window._selectedCategory);
}

function renderFileCard(f, showProject = false) {
  const isPdf = f.name.toLowerCase().endsWith('.pdf');
  const isImg = f.name.match(/\.(jpg|jpeg|png|webp)$/i);
  return `
    <div class="fm-file-card ready" onclick="window.open('${f.file_url}', '_blank')">
      <div class="fm-file-icon has-file ${isImg ? 'image' : ''}">
         <i class="fas ${isImg ? 'fa-file-image' : isPdf ? 'fa-file-pdf' : 'fa-file'}"></i>
      </div>
      <div class="fm-file-info">
         <div class="fm-file-name" title="${f.subcategory || f.category}">${esc(f.subcategory || f.category)}</div>
         <div class="fm-file-meta">
            <span class="text-primary font-bold">${esc(f.name)}</span>
         </div>
         <div class="text-xs text-tertiary mt-1">
            ${showProject ? esc(f.proyek?.nama_bangunan || 'Proyek') : new Date(f.created_at).toLocaleDateString()}
         </div>
      </div>
      <span class="fm-file-badge badge-ready">${esc(f.ai_status || 'SIMBG')}</span>
    </div>
  `;
}

function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
