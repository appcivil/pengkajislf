import { generateSLFReport } from '../lib/report-service.js';
import { supabase } from '../lib/supabase.js';
import { AGENT_CONFIG } from '../lib/multi-agent-service.js';
import { showError, showSuccess } from '../components/toast.js';

let _sessionResults = {};
let _selectedProyekId = null;
let _editingAgentId = null;
let _cachedProyekList = [];
let _cachedAllPrompts = [];
let _cachedDefaultPrinciples = {};

/**
 * PAGE ENTRY POINT
 */
export async function multiAgentPage(params = {}) {
  _selectedProyekId = params.proyekId || null;
  
  if (_cachedProyekList.length === 0 || params.refresh) {
    try {
      const { fetchAllAgentPrompts, DEFAULT_PRINCIPLES } = await import('../lib/prompt-config-service.js');
      _cachedDefaultPrinciples = DEFAULT_PRINCIPLES;
      _cachedProyekList = await fetchProyekList();
      _cachedAllPrompts = await fetchAllAgentPrompts();
    } catch (err) {
      console.error("Fetch data failed:", err);
    }
  }

  return buildHtml();
}

async function fetchProyekList() {
  try {
    const { data } = await supabase.from('proyek').select('id, nama_bangunan').order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
}

function buildHtml() {
  if (_editingAgentId) {
    return renderEditor();
  }
  return renderGrid();
}

/**
 * RENDER GRID VIEW (Daftar 15 Agen & Download Laporan)
 */
function renderGrid() {
  return `
    <div id="multiagent-page" class="fade-in" style="padding-bottom:100px">
      <!-- Header Section -->
      <div class="page-header" style="text-align:center;margin-bottom:var(--space-6)">
        <div style="width:72px;height:72px;border-radius:var(--radius-xl);background:var(--gradient-brand);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);font-size:2rem;color:white;box-shadow:0 10px 25px hsla(258,80%,56%,0.4)">
          <i class="fas fa-microchip"></i>
        </div>
        <h1 class="page-title" style="font-size:2.2rem;margin-bottom:8px">Deep Reasoning Center</h1>
        <p class="page-subtitle" style="max-width:800px;margin:0 auto;margin-bottom:24px">
          Pusat kendali 15 AI Ahli. Konfigurasikan instruksi ahli atau luncurkan laporan teknis otomatis.
        </p>

        <!-- Project & Report Controls -->
        <div class="card-glass" style="max-width:700px; margin:0 auto; padding:16px; display:flex; gap:12px; align-items:center; justify-content:center; border-radius:16px">
          <div style="flex:1; text-align:left">
            <label class="text-xs font-bold mb-1 block" style="color:var(--text-tertiary)">PILIH PROYEK UNTUK LAPORAN:</label>
            <select id="select-proyek-report" class="form-input" style="width:100%">
              <option value="">-- Pilih Proyek --</option>
              ${_cachedProyekList.map(p => `
                <option value="${p.id}" ${p.id === _selectedProyekId ? 'selected' : ''}>${p.nama_bangunan}</option>
              `).join('')}
            </select>
          </div>
          <button id="btn-download-report" class="btn btn-primary" style="height:42px; margin-top:18px" ${_selectedProyekId ? '' : 'disabled'}>
            <i class="fas fa-file-word"></i> Luncurkan Laporan (.docx)
          </button>
        </div>
      </div>

      <div class="agent-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
        ${AGENT_CONFIG.map((a, idx) => {
          const pData = _cachedAllPrompts.find(p => p.agent_id === a.id);
          const mission = pData?.mission || _cachedDefaultPrinciples.mission || 'Belum diatur';
          
          return `
            <div class="agent-card card-glass" id="card-${a.id}" style="display:flex; flex-direction:column; min-height:220px; transition:all 0.3s ease; position:relative; overflow:hidden">
              <div class="ac-header" style="background:rgba(255,255,255,0.03); padding:16px; border-bottom:1px solid var(--border-subtle); display:flex; align-items:center; gap:12px">
                <div class="ac-avatar" style="background:${a.color}; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white"><i class="fas ${a.icon}"></i></div>
                <div class="ac-info">
                  <div class="ac-name" style="font-size:0.9rem; font-weight:800">${a.name}</div>
                  <div class="ac-role" style="font-size:0.65rem; color:var(--text-tertiary)">${a.id.toUpperCase()}</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:8px">
                  <button class="btn-run-agent" data-id="${a.id}" title="Jalankan Analisis" style="background:var(--bg-elevated); border:1px solid var(--border-subtle); color:var(--success-400); width:32px; height:32px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center">
                    <i class="fas fa-play"></i>
                  </button>
                  <button class="btn-edit-agent" data-id="${a.id}" title="Atur Prompt" style="background:var(--brand-500); border:none; color:white; width:32px; height:32px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center">
                    <i class="fas fa-cog"></i>
                  </button>
                </div>
              </div>
              <div class="ac-body" style="padding:16px; flex:1">
                <div id="status-${a.id}" style="color:var(--text-tertiary); font-size:0.65rem; margin-bottom:8px">Status: Menunggu...</div>
                <div style="color:var(--brand-400); font-weight:bold; font-size:0.65rem; margin-bottom:4px; text-transform:uppercase">Misi Utama:</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4">
                  ${mission.length > 100 ? mission.substring(0, 100) + '...' : mission}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * RENDER EDITOR VIEW (In-Page Editing)
 */
function renderEditor() {
  const agent = AGENT_CONFIG.find(a => a.id === _editingAgentId);
  const pData = _cachedAllPrompts.find(p => p.agent_id === _editingAgentId);
  const dp = _cachedDefaultPrinciples;
  
  return `
    <div id="agent-editor" class="fade-in" style="max-width:1000px; margin:0 auto; padding-bottom:100px">
      <button id="btn-back-to-grid" class="btn btn-ghost" style="margin-bottom:20px; color:var(--brand-400)">
        <i class="fas fa-arrow-left"></i> Kembali ke Daftar Ahli
      </button>

      <div class="card card-glass" style="padding:0; overflow:hidden">
        <div class="card-header" style="background:var(--bg-elevated); padding:24px; border-bottom:1px solid var(--border-subtle); display:flex; align-items:center; gap:20px">
          <div style="background:${agent.color}; width:60px; height:60px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; box-shadow:0 8px 20px -4px ${agent.color}80">
            <i class="fas ${agent.icon}"></i>
          </div>
          <div>
            <h1 style="font-size:1.6rem; font-weight:800; margin:0">Konfigurasi: ${agent.name}</h1>
            <p class="font-mono text-xs" style="color:var(--text-tertiary); margin-top:4px">AGENT_ID: ${_editingAgentId}</p>
          </div>
          <div style="margin-left:auto; display:flex; gap:12px">
            <button id="btn-save-config" class="btn btn-primary" style="padding:10px 24px"><i class="fas fa-save"></i> Simpan Perubahan</button>
          </div>
        </div>

        <div class="card-body" style="padding:30px; display:grid; grid-template-columns: 1fr 1fr; gap:30px">
          <div style="display:flex; flex-direction:column; gap:24px">
            <div class="form-group">
                <label class="text-xs font-bold mb-2 block" style="color:var(--brand-400)">ROLE (PERSONA AI)</label>
                <input type="text" id="config-persona" class="form-input" style="width:100%" value="${pData?.persona || agent.persona || ''}">
            </div>
            <div class="form-group">
                <label class="text-xs font-bold mb-2 block" style="color:var(--brand-400)">MISSION (TUGAS UTAMA)</label>
                <textarea id="config-mission" class="form-input" style="height:100px; width:100%">${pData?.mission || dp.mission}</textarea>
            </div>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap:16px">
              <div class="form-group"><label class="text-xs font-bold">1. GOAL</label><textarea id="config-goal" class="form-input">${pData?.principles?.goal || dp.goal}</textarea></div>
              <div class="form-group"><label class="text-xs font-bold">2. DONE CRITERIA</label><textarea id="config-done" class="form-input">${pData?.principles?.done_criteria || dp.done_criteria}</textarea></div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:24px">
            <div class="form-group">
                <label class="text-xs font-bold mb-2 block">OUTPUT FORMAT</label>
                <textarea id="config-format" class="form-input" style="height:120px; font-family:monospace; width:100%">${pData?.principles?.output_format || dp.output_format}</textarea>
            </div>
            <div style="background:rgba(0,0,0,0.4); border:1px solid var(--border-subtle); border-radius:12px; padding:20px">
               <h4 class="text-xs font-bold mb-3" style="color:var(--brand-400)"><i class="fas fa-eye"></i> PROMPT PREVIEW:</h4>
               <pre id="prompt-preview" style="font-size:0.65rem; color:var(--text-tertiary); white-space:pre-wrap; max-height:200px; overflow-y:auto; font-family:var(--font-mono)"></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * INITIALIZE EVENT LISTENERS
 */
export function afterMultiAgentRender() {
  const pageRoot = document.getElementById('page-root');
  
  const refreshUI = () => {
    const html = buildHtml();
    if (pageRoot) pageRoot.innerHTML = html;
    afterMultiAgentRender();
  };

  // --- DOWNLOAD REPORT HANDLER ---
  const btnReport = document.getElementById('btn-download-report');
  const selProyek = document.getElementById('select-proyek-report');
  
  if (selProyek) {
    selProyek.onchange = (e) => {
      _selectedProyekId = e.target.value;
      if (btnReport) btnReport.disabled = !_selectedProyekId;
    };
  }

  if (btnReport) {
    btnReport.onclick = async () => {
      if (!_selectedProyekId) return showError("Pilih proyek terlebih dahulu!");
      btnReport.disabled = true;
      btnReport.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Menyusun...';
      try {
        await generateSLFReport(_selectedProyekId, Object.values(_sessionResults));
        showSuccess("Laporan Konsep berhasil diunduh.");
      } catch (err) { showError("Gagal: " + err.message); }
      finally {
        btnReport.disabled = false;
        btnReport.innerHTML = '<i class="fas fa-file-word"></i> Luncurkan Laporan (.docx)';
      }
    };
  }

  // --- GRID HANDLERS ---
  document.querySelectorAll('.btn-edit-agent').forEach(btn => {
    btn.onclick = () => { _editingAgentId = btn.dataset.id; refreshUI(); };
  });

  document.querySelectorAll('.btn-run-agent').forEach(btn => {
    btn.onclick = async () => {
      if (!_selectedProyekId) return showError("Pilih proyek terlebih dahulu!");
      const agentId = btn.dataset.id;
      const statusEl = document.getElementById(`status-${agentId}`);
      btn.disabled = true;
      if (statusEl) statusEl.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Menganalisis...';
      try {
        const { runSpecificAgentAnalysis } = await import('../lib/multi-agent-service.js');
        const result = await runSpecificAgentAnalysis(_selectedProyekId, agentId, _sessionResults);
        _sessionResults[agentId] = result;
        if (statusEl) statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success-400)"></i> Selesai';
        showSuccess(`Analisis ${result.name} selesai.`);
      } catch (err) {
        if (statusEl) statusEl.innerHTML = '<i class="fas fa-times" style="color:var(--danger-400)"></i> Gagal';
        showError(err.message);
      } finally { btn.disabled = false; }
    };
  });

  // --- EDITOR HANDLERS ---
  const btnBack = document.getElementById('btn-back-to-grid');
  if (btnBack) btnBack.onclick = () => { _editingAgentId = null; refreshUI(); };

  const btnSave = document.getElementById('btn-save-config');
  if (btnSave) {
    btnSave.onclick = async () => {
      btnSave.disabled = true;
      try {
        const { saveAgentPrompt } = await import('../lib/prompt-config-service.js');
        const config = {
          persona: document.getElementById('config-persona').value,
          mission: document.getElementById('config-mission').value,
          principles: {
            goal: document.getElementById('config-goal').value,
            done_criteria: document.getElementById('config-done').value,
            output_format: document.getElementById('config-format').value
          }
        };
        await saveAgentPrompt(_editingAgentId, config);
        showSuccess('Tersimpan.');
        _editingAgentId = null;
        refreshUI();
      } catch (err) { showError(err.message); btnSave.disabled = false; }
    };
  }
}
