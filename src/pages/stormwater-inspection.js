/**
 * STORMWATER INSPECTION PAGE
 * Halaman pemeriksaan sistem pengelolaan air hujan dengan:
 * - Hydrological Modeling (IDF Curves, Design Storms)
 * - Hydraulic Routing (Kinematic/Dynamic Wave)
 * - LID Controls (Green Infrastructure)
 * - Water Quality Simulation
 * - Compliance Check (Pasal 224 ayat 11)
 * 
 * UI Style: Presidential Quartz
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// Stormwater Module imports
import '../modules/stormwater/components/CatchmentMapper.js';
import '../modules/stormwater/components/CompliancePasal224Panel.js';
import { StormwaterEngine } from '../modules/stormwater/core/StormwaterEngine.js';
import { RainwaterManagementEvaluator } from '../modules/stormwater/evaluation/RainwaterManagementEvaluator.js';
import { StormwaterService } from '../modules/stormwater/services/StormwaterService.js';
import { StormwaterReportService } from '../modules/stormwater/services/StormwaterReportService.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let currentTab = 'mapper';
let stormwaterData = {
  simulation: null,
  evaluation: null,
  catchments: []
};

const service = new StormwaterService();
const reportService = new StormwaterReportService();

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function stormwaterInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');

  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }

  await loadProjectInfo();
  await loadStormwaterData();

  return renderPage();
}

export function afterStormwaterInspectionRender() {
  initEventListeners();
  initCustomElements();
  renderCurrentTab();
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadProjectInfo() {
  try {
    const { data, error } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, alamat, kota, luas_bangunan, jumlah_lantai, fungsi_bangunan')
      .eq('id', currentProjectId)
      .single();

    if (data) {
      currentProjectName = data.nama_bangunan;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadStormwaterData() {
  try {
    const [simulation, evaluation, catchments] = await Promise.all([
      service.loadSimulation(currentProjectId),
      service.loadEvaluation(currentProjectId),
      service.loadCatchments(currentProjectId)
    ]);

    stormwaterData.simulation = simulation;
    stormwaterData.evaluation = evaluation;
    stormwaterData.catchments = catchments || [];
  } catch (e) {
    console.warn('Error loading stormwater data:', e);
  }
}

// ============================================================
// PAGE RENDERER
// ============================================================

function renderPage() {
  return `
    <div id="stormwater-page" style="animation: page-fade-in 0.8s ease-out; height: 100%; display: flex; flex-direction: column;">
      
      <!-- Header -->
      <div class="card-quartz" style="padding: var(--space-6); margin-bottom: var(--space-4); flex-shrink: 0;">
        <div class="flex-between flex-stack" style="align-items: flex-start; gap: var(--space-4);">
          <div>
            <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id:'${currentProjectId}'})" 
              style="margin-bottom: 12px; color: var(--brand-300); padding: 0; font-weight: 700; letter-spacing: 1px;">
              <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> KEMBALI KE PROYEK
            </button>
            <h1 class="page-title" style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0;">
              🌧️ Sistem Pengelolaan Air Hujan
            </h1>
            <p style="color: var(--text-secondary); margin-top: 8px; font-size: 14px;">
              ${escHtml(currentProjectName)} • Evaluasi Pasal 224 ayat (11) PP 16/2021
            </p>
          </div>
          
          <div class="flex gap-3">
            <button class="btn btn-outline" id="btn-load-data" style="border-radius: 12px; height: 44px;">
              <i class="fas fa-sync" style="margin-right: 8px;"></i> Muat Data
            </button>
            <button class="btn btn-primary" id="btn-export" style="border-radius: 12px; height: 44px;">
              <i class="fas fa-file-export" style="margin-right: 8px;"></i> Export
            </button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div style="display: flex; gap: 8px; margin-top: 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <button class="storm-tab active" data-tab="mapper" style="${getTabStyle(true)}">
            <i class="fas fa-map-marked-alt" style="margin-right: 8px;"></i> Catchment Mapper
          </button>
          <button class="storm-tab" data-tab="simulation" style="${getTabStyle(false)}">
            <i class="fas fa-chart-line" style="margin-right: 8px;"></i> Simulasi Hidrologi
          </button>
          <button class="storm-tab" data-tab="evaluation" style="${getTabStyle(false)}">
            <i class="fas fa-clipboard-check" style="margin-right: 8px;"></i> Evaluasi Pasal 224
          </button>
          <button class="storm-tab" data-tab="report" style="${getTabStyle(false)}">
            <i class="fas fa-file-alt" style="margin-right: 8px;"></i> Laporan
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div id="tab-content" style="flex: 1; overflow: hidden; position: relative;">
        <!-- Dynamic content loaded here -->
      </div>

    </div>
  `;
}

function getTabStyle(active) {
  return `
    padding: 12px 20px;
    background: ${active ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
    border: none;
    border-bottom: 2px solid ${active ? '#3b82f6' : 'transparent'};
    color: ${active ? '#60a5fa' : '#94a3b8'};
    font-weight: ${active ? '600' : '400'};
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
  `;
}

// ============================================================
// TAB RENDERERS
// ============================================================

function renderCurrentTab() {
  const container = document.getElementById('tab-content');
  if (!container) return;

  switch (currentTab) {
    case 'mapper':
      container.innerHTML = renderMapperTab();
      initMapperTab();
      break;
    case 'simulation':
      container.innerHTML = renderSimulationTab();
      initSimulationTab();
      break;
    case 'evaluation':
      container.innerHTML = renderEvaluationTab();
      initEvaluationTab();
      break;
    case 'report':
      container.innerHTML = renderReportTab();
      initReportTab();
      break;
  }
}

function renderMapperTab() {
  return `
    <div style="display: grid; grid-template-columns: 1fr 380px; height: 100%; gap: 16px; padding: 0 16px 16px;">
      <div style="background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <catchment-mapper id="catchment-mapper" style="width: 100%; height: 100%;"></catchment-mapper>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
        <div class="card-quartz" style="padding: 20px;">
          <h3 style="margin: 0 0 16px; color: #60a5fa; font-size: 14px;">
            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>Panduan Penggunaan
          </h3>
          <ol style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 12px; line-height: 1.8;">
            <li>Klik <strong>Auto Delineate</strong> untuk generate otomatis dari data bangunan</li>
            <li>Atau gunakan tool <strong>Roof/Pavement/Green</strong> untuk menggambar manual</li>
            <li>Tambahkan <strong>LID Control</strong> untuk sistem pengelolaan air hujan</li>
            <li>Klik <strong>Run Simulation</strong> untuk analisis hidrolika</li>
            <li>Lihat hasil di panel kanan</li>
          </ol>
        </div>
        
        <div class="card-quartz" style="padding: 20px;">
          <h3 style="margin: 0 0 16px; color: #60a5fa; font-size: 14px;">
            <i class="fas fa-cloud-showers-heavy" style="margin-right: 8px;"></i>Design Storm
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 11px; color: #64748b; text-transform: uppercase;">Kota</label>
              <select id="storm-city" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; margin-top: 4px;">
                <option value="Jakarta">Jakarta</option>
                <option value="Bandung">Bandung</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Semarang">Semarang</option>
                <option value="Yogyakarta">Yogyakarta</option>
                <option value="Medan">Medan</option>
                <option value="Makassar">Makassar</option>
                <option value="Denpasar">Denpasar</option>
              </select>
            </div>
            <div>
              <label style="font-size: 11px; color: #64748b; text-transform: uppercase;">Periode Ulang</label>
              <select id="storm-return" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; margin-top: 4px;">
                <option value="2">2 tahun</option>
                <option value="5">5 tahun</option>
                <option value="10">10 tahun</option>
                <option value="25" selected>25 tahun</option>
                <option value="50">50 tahun</option>
                <option value="100">100 tahun</option>
              </select>
            </div>
            <div>
              <label style="font-size: 11px; color: #64748b; text-transform: uppercase;">Durasi (menit)</label>
              <input type="number" id="storm-duration" value="120" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; margin-top: 4px;">
            </div>
            <div>
              <label style="font-size: 11px; color: #64748b; text-transform: uppercase;">Distribusi</label>
              <select id="storm-type" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; margin-top: 4px;">
                <option value="SCS Type II" selected>SCS Type II</option>
                <option value="SCS Type I">SCS Type I</option>
                <option value="SCS Type IA">SCS Type IA</option>
                <option value="Chicago">Chicago</option>
                <option value="Block">Uniform Block</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card-quartz" style="padding: 20px;">
          <h3 style="margin: 0 0 16px; color: #60a5fa; font-size: 14px;">
            <i class="fas fa-leaf" style="margin-right: 8px;"></i>LID Configuration
          </h3>
          <div style="font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 12px;">Pilih catchment dengan tipe "LID Control" untuk konfigurasi sistem LID.</p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span style="background: rgba(59, 130, 246, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">Rain Garden</span>
              <span style="background: rgba(16, 185, 129, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">Green Roof</span>
              <span style="background: rgba(245, 158, 11, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">Bioswale</span>
              <span style="background: rgba(139, 92, 246, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 11px;">Detention Pond</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSimulationTab() {
  const hasData = stormwaterData.simulation;

  return `
    <div style="padding: 0 16px 16px; height: 100%; overflow-y: auto;">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 18px; color: white;">
            <i class="fas fa-chart-line" style="margin-right: 12px; color: #60a5fa;"></i>
            Hasil Simulasi Hidrologi
          </h2>
          <button class="btn btn-primary" id="btn-run-simulation">
            <i class="fas fa-play" style="margin-right: 8px;"></i> Run Simulation
          </button>
        </div>

        ${hasData ? renderSimulationResults() : `
          <div style="text-align: center; padding: 60px 20px; color: #64748b;">
            <i class="fas fa-water" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>Belum ada data simulasi. Gunakan tab "Catchment Mapper" untuk menjalankan simulasi.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderSimulationResults() {
  const sim = stormwaterData.simulation;
  const summary = sim?.summary || {};

  return `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Debit Puncak</div>
        <div style="font-size: 28px; font-weight: 700; color: #34d399; font-family: 'JetBrains Mono', monospace;">${(summary.peakOutflow || 0).toFixed(3)}</div>
        <div style="font-size: 12px; color: #64748b;">m³/s</div>
      </div>
      <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Volume Total</div>
        <div style="font-size: 28px; font-weight: 700; color: #60a5fa; font-family: 'JetBrains Mono', monospace;">${(summary.totalOutflow || 0).toFixed(1)}</div>
        <div style="font-size: 12px; color: #64748b;">m³</div>
      </div>
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Pengurangan Puncak</div>
        <div style="font-size: 28px; font-weight: 700; color: #fbbf24; font-family: 'JetBrains Mono', monospace;">${((summary.peakReduction || 0) * 100).toFixed(0)}%</div>
        <div style="font-size: 12px; color: #64748b;">reduction</div>
      </div>
      <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Pengurangan Volume</div>
        <div style="font-size: 28px; font-weight: 700; color: #a78bfa; font-family: 'JetBrains Mono', monospace;">${((summary.volumeReduction || 0) * 100).toFixed(0)}%</div>
        <div style="font-size: 12px; color: #64748b;">LID capture</div>
      </div>
    </div>

    <div style="background: rgba(15, 23, 42, 0.8); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
      <h3 style="margin: 0 0 16px; font-size: 14px; color: #e2e8f0;">Informasi Design Storm</h3>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; font-size: 13px;">
        <div>
          <span style="color: #64748b; display: block; margin-bottom: 4px;">Kota</span>
          <span style="color: #e2e8f0; font-weight: 500;">${sim?.storm?.city || 'Jakarta'}</span>
        </div>
        <div>
          <span style="color: #64748b; display: block; margin-bottom: 4px;">Periode Ulang</span>
          <span style="color: #e2e8f0; font-weight: 500;">${sim?.storm?.returnPeriod || 25} tahun</span>
        </div>
        <div>
          <span style="color: #64748b; display: block; margin-bottom: 4px;">Distribusi</span>
          <span style="color: #e2e8f0; font-weight: 500;">${sim?.storm?.type || 'SCS Type II'}</span>
        </div>
        <div>
          <span style="color: #64748b; display: block; margin-bottom: 4px;">Total Curah Hujan</span>
          <span style="color: #e2e8f0; font-weight: 500;">${(sim?.storm?.totalDepth || 0).toFixed(1)} mm</span>
        </div>
      </div>
    </div>
  `;
}

function renderEvaluationTab() {
  return `
    <div style="display: grid; grid-template-columns: 1fr 420px; height: 100%; gap: 16px; padding: 0 16px 16px;">
      <div style="background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <compliance-pasal224-panel id="compliance-panel" style="width: 100%; height: 100%;"></compliance-pasal224-panel>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
        <div class="card-quartz" style="padding: 20px;">
          <h3 style="margin: 0 0 16px; color: #60a5fa; font-size: 14px;">
            <i class="fas fa-balance-scale" style="margin-right: 8px;"></i>Pasal 224 ayat (11)
          </h3>
          <div style="background: rgba(15, 23, 42, 0.8); padding: 16px; border-radius: 8px; font-size: 12px; color: #94a3b8; line-height: 1.8;">
            <p style="margin: 0 0 12px;"><strong>Sistem pengelolaan air hujan</strong> wajib memenuhi:</p>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Sistem tangkapan air hujan</li>
              <li>Sistem penyaluran</li>
              <li>Sistem penampungan, pengolahan, peresapan, pembuangan</li>
              <li>Sistem pemanfaatan air hujan</li>
            </ol>
          </div>
        </div>
        
        <div class="card-quartz" style="padding: 20px;">
          <h3 style="margin: 0 0 16px; color: #60a5fa; font-size: 14px;">
            <i class="fas fa-book" style="margin-right: 8px;"></i>Standar Referensi
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 12px; line-height: 2;">
            <li>SNI 2415:2016 - Drainase Perkotaan</li>
            <li>SNI 6398:2011 - Sumur Resapan Air Hujan</li>
            <li>Permen PUPR 22/PRT/M/2020</li>
            <li>PP 16/2021 Pasal 224</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderReportTab() {
  const hasSim = stormwaterData.simulation;
  const hasEval = stormwaterData.evaluation;

  return `
    <div style="padding: 0 16px 16px; height: 100%; overflow-y: auto;">
      <div class="card-quartz" style="padding: 24px;">
        <h2 style="margin: 0 0 24px; font-size: 18px; color: white;">
          <i class="fas fa-file-alt" style="margin-right: 12px; color: #60a5fa;"></i>
          Generate Laporan Teknis
        </h2>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="width: 40px; height: 40px; background: ${hasSim ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-chart-line" style="color: ${hasSim ? '#10b981' : '#64748b'};"></i>
              </div>
              <div>
                <div style="font-size: 14px; font-weight: 600; color: #e2e8f0;">Laporan Simulasi Hidrologi</div>
                <div style="font-size: 12px; color: #64748b;">${hasSim ? 'Data tersedia' : 'Belum ada data'}</div>
              </div>
            </div>
            <button class="btn btn-primary" id="btn-report-simulation" ${!hasSim ? 'disabled' : ''} style="width: 100%;">
              <i class="fas fa-download" style="margin-right: 8px;"></i>Download DOCX
            </button>
          </div>

          <div style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="width: 40px; height: 40px; background: ${hasEval ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-clipboard-check" style="color: ${hasEval ? '#10b981' : '#64748b'};"></i>
              </div>
              <div>
                <div style="font-size: 14px; font-weight: 600; color: #e2e8f0;">Laporan Evaluasi Pasal 224</div>
                <div style="font-size: 12px; color: #64748b;">${hasEval ? 'Data tersedia' : 'Belum ada data'}</div>
              </div>
            </div>
            <button class="btn btn-primary" id="btn-report-evaluation" ${!hasEval ? 'disabled' : ''} style="width: 100%;">
              <i class="fas fa-download" style="margin-right: 8px;"></i>Download DOCX
            </button>
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <h3 style="margin: 0 0 16px; font-size: 14px; color: #e2e8f0;">Export Data</h3>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-outline" id="btn-export-csv" ${!hasSim ? 'disabled' : ''}>
              <i class="fas fa-file-csv" style="margin-right: 8px;"></i>Export CSV
            </button>
            <button class="btn btn-outline" id="btn-export-swmm" ${!hasSim ? 'disabled' : ''}>
              <i class="fas fa-file-code" style="margin-right: 8px;"></i>Export SWMM .inp
            </button>
            <button class="btn btn-outline" id="btn-export-json">
              <i class="fas fa-file-code" style="margin-right: 8px;"></i>Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// INITIALIZATION FUNCTIONS
// ============================================================

function initEventListeners() {
  // Tab switching
  document.querySelectorAll('.storm-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.storm-tab').forEach(t => {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.borderBottomColor = 'transparent';
        t.style.color = '#94a3b8';
        t.style.fontWeight = '400';
      });
      tab.classList.add('active');
      tab.style.background = 'rgba(59, 130, 246, 0.2)';
      tab.style.borderBottomColor = '#3b82f6';
      tab.style.color = '#60a5fa';
      tab.style.fontWeight = '600';

      currentTab = tab.dataset.tab;
      renderCurrentTab();
    });
  });

  // Header buttons
  const btnLoad = document.getElementById('btn-load-data');
  if (btnLoad) {
    btnLoad.addEventListener('click', async () => {
      await loadStormwaterData();
      renderCurrentTab();
      showSuccess('Data berhasil dimuat');
    });
  }

  const btnExport = document.getElementById('btn-export');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      currentTab = 'report';
      renderCurrentTab();
    });
  }
}

function initCustomElements() {
  // Custom elements are auto-registered via imports
}

function initMapperTab() {
  const mapper = document.getElementById('catchment-mapper');
  if (!mapper) return;

  // Listen for simulation completion
  mapper.addEventListener('simulation-complete', async (e) => {
    stormwaterData.simulation = e.detail;
    await service.saveSimulation(currentProjectId, e.detail);
    showSuccess('Simulasi berhasil disimpan');
  });
}

function initSimulationTab() {
  const btnRun = document.getElementById('btn-run-simulation');
  if (btnRun) {
    btnRun.addEventListener('click', async () => {
      // Switch to mapper tab to run simulation
      currentTab = 'mapper';
      renderCurrentTab();
      showInfo('Silakan jalankan simulasi dari tab Catchment Mapper');
    });
  }
}

function initEvaluationTab() {
  const panel = document.getElementById('compliance-panel');
  if (!panel) return;

  panel.addEventListener('evaluation-complete', async (e) => {
    stormwaterData.evaluation = e.detail;
    await service.saveEvaluation(currentProjectId, e.detail);
    showSuccess('Evaluasi berhasil disimpan');
  });

  panel.addEventListener('generate-report', async (e) => {
    const report = await reportService.generatePasal224Report(e.detail.results, {
      name: currentProjectName,
      location: 'Indonesia'
    });
    showSuccess('Laporan evaluasi siap di-generate');
    console.log('Report generated:', report);
  });
}

function initReportTab() {
  // Simulation report
  const btnReportSim = document.getElementById('btn-report-simulation');
  if (btnReportSim) {
    btnReportSim.addEventListener('click', async () => {
      const report = await reportService.generateSimulationReport(stormwaterData.simulation, {
        name: currentProjectName,
        location: 'Indonesia'
      });
      showSuccess('Laporan simulasi berhasil dibuat');
      console.log('Simulation report:', report);
    });
  }

  // Evaluation report
  const btnReportEval = document.getElementById('btn-report-evaluation');
  if (btnReportEval) {
    btnReportEval.addEventListener('click', async () => {
      const report = await reportService.generatePasal224Report(stormwaterData.evaluation, {
        name: currentProjectName,
        location: 'Indonesia'
      });
      showSuccess('Laporan evaluasi berhasil dibuat');
      console.log('Evaluation report:', report);
    });
  }

  // Export CSV
  const btnExportCSV = document.getElementById('btn-export-csv');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      const csv = reportService.generateCSV(stormwaterData.simulation);
      downloadFile(csv, `stormwater-data-${currentProjectId}.csv`, 'text/csv');
      showSuccess('File CSV berhasil di-download');
    });
  }

  // Export SWMM
  const btnExportSWMM = document.getElementById('btn-export-swmm');
  if (btnExportSWMM) {
    btnExportSWMM.addEventListener('click', () => {
      const inp = service.generateSWMMInput(stormwaterData.simulation);
      downloadFile(inp, `stormwater-model-${currentProjectId}.inp`, 'text/plain');
      showSuccess('File SWMM berhasil di-download');
    });
  }

  // Export JSON
  const btnExportJSON = document.getElementById('btn-export-json');
  if (btnExportJSON) {
    btnExportJSON.addEventListener('click', () => {
      const json = JSON.stringify(stormwaterData, null, 2);
      downloadFile(json, `stormwater-data-${currentProjectId}.json`, 'application/json');
      showSuccess('File JSON berhasil di-download');
    });
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default stormwaterInspectionPage;
