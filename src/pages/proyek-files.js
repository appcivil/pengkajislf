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

window._deletePageFile = async (fid) => {
    if (!confirm('Hapus rujukan berkas?')) return;
    const { currentProyekId } = store.get();
    await supabase.from('proyek_files').delete().eq('id', fid);
    showSuccess("Berkas terhapus.");
    loadFilesData(currentProyekId);
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
