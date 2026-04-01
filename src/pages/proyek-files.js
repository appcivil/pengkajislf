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
  syncWithSIMBG 
} from '../lib/file-service.js';
import { 
  renderFileSidebar, 
  renderFileMain, 
  renderFileGrid 
} from '../components/file-manager-components.js';

const CATEGORIES = [
  { id: 'umum', label: 'Data Umum', icon: 'fa-folder-open', items: ['Data Siteplan', 'Data Penyedia Jasa', 'Laporan Pemeriksaan SLF', 'Surat Pernyataan Kelaikan', 'Persetujuan Lingkungan', 'Data Intensitas (KKPR)', 'Identitas Pemilik (KTP)'] },
  { id: 'tanah', label: 'Tanah & Link.', icon: 'fa-map-marked-alt', items: ['Sertifikat Tanah', 'Izin Pemanfaatan Tanah', 'Gambar Batas Tanah', 'Hasil Penyelidikan Tanah', 'Persetujuan Tetangga', 'SPPL/UKL-UPL'] },
  { id: 'arsitektur', label: 'Arsitektur', icon: 'fa-drafting-compass', items: ['Gambar Detail Bangunan', 'Gambar Tampak', 'Gambar Potongan', 'Gambar Denah', 'Spesifikasi Arsitektur'] },
  { id: 'struktur', label: 'Struktur', icon: 'fa-cubes', items: ['Gambar Detail Tangga', 'Gambar Pelat Lantai', 'Gambar Rangka Atap', 'Gambar Balok', 'Gambar Kolom', 'Gambar Pondasi', 'Perhitungan Struktur'] },
  { id: 'mep', label: 'MEP', icon: 'fa-bolt', items: ['Sistem Kebakaran', 'Pengelolaan Sampah', 'Air Bersih', 'Pencahayaan', 'Sumber Listrik', 'Perhitungan MEP'] },
  { id: 'lapangan', label: 'Pengujian', icon: 'fa-clipboard-check', items: ['Foto Tapak', 'Foto Arsitektur', 'Foto Struktur', 'Foto MEP', 'Hammer Test', 'Core Drill'] },
  { id: 'integrasi', label: 'Integrasi SIMBG', icon: 'fa-robot', items: [] }
];

export async function proyekFilesPage(params = {}) {
  const proyekId = params.id;
  if (!proyekId) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = '<div class="skeleton" style="height:500px"></div>';

  await loadFilesData(proyekId);
}

async function loadFilesData(proyekId) {
  const root = document.getElementById('page-root');
  try {
    const [proyek, files] = await Promise.all([
      fetchProyek(proyekId),
      fetchProyekFiles(proyekId)
    ]);

    if (!proyek) { navigate('proyek'); return; }

    store.set({ currentProyek: proyek, currentProyekId: proyekId });
    updateFiles({ documents: files });

    render(root);
  } catch (err) {
    showError("Gagal load berkas: " + err.message);
  }
}

function render(root) {
  const { currentProyek, files } = store.get();
  const cat = CATEGORIES.find(c => c.id === files.activeCategory);

  root.innerHTML = `
    <div class="file-manager-page">
      <div class="page-header" style="margin-bottom:var(--space-4)">
        <div class="flex-between">
           <div>
              <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${currentProyek.id}'})"><i class="fas fa-arrow-left"></i> ${escHtml(currentProyek.nama_bangunan)}</button>
              <h1 class="page-title">Drive Berkas SIMBG</h1>
           </div>
           <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="window._syncSIMBG()">
                 <i class="fas fa-sync ${files.isSyncing ? 'fa-spin' : ''}"></i> Sinkronisasi SIMBG
              </button>
           </div>
        </div>
      </div>
      
      <div class="file-manager-layout" style="display:flex; height:calc(100vh - 220px); border:1px solid var(--border-subtle); border-radius:16px; overflow:hidden; background:white">
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
        await syncWithSIMBG(currentProyekId);
        showSuccess("Berkas teknis telah sinkron dengan portal SIMBG.");
        render(document.getElementById('page-root'));
    } catch (err) {
        showError("Gagal sinkron: " + err.message);
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
    const payload = {
        drive_proxy_url: document.getElementById('input-drive-proxy').value,
        simbg_email: document.getElementById('input-simbg-email').value,
        simbg_email_verified: document.getElementById('check-simbg-verified').checked
    };

    const { error } = await supabase.from('proyek').update(payload).eq('id', currentProyekId);
    if (!error) {
        showSuccess("Pengaturan disimpan.");
        loadFilesData(currentProyekId);
    } else showError("Gagal menyimpan.");
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
     <div style="grid-column:1/-1; padding:var(--space-6); max-width:800px; margin:0 auto">
        <div class="card" style="padding:var(--space-8); border:2px dashed var(--border-subtle); background:var(--bg-card); text-align:center">
           <i class="fas fa-robot" style="font-size:3rem; color:var(--brand-400); margin-bottom:20px"></i>
           <h2>Integrasi Bot SIMBG & Cloud</h2>
           <p class="text-tertiary">Konfigurasikan akses bot untuk otomatisasi sinkronisasi berkas ke portal pemerintah.</p>
           
           <div style="text-align:left; margin-top:30px">
              <div class="form-group" style="margin-bottom:16px">
                 <label class="form-label">Google Drive Proxy (Web App URL)</label>
                 <input type="text" id="input-drive-proxy" class="form-input" value="${p.drive_proxy_url || ''}" placeholder="https://script.google.com/...">
              </div>
              <div class="form-group" style="margin-bottom:16px">
                 <label class="form-label">Email Terdaftar SIMBG</label>
                 <input type="email" id="input-simbg-email" class="form-input" value="${p.simbg_email || ''}">
              </div>
              <div class="flex items-center gap-3">
                 <input type="checkbox" id="check-simbg-verified" ${p.simbg_email_verified ? 'checked' : ''}>
                 <label for="check-simbg-verified" class="text-sm font-bold">Email telah diverifikasi di portal resmi</label>
              </div>
              <button class="btn btn-primary" style="width:100%; margin-top:20px" onclick="window._saveIntegrationSettings()">
                 <i class="fas fa-save"></i> Simpan Konfigurasi
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
  
  overlay.innerHTML = `
    <div class="ql-header">
       <div class="flex items-center gap-3">
          <i class="fas ${isImage ? 'fa-image' : 'fa-file-pdf'}" style="color:var(--brand-400)"></i>
          <span style="font-weight:700">${escHtml(file.subcategory)}</span>
          <span style="opacity:0.6; font-size:0.8rem">/ ${escHtml(file.name)}</span>
       </div>
       <div class="flex gap-3">
          <button class="btn btn-ghost btn-sm" onclick="window.open('${file.file_url}', '_blank')"><i class="fas fa-external-link-alt"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('ql-overlay').remove()" style="color:white; font-size:1.2rem">&times;</button>
       </div>
    </div>
    <div class="ql-body">
       <div class="ql-viewport" id="ql-viewport">
          ${isImage ? `<img src="${file.file_url}" id="ql-img" style="max-width:100%; max-height:80vh; display:block;">` : ''}
          ${isPdf ? `<iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true" class="ql-iframe"></iframe>` : ''}
          ${!isImage && !isPdf ? `<div style="color:white">Preview tidak tersedia untuk format ini. <a href="${file.file_url}" target="_blank" style="color:var(--brand-400)">Download berkas</a></div>` : ''}
          <canvas id="ql-canvas" class="ql-canvas" style="display:none"></canvas>
       </div>

       ${isImage ? `
         <div class="ql-toolbar" id="ql-toolbar">
            <button class="ql-tool-btn active" id="tool-pan" title="Geser"><i class="fas fa-mouse-pointer"></i></button>
            <button class="ql-tool-btn" id="tool-draw" title="Tandai Temuan (Draw)"><i class="fas fa-highlighter"></i></button>
            <div style="width:1px; height:24px; background:rgba(255,255,255,0.2); margin:0 4px"></div>
            <button class="ql-tool-btn" onclick="window._resetAnnotation()" title="Hapus Semua"><i class="fas fa-trash-can"></i></button>
            <button class="btn btn-primary btn-sm" style="border-radius:20px; padding:0 20px" onclick="window._saveQuickEvidence('${file.id}')">
               <i class="fas fa-save"></i> Simpan Temuan
            </button>
         </div>
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
