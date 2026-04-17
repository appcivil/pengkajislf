/**
 * Pyodide Web Worker
 * Mendelegasikan komputasi Python ke thread sekunder untuk mencegah UI freeze
 *
 * Arsitektur:
 * - Main Thread (UI) -> postMessage() -> Worker Thread
 * - Worker Thread -> Pyodide Execution -> postMessage() -> Main Thread
 *
 * @author Smart AI Pengkaji SLF
 * @version 2.0.0
 * @since 2024
 */

import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs';

// Global Pyodide instance
let pyodideInstance = null;
let pyodideReady = false;

// Expose loadPyodide ke self untuk kompatibilitas dengan kode existing
self.loadPyodide = loadPyodide;

// SNI Standards Database (Centralized Rule Engine)
const SNI_STANDARDS = {
  // SNI 03-2396-2001: Tata cara perancangan sistem pencahayaan alami pada bangunan gedung
  DAYLIGHT: {
    DF_MIN_REQUIRED: 0.5,  // 0.5% minimum daylight factor
    DF_AVG_REQUIRED: 1.0,  // 1.0% average
    ILLUMINANCE_MIN: 150,   // 150 lux minimum
    ILLUMINANCE_WORK: 350,  // 350 lux untuk pekerjaan umum
    ILLUMINANCE_DETAILED: 750 // 750 lux untuk pekerjaan detail
  },
  
  // SNI 03-6572-2001: Tata cara perencanaan proteksi kebakaran
  VENTILATION: {
    ACH_MINIMUM: 5.0,      // 5 Air Changes per Hour minimum
    ACH_RECOMMENDED: 6.0,  // 6 ACH recommended
    AIR_SPEED_COMFORT: { MIN: 0.15, MAX: 0.25 }, // m/s
    TEMPERATURE_COMFORT: { MIN: 24, MAX: 27 }, // Celsius
    HUMIDITY_COMFORT: { MIN: 40, MAX: 60 } // %
  },
  
  // SNI 03-1736-2012: Spesifikasi perencanaan ketahanan gempa
  EVACUATION: {
    MAX_TIME_SECONDS: 300,  // 5 menit maksimum
    WALKING_SPEED: 1.2,     // m/s normal
    WALKING_SPEED_ELDERLY: 0.8, // m/s untuk lansia
    CORRIDOR_WIDTH_MIN: 1.5, // meter
    EXIT_WIDTH_MIN: 1.2      // meter
  },
  
  // SNI 2847:2019 - Persyaratan beton struktural
  CONCRETE: {
    K_250: 20.75,  // MPa
    K_300: 24.9,
    K_350: 29.05,
    K_400: 33.2,
    K_450: 37.35,
    K_500: 41.5,
    MIN_STRENGTH: 20.75
  },
  
  // SNI 2848:2020 - Proteksi petir
  LIGHTNING: {
    RESISTANCE_MAX: 10, // ohm
    CLASS_I: { RADIUS: 20, MESH_SIZE: 5 },
    CLASS_II: { RADIUS: 30, MESH_SIZE: 10 },
    CLASS_III: { RADIUS: 45, MESH_SIZE: 10 },
    CLASS_IV: { RADIUS: 60, MESH_SIZE: 20 }
  },
  
  // SNI 8153:2015 - Aksesibilitas
  ACCESSIBILITY: {
    RAMP_MAX_GRADIENT: 8.33, // %
    RAMP_MIN_WIDTH: 1200,    // mm
    HANDRAIL_HEIGHT_MIN: 800, // mm
    HANDRAIL_HEIGHT_MAX: 900,
    DOOR_MIN_WIDTH: 900,      // mm
    CORRIDOR_MIN_WIDTH: 1800  // mm
  },
  
  // SNI 6389:2011 - OTTV
  THERMAL: {
    OTTV_MAX: 35, // Watt/m²
    WWR_OPTIMAL: 0.4, // Window-to-Wall Ratio
    SC_MAX: 0.25 // Shading Coefficient
  },
  
  // SNI 03-2453-2002 - Drainase
  STORMWATER: {
    RUNOFF_COEFFICIENT: {
      ROOF: 0.95,
      CONCRETE: 0.85,
      ASPHALT: 0.90,
      PAVERS: 0.60,
      GRASS: 0.35
    },
    RAINFALL_INTENSITY_JAKARTA: 100, // mm/jam untuk periode ulang 2 tahun
    DETENTION_MIN: 0.3 // 30% dari peak flow
  },
  
  // SNI 1726:2019 - Kegempaan
  SEISMIC: {
    SS_ZONES: { 1: 0.60, 2: 0.75, 3: 0.85, 4: 1.00, 5: 1.20, 6: 1.60 },
    S1_ZONES: { 1: 0.30, 2: 0.35, 3: 0.40, 4: 0.50, 5: 0.60 },
    RESPONSE_FACTOR: { DUCTILE: 8.0, PARTIAL: 5.0, LOW: 2.5 }
  }
};

/**
 * Inisialisasi Pyodide di Worker
 */
async function initPyodide() {
  if (pyodideInstance) return pyodideInstance;
  
  if (!self.loadPyodide) {
    throw new Error('Pyodide tidak tersedia. Pastikan CDN script dimuat.');
  }
  
  self.postMessage({ type: 'status', message: 'Initializing Pyodide...' });

  pyodideInstance = await self.loadPyodide({
    packages: ['micropip']
  });
  
  await pyodideInstance.runPythonAsync(`
import micropip
await micropip.install('numpy')
await micropip.install('scipy')
await micropip.install('networkx')
print("[Pyodide Worker] All packages loaded")
  `);
  
  pyodideReady = true;
  self.postMessage({ type: 'ready', message: 'Pyodide ready' });
  
  return pyodideInstance;
}

/**
 * Load Python module dari file eksternal
 */
async function loadPythonModule(moduleName) {
  const response = await fetch(`/simulations/modules/${moduleName}.py`);
  if (!response.ok) {
    throw new Error(`Failed to load module: ${moduleName}`);
  }
  return await response.text();
}

/**
 * Jalankan simulasi dengan Python code
 */
async function runSimulation(type, params) {
  const pyodide = await initPyodide();
  
  // Load SNI standards sebagai Python dict
  const sniStandardsCode = `
SNI_STANDARDS = ${JSON.stringify(SNI_STANDARDS, null, 2)}
`;
  
  // Load module Python yang sesuai
  let moduleCode = '';
  let runnerCode = '';
  
  switch (type) {
    case 'lighting':
      moduleCode = await loadPythonModule('lighting_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = calculate_daylight_factor(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'ventilation':
      moduleCode = await loadPythonModule('ventilation_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = calculate_ventilation(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'evacuation':
      moduleCode = await loadPythonModule('evacuation_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = simulate_evacuation(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'ndt_rebound':
      moduleCode = await loadPythonModule('ndt_rebound');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = simulate_rebound_hammer(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'ndt_upv':
      moduleCode = await loadPythonModule('ndt_upv');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = simulate_upv(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'stormwater':
      moduleCode = await loadPythonModule('stormwater_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = calculate_stormwater(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'waste':
      moduleCode = await loadPythonModule('waste_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = calculate_waste_management(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'ottv':
      moduleCode = await loadPythonModule('ottv_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = calculate_ottv(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'seismic':
      moduleCode = await loadPythonModule('seismic_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = calculate_seismic_response(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'sanitation':
      moduleCode = await loadPythonModule('sanitation_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = calculate_sanitation(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    case 'acoustics':
      moduleCode = await loadPythonModule('acoustics_core');
      runnerCode = `
${sniStandardsCode}
${moduleCode}
result = calculate_acoustics(${JSON.stringify(params)})
import json
json.dumps(result)
      `;
      break;
      
    default:
      throw new Error(`Unknown simulation type: ${type}`);
  }
  
  const startTime = performance.now();
  const result = await pyodide.runPythonAsync(runnerCode);
  const endTime = performance.now();
  
  return {
    result: JSON.parse(result),
    executionTime: Math.round(endTime - startTime)
  };
}

/**
 * Handler pesan dari Main Thread
 */
self.onmessage = async function(e) {
  const { type, id, payload } = e.data;
  
  try {
    switch (type) {
      case 'init':
        await initPyodide();
        self.postMessage({ type: 'initialized', id });
        break;
        
      case 'simulate':
        self.postMessage({ 
          type: 'progress', 
          id, 
          message: `Running ${payload.simulationType} simulation...` 
        });
        
        const simResult = await runSimulation(
          payload.simulationType, 
          payload.params
        );
        
        self.postMessage({
          type: 'complete',
          id,
          result: simResult.result,
          executionTime: simResult.executionTime
        });
        break;
        
      case 'getStandards':
        self.postMessage({
          type: 'standards',
          id,
          standards: SNI_STANDARDS
        });
        break;
        
      default:
        self.postMessage({
          type: 'error',
          id,
          error: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      error: error.message,
      stack: error.stack
    });
  }
};

// Auto-init saat worker dimuat
initPyodide().catch(err => {
  console.error('[Pyodide Worker] Auto-init failed:', err);
});
