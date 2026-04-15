// ============================================================
// FIRE PROTECTION INSPECTION - MAIN PAGE
// Pemeriksaan Sistem Proteksi Kebakaran SLF
// Integrates: APAR, Hydrant, Sprinkler, Detector, Fire Alarm
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let fireData = {
  summary: null,
  apar: [],
  hydrant: [],
  sprinkler: [],
  detector: [],
  fireAlarm: null
};
let currentTab = 'dashboard';

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function fireProtectionInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadFireData();
  
  return renderPage();
}

export function afterFireProtectionInspectionRender() {
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
      .select('id, nama_bangunan, alamat')
      .eq('id', currentProjectId)
      .single();
    
    if (data) {
      currentProjectName = data.nama_bangunan;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadFireData() {
  try {
    // Load summary from view
    const { data: summaryData } = await supabase
      .from('fire_project_summary')
      .select('*')
      .eq('project_id', currentProjectId)
      .single();
    
    fireData.summary = summaryData;
    
    // Load all fire assets for this project
    const { data: assetsData } = await supabase
      .from('fire_assets')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    // Split assets by type
    fireData.apar = (assetsData || []).filter(a => a.asset_type === 'APAR');
    fireData.hydrant = (assetsData || []).filter(a => a.asset_type === 'HYDRANT');
    fireData.sprinkler = (assetsData || []).filter(a => a.asset_type === 'SPRINKLER');
    fireData.detector = (assetsData || []).filter(a => a.asset_type === 'DETECTOR');
    
  } catch (e) {
    console.error('Error loading fire protection data:', e);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="fire-inspection-page" style="padding: var(--space-6); max-width: 1400px; margin: 0 auto;">
      ${renderHeaderCard()}
      <div id="fire-content" class="fire-content">
        <!-- Tab content will be rendered here -->
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getFireStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="fire-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-fire-extinguisher" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--danger-400);">PHASE 02C</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Sistem Proteksi Kebakaran</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(0, 85%, 60%, 0.1); color: var(--danger-400); border: 1px solid hsla(0, 85%, 60%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>SNI 03-1735-2000
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi sistem proteksi kebakaran aktif dan pasif berdasarkan SNI 03-1735-2000 (Sistem Proteksi Kebakaran). 
        Meliputi APAR, Hydrant, Sprinkler, Fire Detection, dan Fire Alarm System.
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchFireTab('dashboard', this)" 
                class="fire-tab-item active"
                data-tab="dashboard"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-tachometer-alt"></i> DASHBOARD
        </button>
        <button onclick="window._switchFireTab('apar', this)" 
                class="fire-tab-item"
                data-tab="apar"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-fire-extinguisher"></i> APAR
        </button>
        <button onclick="window._switchFireTab('hydrant', this)" 
                class="fire-tab-item"
                data-tab="hydrant"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-tint"></i> HYDRANT
        </button>
        <button onclick="window._switchFireTab('sprinkler', this)" 
                class="fire-tab-item"
                data-tab="sprinkler"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-shower"></i> SPRINKLER
        </button>
        <button onclick="window._switchFireTab('detector', this)" 
                class="fire-tab-item"
                data-tab="detector"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-bell"></i> DETEKTOR
        </button>
        <button onclick="window._switchFireTab('alarm', this)" 
                class="fire-tab-item"
                data-tab="alarm"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-broadcast-tower"></i> FIRE ALARM
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('fire-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'dashboard':
      contentDiv.innerHTML = renderDashboardTab();
      break;
    case 'apar':
      contentDiv.innerHTML = renderAparTab();
      break;
    case 'hydrant':
      contentDiv.innerHTML = renderHydrantTab();
      break;
    case 'sprinkler':
      contentDiv.innerHTML = renderSprinklerTab();
      break;
    case 'detector':
      contentDiv.innerHTML = renderDetectorTab();
      break;
    case 'alarm':
      contentDiv.innerHTML = renderAlarmTab();
      break;
  }
}

function renderDashboardTab() {
  const aparCount = fireData.apar.length;
  const hydrantCount = fireData.hydrant.length;
  const sprinklerCount = fireData.sprinkler.length;
  const detectorCount = fireData.detector.length;
  
  const aparOk = fireData.apar.filter(a => a.status === 'ACTIVE' && a.last_inspection_result === 'PASS').length;
  const hydrantOk = fireData.hydrant.filter(h => h.status === 'ACTIVE' && h.last_inspection_result === 'PASS').length;
  const sprinklerOk = fireData.sprinkler.filter(s => s.status === 'ACTIVE' && s.last_inspection_result === 'PASS').length;
  const detectorOk = fireData.detector.filter(d => d.status === 'ACTIVE' && d.last_inspection_result === 'PASS').length;
  
  return `
    <div id="fire-tab-dashboard" class="fire-tab-content active">
      <!-- Summary Cards -->
      <div class="grid-4-col" style="gap: 16px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400); margin: 0 auto 12px;">
            <i class="fas fa-fire-extinguisher" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: white; margin-bottom: 4px;">${aparCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Total APAR</div>
          <div style="font-size: 0.65rem; color: var(--success-400); margin-top: 4px;">${aparOk} BAIK</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-tint" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: white; margin-bottom: 4px;">${hydrantCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Total Hydrant</div>
          <div style="font-size: 0.65rem; color: var(--success-400); margin-top: 4px;">${hydrantOk} BAIK</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400); margin: 0 auto 12px;">
            <i class="fas fa-shower" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: white; margin-bottom: 4px;">${sprinklerCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Total Sprinkler</div>
          <div style="font-size: 0.65rem; color: var(--success-400); margin-top: 4px;">${sprinklerOk} BAIK</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400); margin: 0 auto 12px;">
            <i class="fas fa-bell" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: white; margin-bottom: 4px;">${detectorCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Total Detektor</div>
          <div style="font-size: 0.65rem; color: var(--success-400); margin-top: 4px;">${detectorOk} BAIK</div>
        </div>
      </div>
      
      <div class="grid-2-col" style="gap: 20px;">
        <!-- APAR Requirement Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-calculator" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator Kebutuhan APAR
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-1735-2000</span>
          </div>
          
          <form id="apar-calc-form" onsubmit="calculateAPARRequirement(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Luas Bangunan (m²)</label>
                <input type="number" id="calc-area" class="form-input-dark" placeholder="Contoh: 1000" step="1" min="1">
              </div>
              <div>
                <label class="form-label">Tingkat Risiko</label>
                <select id="calc-risk" class="form-input-dark">
                  <option value="LOW">Rendah - Kantor, Sekolah</option>
                  <option value="MEDIUM" selected>Sedang - Hotel, Rumah Sakit</option>
                  <option value="HIGH">Tinggi - Gudang, Pabrik</option>
                </select>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Jumlah Lantai</label>
              <input type="number" id="calc-floors" class="form-input-dark" placeholder="1" step="1" min="1" value="1">
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung Kebutuhan APAR
            </button>
          </form>
          
          <div id="apar-calc-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Hydrant Flow Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-tint" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator Flow Hydrant
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-1735-2000</span>
          </div>
          
          <form id="hydrant-calc-form" onsubmit="calculateHydrantFlow(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Diameter Nozzle (mm)</label>
                <select id="hydrant-diameter" class="form-input-dark">
                  <option value="13">13 mm (1/2 inch)</option>
                  <option value="19" selected>19 mm (3/4 inch)</option>
                  <option value="25">25 mm (1 inch)</option>
                </select>
              </div>
              <div>
                <label class="form-label">Tekanan (bar/psi)</label>
                <input type="number" id="hydrant-pressure" class="form-input-dark" placeholder="3.5" step="0.1" min="0.1">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Koefisien Discharge (Cd)</label>
              <input type="number" id="hydrant-cd" class="form-input-dark" placeholder="0.95" step="0.01" min="0.8" max="1.0" value="0.95">
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                Standar nozzle: 0.90 - 0.98
              </p>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung Flow Rate
            </button>
          </form>
          
          <div id="hydrant-calc-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAparTab() {
  return `
    <div id="fire-tab-apar" class="fire-tab-content">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-fire-extinguisher" style="margin-right: 8px; color: var(--danger-400);"></i>
            Data APAR (Alat Pemadam Api Ringan)
          </h4>
          <button class="btn btn-primary btn-sm" onclick="showAparModal()">
            <i class="fas fa-plus"></i> Tambah APAR
          </button>
        </div>
        
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">
          Kelola data APAR: lokasi, tipe, kapasitas, tanggal pembelian, dan jadwal inspeksi berkala.
        </p>
        
        <!-- APAR List -->
        ${fireData.apar.length === 0 ? 
          '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data APAR. Tambahkan menggunakan tombol di atas.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px;">
            ${fireData.apar.map(apar => {
              const specs = apar.specifications || {};
              const isGood = apar.status === 'ACTIVE' && apar.last_inspection_result === 'PASS';
              const expDate = specs.expiry_date ? new Date(specs.expiry_date).toLocaleDateString('id-ID') : 'N/A';
              const lastCheck = apar.last_inspection_date ? new Date(apar.last_inspection_date).toLocaleDateString('id-ID') : 'Belum pernah';
              return `
                <div class="card-quartz" style="padding: 16px; border-left: 3px solid ${isGood ? 'var(--success-400)' : 'var(--danger-400)'}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                      <div style="font-weight: 700; color: white; margin-bottom: 4px;">${apar.asset_tag || 'APAR-' + apar.id.slice(0,8)}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">
                        ${apar.asset_subtype || specs.agent_type || 'Powder'} | ${specs.capacity_kg || '3'} kg | ${apar.location_name || 'Belum ditentukan'}
                      </div>
                    </div>
                    <span class="badge" style="background: ${isGood ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${isGood ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 9px;">
                      ${apar.status === 'ACTIVE' ? (apar.last_inspection_result || 'OK') : apar.status}
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.75rem; margin-bottom: 12px;">
                    <div>
                      <span style="color: var(--text-tertiary);">Expired:</span> <span style="color: white;">${expDate}</span>
                    </div>
                    <div>
                      <span style="color: var(--text-tertiary);">Terakhir Cek:</span> <span style="color: white;">${lastCheck}</span>
                    </div>
                    <div>
                      <span style="color: var(--text-tertiary);">Manufacture:</span> <span style="color: white;">${specs.manufacturing_date ? new Date(specs.manufacturing_date).getFullYear() : 'N/A'}</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary btn-xs" onclick="inspectApar('${apar.id}')">
                      <i class="fas fa-clipboard-check"></i> Inspeksi
                    </button>
                    <button class="btn-ghost btn-xs" onclick="editApar('${apar.id}')">
                      <i class="fas fa-edit"></i> Edit
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
        }
      </div>
      
      <!-- APAR Standards Reference -->
      <div class="card-quartz" style="padding: 20px;">
        <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-info-circle" style="color: var(--success-400); margin-right: 6px;"></i>
          Standar APAR (SNI 03-1735-2000)
        </h5>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Jarak Tempuh APAR</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Maksimal 15 meter dari titik potensi kebakaran</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Ketinggian Pemasangan</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">1.2 - 1.5 meter dari lantai</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Inspeksi Berkala</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Minimal 1x per bulan, recharge setiap 5 tahun</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Penempatan</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Lokasi mudah terlihat dan diakses</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderHydrantTab() {
  return `
    <div id="fire-tab-hydrant" class="fire-tab-content">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-tint" style="margin-right: 8px; color: var(--brand-400);"></i>
            Sistem Hydrant
          </h4>
          <button class="btn btn-primary btn-sm" onclick="showHydrantModal()">
            <i class="fas fa-plus"></i> Tambah Hydrant
          </button>
        </div>
        
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">
          Kelola sistem hydrant: hydrant pillar, box hydrant, pompa, pipa, dan hasil flow test.
        </p>
        
        ${fireData.hydrant.length === 0 ? 
          '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data hydrant. Tambahkan menggunakan tombol di atas.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px;">
            ${fireData.hydrant.map(h => {
              const specs = h.specifications || {};
              const isGood = h.status === 'ACTIVE' && h.last_inspection_result === 'PASS';
              const lastTest = specs.last_flow_test ? new Date(specs.last_flow_test).toLocaleDateString('id-ID') : 'Belum test';
              return `
                <div class="card-quartz" style="padding: 16px; border-left: 3px solid ${isGood ? 'var(--success-400)' : 'var(--danger-400)'}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                      <div style="font-weight: 700; color: white; margin-bottom: 4px;">${h.asset_tag || 'HYDRANT-' + h.id.slice(0,8)}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">
                        ${h.asset_subtype || specs.type || 'Pillar'} | ${h.location_name || 'Outdoor'}
                      </div>
                    </div>
                    <span class="badge" style="background: ${isGood ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${isGood ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 9px;">
                      ${h.status === 'ACTIVE' ? (h.last_inspection_result || 'OK') : h.status}
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.75rem; margin-bottom: 12px;">
                    <div>
                      <span style="color: var(--text-tertiary);">Flow Test:</span> <span style="color: white;">${lastTest}</span>
                    </div>
                    <div>
                      <span style="color: var(--text-tertiary);">Flow Rate:</span> <span style="color: white;">${specs.flow_rate || 'N/A'} L/min</span>
                    </div>
                    <div>
                      <span style="color: var(--text-tertiary);">Pressure:</span> <span style="color: white;">${specs.pressure || 'N/A'} bar</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary btn-xs" onclick="testHydrant('${h.id}')">
                      <i class="fas fa-vial"></i> Flow Test
                    </button>
                    <button class="btn-ghost btn-xs" onclick="editHydrant('${h.id}')">
                      <i class="fas fa-edit"></i> Edit
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
        }
      </div>
      
      <!-- Hydrant Standards -->
      <div class="card-quartz" style="padding: 20px;">
        <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-info-circle" style="color: var(--success-400); margin-right: 6px;"></i>
          Standar Hydrant (SNI 03-1735-2000)
        </h5>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Flow Rate Minimum</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">750 L/min (Nozzle 19mm, 3.5 bar)</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Tekanan Kerja</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">3.5 - 7.0 bar (350-700 kPa)</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Jarak Hydrant</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Maksimal 50 meter dari bangunan</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Flow Test</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Minimal 1x per tahun</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSprinklerTab() {
  return `
    <div id="fire-tab-sprinkler" class="fire-tab-content">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-shower" style="margin-right: 8px; color: var(--success-400);"></i>
            Sistem Sprinkler
          </h4>
          <button class="btn btn-primary btn-sm" onclick="showSprinklerModal()">
            <i class="fas fa-plus"></i> Tambah Sprinkler
          </button>
        </div>
        
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">
          Kelola sistem sprinkler otomatis: coverage area, flow test, dan jadwal maintenance.
        </p>
        
        ${fireData.sprinkler.length === 0 ? 
          '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data sprinkler. Tambahkan menggunakan tombol di atas.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px;">
            ${fireData.sprinkler.map(s => {
              const specs = s.specifications || {};
              const isGood = s.status === 'ACTIVE' && s.last_inspection_result === 'PASS';
              const lastTest = specs.last_flow_test ? new Date(specs.last_flow_test).toLocaleDateString('id-ID') : 'Belum test';
              return `
                <div class="card-quartz" style="padding: 16px; border-left: 3px solid ${isGood ? 'var(--success-400)' : 'var(--danger-400)'}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                      <div style="font-weight: 700; color: white; margin-bottom: 4px;">${s.asset_tag || 'SPRINKLER-' + s.id.slice(0,8)}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">
                        ${s.asset_subtype || specs.head_type || 'Pendent'} | ${specs.zone || 'Zone 1'} | ${s.location_name || 'Lantai 1'}
                      </div>
                    </div>
                    <span class="badge" style="background: ${isGood ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${isGood ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 9px;">
                      ${s.status === 'ACTIVE' ? (s.last_inspection_result || 'OK') : s.status}
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.75rem; margin-bottom: 12px;">
                    <div>
                      <span style="color: var(--text-tertiary);">Flow Test:</span> <span style="color: white;">${lastTest}</span>
                    </div>
                    <div>
                      <span style="color: var(--text-tertiary);">Coverage:</span> <span style="color: white;">${specs.coverage_area || 'N/A'} m²</span>
                    </div>
                    <div>
                      <span style="color: var(--text-tertiary);">K-Factor:</span> <span style="color: white;">${specs.k_factor || 'N/A'}</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary btn-xs" onclick="testSprinkler('${s.id}')">
                      <i class="fas fa-vial"></i> Flow Test
                    </button>
                    <button class="btn-ghost btn-xs" onclick="editSprinkler('${s.id}')">
                      <i class="fas fa-edit"></i> Edit
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
        }
      </div>
      
      <!-- Sprinkler Calculator -->
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px;">
        <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-calculator" style="color: var(--brand-400); margin-right: 6px;"></i>
          Kalkulator Coverage Sprinkler
        </h5>
        <form id="sprinkler-calc-form" onsubmit="calculateSprinklerCoverage(event)">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="form-label">Tipe Hazard</label>
              <select id="sprinkler-hazard" class="form-input-dark">
                <option value="LIGHT">Light Hazard (Kantor, Sekolah)</option>
                <option value="ORDINARY_1" selected>Ordinary Hazard Group 1</option>
                <option value="ORDINARY_2">Ordinary Hazard Group 2</option>
                <option value="EXTRA">Extra Hazard</option>
              </select>
            </div>
            <div>
              <label class="form-label">Ketinggian (m)</label>
              <input type="number" id="sprinkler-height" class="form-input-dark" placeholder="3.0" step="0.1" min="0.5" value="3.0">
            </div>
            <div>
              <label class="form-label">Luas Area (m²)</label>
              <input type="number" id="sprinkler-area" class="form-input-dark" placeholder="500" step="10" min="10">
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-calculator" style="margin-right: 8px;"></i>
            Hitung Kebutuhan Sprinkler
          </button>
        </form>
        <div id="sprinkler-calc-result" style="margin-top: 20px; display: none;">
          <!-- Result will be rendered here -->
        </div>
      </div>
    </div>
  `;
}

function renderDetectorTab() {
  return `
    <div id="fire-tab-detector" class="fire-tab-content">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-bell" style="margin-right: 8px; color: var(--gold-400);"></i>
            Fire Detection System
          </h4>
          <button class="btn btn-primary btn-sm" onclick="showDetectorModal()">
            <i class="fas fa-plus"></i> Tambah Detektor
          </button>
        </div>
        
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">
          Kelola sistem deteksi kebakaran: Smoke Detector, Heat Detector, Gas Detector, dan Manual Call Point.
        </p>
        
        ${fireData.detector.length === 0 ? 
          '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data detektor. Tambahkan menggunakan tombol di atas.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px;">
            ${fireData.detector.map(d => {
              const specs = d.specifications || {};
              const isGood = d.status === 'ACTIVE' && d.last_inspection_result === 'PASS';
              const lastTest = specs.last_test ? new Date(specs.last_test).toLocaleDateString('id-ID') : 'Belum test';
              const typeIcon = d.asset_subtype === 'SMOKE' || specs.detector_type === 'SMOKE' ? 'fa-smog' : d.asset_subtype === 'HEAT' || specs.detector_type === 'HEAT' ? 'fa-thermometer-half' : 'fa-wind';
              return `
                <div class="card-quartz" style="padding: 16px; border-left: 3px solid ${isGood ? 'var(--success-400)' : 'var(--danger-400)'}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
                        <i class="fas ${typeIcon}"></i>
                      </div>
                      <div>
                        <div style="font-weight: 700; color: white; margin-bottom: 4px;">${d.asset_tag || 'DETECTOR-' + d.id.slice(0,8)}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">
                          ${d.asset_subtype || specs.detector_type || 'Smoke'} | ${specs.zone || 'Zone 1'} | ${d.location_name || 'Lantai 1'}
                        </div>
                      </div>
                    </div>
                    <span class="badge" style="background: ${isGood ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${isGood ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 9px;">
                      ${d.status === 'ACTIVE' ? (d.last_inspection_result || 'OK') : d.status}
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.75rem; margin-bottom: 12px;">
                    <div>
                      <span style="color: var(--text-tertiary);">Sensitivity:</span> <span style="color: white;">${specs.sensitivity || 'Normal'}</span>
                    </div>
                    <div>
                      <span style="color: var(--text-tertiary);">Last Test:</span> <span style="color: white;">${lastTest}</span>
                    </div>
                    <div>
                      <span style="color: var(--text-tertiary);">Battery:</span> <span style="color: white;">${specs.battery_status || 'N/A'}</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary btn-xs" onclick="testDetector('${d.id}')">
                      <i class="fas fa-vial"></i> Test
                    </button>
                    <button class="btn-ghost btn-xs" onclick="editDetector('${d.id}')">
                      <i class="fas fa-edit"></i> Edit
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
        }
      </div>
      
      <!-- Detector Standards -->
      <div class="card-quartz" style="padding: 20px;">
        <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-info-circle" style="color: var(--success-400); margin-right: 6px;"></i>
          Standar Detektor (SNI 03-1735-2000 & NFPA 72)
        </h5>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Smoke Detector Spacing</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Maksimal 11.3m × 11.3m (cetakan 7.6m × 7.6m)</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Heat Detector Spacing</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Maksimal 9.1m × 9.1m (70m² per detektor)</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Jarak dari Dinding</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Maksimal setengah jarak antar detektor</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Testing Berkala</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Functional test setiap 6 bulan</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAlarmTab() {
  return `
    <div id="fire-tab-alarm" class="fire-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Fire Alarm Control Panel -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-broadcast-tower" style="margin-right: 8px; color: var(--danger-400);"></i>
            Fire Alarm Control Panel (FACP)
          </h4>
          
          <form id="alarm-form" onsubmit="saveFireAlarm(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Merk/Brand</label>
                <input type="text" id="alarm-brand" class="form-input-dark" placeholder="e.g., NOTIFIER, Horinglih">
              </div>
              <div>
                <label class="form-label">Tipe Panel</label>
                <select id="alarm-type" class="form-input-dark">
                  <option value="CONVENTIONAL">Conventional</option>
                  <option value="ADDRESSABLE" selected>Addressable</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Jumlah Zone</label>
                <input type="number" id="alarm-zones" class="form-input-dark" placeholder="8" min="1">
              </div>
              <div>
                <label class="form-label">Kapasitas Device</label>
                <input type="number" id="alarm-capacity" class="form-input-dark" placeholder="200" min="10">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Lokasi Panel</label>
              <input type="text" id="alarm-location" class="form-input-dark" placeholder="e.g., Security Room, Lantai 1">
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Emergency Voice System (EVAC)</label>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div class="form-check">
                  <input type="checkbox" id="evac-speaker" class="form-check-input">
                  <label for="evac-speaker" class="form-check-label">Speaker/Horns</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="evac-strobe" class="form-check-input">
                  <label for="evac-strobe" class="form-check-label">Strobe Lights</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="evac-paging" class="form-check-input">
                  <label for="evac-paging" class="form-check-label">Emergency Paging</label>
                </div>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-save" style="margin-right: 8px;"></i>
              Simpan Data Fire Alarm
            </button>
          </form>
        </div>
        
        <!-- Status & Monitoring -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-chart-line" style="margin-right: 8px; color: var(--success-400);"></i>
            Status & Monitoring
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
            <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Panel Status</span>
                <span class="badge" style="background: hsla(158, 85%, 45%, 0.1); color: var(--success-400); font-size: 9px;">NORMAL</span>
              </div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Sistem beroperasi normal, tidak ada alarm aktif</div>
            </div>
            
            <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Power Supply</span>
                <span class="badge" style="background: hsla(158, 85%, 45%, 0.1); color: var(--success-400); font-size: 9px;">AC NORMAL</span>
              </div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">AC Power: ON, Battery: Standby</div>
            </div>
            
            <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Device Status</span>
                <span class="badge" style="background: hsla(158, 85%, 45%, 0.1); color: var(--success-400); font-size: 9px;">
                  ${fireData.detector.length} DETECTORS
                </span>
              </div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">
                ${fireData.detector.filter(d => d.condition === 'BAIK').length} Normal, 
                ${fireData.detector.filter(d => d.condition !== 'BAIK').length} Trouble
              </div>
            </div>
          </div>
          
          <!-- Recent Events -->
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <h5 style="font-weight: 700; color: white; margin-bottom: 12px; font-size: 0.9rem;">
              <i class="fas fa-history" style="color: var(--brand-400); margin-right: 6px;"></i>
              Recent Events
            </h5>
            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-align: center; padding: 20px;">
              <i class="fas fa-check-circle" style="color: var(--success-400); font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
              Tidak ada event dalam 30 hari terakhir
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
    <!-- APAR Modal -->
    <div id="apar-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-fire-extinguisher"></i> Tambah APAR</h3>
          <button class="modal-close" onclick="closeModal('apar-modal')">&times;</button>
        </div>
        <form id="apar-form" onsubmit="saveApar(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Kode/ID *</label>
              <input type="text" name="code" required placeholder="e.g., APAR-01">
            </div>
            <div class="form-group">
              <label>Tipe APAR *</label>
              <select name="type" required>
                <option value="POWDER">Dry Chemical Powder</option>
                <option value="CO2">CO2 (Karbon Dioksida)</option>
                <option value="FOAM">Foam (Busa)</option>
                <option value="WATER">Water (Air)</option>
                <option value="CLEAN_AGENT">Clean Agent</option>
              </select>
            </div>
            <div class="form-group">
              <label>Kapasitas (kg) *</label>
              <input type="number" name="capacity" required step="0.1" min="0.1" placeholder="3">
            </div>
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Koridor Lantai 1">
            </div>
            <div class="form-group">
              <label>Tahun Pembuatan *</label>
              <input type="number" name="manufacture_year" required min="1990" max="2099" placeholder="2024">
            </div>
            <div class="form-group">
              <label>Tanggal Expired *</label>
              <input type="date" name="expiry_date" required>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Kondisi *</label>
              <select name="condition" required>
                <option value="BAIK">Baik - Siap Pakai</option>
                <option value="PERLU_SERVICE">Perlu Service</option>
                <option value="RUSAK">Rusak - Tidak Bisa Dipakai</option>
                <option value="EXPIRED">Expired - Perlu Recharge</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('apar-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Hydrant Modal -->
    <div id="hydrant-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-tint"></i> Tambah Hydrant</h3>
          <button class="modal-close" onclick="closeModal('hydrant-modal')">&times;</button>
        </div>
        <form id="hydrant-form" onsubmit="saveHydrant(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Kode/ID *</label>
              <input type="text" name="code" required placeholder="e.g., HYDRANT-01">
            </div>
            <div class="form-group">
              <label>Tipe Hydrant *</label>
              <select name="type" required>
                <option value="PILLAR">Pillar Hydrant (Outdoor)</option>
                <option value="BOX">Box Hydrant (Indoor)</option>
                <option value="LANDING_VALVE">Landing Valve</option>
              </select>
            </div>
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Area Parkir Utara">
            </div>
            <div class="form-group">
              <label>Kondisi *</label>
              <select name="condition" required>
                <option value="BAIK">Baik - Siap Pakai</option>
                <option value="PERLU_PERBAIKAN">Perlu Perbaikan</option>
                <option value="RUSAK">Rusak</option>
              </select>
            </div>
            <div class="form-group">
              <label>Diameter Pipa (inch)</label>
              <input type="number" name="pipe_diameter" step="0.5" placeholder="4">
            </div>
            <div class="form-group">
              <label>Jumlah Outlet</label>
              <input type="number" name="outlet_count" min="1" placeholder="2">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('hydrant-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Sprinkler Modal -->
    <div id="sprinkler-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-shower"></i> Tambah Sprinkler</h3>
          <button class="modal-close" onclick="closeModal('sprinkler-modal')">&times;</button>
        </div>
        <form id="sprinkler-form" onsubmit="saveSprinkler(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Kode/ID *</label>
              <input type="text" name="code" required placeholder="e.g., SPR-01-A">
            </div>
            <div class="form-group">
              <label>Tipe Sprinkler *</label>
              <select name="type" required>
                <option value="PENDENT">Pendent</option>
                <option value="UPRIGHT">Upright</option>
                <option value="SIDEWALL">Sidewall</option>
                <option value="CONCEALED">Concealed</option>
              </select>
            </div>
            <div class="form-group">
              <label>Zone *</label>
              <input type="text" name="zone" required placeholder="e.g., Zone 1">
            </div>
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Ruang Meeting A">
            </div>
            <div class="form-group">
              <label>K-Factor</label>
              <input type="number" name="k_factor" step="0.1" placeholder="5.6">
            </div>
            <div class="form-group">
              <label>Luas Coverage (m²)</label>
              <input type="number" name="coverage_area" step="0.1" placeholder="12">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Kondisi *</label>
              <select name="condition" required>
                <option value="BAIK">Baik - Siap Operasi</option>
                <option value="BLOCKED">Blocked - Terhalang</option>
                <option value="RUSAK">Rusak - Perlu Perbaikan</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('sprinkler-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Detector Modal -->
    <div id="detector-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-bell"></i> Tambah Detector</h3>
          <button class="modal-close" onclick="closeModal('detector-modal')">&times;</button>
        </div>
        <form id="detector-form" onsubmit="saveDetector(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Kode/ID *</label>
              <input type="text" name="code" required placeholder="e.g., DET-SMOKE-01">
            </div>
            <div class="form-group">
              <label>Tipe Detector *</label>
              <select name="type" required>
                <option value="SMOKE">Smoke Detector (Asap)</option>
                <option value="HEAT">Heat Detector (Panas)</option>
                <option value="GAS">Gas Detector</option>
                <option value="MULTI">Multi Criteria</option>
                <option value="MANUAL">Manual Call Point</option>
              </select>
            </div>
            <div class="form-group">
              <label>Zone *</label>
              <input type="text" name="zone" required placeholder="e.g., Zone 1">
            </div>
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Lantai 2, Koridor Barat">
            </div>
            <div class="form-group">
              <label>Sensitivity</label>
              <select name="sensitivity">
                <option value="LOW">Low</option>
                <option value="NORMAL" selected>Normal</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div class="form-group">
              <label>Status Battery</label>
              <select name="battery_status">
                <option value="GOOD" selected>Good</option>
                <option value="LOW">Low - Perlu Ganti</option>
                <option value="N/A">N/A (Hardwired)</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Kondisi *</label>
              <select name="condition" required>
                <option value="BAIK">Baik - Normal Operation</option>
                <option value="TROUBLE">Trouble - Perlu Periksa</option>
                <option value="RUSAK">Rusak - Perlu Ganti</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('detector-modal')">Batal</button>
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

function getFireStyles() {
  return `
    .fire-content {
      min-height: 400px;
    }
    
    .fire-tab-content {
      display: none;
    }
    
    .fire-tab-content.active {
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
    
    /* Grid layouts */
    .grid-2-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
    
    .grid-3-col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }
    
    .grid-4-col {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }
    
    @media (max-width: 1024px) {
      .grid-4-col {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .grid-2-col, .grid-3-col, .grid-4-col {
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
// TAB SWITCHING
// ============================================================

function _switchFireTab(tabId, btn) {
  currentTab = tabId;
  
  // Update button states
  document.querySelectorAll('.fire-tab-item').forEach(b => {
    b.classList.remove('active');
    b.style.background = 'transparent';
    b.style.boxShadow = 'none';
    b.style.color = 'var(--text-tertiary)';
  });
  
  if (btn) {
    btn.classList.add('active');
    btn.style.background = 'var(--gradient-brand)';
    btn.style.boxShadow = 'var(--shadow-sapphire)';
    btn.style.color = 'white';
  }
  
  renderCurrentTab();
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function initEventListeners() {
  // Modal functions
  window.showAparModal = () => {
    document.getElementById('apar-modal').style.display = 'flex';
  };
  
  window.showHydrantModal = () => {
    document.getElementById('hydrant-modal').style.display = 'flex';
  };
  
  window.showSprinklerModal = () => {
    document.getElementById('sprinkler-modal').style.display = 'flex';
  };
  
  window.showDetectorModal = () => {
    document.getElementById('detector-modal').style.display = 'flex';
  };
  
  window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
  };
  
  // Calculator functions
  window.calculateAPARRequirement = (e) => {
    e.preventDefault();
    
    const area = parseFloat(document.getElementById('calc-area').value) || 0;
    const risk = document.getElementById('calc-risk').value;
    const floors = parseInt(document.getElementById('calc-floors').value) || 1;
    
    // SNI 03-1735-2000 requirements
    const riskFactors = {
      'LOW': 1400,      // m² per APAR
      'MEDIUM': 1000,   // m² per APAR
      'HIGH': 700       // m² per APAR
    };
    
    const areaPerApar = riskFactors[risk] || 1000;
    const requiredApar = Math.ceil(area / areaPerApar);
    const totalRequired = requiredApar * floors;
    
    const resultDiv = document.getElementById('apar-calc-result');
    resultDiv.innerHTML = `
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid var(--success-400);">
        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">Kebutuhan APAR</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-400);">${totalRequired} unit</div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px;">
          ${requiredApar} unit per lantai × ${floors} lantai
        </div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 8px;">
          (Area coverage: ${areaPerApar} m²/APAR untuk risiko ${risk.toLowerCase()})
        </div>
      </div>
    `;
    resultDiv.style.display = 'block';
  };
  
  window.calculateHydrantFlow = (e) => {
    e.preventDefault();
    
    const diameter = parseFloat(document.getElementById('hydrant-diameter').value) || 19;
    const pressure = parseFloat(document.getElementById('hydrant-pressure').value) || 3.5;
    const cd = parseFloat(document.getElementById('hydrant-cd').value) || 0.95;
    
    // Q = Cd × A × √(2 × g × h), simplified
    const areaMm = Math.PI * Math.pow(diameter / 2, 2);
    const areaM = areaMm / 1000000; // convert to m²
    const pressurePa = pressure * 100000; // convert bar to Pa
    const density = 1000; // kg/m³ for water
    const velocity = Math.sqrt((2 * pressurePa) / density);
    const flowM3s = cd * areaM * velocity;
    const flowLpm = flowM3s * 60000; // convert to L/min
    
    const isAdequate = flowLpm >= 750;
    
    const resultDiv = document.getElementById('hydrant-calc-result');
    resultDiv.innerHTML = `
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isAdequate ? 'var(--success-400)' : 'var(--warning-400)'};">
        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">Flow Rate</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: ${isAdequate ? 'var(--success-400)' : 'var(--warning-400)'};">${flowLpm.toFixed(1)} L/min</div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px;">
          ${isAdequate ? '✓ Memenuhi standar SNI (≥750 L/min)' : '⚠ Di bawah standar minimum SNI'}
        </div>
      </div>
    `;
    resultDiv.style.display = 'block';
  };
  
  window.calculateSprinklerCoverage = (e) => {
    e.preventDefault();
    
    const hazard = document.getElementById('sprinkler-hazard').value;
    const height = parseFloat(document.getElementById('sprinkler-height').value) || 3.0;
    const area = parseFloat(document.getElementById('sprinkler-area').value) || 0;
    
    // NFPA 13 coverage areas per hazard
    const coverageMap = {
      'LIGHT': 20.9,      // m² per sprinkler
      'ORDINARY_1': 12.1,
      'ORDINARY_2': 12.1,
      'EXTRA': 9.3
    };
    
    const coveragePerHead = coverageMap[hazard] || 12.1;
    const requiredHeads = Math.ceil(area / coveragePerHead);
    
    const resultDiv = document.getElementById('sprinkler-calc-result');
    resultDiv.innerHTML = `
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid var(--success-400);">
        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">Kebutuhan Sprinkler Head</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-400);">${requiredHeads} head</div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px;">
          Coverage: ${coveragePerHead} m² per head (${hazard} hazard)
        </div>
      </div>
    `;
    resultDiv.style.display = 'block';
  };
  
  // Save functions
  window.saveApar = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const data = {
      project_id: currentProjectId,
      code: form.code.value,
      type: form.type.value,
      capacity: parseFloat(form.capacity.value),
      location: form.location.value,
      manufacture_year: parseInt(form.manufacture_year.value),
      expiry_date: form.expiry_date.value,
      condition: form.condition.value,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('fire_apar').insert(data);
      await loadFireData();
      renderCurrentTab();
      closeModal('apar-modal');
      form.reset();
      showSuccess('Data APAR berhasil disimpan');
    } catch (e) {
      showError('Gagal menyimpan: ' + e.message);
    }
  };
  
  window.saveHydrant = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const data = {
      project_id: currentProjectId,
      code: form.code.value,
      type: form.type.value,
      location: form.location.value,
      condition: form.condition.value,
      pipe_diameter: parseFloat(form.pipe_diameter.value) || null,
      outlet_count: parseInt(form.outlet_count.value) || null,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('fire_hydrant').insert(data);
      await loadFireData();
      renderCurrentTab();
      closeModal('hydrant-modal');
      form.reset();
      showSuccess('Data Hydrant berhasil disimpan');
    } catch (e) {
      showError('Gagal menyimpan: ' + e.message);
    }
  };
  
  window.saveSprinkler = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const data = {
      project_id: currentProjectId,
      code: form.code.value,
      type: form.type.value,
      zone: form.zone.value,
      location: form.location.value,
      k_factor: parseFloat(form.k_factor.value) || null,
      coverage_area: parseFloat(form.coverage_area.value) || null,
      condition: form.condition.value,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('fire_sprinkler').insert(data);
      await loadFireData();
      renderCurrentTab();
      closeModal('sprinkler-modal');
      form.reset();
      showSuccess('Data Sprinkler berhasil disimpan');
    } catch (e) {
      showError('Gagal menyimpan: ' + e.message);
    }
  };
  
  window.saveDetector = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const data = {
      project_id: currentProjectId,
      code: form.code.value,
      type: form.type.value,
      zone: form.zone.value,
      location: form.location.value,
      sensitivity: form.sensitivity.value,
      battery_status: form.battery_status.value,
      condition: form.condition.value,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('fire_detector').insert(data);
      await loadFireData();
      renderCurrentTab();
      closeModal('detector-modal');
      form.reset();
      showSuccess('Data Detector berhasil disimpan');
    } catch (e) {
      showError('Gagal menyimpan: ' + e.message);
    }
  };
  
  window.saveFireAlarm = async (e) => {
    e.preventDefault();
    showInfo('Data Fire Alarm akan disimpan saat fitur backend tersedia');
  };
  
  // Placeholder functions for edit/inspect/test
  window.editApar = (id) => showInfo('Fitur edit APAR dalam pengembangan');
  window.inspectApar = (id) => showInfo('Fitur inspeksi APAR dalam pengembangan');
  window.editHydrant = (id) => showInfo('Fitur edit Hydrant dalam pengembangan');
  window.testHydrant = (id) => showInfo('Fitur flow test Hydrant dalam pengembangan');
  window.editSprinkler = (id) => showInfo('Fitur edit Sprinkler dalam pengembangan');
  window.testSprinkler = (id) => showInfo('Fitur flow test Sprinkler dalam pengembangan');
  window.editDetector = (id) => showInfo('Fitur edit Detector dalam pengembangan');
  window.testDetector = (id) => showInfo('Fitur test Detector dalam pengembangan');
}

// ============================================================
// WINDOW EXPORTS - Render Functions
// ============================================================

window.renderDashboardTab = renderDashboardTab;
window.renderCurrentTab = renderCurrentTab;
window._switchFireTab = _switchFireTab;
