// ============================================================
// ENVIRONMENTAL INSPECTION - MAIN PAGE
// Pemeriksaan Lingkungan SLF (AMDAL & Kinerja Energi)
// Integrates: Air Quality, Energy Efficiency, Waste Management, Water Conservation
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let envData = {
  summary: null,
  airQualityMeasurements: [],
  energySystems: [],
  waterUsage: [],
  wasteRecords: []
};
let currentTab = 'dashboard';

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function environmentalInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadEnvData();
  
  return renderPage();
}

export function afterEnvironmentalInspectionRender() {
  initEventListeners();
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

async function loadEnvData() {
  try {
    // Load summary
    const { data: summaryData } = await supabase
      .from('environmental_summary')
      .select('*')
      .eq('project_id', currentProjectId)
      .single();
    
    envData.summary = summaryData;
    
    // Load air quality measurements
    const { data: airData } = await supabase
      .from('environmental_air_quality')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    envData.airQualityMeasurements = airData || [];
    
    // Load energy systems
    const { data: energyData } = await supabase
      .from('environmental_energy')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    envData.energySystems = energyData || [];
    
    // Load water usage
    const { data: waterData } = await supabase
      .from('environmental_water')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    envData.waterUsage = waterData || [];
    
    // Load waste records
    const { data: wasteData } = await supabase
      .from('environmental_waste')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    envData.wasteRecords = wasteData || [];
    
  } catch (e) {
    console.error('Error loading environmental data:', e);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="environmental-inspection-page" style="padding: var(--space-6); max-width: 1400px; margin: 0 auto;">
      ${renderHeaderCard()}
      <div id="env-content" class="env-content">
        <!-- Tab content will be rendered here -->
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getEnvStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="env-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-leaf" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--success-400);">PHASE 03B</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Lingkungan & Energi</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(158, 85%, 45%, 0.1); color: var(--success-400); border: 1px solid hsla(158, 85%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>AMDAL & SNI
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi lingkungan dan efisiensi energi bangunan. Meliputi kualitas udara dalam ruangan (IAQ), 
        konsumsi energi (EPI), manajemen air, dan pengelolaan limbah sesuai standar AMDAL dan SNI.
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchEnvTab('dashboard', this)" 
                class="env-tab-item active"
                data-tab="dashboard"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-tachometer-alt"></i> DASHBOARD
        </button>
        <button onclick="window._switchEnvTab('air', this)" 
                class="env-tab-item"
                data-tab="air"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-wind"></i> KUALITAS UDARA
        </button>
        <button onclick="window._switchEnvTab('energy', this)" 
                class="env-tab-item"
                data-tab="energy"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-bolt"></i> EFISIENSI ENERGI
        </button>
        <button onclick="window._switchEnvTab('water', this)" 
                class="env-tab-item"
                data-tab="water"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-tint"></i> KONSUMSI AIR
        </button>
        <button onclick="window._switchEnvTab('waste', this)" 
                class="env-tab-item"
                data-tab="waste"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-recycle"></i> LIMBAH
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('env-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'dashboard':
      contentDiv.innerHTML = renderDashboardTab();
      break;
    case 'air':
      contentDiv.innerHTML = renderAirTab();
      break;
    case 'energy':
      contentDiv.innerHTML = renderEnergyTab();
      break;
    case 'water':
      contentDiv.innerHTML = renderWaterTab();
      break;
    case 'waste':
      contentDiv.innerHTML = renderWasteTab();
      break;
  }
}

function renderDashboardTab() {
  const summary = envData.summary || {};
  const totalEnergy = envData.energySystems.reduce((sum, e) => sum + (e.monthly_kwh || 0), 0);
  const totalWater = envData.waterUsage.reduce((sum, w) => sum + (w.monthly_m3 || 0), 0);
  const totalWaste = envData.wasteRecords.reduce((sum, w) => sum + (w.amount_kg || 0), 0);
  
  // Calculate OTTV if data available
  const ottv = summary.ottv_value || 0;
  const ottvStatus = ottv <= 35 ? 'GOOD' : ottv <= 45 ? 'FAIR' : 'POOR';
  
  return `
    <div id="env-tab-dashboard" class="env-tab-content active">
      <!-- Summary Cards -->
      <div class="grid-4-col" style="gap: 16px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-wind" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${envData.airQualityMeasurements.length}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Air Quality Tests</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">PM2.5, CO2, VOC</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400); margin: 0 auto 12px;">
            <i class="fas fa-bolt" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${totalEnergy.toLocaleString()}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">kWh/Month</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">Energy consumption</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400); margin: 0 auto 12px;">
            <i class="fas fa-tint" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${totalWater.toFixed(1)}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">m³/Month</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">Water usage</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400); margin: 0 auto 12px;">
            <i class="fas fa-recycle" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${totalWaste.toFixed(0)}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">kg Waste/Month</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">Total generated</div>
        </div>
      </div>
      
      <div class="grid-2-col" style="gap: 20px;">
        <!-- OTTV Card -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-sun" style="margin-right: 8px; color: var(--gold-400);"></i>
            OTTV (Overall Thermal Transfer Value)
          </h4>
          
          <div style="text-align: center; padding: 20px; background: hsla(220, 20%, 100%, 0.03); border-radius: 12px; margin-bottom: 16px;">
            <div style="font-size: 3rem; font-weight: 800; color: ${ottvStatus === 'GOOD' ? 'var(--success-400)' : ottvStatus === 'FAIR' ? 'var(--warning-400)' : 'var(--danger-400)'};">
              ${ottv > 0 ? ottv.toFixed(2) : 'N/A'}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px;">W/m²</div>
            <div style="font-size: 0.8rem; color: ${ottvStatus === 'GOOD' ? 'var(--success-400)' : ottvStatus === 'FAIR' ? 'var(--warning-400)' : 'var(--danger-400)'}; margin-top: 8px; font-weight: 700;">
              ${ottv > 0 ? ottvStatus : 'Belum dihitung'}
            </div>
          </div>
          
          <form id="ottv-form" onsubmit="calculateOTTV(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Wall Area (m²)</label>
                <input type="number" id="ottv-wall-area" class="form-input-dark" placeholder="e.g., 500" step="0.1">
              </div>
              <div>
                <label class="form-label">Window Area (m²)</label>
                <input type="number" id="ottv-window-area" class="form-input-dark" placeholder="e.g., 200" step="0.1">
              </div>
              <div>
                <label class="form-label">Roof Area (m²)</label>
                <input type="number" id="ottv-roof-area" class="form-input-dark" placeholder="e.g., 300" step="0.1">
              </div>
              <div>
                <label class="form-label">AC Floor Area (m²)</label>
                <input type="number" id="ottv-floor-area" class="form-input-dark" placeholder="e.g., 1000" step="0.1">
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>Hitung OTTV
            </button>
          </form>
          
          <div id="ottv-result" style="margin-top: 16px; display: none;"></div>
          
          <div style="margin-top: 20px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">
              <strong>Standar SNI 03-6389-2011:</strong><br>
              • OTTV ≤ 35 W/m² (Good)<br>
              • OTTV ≤ 45 W/m² (Acceptable)
            </div>
          </div>
        </div>
        
        <!-- EPI Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-chart-line" style="margin-right: 8px; color: var(--brand-400);"></i>
            EPI (Energy Performance Index)
          </h4>
          
          <form id="epi-form" onsubmit="calculateEPI(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Total Energy (kWh/year)</label>
              <input type="number" id="epi-energy" class="form-input-dark" placeholder="e.g., 150000" step="1">
            </div>
            <div style="margin-bottom: 16px;">
              <label class="form-label">Building Area (m²)</label>
              <input type="number" id="epi-area" class="form-input-dark" placeholder="e.g., 5000" step="0.1">
            </div>
            <div style="margin-bottom: 20px;">
              <label class="form-label">Building Type</label>
              <select id="epi-type" class="form-input-dark">
                <option value="OFFICE">Office Building</option>
                <option value="HOTEL">Hotel</option>
                <option value="HOSPITAL">Hospital</option>
                <option value="RETAIL">Retail/Mall</option>
                <option value="EDUCATION">School/University</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>Hitung EPI
            </button>
          </form>
          
          <div id="epi-result" style="margin-top: 16px; display: none;"></div>
          
          <div style="margin-top: 20px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">
              <strong>Standar EPI (kWh/m²/year):</strong><br>
              • Office: 150-240 (Good)<br>
              • Hotel: 200-300<br>
              • Hospital: 250-400
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAirTab() {
  return `
    <div id="env-tab-air" class="env-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Air Quality Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-lungs" style="margin-right: 8px; color: var(--brand-400);"></i>
              Indoor Air Quality (IAQ)
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-6389-2011</span>
          </div>
          
          <form id="iaq-form" onsubmit="calculateIAQ(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">PM2.5 (μg/m³)</label>
                <input type="number" id="iaq-pm25" class="form-input-dark" placeholder="Target: <35" step="0.1" min="0">
              </div>
              <div>
                <label class="form-label">CO2 (ppm)</label>
                <input type="number" id="iaq-co2" class="form-input-dark" placeholder="Target: <1000" step="1" min="0">
              </div>
              <div>
                <label class="form-label">VOC (mg/m³)</label>
                <input type="number" id="iaq-voc" class="form-input-dark" placeholder="Target: <0.5" step="0.01" min="0">
              </div>
              <div>
                <label class="form-label">Temperature (°C)</label>
                <input type="number" id="iaq-temp" class="form-input-dark" placeholder="Comfort: 22-26" step="0.1">
              </div>
              <div>
                <label class="form-label">Humidity (%)</label>
                <input type="number" id="iaq-humidity" class="form-input-dark" placeholder="Comfort: 40-60" step="1" min="0" max="100">
              </div>
              <div>
                <label class="form-label">CO (ppm)</label>
                <input type="number" id="iaq-co" class="form-input-dark" placeholder="Target: <9" step="0.1" min="0">
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Evaluasi IAQ
            </button>
          </form>
          
          <div id="iaq-result" style="margin-top: 20px; display: none;"></div>
        </div>
        
        <!-- Air Quality Measurements -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-clipboard-check" style="margin-right: 8px; color: var(--success-400);"></i>
              Data Pengukuran
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showAirQualityModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${envData.airQualityMeasurements.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data pengukuran kualitas udara.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
              ${envData.airQualityMeasurements.map(m => {
                const isPass = (m.pm25 || 999) <= 35 && (m.co2 || 999) <= 1000;
                return `
                  <div class="card-quartz" style="padding: 12px; border-left: 3px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; background: hsla(220, 20%, 100%, 0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <div style="font-weight: 700; color: white;">${m.location || 'Lokasi'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${new Date(m.measurement_date).toLocaleDateString('id-ID')}</div>
                      </div>
                      <span class="badge" style="background: ${isPass ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; font-size: 9px;">
                        ${isPass ? 'GOOD' : 'POOR'}
                      </span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; font-size: 0.7rem;">
                      <div><span style="color: var(--text-tertiary);">PM2.5:</span> <span style="color: white;">${m.pm25 || 'N/A'}</span></div>
                      <div><span style="color: var(--text-tertiary);">CO2:</span> <span style="color: white;">${m.co2 || 'N/A'}</span></div>
                      <div><span style="color: var(--text-tertiary);">VOC:</span> <span style="color: white;">${m.voc || 'N/A'}</span></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
          }
          
          <div style="margin-top: 20px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">
              <strong>Standar IAQ (SNI):</strong><br>
              • PM2.5: ≤ 35 μg/m³<br>
              • CO2: ≤ 1000 ppm<br>
              • VOC: ≤ 0.5 mg/m³<br>
              • CO: ≤ 9 ppm
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEnergyTab() {
  return `
    <div id="env-tab-energy" class="env-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Energy Tips -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-lightbulb" style="margin-right: 8px; color: var(--brand-400);"></i>
            Tips Efisiensi Energi
          </h4>
          
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <ul style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; padding-left: 16px; line-height: 1.8;">
              <li>Gunakan LED lighting (hemat 50-70%)</li>
              <li>AC inverter lebih efisien 30-40%</li>
              <li>Natural lighting & daylight harvesting</li>
              <li>Occupancy sensors untuk lighting</li>
              <li>Proper insulation reduce thermal loss</li>
              <li>Smart BMS untuk kontrol terintegrasi</li>
              <li>Solar panels untuk renewable energy</li>
            </ul>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--gold-400); font-weight: 700; margin-bottom: 8px;">
              <i class="fas fa-star" style="margin-right: 6px;"></i>GREEN BUILDING CERTIFICATION
            </div>
            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
              Pertimbangkan sertifikasi GREENSHIP atau LEED untuk meningkatkan nilai bangunan dan mengurangi jejak karbon.
            </p>
          </div>
        </div>
        
        <!-- Energy Systems List -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-bolt" style="margin-right: 8px; color: var(--gold-400);"></i>
              Sistem Energi
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showEnergyModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${envData.energySystems.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data sistem energi.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
              ${envData.energySystems.map(e => `
                <div class="card-quartz" style="padding: 12px; background: hsla(220, 20%, 100%, 0.03);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <div style="font-weight: 700; color: white;">${e.system_name || 'System'}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${e.system_type || 'Lainnya'}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: 800; color: var(--brand-400);">${e.monthly_kwh || 0} kWh</div>
                      <div style="font-size: 0.65rem; color: var(--text-tertiary);">Rp ${(e.monthly_cost || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
              
              <div style="padding: 12px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; color: white;">TOTAL</span>
                  <span style="font-weight: 800; color: var(--brand-400);">${envData.energySystems.reduce((sum, e) => sum + (e.monthly_kwh || 0), 0).toLocaleString()} kWh/month</span>
                </div>
              </div>
            </div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderWaterTab() {
  return `
    <div id="env-tab-water" class="env-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Water Conservation Tips -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-tint" style="margin-right: 8px; color: var(--success-400);"></i>
            Water Conservation
          </h4>
          
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <ul style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; padding-left: 16px; line-height: 1.8;">
              <li>Low-flow fixtures (hemat 30-50%)</li>
              <li>Rainwater harvesting untuk landscape</li>
              <li>Water-efficient cooling towers</li>
              <li>Leak detection & pipe maintenance</li>
              <li>Greywater recycling untuk toilet flushing</li>
              <li>Smart water metering & monitoring</li>
              <li>Drought-resistant landscape plants</li>
            </ul>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(158, 85%, 45%, 0.1); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--success-400); font-weight: 700; margin-bottom: 8px;">
              <i class="fas fa-chart-line" style="margin-right: 6px;"></i>WATER EFFICIENCY
            </div>
            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
              Standar efisiensi: 100-150 liter/person/day untuk office building.
              Target pengurangan: 20-30% dari baseline.
            </p>
          </div>
        </div>
        
        <!-- Water Usage Records -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-faucet" style="margin-right: 8px; color: var(--success-400);"></i>
              Data Penggunaan Air
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showWaterModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${envData.waterUsage.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data penggunaan air.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
              ${envData.waterUsage.map(w => `
                <div class="card-quartz" style="padding: 12px; background: hsla(220, 20%, 100%, 0.03);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <div style="font-weight: 700; color: white;">${w.usage_type || 'Penggunaan'}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${w.location || ''}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: 800; color: var(--success-400);">${w.monthly_m3 || 0} m³</div>
                      <div style="font-size: 0.65rem; color: var(--text-tertiary);">Rp ${(w.monthly_cost || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  ${w.is_recycled ? `
                    <div style="margin-top: 8px;">
                      <span class="badge" style="background: hsla(158, 85%, 45%, 0.1); color: var(--success-400); font-size: 9px;">
                        <i class="fas fa-recycle" style="margin-right: 4px;"></i>Recycled Water
                      </span>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
              
              <div style="padding: 12px; background: hsla(158, 85%, 45%, 0.1); border-radius: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; color: white;">TOTAL</span>
                  <span style="font-weight: 800; color: var(--success-400);">${envData.waterUsage.reduce((sum, w) => sum + (w.monthly_m3 || 0), 0).toFixed(1)} m³/month</span>
                </div>
              </div>
            </div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderWasteTab() {
  return `
    <div id="env-tab-waste" class="env-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Waste Management Hierarchy -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-recycle" style="margin-right: 8px; color: var(--brand-400);"></i>
            Waste Hierarchy (5R)
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 12px; background: hsla(158, 85%, 45%, 0.1); border-radius: 8px; border-left: 3px solid var(--success-400);">
              <div style="font-weight: 700; color: var(--success-400);">1. REFUSE</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Menolak produk yang tidak perlu</div>
            </div>
            <div style="padding: 12px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px; border-left: 3px solid var(--brand-400);">
              <div style="font-weight: 700; color: var(--brand-400);">2. REDUCE</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Minimalkan penggunaan material</div>
            </div>
            <div style="padding: 12px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px; border-left: 3px solid var(--gold-400);">
              <div style="font-weight: 700; color: var(--gold-400);">3. REUSE</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Gunakan kembali barang</div>
            </div>
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border-left: 3px solid var(--text-tertiary);">
              <div style="font-weight: 700; color: var(--text-tertiary);">4. RECYCLE</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Daur ulang material</div>
            </div>
            <div style="padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; border-left: 3px solid var(--danger-400);">
              <div style="font-weight: 700; color: var(--danger-400);">5. DISPOSAL</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Pembuangan akhir (terakhir)</div>
            </div>
          </div>
        </div>
        
        <!-- Waste Records -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-dumpster" style="margin-right: 8px; color: var(--danger-400);"></i>
              Data Limbah
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showWasteModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${envData.wasteRecords.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data limbah.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
              ${envData.wasteRecords.map(w => `
                <div class="card-quartz" style="padding: 12px; background: hsla(220, 20%, 100%, 0.03);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <div style="font-weight: 700; color: white;">${w.waste_type || 'Limbah'}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${w.collection_method || 'Campuran'}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: 800; color: var(--danger-400);">${w.amount_kg || 0} kg</div>
                      <div style="font-size: 0.65rem; color: var(--text-tertiary);">${w.disposal_method || 'TPS'}</div>
                    </div>
                  </div>
                  <div style="margin-top: 8px; display: flex; gap: 8px;">
                    ${w.is_recycled ? `
                      <span class="badge" style="background: hsla(158, 85%, 45%, 0.1); color: var(--success-400); font-size: 9px;">
                        <i class="fas fa-recycle" style="margin-right: 4px;"></i>Recycled
                      </span>
                    ` : ''}
                    ${w.is_hazardous ? `
                      <span class="badge" style="background: hsla(0, 85%, 60%, 0.1); color: var(--danger-400); font-size: 9px;">
                        <i class="fas fa-exclamation-triangle" style="margin-right: 4px;"></i>B3
                      </span>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
              
              <div style="padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; color: white;">TOTAL</span>
                  <span style="font-weight: 800; color: var(--danger-400);">${envData.wasteRecords.reduce((sum, w) => sum + (w.amount_kg || 0), 0).toFixed(0)} kg/month</span>
                </div>
              </div>
            </div>`
          }
        </div>
      </div>
    </div>
  `;
}


// ============================================================
// MODALS
// ============================================================

function renderModals() {
  return `;
}

// ============================================================
// STYLES
// ============================================================

function getEnvStyles() {
  return `;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function initEventListeners() {
  // Tab switching
  window._switchEnvTab = (tabId, btn) => {
    currentTab = tabId;
    document.querySelectorAll('.env-tab-item').forEach(item => {
      item.classList.remove('active');
      item.style.background = 'transparent';
      item.style.color = 'var(--text-tertiary)';
      item.style.boxShadow = 'none';
    });
    if (btn) {
      btn.classList.add('active');
      btn.style.background = 'var(--gradient-brand)';
      btn.style.color = 'white';
      btn.style.boxShadow = 'var(--shadow-sapphire)';
    }
    renderCurrentTab();
  };
  
  // Modal functions
  window.showAirQualityModal = () => { document.getElementById('air-modal').style.display = 'flex'; };
  window.showEnergyModal = () => { document.getElementById('energy-modal').style.display = 'flex'; };
  window.showWaterModal = () => { document.getElementById('water-modal').style.display = 'flex'; };
  window.showWasteModal = () => { document.getElementById('waste-modal').style.display = 'flex'; };
  window.closeModal = (modalId) => { document.getElementById(modalId).style.display = 'none'; };
  
  // Save functions - stub implementations
  window.saveAirQuality = async (e) => { e.preventDefault(); showSuccess('Stub: Air Quality saved'); closeModal('air-modal'); };
  window.saveEnergy = async (e) => { e.preventDefault(); showSuccess('Stub: Energy saved'); closeModal('energy-modal'); };
  window.saveWater = async (e) => { e.preventDefault(); showSuccess('Stub: Water saved'); closeModal('water-modal'); };
  window.saveWaste = async (e) => { e.preventDefault(); showSuccess('Stub: Waste saved'); closeModal('waste-modal'); };
  
  // Calculator functions - stub implementations
  window.calculateOTTV = (e) => { e.preventDefault(); const resultDiv = document.getElementById('ottv-result'); if(resultDiv) { resultDiv.innerHTML = '<div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">OTTV calculation stub</div>'; resultDiv.style.display = 'block'; } };
  window.calculateEPI = (e) => { e.preventDefault(); const resultDiv = document.getElementById('epi-result'); if(resultDiv) { resultDiv.innerHTML = '<div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">EPI calculation stub</div>'; resultDiv.style.display = 'block'; } };
  window.calculateIAQ = (e) => { e.preventDefault(); const resultDiv = document.getElementById('iaq-result'); if(resultDiv) { resultDiv.innerHTML = '<div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">IAQ calculation stub</div>'; resultDiv.style.display = 'block'; } };
}

// ============================================================
// WINDOW EXPORTS - Render Functions
// ============================================================

window.renderDashboardTab = renderDashboardTab;
window.renderCurrentTab = renderCurrentTab;
