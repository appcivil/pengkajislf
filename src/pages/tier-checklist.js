/**
 * TIER CHECKLIST PAGE
 * ASCE 41-17 Evaluation Page (Tier 1, 2, 3)
 */

import { 
  renderTierChecklistShell,
  renderTier1Section,
  renderTier2Section,
  renderTier3Section,
  renderStatusSummary
} from '../components/tier-checklist-components.js';

import {
  TIER1_CHECKLIST,
  TIER2_CHECKLIST,
  calculateDCR,
  getDCRStatus,
  checkTier1NeedsTier2,
  checkTier2NeedsTier3
} from '../lib/asce41-tier-data.js';

import {
  initLocalDB,
  saveChecklist,
  getChecklist,
  scheduleAutoSave,
  exportProjectToJSON,
  importProjectFromJSON
} from '../lib/local-data-manager.js';

import { showSuccess, showError, showInfo } from '../components/toast.js';

let currentProyek = null;
let activeTier = 'tier1';
let tierData = {
  tier1: {},
  tier2: {},
  tier3: {}
};

export async function tierChecklistPage(params = {}) {
  const root = document.getElementById('page-root');
  if (!root) return '';
  
  // Get project data
  const proyekId = params.id || params.proyekId;
  if (proyekId) {
    // Load from Supabase or IndexedDB
    try {
      const { supabase } = await import('../lib/supabase.js');
      const { data } = await supabase.from('proyek').select('*').eq('id', proyekId).single();
      currentProyek = data;
    } catch (err) {
      console.warn('[TierPage] Failed to load project from Supabase:', err);
      // Fallback: try to load from local DB
      const { getProject } = await import('../lib/local-data-manager.js');
      currentProyek = await getProject(proyekId);
    }
  }
  
  // Initialize DB
  await initLocalDB();
  
  // Load saved data
  await loadTierData(proyekId);
  
  // Render shell
  root.innerHTML = renderTierChecklistShell(currentProyek, activeTier);
  
  // Render initial tier content
  renderTierContent();
  updateStatusSummary();
  
  // Setup global functions
  setupGlobalFunctions();
  
  return root.innerHTML;
}

async function loadTierData(proyekId) {
  if (!proyekId) return;
  
  try {
    const [tier1, tier2, tier3] = await Promise.all([
      getChecklist(proyekId, 'tier1'),
      getChecklist(proyekId, 'tier2'),
      getChecklist(proyekId, 'tier3')
    ]);
    
    tierData.tier1 = tier1?.data || {};
    tierData.tier2 = tier2?.data || {};
    tierData.tier3 = tier3?.data || {};
  } catch (err) {
    console.warn('[TierPage] Error loading tier data:', err);
  }
}

function renderTierContent() {
  const content = document.getElementById('tier-content');
  if (!content) return;
  
  switch (activeTier) {
    case 'tier1':
      content.innerHTML = renderTier1Section(tierData.tier1);
      break;
    case 'tier2':
      content.innerHTML = renderTier2Section(tierData.tier2);
      break;
    case 'tier3':
      content.innerHTML = renderTier3Section(tierData.tier3);
      break;
  }
}

function updateStatusSummary() {
  const summary = document.getElementById('status-summary-content');
  if (summary) {
    summary.innerHTML = renderStatusSummary(tierData.tier1, tierData.tier2, tierData.tier3);
  }
}

function setupGlobalFunctions() {
  // Tier switching
  window._switchTier = (tier) => {
    activeTier = tier;
    
    // Update button states
    document.querySelectorAll('.tier-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tier === tier);
    });
    
    renderTierContent();
  };
  
  // Tier 1 status setting
  window._setTier1Status = (kode, status) => {
    if (!tierData.tier1[kode]) {
      tierData.tier1[kode] = {};
    }
    tierData.tier1[kode].status = status;
    
    // Schedule auto-save
    if (currentProyek?.id) {
      scheduleAutoSave(currentProyek.id, () => saveTierData('tier1'));
    }
    
    // Re-render to update highlighting
    renderTierContent();
    updateStatusSummary();
    
    // Show notification if NC
    if (status === 'NC') {
      showInfo(`Item ${kode} Non-Compliant - Evaluasi Tier 2 diperlukan`);
    }
  };
  
  // Tier 2 field updates
  window._updateTier2Field = (kode, field, value) => {
    if (!tierData.tier2[kode]) {
      tierData.tier2[kode] = {};
    }
    tierData.tier2[kode][field] = parseFloat(value) || value;
    
    // Calculate DCR if needed
    calculateAndUpdateDCR(kode);
    
    // Schedule auto-save
    if (currentProyek?.id) {
      scheduleAutoSave(currentProyek.id, () => saveTierData('tier2'));
    }
  };
  
  // Tier 3 field updates
  window._updateTier3Field = (kode, field, value) => {
    if (!tierData.tier3[kode]) {
      tierData.tier3[kode] = {};
    }
    tierData.tier3[kode][field] = value;
    
    if (currentProyek?.id) {
      scheduleAutoSave(currentProyek.id, () => saveTierData('tier3'));
    }
  };
  
  // Save draft
  window._saveTierDraft = async () => {
    try {
      await Promise.all([
        saveTierData('tier1'),
        saveTierData('tier2'),
        saveTierData('tier3')
      ]);
      showSuccess('Draft berhasil disimpan');
    } catch (err) {
      showError('Gagal menyimpan draft: ' + err.message);
    }
  };
  
  // Check Tier 1 completeness
  window._checkTier1Complete = () => {
    const ncItems = checkTier1NeedsTier2(tierData.tier1);
    if (ncItems) {
      showInfo(`${ncItems.length} item NC terdeteksi. Lanjutkan ke Tier 2 untuk evaluasi lebih lanjut.`);
      // Auto-switch to Tier 2 after delay
      setTimeout(() => window._switchTier('tier2'), 2000);
    } else {
      showSuccess('Semua item Tier 1 Compliant atau N/A');
    }
  };
  
  // Check Tier 2 completeness
  window._checkTier2Complete = () => {
    const tier3Needed = checkTier2NeedsTier3(tierData.tier2);
    if (tier3Needed) {
      showInfo(`${tier3Needed.length} item memerlukan Tier 3 (Pushover Analysis).`);
      // Show warning banner
      const banner = document.getElementById('dcr-warning-banner');
      if (banner) banner.style.display = 'block';
    } else {
      showSuccess('Semua DCR dalam batas aman (<= 2.0)');
    }
  };
  
  // Show pasal reference
  window._showPasalRef = (pasal) => {
    // Could open a modal with pasal reference
    showInfo(`Referensi: ${pasal} - Lihat dokumen ASCE 41-17 atau SNI untuk detail`);
  };
  
  // Import Pushover CSV
  window._importPushoverCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const { parsePushoverCSV } = await import('../lib/pushover-visualizer.js');
        const data = parsePushoverCSV(text);
        
        // Store data
        tierData.tier3.pushoverData = data;
        
        // Plot the curve
        window._plotPushoverCurve();
        
        showSuccess(`Data pushover dimuat: ${data.length} titik`);
      } catch (err) {
        showError('Gagal membaca file CSV: ' + err.message);
      }
    };
    input.click();
  };
  
  // Plot pushover curve
  window._plotPushoverCurve = async () => {
    const container = document.getElementById('pushover-plot-container');
    if (!container || !tierData.tier3.pushoverData) return;
    
    try {
      const { generatePushoverSVG, calculatePushoverMetrics } = await import('../lib/pushover-visualizer.js');
      const metrics = calculatePushoverMetrics(tierData.tier3.pushoverData);
      
      container.innerHTML = generatePushoverSVG(tierData.tier3.pushoverData, {
        width: container.clientWidth,
        height: 400,
        performancePoint: metrics ? {
          displacement: metrics.yield.displacement,
          baseShear: metrics.yield.baseShear
        } : null
      });
      
      // Store metrics
      tierData.tier3.pushoverMetrics = metrics;
    } catch (err) {
      console.error('[Pushover] Plot error:', err);
    }
  };
  
  // Export/Import
  window._exportTierData = () => {
    if (!currentProyek?.id) {
      showError('Tidak ada proyek aktif');
      return;
    }
    exportProjectToJSON(currentProyek.id);
  };
  
  window._importTierData = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        await importProjectFromJSON(text);
        showSuccess('Data berhasil diimport');
        // Reload page
        window.location.reload();
      } catch (err) {
        showError('Gagal import data: ' + err.message);
      }
    };
    input.click();
  };
}

async function saveTierData(tier) {
  if (!currentProyek?.id) return;
  await saveChecklist(currentProyek.id, tier, tierData[tier]);
}

function calculateAndUpdateDCR(kode) {
  const data = tierData.tier2[kode];
  if (!data) return;
  
  let dcr = 0;
  
  // Calculate based on item type
  if (kode.includes('DCR1')) {
    // DCR Beams: M_demand / M_capacity
    if (data.demand && data.capacity) {
      dcr = calculateDCR(data.demand, data.capacity);
    }
  } else if (kode.includes('DCR2')) {
    // DCR Columns: max(P_demand/Pn, M_demand/Mn)
    const dcrP = data.p_demand && data.p_capacity ? data.p_demand / data.p_capacity : 0;
    const dcrM = data.m_demand && data.m_capacity ? data.m_demand / data.m_capacity : 0;
    dcr = Math.max(dcrP, dcrM);
  } else if (kode.includes('DCR3') || kode.includes('DCR4')) {
    // Shear DCR
    if (data.v_demand && data.v_capacity) {
      dcr = calculateDCR(data.v_demand, data.v_capacity);
    }
  } else if (kode.includes('DCR5')) {
    // Connection DCR
    if (data.m_conn_demand && data.m_conn_capacity) {
      dcr = calculateDCR(data.m_conn_demand, data.m_conn_capacity);
    }
  }
  
  data.dcr = dcr;
  
  // Update UI
  const valueEl = document.getElementById(`dcr-value-${kode}`);
  const statusEl = document.getElementById(`dcr-status-${kode}`);
  const messageEl = document.getElementById(`dcr-message-${kode}`);
  
  if (valueEl) valueEl.textContent = dcr.toFixed(2);
  
  if (statusEl && messageEl) {
    const status = getDCRStatus(dcr, 2.0);
    statusEl.textContent = status.status;
    statusEl.style.background = status.color + '22';
    statusEl.style.color = status.color;
    messageEl.textContent = status.message;
    
    // Highlight if > 2.0
    const itemEl = document.querySelector(`[data-kode="${kode}"]`);
    if (itemEl) {
      itemEl.style.borderColor = dcr > 2.0 ? status.color + '66' : 'hsla(220, 20%, 100%, 0.05)';
    }
  }
}

export function afterTierChecklistRender(params) {
  // Additional setup after render
  console.log('[TierPage] Render complete', params);
}
