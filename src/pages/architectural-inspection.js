// ============================================================
// ARCHITECTURAL INSPECTION - MAIN PAGE
// Pemeriksaan Arsitektur & Kenyamanan SLF
// Integrates: Daylight Factor, Ventilation, Noise, Vibration
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let archData = {
  summary: null,
  daylightMeasurements: [],
  ventilationSystems: [],
  noiseMeasurements: [],
  vibrationMeasurements: []
};
let currentTab = 'dashboard';

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function architecturalInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadArchData();
  
  return renderPage();
}

export function afterArchitecturalInspectionRender() {
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
      .select('id, nama_bangunan, alamat, luas_bangunan, jumlah_lantai')
      .eq('id', currentProjectId)
      .single();
    
    if (data) {
      currentProjectName = data.nama_bangunan;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadArchData() {
  try {
    // Load summary
    const { data: summaryData } = await supabase
      .from('architectural_summary')
      .select('*')
      .eq('project_id', currentProjectId)
      .single();
    
    archData.summary = summaryData;
    
    // Load daylight measurements
    const { data: daylightData } = await supabase
      .from('architectural_daylight')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    archData.daylightMeasurements = daylightData || [];
    
    // Load ventilation systems
    const { data: ventData } = await supabase
      .from('architectural_ventilation')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    archData.ventilationSystems = ventData || [];
    
    // Load noise measurements
    const { data: noiseData } = await supabase
      .from('architectural_noise')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    archData.noiseMeasurements = noiseData || [];
    
    // Load vibration measurements
    const { data: vibData } = await supabase
      .from('architectural_vibration')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    archData.vibrationMeasurements = vibData || [];
    
  } catch (e) {
    console.error('Error loading architectural data:', e);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="architectural-inspection-page" style="padding: var(--space-6); max-width: 1400px; margin: 0 auto;">
      ${renderHeaderCard()}
      <div id="arch-content" class="arch-content">
        <!-- Tab content will be rendered here -->
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getArchStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="arch-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-home" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--gold-400);">PHASE 03A</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Arsitektur & Kenyamanan</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); border: 1px solid hsla(45, 90%, 60%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>SNI & ASHRAE
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi kenyamanan bangunan: pencahayaan alami (Daylight Factor), ventilasi (ACH), 
        kebisingan (dB, NC curves), dan getaran. Mengacu pada SNI dan standar internasional.
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchArchTab('dashboard', this)" 
                class="arch-tab-item active"
                data-tab="dashboard"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-tachometer-alt"></i> DASHBOARD
        </button>
        <button onclick="window._switchArchTab('daylight', this)" 
                class="arch-tab-item"
                data-tab="daylight"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-sun"></i> PENCAYAAN
        </button>
        <button onclick="window._switchArchTab('ventilation', this)" 
                class="arch-tab-item"
                data-tab="ventilation"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-wind"></i> VENTILASI
        </button>
        <button onclick="window._switchArchTab('noise', this)" 
                class="arch-tab-item"
                data-tab="noise"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-volume-up"></i> KEBISINGAN
        </button>
        <button onclick="window._switchArchTab('vibration', this)" 
                class="arch-tab-item"
                data-tab="vibration"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-wave-square"></i> GETARAN
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('arch-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'dashboard':
      contentDiv.innerHTML = renderDashboardTab();
      break;
    case 'daylight':
      contentDiv.innerHTML = renderDaylightTab();
      break;
    case 'ventilation':
      contentDiv.innerHTML = renderVentilationTab();
      break;
    case 'noise':
      contentDiv.innerHTML = renderNoiseTab();
      break;
    case 'vibration':
      contentDiv.innerHTML = renderVibrationTab();
      break;
  }
}

function renderDashboardTab() {
  const summary = archData.summary || {};
  const dfAvg = archData.daylightMeasurements.length > 0 
    ? (archData.daylightMeasurements.reduce((sum, d) => sum + (d.df_percent || 0), 0) / archData.daylightMeasurements.length).toFixed(1)
    : 'N/A';
  const achAvg = archData.ventilationSystems.length > 0
    ? (archData.ventilationSystems.reduce((sum, v) => sum + (v.ach || 0), 0) / archData.ventilationSystems.length).toFixed(1)
    : 'N/A';
  
  return `
    <div id="arch-tab-dashboard" class="arch-tab-content active">
      <!-- Summary Cards -->
      <div class="grid-4-col" style="gap: 16px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400); margin: 0 auto 12px;">
            <i class="fas fa-sun" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${dfAvg}%</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Avg Daylight Factor</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">${archData.daylightMeasurements.length} measurement points</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-wind" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${achAvg}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Avg ACH (Air Changes)</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">${archData.ventilationSystems.length} zones</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400); margin: 0 auto 12px;">
            <i class="fas fa-volume-up" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${archData.noiseMeasurements.length}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Noise Measurements</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">dB readings</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400); margin: 0 auto 12px;">
            <i class="fas fa-wave-square" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${archData.vibrationMeasurements.length}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Vibration Tests</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">mm/s</div>
        </div>
      </div>
      
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Standards Summary -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-clipboard-list" style="margin-right: 8px; color: var(--brand-400);"></i>
            Ringkasan Standar
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Daylight Factor (SNI 03-2396-2001)</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                • Ruang kerja: min 1.0% - 2.0%<br>
                • Ruang kelas: min 2.0%<br>
                • Koridor: min 0.5%
              </div>
            </div>
            
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Ventilasi (ASHRAE 62.1)</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                • Office: 4-6 ACH<br>
                • Kelas: 5-8 ACH<br>
                • Rumah sakit: 6-12 ACH
              </div>
            </div>
            
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Kebisingan (SNI 8421:2017)</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                • Ruang kerja: NC 35-45 (45-55 dB)<br>
                • Rumah sakit: NC 25-35<br>
                • Industri: NC 50-65
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quick Calculators -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-calculator" style="margin-right: 8px; color: var(--success-400);"></i>
            Kalkulator Cepat
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="btn btn-primary btn-sm" style="justify-content: flex-start;" onclick="window._switchArchTab('daylight', document.querySelector('[data-tab=daylight]'))">
              <i class="fas fa-sun" style="margin-right: 8px;"></i>
              Daylight Factor Calculator
            </button>
            <button class="btn btn-primary btn-sm" style="justify-content: flex-start;" onclick="window._switchArchTab('ventilation', document.querySelector('[data-tab=ventilation]'))">
              <i class="fas fa-wind" style="margin-right: 8px;"></i>
              ACH (Air Changes) Calculator
            </button>
            <button class="btn btn-primary btn-sm" style="justify-content: flex-start;" onclick="window._switchArchTab('noise', document.querySelector('[data-tab=noise]'))">
              <i class="fas fa-volume-up" style="margin-right: 8px;"></i>
              Noise Criteria (NC) Calculator
            </button>
            <button class="btn btn-primary btn-sm" style="justify-content: flex-start;" onclick="window._switchArchTab('vibration', document.querySelector('[data-tab=vibration]'))">
              <i class="fas fa-wave-square" style="margin-right: 8px;"></i>
              Vibration Criteria Check
            </button>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">
              <i class="fas fa-info-circle" style="margin-right: 6px;"></i>TIPS
            </div>
            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
              Gunakan fitur simulasi untuk memprediksi kenyamanan sebelum konstruksi. 
              Data hasil pengukuran dapat diinput untuk verifikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDaylightTab() {
  return `
    <div id="arch-tab-daylight" class="arch-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Daylight Factor Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-sun" style="margin-right: 8px; color: var(--gold-400);"></i>
              Kalkulator Daylight Factor
            </h4>
            <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); font-size: 9px;">SNI 03-2396-2001</span>
          </div>
          
          <form id="df-form" onsubmit="calculateDaylightFactor(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Nama Ruangan</label>
              <input type="text" id="df-room" class="form-input-dark" placeholder="e.g., Ruang Kelas A">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Illuminance Internal (lux)</label>
                <input type="number" id="df-internal" class="form-input-dark" placeholder="Contoh: 250" step="1" min="1">
              </div>
              <div>
                <label class="form-label">Illuminance External (lux)</label>
                <input type="number" id="df-external" class="form-input-dark" placeholder="Contoh: 10000" step="1" min="1">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">DF Minimum Required (%)</label>
              <select id="df-required" class="form-input-dark">
                <option value="0.5">0.5% - Koridor</option>
                <option value="1.0" selected>1.0% - Ruang Kerja</option>
                <option value="1.5">1.5% - Ruang Rapat</option>
                <option value="2.0">2.0% - Ruang Kelas</option>
                <option value="3.0">3.0% - Ruang Operasi</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung Daylight Factor
            </button>
          </form>
          
          <div id="df-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Daylight Measurements -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-clipboard-list" style="margin-right: 8px; color: var(--success-400);"></i>
              Hasil Pengukuran
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showDaylightMeasurementModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${archData.daylightMeasurements.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data pengukuran daylight.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 350px; overflow-y: auto;">
              ${archData.daylightMeasurements.map(m => {
                const isPass = (m.df_percent || 0) >= (m.required_df || 1.0);
                return `
                  <div class="card-quartz" style="padding: 12px; border-left: 3px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; background: hsla(220, 20%, 100%, 0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-weight: 700; color: white;">${m.room_name || 'Ruangan'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">
                          Int: ${m.internal_lux || 0} lux | Ext: ${m.external_lux || 0} lux
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 800; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; font-size: 1.1rem;">
                          ${m.df_percent || 0}%
                        </div>
                        <div style="font-size: 0.65rem; color: var(--text-tertiary);">
                          Min: ${m.required_df || 1.0}%
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
              <i class="fas fa-lightbulb" style="margin-right: 6px;"></i>RUMUS
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; font-family: var(--font-mono);">
              DF = (Illuminance Internal / Illuminance External) × 100%
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderVentilationTab() {
  return `
    <div id="arch-tab-ventilation" class="arch-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- ACH Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-wind" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator ACH
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">ASHRAE 62.1</span>
          </div>
          
          <form id="ach-form" onsubmit="calculateACH(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Nama Ruangan / Zone</label>
              <input type="text" id="ach-room" class="form-input-dark" placeholder="e.g., Office Zone A">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Air Flow Rate (m³/h)</label>
                <input type="number" id="ach-flow" class="form-input-dark" placeholder="Contoh: 1200" step="1" min="1">
              </div>
              <div>
                <label class="form-label">Volume Ruangan (m³)</label>
                <input type="number" id="ach-volume" class="form-input-dark" placeholder="Contoh: 200" step="0.1" min="1">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">ACH Minimum Required</label>
              <select id="ach-required" class="form-input-dark">
                <option value="2">2 ACH - Storage</option>
                <option value="4" selected>4 ACH - Office</option>
                <option value="6">6 ACH - Classroom</option>
                <option value="8">8 ACH - Healthcare</option>
                <option value="12">12 ACH - Operating Room</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung ACH
            </button>
          </form>
          
          <div id="ach-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Ventilation Systems -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-fan" style="margin-right: 8px; color: var(--success-400);"></i>
              Sistem Ventilasi
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showVentilationModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${archData.ventilationSystems.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data sistem ventilasi.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto;">
              ${archData.ventilationSystems.map(v => {
                const isPass = (v.ach || 0) >= (v.required_ach || 4);
                return `
                  <div class="card-quartz" style="padding: 12px; border-left: 3px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; background: hsla(220, 20%, 100%, 0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-weight: 700; color: white;">${v.zone_name || 'Zone'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${v.system_type || 'Mechanical'}</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 800; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; font-size: 1.1rem;">
                          ${v.ach || 0} ACH
                        </div>
                        <div style="font-size: 0.65rem; color: var(--text-tertiary);">
                          Min: ${v.required_ach || 4} ACH
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
              <i class="fas fa-lightbulb" style="margin-right: 6px;"></i>RUMUS
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; font-family: var(--font-mono);">
              ACH = (Air Flow Rate × 3600) / Room Volume
            </p>
          </div>
        </div>
      </div>
      
      <!-- ACH Standards -->
      <div class="card-quartz" style="padding: 20px; margin-top: 20px;">
        <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-table" style="color: var(--brand-400); margin-right: 6px;"></i>
          Standar ACH (ASHRAE 62.1 & SNI)
        </h5>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Office / Workspace</div>
            <div style="font-size: 1rem; color: white; font-weight: 700;">4-6 ACH</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">15-20 CFM/person</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Classroom / Education</div>
            <div style="font-size: 1rem; color: white; font-weight: 700;">5-8 ACH</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">10-15 CFM/person</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Healthcare / Patient</div>
            <div style="font-size: 1rem; color: white; font-weight: 700;">6-12 ACH</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">25 CFM/person</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNoiseTab() {
  return `
    <div id="arch-tab-noise" class="arch-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- NC Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-volume-up" style="margin-right: 8px; color: var(--danger-400);"></i>
              Noise Criteria (NC)
            </h4>
            <span class="badge" style="background: hsla(0, 85%, 60%, 0.1); color: var(--danger-400); font-size: 9px;">SNI 8421:2017</span>
          </div>
          
          <form id="nc-form" onsubmit="calculateNC(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Nama Ruangan</label>
              <input type="text" id="nc-room" class="form-input-dark" placeholder="e.g., Meeting Room A">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Sound Pressure Level (dB)</label>
                <input type="number" id="nc-dba" class="form-input-dark" placeholder="Contoh: 45" step="0.1" min="20" max="100">
              </div>
              <div>
                <label class="form-label">Frequency (Hz)</label>
                <select id="nc-freq" class="form-input-dark">
                  <option value="500">500 Hz</option>
                  <option value="1000" selected>1000 Hz</option>
                  <option value="2000">2000 Hz</option>
                  <option value="4000">4000 Hz</option>
                </select>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">NC Curve Target</label>
              <select id="nc-target" class="form-input-dark">
                <option value="25">NC 25 - Concert Hall / Recording</option>
                <option value="30">NC 30 - Private Office / Hospital</option>
                <option value="35" selected>NC 35 - General Office</option>
                <option value="40">NC 40 - Open Office</option>
                <option value="45">NC 45 - Retail / Light Industry</option>
                <option value="50">NC 50 - Industry / Workshop</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Evaluasi Noise Level
            </button>
          </form>
          
          <div id="nc-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Noise Measurements -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-microphone" style="margin-right: 8px; color: var(--success-400);"></i>
              Data Pengukuran
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showNoiseModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${archData.noiseMeasurements.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data pengukuran kebisingan.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto;">
              ${archData.noiseMeasurements.map(m => {
                const isPass = (m.nc_rating || 99) <= (m.target_nc || 35);
                return `
                  <div class="card-quartz" style="padding: 12px; border-left: 3px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; background: hsla(220, 20%, 100%, 0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-weight: 700; color: white;">${m.room_name || 'Ruangan'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${m.db_level || 0} dB @ ${m.frequency || 1000}Hz</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 800; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; font-size: 1.1rem;">
                          NC ${m.nc_rating || 'N/A'}
                        </div>
                        <div style="font-size: 0.65rem; color: var(--text-tertiary);">
                          Target: NC ${m.target_nc || 35}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
          }
        </div>
      </div>
      
      <!-- NC Reference Table -->
      <div class="card-quartz" style="padding: 20px; margin-top: 20px;">
        <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-headphones" style="color: var(--brand-400); margin-right: 6px;"></i>
          Noise Criteria Reference (SNI 8421:2017)
        </h5>
        <div style="overflow-x: auto;">
          <table style="width: 100%; font-size: 0.75rem;">
            <thead>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">
                <th style="text-align: left; padding: 8px; color: var(--text-tertiary);">Room Type</th>
                <th style="text-align: center; padding: 8px; color: var(--text-tertiary);">NC Range</th>
                <th style="text-align: center; padding: 8px; color: var(--text-tertiary);">dBA Range</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                <td style="padding: 8px; color: var(--text-secondary);">Concert Hall / Recording</td>
                <td style="padding: 8px; color: white; text-align: center;">NC 15-20</td>
                <td style="padding: 8px; color: white; text-align: center;">30-35</td>
              </tr>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                <td style="padding: 8px; color: var(--text-secondary);">Hospital / Patient Room</td>
                <td style="padding: 8px; color: white; text-align: center;">NC 25-30</td>
                <td style="padding: 8px; color: white; text-align: center;">35-40</td>
              </tr>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                <td style="padding: 8px; color: var(--text-secondary);">Private Office</td>
                <td style="padding: 8px; color: white; text-align: center;">NC 30-35</td>
                <td style="padding: 8px; color: white; text-align: center;">40-45</td>
              </tr>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                <td style="padding: 8px; color: var(--text-secondary);">General Office</td>
                <td style="padding: 8px; color: white; text-align: center;">NC 35-40</td>
                <td style="padding: 8px; color: white; text-align: center;">45-50</td>
              </tr>
              <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                <td style="padding: 8px; color: var(--text-secondary);">Open Office / Retail</td>
                <td style="padding: 8px; color: white; text-align: center;">NC 40-45</td>
                <td style="padding: 8px; color: white; text-align: center;">50-55</td>
              </tr>
              <tr>
                <td style="padding: 8px; color: var(--text-secondary);">Factory / Workshop</td>
                <td style="padding: 8px; color: white; text-align: center;">NC 50-65</td>
                <td style="padding: 8px; color: white; text-align: center;">55-70</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderVibrationTab() {
  return `
    <div id="arch-tab-vibration" class="arch-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Vibration Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-wave-square" style="margin-right: 8px; color: var(--danger-400);"></i>
              Vibration Criteria
            </h4>
            <span class="badge" style="background: hsla(0, 85%, 60%, 0.1); color: var(--danger-400); font-size: 9px;">ISO 2631</span>
          </div>
          
          <form id="vib-form" onsubmit="calculateVibration(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Lokasi / Equipment</label>
              <input type="text" id="vib-location" class="form-input-dark" placeholder="e.g., HVAC Unit A / Ruang Rapat">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Vibration Velocity (mm/s)</label>
                <input type="number" id="vib-velocity" class="form-input-dark" placeholder="Contoh: 2.5" step="0.1" min="0">
              </div>
              <div>
                <label class="form-label">Frequency (Hz)</label>
                <input type="number" id="vib-freq" class="form-input-dark" placeholder="Contoh: 16" step="1" min="1" value="16">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Building Use Category</label>
              <select id="vib-category" class="form-input-dark">
                <option value="RESIDENTIAL" selected>Residential / Hospital (0.15-0.3 mm/s)</option>
                <option value="OFFICE">Office / Commercial (0.3-0.6 mm/s)</option>
                <option value="INDUSTRIAL">Light Industrial (0.6-1.2 mm/s)</option>
                <option value="HEAVY">Heavy Industrial (>1.2 mm/s)</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Evaluasi Vibration
            </button>
          </form>
          
          <div id="vib-result" style="margin-top: 20px; display: none;">
            <!-- Result will be rendered here -->
          </div>
        </div>
        
        <!-- Vibration Measurements -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-chart-line" style="margin-right: 8px; color: var(--success-400);"></i>
              Data Pengukuran
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showVibrationModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          
          ${archData.vibrationMeasurements.length === 0 ? 
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data pengukuran getaran.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto;">
              ${archData.vibrationMeasurements.map(m => {
                const limits = {
                  'RESIDENTIAL': 0.3,
                  'OFFICE': 0.6,
                  'INDUSTRIAL': 1.2,
                  'HEAVY': 2.0
                };
                const limit = limits[m.category || 'OFFICE'] || 0.6;
                const isPass = (m.velocity_mm_s || 0) <= limit;
                return `
                  <div class="card-quartz" style="padding: 12px; border-left: 3px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; background: hsla(220, 20%, 100%, 0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-weight: 700; color: white;">${m.location || 'Lokasi'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${m.category || 'Office'}</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 800; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; font-size: 1.1rem;">
                          ${m.velocity_mm_s || 0} mm/s
                        </div>
                        <div style="font-size: 0.65rem; color: var(--text-tertiary);">
                          Limit: ${limit} mm/s
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
          }
        </div>
      </div>
      
      <!-- Vibration Standards -->
      <div class="card-quartz" style="padding: 20px; margin-top: 20px;">
        <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-info-circle" style="color: var(--brand-400); margin-right: 6px;"></i>
          Vibration Criteria Reference (ISO 2631 / DIN 4150)
        </h5>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Residential / Hospital</div>
            <div style="font-size: 1rem; color: white; font-weight: 700;">0.15 - 0.30 mm/s</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Continuous vibration</div>
          </div>
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Office / Commercial</div>
            <div style="font-size: 1rem; color: white; font-weight: 700;">0.30 - 0.60 mm/s</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Daytime operation</div>
          </div>
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Light Industrial</div>
            <div style="font-size: 1rem; color: white; font-weight: 700;">0.60 - 1.20 mm/s</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Workshop areas</div>
          </div>
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Heavy Industrial</div>
            <div style="font-size: 1rem; color: white; font-weight: 700;">1.20 - 2.00+ mm/s</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Heavy machinery</div>
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
    <!-- Daylight Measurement Modal -->
    <div id="daylight-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-sun"></i> Tambah Pengukuran Daylight</h3>
          <button class="modal-close" onclick="closeModal('daylight-modal')">&times;</button>
        </div>
        <form id="daylight-form" onsubmit="saveDaylightMeasurement(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Nama Ruangan *</label>
              <input type="text" name="room_name" required placeholder="e.g., Office Zone A">
            </div>
            <div class="form-group">
              <label>Internal Lux *</label>
              <input type="number" name="internal_lux" required step="1" min="1" placeholder="e.g., 250">
            </div>
            <div class="form-group">
              <label>External Lux *</label>
              <input type="number" name="external_lux" required step="1" min="1" placeholder="e.g., 10000">
            </div>
            <div class="form-group">
              <label>DF Minimum Required *</label>
              <select name="required_df" required>
                <option value="0.5">0.5% - Koridor</option>
                <option value="1.0" selected>1.0% - Ruang Kerja</option>
                <option value="1.5">1.5% - Ruang Rapat</option>
                <option value="2.0">2.0% - Ruang Kelas</option>
                <option value="3.0">3.0% - Ruang Operasi</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Keterangan</label>
              <input type="text" name="notes" placeholder="e.g., Waktu pengukuran: 12:00 siang">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('daylight-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Ventilation Modal -->
    <div id="ventilation-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-fan"></i> Tambah Sistem Ventilasi</h3>
          <button class="modal-close" onclick="closeModal('ventilation-modal')">&times;</button>
        </div>
        <form id="ventilation-form" onsubmit="saveVentilation(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Nama Zone *</label>
              <input type="text" name="zone_name" required placeholder="e.g., Office Wing A">
            </div>
            <div class="form-group">
              <label>Tipe Sistem</label>
              <select name="system_type">
                <option value="AC_Split" selected>AC Split</option>
                <option value="AHU">Air Handling Unit (AHU)</option>
                <option value="VRF">VRF/VRV System</option>
                <option value="Chilled_Water">Chilled Water</option>
                <option value="Natural">Natural Ventilation</option>
              </select>
            </div>
            <div class="form-group">
              <label>Air Flow Rate (m³/h) *</label>
              <input type="number" name="flow_rate" required step="1" min="1" placeholder="e.g., 1200">
            </div>
            <div class="form-group">
              <label>Volume Ruangan (m³) *</label>
              <input type="number" name="volume" required step="0.1" min="1" placeholder="e.g., 200">
            </div>
            <div class="form-group">
              <label>ACH Required *</label>
              <select name="required_ach" required>
                <option value="2">2 ACH</option>
                <option value="4" selected>4 ACH</option>
                <option value="6">6 ACH</option>
                <option value="8">8 ACH</option>
                <option value="12">12 ACH</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Equipment ID</label>
              <input type="text" name="equipment_id" placeholder="e.g., AHU-01-FL-2">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('ventilation-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Noise Modal -->
    <div id="noise-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-volume-up"></i> Tambah Pengukuran Kebisingan</h3>
          <button class="modal-close" onclick="closeModal('noise-modal')">&times;</button>
        </div>
        <form id="noise-form" onsubmit="saveNoiseMeasurement(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Nama Ruangan *</label>
              <input type="text" name="room_name" required placeholder="e.g., Meeting Room B">
            </div>
            <div class="form-group">
              <label>Sound Level (dB) *</label>
              <input type="number" name="db_level" required step="0.1" min="20" max="120" placeholder="e.g., 45.5">
            </div>
            <div class="form-group">
              <label>Frequency (Hz)</label>
              <select name="frequency">
                <option value="125">125 Hz</option>
                <option value="250">250 Hz</option>
                <option value="500">500 Hz</option>
                <option value="1000" selected>1000 Hz</option>
                <option value="2000">2000 Hz</option>
                <option value="4000">4000 Hz</option>
              </select>
            </div>
            <div class="form-group">
              <label>NC Target *</label>
              <select name="target_nc" required>
                <option value="25">NC 25</option>
                <option value="30">NC 30</option>
                <option value="35" selected>NC 35</option>
                <option value="40">NC 40</option>
                <option value="45">NC 45</option>
                <option value="50">NC 50</option>
              </select>
            </div>
            <div class="form-group">
              <label>NC Rating (Hasil)</label>
              <input type="number" name="nc_rating" step="1" placeholder="Auto-calculated atau input manual">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Catatan</label>
              <input type="text" name="notes" placeholder="e.g., Noise dari equipment HVAC">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('noise-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Vibration Modal -->
    <div id="vibration-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-wave-square"></i> Tambah Pengukuran Getaran</h3>
          <button class="modal-close" onclick="closeModal('vibration-modal')">&times;</button>
        </div>
        <form id="vibration-form" onsubmit="saveVibrationMeasurement(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Ruang Rapat / HVAC Unit 1">
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select name="category" required>
                <option value="RESIDENTIAL">Residential / Hospital</option>
                <option value="OFFICE" selected>Office / Commercial</option>
                <option value="INDUSTRIAL">Light Industrial</option>
                <option value="HEAVY">Heavy Industrial</option>
              </select>
            </div>
            <div class="form-group">
              <label>Vibration Velocity (mm/s) *</label>
              <input type="number" name="velocity_mm_s" required step="0.01" min="0" placeholder="e.g., 0.45">
            </div>
            <div class="form-group">
              <label>Frequency (Hz)</label>
              <input type="number" name="frequency" step="1" min="1" value="16" placeholder="e.g., 16">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Sumber Getaran</label>
              <input type="text" name="source" placeholder="e.g., HVAC, Generator, Elevator">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Catatan</label>
              <input type="text" name="notes" placeholder="e.g., Getaran terasa saat beroperasi">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('vibration-modal')">Batal</button>
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

function getArchStyles() {
  return `
    .arch-content {
      min-height: 400px;
    }
    
    .arch-tab-content {
      display: none;
    }
    
    .arch-tab-content.active {
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
    
    .btn-secondary {
      padding: 10px 20px;
      background: hsla(220, 20%, 100%, 0.05);
      border: 1px solid hsla(220, 20%, 100%, 0.2);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .btn-secondary:hover {
      background: hsla(220, 20%, 100%, 0.1);
      color: white;
    }
    
    .btn-primary {
      padding: 10px 20px;
      background: var(--gradient-brand);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-sapphire);
    }
  `;
}

// ============================================================
// EVENT HANDLERS & TAB FUNCTIONS
// ============================================================

function _switchArchTab(tabId, btn) {
  currentTab = tabId;
  
  document.querySelectorAll('.arch-tab-item').forEach(item => {
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

function showDaylightMeasurementModal() {
  const modal = document.getElementById('daylight-modal');
  if (modal) modal.style.display = 'flex';
}

function showVentilationModal() {
  const modal = document.getElementById('ventilation-modal');
  if (modal) modal.style.display = 'flex';
}

function showNoiseModal() {
  const modal = document.getElementById('noise-modal');
  if (modal) modal.style.display = 'flex';
}

function showVibrationModal() {
  const modal = document.getElementById('vibration-modal');
  if (modal) modal.style.display = 'flex';
}

function calculateDaylightFactor(e) {
  e.preventDefault();
  
  const room = document.getElementById('df-room').value || 'Room';
  const internal = parseFloat(document.getElementById('df-internal').value) || 0;
  const external = parseFloat(document.getElementById('df-external').value) || 1;
  const required = parseFloat(document.getElementById('df-required').value) || 1.0;
  
  const df = external > 0 ? (internal / external) * 100 : 0;
  const isPass = df >= required;
  
  const resultDiv = document.getElementById('df-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">${room}</div>
        <div style="font-size: 2rem; font-weight: 800; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}">${df.toFixed(2)}%</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
        <div>
          <div style="color: var(--text-tertiary);">Required</div>
          <div style="color: white; font-weight: 600;">${required}%</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Status</div>
          <div style="color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; font-weight: 600;">
            ${isPass ? '✓ PASS' : '✗ FAIL'}
          </div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

function calculateACH(e) {
  e.preventDefault();
  
  const room = document.getElementById('ach-room').value || 'Zone';
  const flow = parseFloat(document.getElementById('ach-flow').value) || 0;
  const volume = parseFloat(document.getElementById('ach-volume').value) || 1;
  const required = parseFloat(document.getElementById('ach-required').value) || 4;
  
  const ach = volume > 0 ? flow / volume : 0;
  const isPass = ach >= required;
  
  const resultDiv = document.getElementById('ach-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">${room}</div>
        <div style="font-size: 2rem; font-weight: 800; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}">${ach.toFixed(1)} ACH</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
        <div>
          <div style="color: var(--text-tertiary);">Required</div>
          <div style="color: white; font-weight: 600;">${required} ACH</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Status</div>
          <div style="color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; font-weight: 600;">
            ${isPass ? '✓ PASS' : '✗ FAIL'}
          </div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

function calculateNC(e) {
  e.preventDefault();
  
  const room = document.getElementById('nc-room').value || 'Room';
  const dba = parseFloat(document.getElementById('nc-dba').value) || 0;
  const target = parseInt(document.getElementById('nc-target').value) || 35;
  
  // Simplified NC estimation: NC ≈ dBA - 10 (approximate)
  const nc = Math.max(15, Math.round(dba - 10));
  const isPass = nc <= target;
  
  const resultDiv = document.getElementById('nc-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">${room}</div>
        <div style="font-size: 2rem; font-weight: 800; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}">NC ${nc}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">${dba} dBA measured</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
        <div>
          <div style="color: var(--text-tertiary);">Target NC</div>
          <div style="color: white; font-weight: 600;">${target}</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Status</div>
          <div style="color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}; font-weight: 600;">
            ${isPass ? '✓ PASS' : '✗ FAIL'}
          </div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

function calculateVibration(e) {
  e.preventDefault();
  
  const location = document.getElementById('vib-location').value || 'Location';
  const velocity = parseFloat(document.getElementById('vib-velocity').value) || 0;
  const category = document.getElementById('vib-category').value || 'OFFICE';
  
  const limits = {
    'RESIDENTIAL': 0.3,
    'OFFICE': 0.6,
    'INDUSTRIAL': 1.2,
    'HEAVY': 2.0
  };
  
  const limit = limits[category] || 0.6;
  const isPass = velocity <= limit;
  const margin = limit - velocity;
  
  const resultDiv = document.getElementById('vib-result');
  resultDiv.innerHTML = `
    <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border: 1px solid ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">${location}</div>
        <div style="font-size: 2rem; font-weight: 800; color: ${isPass ? 'var(--success-400)' : 'var(--warning-400)'}">${velocity.toFixed(2)} mm/s</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 0.7rem; text-align: center;">
        <div>
          <div style="color: var(--text-tertiary);">Category</div>
          <div style="color: white; font-weight: 600;">${category}</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Limit</div>
          <div style="color: white; font-weight: 600;">${limit} mm/s</div>
        </div>
        <div>
          <div style="color: var(--text-tertiary);">Margin</div>
          <div style="color: ${margin >= 0 ? 'var(--success-400)' : 'var(--warning-400)'}; font-weight: 600;">${margin.toFixed(2)} mm/s</div>
        </div>
      </div>
    </div>
  `;
  resultDiv.style.display = 'block';
}

async function saveDaylightMeasurement(e) {
  e.preventDefault();
  const form = e.target;
  
  const internal = parseFloat(form.internal_lux.value);
  const external = parseFloat(form.external_lux.value);
  const required = parseFloat(form.required_df.value);
  const df = external > 0 ? (internal / external) * 100 : 0;
  
  const data = {
    project_id: currentProjectId,
    room_name: form.room_name.value,
    internal_lux: internal,
    external_lux: external,
    df_percent: parseFloat(df.toFixed(2)),
    required_df: required,
    notes: form.notes.value || null,
    created_at: new Date().toISOString()
  };
  
  try {
    await supabase.from('architectural_daylight').insert(data);
    await loadArchData();
    renderCurrentTab();
    closeModal('daylight-modal');
    form.reset();
    showSuccess('Data pengukuran daylight berhasil disimpan');
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

async function saveVentilationSystem(e) {
  e.preventDefault();
  const form = e.target;
  
  const flow = parseFloat(form.flow_rate.value);
  const volume = parseFloat(form.volume.value);
  const required = parseFloat(form.required_ach.value);
  const ach = volume > 0 ? flow / volume : 0;
  
  const data = {
    project_id: currentProjectId,
    zone_name: form.zone_name.value,
    system_type: form.system_type.value,
    flow_rate: flow,
    volume: volume,
    ach: parseFloat(ach.toFixed(2)),
    required_ach: required,
    equipment_id: form.equipment_id.value || null,
    created_at: new Date().toISOString()
  };
  
  try {
    await supabase.from('architectural_ventilation').insert(data);
    await loadArchData();
    renderCurrentTab();
    closeModal('ventilation-modal');
    form.reset();
    showSuccess('Data sistem ventilasi berhasil disimpan');
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

async function saveNoiseMeasurement(e) {
  e.preventDefault();
  const form = e.target;
  
  const data = {
    project_id: currentProjectId,
    room_name: form.room_name.value,
    db_level: parseFloat(form.db_level.value),
    frequency: parseInt(form.frequency.value),
    target_nc: parseInt(form.target_nc.value),
    nc_rating: form.nc_rating.value ? parseInt(form.nc_rating.value) : null,
    notes: form.notes.value || null,
    created_at: new Date().toISOString()
  };
  
  try {
    await supabase.from('architectural_noise').insert(data);
    await loadArchData();
    renderCurrentTab();
    closeModal('noise-modal');
    form.reset();
    showSuccess('Data pengukuran kebisingan berhasil disimpan');
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

async function saveVibrationMeasurement(e) {
  e.preventDefault();
  const form = e.target;
  
  const data = {
    project_id: currentProjectId,
    location: form.location.value,
    category: form.category.value,
    velocity_mm_s: parseFloat(form.velocity_mm_s.value),
    frequency: form.frequency.value ? parseInt(form.frequency.value) : null,
    source: form.source.value || null,
    notes: form.notes.value || null,
    created_at: new Date().toISOString()
  };
  
  try {
    await supabase.from('architectural_vibration').insert(data);
    await loadArchData();
    renderCurrentTab();
    closeModal('vibration-modal');
    form.reset();
    showSuccess('Data pengukuran getaran berhasil disimpan');
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

function initEventListeners() {
  // Event listeners are now handled by the globally exported functions
  // Additional event listeners can be added here if needed
}

// ============================================================
// WINDOW EXPORTS - Standalone Functions
// ============================================================

window._switchArchTab = _switchArchTab;
window.renderDashboardTab = renderDashboardTab;
window.renderCurrentTab = renderCurrentTab;
window.closeModal = closeModal;
window.calculateDaylightFactor = calculateDaylightFactor;
window.calculateACH = calculateACH;
window.calculateNC = calculateNC;
window.calculateVibration = calculateVibration;
window.showDaylightMeasurementModal = showDaylightMeasurementModal;
window.showVentilationModal = showVentilationModal;
window.showNoiseModal = showNoiseModal;
window.showVibrationModal = showVibrationModal;
window.saveDaylightMeasurement = saveDaylightMeasurement;
window.saveVentilationSystem = saveVentilationSystem;
window.saveNoiseMeasurement = saveNoiseMeasurement;
window.saveVibrationMeasurement = saveVibrationMeasurement;
