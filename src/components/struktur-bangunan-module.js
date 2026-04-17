/**
 * PEMERIKSAAN STRUKTUR BANGUNAN MODULE
 * Building Structure Inspection Component
 * Integrated with ASCE 41-17 Tier System, NDT Tests, Seismic Analysis, Pushover
 * UI Style: Presidential Quartz (matching pengaturan.js)
 */

import { 
  TIER1_CHECKLIST, 
  TIER2_CHECKLIST, 
  calculateDCR, 
  getDCRStatus,
  checkTier1NeedsTier2 
} from '../lib/asce41-tier-data.js';

import { analyzeSchmidtHammer, analyzeUPV, analyzeCoreDrill } from '../lib/ndt-calculators.js';
import { calculateSeismicParameters, generateResponseSpectrum, PUSGEN_DATA } from '../lib/seismic-calculator.js';
import { parsePushoverCSV, generatePushoverSVG, calculatePushoverMetrics } from '../lib/pushover-visualizer.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// ETABS Integration
import { ETABSParser, ETABSExporter, uploadEtabsFileToDrive, exportAndUploadE2K, saveAnalysisResultsToDrive } from '../lib/etabs-parser.js';
import { FEMA356Pushover, runFEMA356Example, validateFEMA356 } from '../lib/fema356-pushover.js';
import { EL_CENTRO_1940_NS, generateElCentroData } from '../lib/elcentro-data.js';

// Supabase & Google Drive Integration
import { saveEtabsModel, loadEtabsModel, saveFema356Results, loadFema356Results, saveTimeHistoryResults, loadTimeHistoryResults, saveAnalysisReport, updateReportDriveId } from '../lib/etabs-supabase-service.js';
import { generateDocxBlob } from '../lib/docx-service.js';
import { uploadToGoogleDrive } from '../lib/drive.js';

/**
 * Render Struktur Bangunan Module Card
 */
export function renderStrukturBangunanCard(p, tierStats = {}) {
  const tier1Progress = tierStats.tier1 || 0;
  const tier2Progress = tierStats.tier2 || 0;
  const tier3Progress = tierStats.tier3 || 0;
  const overallProgress = Math.round((tier1Progress + tier2Progress + tier3Progress) / 3);
  
  return `
    <div class="card-quartz" id="struktur-bangunan-card" style="padding: var(--space-6); grid-column: 1 / -1;">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-building-shield" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--success-400);">PHASE 02B</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Pemeriksaan Struktur Bangunan</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: hsla(160, 100%, 45%, 0.1); color: var(--success-400); border: 1px solid hsla(160, 100%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-layer-group" style="margin-right: 6px;"></i>ASCE 41-17
          </span>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi ketahanan gempa berdasarkan ASCE 41-17, pengujian material NDT/MDT, analisis seismik SNI 1726:2019, dan pushover analysis.
      </p>

      <!-- Presidential Tab Navigation (matching pengaturan.js style) -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: 24px; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
        <button onclick="window._switchStrukturTab('tier-evaluation', this)" 
                class="struktur-tab-item active"
                data-tab="tier-evaluation"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
          <i class="fas fa-clipboard-check"></i> TIER EVALUATION
        </button>
        <button onclick="window._switchStrukturTab('ndt-testing', this)" 
                class="struktur-tab-item"
                data-tab="ndt-testing"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-microscope"></i> NDT TESTING
        </button>
        <button onclick="window._switchStrukturTab('seismic-analysis', this)" 
                class="struktur-tab-item"
                data-tab="seismic-analysis"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-earthquake"></i> SEISMIC
        </button>
        <button onclick="window._switchStrukturTab('pushover', this)" 
                class="struktur-tab-item"
                data-tab="pushover"
                style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-chart-line"></i> PUSHOVER
        </button>
        <button onclick="window._switchStrukturTab('model-import', this)" 
                class="struktur-tab-item"
                data-tab="model-import"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 9px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-file-import"></i> IMPORT
        </button>
        <button onclick="window._switchStrukturTab('viewer-3d', this)" 
                class="struktur-tab-item"
                data-tab="viewer-3d"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 9px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-cube"></i> 3D VIEW
        </button>
        <button onclick="window._switchStrukturTab('time-history', this)" 
                class="struktur-tab-item"
                data-tab="time-history"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 9px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-wave-square"></i> TIME HIST
        </button>
        <button onclick="window._switchStrukturTab('fema356', this)" 
                class="struktur-tab-item"
                data-tab="fema356"
                style="flex: 1; min-width: 100px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 9px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
          <i class="fas fa-building-columns"></i> FEMA 356
        </button>
      </div>

      <!-- TAB CONTENT: TIER EVALUATION -->
      <div id="struktur-tab-tier-evaluation" class="struktur-tab-content active">
        ${renderTierEvaluationTab(tierStats)}
      </div>

      <!-- TAB CONTENT: NDT TESTING -->
      <div id="struktur-tab-ndt-testing" class="struktur-tab-content" style="display: none;">
        ${renderNDTTestingTab()}
      </div>

      <!-- TAB CONTENT: SEISMIC ANALYSIS -->
      <div id="struktur-tab-seismic-analysis" class="struktur-tab-content" style="display: none;">
        ${renderSeismicTab()}
      </div>

      <!-- TAB CONTENT: PUSHOVER -->
      <div id="struktur-tab-pushover" class="struktur-tab-content" style="display: none;">
        ${renderPushoverTab()}
      </div>

      <!-- TAB CONTENT: MODEL IMPORT (ETABS/SAP2000) -->
      <div id="struktur-tab-model-import" class="struktur-tab-content" style="display: none;">
        ${renderModelImportTab()}
      </div>

      <!-- TAB CONTENT: 3D VIEWER -->
      <div id="struktur-tab-viewer-3d" class="struktur-tab-content" style="display: none;">
        ${render3DViewerTab()}
      </div>

      <!-- TAB CONTENT: TIME HISTORY (El Centro) -->
      <div id="struktur-tab-time-history" class="struktur-tab-content" style="display: none;">
        ${renderTimeHistoryTab()}
      </div>

      <!-- TAB CONTENT: FEMA 356 PUSHOVER -->
      <div id="struktur-tab-fema356" class="struktur-tab-content" style="display: none;">
        ${renderFEMA356Tab()}
      </div>

      <!-- Overall Progress -->
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">
        <div class="flex-between" style="margin-bottom: 8px;">
          <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary);">OVERALL STRUCTURAL PROGRESS</span>
          <span style="font-size: 0.7rem; font-weight: 800; color: var(--success-400);">${overallProgress}%</span>
        </div>
        <div style="height: 6px; background: hsla(220, 20%, 100%, 0.05); border-radius: 10px;">
          <div style="width: ${overallProgress}%; height: 100%; border-radius: 10px; background: linear-gradient(90deg, var(--success-500), var(--brand-500)); box-shadow: 0 0 10px var(--success-500);"></div>
        </div>
      </div>
    </div>

    <style>
      .struktur-tab-item:hover {
        background: hsla(220, 20%, 100%, 0.05);
      }
      .struktur-tab-item.active {
        background: var(--gradient-brand) !important;
        color: white !important;
      }
      .struktur-tab-content {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;
}

/**
 * Tier Evaluation Tab Content
 */
function renderTierEvaluationTab(stats) {
  return `
    <div class="grid-3-col" style="gap: 16px;">
      <!-- Tier 1 Card -->
      <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 95%, 52%, 0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-filter"></i>
          </div>
          <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); font-size: 9px;">TIER 1</span>
        </div>
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px;">Screening Evaluation</h4>
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">Form evaluasi Tabel 17-1 & 17-2 untuk identifikasi defisiensi</p>
        
        <div style="margin-bottom: 16px;">
          <div class="flex-between" style="margin-bottom: 4px;">
            <span style="font-size: 0.7rem; color: var(--text-tertiary);">Progress</span>
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--brand-400);">${stats.tier1 || 0}%</span>
          </div>
          <div style="height: 4px; background: hsla(220, 20%, 100%, 0.1); border-radius: 4px;">
            <div style="width: ${stats.tier1 || 0}%; height: 100%; border-radius: 4px; background: var(--brand-500);"></div>
          </div>
        </div>
        
        <button onclick="window._openTierChecklist('tier1')" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-clipboard-check" style="margin-right: 6px;"></i> Mulai Tier 1
        </button>
      </div>

      <!-- Tier 2 Card -->
      <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(258, 70%, 65%, 0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(258, 70%, 65%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(258, 70%, 65%, 1);">
            <i class="fas fa-calculator"></i>
          </div>
          <span class="badge" style="background: hsla(258, 70%, 65%, 0.1); color: hsla(258, 70%, 65%, 1); font-size: 9px;">TIER 2</span>
        </div>
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px;">DCR Analysis</h4>
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">Perhitungan Demand Capacity Ratio untuk defisiensi</p>
        
        <div style="margin-bottom: 16px;">
          <div class="flex-between" style="margin-bottom: 4px;">
            <span style="font-size: 0.7rem; color: var(--text-tertiary);">Progress</span>
            <span style="font-size: 0.7rem; font-weight: 700; color: hsla(258, 70%, 65%, 1);">${stats.tier2 || 0}%</span>
          </div>
          <div style="height: 4px; background: hsla(220, 20%, 100%, 0.1); border-radius: 4px;">
            <div style="width: ${stats.tier2 || 0}%; height: 100%; border-radius: 4px; background: hsla(258, 70%, 65%, 1);"></div>
          </div>
        </div>
        
        <button onclick="window._openTierChecklist('tier2')" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(258, 70%, 65%, 0.2); border-color: hsla(258, 70%, 65%, 0.3); color: hsla(258, 70%, 65%, 1);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Mulai Tier 2
        </button>
      </div>

      <!-- Tier 3 Card -->
      <div class="card-quartz" style="padding: 24px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(0, 85%, 60%, 0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-chart-line"></i>
          </div>
          <span class="badge" style="background: hsla(0, 85%, 60%, 0.1); color: var(--danger-400); font-size: 9px;">TIER 3</span>
        </div>
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px;">Pushover Analysis</h4>
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">Analisis sistematis dengan kurva kapasitas</p>
        
        <div style="margin-bottom: 16px;">
          <div class="flex-between" style="margin-bottom: 4px;">
            <span style="font-size: 0.7rem; color: var(--text-tertiary);">Progress</span>
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--danger-400);">${stats.tier3 || 0}%</span>
          </div>
          <div style="height: 4px; background: hsla(220, 20%, 100%, 0.1); border-radius: 4px;">
            <div style="width: ${stats.tier3 || 0}%; height: 100%; border-radius: 4px; background: var(--danger-500);"></div>
          </div>
        </div>
        
        <button onclick="window._openTierChecklist('tier3')" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-chart-line" style="margin-right: 6px;"></i> Mulai Tier 3
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px;">
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--brand-400);">${stats.totalNC || 0}</div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary);">Item NC</div>
      </div>
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: 700; color: hsla(258, 70%, 65%, 1);">${stats.dcrCount || 0}</div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary);">DCR Checks</div>
      </div>
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger-400);">${stats.ncTier2 || 0}</div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary);">Perlu Tier 2</div>
      </div>
      <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--success-400);">${stats.seismicLevel || '-'}</div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary);">Seismic Level</div>
      </div>
    </div>
  `;
}

/**
 * NDT Testing Tab Content
 */
function renderNDTTestingTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Schmidt Hammer -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-hammer"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Schmidt Hammer</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">ASTM C805</div>
          </div>
        </div>
        <div style="margin-bottom: 12px;">
          <input type="text" id="ndt-schmidt-location" class="form-input" placeholder="Lokasi pengujian..." style="width: 100%; margin-bottom: 8px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
            ${Array.from({ length: 10 }, (_, i) => `
              <input type="number" class="form-input schmidt-rn-input" placeholder="${i + 1}" min="10" max="60" style="text-align: center; padding: 8px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
            `).join('')}
          </div>
        </div>
        <button onclick="window._calculateSchmidtQuick()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung fc'
        </button>
      </div>

      <!-- UPV -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-wave-square"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">UPV Test</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">ASTM C597</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <input type="text" id="ndt-upv-location" class="form-input" placeholder="Lokasi..." style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          <input type="number" id="ndt-upv-time" class="form-input" placeholder="Waktu (μs)" step="0.1" style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          <input type="number" id="ndt-upv-distance" class="form-input" placeholder="Jarak (mm)" step="10" style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        <button onclick="window._calculateUPVQuick()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Kecepatan
        </button>
      </div>

      <!-- Core Drill -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-database"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Core Drill</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">ASTM C42</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
          <input type="number" id="ndt-core-diameter" class="form-input" placeholder="Ø (mm)" value="100" style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          <input type="number" id="ndt-core-height" class="form-input" placeholder="h (mm)" value="200" style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          <input type="number" id="ndt-core-load" class="form-input" placeholder="P (kN)" step="0.1" style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        <button onclick="window._calculateCoreQuick()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung fc'
        </button>
      </div>

      <!-- NDT Summary -->
      <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.05);">
        <div style="font-weight: 700; color: white; margin-bottom: 12px;">
          <i class="fas fa-clipboard-list" style="margin-right: 8px; color: var(--brand-400);"></i>Riwayat Pengujian
        </div>
        <div id="ndt-history-list" style="font-size: 0.8rem; color: var(--text-tertiary);">
          Belum ada data pengujian
        </div>
        <button onclick="window._openFullNDT()" class="btn btn-ghost btn-sm" style="width: 100%; margin-top: 12px;">
          <i class="fas fa-external-link-alt" style="margin-right: 6px;"></i> Buka Kalkulator Lengkap
        </button>
      </div>
    </div>
  `;
}

/**
 * Seismic Analysis Tab Content
 */
function renderSeismicTab() {
  return `
    <div class="grid-main-side" style="gap: 16px;">
      <div class="card-quartz" style="padding: 24px;">
        <div style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-sliders-h" style="margin-right: 8px; color: var(--brand-400);"></i>Parameter Gempa (SNI 1726:2019)
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Wilayah (PuSGeN)</label>
          <select id="seismic-region" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="">-- Pilih Wilayah --</option>
            ${Object.entries(PUSGEN_DATA).map(([key, data]) => `
              <option value="${key}">${data.region} (Ss=${data.Ss}, S1=${data.S1})</option>
            `).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Ss (g)</label>
            <input type="number" id="seismic-ss" class="form-input" placeholder="0.00" step="0.01" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">S1 (g)</label>
            <input type="number" id="seismic-s1" class="form-input" placeholder="0.00" step="0.01" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Site Class</label>
          <select id="seismic-site-class" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="SA">SA - Hard Rock</option>
            <option value="SB">SB - Rock</option>
            <option value="SC">SC - Very Dense Soil</option>
            <option value="SD" selected>SD - Stiff Soil</option>
            <option value="SE">SE - Soft Soil</option>
          </select>
        </div>

        <button onclick="window._calculateSeismicQuick()" class="btn btn-primary" style="width: 100%;">
          <i class="fas fa-calculator" style="margin-right: 8px;"></i> Hitung Parameter
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card-quartz" style="padding: 20px; display: none;" id="seismic-result-card">
          <div style="font-weight: 700; color: white; margin-bottom: 12px;">Hasil Perhitungan</div>
          <div id="seismic-result-content" style="font-size: 0.85rem; color: var(--text-secondary);"></div>
        </div>

        <div class="card-quartz" style="padding: 20px;">
          <div style="font-weight: 700; color: white; margin-bottom: 12px;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--brand-400);"></i>Referensi
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.6;">
            <p>SNI 1726:2019 - Tata Cara Perencanaan Ketahanan Gempa</p>
            <p>ASCE 41-17 - Seismic Evaluation & Retrofit</p>
            <p>PuSGeN - Peta Gempa Indonesia</p>
          </div>
          <button onclick="window._openFullSeismic()" class="btn btn-ghost btn-sm" style="width: 100%; margin-top: 12px;">
            <i class="fas fa-external-link-alt" style="margin-right: 6px;"></i> Kalkulator Lengkap
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Pushover Tab Content
 */
function renderPushoverTab() {
  return `
    <div class="grid-main-side" style="gap: 16px;">
      <div class="card-quartz" style="padding: 24px;">
        <div style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-chart-line" style="margin-right: 8px; color: var(--danger-400);"></i>Pushover Analysis (ASCE 41-17)
        </div>
        
        <div style="padding: 20px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px dashed hsla(220, 20%, 100%, 0.2); text-align: center; margin-bottom: 16px;">
          <i class="fas fa-file-csv" style="font-size: 2rem; color: var(--text-tertiary); margin-bottom: 12px;"></i>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Upload CSV dari ETABS/SAP2000</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 12px;">Format: Step, BaseShear(kN), RoofDisplacement(mm)</div>
          <input type="file" id="pushover-file-input" accept=".csv" style="display: none;" onchange="window._handlePushoverUpload(this)">
          <button onclick="document.getElementById('pushover-file-input').click()" class="btn btn-secondary btn-sm">
            <i class="fas fa-upload" style="margin-right: 6px;"></i> Pilih File CSV
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Target Displacement</div>
            <input type="number" id="pushover-target-disp" class="form-input" placeholder="mm" style="width: 100%; margin-top: 4px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Performance Level</div>
            <select id="pushover-performance-level" class="form-select" style="width: 100%; margin-top: 4px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
              <option value="IO">Immediate Occupancy (IO)</option>
              <option value="LS" selected>Life Safety (LS)</option>
              <option value="CP">Collapse Prevention (CP)</option>
            </select>
          </div>
        </div>

        <button onclick="window._plotPushoverQuick()" class="btn btn-primary" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-chart-line" style="margin-right: 8px;"></i> Plot Kurva Kapasitas
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card-quartz" style="padding: 20px; min-height: 200px;" id="pushover-plot-container">
          <div style="text-align: center; color: var(--text-tertiary); padding: 40px;">
            <i class="fas fa-chart-line" style="font-size: 2rem; margin-bottom: 12px; opacity: 0.5;"></i>
            <div style="font-size: 0.85rem;">Plot kurva pushover akan muncul di sini</div>
          </div>
        </div>

        <div class="card-quartz" style="padding: 20px;">
          <div style="font-weight: 700; color: white; margin-bottom: 12px;">
            <i class="fas fa-circle-nodes" style="margin-right: 8px; color: var(--brand-400);"></i>Status Sendi Plastis
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
            <span style="font-size: 0.7rem; padding: 4px 8px; background: #3b82f6; border-radius: 4px; color: white;">B-IO</span>
            <span style="font-size: 0.7rem; padding: 4px 8px; background: #22c55e; border-radius: 4px; color: white;">IO-LS</span>
            <span style="font-size: 0.7rem; padding: 4px 8px; background: #eab308; border-radius: 4px; color: white;">LS-CP</span>
            <span style="font-size: 0.7rem; padding: 4px 8px; background: #ef4444; border-radius: 4px; color: white;">CP-E</span>
          </div>
          <button onclick="window._openFullPushover()" class="btn btn-ghost btn-sm" style="width: 100%;">
            <i class="fas fa-external-link-alt" style="margin-right: 6px;"></i> Analisis Lengkap
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Model Import Tab (ETABS/SAP2000)
 */
function renderModelImportTab() {
  return `
    <div class="grid-main-side" style="gap: 16px;">
      <div class="card-quartz" style="padding: 24px;">
        <div style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-file-import" style="margin-right: 8px; color: var(--brand-400);"></i>Import ETABS / SAP2000
        </div>
        
        <div style="padding: 30px; border: 2px dashed hsla(220, 95%, 52%, 0.3); border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <i class="fas fa-cloud-upload-alt" style="font-size: 2.5rem; color: var(--brand-400); margin-bottom: 12px;"></i>
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">Drop .e2k, .s2k, or .txt files</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">ETABS Text Format / SAP2000 S2K Format</div>
          <input type="file" id="etabs-file-input" accept=".e2k,.s2k,.txt" style="display: none;" onchange="window._handleEtabsImport(this)">
          <button onclick="document.getElementById('etabs-file-input').click()" class="btn btn-primary btn-sm">
            <i class="fas fa-folder-open" style="margin-right: 6px;"></i> Browse File
          </button>
        </div>

        <div id="etabs-import-report" style="display: none; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; margin-bottom: 16px;">
          <div style="color: var(--text-tertiary); font-size: 0.8rem;">Import report akan muncul di sini</div>
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button id="btn-preview-3d" onclick="window._previewImportedModel()" class="btn btn-secondary btn-sm" disabled>
            <i class="fas fa-cube" style="margin-right: 6px;"></i> Preview 3D
          </button>
          <button onclick="window._exportToEtabs()" class="btn btn-ghost btn-sm">
            <i class="fas fa-file-export" style="margin-right: 6px;"></i> Export E2K
          </button>
          <button onclick="window._saveModelToCloud()" class="btn btn-primary btn-sm" style="background: hsla(220, 95%, 52%, 0.2);">
            <i class="fas fa-cloud-upload-alt" style="margin-right: 6px;"></i> Save to Cloud
          </button>
          <button onclick="window._loadModelFromCloud()" class="btn btn-ghost btn-sm">
            <i class="fas fa-cloud-download-alt" style="margin-right: 6px;"></i> Load
          </button>
          <button onclick="window._generateEtabsReportTrigger()" class="btn btn-primary btn-sm" style="background: hsla(160, 100%, 45%, 0.2);">
            <i class="fas fa-file-word" style="margin-right: 6px;"></i> Generate Report
          </button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card-quartz" style="padding: 20px;">
          <div style="font-weight: 700; color: white; margin-bottom: 12px;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--brand-400);"></i>Supported Formats
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>.e2k</strong> - ETABS Text File (2016+)</p>
            <p><strong>.s2k</strong> - SAP2000 S2K Format</p>
            <p><strong>.txt</strong> - Auto-detect format</p>
            <p style="margin-top: 12px; color: var(--text-secondary);">Pastikan file di-export dari ETABS dengan "Export to .e2k"</p>
          </div>
        </div>

        <div class="card-quartz" style="padding: 20px;">
          <div style="font-weight: 700; color: white; margin-bottom: 12px;">
            <i class="fas fa-layer-group" style="margin-right: 8px; color: var(--success-400);"></i>Imported Data
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.6;">
            <p>• Nodes & Coordinates (X,Y,Z)</p>
            <p>• Frame Elements (Beams, Columns)</p>
            <p>• Shell Elements (Slabs, Walls)</p>
            <p>• Material Properties</p>
            <p>• Section Properties</p>
            <p>• Story Data</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render 3D Viewer Tab
 */
function render3DViewerTab() {
  return `
    <div class="card-quartz" style="padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div style="font-weight: 700; color: white;">
          <i class="fas fa-cube" style="margin-right: 8px; color: var(--brand-400);"></i>3D Structural Viewer
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window._reset3DView()" class="btn btn-ghost btn-sm">
            <i class="fas fa-sync-alt"></i> Reset
          </button>
          <button onclick="window._toggleViewMode()" class="btn btn-ghost btn-sm">
            <i class="fas fa-eye"></i> Wireframe
          </button>
        </div>
      </div>
      
      <div id="model-3d-canvas" style="width: 100%; height: 400px; background: hsla(220, 20%, 100%, 0.03); border-radius: 12px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: var(--text-tertiary);">
          <i class="fas fa-cube" style="font-size: 3rem; margin-bottom: 12px; opacity: 0.5;"></i>
          <div>Import model atau jalankan analisis untuk melihat 3D view</div>
          <div style="font-size: 0.75rem; margin-top: 8px;">Menggunakan Three.js WebGL Renderer</div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px;">
        <div style="text-align: center; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
          <div id="viewer-node-count" style="font-size: 1.2rem; font-weight: bold; color: var(--brand-400);">0</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Nodes</div>
        </div>
        <div style="text-align: center; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
          <div id="viewer-elem-count" style="font-size: 1.2rem; font-weight: bold; color: var(--success-400);">0</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Elements</div>
        </div>
        <div style="text-align: center; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
          <div id="viewer-material-count" style="font-size: 1.2rem; font-weight: bold; color: var(--gold-400);">0</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Materials</div>
        </div>
        <div style="text-align: center; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
          <div id="viewer-story-count" style="font-size: 1.2rem; font-weight: bold; color: hsla(258, 70%, 65%, 1);">0</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary);">Stories</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Time History Tab (El Centro)
 */
function renderTimeHistoryTab() {
  return `
    <div class="grid-main-side" style="gap: 16px;">
      <div class="card-quartz" style="padding: 24px;">
        <div style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-wave-square" style="margin-right: 8px; color: #3b82f6;"></i>Time History Analysis - El Centro 1940
        </div>
        
        <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Earthquake</div>
              <div style="font-weight: bold; color: white; font-size: 0.85rem;">El Centro 1940 NS</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Magnitude</div>
              <div style="font-weight: bold; color: white; font-size: 0.85rem;">M6.95</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">PGA</div>
              <div style="font-weight: bold; color: white; font-size: 0.85rem;">0.313g</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Duration</div>
              <div style="font-weight: bold; color: white; font-size: 0.85rem;">30.0s</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">dt</div>
              <div style="font-weight: bold; color: white; font-size: 0.85rem;">0.02s</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Damping</div>
              <div style="font-weight: bold; color: white; font-size: 0.85rem;">5%</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 8px;">Integration Method</label>
          <select id="th-integrator" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="newmark">Newmark (β=0.25, γ=0.5)</option>
            <option value="wilson">Wilson-θ (θ=1.4)</option>
            <option value="central">Central Difference</option>
          </select>
        </div>

        <button onclick="window._runElCentroAnalysis()" class="btn btn-primary" style="width: 100%; background: hsla(217, 91%, 60%, 0.2); border-color: hsla(217, 91%, 60%, 0.3);">
          <i class="fas fa-play" style="margin-right: 8px;"></i> Run El Centro Time History
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card-quartz" style="padding: 20px; min-height: 250px;" id="timehistory-plot-container">
          <div style="text-align: center; color: var(--text-tertiary); padding: 60px 20px;">
            <i class="fas fa-chart-area" style="font-size: 2rem; margin-bottom: 12px; opacity: 0.5;"></i>
            <div>Run analysis to see displacement time history</div>
          </div>
        </div>

        <div class="card-quartz" style="padding: 20px;" id="timehistory-peaks">
          <div style="text-align: center; color: var(--text-tertiary);">
            Peak response values will appear here
          </div>
        </div>

        <div class="card-quartz" style="padding: 20px;">
          <div style="font-weight: 700; color: white; margin-bottom: 12px; font-size: 0.9rem;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--brand-400);"></i>About El Centro
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.6;">
            <p>Imperial Valley Earthquake, May 18, 1940</p>
            <p>Recorded at El Centro Array Station #9</p>
            <p>North-South Component</p>
            <p style="margin-top: 8px;">Most widely used ground motion for seismic analysis validation.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render FEMA 356 Pushover Tab
 */
function renderFEMA356Tab() {
  return `
    <div class="grid-main-side" style="gap: 16px;">
      <div class="card-quartz" style="padding: 24px;">
        <div style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-building-columns" style="margin-right: 8px; color: #f59e0b;"></i>FEMA 356 Pushover Analysis
        </div>
        
        <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; margin-bottom: 20px;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px;">Performance Levels:</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
            <span style="font-size: 0.7rem; padding: 4px 8px; background: #3b82f6; border-radius: 4px; color: white;">IO - Immediate Occupancy</span>
            <span style="font-size: 0.7rem; padding: 4px 8px; background: #22c55e; border-radius: 4px; color: white;">LS - Life Safety</span>
            <span style="font-size: 0.7rem; padding: 4px 8px; background: #eab308; border-radius: 4px; color: white;">CP - Collapse Prevention</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5;">
            Pushover analysis evaluates structural performance under increasing lateral loads, 
            tracking hinge formation and capacity curve to FEMA 356 acceptance criteria.
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 8px;">Lateral Load Pattern</label>
          <select id="fema356-load-pattern" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="inverted_triangle">Inverted Triangle</option>
            <option value="uniform">Uniform</option>
            <option value="modal">Modal (SRSS)</option>
          </select>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 8px;">Target Displacement (m)</label>
          <input type="number" id="fema356-target-disp" class="form-input" value="0.6" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
        </div>

        <button onclick="window._runFEMA356Analysis()" class="btn btn-primary" style="width: 100%; background: hsla(38, 92%, 50%, 0.2); border-color: hsla(38, 92%, 50%, 0.3); color: #f59e0b;">
          <i class="fas fa-play" style="margin-right: 8px;"></i> Run FEMA 356 Analysis
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card-quartz" style="padding: 20px; min-height: 300px;" id="fema356-plot-container">
          <div style="text-align: center; color: var(--text-tertiary); padding: 80px 20px;">
            <i class="fas fa-chart-line" style="font-size: 2rem; margin-bottom: 12px; opacity: 0.5;"></i>
            <div>FEMA 356 Capacity Curve</div>
            <div style="font-size: 0.75rem; margin-top: 8px;">Run analysis to see results</div>
          </div>
        </div>

        <div class="card-quartz" style="padding: 20px;" id="fema356-summary">
          <div style="text-align: center; color: var(--text-tertiary);">
            Analysis summary will appear here
          </div>
        </div>

        <div class="card-quartz" style="padding: 20px; max-height: 250px; overflow-y: auto;" id="fema356-hinge-container">
          <div style="font-weight: 700; color: white; margin-bottom: 12px; font-size: 0.9rem;">
            <i class="fas fa-circle-nodes" style="margin-right: 8px; color: var(--brand-400);"></i>Hinge Formation Status
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">
            Hinge states will appear after analysis
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate Time History Plot SVG
 */
function generateTimeHistoryPlot(result) {
  if (!result.time || !result.displacement) return '';
  
  const { time, displacement } = result;
  const width = 580;
  const height = 250;
  const margin = { top: 30, right: 30, bottom: 40, left: 50 };
  
  const maxDisp = Math.max(...displacement.map(Math.abs));
  const maxTime = time[time.length - 1];
  
  // Scale functions
  const scaleX = (t) => margin.left + (t / maxTime) * (width - margin.left - margin.right);
  const scaleY = (d) => margin.top + (height - margin.top - margin.bottom) / 2 - (d / maxDisp) * ((height - margin.top - margin.bottom) / 2);
  
  // Build path
  let path = `M ${scaleX(time[0])} ${scaleY(displacement[0])}`;
  for (let i = 1; i < time.length; i += 5) { // Sample every 5 points for performance
    path += ` L ${scaleX(time[i])} ${scaleY(displacement[i])}`;
  }
  
  return `
    <svg width="${width}" height="${height}" style="background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
      <!-- Grid lines -->
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#333" stroke-width="1"/>
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#333" stroke-width="1"/>
      
      <!-- Zero line -->
      <line x1="${margin.left}" y1="${scaleY(0)}" x2="${width - margin.right}" y2="${scaleY(0)}" stroke="#555" stroke-width="1" stroke-dasharray="4"/>
      
      <!-- Displacement curve -->
      <path d="${path}" fill="none" stroke="#3b82f6" stroke-width="1.5"/>
      
      <!-- Labels -->
      <text x="${width / 2}" y="${height - 10}" fill="#888" font-size="12" text-anchor="middle">Time (s)</text>
      <text x="15" y="${height / 2}" fill="#888" font-size="12" transform="rotate(-90, 15, ${height / 2})" text-anchor="middle">Displacement (m)</text>
      <text x="${width / 2}" y="20" fill="white" font-size="14" text-anchor="middle" font-weight="bold">Roof Displacement Time History</text>
    </svg>
  `;
}

/**
 * Render imported model in 3D canvas
 */
function renderImportedModel3D(model) {
  const canvas = document.getElementById('model-3d-canvas');
  if (!canvas || !model) return;
  
  // Update stats
  const nodeCount = document.getElementById('viewer-node-count');
  const elemCount = document.getElementById('viewer-elem-count');
  const matCount = document.getElementById('viewer-material-count');
  const storyCount = document.getElementById('viewer-story-count');
  
  if (nodeCount) nodeCount.textContent = model.nodes?.length || 0;
  if (elemCount) elemCount.textContent = model.elements?.length || 0;
  if (matCount) matCount.textContent = model.materials?.length || 0;
  if (storyCount) storyCount.textContent = model.metadata?.stories || 0;
  
  // Simple 2D projection preview (full Three.js would be loaded dynamically)
  const uniqueZ = [...new Set(model.nodes.map(n => n.z))].sort((a, b) => a - b);
  
  // Find bounds
  const xs = model.nodes.map(n => n.x);
  const zs = model.nodes.map(n => n.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  const padding = 40;
  
  const scaleX = (canvasWidth - 2 * padding) / (maxX - minX || 1);
  const scaleZ = (canvasHeight - 2 * padding) / (maxZ - minZ || 1);
  const scale = Math.min(scaleX, scaleZ) * 0.8;
  
  const offsetX = padding + (canvasWidth - 2 * padding - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = padding + (canvasHeight - 2 * padding - (maxZ - minZ) * scale) / 2 - minZ * scale;
  
  // Generate SVG for 2D preview
  let svgContent = `
    <svg width="100%" height="100%" viewBox="0 0 ${canvasWidth} ${canvasHeight}" style="background: hsla(220, 20%, 100%, 0.03);">
      <!-- Grid -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsla(220, 20%, 100%, 0.05)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Story lines -->
      ${uniqueZ.map(z => {
        const y = offsetY + z * scale;
        return `<line x1="0" y1="${y}" x2="${canvasWidth}" y2="${y}" stroke="hsla(220, 20%, 100%, 0.1)" stroke-width="1" stroke-dasharray="4"/>`;
      }).join('')}
      
      <!-- Elements (lines) -->
      ${model.elements.filter(e => e.type === 'frame').map(elem => {
        const n1 = model.nodes.find(n => n.id === elem.node1);
        const n2 = model.nodes.find(n => n.id === elem.node2);
        if (!n1 || !n2) return '';
        const x1 = offsetX + n1.x * scale;
        const y1 = offsetY + n1.z * scale;
        const x2 = offsetX + n2.x * scale;
        const y2 = offsetY + n2.z * scale;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#10b981" stroke-width="2"/>`;
      }).join('')}
      
      <!-- Nodes (dots) -->
      ${model.nodes.map(node => {
        const x = offsetX + node.x * scale;
        const y = offsetY + node.z * scale;
        const isFixed = node.restraints?.every(r => r === 1);
        return `<circle cx="${x}" cy="${y}" r="${isFixed ? 6 : 4}" fill="${isFixed ? '#ef4444' : '#3b82f6'}"/>`;
      }).join('')}
    </svg>
  `;
  
  canvas.innerHTML = svgContent;
}
export function initStrukturBangunanHandlers(proyekId) {
  // Tab switching - Scoped to struktur-bangunan-card only
  window._switchStrukturTab = (tabId, btn) => {
    const card = document.getElementById('struktur-bangunan-card');
    if (!card) {
      console.error('[StrukturBangunan] Card not found');
      return;
    }

    // Update button states - scoped within card
    card.querySelectorAll('.struktur-tab-item').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = 'var(--text-tertiary)';
      b.style.boxShadow = 'none';
    });

    if (btn) {
      btn.classList.add('active');
      btn.style.background = 'var(--gradient-brand)';
      btn.style.color = 'white';
      btn.style.boxShadow = 'var(--shadow-sapphire)';
    }

    // Show/hide content - scoped within card
    card.querySelectorAll('.struktur-tab-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });

    const targetContent = card.querySelector(`#struktur-tab-${tabId}`);
    if (targetContent) {
      targetContent.style.display = 'block';
      targetContent.classList.add('active');
    } else {
      console.warn(`[StrukturBangunan] Tab content not found: struktur-tab-${tabId}`);
    }
  };

  // Tier navigation
  window._openTierChecklist = (tier) => {
    navigate('tier-checklist', { id: proyekId, tier });
  };

  // Quick NDT calculations
  window._calculateSchmidtQuick = () => {
    const inputs = document.querySelectorAll('.schmidt-rn-input');
    const readings = Array.from(inputs).map(input => parseFloat(input.value)).filter(v => !isNaN(v));
    
    if (readings.length < 5) {
      showError('Masukkan minimal 5 nilai pantul');
      return;
    }
    
    const result = analyzeSchmidtHammer(readings, 0);
    showSuccess(`fc' = ${result.concrete.fc} MPa (${result.quality.label})`);
  };

  window._calculateUPVQuick = () => {
    const time = parseFloat(document.getElementById('ndt-upv-time')?.value);
    const distance = parseFloat(document.getElementById('ndt-upv-distance')?.value);
    
    if (!time || !distance) {
      showError('Masukkan waktu tempuh dan jarak');
      return;
    }
    
    const result = analyzeUPV(time, distance);
    showSuccess(`Pulse Velocity = ${result.velocity} km/s (${result.classification.quality})`);
  };

  window._calculateCoreQuick = () => {
    const diameter = parseFloat(document.getElementById('ndt-core-diameter')?.value);
    const height = parseFloat(document.getElementById('ndt-core-height')?.value);
    const load = parseFloat(document.getElementById('ndt-core-load')?.value);
    
    if (!diameter || !load) {
      showError('Masukkan diameter dan beban');
      return;
    }
    
    const result = analyzeCoreDrill(diameter, height, load, height / diameter);
    showSuccess(`fc' = ${result.strength.fcCylinder} MPa (${result.strength.class})`);
  };

  window._openFullNDT = () => {
    navigate('ndt-calculator', { proyekId });
  };

  // Seismic calculations
  window._calculateSeismicQuick = () => {
    const Ss = parseFloat(document.getElementById('seismic-ss')?.value);
    const S1 = parseFloat(document.getElementById('seismic-s1')?.value);
    const siteClass = document.getElementById('seismic-site-class')?.value || 'SD';
    
    if (!Ss || !S1) {
      showError('Masukkan Ss dan S1');
      return;
    }
    
    const result = calculateSeismicParameters(Ss, S1, siteClass);
    
    const resultCard = document.getElementById('seismic-result-card');
    const resultContent = document.getElementById('seismic-result-content');
    
    if (resultCard && resultContent) {
      resultCard.style.display = 'block';
      resultContent.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>SDS: <strong>${result.design.SDS}</strong> g</div>
          <div>SD1: <strong>${result.design.SD1}</strong> g</div>
          <div>Fa: <strong>${result.site.Fa}</strong></div>
          <div>Fv: <strong>${result.site.Fv}</strong></div>
          <div colspan="2" style="grid-column: 1 / -1;">
            <span style="color: ${result.category.description.color};">
              Level: <strong>${result.category.seismicity}</strong> (SDC ${result.category.sdc})
            </span>
          </div>
        </div>
      `;
    }
    
    showSuccess(`Seismic Level: ${result.category.seismicity}`);
  };

  // Region auto-fill
  const regionSelect = document.getElementById('seismic-region');
  if (regionSelect) {
    regionSelect.addEventListener('change', (e) => {
      const region = PUSGEN_DATA[e.target.value];
      if (region) {
        document.getElementById('seismic-ss').value = region.Ss;
        document.getElementById('seismic-s1').value = region.S1;
      }
    });
  }

  window._openFullSeismic = () => {
    navigate('seismic-calculator', { proyekId });
  };

  // Pushover
  window._handlePushoverUpload = (input) => {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      window._lastPushoverData = parsePushoverCSV(csv);
      showSuccess(`Loaded ${window._lastPushoverData.length} data points`);
    };
    reader.readAsText(file);
  };

  window._plotPushoverQuick = () => {
    if (!window._lastPushoverData || window._lastPushoverData.length === 0) {
      showError('Upload data CSV terlebih dahulu');
      return;
    }
    
    const container = document.getElementById('pushover-plot-container');
    const metrics = calculatePushoverMetrics(window._lastPushoverData);
    
    if (container) {
      container.innerHTML = generatePushoverSVG(window._lastPushoverData, {
        width: container.clientWidth,
        height: 300,
        performancePoint: metrics ? {
          displacement: metrics.yield.displacement,
          baseShear: metrics.yield.baseShear
        } : null
      });
    }
    
    showSuccess('Kurva kapasitas berhasil diplot');
  };

  window._openFullPushover = () => {
    navigate('tier-checklist', { id: proyekId, tier: 'tier3', section: 'pushover' });
  };

  // ETABS/SAP2000 Import handlers
  window._handleEtabsImport = async (input) => {
    const file = input.files[0];
    if (!file) return;
    
    const parser = new ETABSParser();
    try {
      showInfo('Parsing ETABS/SAP2000 file...');
      const model = await parser.parseFile(file);
      
      // Store imported model
      window._importedEtabsModel = model;
      
      // Show validation report
      const reportDiv = document.getElementById('etabs-import-report');
      if (reportDiv) {
        reportDiv.innerHTML = `
          <div style="color: #10b981; margin-bottom: 12px;">
            <i class="fas fa-check-circle"></i> Berhasil di-parse!
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 0.8rem;">
            <div style="background: hsla(220, 20%, 100%, 0.05); padding: 8px; border-radius: 6px;">
              <div style="color: var(--text-tertiary);">Nodes</div>
              <div style="font-weight: bold; color: white;">${model.nodes.length}</div>
            </div>
            <div style="background: hsla(220, 20%, 100%, 0.05); padding: 8px; border-radius: 6px;">
              <div style="color: var(--text-tertiary);">Elements</div>
              <div style="font-weight: bold; color: white;">${model.elements.length}</div>
            </div>
            <div style="background: hsla(220, 20%, 100%, 0.05); padding: 8px; border-radius: 6px;">
              <div style="color: var(--text-tertiary);">Materials</div>
              <div style="font-weight: bold; color: white;">${model.materials.length}</div>
            </div>
            <div style="background: hsla(220, 20%, 100%, 0.05); padding: 8px; border-radius: 6px;">
              <div style="color: var(--text-tertiary);">Warnings</div>
              <div style="font-weight: bold; color: ${model.warnings.length > 0 ? '#f59e0b' : '#10b981'};">${model.warnings.length}</div>
            </div>
          </div>
          ${model.warnings.length > 0 ? `
            <div style="margin-top: 12px; padding: 8px; background: hsla(45, 90%, 60%, 0.1); border-radius: 6px; font-size: 0.75rem; color: #f59e0b;">
              <i class="fas fa-exclamation-triangle"></i> ${model.warnings.slice(0, 3).join(', ')}
            </div>
          ` : ''}
        `;
      }
      
      // Enable 3D preview button
      const previewBtn = document.getElementById('btn-preview-3d');
      if (previewBtn) previewBtn.disabled = false;
      
      showSuccess(`ETABS model imported: ${model.nodes.length} nodes, ${model.elements.length} elements`);
    } catch (err) {
      showError('Failed to parse file: ' + err.message);
    }
  };

  window._previewImportedModel = () => {
    if (!window._importedEtabsModel) {
      showError('Import model terlebih dahulu');
      return;
    }
    // Switch to 3D viewer tab
    const viewerTab = document.querySelector('[data-tab="viewer-3d"]');
    if (viewerTab) viewerTab.click();
    // Render the model
    renderImportedModel3D(window._importedEtabsModel);
  };

  window._exportToEtabs = () => {
    if (!window._importedEtabsModel) {
      showError('Tidak ada model untuk export');
      return;
    }
    const exporter = new ETABSExporter();
    exporter.downloadE2K(window._importedEtabsModel, 'model_export.e2k');
    showSuccess('Model exported to E2K format');
  };

  window._saveModelToCloud = () => saveModelToSupabase(proyekId);
  window._loadModelFromCloud = () => loadModelFromSupabase(proyekId);
  window._generateEtabsReportTrigger = () => generateEtabsReport(proyekId, { id: proyekId, nama_bangunan: 'Project Analysis' });

  // FEMA 356 Pushover handlers
  window._runFEMA356Analysis = async () => {
    showInfo('Running FEMA 356 Pushover Analysis...');
    try {
      const worker = new Worker(new URL('../lib/FEAScriptWorker.js', import.meta.url), { type: 'module' });
      const pushover = new FEMA356Pushover(worker);
      
      // Create sample 3-story frame
      const model = window._importedEtabsModel || createSampleFrame();
      
      const results = await pushover.runAnalysis(model, {
        steps: 100,
        targetDisplacement: 0.6,
        loadPattern: 'inverted_triangle'
      });

      // Display results
      const plotContainer = document.getElementById('fema356-plot-container');
      if (plotContainer) {
        plotContainer.innerHTML = pushover.generateCapacityPlot({ width: 600, height: 350 });
      }
      
      const hingeContainer = document.getElementById('fema356-hinge-container');
      if (hingeContainer) {
        hingeContainer.innerHTML = pushover.generateHingeTable();
      }
      
      const summary = pushover.getSummary();
      const summaryDiv = document.getElementById('fema356-summary');
      if (summaryDiv) {
        summaryDiv.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="text-align: center; padding: 12px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px;">
              <div style="font-size: 1.2rem; font-weight: bold; color: #3b82f6;">${summary.maxDisplacement.toFixed(2)}m</div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Max Displacement</div>
            </div>
            <div style="text-align: center; padding: 12px; background: hsla(160, 100%, 45%, 0.1); border-radius: 8px;">
              <div style="font-size: 1.2rem; font-weight: bold; color: #22c55e;">${(summary.maxBaseShear/1000).toFixed(1)}MN</div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Max Base Shear</div>
            </div>
            <div style="text-align: center; padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px;">
              <div style="font-size: 1.2rem; font-weight: bold; color: #ef4444;">${summary.governingLevel}</div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary);">Performance</div>
            </div>
          </div>
          <div style="margin-top: 12px; padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              Hinges: IO=${summary.hingeCounts.IO}, LS=${summary.hingeCounts.LS}, CP=${summary.hingeCounts.CP}
            </div>
          </div>
        `;
      }
      
      showSuccess(`FEMA 356 Complete: Performance Level ${summary.governingLevel}`);
      
      // Save to cloud
      await saveFemaResultsToCloud(proyekId, pushover.results || results);
      
    } catch (err) {
      showError('Analysis failed: ' + err.message);
      console.error(err);
    }
  };

  // Time History handlers
  window._runElCentroAnalysis = async () => {
    showInfo('Running El Centro 1940 Time History Analysis...');
    try {
      const worker = new Worker(new URL('../lib/FEAScriptWorker.js', import.meta.url), { type: 'module' });
      
      // Initialize with sample model
      const model = window._importedEtabsModel || createSampleFrame();
      
      worker.postMessage({
        command: 'INITIALIZE',
        payload: model,
        id: Date.now()
      });

      await new Promise((resolve, reject) => {
        const handler = (e) => {
          if (e.data.type === 'success') {
            worker.removeEventListener('message', handler);
            resolve(e.data.result);
          } else if (e.data.type === 'error') {
            worker.removeEventListener('message', handler);
            reject(new Error(e.data.error));
          }
        };
        worker.addEventListener('message', handler);
      });

      // Run time history
      const groundMotion = generateElCentroData(10, 0.02); // 10 seconds
      
      worker.postMessage({
        command: 'SOLVE_TIMEHISTORY',
        payload: {
          groundMotion: EL_CENTRO_1940_NS,
          dt: 0.02,
          damping: 0.05,
          integrationMethod: 'newmark'
        },
        id: Date.now()
      });

      const result = await new Promise((resolve, reject) => {
        const handler = (e) => {
          if (e.data.type === 'success') {
            worker.removeEventListener('message', handler);
            resolve(e.data.result);
          } else if (e.data.type === 'error') {
            worker.removeEventListener('message', handler);
            reject(new Error(e.data.error));
          }
        };
        worker.addEventListener('message', handler);
      });

      // Display results
      const plotContainer = document.getElementById('timehistory-plot-container');
      if (plotContainer && result.time) {
        plotContainer.innerHTML = generateTimeHistoryPlot(result);
      }
      
      const peaksDiv = document.getElementById('timehistory-peaks');
      if (peaksDiv && result.peaks) {
        peaksDiv.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary);">Max Displacement</div>
              <div style="font-size: 1.1rem; font-weight: bold; color: #3b82f6;">${(result.peaks.maxDisplacement * 1000).toFixed(1)} mm</div>
            </div>
            <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary);">Max Base Shear</div>
              <div style="font-size: 1.1rem; font-weight: bold; color: #22c55e;">${(result.peaks.maxBaseShear / 1000).toFixed(1)} kN</div>
            </div>
          </div>
        `;
      }
      
      showSuccess(`Time History Complete: Max disp ${(result.peaks?.maxDisplacement * 1000 || 0).toFixed(1)}mm`);
      
      // Save to cloud
      await saveTimeHistoryToCloud(proyekId, result);
      
    } catch (err) {
      showError('Time history analysis failed: ' + err.message);
      console.error(err);
    }
  };
}

/**
 * Create sample 3-story frame for demo
 */
function createSampleFrame() {
  return {
    nodes: [
      { id: 1, x: 0, y: 0, z: 0, restraints: [1,1,1,1,1,1] },
      { id: 2, x: 0, y: 0, z: 4, restraints: [0,0,0,0,0,0] },
      { id: 3, x: 0, y: 0, z: 8, restraints: [0,0,0,0,0,0] },
      { id: 4, x: 0, y: 0, z: 12, restraints: [0,0,0,0,0,0] },
      { id: 5, x: 6, y: 0, z: 0, restraints: [1,1,1,1,1,1] },
      { id: 6, x: 6, y: 0, z: 4, restraints: [0,0,0,0,0,0] },
      { id: 7, x: 6, y: 0, z: 8, restraints: [0,0,0,0,0,0] },
      { id: 8, x: 6, y: 0, z: 12, restraints: [0,0,0,0,0,0] }
    ],
    elements: [
      { id: 1, type: 'frame', node1: 1, node2: 2, E: 30000, A: 0.16, Iy: 0.0021, Iz: 0.0021, J: 0.0042 },
      { id: 2, type: 'frame', node1: 2, node2: 3, E: 30000, A: 0.16, Iy: 0.0021, Iz: 0.0021, J: 0.0042 },
      { id: 3, type: 'frame', node1: 3, node2: 4, E: 30000, A: 0.12, Iy: 0.0014, Iz: 0.0014, J: 0.0028 },
      { id: 4, type: 'frame', node1: 5, node2: 6, E: 30000, A: 0.16, Iy: 0.0021, Iz: 0.0021, J: 0.0042 },
      { id: 5, type: 'frame', node1: 6, node2: 7, E: 30000, A: 0.16, Iy: 0.0021, Iz: 0.0021, J: 0.0042 },
      { id: 6, type: 'frame', node1: 7, node2: 8, E: 30000, A: 0.12, Iy: 0.0014, Iz: 0.0014, J: 0.0028 },
      { id: 7, type: 'frame', node1: 2, node2: 6, E: 30000, A: 0.12, Iy: 0.0014, Iz: 0.0054, J: 0.011 },
      { id: 8, type: 'frame', node1: 3, node2: 7, E: 30000, A: 0.12, Iy: 0.0014, Iz: 0.0054, J: 0.011 },
      { id: 9, type: 'frame', node1: 4, node2: 8, E: 30000, A: 0.10, Iy: 0.0010, Iz: 0.0042, J: 0.008 }
    ],
    materials: [
      { id: 'Concrete30', name: 'Concrete30', type: 'concrete', E: 30000, fc: 30 }
    ],
    sections: [
      { id: 'Col400x400', name: 'Col400x400', type: 'RECT', dimensions: [0.4, 0.4] },
      { id: 'Beam300x600', name: 'Beam300x600', type: 'RECT', dimensions: [0.3, 0.6] }
    ]
  };
}

// ============================================================
// SUPABASE & GOOGLE DRIVE INTEGRATION FUNCTIONS
// ============================================================

/**
 * Save current ETABS model to Supabase database
 */
async function saveModelToSupabase(proyekId) {
  if (!window._importedEtabsModel) {
    showError('Tidak ada model untuk disimpan');
    return false;
  }
  
  showInfo('Saving model to database...');
  const result = await saveEtabsModel(proyekId, window._importedEtabsModel, {
    importedBy: 'user',
    notes: 'Imported from ETABS/SAP2000',
    savedAt: new Date().toISOString()
  });
  
  if (result.success) {
    showSuccess('Model berhasil disimpan ke database');
    return true;
  } else {
    showError('Gagal menyimpan: ' + result.error);
    return false;
  }
}

/**
 * Load ETABS model from Supabase database
 */
async function loadModelFromSupabase(proyekId) {
  showInfo('Loading model from database...');
  const result = await loadEtabsModel(proyekId);
  
  if (result.success && result.model) {
    window._importedEtabsModel = result.model;
    renderImportedModel3D(result.model);
    showSuccess('Model berhasil dimuat dari database');
    return true;
  } else {
    showInfo('Tidak ada model tersimpan untuk proyek ini');
    return false;
  }
}

/**
 * Save FEMA 356 analysis results to cloud
 */
async function saveFemaResultsToCloud(proyekId, results) {
  if (!results) {
    showError('Tidak ada hasil analisis untuk disimpan');
    return;
  }
  
  showInfo('Saving FEMA 356 results...');
  
  // Save to Supabase
  const supabaseResult = await saveFema356Results(proyekId, results);
  
  if (supabaseResult.success) {
    // Also save to Drive as JSON
    try {
      await saveAnalysisResultsToDrive(results, proyekId, 'FEMA356');
    } catch (e) {
      console.warn('Drive save failed, but Supabase ok:', e);
    }
    
    showSuccess('Results saved to Database & Drive');
    
    // Store for report generation
    window._lastFema356Results = results;
  } else {
    showError('Gagal menyimpan: ' + supabaseResult.error);
  }
}

/**
 * Save Time History results to cloud
 */
async function saveTimeHistoryToCloud(proyekId, results) {
  if (!results) {
    showError('Tidak ada hasil analisis untuk disimpan');
    return;
  }
  
  showInfo('Saving Time History results...');
  const supabaseResult = await saveTimeHistoryResults(proyekId, results);
  
  if (supabaseResult.success) {
    showSuccess('Time History results saved to database');
    window._lastTimeHistoryResults = results;
  } else {
    showError('Gagal menyimpan: ' + supabaseResult.error);
  }
}

/**
 * Generate and upload DOCX report
 */
async function generateEtabsReport(proyekId, proyekData) {
  showInfo('Generating structural analysis report...');
  
  try {
    // Prepare data for report
    const etabsData = {
      ...window._importedEtabsModel,
      fema356Results: window._lastFema356Results,
      timeHistoryResults: window._lastTimeHistoryResults
    };
    
    // Generate DOCX blob
    const { blob, fileName } = await generateDocxBlob(
      proyekData || { nama_bangunan: 'Structural Analysis', id: proyekId },
      {},
      [],
      null, // onProgress
      null, null, null, null, null, null, null, null,
      etabsData
    );
    
    // Save to Drive first
    // uploadToGoogleDrive sudah diimport secara static di awal file
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      
      const uploadResult = await uploadToGoogleDrive(
        [{ base64, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: fileName }],
        proyekId,
        'Struktur',
        'Analysis_Report'
      );
      
      if (uploadResult && uploadResult.length > 0) {
        // Save report metadata to Supabase
        const reportResult = await saveAnalysisReport(proyekId, {
          type: 'fema356_timehistory',
          title: 'Structural Analysis Report',
          content: 'Combined FEMA 356 and Time History analysis',
          summary: {
            nodes: etabsData.nodes?.length,
            elements: etabsData.elements?.length,
            performanceLevel: window._lastFema356Results?.performanceLevel
          },
          driveFileId: uploadResult[0].id,
          docxUrl: uploadResult[0].url
        });
        
        if (reportResult.success) {
          showSuccess('Report generated and saved to Drive');
        }
      }
      
      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    reader.readAsDataURL(blob);
    
  } catch (err) {
    showError('Report generation failed: ' + err.message);
    console.error(err);
  }
}

/**
 * Helper function untuk mengumpulkan data ETABS untuk laporan
 * Digunakan oleh laporan.js untuk menyertakan data ETABS/FEMA356 di DOCX
 * @returns {Object|null} Data ETABS lengkap atau null jika tidak tersedia
 */
export function getEtabsSummary() {
  const hasModel = window._importedEtabsModel && 
    (window._importedEtabsModel.nodes?.length > 0 || 
     window._importedEtabsModel.elements?.length > 0);
  
  const hasFemaResults = window._lastFema356Results && 
    window._lastFema356Results.performanceLevel;
  
  const hasTimeHistory = window._lastTimeHistoryResults && 
    window._lastTimeHistoryResults.displacementHistory?.length > 0;

  if (!hasModel && !hasFemaResults && !hasTimeHistory) {
    return null;
  }

  return {
    ...window._importedEtabsModel,
    fema356Results: window._lastFema356Results,
    timeHistoryResults: window._lastTimeHistoryResults,
    summary: {
      hasModel,
      hasFemaResults,
      hasTimeHistory,
      nodes: window._importedEtabsModel?.nodes?.length || 0,
      elements: window._importedEtabsModel?.elements?.length || 0,
      performanceLevel: window._lastFema356Results?.performanceLevel,
      analyzedAt: window._lastFema356Results?.analyzedAt || new Date().toISOString()
    }
  };
}
