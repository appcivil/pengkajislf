// ============================================================
// COMFORT ASPECT INSPECTION - MAIN PAGE
// Pemeriksaan Aspek Kenyamanan SLF (Frontend-Only)
// Based on: PP Nomor 16 Tahun 2021 (Pasal 226), SNI 03-6197-2000,
// SNI 03-6572-2001, SNI 03-6389-2000, ASHRAE 55/62.1
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { uploadToGoogleDrive } from '../lib/drive.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let comfortData = {
  rooms: [],
  climateData: [],
  noiseData: [],
  vibrationData: [],
  viewData: [],
  summary: null
};
let currentTab = 'dashboard';
let selectedRoom = null;

// SNI Standards - Occupancy Standards (m² per person)
const OCCUPANCY_STANDARDS = {
  'office': 10,        // m²/orang
  'residential': 9,    // m²/orang
  'retail': 4,         // m²/orang
  'education': 2,      // m²/orang
  'hospital': 12,    // m²/orang
  'worship': 1.5,      // m²/orang
  'restaurant': 2,     // m²/orang
  'library': 4,        // m²/orang
  'museum': 4,         // m²/orang
  'cinema': 0.65       // m²/orang
};

// Temperature Standards by Room Type (°C)
const TEMPERATURE_STANDARDS = {
  'office': { min: 20, max: 28 },
  'residential': { min: 20, max: 28 },
  'hospital': { min: 22, max: 26 },
  'education': { min: 20, max: 28 },
  'retail': { min: 20, max: 28 },
  'restaurant': { min: 20, max: 28 }
};

// Noise Standards dB(A) by Room Type
const NOISE_STANDARDS = {
  'office': { day: 45, night: 35 },
  'residential': { day: 40, night: 30 },
  'hospital': { day: 35, night: 25 },
  'education': { day: 40, night: 35 },
  'industrial': { day: 85, night: 85 },
  'retail': { day: 50, night: 45 }
};

// Vibration Standards (mm/s) - SNI 03-6884-2002
const VIBRATION_STANDARDS = {
  'residential': { limit: 0.15, label: 'Tidak terasa' },
  'office': { limit: 0.3, label: 'Terasa' },
  'hospital': { limit: 0.15, label: 'Tidak terasa' },
  'industrial': { limit: 0.6, label: 'Mengganggu' }
};

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function comfortInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  await loadProjectInfo();
  await loadComfortData();
  
  return renderPage();
}

export function afterComfortInspectionRender() {
  initEventListeners();
  initCSVImportListeners();
  renderCurrentTab();
  
  // Initialize first room if exists
  if (comfortData.rooms.length > 0 && !selectedRoom) {
    selectRoom(comfortData.rooms[0].id);
  }
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadProjectInfo() {
  try {
    const { data, error } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, alamat, luas_bangunan, fungsi_bangunan')
      .eq('id', currentProjectId)
      .single();
    
    if (data) {
      currentProjectName = data.nama_bangunan;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadComfortData() {
  try {
    // Load comfort rooms
    const { data: roomsData } = await supabase
      .from('comfort_rooms')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    comfortData.rooms = roomsData || [];
    
    // Load climate measurements
    const { data: climateData } = await supabase
      .from('comfort_climate')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('measured_at', { ascending: false });
    
    comfortData.climateData = climateData || [];
    
    // Load noise measurements
    const { data: noiseData } = await supabase
      .from('comfort_noise')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('measured_at', { ascending: false });
    
    comfortData.noiseData = noiseData || [];
    
    // Load vibration measurements
    const { data: vibrationData } = await supabase
      .from('comfort_vibration')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('measured_at', { ascending: false });
    
    comfortData.vibrationData = vibrationData || [];
    
    // Load view analysis
    const { data: viewData } = await supabase
      .from('comfort_view')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false });
    
    comfortData.viewData = viewData || [];
    
    // Load summary
    const { data: summaryData } = await supabase
      .from('comfort_summary')
      .select('*')
      .eq('project_id', currentProjectId)
      .single();
    
    comfortData.summary = summaryData;
    
  } catch (e) {
    console.error('Error loading comfort data:', e);
    // Initialize with empty data if tables don't exist yet
    comfortData = {
      rooms: [],
      climateData: [],
      noiseData: [],
      vibrationData: [],
      viewData: [],
      summary: null
    };
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="comfort-inspection-page" style="padding: var(--space-6); max-width: 1600px; margin: 0 auto;">
      ${renderHeaderCard()}
      <div id="comfort-content" class="comfort-content">
        <!-- Tab content will be rendered here -->
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getComfortStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="comfort-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, hsla(160, 100%, 45%, 0.15), hsla(220, 95%, 52%, 0.1)); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-couch" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--success-400);">PHASE 02D</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Pemeriksaan Aspek Kenyamanan</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(160, 100%, 45%, 0.1); color: var(--success-400); border: 1px solid hsla(160, 100%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>PP 16/2021
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi aspek kenyamanan bangunan berdasarkan PP Nomor 16 Tahun 2021 (Pasal 226), SNI 03-6197-2000, 
        SNI 03-6572-2001, SNI 03-6389-2000, dan ASHRAE 55/62.1. Meliputi analisis ruang gerak, kondisi udara, 
        pandangan, getaran, dan kebisingan.
      </p>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchComfortTab('dashboard', this)" 
                class="comfort-tab-item active"
                data-tab="dashboard"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-chart-pie"></i> DASHBOARD
        </button>
        <button onclick="window._switchComfortTab('occupancy', this)" 
                class="comfort-tab-item"
                data-tab="occupancy"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-users"></i> RUANG & OCCUPANCY
        </button>
        <button onclick="window._switchComfortTab('climate', this)" 
                class="comfort-tab-item"
                data-tab="climate"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-temperature-high"></i> KONDISI UDARA
        </button>
        <button onclick="window._switchComfortTab('view', this)" 
                class="comfort-tab-item"
                data-tab="view"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-eye"></i> PANDANGAN
        </button>
        <button onclick="window._switchComfortTab('acoustic', this)" 
                class="comfort-tab-item"
                data-tab="acoustic"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-volume-up"></i> GETARAN & BISING
        </button>
        <button onclick="window._switchComfortTab('report', this)" 
                class="comfort-tab-item"
                data-tab="report"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-file-pdf"></i> LAPORAN
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// TAB RENDERING
// ============================================================

function renderCurrentTab() {
  const contentDiv = document.getElementById('comfort-content');
  if (!contentDiv) return;
  
  switch(currentTab) {
    case 'dashboard':
      contentDiv.innerHTML = renderDashboardTab();
      break;
    case 'occupancy':
      contentDiv.innerHTML = renderOccupancyTab();
      break;
    case 'climate':
      contentDiv.innerHTML = renderClimateTab();
      break;
    case 'view':
      contentDiv.innerHTML = renderViewTab();
      break;
    case 'acoustic':
      contentDiv.innerHTML = renderAcousticTab();
      break;
    case 'report':
      contentDiv.innerHTML = renderReportTab();
      break;
  }
}

function renderDashboardTab() {
  const roomCount = comfortData.rooms.length;
  const climateCount = comfortData.climateData.length;
  const noiseCount = comfortData.noiseData.length;
  const vibrationCount = comfortData.vibrationData.length;
  const viewCount = comfortData.viewData.length;
  
  // Calculate overall comfort score
  const comfortScore = calculateOverallComfortScore();
  
  // Calculate compliance counts
  const compliantRooms = comfortData.rooms.filter(r => r.compliance_status === 'C').length;
  const nonCompliantRooms = comfortData.rooms.filter(r => r.compliance_status === 'NC').length;
  
  return `
    <div id="comfort-tab-dashboard" class="comfort-tab-content active">
      <!-- Summary Cards -->
      <div class="grid-4-col" style="gap: 16px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 20px; text-align: center; background: linear-gradient(135deg, hsla(220, 95%, 52%, 0.1), hsla(220, 95%, 52%, 0.05));">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.15); display: flex; align-items: center; justify-content: center; color: var(--brand-400); margin: 0 auto 12px;">
            <i class="fas fa-door-open" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: white; margin-bottom: 4px;">${roomCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Total Ruang</div>
          <div style="font-size: 0.65rem; color: var(--success-400); margin-top: 4px;">${compliantRooms} Lengkap</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center; background: linear-gradient(135deg, hsla(160, 100%, 45%, 0.1), hsla(160, 100%, 45%, 0.05));">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(160, 100%, 45%, 0.15); display: flex; align-items: center; justify-content: center; color: var(--success-400); margin: 0 auto 12px;">
            <i class="fas fa-thermometer-half" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: white; margin-bottom: 4px;">${climateCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Data Iklim</div>
          <div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 4px;">PMV/PPD</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center; background: linear-gradient(135deg, hsla(45, 90%, 60%, 0.1), hsla(45, 90%, 60%, 0.05));">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.15); display: flex; align-items: center; justify-content: center; color: var(--warning-400); margin: 0 auto 12px;">
            <i class="fas fa-volume-up" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: white; margin-bottom: 4px;">${noiseCount}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Data Kebisingan</div>
          <div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 4px;">dB(A) / NR</div>
        </div>
        
        <div class="card-quartz" style="padding: 20px; text-align: center; background: linear-gradient(135deg, hsla(280, 95%, 52%, 0.1), hsla(280, 95%, 52%, 0.05));">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(280, 95%, 52%, 0.15); display: flex; align-items: center; justify-content: center; color: #a855f7; margin: 0 auto 12px;">
            <i class="fas fa-chart-line" style="font-size: 1.4rem;"></i>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: ${comfortScore >= 80 ? 'var(--success-400)' : comfortScore >= 60 ? 'var(--warning-400)' : 'var(--danger-400)'}; margin-bottom: 4px;">${comfortScore}%</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Comfort Score</div>
          <div style="font-size: 0.65rem; color: ${comfortScore >= 80 ? 'var(--success-400)' : comfortScore >= 60 ? 'var(--warning-400)' : 'var(--danger-400)'}; margin-top: 4px;">
            ${comfortScore >= 80 ? 'Excellent' : comfortScore >= 60 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>
      </div>
      
      <!-- Main Dashboard Grid -->
      <div class="grid-2-col" style="gap: 20px; margin-bottom: 24px;">
        <!-- Comfort Radar Chart -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-chart-radar" style="margin-right: 8px; color: var(--brand-400);"></i>
              Comfort Assessment Radar
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">4 ASPEK</span>
          </div>
          <div id="comfort-radar-chart" style="height: 300px; display: flex; align-items: center; justify-content: center;">
            ${generateRadarChartPlaceholder()}
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px;">
            <div style="text-align: center; padding: 8px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px;">
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Ruang Gerak</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--brand-400);">${getAspectScore('occupancy')}%</div>
            </div>
            <div style="text-align: center; padding: 8px; background: hsla(160, 100%, 45%, 0.1); border-radius: 8px;">
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Kondisi Udara</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--success-400);">${getAspectScore('climate')}%</div>
            </div>
            <div style="text-align: center; padding: 8px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px;">
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Pandangan</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--warning-400);">${getAspectScore('view')}%</div>
            </div>
            <div style="text-align: center; padding: 8px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px;">
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Akustik</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--danger-400);">${getAspectScore('acoustic')}%</div>
            </div>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-bolt" style="margin-right: 8px; color: var(--gold-400);"></i>
              Aksi Cepat
            </h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="card-quartz clickable" onclick="showRoomModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
                <i class="fas fa-plus-circle"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Tambah Ruang Baru</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">Input profil ruang & occupancy</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="showClimateModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
                <i class="fas fa-thermometer-half"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Input Data Iklim</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">Suhu, RH, PMV, laju udara</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="showImportClimateModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(280, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: #a855f7;">
                <i class="fas fa-file-csv"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Import Data Logger</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">CSV dari HOBO/Testo</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="showNoiseModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--warning-400);">
                <i class="fas fa-volume-up"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Input Data Kebisingan</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">dB(A), NR Curves, RT60</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="showVibrationModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(20, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: #f97316;">
                <i class="fas fa-wave-square"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Input Data Getaran</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">PPV mm/s, frekuensi</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="generateComfortReport()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Generate Laporan</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">PDF lengkap Aspek Kenyamanan</div>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Room Summary Table -->
      <div class="card-quartz" style="padding: 24px; margin-bottom: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-list" style="margin-right: 8px; color: var(--brand-400);"></i>
            Daftar Ruang & Status Kenyamanan
          </h4>
          <button class="btn btn-primary btn-xs" onclick="showRoomModal()">
            <i class="fas fa-plus"></i> Tambah Ruang
          </button>
        </div>
        <div class="table-container">
          ${renderRoomSummaryTable()}
        </div>
      </div>
      
      <!-- Standards Reference -->
      <div class="card-quartz" style="padding: 24px;">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-book" style="margin-right: 8px; color: var(--success-400);"></i>
          Referensi Standar
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid hsla(220, 20%, 100%, 0.08);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-400); margin-bottom: 8px;">PP Nomor 16 Tahun 2021</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Persyaratan kenyamanan bangunan gedung (Pasal 226)</div>
          </div>
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid hsla(220, 20%, 100%, 0.08);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-400); margin-bottom: 8px;">SNI 03-6197-2000</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Ketentuan batas penghunian ruang</div>
          </div>
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid hsla(220, 20%, 100%, 0.08);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-400); margin-bottom: 8px;">SNI 03-6572-2001</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Ketentuan kenyamanan termal</div>
          </div>
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid hsla(220, 20%, 100%, 0.08);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-400); margin-bottom: 8px;">SNI 03-6389-2000</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Ketentuan kebisingan dan getaran</div>
          </div>
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid hsla(220, 20%, 100%, 0.08);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-400); margin-bottom: 8px;">ASHRAE 55</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Thermal Environmental Conditions for Human Occupancy</div>
          </div>
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid hsla(220, 20%, 100%, 0.08);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-400); margin-bottom: 8px;">ASHRAE 62.1</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">Ventilation for Acceptable Indoor Air Quality</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOccupancyTab() {
  return `
    <div id="comfort-tab-occupancy" class="comfort-tab-content active">
      <!-- Room Input & Occupancy Calculator -->
      <div class="grid-2-col" style="gap: 20px; margin-bottom: 24px;">
        <!-- Room Profile Form -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-door-open" style="margin-right: 8px; color: var(--brand-400);"></i>
              Profil Ruang & Occupancy
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-6197-2000</span>
          </div>
          
          <form id="room-form" onsubmit="saveRoomProfile(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Nama Ruang *</label>
              <input type="text" name="room_name" class="form-input-dark" placeholder="Contoh: Ruang Meeting Lantai 1" required>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Kode Ruang</label>
                <input type="text" name="room_code" class="form-input-dark" placeholder="R-001" value="${generateRoomCode()}">
              </div>
              <div>
                <label class="form-label">Fungsi Ruang *</label>
                <select name="room_function" class="form-input-dark" required onchange="updateOccupancyStandard(this.value)">
                  <option value="">Pilih fungsi...</option>
                  <option value="office">Kantor</option>
                  <option value="residential">Rumah Tinggal</option>
                  <option value="retail">Pertokoan</option>
                  <option value="education">Pendidikan</option>
                  <option value="hospital">Rumah Sakit</option>
                  <option value="worship">Tempat Ibadah</option>
                  <option value="restaurant">Restoran</option>
                  <option value="library">Perpustakaan</option>
                  <option value="museum">Museum</option>
                  <option value="cinema">Bioskop</option>
                </select>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Luas Lantai (m²) *</label>
                <input type="number" name="floor_area" class="form-input-dark" placeholder="Contoh: 50" step="0.1" min="0.1" required onchange="calculateOccupancyPreview()">
              </div>
              <div>
                <label class="form-label">Tinggi Langit-langit (m)</label>
                <input type="number" name="ceiling_height" class="form-input-dark" placeholder="Contoh: 3" step="0.1" min="1">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Jumlah Penghuni Aktual</label>
                <input type="number" name="actual_occupants" class="form-input-dark" placeholder="Contoh: 10" min="0" onchange="calculateOccupancyPreview()">
              </div>
              <div>
                <label class="form-label">Luas Perabot (m²)</label>
                <input type="number" name="furniture_area" class="form-input-dark" placeholder="Contoh: 15" step="0.1" min="0" onchange="calculateOccupancyPreview()">
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Jumlah Perabot</label>
              <input type="number" name="furniture_count" class="form-input-dark" placeholder="Contoh: 5" min="0">
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-save" style="margin-right: 8px;"></i>
              Simpan Profil Ruang
            </button>
          </form>
          
          <!-- Real-time Preview -->
          <div id="occupancy-preview" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid hsla(220, 20%, 100%, 0.08); display: none;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-400); margin-bottom: 12px;">PREVIEW PERHITUNGAN</div>
            <div id="preview-content">
              <!-- Will be populated by JS -->
            </div>
          </div>
        </div>
        
        <!-- Occupancy Standards Reference -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-table" style="margin-right: 8px; color: var(--success-400);"></i>
              Standar Batas Penghunian
            </h4>
            <span class="badge" style="background: hsla(160, 100%, 45%, 0.1); color: var(--success-400); font-size: 9px;">SNI 03-6197-2000</span>
          </div>
          
          <div style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
            <table class="data-table" style="width: 100%; font-size: 0.75rem;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px; color: var(--text-tertiary); border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">Fungsi Ruang</th>
                  <th style="text-align: right; padding: 10px; color: var(--text-tertiary); border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">m²/Orang</th>
                  <th style="text-align: center; padding: 10px; color: var(--text-tertiary); border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">Status</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(OCCUPANCY_STANDARDS).map(([key, value]) => `
                  <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);" data-function="${key}">
                    <td style="padding: 10px; color: var(--text-secondary);">${formatRoomFunction(key)}</td>
                    <td style="padding: 10px; color: white; text-align: right; font-weight: 600;">${value}</td>
                    <td style="padding: 10px; text-align: center;">
                      <span class="badge" style="background: hsla(160, 100%, 45%, 0.1); color: var(--success-400); font-size: 8px;">Aktif</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Formula Box -->
          <div style="padding: 16px; background: hsla(45, 90%, 60%, 0.1); border-radius: 10px; border: 1px solid hsla(45, 90%, 60%, 0.2);">
            <div style="font-size: 0.75rem; color: var(--gold-400); font-weight: 700; margin-bottom: 8px;">
              <i class="fas fa-calculator" style="margin-right: 6px;"></i>RUMUS PERHITUNGAN
            </div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 8px;">
              <strong>Max Occupancy</strong> = Luas Lantai (m²) ÷ Standar (m²/orang)
            </div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 8px;">
              <strong>Density</strong> = Penghuni Aktual ÷ Luas Lantai (org/m²)
            </div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">
              <strong>Free Movement Area</strong> = Luas Total - Perabot - Sirkulasi (30%)
            </div>
          </div>
        </div>
      </div>
      
      <!-- Room List with Analysis -->
      <div class="card-quartz" style="padding: 24px; margin-bottom: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-list-alt" style="margin-right: 8px; color: var(--brand-400);"></i>
            Daftar Ruang & Analisis Ruang Gerak
          </h4>
        </div>
        <div class="table-container">
          ${renderDetailedRoomTable()}
        </div>
      </div>
      
      <!-- 2D Layout Visualization -->
      <div class="card-quartz" style="padding: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-drafting-compass" style="margin-right: 8px; color: var(--brand-400);"></i>
            Tata Letak Perabot (2D Layout)
          </h4>
          <button class="btn btn-primary btn-xs" onclick="showFurnitureLayoutModal()">
            <i class="fas fa-plus"></i> Input Layout
          </button>
        </div>
        <div id="furniture-layout-canvas" style="height: 400px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: var(--text-tertiary);">
            <i class="fas fa-drafting-compass" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>Layout editor akan ditampilkan di sini<br>Pilih ruang untuk mengedit tata letak perabot</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ... (continuing with more tab render functions)

function renderClimateTab() {
  return `
    <div id="comfort-tab-climate" class="comfort-tab-content active">
      <!-- Climate Data Input & PMV Calculator -->
      <div class="grid-2-col" style="gap: 20px; margin-bottom: 24px;">
        <!-- PMV/PPD Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-thermometer-half" style="margin-right: 8px; color: var(--brand-400);"></i>
              Kalkulator PMV/PPD
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">ASHRAE 55</span>
          </div>
          
          <form id="pmv-form" onsubmit="calculatePMV(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Suhu Udara (°C) *</label>
                <input type="number" id="pmv-ta" class="form-input-dark" placeholder="Contoh: 24" step="0.1" min="10" max="40" required>
              </div>
              <div>
                <label class="form-label">Suhu Radiasi (°C)</label>
                <input type="number" id="pmv-tr" class="form-input-dark" placeholder="Contoh: 24" step="0.1" min="10" max="50">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Kelembapan RH (%)</label>
                <input type="number" id="pmv-rh" class="form-input-dark" placeholder="Contoh: 55" step="1" min="0" max="100" value="55">
              </div>
              <div>
                <label class="form-label">Kecepatan Udara (m/s)</label>
                <input type="number" id="pmv-vel" class="form-input-dark" placeholder="Contoh: 0.15" step="0.01" min="0" max="5" value="0.15">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Aktivitas Met (met)</label>
                <select id="pmv-met" class="form-input-dark">
                  <option value="0.8">Tidur (0.8 met)</option>
                  <option value="1.0" selected>Duduk santai (1.0 met)</option>
                  <option value="1.2">Kerja ringan (1.2 met)</option>
                  <option value="1.6">Berdiri santai (1.6 met)</option>
                  <option value="2.0">Berjalan santai (2.0 met)</option>
                  <option value="2.5">Kerja ringan (2.5 met)</option>
                </select>
              </div>
              <div>
                <label class="form-label">Pakaian Clo (clo)</label>
                <select id="pmv-clo" class="form-input-dark">
                  <option value="0.36">Seksi (0.36 clo)</option>
                  <option value="0.5" selected>Summer ringan (0.5 clo)</option>
                  <option value="0.7">Summer normal (0.7 clo)</option>
                  <option value="1.0">Winter ringan (1.0 clo)</option>
                  <option value="1.4">Winter normal (1.4 clo)</option>
                </select>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Nama Ruang</label>
              <select id="pmv-room" class="form-input-dark">
                <option value="">Pilih ruang...</option>
                ${comfortData.rooms.map(r => `<option value="${r.id}">${r.room_name}</option>`).join('')}
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung PMV/PPD
            </button>
          </form>
          
          <div id="pmv-result" style="margin-top: 20px; display: none;">
            <!-- Will be populated by JS -->
          </div>
        </div>
        
        <!-- Climate Standards -->
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0; margin-bottom: 20px;">
            <i class="fas fa-chart-bar" style="margin-right: 8px; color: var(--success-400);"></i>
            Standar Kondisi Udara
          </h4>
          <table class="data-table" style="width: 100%; font-size: 0.75rem; margin-bottom: 16px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; color: var(--text-tertiary);">Parameter</th>
                <th style="text-align: center; padding: 10px; color: var(--text-tertiary);">Standar</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding: 10px;">Suhu Ruang Kerja</td><td style="padding: 10px; text-align: center;">20-28°C</td></tr>
              <tr><td style="padding: 10px;">Suhu Rumah Sakit</td><td style="padding: 10px; text-align: center;">22-26°C</td></tr>
              <tr><td style="padding: 10px;">Kelembapan</td><td style="padding: 10px; text-align: center;">40-70%</td></tr>
              <tr><td style="padding: 10px;">Laju Udara</td><td style="padding: 10px; text-align: center;">0.1-0.3 m/s</td></tr>
              <tr><td style="padding: 10px;">PMV Index</td><td style="padding: 10px; text-align: center;">-0.5 s/d +0.5</td></tr>
              <tr><td style="padding: 10px;">ACH (Ventilasi)</td><td style="padding: 10px; text-align: center;">0.5-1.0 /jam</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Climate Data Table -->
      <div class="card-quartz" style="padding: 24px; margin-bottom: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-database" style="margin-right: 8px; color: var(--brand-400);"></i>
            Data Logger Kondisi Udara
          </h4>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-xs" onclick="showClimateModal()">
              <i class="fas fa-plus"></i> Manual Input
            </button>
            <button class="btn btn-primary btn-xs" onclick="showImportClimateModal()">
              <i class="fas fa-file-csv"></i> Import CSV
            </button>
          </div>
        </div>
        ${renderClimateDataTable()}
      </div>
      
      <!-- ASHRAE 62.1 Ventilation Calculator -->
      <div class="card-quartz" style="padding: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-wind" style="margin-right: 8px; color: var(--brand-400);"></i>
            Kalkulator Ventilasi ASHRAE 62.1
          </h4>
          <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">ASHRAE 62.1</span>
        </div>
        <div class="grid-3-col" style="gap: 16px;">
          <div>
            <label class="form-label">Luas Ruang (m²)</label>
            <input type="number" id="vent-area" class="form-input-dark" placeholder="50" onchange="calculateVentilation()">
          </div>
          <div>
            <label class="form-label">Jumlah Penghuni</label>
            <input type="number" id="vent-occupants" class="form-input-dark" placeholder="10" onchange="calculateVentilation()">
          </div>
          <div>
            <label class="form-label">Fungsi Ruang</label>
            <select id="vent-function" class="form-input-dark" onchange="calculateVentilation()">
              <option value="office">Kantor (2.5 L/s/person + 0.3 L/s/m²)</option>
              <option value="retail">Retail (3.8 L/s/person + 0.4 L/s/m²)</option>
              <option value="education">Pendidikan (5 L/s/person + 0.6 L/s/m²)</option>
              <option value="hospital">Rumah Sakit (13 L/s/person + 0.5 L/s/m²)</option>
            </select>
          </div>
        </div>
        <div id="ventilation-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; display: none;">
          <!-- Will be populated by JS -->
        </div>
      </div>
    </div>
  `;
}

function renderViewTab() {
  return `
    <div id="comfort-tab-view" class="comfort-tab-content active">
      <!-- View Analysis Input -->
      <div class="grid-2-col" style="gap: 20px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-eye" style="margin-right: 8px; color: var(--brand-400);"></i>
              Analisis Pandangan (View Out)
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">Pasal 226 Ayat 6</span>
          </div>
          
          <form id="view-form" onsubmit="saveViewAnalysis(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Ruang</label>
              <select name="room_id" class="form-input-dark" required>
                <option value="">Pilih ruang...</option>
                ${comfortData.rooms.map(r => `<option value="${r.id}">${r.room_name}</option>`).join('')}
              </select>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Tinggi Jendela (m)</label>
                <input type="number" name="window_height" class="form-input-dark" placeholder="1.5" step="0.1" min="0">
              </div>
              <div>
                <label class="form-label">Lebar Jendela (m)</label>
                <input type="number" name="window_width" class="form-input-dark" placeholder="2.0" step="0.1" min="0">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Tinggi Sill (m)</label>
                <input type="number" name="sill_height" class="form-input-dark" placeholder="0.9" step="0.1" min="0">
              </div>
              <div>
                <label class="form-label">Jarak ke Obstacle (m)</label>
                <input type="number" name="distance_to_obstacle" class="form-input-dark" placeholder="6" step="0.1" min="0">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Orientasi Jendela</label>
                <select name="orientation" class="form-input-dark">
                  <option value="N">Utara</option>
                  <option value="NE">Timur Laut</option>
                  <option value="E">Timur</option>
                  <option value="SE">Tenggara</option>
                  <option value="S">Selatan</option>
                  <option value="SW">Barat Daya</option>
                  <option value="W">Barat</option>
                  <option value="NW">Barat Laut</option>
                </select>
              </div>
              <div>
                <label class="form-label">Tinggi Eye Level (m)</label>
                <input type="number" name="eye_height" class="form-input-dark" placeholder="1.2" step="0.1" value="1.2">
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-calculator" style="margin-right: 8px;"></i>
              Hitung View Quality
            </button>
          </form>
        </div>
        
        <div class="card-quartz" style="padding: 24px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0; margin-bottom: 20px;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--success-400);"></i>
            Standar Pandangan
          </h4>
          <table class="data-table" style="width: 100%; font-size: 0.75rem;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; color: var(--text-tertiary);">Parameter</th>
                <th style="text-align: center; padding: 10px; color: var(--text-tertiary);">Minimum</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding: 10px;">Sudut Pandang Vertikal</td><td style="padding: 10px; text-align: center;">≥14°</td></tr>
              <tr><td style="padding: 10px;">Jarak ke Obstacle</td><td style="padding: 10px; text-align: center;">≥6m</td></tr>
              <tr><td style="padding: 10px;">Window to Floor Ratio</td><td style="padding: 10px; text-align: center;">≥10%</td></tr>
              <tr><td style="padding: 10px;">Tinggi Sill (Privasi)</td><td style="padding: 10px; text-align: center;">≥1.1m</td></tr>
              <tr><td style="padding: 10px;">Sky View Factor</td><td style="padding: 10px; text-align: center;">≥0.2</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- View Data Table -->
      <div class="card-quartz" style="padding: 24px; margin-bottom: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-list" style="margin-right: 8px; color: var(--brand-400);"></i>
            Analisis Pandangan Ruang
          </h4>
        </div>
        ${renderViewDataTable()}
      </div>
      
      <!-- 360 Panorama Viewer Placeholder -->
      <div class="card-quartz" style="padding: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-street-view" style="margin-right: 8px; color: var(--brand-400);"></i>
            Visualisasi 360° Panorama
          </h4>
          <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">Pannellum.js</span>
        </div>
        <div id="panorama-viewer" style="height: 400px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: var(--text-tertiary);">
            <i class="fas fa-camera" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>Upload foto panoramic untuk melihat simulasi view<br>Format: JPG/PNG equirectangular</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAcousticTab() {
  return `
    <div id="comfort-tab-acoustic" class="comfort-tab-content active">
      <!-- Noise & Vibration Input -->
      <div class="grid-2-col" style="gap: 20px; margin-bottom: 24px;">
        <!-- Noise Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-volume-up" style="margin-right: 8px; color: var(--brand-400);"></i>
              Analisis Kebisingan
            </h4>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">SNI 03-6389-2000</span>
          </div>
          
          <form id="noise-form" onsubmit="saveNoiseMeasurement(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Ruang</label>
              <select name="room_id" class="form-input-dark">
                <option value="">Pilih ruang...</option>
                ${comfortData.rooms.map(r => `<option value="${r.id}">${r.room_name}</option>`).join('')}
              </select>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Level dB(A)</label>
                <input type="number" name="db_level" class="form-input-dark" placeholder="Contoh: 42" step="0.1" min="20" max="120" required>
              </div>
              <div>
                <label class="form-label">Waktu</label>
                <select name="time_of_day" class="form-input-dark">
                  <option value="day">Siang (07:00-22:00)</option>
                  <option value="night">Malam (22:00-07:00)</option>
                </select>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">LAeq (dB)</label>
                <input type="number" name="laeq" class="form-input-dark" placeholder="42" step="0.1">
              </div>
              <div>
                <label class="form-label">Lmax (dB)</label>
                <input type="number" name="lmax" class="form-input-dark" placeholder="48" step="0.1">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">NR Rating</label>
                <input type="number" name="nr_rating" class="form-input-dark" placeholder="35" min="15" max="70">
              </div>
              <div>
                <label class="form-label">RT60 (detik)</label>
                <input type="number" name="rt60" class="form-input-dark" placeholder="0.8" step="0.1" min="0.1" max="5">
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-save" style="margin-right: 8px;"></i>
              Simpan Data Kebisingan
            </button>
          </form>
        </div>
        
        <!-- Vibration Calculator -->
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-wave-square" style="margin-right: 8px; color: var(--warning-400);"></i>
              Analisis Getaran
            </h4>
            <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--warning-400); font-size: 9px;">SNI 03-6884-2002</span>
          </div>
          
          <form id="vibration-form" onsubmit="saveVibrationMeasurement(event)">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Lokasi/Equipment</label>
              <input type="text" name="location" class="form-input-dark" placeholder="Contoh: HVAC Unit A / Ruang Rapat" required>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">PPV (mm/s)</label>
                <input type="number" name="ppv" class="form-input-dark" placeholder="Contoh: 0.12" step="0.01" min="0" required>
              </div>
              <div>
                <label class="form-label">Frekuensi (Hz)</label>
                <input type="number" name="frequency" class="form-input-dark" placeholder="16" step="1" min="1" value="16">
              </div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <label class="form-label">Kategori Bangunan</label>
              <select name="category" class="form-input-dark">
                <option value="residential">Residential / Rumah Sakit (<0.15 mm/s)</option>
                <option value="office" selected>Office / Komersial (<0.3 mm/s)</option>
                <option value="industrial">Light Industrial (<0.6 mm/s)</option>
                <option value="heavy">Heavy Industrial (<1.2 mm/s)</option>
              </select>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label class="form-label">Sumber Getaran</label>
              <input type="text" name="source" class="form-input-dark" placeholder="Contoh: Generator, Elevator, HVAC">
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-save" style="margin-right: 8px;"></i>
              Simpan Data Getaran
            </button>
          </form>
        </div>
      </div>
      
      <!-- Noise Data Table -->
      <div class="card-quartz" style="padding: 24px; margin-bottom: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-microphone" style="margin-right: 8px; color: var(--brand-400);"></i>
            Data Pengukuran Kebisingan
          </h4>
        </div>
        ${renderNoiseDataTable()}
      </div>
      
      <!-- Vibration Data Table -->
      <div class="card-quartz" style="padding: 24px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
            <i class="fas fa-chart-line" style="margin-right: 8px; color: var(--warning-400);"></i>
            Data Pengukuran Getaran
          </h4>
        </div>
        ${renderVibrationDataTable()}
      </div>
    </div>
  `;
}

function renderReportTab() {
  return `
    <div id="comfort-tab-report" class="comfort-tab-content active">
      <!-- Report Generation -->
      <div class="grid-2-col" style="gap: 20px;">
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-file-pdf" style="margin-right: 8px; color: var(--danger-400);"></i>
              Generator Laporan Kenyamanan
            </h4>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label class="form-label">Pilih Ruang untuk Laporan</label>
            <select id="report-room" class="form-input-dark" multiple style="min-height: 120px;">
              ${comfortData.rooms.map(r => `<option value="${r.id}" selected>${r.room_name}</option>`).join('')}
            </select>
            <p style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 8px;">Hold Ctrl untuk memilih multiple ruang</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label class="form-label">Sertakan Bagian:</label>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                <input type="checkbox" checked> A. Data Ruang & Occupancy
              </label>
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                <input type="checkbox" checked> B. Analisis Ruang Gerak
              </label>
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                <input type="checkbox" checked> C. Kondisi Iklim (PMV/PPD)
              </label>
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                <input type="checkbox" checked> D. Kualitas Pandangan
              </label>
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                <input type="checkbox" checked> E. Getaran & Kebisingan
              </label>
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                <input type="checkbox" checked> F. Kesimpulan & Rekomendasi
              </label>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label class="form-label">Format Output</label>
            <select class="form-input-dark">
              <option value="pdf">PDF Report (Lengkap)</option>
              <option value="excel">Excel (Raw Data)</option>
              <option value="word">Word Document</option>
            </select>
          </div>
          
          <button class="btn btn-primary" style="width: 100%;" onclick="generateComfortReport()">
            <i class="fas fa-file-export" style="margin-right: 8px;"></i>
            Generate Laporan
          </button>
        </div>
        
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-table" style="margin-right: 8px; color: var(--success-400);"></i>
              Preview Ringkasan
            </h4>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">TOTAL RUANG</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: white;">${comfortData.rooms.length}</div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">COMPLIANCE STATUS</div>
            <div style="display: flex; gap: 16px;">
              <div style="text-align: center;">
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--success-400);">${comfortData.rooms.filter(r => r.compliance_status === 'C').length}</div>
                <div style="font-size: 0.7rem; color: var(--text-tertiary);">C (Compliant)</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--warning-400);">${comfortData.rooms.filter(r => r.compliance_status === 'NC').length}</div>
                <div style="font-size: 0.7rem; color: var(--text-tertiary);">NC (Non-Compliant)</div>
              </div>
            </div>
          </div>
          
          <div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">DATA TERKUMPUL</div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: var(--text-secondary);">
              <div style="display: flex; justify-content: space-between;">
                <span>Data Iklim:</span>
                <span style="color: white; font-weight: 600;">${comfortData.climateData.length} pengukuran</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Data Kebisingan:</span>
                <span style="color: white; font-weight: 600;">${comfortData.noiseData.length} pengukuran</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Data Getaran:</span>
                <span style="color: white; font-weight: 600;">${comfortData.vibrationData.length} pengukuran</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Analisis Pandangan:</span>
                <span style="color: white; font-weight: 600;">${comfortData.viewData.length} ruang</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// HELPER FUNCTIONS & CALCULATIONS
// ============================================================

function generateRoomCode() {
  const count = comfortData.rooms.length + 1;
  return `R-${String(count).padStart(3, '0')}`;
}

function formatRoomFunction(key) {
  const mapping = {
    'office': 'Kantor',
    'residential': 'Rumah Tinggal',
    'retail': 'Pertokoan',
    'education': 'Pendidikan',
    'hospital': 'Rumah Sakit',
    'worship': 'Tempat Ibadah',
    'restaurant': 'Restoran',
    'library': 'Perpustakaan',
    'museum': 'Museum',
    'cinema': 'Bioskop'
  };
  return mapping[key] || key;
}

function calculateOccupancyComfort(area, roomType, actualOccupants, furnitureArea) {
  const standardArea = OCCUPANCY_STANDARDS[roomType] || 10;
  const maxOccupancy = Math.floor(area / standardArea);
  
  const netArea = area - furnitureArea;
  const circulationArea = area * 0.3;
  const freeMovementArea = netArea - circulationArea;
  const freeMovementPercent = (freeMovementArea / area) * 100;
  
  let occupancyStatus;
  if (actualOccupants <= maxOccupancy * 0.8) occupancyStatus = 'Underloaded';
  else if (actualOccupants <= maxOccupancy) occupancyStatus = 'Optimal';
  else occupancyStatus = 'Overcrowded';
  
  return {
    maxOccupancy,
    actualOccupancy: actualOccupants,
    density: `${(actualOccupants / area).toFixed(2)} org/m²`,
    occupancyStatus,
    compliance: actualOccupants <= maxOccupancy ? 'C' : 'NC',
    freeMovementArea: freeMovementArea.toFixed(2),
    freeMovementPercent: freeMovementPercent.toFixed(1),
    furnitureDensity: ((furnitureArea / area) * 100).toFixed(1)
  };
}

// PMV Calculation based on ASHRAE 55
function calculatePMV(ta, tr, rh, vel, met, clo) {
  const pa = rh * 10 * Math.exp(16.6536 - 4030.183 / (ta + 235));
  const fcl = clo < 0.078 ? 1 + 1.29 * clo : 1.05 + 0.645 * clo;
  const hcf = 12.1 * Math.sqrt(vel);
  const tcl = (35.7 - 0.028 * met) / (1 + 0.155 * fcl * hcf);
  
  const pmv = (0.303 * Math.exp(-0.036 * met) + 0.028) * 
    ((met - 3.05 * Math.pow(10, -3) * (5733 - 6.99 * met - pa)) -
    0.42 * (met - 58.15) - 1.7 * Math.pow(10, -5) * met * (5867 - pa) -
    0.0014 * met * (34 - ta) - 3.96 * Math.pow(10, -8) * fcl * 
    (Math.pow(tcl + 273, 4) - Math.pow(tr + 273, 4)) -
    fcl * hcf * (tcl - ta));
    
  const ppd = 100 - 95 * Math.exp(-0.03353 * Math.pow(pmv, 4) - 0.2179 * Math.pow(pmv, 2));
  
  let comfortLevel;
  if (Math.abs(pmv) <= 0.5) comfortLevel = 'Comfortable';
  else if (Math.abs(pmv) <= 1.0) comfortLevel = 'Slightly uncomfortable';
  else if (Math.abs(pmv) <= 2.0) comfortLevel = 'Uncomfortable';
  else comfortLevel = 'Very uncomfortable';
  
  return {
    pmv: pmv.toFixed(2),
    ppd: ppd.toFixed(1) + '%',
    comfortLevel,
    status: Math.abs(pmv) <= 0.5 ? 'C' : 'NC'
  };
}

// View Quality Calculation
function calculateViewQuality(windowHeight, windowWidth, sillHeight, eyeHeight = 1.2, distanceToObstacle = 6) {
  const verticalAngle = Math.atan2(windowHeight - (eyeHeight - sillHeight), distanceToObstacle) * (180 / Math.PI);
  const horizontalAngle = Math.atan2(windowWidth / 2, distanceToObstacle) * 2 * (180 / Math.PI);
  const windowArea = windowHeight * windowWidth;
  const floorArea = 20; // assumption or input
  const wfr = (windowArea / floorArea) * 100;
  const privacyLevel = sillHeight >= 1.1 ? 'High' : sillHeight >= 0.9 ? 'Medium' : 'Low';
  
  return {
    verticalViewAngle: verticalAngle.toFixed(1) + '°',
    horizontalViewAngle: horizontalAngle.toFixed(1) + '°',
    windowToFloorRatio: wfr.toFixed(1) + '%',
    privacyLevel,
    viewStatus: (verticalAngle >= 14 && wfr >= 10) ? 'Good' : 'Poor',
    compliance: (verticalAngle >= 14 && wfr >= 10) ? 'C' : 'NC'
  };
}

// Noise Comfort Calculation
function calculateNoiseComfort(measuredLevel, roomType, timeOfDay = 'day') {
  const limit = NOISE_STANDARDS[roomType]?.[timeOfDay] || 45;
  const excess = measuredLevel - limit;
  
  let category;
  if (measuredLevel <= limit) category = 'Aman';
  else if (excess <= 5) category = 'Gangguan ringan';
  else if (excess <= 10) category = 'Gangguan berat';
  else category = 'Berbahaya';
  
  const nrCurve = Math.round(measuredLevel / 5) * 5;
  
  return {
    measuredLevel: measuredLevel + ' dB(A)',
    limitLevel: limit + ' dB(A)',
    excess: excess > 0 ? '+' + excess + ' dB' : '0 dB',
    category,
    nrCurve: 'NR-' + nrCurve,
    status: measuredLevel <= limit ? 'C' : 'NC',
    recommendation: excess > 0 ? 'Pasang peredam atau isolasi suara' : 'Memenuhi standar'
  };
}

// Vibration Analysis
function calculateVibrationComfort(ppv, frequency = 10) {
  let perception;
  if (ppv < 0.15) perception = 'Tidak terasa';
  else if (ppv < 0.3) perception = 'Terasa';
  else if (ppv < 0.6) perception = 'Mengganggu';
  else if (ppv < 1.0) perception = 'Sangat mengganggu';
  else perception = 'Berbahaya';
  
  return {
    ppv: ppv.toFixed(2) + ' mm/s',
    frequency: frequency + ' Hz',
    perception,
    status: ppv < 0.3 ? 'C' : 'NC',
    damageRisk: ppv > 5.0 ? 'Risiko kerusakan struktur' : 'Aman struktural'
  };
}

// RT60 Calculation
function calculateRT60(volume, surfaces) {
  const totalAbsorption = surfaces.reduce((sum, surf) => sum + (surf.area * surf.alpha), 0);
  const rt60 = (0.161 * volume) / totalAbsorption;
  
  let recommended;
  if (volume < 200) recommended = 0.6;
  else if (volume < 500) recommended = 0.8;
  else recommended = 1.0;
  
  return {
    rt60: rt60.toFixed(2) + ' s',
    totalAbsorption: totalAbsorption.toFixed(2) + ' sabin',
    recommended: recommended + ' s',
    status: (rt60 >= 0.5 && rt60 <= 1.2) ? 'C' : 'NC',
    recommendation: rt60 > 1.2 ? 'Tambahkan material absorptif' : rt60 < 0.4 ? 'Kurangi absorpsi' : 'Optimal'
  };
}

// Overall Comfort Score
function calculateOverallComfortScore() {
  const scores = [
    getAspectScore('occupancy'),
    getAspectScore('climate'),
    getAspectScore('view'),
    getAspectScore('acoustic')
  ];
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(average);
}

function getAspectScore(aspect) {
  switch(aspect) {
    case 'occupancy':
      if (comfortData.rooms.length === 0) return 100;
      const compliant = comfortData.rooms.filter(r => r.compliance_status === 'C').length;
      return Math.round((compliant / comfortData.rooms.length) * 100);
    case 'climate':
      if (comfortData.climateData.length === 0) return 100;
      const climateOk = comfortData.climateData.filter(d => d.compliance === 'C').length;
      return Math.round((climateOk / comfortData.climateData.length) * 100);
    case 'view':
      if (comfortData.viewData.length === 0) return 100;
      const viewOk = comfortData.viewData.filter(v => v.compliance === 'C').length;
      return Math.round((viewOk / comfortData.viewData.length) * 100);
    case 'acoustic':
      const noiseScore = comfortData.noiseData.length > 0 
        ? Math.round((comfortData.noiseData.filter(d => d.compliance === 'C').length / comfortData.noiseData.length) * 100)
        : 100;
      const vibScore = comfortData.vibrationData.length > 0
        ? Math.round((comfortData.vibrationData.filter(d => d.compliance === 'C').length / comfortData.vibrationData.length) * 100)
        : 100;
      return Math.round((noiseScore + vibScore) / 2);
    default:
      return 100;
  }
}

function generateRadarChartPlaceholder() {
  // Return SVG radar chart placeholder
  const scores = [getAspectScore('occupancy'), getAspectScore('climate'), getAspectScore('view'), getAspectScore('acoustic')];
  const maxScore = 100;
  const labels = ['Ruang Gerak', 'Kondisi Udara', 'Pandangan', 'Akustik'];
  
  return `
    <svg viewBox="0 0 300 250" style="max-width: 100%; max-height: 100%;">
      <!-- Background circles -->
      <circle cx="150" cy="125" r="40" fill="none" stroke="hsla(220, 20%, 100%, 0.1)" stroke-width="1"/>
      <circle cx="150" cy="125" r="80" fill="none" stroke="hsla(220, 20%, 100%, 0.1)" stroke-width="1"/>
      <circle cx="150" cy="125" r="120" fill="none" stroke="hsla(220, 20%, 100%, 0.1)" stroke-width="1"/>
      
      <!-- Axis lines -->
      <line x1="150" y1="125" x2="150" y2="5" stroke="hsla(220, 20%, 100%, 0.2)" stroke-width="1"/>
      <line x1="150" y1="125" x2="260" y2="195" stroke="hsla(220, 20%, 100%, 0.2)" stroke-width="1"/>
      <line x1="150" y1="125" x2="40" y2="195" stroke="hsla(220, 20%, 100%, 0.2)" stroke-width="1"/>
      <line x1="150" y1="125" x2="40" y2="55" stroke="hsla(220, 20%, 100%, 0.2)" stroke-width="1"/>
      
      <!-- Data polygon -->
      <polygon points="150,${125 - (scores[0]/maxScore * 120)} ${150 + (scores[1]/maxScore * 104)},${125 + (scores[1]/maxScore * 60)} ${150 - (scores[2]/maxScore * 104)},${125 + (scores[2]/maxScore * 60)} ${150 - (scores[3]/maxScore * 70)},${125 - (scores[3]/maxScore * 70)}" 
        fill="hsla(220, 95%, 52%, 0.2)" stroke="var(--brand-400)" stroke-width="2"/>
      
      <!-- Labels -->
      <text x="150" y="15" text-anchor="middle" fill="var(--text-secondary)" font-size="10">${labels[0]} ${scores[0]}%</text>
      <text x="270" y="200" text-anchor="middle" fill="var(--text-secondary)" font-size="10">${labels[1]} ${scores[1]}%</text>
      <text x="30" y="200" text-anchor="middle" fill="var(--text-secondary)" font-size="10">${labels[2]} ${scores[2]}%</text>
      <text x="30" y="50" text-anchor="middle" fill="var(--text-secondary)" font-size="10">${labels[3]} ${scores[3]}%</text>
    </svg>
  `;
}

// ============================================================
// TABLE RENDERERS
// ============================================================

function renderRoomSummaryTable() {
  if (comfortData.rooms.length === 0) {
    return `<div style="padding: 40px; text-align: center; color: var(--text-tertiary);">
      <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 16px; opacity: 0.5;"></i>
      <p>Belum ada data ruang. Klik "Tambah Ruang" untuk memulai.</p>
    </div>`;
  }
  
  return `
    <table class="data-table" style="width: 100%; font-size: 0.75rem;">
      <thead>
        <tr>
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">Kode</th>
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">Nama Ruang</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">Luas (m²)</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">Occupancy</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">Gerak Bebas</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">Status</th>
        </tr>
      </thead>
      <tbody>
        ${comfortData.rooms.map(room => {
          const analysis = calculateOccupancyComfort(
            room.floor_area, 
            room.room_function, 
            room.actual_occupants || 0, 
            room.furniture_area || 0
          );
          return `
            <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
              <td style="padding: 12px; color: white; font-weight: 600;">${room.room_code}</td>
              <td style="padding: 12px; color: var(--text-secondary);">${room.room_name}</td>
              <td style="padding: 12px; text-align: center; color: white;">${room.floor_area}</td>
              <td style="padding: 12px; text-align: center; color: ${analysis.occupancyStatus === 'Optimal' ? 'var(--success-400)' : analysis.occupancyStatus === 'Underloaded' ? 'var(--brand-400)' : 'var(--warning-400)'}">
                ${room.actual_occupants || 0}/${analysis.maxOccupancy}
              </td>
              <td style="padding: 12px; text-align: center; color: ${parseFloat(analysis.freeMovementPercent) >= 40 ? 'var(--success-400)' : 'var(--warning-400)'}">
                ${analysis.freeMovementPercent}%
              </td>
              <td style="padding: 12px; text-align: center;">
                <span class="badge" style="background: ${analysis.compliance === 'C' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; 
                  color: ${analysis.compliance === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}; font-size: 10px;">
                  ${analysis.compliance}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderDetailedRoomTable() {
  if (comfortData.rooms.length === 0) {
    return `<p style="text-align: center; color: var(--text-tertiary); padding: 40px;">Belum ada data ruang.</p>`;
  }
  
  return `
    <table class="data-table" style="width: 100%; font-size: 0.75rem;">
      <thead>
        <tr>
          <th style="padding: 12px; text-align: left;">Ruang</th>
          <th style="padding: 12px; text-align: center;">Fungsi</th>
          <th style="padding: 12px; text-align: center;">Luas</th>
          <th style="padding: 12px; text-align: center;">Max Occupancy</th>
          <th style="padding: 12px; text-align: center;">Density</th>
          <th style="padding: 12px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${comfortData.rooms.map(room => {
          const analysis = calculateOccupancyComfort(
            room.floor_area,
            room.room_function,
            room.actual_occupants || 0,
            room.furniture_area || 0
          );
          return `
            <tr>
              <td style="padding: 12px;"><strong>${room.room_name}</strong><br><span style="color: var(--text-tertiary);">${room.room_code}</span></td>
              <td style="padding: 12px; text-align: center;">${formatRoomFunction(room.room_function)}</td>
              <td style="padding: 12px; text-align: center;">${room.floor_area} m²</td>
              <td style="padding: 12px; text-align: center;">${analysis.maxOccupancy} orang</td>
              <td style="padding: 12px; text-align: center;">${analysis.density}</td>
              <td style="padding: 12px; text-align: center;">
                <span class="badge" style="background: ${analysis.occupancyStatus === 'Optimal' ? 'hsla(160, 100%, 45%, 0.1)' : analysis.occupancyStatus === 'Overcrowded' ? 'hsla(0, 85%, 60%, 0.1)' : 'hsla(220, 95%, 52%, 0.1)'};
                  color: ${analysis.occupancyStatus === 'Optimal' ? 'var(--success-400)' : analysis.occupancyStatus === 'Overcrowded' ? 'var(--danger-400)' : 'var(--brand-400)'}">
                  ${analysis.occupancyStatus}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderClimateDataTable() {
  if (comfortData.climateData.length === 0) {
    return `<p style="text-align: center; color: var(--text-tertiary); padding: 40px;">Belum ada data kondisi udara.</p>`;
  }
  
  return `
    <table class="data-table" style="width: 100%; font-size: 0.75rem;">
      <thead>
        <tr>
          <th style="padding: 12px;">Waktu</th>
          <th style="padding: 12px; text-align: center;">Suhu (°C)</th>
          <th style="padding: 12px; text-align: center;">RH (%)</th>
          <th style="padding: 12px; text-align: center;">PMV</th>
          <th style="padding: 12px; text-align: center;">PPD</th>
          <th style="padding: 12px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${comfortData.climateData.slice(0, 10).map(data => `
          <tr>
            <td style="padding: 12px;">${new Date(data.measured_at).toLocaleString('id-ID')}</td>
            <td style="padding: 12px; text-align: center;">${data.temperature}</td>
            <td style="padding: 12px; text-align: center;">${data.humidity}</td>
            <td style="padding: 12px; text-align: center;">${data.pmv || '-'}</td>
            <td style="padding: 12px; text-align: center;">${data.ppd || '-'}</td>
            <td style="padding: 12px; text-align: center;">
              <span class="badge" style="background: ${data.compliance === 'C' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'};
                color: ${data.compliance === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">
                ${data.compliance === 'C' ? 'C' : 'NC'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderViewDataTable() {
  if (comfortData.viewData.length === 0) {
    return `<p style="text-align: center; color: var(--text-tertiary); padding: 40px;">Belum ada data analisis pandangan.</p>`;
  }
  
  return `
    <table class="data-table" style="width: 100%; font-size: 0.75rem;">
      <thead>
        <tr>
          <th style="padding: 12px;">Ruang</th>
          <th style="padding: 12px; text-align: center;">WFR (%)</th>
          <th style="padding: 12px; text-align: center;">Sudut Vertikal</th>
          <th style="padding: 12px; text-align: center;">Privasi</th>
          <th style="padding: 12px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${comfortData.viewData.map(data => `
          <tr>
            <td style="padding: 12px;">${data.room_name || getRoomName(data.room_id)}</td>
            <td style="padding: 12px; text-align: center;">${data.wfr_percent || '-'}%</td>
            <td style="padding: 12px; text-align: center;">${data.vertical_angle || '-'}°</td>
            <td style="padding: 12px; text-align: center;">${data.privacy_level || '-'}</td>
            <td style="padding: 12px; text-align: center;">
              <span class="badge" style="background: ${data.compliance === 'C' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'};
                color: ${data.compliance === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">
                ${data.compliance === 'C' ? 'C' : 'NC'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderNoiseDataTable() {
  if (comfortData.noiseData.length === 0) {
    return `<p style="text-align: center; color: var(--text-tertiary); padding: 40px;">Belum ada data kebisingan.</p>`;
  }
  
  return `
    <table class="data-table" style="width: 100%; font-size: 0.75rem;">
      <thead>
        <tr>
          <th style="padding: 12px;">Ruang</th>
          <th style="padding: 12px; text-align: center;">LAeq (dB)</th>
          <th style="padding: 12px; text-align: center;">NR Rating</th>
          <th style="padding: 12px; text-align: center;">RT60 (s)</th>
          <th style="padding: 12px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${comfortData.noiseData.slice(0, 10).map(data => `
          <tr>
            <td style="padding: 12px;">${getRoomName(data.room_id)}</td>
            <td style="padding: 12px; text-align: center;">${data.laeq || data.db_level}</td>
            <td style="padding: 12px; text-align: center;">${data.nr_rating || '-'}</td>
            <td style="padding: 12px; text-align: center;">${data.rt60 || '-'}</td>
            <td style="padding: 12px; text-align: center;">
              <span class="badge" style="background: ${data.compliance === 'C' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'};
                color: ${data.compliance === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">
                ${data.compliance === 'C' ? 'C' : 'NC'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderVibrationDataTable() {
  if (comfortData.vibrationData.length === 0) {
    return `<p style="text-align: center; color: var(--text-tertiary); padding: 40px;">Belum ada data getaran.</p>`;
  }
  
  return `
    <table class="data-table" style="width: 100%; font-size: 0.75rem;">
      <thead>
        <tr>
          <th style="padding: 12px;">Lokasi</th>
          <th style="padding: 12px; text-align: center;">PPV (mm/s)</th>
          <th style="padding: 12px; text-align: center;">Frekuensi (Hz)</th>
          <th style="padding: 12px; text-align: center;">Persepsi</th>
          <th style="padding: 12px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${comfortData.vibrationData.slice(0, 10).map(data => {
          const vibAnalysis = calculateVibrationComfort(data.ppv, data.frequency);
          return `
            <tr>
              <td style="padding: 12px;">${data.location}</td>
              <td style="padding: 12px; text-align: center;">${data.ppv}</td>
              <td style="padding: 12px; text-align: center;">${data.frequency}</td>
              <td style="padding: 12px; text-align: center;">${vibAnalysis.perception}</td>
              <td style="padding: 12px; text-align: center;">
                <span class="badge" style="background: ${data.compliance === 'C' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'};
                  color: ${data.compliance === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">
                  ${data.compliance === 'C' ? 'C' : 'NC'}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function getRoomName(roomId) {
  const room = comfortData.rooms.find(r => r.id === roomId);
  return room ? room.room_name : 'Unknown';
}

// ============================================================
// MODALS
// ============================================================

function renderModals() {
  return `
    <!-- Room Modal -->
    <div id="room-modal" class="modal" style="display: none;">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3><i class="fas fa-door-open"></i> Tambah/Edit Ruang</h3>
          <button class="modal-close" onclick="closeModal('room-modal')">&times;</button>
        </div>
        <form id="room-modal-form" onsubmit="saveRoomProfile(event)">
          <div style="padding: 20px;">
            <!-- Room form fields -->
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('room-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Climate Modal -->
    <div id="climate-modal" class="modal" style="display: none;">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-thermometer-half"></i> Input Data Iklim</h3>
          <button class="modal-close" onclick="closeModal('climate-modal')">&times;</button>
        </div>
        <form id="climate-modal-form" onsubmit="saveClimateMeasurement(event)">
          <div style="padding: 20px;">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Ruang</label>
              <select name="room_id" class="form-input-dark" required>
                <option value="">Pilih ruang...</option>
                ${comfortData.rooms.map(r => `<option value="${r.id}">${r.room_name}</option>`).join('')}
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Suhu (°C)</label>
                <input type="number" name="temperature" class="form-input-dark" placeholder="24" step="0.1" required>
              </div>
              <div>
                <label class="form-label">RH (%)</label>
                <input type="number" name="humidity" class="form-input-dark" placeholder="55" step="1" min="0" max="100" required>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label class="form-label">Kecepatan Udara (m/s)</label>
                <input type="number" name="air_velocity" class="form-input-dark" placeholder="0.15" step="0.01">
              </div>
              <div>
                <label class="form-label">Waktu Pengukuran</label>
                <input type="datetime-local" name="measured_at" class="form-input-dark" required>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('climate-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Import Climate Modal -->
    <div id="import-climate-modal" class="modal" style="display: none;">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-file-csv"></i> Import Data Logger</h3>
          <button class="modal-close" onclick="closeModal('import-climate-modal')">&times;</button>
        </div>
        <div style="padding: 20px;">
          <div style="margin-bottom: 16px;">
            <label class="form-label">Ruang Target</label>
            <select id="import-room-id" class="form-input-dark">
              <option value="">Pilih ruang...</option>
              ${comfortData.rooms.map(r => `<option value="${r.id}">${r.room_name}</option>`).join('')}
            </select>
          </div>
          <div style="border: 2px dashed hsla(220, 20%, 100%, 0.2); border-radius: 10px; padding: 40px; text-align: center;">
            <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: var(--brand-400); margin-bottom: 16px;"></i>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px;">
              Drag & drop file CSV atau klik untuk browse
            </p>
            <input type="file" id="climate-csv-input" accept=".csv" style="display: none;" onchange="handleClimateCSVImport(event)">
            <button type="button" class="btn btn-primary" onclick="document.getElementById('climate-csv-input').click()">
              Pilih File CSV
            </button>
            <p style="color: var(--text-tertiary); font-size: 0.7rem; margin-top: 16px;">
              Format: timestamp, temperature, humidity, air_velocity<br>
              Support: HOBO, Testo, Onset data loggers
            </p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeModal('import-climate-modal')">Tutup</button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function initEventListeners() {
  // Tab switching is handled by window._switchComfortTab
  // Form submissions are handled by onsubmit attributes
}

function initCSVImportListeners() {
  // CSV import handled by file input onchange
}

// Tab Switching
function _switchComfortTab(tabId, btn) {
  currentTab = tabId;
  
  document.querySelectorAll('.comfort-tab-item').forEach(item => {
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

function selectRoom(roomId) {
  selectedRoom = comfortData.rooms.find(r => r.id === roomId);
  renderCurrentTab();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

function showRoomModal() {
  const modal = document.getElementById('room-modal');
  if (modal) modal.style.display = 'flex';
}

function showClimateModal() {
  const modal = document.getElementById('climate-modal');
  if (modal) {
    // Set default datetime
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const datetimeInput = modal.querySelector('input[name="measured_at"]');
    if (datetimeInput) datetimeInput.value = now.toISOString().slice(0, 16);
    modal.style.display = 'flex';
  }
}

function showImportClimateModal() {
  const modal = document.getElementById('import-climate-modal');
  if (modal) modal.style.display = 'flex';
}

function showNoiseModal() {
  // Show noise input - can use acoustic tab instead
  _switchComfortTab('acoustic', document.querySelector('[data-tab="acoustic"]'));
}

function showVibrationModal() {
  // Show vibration input - can use acoustic tab instead
  _switchComfortTab('acoustic', document.querySelector('[data-tab="acoustic"]'));
}

function showFurnitureLayoutModal() {
  showInfo('Layout editor akan segera tersedia');
}

// Form Handlers
async function saveRoomProfile(e) {
  e.preventDefault();
  const form = e.target;
  
  const roomData = {
    project_id: currentProjectId,
    room_code: form.room_code?.value || generateRoomCode(),
    room_name: form.room_name?.value,
    room_function: form.room_function?.value,
    floor_area: parseFloat(form.floor_area?.value) || 0,
    ceiling_height: parseFloat(form.ceiling_height?.value) || 0,
    actual_occupants: parseInt(form.actual_occupants?.value) || 0,
    furniture_area: parseFloat(form.furniture_area?.value) || 0,
    furniture_count: parseInt(form.furniture_count?.value) || 0,
    created_at: new Date().toISOString()
  };
  
  // Calculate compliance
  const analysis = calculateOccupancyComfort(
    roomData.floor_area,
    roomData.room_function,
    roomData.actual_occupants,
    roomData.furniture_area
  );
  roomData.compliance_status = analysis.compliance;
  
  try {
    // Save to local storage first (fallback)
    const existingRooms = JSON.parse(localStorage.getItem(`comfort_rooms_${currentProjectId}`) || '[]');
    existingRooms.push({ ...roomData, id: Date.now().toString() });
    localStorage.setItem(`comfort_rooms_${currentProjectId}`, JSON.stringify(existingRooms));
    
    // Try to save to Supabase
    try {
      await supabase.from('comfort_rooms').insert(roomData);
    } catch (err) {
      console.log('Supabase save failed, using local storage');
    }
    
    showSuccess('Ruang berhasil disimpan');
    closeModal('room-modal');
    form.reset();
    await loadComfortData();
    renderCurrentTab();
  } catch (err) {
    showError('Gagal menyimpan ruang: ' + err.message);
  }
}

async function saveClimateMeasurement(e) {
  e.preventDefault();
  const form = e.target;
  
  const ta = parseFloat(form.temperature.value);
  const rh = parseFloat(form.humidity.value);
  const vel = parseFloat(form.air_velocity?.value) || 0.15;
  
  // Calculate PMV
  const pmvResult = calculatePMV(ta, ta, rh, vel, 1.0, 0.5);
  
  const climateData = {
    project_id: currentProjectId,
    room_id: form.room_id?.value,
    temperature: ta,
    humidity: rh,
    air_velocity: vel,
    pmv: parseFloat(pmvResult.pmv),
    ppd: parseFloat(pmvResult.ppd),
    compliance: pmvResult.status,
    measured_at: form.measured_at?.value || new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  try {
    // Local storage fallback
    const existingData = JSON.parse(localStorage.getItem(`comfort_climate_${currentProjectId}`) || '[]');
    existingData.push({ ...climateData, id: Date.now().toString() });
    localStorage.setItem(`comfort_climate_${currentProjectId}`, JSON.stringify(existingData));
    
    // Try Supabase
    try {
      await supabase.from('comfort_climate').insert(climateData);
    } catch (err) {
      console.log('Supabase save failed, using local storage');
    }
    
    showSuccess('Data iklim berhasil disimpan');
    closeModal('climate-modal');
    form.reset();
    await loadComfortData();
    renderCurrentTab();
  } catch (err) {
    showError('Gagal menyimpan data: ' + err.message);
  }
}

async function saveViewAnalysis(e) {
  e.preventDefault();
  const form = e.target;
  
  const windowHeight = parseFloat(form.window_height?.value) || 1.5;
  const windowWidth = parseFloat(form.window_width?.value) || 2.0;
  const sillHeight = parseFloat(form.sill_height?.value) || 0.9;
  const distanceToObstacle = parseFloat(form.distance_to_obstacle?.value) || 6;
  const eyeHeight = parseFloat(form.eye_height?.value) || 1.2;
  
  const viewAnalysis = calculateViewQuality(windowHeight, windowWidth, sillHeight, eyeHeight, distanceToObstacle);
  
  const viewData = {
    project_id: currentProjectId,
    room_id: form.room_id?.value,
    room_name: getRoomName(form.room_id?.value),
    window_height: windowHeight,
    window_width: windowWidth,
    sill_height: sillHeight,
    distance_to_obstacle: distanceToObstacle,
    orientation: form.orientation?.value,
    vertical_angle: parseFloat(viewAnalysis.verticalViewAngle),
    horizontal_angle: parseFloat(viewAnalysis.horizontalViewAngle),
    wfr_percent: parseFloat(viewAnalysis.windowToFloorRatio),
    privacy_level: viewAnalysis.privacyLevel,
    compliance: viewAnalysis.compliance,
    created_at: new Date().toISOString()
  };
  
  try {
    const existingData = JSON.parse(localStorage.getItem(`comfort_view_${currentProjectId}`) || '[]');
    existingData.push({ ...viewData, id: Date.now().toString() });
    localStorage.setItem(`comfort_view_${currentProjectId}`, JSON.stringify(existingData));
    
    try {
      await supabase.from('comfort_view').insert(viewData);
    } catch (err) {
      console.log('Supabase save failed');
    }
    
    showSuccess('Analisis pandangan berhasil disimpan');
    form.reset();
    await loadComfortData();
    renderCurrentTab();
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

async function saveNoiseMeasurement(e) {
  e.preventDefault();
  const form = e.target;
  
  const room = comfortData.rooms.find(r => r.id === form.room_id?.value);
  const roomType = room?.room_function || 'office';
  
  const dbLevel = parseFloat(form.db_level?.value) || 0;
  const timeOfDay = form.time_of_day?.value || 'day';
  
  const noiseAnalysis = calculateNoiseComfort(dbLevel, roomType, timeOfDay);
  
  const noiseData = {
    project_id: currentProjectId,
    room_id: form.room_id?.value,
    db_level: dbLevel,
    laeq: parseFloat(form.laeq?.value) || dbLevel,
    lmax: parseFloat(form.lmax?.value) || null,
    nr_rating: parseInt(form.nr_rating?.value) || null,
    rt60: parseFloat(form.rt60?.value) || null,
    time_of_day: timeOfDay,
    compliance: noiseAnalysis.status,
    measured_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  try {
    const existingData = JSON.parse(localStorage.getItem(`comfort_noise_${currentProjectId}`) || '[]');
    existingData.push({ ...noiseData, id: Date.now().toString() });
    localStorage.setItem(`comfort_noise_${currentProjectId}`, JSON.stringify(existingData));
    
    try {
      await supabase.from('comfort_noise').insert(noiseData);
    } catch (err) {
      console.log('Supabase save failed');
    }
    
    showSuccess('Data kebisingan berhasil disimpan');
    form.reset();
    await loadComfortData();
    renderCurrentTab();
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

async function saveVibrationMeasurement(e) {
  e.preventDefault();
  const form = e.target;
  
  const ppv = parseFloat(form.ppv?.value) || 0;
  const frequency = parseInt(form.frequency?.value) || 16;
  const category = form.category?.value || 'office';
  
  const vibAnalysis = calculateVibrationComfort(ppv, frequency);
  
  const vibrationData = {
    project_id: currentProjectId,
    location: form.location?.value,
    category: category,
    ppv: ppv,
    frequency: frequency,
    source: form.source?.value || null,
    perception: vibAnalysis.perception,
    compliance: vibAnalysis.status,
    measured_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  try {
    const existingData = JSON.parse(localStorage.getItem(`comfort_vibration_${currentProjectId}`) || '[]');
    existingData.push({ ...vibrationData, id: Date.now().toString() });
    localStorage.setItem(`comfort_vibration_${currentProjectId}`, JSON.stringify(existingData));
    
    try {
      await supabase.from('comfort_vibration').insert(vibrationData);
    } catch (err) {
      console.log('Supabase save failed');
    }
    
    showSuccess('Data getaran berhasil disimpan');
    form.reset();
    await loadComfortData();
    renderCurrentTab();
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  }
}

// Calculator Functions
function calculateOccupancyPreview() {
  const form = document.getElementById('room-form');
  if (!form) return;
  
  const area = parseFloat(form.floor_area?.value) || 0;
  const roomType = form.room_function?.value;
  const actualOccupants = parseInt(form.actual_occupants?.value) || 0;
  const furnitureArea = parseFloat(form.furniture_area?.value) || 0;
  
  if (!area || !roomType) return;
  
  const analysis = calculateOccupancyComfort(area, roomType, actualOccupants, furnitureArea);
  
  const previewDiv = document.getElementById('occupancy-preview');
  const contentDiv = document.getElementById('preview-content');
  
  if (previewDiv && contentDiv) {
    contentDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Max Occupancy</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: white;">${analysis.maxOccupancy} org</div>
        </div>
        <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Density</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: white;">${analysis.density}</div>
        </div>
        <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Ruang Gerak Bebas</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: ${parseFloat(analysis.freeMovementPercent) >= 40 ? 'var(--success-400)' : 'var(--warning-400)'}">${analysis.freeMovementPercent}%</div>
        </div>
        <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Status</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: ${analysis.occupancyStatus === 'Optimal' ? 'var(--success-400)' : analysis.occupancyStatus === 'Underloaded' ? 'var(--brand-400)' : 'var(--warning-400)'}">${analysis.occupancyStatus}</div>
        </div>
      </div>
    `;
    previewDiv.style.display = 'block';
  }
}

function updateOccupancyStandard(roomType) {
  const standard = OCCUPANCY_STANDARDS[roomType];
  // Could update UI to show selected standard
}

function calculatePMVForm(e) {
  e.preventDefault();
  const ta = parseFloat(document.getElementById('pmv-ta')?.value);
  const tr = parseFloat(document.getElementById('pmv-tr')?.value) || ta;
  const rh = parseFloat(document.getElementById('pmv-rh')?.value) || 55;
  const vel = parseFloat(document.getElementById('pmv-vel')?.value) || 0.15;
  const met = parseFloat(document.getElementById('pmv-met')?.value) || 1.0;
  const clo = parseFloat(document.getElementById('pmv-clo')?.value) || 0.5;
  
  const result = calculatePMV(ta, tr, rh, vel, met, clo);
  
  const resultDiv = document.getElementById('pmv-result');
  if (resultDiv) {
    resultDiv.innerHTML = `
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid ${result.status === 'C' ? 'var(--success-400)' : 'var(--warning-400)'}">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 3rem; font-weight: 800; color: ${result.status === 'C' ? 'var(--success-400)' : 'var(--warning-400)'}">${result.pmv}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">PMV Index</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center;">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">PPD</div>
            <div style="font-size: 1.1rem; font-weight: 600; color: white;">${result.ppd}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Comfort Level</div>
            <div style="font-size: 1.1rem; font-weight: 600; color: ${result.status === 'C' ? 'var(--success-400)' : 'var(--warning-400)'}">${result.comfortLevel}</div>
          </div>
        </div>
      </div>
    `;
    resultDiv.style.display = 'block';
  }
}

function calculateVentilation() {
  const area = parseFloat(document.getElementById('vent-area')?.value) || 0;
  const occupants = parseInt(document.getElementById('vent-occupants')?.value) || 0;
  const ventFunction = document.getElementById('vent-function')?.value || 'office';
  
  const rates = {
    'office': { rp: 2.5, ra: 0.3 },
    'retail': { rp: 3.8, ra: 0.4 },
    'education': { rp: 5.0, ra: 0.6 },
    'hospital': { rp: 13.0, ra: 0.5 }
  };
  
  const rate = rates[ventFunction];
  const vbz = (rate.rp * occupants) + (rate.ra * area);
  
  const resultDiv = document.getElementById('ventilation-result');
  if (resultDiv && area > 0) {
    resultDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">Rp (per person)</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: white;">${rate.rp} L/s</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">Ra (per m²)</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: white;">${rate.ra} L/s</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">Vbz (Total)</div>
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--success-400);">${vbz.toFixed(1)} L/s</div>
        </div>
      </div>
    `;
    resultDiv.style.display = 'block';
  }
}

// CSV Import Handler
function handleClimateCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split('\n').filter(line => line.trim());
    
    // Parse CSV (simple parser - assumes timestamp, temp, humidity, velocity format)
    const data = [];
    for (let i = 1; i < lines.length; i++) { // Skip header
      const cols = lines[i].split(',');
      if (cols.length >= 3) {
        data.push({
          timestamp: cols[0].trim(),
          temperature: parseFloat(cols[1]),
          humidity: parseFloat(cols[2]),
          velocity: parseFloat(cols[3]) || 0.15
        });
      }
    }
    
    showSuccess(`Berhasil memparse ${data.length} baris data dari CSV`);
    
    // Store parsed data for batch import
    window.parsedClimateData = data;
    
    // Show preview
    const roomId = document.getElementById('import-room-id')?.value;
    if (roomId && data.length > 0) {
      batchImportClimateData(roomId, data);
    }
  };
  reader.readAsText(file);
}

async function batchImportClimateData(roomId, data) {
  const room = comfortData.rooms.find(r => r.id === roomId);
  if (!room) {
    showError('Pilih ruang terlebih dahulu');
    return;
  }
  
  let successCount = 0;
  
  for (const row of data) {
    const pmvResult = calculatePMV(row.temperature, row.temperature, row.humidity, row.velocity, 1.0, 0.5);
    
    const climateData = {
      project_id: currentProjectId,
      room_id: roomId,
      temperature: row.temperature,
      humidity: row.humidity,
      air_velocity: row.velocity,
      pmv: parseFloat(pmvResult.pmv),
      ppd: parseFloat(pmvResult.ppd),
      compliance: pmvResult.status,
      measured_at: new Date(row.timestamp).toISOString(),
      created_at: new Date().toISOString()
    };
    
    // Save to local storage
    const existingData = JSON.parse(localStorage.getItem(`comfort_climate_${currentProjectId}`) || '[]');
    existingData.push({ ...climateData, id: Date.now().toString() + Math.random() });
    localStorage.setItem(`comfort_climate_${currentProjectId}`, JSON.stringify(existingData));
    successCount++;
  }
  
  showSuccess(`${successCount} data iklim berhasil diimport`);
  closeModal('import-climate-modal');
  await loadComfortData();
  renderCurrentTab();
}

// Report Generation
async function generateComfortReport() {
  showInfo('Generating comfort report...');
  
  // Collect all data
  const reportData = {
    projectName: currentProjectName,
    date: new Date().toLocaleDateString('id-ID'),
    rooms: comfortData.rooms,
    climateData: comfortData.climateData,
    noiseData: comfortData.noiseData,
    vibrationData: comfortData.vibrationData,
    viewData: comfortData.viewData,
    overallScore: calculateOverallComfortScore()
  };
  
  // Generate PDF using jsPDF or similar library
  // For now, create a simple HTML report that can be printed
  const reportHTML = generateHTMLReport(reportData);
  
  // Open in new window
  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(reportHTML);
  reportWindow.document.close();
  
  showSuccess('Laporan berhasil dibuka di tab baru');
}

function generateHTMLReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Aspek Kenyamanan - ${data.projectName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        h2 { color: #555; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .compliant { color: green; }
        .non-compliant { color: red; }
        .summary { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>LAPORAN PEMERIKSAAN ASPEK KENYAMANAN</h1>
      <div class="summary">
        <p><strong>Proyek:</strong> ${data.projectName}</p>
        <p><strong>Tanggal:</strong> ${data.date}</p>
        <p><strong>Overall Comfort Score:</strong> ${data.overallScore}%</p>
      </div>
      
      <h2>A. Data Ruang & Occupancy</h2>
      <table>
        <tr><th>Kode</th><th>Nama</th><th>Luas</th><th>Occupancy</th><th>Status</th></tr>
        ${data.rooms.map(r => `
          <tr>
            <td>${r.room_code}</td>
            <td>${r.room_name}</td>
            <td>${r.floor_area} m²</td>
            <td>${r.actual_occupants || 0} orang</td>
            <td class="${r.compliance_status === 'C' ? 'compliant' : 'non-compliant'}">${r.compliance_status}</td>
          </tr>
        `).join('')}
      </table>
      
      <h2>C. Kondisi Iklim</h2>
      <table>
        <tr><th>Waktu</th><th>Suhu (°C)</th><th>RH (%)</th><th>PMV</th><th>Status</th></tr>
        ${data.climateData.slice(0, 20).map(c => `
          <tr>
            <td>${new Date(c.measured_at).toLocaleString('id-ID')}</td>
            <td>${c.temperature}</td>
            <td>${c.humidity}</td>
            <td>${c.pmv || '-'}</td>
            <td class="${c.compliance === 'C' ? 'compliant' : 'non-compliant'}">${c.compliance}</td>
          </tr>
        `).join('')}
      </table>
      
      <h2>E. Getaran & Kebisingan</h2>
      <table>
        <tr><th>Lokasi</th><th>dB(A)</th><th>PPV (mm/s)</th><th>Status</th></tr>
        ${data.noiseData.slice(0, 10).map(n => `
          <tr>
            <td>${n.room_id || '-'}</td>
            <td>${n.db_level}</td>
            <td>-</td>
            <td class="${n.compliance === 'C' ? 'compliant' : 'non-compliant'}">${n.compliance}</td>
          </tr>
        `).join('')}
        ${data.vibrationData.slice(0, 10).map(v => `
          <tr>
            <td>${v.location}</td>
            <td>-</td>
            <td>${v.ppv}</td>
            <td class="${v.compliance === 'C' ? 'compliant' : 'non-compliant'}">${v.compliance}</td>
          </tr>
        `).join('')}
      </table>
      
      <div style="margin-top: 50px; text-align: center; font-size: 0.85rem; color: #666;">
        <p>Generated by SLF Inspection System</p>
        <p>Berdasarkan PP Nomor 16 Tahun 2021, SNI 03-6197-2000, SNI 03-6572-2001, SNI 03-6389-2000, ASHRAE 55/62.1</p>
      </div>
    </body>
    </html>
  `;
}

// ============================================================
// STYLES
// ============================================================

function getComfortStyles() {
  return `
    .comfort-content {
      min-height: 400px;
    }
    
    .comfort-tab-content {
      display: none;
    }
    
    .comfort-tab-content.active {
      display: block;
      animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .grid-2-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .grid-3-col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .grid-4-col {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    @media (max-width: 1024px) {
      .grid-4-col { grid-template-columns: repeat(2, 1fr); }
    }
    
    @media (max-width: 768px) {
      .grid-2-col, .grid-3-col, .grid-4-col { grid-template-columns: 1fr; }
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
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table th {
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .data-table td {
      font-size: 0.8rem;
    }
    
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    
    .clickable {
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
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
// WINDOW EXPORTS
// ============================================================

window._switchComfortTab = _switchComfortTab;
window.renderCurrentTab = renderCurrentTab;
window.closeModal = closeModal;
window.showRoomModal = showRoomModal;
window.showClimateModal = showClimateModal;
window.showImportClimateModal = showImportClimateModal;
window.showNoiseModal = showNoiseModal;
window.showVibrationModal = showVibrationModal;
window.showFurnitureLayoutModal = showFurnitureLayoutModal;
window.saveRoomProfile = saveRoomProfile;
window.saveClimateMeasurement = saveClimateMeasurement;
window.saveViewAnalysis = saveViewAnalysis;
window.saveNoiseMeasurement = saveNoiseMeasurement;
window.saveVibrationMeasurement = saveVibrationMeasurement;
window.calculatePMV = calculatePMVForm;
window.calculateOccupancyPreview = calculateOccupancyPreview;
window.updateOccupancyStandard = updateOccupancyStandard;
window.calculateVentilation = calculateVentilation;
window.handleClimateCSVImport = handleClimateCSVImport;
window.generateComfortReport = generateComfortReport;

