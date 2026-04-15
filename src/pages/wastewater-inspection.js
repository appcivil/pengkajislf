// ============================================================
// WASTEWATER & SEWAGE DISPOSAL SYSTEM INSPECTION - MAIN PAGE
// Pemeriksaan Sistem Pembuangan Air Kotor & Air Limbah SLF
// Integrates: Screening Beban, Sanitary Fixtures, Drainage Network,
// Treatment Systems, Compliance & Reporting
// 
// Standar Referensi:
// - Pasal 224 ayat (5) Permen PUPR No. 14/PRT/M/2017
// - SNI 7183:2008 (Sistem Pengolahan Air Limbah Skala Kecil)
// - SNI 03-2453 (Tata Cara Perencanaan Plumbing)
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { uploadToGoogleDrive } from '../lib/drive.js';

// ============================================================
// CALCULATION ENGINE - SNI 7183:2008 & SNI 03-2453
// ============================================================

/**
 * Perhitungan volume tangki septik berdasarkan SNI 7183:2008
 * V = V1 + V2 + V3
 * V1 = Volume sedimentasi (retention 1 hari)
 * V2 = Volume lumpur (30 L/org/hari × org × tahun)
 * V3 = Volume scum (20% dari V1)
 */
const calculateSepticTank = (population, waterConsumption, desludgingPeriodYears = 2) => {
  // V1 - Volume sedimentasi (retention 1 hari, 80% dari air bersih menjadi air kotor)
  const dailyWastewater = population * waterConsumption * 0.8; // 80% menjadi air kotor
  const V1 = dailyWastewater * 1.0; // 1 hari detensi
  
  // V2 - Volume lumpur (30 L/org/tahun × org × tahun)
  const sludgeAccumulation = 30; // Liter per orang per tahun (SNI 7183)
  const V2 = population * sludgeAccumulation * desludgingPeriodYears;
  
  // V3 - Volume scum (20% dari V1)
  const V3 = 0.20 * V1;
  
  const totalVolume = V1 + V2 + V3;
  
  // Dimensi rekomendasi: L = 2-3 × W, Depth 1.5-2.1m
  const depth = 1.8; // meter (1.5 - 2.1)
  const width = Math.pow(totalVolume / (2 * depth), 1/2); // L = 2W assumption
  const length = 2 * width;
  
  // Calculate next desludging date
  const nextDesludgingDate = new Date();
  nextDesludgingDate.setFullYear(nextDesludgingDate.getFullYear() + desludgingPeriodYears);
  
  return {
    components: { 
      V1: parseFloat(V1.toFixed(2)), 
      V2: parseFloat(V2.toFixed(2)), 
      V3: parseFloat(V3.toFixed(2)) 
    },
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    dailyWastewater: parseFloat(dailyWastewater.toFixed(2)),
    dimensions: { 
      length: parseFloat(length.toFixed(2)), 
      width: parseFloat(width.toFixed(2)), 
      depth 
    },
    desludgingPeriodYears,
    nextDesludgingDate: nextDesludgingDate.toISOString().split('T')[0]
  };
};

/**
 * Perhitungan aliran gravitasi dengan Persamaan Manning
 * V = (1/n) × R^(2/3) × S^(1/2)
 * n: Koefisien kekasaran (PVC 0.009, Concrete 0.013)
 * R: Hydraulic radius
 * S: Slope (minimum 0.5% untuk 4", 0.33% untuk 6")
 */
const calculateManningFlow = (diameterMM, slopePercent, roughnessN = 0.009, fillRatio = 0.5) => {
  const D = diameterMM / 1000; // convert to meter
  const S = slopePercent / 100;
  const n = roughnessN;
  
  // Hydraulic radius for partial full pipe (fillRatio = d/D)
  // R = (theta - sin(theta)*cos(theta)) * D / 4*theta, where theta = arccos(1-2*fillRatio)
  const theta = Math.acos(1 - 2 * fillRatio);
  const R = (theta - Math.sin(theta) * Math.cos(theta)) * D / (4 * theta);
  const A = Math.pow(D, 2) * (theta - Math.sin(theta) * Math.cos(theta)) / 4;
  
  // Manning: V = (1/n) * R^(2/3) * S^(1/2)
  const velocity = (1/n) * Math.pow(R, 2/3) * Math.pow(S, 1/2);
  const flowRate = velocity * A * 1000; // L/s
  
  // Self-cleansing check (min 0.6 m/s, max 3.0 m/s)
  let status = 'OK';
  let statusText = 'Aliran Optimal';
  if (velocity < 0.6) {
    status = 'TOO_SLOW';
    statusText = 'Terlalu Lambat - Risiko Sedimentasi';
  } else if (velocity > 3.0) {
    status = 'TOO_FAST';
    statusText = 'Terlalu Cepat - Risiko Erosi';
  }
  
  // Capacity in persons (10 L/person peak)
  const capacityPersons = Math.floor((flowRate * 1000) / 10);
  
  return {
    velocity: parseFloat(velocity.toFixed(2)),
    flowRate: parseFloat(flowRate.toFixed(2)),
    hydraulicRadius: parseFloat(R.toFixed(4)),
    crossSectionalArea: parseFloat(A.toFixed(4)),
    status,
    statusText,
    capacityPersons,
    slopePercent,
    diameterMM,
    roughnessN
  };
};

/**
 * Perhitungan perangkap lemak (Grease Trap) untuk dapur/restoran
 * Berdasarkan SNI 7183:2008
 * Volume = Flow × Retention Time
 * Retention time: 30 menit
 * Efficiency: 90% removal minyak
 */
const calculateGreaseTrap = (kitchenFlowRateLPM, retentionMinutes = 30) => {
  // Volume = Flow × Retention Time
  // Flow rate in L/min, time in min
  const volumeLiters = kitchenFlowRateLPM * retentionMinutes;
  
  // Dimensi rekomendasi: Depth 60-120cm, Width 60cm, Length sesuai volume
  const depth = 1.0; // meter
  const width = 0.6; // meter
  const length = volumeLiters / (depth * width * 1000);
  
  const finalLength = Math.max(length, 1.2); // minimum 1.2m
  
  return {
    requiredVolume: parseFloat(volumeLiters.toFixed(2)),
    dimensions: {
      length: parseFloat(finalLength.toFixed(2)),
      width,
      depth
    },
    bafflePositions: {
      inlet: parseFloat((finalLength * 0.33).toFixed(2)),
      outlet: parseFloat((finalLength * 0.67).toFixed(2))
    },
    retentionMinutes,
    efficiency: 90,
    cleaningSchedule: '1-3 bulan'
  };
};

/**
 * Perhitungan Oil Separator untuk bengkel/cuci mobil
 * Retention time: 60 menit
 * Oil storage capacity: 50% volume
 * Sludge zone: 20% volume
 */
const calculateOilSeparator = (flowRateLPM, retentionMinutes = 60) => {
  const volumeLiters = flowRateLPM * retentionMinutes;
  
  // Components
  const oilStorageVolume = volumeLiters * 0.50; // 50% for oil storage
  const sludgeVolume = volumeLiters * 0.20; // 20% for sludge
  const waterVolume = volumeLiters * 0.30; // 30% for water
  
  return {
    totalVolume: parseFloat(volumeLiters.toFixed(2)),
    oilStorageVolume: parseFloat(oilStorageVolume.toFixed(2)),
    sludgeVolume: parseFloat(sludgeVolume.toFixed(2)),
    waterVolume: parseFloat(waterVolume.toFixed(2)),
    retentionMinutes,
    cleaningSchedule: '1-2 bulan'
  };
};

/**
 * Perhitungan beban saniter dengan Fixture Unit (FU)
 * Berdasarkan SNI 03-2453
 * WC siphon: 6 FU
 * Lantai drain (floor drain): 3 FU
 * Kitchen sink: 2 FU
 * Shower: 2 FU
 * Washer machine: 3 FU
 */
const calculateFixtureUnits = (fixtures) => {
  const fixtureUnitValues = {
    'wc_siphon': 6,
    'wc_flush_valve': 8,
    'urinal': 4,
    'urinal_waterless': 0.5,
    'lavatory': 1,
    'kitchen_sink': 2,
    'shower': 2,
    'floor_drain': 3,
    'washer_machine': 3,
    'dishwasher': 2,
    'bathtub': 2,
    'bidet': 2,
    'drinking_fountain': 0.5
  };
  
  let totalFU = 0;
  const breakdown = {};
  
  for (const [type, count] of Object.entries(fixtures)) {
    const fu = fixtureUnitValues[type] || 0;
    const subtotal = fu * count;
    totalFU += subtotal;
    if (count > 0) {
      breakdown[type] = {
        count,
        fuPerUnit: fu,
        subtotal
      };
    }
  }
  
  // Hunter Curve - Probabilistic Flow
  // Q = 0.015 × FU^0.677 (untuk FU < 1000)
  let estimatedFlow = 0;
  if (totalFU <= 0) {
    estimatedFlow = 0;
  } else if (totalFU < 1000) {
    estimatedFlow = 0.015 * Math.pow(totalFU, 0.677); // L/s
  } else {
    // For large systems, use different formula
    estimatedFlow = 0.013 * Math.pow(totalFU, 0.7); // L/s
  }
  
  return {
    totalFU,
    estimatedFlow: parseFloat(estimatedFlow.toFixed(2)),
    estimatedFlowLPM: parseFloat((estimatedFlow * 60).toFixed(2)),
    breakdown
  };
};

/**
 * Perhitungan debit air kotor berdasarkan jenis bangunan
 * Hunian: 80% dari air bersih (SNI 7183)
 * RS: 200-250 liter/tempat tidur/hari
 * Restoran: 40-60 liter/orang/hari
 * Peak Factor: 2.0-3.0 untuk gedung bertingkat
 */
const calculateWastewaterFlow = (buildingType, params) => {
  const buildingTypes = {
    'residential': { baseFlow: 120, unit: 'L/person/day', peFactor: 1 },
    'hotel': { baseFlow: 200, unit: 'L/person/day', peFactor: 1.2 },
    'hospital': { baseFlow: 225, unit: 'L/bed/day', peFactor: 2.5 },
    'restaurant': { baseFlow: 50, unit: 'L/person/day', peFactor: 0.8 },
    'office': { baseFlow: 100, unit: 'L/person/day', peFactor: 1 },
    'school': { baseFlow: 80, unit: 'L/person/day', peFactor: 0.9 },
    'mall': { baseFlow: 150, unit: 'L/person/day', peFactor: 1.1 },
    'factory': { baseFlow: 80, unit: 'L/worker/day', peFactor: 1.5 }
  };
  
  const config = buildingTypes[buildingType] || buildingTypes['office'];
  const count = params.count || 100;
  const peakFactor = params.peakFactor || 2.0;
  const operatingHours = params.operatingHours || 8;
  
  // Average daily flow
  const avgDailyFlow = count * config.baseFlow; // L/day
  const avgHourlyFlow = avgDailyFlow / operatingHours; // L/hour
  const avgFlowLS = avgHourlyFlow / 3600; // L/s
  
  // Peak flow
  const peakFlow = avgFlowLS * peakFactor; // L/s
  
  // Population Equivalent (PE)
  // 1 PE = 50g BOD/day (SNI 7183)
  const pe = (avgDailyFlow / 1000) * config.peFactor * count / 50;
  
  // Wastewater is 80% of clean water
  const wastewaterFlow = avgFlowLS * 0.8;
  const peakWastewaterFlow = peakFlow * 0.8;
  
  return {
    buildingType,
    count,
    baseFlow: config.baseFlow,
    avgDailyFlow: parseFloat(avgDailyFlow.toFixed(2)),
    avgHourlyFlow: parseFloat(avgHourlyFlow.toFixed(2)),
    avgFlowLS: parseFloat(avgFlowLS.toFixed(4)),
    peakFlow: parseFloat(peakFlow.toFixed(4)),
    peakFactor,
    wastewaterFlow: parseFloat(wastewaterFlow.toFixed(4)),
    peakWastewaterFlow: parseFloat(peakWastewaterFlow.toFixed(4)),
    populationEquivalent: parseFloat(pe.toFixed(2)),
    unit: config.unit
  };
};

/**
 * Perhitungan Absorption Field (Drain Field) untuk septic tank effluent
 */
const calculateAbsorptionField = (effluentFlow, percolationRate, trenchWidth = 0.6) => {
  // Loading rate based on percolation rate
  // Percolation rate: 1-60 minutes/inch
  let loadingRate; // L/m²/day
  if (percolationRate <= 5) {
    loadingRate = 40;
  } else if (percolationRate <= 10) {
    loadingRate = 35;
  } else if (percolationRate <= 20) {
    loadingRate = 30;
  } else if (percolationRate <= 30) {
    loadingRate = 25;
  } else if (percolationRate <= 45) {
    loadingRate = 20;
  } else {
    loadingRate = 15; // Slow percolation
  }
  
  // Required area
  const dailyEffluent = effluentFlow * 86400; // L/day (from L/s)
  const requiredArea = dailyEffluent / loadingRate; // m²
  
  // Trench calculations
  const trenchSpacing = 1.8; // m (distance between trenches)
  const trenchDepth = 0.6; // m
  const trenchLength = requiredArea / trenchWidth;
  const numberOfTrenches = Math.ceil(trenchLength / 30); // Max 30m per trench
  const actualTrenchLength = trenchLength / numberOfTrenches;
  
  return {
    effluentFlow: parseFloat(effluentFlow.toFixed(4)),
    dailyEffluent: parseFloat(dailyEffluent.toFixed(2)),
    percolationRate,
    loadingRate,
    requiredArea: parseFloat(requiredArea.toFixed(2)),
    trenchWidth,
    trenchDepth,
    trenchSpacing,
    totalTrenchLength: parseFloat(trenchLength.toFixed(2)),
    numberOfTrenches,
    trenchLengthPerUnit: parseFloat(actualTrenchLength.toFixed(2))
  };
};

/**
 * Perhitungan Sludge Production
 * Primary: 0.5-0.8 L/person/day
 * Secondary: 0.3-0.5 L/person/day
 */
const calculateSludgeProduction = (population, hasSecondary = true) => {
  const primarySludge = population * 0.65; // L/day (average 0.5-0.8)
  const secondarySludge = hasSecondary ? population * 0.4 : 0; // L/day
  const totalDaily = primarySludge + secondarySludge;
  const annualProduction = totalDaily * 365 / 1000; // m³/year
  
  return {
    population,
    primarySludge: parseFloat(primarySludge.toFixed(2)),
    secondarySludge: parseFloat(secondarySludge.toFixed(2)),
    totalDaily: parseFloat(totalDaily.toFixed(2)),
    annualProduction: parseFloat(annualProduction.toFixed(2)),
    desludgingFrequency: hasSecondary ? '1-2 tahun' : '2-3 tahun'
  };
};

/**
 * Perhitungan Wet Well untuk Pump Station
 * Wet well volume: 10-15 menit detention
 */
const calculateWetWell = (peakFlow, detentionMinutes = 15, cyclesPerHour = 6) => {
  const wetWellVolume = peakFlow * 60 * detentionMinutes; // liters
  const pumpCapacity = (wetWellVolume * cyclesPerHour) / 1000; // m³/h
  
  // Minimum 2 pumps (1 duty + 1 standby)
  const pumpsNeeded = 2;
  const capacityPerPump = pumpCapacity; // m³/h each
  
  return {
    peakFlow: parseFloat(peakFlow.toFixed(4)),
    detentionMinutes,
    wetWellVolume: parseFloat(wetWellVolume.toFixed(2)),
    cyclesPerHour,
    totalPumpCapacity: parseFloat(pumpCapacity.toFixed(2)),
    pumpsNeeded,
    capacityPerPump: parseFloat(capacityPerPump.toFixed(2)),
    wetWellDimensions: {
      diameter: 2.0, // m
      depth: parseFloat((wetWellVolume / 1000 / (Math.PI * 1 * 1)).toFixed(2)) // m
    }
  };
};

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let currentTab = 'dashboard';

// Data storage
let wastewaterSystems = [];
let sewerNetwork = [];
let treatmentUnits = [];
let effluentQuality = [];
let sanitaryFixtures = [];
let maintenanceRecords = [];

// Calculation cache
let calculationResults = {};

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function wastewaterInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadWastewaterData();
  
  return renderPage();
}

export function afterWastewaterInspectionRender() {
  initEventListeners();
  initFileUploadListeners();
  initCalculationListeners();
  renderCurrentTab();
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadProjectInfo() {
  try {
    const { data, error } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, alamat, luas_bangunan, jumlah_lantai, fungsi_bangunan')
      .eq('id', currentProjectId)
      .single();
    
    if (data) {
      currentProjectName = data.nama_bangunan;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadWastewaterData() {
  try {
    // Load wastewater systems
    const { data: systemsData } = await supabase
      .from('wastewater_systems')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    wastewaterSystems = systemsData || [];
    
    // Load sewer network
    const { data: networkData } = await supabase
      .from('sewer_network')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('segment_name');
    
    sewerNetwork = networkData || [];
    
    // Load treatment units
    const { data: treatmentData } = await supabase
      .from('treatment_units')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    treatmentUnits = treatmentData || [];
    
    // Load effluent quality
    const { data: qualityData } = await supabase
      .from('effluent_quality')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('test_date', { ascending: false });
    
    effluentQuality = qualityData || [];
    
    // Load sanitary fixtures
    const { data: fixturesData } = await supabase
      .from('sanitary_fixtures')
      .select('*')
      .eq('project_id', currentProjectId);
    
    sanitaryFixtures = fixturesData || [];
    
    // Load maintenance records
    const { data: maintenanceData } = await supabase
      .from('maintenance_schedule')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('scheduled_date');
    
    maintenanceRecords = maintenanceData || [];
    
  } catch (e) {
    console.error('Error loading wastewater data:', e);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="wastewater-inspection-page" style="padding: var(--space-6); max-width: 1600px; margin: 0 auto;">
      ${renderHeaderCard()}
      <div id="wastewater-content" class="wastewater-content">
        <!-- Tab content will be rendered here -->
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getWastewaterStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="wastewater-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(200, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: #0ea5e9;">
            <i class="fas fa-water" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: #0ea5e9;">PHASE 02D</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Sistem Pembuangan Air Kotor & Limbah</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(200, 85%, 45%, 0.1); color: #0ea5e9; border: 1px solid hsla(200, 85%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>SNI 7183:2008
          </span>
          <span class="badge" style="background: hsla(200, 85%, 45%, 0.1); color: #0ea5e9; border: 1px solid hsla(200, 85%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>SNI 03-2453
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Pemeriksaan sistem pembuangan air kotor dan air limbah berdasarkan Pasal 224 ayat (5) Permen PUPR No. 14/PRT/M/2017, 
        SNI 7183:2008, dan SNI 03-2453. Meliputi perhitungan beban, desain jaringan, sistem treatment, 
        dan pemantauan kualitas efluen.
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchWastewaterTab('dashboard', this)" 
                class="wastewater-tab-item active"
                data-tab="dashboard"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-tachometer-alt"></i> DASHBOARD
        </button>
        <button onclick="window._switchWastewaterTab('flow', this)" 
                class="wastewater-tab-item"
                data-tab="flow"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-calculator"></i> BEBAN & ALIRAN
        </button>
        <button onclick="window._switchWastewaterTab('fixtures', this)" 
                class="wastewater-tab-item"
                data-tab="fixtures"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-toilet"></i> PERALATAN
        </button>
        <button onclick="window._switchWastewaterTab('network', this)" 
                class="wastewater-tab-item"
                data-tab="network"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-network-wired"></i> JARINGAN
        </button>
        <button onclick="window._switchWastewaterTab('treatment', this)" 
                class="wastewater-tab-item"
                data-tab="treatment"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-flask"></i> TREATMENT
        </button>
        <button onclick="window._switchWastewaterTab('quality', this)" 
                class="wastewater-tab-item"
                data-tab="quality"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-vial"></i> KUALITAS
        </button>
        <button onclick="window._switchWastewaterTab('pumping', this)" 
                class="wastewater-tab-item"
                data-tab="pumping"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-arrow-up"></i> POMPA
        </button>
        <button onclick="window._switchWastewaterTab('report', this)" 
                class="wastewater-tab-item"
                data-tab="report"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-file-alt"></i> LAPORAN
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('wastewater-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'dashboard':
      contentDiv.innerHTML = renderDashboardTab();
      break;
    case 'flow':
      contentDiv.innerHTML = renderFlowTab();
      break;
    case 'fixtures':
      contentDiv.innerHTML = renderFixturesTab();
      break;
    case 'network':
      contentDiv.innerHTML = renderNetworkTab();
      break;
    case 'treatment':
      contentDiv.innerHTML = renderTreatmentTab();
      break;
    case 'quality':
      contentDiv.innerHTML = renderQualityTab();
      break;
    case 'pumping':
      contentDiv.innerHTML = renderPumpingTab();
      break;
    case 'report':
      contentDiv.innerHTML = renderReportTab();
      break;
  }
}

function renderDashboardTab() {
  const totalSystems = wastewaterSystems.length;
  const totalPipes = sewerNetwork.length;
  const totalTreatment = treatmentUnits.length;
  const totalTests = effluentQuality.length;
  
  // Calculate compliance status
  const compliantTests = effluentQuality.filter(q => q.compliance_status === 'COMPLIANT').length;
  const complianceRate = totalTests > 0 ? Math.round((compliantTests / totalTests) * 100) : 0;
  
  // Calculate total PE
  const totalPE = wastewaterSystems.reduce((sum, s) => sum + (s.total_pe || 0), 0);
  
  return `
    <div id="wastewater-tab-dashboard" class="wastewater-tab-content active">
      <!-- Summary Cards -->
      <div class="grid-4-col" style="gap: 16px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(200, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: #0ea5e9; margin: 0 auto 12px;">
            <i class="fas fa-water" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${totalSystems}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Sistem Wastewater</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(280, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: #a855f7; margin: 0 auto 12px;">
            <i class="fas fa-network-wired" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${totalPipes}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Segmen Pipa</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400); margin: 0 auto 12px;">
            <i class="fas fa-flask" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${totalTreatment}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Unit Treatment</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400); margin: 0 auto 12px;">
            <i class="fas fa-users" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${totalPE.toFixed(0)}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Total PE</div>
        </div>
      </div>
      
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Compliance Status -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-check-circle" style="margin-right: 8px; color: var(--success-400);"></i>
            Status Kepatuhan Efluen
          </h4>
          
          <div style="text-align: center; padding: 20px; background: hsla(220, 20%, 100%, 0.03); border-radius: 12px; margin-bottom: 16px;">
            <div style="font-size: 3rem; font-weight: 800; color: ${complianceRate >= 80 ? 'var(--success-400)' : complianceRate >= 60 ? 'var(--warning-400)' : 'var(--danger-400)'};">
              ${complianceRate}%
            </div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px;">Tingkat Kepatuhan</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="padding: 12px; background: hsla(158, 85%, 45%, 0.1); border-radius: 8px; text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--success-400);">${compliantTests}</div>
              <div style="font-size: 0.65rem; color: var(--text-tertiary);">Tes Lulus</div>
            </div>
            <div style="padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--danger-400);">${totalTests - compliantTests}</div>
              <div style="font-size: 0.65rem; color: var(--text-tertiary);">Tes Gagal</div>
            </div>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-bolt" style="margin-right: 8px; color: #0ea5e9;"></i>
            Aksi Cepat
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="card-quartz clickable" onclick="showFlowCalculatorModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(200, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: #0ea5e9;">
                <i class="fas fa-calculator"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Kalkulator Beban Wastewater</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">Hitung debit & PE</div>
              </div>
            </button>
            
            <button class="card-quartz clickable" onclick="showSepticCalculatorModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
                <i class="fas fa-flask"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Desain Septic Tank</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">SNI 7183:2008</div>
              </div>
            </button>
            
            <button class="card-quartz clickable" onclick="showManningCalculatorModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(280, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: #a855f7;">
                <i class="fas fa-water"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Analisis Aliran Gravitasi</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">Persamaan Manning</div>
              </div>
            </button>
            
            <button class="card-quartz clickable" onclick="showGreaseTrapModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
                <i class="fas fa-filter"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Desain Grease Trap</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">Untuk dapur/restoran</div>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Recent Treatment Units -->
      <div class="card-quartz" style="margin-top: 24px; padding: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-flask" style="margin-right: 8px; color: #0ea5e9;"></i>
            Unit Treatment Terdaftar
          </h4>
          <button class="btn btn-primary btn-sm" onclick="showTreatmentUnitModal()">
            <i class="fas fa-plus"></i> Tambah
          </button>
        </div>
        
        ${treatmentUnits.length === 0 ? 
          '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada unit treatment. Klik "Tambah" untuk memulai.</p>' :
          `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
            ${treatmentUnits.slice(0, 6).map(unit => `
              <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                  <div>
                    <div style="font-weight: 700; color: white;">${unit.unit_type || 'Unit'}</div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary);">${unit.location || ''}</div>
                  </div>
                  <span class="badge" style="background: ${unit.condition_rating >= 4 ? 'hsla(158, 85%, 45%, 0.1)' : unit.condition_rating >= 3 ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${unit.condition_rating >= 4 ? 'var(--success-400)' : unit.condition_rating >= 3 ? 'var(--warning-400)' : 'var(--danger-400)'}; font-size: 9px;">
                    Rating: ${unit.condition_rating || 'N/A'}/5
                  </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7rem;">
                  <div><span style="color: var(--text-tertiary);">Volume:</span> <span style="color: white;">${unit.volume_m3 || 0} m³</span></div>
                  <div><span style="color: var(--text-tertiary);">Pompa:</span> <span style="color: white;">${unit.next_pumping_date ? new Date(unit.next_pumping_date).toLocaleDateString('id-ID') : 'N/A'}</span></div>
                </div>
              </div>
            `).join('')}
          </div>`
        }
      </div>
    </div>
  `;
}

// ============================================================
// FLOW TAB - Wastewater Flow Calculator
// ============================================================

function renderFlowTab() {
  return `
    <div id="wastewater-tab-flow" class="wastewater-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Wastewater Flow Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-calculator" style="margin-right: 8px; color: #0ea5e9;"></i>
            Kalkulator Debit Wastewater
          </h4>
          
          <form id="flow-calculator-form" onsubmit="calculateWastewaterFlowFromForm(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Jenis Bangunan</label>
              <select id="flow-building-type" class="form-input-dark" required>
                <option value="residential">Hunian/Apartemen</option>
                <option value="hotel">Hotel</option>
                <option value="hospital">Rumah Sakit</option>
                <option value="restaurant">Restoran/Kafe</option>
                <option value="office">Kantor</option>
                <option value="school">Sekolah</option>
                <option value="mall">Pusat Perbelanjaan</option>
                <option value="factory">Pabrik</option>
              </select>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Jumlah (org/bed/unit)</label>
                <input type="number" id="flow-count" class="form-input-dark" value="100" min="1" required>
              </div>
              <div>
                <label class="form-label">Peak Factor</label>
                <input type="number" id="flow-peak-factor" class="form-input-dark" value="2.0" min="1" max="5" step="0.1">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Jam Operasional/Hari</label>
              <input type="number" id="flow-operating-hours" class="form-input-dark" value="8" min="1" max="24">
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>Hitung Debit
            </button>
          </form>
          
          <div id="flow-calculation-result" style="margin-top: 20px; display: none;"></div>
          
          <div style="margin-top: 20px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">
              <strong>Standar Debit (SNI 7183):</strong><br>
              • Hunian: 80% dari air bersih<br>
              • RS: 200-250 L/bed/hari<br>
              • Restoran: 40-60 L/org/hari<br>
              • 1 PE = 50g BOD/hari
            </div>
          </div>
        </div>
        
        <!-- Fixture Unit Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-toilet" style="margin-right: 8px; color: #a855f7;"></i>
            Fixture Unit (FU) Calculator
          </h4>
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">
            Perhitungan beban saniter berdasarkan SNI 03-2453
          </p>
          
          <form id="fu-calculator-form" onsubmit="calculateFUFromForm(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label class="form-label">WC Siphon (6 FU)</label>
                <input type="number" id="fu-wc-siphon" class="form-input-dark" value="0" min="0">
              </div>
              <div>
                <label class="form-label">WC Flush Valve (8 FU)</label>
                <input type="number" id="fu-wc-flush" class="form-input-dark" value="0" min="0">
              </div>
              <div>
                <label class="form-label">Urinal (4 FU)</label>
                <input type="number" id="fu-urinal" class="form-input-dark" value="0" min="0">
              </div>
              <div>
                <label class="form-label">Lavatory/Wastafel (1 FU)</label>
                <input type="number" id="fu-lavatory" class="form-input-dark" value="0" min="0">
              </div>
              <div>
                <label class="form-label">Kitchen Sink (2 FU)</label>
                <input type="number" id="fu-kitchen" class="form-input-dark" value="0" min="0">
              </div>
              <div>
                <label class="form-label">Shower (2 FU)</label>
                <input type="number" id="fu-shower" class="form-input-dark" value="0" min="0">
              </div>
              <div>
                <label class="form-label">Floor Drain (3 FU)</label>
                <input type="number" id="fu-floor-drain" class="form-input-dark" value="0" min="0">
              </div>
              <div>
                <label class="form-label">Washer Machine (3 FU)</label>
                <input type="number" id="fu-washer" class="form-input-dark" value="0" min="0">
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>Hitung FU
            </button>
          </form>
          
          <div id="fu-calculation-result" style="margin-top: 20px; display: none;"></div>
        </div>
      </div>
      
      <!-- Wastewater Characteristics -->
      <div class="card-quartz" style="margin-top: 24px; padding: 24px;">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-flask" style="margin-right: 8px; color: var(--gold-400);"></i>
          Karakteristik Air Limbah (SNI 7183)
        </h4>
        
        <div class="grid-3-col" style="gap: 16px;">
          <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
            <div style="font-weight: 700; color: white; margin-bottom: 8px;">Parameter Organik</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.6;">
              <div style="display: flex; justify-content: space-between;">
                <span>BOD₅:</span>
                <span style="color: white;">150-300 mg/L</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>COD:</span>
                <span style="color: white;">300-600 mg/L</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Nitrogen:</span>
                <span style="color: white;">20-50 mg/L</span>
              </div>
            </div>
          </div>
          
          <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
            <div style="font-weight: 700; color: white; margin-bottom: 8px;">Parameter Fisik</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.6;">
              <div style="display: flex; justify-content: space-between;">
                <span>TSS:</span>
                <span style="color: white;">100-300 mg/L</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>pH:</span>
                <span style="color: white;">6.5-8.5</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Suhu:</span>
                <span style="color: white;">20-30°C</span>
              </div>
            </div>
          </div>
          
          <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
            <div style="font-weight: 700; color: white; margin-bottom: 8px;">Parameter Mikroba</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.6;">
              <div style="display: flex; justify-content: space-between;">
                <span>Fecal Coli:</span>
                <span style="color: white;">10⁶-10⁸ MPN/100mL</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>E.Coli:</span>
                <span style="color: white;">10⁶-10⁹ CFU/100mL</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 16px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; border-left: 3px solid var(--danger-400);">
          <div style="font-size: 0.75rem; color: var(--danger-400); font-weight: 700; margin-bottom: 8px;">
            <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i>PERHATIAN - Baku Mutu Efluen
          </div>
          <div style="font-size: 0.7rem; color: var(--text-secondary);">
            Untuk pembuangan ke badan air (sungai): BOD₅ &lt; 50 mg/L, TSS &lt; 50 mg/L, Fecal Coli &lt; 1000 MPN/100mL<br>
            Untuk pembuangan ke IPAL kota: BOD₅ &lt; 100 mg/L, TSS &lt; 100 mg/L
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// FIXTURES TAB - Sanitary Fixtures Inspection
// ============================================================

function renderFixturesTab() {
  return `
    <div id="wastewater-tab-fixtures" class="wastewater-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Sanitary Fixture Schedule -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-clipboard-list" style="margin-right: 8px; color: #0ea5e9;"></i>
              Schedule Peralatan Saniter
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showFixtureModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${sanitaryFixtures.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data fixture. Klik "Tambah" untuk memulai.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 500px; overflow-y: auto;">
              ${sanitaryFixtures.map(fixture => `
                <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <div style="font-weight: 700; color: white;">${fixture.fixture_type || 'Fixture'}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${fixture.location || ''} - Lantai ${fixture.floor || '-'}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <span class="badge" style="background: ${fixture.condition_rating >= 4 ? 'hsla(158, 85%, 45%, 0.1)' : fixture.condition_rating >= 3 ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${fixture.condition_rating >= 4 ? 'var(--success-400)' : fixture.condition_rating >= 3 ? 'var(--warning-400)' : 'var(--danger-400)'}; font-size: 9px;">
                        ${fixture.condition_rating || 'N/A'}/5
                      </span>
                    </div>
                  </div>
                  <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.7rem;">
                    <div><span style="color: var(--text-tertiary);">Trap:</span> <span style="color: white;">${fixture.trap_type || '-'}</span></div>
                    <div><span style="color: var(--text-tertiary);">Flush:</span> <span style="color: white;">${fixture.flush_type || '-'}</span></div>
                    <div><span style="color: var(--text-tertiary);">Vent:</span> <span style="color: white;">${fixture.vent_connected ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
        
        <!-- Fixture Inspection Guidelines -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-book" style="margin-right: 8px; color: var(--gold-400);"></i>
            Panduan Pemeriksaan (SNI 03-2453)
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
              <div style="font-weight: 700; color: white; margin-bottom: 8px;">Water Closet (WC)</div>
              <ul style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; padding-left: 16px; line-height: 1.8;">
                <li>Flush valve/tank berfungsi normal</li>
                <li>Siphon trap seal minimum 50mm</li>
                <li>Tidak ada kebocoran</li>
                <li>Air cukup untuk flush sempurna</li>
              </ul>
            </div>
            
            <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
              <div style="font-weight: 700; color: white; margin-bottom: 8px;">Floor Drain</div>
              <ul style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; padding-left: 16px; line-height: 1.8;">
                <li>Grating terpasang dengan baik</li>
                <li>Trap seal minimum 50mm</li>
                <li>Aliran lancar tidak tersumbat</li>
                <li>Venting tersambung (jika diperlukan)</li>
              </ul>
            </div>
            
            <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
              <div style="font-weight: 700; color: white; margin-bottom: 8px;">Kitchen Equipment</div>
              <ul style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; padding-left: 16px; line-height: 1.8;">
                <li>Grease trap terpasang untuk dapur</li>
                <li>Sink drain dengan strainer</li>
                <li>Trap seal minimum 50mm</li>
              </ul>
            </div>
            
            <div style="padding: 16px; background: hsla(200, 85%, 45%, 0.1); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: #0ea5e9; font-weight: 700; margin-bottom: 8px;">
                <i class="fas fa-camera" style="margin-right: 6px;"></i>DOKUMENTASI FOTO
              </div>
              <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
                Dokumentasikan kondisi setiap fixture dengan foto. Upload ke Google Drive untuk arsip SLF.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// NETWORK TAB - Sewer Network Design & Analysis
// ============================================================

function renderNetworkTab() {
  return `
    <div id="wastewater-tab-network" class="wastewater-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Manning Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-calculator" style="margin-right: 8px; color: #0ea5e9;"></i>
            Kalkulator Manning (Aliran Gravitasi)
          </h4>
          
          <form id="manning-calculator-form" onsubmit="calculateManningFromForm(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Diameter Pipa (mm)</label>
                <select id="manning-diameter" class="form-input-dark">
                  <option value="100">4" (100mm)</option>
                  <option value="150">6" (150mm)</option>
                  <option value="200">8" (200mm)</option>
                  <option value="250">10" (250mm)</option>
                  <option value="300">12" (300mm)</option>
                  <option value="400">16" (400mm)</option>
                </select>
              </div>
              <div>
                <label class="form-label">Slope (%)</label>
                <input type="number" id="manning-slope" class="form-input-dark" value="1.0" min="0.1" max="10" step="0.1">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Material Pipa (Roughness n)</label>
              <select id="manning-roughness" class="form-input-dark">
                <option value="0.009">PVC (n=0.009)</option>
                <option value="0.013">Concrete (n=0.013)</option>
                <option value="0.015">Clay (n=0.015)</option>
                <option value="0.012">HDPE (n=0.012)</option>
                <option value="0.017">Brick (n=0.017)</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>Analisis Aliran
            </button>
          </form>
          
          <div id="manning-calculation-result" style="margin-top: 20px; display: none;"></div>
          
          <div style="margin-top: 20px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">
              <strong>Slope Minimum (SNI 7183):</strong><br>
              • 4" (100mm): minimum 0.5%<br>
              • 6" (150mm): minimum 0.33%<br>
              • Velocity: 0.6-3.0 m/s (self-cleansing)<br>
              <strong>Kekasaran Manning (n):</strong><br>
              • PVC: 0.009 | Concrete: 0.013
            </div>
          </div>
        </div>
        
        <!-- Pipe Segment List -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-network-wired" style="margin-right: 8px; color: #a855f7;"></i>
              Segmen Jaringan
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showPipeSegmentModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${sewerNetwork.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada segmen pipa. Klik "Tambah" untuk memulai.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 500px; overflow-y: auto;">
              ${sewerNetwork.map(pipe => `
                <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                      <div style="font-weight: 700; color: white;">${pipe.segment_name || 'Segment'}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${pipe.upstream_manhole || '-'} → ${pipe.downstream_manhole || '-'}</div>
                    </div>
                    <span class="badge" style="background: ${pipe.velocity_ms >= 0.6 && pipe.velocity_ms <= 3.0 ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${pipe.velocity_ms >= 0.6 && pipe.velocity_ms <= 3.0 ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 9px;">
                      ${pipe.velocity_ms ? pipe.velocity_ms.toFixed(2) : 'N/A'} m/s
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 0.7rem;">
                    <div><span style="color: var(--text-tertiary);">D:</span> <span style="color: white;">${pipe.diameter_mm || '-'} mm</span></div>
                    <div><span style="color: var(--text-tertiary);">L:</span> <span style="color: white;">${pipe.length_m || '-'} m</span></div>
                    <div><span style="color: var(--text-tertiary);">S:</span> <span style="color: white;">${pipe.slope_percent || '-'}%</span></div>
                    <div><span style="color: var(--text-tertiary);">Q:</span> <span style="color: white;">${pipe.flow_rate_ls ? pipe.flow_rate_ls.toFixed(2) : '-'} L/s</span></div>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
      </div>
      
      <!-- Vent System & Manhole Guidelines -->
      <div class="grid-2-col" style="gap: 20px; margin-top: 24px;">
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-wind" style="margin-right: 8px; color: #0ea5e9;"></i>
            Sistem Ventilasi (Vent)
          </h4>
          
          <ul style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; padding-left: 16px; line-height: 1.8;">
            <li><strong>Vent Stack:</strong> Diameter minimum 2" (50mm), maksimum 1/2 diameter drain</li>
            <li><strong>Branch Vent:</strong> Maksimum 15m dari stack</li>
            <li><strong>Loop Vent:</strong> Untuk fixture group</li>
            <li><strong>AAV:</strong> Air Admittance Valve sebagai alternatif jika through-roof tidak memungkinkan</li>
            <li><strong>Termination:</strong> Minimum 0.6m di atas roof level</li>
          </ul>
        </div>
        
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-square" style="margin-right: 8px; color: #a855f7;"></i>
            Manhole/Inspection Chamber
          </h4>
          
          <ul style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; padding-left: 16px; line-height: 1.8;">
            <li><strong>Spacing:</strong> 30-50m pada pipa lurus</li>
            <li><strong>Junction:</strong> Setiap perubahan arah/elevasi</li>
            <li><strong>Dimensi:</strong> 60×60cm (hingga 200mm), 100×100cm (>200mm)</li>
            <li><strong>Bench:</strong> Slope 1:12 ke inlet</li>
            <li><strong>Drop:</strong> 30-60cm per junction</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// TREATMENT TAB - Septic Tank, STP, Grease Trap
// ============================================================

function renderTreatmentTab() {
  return `
    <div id="wastewater-tab-treatment" class="wastewater-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Septic Tank Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-flask" style="margin-right: 8px; color: #0ea5e9;"></i>
            Desain Septic Tank (SNI 7183)
          </h4>
          
          <form id="septic-calculator-form" onsubmit="calculateSepticFromForm(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Jumlah Pengguna (org)</label>
                <input type="number" id="septic-population" class="form-input-dark" value="20" min="1" required>
              </div>
              <div>
                <label class="form-label">Air Bersih (L/org/hari)</label>
                <input type="number" id="septic-water" class="form-input-dark" value="120" min="50" max="500">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Periode Pengurasan (tahun)</label>
              <select id="septic-period" class="form-input-dark">
                <option value="2">2 Tahun</option>
                <option value="3">3 Tahun</option>
                <option value="5">5 Tahun</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>Hitung Volume
            </button>
          </form>
          
          <div id="septic-calculation-result" style="margin-top: 20px; display: none;"></div>
          
          <div style="margin-top: 20px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">
              <strong>Rumus SNI 7183:</strong><br>
              V = V₁ + V₂ + V₃<br>
              V₁ = 80% × Air Bersih × 1 hari<br>
              V₂ = 30 L/org/th × org × tahun<br>
              V₃ = 20% × V₁
            </div>
          </div>
        </div>
        
        <!-- Grease Trap Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-filter" style="margin-right: 8px; color: var(--gold-400);"></i>
            Desain Grease Trap
          </h4>
          
          <form id="grease-calculator-form" onsubmit="calculateGreaseFromForm(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Jenis Dapur</label>
              <select id="grease-kitchen-type" class="form-input-dark">
                <option value="restaurant">Restoran Full Service</option>
                <option value="cafe">Kafe/Snack</option>
                <option value="catering">Catering/Central Kitchen</option>
                <option value="hotel">Hotel Kitchen</option>
              </select>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
              <div>
                <label class="form-label">Piring/Hari (estimasi)</label>
                <input type="number" id="grease-meals" class="form-input-dark" value="200" min="1">
              </div>
              <div>
                <label class="form-label">Waktu Retensi (menit)</label>
                <input type="number" id="grease-retention" class="form-input-dark" value="30" min="15" max="60">
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>Hitung Volume
            </button>
          </form>
          
          <div id="grease-calculation-result" style="margin-top: 20px; display: none;"></div>
          
          <div style="margin-top: 20px; padding: 12px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px;">
            <div style="font-size: 0.7rem; color: var(--gold-400);">
              <strong>Spesifikasi Grease Trap:</strong><br>
              • Volume = Flow × Retention Time<br>
              • Efficiency: 90% removal minyak<br>
              • Baffle: Inlet 1/3, Middle 1/3, Outlet 1/3<br>
              • Pembersihan: 1-3 bulan sekali
            </div>
          </div>
        </div>
      </div>
      
      <!-- Treatment Units List -->
      <div class="card-quartz" style="margin-top: 24px; padding: 24px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-flask" style="margin-right: 8px; color: #0ea5e9;"></i>
            Unit Treatment Terdaftar
          </h4>
          <button class="btn btn-primary btn-sm" onclick="showTreatmentUnitModal()">
            <i class="fas fa-plus"></i> Tambah Unit
          </button>
        </div>
        
        ${treatmentUnits.length === 0 ? 
          '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada unit treatment.</p>' :
          `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px;">
            ${treatmentUnits.map(unit => `
              <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.03);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                  <div>
                    <div style="font-weight: 700; color: white; font-size: 1.1rem;">${unit.unit_type || 'Unit'}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">${unit.location || ''}</div>
                  </div>
                  <span class="badge" style="background: ${unit.condition_rating >= 4 ? 'hsla(158, 85%, 45%, 0.1)' : unit.condition_rating >= 3 ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${unit.condition_rating >= 4 ? 'var(--success-400)' : unit.condition_rating >= 3 ? 'var(--warning-400)' : 'var(--danger-400)'}; font-size: 10px; padding: 4px 8px;">
                    Rating ${unit.condition_rating || '-'}/5
                  </span>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                    <span style="color: var(--text-tertiary);">Volume:</span>
                    <span style="color: white; font-weight: 600;">${unit.volume_m3 || 0} m³</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                    <span style="color: var(--text-tertiary);">Dimensi:</span>
                    <span style="color: white;">${unit.dimensions?.length || '-'} × ${unit.dimensions?.width || '-'} × ${unit.dimensions?.depth || '-'} m</span>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
                  <div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.65rem; color: var(--text-tertiary);">Pengurasan Terakhir</div>
                    <div style="font-size: 0.8rem; color: white;">${unit.last_pumping_date ? new Date(unit.last_pumping_date).toLocaleDateString('id-ID') : 'N/A'}</div>
                  </div>
                  <div style="padding: 8px; background: hsla(200, 85%, 45%, 0.1); border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.65rem; color: #0ea5e9;">Pengurasan Berikutnya</div>
                    <div style="font-size: 0.8rem; color: white; font-weight: 600;">${unit.next_pumping_date ? new Date(unit.next_pumping_date).toLocaleDateString('id-ID') : 'N/A'}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>`
        }
      </div>
    </div>
  `;
}

// ============================================================
// QUALITY TAB - Effluent Monitoring
// ============================================================

function renderQualityTab() {
  return `
    <div id="wastewater-tab-quality" class="wastewater-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Effluent Quality Input -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-vial" style="margin-right: 8px; color: #0ea5e9;"></i>
            Input Hasil Pengujian Efluen
          </h4>
          
          <form id="effluent-form" onsubmit="saveEffluentQuality(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Tanggal Pengujian</label>
              <input type="date" id="effluent-date" class="form-input-dark" required>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label class="form-label">BOD₅ (mg/L)</label>
                <input type="number" id="effluent-bod" class="form-input-dark" step="0.1" min="0">
              </div>
              <div>
                <label class="form-label">COD (mg/L)</label>
                <input type="number" id="effluent-cod" class="form-input-dark" step="0.1" min="0">
              </div>
              <div>
                <label class="form-label">TSS (mg/L)</label>
                <input type="number" id="effluent-tss" class="form-input-dark" step="0.1" min="0">
              </div>
              <div>
                <label class="form-label">pH</label>
                <input type="number" id="effluent-ph" class="form-input-dark" step="0.1" min="0" max="14">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Jenis Pembuangan</label>
              <select id="effluent-type" class="form-input-dark">
                <option value="RIVER">Sungai/Badan Air</option>
                <option value="CITY_SEWER">IPAL Kota</option>
                <option value="REUSE">Reuse/Recycling</option>
                <option value="GROUND">Sumur Resapan</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-save" style="margin-right: 8px;"></i>Simpan Hasil Uji
            </button>
          </form>
        </div>
        
        <!-- Quality History -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-chart-line" style="margin-right: 8px; color: var(--success-400);"></i>
              Riwayat Pengujian
            </h4>
          </div>
          
          ${effluentQuality.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data pengujian.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 500px; overflow-y: auto;">
              ${effluentQuality.map(test => `
                <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-left: 3px solid ${test.compliance_status === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'};">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                      <div style="font-weight: 700; color: white;">${new Date(test.test_date).toLocaleDateString('id-ID')}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${test.effluent_standard || '-'}</div>
                    </div>
                    <span class="badge" style="background: ${test.compliance_status === 'COMPLIANT' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${test.compliance_status === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 9px;">
                      ${test.compliance_status === 'COMPLIANT' ? 'LULUS' : 'GAGAL'}
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.7rem;">
                    <div><span style="color: var(--text-tertiary);">BOD:</span> <span style="color: white;">${test.bod5_mg_l || '-'} mg/L</span></div>
                    <div><span style="color: var(--text-tertiary);">COD:</span> <span style="color: white;">${test.cod_mg_l || '-'} mg/L</span></div>
                    <div><span style="color: var(--text-tertiary);">TSS:</span> <span style="color: white;">${test.tss_mg_l || '-'} mg/L</span></div>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
      </div>
      
      <!-- Baku Mutu Reference -->
      <div class="card-quartz" style="margin-top: 24px; padding: 24px;">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-book" style="margin-right: 8px; color: var(--gold-400);"></i>
          Baku Mutu Efluen (PP 22/2021)
        </h4>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">
          • Sungai: BOD₅ ≤ 50 mg/L, TSS ≤ 50 mg/L, Fecal Coli ≤ 1000 MPN/100mL<br>
          • IPAL Kota: BOD₅ ≤ 100 mg/L, TSS ≤ 100 mg/L, pH 6-9
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// PUMPING TAB - Lift Station & Pump Design
// ============================================================

function renderPumpingTab() {
  return `
    <div id="wastewater-tab-pumping" class="wastewater-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Wet Well Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-arrow-up" style="margin-right: 8px; color: #0ea5e9;"></i>
            Desain Wet Well & Pompa
          </h4>
          
          <form id="wetwell-form" onsubmit="calculateWetWellFromForm(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Debit Peak (L/s)</label>
                <input type="number" id="wetwell-flow" class="form-input-dark" value="5" min="0.1" step="0.1">
              </div>
              <div>
                <label class="form-label">Detensi (menit)</label>
                <input type="number" id="wetwell-detention" class="form-input-dark" value="15" min="10" max="30">
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Hitung Volume Wet Well</button>
          </form>
          
          <div id="wetwell-result" style="margin-top: 20px; display: none;"></div>
        </div>
        
        <!-- Oil Separator Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-oil-can" style="margin-right: 8px; color: var(--gold-400);"></i>
            Desain Oil Separator
          </h4>
          
          <form id="oil-form" onsubmit="calculateOilFromForm(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Kendaraan/Hari</label>
                <input type="number" id="oil-vehicles" class="form-input-dark" value="50" min="1">
              </div>
              <div>
                <label class="form-label">Retensi (menit)</label>
                <input type="number" id="oil-retention" class="form-input-dark" value="60" min="30">
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Hitung Volume</button>
          </form>
          
          <div id="oil-result" style="margin-top: 20px; display: none;"></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// REPORT TAB - Compliance & SLF Report
// ============================================================

function renderReportTab() {
  return `
    <div id="wastewater-tab-report" class="wastewater-tab-content">
      <div class="card-quartz" style="padding: 24px;">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-file-alt" style="margin-right: 8px; color: #0ea5e9;"></i>
          Laporan SLF - Sistem Wastewater
        </h4>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <button class="btn btn-primary" onclick="generateReport('full')">
            <i class="fas fa-file-pdf"></i> Laporan Komprehensif
          </button>
          <button class="btn btn-secondary" onclick="generateReport('treatment')">
            <i class="fas fa-flask"></i> Laporan Treatment
          </button>
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
          <div style="font-size: 0.75rem; color: var(--text-secondary);">
            <strong>Referensi Regulasi:</strong><br>
            • Permen PUPR No. 14/PRT/M/2017 - Pasal 224 ayat (5)<br>
            • SNI 7183:2008 - Sistem Pengolahan Air Limbah Skala Kecil<br>
            • SNI 03-2453 - Tata Cara Perencanaan Plumbing<br>
            • PP No. 22/2021 - Baku Mutu Air Limbah
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// STYLES
// ============================================================

function getWastewaterStyles() {
  return `
    .wastewater-content { min-height: 500px; }
    .wastewater-tab-content { display: none; }
    .wastewater-tab-content.active { display: block; }
    .wastewater-tab-item.active { background: var(--gradient-brand) !important; color: white !important; }
    .grid-2-col { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .grid-3-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .grid-4-col { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 768px) { .grid-2-col, .grid-3-col, .grid-4-col { grid-template-columns: 1fr; } }
    .form-label { display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px; }
    .form-input-dark { width: 100%; padding: 10px 14px; background: hsla(220, 20%, 100%, 0.05); border: 1px solid hsla(220, 20%, 100%, 0.1); border-radius: 8px; color: white; }
    .calculation-result-box { background: hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; margin-top: 16px; border-left: 3px solid var(--success-400); }
  `;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function initEventListeners() {
  window._switchWastewaterTab = (tabName, btn) => {
    currentTab = tabName;
    document.querySelectorAll('.wastewater-tab-item').forEach(item => {
      item.classList.remove('active');
      item.style.background = 'transparent';
      item.style.color = 'var(--text-tertiary)';
    });
    if (btn) btn.classList.add('active');
    renderCurrentTab();
  };

  window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  };

  // Calculator handlers
  window.calculateWastewaterFlowFromForm = (e) => {
    e.preventDefault();
    const buildingType = document.getElementById('flow-building-type').value;
    const count = parseInt(document.getElementById('flow-count').value);
    const peakFactor = parseFloat(document.getElementById('flow-peak-factor').value);
    const operatingHours = parseInt(document.getElementById('flow-operating-hours').value);
    const result = calculateWastewaterFlow(buildingType, { count, peakFactor, operatingHours });
    const resultDiv = document.getElementById('flow-calculation-result');
    resultDiv.innerHTML = `<div class="calculation-result-box"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;"><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Debit Harian</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.avgDailyFlow.toFixed(2)} L/hari</div></div><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Debit Peak</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.peakFlow.toFixed(4)} L/s</div></div><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Debit Rata-rata</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.avgFlowLS.toFixed(4)} L/s</div></div><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Population Equivalent</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.populationEquivalent.toFixed(2)} PE</div></div></div></div>`;
    resultDiv.style.display = 'block';
  };

  window.calculateFUFromForm = (e) => {
    e.preventDefault();
    const fixtures = {
      'wc_siphon': parseInt(document.getElementById('fu-wc-siphon').value) || 0,
      'wc_flush_valve': parseInt(document.getElementById('fu-wc-flush').value) || 0,
      'urinal': parseInt(document.getElementById('fu-urinal').value) || 0,
      'lavatory': parseInt(document.getElementById('fu-lavatory').value) || 0,
      'kitchen_sink': parseInt(document.getElementById('fu-kitchen').value) || 0,
      'shower': parseInt(document.getElementById('fu-shower').value) || 0,
      'floor_drain': parseInt(document.getElementById('fu-floor-drain').value) || 0,
      'washer_machine': parseInt(document.getElementById('fu-washer').value) || 0
    };
    const result = calculateFixtureUnits(fixtures);
    const resultDiv = document.getElementById('fu-calculation-result');
    resultDiv.innerHTML = `<div class="calculation-result-box"><div style="text-align: center; margin-bottom: 16px;"><div style="font-size: 2rem; font-weight: 800; color: white;">${result.totalFU} FU</div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Total Fixture Unit</div></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;"><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Debit Estimasi</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.estimatedFlow} L/s</div></div><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Debit (L/menit)</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.estimatedFlowLPM} L/m</div></div></div></div>`;
    resultDiv.style.display = 'block';
  };

  window.calculateManningFromForm = (e) => {
    e.preventDefault();
    const diameter = parseInt(document.getElementById('manning-diameter').value);
    const slope = parseFloat(document.getElementById('manning-slope').value);
    const roughness = parseFloat(document.getElementById('manning-roughness').value);
    const result = calculateManningFlow(diameter, slope, roughness);
    const resultDiv = document.getElementById('manning-calculation-result');
    resultDiv.innerHTML = `<div class="calculation-result-box" style="border-left-color: ${result.status === 'OK' ? 'var(--success-400)' : 'var(--warning-400)'};"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;"><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Kecepatan</div><div style="font-size: 1.2rem; font-weight: 700; color: ${result.status === 'OK' ? 'var(--success-400)' : 'var(--warning-400)'};">${result.velocity} m/s</div></div><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Debit</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.flowRate} L/s</div></div><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Kapasitas</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">~${result.capacityPersons} org</div></div><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Status</div><div style="font-size: 0.9rem; font-weight: 600; color: ${result.status === 'OK' ? 'var(--success-400)' : 'var(--warning-400)'};">${result.statusText}</div></div></div></div>`;
    resultDiv.style.display = 'block';
  };

  window.calculateSepticFromForm = (e) => {
    e.preventDefault();
    const population = parseInt(document.getElementById('septic-population').value);
    const waterConsumption = parseInt(document.getElementById('septic-water').value);
    const desludgingPeriod = parseInt(document.getElementById('septic-period').value);
    const result = calculateSepticTank(population, waterConsumption, desludgingPeriod);
    const resultDiv = document.getElementById('septic-calculation-result');
    resultDiv.innerHTML = `<div class="calculation-result-box"><div style="text-align: center; margin-bottom: 16px;"><div style="font-size: 2rem; font-weight: 800; color: white;">${result.totalVolume} m³</div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Volume Total</div></div><div style="font-size: 0.75rem; margin-bottom: 12px;">V₁=${result.components.V1} | V₂=${result.components.V2} | V₃=${result.components.V3}</div><div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 0.7rem;"><div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px; text-align: center;"><div style="color: var(--text-tertiary);">Panjang</div><div style="color: white; font-weight: 600;">${result.dimensions.length} m</div></div><div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px; text-align: center;"><div style="color: var(--text-tertiary);">Lebar</div><div style="color: white; font-weight: 600;">${result.dimensions.width} m</div></div><div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px; text-align: center;"><div style="color: var(--text-tertiary);">Kedalaman</div><div style="color: white; font-weight: 600;">${result.dimensions.depth} m</div></div></div><div style="margin-top: 12px; padding: 8px; background: hsla(200, 85%, 45%, 0.1); border-radius: 6px; text-align: center;"><div style="font-size: 0.7rem; color: #0ea5e9;">Pengurasan: ${result.nextDesludgingDate}</div></div></div>`;
    resultDiv.style.display = 'block';
  };

  window.calculateGreaseFromForm = (e) => {
    e.preventDefault();
    const meals = parseInt(document.getElementById('grease-meals').value);
    const retention = parseInt(document.getElementById('grease-retention').value);
    const flowRateLPM = (meals / 8) / 20 * 10;
    const result = calculateGreaseTrap(flowRateLPM, retention);
    const resultDiv = document.getElementById('grease-calculation-result');
    resultDiv.innerHTML = `<div class="calculation-result-box"><div style="text-align: center; margin-bottom: 16px;"><div style="font-size: 2rem; font-weight: 800; color: white;">${result.requiredVolume} L</div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Volume Diperlukan</div></div><div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 0.7rem;"><div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px; text-align: center;"><div style="color: var(--text-tertiary);">Panjang</div><div style="color: white; font-weight: 600;">${result.dimensions.length} m</div></div><div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px; text-align: center;"><div style="color: var(--text-tertiary);">Lebar</div><div style="color: white; font-weight: 600;">${result.dimensions.width} m</div></div><div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px; text-align: center;"><div style="color: var(--text-tertiary);">Kedalaman</div><div style="color: white; font-weight: 600;">${result.dimensions.depth} m</div></div></div></div>`;
    resultDiv.style.display = 'block';
  };

  window.calculateWetWellFromForm = (e) => {
    e.preventDefault();
    const flow = parseFloat(document.getElementById('wetwell-flow').value);
    const detention = parseInt(document.getElementById('wetwell-detention').value);
    const result = calculateWetWell(flow, detention, 6);
    const resultDiv = document.getElementById('wetwell-result');
    resultDiv.innerHTML = `<div class="calculation-result-box"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;"><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Volume Wet Well</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.wetWellVolume} L</div></div><div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Kapasitas Pompa</div><div style="font-size: 1.2rem; font-weight: 700; color: white;">${result.totalPumpCapacity} m³/h</div></div></div><div style="padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px;"><div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px;">Rekomendasi</div><div style="font-size: 0.9rem; color: white; font-weight: 600;">${result.pumpsNeeded} unit @ ${result.capacityPerPump} m³/h</div></div></div>`;
    resultDiv.style.display = 'block';
  };

  window.calculateOilFromForm = (e) => {
    e.preventDefault();
    const vehicles = parseInt(document.getElementById('oil-vehicles').value);
    const retention = parseInt(document.getElementById('oil-retention').value);
    const flowRateLPM = (vehicles * 100) / (8 * 60 / 10);
    const result = calculateOilSeparator(flowRateLPM, retention);
    const resultDiv = document.getElementById('oil-result');
    resultDiv.innerHTML = `<div class="calculation-result-box"><div style="text-align: center; margin-bottom: 16px;"><div style="font-size: 2rem; font-weight: 800; color: white;">${result.totalVolume} L</div><div style="font-size: 0.7rem; color: var(--text-tertiary);">Volume Total</div></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7rem;"><div style="padding: 8px; background: hsla(45, 90%, 60%, 0.1); border-radius: 6px; text-align: center;"><div style="color: var(--gold-400);">Zona Minyak (50%)</div><div style="color: white; font-weight: 600;">${result.oilStorageVolume} L</div></div><div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 6px; text-align: center;"><div style="color: var(--text-tertiary);">Zona Lumpur (20%)</div><div style="color: white; font-weight: 600;">${result.sludgeVolume} L</div></div></div></div>`;
    resultDiv.style.display = 'block';
  };

  window.saveEffluentQuality = async (e) => {
    e.preventDefault();
    const data = {
      project_id: currentProjectId,
      test_date: document.getElementById('effluent-date').value,
      bod5_mg_l: parseFloat(document.getElementById('effluent-bod').value) || null,
      cod_mg_l: parseFloat(document.getElementById('effluent-cod').value) || null,
      tss_mg_l: parseFloat(document.getElementById('effluent-tss').value) || null,
      ph: parseFloat(document.getElementById('effluent-ph').value) || null,
      effluent_standard: document.getElementById('effluent-type').value
    };
    const standard = data.effluent_standard;
    let isCompliant = true;
    if (standard === 'RIVER') {
      if (data.bod5_mg_l > 50 || data.tss_mg_l > 50 || data.ph < 6 || data.ph > 9) isCompliant = false;
    } else if (standard === 'CITY_SEWER') {
      if (data.bod5_mg_l > 100 || data.tss_mg_l > 100 || data.ph < 6 || data.ph > 9) isCompliant = false;
    }
    data.compliance_status = isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT';
    try {
      const { error } = await supabase.from('effluent_quality').insert(data);
      if (error) throw error;
      showSuccess('Data berhasil disimpan');
      await loadWastewaterData();
      renderCurrentTab();
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };

  window.showFlowCalculatorModal = () => { currentTab = 'flow'; renderCurrentTab(); showInfo('Kalkulator tersedia di tab Beban & Aliran'); };
  window.showSepticCalculatorModal = () => { currentTab = 'treatment'; renderCurrentTab(); showInfo('Kalkulator tersedia di tab Treatment'); };
  window.showManningCalculatorModal = () => { currentTab = 'network'; renderCurrentTab(); showInfo('Kalkulator tersedia di tab Jaringan'); };
  window.showGreaseTrapModal = () => { currentTab = 'treatment'; renderCurrentTab(); showInfo('Kalkulator tersedia di tab Treatment'); };
  window.showTreatmentUnitModal = () => showInfo('Gunakan Supabase dashboard untuk input data lengkap');
  window.showPipeSegmentModal = () => showInfo('Gunakan Supabase dashboard untuk input data lengkap');
  window.showFixtureModal = () => showInfo('Gunakan Supabase dashboard untuk input data lengkap');
  window.generateReport = (type) => showInfo(`Generating ${type} report...`);
}

function initFileUploadListeners() {}
function initCalculationListeners() {}
function renderModals() { return ''; }
