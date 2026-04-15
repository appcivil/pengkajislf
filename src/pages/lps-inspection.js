// ============================================================
// LPS INSPECTION - MAIN PAGE (TEMPLATE)
// Pemeriksaan Sistem Proteksi Petir SLF
// Integrates: Risk Assessment, Air Terminal, Grounding, Testing
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let lpsData = {
  riskAssessment: null,
  airTerminals: [],
  groundingSystem: null,
  internalLPS: [],
  testResults: []
};
let currentTab = 'risk';

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function lpsInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  // Load project info
  await loadProjectInfo();
  
  // Load LPS data
  await loadLPSData();
  
  return renderPage();
}

export function afterLPSInspectionRender() {
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

async function loadLPSData() {
  try {
    // Load risk assessment
    const { data: riskData } = await supabase
      .from('lightning_risk_assessments')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    lpsData.riskAssessment = riskData;
    
    // Load air terminals
    const { data: terminals } = await supabase
      .from('lps_components')
      .select('*')
      .eq('project_id', currentProjectId)
      .eq('component_type', 'AIR_TERMINAL');
    
    lpsData.airTerminals = terminals || [];
    
    // Load grounding system
    const { data: grounding } = await supabase
      .from('lps_grounding_tests')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('test_date', { ascending: false })
      .limit(1)
      .single();
    
    lpsData.groundingSystem = grounding;
    
    // Load test results
    const { data: tests } = await supabase
      .from('lps_grounding_tests')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('test_date', { ascending: false });
    
    lpsData.testResults = tests || [];
    
  } catch (e) {
    console.error('Error loading LPS data:', e);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="lps-inspection-page" style="padding: var(--space-6); max-width: 1400px; margin: 0 auto;">
      ${renderHeaderCard()}
      ${renderNavigationTabs()}
      <div id="lps-content" class="lps-content">
        <!-- Tab content will be rendered here -->
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getLPSStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="lps-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-bolt" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--gold-400);">PHASE 02D</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Sistem Proteksi Petir (LPS)</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); border: 1px solid hsla(45, 90%, 60%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>SNI 03-7015-2014
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi sistem proteksi petir eksternal dan internal berdasarkan SNI 03-7015-2014 (IEC 62305). 
        Meliputi risk assessment, air terminal, down conductor, grounding system, dan pengujian ketahanan petir.
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchLPSTab('risk', this)" 
                class="lps-tab-item active"
                data-tab="risk"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-exclamation-triangle"></i> RISK ASSESSMENT
        </button>
        <button onclick="window._switchLPSTab('air-terminal', this)" 
                class="lps-tab-item"
                data-tab="air-terminal"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-broadcast-tower"></i> AIR TERMINAL
        </button>
        <button onclick="window._switchLPSTab('grounding', this)" 
                class="lps-tab-item"
                data-tab="grounding"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-globe"></i> GROUNDING
        </button>
        <button onclick="window._switchLPSTab('internal', this)" 
                class="lps-tab-item"
                data-tab="internal"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-shield-alt"></i> INTERNAL LPS
        </button>
        <button onclick="window._switchLPSTab('testing', this)" 
                class="lps-tab-item"
                data-tab="testing"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-vial"></i> TESTING
        </button>
      </div>
    </div>
  `;
}

function renderNavigationTabs() {
  return '';
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('lps-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'risk':
      contentDiv.innerHTML = renderRiskTab();
      break;
    case 'air-terminal':
      contentDiv.innerHTML = renderAirTerminalTab();
      break;
    case 'grounding':
      contentDiv.innerHTML = renderGroundingTab();
      break;
    case 'internal':
      contentDiv.innerHTML = renderInternalTab();
      break;
    case 'testing':
      contentDiv.innerHTML = renderTestingTab();
      break;
  }
}

function renderRiskTab() {
  const risk = lpsData.riskAssessment;
  
  return `
    <div id="lps-tab-risk" class="lps-tab-content active">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Risk Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-calculator" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator Risiko Petir
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-7015-2014</span>
          </div>
          
          <form id="lps-risk-form" onsubmit="calculateRisk(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Kerapatan Petir Ng (sambaran/km²/th)</label>
                <input type="number" id="risk-ng" class="form-input-dark" placeholder="Contoh: 12.5" step="0.1" value="${risk?.ng || ''}">
              </div>
              <div>
                <label class="form-label">Kelas Bangunan</label>
                <select id="risk-class" class="form-input-dark">
                  <option value="I" ${risk?.building_class === 'I' ? 'selected' : ''}>Kelas I - Rumah tinggal, sekolah</option>
                  <option value="II" ${risk?.building_class === 'II' ? 'selected' : ''}>Kelas II - Gedung perkantoran, hotel</option>
                  <option value="III" ${risk?.building_class === 'III' ? 'selected' : ''}>Kelas III - Industri, gudang</option>
                  <option value="IV" ${risk?.building_class === 'IV' ? 'selected' : ''}>Kelas IV - Bangunan vital/strategis</option>
                </select>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Panjang L (m)</label>
                <input type="number" id="risk-length" class="form-input-dark" placeholder="0" step="0.1" value="${risk?.length || ''}">
              </div>
              <div>
                <label class="form-label">Lebar W (m)</label>
                <input type="number" id="risk-width" class="form-input-dark" placeholder="0" step="0.1" value="${risk?.width || ''}">
              </div>
              <div>
                <label class="form-label">Tinggi H (m)</label>
                <input type="number" id="risk-height" class="form-input-dark" placeholder="0" step="0.1" value="${risk?.height || ''}">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Faktor Lingkungan (Cd)</label>
              <select id="risk-cd" class="form-input-dark">
                <option value="0.25" ${risk?.cd_factor === 0.25 ? 'selected' : ''}>0.25 - Dikelilingi bangunan lebih tinggi</option>
                <option value="0.5" ${risk?.cd_factor === 0.5 ? 'selected' : ''}>0.5 - Dikelilingi bangunan setinggi</option>
                <option value="1" ${risk?.cd_factor === 1 || !risk ? 'selected' : ''}>1.0 - Terisolasi, tidak bangunan lain</option>
                <option value="2" ${risk?.cd_factor === 2 ? 'selected' : ''}>2.0 - Di puncak bukit/tonjolan</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung Risiko & Kebutuhan LPS
            </button>
          </form>
          
          <div id="risk-result" style="margin-top: 20px; ${risk ? '' : 'display: none;'}'">
            ${risk ? renderRiskResult(risk) : ''}
          </div>
        </div>
        
        <!-- Risk Reference -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--success-400);"></i>
            Referensi Perhitungan
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Frekuensi Sambaran (Nd)</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Nd = Ng × Ae × 10⁻⁶ [kali/tahun]</div>
            </div>
            
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Area Ekuivalen (Ae)</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Ae = L × W + 6H(L+W) + 9πH² [m²]</div>
            </div>
            
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Toleransi Risiko (Rt)</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Rt = 10⁻⁵ sambaran/tahun (normal)</div>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px; border: 1px solid hsla(45, 90%, 60%, 0.2);">
            <div style="font-size: 0.75rem; color: var(--gold-400); font-weight: 700; margin-bottom: 8px;">
              <i class="fas fa-lightbulb" style="margin-right: 6px;"></i>TIPS
            </div>
            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0;">
              Jika Nd > Rt, bangunan memerlukan sistem proteksi petir eksternal (LPS) sesuai level proteksi yang ditentukan.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRiskResult(risk) {
  const isProtected = risk.nd <= 0.00001;
  const protectionLevel = isProtected ? 'TIDAK WAJIB' : 'WAJIB';
  const levelColor = isProtected ? 'var(--success-400)' : 'var(--danger-400)';
  
  return `
    <div style="padding: 20px; background: ${isProtected ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 12px; border: 1px solid ${isProtected ? 'var(--success-400)' : 'var(--danger-400)'}44;">
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">STATUS PROTEKSI</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: ${levelColor};">${protectionLevel}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <div style="text-align: center; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Nd (Frekuensi)</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: white;">${risk.nd?.toExponential(2) || 'N/A'}</div>
        </div>
        <div style="text-align: center; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Ae (Area)</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: white;">${risk.ae?.toFixed(2) || 'N/A'} m²</div>
        </div>
        <div style="text-align: center; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Level Proteksi</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: white;">${risk.required_lpl || 'TBD'}</div>
        </div>
      </div>
    </div>
  `;
}

function renderAirTerminalTab() {
  return `
    <div id="lps-tab-air-terminal" class="lps-tab-content">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-broadcast-tower" style="margin-right: 8px; color: var(--brand-400);"></i>
            Air Terminal System
          </h4>
          <button class="btn btn-primary btn-sm" onclick="showAirTerminalModal()">
            <i class="fas fa-plus"></i> Tambah Air Terminal
          </button>
        </div>
        
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">
          Air terminal (penangkal petir) dapat berupa Franklin Rod, Mesh Cage, atau Rolling Sphere method.
        </p>
        
        <!-- Calculator Cards -->
        <div class="grid-3-col" style="gap: 16px; margin-bottom: 24px;">
          <!-- Rolling Sphere Calculator -->
          <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
            <h5 style="font-weight: 700; color: white; margin-bottom: 12px; font-size: 0.9rem;">
              <i class="fas fa-circle" style="color: var(--brand-400); margin-right: 6px;"></i>
              Rolling Sphere Method
            </h5>
            <div style="margin-bottom: 12px;">
              <label class="form-label">Level Proteksi Petir (LPL)</label>
              <select id="rolling-lpl" class="form-input-dark" style="font-size: 0.8rem;">
                <option value="LPL_I">LPL I - Radius 20m</option>
                <option value="LPL_II" selected>LPL II - Radius 30m</option>
                <option value="LPL_III">LPL III - Radius 45m</option>
                <option value="LPL_IV">LPL IV - Radius 60m</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <label class="form-label" style="font-size: 0.7rem;">Tinggi AT (m)</label>
                <input type="number" id="rolling-height" class="form-input-dark" placeholder="0" step="0.1" style="font-size: 0.8rem;">
              </div>
              <div>
                <label class="form-label" style="font-size: 0.7rem;">Tinggi Struktur (m)</label>
                <input type="number" id="rolling-structure" class="form-input-dark" placeholder="0" step="0.1" style="font-size: 0.8rem;">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="calculateRollingSphere()">
              <i class="fas fa-calculator"></i> Hitung Zona
            </button>
          </div>
          
          <!-- Mesh Cage Calculator -->
          <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
            <h5 style="font-weight: 700; color: white; margin-bottom: 12px; font-size: 0.9rem;">
              <i class="fas fa-th" style="color: var(--success-400); margin-right: 6px;"></i>
              Mesh Cage Method
            </h5>
            <div style="margin-bottom: 12px;">
              <label class="form-label">Level Proteksi Petir (LPL)</label>
              <select id="mesh-lpl" class="form-input-dark" style="font-size: 0.8rem;">
                <option value="LPL_I">LPL I - 5m × 5m</option>
                <option value="LPL_II" selected>LPL II - 10m × 10m</option>
                <option value="LPL_III">LPL III - 15m × 15m</option>
                <option value="LPL_IV">LPL IV - 20m × 20m</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <label class="form-label" style="font-size: 0.7rem;">Panjang Area (m)</label>
                <input type="number" id="mesh-length" class="form-input-dark" placeholder="0" step="0.1" style="font-size: 0.8rem;">
              </div>
              <div>
                <label class="form-label" style="font-size: 0.7rem;">Lebar Area (m)</label>
                <input type="number" id="mesh-width" class="form-input-dark" placeholder="0" step="0.1" style="font-size: 0.8rem;">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="calculateMeshCage()">
              <i class="fas fa-calculator"></i> Hitung Kebutuhan
            </button>
          </div>
          
          <!-- Protection Angle Calculator -->
          <div class="card-quartz" style="padding: 16px; background: hsla(220, 20%, 100%, 0.03);">
            <h5 style="font-weight: 700; color: white; margin-bottom: 12px; font-size: 0.9rem;">
              <i class="fas fa-angle-double-down" style="color: var(--gold-400); margin-right: 6px;"></i>
              Protection Angle Method
            </h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <label class="form-label" style="font-size: 0.7rem;">Tinggi AT (m)</label>
                <input type="number" id="angle-height" class="form-input-dark" placeholder="0" step="0.1" style="font-size: 0.8rem;">
              </div>
              <div>
                <label class="form-label" style="font-size: 0.7rem;">Sudut Proteksi (α)</label>
                <input type="number" id="angle-alpha" class="form-input-dark" placeholder="45" step="1" style="font-size: 0.8rem;">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="calculateProtectionAngle()">
              <i class="fas fa-calculator"></i> Hitung Radius
            </button>
          </div>
        </div>
        
        <!-- Air Terminal List -->
        <h5 style="font-weight: 700; color: white; margin-bottom: 12px;">
          <i class="fas fa-list" style="color: var(--brand-400); margin-right: 6px;"></i>
          Daftar Air Terminal
        </h5>
        
        ${lpsData.airTerminals.length === 0 ? 
          '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada air terminal terdaftar. Tambahkan menggunakan tombol di atas.</p>' :
          `<div style="display: flex; flex-direction: column; gap: 12px;">
            ${lpsData.airTerminals.map(at => `
              <div class="card-quartz" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; color: white; margin-bottom: 4px;">${at.name || 'Air Terminal'}</div>
                  <div style="font-size: 0.7rem; color: var(--text-tertiary);">
                    ${at.type || 'Franklin Rod'} | ${at.height || 0}m | ${at.location || 'Atap'}
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">
                    ${at.lpl_level || 'LPL II'}
                  </span>
                  <button class="btn-ghost btn-xs" onclick="editAirTerminal('${at.id}')">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>`
        }
      </div>
    </div>
  `;
}

function renderGroundingTab() {
  const grounding = lpsData.groundingSystem;
  
  return `
    <div id="lps-tab-grounding" class="lps-tab-content">
      <div class="grid-2-col" style="gap: 20px;">
        <!-- Grounding System Form -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-globe" style="margin-right: 8px; color: var(--brand-400);"></i>
            Sistem Grounding
          </h4>
          
          <form id="grounding-form" onsubmit="saveGrounding(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Tipe Grounding</label>
                <select id="grounding-type" class="form-input-dark">
                  <option value="RING" ${grounding?.type === 'RING' ? 'selected' : ''}>Ring Electrode (SNI)</option>
                  <option value="ROD" ${grounding?.type === 'ROD' ? 'selected' : ''}>Ground Rod Array</option>
                  <option value="PLATE" ${grounding?.type === 'PLATE' ? 'selected' : ''}>Ground Plate</option>
                  <option value="MIXED" ${grounding?.type === 'MIXED' ? 'selected' : ''}>Campuran</option>
                </select>
              </div>
              <div>
                <label class="form-label">Jumlah Electrode</label>
                <input type="number" id="grounding-count" class="form-input-dark" placeholder="4" min="1" value="${grounding?.electrode_count || ''}">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Panjang Electrode (m)</label>
                <input type="number" id="grounding-length" class="form-input-dark" placeholder="3" step="0.1" value="${grounding?.electrode_length || ''}">
              </div>
              <div>
                <label class="form-label">Diameter Electrode (mm)</label>
                <input type="number" id="grounding-diameter" class="form-input-dark" placeholder="16" value="${grounding?.electrode_diameter || ''}">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Kedalaman (m)</label>
                <input type="number" id="grounding-depth" class="form-input-dark" placeholder="0.5" step="0.1" value="${grounding?.depth || ''}">
              </div>
              <div>
                <label class="form-label">Material</label>
                <select id="grounding-material" class="form-input-dark">
                  <option value="COPPER" ${grounding?.material === 'COPPER' ? 'selected' : ''}>Tembaga (Cu)</option>
                  <option value="GALVANIZED" ${grounding?.material === 'GALVANIZED' ? 'selected' : ''}>Galvanized Steel</option>
                  <option value="COPPERWELD" ${grounding?.material === 'COPPERWELD' ? 'selected' : ''}>Copperweld</option>
                  <option value="STAINLESS" ${grounding?.material === 'STAINLESS' ? 'selected' : ''}>Stainless Steel</option>
                </select>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Resistivitas Tanah (Ω.m)</label>
              <input type="number" id="grounding-resistivity" class="form-input-dark" placeholder="100" step="1" value="${grounding?.soil_resistivity || ''}">
              <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
                Normal: 10-1000 Ω.m. Basah: <100, Kering: >1000
              </p>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-save" style="margin-right: 8px;"></i>
              Simpan Data Grounding
            </button>
          </form>
        </div>
        
        <!-- Test Results -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-vial" style="margin-right: 8px; color: var(--success-400);"></i>
              Hasil Pengukuran
            </h4>
            <button class="btn btn-primary btn-sm" onclick="showGroundingTestModal()">
              <i class="fas fa-plus"></i> Tambah Test
            </button>
          </div>
          
          ${lpsData.testResults.length === 0 ?
            '<p style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada data pengukuran resistansi grounding.</p>' :
            `<div style="display: flex; flex-direction: column; gap: 12px;">
              ${lpsData.testResults.map(test => {
                const isPass = test.resistance_ohm <= 5;
                return `
                  <div class="card-quartz" style="padding: 16px; border-left: 3px solid ${isPass ? 'var(--success-400)' : 'var(--danger-400)'};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                      <div>
                        <div style="font-weight: 700; color: white;">${new Date(test.test_date).toLocaleDateString('id-ID')}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${test.tester_name || 'Inspector'}</div>
                      </div>
                      <span class="badge" style="background: ${isPass ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; color: ${isPass ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 9px;">
                        ${isPass ? 'PASS ≤5Ω' : 'FAIL >5Ω'}
                      </span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.75rem;">
                      <div>
                        <span style="color: var(--text-tertiary);">R1:</span> <span style="color: white; font-weight: 600;">${test.resistance_ohm?.toFixed(2) || 'N/A'} Ω</span>
                      </div>
                      <div>
                        <span style="color: var(--text-tertiary);">Metode:</span> <span style="color: white;">${test.method || 'Fall-of-Potential'}</span>
                      </div>
                      <div>
                        <span style="color: var(--text-tertiary);">Cuaca:</span> <span style="color: white;">${test.weather || 'Cerah'}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
          }
          
          <div style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">
              <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
              Standar Resistansi Grounding (SNI):
            </div>
            <ul style="font-size: 0.7rem; color: var(--text-secondary); margin: 0; padding-left: 20px;">
              <li>Grounding LPS: ≤ 5 Ω</li>
              <li>Grounding Elektroda Tunggal: ≤ 10 Ω</li>
              <li>Grounding Sistem IT: ≤ 1 Ω</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderInternalTab() {
  return `
    <div id="lps-tab-internal" class="lps-tab-content">
      <div class="card-quartz" style="padding: 24px;">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-shield-alt" style="margin-right: 8px; color: var(--brand-400);"></i>
          Sistem Proteksi Petir Internal
        </h4>
        
        <div class="grid-2-col" style="gap: 20px;">
          <!-- SPD (Surge Protection Device) -->
          <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.03);">
            <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
              <i class="fas fa-bolt" style="color: var(--warning-400); margin-right: 6px;"></i>
              Surge Protection Device (SPD)
            </h5>
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
              <div class="form-check">
                <input type="checkbox" id="spd-type1" class="form-check-input">
                <label for="spd-type1" class="form-check-label">SPD Type 1 (Class I) - 12.5kA</label>
              </div>
              <div class="form-check">
                <input type="checkbox" id="spd-type2" class="form-check-input">
                <label for="spd-type2" class="form-check-label">SPD Type 2 (Class II) - 40kA</label>
              </div>
              <div class="form-check">
                <input type="checkbox" id="spd-type3" class="form-check-input">
                <label for="spd-type3" class="form-check-label">SPD Type 3 (Class III) - 6kA</label>
              </div>
            </div>
            
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="showSPDModal()">
              <i class="fas fa-plus"></i> Tambah SPD
            </button>
          </div>
          
          <!-- Equipotential Bonding -->
          <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.03);">
            <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
              <i class="fas fa-link" style="color: var(--success-400); margin-right: 6px;"></i>
              Equipotential Bonding
            </h5>
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
              <div class="form-check">
                <input type="checkbox" id="bonding-main" class="form-check-input">
                <label for="bonding-main" class="form-check-label">Main Earthing Terminal (MET)</label>
              </div>
              <div class="form-check">
                <input type="checkbox" id="bonding-service" class="form-check-input">
                <label for="bonding-service" class="form-check-label">Service Bonding</label>
              </div>
              <div class="form-check">
                <input type="checkbox" id="bonding-local" class="form-check-input">
                <label for="bonding-local" class="form-check-label">Local Bonding Bars</label>
              </div>
              <div class="form-check">
                <input type="checkbox" id="bonding-screen" class="form-check-input">
                <label for="bonding-screen" class="form-check-label">Screen Bonding</label>
              </div>
            </div>
            
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="showBondingModal()">
              <i class="fas fa-plus"></i> Tambah Bonding Point
            </button>
          </div>
        </div>
        
        <!-- Shielding -->
        <div class="card-quartz" style="padding: 20px; margin-top: 20px; background: hsla(220, 20%, 100%, 0.03);">
          <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-border-all" style="color: var(--gold-400); margin-right: 6px;"></i>
            Shielding & Routing
          </h5>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div>
              <label class="form-label">LPZ 0A - Direct strike</label>
              <select class="form-input-dark">
                <option value="">Pilih Area</option>
                <option value="outdoor">Outdoor / Atap</option>
                <option value="façade">Façade dinding</option>
              </select>
            </div>
            <div>
              <label class="form-label">LPZ 1 - Shielded</label>
              <select class="form-input-dark">
                <option value="">Pilih Area</option>
                <option value="interior">Interior bangunan</option>
                <option value="shielded-room">Shielded room</option>
              </select>
            </div>
            <div>
              <label class="form-label">LPZ 2 - Further shielded</label>
              <select class="form-input-dark">
                <option value="">Pilih Area</option>
                <option value="server-room">Server room</option>
                <option value="control-room">Control room</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTestingTab() {
  return `
    <div id="lps-tab-testing" class="lps-tab-content">
      <div class="card-quartz" style="padding: 24px;">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-vial" style="margin-right: 8px; color: var(--brand-400);"></i>
          Testing & Verification
        </h4>
        
        <div class="grid-3-col" style="gap: 16px; margin-bottom: 24px;">
          <!-- Grounding Test -->
          <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.03);">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400); margin-bottom: 12px;">
              <i class="fas fa-globe"></i>
            </div>
            <h5 style="font-weight: 700; color: white; margin-bottom: 8px;">Grounding Resistance</h5>
            <p style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 12px;">
              Pengukuran resistansi grounding dengan metode Fall-of-Potential atau Clamp-on.
            </p>
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="showGroundingTestModal()">
              <i class="fas fa-plus"></i> Input Data Test
            </button>
          </div>
          
          <!-- Continuity Test -->
          <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.03);">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin-bottom: 12px;">
              <i class="fas fa-link"></i>
            </div>
            <h5 style="font-weight: 700; color: white; margin-bottom: 8px;">Continuity Test</h5>
            <p style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 12px;">
              Pengujian kontinuitas jalur down conductor dan bonding connections.
            </p>
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="showContinuityTestModal()">
              <i class="fas fa-plus"></i> Input Data Test
            </button>
          </div>
          
          <!-- Visual Inspection -->
          <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.03);">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400); margin-bottom: 12px;">
              <i class="fas fa-eye"></i>
            </div>
            <h5 style="font-weight: 700; color: white; margin-bottom: 8px;">Visual Inspection</h5>
            <p style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 12px;">
              Inspeksi visual kondisi fisik komponen LPS: korosi, kerusakan, koneksi.
            </p>
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="showVisualInspectionModal()">
              <i class="fas fa-plus"></i> Input Inspection
            </button>
          </div>
        </div>
        
        <!-- Test Summary -->
        <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.03);">
          <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-clipboard-check" style="color: var(--success-400); margin-right: 6px;"></i>
            Ringkasan Hasil Pengujian
          </h5>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center;">
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 2rem; font-weight: 800; color: var(--success-400);">${lpsData.testResults.length}</div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Total Test</div>
            </div>
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 2rem; font-weight: 800; color: var(--success-400);">
                ${lpsData.testResults.filter(t => t.resistance_ohm <= 5).length}
              </div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Pass ≤5Ω</div>
            </div>
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 2rem; font-weight: 800; color: var(--danger-400);">
                ${lpsData.testResults.filter(t => t.resistance_ohm > 5).length}
              </div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Fail >5Ω</div>
            </div>
            <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
              <div style="font-size: 2rem; font-weight: 800; color: var(--gold-400);">
                ${lpsData.testResults.length > 0 ? 
                  (lpsData.testResults.reduce((sum, t) => sum + (t.resistance_ohm || 0), 0) / lpsData.testResults.length).toFixed(2) 
                  : '0.00'}Ω
              </div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Rata-rata</div>
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
    <!-- Air Terminal Modal -->
    <div id="air-terminal-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-broadcast-tower"></i> Tambah Air Terminal</h3>
          <button class="modal-close" onclick="closeModal('air-terminal-modal')">&times;</button>
        </div>
        <form id="air-terminal-form" onsubmit="saveAirTerminal(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Nama/Label *</label>
              <input type="text" name="name" required placeholder="e.g., AT-01 Utama">
            </div>
            <div class="form-group">
              <label>Tipe Air Terminal *</label>
              <select name="type" required>
                <option value="FRANKLIN_ROD">Franklin Rod</option>
                <option value="MESh_CAGE">Mesh Cage</option>
                <option value="MAST">Lightning Mast</option>
                <option value="CABLE">Overhead Cable</option>
              </select>
            </div>
            <div class="form-group">
              <label>Lokasi *</label>
              <input type="text" name="location" required placeholder="e.g., Atap Lt.5">
            </div>
            <div class="form-group">
              <label>Tinggi (m) *</label>
              <input type="number" name="height" required step="0.1" min="0.1" placeholder="3">
            </div>
            <div class="form-group">
              <label>LPL Level *</label>
              <select name="lpl_level" required>
                <option value="LPL_I">LPL I</option>
                <option value="LPL_II" selected>LPL II</option>
                <option value="LPL_III">LPL III</option>
                <option value="LPL_IV">LPL IV</option>
              </select>
            </div>
            <div class="form-group">
              <label>Koordinat (opsional)</label>
              <input type="text" name="coordinates" placeholder="lat, lng">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('air-terminal-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Grounding Test Modal -->
    <div id="grounding-test-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-vial"></i> Input Hasil Test Grounding</h3>
          <button class="modal-close" onclick="closeModal('grounding-test-modal')">&times;</button>
        </div>
        <form id="grounding-test-form" onsubmit="saveGroundingTest(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Tanggal Test *</label>
              <input type="date" name="test_date" required>
            </div>
            <div class="form-group">
              <label>Resistansi R1 (Ω) *</label>
              <input type="number" name="resistance" required step="0.01" min="0" placeholder="2.5">
            </div>
            <div class="form-group">
              <label>Resistansi R2 (Ω)</label>
              <input type="number" name="resistance_r2" step="0.01" min="0" placeholder="2.3">
            </div>
            <div class="form-group">
              <label>Resistansi R3 (Ω)</label>
              <input type="number" name="resistance_r3" step="0.01" min="0" placeholder="2.4">
            </div>
            <div class="form-group">
              <label>Metode Pengukuran</label>
              <select name="method">
                <option value="FALL_OF_POTENTIAL">Fall-of-Potential</option>
                <option value="CLAMP_ON">Clamp-on</option>
                <option value="DEAD_EARTH">Dead Earth</option>
              </select>
            </div>
            <div class="form-group">
              <label>Cuaca/Kondisi</label>
              <select name="weather">
                <option value="Cerah">Cerah</option>
                <option value="Mendung">Mendung</option>
                <option value="Hujan">Hujan</option>
                <option value="Kering">Sangat Kering</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Nama Inspector *</label>
              <input type="text" name="tester_name" required placeholder="Nama lengkap inspector">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Catatan</label>
              <textarea name="notes" rows="2" placeholder="Catatan tambahan..."></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('grounding-test-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan Hasil Test</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ============================================================
// STYLES
// ============================================================

function getLPSStyles() {
  return `
    .lps-content {
      min-height: 400px;
    }
    
    .lps-tab-content {
      display: none;
    }
    
    .lps-tab-content.active {
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
  window._switchLPSTab = (tabId, btn) => {
    currentTab = tabId;
    
    // Update button styles
    document.querySelectorAll('.lps-tab-item').forEach(item => {
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
    
    // Render tab content
    renderCurrentTab();
  };
  
  // Global functions for onclick handlers
  window.showAirTerminalModal = () => {
    document.getElementById('air-terminal-modal').style.display = 'flex';
  };
  
  window.showGroundingTestModal = () => {
    document.getElementById('grounding-test-modal').style.display = 'flex';
  };
  
  window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
  };
  
  // Calculator functions
  window.calculateRisk = async (e) => {
    e.preventDefault();
    
    const ng = parseFloat(document.getElementById('risk-ng').value) || 0;
    const buildingClass = document.getElementById('risk-class').value;
    const length = parseFloat(document.getElementById('risk-length').value) || 0;
    const width = parseFloat(document.getElementById('risk-width').value) || 0;
    const height = parseFloat(document.getElementById('risk-height').value) || 0;
    const cd = parseFloat(document.getElementById('risk-cd').value) || 1;
    
    // Calculate Ae (Equivalent Area)
    const ae = (length * width) + (6 * height * (length + width)) + (9 * Math.PI * height * height);
    
    // Calculate Nd (Frequency of Strikes)
    const nd = ng * ae * Math.pow(10, -6) * cd;
    
    // Determine protection level
    let requiredLPL = 'TIDAK WAJIB';
    if (nd > 0.00001) {
      if (nd > 0.001) requiredLPL = 'LPL_I';
      else if (nd > 0.0001) requiredLPL = 'LPL_II';
      else requiredLPL = 'LPL_III';
    }
    
    const result = {
      ng,
      building_class: buildingClass,
      length,
      width,
      height,
      cd_factor: cd,
      ae,
      nd,
      required_lpl: requiredLPL
    };
    
    // Save to database
    try {
      await supabase.from('lightning_risk_assessments').upsert({
        project_id: currentProjectId,
        ng_density: result.ng,
        building_dimensions: { length: result.length, width: result.width, height: result.height },
        environment_factor: result.cd_factor,
        building_class: result.building_class,
        collection_area: result.ae,
        strike_frequency: result.nd,
        lpl_level: result.required_lpl,
        is_required: result.nd > 0.00001,
        updated_at: new Date().toISOString()
      });
      
      lpsData.riskAssessment = result;
      document.getElementById('risk-result').innerHTML = renderRiskResult(result);
      document.getElementById('risk-result').style.display = 'block';
      showSuccess('Perhitungan risiko berhasil disimpan');
    } catch (e) {
      showError('Gagal menyimpan: ' + e.message);
    }
  };
  
  window.calculateRollingSphere = () => {
    const lpl = document.getElementById('rolling-lpl').value;
    const atHeight = parseFloat(document.getElementById('rolling-height').value) || 0;
    const structureHeight = parseFloat(document.getElementById('rolling-structure').value) || 0;
    
    const radiusMap = {
      'LPL_I': 20,
      'LPL_II': 30,
      'LPL_III': 45,
      'LPL_IV': 60
    };
    
    const radius = radiusMap[lpl] || 30;
    const effectiveHeight = atHeight - structureHeight;
    const protectionRadius = Math.sqrt(2 * radius * effectiveHeight - effectiveHeight * effectiveHeight);
    
    showInfo(`Zona Proteksi Rolling Sphere: ${protectionRadius.toFixed(2)}m (LPL: ${lpl}, Radius Sphere: ${radius}m)`);
  };
  
  window.calculateMeshCage = () => {
    const lpl = document.getElementById('mesh-lpl').value;
    const length = parseFloat(document.getElementById('mesh-length').value) || 0;
    const width = parseFloat(document.getElementById('mesh-width').value) || 0;
    
    const spacingMap = {
      'LPL_I': 5,
      'LPL_II': 10,
      'LPL_III': 15,
      'LPL_IV': 20
    };
    
    const spacing = spacingMap[lpl] || 10;
    const meshCountX = Math.ceil(length / spacing) + 1;
    const meshCountY = Math.ceil(width / spacing) + 1;
    const totalConductor = (meshCountX * width) + (meshCountY * length);
    
    showInfo(`Kebutuhan Mesh Cage: ${meshCountX} × ${meshCountY} grid, Total konduktor: ${totalConductor.toFixed(1)}m`);
  };
  
  window.calculateProtectionAngle = () => {
    const height = parseFloat(document.getElementById('angle-height').value) || 0;
    const alpha = parseFloat(document.getElementById('angle-alpha').value) || 45;
    
    const radius = height * Math.tan(alpha * Math.PI / 180);
    showInfo(`Radius Proteksi Sudut: ${radius.toFixed(2)}m (h=${height}m, α=${alpha}°)`);
  };
  
  window.saveGrounding = async (e) => {
    e.preventDefault();
    
    const data = {
      project_id: currentProjectId,
      type: document.getElementById('grounding-type').value,
      electrode_count: parseInt(document.getElementById('grounding-count').value) || 4,
      electrode_length: parseFloat(document.getElementById('grounding-length').value) || 3,
      electrode_diameter: parseInt(document.getElementById('grounding-diameter').value) || 16,
      depth: parseFloat(document.getElementById('grounding-depth').value) || 0.5,
      material: document.getElementById('grounding-material').value,
      soil_resistivity: parseInt(document.getElementById('grounding-resistivity').value) || 100,
      updated_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('lps_grounding_tests').upsert(data);
      lpsData.groundingSystem = data;
      showSuccess('Data grounding berhasil disimpan');
    } catch (e) {
      showError('Gagal menyimpan: ' + e.message);
    }
  };
  
  window.saveAirTerminal = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const data = {
      project_id: currentProjectId,
      component_type: 'AIR_TERMINAL',
      component_subtype: form.type.value,
      location_name: form.location.value,
      elevation: parseFloat(form.height.value),
      lpl_level: form.lpl_level.value,
      coordinates: form.coordinates.value ? [form.coordinates.value] : null,
      notes: form.name.value,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('lps_components').insert(data);
      await loadLPSData();
      renderCurrentTab();
      closeModal('air-terminal-modal');
      showSuccess('Air terminal berhasil ditambahkan');
    } catch (e) {
      showError('Gagal menyimpan: ' + e.message);
    }
  };
  
  window.saveGroundingTest = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    const r1 = parseFloat(form.resistance.value) || 0;
    const r2 = parseFloat(form.resistance_r2.value) || r1;
    const r3 = parseFloat(form.resistance_r3.value) || r1;
    const avg = (r1 + r2 + r3) / 3;
    
    const data = {
      project_id: currentProjectId,
      test_date: form.test_date.value,
      resistance_ohm: avg,
      resistance_r1: r1,
      resistance_r2: r2,
      resistance_r3: r3,
      method: form.method.value,
      weather: form.weather.value,
      tester_name: form.tester_name.value,
      notes: form.notes.value,
      created_at: new Date().toISOString()
    };
    
    try {
      await supabase.from('lps_grounding_tests').insert(data);
      await loadLPSData();
      renderCurrentTab();
      closeModal('grounding-test-modal');
      showSuccess('Hasil test berhasil disimpan');
    } catch (e) {
      showError('Gagal menyimpan: ' + e.message);
    }
  };
  
  window.editAirTerminal = (id) => {
    // Implementation for editing air terminal
    showInfo('Fitur edit dalam pengembangan');
  };
  
  window.showSPDModal = () => showInfo('Fitur SPD dalam pengembangan');
  window.showBondingModal = () => showInfo('Fitur Bonding dalam pengembangan');
  window.showContinuityTestModal = () => showInfo('Fitur Continuity Test dalam pengembangan');
  window.showVisualInspectionModal = () => showInfo('Fitur Visual Inspection dalam pengembangan');
}
