// ============================================================
// EGRESS SYSTEM INSPECTION - MAIN PAGE
// Pemeriksaan Sistem Egress/Escape SLF
// Integrates: Occupant Load, Egress Capacity, Travel Distance, Exit Components
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let egressData = {
  analysis: null,
  exits: [],
  stairs: [],
  doors: [],
  emergencyLights: [],
  smokeZones: []
};
let currentTab = 'occupant';

// Occupant Load Factors (SNI 03-1736-1989 / NFPA 101)
const OCCUPANT_LOAD_FACTORS = {
  'ASSEMBLY_CONCENTRATED': 0.65,    // m² per person - Teater, auditorium
  'ASSEMBLY_UNCONCENTRATED': 1.4,     // m² per person - Tempat ibadah, museum
  'EDUCATION': 1.9,                  // m² per person - Sekolah
  'DAYCARE': 3.7,                    // m² per person - Daycare
  'HEALTHCARE_SLEEPING': 11.1,       // m² per person - Rumah sakit (inpatient)
  'HEALTHCARE_OUTPATIENT': 1.4,      // m² per person - Klinik
  'HOTEL': 18.6,                     // m² per person - Hotel
  'APARTMENT': 18.6,                 // m² per person - Apartemen
  'DORMITORY': 18.6,                 // m² per person - Asrama
  'JAIL': 11.1,                      // m² per person - Penjara
  'MERCHANDISING': 2.8,              // m² per person - Retail, toko
  'BUSINESS': 9.3,                   // m² per person - Kantor
  'INDUSTRIAL': 9.3,                 // m² per person - Industri
  'STORAGE': 46.5,                   // m² per person - Gudang
  'LIBRARY_STACKS': 11.1,            // m² per person - Perpustakaan (stack)
  'LIBRARY_READING': 4.6             // m² per person - Perpustakaan (reading)
};

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function egressInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadEgressData();
  
  return renderPage();
}

export function afterEgressInspectionRender() {
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

async function loadEgressData() {
  try {
    // Load egress analysis
    const { data: analysisData } = await supabase
      .from('egress_analysis')
      .select('*')
      .eq('project_id', currentProjectId)
      .single();
    
    egressData.analysis = analysisData;
    
    // Load egress routes (jalur evakuasi)
    const { data: routesData } = await supabase
      .from('egress_routes')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    egressData.routes = routesData || [];
    
    // Load exit components (stairs, doors, etc)
    const { data: componentsData } = await supabase
      .from('exit_components')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    // Split components by type
    egressData.stairs = (componentsData || []).filter(c => c.component_type === 'STAIR');
    egressData.doors = (componentsData || []).filter(c => c.component_type === 'DOOR');
    egressData.exits = (componentsData || []).filter(c => ['DOOR', 'RAMP', 'CORRIDOR'].includes(c.component_type));
    
    // Load emergency lighting
    const { data: lightsData } = await supabase
      .from('emergency_lighting')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    egressData.emergencyLights = lightsData || [];
    
    // Load smoke zones
    const { data: smokeData } = await supabase
      .from('smoke_zones')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    egressData.smokeZones = smokeData || [];
    
    // Load occupant loads
    const { data: occupantData } = await supabase
      .from('occupant_loads')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    egressData.occupantLoads = occupantData || [];
    
  } catch (e) {
    console.error('Error loading egress data:', e);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="egress-inspection-page" style="padding: var(--space-6); max-width: 1400px; margin: 0 auto;">
      ${renderHeaderCard()}
      <div id="egress-content" class="egress-content">
        <!-- Tab content will be rendered here -->
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getEgressStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="egress-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-door-open" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--brand-400);">PHASE 02B</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Sistem Egress & Evakuasi</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); border: 1px solid hsla(220, 95%, 52%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>SNI 03-1736-1989
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi sistem egress dan evakuasi berdasarkan SNI 03-1736-1989 (Tata Cara Perancangan Sistem Evakuasi). 
        Meliputi occupant load, egress capacity, travel distance, exit components, emergency lighting, dan smoke control.
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchEgressTab('occupant', this)" 
                class="egress-tab-item active"
                data-tab="occupant"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-users"></i> OCCUPANT LOAD
        </button>
        <button onclick="window._switchEgressTab('capacity', this)" 
                class="egress-tab-item"
                data-tab="capacity"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-ruler-combined"></i> EGRESS CAPACITY
        </button>
        <button onclick="window._switchEgressTab('travel', this)" 
                class="egress-tab-item"
                data-tab="travel"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-route"></i> TRAVEL DISTANCE
        </button>
        <button onclick="window._switchEgressTab('exits', this)" 
                class="egress-tab-item"
                data-tab="exits"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-door-open"></i> EXIT COMPONENTS
        </button>
        <button onclick="window._switchEgressTab('lighting', this)" 
                class="egress-tab-item"
                data-tab="lighting"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-lightbulb"></i> EMERGENCY LIGHTING
        </button>
        <button onclick="window._switchEgressTab('smoke', this)" 
                class="egress-tab-item"
                data-tab="smoke"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-wind"></i> SMOKE CONTROL
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('egress-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'occupant':
      contentDiv.innerHTML = renderOccupantTab();
      break;
    case 'capacity':
      contentDiv.innerHTML = renderCapacityTab();
      break;
    case 'travel':
      contentDiv.innerHTML = renderTravelTab();
      break;
    case 'exits':
      contentDiv.innerHTML = renderExitsTab();
      break;
    case 'lighting':
      contentDiv.innerHTML = renderLightingTab();
      break;
    case 'smoke':
      contentDiv.innerHTML = renderSmokeTab();
      break;
  }
}

function renderOccupantTab() {
  const analysis = egressData.analysis;
  
  return `
    <div id="egress-tab-occupant" class="egress-tab-content active">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Occupant Load Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-users" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator Occupant Load
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-1736-1989</span>
          </div>
          
          <form id="occupant-form" onsubmit="calculateOccupantLoad(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Nama Area/Ruang</label>
              <input type="text" id="occ-area-name" class="form-input-dark" placeholder="e.g., Lantai 1 - Office Area" required>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Luas Area (m²)</label>
                <input type="number" id="occ-area-size" class="form-input-dark" placeholder="Contoh: 500" step="0.1" min="1" required>
              </div>
              <div>
                <label class="form-label">Fungsi Ruangan</label>
                <select id="occ-function" class="form-input-dark" required>
                  <option value="ASSEMBLY_CONCENTRATED">Assembly - Concentrated</option>
                  <option value="ASSEMBLY_UNCONCENTRATED">Assembly - Unconcentrated</option>
                  <option value="EDUCATION">Education - Sekolah</option>
                  <option value="DAYCARE">Daycare</option>
                  <option value="HEALTHCARE_SLEEPING">Healthcare - Sleeping</option>
                  <option value="HEALTHCARE_OUTPATIENT">Healthcare - Outpatient</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="APARTMENT">Apartemen</option>
                  <option value="DORMITORY">Dormitory</option>
                  <option value="JAIL">Penjara</option>
                  <option value="MERCHANDISING" selected>Merchandising - Retail</option>
                  <option value="BUSINESS">Business - Kantor</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="STORAGE">Storage - Gudang</option>
                  <option value="LIBRARY_STACKS">Library - Stacks</option>
                  <option value="LIBRARY_READING">Library - Reading</option>
                </select>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Occupant Load Factor</label>
              <input type="number" id="occ-factor" class="form-input-dark" placeholder="2.8" step="0.1" min="0.1" value="2.8" readonly style="background: hsla(220, 20%, 100%, 0.02);">
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                m² per orang (diupdate otomatis berdasarkan fungsi ruangan)
              </p>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung Occupant Load
            </button>
          </form>
          
          <div id="occupant-result" style="margin-top: 20px; ${analysis ? '' : 'display: none;'}">
            ${analysis ? renderOccupantResult(analysis) : ''}
          </div>
        </div>
        
        <!-- Reference Table -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-table" style="margin-right: 8px; color: var(--success-400);"></i>
            Tabel Occupant Load Factor
          </h4>
          
          <div style="max-height: 400px; overflow-y: auto;">
            <table style="width: 100%; font-size: 0.75rem;">
              <thead>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">
                  <th style="text-align: left; padding: 8px; color: var(--text-tertiary);">Fungsi Ruangan</th>
                  <th style="text-align: right; padding: 8px; color: var(--text-tertiary);">m²/orang</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Assembly - Concentrated (Teater)</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">0.65</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Assembly - Unconcentrated</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">1.4</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Education (Sekolah)</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">1.9</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Daycare</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">3.7</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Healthcare - Outpatient</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">1.4</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Healthcare - Sleeping</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">11.1</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Hotel / Apartment</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">18.6</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Merchandising (Retail)</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">2.8</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Business (Kantor)</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">9.3</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Industrial</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">9.3</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: var(--text-secondary);">Storage (Gudang)</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">46.5</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px; border: 1px solid hsla(45, 90%, 60%, 0.2);">
            <div style="font-size: 0.75rem; color: var(--gold-400); font-weight: 700; margin-bottom: 8px;">
              <i class="fas fa-lightbulb" style="margin-right: 6px;"></i>RUMUS
            </div>
            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
              <strong>Occupant Load</strong> = Luas Area (m²) ÷ Occupant Load Factor (m²/orang)
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOccupantResult(analysis) {
  return `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid var(--success-400);">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">OCCUPANT LOAD</div>
        <div style="font-size: 2rem; font-weight: 800; color: var(--success-400);">${Math.ceil(analysis.occupant_count || 0)} orang</div>
      </div>
      <div style="font-size: 0.7rem; color: var(--text-secondary); text-align: center;">
        ${analysis.area_size || 'N/A'} m² ÷ ${analysis.occupant_factor || 'N/A'} m²/orang
      </div>
    </div>
  `;
}

function renderCapacityTab() {
  const analysis = egressData.analysis;
  const totalOccupant = analysis?.occupant_count || 0;
  
  return `
    <div id="egress-tab-capacity" class="egress-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Egress Width Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-ruler-combined" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator Egress Capacity
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-1736-1989</span>
          </div>
          
          <form id="capacity-form" onsubmit="calculateEgressCapacity(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Total Occupant Load (orang)</label>
              <input type="number" id="cap-occupant" class="form-input-dark" placeholder="Contoh: 200" min="1" value="${Math.ceil(totalOccupant)}">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Tipe Bangunan</label>
                <select id="cap-building-type" class="form-input-dark">
                  <option value="SPRINKLERED" selected>Sprinklered (0.55 mm/orang)</option>
                  <option value="NON_SPRINKLERED">Non-Sprinklered (0.75 mm/orang)</option>
                </select>
              </div>
              <div>
                <label class="form-label">Komponen Egress</label>
                <select id="cap-component" class="form-input-dark">
                  <option value="DOOR_CORRIDOR" selected>Pintu/Corridor</option>
                  <option value="STAIR">Tangga</option>
                  <option value="RAMP">Ramp</option>
                  <option value="EXIT">Exit Passageway</option>
                </select>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Lebar Egress Tersedia (mm)</label>
              <input type="number" id="cap-width" class="form-input-dark" placeholder="Contoh: 1200" min="700">
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                Minimum 900mm untuk pintu, 1100mm untuk tangga
              </p>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung Egress Capacity
            </button>
          </form>
          
          <div id="capacity-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Standards Reference -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--success-400);"></i>
            Standar Egress Width (SNI)
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Sprinklered Building</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Required Width = Occupant × 0.55 mm</div>
            </div>
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Non-Sprinklered Building</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Required Width = Occupant × 0.75 mm</div>
            </div>
          </div>
          
          <h5 style="font-weight: 700; color: white; margin-bottom: 12px; font-size: 0.9rem;">Minimum Width Requirements</h5>
          <table style="width: 100%; font-size: 0.7rem;">
            <thead>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">
                <th style="text-align: left; padding: 6px; color: var(--text-tertiary);">Komponen</th>
                <th style="text-align: right; padding: 6px; color: var(--text-tertiary);">Min Width</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                <td style="padding: 6px; color: var(--text-secondary);">Corridor</td>
                <td style="padding: 6px; color: white; text-align: right;">1100 mm</td>
              </tr>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                <td style="padding: 6px; color: var(--text-secondary);">Stair</td>
                <td style="padding: 6px; color: white; text-align: right;">1100 mm</td>
              </tr>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                <td style="padding: 6px; color: var(--text-secondary);">Door</td>
                <td style="padding: 6px; color: white; text-align: right;">900 mm</td>
              </tr>
              <tr>
                <td style="padding: 6px; color: var(--text-secondary);">Accessible Route</td>
                <td style="padding: 6px; color: white; text-align: right;">900 mm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderTravelTab() {
  return `
    <div id="egress-tab-travel" class="egress-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Travel Distance Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-route" style="margin-right: 8px; color: var(--brand-400);"></i>
              Travel Distance Check
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-1736-1989</span>
          </div>
          
          <form id="travel-form" onsubmit="checkTravelDistance(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Jarak Travel Aktual (meter)</label>
              <input type="number" id="travel-actual" class="form-input-dark" placeholder="Contoh: 35" step="0.1" min="0">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Tipe Bangunan</label>
                <select id="travel-sprinkler" class="form-input-dark">
                  <option value="SPRINKLERED">Sprinklered</option>
                  <option value="NON_SPRINKLERED" selected>Non-Sprinklered</option>
                </select>
              </div>
              <div>
                <label class="form-label">Hazard Level</label>
                <select id="travel-hazard" class="form-input-dark">
                  <option value="ORDINARY" selected>Ordinary Hazard</option>
                  <option value="HIGH">High Hazard</option>
                </select>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
              Cek Compliance
            </button>
          </form>
          
          <div id="travel-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Travel Distance Standards -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-ruler-horizontal" style="margin-right: 8px; color: var(--success-400);"></i>
            Maximum Travel Distance (SNI)
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Sprinklered - Ordinary Hazard</div>
              <div style="font-size: 1.2rem; color: var(--success-400); font-weight: 700;">60 meter</div>
            </div>
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Non-Sprinklered - Ordinary Hazard</div>
              <div style="font-size: 1.2rem; color: var(--warning-400); font-weight: 700;">45 meter</div>
            </div>
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">High Hazard (apapun)</div>
              <div style="font-size: 1.2rem; color: var(--danger-400); font-weight: 700;">30 meter</div>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px; border: 1px solid hsla(45, 90%, 60%, 0.2);">
            <div style="font-size: 0.75rem; color: var(--gold-400); font-weight: 700; margin-bottom: 8px;">
              <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i>CATATAN
            </div>
            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
              Travel distance diukur dari titik paling jauh dalam ruangan ke pintu exit terdekat, 
              melewati corridor dan tangga jika ada.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderExitsTab() {
  return `
    <div id="egress-tab-exits" class="egress-tab-content">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-door-open" style="margin-right: 8px; color: var(--brand-400);"></i>
            Exit Components
          </h4>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="showExitModal()">
              <i class="fas fa-plus"></i> Exit
            </button>
            <button class="btn btn-primary btn-sm" onclick="showStairModal()">
              <i class="fas fa-plus"></i> Stair
            </button>
            <button class="btn btn-primary btn-sm" onclick="showDoorModal()">
              <i class="fas fa-plus"></i> Door
            </button>
          </div>
        </div>
        
        <!-- Stairs -->
        <h5 style="font-weight: 700; color: white; margin-bottom: 12px;">
          <i class="fas fa-stairs" style="color: var(--brand-400); margin-right: 6px;"></i>
          Exit Stairs
        </h5>
        ${egressData.stairs.length === 0 ? 
          '<p style="text-align: center; padding: 20px; color: var(--text-tertiary); font-size: 0.8rem;">Belum ada data tangga evakuasi.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            ${egressData.stairs.map(s => `
              <div class="card-quartz" style="padding: 16px; border-left: 3px solid var(--brand-400);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 700; color: white;">${s.code || 'STAIR-' + s.id.slice(0,8)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary);">${s.location || 'Lokasi tidak ditentukan'}</div>
                  </div>
                  <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">
                    ${s.type || 'Enclosed'}
                  </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 0.7rem;">
                  <div><span style="color: var(--text-tertiary);">Width:</span> <span style="color: white;">${s.width_mm || 'N/A'} mm</span></div>
                  <div><span style="color: var(--text-tertiary);">Risers:</span> <span style="color: white;">${s.riser_count || 'N/A'}</span></div>
                  <div><span style="color: var(--text-tertiary);">Riser H:</span> <span style="color: white;">${s.riser_height || 'N/A'} mm</span></div>
                  <div><span style="color: var(--text-tertiary);">Tread:</span> <span style="color: white;">${s.tread_depth || 'N/A'} mm</span></div>
                </div>
              </div>
            `).join('')}
          </div>`
        }
        
        <!-- Exit Doors -->
        <h5 style="font-weight: 700; color: white; margin-bottom: 12px;">
          <i class="fas fa-door-closed" style="color: var(--success-400); margin-right: 6px;"></i>
          Exit Doors
        </h5>
        ${egressData.doors.length === 0 ? 
          '<p style="text-align: center; padding: 20px; color: var(--text-tertiary); font-size: 0.8rem;">Belum ada data pintu exit.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            ${egressData.doors.map(d => `
              <div class="card-quartz" style="padding: 16px; border-left: 3px solid var(--success-400);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 700; color: white;">${d.code || 'DOOR-' + d.id.slice(0,8)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary);">${d.location || 'Lokasi tidak ditentukan'}</div>
                  </div>
                  <span class="badge" style="background: ${d.swing_direction === 'OUTWARD' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${d.swing_direction === 'OUTWARD' ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 9px;">
                    ${d.swing_direction || 'N/A'}
                  </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.7rem;">
                  <div><span style="color: var(--text-tertiary);">Width:</span> <span style="color: white;">${d.width_mm || 'N/A'} mm</span></div>
                  <div><span style="color: var(--text-tertiary);">Height:</span> <span style="color: white;">${d.height_mm || 'N/A'} mm</span></div>
                  <div><span style="color: var(--text-tertiary);">Type:</span> <span style="color: white;">${d.door_type || 'N/A'}</span></div>
                </div>
              </div>
            `).join('')}
          </div>`
        }
        
        <!-- Exit Passageways -->
        <h5 style="font-weight: 700; color: white; margin-bottom: 12px;">
          <i class="fas fa-running" style="color: var(--gold-400); margin-right: 6px;"></i>
          Exit Passageways
        </h5>
        ${egressData.exits.length === 0 ? 
          '<p style="text-align: center; padding: 20px; color: var(--text-tertiary); font-size: 0.8rem;">Belum ada data exit passageway.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px;">
            ${egressData.exits.map(e => `
              <div class="card-quartz" style="padding: 16px; border-left: 3px solid var(--gold-400);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 700; color: white;">${e.code || 'EXIT-' + e.id.slice(0,8)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary);">${e.location || 'Lokasi tidak ditentukan'}</div>
                  </div>
                  <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); font-size: 9px;">
                    ${e.exit_type || 'Horizontal'}
                  </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.7rem;">
                  <div><span style="color: var(--text-tertiary);">Width:</span> <span style="color: white;">${e.width_mm || 'N/A'} mm</span></div>
                  <div><span style="color: var(--text-tertiary);">Length:</span> <span style="color: white;">${e.length_m || 'N/A'} m</span></div>
                  <div><span style="color: var(--text-tertiary);">To:</span> <span style="color: white;">${e.leads_to || 'N/A'}</span></div>
                </div>
              </div>
            `).join('')}
          </div>`
        }
      </div>
      
      <!-- Exit Standards -->
      <div class="card-quartz" style="padding: 20px;">
        <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-book" style="color: var(--success-400); margin-right: 6px;"></i>
          Standar Exit Components (SNI)
        </h5>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Pintu Exit</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Harus swing OUTWARD, min width 900mm</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Tangga</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Riser max 190mm, Tread min 250mm</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Exit Passageway</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Min width 1100mm, 1-hour fire rating</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Jumlah Exit</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Min 2 exits jika occupant > 50 orang</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLightingTab() {
  const lights = egressData.emergencyLights;
  const working = lights.filter(l => l.status === 'WORKING').length;
  const total = lights.length;
  
  return `
    <div id="egress-tab-lighting" class="egress-tab-content">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-lightbulb" style="margin-right: 8px; color: var(--gold-400);"></i>
            Emergency Lighting System
          </h4>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="badge" style="background: ${working === total && total > 0 ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${working === total && total > 0 ? 'var(--success-400)' : 'var(--warning-400)'};">
              ${working}/${total} Working
            </span>
            <button class="btn btn-primary btn-sm" onclick="showLightModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
        </div>
        
        ${lights.length === 0 ? 
          '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data emergency lighting.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px;">
            ${lights.map(l => {
              const isWorking = l.status === 'WORKING';
              return `
                <div class="card-quartz" style="padding: 16px; border-left: 3px solid ${isWorking ? 'var(--success-400)' : 'var(--warning-400)'};">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                      <div style="font-weight: 700; color: white;">${l.code || 'LIGHT-' + l.id.slice(0,8)}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${l.location || 'Lokasi tidak ditentukan'}</div>
                    </div>
                    <span class="badge" style="background: ${isWorking ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${isWorking ? 'var(--success-400)' : 'var(--warning-400)'}; font-size: 9px;">
                      ${l.status || 'UNKNOWN'}
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 0.7rem;">
                    <div><span style="color: var(--text-tertiary);">Type:</span> <span style="color: white;">${l.type || 'Maintained'}</span></div>
                    <div><span style="color: var(--text-tertiary);">Power:</span> <span style="color: white;">${l.power_watt || 'N/A'}W</span></div>
                    <div><span style="color: var(--text-tertiary);">Battery:</span> <span style="color: white;">${l.battery_duration || 'N/A'}h</span></div>
                    <div><span style="color: var(--text-tertiary);">Last Test:</span> <span style="color: white;">${l.last_test ? new Date(l.last_test).toLocaleDateString('id-ID') : 'N/A'}</span></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
        }
      </div>
      
      <!-- Emergency Lighting Standards -->
      <div class="grid-2-col" style="gap: 20px;">
        <div class="card-quartz" style="padding: 20px;">
          <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-book" style="color: var(--success-400); margin-right: 6px;"></i>
            Standar Emergency Lighting (SNI)
          </h5>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Illuminance Level</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Min 1 lux di lantai corridor/tangga</div>
            </div>
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Battery Duration</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Min 90 menit autonomous operation</div>
            </div>
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Placement</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Max 2m dari lantai, setiap perubahan arah</div>
            </div>
          </div>
        </div>
        
        <div class="card-quartz" style="padding: 20px;">
          <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-clipboard-check" style="color: var(--brand-400); margin-right: 6px;"></i>
            Testing Schedule
          </h5>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Daily (Functional)</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Cek indicator lamp menyala</div>
            </div>
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Monthly</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Short duration test (10-30 detik)</div>
            </div>
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Annual</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Full duration test (90 menit)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSmokeTab() {
  return `
    <div id="egress-tab-smoke" class="egress-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Smoke Zone Management -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-wind" style="margin-right: 8px; color: var(--brand-400);"></i>
              Smoke Control Zones
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showSmokeZoneModal()">
              <i class="fas fa-plus"></i> Tambah Zone
            </button>
          </div>
          
          ${egressData.smokeZones.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data smoke control zone.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px;">
              ${egressData.smokeZones.map(z => `
                <div class="card-quartz" style="padding: 16px; border-left: 3px solid var(--brand-400);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                      <div style="font-weight: 700; color: white;">${z.code || 'ZONE-' + z.id.slice(0,8)}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${z.location || 'Lokasi tidak ditentukan'}</div>
                    </div>
                    <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">
                      ${z.control_type || 'Exhaust'}
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.7rem;">
                    <div><span style="color: var(--text-tertiary);">Area:</span> <span style="color: white;">${z.area_m2 || 'N/A'} m²</span></div>
                    <div><span style="color: var(--text-tertiary);">Volume:</span> <span style="color: white;">${z.volume_m3 || 'N/A'} m³</span></div>
                    <div><span style="color: var(--text-tertiary);">ACH:</span> <span style="color: white;">${z.air_changes || 'N/A'}</span></div>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
        
        <!-- Pressurization Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-calculator" style="margin-right: 8px; color: var(--brand-400);"></i>
            Stair Pressurization Calc
          </h4>
          
          <form id="pressurization-form" onsubmit="calculatePressurization(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Volume Stairwell (m³)</label>
                <input type="number" id="stair-volume" class="form-input-dark" placeholder="Contoh: 500" step="1">
              </div>
              <div>
                <label class="form-label">Jumlah Pintu</label>
                <input type="number" id="door-count" class="form-input-dark" placeholder="Contoh: 5" step="1" min="1">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div>
                <label class="form-label">Leakage Factor</label>
                <select id="leakage-factor" class="form-input-dark">
                  <option value="0.5">Tight Construction (0.5)</option>
                  <option value="1.0" selected>Average (1.0)</option>
                  <option value="1.5">Loose Construction (1.5)</option>
                </select>
              </div>
              <div>
                <label class="form-label">Target Pressure (Pa)</label>
                <input type="number" id="target-pressure" class="form-input-dark" value="50" step="5" min="25" max="75">
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung Airflow Requirement
            </button>
          </form>
          
          <div id="pressurization-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Standar Pressurization (SNI)</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              • Target: 50 Pa (all doors closed)<br>
              • Minimum: 25 Pa (all doors open)<br>
              • Maximum: 75 Pa (door opening force)
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// MODALS
// ============================================================

function renderModals() {
  return `
    <!-- Stair Modal -->
    <div id="stair-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-stairs"></i> Tambah Exit Stair</h3>
          <button class="modal-close" onclick="closeModal('stair-modal')">&times;</button>
        </div>
        <form id="stair-form" onsubmit="saveStair(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Kode/ID *</label>
              <input type="text" name="code" required placeholder="e.g., STAIR-A">
            </div>
            <div class="form-group">
              <label>Tipe Stair *</label>
              <select name="type" required>
                <option value="ENCLOSED" selected>Enclosed Stair</option>
                <option value="EXTERIOR">Exterior Exit Stair</option>
                <option value="SMOKE_PROOF">Smoke-proof Tower</option>
              </select>
            </div>
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Core Utama Lt.1-5">
            </div>
            <div class="form-group">
              <label>Lebar (mm) *</label>
              <input type="number" name="width" required min="1100" placeholder="1200">
            </div>
            <div class="form-group">
              <label>Jumlah Riser</label>
              <input type="number" name="riser_count" min="1" placeholder="20">
            </div>
            <div class="form-group">
              <label>Tinggi Riser (mm)</label>
              <input type="number" name="riser_height" max="190" placeholder="175">
            </div>
            <div class="form-group">
              <label>Depth Tread (mm)</label>
              <input type="number" name="tread_depth" min="250" placeholder="280">
            </div>
            <div class="form-group">
              <label>Serves Floors</label>
              <input type="text" name="serves_floors" placeholder="e.g., 1,2,3,4,5">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('stair-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Door Modal -->
    <div id="door-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-door-closed"></i> Tambah Exit Door</h3>
          <button class="modal-close" onclick="closeModal('door-modal')">&times;</button>
        </div>
        <form id="door-form" onsubmit="saveDoor(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Kode/ID *</label>
              <input type="text" name="code" required placeholder="e.g., EXIT-DOOR-01">
            </div>
            <div class="form-group">
              <label>Tipe Door *</label>
              <select name="door_type" required>
                <option value="SINGLE">Single Leaf</option>
                <option value="DOUBLE" selected>Double Leaf</option>
                <option value="REVOLVING">Revolving</option>
                <option value="SLIDING">Sliding</option>
              </select>
            </div>
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Lobby Utama">
            </div>
            <div class="form-group">
              <label>Arah Swing *</label>
              <select name="swing_direction" required>
                <option value="OUTWARD" selected>Outward (Menuju Keluar)</option>
                <option value="INWARD">Inward (Dilarang untuk exit)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Lebar Bukaan (mm) *</label>
              <input type="number" name="width" required min="900" placeholder="1200">
            </div>
            <div class="form-group">
              <label>Tinggi (mm)</label>
              <input type="number" name="height" placeholder="2100">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('door-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Exit Passageway Modal -->
    <div id="exit-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-running"></i> Tambah Exit Passageway</h3>
          <button class="modal-close" onclick="closeModal('exit-modal')">&times;</button>
        </div>
        <form id="exit-form" onsubmit="saveExit(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Kode/ID *</label>
              <input type="text" name="code" required placeholder="e.g., PASS-01">
            </div>
            <div class="form-group">
              <label>Tipe Exit *</label>
              <select name="exit_type" required>
                <option value="HORIZONTAL" selected>Horizontal Exit</option>
                <option value="RAMP">Exit Ramp</option>
                <option value="BRIDGE">Exit Bridge</option>
              </select>
            </div>
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Koridor Menuju Area Safe">
            </div>
            <div class="form-group">
              <label>Mengarah ke *</label>
              <input type="text" name="leads_to" required placeholder="e.g., Area Assembly Point A">
            </div>
            <div class="form-group">
              <label>Lebar (mm) *</label>
              <input type="number" name="width" required min="1100" placeholder="1200">
            </div>
            <div class="form-group">
              <label>Panjang (m)</label>
              <input type="number" name="length" step="0.1" placeholder="15.5">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('exit-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ============================================================
// STYLES
// ============================================================

function getEgressStyles() {
  return `
    .egress-content {
      min-height: 400px;
    }
    
    .egress-tab-content {
      display: none;
    }
    
    .egress-tab-content.active {
      display: block;
      animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .form-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .form-input-dark {
      width: 100%;
      padding: 12px;
      background: hsla(220, 20%, 100%, 0.05);
      border: 1px solid hsla(220, 20%, 100%, 0.1);
      border-radius: 8px;
      color: white;
      font-size: 0.85rem;
      transition: all 0.3s;
    }
    
    .form-input-dark:focus {
      outline: none;
      border-color: var(--brand-400);
      box-shadow: 0 0 0 3px hsla(220, 95%, 52%, 0.1);
    }
    
    .form-check {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
    }
    
    .form-check-input {
      width: 18px;
      height: 18px;
      accent-color: var(--brand-400);
    }
    
    .form-check-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      cursor: pointer;
    }
    
    .grid-2-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    @media (max-width: 768px) {
      .grid-2-col {
        grid-template-columns: 1fr;
      }
    }
    
    /* Modal Styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .modal-content {
      background: hsla(224, 25%, 10%, 0.95);
      border: 1px solid hsla(220, 20%, 100%, 0.1);
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);
    }
    
    .modal-header h3 {
      margin: 0;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: white;
      font-size: 1rem;
    }
    
    .modal-close {
      background: none;
      border: none;
      color: var(--text-tertiary);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.3s;
    }
    
    .modal-close:hover {
      background: hsla(220, 20%, 100%, 0.05);
      color: white;
    }
    
    .modal form {
      padding: 20px;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid hsla(220, 20%, 100%, 0.1);
    }
  `;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function initEventListeners() {
  // Tab switching
  window._switchEgressTab = (tabId, btn) => {
    currentTab = tabId;
    
    document.querySelectorAll('.egress-tab-item').forEach(item => {
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
  
  // Update occupant factor when function changes
  const occFunction = document.getElementById('occ-function');
  if (occFunction) {
    occFunction.addEventListener('change', (e) => {
      const factor = OCCUPANT_LOAD_FACTORS[e.target.value] || 2.8;
      document.getElementById('occ-factor').value = factor;
    });
  }
  
  // Modal functions
  window.showStairModal = () => {
    document.getElementById('stair-modal').style.display = 'flex';
  };
  
  window.showDoorModal = () => {
    document.getElementById('door-modal').style.display = 'flex';
  };
  
  window.showExitModal = () => {
    document.getElementById('exit-modal').style.display = 'flex';
  };
  
  window.showLightModal = () => showInfo('Fitur Emergency Light dalam pengembangan');
  window.showSmokeZoneModal = () => showInfo('Fitur Smoke Zone dalam pengembangan');
  
  window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
  };
  
  // Calculator functions
  window.calculateOccupantLoad = async (e) => {
    e.preventDefault();
    
    const areaName = document.getElementById('occ-area-name').value;
    const areaSize = parseFloat(document.getElementById('occ-area-size').value) || 0;
    const func = document.getElementById('occ-function').value;
    const factor = OCCUPANT_LOAD_FACTORS[func] || 2.8;
    
    const occupantCount = Math.ceil(areaSize / factor);
    
    const data = {
      project_id: currentProjectId,
      area_name: areaName,
      area_size: areaSize,
      function_type: func,
      occupant_factor: factor,
      occupant_count: occupantCount,
      updated_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('egress_analysis').upsert(data);
      egressData.analysis = data;
      
      const resultDiv = document.getElementById('occupant-result');
      resultDiv.innerHTML = renderOccupantResult(data);
      resultDiv.style.display = 'block';
      
      showSuccess(`Occupant Load: ${occupantCount} orang`);
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };
  
  window.calculateEgressCapacity = (e) => {
    e.preventDefault();
    
    const occupant = parseInt(document.getElementById('cap-occupant').value) || 0;
    const buildingType = document.getElementById('cap-building-type').value;
    const component = document.getElementById('cap-component').value;
    const availableWidth = parseInt(document.getElementById('cap-width').value) || 0;
    
    // SNI 03-1736-1989 egress width multiplier
    const multiplier = buildingType === 'SPRINKLERED' ? 0.55 : 0.75;
    const requiredWidth = occupant * multiplier;
    
    // Component minimums
    const minWidths = {
      'DOOR_CORRIDOR': 900,
      'STAIR': 1100,
      'RAMP': 1100,
      'EXIT': 1100
    };
    
    const minRequired = Math.max(requiredWidth, minWidths[component] || 900);
    const isAdequate = availableWidth >= minRequired;
    
    const resultDiv = document.getElementById('capacity-result');
    resultDiv.innerHTML = `
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isAdequate ? 'var(--success-400)' : 'var(--danger-400)'};">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
          <div style="text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Required Width</div>
            <div style="font-size: 1.3rem; font-weight: 700; color: var(--brand-400);">${Math.ceil(requiredWidth)} mm</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Available Width</div>
            <div style="font-size: 1.3rem; font-weight: 700; color: ${isAdequate ? 'var(--success-400)' : 'var(--danger-400)'};">${availableWidth} mm</div>
          </div>
        </div>
        <div style="text-align: center; font-size: 0.8rem; color: ${isAdequate ? 'var(--success-400)' : 'var(--danger-400)'};">
          ${isAdequate ? '✓ Memenuhi persyaratan SNI' : '✗ Tidak memenuhi persyaratan'}
        </div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary); text-align: center; margin-top: 8px;">
          Minimum untuk ${component}: ${minWidths[component] || 900} mm
        </div>
      </div>
    `;
    resultDiv.style.display = 'block';
  };
  
  window.checkTravelDistance = (e) => {
    e.preventDefault();
    
    const actual = parseFloat(document.getElementById('travel-actual').value) || 0;
    const sprinkler = document.getElementById('travel-sprinkler').value;
    const hazard = document.getElementById('travel-hazard').value;
    
    // Determine max allowed
    let maxAllowed = 45;
    if (hazard === 'HIGH') {
      maxAllowed = 30;
    } else if (sprinkler === 'SPRINKLERED') {
      maxAllowed = 60;
    }
    
    const isCompliant = actual <= maxAllowed;
    const remaining = maxAllowed - actual;
    
    const resultDiv = document.getElementById('travel-result');
    resultDiv.innerHTML = `
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">STATUS COMPLIANCE</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">
            ${isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
          <div>
            <div style="color: var(--text-tertiary);">Actual</div>
            <div style="color: white; font-weight: 600;">${actual} m</div>
          </div>
          <div>
            <div style="color: var(--text-tertiary);">Max Allowed</div>
            <div style="color: white; font-weight: 600;">${maxAllowed} m</div>
          </div>
          <div>
            <div style="color: var(--text-tertiary);">Margin</div>
            <div style="color: ${remaining >= 0 ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 600;">${remaining.toFixed(1)} m</div>
          </div>
        </div>
      </div>
    `;
    resultDiv.style.display = 'block';
  };
  
  window.calculatePressurization = (e) => {
    e.preventDefault();
    
    const volume = parseFloat(document.getElementById('stair-volume').value) || 0;
    const doorCount = parseInt(document.getElementById('door-count').value) || 0;
    const leakage = parseFloat(document.getElementById('leakage-factor').value) || 1.0;
    const targetPressure = parseInt(document.getElementById('target-pressure').value) || 50;
    
    // Simplified pressurization calculation
    // Airflow required = (Volume × ACH) / 60 + (Door leakage × pressure differential)
    const ach = 20; // Air changes per hour for pressurization
    const baseFlow = (volume * ach) / 60; // m³/min
    const doorLeakage = doorCount * 0.5 * (targetPressure / 50) * leakage; // m³/min
    const totalFlow = baseFlow + doorLeakage;
    
    const resultDiv = document.getElementById('pressurization-result');
    resultDiv.innerHTML = `
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid var(--success-400);">
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">REQUIRED AIRFLOW</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-400);">${totalFlow.toFixed(1)} m³/min</div>
          <div style="font-size: 1rem; color: var(--text-secondary);">${(totalFlow * 60).toFixed(0)} m³/h</div>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary); text-align: center;">
          Base: ${baseFlow.toFixed(1)} m³/min | Door Leakage: ${doorLeakage.toFixed(1)} m³/min
        </div>
      </div>
    `;
    resultDiv.style.display = 'block';
  };
  
  // Save functions
  window.saveStair = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const data = {
      project_id: currentProjectId,
      code: form.code.value,
      type: form.type.value,
      location: form.location.value,
      width_mm: parseInt(form.width.value),
      riser_count: parseInt(form.riser_count.value) || null,
      riser_height: parseInt(form.riser_height.value) || null,
      tread_depth: parseInt(form.tread_depth.value) || null,
      serves_floors: form.serves_floors.value || null,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('egress_stairs').insert(data);
      await loadEgressData();
      renderCurrentTab();
      closeModal('stair-modal');
      form.reset();
      showSuccess('Data stair berhasil disimpan');
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };
  
  window.saveDoor = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const data = {
      project_id: currentProjectId,
      code: form.code.value,
      door_type: form.door_type.value,
      location: form.location.value,
      swing_direction: form.swing_direction.value,
      width_mm: parseInt(form.width.value),
      height_mm: parseInt(form.height.value) || null,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('egress_doors').insert(data);
      await loadEgressData();
      renderCurrentTab();
      closeModal('door-modal');
      form.reset();
      showSuccess('Data door berhasil disimpan');
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };
  
  window.saveExit = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const data = {
      project_id: currentProjectId,
      code: form.code.value,
      exit_type: form.exit_type.value,
      location: form.location.value,
      leads_to: form.leads_to.value,
      width_mm: parseInt(form.width.value),
      length_m: parseFloat(form.length.value) || null,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('egress_exits').insert(data);
      await loadEgressData();
      renderCurrentTab();
      closeModal('exit-modal');
      form.reset();
      showSuccess('Data exit passageway berhasil disimpan');
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };
}
