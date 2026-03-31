/**
 * ANALISIS AI PAGE (Refactored)
 * Modular architecture using Scoring Engine and Centralized Store.
 */
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { store, updateUI } from '../lib/store.js';
import { 
  BOBOT_ASPEK, 
  calculateTotalScore, 
  determineSLFStatus, 
  determineRiskLevel 
} from '../lib/scoring-engine.js';
import { 
  escHtml, 
  formatTanggal, 
  riskColor, 
  riskLabel 
} from '../lib/utils.js';
import { 
  renderSkeleton, 
  renderNoDataPanel, 
  renderReadyPanel, 
  renderResultPanel,
  renderDetailedModularAudit 
} from '../components/analisis-components.js';
import { 
  runAspectAnalysis, 
  runFinalConclusion, 
  runSingleItemAnalysis, 
  getMultiAgentConsensus 
} from '../lib/ai-router.js';
import { runNSPKBot } from '../lib/nspk-bot.js';

// ── Page Entry ────────────────────────────────────────────────
export async function analisisPage(params = {}) {
  const proyekId = params.id;
  if (!proyekId) { navigate('proyek'); return ''; }

  // Update Store
  store.set({ currentProyekId: proyekId });

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  await loadData(proyekId);
}

/**
 * Main Data Fetching & Sync
 */
async function loadData(proyekId) {
  const root = document.getElementById('page-root');
  
  try {
    const [proyek, checklistData, lastAnalisis, proyekFiles] = await Promise.all([
      fetchProyek(proyekId),
      fetchChecklist(proyekId),
      fetchLastAnalisis(proyekId),
      fetchProyekFiles(proyekId)
    ]);

    if (!proyek) {
      navigate('proyek');
      showError('Proyek tidak ditemukan.');
      return;
    }

    // Sync Store
    store.set({
      currentProyek: proyek,
      checklistData,
      currentAnalisis: lastAnalisis,
      proyekFiles
    });

    render(root);
  } catch (err) {
    console.error('[Analisis] Load Failed:', err);
    showError('Gagal memuat data analisis: ' + err.message);
  }
}

/**
 * Render Logic
 */
function render(root) {
  const { currentProyek, checklistData, currentAnalisis, ui } = store.get();
  const hasChecklist = checklistData && checklistData.length > 0;

  // Header UI
  const headerHtml = `
    <div class="page-header">
      <div class="flex-between">
        <div>
          <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${currentProyek.id}'})" style="margin-bottom:8px">
            <i class="fas fa-arrow-left"></i> ${escHtml(currentProyek.nama_bangunan)}
          </button>
          <h1 class="page-title">Analisis AI — Kelaikan Fungsi</h1>
          <p class="page-subtitle">Engine modular berbasis SNI 9273:2025 — Status: ${hasChecklist ? `${checklistData.length} item checklist` : 'Belum diisi'}</p>
        </div>
        <div class="flex gap-3">
          ${hasChecklist ? `
            <button class="btn btn-secondary" onclick="window.navigate('checklist',{id:'${currentProyek.id}'})">
              <i class="fas fa-clipboard-check"></i> Edit Checklist
            </button>
          ` : `
            <button class="btn btn-primary" onclick="window.navigate('checklist',{id:'${currentProyek.id}'})">
              <i class="fas fa-clipboard-check"></i> Isi Checklist
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  let contentHtml = '';
  if (!hasChecklist) {
    contentHtml = renderNoDataPanel(currentProyek.id);
  } else if (!currentAnalisis) {
    contentHtml = renderReadyPanel(currentProyek.id);
  } else {
    contentHtml = renderResultPanel(currentAnalisis, currentProyek, checklistData);
  }

  root.innerHTML = `<div id="analisis-page">${headerHtml}${contentHtml}</div>`;
  
  if (currentAnalisis) {
    initRadarChart(currentAnalisis);
  }
}

// ── Global Handlers (Exposed to Window) ────────────────────────

window._switchModularTab = (aspek) => {
  updateUI({ activeModularTab: aspek });
  const root = document.getElementById('page-root');
  if (root) render(root);
};

window._renderDetailedModularAudit = (checklistData) => {
  const { ui, proyekFiles } = store.get();
  return renderDetailedModularAudit(checklistData, ui.activeModularTab, proyekFiles);
};

window._runAspect = async (aspekTarget) => {
  const { currentProyekId, checklistData, currentAnalisis } = store.get();
  
  try {
    showAIProgress(`Sintesis ${aspekTarget}`, 'Menganalisis parameter teknis...');
    
    const targetItems = checklistData.filter(item => {
      const itemAsp = item.kategori === 'administrasi' ? 'Administrasi' : (item.aspek || 'Lainnya');
      return itemAsp === aspekTarget;
    });

    if (targetItems.length === 0) {
      hideAIProgress();
      showError(`Tidak ada data untuk aspek ${aspekTarget}`);
      return;
    }

    // Call AI Router
    const result = await runAspectAnalysis(aspekTarget, targetItems);
    
    // Update DB & Local Store
    const colMap = {
      'Administrasi': 'skor_administrasi',
      'Pemanfaatan': 'skor_mep',
      'Arsitektur': 'skor_arsitektur',
      'Struktur': 'skor_struktur',
      'Mekanikal': 'skor_kebakaran',
      'Kesehatan': 'skor_kesehatan',
      'Kenyamanan': 'skor_kenyamanan',
      'Kemudahan': 'skor_kemudahan'
    };
    
    const payload = {
      proyek_id: currentProyekId,
      [colMap[aspekTarget]]: result.skor_aspek,
      narasi_teknis: result.narasi_teknis, // Should implement smart merge in production
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('hasil_analisis').upsert(payload, { onConflict: 'proyek_id' }).select().single();
    if (error) throw error;

    store.set({ currentAnalisis: data });
    hideAIProgress();
    showSuccess(`Analisis ${aspekTarget} berhasil diperbarui.`);
    render(document.getElementById('page-root'));

  } catch (err) {
    hideAIProgress();
    showError('Gagal menjalankan analisis: ' + err.message);
  }
};

window._runFinalConclusion = async () => {
    const { currentAnalisis, currentProyekId } = store.get();
    if (!currentAnalisis) return;

    try {
        showAIProgress('Kesimpulan Final', 'Menyusun status kelaikan akhir...');
        
        const scores = {
            administrasi: currentAnalisis.skor_administrasi || 0,
            struktur: currentAnalisis.skor_struktur || 0,
            arsitektur: currentAnalisis.skor_arsitektur || 0,
            mep: currentAnalisis.skor_mep || 0,
            kebakaran: currentAnalisis.skor_kebakaran || 0,
            kesehatan: currentAnalisis.skor_kesehatan || 0,
            kenyamanan: currentAnalisis.skor_kenyamanan || 0,
            kemudahan: currentAnalisis.skor_kemudahan || 0,
        };

        const totalScore = calculateTotalScore(scores);
        const statusSlf = determineSLFStatus(scores, totalScore);
        const riskLevel = determineRiskLevel(totalScore);

        const payload = {
            proyek_id: currentProyekId,
            skor_total: totalScore,
            status_slf: statusSlf,
            risk_level: riskLevel,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('hasil_analisis').upsert(payload, { onConflict: 'proyek_id' }).select().single();
        if (error) throw error;

        // Update Proyek Table
        await supabase.from('proyek').update({ status_slf: statusSlf }).eq('id', currentProyekId);

        store.set({ currentAnalisis: data });
        hideAIProgress();
        showSuccess('Kesimpulan Final SLF Berhasil Diterbitkan!');
        render(document.getElementById('page-root'));

    } catch (err) {
        hideAIProgress();
        showError('Gagal merumuskan kesimpulan: ' + err.message);
    }
};

// ── Radar Chart Logic ─────────────────────────────────────────

function initRadarChart(result) {
  const ctx = document.getElementById('radar-chart');
  if (!ctx || !window.Chart) return;

  new window.Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Admin', 'Manfaat', 'Arsitek', 'Struktur', 'Mekanik', 'Kesehatan', 'Nyaman', 'Mudah'],
      datasets: [{
        label: 'Skor',
        data: [
          result.skor_administrasi || 0,
          result.skor_mep || 0,
          result.skor_arsitektur || 0,
          result.skor_struktur || 0,
          result.skor_kebakaran || 0,
          result.skor_kesehatan || 0,
          result.skor_kenyamanan || 0,
          result.skor_kemudahan || 0,
        ],
        backgroundColor: 'hsla(220,70%,48%,0.1)',
        borderColor:     'hsl(220,70%,56%)',
        borderWidth: 2,
        pointBackgroundColor: 'hsl(220,70%,56%)',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: { min: 0, max: 100, ticks: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// ── AI Progress UI Helpers (Keep simple or move to another component) ──

function showAIProgress(title, msg) {
    const overlay = document.getElementById('ai-progress-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    }
}

function hideAIProgress() {
    const overlay = document.getElementById('ai-progress-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
}

// ── Data Fetchers ─────────────────────────────────────────────

async function fetchProyek(id) {
  const { data } = await supabase.from('proyek').select('id,nama_bangunan').eq('id', id).maybeSingle();
  return data;
}

async function fetchChecklist(proyekId) {
  const { data } = await supabase.from('checklist_items').select('*').eq('proyek_id', proyekId);
  return data || [];
}

async function fetchLastAnalisis(proyekId) {
  const { data } = await supabase.from('hasil_analisis').select('*').eq('proyek_id', proyekId).maybeSingle();
  return data;
}

async function fetchProyekFiles(proyekId) {
  const { data } = await supabase.from('proyek_files').select('*').eq('proyek_id', proyekId);
  return data || [];
}

window._showModularDetail = async (itemId, aspek) => {
    // Implement modular detail modal logic or move to separate file if too big
    showInfo("Fitur ini sedang dimigrasikan ke arsitektur baru.");
};
