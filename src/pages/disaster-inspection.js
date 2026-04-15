import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// Disaster Module imports
import '../modules/disaster/components/DisasterMap.js';
import '../modules/disaster/components/DisasterSimulator.js';
import '../modules/disaster/components/BuildingVulnerability.js';
import '../modules/disaster/components/MitigationPlanner.js';
import { DisasterService } from '../modules/disaster/services/DisasterService.js';
import { DisasterReportService } from '../modules/disaster/services/DisasterReportService.js';
import { InaRiskConnector } from '../modules/disaster/core/InaRiskConnector.js';
import { VulnerabilityCalculator } from '../modules/disaster/core/VulnerabilityCalculator.js';
import { RiskMatrix } from '../modules/disaster/core/RiskMatrix.js';

// Page state
let currentProjectId = null;
let currentProjectName = '';
let currentTab = 'map';
let disasterData = {
  hazard: null,
  vulnerability: null,
  risk: null,
  mitigations: []
};

const disasterService = new DisasterService();
const reportService = new DisasterReportService();

export async function disasterInspectionPage(params = {}) {
  currentProjectId = params.id || params.projectId || localStorage.getItem('currentProjectId');

  if (!currentProjectId) {
    navigate('proyek');
    showError('Pilih proyek terlebih dahulu');
    return '';
  }

  await loadProjectInfo();
  await loadDisasterData();

  return renderPage();
}

export function afterDisasterInspectionRender() {
  initEventListeners();
  initCustomElements();
  renderCurrentTab();
}

async function loadProjectInfo() {
  try {
    const { data, error } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, alamat, kota, luas_bangunan, jumlah_lantai, fungsi_bangunan')
      .eq('id', currentProjectId)
      .single();

    if (data) {
      currentProjectName = data.nama_bangunan;
    }
  } catch (e) {
    currentProjectName = 'Proyek Tidak Dikenal';
  }
}

async function loadDisasterData() {
  try {
    const [analysis, mitigations] = await Promise.all([
      disasterService.loadAnalysis(currentProjectId),
      disasterService.loadMitigations(currentProjectId)
    ]);

    disasterData.hazard = analysis;
    disasterData.mitigations = mitigations || [];
  } catch (e) {
    console.warn('Error loading disaster data:', e);
  }
}

function renderPage() {
  return `
    <div id="disaster-page" style="animation: page-fade-in 0.8s ease-out; height: 100%; display: flex; flex-direction: column;">
      
      <!-- Header -->
      <div class="card-quartz" style="padding: var(--space-6); margin-bottom: var(--space-4); flex-shrink: 0;">
        <div class="flex-between flex-stack" style="align-items: flex-start; gap: var(--space-4);">
          <div>
            <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id:'${currentProjectId}'})" 
              style="margin-bottom: 12px; color: var(--brand-300); padding: 0; font-weight: 700; letter-spacing: 1px;">
              <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> KEMBALI KE PROYEK
            </button>
            <h1 class="page-title" style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0;">
              🌋 Mitigasi Bencana & INARisk
            </h1>
            <p style="color: var(--text-secondary); margin-top: 8px; font-size: 14px;">
              ${currentProjectName} • Analisis Risiko Bencana per PP 24/2020
            </p>
          </div>
          
          <div class="flex gap-3">
            <button class="btn btn-outline" id="btn-export" style="border-radius: 12px; height: 44px;">
              <i class="fas fa-file-export" style="margin-right: 8px;"></i> Export Laporan
            </button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div style="display: flex; gap: 8px; margin-top: 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <button class="disaster-tab active" data-tab="map" style="${getTabStyle(true)}">
            <i class="fas fa-map-marked-alt" style="margin-right: 8px;"></i> Peta INARisk
          </button>
          <button class="disaster-tab" data-tab="simulator" style="${getTabStyle(false)}">
            <i class="fas fa-cube" style="margin-right: 8px;"></i> Simulasi 3D
          </button>
          <button class="disaster-tab" data-tab="vulnerability" style="${getTabStyle(false)}">
            <i class="fas fa-chart-bar" style="margin-right: 8px;"></i> Kerentanan
          </button>
          <button class="disaster-tab" data-tab="mitigation" style="${getTabStyle(false)}">
            <i class="fas fa-shield-alt" style="margin-right: 8px;"></i> Perencanaan
          </button>
          <button class="disaster-tab" data-tab="report" style="${getTabStyle(false)}">
            <i class="fas fa-file-alt" style="margin-right: 8px;"></i> Laporan
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="flex-1" style="min-height: 0; overflow: hidden;">
        <div id="tab-map" class="tab-content" style="height: 100%;">
          <disaster-map style="width: 100%; height: 100%;"></disaster-map>
        </div>
        
        <div id="tab-simulator" class="tab-content" style="height: 100%; display: none;">
          <disaster-simulator style="width: 100%; height: 100%;"></disaster-simulator>
        </div>
        
        <div id="tab-vulnerability" class="tab-content" style="height: 100%; display: none; overflow-y: auto;">
          <building-vulnerability style="min-height: 100%;"></building-vulnerability>
        </div>
        
        <div id="tab-mitigation" class="tab-content" style="height: 100%; display: none; overflow-y: auto;">
          <mitigation-planner style="min-height: 100%;"></mitigation-planner>
        </div>
        
        <div id="tab-report" class="tab-content" style="height: 100%; display: none; overflow-y: auto; padding: 20px;">
          ${renderReportTab()}
        </div>
      </div>
    </div>
  `;
}

function renderReportTab() {
  return `
    <div style="max-width: 900px; margin: 0 auto;">
      <h2 style="color: #fbbf24; margin-bottom: 20px;">📄 Laporan Analisis Risiko Bencana</h2>
      
      <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 16px; color: #94a3b8; font-size: 14px;">Informasi Laporan</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Standar</div>
            <div style="font-size: 14px; margin-top: 4px;">PP No. 24 Tahun 2020</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Dokumen</div>
            <div style="font-size: 14px; margin-top: 4px;">Sertifikat Laik Fungsi</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Sumber Data</div>
            <div style="font-size: 14px; margin-top: 4px;">INARisk - BNPB</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Tanggal</div>
            <div style="font-size: 14px; margin-top: 4px;">${new Date().toLocaleDateString('id-ID')}</div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 20px; border-radius: 12px;">
          <div style="font-size: 11px; opacity: 0.9;">Hazard Analysis</div>
          <div style="font-size: 13px; margin-top: 8px;">✓ Completed</div>
        </div>
        <div style="background: linear-gradient(135deg, #065f46, #10b981); padding: 20px; border-radius: 12px;">
          <div style="font-size: 11px; opacity: 0.9;">Vulnerability Assessment</div>
          <div style="font-size: 13px; margin-top: 8px;">✓ Completed</div>
        </div>
        <div style="background: linear-gradient(135deg, #7f1d1d, #ef4444); padding: 20px; border-radius: 12px;">
          <div style="font-size: 11px; opacity: 0.9;">Mitigation Planning</div>
          <div style="font-size: 13px; margin-top: 8px;">✓ Completed</div>
        </div>
      </div>

      <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 12px;">
        <h3 style="margin: 0 0 16px; color: #fbbf24; font-size: 14px;">Export Options</h3>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" id="btn-export-bnpb" style="flex: 1;">
            <i class="fas fa-file-word"></i> Format BNPB (DOCX)
          </button>
          <button class="btn btn-outline" id="btn-export-slf" style="flex: 1;">
            <i class="fas fa-file-alt"></i> Format SLF
          </button>
        </div>
      </div>
    </div>
  `;
}

function getTabStyle(isActive) {
  return `
    padding: 12px 20px; 
    background: ${isActive ? 'rgba(239, 68, 68, 0.2)' : 'transparent'};
    border: none; 
    border-bottom: 2px solid ${isActive ? '#ef4444' : 'transparent'};
    color: ${isActive ? '#fff' : '#94a3b8'};
    font-weight: ${isActive ? '600' : '400'};
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
  `;
}

function initEventListeners() {
  // Tab switching
  document.querySelectorAll('.disaster-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.dataset.tab;
      switchTab(targetTab);
    });
  });

  // Export buttons
  const exportBtn = document.getElementById('btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => generateReport());
  }

  // Report export buttons
  const bnpbBtn = document.getElementById('btn-export-bnpb');
  if (bnpbBtn) {
    bnpbBtn.addEventListener('click', () => exportReport('bnpb'));
  }

  const slfBtn = document.getElementById('btn-export-slf');
  if (slfBtn) {
    slfBtn.addEventListener('click', () => exportReport('slf'));
  }
}

function initCustomElements() {
  // Custom elements are automatically initialized by the browser
}

function renderCurrentTab() {
  switchTab(currentTab);
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.disaster-tab').forEach(tab => {
    const isActive = tab.dataset.tab === tabName;
    tab.style.cssText = getTabStyle(isActive);
    tab.classList.toggle('active', isActive);
  });

  // Show/hide tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });
  
  const targetContent = document.getElementById(`tab-${tabName}`);
  if (targetContent) {
    targetContent.style.display = 'block';
  }
}

async function generateReport() {
  try {
    showInfo('Generating report...');
    
    const reportData = {
      projectName: currentProjectName,
      location: 'Indonesia',
      hazardType: disasterData.hazard?.hazard_type || 'earthquake',
      riskLevel: 'MODERATE',
      buildingType: 'c1',
      buildingValue: 50000000000
    };

    const report = await reportService.generateReport(reportData, 'bnpb');
    
    showSuccess('Report generated successfully');
    
    // Store for export
    window.currentDisasterReport = report;
  } catch (e) {
    showError('Failed to generate report');
    console.error(e);
  }
}

async function exportReport(format) {
  try {
    showInfo('Exporting report...');
    
    const reportData = window.currentDisasterReport || {
      projectName: currentProjectName,
      hazardType: 'earthquake',
      riskLevel: 'MODERATE'
    };

    const result = await reportService.exportToDOCX(reportData, `analisis-risiko-${format}`);
    
    showSuccess(`Report exported: ${result.filename}`);
  } catch (e) {
    showError('Export failed');
    console.error(e);
  }
}

export default disasterInspectionPage;
