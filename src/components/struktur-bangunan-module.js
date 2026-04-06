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
 * Initialize Struktur Bangunan Module Event Handlers
 */
export function initStrukturBangunanHandlers(proyekId) {
  // Tab switching
  window._switchStrukturTab = (tabId, btn) => {
    // Update button states
    document.querySelectorAll('.struktur-tab-item').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = 'var(--text-tertiary)';
    });
    btn.classList.add('active');
    btn.style.background = 'var(--gradient-brand)';
    btn.style.color = 'white';

    // Show/hide content
    document.querySelectorAll('.struktur-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    const targetContent = document.getElementById(`struktur-tab-${tabId}`);
    if (targetContent) targetContent.style.display = 'block';
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
}
