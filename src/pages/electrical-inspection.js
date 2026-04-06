// ============================================================
// ELECTRICAL SYSTEM INSPECTION - MAIN PAGE
// Pemeriksaan Sistem Kelistrikan SLF
// Integrates: Measurements, Calculations, Visualization, Reports
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { uploadToGoogleDrive } from '../lib/drive.js';

// Electrical System Libraries
import {
  calculatePower,
  calculateActualLoading,
  calculatePhaseImbalance,
  calculateVoltageDrop,
  analyzeThermalData,
  calculateTemperatureTrend,
  analyzeProtectionCoordination,
  estimateShortCircuitCurrent,
  verifyBreakingCapacity,
  generateComplianceCheck,
  generateRecommendations,
  simulateMCBUpgrade,
  simulateLoadTransfer,
  generateSummaryText
} from '../lib/electrical-calculator.js';

import {
  parseDataLoggerCSV,
  parseDataLoggerExcel,
  parseThermalImageMetadata,
  batchProcessFiles,
  exportToCSV
} from '../lib/electrical-data-import.js';

import {
  generateSingleLineDiagram,
  generateThermalHeatmap,
  generateLoadingIndicator,
  generatePanelStatusCard,
  generateComplianceSummary,
  generateMeasurementTable,
  createLoadProfileChartConfig,
  createPhaseImbalanceChartConfig,
  createThermalTrendChartConfig,
  CHART_COLORS
} from '../lib/electrical-visualization.js';

import {
  initDatabase,
  createPanel,
  getPanel,
  getPanelsByProject,
  updatePanel,
  deletePanel,
  addMeasurement,
  getMeasurements,
  addThermalImage,
  getThermalImages,
  downloadProjectBackup,
  importProjectData,
  syncToSupabase
} from '../lib/electrical-data-manager.js';

import {
  formatReportData,
  generateExcelReport,
  generatePDFReport,
  generateSLFReportIntegration
} from '../lib/electrical-report-generator.js';

import {
  MEASUREMENT_POINT_TYPES,
  PUIL_DATABASE,
  THERMAL_GRADES,
  DEFAULT_PANEL_STRUCTURE
} from '../lib/electrical-constants.js';

// ============================================================
// PAGE STATE
// ============================================================

let currentProjectId = null;
let currentProjectName = '';
let panels = [];
let selectedPanel = null;
let currentTab = 'dashboard';
let analysisResults = {};

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export async function electricalInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');
  
  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }
  
  // Initialize database
  await initDatabase();
  
  // Load project info
  await loadProjectInfo();
  
  // Load panels
  await loadPanels();
  
  return renderPage();
}

export function afterElectricalInspectionRender() {
  initEventListeners();
  initDataImportListeners();
  initThermalUploadListeners();
  renderDashboard();
  
  if (panels.length > 0 && !selectedPanel) {
    selectPanel(panels[0].id);
  }
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadProjectInfo() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, location')
      .eq('id', currentProjectId)
      .single();
    
    if (data) {
      currentProjectName = data.name;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadPanels() {
  panels = await getPanelsByProject(currentProjectId);
  
  // Load measurements for each panel
  for (let panel of panels) {
    panel.measurements = await getMeasurements(panel.id, { limit: 100 });
    panel.thermalImages = await getThermalImages(panel.id);
  }
}

// ============================================================
// PAGE RENDERING
// ============================================================

function renderPage() {
  return `
    <div id="electrical-inspection-page" style="padding: var(--space-6); max-width: 1400px; margin: 0 auto;">
      ${renderHeaderCard()}
      ${renderNavigationTabs()}
      <div id="electrical-content" class="electrical-content">
        ${renderDashboardTab()}
      </div>
      ${renderModals()}
    </div>
    
    <style>
      ${getElectricalStyles()}
    </style>
  `;
}

function renderHeaderCard() {
  return `
    <div class="card-quartz" id="electrical-main-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-bolt" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--brand-400);">PHASE 02C</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Pemeriksaan Sistem Kelistrikan</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); border: 1px solid hsla(220, 95%, 52%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>PUIL 2020
          </span>
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${currentProjectId}'})" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi sistem kelistrikan berdasarkan PUIL 2020, SNI 0225:2011, IEC 60364. Meliputi analisis pembebanan, thermal imaging, proteksi, dan compliance check.
      </p>

      <!-- Presidential Tab Navigation (matching struktur-bangunan-module.js) -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchElectricalTab('dashboard', this)" 
                class="electrical-tab-item active"
                data-tab="dashboard"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-chart-pie"></i> DASHBOARD
        </button>
        <button onclick="window._switchElectricalTab('panels', this)" 
                class="electrical-tab-item"
                data-tab="panels"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-bolt"></i> PANEL
        </button>
        <button onclick="window._switchElectricalTab('measurements', this)" 
                class="electrical-tab-item"
                data-tab="measurements"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-ruler"></i> PENGUKURAN
        </button>
        <button onclick="window._switchElectricalTab('thermal', this)" 
                class="electrical-tab-item"
                data-tab="thermal"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-temperature-high"></i> THERMAL
        </button>
        <button onclick="window._switchElectricalTab('protection', this)" 
                class="electrical-tab-item"
                data-tab="protection"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-shield-alt"></i> PROTEKSI
        </button>
        <button onclick="window._switchElectricalTab('analysis', this)" 
                class="electrical-tab-item"
                data-tab="analysis"
                style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-microscope"></i> ANALISIS
        </button>
      </div>
    </div>
  `;
}

function renderNavigationTabs() {
  return '';
}

function renderDashboardTab() {
  const totalPanels = panels.length;
  const safePanels = panels.filter(p => {
    const loading = p.measurements?.[0]?.current / p.mcbRating * 100;
    return loading < 80;
  }).length;
  const warningPanels = panels.filter(p => {
    const loading = p.measurements?.[0]?.current / p.mcbRating * 100;
    return loading >= 80 && loading <= 100;
  }).length;
  const overloadPanels = panels.filter(p => {
    const loading = p.measurements?.[0]?.current / p.mcbRating * 100;
    return loading > 100;
  }).length;
  
  const totalMeasurements = panels.reduce((sum, p) => sum + (p.measurements?.length || 0), 0);
  const totalThermal = panels.reduce((sum, p) => sum + (p.thermalImages?.length || 0), 0);
  
  const inspectionProgress = totalPanels > 0 ? Math.round((totalMeasurements / (totalPanels * 3)) * 100) : 0;
  
  return `
    <!-- TAB CONTENT: DASHBOARD -->
    <div id="electrical-tab-dashboard" class="electrical-tab-content active">
      <!-- Stats Grid -->
      <div class="grid-3-col" style="gap: 16px; margin-bottom: 24px;">
        <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 95%, 52%, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
              <i class="fas fa-bolt"></i>
            </div>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">PANEL</span>
          </div>
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px; font-size: 2rem;">${totalPanels}</h4>
          <p style="font-size: 0.75rem; color: var(--text-tertiary);">Total Panel Terdaftar</p>
        </div>
        
        <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(160, 100%, 45%, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
              <i class="fas fa-check-circle"></i>
            </div>
            <span class="badge" style="background: hsla(160, 100%, 45%, 0.1); color: var(--success-400); font-size: 9px;">SAFE</span>
          </div>
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px; font-size: 2rem;">${safePanels}</h4>
          <p style="font-size: 0.75rem; color: var(--text-tertiary);">Panel Loading Normal (&lt;80%)</p>
        </div>
        
        <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(45, 90%, 60%, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--warning-400);">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--warning-400); font-size: 9px;">WARNING</span>
          </div>
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px; font-size: 2rem;">${warningPanels}</h4>
          <p style="font-size: 0.75rem; color: var(--text-tertiary);">Panel Warning (80-100%)</p>
        </div>
        
        <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(0, 85%, 60%, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
              <i class="fas fa-times-circle"></i>
            </div>
            <span class="badge" style="background: hsla(0, 85%, 60%, 0.1); color: var(--danger-400); font-size: 9px;">CRITICAL</span>
          </div>
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px; font-size: 2rem;">${overloadPanels}</h4>
          <p style="font-size: 0.75rem; color: var(--text-tertiary);">Panel Overload (&gt;100%)</p>
        </div>
        
        <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(280, 95%, 52%, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(280, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: #a855f7;">
              <i class="fas fa-ruler"></i>
            </div>
            <span class="badge" style="background: hsla(280, 95%, 52%, 0.1); color: #a855f7; font-size: 9px;">MEASUREMENT</span>
          </div>
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px; font-size: 2rem;">${totalMeasurements}</h4>
          <p style="font-size: 0.75rem; color: var(--text-tertiary);">Total Pengukuran</p>
        </div>
        
        <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(20, 95%, 52%, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(20, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: #f97316;">
              <i class="fas fa-thermometer-half"></i>
            </div>
            <span class="badge" style="background: hsla(20, 95%, 52%, 0.1); color: #f97316; font-size: 9px;">THERMAL</span>
          </div>
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px; font-size: 2rem;">${totalThermal}</h4>
          <p style="font-size: 0.75rem; color: var(--text-tertiary);">Thermal Images</p>
        </div>
      </div>
      
      <!-- Main Content Grid -->
      <div class="grid-2-col" style="gap: 20px;">
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 16px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-bolt" style="margin-right: 8px; color: var(--brand-400);"></i>Status Panel
            </h4>
            <button class="btn btn-primary btn-xs" onclick="showPanelModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
          <div class="panel-list" style="display: flex; flex-direction: column; gap: 12px;">
            ${panels.length === 0 ? 
              '<p class="empty-state" style="text-align: center; padding: 40px; color: var(--text-tertiary);">Belum ada panel. Klik "Tambah Panel" untuk memulai.</p>' :
              panels.map(p => generatePanelStatusCard(p)).join('')
            }
          </div>
        </div>
        
        <div class="card-quartz" style="padding: 24px;">
          <div class="flex-between" style="margin-bottom: 16px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin: 0;">
              <i class="fas fa-bolt" style="margin-right: 8px; color: var(--gold-400);"></i>Aksi Cepat
            </h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="card-quartz clickable" onclick="showPanelModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
                <i class="fas fa-plus-circle"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Tambah Panel Baru</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">Registrasi panel MDB/SMDB/DB</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="showMeasurementModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
                <i class="fas fa-ruler-combined"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Input Pengukuran</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">Arus, tegangan, daya, harmonisa</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="showImportModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(280, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: #a855f7;">
                <i class="fas fa-file-import"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Import Data Logger</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">CSV/Excel dari power meter</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="showThermalModal()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(20, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: #f97316;">
                <i class="fas fa-camera"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Upload Thermal Image</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">Analisis hotspot inframerah</div>
              </div>
            </button>
            <button class="card-quartz clickable" onclick="generateFullReport()" style="padding: 16px; text-align: left; display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: white; font-size: 0.9rem;">Generate Laporan</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">PDF/Excel dengan analisis PUIL</div>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Overall Progress -->
      <div class="card-quartz" style="margin-top: 24px; padding: 20px;">
        <div style="margin-bottom: 12px;">
          <div class="flex-between" style="margin-bottom: 8px;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-tertiary);">OVERALL INSPECTION PROGRESS</span>
            <span style="font-size: 0.75rem; font-weight: 800; color: var(--brand-400);">${inspectionProgress}%</span>
          </div>
          <div style="height: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 10px; overflow: hidden;">
            <div style="width: ${inspectionProgress}%; height: 100%; border-radius: 10px; background: linear-gradient(90deg, var(--brand-500), var(--success-500)); box-shadow: 0 0 15px var(--brand-500); transition: width 0.5s ease;"></div>
          </div>
        </div>
        <p style="font-size: 0.7rem; color: var(--text-tertiary); margin: 0;">
          Progress dihitung berdasarkan jumlah pengukuran yang telah dilakukan dibandingkan target 3 pengukuran per panel (load analysis, thermal, harmonisa).
        </p>
      </div>
    </div>
  `;
}

function renderRecentActivity() {
  const activities = [];
  
  panels.forEach(p => {
    if (p.measurements?.length > 0) {
      const latest = p.measurements[p.measurements.length - 1];
      activities.push({
        type: 'measurement',
        panel: p.name,
        time: latest.timestamp,
        description: `Pengukuran: ${latest.current?.toFixed(2)}A`
      });
    }
    if (p.thermalImages?.length > 0) {
      const latest = p.thermalImages[p.thermalImages.length - 1];
      activities.push({
        type: 'thermal',
        panel: p.name,
        time: latest.timestamp,
        description: `Thermal: ${latest.tempMax?.toFixed(1)}°C`
      });
    }
  });
  
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  if (activities.length === 0) {
    return '<p class="empty-state">Belum ada aktivitas</p>';
  }
  
  return activities.slice(0, 10).map(a => `
    <div class="activity-item">
      <div class="activity-icon ${a.type}">
        <i class="fas ${a.type === 'measurement' ? 'fa-ruler' : 'fa-temperature-high'}"></i>
      </div>
      <div class="activity-info">
        <span class="activity-panel">${escapeHtml(a.panel)}</span>
        <span class="activity-desc">${a.description}</span>
        <span class="activity-time">${new Date(a.time).toLocaleString('id-ID')}</span>
      </div>
    </div>
  `).join('');
}

function renderModals() {
  return `
    <!-- Panel Modal -->
    <div id="panel-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-bolt"></i> <span id="panel-modal-title">Tambah Panel Baru</span></h3>
          <button class="modal-close" onclick="closeModal('panel-modal')">&times;</button>
        </div>
        <form id="panel-form" onsubmit="savePanel(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Nama Panel *</label>
              <input type="text" name="name" required placeholder="e.g., Panel MDP Lantai 1">
            </div>
            <div class="form-group">
              <label>Lokasi</label>
              <input type="text" name="location" placeholder="e.g., Ruang Panel Lt.1">
            </div>
            <div class="form-group">
              <label>Tipe Panel *</label>
              <select name="type" required>
                <option value="MAIN">Panel Utama (Main)</option>
                <option value="DISTRIBUTION">Panel Distribusi</option>
                <option value="SUB">Sub Panel</option>
                <option value="MDB">Main Distribution Board (MDB)</option>
                <option value="SMDB">Sub Main Distribution Board (SMDB)</option>
                <option value="DB">Distribution Board (DB)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tegangan (V)</label>
              <select name="voltage">
                <option value="380">380V (3-Phase)</option>
                <option value="220">220V (1-Phase)</option>
                <option value="400">400V (3-Phase)</option>
                <option value="415">415V (3-Phase)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Rating MCB/MCCB (A) *</label>
              <input type="number" name="mcbRating" required min="1" max="5000" placeholder="100">
            </div>
            <div class="form-group">
              <label>Tipe MCB</label>
              <select name="mcbType">
                <option value="MCB">MCB</option>
                <option value="MCCB">MCCB</option>
                <option value="ACB">ACB</option>
                <option value="RCBO">RCBO</option>
              </select>
            </div>
            <div class="form-group">
              <label>Rating Busbar (A)</label>
              <input type="number" name="busbarRating" min="1" max="10000" placeholder="200">
            </div>
            <div class="form-group">
              <label>Ukuran Kabel (mm²)</label>
              <select name="cableSize">
                <option value="">Pilih ukuran</option>
                <option value="1.5">1.5 mm²</option>
                <option value="2.5">2.5 mm²</option>
                <option value="4">4 mm²</option>
                <option value="6">6 mm²</option>
                <option value="10">10 mm²</option>
                <option value="16">16 mm²</option>
                <option value="25">25 mm²</option>
                <option value="35">35 mm²</option>
                <option value="50">50 mm²</option>
                <option value="70">70 mm²</option>
                <option value="95">95 mm²</option>
                <option value="120">120 mm²</option>
                <option value="150">150 mm²</option>
                <option value="185">185 mm²</option>
                <option value="240">240 mm²</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tipe Kabel</label>
              <select name="cableType">
                <option value="XLPE_TRAY">XLPE - Cable Tray</option>
                <option value="PVC_TRAY">PVC - Cable Tray</option>
                <option value="PVC_CONDUIT">PVC - Conduit</option>
                <option value="XLPE_DUCT">XLPE - Underground Duct</option>
                <option value="NYY">NYY</option>
                <option value="NYM">NYM</option>
                <option value="NYFGbY">NYFGbY</option>
              </select>
            </div>
            <div class="form-group">
              <label>Panjang Kabel (meter)</label>
              <input type="number" name="cableLength" min="0" step="0.1" placeholder="0">
            </div>
            <div class="form-group">
              <label>Suhu Lingkungan (°C)</label>
              <input type="number" name="ambientTemp" min="0" max="80" value="30">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('panel-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan Panel</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Measurement Modal -->
    <div id="measurement-modal" class="modal" style="display: none;">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3><i class="fas fa-ruler"></i> Input Data Pengukuran</h3>
          <button class="modal-close" onclick="closeModal('measurement-modal')">&times;</button>
        </div>
        <form id="measurement-form" onsubmit="saveMeasurement(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Panel *</label>
              <select name="panelId" id="measurement-panel-select" required>
                <option value="">Pilih Panel</option>
                ${panels.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Titik Pengukuran *</label>
              <select name="measurementPoint" required>
                ${MEASUREMENT_POINT_TYPES.map(t => `
                  <option value="${t.id}">${t.label} (${t.phase})</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Waktu Pengukuran</label>
              <input type="datetime-local" name="timestamp" id="measurement-timestamp">
            </div>
          </div>
          
          <h4 class="form-section-title">Pengukuran 3-Phase</h4>
          <div class="form-grid phase-inputs">
            <div class="form-group phase-r">
              <label>Arus Phase R (A)</label>
              <input type="number" name="currentR" step="0.01" min="0" placeholder="0">
            </div>
            <div class="form-group phase-s">
              <label>Arus Phase S (A)</label>
              <input type="number" name="currentS" step="0.01" min="0" placeholder="0">
            </div>
            <div class="form-group phase-t">
              <label>Arus Phase T (A)</label>
              <input type="number" name="currentT" step="0.01" min="0" placeholder="0">
            </div>
            <div class="form-group">
              <label>Tegangan Phase-Phase (V)</label>
              <input type="number" name="voltage" step="0.1" min="0" placeholder="380">
            </div>
            <div class="form-group">
              <label>Power Factor (cos φ)</label>
              <input type="number" name="powerFactor" step="0.01" min="0" max="1" value="0.85">
            </div>
            <div class="form-group">
              <label>Frekuensi (Hz)</label>
              <input type="number" name="frequency" step="0.1" value="50">
            </div>
          </div>
          
          <h4 class="form-section-title">Data Thermal & Lainnya</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>Suhu Komponen (°C)</label>
              <input type="number" name="temperature" step="0.1" placeholder="e.g., 45">
            </div>
            <div class="form-group">
              <label>THD Arus (%)</label>
              <input type="number" name="thd" step="0.1" min="0" max="100" placeholder="e.g., 5.2">
            </div>
            <div class="form-group">
              <label>Lokasi Pengukuran</label>
              <input type="text" name="location" placeholder="Detail lokasi pengukuran">
            </div>
            <div class="form-group">
              <label>Catatan</label>
              <textarea name="notes" rows="2" placeholder="Catatan tambahan..."></textarea>
            </div>
          </div>
          
          <div class="calculation-preview" id="calculation-preview">
            <h4><i class="fas fa-calculator"></i> Preview Perhitungan</h4>
            <div id="calculation-results">Isi data untuk melihat preview...</div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('measurement-modal')">Batal</button>
            <button type="button" class="btn-calculate" onclick="previewCalculation()">Hitung</button>
            <button type="submit" class="btn-primary">Simpan Pengukuran</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Import Modal -->
    <div id="import-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-file-import"></i> Import Data Logger</h3>
          <button class="modal-close" onclick="closeModal('import-modal')">&times;</button>
        </div>
        <div class="import-section">
          <div class="form-group">
            <label>Pilih Panel Target</label>
            <select id="import-panel-select">
              <option value="">Pilih Panel</option>
              ${panels.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="file-drop-zone" id="import-drop-zone">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drag & drop file CSV/Excel di sini</p>
            <p class="text-muted">atau klik untuk memilih file</p>
            <input type="file" id="import-file-input" accept=".csv,.xlsx,.xls" multiple hidden>
          </div>
          <div id="import-preview" class="import-preview" style="display: none;">
            <h4>Preview Data</h4>
            <div id="import-preview-content"></div>
          </div>
          <div id="import-progress" class="import-progress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill" id="import-progress-fill"></div>
            </div>
            <span id="import-progress-text">Processing...</span>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeModal('import-modal')">Batal</button>
          <button type="button" class="btn-primary" id="btn-confirm-import" onclick="confirmImport()" disabled>
            Import Data
          </button>
        </div>
      </div>
    </div>
    
    <!-- Thermal Modal -->
    <div id="thermal-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-camera"></i> Upload Thermal Image</h3>
          <button class="modal-close" onclick="closeModal('thermal-modal')">&times;</button>
        </div>
        <form id="thermal-form" onsubmit="saveThermalImage(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Panel *</label>
              <select name="panelId" id="thermal-panel-select" required>
                <option value="">Pilih Panel</option>
                ${panels.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Komponen *</label>
              <select name="component" required>
                <option value="KWH_Meter">KWH Meter</option>
                <option value="MCB_Main">MCB Utama</option>
                <option value="MCB_Branch">MCB Cabang</option>
                <option value="Busbar">Busbar</option>
                <option value="Kabel">Kabel/Conductor</option>
                <option value="Terminal">Terminal Block</option>
                <option value="Contactor">Contactor</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div class="form-group">
              <label>Suhu Maksimum (°C) *</label>
              <input type="number" name="tempMax" step="0.1" min="-20" max="200" required>
            </div>
            <div class="form-group">
              <label>Suhu Minimum (°C)</label>
              <input type="number" name="tempMin" step="0.1" min="-20" max="200">
            </div>
            <div class="form-group">
              <label>Suhu Rata-rata (°C)</label>
              <input type="number" name="tempAvg" step="0.1" min="-20" max="200">
            </div>
          </div>
          <div class="file-upload">
            <label class="file-upload-label">
              <input type="file" name="thermalFile" accept="image/*" id="thermal-file-input">
              <span class="file-upload-text"><i class="fas fa-image"></i> Pilih Gambar Thermal</span>
            </label>
            <div id="thermal-image-preview" class="image-preview"></div>
          </div>
          <div class="form-group">
            <label>Catatan</label>
            <textarea name="notes" rows="3" placeholder="Deskripsi kondisi, lokasi hotspot, dll..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('thermal-modal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan Thermal Data</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Simulation Modal -->
    <div id="simulation-modal" class="modal" style="display: none;">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3><i class="fas fa-calculator"></i> Simulasi "What-If"</h3>
          <button class="modal-close" onclick="closeModal('simulation-modal')">&times;</button>
        </div>
        <div class="simulation-tabs">
          <button class="sim-tab active" onclick="switchSimTab('mcb')">MCB Upgrade</button>
          <button class="sim-tab" onclick="switchSimTab('load')">Load Transfer</button>
          <button class="sim-tab" onclick="switchSimTab('cable')">Cable Sizing</button>
        </div>
        <div class="simulation-content" id="simulation-content">
          ${renderMCBSimulation()}
        </div>
      </div>
    </div>
  `;
}

function renderMCBSimulation() {
  return `
    <div class="simulation-panel">
      <div class="form-grid">
        <div class="form-group">
          <label>Pilih Panel</label>
          <select id="sim-panel-select" onchange="updateSimPanel()">
            <option value="">Pilih Panel</option>
            ${panels.map(p => `
              <option value="${p.id}" data-rating="${p.mcbRating}" data-current="${p.measurements?.[0]?.current || 0}">
                ${escapeHtml(p.name)} - ${p.mcbRating}A
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Arus Terukur (A)</label>
          <input type="number" id="sim-current" readonly>
        </div>
        <div class="form-group">
          <label>MCB Rating Saat Ini (A)</label>
          <input type="number" id="sim-current-rating" readonly>
        </div>
        <div class="form-group">
          <label>MCB Rating Baru (A)</label>
          <select id="sim-new-rating">
            <option value="16">16 A</option>
            <option value="20">20 A</option>
            <option value="25">25 A</option>
            <option value="32">32 A</option>
            <option value="40">40 A</option>
            <option value="50">50 A</option>
            <option value="63">63 A</option>
            <option value="80">80 A</option>
            <option value="100">100 A</option>
            <option value="125">125 A</option>
            <option value="160">160 A</option>
            <option value="200">200 A</option>
            <option value="250">250 A</option>
            <option value="300">300 A</option>
            <option value="400">400 A</option>
            <option value="500">500 A</option>
            <option value="630">630 A</option>
          </select>
        </div>
      </div>
      <button class="btn-primary" onclick="runMCBSimulation()">
        <i class="fas fa-play"></i> Jalankan Simulasi
      </button>
      <div id="simulation-result" class="simulation-result"></div>
    </div>
  `;
}

// ============================================================
// STYLES
// ============================================================

function getElectricalStyles() {
  return `
    .electrical-page {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .electrical-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.1));
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .btn-back {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
      background: rgba(255,255,255,0.05);
      color: var(--text-primary, #fff);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-back:hover {
      background: rgba(255,255,255,0.1);
    }
    
    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary, #fff);
    }
    
    .header-title .project-name {
      font-size: 0.875rem;
      color: var(--text-secondary, #9ca3af);
      margin: 4px 0 0 0;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .header-actions button {
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    
    .btn-import { background: #3b82f6; color: white; }
    .btn-add-panel { background: #22c55e; color: white; }
    .btn-generate-report { background: #ef4444; color: white; }
    .btn-backup { background: #6b7280; color: white; }
    
    .electrical-nav {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      padding: 4px;
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      overflow-x: auto;
    }
    
    .nav-tab {
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #9ca3af);
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      transition: all 0.2s;
    }
    
    .nav-tab:hover { color: var(--text-primary, #fff); }
    .nav-tab.active { 
      background: var(--brand-500, #3b82f6); 
      color: white; 
    }
    
    .electrical-content {
      min-height: 500px;
    }
    
    /* Dashboard Styles */
    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary, #fff);
    }
    
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary, #9ca3af);
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    
    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }
    
    .dashboard-panel {
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
    }
    
    .dashboard-panel h3 {
      margin: 0 0 16px 0;
      font-size: 1rem;
      color: var(--text-primary, #fff);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .panel-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .panel-card {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 4px solid transparent;
    }
    
    .panel-card:hover { 
      background: rgba(255,255,255,0.08);
      transform: translateX(4px);
    }
    
    .panel-card.normal { border-left-color: #22c55e; }
    .panel-card.warning { border-left-color: #eab308; }
    .panel-card.critical { border-left-color: #ef4444; }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .panel-name {
      font-weight: 600;
      color: var(--text-primary, #fff);
      margin: 0;
    }
    
    .panel-location {
      font-size: 0.75rem;
      color: var(--text-secondary, #9ca3af);
      margin: 4px 0 0 0;
    }
    
    .panel-metrics {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .metric {
      display: flex;
      flex-direction: column;
    }
    
    .metric-value {
      font-weight: 700;
      color: var(--text-primary, #fff);
    }
    
    .metric-label {
      font-size: 0.7rem;
      color: var(--text-secondary, #9ca3af);
    }
    
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .activity-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    
    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }
    
    .activity-icon.measurement { background: #8b5cf620; color: #8b5cf6; }
    .activity-icon.thermal { background: #f9731620; color: #f97316; }
    
    .activity-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    
    .activity-panel {
      font-weight: 600;
      color: var(--text-primary, #fff);
    }
    
    .activity-desc {
      font-size: 0.75rem;
      color: var(--text-secondary, #9ca3af);
    }
    
    .activity-time {
      font-size: 0.7rem;
      color: var(--text-tertiary, #6b7280);
    }
    
    .dashboard-quick-actions {
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
    }
    
    .dashboard-quick-actions h3 {
      margin: 0 0 16px 0;
      font-size: 1rem;
      color: var(--text-primary, #fff);
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }
    
    .quick-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
      border-radius: 10px;
      color: var(--text-primary, #fff);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .quick-action-btn:hover {
      background: rgba(255,255,255,0.1);
      transform: translateY(-2px);
    }
    
    .quick-action-btn i {
      font-size: 1.5rem;
      color: var(--brand-400, #60a5fa);
    }
    
    .quick-action-btn span {
      font-size: 0.75rem;
      text-align: center;
    }
    
    /* Modal Styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .modal-content {
      background: #1e293b;
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .modal-content.modal-large {
      max-width: 900px;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .modal-header h3 {
      margin: 0;
      font-size: 1.125rem;
      color: white;
    }
    
    .modal-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: rgba(255,255,255,0.1);
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .modal-close:hover { background: rgba(255,255,255,0.2); }
    
    .modal form { padding: 24px; }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .form-group label {
      font-size: 0.875rem;
      color: var(--text-secondary, #9ca3af);
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 10px 12px;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: white;
      font-size: 0.875rem;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }
    
    .form-section-title {
      margin: 24px 0 16px 0;
      font-size: 1rem;
      color: white;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 8px;
    }
    
    .phase-inputs .phase-r input { border-color: #ef4444; }
    .phase-inputs .phase-s input { border-color: #eab308; }
    .phase-inputs .phase-t input { border-color: #3b82f6; }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .btn-secondary {
      padding: 10px 20px;
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
    }
    
    .btn-primary {
      padding: 10px 20px;
      background: #3b82f6;
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
    }
    
    .btn-calculate {
      padding: 10px 20px;
      background: #22c55e;
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
    }
    
    .file-drop-zone {
      border: 2px dashed rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      color: var(--text-secondary, #9ca3af);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .file-drop-zone:hover {
      border-color: #3b82f6;
      background: rgba(59,130,246,0.1);
    }
    
    .file-drop-zone i {
      font-size: 3rem;
      margin-bottom: 12px;
    }
    
    .empty-state {
      text-align: center;
      color: var(--text-secondary, #9ca3af);
      padding: 40px;
    }
    
    .calculation-preview {
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 10px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .calculation-preview h4 {
      margin: 0 0 12px 0;
      color: #22c55e;
    }
    
    .simulation-tabs {
      display: flex;
      gap: 8px;
      padding: 0 24px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .sim-tab {
      padding: 12px 20px;
      background: transparent;
      border: none;
      color: var(--text-secondary, #9ca3af);
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    
    .sim-tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }
    
    .simulation-content {
      padding: 24px;
    }
    
    .simulation-result {
      margin-top: 20px;
      padding: 16px;
      background: rgba(59,130,246,0.1);
      border-radius: 10px;
      border: 1px solid rgba(59,130,246,0.2);
    }
    
    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }
    
    .progress-fill {
      height: 100%;
      background: #3b82f6;
      transition: width 0.3s;
    }
  `;
}

// Helper function
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Make functions available globally
window.switchTab = switchTab;
window._switchElectricalTab = _switchElectricalTab;
window.showPanelModal = showPanelModal;
window.showMeasurementModal = showMeasurementModal;
window.showImportModal = showImportModal;
window.showThermalModal = showThermalModal;
window.closeModal = closeModal;
window.savePanel = savePanel;
window.saveMeasurement = saveMeasurement;
window.saveThermalImage = saveThermalImage;
window.previewCalculation = previewCalculation;
window.selectPanel = selectPanel;
window.generateFullReport = generateFullReport;
window.backupProjectData = backupProjectData;
window.confirmImport = confirmImport;
window.runMCBSimulation = runMCBSimulation;
window.switchSimTab = switchSimTab;
window.updateSimPanel = updateSimPanel;

// ============================================================
// EVENT HANDLERS & FUNCTIONS
// ============================================================

function initEventListeners() {
  // Tab switching handled by onclick
  
  // Set default timestamp for measurement form
  const timestampInput = document.getElementById('measurement-timestamp');
  if (timestampInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    timestampInput.value = now.toISOString().slice(0, 16);
  }
}

function initDataImportListeners() {
  const dropZone = document.getElementById('import-drop-zone');
  const fileInput = document.getElementById('import-file-input');
  
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      handleImportFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', (e) => {
      handleImportFiles(e.target.files);
    });
  }
}

function initThermalUploadListeners() {
  const thermalInput = document.getElementById('thermal-file-input');
  const preview = document.getElementById('thermal-image-preview');
  
  if (thermalInput && preview) {
    thermalInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          preview.innerHTML = `<img src="${event.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// ============================================================
// TAB SWITCHING
// ============================================================

function _switchElectricalTab(tabId, btn) {
  // Update tab buttons
  document.querySelectorAll('.electrical-tab-item').forEach(tab => {
    tab.classList.remove('active');
    tab.style.background = 'transparent';
    tab.style.color = 'var(--text-tertiary)';
    tab.style.boxShadow = 'none';
  });
  
  btn.classList.add('active');
  btn.style.background = 'var(--gradient-brand)';
  btn.style.color = 'white';
  btn.style.boxShadow = 'var(--shadow-sapphire)';
  
  // Update content visibility
  document.querySelectorAll('.electrical-tab-content').forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none';
  });
  
  const selectedContent = document.getElementById('electrical-tab-' + tabId);
  if (selectedContent) {
    selectedContent.classList.add('active');
    selectedContent.style.display = 'block';
  }
  
  // Update currentTab state
  currentTab = tabId;
  
  // Render tab-specific content
  const content = document.getElementById('electrical-content');
  switch(tabId) {
    case 'dashboard':
      if (content) content.innerHTML = renderDashboardTab();
      break;
    case 'panels':
      if (content) content.innerHTML = renderPanelsList();
      break;
    case 'measurements':
      if (content) content.innerHTML = renderMeasurementsTab();
      break;
    case 'analysis':
      if (content) content.innerHTML = renderAnalysisTab();
      break;
    case 'thermal':
      if (content) content.innerHTML = renderThermalTab();
      break;
    case 'protection':
      if (content) content.innerHTML = renderProtectionTab();
      break;
  }
}

function switchTab(tabId) {
  currentTab = tabId;
  
  // Update nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  
  // Update content
  const content = document.getElementById('electrical-content');
  switch(tabId) {
    case 'dashboard':
      content.innerHTML = renderDashboard();
      break;
    case 'panels':
      content.innerHTML = renderPanelsList();
      break;
    case 'measurements':
      content.innerHTML = renderMeasurementsTab();
      break;
    case 'analysis':
      content.innerHTML = renderAnalysisTab();
      break;
    case 'thermal':
      content.innerHTML = renderThermalTab();
      break;
    case 'protection':
      content.innerHTML = renderProtectionTab();
      break;
    case 'compliance':
      content.innerHTML = renderComplianceTab();
      break;
    case 'simulation':
      content.innerHTML = renderSimulationTab();
      break;
    case 'reports':
      content.innerHTML = renderReportsTab();
      break;
  }
}

// ============================================================
// MODAL FUNCTIONS
// ============================================================

function showPanelModal() {
  const modal = document.getElementById('panel-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('panel-modal-title').textContent = 'Tambah Panel Baru';
    document.getElementById('panel-form').reset();
  }
}

function showMeasurementModal() {
  const modal = document.getElementById('measurement-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Update panel select options
    const select = document.getElementById('measurement-panel-select');
    if (select) {
      select.innerHTML = '<option value="">Pilih Panel</option>' +
        panels.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }
  }
}

function showImportModal() {
  const modal = document.getElementById('import-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Update panel select
    const select = document.getElementById('import-panel-select');
    if (select) {
      select.innerHTML = '<option value="">Pilih Panel</option>' +
        panels.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }
  }
}

function showThermalModal() {
  const modal = document.getElementById('thermal-modal');
  if (modal) {
    modal.style.display = 'flex';
    const select = document.getElementById('thermal-panel-select');
    if (select) {
      select.innerHTML = '<option value="">Pilih Panel</option>' +
        panels.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// ============================================================
// PANEL MANAGEMENT
// ============================================================

async function savePanel(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const panelData = {
    projectId: currentProjectId,
    name: formData.get('name'),
    location: formData.get('location'),
    type: formData.get('type'),
    voltage: parseInt(formData.get('voltage')) || 380,
    mcbRating: parseInt(formData.get('mcbRating')) || 100,
    mcbType: formData.get('mcbType') || 'MCB',
    busbarRating: parseInt(formData.get('busbarRating')) || 200,
    cableSize: formData.get('cableSize') || '',
    cableType: formData.get('cableType') || 'XLPE_TRAY',
    cableLength: parseFloat(formData.get('cableLength')) || 0,
    ambientTemp: parseInt(formData.get('ambientTemp')) || 30
  };
  
  try {
    await createPanel(panelData);
    showSuccess('Panel berhasil ditambahkan');
    closeModal('panel-modal');
    await loadPanels();
    renderDashboard();
  } catch (error) {
    showError('Gagal menyimpan panel: ' + error.message);
  }
}

async function selectPanel(panelId) {
  selectedPanel = await getPanel(panelId);
  // Update UI to show selected panel
  document.querySelectorAll('.panel-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.panelId === panelId);
  });
}

// ============================================================
// MEASUREMENT MANAGEMENT
// ============================================================

async function saveMeasurement(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const panelId = parseInt(formData.get('panelId'));
  const currentR = parseFloat(formData.get('currentR')) || 0;
  const currentS = parseFloat(formData.get('currentS')) || 0;
  const currentT = parseFloat(formData.get('currentT')) || 0;
  const avgCurrent = (currentR + currentS + currentT) / 3;
  
  const measurementData = {
    panelId: panelId,
    timestamp: formData.get('timestamp') || new Date().toISOString(),
    location: formData.get('location') || '',
    measurementPoint: formData.get('measurementPoint'),
    phase: '3-Phase',
    current_R: currentR,
    current_S: currentS,
    current_T: currentT,
    current: avgCurrent,
    voltage: parseFloat(formData.get('voltage')) || 380,
    powerFactor: parseFloat(formData.get('powerFactor')) || 0.85,
    frequency: parseFloat(formData.get('frequency')) || 50,
    temperature: parseFloat(formData.get('temperature')) || null,
    thd: parseFloat(formData.get('thd')) || null,
    notes: formData.get('notes') || ''
  };
  
  // Calculate power
  const powerCalc = calculatePower({
    voltage: measurementData.voltage,
    current: avgCurrent,
    powerFactor: measurementData.powerFactor,
    phases: 3
  });
  
  measurementData.power = powerCalc.activePower;
  measurementData.apparentPower = powerCalc.apparentPower;
  measurementData.reactivePower = powerCalc.reactivePower;
  
  // Get panel for loading calculation
  const panel = panels.find(p => p.id === panelId);
  if (panel) {
    const loading = calculateActualLoading(avgCurrent, panel.ambientTemp || 30, panel.mcbRating);
    measurementData.loadingPercentage = loading.loadingRaw;
    measurementData.loadingStatus = loading.status;
  }
  
  try {
    await addMeasurement(panelId, measurementData);
    showSuccess('Pengukuran berhasil disimpan');
    closeModal('measurement-modal');
    await loadPanels();
    switchTab('measurements');
  } catch (error) {
    showError('Gagal menyimpan pengukuran: ' + error.message);
  }
}

function previewCalculation() {
  const form = document.getElementById('measurement-form');
  const formData = new FormData(form);
  
  const currentR = parseFloat(formData.get('currentR')) || 0;
  const currentS = parseFloat(formData.get('currentS')) || 0;
  const currentT = parseFloat(formData.get('currentT')) || 0;
  const avgCurrent = (currentR + currentS + currentT) / 3;
  const voltage = parseFloat(formData.get('voltage')) || 380;
  const pf = parseFloat(formData.get('powerFactor')) || 0.85;
  
  const powerCalc = calculatePower({
    voltage: voltage,
    current: avgCurrent,
    powerFactor: pf,
    phases: 3
  });
  
  // Calculate imbalance
  const imbalance = calculatePhaseImbalance({ R: currentR, S: currentS, T: currentT });
  
  const resultDiv = document.getElementById('calculation-results');
  resultDiv.innerHTML = `
    <div class="calc-results-grid">
      <div class="calc-item">
        <span class="calc-label">Daya Aktif:</span>
        <span class="calc-value">${powerCalc.activePowerKW} kW</span>
      </div>
      <div class="calc-item">
        <span class="calc-label">Daya Semu:</span>
        <span class="calc-value">${powerCalc.apparentPowerKVA} kVA</span>
      </div>
      <div class="calc-item">
        <span class="calc-label">Arus Rata-rata:</span>
        <span class="calc-value">${avgCurrent.toFixed(2)} A</span>
      </div>
      <div class="calc-item">
        <span class="calc-label">Imbalance:</span>
        <span class="calc-value ${imbalance.isCritical ? 'text-red' : 'text-green'}">${imbalance.imbalance}%</span>
      </div>
    </div>
  `;
}

// ============================================================
// THERMAL MANAGEMENT
// ============================================================

async function saveThermalImage(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const tempMax = parseFloat(formData.get('tempMax'));
  const tempMin = parseFloat(formData.get('tempMin')) || tempMax;
  const tempAvg = parseFloat(formData.get('tempAvg')) || ((tempMax + tempMin) / 2);
  
  // Determine status based on temperature
  let status = 'Normal';
  if (tempMax > 90) status = 'Darurat';
  else if (tempMax > 70) status = 'Kritis';
  else if (tempMax > 45) status = 'Waspada';
  
  const thermalData = {
    panelId: parseInt(formData.get('panelId')),
    component: formData.get('component'),
    tempMax: tempMax,
    tempMin: tempMin,
    tempAvg: tempAvg,
    status: status,
    notes: formData.get('notes') || '',
    timestamp: new Date().toISOString()
  };
  
  // Handle file upload if present
  const file = formData.get('thermalFile');
  if (file && file.size > 0) {
    try {
      const base64 = await fileToBase64(file);
      thermalData.imageData = base64;
      thermalData.fileName = file.name;
    } catch (e) {
      console.error('Error processing image:', e);
    }
  }
  
  try {
    await addThermalImage(thermalData.panelId, thermalData);
    showSuccess('Data thermal berhasil disimpan');
    closeModal('thermal-modal');
    await loadPanels();
    switchTab('thermal');
  } catch (error) {
    showError('Gagal menyimpan data thermal: ' + error.message);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// DATA IMPORT
// ============================================================

let pendingImportData = null;

async function handleImportFiles(files) {
  const panelId = document.getElementById('import-panel-select').value;
  if (!panelId) {
    showError('Pilih panel target terlebih dahulu');
    return;
  }
  
  const progressDiv = document.getElementById('import-progress');
  const previewDiv = document.getElementById('import-preview');
  const confirmBtn = document.getElementById('btn-confirm-import');
  
  progressDiv.style.display = 'block';
  
  try {
    const result = await batchProcessFiles(files, (loaded, total) => {
      const progress = (loaded / total) * 100;
      document.getElementById('import-progress-fill').style.width = progress + '%';
      document.getElementById('import-progress-text').textContent = `Processing ${loaded} of ${total} files...`;
    });
    
    pendingImportData = { panelId: parseInt(panelId), measurements: result.measurements };
    
    // Show preview
    previewDiv.style.display = 'block';
    document.getElementById('import-preview-content').innerHTML = `
      <p><strong>Total Records:</strong> ${result.measurements.length}</p>
      <p><strong>Valid Records:</strong> ${result.stats?.validRows || result.measurements.length}</p>
      <p><strong>Errors:</strong> ${result.errors.length}</p>
      ${result.measurements.length > 0 ? `
        <table class="preview-table">
          <tr><th>Time</th><th>Current (A)</th><th>Voltage (V)</th><th>Temp (°C)</th></tr>
          ${result.measurements.slice(0, 5).map(m => `
            <tr>
              <td>${new Date(m.timestamp).toLocaleString()}</td>
              <td>${m.current?.toFixed(2) || '-'}</td>
              <td>${m.voltage?.toFixed(1) || '-'}</td>
              <td>${m.temperature?.toFixed(1) || '-'}</td>
            </tr>
          `).join('')}
        </table>
        ${result.measurements.length > 5 ? `<p>... and ${result.measurements.length - 5} more records</p>` : ''}
      ` : ''}
    `;
    
    confirmBtn.disabled = result.measurements.length === 0;
    
  } catch (error) {
    showError('Error importing files: ' + error.message);
  } finally {
    progressDiv.style.display = 'none';
  }
}

async function confirmImport() {
  if (!pendingImportData) return;
  
  try {
    const panelId = pendingImportData.panelId;
    const panel = panels.find(p => p.id === panelId);
    
    for (const record of pendingImportData.measurements) {
      const measurement = {
        ...record,
        panelId: panelId,
        location: panel?.location || ''
      };
      
      // Calculate loading if we have current data
      if (measurement.current && panel) {
        const loading = calculateActualLoading(measurement.current, panel.ambientTemp || 30, panel.mcbRating);
        measurement.loadingPercentage = loading.loadingRaw;
        measurement.loadingStatus = loading.status;
      }
      
      await addMeasurement(panelId, measurement);
    }
    
    showSuccess(`${pendingImportData.measurements.length} records imported successfully`);
    closeModal('import-modal');
    pendingImportData = null;
    await loadPanels();
    switchTab('measurements');
  } catch (error) {
    showError('Error saving imported data: ' + error.message);
  }
}

// ============================================================
// SIMULATION
// ============================================================

function updateSimPanel() {
  const select = document.getElementById('sim-panel-select');
  const option = select.options[select.selectedIndex];
  
  if (option && option.value) {
    document.getElementById('sim-current').value = option.dataset.current || 0;
    document.getElementById('sim-current-rating').value = option.dataset.rating || 0;
  }
}

function switchSimTab(tab) {
  document.querySelectorAll('.sim-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const content = document.getElementById('simulation-content');
  if (tab === 'mcb') {
    content.innerHTML = renderMCBSimulation();
  } else if (tab === 'load') {
    content.innerHTML = renderLoadTransferSimulation();
  } else if (tab === 'cable') {
    content.innerHTML = renderCableSimulation();
  }
}

function runMCBSimulation() {
  const current = parseFloat(document.getElementById('sim-current').value) || 0;
  const currentRating = parseFloat(document.getElementById('sim-current-rating').value) || 1;
  const newRating = parseFloat(document.getElementById('sim-new-rating').value) || currentRating;
  
  const result = simulateMCBUpgrade({
    measuredCurrent: current,
    mcbRating: currentRating,
    loading: (current / currentRating * 100).toFixed(2)
  }, newRating);
  
  const resultDiv = document.getElementById('simulation-result');
  resultDiv.innerHTML = `
    <h4>Hasil Simulasi MCB Upgrade</h4>
    <div class="sim-result-grid">
      <div class="sim-item">
        <span class="sim-label">MCB Saat Ini:</span>
        <span class="sim-value">${result.currentRating}A</span>
      </div>
      <div class="sim-item">
        <span class="sim-label">Loading Saat Ini:</span>
        <span class="sim-value ${result.currentStatus === 'OVERLOAD' ? 'text-red' : result.currentStatus === 'WARNING' ? 'text-yellow' : 'text-green'}">${result.currentLoading}%</span>
      </div>
      <div class="sim-item">
        <span class="sim-label">MCB Baru:</span>
        <span class="sim-value">${result.newRating}A</span>
      </div>
      <div class="sim-item">
        <span class="sim-label">Loading Baru:</span>
        <span class="sim-value ${result.newStatus === 'OVERLOAD' ? 'text-red' : result.newStatus === 'WARNING' ? 'text-yellow' : 'text-green'}">${result.newLoading}%</span>
      </div>
      <div class="sim-item">
        <span class="sim-label">Perbaikan:</span>
        <span class="sim-value text-green">${result.improvement.toFixed(1)}%</span>
      </div>
    </div>
    ${result.recommendation ? `<p class="sim-warning"><i class="fas fa-info-circle"></i> ${result.recommendation}</p>` : ''}
  `;
}

function renderLoadTransferSimulation() {
  return `
    <div class="simulation-panel">
      <p class="text-muted">Load transfer simulation content will be rendered here.</p>
      <p>Pilih fasa sumber dan tujuan untuk simulasi pemindahan beban.</p>
    </div>
  `;
}

function renderCableSimulation() {
  return `
    <div class="simulation-panel">
      <p class="text-muted">Cable sizing simulation content will be rendered here.</p>
      <p>Masukkan parameter kabel untuk simulasi voltage drop dan kapasitas.</p>
    </div>
  `;
}

// ============================================================
// REPORT GENERATION
// ============================================================

async function generateFullReport() {
  try {
    showInfo('Generating report...');
    
    // Perform analysis for all panels
    const analysis = await performAnalysis();
    
    // Format report data
    const reportData = formatReportData({
      name: currentProjectName,
      location: ''
    }, panels, analysis);
    
    // Generate Excel report
    generateExcelReport(reportData);
    
    showSuccess('Laporan berhasil di-generate');
  } catch (error) {
    showError('Error generating report: ' + error.message);
  }
}

async function performAnalysis() {
  const analysis = {
    loading: {},
    thermal: {},
    imbalance: {},
    compliance: null,
    recommendations: []
  };
  
  // Analyze each panel
  for (const panel of panels) {
    if (panel.measurements.length > 0) {
      const latest = panel.measurements[panel.measurements.length - 1];
      analysis.loading[panel.id] = calculateActualLoading(
        latest.current,
        panel.ambientTemp || 30,
        panel.mcbRating
      );
    }
    
    if (panel.thermalImages.length > 0) {
      const hotspots = panel.thermalImages.map(t => ({
        temp: t.tempMax,
        component: t.component
      }));
      analysis.thermal[panel.id] = analyzeThermalData(hotspots);
    }
    
    // Calculate imbalance if we have 3-phase data
    const measurementWithPhases = panel.measurements.find(m => m.current_R && m.current_S && m.current_T);
    if (measurementWithPhases) {
      analysis.imbalance[panel.id] = calculatePhaseImbalance({
        R: measurementWithPhases.current_R,
        S: measurementWithPhases.current_S,
        T: measurementWithPhases.current_T
      });
    }
  }
  
  // Generate compliance check
  analysis.compliance = generateComplianceCheck(analysis);
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);
  
  return analysis;
}

// ============================================================
// BACKUP & EXPORT
// ============================================================

async function backupProjectData() {
  try {
    showInfo('Creating backup...');
    await downloadProjectBackup(currentProjectId, currentProjectName);
    showSuccess('Backup berhasil di-download');
  } catch (error) {
    showError('Error creating backup: ' + error.message);
  }
}

// ============================================================
// ADDITIONAL TAB RENDERERS
// ============================================================

function renderPanelsList() {
  return `
    <div class="tab-content panels-tab">
      <div class="section-header">
        <h3>Daftar Panel Listrik</h3>
        <button class="btn-primary" onclick="showPanelModal()">
          <i class="fas fa-plus"></i> Tambah Panel
        </button>
      </div>
      <div class="panels-grid">
        ${panels.length === 0 
          ? '<p class="empty-state">Belum ada panel. Klik "Tambah Panel" untuk memulai.</p>'
          : panels.map(p => generatePanelStatusCard(p)).join('')
        }
      </div>
    </div>
  `;
}

function renderMeasurementsTab() {
  const allMeasurements = panels.flatMap(p => 
    (p.measurements || []).map(m => ({ ...m, panelName: p.name }))
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return `
    <div class="tab-content measurements-tab">
      <div class="section-header">
        <h3>Data Pengukuran</h3>
        <div class="header-actions">
          <button class="btn-import" onclick="showImportModal()">
            <i class="fas fa-file-import"></i> Import
          </button>
          <button class="btn-primary" onclick="showMeasurementModal()">
            <i class="fas fa-plus"></i> Input Manual
          </button>
        </div>
      </div>
      ${generateMeasurementTable(allMeasurements)}
    </div>
  `;
}

function renderAnalysisTab() {
  return `
    <div class="tab-content analysis-tab">
      <h3>Analisis Sistem Kelistrikan</h3>
      <div class="analysis-content">
        <div class="analysis-card">
          <h4>Analisis Loading</h4>
          <p>Pilih panel untuk melihat analisis loading detail.</p>
        </div>
        <div class="analysis-card">
          <h4>Analisis Imbalance Fasa</h4>
          <p>Data imbalance akan ditampilkan setelah ada pengukuran 3-phase.</p>
        </div>
        <div class="analysis-card">
          <h4>Analisis Voltage Drop</h4>
          <p>Perhitungan voltage drop berdasarkan data kabel dan beban.</p>
        </div>
      </div>
    </div>
  `;
}

function renderThermalTab() {
  const allThermal = panels.flatMap(p => 
    (p.thermalImages || []).map(t => ({ ...t, panelName: p.name }))
  );
  
  return `
    <div class="tab-content thermal-tab">
      <div class="section-header">
        <h3>Analisis Thermal</h3>
        <button class="btn-primary" onclick="showThermalModal()">
          <i class="fas fa-camera"></i> Upload Thermal
        </button>
      </div>
      ${allThermal.length === 0 
        ? '<p class="empty-state">Belum ada data thermal. Upload gambar thermal untuk analisis.</p>'
        : generateThermalHeatmap(allThermal.map(t => ({ temp: t.tempMax, component: `${t.panelName} - ${t.component}` })))
      }
    </div>
  `;
}

function renderProtectionTab() {
  return `
    <div class="tab-content protection-tab">
      <h3>Analisis Proteksi & Koordinasi</h3>
      <div class="protection-content">
        <div class="single-line-container">
          <h4>Single Line Diagram</h4>
          ${selectedPanel ? generateSingleLineDiagram(selectedPanel, selectedPanel.measurements || []) : '<p>Pilih panel untuk melihat diagram</p>'}
        </div>
        <div class="protection-analysis">
          <h4>Koordinasi Proteksi</h4>
          <p>Analisis selectivity MCB akan ditampilkan di sini.</p>
        </div>
      </div>
    </div>
  `;
}

function renderComplianceTab() {
  return `
    <div class="tab-content compliance-tab">
      <h3>Compliance Check - PUIL 2020 / SNI / IEC</h3>
      <div class="compliance-content">
        <p>Compliance check akan dilakukan berdasarkan data pengukuran yang tersedia.</p>
        <div class="standards-list">
          ${PUIL_DATABASE.map(p => `
            <div class="standard-item">
              <span class="standard-id">${p.id}</span>
              <span class="standard-title">${p.judul}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSimulationTab() {
  return `
    <div class="tab-content simulation-tab">
      <h3>Simulasi "What-If"</h3>
      <div class="simulation-options">
        <button class="btn-primary" onclick="document.getElementById('simulation-modal').style.display='flex'">
          <i class="fas fa-calculator"></i> Buka Simulator
        </button>
      </div>
    </div>
  `;
}

function renderReportsTab() {
  return `
    <div class="tab-content reports-tab">
      <h3>Laporan Teknis</h3>
      <div class="reports-options">
        <div class="report-card" onclick="generateFullReport()">
          <i class="fas fa-file-excel"></i>
          <span>Generate Excel Report</span>
        </div>
        <div class="report-card" onclick="generateFullReport()">
          <i class="fas fa-file-pdf"></i>
          <span>Generate PDF Report</span>
        </div>
        <div class="report-card" onclick="backupProjectData()">
          <i class="fas fa-download"></i>
          <span>Backup Data Project</span>
        </div>
      </div>
    </div>
  `;
}
