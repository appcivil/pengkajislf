// ============================================================
// WATER SYSTEM INSPECTION - MAIN PAGE
// Pemeriksaan Sistem Air Bersih SLF
// Integrates: Hydraulic Network, Compliance Evaluator, Reports
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { globalEventBus } from '../core/EventBus.js';

// Module imports
import '../modules/plumbing/components/NetworkCanvas.js';
import '../modules/plumbing/components/ComplianceWaterPanel.js';
import { WaterDemandCalculator } from '../modules/plumbing/core/WaterDemandCalculator.js';
import { WaterReportService } from '../modules/plumbing/services/WaterReportService.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let waterData = {
  network: null,
  simulation: null,
  evaluation: null,
  demand: null
};
let currentTab = 'network';
let canvas = null;
let panel = null;
let demandCalc = null;

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function waterInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadWaterData();
  
  return renderPage();
}

export function afterWaterInspectionRender() {
  initEventListeners();
  initCustomElements();
  renderCurrentTab();
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadProjectInfo() {
  try {
    const { data } = await supabase.from('proyek').select('*').eq('id', currentProjectId).maybeSingle();
    if (data) {
      currentProjectName = data.nama_bangunan;
      window._currentProjectData = data;
    }
  } catch (err) {
    console.error('Failed to load project:', err);
  }
}

async function loadWaterData() {
  try {
    // Load saved water system data
    const { data } = await supabase
      .from('water_systems')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      waterData = {
        network: data.network_data,
        simulation: data.simulation_results,
        evaluation: data.evaluation_results,
        demand: data.demand_calculation
      };
    }
  } catch (err) {
    console.log('No saved water data:', err);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="water-inspection-page" style="height: 100vh; display: flex; flex-direction: column; animation: page-fade-in 0.5s ease-out;">
      
      <!-- Header -->
      <div class="water-header" style="
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(59, 130, 246, 0.3);
        flex-shrink: 0;
      ">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.15);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          ">💧</div>
          <div>
            <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: white;">Sistem Air Bersih</h1>
            <div style="font-size: 12px; color: rgba(255,255,255,0.7);">
              ${currentProjectName} • Pasal 224 ayat (2) Permen PUPR 14/2017
            </div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="btn-tab ${currentTab === 'demand' ? 'active' : ''}" data-tab="demand">
            📊 Kebutuhan Air
          </button>
          <button class="btn-tab ${currentTab === 'network' ? 'active' : ''}" data-tab="network">
            🌐 Jaringan
          </button>
          <button class="btn-tab ${currentTab === 'compliance' ? 'active' : ''}" data-tab="compliance">
            ✅ Compliance
          </button>
          <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.2); margin: 0 8px;"></div>
          <button class="btn-action" id="btn-run-simulation" style="
            background: #10b981;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
          ">
            ▶ Run Analysis
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div style="flex: 1; overflow: hidden; position: relative; background: #0f172a;">
        
        <!-- Demand Calculator Tab -->
        <div id="tab-demand" class="tab-panel" style="display: ${currentTab === 'demand' ? 'block' : 'none'}; height: 100%; overflow-y: auto;">
          ${renderDemandTab()}
        </div>
        
        <!-- Network Canvas Tab -->
        <div id="tab-network" class="tab-panel" style="display: ${currentTab === 'network' ? 'block' : 'none'}; height: 100%;">
          <div style="display: grid; grid-template-columns: 1fr 380px; height: 100%;">
            <network-canvas id="water-canvas"></network-canvas>
            <compliance-water-panel id="compliance-panel"></compliance-water-panel>
          </div>
        </div>
        
        <!-- Compliance Report Tab -->
        <div id="tab-compliance" class="tab-panel" style="display: ${currentTab === 'compliance' ? 'block' : 'none'}; height: 100%; overflow-y: auto; padding: 24px;">
          ${renderComplianceTab()}
        </div>
        
      </div>

      <!-- Status Bar -->
      <div style="
        background: rgba(15, 23, 42, 0.98);
        border-top: 1px solid rgba(59, 130, 246, 0.2);
        padding: 8px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        color: #64748b;
        font-family: 'JetBrains Mono', monospace;
        flex-shrink: 0;
      ">
        <div id="status-left">Ready • Hardy-Cross Solver Engine v1.0</div>
        <div id="status-right">SNI 6774:2008 • Permen 14/2017</div>
      </div>
    </div>

    <style>
      .btn-tab {
        background: rgba(255,255,255,0.1);
        border: 1px solid transparent;
        color: rgba(255,255,255,0.8);
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-tab:hover {
        background: rgba(255,255,255,0.2);
        color: white;
      }
      .btn-tab.active {
        background: rgba(59, 130, 246, 0.3);
        border-color: rgba(59, 130, 246, 0.5);
        color: white;
      }
      .btn-action:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      .demand-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 20px;
      }
      .demand-card h3 {
        margin: 0 0 16px 0;
        color: #60a5fa;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .input-group {
        margin-bottom: 16px;
      }
      .input-group label {
        display: block;
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 6px;
      }
      .input-group select,
      .input-group input {
        width: 100%;
        padding: 10px 14px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        color: #e2e8f0;
        font-size: 13px;
      }
      .input-group select:focus,
      .input-group input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .result-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .result-item {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
      }
      .result-label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }
      .result-value {
        font-size: 24px;
        font-weight: 800;
        color: #3b82f6;
        font-family: 'JetBrains Mono', monospace;
      }
      .result-unit {
        font-size: 11px;
        color: #64748b;
        margin-top: 4px;
      }
      .btn-calculate {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        margin-top: 8px;
      }
      .btn-calculate:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      }
    </style>
  `;
}

function renderDemandTab() {
  return `
    <div style="max-width: 1000px; margin: 0 auto; padding: 24px;">
      <div class="demand-card">
        <h3>📊 Kalkulator Kebutuhan Air - SNI 6774:2008</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="input-group">
            <label>Jenis Bangunan</label>
            <select id="building-type">
              <option value="office">Perkantoran</option>
              <option value="hospital_inpatient">Rumah Sakit Rawat Inap</option>
              <option value="hospital_outpatient">Rumah Sakit Rawat Jalan</option>
              <option value="residential">Perumahan</option>
              <option value="hotel">Hotel</option>
              <option value="commercial">Pertokoan</option>
              <option value="school">Sekolah</option>
              <option value="restaurant">Restoran/Kafe</option>
              <option value="car_wash">Cuci Mobil</option>
              <option value="public">Ruang Publik</option>
            </select>
          </div>
          <div class="input-group">
            <label>Jumlah Unit</label>
            <input type="number" id="unit-count" value="100" min="1">
          </div>
        </div>
        <button class="btn-calculate" id="btn-calculate-demand">
          🧮 Hitung Kebutuhan Air
        </button>
      </div>

      <div id="demand-results" style="display: none;">
        <div class="demand-card">
          <h3>📈 Hasil Perhitungan</h3>
          <div class="result-grid" id="result-grid">
            <!-- Results populated by JS -->
          </div>
        </div>

        <div class="demand-card">
          <h3>💾 Rekomendasi Storage Tank</h3>
          <div class="result-grid" id="storage-grid">
            <!-- Results populated by JS -->
          </div>
        </div>

        <div class="demand-card">
          <h3>🔧 Rekomendasi Diameter Pipa</h3>
          <div style="margin-bottom: 16px;">
            <div class="input-group" style="display: flex; gap: 12px;">
              <div style="flex: 1;">
                <label>Flow Rate (L/s)</label>
                <input type="number" id="pipe-flow" step="0.1" value="2.5">
              </div>
              <div style="flex: 1;">
                <label>Panjang Pipa (m)</label>
                <input type="number" id="pipe-length" value="50">
              </div>
              <div style="flex: 1;">
                <label>Material</label>
                <select id="pipe-material">
                  <option value="PVC">PVC</option>
                  <option value="Steel">Baja</option>
                  <option value="CI">Cast Iron</option>
                  <option value="PE">PE</option>
                </select>
              </div>
            </div>
            <button class="btn-calculate" id="btn-calculate-pipe" style="margin-top: 12px;">
              📏 Hitung Diameter Pipa
            </button>
          </div>
          <div id="pipe-results"></div>
        </div>
      </div>
    </div>
  `;
}

function renderComplianceTab() {
  const hasResults = waterData.evaluation !== null;
  
  return `
    <div style="max-width: 900px; margin: 0 auto;">
      <div class="demand-card">
        <h3>📋 Ringkasan Evaluasi Compliance</h3>
        ${hasResults ? `
          <div style="text-align: center; padding: 40px;">
            <div style="font-size: 64px; font-weight: 800; color: ${waterData.evaluation?.score >= 80 ? '#10b981' : waterData.evaluation?.score >= 60 ? '#f59e0b' : '#ef4444'};">
              ${waterData.evaluation?.score || 0}%
            </div>
            <div style="font-size: 14px; color: #64748b; margin-top: 12px;">
              ${waterData.evaluation?.score >= 80 ? '✅ COMPLIANT - Memenuhi Standar' : waterData.evaluation?.score >= 60 ? '⚠️ PARTIAL - Perlu Perbaikan' : '❌ NON-COMPLIANT'}
            </div>
          </div>
          <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px;">
            <button class="btn-calculate" id="btn-view-details" style="width: auto; padding: 12px 32px;">
              📄 Lihat Detail Lengkap
            </button>
            <button class="btn-calculate" id="btn-export-report" style="width: auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              📥 Export DOCX
            </button>
          </div>
        ` : `
          <div style="text-align: center; padding: 60px; color: #64748b;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <p>Belum ada data evaluasi.</p>
            <p style="font-size: 12px; margin-top: 8px;">Jalankan simulasi di tab Jaringan terlebih dahulu.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function initEventListeners() {
  // Tab switching
  document.querySelectorAll('.btn-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      document.getElementById(`tab-${currentTab}`).style.display = 'block';
      
      if (currentTab === 'network') {
        renderCurrentTab();
      }
    });
  });

  // Run simulation button
  document.getElementById('btn-run-simulation')?.addEventListener('click', runSimulation);

  // Demand calculator
  document.getElementById('btn-calculate-demand')?.addEventListener('click', calculateDemand);
  document.getElementById('btn-calculate-pipe')?.addEventListener('click', calculatePipeSize);

  // Export buttons
  document.getElementById('btn-export-report')?.addEventListener('click', exportReport);
  document.getElementById('btn-view-details')?.addEventListener('click', () => {
    currentTab = 'network';
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="network"]').classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    document.getElementById('tab-network').style.display = 'block';
    renderCurrentTab();
  });

  // Notification listener
  globalEventBus.on('notification', ({ message, type }) => {
    if (type === 'success') showSuccess(message);
    else if (type === 'error') showError(message);
    else showInfo(message);
  });
}

function initCustomElements() {
  // Get references to custom elements
  canvas = document.getElementById('water-canvas');
  panel = document.getElementById('compliance-panel');

  if (canvas) {
    // Listen for canvas events
    canvas.addEventListener('node-selected', (e) => {
      showInfo(`Node ${e.detail.id} selected`);
    });
  }

  if (panel) {
    // Listen for panel events
    panel.addEventListener('request-evaluation', () => {
      runSimulation();
    });

    panel.addEventListener('generate-report', (e) => {
      exportReport(e.detail);
    });

    panel.addEventListener('save-evaluation', (e) => {
      saveEvaluation(e.detail);
    });

    panel.addEventListener('evaluation-complete', (e) => {
      waterData.evaluation = e.detail;
      showSuccess(`Evaluasi selesai: ${e.detail.score}%`);
    });
  }

  // Initialize calculator
  demandCalc = new WaterDemandCalculator();
}

function renderCurrentTab() {
  if (currentTab === 'network') {
    // Canvas is auto-rendered by the custom element
    // Panel is auto-rendered by the custom element
    
    // Sync data if available
    if (canvas && waterData.network) {
      // Load saved network data
    }
  }
}

// ============================================================
// SIMULATION & CALCULATIONS
// ============================================================

async function runSimulation() {
  if (!canvas) return;

  const statusEl = document.getElementById('status-left');
  statusEl.textContent = 'Running hydraulic analysis...';

  try {
    const results = await canvas.runSimulation();
    
    if (panel) {
      panel.setNetworkData(canvas.getNetworkData());
      panel.setSimulationResults(results);
    }

    waterData.simulation = results;
    waterData.network = canvas.getNetworkData();

    statusEl.textContent = `Analysis complete: ${results.summary.iterations} iterations`;
    showSuccess('Analisis hydraulic selesai');
  } catch (err) {
    console.error('Simulation error:', err);
    statusEl.textContent = 'Analysis failed';
    showError('Gagal menjalankan simulasi: ' + err.message);
  }
}

function calculateDemand() {
  const buildingType = document.getElementById('building-type').value;
  const unitCount = parseInt(document.getElementById('unit-count').value) || 0;

  if (!buildingType || unitCount <= 0) {
    showError('Pilih jenis bangunan dan masukkan jumlah unit');
    return;
  }

  try {
    const results = demandCalc.calculateDemand(buildingType, unitCount);
    waterData.demand = results;

    // Show results
    document.getElementById('demand-results').style.display = 'block';

    // Populate result grid
    document.getElementById('result-grid').innerHTML = `
      <div class="result-item">
        <div class="result-label">Kebutuhan Harian</div>
        <div class="result-value">${results.dailyDemandM3}</div>
        <div class="result-unit">m³/hari</div>
      </div>
      <div class="result-item">
        <div class="result-label">Peak Flow Rate</div>
        <div class="result-value">${results.peakFlowRate.toFixed(2)}</div>
        <div class="result-unit">L/s</div>
      </div>
      <div class="result-item">
        <div class="result-label">Peak Hour Flow</div>
        <div class="result-value">${Math.round(results.peakHourFlow)}</div>
        <div class="result-unit">L/jam</div>
      </div>
      <div class="result-item">
        <div class="result-label">Peak Factor</div>
        <div class="result-value">${results.peakFactor}</div>
        <div class="result-unit">x average</div>
      </div>
    `;

    // Populate storage grid
    document.getElementById('storage-grid').innerHTML = `
      <div class="result-item">
        <div class="result-label">Ground Tank (30%)</div>
        <div class="result-value">${(results.groundTankVolume / 1000).toFixed(1)}</div>
        <div class="result-unit">m³</div>
      </div>
      <div class="result-item">
        <div class="result-label">Roof Tank (15%)</div>
        <div class="result-value">${(results.roofTankVolume / 1000).toFixed(1)}</div>
        <div class="result-unit">m³</div>
      </div>
      <div class="result-item">
        <div class="result-label">Fire Reserve</div>
        <div class="result-value">${(results.fireReserve / 1000).toFixed(1)}</div>
        <div class="result-unit">m³</div>
      </div>
      <div class="result-item">
        <div class="result-label">Total Ground</div>
        <div class="result-value">${(results.totalGroundTank / 1000).toFixed(1)}</div>
        <div class="result-unit">m³</div>
      </div>
    `;

    showSuccess('Perhitungan selesai');
  } catch (err) {
    showError(err.message);
  }
}

function calculatePipeSize() {
  const flowRate = parseFloat(document.getElementById('pipe-flow').value) || 0;
  const length = parseFloat(document.getElementById('pipe-length').value) || 0;
  const material = document.getElementById('pipe-material').value;

  if (flowRate <= 0) {
    showError('Masukkan flow rate');
    return;
  }

  const size = demandCalc.calculatePipeSize(flowRate);
  const headLoss = demandCalc.calculateHeadLoss(flowRate, size.recommended, length, material);

  document.getElementById('pipe-results').innerHTML = `
    <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin-top: 16px;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Diameter Rekomendasi</div>
          <div style="font-size: 28px; font-weight: 800; color: #3b82f6; margin-top: 8px;">${size.recommended} mm</div>
          <div style="font-size: 12px; color: #64748b;">${size.recommendedInch}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Kecepatan Aliran</div>
          <div style="font-size: 28px; font-weight: 800; color: ${headLoss.velocityOk ? '#10b981' : '#f59e0b'}; margin-top: 8px;">${headLoss.velocity} m/s</div>
          <div style="font-size: 12px; color: ${headLoss.velocityOk ? '#10b981' : '#f59e0b'};">${headLoss.velocityOk ? '✓ OK' : '⚠️ Check'}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Head Loss</div>
          <div style="font-size: 28px; font-weight: 800; color: ${headLoss.headLoss > 10 ? '#ef4444' : '#3b82f6'}; margin-top: 8px;">${headLoss.headLoss.toFixed(2)} m</div>
          <div style="font-size: 12px; color: #64748b;">per ${length}m</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// EXPORT & SAVE
// ============================================================

async function exportReport(data = null) {
  const reportData = data || {
    pasal: '224 ayat (2)',
    results: waterData.evaluation,
    network: waterData.network,
    simulation: waterData.simulation
  };

  if (!reportData.results) {
    showError('Tidak ada data evaluasi untuk diexport');
    return;
  }

  try {
    const service = new WaterReportService();
    await service.generateReport(reportData);
    showSuccess('Laporan berhasil diexport');
  } catch (err) {
    console.error('Export error:', err);
    showError('Gagal export laporan');
  }
}

async function saveEvaluation(data) {
  try {
    const { evaluation, network, simulation } = data;
    
    const saveData = {
      project_id: currentProjectId,
      evaluation_results: evaluation,
      network_data: network,
      simulation_results: simulation,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase
      .from('water_systems')
      .select('id')
      .eq('project_id', currentProjectId)
      .maybeSingle();

    if (existing) {
      await supabase.from('water_systems').update(saveData).eq('id', existing.id);
    } else {
      await supabase.from('water_systems').insert([saveData]);
    }

    showSuccess('Data tersimpan ke database');
  } catch (err) {
    console.error('Save error:', err);
    showError('Gagal menyimpan: ' + err.message);
  }
}
