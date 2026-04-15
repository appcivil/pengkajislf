// ============================================================
// ACCESSIBILITY INSPECTION - MAIN PAGE
// Pemeriksaan Kemudahan & Aksesibilitas SLF
// Integrates: Horizontal Access, Vertical Access, Facilities, Scoring
// Standards: PP 16/2021, SNI 8153:2015, SNI 03-1733-1989, SNI 03-6197-2000, Permen PU 30/2006
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import {
  calculateCorridorCompliance,
  calculateRampCompliance,
  calculateDoorCompliance,
  calculateFloorCompliance,
  calculateStairCompliance,
  calculateElevatorCompliance,
  calculateEscalatorCompliance,
  calculateLandingCompliance,
  calculateToiletCompliance,
  calculateParkingCompliance,
  calculateSignageCompliance,
  calculateOverallScore,
  getGradeFromScore,
  generateEvacuationPathAnalysis,
  generateRepairPriority,
  generateInfrastructureChecklist,
  generateAccessibilityReport,
  ACCESSIBILITY_STANDARDS,
  SCORING_WEIGHTS
} from '../lib/accessibility-calculators.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let projectData = null;
let accessibilityData = {
  summary: null,
  horizontalAccess: [],
  verticalAccess: [],
  facilities: [],
  measurements: [],
  inspectionResults: []
};
let currentTab = 'dashboard';
let calculators = {};

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function accessibilityInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadAccessibilityData();
  
  return renderPage();
}

export function afterAccessibilityInspectionRender() {
  initEventListeners();
  initCalculators();
  renderCurrentTab();
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadProjectInfo() {
  try {
    const { data, error } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, alamat, luas_bangunan, jumlah_lantai, fungsi_bangunan, jumlah_penghuni')
      .eq('id', currentProjectId)
      .single();
    
    if (data) {
      currentProjectName = data.nama_bangunan;
      projectData = data;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadAccessibilityData() {
  try {
    // Load summary
    const { data: summaryData } = await supabase
      .from('accessibility_summary')
      .select('*')
      .eq('project_id', currentProjectId)
      .single();
    
    accessibilityData.summary = summaryData;
    
    // Load horizontal access measurements
    const { data: horizontalData } = await supabase
      .from('accessibility_horizontal')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    accessibilityData.horizontalAccess = horizontalData || [];
    
    // Load vertical access measurements
    const { data: verticalData } = await supabase
      .from('accessibility_vertical')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    accessibilityData.verticalAccess = verticalData || [];
    
    // Load facilities data
    const { data: facilitiesData } = await supabase
      .from('accessibility_facilities')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    accessibilityData.facilities = facilitiesData || [];
    
    // Load inspection results
    const { data: inspectionData } = await supabase
      .from('accessibility_inspections')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    accessibilityData.inspectionResults = inspectionData || [];
    
  } catch (e) {
    console.error('Error loading accessibility data:', e);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="accessibility-inspection-page" style="padding: var(--space-6); max-width: 1400px; margin: 0 auto;">
      ${renderHeaderCard()}
      <div id="accessibility-content" class="accessibility-content">
        <!-- Tab content will be rendered here -->
      </div>
    </div>
    
    <style>
      ${getAccessibilityStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  const summary = accessibilityData.summary || {};
  const overallScore = summary.overall_score || 0;
  const grade = getGradeFromScore(overallScore);
  
  return `
    <div class="card-quartz" id="accessibility-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-universal-access" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--brand-400);">PHASE 04</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Kemudahan & Aksesibilitas</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${overallScore > 0 ? `
            <div style="text-align: right; margin-right: 12px;">
              <div style="font-size: 0.65rem; color: var(--text-tertiary);">Skor Aksesibilitas</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: ${grade.color};">${overallScore.toFixed(1)}% (${grade.grade})</div>
            </div>
          ` : ''}
          <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); border: 1px solid hsla(220, 95%, 52%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>PP 16/2021 & SNI
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi kemudahan dan aksesibilitas bangunan sesuai PP 16/2021 Pasal 226-227, SNI 8153:2015, 
        SNI 03-1733-1989, dan SNI 03-6197-2000. Meliputi akses horizontal (koridor, ram, pintu), 
        akses vertikal (tangga, lift, eskalator), serta fasilitas (toilet, parkir, rambu).
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchAccessibilityTab('dashboard', this)" 
                class="accessibility-tab-item active"
                data-tab="dashboard"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-tachometer-alt"></i> DASHBOARD
        </button>
        <button onclick="window._switchAccessibilityTab('horizontal', this)" 
                class="accessibility-tab-item"
                data-tab="horizontal"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-arrows-alt-h"></i> AKSES HORIZONTAL
        </button>
        <button onclick="window._switchAccessibilityTab('vertical', this)" 
                class="accessibility-tab-item"
                data-tab="vertical"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-arrows-alt-v"></i> AKSES VERTIKAL
        </button>
        <button onclick="window._switchAccessibilityTab('facilities', this)" 
                class="accessibility-tab-item"
                data-tab="facilities"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-restroom"></i> FASILITAS
        </button>
        <button onclick="window._switchAccessibilityTab('scoring', this)" 
                class="accessibility-tab-item"
                data-tab="scoring"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-chart-line"></i> SCORING & LAPORAN
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('accessibility-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'dashboard':
      contentDiv.innerHTML = renderDashboardTab();
      break;
    case 'horizontal':
      contentDiv.innerHTML = renderHorizontalTab();
      break;
    case 'vertical':
      contentDiv.innerHTML = renderVerticalTab();
      break;
    case 'facilities':
      contentDiv.innerHTML = renderFacilitiesTab();
      break;
    case 'scoring':
      contentDiv.innerHTML = renderScoringTab();
      break;
  }
}

function renderDashboardTab() {
  const summary = accessibilityData.summary || {};
  const overallScore = summary.overall_score || 0;
  const grade = getGradeFromScore(overallScore);
  
  const corridorCount = accessibilityData.horizontalAccess.filter(h => h.element_type === 'corridor').length;
  const rampCount = accessibilityData.horizontalAccess.filter(h => h.element_type === 'ramp').length;
  const doorCount = accessibilityData.horizontalAccess.filter(h => h.element_type === 'door').length;
  const stairCount = accessibilityData.verticalAccess.filter(v => v.element_type === 'stair').length;
  const elevatorCount = accessibilityData.verticalAccess.filter(v => v.element_type === 'elevator').length;
  const toiletCount = accessibilityData.facilities.filter(f => f.facility_type === 'toilet').length;
  const parkingCount = accessibilityData.facilities.filter(f => f.facility_type === 'parking').length;
  
  return `
    <div id="accessibility-tab-dashboard" class="accessibility-tab-content active">
      <div class="card-quartz" style="padding: 24px; margin-bottom: 20px; background: linear-gradient(135deg, hsla(220, 95%, 52%, 0.1) 0%, hsla(220, 95%, 52%, 0.05) 100%);">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; align-items: center;">
          <div style="text-align: center; border-right: 1px solid hsla(220, 20%, 100%, 0.1);">
            <div style="font-size: 3rem; font-weight: 800; color: ${grade.color}; margin-bottom: 8px;">
              ${overallScore > 0 ? overallScore.toFixed(1) + '%' : 'N/A'}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary);">Skor Aksesibilitas</div>
          </div>
          <div style="text-align: center; border-right: 1px solid hsla(220, 20%, 100%, 0.1);">
            <div style="font-size: 2.5rem; font-weight: 800; color: white; margin-bottom: 8px;">
              ${accessibilityData.inspectionResults.length}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary);">Total Pemeriksaan</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 800; color: white; margin-bottom: 8px;">
              ${corridorCount + rampCount + doorCount + stairCount + elevatorCount + toiletCount + parkingCount}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary);">Total Elemen</div>
          </div>
        </div>
      </div>
      
      <div class="grid-4-col" style="gap: 16px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-road" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${corridorCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Koridor</div>
        </div>
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400); margin: 0 auto 12px;">
            <i class="fas fa-wheelchair" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${rampCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Ram</div>
        </div>
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(158, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400); margin: 0 auto 12px;">
            <i class="fas fa-stairs" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${stairCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Tangga</div>
        </div>
        <div class="card-quartz" style="padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400); margin: 0 auto 12px;">
            <i class="fas fa-elevator" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 4px;">${elevatorCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Lift</div>
        </div>
      </div>
    </div>
  `;
}

function renderHorizontalTab() {
  return `<div class="card-quartz" style="padding: 24px;"><h4 style="color: white;">Akses Horizontal</h4><p style="color: var(--text-tertiary);">Konten pemeriksaan akses horizontal.</p></div>`;
}

function renderVerticalTab() {
  return `<div class="card-quartz" style="padding: 24px;"><h4 style="color: white;">Akses Vertikal</h4><p style="color: var(--text-tertiary);">Konten pemeriksaan akses vertikal.</p></div>`;
}

function renderFacilitiesTab() {
  return `<div class="card-quartz" style="padding: 24px;"><h4 style="color: white;">Fasilitas</h4><p style="color: var(--text-tertiary);">Konten pemeriksaan fasilitas.</p></div>`;
}

function renderScoringTab() {
  return `<div class="card-quartz" style="padding: 24px;"><h4 style="color: white;">Scoring & Laporan</h4><p style="color: var(--text-tertiary);">Konten scoring dan laporan.</p></div>`;
}

function getAccessibilityStyles() {
  return '';
}

function initEventListeners() {
  window._switchAccessibilityTab = (tabId, btn) => {
    currentTab = tabId;
    document.querySelectorAll('.accessibility-tab-item').forEach(item => {
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
}

function initCalculators() {
  // Calculator functions will be initialized here
}
