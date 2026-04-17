/**
 * PENGENDALIAN DAMPAK LINGKUNGAN MODULE
 * Modul pemeriksaan aspek lingkungan untuk SLF
 * 30 Fitur berdasarkan PP 16/2021, UU 32/2009, Permen LHK
 * UI Style: Presidential Quartz
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { openModal, confirm } from '../components/modal.js';
import {
  checkWastewaterQuality,
  calculateWaterMassBalance,
  calculateEUI,
  calculateWasteDiversion,
  calculateCarbonFootprint,
  calculateDrainageRational,
  calculateRainwaterPotential,
  calculateWaterFootprint,
  calculateGreenRatio,
  checkNoiseCompliance,
  checkVibrationCompliance,
  checkAmbientAirQuality,
  calculateEnvironmentalScore,
  checkDocumentValidity,
  estimateFugitiveEmission,
  calculateInfiltrationRequirements,
  WASTEWATER_STANDARDS,
  EUI_STANDARDS,
  NOISE_STANDARDS,
  LEGAL_REFERENCES
} from '../lib/environmental-calculators.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchEnvironmentalSummary(projectId) {
  try {
    const [documents, wastewater, waste, emissions, noise, b3, energy, water, drainage, greenspace] = await Promise.all([
      supabase.from('environmental_documents').select('*').eq('project_id', projectId),
      supabase.from('wastewater_monitoring').select('*').eq('project_id', projectId).order('sampling_date', { ascending: false }).limit(1),
      supabase.from('waste_audits').select('*').eq('project_id', projectId).order('audit_date', { ascending: false }).limit(1),
      supabase.from('air_emissions').select('*').eq('project_id', projectId).order('sampling_date', { ascending: false }).limit(1),
      supabase.from('noise_measurements').select('*').eq('project_id', projectId).order('measurement_date', { ascending: false }).limit(1),
      supabase.from('hazardous_waste').select('*').eq('project_id', projectId),
      supabase.from('energy_audits').select('*').eq('project_id', projectId).order('audit_year', { ascending: false }).limit(1),
      supabase.from('water_audits').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
      supabase.from('drainage_analysis').select('*').eq('project_id', projectId).limit(1),
      supabase.from('green_space_analysis').select('*').eq('project_id', projectId).limit(1)
    ]);

    const hasData = documents.data?.length > 0 || wastewater.data?.length > 0 || waste.data?.length > 0;
    
    // Calculate overall environmental score
    const scores = {};
    if (documents.data?.length > 0) {
      const validDocs = documents.data.filter(d => d.status === 'VALID').length;
      scores.documents = { status: validDocs === documents.data.length ? 'PASS' : 'PARTIAL' };
    }
    if (wastewater.data?.[0]) scores.wastewater = { status: wastewater.data[0].compliance_status };
    if (waste.data?.[0]) scores.waste = { status: waste.data[0].diversion_rate >= 60 ? 'PASS' : 'FAIL' };
    if (emissions.data?.[0]) scores.emission = { status: emissions.data[0].compliance_status };
    if (energy.data?.[0]) {
      const eui = calculateEUI(energy.data[0].monthly_consumption.reduce((a,b)=>a+b,0), energy.data[0].building_area, energy.data[0].building_type);
      scores.energy = { status: eui.status === 'C' ? 'PASS' : 'FAIL' };
    }
    if (water.data?.[0]) {
      const footprint = calculateWaterFootprint(water.data[0].monthly_consumption, water.data[0].occupant_count);
      scores.water = { status: footprint.status === 'GOOD' ? 'PASS' : 'FAIL' };
    }

    const overallScore = calculateEnvironmentalScore(scores);

    return {
      hasData,
      overallScore: overallScore.overallScore,
      grade: overallScore.grade,
      status: overallScore.status,
      totalDocuments: documents.data?.length || 0,
      validDocuments: documents.data?.filter(d => d.status === 'VALID').length || 0,
      wastewaterCompliance: wastewater.data?.[0]?.compliance_status || 'UNKNOWN',
      wasteDiversion: waste.data?.[0]?.diversion_rate || 0,
      eui: energy.data?.[0] ? calculateEUI(energy.data[0].monthly_consumption.reduce((a,b)=>a+b,0), energy.data[0].building_area, energy.data[0].building_type) : null,
      waterFootprint: water.data?.[0] ? calculateWaterFootprint(water.data[0].monthly_consumption, water.data[0].occupant_count) : null,
      greenRatio: greenspace.data?.[0] ? calculateGreenRatio(greenspace.data[0].green_space_area, greenspace.data[0].total_site_area) : null,
      b3Count: b3.data?.length || 0,
      nonCompliantItems: Object.values(scores).filter(s => s.status !== 'PASS').length
    };
  } catch (error) {
    console.error('Error fetching environmental summary:', error);
    return {
      hasData: false,
      overallScore: 0,
      grade: 'E',
      status: 'BELUM DINILAI',
      totalDocuments: 0,
      validDocuments: 0,
      nonCompliantItems: 0
    };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderEnvironmentalCard(project, summary = {}) {
  const statusColors = {
    'BAIK': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'SEDANG': { bg: 'hsla(45, 90%, 60%, 0.1)', text: 'var(--gold-400)', border: 'var(--gold-500)' },
    'PERLU PERBAIKAN': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'BELUM DINILAI': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' }
  };
  
  const st = statusColors[summary.status] || statusColors['BELUM DINILAI'];
  const hasData = summary.hasData;
  
  return `
    <div class="card-quartz" id="environmental-card" style="padding: var(--space-6); grid-column: 1 / -1;">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(160, 100%, 55%, 1);">
            <i class="fas fa-leaf" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: hsla(160, 100%, 55%, 1);">PHASE 02F</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Pengendalian Dampak Lingkungan</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border}44; font-size: 10px;">
            <i class="fas ${summary.grade === 'A' || summary.grade === 'B' ? 'fa-check-circle' : summary.grade === 'C' ? 'fa-circle-exclamation' : 'fa-circle-minus'}" style="margin-right: 6px;"></i>
            ${summary.status}
          </span>
          <span class="badge" style="background: hsla(160, 100%, 45%, 0.1); color: hsla(160, 100%, 55%, 1); border: 1px solid hsla(160, 100%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>PP 16/2021
          </span>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Pemeriksaan aspek pengendalian dampak lingkungan berdasarkan PP 16/2021, UU 32/2009, dan Permen LHK. Meliputi AMDAL/UKL-UPL, air limbah, sampah, emisi, kebisingan, Limbah B3, konservasi energi & air.
      </p>

      ${hasData ? `
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.overallScore}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">SCORE (${summary.grade})</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.wastewaterCompliance === 'PASS' ? 'var(--success-400)' : 'var(--danger-400)'}">${summary.validDocuments}/${summary.totalDocuments}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">DOKUMEN</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.wasteDiversion >= 60 ? 'var(--success-400)' : 'var(--warning-400)'}">${summary.wasteDiversion}%</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">DIVERSION</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.eui?.eui || '-'}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">EUI (kWh/m²)</div>
          </div>
        </div>
        
        <!-- Compliance Score -->
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">
          <div class="flex-between" style="margin-bottom: 8px;">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary);">ENVIRONMENTAL SCORE</span>
            <span style="font-size: 0.7rem; font-weight: 800; color: ${summary.overallScore >= 80 ? 'var(--success-400)' : summary.overallScore >= 60 ? 'var(--warning-400)' : 'var(--danger-400)'}">${summary.overallScore}/100</span>
          </div>
          <div style="height: 6px; background: hsla(220, 20%, 100%, 0.05); border-radius: 10px;">
            <div style="width: ${summary.overallScore}%; height: 100%; border-radius: 10px; background: ${summary.overallScore >= 80 ? 'var(--success-500)' : summary.overallScore >= 60 ? 'var(--warning-500)' : 'var(--danger-500)'}; box-shadow: 0 0 10px ${summary.overallScore >= 80 ? 'var(--success-500)' : summary.overallScore >= 60 ? 'var(--warning-500)' : 'var(--danger-500)'}66;"></div>
          </div>
          ${summary.nonCompliantItems > 0 ? `
            <div style="margin-top: 8px; font-size: 10px; color: var(--danger-400);">
              <i class="fas fa-triangle-exclamation" style="margin-right: 4px;"></i>
              ${summary.nonCompliantItems} aspek perlu perhatian
            </div>
          ` : ''}
        </div>

        <!-- Presidential Tab Navigation -->
        <div class="card-quartz" style="padding: 6px; margin-top: 24px; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
          <button onclick="window._switchEnvTab('dokumen', this)" 
                  class="env-tab-item active"
                  data-tab="dokumen"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
            <i class="fas fa-file-contract"></i> DOKUMEN
          </button>
          <button onclick="window._switchEnvTab('air', this)" 
                  class="env-tab-item"
                  data-tab="air"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-droplet"></i> AIR LIMBAH
          </button>
          <button onclick="window._switchEnvTab('sampah', this)" 
                  class="env-tab-item"
                  data-tab="sampah"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-recycle"></i> SAMPAH
          </button>
          <button onclick="window._switchEnvTab('emisi', this)" 
                  class="env-tab-item"
                  data-tab="emisi"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-smog"></i> EMISI
          </button>
          <button onclick="window._switchEnvTab('bising', this)" 
                  class="env-tab-item"
                  data-tab="bising"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-volume-high"></i> KEBISINGAN
          </button>
          <button onclick="window._switchEnvTab('energi', this)" 
                  class="env-tab-item"
                  data-tab="energi"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-bolt"></i> ENERGI
          </button>
          <button onclick="window._switchEnvTab('drainase', this)" 
                  class="env-tab-item"
                  data-tab="drainase"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-water"></i> DRAINASE
          </button>
        </div>

        <!-- TAB CONTENT: DOKUMEN -->
        <div id="env-tab-dokumen" class="env-tab-content active" style="margin-top: 20px;">
          ${renderDokumenTab()}
        </div>

        <!-- TAB CONTENT: AIR LIMBAH -->
        <div id="env-tab-air" class="env-tab-content" style="display: none; margin-top: 20px;">
          ${renderAirLimbahTab()}
        </div>

        <!-- TAB CONTENT: SAMPAH -->
        <div id="env-tab-sampah" class="env-tab-content" style="display: none; margin-top: 20px;">
          ${renderSampahTab()}
        </div>

        <!-- TAB CONTENT: EMISI -->
        <div id="env-tab-emisi" class="env-tab-content" style="display: none; margin-top: 20px;">
          ${renderEmisiTab()}
        </div>

        <!-- TAB CONTENT: KEBISINGAN -->
        <div id="env-tab-bising" class="env-tab-content" style="display: none; margin-top: 20px;">
          ${renderKebisinganTab()}
        </div>

        <!-- TAB CONTENT: ENERGI -->
        <div id="env-tab-energi" class="env-tab-content" style="display: none; margin-top: 20px;">
          ${renderEnergiTab()}
        </div>

        <!-- TAB CONTENT: DRAINASE -->
        <div id="env-tab-drainase" class="env-tab-content" style="display: none; margin-top: 20px;">
          ${renderDrainaseTab()}
        </div>
      ` : `
        <div style="margin-top: 20px; padding: 24px; background: hsla(220, 20%, 100%, 0.02); border: 1px dashed hsla(220, 20%, 100%, 0.1); border-radius: 12px; text-align: center;">
          <i class="fas fa-leaf" style="font-size: 2rem; color: var(--text-tertiary); margin-bottom: 12px;"></i>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Belum ada data pengendalian dampak lingkungan</p>
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">Mulai analisis dengan validasi dokumen lingkungan dan input parameter monitoring</p>
          <button onclick="window._initEnvironmentalAnalysis('${project.id}')" class="btn btn-primary btn-sm">
            <i class="fas fa-play" style="margin-right: 6px;"></i> Mulai Analisis
          </button>
        </div>
      `}

      <style>
        .env-tab-item:hover { background: hsla(220, 20%, 100%, 0.05); }
        .env-tab-item.active { background: var(--gradient-brand) !important; color: white !important; }
        .env-tab-content { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      </style>
    </div>
  `;
}

// ============================================================
// 3. TAB CONTENT RENDERERS
// ============================================================

function renderDokumenTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Document Validator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-file-contract"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Validasi Dokumen LH</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">AMDAL/UKL-UPL/DELH/DPLH</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jenis Dokumen</label>
          <select id="env-doc-type" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="AMDAL">AMDAL (5 tahun)</option>
            <option value="UKL_UPL">UKL-UPL (3 tahun)</option>
            <option value="DELH">DELH (1 tahun)</option>
            <option value="DPLH">DPLH (1 tahun)</option>
          </select>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tanggal Terbit</label>
            <input type="date" id="env-doc-issue" class="form-input" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Nomor Registrasi</label>
            <input type="text" id="env-doc-number" class="form-input" placeholder="No. Reg" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._checkDocumentValidity()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Validitas
        </button>
        
        <div id="env-doc-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Dokumen Recommendation -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-sitemap"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Rekomendasi Dokumen</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Decision Tree Logic</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Bangunan (m²)</label>
            <input type="number" id="env-building-area" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kapasitas Orang</label>
            <input type="number" id="env-capacity" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._recommendDocument()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-lightbulb" style="margin-right: 6px;"></i> Rekomendasikan
        </button>
        
        <div id="env-recommend-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Cross-Check Izin -->
      <div class="card-quartz" style="padding: 20px; grid-column: 1 / -1;">
        <div style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-crosshairs" style="margin-right: 8px; color: var(--brand-400);"></i>Cross-Check Izin Lingkungan
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Nama Pengusaha</label>
            <input type="text" id="env-business-name" class="form-input" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Nama Pemilik Gedung</label>
            <input type="text" id="env-owner-name" class="form-input" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Instansi Penerbit</label>
            <input type="text" id="env-issuer" class="form-input" placeholder="DLH/DPMPTSP" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._crossCheckPermit()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-search" style="margin-right: 6px;"></i> Cross-Check
        </button>
      </div>
    </div>
  `;
}

function renderAirLimbahTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Water Quality Input -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-droplet"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Monitoring Kualitas Efluen</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Permen LHK 68/2016</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">pH</label>
            <input type="number" id="env-ph" class="form-input" placeholder="6-9" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">BOD (mg/L)</label>
            <input type="number" id="env-bod" class="form-input" placeholder="≤30" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">COD (mg/L)</label>
            <input type="number" id="env-cod" class="form-input" placeholder="≤100" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">TSS (mg/L)</label>
            <input type="number" id="env-tss" class="form-input" placeholder="≤50" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Amonia (mg/L)</label>
            <input type="number" id="env-ammonia" class="form-input" placeholder="≤10" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Minyak (mg/L)</label>
            <input type="number" id="env-oil" class="form-input" placeholder="≤5" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Badan Air Penerima</label>
          <select id="env-water-body" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="RIVER">Sungai (lebih ketat)</option>
            <option value="SEA">Laut (lebih longgar)</option>
            <option value="LAKE">Danau</option>
          </select>
        </div>
        
        <button onclick="window._checkWastewaterQuality()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-flask" style="margin-right: 6px;"></i> Validasi Baku Mutu
        </button>
        
        <div id="env-wastewater-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Mass Balance -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-scale-balanced"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Mass Balance Air</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Neraca Masuk vs Keluar</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Air Bersih Masuk (m³/bln)</label>
            <input type="number" id="env-water-in" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Air Kotor Keluar (m³/bl)</label>
            <input type="number" id="env-water-out" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Air Hujan Masuk (m³/bl)</label>
            <input type="number" id="env-rain-in" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Penguapan (m³/bl)</label>
            <input type="number" id="env-evap" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._calculateWaterBalance()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Neraca
        </button>
        
        <div id="env-balance-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- IPAL Analysis -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-filter"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Analisis IPAL</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Removal Efficiency</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">BOD Influent (mg/L)</label>
            <input type="number" id="env-bod-in" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">BOD Effluent (mg/L)</label>
            <input type="number" id="env-bod-out" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tipe IPAL</label>
          <select id="env-ipal-type" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="BIOFILTER">Biofilter Anaerob-Aerob</option>
            <option value="STP">Small Treatment Plant</option>
            <option value="WETLAND">Constructed Wetland</option>
            <option value="SEPTIC">Septic Tank + Resapan</option>
          </select>
        </div>
        
        <button onclick="window._calculateIPALEfficiency()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-chart-line" style="margin-right: 6px;"></i> Hitung Efisiensi
        </button>
        
        <div id="env-ipal-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Rainwater Harvesting -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(200, 100%, 55%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(200, 100%, 55%, 1);">
            <i class="fas fa-cloud-rain"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Rainwater Harvesting</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Potensi Air Hujan</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Atap (m²)</label>
            <input type="number" id="env-roof-area" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Curah Hujan (mm/th)</label>
            <input type="number" id="env-rainfall" class="form-input" placeholder="2000-3000" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kapasitas Tangki (m³)</label>
          <input type="number" id="env-tank-capacity" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._calculateRainwater()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(200, 100%, 55%, 0.2); border-color: hsla(200, 100%, 55%, 0.3); color: hsla(200, 100%, 55%, 1);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Potensi
        </button>
        
        <div id="env-rainwater-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderSampahTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Waste Audit -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(100, 60%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(100, 60%, 55%, 1);">
            <i class="fas fa-recycle"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Waste Audit</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Komposisi & Karakteristik</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Total Sampah (kg/hari)</label>
          <input type="number" id="env-waste-total" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Organik (kg)</label>
            <input type="number" id="env-waste-organic" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Plastik (kg)</label>
            <input type="number" id="env-waste-plastic" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kertas (kg)</label>
            <input type="number" id="env-waste-paper" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Logam (kg)</label>
            <input type="number" id="env-waste-metal" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kaca (kg)</label>
            <input type="number" id="env-waste-glass" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Residu (kg)</label>
            <input type="number" id="env-waste-residual" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._calculateWasteDiversion()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(100, 60%, 45%, 0.2); border-color: hsla(100, 60%, 45%, 0.3); color: hsla(100, 60%, 55%, 1);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Diversion Rate
        </button>
        
        <div id="env-waste-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- TPS Analysis -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-trash-can"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Monitoring TPS/TPS 3R</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Kondisi & Layout</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas TPS (m²)</label>
            <input type="number" id="env-tps-area" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jarak ke Bangunan (m)</label>
            <input type="number" id="env-tps-distance" class="form-input" placeholder="min 10m" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; flex: 1;">
            <input type="checkbox" id="env-tps-ventilation" style="accent-color: var(--brand-500);">
            <span>Ventilasi</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; flex: 1;">
            <input type="checkbox" id="env-tps-paving" style="accent-color: var(--brand-500);">
            <span>Paving</span>
          </label>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jumlah Tempat Pemilahan</label>
          <select id="env-tps-bins" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="0">0 - Tidak ada pemilahan</option>
            <option value="2">2 - Organik & Anorganik</option>
            <option value="3">3 - + Residu</option>
            <option value="4">4 - + B3 (Standar)</option>
          </select>
        </div>
        
        <button onclick="window._checkTPSCompliance()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Kelayakan TPS
        </button>
        
        <div id="env-tps-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderEmisiTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Ambient Air Quality -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(200, 100%, 55%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(200, 100%, 55%, 1);">
            <i class="fas fa-wind"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Kualitas Udara Ambien</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Permen LHK 22/2021</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">PM10 (μg/m³)</label>
            <input type="number" id="env-pm10" class="form-input" placeholder="≤150" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">PM2.5 (μg/m³)</label>
            <input type="number" id="env-pm25" class="form-input" placeholder="≤65" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">SO₂ (μg/m³)</label>
            <input type="number" id="env-so2" class="form-input" placeholder="≤365" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">NO₂ (μg/m³)</label>
            <input type="number" id="env-no2" class="form-input" placeholder="≤200" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._checkAmbientAir()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(200, 100%, 55%, 0.2); border-color: hsla(200, 100%, 55%, 0.3); color: hsla(200, 100%, 55%, 1);">
          <i class="fas fa-lungs" style="margin-right: 6px;"></i> Cek Kualitas Udara
        </button>
        
        <div id="env-air-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Fugitive Emission -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-smog"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Emisi Difus (Fugitive)</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Estimasi Area Parkir, Dapur</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Sumber Emisi</label>
          <select id="env-emission-source" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="PARKING">Area Parkir (kendaraan)</option>
            <option value="KITCHEN">Dapur/Restoran</option>
            <option value="GENERATOR">Genset</option>
            <option value="COLD_STORAGE">Cold Storage</option>
          </select>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Area/Unit (m²/jumlah)</label>
            <input type="number" id="env-emission-size" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jam Operasi/hari</label>
            <input type="number" id="env-emission-hours" class="form-input" placeholder="8" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._estimateFugitiveEmission()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Estimasi Emisi
        </button>
        
        <div id="env-emission-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderKebisinganTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Noise Measurement -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(280, 60%, 55%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(280, 60%, 65%, 1);">
            <i class="fas fa-volume-high"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Monitoring Kebisingan</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Kepmen LH 48/1996</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Level dB(A)</label>
            <input type="number" id="env-noise-level" class="form-input" placeholder="dB(A)" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Waktu</label>
            <select id="env-noise-time" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
              <option value="day">Siang (06-22)</option>
              <option value="night">Malam (22-06)</option>
            </select>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jenis Area</label>
          <select id="env-noise-area" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="residential">Permukiman (≤55 dB)</option>
            <option value="commercial">Komersial (≤65 dB)</option>
            <option value="industrial">Industri (≤70 dB)</option>
            <option value="hospital">RS/Sekolah (≤55 dB)</option>
          </select>
        </div>
        
        <button onclick="window._checkNoiseCompliance()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(280, 60%, 55%, 0.2); border-color: hsla(280, 60%, 55%, 0.3); color: hsla(280, 60%, 65%, 1);">
          <i class="fas fa-ear-listen" style="margin-right: 6px;"></i> Cek Baku Mutu
        </button>
        
        <div id="env-noise-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Vibration Check -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(320, 60%, 55%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(320, 60%, 65%, 1);">
            <i class="fas fa-wave-square"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Getaran Operasional</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 03-6884-2002</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">PPV (mm/s)</label>
            <input type="number" id="env-vibration-ppv" class="form-input" placeholder="<0.3" step="0.01" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Frekuensi (Hz)</label>
            <input type="number" id="env-vibration-freq" class="form-input" placeholder="50" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <div style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 12px; padding: 10px; background: hsla(220, 20%, 100%, 0.02); border-radius: 8px;">
          <strong>Sumber Getaran:</strong> Genset, Pompa, Elevator, AC Chiller<br>
          <strong>Batas:</strong> < 0.3 mm/s (tidak mengganggu kenyamanan)
        </div>
        
        <button onclick="window._checkVibration()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(320, 60%, 55%, 0.2); border-color: hsla(320, 60%, 55%, 0.3); color: hsla(320, 60%, 65%, 1);">
          <i class="fas fa-chart-line" style="margin-right: 6px;"></i> Cek Getaran
        </button>
        
        <div id="env-vibration-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderEnergiTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Energy Audit / EUI -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-bolt"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Audit Energi (EUI)</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 03-6196-2000</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tagihan Listrik Tahunan (kWh)</label>
          <input type="number" id="env-annual-kwh" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Bangunan (m²)</label>
            <input type="number" id="env-building-area-energy" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tipe Bangunan</label>
            <select id="env-building-type" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
              <option value="office">Kantor (std: 240)</option>
              <option value="hotel">Hotel (std: 300)</option>
              <option value="hospital">Rumah Sakit (std: 380)</option>
              <option value="mall">Mall (std: 350)</option>
              <option value="residential">Hunian (std: 150)</option>
              <option value="school">Sekolah (std: 200)</option>
            </select>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Konsumsi Solar/Liter (opsional)</label>
          <input type="number" id="env-diesel" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._calculateEUI()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung EUI & Karbon
        </button>
        
        <div id="env-eui-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Energy Efficiency Savings -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-lightbulb"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Potensi Penghematan</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Efisiensi Energi</div>
          </div>
        </div>
        
        <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
            <span>LED Retrofit</span>
            <span style="color: var(--success-400);">-40%</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
            <span>AC Inverter</span>
            <span style="color: var(--success-400);">-30%</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
            <span>Smart Sensors</span>
            <span style="color: var(--success-400);">-15%</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>Solar Panel 10kWp</span>
            <span style="color: var(--success-400);">-20%</span>
          </div>
        </div>
        
        <button onclick="window._showEnergyMeasures()" class="btn btn-ghost btn-sm" style="width: 100%;">
          <i class="fas fa-list-check" style="margin-right: 6px;"></i> Detail Rekomendasi
        </button>
      </div>
    </div>
  `;
}

function renderDrainaseTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Rational Method -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(200, 100%, 55%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(200, 100%, 55%, 1);">
            <i class="fas fa-water"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Analisis Drainase</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Rational Method Q = C × I × A / 360</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Catchment (m²)</label>
            <input type="number" id="env-catchment-area" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Koefisien Runoff (C)</label>
            <select id="env-runoff-coeff" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
              <option value="0.9">Beton/Aspal (0.9)</option>
              <option value="0.7">Tanah Padat (0.7)</option>
              <option value="0.3">Vegetasi (0.3)</option>
              <option value="0.5">Campuran (0.5)</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Intensitas Hujan (mm/jam)</label>
            <input type="number" id="env-rain-intensity" class="form-input" placeholder="50-100" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Waktu Konsentrasi (min)</label>
            <input type="number" id="env-time-conc" class="form-input" placeholder="15" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._calculateDrainage()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(200, 100%, 55%, 0.2); border-color: hsla(200, 100%, 55%, 0.3); color: hsla(200, 100%, 55%, 1);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Debit Limpasan
        </button>
        
        <div id="env-drainage-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Infiltration Wells -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-arrow-down-to-bracket"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Sumur Resapan</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Biopori/Recharge Well</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jumlah Sumur</label>
            <input type="number" id="env-well-count" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Diameter (m)</label>
            <input type="number" id="env-well-diameter" class="form-input" placeholder="1.0" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kedalaman (m)</label>
            <input type="number" id="env-well-depth" class="form-input" placeholder="2.0" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Lahan (m²)</label>
            <input type="number" id="env-site-area" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <button onclick="window._calculateInfiltration()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Kapasitas Resapan
        </button>
        
        <div id="env-infiltration-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Flood Risk Assessment -->
      <div class="card-quartz" style="padding: 20px; grid-column: 1 / -1;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-house-flood-water"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Assessmen Risiko Banjir</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Elevasi & Riwayat Banjir</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Elevasi Lantai Dasar (m)</label>
            <input type="number" id="env-floor-elevation" class="form-input" placeholder="0" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Elevasi Jalan (m)</label>
            <input type="number" id="env-road-elevation" class="form-input" placeholder="0" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Elevasi Banjir 100-th (m)</label>
            <input type="number" id="env-flood-elevation" class="form-input" placeholder="0" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Riwayat Banjir</label>
            <select id="env-flood-history" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
              <option value="false">Tidak Pernah</option>
              <option value="true">Pernah Terjadi</option>
            </select>
          </div>
        </div>
        
        <button onclick="window._checkFloodRisk()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-triangle-exclamation" style="margin-right: 6px;"></i> Asses Risiko Banjir
        </button>
        
        <div id="env-flood-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

// ============================================================
// 4. INITIALIZATION HANDLERS
// ============================================================

export function initEnvironmentalHandlers(projectId) {
  // Tab switching - Scoped to environmental-card only
  window._switchEnvTab = (tabId, btn) => {
    const card = document.getElementById('environmental-card');
    if (!card) {
      console.error('[Environmental] Card not found');
      return;
    }

    // Update button states - scoped within card
    card.querySelectorAll('.env-tab-item').forEach(b => {
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
    card.querySelectorAll('.env-tab-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });

    const targetContent = card.querySelector(`#env-tab-${tabId}`);
    if (targetContent) {
      targetContent.style.display = 'block';
      targetContent.classList.add('active');
    } else {
      console.warn(`[Environmental] Tab content not found: env-tab-${tabId}`);
    }
  };

  // Initialize Environmental Analysis
  window._initEnvironmentalAnalysis = (id) => {
    navigate('environmental-impact', { id });
  };

  // Document Validity Check
  window._checkDocumentValidity = () => {
    const docType = document.getElementById('env-doc-type')?.value;
    const issueDate = document.getElementById('env-doc-issue')?.value;
    const expiryDate = document.getElementById('env-doc-expiry')?.value;
    
    if (!issueDate) {
      showError('Masukkan tanggal terbit dokumen');
      return;
    }
    
    const result = checkDocumentValidity(docType, issueDate, expiryDate);
    const resultDiv = document.getElementById('env-doc-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      const statusColor = result.status === 'VALID' ? 'var(--success-400)' : result.status === 'EXPIRING_SOON' ? 'var(--warning-400)' : 'var(--danger-400)';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'VALID' ? 'hsla(160, 100%, 45%, 0.1)' : result.status === 'EXPIRING_SOON' ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'VALID' ? 'hsla(160, 100%, 45%, 0.2)' : result.status === 'EXPIRING_SOON' ? 'hsla(45, 90%, 60%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Status: <strong style="color: ${statusColor};">${result.status}</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Masa Berlaku: ${result.validityPeriod}</div>
          ${result.daysUntilExpiry ? `<div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Sisa: ${result.daysUntilExpiry} hari</div>` : ''}
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; padding-top: 8px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">${result.recommendation}</div>
        </div>
      `;
    }
    
    showSuccess(result.recommendation);
  };

  // Document Recommendation
  window._recommendDocument = () => {
    const buildingArea = parseFloat(document.getElementById('env-building-area')?.value);
    const capacity = parseInt(document.getElementById('env-capacity')?.value);
    
    if (!buildingArea || !capacity) {
      showError('Masukkan luas bangunan dan kapasitas');
      return;
    }
    
    const result = EnvironmentalDocument.determineRequiredDocument(buildingArea, capacity);
    const resultDiv = document.getElementById('env-recommend-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px; border: 1px solid hsla(220, 95%, 52%, 0.2);">
          <div style="font-size: 0.9rem; font-weight: 700; color: var(--brand-400);">${result.type}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${result.description}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px;">Referensi: Permen LHK 4/2021</div>
        </div>
      `;
    }
    
    showSuccess(`Rekomendasi: ${result.type}`);
  };

  // Wastewater Quality Check
  window._checkWastewaterQuality = () => {
    const labResults = {
      ph: parseFloat(document.getElementById('env-ph')?.value),
      bod: parseFloat(document.getElementById('env-bod')?.value),
      cod: parseFloat(document.getElementById('env-cod')?.value),
      tss: parseFloat(document.getElementById('env-tss')?.value),
      ammonia: parseFloat(document.getElementById('env-ammonia')?.value),
      oil: parseFloat(document.getElementById('env-oil')?.value)
    };
    
    const waterBodyType = document.getElementById('env-water-body')?.value || 'RIVER';
    const result = checkWastewaterQuality(labResults, waterBodyType);
    const resultDiv = document.getElementById('env-wastewater-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      const statusColor = result.overallStatus === 'C' ? 'var(--success-400)' : 'var(--danger-400)';
      
      let paramsHtml = '';
      for (const [param, data] of Object.entries(result.parameters)) {
        const paramColor = data.status === 'C' ? 'var(--success-400)' : 'var(--danger-400)';
        paramsHtml += `<div style="display: flex; justify-content: space-between; font-size: 0.75rem; padding: 4px 0; border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
          <span style="text-transform: uppercase;">${param}</span>
          <span style="color: ${paramColor};">${data.value} ${data.unit} (${data.status})</span>
        </div>`;
      }
      
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.overallStatus === 'C' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.overallStatus === 'C' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.9rem; font-weight: 700; color: ${statusColor}; margin-bottom: 8px;">Status: ${result.overallStatus}</div>
          ${paramsHtml}
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; padding-top: 8px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">${result.recommendation}</div>
        </div>
      `;
    }
    
    showSuccess(result.recommendation);
  };

  // Water Balance Calculation
  window._calculateWaterBalance = () => {
    const data = {
      cleanWaterInflow: parseFloat(document.getElementById('env-water-in')?.value) || 0,
      wastewaterOutflow: parseFloat(document.getElementById('env-water-out')?.value) || 0,
      rainwaterInflow: parseFloat(document.getElementById('env-rain-in')?.value) || 0,
      evaporationLoss: parseFloat(document.getElementById('env-evap')?.value) || 0
    };
    
    const result = calculateWaterMassBalance(data);
    const resultDiv = document.getElementById('env-balance-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'GOOD' ? 'hsla(160, 100%, 45%, 0.1)' : result.status === 'MODERATE' ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'GOOD' ? 'hsla(160, 100%, 45%, 0.2)' : result.status === 'MODERATE' ? 'hsla(45, 90%, 60%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Efisiensi: <strong>${result.efficiency}%</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Total Masuk: ${result.totalInflow} m³/bl</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Total Keluar: ${result.totalOutflow} m³/bl</div>
          <div style="font-size: 0.8rem; color: ${result.lossPercentage > 20 ? 'var(--danger-400)' : 'var(--text-tertiary)'}; margin-top: 4px;">Kehilangan: ${result.lossPercentage}%</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; padding-top: 8px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">${result.recommendation}</div>
        </div>
      `;
    }
    
    showSuccess(result.recommendation);
  };

  // Rainwater Harvesting
  window._calculateRainwater = () => {
    const catchmentArea = parseFloat(document.getElementById('env-roof-area')?.value) || 0;
    const annualRainfall = parseFloat(document.getElementById('env-rainfall')?.value) || 0;
    const tankCapacity = parseFloat(document.getElementById('env-tank-capacity')?.value) || 0;
    
    const result = calculateRainwaterPotential(catchmentArea, annualRainfall);
    const resultDiv = document.getElementById('env-rainwater-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: hsla(200, 100%, 55%, 0.1); border-radius: 8px; border: 1px solid hsla(200, 100%, 55%, 0.2);">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Potensi: <strong>${result.potentialVolumeFormatted}</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Rata-rata Bulanan: ${result.monthlyAverage} m³/bl</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Rata-rata Harian: ${result.dailyAverage} m³/hari</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; padding-top: 8px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">${result.recommendation}</div>
        </div>
      `;
    }
    
    showSuccess(result.recommendation);
  };

  // Waste Diversion Calculation
  window._calculateWasteDiversion = () => {
    const composition = {
      organic: parseFloat(document.getElementById('env-waste-organic')?.value) || 0,
      plastic: parseFloat(document.getElementById('env-waste-plastic')?.value) || 0,
      paper: parseFloat(document.getElementById('env-waste-paper')?.value) || 0,
      metal: parseFloat(document.getElementById('env-waste-metal')?.value) || 0,
      glass: parseFloat(document.getElementById('env-waste-glass')?.value) || 0,
      residual: parseFloat(document.getElementById('env-waste-residual')?.value) || 0
    };
    
    const result = calculateWasteDiversion(composition);
    const resultDiv = document.getElementById('env-waste-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'C' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'C' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Diversion Rate: <strong style="color: ${result.status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">${result.diversionFormatted}</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Landfill Rate: ${result.landfillRate}%</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Target Zero Waste: ${result.zeroWasteTarget}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; padding-top: 8px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">${result.recommendation}</div>
        </div>
      `;
    }
    
    showSuccess(result.recommendation);
  };

  // EUI Calculation
  window._calculateEUI = () => {
    const annualKWh = parseFloat(document.getElementById('env-annual-kwh')?.value) || 0;
    const buildingArea = parseFloat(document.getElementById('env-building-area-energy')?.value) || 0;
    const buildingType = document.getElementById('env-building-type')?.value || 'office';
    const diesel = parseFloat(document.getElementById('env-diesel')?.value) || 0;
    
    const euiResult = calculateEUI(annualKWh, buildingArea, buildingType);
    const carbonResult = calculateCarbonFootprint(annualKWh, diesel, buildingArea);
    const resultDiv = document.getElementById('env-eui-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${euiResult.status === 'C' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${euiResult.status === 'C' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">EUI: <strong>${euiResult.euiFormatted}</strong> (std: ${euiResult.standardEUI})</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Efisiensi: ${euiResult.efficiencyFormatted} - ${euiResult.grade}</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Emisi CO₂: ${carbonResult.totalEmission}</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Pohon Dibutuhkan: ${carbonResult.treesNeeded}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; padding-top: 8px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">${euiResult.recommendation}</div>
        </div>
      `;
    }
    
    showSuccess(euiResult.recommendation);
  };

  // Drainage Calculation
  window._calculateDrainage = () => {
    const area = parseFloat(document.getElementById('env-catchment-area')?.value) || 0;
    const runoffCoeff = parseFloat(document.getElementById('env-runoff-coeff')?.value) || 0.9;
    const rainIntensity = parseFloat(document.getElementById('env-rain-intensity')?.value) || 0;
    const timeConc = parseFloat(document.getElementById('env-time-conc')?.value) || 15;
    
    const result = calculateDrainageRational(area, runoffCoeff, rainIntensity, timeConc);
    const resultDiv = document.getElementById('env-drainage-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Debit Puncak: <strong>${result.peakDischargeFormatted}</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Volume/Jam: ${result.volumeHourlyFormatted}</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Sumur Resapan: ${result.infiltrationWellsNeeded} unit</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; padding-top: 8px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">${result.recommendation}</div>
        </div>
      `;
    }
    
    showSuccess(result.recommendation);
  };

  // Infiltration Wells Calculation
  window._calculateInfiltration = () => {
    const wellCount = parseInt(document.getElementById('env-well-count')?.value) || 0;
    const diameter = parseFloat(document.getElementById('env-well-diameter')?.value) || 1;
    const depth = parseFloat(document.getElementById('env-well-depth')?.value) || 2;
    const siteArea = parseFloat(document.getElementById('env-site-area')?.value) || 0;
    
    const totalVolume = wellCount * (Math.PI * Math.pow(diameter / 2, 2) * depth);
    const infiltrationRate = totalVolume * 0.5; // 50% efisiensi
    const percentage = siteArea > 0 ? (infiltrationRate / (siteArea * 0.001)) * 100 : 0;
    
    const resultDiv = document.getElementById('env-infiltration-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${percentage >= 30 ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${percentage >= 30 ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Total Volume Sumur: <strong>${totalVolume.toFixed(2)} m³</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Kapasitas Resapan: ${infiltrationRate.toFixed(2)} m³/hari</div>
          <div style="font-size: 0.8rem; color: ${percentage >= 30 ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 4px;">Infiltrasi: ${percentage.toFixed(1)}% (target: 30%)</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; padding-top: 8px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">${percentage >= 30 ? 'Memenuhi persyaratan Permen PU 20/2020' : `Tambah ${Math.ceil((30 - percentage) / 5)} sumur untuk mencapai target 30%`}</div>
        </div>
      `;
    }
    
    showSuccess(percentage >= 30 ? 'Kapasitas resapan memenuhi persyaratan' : 'Perlu tambahan sumur resapan');
  };

  // Other handlers
  window._crossCheckPermit = () => showInfo('Cross-check memerlukan integrasi dengan API DPMPTSP');
  window._calculateIPALEfficiency = () => showInfo('Fitur analisis IPAL lengkap tersedia di halaman detail');
  window._checkTPSCompliance = () => showInfo('Fitur monitoring TPS lengkap tersedia di halaman detail');
  window._checkAmbientAir = () => showInfo('Fitur pemantauan udara ambien lengkap tersedia di halaman detail');
  window._estimateFugitiveEmission = () => showInfo('Fitur estimasi emisi difus lengkap tersedia di halaman detail');
  window._checkNoiseCompliance = () => showInfo('Fitur monitoring kebisingan lengkap tersedia di halaman detail');
  window._checkVibration = () => showInfo('Fitur monitoring getaran lengkap tersedia di halaman detail');
  window._checkFloodRisk = () => showInfo('Fitur asesmen risiko banjir lengkap tersedia di halaman detail');
  window._showEnergyMeasures = () => showInfo('Detail rekomendasi efisiensi energi tersedia di halaman detail');
}

