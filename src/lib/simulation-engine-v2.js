/**
 * Pyodide Simulation Engine v2.0
 * Arsitektur Web Worker untuk komputasi non-blocking
 * 
 * Perubahan dari v1:
 * - Menggunakan Web Worker untuk Pyodide (tidak blocking UI)
 * - Modularisasi kode Python ke file .py terpisah
 * - SNI Standards centralized di Worker
 * - Support 10 jenis simulasi SLF
 * 
 * @author Smart AI Pengkaji SLF
 * @version 2.0.0
 * @since 2024
 */

import { supabase } from './supabase.js';

// ============================================================
// WEB WORKER MANAGEMENT
// ============================================================

class PyodideWorkerManager {
  constructor() {
    this.worker = null;
    this.pendingJobs = new Map();
    this.jobIdCounter = 0;
    this.isReady = false;
    this.messageHandler = this.handleWorkerMessage.bind(this);
  }

  /**
   * Inisialisasi Web Worker
   */
  async init() {
    if (this.worker) return;

    return new Promise((resolve, reject) => {
      try {
        // Buat worker dari file
        this.worker = new Worker('/src/lib/workers/pyodide.worker.js', { type: 'module' });
        this.worker.onmessage = this.messageHandler;
        this.worker.onerror = (err) => {
          console.error('[PyodideWorker] Error:', err);
          reject(err);
        };

        // Tunggu worker ready
        const checkReady = (e) => {
          if (e.data.type === 'ready' || e.data.type === 'initialized') {
            this.isReady = true;
            this.worker.onmessage = this.messageHandler;
            resolve();
          }
        };
        
        this.worker.onmessage = (e) => {
          checkReady(e);
          this.messageHandler(e);
        };

        // Send init command
        this.worker.postMessage({ type: 'init', id: 'init' });

        // Timeout
        setTimeout(() => {
          if (!this.isReady) {
            reject(new Error('Worker initialization timeout'));
          }
        }, 30000);

      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Handler pesan dari Worker
   */
  handleWorkerMessage(e) {
    const { type, id, result, error, executionTime, message, standards } = e.data;

    if (type === 'ready') {
      this.isReady = true;
      console.log('[PyodideWorker] Ready:', message);
      return;
    }

    if (type === 'status' || type === 'progress') {
      console.log('[PyodideWorker]', message);
      return;
    }

    const job = this.pendingJobs.get(id);
    if (!job) return;

    if (type === 'complete') {
      this.pendingJobs.delete(id);
      job.resolve({
        result,
        executionTime,
        success: true
      });
    } else if (type === 'error') {
      this.pendingJobs.delete(id);
      job.reject(new Error(error));
    } else if (type === 'standards') {
      this.pendingJobs.delete(id);
      job.resolve({ standards, success: true });
    }
  }

  /**
   * Jalankan simulasi via Worker
   */
  async runSimulation(simulationType, params, timeout = 60000) {
    await this.init();

    const jobId = `sim_${++this.jobIdCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      // Timeout handler
      const timeoutId = setTimeout(() => {
        this.pendingJobs.delete(jobId);
        reject(new Error(`Simulation timeout after ${timeout}ms`));
      }, timeout);

      // Store job
      this.pendingJobs.set(jobId, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      });

      // Send to worker
      this.worker.postMessage({
        type: 'simulate',
        id: jobId,
        payload: {
          simulationType,
          params
        }
      });
    });
  }

  /**
   * Get SNI Standards dari Worker
   */
  async getStandards() {
    await this.init();

    const jobId = `std_${++this.jobIdCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingJobs.delete(jobId);
        reject(new Error('Standards fetch timeout'));
      }, 10000);

      this.pendingJobs.set(jobId, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data.standards);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      });

      this.worker.postMessage({
        type: 'getStandards',
        id: jobId,
        payload: {}
      });
    });
  }

  /**
   * Terminate worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.pendingJobs.clear();
    }
  }
}

// Singleton instance
const workerManager = new PyodideWorkerManager();

// ============================================================
// SIMULATION API
// ============================================================

/**
 * Inisialisasi Simulation Engine
 */
export async function initPyodide() {
  return await workerManager.init();
}

/**
 * Fitur #15: Simulasi Pencahayaan (Daylight Factor)
 * SNI 03-2396-2001
 */
export async function simulateLighting(roomDimensions, windowConfig, options = {}) {
  const params = {
    ...roomDimensions,
    ...windowConfig,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('lighting', params);
  
  console.log(`[Lighting Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Fitur #15: Simulasi Ventilasi (Air Changes per Hour)
 * SNI 03-6572-2001
 */
export async function simulateVentilation(roomDimensions, openingConfig, options = {}) {
  const params = {
    ...roomDimensions,
    ...openingConfig,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('ventilation', params);
  
  console.log(`[Ventilation Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Fitur #16: Simulasi Evakuasi (NetworkX Pathfinding)
 * SNI 03-1736-2012
 */
export async function simulateEvacuation(buildingLayout, population, options = {}) {
  const params = {
    ...buildingLayout,
    ...population,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('evacuation', params);
  
  console.log(`[Evacuation Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Fitur #17: NDT Rebound Hammer Test
 * SNI 2847:2019
 */
export async function simulateNDTRebound(parameters, options = {}) {
  const params = {
    ...parameters,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('ndt_rebound', params);
  
  console.log(`[NDT Rebound Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Fitur #17: NDT UPV Test
 * ASTM C597
 */
export async function simulateNDTUPV(parameters, options = {}) {
  const params = {
    ...parameters,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('ndt_upv', params);
  
  console.log(`[NDT UPV Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Simulasi #18: Stormwater Management (Zero Runoff)
 * SNI 03-2453-2002
 */
export async function simulateStormwater(surfaceAreas, rainfallParams, options = {}) {
  const params = {
    ...surfaceAreas,
    ...rainfallParams,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('stormwater', params);
  
  console.log(`[Stormwater Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Simulasi #19: Solid Waste Management
 * SNI 19-2454-2002
 */
export async function simulateWasteManagement(buildingInfo, operationalParams, options = {}) {
  const params = {
    ...buildingInfo,
    ...operationalParams,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('waste', params);
  
  console.log(`[Waste Management Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Simulasi #20: OTTV Calculator
 * SNI 6389:2011
 */
export async function simulateOTTV(envelopeParams, materialProps, options = {}) {
  const params = {
    ...envelopeParams,
    ...materialProps,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('ottv', params);
  
  console.log(`[OTTV Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Simulasi #21: Seismic Response
 * SNI 1726:2019
 */
export async function simulateSeismic(structuralParams, seismicParams, options = {}) {
  const params = {
    ...structuralParams,
    ...seismicParams,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('seismic', params);
  
  console.log(`[Seismic Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Simulasi #22: Sanitation & Water Supply
 * SNI 8153:2015, SNI 03-7065-2005
 */
export async function simulateSanitation(buildingInfo, waterParams, options = {}) {
  const params = {
    ...buildingInfo,
    ...waterParams,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('sanitation', params);
  
  console.log(`[Sanitation Sim] Completed in ${executionTime}ms`);
  return result;
}

/**
 * Simulasi #23: Acoustics & Sound Transmission
 * SNI 6729:2013
 */
export async function simulateAcoustics(noiseParams, constructionParams, options = {}) {
  const params = {
    ...noiseParams,
    ...constructionParams,
    ...options
  };

  const { result, executionTime } = await workerManager.runSimulation('acoustics', params);
  
  console.log(`[Acoustics Sim] Completed in ${executionTime}ms`);
  return result;
}

// ============================================================
// DATABASE INTEGRATION
// ============================================================

/**
 * Save hasil simulasi ke database
 */
export async function saveSimulasi(proyekId, tipe, inputParams, hasil, options = {}) {
  const { status = 'draft', rekomendasi = [] } = options;
  
  // Calculate skor kelayakan
  let skorKelayakan = 50;
  
  if (hasil.compliance) {
    const c = hasil.compliance;
    if (c.overall_passes !== undefined) {
      skorKelayakan = c.overall_passes ? 80 : 40;
    } else if (c.passes !== undefined) {
      skorKelayakan = c.passes ? 80 : 40;
    } else if (c.ottv_compliance !== undefined) {
      skorKelayakan = c.ottv_compliance ? 85 : 45;
    } else if (c.exterior_compliance !== undefined && c.interior_compliance !== undefined) {
      skorKelayakan = (c.exterior_compliance && c.interior_compliance) ? 80 : 40;
    }
  }
  
  if (hasil.quality_rating) {
    const quality_scores = {
      'Excellent': 95,
      'Good': 80,
      'Fair': 60,
      'Doubtful': 50,
      'Poor': 30
    };
    skorKelayakan = quality_scores.get(hasil.quality_rating, 50);
  }
  
  if (hasil.energy_efficiency && hasil.energy_efficiency.grade) {
    const grade_scores = { 'A': 95, 'B': 80, 'C': 60, 'D': 40 };
    skorKelayakan = grade_scores.get(hasil.energy_efficiency.grade, 50);
  }
  
  const { data, error } = await supabase
    .from('hasil_simulasi')
    .insert([{
      proyek_id: proyekId,
      tipe_simulasi: tipe,
      input_params: inputParams,
      hasil: hasil,
      skor_kelayakan: skorKelayakan,
      status: status,
      compliance: hasil.compliance || {},
      rekomendasi: rekomendasi.length > 0 ? rekomendasi : (hasil.recommendations || [])
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Load semua hasil simulasi untuk proyek
 */
export async function loadSimulasi(proyekId, tipe = null) {
  let query = supabase
    .from('hasil_simulasi')
    .select('*')
    .eq('proyek_id', proyekId)
    .order('created_at', { ascending: false });
  
  if (tipe) {
    query = query.eq('tipe_simulasi', tipe);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get summary simulasi per proyek
 */
export async function getSimulasiSummary(proyekId) {
  const { data, error } = await supabase
    .from('simulasi_summary')
    .select('*')
    .eq('proyek_id', proyekId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data || {
    proyek_id: proyekId,
    total_simulasi: 0,
    sim_pencahayaan: 0,
    sim_ventilasi: 0,
    sim_evakuasi: 0,
    sim_ndt: 0,
    avg_skor_kelayakan: null,
    last_simulasi_at: null
  };
}

/**
 * Delete simulasi
 */
export async function deleteSimulasi(simulasiId) {
  const { error } = await supabase
    .from('hasil_simulasi')
    .delete()
    .eq('id', simulasiId);
  
  if (error) throw error;
  return true;
}

/**
 * Update status simulasi
 */
export async function updateSimulasiStatus(simulasiId, status) {
  const { data, error } = await supabase
    .from('hasil_simulasi')
    .update({ status })
    .eq('id', simulasiId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================
// UI COMPONENTS
// ============================================================

/**
 * Create simulation panel dengan loading state yang proper
 */
export function createSimulationPanel(type, onRun) {
  const container = document.createElement('div');
  container.className = 'simulation-panel';
  
  const configs = {
    lighting: {
      title: 'Simulasi Pencahayaan',
      icon: 'fa-sun',
      fields: [
        { id: 'length', label: 'Panjang Ruang (m)', type: 'number', value: 10 },
        { id: 'width', label: 'Lebar Ruang (m)', type: 'number', value: 8 },
        { id: 'height', label: 'Tinggi Ruang (m)', type: 'number', value: 3 },
        { id: 'windowArea', label: 'Luas Jendela (m²)', type: 'number', value: 6 },
        { id: 'windowHeight', label: 'Tinggi Jendela (m)', type: 'number', value: 1.5 },
        { id: 'orientation', label: 'Orientasi', type: 'select', options: ['N', 'S', 'E', 'W', 'NE', 'SE', 'SW', 'NW'] },
      ]
    },
    ventilation: {
      title: 'Simulasi Ventilasi',
      icon: 'fa-wind',
      fields: [
        { id: 'length', label: 'Panjang (m)', type: 'number', value: 10 },
        { id: 'width', label: 'Lebar (m)', type: 'number', value: 8 },
        { id: 'height', label: 'Tinggi (m)', type: 'number', value: 3 },
        { id: 'windowArea', label: 'Luas Bukaan (m²)', type: 'number', value: 4 },
        { id: 'windSpeed', label: 'Kecepatan Angin (m/s)', type: 'number', value: 2 },
      ]
    },
    evacuation: {
      title: 'Simulasi Evakuasi',
      icon: 'fa-running',
      fields: [
        { id: 'numPeople', label: 'Jumlah Orang', type: 'number', value: 100 },
        { id: 'walkingSpeed', label: 'Kecepatan Jalan (m/s)', type: 'number', value: 1.2 },
        { id: 'reactionTime', label: 'Waktu Reaksi (s)', type: 'number', value: 60 },
      ]
    },
    ndt_rebound: {
      title: 'NDT - Rebound Hammer',
      icon: 'fa-hammer',
      fields: [
        { id: 'material', label: 'Material', type: 'select', options: ['concrete', 'mortar'] },
        { id: 'age', label: 'Umur (tahun)', type: 'number', value: 10 },
        { id: 'exposure', label: 'Eksposur', type: 'select', options: ['mild', 'moderate', 'severe'] },
      ]
    },
    ndt_upv: {
      title: 'NDT - UPV Test',
      icon: 'fa-wave-square',
      fields: [
        { id: 'age', label: 'Umur (tahun)', type: 'number', value: 10 },
        { id: 'exposure', label: 'Eksposur', type: 'select', options: ['mild', 'moderate', 'severe'] },
      ]
    },
    stormwater: {
      title: 'Stormwater Management',
      icon: 'fa-cloud-rain',
      fields: [
        { id: 'roofArea', label: 'Luas Atap (m²)', type: 'number', value: 200 },
        { id: 'parkingArea', label: 'Luas Parkir (m²)', type: 'number', value: 100 },
        { id: 'rainfallIntensity', label: 'Intensitas Hujan (mm/jam)', type: 'number', value: 100 },
      ]
    },
    waste: {
      title: 'Waste Management',
      icon: 'fa-trash-alt',
      fields: [
        { id: 'buildingType', label: 'Tipe Bangunan', type: 'select', options: ['apartment', 'office', 'hotel', 'hospital', 'market'] },
        { id: 'netFloorArea', label: 'Luas Lantai Netto (m²)', type: 'number', value: 1000 },
        { id: 'maxOccupants', label: 'Jumlah Penghuni', type: 'number', value: 100 },
      ]
    },
    ottv: {
      title: 'OTTV Calculator',
      icon: 'fa-thermometer-half',
      fields: [
        { id: 'grossWallArea', label: 'Luas Dinding (m²)', type: 'number', value: 500 },
        { id: 'windowArea', label: 'Luas Jendela (m²)', type: 'number', value: 150 },
        { id: 'uValueWall', label: 'U-Value Dinding (W/m²K)', type: 'number', value: 2.0, step: 0.1 },
        { id: 'solarFactorWindow', label: 'Solar Factor Jendela', type: 'number', value: 0.6, step: 0.1 },
      ]
    },
    seismic: {
      title: 'Seismic Response',
      icon: 'fa-house-damage',
      fields: [
        { id: 'seismicZone', label: 'Zona Gempa (1-6)', type: 'number', value: 3, min: 1, max: 6 },
        { id: 'soilType', label: 'Tipe Tanah', type: 'select', options: ['SA', 'SB', 'SC', 'SD', 'SE'] },
        { id: 'buildingHeight', label: 'Tinggi Bangunan (m)', type: 'number', value: 30 },
        { id: 'numFloors', label: 'Jumlah Lantai', type: 'number', value: 10 },
      ]
    },
    sanitation: {
      title: 'Sanitation Calculator',
      icon: 'fa-tint',
      fields: [
        { id: 'buildingType', label: 'Tipe Bangunan', type: 'select', options: ['apartment', 'office', 'hotel', 'hospital'] },
        { id: 'maxOccupants', label: 'Jumlah Penghuni', type: 'number', value: 100 },
        { id: 'floors', label: 'Jumlah Lantai', type: 'number', value: 5 },
      ]
    },
    acoustics: {
      title: 'Acoustics Analysis',
      icon: 'fa-volume-up',
      fields: [
        { id: 'sourceType', label: 'Sumber Kebisingan', type: 'select', options: ['traffic', 'industry', 'aircraft', 'railway'] },
        { id: 'distanceToSource', label: 'Jarak ke Sumber (m)', type: 'number', value: 50 },
        { id: 'wallMaterial', label: 'Material Dinding', type: 'select', options: ['single_glass', 'double_glass', 'brick_110', 'brick_220', 'concrete_150'] },
      ]
    }
  };
  
  const config = configs[type];
  if (!config) return null;
  
  container.innerHTML = `
    <div class="card" style="padding:20px">
      <h3 style="margin-bottom:16px"><i class="fas ${config.icon}"></i> ${config.title}</h3>
      <div class="simulation-form" style="display:grid;gap:12px">
        ${config.fields.map(f => `
          <div>
            <label style="display:block;font-size:12px;color:var(--text-tertiary);margin-bottom:4px">${f.label}</label>
            ${f.type === 'select' ? `
              <select id="sim-${f.id}" class="input" style="width:100%">
                ${f.options.map(o => `<option value="${o}" ${f.value === o ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            ` : `
              <input type="${f.type}" id="sim-${f.id}" class="input" value="${f.value}" 
                ${f.min ? `min="${f.min}"` : ''} 
                ${f.max ? `max="${f.max}"` : ''} 
                ${f.step ? `step="${f.step}"` : ''}
                style="width:100%">
            `}
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary" id="sim-run" style="width:100%;margin-top:16px">
        <i class="fas fa-play"></i> Jalankan Simulasi
      </button>
      <div id="sim-loading" style="display:none;margin-top:16px;text-align:center">
        <i class="fas fa-spinner fa-spin"></i> Menjalankan simulasi di background...
      </div>
      <div class="simulation-result" id="sim-result" style="margin-top:16px"></div>
    </div>
  `;
  
  const runBtn = container.querySelector('#sim-run');
  const loadingDiv = container.querySelector('#sim-loading');
  const resultDiv = container.querySelector('#sim-result');
  
  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';
    
    try {
      const params = {};
      config.fields.forEach(f => {
        const el = container.querySelector(`#sim-${f.id}`);
        params[f.id] = f.type === 'number' ? parseFloat(el.value) : el.value;
      });
      
      const result = await onRun(params);
      resultDiv.innerHTML = renderSimulationResult(result);
    } catch (err) {
      resultDiv.innerHTML = `<div style="color:var(--danger);padding:12px;background:var(--bg-subtle);border-radius:8px">
        <i class="fas fa-exclamation-triangle"></i> Error: ${err.message}
      </div>`;
      console.error('[Simulation Error]', err);
    } finally {
      runBtn.disabled = false;
      loadingDiv.style.display = 'none';
    }
  });
  
  return container;
}

function renderSimulationResult(result) {
  const complianceClass = result.compliance?.passes || result.compliance?.overall_passes ? 'success' : 'danger';
  const complianceText = result.compliance?.passes || result.compliance?.overall_passes ? 'MEMENUHI STANDAR' : 'TIDAK MEMENUHI';
  
  return `
    <div style="background:var(--bg-subtle);padding:16px;border-radius:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="padding:4px 12px;border-radius:4px;font-size:12px;font-weight:600;background:var(--${complianceClass});color:white">
          ${complianceText}
        </span>
        <span style="font-size:12px;color:var(--text-tertiary)">${result.sni_reference || ''}</span>
      </div>
      
      ${result.recommendations ? `
        <div style="margin-bottom:12px">
          <h4 style="font-size:14px;margin-bottom:8px"><i class="fas fa-lightbulb"></i> Rekomendasi</h4>
          <ul style="font-size:12px;margin:0;padding-left:16px">
            ${result.recommendations.map(r => `<li style="margin-bottom:4px">${r}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <details style="font-size:12px">
        <summary style="cursor:pointer;color:var(--primary);font-weight:500">Lihat Detail Teknis</summary>
        <pre style="margin-top:8px;overflow-x:auto;background:var(--bg);padding:12px;border-radius:4px">${JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  `;
}

// ============================================================
// LEGACY COMPATIBILITY
// ============================================================

/**
 * Load imported field data untuk digunakan dalam simulasi
 * @param {string} proyekId - ID proyek
 * @param {string} tipePengujian - Tipe pengujian yang dicari
 */
export async function loadFieldDataForSimulation(proyekId, tipePengujian) {
  try {
    const { data, error } = await supabase
      .from('field_test_data')
      .select('*')
      .eq('proyek_id', proyekId)
      .eq('tipe_pengujian', tipePengujian)
      .order('imported_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return {
        hasFieldData: true,
        fieldData: data[0],
        parsedParams: data[0].parsed_params,
        sourceFile: data[0].source_filename,
        importedAt: data[0].imported_at
      };
    }

    return { hasFieldData: false };

  } catch (err) {
    console.warn('[SimEngine] Failed to load field data:', err);
    return { hasFieldData: false, error: err.message };
  }
}

/**
 * Merge field data dengan parameter simulasi default
 * @param {Object} defaultParams - Parameter default
 * @param {Object} fieldParams - Parameter dari field data
 */
export function mergeWithFieldData(defaultParams, fieldParams) {
  if (!fieldParams) return defaultParams;

  const merged = { ...defaultParams };

  if (fieldParams.fieldValues) merged.fieldValues = fieldParams.fieldValues;
  if (fieldParams.fieldVelocities) merged.fieldVelocities = fieldParams.fieldVelocities;
  if (fieldParams.fieldMeasurements) merged.fieldMeasurements = fieldParams.fieldMeasurements;
  if (fieldParams.temperatureReadings) merged.temperatureReadings = fieldParams.temperatureReadings;
  if (fieldParams.fieldACH) merged.fieldACH = fieldParams.fieldACH;
  if (fieldParams.fieldLocation) merged.fieldLocation = fieldParams.fieldLocation;
  if (fieldParams.testDate) merged.testDate = fieldParams.testDate;

  if (fieldParams.length) merged.length = fieldParams.length;
  if (fieldParams.width) merged.width = fieldParams.width;
  if (fieldParams.height) merged.height = fieldParams.height;
  if (fieldParams.windowArea) merged.windowArea = fieldParams.windowArea;
  if (fieldParams.windSpeed) merged.windSpeed = fieldParams.windSpeed;
  if (fieldParams.numPeople) merged.numPeople = fieldParams.numPeople;
  if (fieldParams.walkingSpeed) merged.walkingSpeed = fieldParams.walkingSpeed;
  if (fieldParams.reactionTime) merged.reactionTime = fieldParams.reactionTime;
  if (fieldParams.age) merged.age = fieldParams.age;

  merged.hasFieldData = true;
  merged.fieldDataSource = fieldParams.sourceFile || 'Imported Field Data';

  return merged;
}

/**
 * Legacy API compatibility layer
 * Menjaga backward compatibility dengan kode existing
 */
export async function simulateNDT(testType, parameters, options = {}) {
  if (testType === 'rebound_hammer') {
    return simulateNDTRebound(parameters, options);
  } else if (testType === 'upv') {
    return simulateNDTUPV(parameters, options);
  } else {
    throw new Error(`Unknown NDT test type: ${testType}`);
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Core
  initPyodide,

  // Simulations
  simulateLighting,
  simulateVentilation,
  simulateEvacuation,
  simulateNDT,
  simulateNDTRebound,
  simulateNDTUPV,
  simulateStormwater,
  simulateWasteManagement,
  simulateOTTV,
  simulateSeismic,
  simulateSanitation,
  simulateAcoustics,

  // Database
  saveSimulasi,
  loadSimulasi,
  getSimulasiSummary,
  deleteSimulasi,
  updateSimulasiStatus,

  // Field Data
  loadFieldDataForSimulation,
  mergeWithFieldData,

  // UI
  createSimulationPanel,

  // Worker management
  getWorkerManager: () => workerManager,
  getStandards: () => workerManager.getStandards()
};
