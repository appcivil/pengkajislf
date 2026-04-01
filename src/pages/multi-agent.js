import { generateSLFReport } from '../lib/report-service.js';
import { supabase } from '../lib/supabase.js';
import { AGENT_CONFIG } from '../lib/multi-agent-service.js';
import { showError, showSuccess } from '../components/toast.js';
import { initializeProjectFolder, uploadToGoogleDrive } from '../lib/drive.js';

let _sessionResults = {};
let _selectedProyekId = null;
let _editingAgentId = null;
let _cachedProyekList = [];
let _isRunningAll = false;

/**
 * PAGE ENTRY POINT
 */
export async function multiAgentPage(params = {}) {
  _selectedProyekId = params.proyekId || null;
  
  if (_cachedProyekList.length === 0 || params.refresh) {
    try {
      _cachedProyekList = await fetchProyekList();
    } catch (err) {
      console.error("Fetch projects failed:", err);
    }
  }

  return buildHtml();
}

async function fetchProyekList() {
  const { data } = await supabase.from('proyek').select('id, nama_bangunan').order('created_at', { ascending: false });
  return data || [];
}

function buildHtml() {
  if (_editingAgentId) return renderEditor();
  return renderCommandBridge();
}

/**
 * RENDER COMMAND BRIDGE VIEW
 */
function renderCommandBridge() {
  const proyek = _cachedProyekList.find(p => p.id === _selectedProyekId);
  
  return `
    <div id="multiagent-bridge" class="fade-in">
      
      <!-- Bridge Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-6); padding:0 var(--space-4)">
        <div>
          <h1 style="font-size:2.2rem; font-weight:900; color:#0f172a; margin:0">Deep Reasoning Center</h1>
          <p style="color:#64748b; margin-top:4px">Orkestrasi 15 Ahli AI untuk Analisis Bangunan Teknis</p>
        </div>
        <div style="display:flex; gap:12px">
          <select id="select-proyek-bridge" class="form-input" style="width:280px; border-radius:14px; background:white">
            <option value="">-- Pilih Proyek --</option>
            ${_cachedProyekList.map(p => `<option value="${p.id}" ${p.id === _selectedProyekId ? 'selected' : ''}>${p.nama_bangunan}</option>`).join('')}
          </select>
          <button id="btn-run-all" class="btn btn-primary" style="border-radius:14px; padding:0 24px" ${_selectedProyekId ? '' : 'disabled'}>
            <i class="fas fa-microchip"></i> Jalankan Semua Ahli
          </button>
        </div>
      </div>

      <div class="quartz-bridge-container">
        
        <!-- Left: The Hub (SVG/Node Network) -->
        <div class="bridge-core">
          <div class="center-cluster">
            <div style="width:100px; height:100px; background:var(--gradient-brand); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:2.5rem; box-shadow:0 10px 30px rgba(99,102,241,0.5)">
              <i class="fas fa-brain"></i>
            </div>
          </div>
          
          <div class="core-orbit" id="nodes-container">
            ${AGENT_CONFIG.map((a, i) => {
              const angle = (i / AGENT_CONFIG.length) * (2 * Math.PI);
              const x = 225 + 225 * Math.cos(angle) - 26; // Center 225, radius 225, node width 52
              const y = 225 + 225 * Math.sin(angle) - 26;
              return `
                <div class="agent-node" id="node-${a.id}" data-id="${a.id}" 
                     style="left:${x}px; top:${y}px; color:${a.color}; border-color:${a.color}40"
                     title="${a.name}">
                  <i class="fas ${a.icon}"></i>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Synthesis Info -->
          <div class="synthesis-card">
            <div style="display:flex; justify-content:space-between; align-items:center">
              <div>
                <div style="font-size:0.7rem; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px">Konsensus Keandalan</div>
                <div class="pulse-score-display" id="global-score">--</div>
              </div>
              <div style="text-align:right">
                <div id="global-status" style="font-size:0.9rem; font-weight:800; color:#0f172a">Idle...</div>
                <div style="font-size:0.7rem; color:#64748b">Menunggu Input Analisis</div>
              </div>
            </div>
            <div style="margin-top:20px; display:flex; gap:8px" id="synthesis-badges">
              <!-- Result badges go here -->
            </div>
          </div>
        </div>

        <!-- Right: Reasoning Terminal -->
        <div class="bridge-terminal">
          <div class="terminal-header">
            <div style="display:flex; align-items:center; gap:10px">
              <div class="terminal-dot" style="background:#ef4444"></div>
              <div class="terminal-dot" style="background:#f59e0b"></div>
              <div class="terminal-dot" style="background:#10b981"></div>
              <span style="font-size:0.7rem; font-weight:800; color:rgba(255,255,255,0.4); margin-left:10px">REASONING_STREAM_V2.0</span>
            </div>
            <div class="terminal-actions">
              <button class="btn btn-ghost btn-sm" id="btn-clear-terminal" style="color:rgba(255,255,255,0.3); font-size:0.6rem"><i class="fas fa-trash-can"></i> CLEAR</button>
            </div>
          </div>
          
          <div class="terminal-feed" id="terminal-feed">
             <div class="feed-line system">
               <span class="feed-timestamp">${new Date().toLocaleTimeString()}</span>
               <span class="feed-tag" style="background:#6366f1">CORE</span> System initialized. Awaiting orchestrator command.
             </div>
          </div>

          <!-- Bottom Footer -->
          <div style="margin-top:20px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between">
             <button id="btn-download-report-bridge" class="btn btn-primary btn-sm" style="background:#10b981; border:none; border-radius:10px" ${_selectedProyekId ? '' : 'disabled'}>
               <i class="fas fa-file-word"></i> Build Report
             </button>
             <button id="btn-sync-drive-bridge" class="btn btn-ghost btn-sm" style="color:#38bdf8" ${_selectedProyekId ? '' : 'disabled'}>
               <i class="fab fa-google-drive"></i> Sync to Drive
             </button>
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
  
  // Selection
  const selProyek = document.getElementById('select-proyek-bridge');
  if (selProyek) {
    selProyek.onchange = (e) => {
      _selectedProyekId = e.target.value;
      window.navigate('multi-agent', { proyekId: _selectedProyekId });
    };
  }

  // Run Specific Agent via Node Click
  document.querySelectorAll('.agent-node').forEach(node => {
    node.onclick = () => runSingleAgent(node.dataset.id);
  });

  // Run All
  const btnRunAll = document.getElementById('btn-run-all');
  if (btnRunAll) {
    btnRunAll.onclick = () => runAllAgentsOrchestrated();
  }

  // Clear Terminal
  const btnClear = document.getElementById('btn-clear-terminal');
  if (btnClear) {
    btnClear.onclick = () => { document.getElementById('terminal-feed').innerHTML = ''; };
  }

  // Sync to Drive
  const btnSyncDrive = document.getElementById('btn-sync-drive-bridge');
  if (btnSyncDrive) {
    btnSyncDrive.onclick = async () => {
      if (Object.keys(_sessionResults).length === 0) return showError("Jalankan analisis terlebih dahulu.");
      btnSyncDrive.disabled = true;
      addTerminalLine('DRIVE', 'Initializing Google Drive project sync...', 'SYSTEM', '#38bdf8');
      
      try {
        const findings = Object.values(_sessionResults).map(r => 
          `### ${r.name} (Skor: ${r.skor})\n\n${r.analisis}\n\n**Rekomendasi:**\n${r.rekomendasi}`
        ).join('\n\n---\n\n');

        const fileData = [{
          name: `Konsolidasi_Ahli_${new Date().getTime()}.md`,
          base64: btoa(findings),
          mimeType: 'text/markdown'
        }];

        await uploadToGoogleDrive(fileData, _selectedProyekId, 'Analisis AI', 'REASONING_HUB');
        addTerminalLine('DRIVE', 'Successfully synced consolidated findings to Drive.', 'SYSTEM', '#10b981');
        showSuccess("Data berhasil disinkronkan ke Google Drive.");
      } catch (e) {
        addTerminalLine('DRIVE', `Sync Failed: ${e.message}`, 'SYSTEM', '#ef4444');
        showError(e.message);
      } finally { btnSyncDrive.disabled = false; }
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
  line.className = `feed-line ${category.toLowerCase()}`;
  if (color) line.style.setProperty('--agent-color', color);
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  line.innerHTML = `
    <span class="feed-timestamp">${time}</span>
    <span class="feed-tag" style="background:${color}">${tag}</span>
    <span class="feed-content">${message}</span>
  `;
  grid.appendChild(line);
  grid.scrollTop = grid.scrollHeight;
}

/**
 * LOGIC: ORCHESTRATION
 */
async function runSingleAgent(agentId) {
  if (!_selectedProyekId) return showError("Pilih proyek terlebih dahulu.");
  
  const node = document.getElementById(`node-${agentId}`);
  const agent = AGENT_CONFIG.find(a => a.id === agentId);
  if (!node) return;

  node.classList.add('active');
  addTerminalLine(agent.id.toUpperCase(), `Deep reasoning session engaged...`, 'AGENT', agent.color);
  
  try {
    const { runSpecificAgentAnalysis } = await import('../lib/multi-agent-service.js');
    
    // Simulate initial steps for UX
    setTimeout(() => addTerminalLine(agent.id.toUpperCase(), "Parsing building geometry & technical parameters...", 'AGENT', agent.color), 500);

    const result = await runSpecificAgentAnalysis(_selectedProyekId, agentId, _sessionResults);
    _sessionResults[agentId] = result;
    
    // Stream real reasoning steps if available
    if (result.reasoning && Array.isArray(result.reasoning)) {
      result.reasoning.forEach((step, idx) => {
        setTimeout(() => {
          addTerminalLine(agent.id.toUpperCase(), `[Reasoning] ${step}`, 'AGENT', agent.color);
        }, 1000 + (idx * 400));
      });
    }

    setTimeout(() => {
      node.classList.remove('active');
      node.classList.add('done');
      addTerminalLine(agent.id.toUpperCase(), `SOLVED: ${result.status_label} (Score: ${result.skor}%)`, 'AGENT', agent.color);
      updateGlobalScore();
    }, 1000 + ((result.reasoning?.length || 0) * 400));

    return result;
  } catch (err) {
    node.classList.remove('active');
    addTerminalLine(agent.id.toUpperCase(), `ERROR: ${err.message}`, 'AGENT', '#ef4444');
    showError(err.message);
  }
}

async function runAllAgentsOrchestrated() {
  if (_isRunningAll) return;
  _isRunningAll = true;
  _sessionResults = {};
  
  const btn = document.getElementById('btn-run-all');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Orkestrasi Berjalan...';
  
  addTerminalLine('CORE', 'Starting Full Consortium Session (15 Agents)...', 'SYSTEM', '#6366f1');

  // Run in batches of 3 to balance speed vs quota
  const batches = [
    ['struktur', 'geoteknik', 'sd_air'],
    ['ruang_dalam', 'ruang_luar', 'pencahayaan'],
    ['elektrikal', 'plumbing', 'mekanikal'],
    ['keselamatan', 'mkkg', 'akustik'],
    ['kesehatan', 'legal', 'laporan']
  ];

  for (const batch of batches) {
    addTerminalLine('CORE', `Activating Batch: ${batch.join(', ')}`, 'SYSTEM', '#818cf8');
    await Promise.all(batch.map(id => runSingleAgent(id)));
  }

  addTerminalLine('CORE', 'Full Consortium session completed. Synthesizing final fatwa...', 'SYSTEM', '#10b981');
  const { runCoordinatorSynthesis } = await import('../lib/multi-agent-service.js');
  const final = await runCoordinatorSynthesis(Object.values(_sessionResults));
  
  document.getElementById('global-status').innerText = final.status;
  document.getElementById('global-status').style.color = final.color;
  
  showSuccess("Orkestrasi seluruh agen selesai!");
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-check-double"></i> Analisis Selesai';
  _isRunningAll = false;
}

function updateGlobalScore() {
  const vals = Object.values(_sessionResults);
  if (vals.length === 0) return;
  const avg = Math.round(vals.reduce((s, r) => s + (r.skor || 0), 0) / vals.length);
  const scoreEl = document.getElementById('global-score');
  if (scoreEl) {
    scoreEl.innerText = `${avg}%`;
    scoreEl.style.animation = 'none';
    setTimeout(() => scoreEl.style.animation = 'pulse-score 0.5s ease', 10);
  }
}

/**
 * EDITOR & OTHERS (Simplified for this version)
 */
function renderEditor() { return `<div>Editor placeholder</div>`; }
