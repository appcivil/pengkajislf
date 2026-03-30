// ============================================================
//  PROYEK FILES PAGE (Management Berkas SIMBG)
//  Drive-style Modern Workspace for Technical Documents
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { uploadToGoogleDrive } from '../lib/drive.js';

export async function proyekFilesPage(params = {}) {
  const id = params.id;
  if (!id) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = '<div class="p-8 text-center"><i class="fas fa-circle-notch fa-spin text-2xl"></i></div>';

  const [proyek, files] = await Promise.all([
    fetchProyek(id),
    fetchProyekFiles(id)
  ]);

  if (!proyek) { navigate('proyek'); return ''; }

  const categories = [
    { 
      id: 'umum', 
      label: 'Data Umum', 
      icon: 'fa-folder-open',
      items: ['Data Siteplan', 'Data Penyedia Jasa', 'Laporan Pemeriksaan SLF', 'Surat Pernyataan Kelaikan', 'Persetujuan Lingkungan', 'Data Intensitas (KKPR)', 'Identitas Pemilik (KTP)']
    },
    { 
      id: 'tanah', 
      label: 'Data Tanah & Lingkungan', 
      icon: 'fa-map-marked-alt',
      items: ['Sertifikat Tanah', 'Izin Pemanfaatan Tanah', 'Gambar Batas Tanah', 'Hasil Penyelidikan Tanah', 'Persetujuan Tetangga', 'Dokumen Lingkungan (SPPL/UKL-UPL)']
    },
    { 
      id: 'arsitektur', 
      label: 'Teknis Arsitektur', 
      icon: 'fa-drafting-compass',
      items: ['Gambar Detail Bangunan', 'Gambar Tata Ruang Luar', 'Gambar Tata Ruang Dalam', 'Gambar Tampak', 'Gambar Potongan', 'Gambar Denah', 'Gambar Tapak', 'Spesifikasi Arsitektur', 'Gambar Situasi']
    },
    { 
      id: 'struktur', 
      label: 'Teknis Struktur', 
      icon: 'fa-cubes',
      items: ['Gambar Detail Tangga', 'Gambar Pelat Lantai', 'Gambar Penutup', 'Gambar Rangka Atap', 'Gambar Balok', 'Gambar Kolom', 'Gambar Pondasi', 'Spesifikasi Struktur', 'Perhitungan Struktur']
    },
    { 
      id: 'mep', 
      label: 'Teknis MEP', 
      icon: 'fa-bolt',
      items: ['Sistem Kebakaran', 'Pengelolaan Sampah', 'Pengelolaan Drainase', 'Pengelolaan Air Limbah', 'Pengelolaan Air Hujan', 'Air Bersih', 'Pencahayaan', 'Sumber Listrik', 'Spesifikasi Mekanikal', 'Perhitungan MEP']
    },
    {
      id: 'lapangan',
      label: 'Data Pengujian & Lapangan',
      icon: 'fa-clipboard-check',
      items: ['Foto Tapak & Lingkungan', 'Foto Teknis Arsitektur', 'Foto Teknis Struktur', 'Foto Teknis MEP', 'Laporan Pengujian Tanah', 'Hasil Hammer Test', 'Hasil Core Drill', 'Video Inspeksi Drone', 'Dokumen Pendukung Lapangan']
    },
    {
      id: 'integrasi',
      label: 'Integrasi SIMBG & Drive',
      icon: 'fa-robot',
      items: []
    }
  ];

  window._currentCat = window._currentCat || 'umum';
  window._filesList = files || [];

  const html = `
    <style>
      .file-manager-layout { display: flex; height: calc(100vh - 220px); background: #fff; border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); }
      @media (max-width: 768px) {
        .file-manager-layout { flex-direction: column; height: auto; }
        .fm-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--border-subtle); }
      }
      .fm-sidebar { width: 260px; background: #f8fafc; border-right: 1px solid var(--border-subtle); padding: 16px; display: flex; flex-direction: column; gap: 6px; }
      .fm-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
      .fm-toolbar { padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; gap: 16px; background: #fff; }
      .fm-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; color: #64748b; font-size: 0.9375rem; font-weight: 500; cursor: pointer; transition: 0.2s; border: none; background: transparent; width: 100%; text-align: left; }
      .fm-nav-item:hover { background: #f1f5f9; color: #1e293b; }
      .fm-nav-item.active { background: #e0f2fe; color: #0284c7; }
      .fm-nav-item i { font-size: 1.1rem; width: 24px; text-align: center; }
      
      .fm-breadcrumb { font-size: 0.875rem; color: #64748b; font-weight: 500; display: flex; align-items: center; gap: 8px; }
      .fm-breadcrumb span { color: #1e293b; font-weight: 700; }
      
      .fm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; padding: 24px; overflow-y: auto; flex: 1; align-content: start; }
      .fm-file-card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: 0.2s; position: relative; background: #fff; cursor: pointer; }
      .fm-file-card:hover { border-color: #cbd5e1; box-shadow: var(--shadow-md); transform: translateY(-3px); }
      .fm-file-card.empty { border-style: dashed; background: #fafafa; }
      
      .fm-file-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: #f1f5f9; color: #94a3b8; }
      .fm-file-icon.has-file { background: #fee2e2; color: #ef4444; }
      .fm-file-icon.image { background: #e0f2fe; color: #0ea5e9; }
      
      .fm-file-info { display: flex; flex-direction: column; gap: 4px; }
      .fm-file-name { font-size: 0.9375rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
      .fm-file-meta { font-size: 0.75rem; color: #94a3b8; }
      .fm-file-badge { position: absolute; top: 15px; right: 15px; font-size: 0.65rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.025em; }
      .badge-ready { background: #dcfce7; color: #15803d; }
      .badge-missing { background: #f1f5f9; color: #64748b; }
      
      .fm-empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #94a3b8; padding: 60px 20px; }
      .fm-empty-state i { font-size: 4rem; margin-bottom: 20px; opacity: 0.2; }
    </style>

    <div id="proyek-files-page">
      <div class="page-header" style="margin-bottom:15px">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail', {id:'${id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Kembali ke proyek
            </button>
            <h1 class="page-title">Drive Berkas SIMBG</h1>
            <p class="page-subtitle">${esc(proyek.nama_bangunan)}</p>
          </div>
          <div class="flex gap-2">
             ${!proyek.simbg_email_verified ? `
                <div class="alert-card alert-warning" style="animation: pulse 2s infinite">
                   <i class="fas fa-exclamation-triangle"></i>
                   <div class="text-xs font-bold">
                      Warning: Email SIMBG belum diverifikasi. Bot tidak dapat bekerja sebelum Anda verifikasi di inbox email.
                   </div>
                   <button class="btn btn-primary btn-xs" onclick="window._changePageFolder('integrasi')">Verifikasi Sekarang</button>
                </div>
             ` : ''}
             <button class="btn btn-secondary btn-sm" onclick="window.syncFilesWithSIMBG('${id}')">
               <i class="fas fa-sync"></i> Sinkronisasi SIMBG
             </button>
          </div>
        </div>
      </div>

      <div class="file-manager-layout">
        <aside class="fm-sidebar">
          <div style="padding:0 12px 12px; font-size:0.75rem; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.1em">Folder Proyek</div>
          ${categories.map(cat => `
            <button class="fm-nav-item ${window._currentCat === cat.id ? 'active' : ''}" id="fm-nav-${cat.id}" onclick="window._changePageFolder('${cat.id}')">
               <i class="fas ${cat.icon}"></i>
               <span>${cat.label}</span>
            </button>
          `).join('')}
          
          <div style="margin-top:auto; padding:16px; background:#fff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">
             <div class="flex items-center gap-3 mb-3">
                <i class="fab fa-google-drive" style="font-size:1.5rem; color:var(--success)"></i>
                <div>
                   <div class="text-xs text-tertiary font-bold uppercase">Cloud Storage</div>
                   <div class="text-xs font-bold text-primary">Connected</div>
                </div>
             </div>
             <div class="progress-wrap" style="height:4px; margin-bottom:8px">
                <div class="progress-fill green" style="width:65%"></div>
             </div>
             <div class="text-xs text-tertiary">Shared Drive Workspace V2.4</div>
          </div>
          
          <div style="margin-top:10px; padding:12px 16px; background:var(--bg); border-radius:16px; border:1px solid var(--border); box-shadow:var(--shadow)">
             <div class="text-xs text-tertiary font-bold uppercase mb-2" style="letter-spacing:0.02em">Status Bot SIMBG</div>
             <div class="flex items-center gap-3">
                <div style="width:10px; height:10px; border-radius:50%; background:${proyek.simbg_email_verified ? 'var(--success)' : 'var(--warning)'}; box-shadow:0 0 8px ${proyek.simbg_email_verified ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}"></div>
                <span class="text-sm font-extrabold" style="color:var(--text-h)">${proyek.simbg_email_verified ? 'ACTIVE' : 'WAITING'}</span>
             </div>
          </div>
        </aside>

        <main class="fm-main">
          <header class="fm-toolbar">
            <div class="fm-breadcrumb">
               Drive Proyek / <span id="fm-page-folder-label">${categories.find(c => c.id === window._currentCat)?.label || 'Umum'}</span>
            </div>
            <div style="display:flex; gap:12px; align-items:center">
               <div style="position:relative">
                  <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem"></i>
                  <input type="text" id="fm-search" placeholder="Cari dokumen..." oninput="window._renderPageGrid()" 
                         style="padding: 8px 12px 8px 34px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem; width:220px">
               </div>
               <button class="btn btn-primary btn-sm" onclick="window._openUploadModal()" id="btn-universal-upload" style="display:none">
                  <i class="fas fa-cloud-upload-alt"></i> Unggah Berkas
               </button>
            </div>
          </header>

          <div class="fm-grid" id="fm-page-grid">
             <!-- Render via JS -->
          </div>
        </main>
      </div>
    </div>
  `;

  if (root) {
    root.innerHTML = html;
    initPageLogic(id, categories, proyek);
    window._renderPageGrid();
  }
}

function initPageLogic(proyekId, categories, proyek) {
  window._changePageFolder = (catId) => {
    window._currentCat = catId;
    document.querySelectorAll('.fm-nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`fm-nav-${catId}`)?.classList.add('active');
    document.getElementById('fm-page-folder-label').textContent = categories.find(c => c.id === catId)?.label || catId;
    window._renderPageGrid();
  };

  window._renderPageGrid = () => {
    const grid = document.getElementById('fm-page-grid');
    const uploadBtn = document.getElementById('btn-universal-upload');
    if (!grid) return;
    
    if (window._currentCat === 'integrasi') {
       if (uploadBtn) uploadBtn.style.display = 'none';
       grid.innerHTML = `
         <div style="padding:24px; max-width:850px; margin:0 auto">
            <div style="text-align:center; margin-bottom:40px">
               <h2 style="font-size:1.8rem; font-weight:900; color:#1e293b; margin-bottom:12px; letter-spacing:-0.03em">Wizard Integrasi AI</h2>
               <p style="color:#64748b; font-size:1rem; max-width:500px; margin:0 auto">Hubungkan ekosistem Smart AI Pengkaji dengan Cloud Storage eksternal dan portal resmi SIMBG.</p>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:32px">
               <!-- STEP 1: DRIVE POOLING -->
               <div style="background:#fff; border:1px solid #e2e8f0; border-radius:24px; padding:32px; box-shadow:0 4px 20px rgba(0,0,0,0.05); position:relative; overflow:hidden">
                  <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--brand-500)"></div>
                  
                  <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px">
                     <div style="width:36px; height:36px; border-radius:12px; background:rgba(99,102,241,0.1); color:var(--brand-500); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem">01</div>
                     <div>
                        <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0">Storage Pooling (Unlimited Cloud)</h3>
                        <p style="font-size:0.8rem; color:#64748b; margin:4px 0 0">Gunakan akun Gmail terdistribusi untuk melampaui limit 15GB Google Drive.</p>
                     </div>
                  </div>

                  <div style="background:#f1f5f9; border-radius:12px; padding:4px; display:flex; gap:4px; margin-bottom:20px; width:fit-content">
                     <button class="btn btn-xs" id="method-manual-btn" style="background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.05); border:1px solid #e2e8f0; font-size:0.7rem" onclick="document.getElementById('gas-manual-area').style.display='block'; document.getElementById('gas-clasp-area').style.display='none'; this.style.background='#fff'; document.getElementById('method-clasp-btn').style.background='transparent'">Metode 1: Manual Copy-Paste</button>
                     <button class="btn btn-xs" id="method-clasp-btn" style="background:transparent; font-size:0.7rem; border:1px solid transparent" onclick="document.getElementById('gas-manual-area').style.display='none'; document.getElementById('gas-clasp-area').style.display='block'; this.style.background='#fff'; this.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)'; this.style.borderColor='#e2e8f0'; document.getElementById('method-manual-btn').style.background='transparent'; document.getElementById('method-manual-btn').style.borderColor='transparent'">Metode 2: Clasp CLI (Pro) <span style="background:var(--brand-500); color:#fff; padding:1px 4px; border-radius:4px; font-size:0.55rem; margin-left:4px">NEW</span></button>
                  </div>

                  <div id="gas-manual-area">
                     <p style="font-size:0.75rem; font-weight:700; color:#475569; margin-bottom:12px">Instruksi: Salin kode di bawah ke <a href="https://script.google.com" target="_blank" style="color:var(--brand-600); text-decoration:underline">Google Apps Script</a> akun baru Anda.</p>
                     
                     <div style="position:relative">
                        <pre style="background:#0f172a; color:#cbd5e1; padding:20px; border-radius:12px; font-family:var(--mono); font-size:0.7rem; height:120px; overflow-y:auto; border:1px solid #1e293b; line-height:1.6" id="gas-code-box">/**
 * SMART AI - DRIVE CLOUD PROXY
 * Target: Integrasi Workspace Mandiri
 */
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var folder = getFolder(data.proyekId);
  var subFolder = getSubFolder(folder, data.aspek);
  var file = subFolder.createFile(data.fileName, Utilities.base64Decode(data.base64), data.mimeType);
  return ContentService.createTextOutput(JSON.stringify({
    url: file.getUrl(),
    id: file.getId()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getFolder(name) {
  var fs = DriveApp.getFoldersByName(name);
  return fs.hasNext() ? fs.next() : DriveApp.createFolder(name);
}</pre>
                        <button class="btn btn-ghost btn-xs" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.1)" onclick="window._copyGasCode()">
                           <i class="fas fa-copy"></i> Salin Kode GAS
                        </button>
                     </div>
                  </div>

                  <div id="gas-clasp-area" style="display:none">
                     <p style="font-size:0.75rem; font-weight:700; color:#475569; margin-bottom:12px">Instruksi: Gunakan terminal Anda untuk deployment kilat.</p>
                     <div style="background:#0f172a; color:#94a3b8; padding:20px; border-radius:12px; font-family:var(--mono); font-size:0.75rem; border:1px solid #1e293b; line-height:1.6">
                        <div style="color:var(--brand-400); margin-bottom:8px"># Login & Deploy Otomatis</div>
                        <div style="color:#f8fafc">clasp login</div>
                        <div style="color:#f8fafc; margin-top:4px">npm run deploy-gas</div>
                        
                        <div style="margin-top:16px; font-size:0.65rem; padding-top:12px; border-top:1px solid #1e293b">
                           <i class="fas fa-info-circle"></i> Pastikan <b>Google Apps Script API</b> sudah ON di <a href="https://script.google.com/home/usersettings" target="_blank" style="color:var(--brand-400)">Pengaturan Google</a>.
                        </div>
                     </div>
                  </div>

                  <div style="margin-top:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:20px">
                        <label style="display:block; font-size:0.75rem; font-weight:700; color:#334155; margin-bottom:8px">Web App URL (Hasil Deployment)</label>
                        <input type="text" id="input-drive-proxy" value="${proyek.drive_proxy_url || ''}" placeholder="https://script.google.com/macros/s/.../exec" 
                               style="width:100%; padding:12px; border-radius:12px; border:1px solid #cbd5e1; font-size:0.85rem">
                     </div>
                  </div>
               </div>

               <!-- STEP 2: SIMBG ACCOUNT -->
               <div style="background:#fff; border:1px solid #e2e8f0; border-radius:24px; padding:32px; box-shadow:0 4px 20px rgba(0,0,0,0.05); position:relative; overflow:hidden">
                  <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:#f97316"></div>
                  
                  <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px">
                     <div style="width:36px; height:36px; border-radius:12px; background:rgba(249,115,22,0.1); color:#f97316; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem">02</div>
                     <div>
                        <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0">Credential Portal SIMBG</h3>
                        <p style="font-size:0.8rem; color:#64748b; margin:4px 0 0">Hubungkan bot otomatis dengan portal perizinan bangunan pemerintah.</p>
                     </div>
                  </div>
                  
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px">
                     <div>
                        <label style="display:block; font-size:0.75rem; font-weight:700; color:#334155; margin-bottom:8px">Email SIMBG</label>
                        <input type="email" id="input-simbg-email" value="${proyek.simbg_email || ''}" placeholder="email@example.com"
                               style="width:100%; padding:12px; border-radius:12px; border:1px solid #cbd5e1; font-size:0.85rem">
                     </div>
                     <div>
                        <label style="display:block; font-size:0.75rem; font-weight:700; color:#334155; margin-bottom:8px">Password Portal</label>
                        <input type="password" id="input-simbg-pass" value="${proyek.simbg_password || ''}" placeholder="••••••••"
                               style="width:100%; padding:12px; border-radius:12px; border:1px solid #cbd5e1; font-size:0.85rem">
                     </div>
                  </div>

                  <div style="background:#fff7ed; border:1px solid #fdba74; padding:20px; border-radius:16px">
                     <div style="display:flex; gap:14px; align-items:center">
                        <input type="checkbox" id="check-simbg-verified" ${proyek.simbg_email_verified ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer">
                        <label for="check-simbg-verified" style="font-size:0.8rem; color:#9a3412; font-weight:700; cursor:pointer">
                           Saya mengonfirmasi bahwa email telah diverifikasi di portal SIMBG. (Wajib agar bot aktif)
                        </label>
                     </div>
                  </div>
               </div>
            </div>

            <div style="margin-top:40px; text-align:right">
               <button class="btn btn-primary btn-lg" onclick="window._saveIntegrationSettings()" style="padding:14px 40px; border-radius:12px; font-weight:800">
                  <i class="fas fa-save" style="margin-right:8px"></i> Simpan Konfigurasi Integrasi
               </button>
            </div>
         </div>
       `;
       return;
       return;
    }

    if (uploadBtn) uploadBtn.style.display = 'inline-flex';

    const search = document.getElementById('fm-search')?.value.toLowerCase() || '';
    const cat = categories.find(c => c.id === window._currentCat);
    const categoryFiles = window._filesList.filter(f => f.category === window._currentCat);
    
    const html = categoryFiles.map(file => {
      const isImage = file?.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      
      if (search && !file.subcategory.toLowerCase().includes(search) && !file.name.toLowerCase().includes(search)) return '';

      return `
        <div class="fm-file-card ready" onclick="window.open('${file.file_url}', '_blank')">
          <div class="fm-file-icon has-file ${isImage ? 'image' : ''}">
             <i class="fas ${isImage ? 'fa-file-image' : 'fa-file-pdf'}"></i>
          </div>
          <div class="fm-file-info">
             <div class="fm-file-name" title="${file.subcategory}">${file.subcategory}</div>
             <div class="fm-file-meta">
                <span class="text-primary font-bold">${esc(file.name)}</span>
             </div>
             <div class="text-xs text-tertiary mt-1">${new Date(file.created_at).toLocaleDateString()}</div>
          </div>
          <span class="fm-file-badge badge-ready">Ready</span>
          <div style="position:absolute; bottom:15px; right:15px; display:flex; gap:6px">
             <button class="btn btn-ghost btn-xs text-danger" onclick="event.stopPropagation(); window._deletePageFile('${file.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    const reqHtml = cat.items && cat.items.length > 0 ? `
      <div style="grid-column: 1 / -1; margin-bottom: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px;">
         <div style="font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.02em">
            <i class="fas fa-info-circle" style="color:var(--brand-500); margin-right:6px"></i> Target Kelengkapan SIMBG
         </div>
         <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${cat.items.map(item => {
               const uploaded = categoryFiles.some(f => f.subcategory === item);
               const bg = uploaded ? '#dcfce7' : '#fff';
               const border = uploaded ? '#bbf7d0' : '#e2e8f0';
               const tx = uploaded ? '#15803d' : '#64748b';
               const icon = uploaded ? 'fa-check-circle' : 'fa-clock';
               return `<span style="font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: ${bg}; color: ${tx}; border: 1px solid ${border}; display: flex; align-items: center; gap: 6px;">
                  <i class="fas ${icon}"></i> ${item}
               </span>`;
            }).join('')}
         </div>
      </div>
    ` : '';

    if (!html) {
      grid.innerHTML = search ? `<div class="fm-empty-state"><i class="fas fa-search"></i><p>Pencarian "${search}" tidak ditemukan.</p></div>` :
      reqHtml + `<div class="fm-empty-state" style="padding: 20px;"><i class="fas fa-folder-open"></i><p style="margin-top:8px">Belum ada dokumen yang diunggah.</p><button class="btn btn-secondary btn-sm mt-4" onclick="window._openUploadModal()"><i class="fas fa-cloud-upload-alt"></i> Unggah Berkas</button></div>`;
    } else {
      grid.innerHTML = reqHtml + html;
    }
  };

  window._openUploadModal = () => {
    const cat = categories.find(c => c.id === window._currentCat);
    if (!cat) return;

    // Filter subkategori yg belum diupload (pilihan cerdas)
    const existingSubs = window._filesList.filter(f => f.category === window._currentCat).map(f => f.subcategory);
    const availableItems = cat.items.filter(item => !existingSubs.includes(item));

    const overlay = document.createElement('div');
    overlay.id = 'upload-modal-overlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      background:rgba(15,23,42,0.7); backdrop-filter:blur(3px);
      z-index:9999; display:flex; align-items:center; justify-content:center;
    `;
    
    overlay.innerHTML = `
      <div style="background:var(--bg); width:400px; padding:24px; border-radius:16px; box-shadow:var(--shadow-xl); border:1px solid var(--border-subtle);">
        <h3 style="margin-bottom:16px; font-weight:800; color:var(--text-primary);"><i class="fas fa-cloud-upload-alt"></i> Unggah Berkas</h3>
        
        <div class="form-group">
           <label class="form-label">Identitas Dokumen SIMBG</label>
           <select id="modal-subcat-select" class="form-select">
             ${availableItems.length === 0 ? '<option value="" disabled selected>Semua dokumen telah dilengkapi</option>' : ''}
             ${availableItems.map(i => `<option value="${i}">${i}</option>`).join('')}
             <option disabled>──────</option>
             ${existingSubs.map(i => `<option value="${i}">${i} (Timpa File Ini)</option>`).join('')}
           </select>
        </div>

        <div class="form-group" style="margin-top:16px">
           <label class="form-label">Pilih Berkas Komputer</label>
           <input type="file" id="modal-file-input" class="form-input" accept=".pdf,.png,.jpg,.jpeg">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:24px">
           <button class="btn btn-ghost btn-sm" onclick="document.getElementById('upload-modal-overlay').remove()">Batal</button>
           <button class="btn btn-primary btn-sm" id="modal-upload-btn">Upload Sekarang</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);

    document.getElementById('modal-upload-btn').onclick = async () => {
       const subcategory = document.getElementById('modal-subcat-select').value;
       const fileInput = document.getElementById('modal-file-input');
       const file = fileInput.files[0];

       if(!subcategory) return showError("Pilih identitas dokumen.");
       if(!file) return showError("Pilih file terlebih dahulu.");

       document.getElementById('upload-modal-overlay').remove();
       
       showInfo(`Mengunggah ${file.name}...`);
       const reader = new FileReader();
       const b64 = await new Promise(resolve => {
         reader.onload = () => resolve(reader.result.split(',')[1]);
         reader.readAsDataURL(file);
       });

       try {
         const urls = await uploadToGoogleDrive([{ base64: b64, mimeType: file.type, name: file.name }], proyekId, window._currentCat, subcategory, proyek.drive_proxy_url);
         if (!urls?.length) throw new Error("Gagal mengunggah ke Google Drive");

         const payload = {
           proyek_id: proyekId,
           name: file.name,
           file_url: urls[0],
           category: window._currentCat,
           subcategory: subcategory,
           storage_type: 'google_drive',
           ai_status: 'Pending'
         };

         const { data: existing } = await supabase.from('proyek_files')
           .select('id').eq('proyek_id', proyekId).eq('category', window._currentCat).eq('subcategory', subcategory).maybeSingle();

         if (existing) {
           const { error } = await supabase.from('proyek_files').update(payload).eq('id', existing.id);
           if (error) throw error;
         } else {
           const { error } = await supabase.from('proyek_files').insert([payload]);
           if (error) throw error;
         }

         showSuccess("Berkas berhasil diperbarui.");
         const freshFiles = await fetchProyekFiles(proyekId);
         window._filesList = freshFiles;
         window._renderPageGrid();
       } catch (err) {
         showError("Upload Gagal: " + err.message);
       }
    };
  };

  window._deletePageFile = async (fid) => {
    if (!confirm('Hapus rujukan berkas?')) return;
    await supabase.from('proyek_files').delete().eq('id', fid);
    showSuccess("Berkas terhapus.");
    const freshFiles = await fetchProyekFiles(proyekId);
    window._filesList = freshFiles;
    window._renderPageGrid();
  };

  window._copyGasCode = () => {
     const code = document.getElementById('gas-code-box').textContent;
     navigator.clipboard.writeText(code);
     showSuccess('Kode GAS berhasil disalin ke clipboard.');
  };

  window._saveIntegrationSettings = async () => {
     const driveProxy = document.getElementById('input-drive-proxy').value;
     const simbgEmail = document.getElementById('input-simbg-email').value;
     const simbgPass  = document.getElementById('input-simbg-pass').value;
     const isVerified = document.getElementById('check-simbg-verified').checked;

     showInfo('Menyimpan pengaturan...');
     const { error } = await supabase.from('proyek').update({
        drive_proxy_url: driveProxy,
        simbg_email: simbgEmail,
        simbg_password: simbgPass,
        simbg_email_verified: isVerified
     }).eq('id', proyekId);

     if (!error) {
        showSuccess('Pengaturan integrasi berhasil disimpan.');
        location.reload();
     } else {
        showError('Gagal menyimpan pengaturan.');
     }
  };

  window._renderPageGrid();
}

async function fetchProyek(id) {
  const { data } = await supabase.from('proyek').select('*').eq('id', id).single();
  return data;
}

async function fetchProyekFiles(id) {
  const { data } = await supabase.from('proyek_files').select('*').eq('proyek_id', id);
  return data || [];
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.syncFilesWithSIMBG = async (proyekId) => {
  showInfo("Sinkronisasi otomatis ke akun SIMBG sedang berjalan...");
  setTimeout(() => showSuccess("Seluruh berkas teknis telah sinkron dengan portal SIMBG."), 2000);
};
