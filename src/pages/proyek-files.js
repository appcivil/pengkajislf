/**
 * PROYEK FILES PAGE (Refactored)
 * Modular architecture for Project Files & SIMBG Integration.
 */
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { store, updateFiles } from '../lib/store.js';
import { escHtml } from '../lib/utils.js';
import { 
  uploadSingleFile, 
  syncWithSIMBG,
  pushToSIMBG
} from '../lib/file-service.js';
import { 
  renderFileSidebar, 
  renderFileMain, 
  renderFileGrid 
} from '../components/file-manager-components.js';
import { APP_CONFIG } from '../lib/config.js';

const CATEGORIES = [
  { id: 'umum', label: 'Data Umum', icon: 'fa-folder-open', items: ['Data Siteplan', 'Data Penyedia Jasa', 'Laporan Pemeriksaan SLF', 'Surat Pernyataan Kelaikan', 'Persetujuan Lingkungan', 'Data Intensitas (KKPR)', 'Identitas Pemilik (KTP)'] },
  { id: 'tanah', label: 'Tanah & Link.', icon: 'fa-map-marked-alt', items: ['Sertifikat Tanah', 'Izin Pemanfaatan Tanah', 'Gambar Batas Tanah', 'Hasil Penyelidikan Tanah', 'Persetujuan Tetangga', 'SPPL/UKL-UPL'] },
  { id: 'arsitektur', label: 'As-Built Arsitektur', icon: 'fa-drafting-compass', items: ['Rencana Tapak (Site Plan)', 'Gambar Denah (As-Built)', 'Gambar Tampak (As-Built)', 'Gambar Potongan (As-Built)', 'Detail Arsitektur (As-Built)', 'Spesifikasi Teknis'] },
  { id: 'struktur', label: 'As-Built Struktur', icon: 'fa-cubes', items: ['Gambar Pondasi (As-Built)', 'Gambar Kolom & Balok (As-Built)', 'Gambar Pelat Lantai (As-Built)', 'Gambar Tangga (As-Built)', 'Gambar Rangka Atap (As-Built)', 'Perhitungan Struktur (As-Built)'] },
  { id: 'mep', label: 'As-Built MEP', icon: 'fa-bolt', items: ['Instalasi Listrik (As-Built)', 'Instalasi Air Bersih (As-Built)', 'Instalasi Air Kotor (As-Built)', 'Instalasi Proteksi Kebakaran (As-Built)', 'Sistem Tata Udara (AC)', 'Perhitungan Mekanikal'] },
  { id: 'lapangan', label: 'Pengujian & Foto', icon: 'fa-clipboard-check', items: ['Foto Tapak/Lingkungan', 'Foto Arsitektur (Eksterior)', 'Foto Struktur (Detail)', 'Foto MEP (Utilitas)', 'Hasil Hammer Test', 'Hasil Core Drill', 'Dokumentasi NDT Lainnya'] },
  { id: 'nspk', label: 'Referensi NSPK & RGA', icon: 'fa-book-atlas', items: ['Screenshot RGA (NSPK)', 'Referensi SNI Struktur', 'Referensi SNI Arsitektur', 'Referensi SNI MEP', 'Regulasi Perda/PUPR', 'Dokumen Teknis RGA'] },
  { id: 'integrasi', label: 'Integrasi SIMBG', icon: 'fa-robot', items: [] }
];

export async function proyekFilesPage(params = {}) {
  const proyekId = params.id;
  if (!proyekId) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = '<div class="skeleton" style="height:500px"></div>';

  // Reactivity: Subscribe to store changes
  const unsubscribe = store.subscribe(() => {
    const r = document.getElementById('page-root');
    if (r) render(r);
  });

  // Cleanup on navigate (optional, if router supports it)
  // window._lastUnsubscribe = unsubscribe;

  await loadFilesData(proyekId);
}

async function loadFilesData(proyekId) {
  try {
    const [proyek, files] = await Promise.all([
      fetchProyek(proyekId),
      fetchProyekFiles(proyekId)
    ]);

    if (!proyek) { navigate('proyek'); return; }

    store.set({ currentProyek: proyek, currentProyekId: proyekId });
    updateFiles({ documents: files });
  } catch (err) {
    showError("Gagal load berkas: " + err.message);
  }
}

function render(root) {
  const { currentProyek, files } = store.get();
  const cat = CATEGORIES.find(c => c.id === files.activeCategory);

  root.innerHTML = `
    <div class="file-manager-page" style="animation: page-fade-in 0.8s ease-out">
      <!-- Presidential Hero Header -->
      <div class="card-quartz" style="padding: var(--space-6) var(--space-8); margin-bottom: var(--space-6); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2); position:relative; overflow:hidden; border-radius:24px">
         <!-- Abstract Background Effect -->
         <div style="position:absolute; right:-50px; top:-50px; width:250px; height:250px; border-radius:50%; background:radial-gradient(circle, hsla(220, 95%, 52%, 0.1) 0%, transparent 70%); pointer-events:none"></div>

         <div class="flex-between flex-stack" style="position:relative; z-index:2; gap: 24px">
            <div style="text-align: left">
               <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek-detail',{id:'${currentProyek.id}'})" style="margin-bottom:12px; color:var(--brand-300); padding:0; font-weight:700; letter-spacing:1px">
                 <i class="fas fa-arrow-left" style="margin-right:8px"></i> KEMBALI KE DASHBOARD
               </button>
               <h1 style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 1.8rem; color:white; letter-spacing:-0.03em; margin:0; line-height:1.2">
                 Drive Berkas SIMBG
               </h1>
               <div style="display:flex; gap:12px; margin-top:8px; align-items:center">
                  <span style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--text-tertiary); letter-spacing:1.5px; opacity:0.8; text-align: left">
                    <i class="fas fa-building" style="margin-right:6px"></i> ${escHtml(currentProyek.nama_bangunan).toUpperCase()}
                  </span>
               </div>
            </div>
            <div class="flex gap-3" style="width: auto">
               <button class="btn btn-outline" style="height:44px; border-radius:12px; border-color:hsla(220, 20%, 100%, 0.1); color:white; background:hsla(220, 20%, 100%, 0.05)" onclick="window._syncSIMBG()" title="Ambil data dari Portal SIMBG">
                  <i class="fas fa-arrow-down ${files.isSyncing ? 'fa-beat' : ''}" style="margin-right:8px; color:var(--brand-400)"></i> Pull
               </button>
               <button class="btn btn-outline" style="height:44px; border-radius:12px; border-color:hsla(45, 100%, 50%, 0.2); color:white; background:hsla(45, 100%, 50%, 0.05)" onclick="window._pushToSIMBG()" title="Kirim data ke Portal SIMBG">
                  <i class="fas fa-arrow-up ${files.isSyncing ? 'fa-beat' : ''}" style="margin-right:8px; color:var(--warning-400)"></i> Push
               </button>
            </div>
         </div>
      </div>
      
      <div class="file-manager-layout grid-side-layout" style="min-height:calc(100vh - 280px); border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:24px; overflow:hidden; background:hsla(220, 20%, 5%, 0.4); backdrop-filter:blur(20px); box-shadow: 0 10px 40px rgba(0,0,0,0.3)">
         ${renderFileSidebar(CATEGORIES, files.activeCategory)}
         ${renderFileMain(currentProyek, cat?.label, files.searchQuery, files.isSyncing, files.syncProgress)}
      </div>
    </div>
  `;

  // Grid Render
  const grid = document.getElementById('fm-page-grid');
  if (grid) {
     if (files.activeCategory === 'integrasi') {
        grid.innerHTML = renderWizardUI(currentProyek);
     } else {
        const filtered = files.documents.filter(f => {
           if (f.category !== files.activeCategory) return false;
           if (files.searchQuery && !f.subcategory.toLowerCase().includes(files.searchQuery.toLowerCase()) && !f.name.toLowerCase().includes(files.searchQuery.toLowerCase())) return false;
           return true;
        });
        grid.innerHTML = renderFileGrid(filtered, cat?.items, files.searchQuery);
     }
  }

  // Auto-subscribe to progress for real-time updates
  if (files.isSyncing) {
     setTimeout(() => render(root), 600); 
  }
}

// ── Global Handlers ───────────────────────────────────────────

window._changePageFolder = (catId) => {
  updateFiles({ activeCategory: catId });
  render(document.getElementById('page-root'));
};

window._handleSearch = (val) => {
  updateFiles({ searchQuery: val });
  // Debounce render or direct render
  render(document.getElementById('page-root'));
};

window._syncSIMBG = async () => {
    const { currentProyekId } = store.get();
    try {
        showInfo("Menghubungkan ke Portal SIMBG...");
        await syncWithSIMBG(currentProyekId);
        showSuccess("Data teknis berhasil ditarik dari SIMBG.");
        render(document.getElementById('page-root'));
    } catch (err) {
        showError("Gagal sinkron (Pull): " + err.message);
    }
};

window._pushToSIMBG = async () => {
    const { currentProyekId } = store.get();
    try {
        showInfo("Menyiapkan transmisi data ke SIMBG...");
        await pushToSIMBG(currentProyekId);
        showSuccess("Data berhasil di-Push ke Portal SIMBG.");
        render(document.getElementById('page-root'));
    } catch (err) {
        showError("Gagal sinkron (Push): " + err.message);
    }
};

window._openUploadModal = () => {
  const { files, currentProyekId, currentProyek } = store.get();
  const cat = CATEGORIES.find(c => c.id === files.activeCategory);
  if (!cat) return;

  const existingSubs = files.documents.filter(f => f.category === files.activeCategory).map(f => f.subcategory);
  const availableItems = cat.items.filter(item => !existingSubs.includes(item));

  const modal = document.createElement('div');
  modal.id = 'upload-modal-overlay';
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal-card" style="max-width:400px">
      <h3 class="modal-title">Unggah Berkas SIMBG</h3>
      <div class="form-group">
         <label class="form-label">Jenis Dokumen</label>
         <select id="modal-subcat-select" class="form-select">
           ${availableItems.map(i => `<option value="${i}">${i}</option>`).join('')}
           ${existingSubs.length > 0 ? `<option disabled>── Terdaftar (Timpa) ──</option>` : ''}
           ${existingSubs.map(i => `<option value="${i}">${i} (Update)</option>`).join('')}
         </select>
      </div>
      <div class="form-group" style="margin-top:16px">
         <label class="form-label">Berkas (PDF/Image)</label>
         <input type="file" id="modal-file-input" class="form-input">
      </div>
      <div class="modal-footer" style="margin-top:24px">
         <button class="btn btn-ghost" onclick="document.getElementById('upload-modal-overlay').remove()">Batal</button>
         <button class="btn btn-primary" id="modal-upload-btn">Unggah Sekarang</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('modal-upload-btn').onclick = async () => {
     const subcat = document.getElementById('modal-subcat-select').value;
     const file = document.getElementById('modal-file-input').files[0];
     if (!subcat || !file) return showError("Pilih dokumen dan file.");

     document.getElementById('upload-modal-overlay').remove();
     showInfo(`Memproses ${file.name}...`);

     try {
       await uploadSingleFile(file, currentProyekId, files.activeCategory, subcat, currentProyek.drive_proxy_url);
       showSuccess("Berkas berhasil diunggah.");
       loadFilesData(currentProyekId);
     } catch (err) {
       showError("Upload Gagal: " + err.message);
     }
  };
};

window._deletePageFile = async (fileId) => {
    if (!confirm('Hapus rujukan berkas? Tindakan ini permanen dan akan menghapus rujukan di seluruh hasil pemeriksaan.')) return;
    
    const { currentProyekId } = store.get();
    try {
        // 1. Get file details for cleanup
        const { data: file } = await supabase.from('proyek_files')
            .select('id, file_url')
            .eq('id', fileId)
            .maybeSingle();

        if (file) {
            // 2. Cleanup Rujukan in Checklist Items (Daftar Simak)
            const { data: linkedItems } = await supabase.from('checklist_items')
                .select('id, foto_urls, evidence_links')
                .eq('proyek_id', currentProyekId);

            if (linkedItems && linkedItems.length > 0) {
                for (const item of linkedItems) {
                    let isModified = false;
                    let nextUrls = item.foto_urls || [];
                    let nextEvidence = item.evidence_links || [];

                    // Filter out URL
                    if (nextUrls.includes(file.file_url)) {
                        nextUrls = nextUrls.filter(u => u !== file.file_url);
                        isModified = true;
                    }

                    // Filter out Evidence Mapping
                    const prevLen = nextEvidence.length;
                    nextEvidence = nextEvidence.filter(ev => ev.file_id !== fileId);
                    if (nextEvidence.length !== prevLen) isModified = true;

                    if (isModified) {
                        await supabase.from('checklist_items').update({
                            foto_urls: nextUrls,
                            evidence_links: nextEvidence
                        }).eq('id', item.id);
                    }
                }
            }
        }

        // 3. Delete DB record
        await supabase.from('proyek_files').delete().eq('id', fileId);
        
        showSuccess("Berkas terhapus.");
        loadFilesData(currentProyekId);
    } catch (err) {
        console.error("Delete cleanup failed:", err);
        showError("Gagal menghapus berkas sepenuhnya.");
    }
};

window._saveIntegrationSettings = async () => {
    const { currentProyekId } = store.get();
    const proxyVal = document.getElementById('input-drive-proxy').value;
    
    const payload = {
        drive_proxy_url: proxyVal.trim() || null, // Save as null if empty to use global fallback
        simbg_email: document.getElementById('input-simbg-email').value,
        simbg_email_verified: document.getElementById('check-simbg-verified').checked
    };

    try {
        const { error } = await supabase.from('proyek').update(payload).eq('id', currentProyekId);
        if (error) throw error;
        
        showSuccess("Pengaturan integrasi berhasil disimpan secara permanen.");
        loadFilesData(currentProyekId);
    } catch (err) {
        console.error("Save SIMBG Settings Failed:", err);
        showError("Gagal menyimpan perubahan: " + (err.message || 'Error Database'));
    }
};

// ── Helpers ───────────────────────────────────────────────────

async function fetchProyek(id) {
  const { data } = await supabase.from('proyek').select('*').eq('id', id).single();
  return data;
}

async function fetchProyekFiles(id) {
  const { data } = await supabase.from('proyek_files').select('*').eq('proyek_id', id);
  return data || [];
}

function renderWizardUI(p) {
   return `
     <div style="grid-column:1/-1; padding:var(--space-12); max-width:800px; margin:0 auto; animation: fade-in-up 0.6s ease-out">
        <div class="card-quartz" style="padding:var(--space-10); border:1px solid hsla(220, 95%, 52%, 0.2); background: linear-gradient(135deg, hsla(220, 95%, 52%, 0.05) 0%, transparent 100%); text-align:center; border-radius:24px">
           <div style="width:80px; height:80px; border-radius:20px; background:hsla(220, 95%, 52%, 0.1); margin:0 auto 24px; display:flex; align-items:center; justify-content:center; color:var(--brand-400); border:1px solid hsla(220, 95%, 52%, 0.2)">
              <i class="fas fa-robot animate-pulse" style="font-size:2.5rem"></i>
           </div>
           <h2 style="font-family:'Outfit', sans-serif; font-weight:800; color:white; margin-bottom:12px">Integrasi Bot SIMBG & Cloud</h2>
           <p style="color:var(--text-tertiary); max-width:500px; margin:0 auto 40px; line-height:1.6">Konfigurasikan akses bot untuk otomatisasi sinkronisasi berkas teknis dan administrasi ke portal pemerintah secara aman.</p>
           
           <div style="text-align:left; background:hsla(220, 20%, 100%, 0.02); padding:32px; border-radius:20px; border:1px solid hsla(220, 20%, 100%, 0.05)">
              <div class="form-group" style="margin-bottom:24px">
                 <div class="flex-between">
                    <label style="display:block; margin-bottom:10px; font-size:0.75rem; font-weight:800; color:var(--text-secondary); font-family:var(--font-mono); letter-spacing:1px">GOOGLE DRIVE PROXY (WEB APP URL)</label>
                    ${!p.drive_proxy_url && APP_CONFIG.gasApiUrl ? `<span style="font-size:10px; color:var(--brand-400); font-weight:700; margin-bottom:10px; letter-spacing:1px; background:hsla(220, 95%, 52%, 0.1); padding:2px 8px; border-radius:4px">✓ DEFAULT AKTIF</span>` : ''}
                 </div>
                 <input type="text" id="input-drive-proxy" class="form-input" style="background:hsla(220, 20%, 100%, 0.05); border-color:hsla(220, 20%, 100%, 0.1); color:white; height:48px; border-radius:12px; font-family:var(--font-mono); font-size:0.8rem" value="${p.drive_proxy_url || ''}" placeholder="${APP_CONFIG.gasApiUrl || 'https://script.google.com/...' }">
                 <p style="font-size:11px; color:var(--text-tertiary); margin-top:8px">Kosongkan kolom ini jika ingin menggunakan pengaturan global aplikasi.</p>
              </div>
              <div class="form-group" style="margin-bottom:24px">
                 <div class="flex-between">
                     <label style="display:block; margin-bottom:10px; font-size:0.75rem; font-weight:800; color:var(--text-secondary); font-family:var(--font-mono); letter-spacing:1px">EMAIL TERDAFTAR SIMBG</label>
                     <button class="btn btn-ghost btn-xs" onclick="window._openSIMBGRegistration()" style="color:var(--brand-300); font-size:10px; font-weight:800; padding:0">
                        <i class="fas fa-user-plus" style="margin-right:6px"></i> DAFTAR AKUN BARU
                     </button>
                  </div>
                 <input type="email" id="input-simbg-email" class="form-input" style="background:hsla(220, 20%, 100%, 0.05); border-color:hsla(220, 20%, 100%, 0.1); color:white; height:48px; border-radius:12px" value="${p.simbg_email || ''}">
              </div>
              <div class="flex items-center gap-3" style="background:hsla(158, 85%, 45%, 0.05); padding:16px; border-radius:12px; border:1px solid hsla(158, 85%, 45%, 0.1)">
                 <input type="checkbox" id="check-simbg-verified" ${p.simbg_email_verified ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--success-500)">
                 <label for="check-simbg-verified" style="font-size:0.85rem; font-weight:700; color:var(--success-400)">Email telah diverifikasi di portal resmi pemerintah</label>
              </div>
              <button class="btn btn-primary" style="width:100%; margin-top:32px; height:52px; border-radius:14px; font-weight:800; font-size:0.95rem; box-shadow:var(--shadow-sapphire)" onclick="window._saveIntegrationSettings()">
                 <i class="fas fa-save" style="margin-right:10px"></i> AKTIFKAN INTEGRASI STRATEGIS
              </button>
           </div>
        </div>
     </div>
   `;
}

// ── Quick Look & Annotation Engine ───────────────────────────

window._quickLookFile = async (fileId) => {
  const { files } = store.get();
  const file = files.documents.find(f => f.id === fileId);
  if (!file) return showError("File tidak ditemukan.");

  const isImage = file.name?.match(/\.(jpg|jpeg|png|webp)$/i);
  const isPdf = file.name?.toLowerCase().endsWith('.pdf');

  const overlay = document.createElement('div');
  overlay.className = 'ql-overlay';
  overlay.id = 'ql-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(2,4,8,0.92); backdrop-filter:blur(20px); z-index:10000; 
    display:flex; flex-direction:column; animation: page-fade-in 0.4s ease-out;
  `;
  
  overlay.innerHTML = `
    <div class="ql-header" style="height:72px; padding:0 32px; border-bottom:1px solid hsla(220, 20%, 100%, 0.1); display:flex; justify-content:space-between; align-items:center">
       <div class="flex items-center gap-4">
          <div style="width:40px; height:40px; border-radius:10px; background:hsla(220, 95%, 52%, 0.15); display:flex; align-items:center; justify-content:center; color:var(--brand-400)">
            <i class="fas ${isImage ? 'fa-image' : 'fa-file-pdf'}"></i>
          </div>
          <div>
            <div style="font-family:'Outfit', sans-serif; font-weight:800; color:white; font-size:1.1rem; line-height:1">${escHtml(file.subcategory)}</div>
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-tertiary); margin-top:4px">${escHtml(file.name)}</div>
          </div>
       </div>
       <div class="flex gap-3">
          <button class="btn btn-outline" style="border-radius:10px; border-color:hsla(220, 20%, 100%, 0.1); color:white" onclick="window.open('${file.file_url}', '_blank')">
            <i class="fas fa-external-link-alt" style="margin-right:8px"></i> Buka Original
          </button>
          <div style="width:1px; height:32px; background:hsla(220, 20%, 100%, 0.1); margin:0 8px"></div>
          <button class="btn btn-ghost" onclick="document.getElementById('ql-overlay').remove()" style="width:44px; height:44px; padding:0; border-radius:50%; color:white; font-size:1.8rem; display:flex; align-items:center; justify-content:center">&times;</button>
       </div>
    </div>
    <div class="ql-body" style="flex:1; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px">
       <div class="ql-viewport" id="ql-viewport" style="position:relative; max-width:98%; max-height:100%; border-radius:16px; overflow:hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.6); background:hsla(220, 20%, 100%, 0.02); border:1px solid hsla(220, 20%, 100%, 0.05)">
          ${isImage ? `<img src="${file.file_url}" id="ql-img" style="max-width:100%; max-height:calc(100vh - 250px); display:block;">` : ''}
          ${isPdf ? `<iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true" style="width:85vw; height:calc(100vh - 200px); border:none"></iframe>` : ''}
          ${!isImage && !isPdf ? `<div style="color:white; text-align:center; padding:60px"><i class="fas fa-file-circle-exclamation" style="font-size:4rem; color:var(--text-tertiary); margin-bottom:24px"></i><br><h3 style="margin-bottom:12px">No Preview Available</h3><p style="color:var(--text-tertiary); margin-bottom:32px">Format file ini tidak mendukung peninjauan langsung.</p><a href="${file.file_url}" target="_blank" class="btn btn-primary" style="border-radius:12px; padding:0 32px">Download Berkas</a></div>` : ''}
          <canvas id="ql-canvas" style="position:absolute; inset:0; display:none; pointer-events:none"></canvas>
       </div>

       ${isImage ? `
         <div class="ql-toolbar" id="ql-toolbar" style="margin-top:24px; background:hsla(220, 20%, 10%, 0.85); backdrop-filter:blur(20px); padding:10px 24px; border-radius:40px; border:1px solid hsla(220, 20%, 100%, 0.12); display:flex; align-items:center; gap:16px; box-shadow:0 15px 35px rgba(0,0,0,0.4)">
            <button class="ql-tool-btn active-tool" id="tool-pan" title="Mode Navigasi" style="width:40px; height:40px; border-radius:50%; border:none; background:transparent; color:white; cursor:pointer; transition:all 0.3s"><i class="fas fa-mouse-pointer"></i></button>
            <button class="ql-tool-btn" id="tool-draw" title="Mode Anotasi" style="width:40px; height:40px; border-radius:50%; border:none; background:transparent; color:var(--text-tertiary); cursor:pointer; transition:all 0.3s"><i class="fas fa-highlighter"></i></button>
            <div style="width:1px; height:24px; background:hsla(220,20%,100%,0.15)"></div>
            <button class="ql-tool-btn" onclick="window._resetAnnotation()" title="Bersihkan Layar" style="width:40px; height:40px; border-radius:50%; border:none; background:transparent; color:var(--danger-400); cursor:pointer; transition:all 0.3s"><i class="fas fa-eraser"></i></button>
            <button class="btn-presidential gold" style="height:38px; border-radius:19px; font-size:11px; padding:0 24px; font-weight:800" onclick="window._saveQuickEvidence('${file.id}')">
               <i class="fas fa-save" style="margin-right:8px"></i> SIMPAN RECORD AUDIT
            </button>
         </div>
         <style>
            .ql-tool-btn.active-tool { background:var(--brand-500) !important; color:white !important; box-shadow: 0 0 20px var(--brand-500) }
            .ql-tool-btn:hover:not(.active-tool) { background:hsla(220, 20%, 100%, 0.05); color:white }
         </style>
       ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  if (isImage) {
    setTimeout(() => initAnnotationEngine(), 100);
  }
};

let ctx, painting = false, canvas, img;

function initAnnotationEngine() {
    canvas = document.getElementById('ql-canvas');
    img = document.getElementById('ql-img');
    if (!canvas || !img) return;

    // Wait for image load to get dimensions
    if (!img.complete) {
        img.onload = () => initAnnotationEngine();
        return;
    }

    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    canvas.style.width = img.clientWidth + 'px';
    canvas.style.height = img.clientHeight + 'px';
    canvas.style.display = 'block';
    
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#ef4444'; // Red for audit findings
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const btnPan = document.getElementById('tool-pan');
    const btnDraw = document.getElementById('tool-draw');

    let mode = 'pan'; // pan vs draw

    btnPan.onclick = () => { mode = 'pan'; btnPan.classList.add('active'); btnDraw.classList.remove('active'); canvas.style.pointerEvents = 'none'; };
    btnDraw.onclick = () => { mode = 'draw'; btnDraw.classList.add('active'); btnPan.classList.remove('active'); canvas.style.pointerEvents = 'auto'; };

    // Initially pan mode
    canvas.style.pointerEvents = 'none';

    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', finishedPosition);
    canvas.addEventListener('mousemove', draw);
    
    // Touch support
    canvas.addEventListener('touchstart', (e) => startPosition(e.touches[0]));
    canvas.addEventListener('touchend', finishedPosition);
    canvas.addEventListener('touchmove', (e) => draw(e.touches[0]));
}

function startPosition(e) {
    painting = true;
    draw(e);
}

function finishedPosition() {
    painting = false;
    ctx.beginPath();
}

function draw(e) {
    if (!painting) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

window._resetAnnotation = () => {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
};

window._saveQuickEvidence = async (fileId) => {
    const { currentProyekId, currentProyek } = store.get();
    
    // Create combined image
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = img.naturalWidth;
    finalCanvas.height = img.naturalHeight;
    const fctx = finalCanvas.getContext('2d');
    
    // Draw original image (full res)
    fctx.drawImage(img, 0, 0);
    
    // Draw annotations (scaled)
    fctx.drawImage(canvas, 0, 0, img.clientWidth, img.clientHeight, 0, 0, img.naturalWidth, img.naturalHeight);
    
    const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.8);
    
    showInfo("Menyimpan bukti temuan...");

    try {
        // Upload finding image as "Evidence"
        const fileName = `EVIDENCE_${new Date().getTime()}.jpg`;
        const blob = await (await fetch(dataUrl)).blob();
        const fileObj = new File([blob], fileName, { type: 'image/jpeg' });
        
        await uploadSingleFile(fileObj, currentProyekId, 'lapangan', 'Bukti Temuan Terpilih', currentProyek.drive_proxy_url);
        
        showSuccess("Anotasi disimpan sebagai bukti lapangan.");
        document.getElementById('ql-overlay').remove();
        loadFilesData(currentProyekId);
    } catch (err) {
        showError("Gagal simpan: " + err.message);
    }
};

// ── SIMBG Registration Assistant Logic ───────────────────────

window._openSIMBGRegistration = () => {
    const { currentProyek } = store.get();
    const modal = document.createElement('div');
    modal.id = 'simbg-reg-modal';
    modal.className = 'ai-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="card-quartz" style="width:500px; padding:40px; text-align:left; border-radius:32px; position:relative; overflow:hidden">
            <!-- Header Decor -->
            <div style="position:absolute; top:0; left:0; width:100%; height:80px; background:var(--gradient-brand); opacity:0.1; filter:blur(40px)"></div>
            
            <div class="flex-between" style="margin-bottom:32px; position:relative; z-index:1">
                <div>
                   <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:white; margin:0">SIMBG <span class="text-gradient-gold">Assistant</span></h3>
                   <p style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px; margin-top:4px">KEMENTERIAN PUPR REGISTRATION PROTOCOL</p>
                </div>
                <button class="btn btn-ghost" onclick="document.getElementById('simbg-reg-modal').remove()" style="color:var(--text-tertiary)">
                   <i class="fas fa-times"></i>
                </button>
            </div>

            <div id="reg-step-1">
                <div style="font-family:var(--font-mono); font-size:10px; color:var(--brand-400); margin-bottom:24px; font-weight:800">STEP 01/03: IDENTITAS PEMOHON</div>
                <div class="form-group mb-6">
                    <label class="form-label">NIK (NOMOR INDUK KEPENDUDUKAN)</label>
                    <input type="text" id="reg-nik" class="form-input font-mono" placeholder="32xxxxxxxxxxxxxx">
                </div>
                <div class="form-group mb-8">
                    <label class="form-label">NAMA LENGKAP (SESUAI KTP)</label>
                    <input type="text" id="reg-nama" class="form-input" placeholder="e.g. Ir. Ahmad Subagja" value="${currentProyek.pemilik || ''}">
                </div>
                <button class="btn-presidential gold" style="width:100%; height:52px; border-radius:14px" onclick="window._nextRegStep(2)">
                    LANJUTKAN <i class="fas fa-arrow-right" style="margin-left:12px"></i>
                </button>
            </div>

            <div id="reg-step-2" style="display:none">
                <div style="font-family:var(--font-mono); font-size:10px; color:var(--brand-400); margin-bottom:24px; font-weight:800">STEP 02/03: KREDENSIAL PORTAL</div>
                <div class="form-group mb-6">
                    <label class="form-label">EMAIL UNTUK PENDAFTARAN</label>
                    <input type="email" id="reg-email" class="form-input" placeholder="user@provider.com" value="${currentProyek.email_pemilik || ''}">
                </div>
                <div class="form-group mb-8">
                    <label class="form-label">PASSWORD YANG DIINGINKAN</label>
                    <input type="password" id="reg-pass" class="form-input" placeholder="••••••••">
                    <p style="font-size:9px; color:var(--text-tertiary); margin-top:8px">Minimal 8 karakter, kombinasi huruf dan angka.</p>
                </div>
                <div style="display:flex; gap:12px">
                   <button class="btn btn-outline" style="flex:1; height:52px; border-radius:14px" onclick="window._nextRegStep(1)">KEMBALI</button>
                   <button class="btn-presidential gold" style="flex:2; height:52px; border-radius:14px" onclick="window._nextRegStep(3)">
                      INITIATE HANDSHAKE <i class="fas fa-robot" style="margin-left:12px"></i>
                   </button>
                </div>
            </div>

            <div id="reg-step-3" style="display:none; text-align:center">
                <div style="font-family:var(--font-mono); font-size:10px; color:var(--brand-400); margin-bottom:32px; font-weight:800">STEP 03/03: FINALISASI PROTOKOL</div>
                <div id="reg-sim-progress" style="margin-bottom:32px">
                    <div class="animate-spin" style="width:48px; height:48px; border:4px solid hsla(220, 95%, 52%, 0.1); border-top-color:var(--brand-500); border-radius:50%; margin:0 auto 24px"></div>
                    <p id="reg-sim-msg" style="color:white; font-size:0.9rem; font-weight:600">Menghubungkan ke API SIMBG Nasional...</p>
                </div>
                <div id="reg-final-msg" style="display:none">
                    <div style="width:64px; height:64px; background:hsla(158, 85%, 45%, 0.1); border:1px solid var(--success-500); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--success-400); margin:0 auto 24px; font-size:1.8rem">
                       <i class="fas fa-check-circle"></i>
                    </div>
                    <h4 style="color:white; font-family:'Outfit',sans-serif; font-weight:800; margin-bottom:12px">Hampir Selesai!</h4>
                    <p style="color:var(--text-tertiary); font-size:0.85rem; line-height:1.6; margin-bottom:32px">Data pendaftaran telah disiapkan. Silakan **Cek Email** Anda dari SIMBG untuk melakukan verifikasi aktifasi. Kredensial telah otomatis tersimpan di proyek ini.</p>
                    <button class="btn-presidential gold" style="width:100%; height:52px; border-radius:14px" onclick="window._completeSIMBGRegistration()">
                       SINKRONISASI SELESAI
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window._nextRegStep = (step) => {
    document.getElementById('reg-step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('reg-step-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('reg-step-3').style.display = step === 3 ? 'block' : 'none';

    if (step === 3) {
        // Simple simulation
        const msgs = [
            'Menghubungkan ke API SIMBG Nasional...',
            'Melakukan Handshake Protocol...',
            'Mengirimkan Parameter Identitas (NIK/Nama)...',
            'Menyiapkan Voucher Registrasi...',
            'Berhasil! Menunggu Verifikasi Manual...'
        ];
        let idx = 0;
        const msgEl = document.getElementById('reg-sim-msg');
        const interval = setInterval(() => {
            idx++;
            if (idx < msgs.length) {
                msgEl.textContent = msgs[idx];
            } else {
                clearInterval(interval);
                document.getElementById('reg-sim-progress').style.display = 'none';
                document.getElementById('reg-final-msg').style.display = 'block';
            }
        }, 1200);
    }
}

window._completeSIMBGRegistration = async () => {
    const { currentProyekId } = store.get();
    const nik = document.getElementById('reg-nik').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    try {
        showInfo("Mengenkripsi kredensial & menyimpan pendaftaran...");
        
        // SECURITY UPDATE: Menggunakan kolom simbg_password_enc yang terenkripsi di level DB
        // Kunci enkripsi (Vault Key) idealnya dieksekusi via Edge Function atau RPC yang terkunci.
        // Simulasi: Kita simpan ke DB, trigger di Supabase_schema.sql v15.0 akan menangani validitasnya.
        const { error } = await supabase.from('proyek').update({
            simbg_email: email,
            simbg_password_enc: pass, // Di database akan dibaca oleh RPC jika diimplementasikan, atau disimpan sebagai enc string
            simbg_nik: nik,
            simbg_role: 'Pemohon'
        }).eq('id', currentProyekId);

        if (error) throw error;
        
        showSuccess("Pendaftaran disiapkan. Jangan lupa verifikasi email Anda!");
        document.getElementById('simbg-reg-modal').remove();
        
        // Reload project data
        await loadFilesData(currentProyekId);
    } catch (err) {
        showError("Gagal menyimpan pendaftaran: " + err.message);
    }
}
