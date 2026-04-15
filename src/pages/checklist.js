/**
 * CHECKLIST PAGE (MODULAR - SIDEBAR EDITION)
 * Main Orchestrator for Building Inspection Checklists.
 * Presidential Standard v2.0
 */
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { store, updateChecklist } from '../lib/store.js';
import { 
  loadChecklistData, 
  markDirty, 
  doSave 
} from '../lib/checklist-service.js';
import { 
  runVisionAnalysis, 
  toggleVoiceAudit, 
  autoFillFromAgents,
  runBatchSmartEngine,
  openLiveViewfinder,
  closeViewfinder,
  takePhoto,
  flipCamera,
  showLightbox,
  autoSyncProjectData,
  fetchItemData
} from '../lib/checklist-ai-service.js';
import { 
  renderChecklistShell, 
  renderChecklistSection
} from '../components/checklist-components.js';
import { 
  FULL_CHECKLIST_SCHEMA, 
  CHECKLIST_SECTIONS 
} from '../lib/checklist-full-schema.js';

export async function checklistPage(params) {
  const proyekId = params.id;
  if (!proyekId || proyekId === 'undefined') { 
    navigate('proyek'); 
    return ''; 
  }

  // 1. Fetch Project Basics (Sync for shell)
  const { data: proyek } = await supabase.from('proyek').select('*').eq('id', proyekId).maybeSingle();
  
  if (!proyek) { 
      navigate('proyek'); 
      return ''; 
  }

  // 2. Fetch Latest Analysis (For Damage Category Auto-Fill)
  const { data: analisis } = await supabase.from('hasil_analisis')
    .select('*')
    .eq('proyek_id', proyekId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Set initial store
  store.set({ 
    currentProyek: proyek, 
    currentProyekId: proyekId,
    currentAnalisis: analisis 
  });

  // Ensure checklist state is initialized for new schema
  const { checklist } = store.get();
  updateChecklist({ 
    activeTab: checklist.activeTab || 'identitas',
    fullSchema: FULL_CHECKLIST_SCHEMA 
  });

  return renderChecklistShell(proyek, store.get().checklist);
}

/**
 * Lifecycle Hook: Memuat data dan merender konten tab awal
 */
export async function afterChecklistRender(params) {
  const proyekId = params.id;
  await loadChecklistData(proyekId);
  
  // Perform Auto-Fill for Identity & Damage
  await performAutoFill();
  
  renderTabContent();
}

/**
 * Logic to Auto-Fill Identity and Damage from Project/Analysis table
 */
async function performAutoFill() {
  const { currentProyek, currentAnalisis, checklist } = store.get();
  if (!currentProyek) return;

  const dataMap = { ...checklist.dataMap };
  let isModified = false;

  // 1. Fill Identity (if empty)
  if (!dataMap['ID-01']?.status) { dataMap['ID-01'] = { ...dataMap['ID-01'], status: currentProyek.pemilik || '' }; isModified = true; }
  if (!dataMap['ID-02']?.status) { dataMap['ID-02'] = { ...dataMap['ID-02'], status: currentProyek.alamat || '' }; isModified = true; }
  
  // 2. Fill Damage Category (From Kondisi/Analisis)
  if (!dataMap['ID-03']?.status && currentAnalisis) {
    let cat = 'Tanpa Kerusakan';
    const status = currentAnalisis.status_slf;
    if (status === 'LAIK_FUNGSI_BERSYARAT') cat = 'Rusak Sedang';
    if (status === 'TIDAK_LAIK_FUNGSI') cat = 'Rusak Berat';
    // Logic specific to Damage percentage if available in metadata
    const damagePct = currentAnalisis.metadata?.grandTotalDamage || 0;
    if (damagePct > 0) {
        if (damagePct <= 30) cat = 'Rusak Ringan';
        else if (damagePct <= 45) cat = 'Rusak Sedang';
        else cat = 'Rusak Berat';
    }
    dataMap['ID-03'] = { ...dataMap['ID-03'], status: cat };
    isModified = true;
  }

  // 3. Fill Specific Technical Intensities
  if (!dataMap['TB-04']?.nilai) { dataMap['TB-04'] = { ...dataMap['TB-04'], nilai: currentProyek.kdb || 0 }; isModified = true; }
  if (!dataMap['TB-06']?.nilai) { dataMap['TB-06'] = { ...dataMap['TB-06'], nilai: currentProyek.jumlah_lantai || 1 }; isModified = true; }
  if (!dataMap['TB-08']?.nilai) { dataMap['TB-08'] = { ...dataMap['TB-08'], nilai: currentProyek.gsb || 0 }; isModified = true; }

  if (isModified) {
    updateChecklist({ dataMap });
    // Mark these as dirty so they save to database
    ['ID-01', 'ID-02', 'ID-03', 'TB-04', 'TB-06', 'TB-08'].forEach(k => markDirty(k));
  }
}

function renderTabContent() {
  const { checklist } = store.get();
  const content = document.getElementById('checklist-content');
  if (!content) return;

  const sectionId = checklist.activeTab || 'identitas';
  const sectionItems = FULL_CHECKLIST_SCHEMA.filter(i => i.category === sectionId);
  
  content.innerHTML = renderChecklistSection(sectionId, sectionItems, checklist.dataMap);
  
  // Sync Sidebar Active State
  document.querySelectorAll('.nav-item-quartz').forEach(btn => {
     const isActive = btn.getAttribute('onclick').includes(`'${sectionId}'`);
     btn.classList.toggle('active', isActive);
  });
}

// ── Shared UI Handlers ────────────────────────────────────────

window._switchTab = (tab) => {
  updateChecklist({ activeTab: tab });
  renderTabContent();
  
  // Scroll to top of content
  const wrap = document.getElementById('checklist-content-wrap');
  if (wrap) wrap.scrollTop = 0;
};

window._onFieldChange = (kode, field, value) => {
  const { checklist } = store.get();
  const item = checklist.dataMap[kode] || { kode };
  
  const updatedItem = { ...item, [field]: value };
  updateChecklist({ 
     dataMap: { ...checklist.dataMap, [kode]: updatedItem } 
  });
  
  markDirty(kode);
};

window._saveDraft = async () => {
  const btn = document.querySelector('.btn-secondary');
  if (btn) btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SAVING...';
  
  await doSave(true);
  
  if (btn) btn.innerHTML = '<i class="fas fa-save" style="margin-right:8px"></i> SIMPAN DRAFT';
};

window._toggleVoiceNote = (kode) => {
  toggleVoiceAudit(kode).then(() => renderTabContent());
};

window._openLiveCamera = (kode, nama, kategori) => {
  openLiveViewfinder(kode, nama, kategori);
};

window._closeCamera = () => {
  closeViewfinder();
};

window._takePhoto = () => {
  takePhoto().then(() => renderTabContent());
};

window._flipCamera = () => {
  flipCamera();
};

window._showLightbox = (url) => {
  showLightbox(url);
};

window._handleImageSelect = (e, kode, nama, kategori) => {
  runVisionAnalysis(e.target.files, kode, nama, kategori, 'Teknis').then(() => renderTabContent());
};

window._handleMultiFileSelect = (e, kode, nama, kategori) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  // Proses multi upload dengan loading indicator
  showInfo(`Mengunggah ${files.length} dokumen untuk ${nama}...`);
  
  runVisionAnalysis(files, kode, nama, kategori, 'Teknis')
    .then(() => {
      showSuccess(`${files.length} dokumen berhasil diunggah.`);
      renderTabContent();
    })
    .catch(err => {
      showError('Gagal mengunggah dokumen: ' + err.message);
    });
  
  // Reset input untuk memungkinkan upload file yang sama lagi
  e.target.value = '';
};

window._autoFillFromAgents = () => {
    autoFillFromAgents().then(() => renderTabContent());
};

window._fetchItemData = (kode, nama) => {
    fetchItemData(kode, nama).then(() => renderTabContent());
};

window._removeFile = (kode, url) => {
    if (!confirm("Hapus lampiran ini dari daftar simak?")) return;
    
    const { checklist } = store.get();
    const item = checklist.dataMap[kode];
    if (!item || !item.foto_urls) return;
    
    const updatedUrls = (item.foto_urls || []).filter(u => u !== url);
    const updatedEvidence = (item.evidence_links || []).filter(ev => ev.url !== url);
    
    const updatedItem = { 
      ...item, 
      foto_urls: updatedUrls,
      evidence_links: updatedEvidence
    };
    
    updateChecklist({ 
       dataMap: { ...checklist.dataMap, [kode]: updatedItem } 
    });
    
    markDirty(kode);
    renderTabContent();
};

