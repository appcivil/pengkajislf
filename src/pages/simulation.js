// ============================================================
//  SIMULATION PAGE - Halaman untuk menjalankan simulasi engineering
//  Fitur #15: Pencahayaan & Ventilasi
//  Fitur #16: Jalur Evakuasi  
//  Fitur #17: NDT Test
// ============================================================

import { 
  initPyodide, 
  simulateLighting, 
  simulateVentilation, 
  simulateEvacuation,
  simulateNDT,
  createSimulationPanel,
  saveSimulasi,
  getSimulasiSummary,
  loadFieldDataForSimulation
} from '../lib/simulation-engine.js';
import { exportSimulationVisuals } from '../lib/simulation-visualization.js';
import { exportSimulationToReport } from '../lib/simulation-report-integration.js';
import { importFieldData, convertToSimulationParams, saveImportedFieldData } from '../lib/field-data-import.js';
import { supabase } from '../lib/supabase.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

let pyodideInitialized = false;
let currentProyek = null;
let lastSimulationResult = null;
let lastSimulationType = null;

export async function simulationPage(params = {}) {
  const root = document.getElementById('page-root');
  if (!root) return '';
  
  // Check if in project mode
  const proyekId = params.proyekId;
  const isProjectMode = !!proyekId;
  
  // Fetch project data if in project mode
  if (isProjectMode) {
    try {
      const { data } = await supabase.from('proyek').select('*').eq('id', proyekId).single();
      currentProyek = data;
    } catch (err) {
      console.warn('[Simulation] Failed to load project:', err);
    }
  }
  
  // Initialize Pyodide in background
  initPyodide().then(() => {
    pyodideInitialized = true;
    updateStatus('Pyodide ready - siap menjalankan simulasi');
  }).catch(err => {
    updateStatus('Gagal load Pyodide: ' + err.message, true);
  });
  
  root.innerHTML = `
    <div id="simulation-page">
      <div class="page-header" style="margin-bottom:24px">
        <div class="flex-between">
          <div>
            <h1 class="page-title"><i class="fas fa-flask text-brand"></i> Engineering Simulation</h1>
            <p class="text-secondary">Simulasi pencahayaan, ventilasi, evakuasi, dan NDT berbasis Pyodide & SciPy</p>
          </div>
          ${isProjectMode ? `
            <div style="text-align:right">
              <div class="badge" style="background:var(--brand-bg);color:var(--brand-400)">
                <i class="fas fa-building"></i> ${currentProyek?.nama_bangunan || 'Loading...'}
              </div>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px">Mode: Project Context</div>
            </div>
          ` : ''}
        </div>
        <div id="pyodide-status" style="margin-top:8px;font-size:12px;color:var(--text-tertiary)">
          <i class="fas fa-spinner fa-spin"></i> Loading Pyodide engine...
        </div>
      </div>
      
      <div class="grid-2-1" style="gap:20px">
        <!-- Left: Simulation Controls -->
        <div>
          <div class="card" style="margin-bottom:20px">
            <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
              <span>Pilih Jenis Simulasi</span>
              ${isProjectMode ? `
                <button class="btn btn-sm btn-outline" id="btn-import-field-data" title="Import data pengujian lapangan">
                  <i class="fas fa-file-import"></i> Import Data Lapangan
                </button>
              ` : ''}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary sim-tab" data-type="lighting">
                <i class="fas fa-sun"></i> Pencahayaan
              </button>
              <button class="btn btn-secondary sim-tab" data-type="ventilation">
                <i class="fas fa-wind"></i> Ventilasi
              </button>
              <button class="btn btn-secondary sim-tab" data-type="evacuation">
                <i class="fas fa-running"></i> Evakuasi
              </button>
              <button class="btn btn-secondary sim-tab" data-type="ndt">
                <i class="fas fa-hammer"></i> NDT Test
              </button>
            </div>
          </div>
          
          <!-- Import Field Data Section -->
          <div id="field-data-import-section" style="display:none;margin-bottom:20px">
            <div class="card" style="background:var(--warning-bg);border-color:var(--warning-border)">
              <div class="card-title" style="color:var(--warning)"><i class="fas fa-upload"></i> Import Data Pengujian Lapangan</div>
              <p class="text-sm" style="margin-bottom:12px;color:var(--text-secondary)">
                Upload file Excel, CSV, PDF laporan pengujian, atau referensi DWG/RVT untuk digunakan dalam simulasi.
              </p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                <input type="file" id="field-data-file-input" accept=".xlsx,.xls,.csv,.pdf,.dwg,.rvt" style="display:none" />
                <button class="btn btn-secondary" onclick="document.getElementById('field-data-file-input').click()">
                  <i class="fas fa-folder-open"></i> Pilih File
                </button>
                <span id="selected-file-name" class="text-sm" style="color:var(--text-tertiary);align-self:center"></span>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-primary" id="btn-process-import" disabled>
                  <i class="fas fa-cogs"></i> Proses & Import
                </button>
                <button class="btn btn-ghost" id="btn-cancel-import">Batal</button>
              </div>
              <div id="import-status" style="margin-top:12px;font-size:12px"></div>
            </div>
          </div>
          
          <!-- Imported Field Data List -->
          <div id="imported-data-list" style="display:none;margin-bottom:20px">
            <div class="card" style="background:var(--success-bg);border-color:var(--success-border)">
              <div class="card-title" style="color:var(--success);display:flex;justify-content:space-between;align-items:center">
                <span><i class="fas fa-database"></i> Data Lapangan Tersedia</span>
                <button class="btn btn-xs btn-ghost" id="btn-refresh-field-data"><i class="fas fa-sync"></i></button>
              </div>
              <div id="field-data-items" style="max-height:200px;overflow-y:auto"></div>
            </div>
          </div>
          
          <div id="simulation-control-panel">
            <!-- Simulation form akan di-render di sini -->
          </div>
        </div>
        
        <!-- Right: Results & Visualization -->
        <div>
          <div class="card" id="result-card" style="display:none">
            <div class="card-title"><i class="fas fa-chart-bar"></i> Hasil Simulasi</div>
            <div id="simulation-result-content"></div>
            ${isProjectMode ? `
              <div id="save-simulation-section" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-subtle);display:none">
                <button class="btn btn-primary" id="btn-save-simulasi" style="width:100%">
                  <i class="fas fa-save"></i> Simpan ke Proyek
                </button>
              </div>
            ` : ''}
          </div>
          
          <div class="card" style="margin-top:20px">
            <div class="card-title"><i class="fas fa-info-circle"></i> Informasi Standar</div>
            <div class="text-sm" style="line-height:1.6">
              <p><strong>SNI 03-2396-2001:</strong> Pencahayaan alami minimum Daylight Factor 0.5%</p>
              <p><strong>SNI 03-6572-2001:</strong> Ventilasi minimum 5-6 ACH (Air Changes per Hour)</p>
              <p><strong>SNI 03-1736-2012:</strong> Waktu evakuasi maksimum 3-5 menit</p>
              <p><strong>SNI 2847:2019:</strong> Kekuatan beton minimum K-250 (20.75 MPa)</p>
            </div>
          </div>
          
          ${isProjectMode ? `
            <div class="card" style="margin-top:20px;background:var(--brand-bg)">
              <div class="card-title"><i class="fas fa-building"></i> Data Proyek</div>
              <div class="text-sm">
                <p><strong>Nama:</strong> ${currentProyek?.nama_bangunan || '-'}</p>
                <p><strong>Fungsi:</strong> ${currentProyek?.fungsi_bangunan || '-'}</p>
                <p><strong>Lantai:</strong> ${currentProyek?.jumlah_lantai || '-'} lantai</p>
                <p><strong>Luas:</strong> ${currentProyek?.luas_bangunan ? currentProyek.luas_bangunan + ' m²' : '-'}</p>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  
  // Setup tab switching
  setupTabs(proyekId);
  
  // Setup field data import jika dalam mode proyek
  if (isProjectMode) {
    setupFieldDataImport(proyekId);
    loadImportedFieldDataList(proyekId);
  }
  
  // Load default simulation
  loadSimulation('lighting', proyekId);
  
  return root.innerHTML;
}

/**
 * Setup field data import UI and event handlers
 */
function setupFieldDataImport(proyekId) {
  const btnImport = document.getElementById('btn-import-field-data');
  const importSection = document.getElementById('field-data-import-section');
  const fileInput = document.getElementById('field-data-file-input');
  const btnProcess = document.getElementById('btn-process-import');
  const btnCancel = document.getElementById('btn-cancel-import');
  const fileNameDisplay = document.getElementById('selected-file-name');
  const statusDiv = document.getElementById('import-status');
  
  let selectedFile = null;
  let importedData = null;
  
  // Toggle import section
  btnImport?.addEventListener('click', () => {
    const isVisible = importSection.style.display === 'block';
    importSection.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      // Reset state
      selectedFile = null;
      importedData = null;
      fileNameDisplay.textContent = '';
      btnProcess.disabled = true;
      statusDiv.innerHTML = '';
      fileInput.value = '';
    }
  });
  
  // File selection
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFile = file;
      fileNameDisplay.textContent = file.name;
      btnProcess.disabled = false;
      statusDiv.innerHTML = `<span style="color:var(--text-tertiary)">File siap diproses</span>`;
    }
  });
  
  // Cancel import
  btnCancel?.addEventListener('click', () => {
    importSection.style.display = 'none';
    selectedFile = null;
    fileInput.value = '';
  });
  
  // Process import
  btnProcess?.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    btnProcess.disabled = true;
    btnProcess.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    statusDiv.innerHTML = '<span style="color:var(--info)"><i class="fas fa-circle-notch fa-spin"></i> Membaca file...</span>';
    
    try {
      // Import dan parse file
      const parsed = await importFieldData(selectedFile, { proyekId });
      importedData = parsed;
      
      statusDiv.innerHTML = `<span style="color:var(--success)"><i class="fas fa-check"></i> File berhasil dibaca! Tipe terdeteksi: ${parsed.detectedType}</span>`;
      
      // Convert ke parameter simulasi
      const tipeTarget = prompt(
        `Data terdeteksi sebagai: ${parsed.detectedType}\n\nPilih tipe simulasi untuk menggunakan data ini:\n1. pencahayaan\n2. ventilasi\n3. evakuasi\n4. ndt_rebound\n5. ndt_upv`,
        parsed.detectedType
      );
      
      if (!tipeTarget) {
        statusDiv.innerHTML += '<br><span style="color:var(--warning)">Import dibatalkan</span>';
        return;
      }
      
      // Convert ke parameter simulasi
      statusDiv.innerHTML += '<br><span style="color:var(--info)"><i class="fas fa-cogs"></i> Mengkonversi ke parameter simulasi...</span>';
      
      const simParams = convertToSimulationParams(parsed, tipeTarget);
      
      // Save ke database
      await saveImportedFieldData(proyekId, parsed, simParams);
      
      showSuccess(`Data ${parsed.metadata.originalFilename} berhasil diimport dan dikaitkan dengan simulasi ${tipeTarget}!`);
      
      statusDiv.innerHTML = `<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Import berhasil! Data tersimpan dan dapat digunakan untuk simulasi.</span>`;
      
      // Refresh list
      loadImportedFieldDataList(proyekId);
      
      // Hide import section after success
      setTimeout(() => {
        importSection.style.display = 'none';
      }, 2000);
      
    } catch (err) {
      console.error('[FieldImport] Error:', err);
      statusDiv.innerHTML = `<span style="color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</span>`;
      showError('Gagal import: ' + err.message);
    } finally {
      btnProcess.disabled = false;
      btnProcess.innerHTML = '<i class="fas fa-cogs"></i> Proses & Import';
    }
  });
}

/**
 * Load dan tampilkan list imported field data
 */
async function loadImportedFieldDataList(proyekId) {
  const listContainer = document.getElementById('imported-data-list');
  const itemsContainer = document.getElementById('field-data-items');
  const refreshBtn = document.getElementById('btn-refresh-field-data');
  
  if (!listContainer || !itemsContainer) return;
  
  // Setup refresh button
  refreshBtn?.addEventListener('click', () => loadImportedFieldDataList(proyekId));
  
  try {
    // Fetch dari database
    const { data: fieldData, error } = await supabase
      .from('field_test_data')
      .select('*')
      .eq('proyek_id', proyekId)
      .order('imported_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (fieldData && fieldData.length > 0) {
      listContainer.style.display = 'block';
      
      const typeLabels = {
        'pencahayaan': 'Pencahayaan',
        'ventilasi': 'Ventilasi',
        'evakuasi': 'Evakuasi',
        'ndt_rebound': 'NDT Rebound',
        'ndt_upv': 'NDT UPV',
        'unknown': 'Unknown'
      };
      
      const formatIcons = {
        'excel': 'fa-file-excel',
        'csv': 'fa-file-csv',
        'pdf': 'fa-file-pdf',
        'dwg': 'fa-drafting-compass',
        'rvt': 'fa-cube'
      };
      
      itemsContainer.innerHTML = fieldData.map(item => {
        const date = new Date(item.imported_at).toLocaleDateString('id-ID');
        const icon = formatIcons[item.source_format] || 'fa-file';
        
        return `
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-subtle);border-radius:6px;margin-bottom:6px">
            <i class="fas ${icon}" style="color:var(--text-tertiary)"></i>
            <div style="flex:1;min-width:0">
              <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.source_filename}</div>
              <div style="font-size:9px;color:var(--text-tertiary)">${typeLabels[item.tipe_pengujian] || item.tipe_pengujian} • ${date}</div>
            </div>
            ${item.storage_url ? `<a href="${item.storage_url}" target="_blank" style="font-size:11px;color:var(--brand-400)"><i class="fas fa-external-link-alt"></i></a>` : ''}
          </div>
        `;
      }).join('');
      
    } else {
      listContainer.style.display = 'none';
    }
    
  } catch (err) {
    console.error('[FieldImport] Failed to load list:', err);
    itemsContainer.innerHTML = `<div style="font-size:11px;color:var(--danger)">Gagal memuat data</div>`;
  }
}

function setupTabs(proyekId) {
  document.querySelectorAll('.sim-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      document.querySelectorAll('.sim-tab').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      
      // Load simulation
      const type = btn.dataset.type;
      loadSimulation(type, proyekId);
    });
  });
}

function loadSimulation(type, proyekId) {
  const panel = document.getElementById('simulation-control-panel');
  if (!panel) return;
  
  const handlers = {
    lighting: async (params) => {
      const roomDims = {
        length: params.length,
        width: params.width,
        height: params.height
      };
      const windowConfig = {
        windowArea: params.windowArea,
        windowHeight: params.windowHeight,
        orientation: params.orientation
      };
      return await simulateLighting(roomDims, windowConfig);
    },
    ventilation: async (params) => {
      const roomDims = {
        length: params.length,
        width: params.width,
        height: params.height
      };
      const openingConfig = {
        windowArea: params.windowArea,
        windowHeight: 1.0,
        windSpeed: params.windSpeed
      };
      return await simulateVentilation(roomDims, openingConfig);
    },
    evacuation: async (params) => {
      // Simplified building layout for demo
      const buildingLayout = {
        nodes: [
          {id: 'room1', x: 5, y: 5, type: 'room'},
          {id: 'room2', x: 15, y: 5, type: 'room'},
          {id: 'room3', x: 25, y: 5, type: 'room'},
          {id: 'corridor1', x: 15, y: 10, type: 'corridor'},
          {id: 'stair1', x: 15, y: 20, type: 'stair'},
          {id: 'exit1', x: 15, y: 30, type: 'exit'},
          {id: 'exit2', x: 25, y: 30, type: 'exit'}
        ],
        edges: [
          {from: 'room1', to: 'corridor1', length: 8, width: 1.5},
          {from: 'room2', to: 'corridor1', length: 5, width: 1.5},
          {from: 'room3', to: 'corridor1', length: 10, width: 1.5},
          {from: 'corridor1', to: 'stair1', length: 10, width: 2.0},
          {from: 'stair1', to: 'exit1', length: 10, width: 1.5},
          {from: 'stair1', to: 'exit2', length: 10, width: 1.5}
        ],
        exits: ['exit1', 'exit2']
      };
      const population = {
        numPeople: params.numPeople,
        mobilityFactor: 1.0
      };
      return await simulateEvacuation(buildingLayout, population, {
        walkingSpeed: params.walkingSpeed,
        reactionTime: params.reactionTime
      });
    },
    ndt: async (params) => {
      const parameters = {
        material: 'concrete',
        age: params.age,
        exposure: params.exposure
      };
      return await simulateNDT(params.testType, parameters);
    }
  };
  
  const panelEl = createSimulationPanel(type, async (params) => {
    if (!pyodideInitialized) {
      throw new Error('Pyodide belum siap. Tunggu sebentar...');
    }
    
    // Load and merge field data if available
    if (proyekId) {
      const tipeMap = {
        'lighting': 'pencahayaan',
        'ventilation': 'ventilasi',
        'evacuation': 'evakuasi',
        'ndt': params.testType || 'ndt_rebound'
      };
      const tipePengujian = tipeMap[type];
      const fieldDataResult = await loadFieldDataForSimulation(proyekId, tipePengujian);
      
      if (fieldDataResult.hasFieldData) {
        console.log('[Simulation] Using imported field data from:', fieldDataResult.sourceFile);
        // Merge field data params dengan form params
        params = { ...params, ...fieldDataResult.parsedParams };
        
        // Show field data indicator in UI
        const fieldDataIndicator = document.getElementById('field-data-indicator');
        if (fieldDataIndicator) {
          fieldDataIndicator.style.display = 'block';
          fieldDataIndicator.innerHTML = `<i class="fas fa-check-circle"></i> Menggunakan data lapangan: ${fieldDataResult.sourceFile}`;
        }
      }
    }
    
    const result = await handlers[type](params);
    renderResult(type, result, proyekId);
    return result;
  });
  
  panel.innerHTML = '';
  panel.appendChild(panelEl);
  
  // Add field data indicator element
  const indicator = document.createElement('div');
  indicator.id = 'field-data-indicator';
  indicator.style.cssText = 'display:none;margin-top:12px;padding:8px 12px;background:var(--success-bg);border-radius:6px;font-size:12px;color:var(--success)';
  panel.appendChild(indicator);
}

function renderResult(type, result, proyekId) {
  const resultCard = document.getElementById('result-card');
  const content = document.getElementById('simulation-result-content');
  
  resultCard.style.display = 'block';
  
  let html = '';
  
  switch (type) {
    case 'lighting':
      html = renderLightingResult(result);
      break;
    case 'ventilation':
      html = renderVentilationResult(result);
      break;
    case 'evacuation':
      html = renderEvacuationResult(result);
      break;
    case 'ndt':
      html = renderNDTResult(result);
      break;
  }
  
  content.innerHTML = html;
  
  // Show save button if in project mode
  if (proyekId) {
    const saveSection = document.getElementById('save-simulation-section');
    if (saveSection) {
      saveSection.style.display = 'block';
      
      // Setup save button
      const saveBtn = document.getElementById('btn-save-simulasi');
      if (saveBtn) {
        saveBtn.onclick = async () => {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
          
          try {
            const tipeMap = {
              'lighting': 'pencahayaan',
              'ventilation': 'ventilasi',
              'evacuation': 'evakuasi',
              'ndt': result.test_type?.includes('Rebound') ? 'ndt_rebound' : 'ndt_upv'
            };
            
            // Save with visualization
            await saveSimulasi(proyekId, tipeMap[type], {}, result, { status: 'final' });
            
            // Store for export
            lastSimulationResult = result;
            lastSimulationType = tipeMap[type];
            
            showSuccess('Hasil simulasi berhasil disimpan ke proyek!');
            
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Tersimpan';
            
            // Show export button
            showExportButton(proyekId, tipeMap[type], result);
            
            setTimeout(() => {
              saveBtn.disabled = false;
              saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan ke Proyek';
            }, 2000);
          } catch (err) {
            showError('Gagal menyimpan: ' + err.message);
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan ke Proyek';
          }
        };
      }
    }
  }
}

function renderLightingResult(result) {
  const complianceClass = result.compliance.passes_df_avg ? 'success' : 'warning';
  
  return `
    <div style="margin-bottom:16px">
      <div style="display:flex;gap:16px;margin-bottom:16px">
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-subtle);border-radius:8px">
          <div style="font-size:2rem;font-weight:700;color:var(--${complianceClass})">${result.daylight_factor_avg}%</div>
          <div class="text-xs text-tertiary">Daylight Factor Rata-rata</div>
        </div>
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-subtle);border-radius:8px">
          <div style="font-size:2rem;font-weight:700">${result.illuminance_avg}</div>
          <div class="text-xs text-tertiary">Illuminance (lux)</div>
        </div>
      </div>
      
      <div style="margin-bottom:12px">
        <div class="text-sm font-bold" style="margin-bottom:8px">Compliance SNI:</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge" style="background:${result.compliance.passes_df_min ? 'var(--success-bg)' : 'var(--danger-bg)'};color:${result.compliance.passes_df_min ? 'var(--success)' : 'var(--danger)'}">
            DF Min: ${result.daylight_factor_min}% ${result.compliance.passes_df_min ? '✓' : '✗'}
          </span>
          <span class="badge" style="background:${result.compliance.passes_df_avg ? 'var(--success-bg)' : 'var(--danger-bg)'};color:${result.compliance.passes_df_avg ? 'var(--success)' : 'var(--danger)'}">
            DF Avg: ${result.daylight_factor_avg}% ${result.compliance.passes_df_avg ? '✓' : '✗'}
          </span>
        </div>
      </div>
      
      ${result.recommendations.length > 0 ? `
        <div style="background:var(--warning-bg);padding:12px;border-radius:8px;margin-top:12px">
          <div class="text-sm font-bold" style="margin-bottom:4px;color:var(--warning)"><i class="fas fa-exclamation-triangle"></i> Rekomendasi:</div>
          ${result.recommendations.map(r => `<div class="text-sm" style="color:var(--warning-300)">• ${r}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderVentilationResult(result) {
  const complianceClass = result.compliance.passes ? 'success' : 'warning';
  
  return `
    <div style="margin-bottom:16px">
      <div style="display:flex;gap:16px;margin-bottom:16px">
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-subtle);border-radius:8px">
          <div style="font-size:2rem;font-weight:700;color:var(--${complianceClass})">${result.air_changes_per_hour}</div>
          <div class="text-xs text-tertiary">Air Changes per Hour (ACH)</div>
        </div>
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-subtle);border-radius:8px">
          <div style="font-size:2rem;font-weight:700">${result.airflow_rate}</div>
          <div class="text-xs text-tertiary">Airflow (m³/s)</div>
        </div>
      </div>
      
      <div style="margin-bottom:12px">
        <div class="text-sm font-bold" style="margin-bottom:8px">Kategori: <span style="color:var(--${result.compliance.category === 'Good' ? 'success' : result.compliance.category === 'Adequate' ? 'warning' : 'danger'})">${result.compliance.category}</span></div>
        <div style="display:flex;gap:8px">
          <span class="badge" style="background:var(--info-bg);color:var(--info)">Wind: ${result.wind_driven_percentage}%</span>
          <span class="badge" style="background:var(--info-bg);color:var(--info)">Stack: ${result.stack_driven_percentage}%</span>
        </div>
      </div>
      
      ${result.recommendations.length > 0 ? `
        <div style="background:var(--warning-bg);padding:12px;border-radius:8px;margin-top:12px">
          <div class="text-sm font-bold" style="margin-bottom:4px;color:var(--warning)"><i class="fas fa-exclamation-triangle"></i> Rekomendasi:</div>
          ${result.recommendations.map(r => `<div class="text-sm" style="color:var(--warning-300)">• ${r}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderEvacuationResult(result) {
  const complianceClass = result.compliance.passes ? 'success' : 'danger';
  
  return `
    <div style="margin-bottom:16px">
      <div style="display:flex;gap:16px;margin-bottom:16px">
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-subtle);border-radius:8px">
          <div style="font-size:2rem;font-weight:700">${result.average_evacuation_time}s</div>
          <div class="text-xs text-tertiary">Rata-rata Waktu Evakuasi</div>
        </div>
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-subtle);border-radius:8px">
          <div style="font-size:2rem;font-weight:700;color:var(--${complianceClass})">${result.maximum_evacuation_time}s</div>
          <div class="text-xs text-tertiary">Maksimum (${result.compliance.passes ? 'Lulus' : 'Gagal'})</div>
        </div>
      </div>
      
      ${result.bottlenecks.length > 0 ? `
        <div style="margin-bottom:12px">
          <div class="text-sm font-bold" style="margin-bottom:8px;color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Bottlenecks Terdeteksi:</div>
          ${result.bottlenecks.map((b, i) => `
            <div style="background:var(--danger-bg);padding:8px 12px;border-radius:4px;margin-bottom:4px">
              <span class="text-sm" style="color:var(--danger)">#${i+1}: ${b.edge[0]} → ${b.edge[1]} (${b.severity})</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${result.recommendations.length > 0 ? `
        <div style="background:var(--warning-bg);padding:12px;border-radius:8px;margin-top:12px">
          <div class="text-sm font-bold" style="margin-bottom:4px;color:var(--warning)"><i class="fas fa-lightbulb"></i> Rekomendasi:</div>
          ${result.recommendations.map(r => `<div class="text-sm" style="color:var(--warning-300)">• ${r}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderNDTResult(result) {
  const complianceClass = result.compliance.passes ? 'success' : 'danger';
  
  return `
    <div style="margin-bottom:16px">
    <div style="text-align:center;padding:16px;background:var(--bg-subtle);border-radius:8px;margin-bottom:16px">
      <div style="font-size:2rem;font-weight:700;color:var(--${complianceClass})">${result.fc_mean || result.velocity_mean}</div>
      <div class="text-xs text-tertiary">${result.test_type === 'Rebound Hammer (Schmidt)' ? 'Kekuatan (MPa)' : 'Pulse Velocity (km/s)'}</div>
      <div class="text-sm" style="margin-top:4px;color:var(--${complianceClass})">${result.compliance.category || result.quality_rating}</div>
    </div>
      
      ${result.potential_cracks_detected > 0 ? `
        <div style="background:var(--danger-bg);padding:12px;border-radius:8px;margin-bottom:12px">
          <div class="text-sm font-bold" style="color:var(--danger)">
            <i class="fas fa-exclamation-triangle"></i> ${result.potential_cracks_detected} Potensi Retak Terdeteksi
          </div>
        </div>
      ` : ''}
      
      ${result.recommendations.length > 0 ? `
        <div style="background:var(--warning-bg);padding:12px;border-radius:8px">
          <div class="text-sm font-bold" style="margin-bottom:4px;color:var(--warning)"><i class="fas fa-lightbulb"></i> Rekomendasi:</div>
          ${result.recommendations.map(r => `<div class="text-sm" style="color:var(--warning-300)">• ${r}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function updateStatus(message, isError = false) {
  const statusEl = document.getElementById('pyodide-status');
  if (statusEl) {
    statusEl.innerHTML = isError 
      ? `<i class="fas fa-exclamation-circle" style="color:var(--danger)"></i> ${message}`
      : `<i class="fas fa-check-circle" style="color:var(--success)"></i> ${message}`;
  }
}

/**
 * Show export button after simulation is saved
 */
function showExportButton(proyekId, tipe, result) {
  const resultCard = document.getElementById('result-card');
  if (!resultCard) return;
  
  // Check if export section already exists
  let exportSection = document.getElementById('export-simulation-section');
  if (!exportSection) {
    exportSection = document.createElement('div');
    exportSection.id = 'export-simulation-section';
    exportSection.style.cssText = 'margin-top:16px;padding-top:16px;border-top:1px solid var(--border-subtle);';
    resultCard.appendChild(exportSection);
  }
  
  exportSection.innerHTML = `
    <div class="text-sm font-bold" style="margin-bottom:12px;color:var(--brand-400)">
      <i class="fas fa-file-export"></i> Export untuk Laporan
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-secondary" id="btn-preview-viz" style="flex:1">
        <i class="fas fa-image"></i> Preview Visualisasi
      </button>
      <button class="btn btn-primary" id="btn-export-report" style="flex:1">
        <i class="fas fa-file-invoice"></i> Export ke Laporan
      </button>
    </div>
    <div id="viz-preview-container" style="margin-top:12px;display:none"></div>
  `;
  
  // Preview visualization
  document.getElementById('btn-preview-viz').onclick = async () => {
    const container = document.getElementById('viz-preview-container');
    if (container.style.display === 'none') {
      showInfo('Generating visualisasi...');
      try {
        const visuals = await exportSimulationVisuals(tipe, result);
        container.innerHTML = `
          <div style="background:var(--bg-subtle);padding:12px;border-radius:8px">
            <div class="text-xs text-tertiary" style="margin-bottom:8px">${visuals.metadata.description}</div>
            <img src="${visuals.png}" style="max-width:100%;border-radius:4px" />
          </div>
        `;
        container.style.display = 'block';
      } catch (err) {
        showError('Gagal generate visualisasi: ' + err.message);
      }
    } else {
      container.style.display = 'none';
    }
  };
  
  // Export to report
  document.getElementById('btn-export-report').onclick = async () => {
    const btn = document.getElementById('btn-export-report');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengexport...';
    
    try {
      showInfo('Mengekspor hasil simulasi dan visualisasi ke laporan...');
      
      const exportResult = await exportSimulationToReport(proyekId, tipe, result, {
        saveToDrive: true,
        generateNarrative: true
      });
      
      if (exportResult.success) {
        showSuccess('Simulasi berhasil diekspor ke laporan dengan narasi AI dan visualisasi!');
        btn.innerHTML = '<i class="fas fa-check"></i> Terekspor';
      }
    } catch (err) {
      showError('Gagal export: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-file-invoice"></i> Export ke Laporan';
    }
  };
}

// Export for lazy loading in router
export function afterSimulationRender() {
  console.log('[Simulation] Page rendered');
}
