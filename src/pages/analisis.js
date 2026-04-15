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
import { SmartAIIntegration } from '../infrastructure/ai/deep-reasoning-integration.js';
import { getPipelineAnalisisIntegration } from '../infrastructure/pipeline/pipeline-analisis-integration.js';

// ── Page Entry ────────────────────────────────────────────────
export async function analisisPage(params = {}) {
  const proyekId = params.id;
  if (!proyekId) { navigate('proyek'); return ''; }

  store.set({ currentProyekId: proyekId });

  // Return the base shell with Modal Container
  return `
    <div id="analisis-shell" class="route-fade">
      ${renderSkeleton()}
    </div>
    
    <!-- Intelligent Discovery Modal -->
    <div id="modular-modal-overlay" class="modal-backdrop" style="display:none">
       <div class="modal-content card-quartz" style="width:700px; max-width:95vw; padding:0; border-radius:16px; overflow:hidden">
          <div class="modal-header flex-between" style="padding:20px 24px; border-bottom:1px solid hsla(220, 20%, 100%, 0.05); background:hsla(224, 25%, 4%, 0.4)">
             <div id="modal-title-area">
                <h3 id="modal-item-name" style="font-family:'Outfit',sans-serif; margin:0">Detail Temuan</h3>
                <p id="modal-item-aspek" style="font-size:10px; color:var(--brand-300); margin:0; text-transform:uppercase; letter-spacing:1px"></p>
             </div>
             <button class="btn btn-ghost btn-sm" onclick="window._closeModularModal()">
                <i class="fas fa-times"></i>
             </button>
          </div>
          <div id="modal-body-area" style="padding:24px; max-height:70vh; overflow-y:auto">
             <!-- Dynamic Content -->
          </div>
          <div id="modal-footer-area" style="padding:16px 24px; border-top:1px solid hsla(220, 20%, 100%, 0.05); text-align:right">
             <button class="btn btn-secondary btn-sm" onclick="window._closeModularModal()">Tutup</button>
          </div>
       </div>
    </div>
  `;
}

/**
 * Lifecycle Hook: Memuat data dan merender konten analisis
 */
export async function afterAnalisisRender(params) {
  const proyekId = params.id;
  await loadData(proyekId);
}

/**
 * Main Data Fetching & Sync
 */
async function loadData(proyekId) {
  const shell = document.getElementById('analisis-shell');
  if (!shell) return;
  
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

    render(shell);
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
      <div class="flex-between flex-stack" style="gap: var(--space-4)">
        <div style="text-align: left">
          <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${currentProyek.id}'})" style="margin-bottom:8px">
            <i class="fas fa-arrow-left"></i> ${escHtml(currentProyek.nama_bangunan)}
          </button>
          <h1 class="page-title">Analisis AI — Kelaikan Fungsi</h1>
          <p class="page-subtitle">
            <span class="badge badge-success" style="font-size:10px; margin-right:8px; vertical-align:middle"><i class="fas fa-brain"></i> DEEP REASONING ACTIVE</span>
            Engine modular berbasis SNI 9273:2025 — Status: ${hasChecklist ? `${checklistData.length} item checklist` : 'Belum diisi'}
          </p>
        </div>
        <div class="flex gap-3" style="width: fit-content">
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
  if (currentAnalisis) {
    // If we have calculation results, show them even if checklist items aren't loaded 
    // (could happen due to partial sync or legacy data)
    contentHtml = renderResultPanel(currentAnalisis, currentProyek, checklistData || []);
  } else if (hasChecklist) {
    // We have checklist items but no AI analysis yet
    contentHtml = renderReadyPanel(currentProyek.id);
  } else {
    // Nothing in DB at all
    contentHtml = renderNoDataPanel(currentProyek.id);
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

    // Call Smart AI Integration with Deep Reasoning logic
    const integration = SmartAIIntegration.getInstance();
    const result = await integration.runAspectAnalysisWithDeepReasoning(aspekTarget, targetItems);
    
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

window._runSingleItemAnalysis = async (itemId, aspek) => {
    const { checklistData, currentProyekId, proyekFiles } = store.get();
    const item = checklistData.find(it => it.id === itemId);
    if (!item) return;

    try {
        showAIProgress('Deep Reasoning', `Menganalisis: ${item.nama}...`);
        
        // Find relevant files for this item (Self-Correction: Using Auto-Link Logic)
        const relevantEvidence = (proyekFiles || []).filter(f => 
            f.category === 'nspk' || 
            f.category === 'lapangan' || 
            f.category === item.kategori
        ).map(f => ({
            id: f.id,
            name: f.name,
            category: f.category,
            url: f.file_url,
            abstract: f.ai_analysis || '-'
        }));

        const integration = SmartAIIntegration.getInstance();
        const result = await integration.analyzeWithDeepReasoning(item, aspek, { 
            evidence: relevantEvidence 
        });
        
        // Simpan ke catatan item di DB
        const { error } = await supabase
            .from('checklist_items')
            .update({ 
                catatan: result.analysis, // Hasil naratif
                status: result.status,
                metadata: {
                    deep_reasoning: {
                        steps: result.reasoning_steps,
                        confidence: result.confidence_score,
                        rules: result.rules_matched
                    }
                }
            })
            .eq('id', itemId);

        if (error) throw error;

        // Refresh Local State
        const updatedData = checklistData.map(it => it.id === itemId ? { 
            ...it, 
            catatan: result.analysis, 
            status: result.status,
            metadata: { ...it.metadata, deep_reasoning: result }
        } : it);
        
        store.set({ checklistData: updatedData });
        
        hideAIProgress();
        showSuccess(`Analisis selesai untuk ${item.nama}`);
        render(document.getElementById('page-root'));

    } catch (err) {
        hideAIProgress();
        showError('Gagal Analisis Item: ' + err.message);
    }
};

window._showModularDetail = async (itemId, aspek) => {
    const { checklistData } = store.get();
    const item = checklistData.find(i => i.id === itemId);
    if (!item) return;

    const overlay = document.getElementById('modular-modal-overlay');
    const title = document.getElementById('modal-item-name');
    const aspekSub = document.getElementById('modal-item-aspek');
    const body = document.getElementById('modal-body-area');

    if (!overlay || !body) return;

    title.textContent = item.nama || 'Detail Item';
    aspekSub.textContent = aspek || item.kategori || 'Audit Teknis';
    
    // Build Modal Body
    body.innerHTML = renderDetailedModularAudit(item);

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));
};

window._closeModularModal = () => {
    const overlay = document.getElementById('modular-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
};

window._runNSPKBotForItem = async (itemId, itemName) => {
    const { currentProyekId } = store.get();
    
    try {
        showAIProgress('NSPK Intelligence', `Bot sedang mencari referensi hukum untuk ${itemName}...`);
        
        const result = await runNSPKBot(itemName, currentProyekId);
        
        hideAIProgress();
        
        if (result && result.status === 'success') {
            showSuccess(`Berhasil memetakan referensi: ${result.name}`);
        } else if (result && result.status === 'not_found') {
            showInfo(`Bot tidak menemukan dokumen spesifik untuk "${result.query}" di Drive global.`);
        }
    } catch (err) {
        hideAIProgress();
        showError('Kesalahan bot: ' + err.message);
    }
};

// ── SmartAI Pipeline Integration ────────────────────────────────

window._runAspectWithPipeline = async (aspekTarget) => {
    const { currentProyekId, checklistData, currentAnalisis, proyekFiles } = store.get();
    
    try {
        showAIProgress(`Analisis Pipeline ${aspekTarget}`, 'Menginisialisasi pipeline AI...');
        
        const targetItems = checklistData.filter(item => {
            const itemAsp = item.kategori === 'administrasi' ? 'Administrasi' : (item.aspek || 'Lainnya');
            return itemAsp === aspekTarget;
        });

        if (targetItems.length === 0) {
            hideAIProgress();
            showError(`Tidak ada data untuk aspek ${aspekTarget}`);
            return;
        }

        // Initialize Pipeline Integration
        const pipelineAnalisis = getPipelineAnalisisIntegration();
        await pipelineAnalisis.initialize();
        
        showAIProgress(`Analisis ${aspekTarget}`, 'Meng-query knowledge base dengan RAG...');
        
        // Run analysis dengan RAG
        const result = await pipelineAnalisis.analyzeAspectWithRAG(aspekTarget, targetItems, {
            projectId: currentProyekId,
            evidence: proyekFiles || []
        });
        
        showAIProgress(`Analisis ${aspekTarget}`, 'Menyimpan hasil...');
        
        // Update DB dengan hasil dari Pipeline
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
            narasi_teknis: result.narasi_teknis,
            metadata: {
                ...(currentAnalisis?.metadata || {}),
                pipeline_analysis: {
                    aspek: aspekTarget,
                    timestamp: new Date().toISOString(),
                    rag_stats: pipelineAnalisis.getRAGStats(),
                    regulasi_references: result.regulasi_references,
                    confidence: result.confidence
                }
            },
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('hasil_analisis').upsert(payload, { onConflict: 'proyek_id' }).select().single();
        if (error) throw error;

        store.set({ currentAnalisis: data });
        hideAIProgress();
        showSuccess(`Analisis ${aspekTarget} dengan Pipeline AI berhasil! (${result.regulasi_references?.length || 0} referensi regulasi ditemukan)`);
        render(document.getElementById('page-root'));

    } catch (err) {
        hideAIProgress();
        console.error('[Pipeline Analysis Error]', err);
        showError('Gagal analisis dengan Pipeline: ' + err.message);
    }
};

window._runSingleItemWithPipeline = async (itemId, aspek) => {
    const { checklistData, currentProyekId, proyekFiles } = store.get();
    const item = checklistData.find(it => it.id === itemId);
    if (!item) return;

    try {
        showAIProgress('Pipeline Deep Analysis', `Menganalisis: ${item.nama}...`);
        
        const pipelineAnalisis = getPipelineAnalisisIntegration();
        await pipelineAnalisis.initialize();
        
        // Analisis dengan RAG
        const result = await pipelineAnalisis.analyzeWithRAG(item, aspek, {
            projectId: currentProyekId,
            evidence: proyekFiles || []
        });
        
        // Simpan ke catatan item di DB
        const { error } = await supabase
            .from('checklist_items')
            .update({ 
                catatan: result.analysis,
                status: result.status,
                metadata: {
                    ...(item.metadata || {}),
                    pipeline_analysis: {
                        timestamp: new Date().toISOString(),
                        rag_context: result.ragContext?.length || 0,
                        sources: result.sources,
                        confidence: result.confidence
                    }
                }
            })
            .eq('id', itemId);

        if (error) throw error;

        // Refresh Local State
        const updatedData = checklistData.map(it => it.id === itemId ? { 
            ...it, 
            catatan: result.analysis, 
            status: result.status,
            metadata: { ...it.metadata, pipeline_analysis: result }
        } : it);
        
        store.set({ checklistData: updatedData });
        
        hideAIProgress();
        showSuccess(`Pipeline analysis selesai untuk ${item.nama}`);
        render(document.getElementById('page-root'));

    } catch (err) {
        hideAIProgress();
        console.error('[Pipeline Single Item Error]', err);
        showError('Gagal Pipeline Analysis: ' + err.message);
    }
};

window._queryRegulasiWithPipeline = async (query) => {
    try {
        showAIProgress('RAG Query', 'Mencari referensi regulasi...');
        
        const pipelineAnalisis = getPipelineAnalisisIntegration();
        await pipelineAnalisis.initialize();
        
        const result = await pipelineAnalisis.queryRegulasi(query, {
            topK: 5,
            minScore: 0.6
        });
        
        hideAIProgress();
        
        if (result.chunks?.length === 0) {
            showInfo('Tidak ditemukan referensi regulasi untuk query tersebut');
            return null;
        }
        
        // Return result untuk ditampilkan di modal
        return result;
        
    } catch (err) {
        hideAIProgress();
        console.error('[Pipeline Query Error]', err);
        showError('Gagal query regulasi: ' + err.message);
        return null;
    }
};
