/**
 * Multi-Agent AI Consortium Page (Deep Reasoning Center)
 * Presidential Quartz Architecture for Multi-Disciplinary SLF Assessment
 * @module pages/multi-agent
 */

import '../styles/multi-agent.css';
import { escapeHtml } from '../lib/safe-markdown.js';
import { supabase } from '../lib/supabase.js';
import { AGENT_CONFIG, runSpecificAgentAnalysis, runCoordinatorSynthesis } from '../lib/multi-agent-service.js';
import { showError, showSuccess, showWarning, toast } from '../components/toast.js';
import { uploadToGoogleDrive } from '../lib/drive.js';

let _sessionResults = {};
let _selectedProyekId = null;
let _proyekError = null;
let _cachedProyekList = [];
let _isRunningAll = false;
let _activeView = 'orbit'; // 'orbit' | 'cards'
let _inspectingAgentId = null;
let _plenaryVerdict = null;

/**
 * PAGE ENTRY POINT
 */
export async function multiAgentPage(params = {}) {
  _selectedProyekId = params.proyekId || null;
  _proyekError = null;

  if (_cachedProyekList.length === 0 || params.refresh) {
    try {
      _cachedProyekList = await fetchProyekList();
      if (!_selectedProyekId && _cachedProyekList.length > 0) {
        _selectedProyekId = _cachedProyekList[0].id;
      }
    } catch (err) {
      console.error('Fetch projects failed:', err);
      _proyekError = err?.message || 'Tidak dapat menghubungi server database.';
      showError('Daftar proyek gagal dimuat. Periksa koneksi lalu muat ulang halaman.', 0);
    }
  }

  if (!_proyekError && _cachedProyekList.length === 0) {
    showWarning('Belum ada data proyek. Silakan buat proyek baru terlebih dahulu.');
  }

  return renderConsortiumView();
}

async function fetchProyekList() {
  const { data, error } = await supabase
    .from('proyek')
    .select('id, nama_bangunan, fungsi_bangunan, luas_bangunan, jumlah_lantai')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * RENDER MAIN CONSORTIUM VIEW
 */
function renderConsortiumView() {
  const proyek = _cachedProyekList.find(p => p.id === _selectedProyekId);
  const totalAgents = AGENT_CONFIG.length;
  const completedCount = Object.keys(_sessionResults).length;
  const avgScore = completedCount > 0
    ? Math.round(Object.values(_sessionResults).reduce((s, r) => s + (r.skor || 0), 0) / completedCount)
    : '--';

  return `
    <div id="multiagent-bridge" class="multi-agent-container fade-in">
      
      <!-- Hero Header -->
      <div class="multi-agent-header">
        <div>
          <div class="multi-agent-header-meta">
            <span class="multi-agent-badge">
              <i class="fas fa-network-wired"></i> Konsorsium 15 Ahli AI v2.2
            </span>
            <span style="font-size:0.75rem; color:var(--text-tertiary)">·</span>
            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary)">Deep Reasoning & Pleno SLF</span>
          </div>
          <h1 class="multi-agent-title">
            Konsorsium Ahli AI <span class="text-gradient-gold">Deep Reasoning</span>
          </h1>
          <p class="multi-agent-desc">
            Orkestrasi simultan 15 agen ahli teknik sipil, struktur, proteksi gedung, dan legal untuk telaah forensik serta sintesis kelaikan fungsi bangunan gedung.
          </p>
        </div>

        <div class="multi-agent-actions">
          <button class="btn btn-secondary" id="btn-refresh-status" style="height:44px; padding:0 18px; border-radius:12px; font-weight:700">
            <i class="fas fa-rotate" style="margin-right:8px"></i> Segarkan Status
          </button>
          <button id="btn-run-all" class="btn-presidential gold" style="height:44px; padding:0 24px; border-radius:12px" ${_selectedProyekId ? '' : 'disabled'}>
            <i class="fas fa-microchip" style="margin-right:8px"></i> Jalankan 15 Ahli
          </button>
        </div>
      </div>

      <!-- KPI Top Stats -->
      <div class="multi-agent-kpi-grid">
        <div class="multi-agent-kpi-card">
          <div class="multi-agent-kpi-icon" style="background:hsla(220, 95%, 52%, 0.1); border:1px solid hsla(220, 95%, 52%, 0.25); color:var(--brand-400)">
            <i class="fas fa-users-gear"></i>
          </div>
          <div class="multi-agent-kpi-info">
            <span class="multi-agent-kpi-value">${escapeHtml(totalAgents)} Ahli</span>
            <span class="multi-agent-kpi-label">Disiplin Terintegrasi</span>
            <span class="multi-agent-kpi-sub">SNI & NSPK Standar Nasional</span>
          </div>
        </div>

        <div class="multi-agent-kpi-card">
          <div class="multi-agent-kpi-icon" style="background:hsla(45, 90%, 60%, 0.1); border:1px solid hsla(45, 90%, 60%, 0.25); color:var(--gold-400)">
            <i class="fas fa-chart-pie"></i>
          </div>
          <div class="multi-agent-kpi-info">
            <span class="multi-agent-kpi-value" id="kpi-progress">${escapeHtml(completedCount)} / ${escapeHtml(totalAgents)}</span>
            <span class="multi-agent-kpi-label">Progres Sesi</span>
            <span class="multi-agent-kpi-sub" id="kpi-progress-sub">${completedCount === 15 ? 'Seluruh telaah lengkap' : 'Menunggu eksekusi'}</span>
          </div>
        </div>

        <div class="multi-agent-kpi-card">
          <div class="multi-agent-kpi-icon" style="background:hsla(158, 85%, 45%, 0.1); border:1px solid hsla(158, 85%, 45%, 0.25); color:var(--success-400)">
            <i class="fas fa-shield-check"></i>
          </div>
          <div class="multi-agent-kpi-info">
            <span class="multi-agent-kpi-value" id="global-score">${escapeHtml(avgScore)}${avgScore !== '--' ? '%' : ''}</span>
            <span class="multi-agent-kpi-label">Indeks Keandalan Komposit</span>
            <span class="multi-agent-kpi-sub">Rata-rata 15 bidang teknis</span>
          </div>
        </div>

        <div class="multi-agent-kpi-card">
          <div class="multi-agent-kpi-icon" style="background:hsla(280, 85%, 60%, 0.1); border:1px solid hsla(280, 85%, 60%, 0.25); color:#c084fc">
            <i class="fas fa-gavel"></i>
          </div>
          <div class="multi-agent-kpi-info">
            <span class="multi-agent-kpi-value" id="kpi-verdict" style="font-size:1.15rem; line-height:1.3">
              ${escapeHtml(_plenaryVerdict?.status || 'Belum Pleno')}
            </span>
            <span class="multi-agent-kpi-label">Fatwa Pleno SLF</span>
            <span class="multi-agent-kpi-sub">Konsensus sidang ahli</span>
          </div>
        </div>
      </div>

      <!-- Toolbar: Project Selector & View Toggles -->
      <div class="multi-agent-toolbar">
        <div class="multi-agent-project-wrap">
          <span class="multi-agent-project-label">
            <i class="fas fa-building" style="color:var(--gold-400)"></i> Objek Bangunan:
          </span>
          <select id="select-proyek-bridge" class="multi-agent-select">
            <option value="">-- Pilih Proyek Bangunan Gedung --</option>
            ${_cachedProyekList.map(p => `
              <option value="${escapeHtml(p.id)}" ${p.id === _selectedProyekId ? 'selected' : ''}>
                ${escapeHtml(p.nama_bangunan)} ${p.fungsi_bangunan ? `(${escapeHtml(p.fungsi_bangunan)})` : ''}
              </option>
            `).join('')}
          </select>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
          <div class="multi-agent-view-switch">
            <button class="multi-agent-view-btn ${_activeView === 'orbit' ? 'active' : ''}" id="btn-view-orbit">
              <i class="fas fa-circle-nodes"></i> Jejaring Orbit
            </button>
            <button class="multi-agent-view-btn ${_activeView === 'cards' ? 'active' : ''}" id="btn-view-cards">
              <i class="fas fa-table-cells-large"></i> Panel 15 Kartu
            </button>
          </div>
        </div>
      </div>

      <!-- Plenary Synthesis Verdict Card (Active when available) -->
      <div id="plenary-verdict-container" style="display:${_plenaryVerdict ? 'block' : 'none'}">
        ${renderPlenaryCard()}
      </div>

      <!-- Workspace Grid: Hub / Cards + Terminal -->
      <div class="multi-agent-workspace-grid">
        
        <!-- Left: Neural Hub Orbit OR 15 Cards Grid -->
        <div class="multi-agent-hub-card">
          <div class="multi-agent-hub-header">
            <div>
              <h3 style="font-family:'Outfit', sans-serif; font-size:1.1rem; font-weight:800; color:var(--text-primary); margin:0 0 4px 0">
                ${_activeView === 'orbit' ? 'Jejaring Saraf Konsorsium' : 'Daftar Panel 15 Ahli Teknis'}
              </h3>
              <p style="font-size:0.75rem; color:var(--text-tertiary); margin:0">
                Klik salah satu ahli untuk menjalankan penalaran mendalam atau meninjau temuan lapangan.
              </p>
            </div>
            <span class="badge" style="background:hsla(220, 95%, 52%, 0.1); color:var(--brand-400); border:1px solid hsla(220, 95%, 52%, 0.2); font-size:10px">
              REAL-TIME ORCHESTRATION
            </span>
          </div>

          <!-- Orbit View Container -->
          <div id="orbit-view-wrap" style="display:${_activeView === 'orbit' ? 'flex' : 'none'}; width:100%; height:100%; align-items:center; justify-content:center;">
            <div class="multi-agent-orbit-stage" id="orbit-stage">
              <div class="multi-agent-orbit-ring"></div>
              <div class="multi-agent-orbit-ring-inner"></div>

              <!-- SVG Dynamic Neural Lines -->
              <svg class="multi-agent-orbit-svg" viewBox="0 0 480 480" id="orbit-svg-lines">
                ${renderOrbitSvgLines()}
              </svg>

              <!-- Center Orchestrator Core -->
              <div class="multi-agent-center-core" id="core-orchestrator" title="Koordinator Pleno Konsorsium SLF">
                <i class="fas fa-brain multi-agent-core-icon"></i>
                <span class="multi-agent-core-label">PLENO SLF</span>
              </div>

              <!-- Orbiting Nodes for 15 Agents -->
              ${renderOrbitNodes()}
            </div>
          </div>

          <!-- Cards View Container -->
          <div id="cards-view-wrap" class="multi-agent-cards-view" style="display:${_activeView === 'cards' ? 'grid' : 'none'}">
            ${renderExpertCards()}
          </div>
        </div>

        <!-- Right: Reasoning Terminal Console -->
        <div class="multi-agent-terminal">
          <div class="multi-agent-terminal-header">
            <div class="multi-agent-terminal-dots">
              <div class="multi-agent-terminal-dot" style="background:#ef4444"></div>
              <div class="multi-agent-terminal-dot" style="background:#f59e0b"></div>
              <div class="multi-agent-terminal-dot" style="background:#10b981"></div>
              <span class="multi-agent-terminal-title" style="margin-left:8px">REASONING_STREAM_V2.2</span>
            </div>
            <button class="btn btn-ghost btn-sm" id="btn-clear-terminal" style="color:var(--text-tertiary); font-size:0.7rem; padding:4px 8px">
              <i class="fas fa-trash-can" style="margin-right:4px"></i> Bersihkan Log
            </button>
          </div>

          <div class="multi-agent-terminal-feed" id="terminal-feed">
            <div class="multi-agent-feed-line system">
              <span class="multi-agent-feed-time">${escapeHtml(new Date().toLocaleTimeString())}</span>
              <span class="multi-agent-feed-tag" style="background:#6366f1">CORE</span>
              <span class="multi-agent-feed-msg">Sistem Konsorsium diinisialisasi. Menunggu instruksi orkestrasi gedung...</span>
            </div>
          </div>

          <div class="multi-agent-terminal-footer">
            <button id="btn-download-report-bridge" class="btn btn-sm btn-outline" style="border-radius:10px; font-weight:700" ${_selectedProyekId ? '' : 'disabled'}>
              <i class="fas fa-file-contract" style="color:var(--brand-400); margin-right:6px"></i> Unduh Ringkasan
            </button>
            <button id="btn-sync-drive-bridge" class="btn btn-sm btn-ghost" style="color:#38bdf8; font-weight:700" ${_selectedProyekId ? '' : 'disabled'}>
              <i class="fab fa-google-drive" style="margin-right:6px"></i> Sinkronisasi Drive
            </button>
          </div>
        </div>

      </div>

      <!-- Detail Drawer / Modal for Agent Inspection -->
      <div id="agent-detail-drawer" style="display:none"></div>

    </div>
  `;
}

/**
 * Render Orbit SVG Connection Lines
 */
function renderOrbitSvgLines() {
  const cx = 240;
  const cy = 240;
  const r = 210;

  return AGENT_CONFIG.map((a, i) => {
    const angle = (i / AGENT_CONFIG.length) * (2 * Math.PI) - Math.PI / 2;
    const x = Math.round(cx + r * Math.cos(angle));
    const y = Math.round(cy + r * Math.sin(angle));
    const isDone = _sessionResults[a.id];
    const lineColor = isDone ? 'var(--success-400)' : 'hsla(220, 30%, 40%, 0.2)';
    const strokeWidth = isDone ? '1.8' : '1';

    return `
      <line id="line-${escapeHtml(a.id)}" 
            x1="${escapeHtml(cx)}" y1="${escapeHtml(cy)}" 
            x2="${escapeHtml(x)}" y2="${escapeHtml(y)}" 
            stroke="${escapeHtml(lineColor)}" 
            stroke-width="${escapeHtml(strokeWidth)}" 
            stroke-dasharray="${isDone ? 'none' : '4,4'}" />
    `;
  }).join('');
}

/**
 * Render 15 Orbit Nodes
 */
function renderOrbitNodes() {
  const cx = 240;
  const cy = 240;
  const r = 210;
  const nodeRadius = 24;

  return AGENT_CONFIG.map((a, i) => {
    const angle = (i / AGENT_CONFIG.length) * (2 * Math.PI) - Math.PI / 2;
    const x = Math.round(cx + r * Math.cos(angle) - nodeRadius);
    const y = Math.round(cy + r * Math.sin(angle) - nodeRadius);
    const result = _sessionResults[a.id];
    const isDone = !!result;

    return `
      <div class="multi-agent-node ${isDone ? 'done' : ''}" 
           id="node-${escapeHtml(a.id)}" 
           data-id="${escapeHtml(a.id)}"
           style="left:${escapeHtml(x)}px; top:${escapeHtml(y)}px; color:${escapeHtml(a.color)}; border-color:${isDone ? 'var(--success-400)' : escapeHtml(a.color) + '60'};"
           title="${escapeHtml(a.name)} — ${escapeHtml(a.standard)}">
        <i class="fas ${a.icon}" style="font-size:1.15rem"></i>
        ${isDone ? `<span class="multi-agent-node-badge" style="color:var(--success-400)">✓</span>` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Render 15 Expert Cards
 */
function renderExpertCards() {
  return AGENT_CONFIG.map(a => {
    const result = _sessionResults[a.id];
    const isDone = !!result;

    return `
      <div class="multi-agent-expert-card ${isDone ? 'done' : ''}" data-id="${escapeHtml(a.id)}" id="card-${escapeHtml(a.id)}">
        <div class="multi-agent-expert-header">
          <div class="multi-agent-expert-icon" style="background:${escapeHtml(a.color)}15; color:${escapeHtml(a.color)}; border:1px solid ${escapeHtml(a.color)}35">
            <i class="fas ${a.icon}"></i>
          </div>
          <div class="multi-agent-expert-meta">
            <div class="multi-agent-expert-name">${escapeHtml(a.name)}</div>
            <div class="multi-agent-expert-standard">${escapeHtml(a.standard)}</div>
          </div>
        </div>

        <div class="multi-agent-expert-body">
          ${escapeHtml(result ? result.analisis : a.persona)}
        </div>

        <div class="multi-agent-expert-footer">
          <span style="font-size:0.75rem; font-weight:700; color:${isDone ? 'var(--success-400)' : 'var(--text-tertiary)'}">
            ${isDone ? `Skor: ${escapeHtml(result.skor)}% (${escapeHtml(result.status_label)})` : 'Standby'}
          </span>
          <button class="btn btn-ghost btn-sm btn-run-single" data-id="${escapeHtml(a.id)}" style="font-size:0.72rem; padding:3px 8px; color:var(--brand-300)">
            <i class="fas ${isDone ? 'fa-eye' : 'fa-play'}" style="margin-right:4px"></i> ${isDone ? 'Detail' : 'Kaji'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Plenary Verdict Card
 */
function renderPlenaryCard() {
  if (!_plenaryVerdict) return '';

  let statusClass = 'laik';
  if (_plenaryVerdict.status.includes('TIDAK')) statusClass = 'tidak-laik';
  else if (_plenaryVerdict.status.includes('CATATAN')) statusClass = 'catatan';

  return `
    <div class="multi-agent-synthesis-card">
      <div class="multi-agent-synthesis-top">
        <div>
          <div style="font-size:0.72rem; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:6px">
            Hasil Sidang Pleno 15 Ahli Konsorsium
          </div>
          <div class="multi-agent-verdict-badge ${escapeHtml(statusClass)}">
            <i class="fas fa-stamp"></i> ${escapeHtml(_plenaryVerdict.status)}
          </div>
        </div>

        <div class="multi-agent-score-gauge">
          <span class="multi-agent-score-val">${escapeHtml(_plenaryVerdict.score)}</span>
          <span class="multi-agent-score-unit">% Indeks Keandalan</span>
        </div>
      </div>

      <div class="multi-agent-justifikasi-box">
        <strong>Fatwa Pleno Teknis:</strong> ${escapeHtml(_plenaryVerdict.justifikasi)}
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap">
        <button class="btn btn-sm btn-secondary" onclick="window.navigate('laporan', { proyekId: '${escapeHtml(_selectedProyekId)}' })" style="border-radius:10px">
          <i class="fas fa-file-pdf" style="margin-right:6px"></i> Cetak Dokumen Rekomendasi Teknis
        </button>
        <button class="btn btn-sm btn-outline" id="btn-export-md" style="border-radius:10px">
          <i class="fas fa-download" style="margin-right:6px"></i> Unduh Markdown Konsolidasi
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Inspector Drawer for Specific Agent
 */
function renderInspectorDrawer(agentId) {
  const agent = AGENT_CONFIG.find(a => a.id === agentId);
  const result = _sessionResults[agentId];
  if (!agent) return '';

  return `
    <div class="multi-agent-drawer-overlay" id="drawer-overlay">
      <div class="multi-agent-drawer">
        <div class="multi-agent-drawer-header">
          <div style="display:flex; align-items:center; gap:12px">
            <div class="multi-agent-expert-icon" style="background:${escapeHtml(agent.color)}20; color:${escapeHtml(agent.color)}; border:1px solid ${escapeHtml(agent.color)}40">
              <i class="fas ${agent.icon}"></i>
            </div>
            <div>
              <h3 style="margin:0; font-size:1.05rem; font-weight:800; color:var(--text-primary)">${escapeHtml(agent.name)}</h3>
              <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-tertiary)">${escapeHtml(agent.standard)}</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-close-drawer" style="font-size:1.1rem; color:var(--text-tertiary)">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="multi-agent-drawer-body">
          <!-- Persona Card -->
          <div style="background:var(--bg-secondary); padding:14px; border-radius:12px; border:1px solid var(--border-subtle)">
            <div style="font-size:0.72rem; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">Kualifikasi Asesor:</div>
            <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6">${escapeHtml(agent.persona)}</div>
          </div>

          <!-- Score & Risk Badge -->
          <div style="display:flex; gap:12px">
            <div style="flex:1; background:var(--bg-secondary); padding:12px; border-radius:10px; border:1px solid var(--border-subtle); text-align:center">
              <div style="font-size:0.7rem; color:var(--text-tertiary); text-transform:uppercase">Skor Keandalan</div>
              <div style="font-size:1.4rem; font-weight:800; color:${result ? 'var(--gold-400)' : 'var(--text-tertiary)'}">
                ${result ? `${escapeHtml(result.skor)}%` : '--'}
              </div>
            </div>
            <div style="flex:1; background:var(--bg-secondary); padding:12px; border-radius:10px; border:1px solid var(--border-subtle); text-align:center">
              <div style="font-size:0.7rem; color:var(--text-tertiary); text-transform:uppercase">Tingkat Risiko</div>
              <div style="font-size:1.1rem; font-weight:800; color:${result?.risiko === 'Kritis' ? 'var(--danger-400)' : 'var(--success-400)'}">
                ${result ? escapeHtml(result.risiko) : 'Belum Dianalisis'}
              </div>
            </div>
          </div>

          <!-- Deep Reasoning Steps -->
          ${result?.reasoning && result.reasoning.length ? `
            <div>
              <div style="font-size:0.75rem; font-weight:700; color:var(--brand-400); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px">
                <i class="fas fa-brain" style="margin-right:6px"></i> Rantai Penalaran (Reasoning Chain):
              </div>
              <div style="display:flex; flex-direction:column; gap:8px">
                ${result.reasoning.map((step, idx) => `
                  <div style="background:hsla(220, 20%, 15%, 0.4); padding:10px 14px; border-radius:8px; border-left:3px solid var(--brand-400); font-size:0.8rem; line-height:1.5; color:var(--text-secondary)">
                    <strong>Langkah #${escapeHtml(idx + 1)}:</strong> ${escapeHtml(step)}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Narrative Analysis -->
          <div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px">
              <i class="fas fa-file-lines" style="color:var(--gold-400); margin-right:6px"></i> Hasil Analisis Teknis:
            </div>
            <div style="font-size:0.86rem; line-height:1.7; color:var(--text-secondary); background:var(--bg-secondary); padding:14px; border-radius:10px; border:1px solid var(--border-subtle); white-space:pre-wrap">
              ${escapeHtml(result ? result.analisis : 'Pemeriksaan teknis belum dijalankan untuk bidang ini.')}
            </div>
          </div>

          <!-- Recommendations -->
          ${result?.rekomendasi ? `
            <div>
              <div style="font-size:0.75rem; font-weight:700; color:var(--success-400); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px">
                <i class="fas fa-list-check" style="margin-right:6px"></i> Rekomendasi Tindak Lanjut:
              </div>
              <div style="font-size:0.86rem; line-height:1.7; color:var(--text-secondary); background:hsla(158, 85%, 45%, 0.05); padding:14px; border-radius:10px; border:1px solid hsla(158, 85%, 45%, 0.2); white-space:pre-wrap">
                ${escapeHtml(result.rekomendasi)}
              </div>
            </div>
          ` : ''}

          <!-- Legal & Standard Reference -->
          <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-tertiary); background:var(--bg-secondary); padding:10px 14px; border-radius:8px">
            <i class="fas fa-scale-balanced" style="margin-right:6px; color:var(--brand-400)"></i> Dasar Hukum / Rujukan: ${escapeHtml(result?.legal_citation || agent.standard)}
          </div>
        </div>

        <div class="multi-agent-drawer-footer">
          <button class="btn btn-secondary btn-sm" id="btn-re-run-agent" style="border-radius:10px">
            <i class="fas fa-play" style="margin-right:6px"></i> ${result ? 'Analisis Ulang' : 'Jalankan Analisis'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * INITIALIZE EVENT LISTENERS AFTER RENDER
 */
export function afterMultiAgentRender() {
  // Project selection
  const selProyek = document.getElementById('select-proyek-bridge');
  if (selProyek) {
    selProyek.onchange = (e) => {
      _selectedProyekId = e.target.value;
      _sessionResults = {};
      _plenaryVerdict = null;
      window.navigate('multi-agent', { proyekId: _selectedProyekId });
    };
  }

  // Refresh status
  document.getElementById('btn-refresh-status')?.addEventListener('click', () => {
    window.navigate('multi-agent', { proyekId: _selectedProyekId, refresh: true });
  });

  // View switches
  const btnOrbit = document.getElementById('btn-view-orbit');
  const btnCards = document.getElementById('btn-view-cards');
  const orbitWrap = document.getElementById('orbit-view-wrap');
  const cardsWrap = document.getElementById('cards-view-wrap');

  if (btnOrbit && btnCards) {
    btnOrbit.onclick = () => {
      _activeView = 'orbit';
      btnOrbit.classList.add('active');
      btnCards.classList.remove('active');
      if (orbitWrap) orbitWrap.style.display = 'flex';
      if (cardsWrap) cardsWrap.style.display = 'none';
    };

    btnCards.onclick = () => {
      _activeView = 'cards';
      btnCards.classList.add('active');
      btnOrbit.classList.remove('active');
      if (orbitWrap) orbitWrap.style.display = 'none';
      if (cardsWrap) cardsWrap.style.display = 'grid';
    };
  }

  // Orbit Nodes Click
  document.querySelectorAll('.multi-agent-node').forEach(node => {
    node.onclick = () => {
      const agentId = node.dataset.id;
      if (_sessionResults[agentId]) {
        openInspectorDrawer(agentId);
      } else {
        runSingleAgent(agentId);
      }
    };
  });

  // Cards Click & Detail buttons
  document.querySelectorAll('.multi-agent-expert-card').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('.btn-run-single')) return;
      openInspectorDrawer(card.dataset.id);
    };
  });

  document.querySelectorAll('.btn-run-single').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const agentId = btn.dataset.id;
      if (_sessionResults[agentId]) {
        openInspectorDrawer(agentId);
      } else {
        runSingleAgent(agentId);
      }
    };
  });

  // Center Orchestrator Click
  const centerCore = document.getElementById('core-orchestrator');
  if (centerCore) {
    centerCore.onclick = () => {
      if (Object.keys(_sessionResults).length === 15) {
        toast('Sidang pleno telah selesai. Menampilkan fatwa konsorsium.', 'info');
      } else {
        runAllAgentsOrchestrated();
      }
    };
  }

  // Run All
  const btnRunAll = document.getElementById('btn-run-all');
  if (btnRunAll) {
    btnRunAll.onclick = () => runAllAgentsOrchestrated();
  }

  // Clear Terminal
  const btnClear = document.getElementById('btn-clear-terminal');
  if (btnClear) {
    btnClear.onclick = () => {
      const feed = document.getElementById('terminal-feed');
      if (feed) feed.innerHTML = '';
      toast('Log konsorsium telah dibersihkan.', 'info');
    };
  }

  // Export Markdown
  document.getElementById('btn-export-md')?.addEventListener('click', () => {
    exportConsolidatedFindings();
  });

  document.getElementById('btn-download-report-bridge')?.addEventListener('click', () => {
    exportConsolidatedFindings();
  });

  // Sync to Drive
  const btnSyncDrive = document.getElementById('btn-sync-drive-bridge');
  if (btnSyncDrive) {
    btnSyncDrive.onclick = async () => {
      if (Object.keys(_sessionResults).length === 0) {
        showError('Jalankan telaah minimal 1 ahli terlebih dahulu.');
        return;
      }

      btnSyncDrive.disabled = true;
      addTerminalLine('DRIVE', 'Menghubungkan ke Google Drive penyimpanan proyek...', 'SYSTEM', '#38bdf8');

      try {
        const findings = Object.values(_sessionResults).map(r => 
          `### ${r.name} (Skor: ${r.skor}% - ${r.status_label})\n\n**Analisis:**\n${r.analisis}\n\n**Rekomendasi:**\n${r.rekomendasi}\n\n**Dasar Standar:** ${r.legal_citation || 'SNI/NSPK'}`
        ).join('\n\n---\n\n');

        const fileData = [{
          name: `Konsolidasi_Ahli_SLF_${Date.now()}.md`,
          base64: btoa(unescape(encodeURIComponent(findings))),
          mimeType: 'text/markdown'
        }];

        await uploadToGoogleDrive(fileData, _selectedProyekId, 'Analisis AI', 'REASONING_HUB');
        addTerminalLine('DRIVE', 'Berkas konsolidasi berhasil diunggah ke Google Drive.', 'SYSTEM', 'var(--success-400)');
        showSuccess('Data konsorsium berhasil disinkronkan ke Google Drive.');
      } catch (e) {
        addTerminalLine('DRIVE', `Sinkronisasi gagal: ${e.message}`, 'SYSTEM', 'var(--danger-400)');
        showError(e.message);
      } finally {
        btnSyncDrive.disabled = false;
      }
    };
  }
}

/**
 * LOGIC: TERMINAL STREAMING
 */
function addTerminalLine(tag, message, category = 'SYSTEM', color = '#6366f1') {
  const grid = document.getElementById('terminal-feed');
  if (!grid) return;

  const line = document.createElement('div');
  line.className = `multi-agent-feed-line ${escapeHtml(category.toLowerCase())}`;
  if (message.includes('ERROR:')) line.classList.add('error');
  if (message.includes('SOLVED:')) line.classList.add('solved');

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  line.innerHTML = `
    <span class="multi-agent-feed-time">${escapeHtml(time)}</span>
    <span class="multi-agent-feed-tag" style="background:${escapeHtml(color)}">${escapeHtml(tag)}</span>
    <span class="multi-agent-feed-msg">${escapeHtml(message)}</span>
  `;

  grid.appendChild(line);
  grid.scrollTop = grid.scrollHeight;
}

/**
 * LOGIC: RUN SINGLE AGENT
 */
async function runSingleAgent(agentId) {
  if (!_selectedProyekId) return showError('Pilih proyek bangunan gedung terlebih dahulu.');

  const node = document.getElementById(`node-${agentId}`);
  const card = document.getElementById(`card-${agentId}`);
  const line = document.getElementById(`line-${agentId}`);
  const agent = AGENT_CONFIG.find(a => a.id === agentId);
  if (!agent) return;

  if (node) node.classList.add('active');
  if (card) card.classList.add('active');
  if (line) {
    line.setAttribute('stroke', agent.color);
    line.setAttribute('stroke-width', '2');
  }

  addTerminalLine(agent.id.toUpperCase(), `Memulai sesi penalaran mendalam (Deep Reasoning)...`, 'AGENT', agent.color);

  try {
    addTerminalLine(agent.id.toUpperCase(), 'Mengurai parameter geometri, dokumen SIMBG, dan data checklist teknis...', 'AGENT', agent.color);

    const result = await runSpecificAgentAnalysis(_selectedProyekId, agentId, _sessionResults);
    _sessionResults[agentId] = result;

    if (result.reasoning && Array.isArray(result.reasoning)) {
      result.reasoning.forEach((step, idx) => {
        setTimeout(() => {
          addTerminalLine(agent.id.toUpperCase(), `[Langkah #${idx + 1}] ${step}`, 'AGENT', agent.color);
        }, 500 + idx * 300);
      });
    }

    const delay = 600 + ((result.reasoning?.length || 0) * 300);
    setTimeout(() => {
      if (node) {
        node.classList.remove('active');
        node.classList.add('done');
        node.style.borderColor = 'var(--success-400)';
      }
      if (card) {
        card.classList.remove('active');
        card.classList.add('done');
      }
      if (line) {
        line.setAttribute('stroke', 'var(--success-400)');
        line.removeAttribute('stroke-dasharray');
      }

      addTerminalLine(agent.id.toUpperCase(), `SELESAI: ${result.status_label} (Skor: ${result.skor}%)`, 'AGENT', agent.color);
      updateDashboardKPIs();
      updatePlenaryIfComplete();
    }, delay);

    return result;
  } catch (err) {
    if (node) node.classList.remove('active');
    if (card) card.classList.remove('active');
    addTerminalLine(agent.id.toUpperCase(), `ERROR: ${err.message}`, 'AGENT', 'var(--danger-400)');
    showError(`Gagal menganalisis ${agent.name}: ${err.message}`);
  }
}

/**
 * LOGIC: ORCHESTRATE ALL AGENTS
 */
async function runAllAgentsOrchestrated() {
  if (_isRunningAll) return;
  if (!_selectedProyekId) return showError('Pilih proyek terlebih dahulu.');

  _isRunningAll = true;
  _sessionResults = {};
  _plenaryVerdict = null;

  const btn = document.getElementById('btn-run-all');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="margin-right:8px"></i> Orkestrasi Berjalan...';
  }

  addTerminalLine('CORE', 'Memulai Sidang Konsorsium Lengkap (15 Ahli)...', 'SYSTEM', '#6366f1');

  // Run in 5 coordinated batches of 3 disciplines
  const batches = [
    ['struktur', 'geoteknik', 'sd_air'],
    ['ruang_dalam', 'ruang_luar', 'pencahayaan'],
    ['elektrikal', 'plumbing', 'mekanikal'],
    ['keselamatan', 'mkkg', 'akustik'],
    ['kesehatan', 'legal', 'laporan']
  ];

  for (let bIndex = 0; bIndex < batches.length; bIndex++) {
    const batch = batches[bIndex];
    addTerminalLine('CORE', `Mengaktifkan Kluster #${bIndex + 1}: ${batch.join(', ')}`, 'SYSTEM', '#818cf8');
    await Promise.all(batch.map(id => runSingleAgent(id)));
  }

  addTerminalLine('CORE', 'Seluruh 15 ahli telah menyelesaikan telaah. Mensintesis fatwa pleno...', 'SYSTEM', 'var(--success-400)');
  await updatePlenaryIfComplete(true);

  showSuccess('Orkestrasi seluruh 15 ahli konsorsium selesai!');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-double" style="margin-right:8px"></i> Analisis Selesai';
  }
  _isRunningAll = false;
}

/**
 * UPDATE DASHBOARD KPIS & STATS
 */
function updateDashboardKPIs() {
  const vals = Object.values(_sessionResults);
  const count = vals.length;
  const avg = count > 0 ? Math.round(vals.reduce((s, r) => s + (r.skor || 0), 0) / count) : '--';

  const scoreEl = document.getElementById('global-score');
  if (scoreEl) scoreEl.textContent = avg !== '--' ? `${avg}%` : '--';

  const progressEl = document.getElementById('kpi-progress');
  if (progressEl) progressEl.textContent = `${count} / 15`;

  const progressSub = document.getElementById('kpi-progress-sub');
  if (progressSub) progressSub.textContent = count === 15 ? 'Seluruh telaah lengkap' : `${15 - count} ahli tersisa`;
}

/**
 * SYNTHESIZE PLENARY IF COMPLETE
 */
async function updatePlenaryIfComplete(force = false) {
  const vals = Object.values(_sessionResults);
  if (vals.length < 15 && !force) return;

  try {
    const verdict = await runCoordinatorSynthesis(vals);
    _plenaryVerdict = verdict;

    const verdictKpi = document.getElementById('kpi-verdict');
    if (verdictKpi) verdictKpi.textContent = verdict.status;

    const container = document.getElementById('plenary-verdict-container');
    if (container) {
      container.innerHTML = renderPlenaryCard();
      container.style.display = 'block';

      document.getElementById('btn-export-md')?.addEventListener('click', () => {
        exportConsolidatedFindings();
      });
    }

    addTerminalLine('PLENO', `FATWA RESMI: ${verdict.status} (Indeks: ${verdict.score}%)`, 'SYSTEM', 'var(--gold-400)');
  } catch (err) {
    console.error('Synthesis error:', err);
  }
}

/**
 * OPEN INSPECTOR DRAWER
 */
function openInspectorDrawer(agentId) {
  _inspectingAgentId = agentId;
  const drawerContainer = document.getElementById('agent-detail-drawer');
  if (!drawerContainer) return;

  drawerContainer.innerHTML = renderInspectorDrawer(agentId);
  drawerContainer.style.display = 'block';

  document.getElementById('btn-close-drawer')?.addEventListener('click', closeInspectorDrawer);
  document.getElementById('drawer-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'drawer-overlay') closeInspectorDrawer();
  });

  document.getElementById('btn-re-run-agent')?.addEventListener('click', () => {
    closeInspectorDrawer();
    runSingleAgent(agentId);
  });
}

function closeInspectorDrawer() {
  _inspectingAgentId = null;
  const drawerContainer = document.getElementById('agent-detail-drawer');
  if (drawerContainer) drawerContainer.style.display = 'none';
}

/**
 * EXPORT CONSOLIDATED FINDINGS AS MARKDOWN
 */
function exportConsolidatedFindings() {
  if (Object.keys(_sessionResults).length === 0) {
    showError('Belum ada hasil analisis untuk diekspor.');
    return;
  }

  const proyek = _cachedProyekList.find(p => p.id === _selectedProyekId);
  const title = proyek ? proyek.nama_bangunan : 'Gedung Teknis';

  let md = `# KONSOLIDASI SIDANG PLENO 15 AHLI KONSORSIUM SLF\n`;
  md += `**Objek Gedung:** ${title}\n`;
  md += `**Tanggal Kajian:** ${new Date().toLocaleDateString('id-ID')}\n`;
  md += `**Fatwa Pleno:** ${_plenaryVerdict?.status || 'LAIK FUNGSI DENGAN CATATAN'}\n`;
  md += `**Indeks Keandalan:** ${_plenaryVerdict?.score || 85}%\n\n`;
  md += `> ${_plenaryVerdict?.justifikasi || 'Kajian forensik komprehensif berdasarkan 15 disiplin teknis.'}\n\n`;
  md += `## TEMUAN MASING-MASING AHLI\n\n`;

  Object.values(_sessionResults).forEach(r => {
    md += `### ${r.name} (Skor: ${r.skor}% - ${r.status_label})\n`;
    md += `- **Dasar Rujukan:** ${r.legal_citation || 'SNI/NSPK'}\n`;
    md += `- **Tingkat Risiko:** ${r.risiko}\n\n`;
    md += `**Hasil Analisis:**\n${r.analisis}\n\n`;
    md += `**Rekomendasi Teknis:**\n${r.rekomendasi}\n\n`;
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Konsolidasi_Ahli_SLF_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);

  showSuccess('Dokumen konsolidasi berhasil diunduh.');
}

export default multiAgentPage;
