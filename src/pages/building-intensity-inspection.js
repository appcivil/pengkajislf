// ============================================================
// BUILDING INTENSITY INSPECTION - MAIN PAGE
// Pemeriksaan Intensitas Bangunan SLF
// Integrates: KDB, KLB, HSB, GSB Calculations
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let intensityData = {
  summary: null,
  floors: [],
  setbacks: []
};
let currentTab = 'dashboard';

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function buildingIntensityInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadIntensityData();
  
  return renderPage();
}

export function afterBuildingIntensityInspectionRender() {
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
      .select('id, nama_bangunan, alamat, luas_tanah, luas_bangunan, jumlah_lantai, tinggi_bangunan, fungsi_bangunan')
      .eq('id', currentProjectId)
      .single();
    
    if (data) {
      currentProjectName = data.nama_bangunan;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadIntensityData() {
  try {
    // Load summary from view
    const { data: summaryData } = await supabase
      .from('building_intensity_summary')
      .select('*')
      .eq('project_id', currentProjectId)
      .single();
    
    intensityData.summary = summaryData;
    
    // Load room schedule data (as floor data)
    const { data: roomsData } = await supabase
      .from('building_room_schedules')
      .select('*')
      .eq('assessment_id', summaryData?.assessment_id)
      .order('floor_level', { ascending: true });
    
    // Group rooms by floor level
    const floorsMap = new Map();
    (roomsData || []).forEach(room => {
      const floorNum = room.floor_level || 1;
      if (!floorsMap.has(floorNum)) {
        floorsMap.set(floorNum, {
          floor_number: floorNum,
          floor_name: `Lantai ${floorNum}`,
          area_m2: 0,
          rooms: []
        });
      }
      const floor = floorsMap.get(floorNum);
      floor.area_m2 += (room.room_area || 0);
      floor.rooms.push(room);
    });
    intensityData.floors = Array.from(floorsMap.values());
    
    // Load setback data from assessment
    const { data: assessmentData } = await supabase
      .from('building_intensity_assessments')
      .select('setback_data, id')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Parse setback_data JSONB or use empty array
    const setbackData = assessmentData?.setback_data || {};
    intensityData.setbacks = Object.entries(setbackData).map(([key, value]) => ({
      side: key,
      distance: value
    })) || [];
    
  } catch (e) {
    console.error('Error loading building intensity data:', e);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="intensity-inspection-page" style="padding: var(--space-6); max-width: 1400px; margin: 0 auto;">
      ${renderHeaderCard()}
      <div id="intensity-content" class="intensity-content">
        <!-- Tab content will be rendered here -->
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getIntensityStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="intensity-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-building" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--success-400);">PHASE 02A</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Intensitas Bangunan</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(158, 85%, 45%, 0.1); color: var(--success-400); border: 1px solid hsla(158, 85%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>Perda / KDBK
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi intensitas bangunan berdasarkan peraturan daerah tentang KDB (Koefisien Dasar Bangunan), 
        KLB (Koefisien Lantai Bangunan), HSB (Height Storey Building), dan GSB (Garis Sempadan Bangunan).
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchIntensityTab('dashboard', this)" 
                class="intensity-tab-item active"
                data-tab="dashboard"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-tachometer-alt"></i> DASHBOARD
        </button>
        <button onclick="window._switchIntensityTab('kdb', this)" 
                class="intensity-tab-item"
                data-tab="kdb"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-chart-pie"></i> KDB
        </button>
        <button onclick="window._switchIntensityTab('klb', this)" 
                class="intensity-tab-item"
                data-tab="klb"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-layer-group"></i> KLB
        </button>
        <button onclick="window._switchIntensityTab('hsb', this)" 
                class="intensity-tab-item"
                data-tab="hsb"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-ruler-vertical"></i> HSB
        </button>
        <button onclick="window._switchIntensityTab('gsb', this)" 
                class="intensity-tab-item"
                data-tab="gsb"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-ruler-horizontal"></i> GSB
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('intensity-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'dashboard':
      contentDiv.innerHTML = renderDashboardTab();
      break;
    case 'kdb':
      contentDiv.innerHTML = renderKdbTab();
      break;
    case 'klb':
      contentDiv.innerHTML = renderKlbTab();
      break;
    case 'hsb':
      contentDiv.innerHTML = renderHsbTab();
      break;
    case 'gsb':
      contentDiv.innerHTML = renderGsbTab();
      break;
  }
}

function renderDashboardTab() {
  const summary = intensityData.summary || {};
  const kdb = summary.kdb_actual || 0;
  const klb = summary.klb_actual || 0;
  const hsb = summary.hsb_actual || 0;
  const kdbMax = summary.kdb_max || 60; // Default max KDB
  const klbMax = summary.klb_max || 2.8; // Default max KLB
  const hsbMax = summary.hsb_max || 0; // Depends on zone
  
  const kdbStatus = kdb <= kdbMax ? 'COMPLIANT' : 'NON-COMPLIANT';
  const klbStatus = klb <= klbMax ? 'COMPLIANT' : 'NON-COMPLIANT';
  
  return `
    <div id="intensity-tab-dashboard" class="intensity-tab-content active">
      <!-- Summary Cards -->
      <div class="grid-4-col" style="gap: 16px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-chart-pie" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: ${kdbStatus === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-bottom: 4px;">${kdb.toFixed(2)}%</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">KDB (Koefisien Dasar)</div>
          <div style="font-size: 0.65rem; color: ${kdbStatus === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 4px;">${kdbStatus}</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-layer-group" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: ${klbStatus === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-bottom: 4px;">${klb.toFixed(2)}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">KLB (Koefisien Lantai)</div>
          <div style="font-size: 0.65rem; color: ${klbStatus === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 4px;">${klbStatus}</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-ruler-vertical" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${hsb.toFixed(1)}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">HSB (Jumlah Lantai)</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">Max: ${hsbMax > 0 ? hsbMax : 'Sesuai Zona'}</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-ruler-horizontal" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${intensityData.setbacks.length}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">GSB Checkpoints</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">Jarak ke batas</div>
        </div>
      </div>
      
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Quick Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-calculator" style="margin-right: 8px; color: var(--brand-400);"></i>
            Kalkulator Cepat
          </h4>
          
          <form id="quick-calc-form" onsubmit="calculateQuickIntensity(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Luas Tanah (m²)</label>
                <input type="number" id="quick-land-area" class="form-input-dark" placeholder="Contoh: 500" step="0.1" min="1">
              </div>
              <div>
                <label class="form-label">Luas Bangunan (m²)</label>
                <input type="number" id="quick-building-area" class="form-input-dark" placeholder="Contoh: 300" step="0.1" min="1">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div>
                <label class="form-label">Total Luas Lantai (m²)</label>
                <input type="number" id="quick-total-floor" class="form-input-dark" placeholder="Contoh: 1200" step="0.1" min="1">
              </div>
              <div>
                <label class="form-label">Jumlah Lantai</label>
                <input type="number" id="quick-floors" class="form-input-dark" placeholder="Contoh: 4" step="1" min="1">
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung Intensitas
            </button>
          </form>
          
          <div id="quick-calc-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Formula Reference -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-book" style="margin-right: 8px; color: var(--success-400);"></i>
            Rumus Perhitungan
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">KDB (Koefisien Dasar Bangunan)</div>
              <div style="font-size: 0.9rem; color: var(--brand-400); font-weight: 700; font-family: var(--font-mono);">
                KDB = (Luas Bangunan / Luas Tanah) × 100%
              </div>
              <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 8px;">
                Menunjukkan persentase tanah yang dibangun
              </div>
            </div>
            
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">KLB (Koefisien Lantai Bangunan)</div>
              <div style="font-size: 0.9rem; color: var(--brand-400); font-weight: 700; font-family: var(--font-mono);">
                KLB = Total Luas Lantai / Luas Tanah
              </div>
              <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 8px;">
                Menunjukkan intensitas penggunaan lahan
              </div>
            </div>
            
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">HSB (Height Storey Building)</div>
              <div style="font-size: 0.9rem; color: var(--brand-400); font-weight: 700; font-family: var(--font-mono);">
                HSB = Jumlah Lantai Bangunan
              </div>
              <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 8px;">
                Diukur dari jumlah lantai struktural
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderKdbTab() {
  return `
    <div id="intensity-tab-kdb" class="intensity-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- KDB Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-chart-pie" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator KDB
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">Perda KDBK</span>
          </div>
          
          <form id="kdb-form" onsubmit="calculateKDB(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Luas Tanah (m²)</label>
              <input type="number" id="kdb-land" class="form-input-dark" placeholder="Contoh: 500" step="0.1" min="1" required>
            </div>
            
            <div style="margin-bottom: 16px;">
              <label class="form-label">Luas Bangunan (m²)</label>
              <input type="number" id="kdb-building" class="form-input-dark" placeholder="Contoh: 300" step="0.1" min="1" required>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">KDB Maksimum Diizinkan (%)</label>
              <input type="number" id="kdb-max" class="form-input-dark" placeholder="Contoh: 60" step="1" min="1" max="100" value="60">
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                Sesuai zona dan fungsi bangunan (typical: 40-80%)
              </p>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung KDB
            </button>
          </form>
          
          <div id="kdb-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- KDB Standards -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--success-400);"></i>
            Standar KDB (KDBK)
          </h4>
          
          <div style="max-height: 400px; overflow-y: auto;">
            <table style="width: 100%; font-size: 0.75rem;">
              <thead>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">
                  <th style="text-align: left; padding: 8px; color: var(--text-tertiary);">Zona / Fungsi</th>
                  <th style="text-align: right; padding: 8px; color: var(--text-tertiary);">Max KDB</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Perumahan (KDBK Rendah)</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">40-60%</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Campuran / Perkantoran</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">60-80%</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Komersial / CBD</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">80-100%</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 8px; color: var(--text-secondary);">Industri</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">50-70%</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: var(--text-secondary);">Ruang Terbuka Hijau</td>
                  <td style="padding: 8px; color: white; text-align: right; font-weight: 600;">10-20%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px; border: 1px solid hsla(45, 90%, 60%, 0.2);">
            <div style="font-size: 0.75rem; color: var(--gold-400); font-weight: 700; margin-bottom: 8px;">
              <i class="fas fa-lightbulb" style="margin-right: 6px;"></i>CATATAN
            </div>
            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
              KDB dihitung dari luas footprint bangunan dibagi luas total tanah. 
              Zona dan ketentuan spesifik mengacu pada Perda KDBK masing-masing daerah.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderKlbTab() {
  return `
    <div id="intensity-tab-klb" class="intensity-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- KLB Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-layer-group" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator KLB
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">Perda KDBK</span>
          </div>
          
          <form id="klb-form" onsubmit="calculateKLB(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Luas Tanah (m²)</label>
              <input type="number" id="klb-land" class="form-input-dark" placeholder="Contoh: 500" step="0.1" min="1" required>
            </div>
            
            <div style="margin-bottom: 16px;">
              <label class="form-label">Total Luas Lantai (m²)</label>
              <input type="number" id="klb-total-floor" class="form-input-dark" placeholder="Contoh: 1500" step="0.1" min="1" required>
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                Jumlahkan semua luas lantai dari basement sampai atap
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">KLB Maksimum Diizinkan</label>
              <input type="number" id="klb-max" class="form-input-dark" placeholder="Contoh: 2.8" step="0.1" min="0.1" value="2.8">
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                Sesuai zona (typical: 1.0 - 5.0)
              </p>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung KLB
            </button>
          </form>
          
          <div id="klb-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Floor Data Management -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-list-ol" style="margin-right: 8px; color: var(--success-400);"></i>
              Data Lantai
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showFloorModal()">
              <i class="fas fa-plus"></i> Tambah Lantai
            </button>
          </div>
          
          ${intensityData.floors.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data lantai. Tambahkan untuk menghitung total luas.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto;">
              ${intensityData.floors.map(f => `
                <div class="card-quartz" style="padding: 12px; background: hsla(220, 20%, 100%, 0.03);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-weight: 700; color: white;">Lantai ${f.floor_number} ${f.floor_name ? '- ' + f.floor_name : ''}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${f.function || 'Tidak ditentukan'}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: 700; color: var(--brand-400);">${f.area_m2 || 0} m²</div>
                      <div style="font-size: 0.65rem; color: var(--text-tertiary);">Height: ${f.height_m || 0}m</div>
                    </div>
                  </div>
                </div>
              `).join('')}
              <div style="padding: 12px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; color: white;">TOTAL LUAS LANTAI</span>
                  <span style="font-weight: 800; color: var(--brand-400); font-size: 1.2rem;">
                    ${intensityData.floors.reduce((sum, f) => sum + (f.area_m2 || 0), 0)} m²
                  </span>
                </div>
              </div>
            </div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderHsbTab() {
  return `
    <div id="intensity-tab-hsb" class="intensity-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- HSB Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-ruler-vertical" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator HSB
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">Perda KDBK</span>
          </div>
          
          <form id="hsb-form" onsubmit="calculateHSB(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Jumlah Lantai Aktual</label>
              <input type="number" id="hsb-floors" class="form-input-dark" placeholder="Contoh: 5" step="1" min="1" required>
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                Termasuk basement dan mezzanine jika ada
              </p>
            </div>
            
            <div style="margin-bottom: 16px;">
              <label class="form-label">Tinggi Bangunan (m)</label>
              <input type="number" id="hsb-height" class="form-input-dark" placeholder="Contoh: 21.5" step="0.1" min="1">
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Zona / Ketentuan</label>
              <select id="hsb-zone" class="form-input-dark">
                <option value="PERMUKIMAN">Permukiman (max 3-4 lantai)</option>
                <option value="CAMPURAN" selected>Campuran (max 4-8 lantai)</option>
                <option value="KOMERSIAL">Komersial/CBD (max 8-20+ lantai)</option>
                <option value="INDUSTRI">Industri (max 2-4 lantai)</option>
              </select>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">HSB Maksimum Diizinkan</label>
              <input type="number" id="hsb-max" class="form-input-dark" placeholder="Contoh: 8" step="1" min="1" value="8">
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Cek Compliance HSB
            </button>
          </form>
          
          <div id="hsb-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- HSB Standards -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--success-400);"></i>
            Standar HSB (KDBK)
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Zona Permukiman</div>
              <div style="font-size: 1rem; color: white; font-weight: 700;">Max 3-4 Lantai</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Tinggi max: 12-15 meter</div>
            </div>
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Zona Campuran</div>
              <div style="font-size: 1rem; color: white; font-weight: 700;">Max 4-8 Lantai</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Tinggi max: 15-30 meter</div>
            </div>
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Zona Komersial/CBD</div>
              <div style="font-size: 1rem; color: white; font-weight: 700;">Max 8-20+ Lantai</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Tinggi sesuai rencana detail</div>
            </div>
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Zona Industri</div>
              <div style="font-size: 1rem; color: white; font-weight: 700;">Max 2-4 Lantai</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">Tinggi max: 12-20 meter</div>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">
              <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i>PERHITUNGAN
            </div>
            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
              HSB = Jumlah lantai struktural bangunan.<br>
              Basement dihitung jika digunakan sebagai ruangan.<br>
              Mezzanine dihitung sebagai 0.5 lantai.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGsbTab() {
  return `
    <div id="intensity-tab-gsb" class="intensity-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- GSB Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-ruler-horizontal" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator GSB
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">Perda KDBK</span>
          </div>
          
          <form id="gsb-form" onsubmit="calculateGSB(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Sisi / Arah</label>
              <select id="gsb-side" class="form-input-dark">
                <option value="DEPAN">Depan (Front)</option>
                <option value="BELAKANG">Belakang (Rear)</option>
                <option value="SAMPING_KIRI">Samping Kiri</option>
                <option value="SAMPING_KANAN">Samping Kanan</option>
              </select>
            </div>
            
            <div style="margin-bottom: 16px;">
              <label class="form-label">Jarak GSB Wajib (m)</label>
              <input type="number" id="gsb-required" class="form-input-dark" placeholder="Contoh: 5" step="0.1" min="0" required>
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                Sesuai lebar jalan / ketentuan daerah
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Jarak Aktual Bangunan (m)</label>
              <input type="number" id="gsb-actual" class="form-input-dark" placeholder="Contoh: 6.5" step="0.1" min="0" required>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Cek Compliance GSB
            </button>
          </form>
          
          <div id="gsb-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- GSB Data & Standards -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-map-marked-alt" style="margin-right: 8px; color: var(--success-400);"></i>
              Data GSB
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showGsbCheckpointModal()">
              <i class="fas fa-plus"></i> Tambah Checkpoint
            </button>
          </div>
          
          ${intensityData.setbacks.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data GSB. Tambahkan checkpoint pengukuran.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 250px; overflow-y: auto;">
              ${intensityData.setbacks.map(s => {
                const isCompliant = s.actual_distance >= s.required_distance;
                return `
                  <div class="card-quartz" style="padding: 12px; border-left: 3px solid ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; background: hsla(220, 20%, 100%, 0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-weight: 700; color: white;">${s.side || 'Sisi'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${s.location_note || ''}</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 700; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">
                          ${s.actual_distance || 0}m / ${s.required_distance || 0}m
                        </div>
                        <div style="font-size: 0.65rem; color: var(--text-tertiary);">
                          ${isCompliant ? '✓ Compliant' : '✗ Non-compliant'}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
          }
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">
              <i class="fas fa-road" style="margin-right: 6px;"></i>GSB Berdasarkan Lebar Jalan
            </div>
            <table style="width: 100%; font-size: 0.7rem;">
              <tbody>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 6px; color: var(--text-secondary);">Jalan &lt; 8m</td>
                  <td style="padding: 6px; color: white; text-align: right;">3.0 - 4.5 m</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 6px; color: var(--text-secondary);">Jalan 8-15m</td>
                  <td style="padding: 6px; color: white; text-align: right;">4.5 - 6.0 m</td>
                </tr>
                <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                  <td style="padding: 6px; color: var(--text-secondary);">Jalan 15-30m</td>
                  <td style="padding: 6px; color: white; text-align: right;">6.0 - 10.0 m</td>
                </tr>
                <tr>
                  <td style="padding: 6px; color: var(--text-secondary);">Jalan &gt; 30m</td>
                  <td style="padding: 6px; color: white; text-align: right;">10.0 - 15.0 m</td>
                </tr>
              </tbody>
            </table>
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
    <!-- Floor Modal -->
    <div id="floor-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-layer-group"></i> Tambah Data Lantai</h3>
          <button class="modal-close" onclick="closeModal('floor-modal')">&times;</button>
        </div>
        <form id="floor-form" onsubmit="saveFloor(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Nomor Lantai *</label>
              <input type="number" name="floor_number" required min="-5" placeholder="e.g., 1 (Basement: -1)">
            </div>
            <div class="form-group">
              <label>Nama Lantai</label>
              <input type="text" name="floor_name" placeholder="e.g., Ground Floor">
            </div>
            <div class="form-group">
              <label>Luas Lantai (m²) *</label>
              <input type="number" name="area_m2" required step="0.1" min="1" placeholder="e.g., 250">
            </div>
            <div class="form-group">
              <label>Tinggi Lantai (m)</label>
              <input type="number" name="height_m" step="0.1" placeholder="e.g., 4.2">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Fungsi Lantai</label>
              <select name="function">
                <option value="PARKING">Parking / Basement</option>
                <option value="LOBBY" selected>Lobby / Foyer</option>
                <option value="OFFICE">Office / Workspace</option>
                <option value="RETAIL">Retail / Commercial</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="MECHANICAL">Mechanical / Service</option>
                <option value="ROOF">Roof / Mechanical Roof</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('floor-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- GSB Checkpoint Modal -->
    <div id="gsb-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-map-marker-alt"></i> Tambah GSB Checkpoint</h3>
          <button class="modal-close" onclick="closeModal('gsb-modal')">&times;</button>
        </div>
        <form id="gsb-form-save" onsubmit="saveGsbCheckpoint(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Sisi / Arah *</label>
              <select name="side" required>
                <option value="DEPAN" selected>Depan (Front)</option>
                <option value="BELAKANG">Belakang (Rear)</option>
                <option value="SAMPING_KIRI">Samping Kiri</option>
                <option value="SAMPING_KANAN">Samping Kanan</option>
              </select>
            </div>
            <div class="form-group">
              <label>Jarak GSB Wajib (m) *</label>
              <input type="number" name="required_distance" required step="0.1" min="0" placeholder="e.g., 5.0">
            </div>
            <div class="form-group">
              <label>Jarak Aktual (m) *</label>
              <input type="number" name="actual_distance" required step="0.1" min="0" placeholder="e.g., 6.5">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Keterangan Lokasi</label>
              <input type="text" name="location_note" placeholder="e.g., Titik A - dekat gerbang utama">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('gsb-modal')">Batal</button>
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

function getIntensityStyles() {
  return `
    .intensity-content {
      min-height: 400px;
    }
    
    .intensity-tab-content {
      display: none;
    }
    
    .intensity-tab-content.active {
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
    
    .grid-2-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .grid-4-col {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    @media (max-width: 1024px) {
      .grid-4-col {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .grid-2-col, .grid-4-col {
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
// EVENT HANDLERS & TAB FUNCTIONS
// ============================================================

function _switchIntensityTab(tabId, btn) {
  currentTab = tabId;
  
  document.querySelectorAll('.intensity-tab-item').forEach(item => {
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
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

function showFloorModal() {
  const modal = document.getElementById('floor-modal');
  if (modal) modal.style.display = 'flex';
}

function showGsbModal() {
  const modal = document.getElementById('gsb-modal');
  if (modal) modal.style.display = 'flex';
}

function calculateQuickIntensity(e) {
  e.preventDefault();
  
  const landArea = parseFloat(document.getElementById('quick-land-area').value) || 0;
  const buildingArea = parseFloat(document.getElementById('quick-building-area').value) || 0;
  const totalFloor = parseFloat(document.getElementById('quick-total-floor').value) || 0;
  const floors = parseInt(document.getElementById('quick-floors').value) || 0;
  
  const kdb = landArea > 0 ? (buildingArea / landArea) * 100 : 0;
  const klb = landArea > 0 ? totalFloor / landArea : 0;
  
  const resultDiv = document.getElementById('quick-calc-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid var(--success-400);">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">KDB</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--brand-400);">${kdb.toFixed(2)}%</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">KLB</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--brand-400);">${klb.toFixed(2)}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">HSB</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--brand-400);">${floors}</div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

function calculateKDB(e) {
  e.preventDefault();
  
  const landArea = parseFloat(document.getElementById('kdb-land').value) || 0;
  const buildingArea = parseFloat(document.getElementById('kdb-building').value) || 0;
  const maxKdb = parseFloat(document.getElementById('kdb-max').value) || 60;
  
  const kdb = landArea > 0 ? (buildingArea / landArea) * 100 : 0;
  const isCompliant = kdb <= maxKdb;
  
  const resultDiv = document.getElementById('kdb-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">KDB (Koefisien Dasar Bangunan)</div>
        <div style="font-size: 2rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">${kdb.toFixed(2)}%</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
        <div>
          <div style="color: var(--text-tertiary);">Max Allowed</div>
          <div style="color: white; font-weight: 600;">${maxKdb}%</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Status</div>
          <div style="color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 600;">
            ${isCompliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
          </div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

function calculateKLB(e) {
  e.preventDefault();
  
  const landArea = parseFloat(document.getElementById('klb-land').value) || 0;
  const totalFloor = parseFloat(document.getElementById('klb-total-floor').value) || 0;
  const maxKlb = parseFloat(document.getElementById('klb-max').value) || 2.8;
  
  const klb = landArea > 0 ? totalFloor / landArea : 0;
  const isCompliant = klb <= maxKlb;
  
  const resultDiv = document.getElementById('klb-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">KLB (Koefisien Lantai Bangunan)</div>
        <div style="font-size: 2rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">${klb.toFixed(2)}</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
        <div>
          <div style="color: var(--text-tertiary);">Max Allowed</div>
          <div style="color: white; font-weight: 600;">${maxKlb}</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Status</div>
          <div style="color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 600;">
            ${isCompliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
          </div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

function calculateHSB(e) {
  e.preventDefault();
  
  const floors = parseInt(document.getElementById('hsb-floors').value) || 0;
  const height = parseFloat(document.getElementById('hsb-height').value) || 0;
  const maxHsb = parseInt(document.getElementById('hsb-max').value) || 0;
  
  const isCompliant = floors <= maxHsb;
  
  const resultDiv = document.getElementById('hsb-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">HSB (Height Storey Building)</div>
        <div style="font-size: 2rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">${floors} Lantai</div>
        ${height > 0 ? `<div style="font-size: 0.9rem; color: var(--text-secondary);">Tinggi: ${height.toFixed(1)} m</div>` : ''}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
        <div>
          <div style="color: var(--text-tertiary);">Max Allowed</div>
          <div style="color: white; font-weight: 600;">${maxHsb} Lantai</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Status</div>
          <div style="color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 600;">
            ${isCompliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
          </div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

function calculateGSB(e) {
  e.preventDefault();
  
  const side = document.getElementById('gsb-side').value;
  const required = parseFloat(document.getElementById('gsb-required').value) || 0;
  const actual = parseFloat(document.getElementById('gsb-actual').value) || 0;
  
  const isCompliant = actual >= required;
  const margin = actual - required;
  
  const resultDiv = document.getElementById('gsb-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">GSB - ${side}</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'};">
          ${isCompliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
        <div>
          <div style="color: var(--text-tertiary);">Required</div>
          <div style="color: white; font-weight: 600;">${required} m</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Actual</div>
          <div style="color: white; font-weight: 600;">${actual} m</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Margin</div>
          <div style="color: ${margin >= 0 ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 600;">${margin.toFixed(1)} m</div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

async function saveFloorData(e) {
  e.preventDefault();
  const form = e.target;
  
  const data = {
    project_id: currentProjectId,
    floor_number: parseInt(form.floor_number.value),
    floor_name: form.floor_name.value || null,
    area_m2: parseFloat(form.area_m2.value),
    height_m: parseFloat(form.height_m.value) || null,
    function: form.function.value,
    created_at: new Date().toISOString()
  };
  
  try {
    await supabase.from('building_floors').insert(data);
    await loadIntensityData();
    renderCurrentTab();
    closeModal('floor-modal');
    form.reset();
    showSuccess('Data lantai berhasil disimpan');
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

async function saveGsbCheckpoint(e) {
  e.preventDefault();
  const form = e.target;
  
  const data = {
    project_id: currentProjectId,
    side: form.side.value,
    required_distance: parseFloat(form.required_distance.value),
    actual_distance: parseFloat(form.actual_distance.value),
    location_note: form.location_note.value || null,
    created_at: new Date().toISOString()
  };
  
  try {
    await supabase.from('building_setbacks').insert(data);
    await loadIntensityData();
    renderCurrentTab();
    closeModal('gsb-modal');
    form.reset();
    showSuccess('Data GSB berhasil disimpan');
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

function initEventListeners() {
  // Event listeners are now handled by the globally exported functions
  // Additional event listeners can be added here if needed
}

// ============================================================
// WINDOW EXPORTS
// ============================================================

window._switchIntensityTab = _switchIntensityTab;
window.renderDashboardTab = renderDashboardTab;
window.renderCurrentTab = renderCurrentTab;
window.closeModal = closeModal;
window.calculateQuickIntensity = calculateQuickIntensity;
window.calculateKDB = calculateKDB;
window.calculateKLB = calculateKLB;
window.calculateHSB = calculateHSB;
window.calculateGSB = calculateGSB;
window.showFloorModal = showFloorModal;
window.showGsbModal = showGsbModal;
window.saveFloorData = saveFloorData;
window.saveGsbCheckpoint = saveGsbCheckpoint;
