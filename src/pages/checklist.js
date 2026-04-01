/**
 * CHECKLIST PAGE (MODULAR)
 * Main Orchestrator for Building Inspection Checklists.
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
  renderChecklistTable, 
  renderKajianBlocks 
} from '../components/checklist-components.js';
import { 
  ADMIN_ITEMS, 
  TEKNIS_ITEMS, 
  KAJIAN_GROUPS, 
  ADMIN_OPTIONS, 
  CONDITION_OPTIONS 
} from '../lib/checklist-data.js';

export async function checklistPage(params) {
  const proyekId = params.id;
  if (!proyekId || proyekId === 'undefined') { 
    console.warn("[Checklist] Invalid Proyek ID provided");
    navigate('proyek'); 
    return ''; 
  }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = `
    <div class="page-container route-fade">
        <div class="skeleton" style="height:100px; margin-bottom:20px"></div>
        <div class="skeleton" style="height:400px"></div>
    </div>`;

  try {
    // 1. Fetch Project Basics
    const { data: proyek, error } = await supabase.from('proyek').select('*').eq('id', proyekId).maybeSingle();
    
    if (error || !proyek) { 
        console.error("[Checklist] Project not found:", error);
        navigate('proyek'); 
        return; 
    }

    // 2. Load Checklist Data & Sync Store
    store.set({ currentProyek: proyek, currentProyekId: proyekId });
    await loadChecklistData(proyekId);

    render();
  } catch (err) {
    console.error("[Checklist] Initialization error:", err);
    navigate('proyek');
  }
}

function render() {
  const root = document.getElementById('page-root');
  const { currentProyek, checklist } = store.get();
  
  // Render Shell
  root.innerHTML = renderChecklistShell(currentProyek, checklist);
  
  // Render Active Tab Content
  const content = document.getElementById('checklist-content');
  if (content) {
    if (checklist.activeTab === 'admin') {
      content.innerHTML = renderChecklistTable(
        'Dokumen Administrasi', 
        'Verifikasi kelengkapan berkas legal (IMB/PBG, Sertifikat, As-Built).',
        ADMIN_ITEMS, checklist.dataMap, ADMIN_OPTIONS, 'administrasi'
      );
    } else if (checklist.activeTab === 'teknis') {
      content.innerHTML = renderChecklistTable(
        'Evaluasi Teknis PUPR', 
        'Pemeriksaan kondisi eksisting arsitektur, struktur, dan MEP.',
        TEKNIS_ITEMS, checklist.dataMap, CONDITION_OPTIONS, 'teknis'
      );
    } else if (checklist.activeTab === 'kajian') {
      content.innerHTML = renderKajianBlocks(KAJIAN_GROUPS, checklist.dataMap);
    } else if (checklist.activeTab === 'files') {
      content.innerHTML = `<div class="card" style="padding:40px; text-align:center">
         <i class="fas fa-folder-tree" style="font-size:3rem; color:var(--brand-400); margin-bottom:20px"></i>
         <h3>Manajemen Berkas SIMBG</h3>
         <p>Silakan gunakan tombol sinkronisasi berkas untuk memetakan dokumen ke Daftar Simak.</p>
         <button class="btn btn-secondary mt-3" onclick="window.navigate('proyek-files', {id:'${currentProyek.id}'})">Buka Drive Proyek</button>
      </div>`;
    }
  }
}

// ── Shared UI Handlers ────────────────────────────────────────

window._switchTab = (tab) => {
  updateChecklist({ activeTab: tab });
  render();
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

window._onMetadataChange = (kode, metaField, value) => {
  const { checklist } = store.get();
  const item = checklist.dataMap[kode] || { kode };
  
  const updatedItem = { 
     ...item, 
     metadata: { ...(item.metadata || {}), [metaField]: value } 
  };
  
  updateChecklist({ 
     dataMap: { ...checklist.dataMap, [kode]: updatedItem } 
  });
  
  markDirty(kode);
};

window._saveChecklist = async () => {
  await doSave(true);
};

window._toggleVoiceNote = (kode) => {
  toggleVoiceAudit(kode).then(() => render());
};

window._openLiveCamera = (kode, nama, kategori) => {
  openLiveViewfinder(kode, nama, kategori);
};

window._closeCamera = () => {
  closeViewfinder();
};

window._takePhoto = () => {
  takePhoto().then(() => render());
};

window._flipCamera = () => {
  flipCamera();
};

window._showLightbox = (url) => {
  showLightbox(url);
};

window._handleImageSelect = (e, kode, nama, kategori) => {
  runVisionAnalysis(e.target.files, kode, nama, kategori, 'Teknis').then(() => render());
};

window._handleImageDrop = (e, kode, nama, kategori) => {
  e.preventDefault();
  runVisionAnalysis(e.dataTransfer.files, kode, nama, kategori, 'Teknis').then(() => render());
};

window._autoFillFromAgents = () => {
    autoFillFromAgents().then(() => render());
};

window._runBatchSmartEngine = (kategori) => {
    runBatchSmartEngine(kategori).then(() => render());
};

window._triggerGlobalAiSync = () => {
    autoSyncProjectData().then(() => render());
};

window._fetchItemData = (kode, nama) => {
    fetchItemData(kode, nama).then(() => render());
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
    render();
};
