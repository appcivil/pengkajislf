/**
 * SISTEM PROTEKSI PETIR (LPS) MODULE
 * Lightning Protection System Inspection Component
 * Berdasarkan SNI 03-7015-2014 (mengacu pada IEC 62305 series)
 * UI Style: Presidential Quartz (matching struktur-bangunan-module.js)
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { 
  calculateRiskAssessment,
  calculateRollingSphereProtection,
  calculateProtectionZone,
  calculateMeshRequirements,
  calculateSingleRodResistance,
  calculateMultipleRodResistance,
  classifySoil,
  getGroundingTarget,
  calculateSoilResistivity,
  calculateSeparationDistance,
  SEPARATION_FACTORS,
  checkSeparationCompliance,
  LPL_LEVELS,
  LPZ_ZONES,
  SPD_TYPES,
  ENVIRONMENT_FACTORS,
  BUILDING_CLASSES,
  evaluateContinuityTest,
  evaluateGroundingTest,
  getSNIReference
} from '../lib/lps-calculators.js';

/**
 * Fetch LPS summary for a project
 */
export async function fetchLPSSummary(proyekId) {
  try {
    // Get risk assessments
    const { data: riskData, error: riskError } = await supabase
      .from('lightning_risk_assessments')
      .select('*')
      .eq('project_id', proyekId)
      .order('created_at', { ascending: false });
    
    if (riskError) throw riskError;
    
    // Get LPS components
    const { data: components, error: compError } = await supabase
      .from('lps_components')
      .select('*')
      .eq('project_id', proyekId)
      .order('created_at', { ascending: false });
    
    if (compError) throw compError;
    
    // Get grounding tests
    const { data: groundingTests, error: groundError } = await supabase
      .from('lps_grounding_tests')
      .select('*')
      .eq('project_id', proyekId)
      .order('test_date', { ascending: false });
    
    if (groundError) throw groundError;
    
    // Get visual inspections
    const { data: inspections, error: inspectError } = await supabase
      .from('lps_inspections')
      .select('*')
      .eq('project_id', proyekId)
      .order('inspection_date', { ascending: false });
    
    if (inspectError) throw inspectError;
    
    // Calculate summary stats
    const hasRiskAssessment = riskData && riskData.length > 0;
    const latestRisk = hasRiskAssessment ? riskData[0] : null;
    const isRequired = latestRisk?.is_required || false;
    
    const totalAirTerminals = components?.filter(c => c.component_type === 'AIR_TERMINAL').length || 0;
    const totalDownConductors = components?.filter(c => c.component_type === 'DOWN_CONDUCTOR').length || 0;
    const totalGroundingPoints = components?.filter(c => c.component_type === 'EARTHING').length || 0;
    
    const passedGroundingTests = groundingTests?.filter(t => t.status === 'PASS').length || 0;
    const failedGroundingTests = groundingTests?.filter(t => t.status === 'FAIL').length || 0;
    
    const latestInspection = inspections?.[0] || null;
    
    return {
      hasAssessment: hasRiskAssessment,
      latestRisk,
      isRequired,
      lplLevel: latestRisk?.lpl_level || null,
      riskValue: latestRisk?.risk_calculated || null,
      
      totalComponents: components?.length || 0,
      totalAirTerminals,
      totalDownConductors,
      totalGroundingPoints,
      
      totalGroundingTests: groundingTests?.length || 0,
      passedGroundingTests,
      failedGroundingTests,
      
      totalInspections: inspections?.length || 0,
      latestInspection,
      latestInspectionDate: latestInspection?.inspection_date || null,
      
      hasData: hasRiskAssessment || (components?.length > 0) || (groundingTests?.length > 0),
      components: components || [],
      groundingTests: groundingTests || [],
      inspections: inspections || []
    };
  } catch (error) {
    console.error('Error fetching LPS summary:', error);
    return {
      hasAssessment: false,
      latestRisk: null,
      isRequired: false,
      hasData: false,
      totalComponents: 0,
      totalAirTerminals: 0,
      totalDownConductors: 0,
      totalGroundingPoints: 0,
      totalGroundingTests: 0,
      passedGroundingTests: 0,
      failedGroundingTests: 0,
      totalInspections: 0,
      components: [],
      groundingTests: [],
      inspections: []
    };
  }
}

/**
 * Render LPS Module Card (untuk halaman proyek-detail)
 */
export function renderLPSCard(p, summary = {}) {
  const hasData = summary.hasData;
  const isRequired = summary.isRequired;
  const lplLevel = summary.lplLevel;
  
  const statusColor = !hasData ? 'var(--text-tertiary)' : 
                     isRequired ? 'var(--warning-400)' : 
                     'var(--success-400)';
  
  const statusIcon = !hasData ? 'fa-circle-minus' : 
                    isRequired ? 'fa-bolt' : 
                    'fa-check-circle';
  
  const statusText = !hasData ? 'BELUM DINILAI' : 
                    isRequired ? `WAJIB LPS ${lplLevel || ''}` : 
                    'TIDAK WAJIB';
  
  return `
    <div class="card-quartz" id="lps-module-card" style="padding: var(--space-6); grid-column: 1 / -1;">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-bolt" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--gold-400);">PHASE 02D</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Sistem Proteksi Petir</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="badge" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40; font-size: 10px;">
            <i class="fas ${statusIcon}" style="margin-right: 6px;"></i>${statusText}
          </span>
          <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); border: 1px solid hsla(45, 90%, 60%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>SNI 03-7015-2014
          </span>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi sistem proteksi petir berdasarkan SNI 03-7015-2014 (IEC 62305). Meliputi risk assessment, rolling sphere analysis, grounding test, dan compliance check.
      </p>

      ${hasData ? `
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.totalAirTerminals}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">AIR TERMINAL</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.failedGroundingTests > 0 ? 'var(--danger-400)' : 'var(--success-400)'};">${summary.totalGroundingPoints}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">GROUNDING</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.failedGroundingTests > 0 ? 'var(--danger-400)' : 'var(--success-400)'};">${summary.totalGroundingTests}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">TEST RESULT</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.totalInspections}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">INSPECTION</div>
          </div>
        </div>

        ${summary.latestRisk ? `
          <div style="background: hsla(220, 20%, 100%, 0.03); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 10px; color: var(--text-tertiary); margin-bottom: 4px;">RISK ASSESSMENT</div>
                <div style="font-size: 14px; color: white; font-weight: 600;">
                  R = ${summary.latestRisk.risk_calculated?.toExponential(2) || '-'} 
                  <span style="color: ${isRequired ? 'var(--warning-400)' : 'var(--success-400)'}">
                    (${summary.latestRisk.status || '-'})
                  </span>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 10px; color: var(--text-tertiary); margin-bottom: 4px;">LPL RECOMMENDED</div>
                <div style="font-size: 14px; color: var(--gold-400); font-weight: 600;">
                  ${lplLevel || '-'}
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      ` : ''}

      <!-- Action Buttons -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <button class="btn-presidential" 
                style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; background: ${hasData ? 'var(--gradient-brand)' : 'var(--gradient-dark)'};"
                onclick="window._openLPSInspection('${p.id}')">
          <i class="fas fa-ruler-combined" style="margin-right: 8px;"></i> ${hasData ? 'LANJUTKAN PENGKAJIAN' : 'MULAI PENGKAJIAN'}
        </button>
        ${hasData ? `
          <button class="btn btn-outline" 
                  style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; border-color: hsla(220, 95%, 52%, 0.2); color: white;"
                  onclick="window._viewLPSReport('${p.id}')">
            <i class="fas fa-file-pdf" style="margin-right: 8px;"></i> LAPORAN
          </button>
          <button class="btn btn-outline" 
                  style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; border-color: hsla(45, 90%, 60%, 0.2); color: var(--gold-400);"
                  onclick="window._exportLPSData('${p.id}')">
            <i class="fas fa-download" style="margin-right: 8px;"></i> EXPORT DATA
          </button>
        ` : `
          <button class="btn btn-outline" disabled
                  style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; border-color: hsla(220, 20%, 100%, 0.1); color: var(--text-tertiary); opacity: 0.5;">
            <i class="fas fa-file-pdf" style="margin-right: 8px;"></i> LAPORAN
          </button>
          <button class="btn btn-outline" disabled
                  style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; border-color: hsla(220, 20%, 100%, 0.1); color: var(--text-tertiary); opacity: 0.5;">
            <i class="fas fa-download" style="margin-right: 8px;"></i> EXPORT DATA
          </button>
        `}
      </div>

      ${summary.latestInspection ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid hsla(220, 20%, 100%, 0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; color: var(--text-tertiary);">
              <i class="fas fa-clock" style="margin-right: 6px;"></i>
              Inspeksi terakhir: ${new Date(summary.latestInspectionDate).toLocaleString('id-ID')}
            </div>
            <div style="font-size: 11px; color: var(--text-tertiary);">
              Oleh: ${summary.latestInspection.inspector_name || '-'}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render Full LPS Module (untuk halaman detail lengkap)
 */
export function renderLPSModule(proyek, summary = {}) {
  return `
    <div id="lps-module-detail" style="animation: fadeIn 0.5s ease-out;">
      <!-- Header -->
      <div class="card-quartz" style="padding: var(--space-6); margin-bottom: var(--space-6);">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
          <div style="width: 56px; height: 56px; border-radius: 14px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-bolt" style="font-size: 1.6rem;"></i>
          </div>
          <div>
            <h2 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0;">Sistem Proteksi Petir (LPS)</h2>
            <p style="font-size: 0.8rem; color: var(--text-tertiary); margin: 4px 0 0 0;">SNI 03-7015-2014 & IEC 62305 Series</p>
          </div>
        </div>
        
        <!-- Presidential Tab Navigation -->
        <div class="card-quartz" style="padding: 6px; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
          <button onclick="window._switchLPSTab('risk-assessment', this)" 
                  class="lps-tab-item active"
                  data-tab="risk-assessment"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
            <i class="fas fa-calculator"></i> RISK ASSESSMENT
          </button>
          <button onclick="window._switchLPSTab('external-lps', this)" 
                  class="lps-tab-item"
                  data-tab="external-lps"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-shield-alt"></i> SISTEM EKSTERNAL
          </button>
          <button onclick="window._switchLPSTab('grounding', this)" 
                  class="lps-tab-item"
                  data-tab="grounding"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-broadcast-tower"></i> GROUNDING
          </button>
          <button onclick="window._switchLPSTab('internal-lps', this)" 
                  class="lps-tab-item"
                  data-tab="internal-lps"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-home"></i> SISTEM INTERNAL
          </button>
          <button onclick="window._switchLPSTab('testing', this)" 
                  class="lps-tab-item"
                  data-tab="testing"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-clipboard-check"></i> PENGUJIAN
          </button>
        </div>
      </div>

      <!-- TAB CONTENT: RISK ASSESSMENT -->
      <div id="lps-tab-risk-assessment" class="lps-tab-content active">
        ${renderRiskAssessmentTab(proyek, summary)}
      </div>

      <!-- TAB CONTENT: EXTERNAL LPS -->
      <div id="lps-tab-external-lps" class="lps-tab-content" style="display: none;">
        ${renderExternalLPSTab(proyek, summary)}
      </div>

      <!-- TAB CONTENT: GROUNDING -->
      <div id="lps-tab-grounding" class="lps-tab-content" style="display: none;">
        ${renderGroundingTab(proyek, summary)}
      </div>

      <!-- TAB CONTENT: INTERNAL LPS -->
      <div id="lps-tab-internal-lps" class="lps-tab-content" style="display: none;">
        ${renderInternalLPSTab(proyek, summary)}
      </div>

      <!-- TAB CONTENT: TESTING -->
      <div id="lps-tab-testing" class="lps-tab-content" style="display: none;">
        ${renderTestingTab(proyek, summary)}
      </div>

      <style>
        .lps-tab-item:hover {
          background: hsla(220, 20%, 100%, 0.05);
        }
        .lps-tab-item.active {
          background: var(--gradient-brand) !important;
          color: white !important;
        }
        .lps-tab-content {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 8px;
        }
        .form-input-dark {
          background: hsla(220, 20%, 100%, 0.03);
          border: 1px solid hsla(220, 20%, 100%, 0.1);
          color: white;
          border-radius: 8px;
          padding: 10px 12px;
          width: 100%;
          font-size: 0.85rem;
        }
        .form-input-dark:focus {
          outline: none;
          border-color: var(--brand-500);
        }
        .result-card {
          background: hsla(220, 20%, 100%, 0.03);
          border: 1px solid hsla(220, 20%, 100%, 0.05);
          border-radius: 12px;
          padding: 20px;
        }
        .metric-value {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }
        .metric-label {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          margin-top: 4px;
        }
      </style>
    </div>
  `;
}

/**
 * Risk Assessment Tab
 */
function renderRiskAssessmentTab(proyek, summary) {
  const lplOptions = Object.entries(LPL_LEVELS).map(([key, data]) => 
    `<option value="${key}">${data.label} (R=${data.rollingSphereRadius}m)</option>`
  ).join('');
  
  const envOptions = Object.entries(ENVIRONMENT_FACTORS).map(([key, data]) =>
    `<option value="${data.value}">${data.label} (Cd=${data.value})</option>`
  ).join('');
  
  const classOptions = Object.entries(BUILDING_CLASSES).map(([key, data]) =>
    `<option value="${key}">${data.name}</option>`
  ).join('');

  return `
    <div class="grid-main-side" style="gap: var(--space-6);">
      <!-- Left: Input Form -->
      <div style="display: flex; flex-direction: column; gap: var(--space-6);">
        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-calculator" style="margin-right: 8px; color: var(--gold-400);"></i>
            Risk Assessment Calculator
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="form-label">Kerapatan Petir Ng (sambaran/km²/th)</label>
              <input type="number" id="lps-ng" class="form-input-dark" placeholder="Contoh: 12.5" step="0.1">
            </div>
            <div>
              <label class="form-label">Kelas Bangunan</label>
              <select id="lps-building-class" class="form-input-dark" style="cursor: pointer;">
                ${classOptions}
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="form-label">Panjang L (m)</label>
              <input type="number" id="lps-length" class="form-input-dark" placeholder="0" step="0.1">
            </div>
            <div>
              <label class="form-label">Lebar W (m)</label>
              <input type="number" id="lps-width" class="form-input-dark" placeholder="0" step="0.1">
            </div>
            <div>
              <label class="form-label">Tinggi H (m)</label>
              <input type="number" id="lps-height" class="form-input-dark" placeholder="0" step="0.1">
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label class="form-label">Faktor Lingkungan (Cd)</label>
            <select id="lps-cd" class="form-input-dark" style="cursor: pointer;">
              ${envOptions}
            </select>
          </div>

          <button onclick="window._calculateLPSRisk('${proyek.id}')" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-calculator" style="margin-right: 8px;"></i> Hitung Risiko
          </button>
        </div>

        <!-- SNI Reference -->
        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-book" style="margin-right: 8px; color: var(--brand-400);"></i>
            Referensi SNI 03-7015-2014
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Pasal 6 - Risk Assessment:</strong> R = N × P × L</p>
            <p style="margin-top: 8px;"><strong>RT = 10⁻⁵:</strong> Toleransi risiko (1 kerugian per 100 tahun)</p>
            <p style="margin-top: 8px;"><strong>Ae:</strong> Area ekivalen koleksi (m²)</p>
            <p style="margin-top: 8px;"><strong>N:</strong> Frekuensi sambaran per tahun</p>
          </div>
        </div>
      </div>

      <!-- Right: Results -->
      <div style="display: flex; flex-direction: column; gap: var(--space-6);">
        <div id="lps-risk-result" class="card-quartz" style="padding: var(--space-6); display: none;">
          <div style="font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-chart-pie" style="margin-right: 8px; color: var(--success-400);"></i>
            Hasil Perhitungan Risiko
          </div>
          
          <div id="lps-risk-result-content">
            <!-- Filled dynamically -->
          </div>
        </div>

        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 16px;">
            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--brand-400);"></i>
            Level Proteksi Petir (LPL)
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${Object.entries(LPL_LEVELS).map(([key, data]) => `
              <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; border-left: 3px solid ${key === 'LPL_I' ? 'var(--danger-400)' : key === 'LPL_II' ? 'var(--warning-400)' : 'var(--success-400)'};">
                <div style="font-weight: 700; color: white; font-size: 0.85rem;">${data.label}</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px;">
                  Radius Bola: ${data.rollingSphereRadius}m | Mesh: ${data.meshSize}m | Down Conductor: ${data.downConductorSpacing}m
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * External LPS Tab
 */
function renderExternalLPSTab(proyek, summary) {
  return `
    <div style="display: flex; flex-direction: column; gap: var(--space-6);">
      <!-- Rolling Sphere Section -->
      <div class="grid-2-col" style="gap: var(--space-6);">
        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-globe" style="margin-right: 8px; color: var(--gold-400);"></i>
            Rolling Sphere Method
          </div>
          
          <div style="margin-bottom: 16px;">
            <label class="form-label">Level Proteksi Petir (LPL)</label>
            <select id="lps-rolling-lpl" class="form-input-dark" style="cursor: pointer;">
              <option value="LPL_I">LPL I - Radius 20m</option>
              <option value="LPL_II" selected>LPL II - Radius 30m</option>
              <option value="LPL_III">LPL III - Radius 45m</option>
              <option value="LPL_IV">LPL IV - Radius 60m</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="form-label">Tinggi Air Terminal (m)</label>
              <input type="number" id="lps-rod-height" class="form-input-dark" placeholder="0" step="0.1">
            </div>
            <div>
              <label class="form-label">Tinggi Struktur (m)</label>
              <input type="number" id="lps-structure-height" class="form-input-dark" placeholder="0" step="0.1">
            </div>
          </div>

          <button onclick="window._calculateRollingSphere()" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-calculator" style="margin-right: 8px;"></i> Hitung Zona Perlindungan
          </button>

          <div id="lps-rolling-result" style="margin-top: 20px; display: none;">
            <!-- Filled dynamically -->
          </div>
        </div>

        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-draw-polygon" style="margin-right: 8px; color: var(--brand-400);"></i>
            Mesh Size Calculator
          </div>
          
          <div style="margin-bottom: 16px;">
            <label class="form-label">Level Proteksi Petir (LPL)</label>
            <select id="lps-mesh-lpl" class="form-input-dark" style="cursor: pointer;">
              <option value="LPL_I">LPL I - 5m × 5m</option>
              <option value="LPL_II" selected>LPL II - 10m × 10m</option>
              <option value="LPL_III">LPL III - 15m × 15m</option>
              <option value="LPL_IV">LPL IV - 15m × 15m</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="form-label">Panjang Area (m)</label>
              <input type="number" id="lps-mesh-length" class="form-input-dark" placeholder="0" step="0.1">
            </div>
            <div>
              <label class="form-label">Lebar Area (m)</label>
              <input type="number" id="lps-mesh-width" class="form-input-dark" placeholder="0" step="0.1">
            </div>
          </div>

          <button onclick="window._calculateMeshSize()" class="btn btn-primary" style="width: 100%; background: hsla(220, 95%, 52%, 0.2); border-color: hsla(220, 95%, 52%, 0.3); color: var(--brand-400);">
            <i class="fas fa-th" style="margin-right: 8px;"></i> Hitung Kebutuhan Mesh
          </button>

          <div id="lps-mesh-result" style="margin-top: 20px; display: none;">
            <!-- Filled dynamically -->
          </div>
        </div>
      </div>

      <!-- Protection Angle Section -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div style="font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-ruler-angle" style="margin-right: 8px; color: var(--success-400);"></i>
          Protection Angle Method (SNI Pasal 8.2)
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label class="form-label">Level Proteksi Petir</label>
            <select id="lps-angle-lpl" class="form-input-dark" style="cursor: pointer;">
              <option value="LPL_I">LPL I (α = 25°)</option>
              <option value="LPL_II" selected>LPL II (α = 35°)</option>
              <option value="LPL_III">LPL III (α = 45°)</option>
              <option value="LPL_IV">LPL IV (α = 55°)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Tinggi Air Terminal (m)</label>
            <input type="number" id="lps-angle-height" class="form-input-dark" placeholder="0" step="0.1">
          </div>
          <div>
            <label class="form-label">Sudut Perlindungan</label>
            <input type="number" id="lps-angle-value" class="form-input-dark" placeholder="Auto" readonly style="background: hsla(220, 20%, 100%, 0.05);">
          </div>
        </div>

        <button onclick="window._calculateProtectionAngle()" class="btn btn-primary" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-calculator" style="margin-right: 8px;"></i> Hitung Zona Perlindungan Cone
        </button>

        <div id="lps-angle-result" style="margin-top: 20px; display: none;">
          <!-- Filled dynamically -->
        </div>
      </div>
    </div>
  `;
}

/**
 * Grounding Tab
 */
function renderGroundingTab(proyek, summary) {
  return `
    <div style="display: flex; flex-direction: column; gap: var(--space-6);">
      <!-- Grounding Calculator -->
      <div class="grid-2-col" style="gap: var(--space-6);">
        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-broadcast-tower" style="margin-right: 8px; color: var(--gold-400);"></i>
            Single Ground Rod Resistance
          </div>
          
          <div style="margin-bottom: 16px;">
            <label class="form-label">Resistivitas Tanah ρ (Ω.m)</label>
            <input type="number" id="lps-rho" class="form-input-dark" placeholder="Contoh: 100" step="1">
            <div id="lps-soil-class" style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px;"></div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="form-label">Panjang Rod L (m)</label>
              <input type="number" id="lps-rod-len" class="form-input-dark" value="3" step="0.1">
            </div>
            <div>
              <label class="form-label">Diameter Rod d (mm)</label>
              <input type="number" id="lps-rod-dia" class="form-input-dark" value="16" step="1">
            </div>
          </div>

          <button onclick="window._calculateGroundingResistance()" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-calculator" style="margin-right: 8px;"></i> Hitung Resistansi
          </button>

          <div id="lps-grounding-result" style="margin-top: 20px; display: none;">
            <!-- Filled dynamically -->
          </div>
        </div>

        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-water" style="margin-right: 8px; color: var(--brand-400);"></i>
            Soil Resistivity (Wenner Method)
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="form-label">Jarak Elektroda a (m)</label>
              <input type="number" id="lps-wenner-a" class="form-input-dark" placeholder="2" step="0.1">
            </div>
            <div>
              <label class="form-label">Resistansi R (Ω)</label>
              <input type="number" id="lps-wenner-r" class="form-input-dark" placeholder="50" step="0.1">
            </div>
          </div>

          <button onclick="window._calculateWennerResistivity()" class="btn btn-primary" style="width: 100%; background: hsla(220, 95%, 52%, 0.2); border-color: hsla(220, 95%, 52%, 0.3); color: var(--brand-400);">
            <i class="fas fa-calculator" style="margin-right: 8px;"></i> Hitung ρ = 2πaR
          </button>

          <div id="lps-wenner-result" style="margin-top: 20px; display: none;">
            <!-- Filled dynamically -->
          </div>
        </div>
      </div>

      <!-- Multiple Rods & Grid -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div style="font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-th" style="margin-right: 8px; color: var(--success-400);"></i>
          Multiple Rod / Grounding Grid
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
          <div>
            <label class="form-label">Resistansi Single Rod (Ω)</label>
            <input type="number" id="lps-multi-r" class="form-input-dark" placeholder="0" step="0.1">
          </div>
          <div>
            <label class="form-label">Jumlah Rod (n)</label>
            <input type="number" id="lps-multi-n" class="form-input-dark" value="4" step="1">
          </div>
          <div>
            <label class="form-label">Jarak Ant Rod (m)</label>
            <input type="number" id="lps-multi-space" class="form-input-dark" value="3" step="0.1">
          </div>
          <div>
            <label class="form-label">Panjang Rod (m)</label>
            <input type="number" id="lps-multi-len" class="form-input-dark" value="3" step="0.1">
          </div>
        </div>

        <button onclick="window._calculateMultipleRods()" class="btn btn-primary" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-calculator" style="margin-right: 8px;"></i> Hitung Resistansi Total
        </button>

        <div id="lps-multi-result" style="margin-top: 20px; display: none;">
          <!-- Filled dynamically -->
        </div>
      </div>

      <!-- Target Reference -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div style="font-weight: 700; color: white; margin-bottom: 16px;">
          <i class="fas fa-bullseye" style="margin-right: 8px; color: var(--danger-400);"></i>
          Target Resistansi SNI 03-7015-2014
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div style="padding: 16px; background: hsla(0, 85%, 60%, 0.1); border-radius: 10px; border: 1px solid hsla(0, 85%, 60%, 0.2);">
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--danger-400);">< 2Ω</div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Sistem Elektronik</div>
          </div>
          <div style="padding: 16px; background: hsla(45, 90%, 60%, 0.1); border-radius: 10px; border: 1px solid hsla(45, 90%, 60%, 0.2);">
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning-400);">< 5Ω</div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Bangunan Biasa</div>
          </div>
          <div style="padding: 16px; background: hsla(160, 100%, 45%, 0.1); border-radius: 10px; border: 1px solid hsla(160, 100%, 45%, 0.2);">
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-400);">< 10Ω</div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">LPS Only</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Internal LPS Tab
 */
function renderInternalLPSTab(proyek, summary) {
  return `
    <div style="display: flex; flex-direction: column; gap: var(--space-6);">
      <!-- LPZ Zoning -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div style="font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-layer-group" style="margin-right: 8px; color: var(--gold-400);"></i>
          Lightning Protection Zones (LPZ)
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          ${Object.entries(LPZ_ZONES).map(([key, data]) => `
            <div style="padding: 20px; background: hsla(220, 20%, 100%, 0.03); border-radius: 12px; border-left: 4px solid ${key === 'LPZ_0A' ? 'var(--danger-400)' : key === 'LPZ_0B' ? 'var(--warning-400)' : key === 'LPZ_1' ? 'var(--brand-400)' : 'var(--success-400)'};">
              <div style="font-weight: 800; color: white; font-size: 1rem; margin-bottom: 8px;">${data.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">${data.description}</div>
              <div style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5;">
                <div><strong>Ancaman:</strong> ${data.threat}</div>
                <div style="margin-top: 4px;"><strong>Proteksi:</strong> ${data.protection}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- SPD Coordination -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div style="font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-plug" style="margin-right: 8px; color: var(--brand-400);"></i>
          Surge Protective Device (SPD) Coordination - SNI Pasal 12.3
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${Object.entries(SPD_TYPES).map(([key, data]) => `
            <div style="padding: 20px; background: hsla(220, 20%, 100%, 0.03); border-radius: 12px; border: 1px solid hsla(220, 20%, 100%, 0.1);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="font-weight: 800; color: white; font-size: 1rem;">${data.name}</div>
                <span class="badge" style="background: ${key === 'TYPE_1' ? 'hsla(0, 85%, 60%, 0.2)' : key === 'TYPE_2' ? 'hsla(45, 90%, 60%, 0.2)' : 'hsla(160, 100%, 45%, 0.2)'}; 
                             color: ${key === 'TYPE_1' ? 'var(--danger-400)' : key === 'TYPE_2' ? 'var(--warning-400)' : 'var(--success-400)'}; 
                             font-size: 10px; padding: 4px 8px;">
                  ${data.location}
                </span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px;">${data.description}</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.75rem; color: var(--text-tertiary);">
                <div><strong>Impulse Current:</strong> ${data.impulseCurrent}</div>
                <div><strong>Aplikasi:</strong> ${data.application}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Separation Distance -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div style="font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-ruler-horizontal" style="margin-right: 8px; color: var(--success-400);"></i>
          Separation Distance Calculator (SNI Pasal 12) - Pencegahan Side Flash
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
          <div>
            <label class="form-label">LPL</label>
            <select id="lps-sep-lpl" class="form-input-dark" style="cursor: pointer;">
              <option value="LPL_I">LPL I (ki=0.08)</option>
              <option value="LPL_II" selected>LPL II (ki=0.06)</option>
              <option value="LPL_III">LPL III (ki=0.04)</option>
              <option value="LPL_IV">LPL IV (ki=0.04)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Jenis Down Conductor</label>
            <select id="lps-sep-kc" class="form-input-dark" style="cursor: pointer;">
              <option value="1">Single (kc=1)</option>
              <option value="0.5" selected>Multiple (kc=0.5)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Panjang L (m)</label>
            <input type="number" id="lps-sep-len" class="form-input-dark" placeholder="10" step="0.1">
          </div>
          <div>
            <label class="form-label">Jarak Aktual (m)</label>
            <input type="number" id="lps-sep-actual" class="form-input-dark" placeholder="0" step="0.01">
          </div>
        </div>

        <button onclick="window._calculateSeparationDistance()" class="btn btn-primary" style="width: 100%;">
          <i class="fas fa-calculator" style="margin-right: 8px;"></i> Hitung Jarak Aman S
        </button>

        <div id="lps-separation-result" style="margin-top: 20px; display: none;">
          <!-- Filled dynamically -->
        </div>
      </div>
    </div>
  `;
}

/**
 * Testing Tab
 */
function renderTestingTab(proyek, summary) {
  return `
    <div style="display: flex; flex-direction: column; gap: var(--space-6);">
      <!-- Grounding Test -->
      <div class="grid-2-col" style="gap: var(--space-6);">
        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-broadcast-tower" style="margin-right: 8px; color: var(--gold-400);"></i>
            Grounding Resistance Test (Fall of Potential)
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="form-label">Resistansi Terukur (Ω)</label>
              <input type="number" id="lps-test-r" class="form-input-dark" placeholder="0" step="0.01">
            </div>
            <div>
              <label class="form-label">Target (Ω)</label>
              <select id="lps-test-target" class="form-input-dark" style="cursor: pointer;">
                <option value="2">< 2Ω (Elektronik)</option>
                <option value="5" selected>< 5Ω (Bangunan)</option>
                <option value="10">< 10Ω (LPS)</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label class="form-label">Suhu Tanah (°C)</label>
            <input type="number" id="lps-test-temp" class="form-input-dark" value="25" step="1">
          </div>

          <button onclick="window._evaluateGroundingTest()" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i> Evaluasi Hasil Test
          </button>

          <div id="lps-test-result" style="margin-top: 20px; display: none;">
            <!-- Filled dynamically -->
          </div>
        </div>

        <div class="card-quartz" style="padding: var(--space-6);">
          <div style="font-weight: 700; color: white; margin-bottom: 20px;">
            <i class="fas fa-link" style="margin-right: 8px; color: var(--brand-400);"></i>
            Continuity Test (Joint Resistance)
          </div>
          
          <div style="margin-bottom: 16px;">
            <label class="form-label">Resistansi Joint (Ω)</label>
            <input type="number" id="lps-continuity-r" class="form-input-dark" placeholder="0.05" step="0.001">
          </div>

          <div style="margin-bottom: 20px;">
            <label class="form-label">Batas Maksimum (SNI: < 0.05Ω)</label>
            <input type="number" id="lps-continuity-limit" class="form-input-dark" value="0.05" step="0.001">
          </div>

          <button onclick="window._evaluateContinuityTest()" class="btn btn-primary" style="width: 100%; background: hsla(220, 95%, 52%, 0.2); border-color: hsla(220, 95%, 52%, 0.3); color: var(--brand-400);">
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i> Evaluasi Kontinuitas
          </button>

          <div id="lps-continuity-result" style="margin-top: 20px; display: none;">
            <!-- Filled dynamically -->
          </div>
        </div>
      </div>

      <!-- Test History -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div style="font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-history" style="margin-right: 8px; color: var(--success-400);"></i>
          Riwayat Pengujian
        </div>
        
        <div id="lps-test-history">
          ${summary.groundingTests?.length > 0 ? `
            <div style="overflow-x: auto;">
              <table style="width: 100%; font-size: 0.8rem;">
                <thead>
                  <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">
                    <th style="text-align: left; padding: 12px; color: var(--text-tertiary);">Tanggal</th>
                    <th style="text-align: left; padding: 12px; color: var(--text-tertiary);">Lokasi</th>
                    <th style="text-align: left; padding: 12px; color: var(--text-tertiary);">R (Ω)</th>
                    <th style="text-align: left; padding: 12px; color: var(--text-tertiary);">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${summary.groundingTests.map(test => `
                    <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
                      <td style="padding: 12px; color: white;">${new Date(test.test_date).toLocaleDateString('id-ID')}</td>
                      <td style="padding: 12px; color: var(--text-secondary);">${test.location || '-'}</td>
                      <td style="padding: 12px; color: white; font-weight: 600;">${test.resistance_ohm}</td>
                      <td style="padding: 12px;">
                        <span class="badge" style="background: ${test.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'}; 
                                     color: ${test.status === 'PASS' ? 'var(--success-400)' : 'var(--danger-400)'}; 
                                     font-size: 10px; padding: 4px 8px;">
                          ${test.status}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="text-align: center; padding: 40px; color: var(--text-tertiary);">
              <i class="fas fa-clipboard-list" style="font-size: 2rem; margin-bottom: 12px; opacity: 0.5;"></i>
              <div>Belum ada data pengujian</div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize LPS Module Handlers
 */
export function initLPSHandlers(proyekId) {
  // Tab switching
  window._switchLPSTab = (tabId, btn) => {
    document.querySelectorAll('.lps-tab-item').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = 'var(--text-tertiary)';
    });
    btn.classList.add('active');
    btn.style.background = 'var(--gradient-brand)';
    btn.style.color = 'white';

    document.querySelectorAll('.lps-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    const targetContent = document.getElementById(`lps-tab-${tabId}`);
    if (targetContent) targetContent.style.display = 'block';
  };

  // Risk Assessment Calculation
  window._calculateLPSRisk = async (id) => {
    const Ng = parseFloat(document.getElementById('lps-ng')?.value);
    const L = parseFloat(document.getElementById('lps-length')?.value);
    const W = parseFloat(document.getElementById('lps-width')?.value);
    const H = parseFloat(document.getElementById('lps-height')?.value);
    const Cd = parseFloat(document.getElementById('lps-cd')?.value);
    const buildingClass = document.getElementById('lps-building-class')?.value;
    
    if (!Ng || !L || !W || !H) {
      showError('Lengkapi semua parameter perhitungan');
      return;
    }
    
    try {
      const result = calculateRiskAssessment({ Ng, L, W, H, Cd, buildingClass });
      
      // Save to database
      const { error } = await supabase
        .from('lightning_risk_assessments')
        .insert([{
          project_id: id,
          ng_density: Ng,
          building_dimensions: { L, W, H },
          environment_factor: Cd,
          building_class: buildingClass,
          collection_area: result.collectionArea,
          strike_frequency: result.strikeFrequency,
          risk_calculated: result.riskValue,
          is_required: result.isRequired,
          is_mandatory: result.isMandatory,
          lpl_level: result.lplRecommended,
          status: result.status,
          recommendation: result.recommendation,
          calculation_details: result.factors
        }]);
      
      if (error) throw error;
      
      // Display result
      const resultContainer = document.getElementById('lps-risk-result');
      const resultContent = document.getElementById('lps-risk-result-content');
      
      if (resultContainer && resultContent) {
        resultContainer.style.display = 'block';
        resultContent.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div class="result-card" style="text-align: center;">
              <div class="metric-value" style="color: ${result.isRequired ? 'var(--warning-400)' : 'var(--success-400)'};">${result.riskValue.toExponential(2)}</div>
              <div class="metric-label">Risk Value R</div>
            </div>
            <div class="result-card" style="text-align: center;">
              <div class="metric-value">${result.toleranceRisk.toExponential(2)}</div>
              <div class="metric-label">Toleransi Risiko RT</div>
            </div>
          </div>
          
          <div class="result-card" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="color: var(--text-secondary);">Status LPS:</span>
              <span class="badge" style="background: ${result.isRequired ? 'hsla(0, 85%, 60%, 0.2)' : 'hsla(160, 100%, 45%, 0.2)'}; 
                           color: ${result.isRequired ? 'var(--danger-400)' : 'var(--success-400)'}; 
                           font-size: 12px; padding: 6px 12px;">
                <i class="fas ${result.isRequired ? 'fa-exclamation-triangle' : 'fa-check-circle'}" style="margin-right: 6px;"></i>
                ${result.status}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">LPL Rekomendasi:</span>
              <span style="color: var(--gold-400); font-weight: 700;">${result.lplRecommended.replace('LPL_', 'Level ')}</span>
            </div>
          </div>
          
          <div class="result-card">
            <div style="font-weight: 700; color: white; margin-bottom: 12px;">Detail Perhitungan</div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.8;">
              <div>Area Koleksi (Ae): <span style="color: white;">${result.collectionArea} m²</span></div>
              <div>Frekuensi Sambaran (N): <span style="color: white;">${result.strikeFrequency.toExponential(2)} /tahun</span></div>
              <div>Kerapatan Petir (Ng): <span style="color: white;">${Ng} sambaran/km²/th</span></div>
              <div>Faktor Lingkungan (Cd): <span style="color: white;">${Cd}</span></div>
            </div>
          </div>
          
          <div style="margin-top: 16px; padding: 16px; background: ${result.isRequired ? 'hsla(0, 85%, 60%, 0.1)' : 'hsla(160, 100%, 45%, 0.1)'}; border-radius: 10px; border: 1px solid ${result.isRequired ? 'hsla(0, 85%, 60%, 0.2)' : 'hsla(160, 100%, 45%, 0.2)'};">
            <div style="font-size: 0.85rem; color: ${result.isRequired ? 'var(--danger-400)' : 'var(--success-400)'}; font-weight: 600;">
              <i class="fas ${result.isRequired ? 'fa-exclamation-circle' : 'fa-info-circle'}" style="margin-right: 8px;"></i>
              ${result.recommendation}
            </div>
          </div>
        `;
      }
      
      showSuccess(`Risk assessment berhasil disimpan: ${result.status}`);
    } catch (error) {
      console.error('Error calculating risk:', error);
      showError('Gagal menghitung risiko: ' + error.message);
    }
  };

  // Rolling Sphere Calculation
  window._calculateRollingSphere = () => {
    const lpl = document.getElementById('lps-rolling-lpl')?.value || 'LPL_II';
    const rodHeight = parseFloat(document.getElementById('lps-rod-height')?.value);
    const structureHeight = parseFloat(document.getElementById('lps-structure-height')?.value);
    
    if (!rodHeight || !structureHeight) {
      showError('Masukkan tinggi rod dan struktur');
      return;
    }
    
    const sphereRadius = LPL_LEVELS[lpl]?.rollingSphereRadius || 30;
    const result = calculateRollingSphereProtection(sphereRadius, rodHeight, structureHeight);
    
    const resultContainer = document.getElementById('lps-rolling-result');
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="result-card">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="text-align: center;">
              <div class="metric-value" style="font-size: 1.2rem;">${result.sphereRadius}m</div>
              <div class="metric-label">Radius Bola</div>
            </div>
            <div style="text-align: center;">
              <div class="metric-value" style="font-size: 1.2rem;">${result.protectedRadius}m</div>
              <div class="metric-label">Radius Perlindungan</div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Tinggi Efektif:</strong> ${result.effectiveHeight}m</p>
            <p><strong>Status:</strong> <span style="color: ${result.isProtected ? 'var(--success-400)' : 'var(--warning-400)'}">${result.isProtected ? 'Terdapat zona perlindungan' : 'Tinggi rod tidak mencukupi'}</span></p>
          </div>
        </div>
      `;
    }
    
    showSuccess('Rolling sphere calculation complete');
  };

  // Mesh Size Calculation
  window._calculateMeshSize = () => {
    const lpl = document.getElementById('lps-mesh-lpl')?.value || 'LPL_II';
    const length = parseFloat(document.getElementById('lps-mesh-length')?.value);
    const width = parseFloat(document.getElementById('lps-mesh-width')?.value);
    
    if (!length || !width) {
      showError('Masukkan dimensi area');
      return;
    }
    
    const result = calculateMeshRequirements(length, width, lpl);
    
    const resultContainer = document.getElementById('lps-mesh-result');
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="result-card">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
            <div style="text-align: center;">
              <div class="metric-value" style="font-size: 1.2rem;">${result.meshSize.width}m</div>
              <div class="metric-label">Ukuran Mesh</div>
            </div>
            <div style="text-align: center;">
              <div class="metric-value" style="font-size: 1.2rem;">${result.meshCount.total}</div>
              <div class="metric-label">Jumlah Mesh</div>
            </div>
            <div style="text-align: center;">
              <div class="metric-value" style="font-size: 1.2rem;">${result.conductorLength.total}m</div>
              <div class="metric-label">Panjang Konduktor</div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Mesh X:</strong> ${result.meshCount.x} buah | <strong>Mesh Y:</strong> ${result.meshCount.y} buah</p>
            <p><strong>Area:</strong> ${result.area} m² | <strong>Perimeter:</strong> ${result.perimeter} m</p>
          </div>
        </div>
      `;
    }
    
    showSuccess('Mesh calculation complete');
  };

  // Protection Angle Calculation
  window._calculateProtectionAngle = () => {
    const lpl = document.getElementById('lps-angle-lpl')?.value || 'LPL_II';
    const height = parseFloat(document.getElementById('lps-angle-height')?.value);
    
    if (!height) {
      showError('Masukkan tinggi air terminal');
      return;
    }
    
    const angle = getProtectionAngle(lpl, height);
    document.getElementById('lps-angle-value').value = angle;
    
    const result = calculateProtectionZone(height, angle);
    
    const resultContainer = document.getElementById('lps-angle-result');
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="result-card">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="text-align: center;">
              <div class="metric-value" style="font-size: 1.2rem;">${angle}°</div>
              <div class="metric-label">Sudut Perlindungan</div>
            </div>
            <div style="text-align: center;">
              <div class="metric-value" style="font-size: 1.2rem;">${result.groundRadius}m</div>
              <div class="metric-label">Radius di Tanah</div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Tinggi Rod:</strong> ${result.rodHeight}m</p>
            <p>Zona perlindungan berbentuk kerucut dengan sudut ${angle}°</p>
          </div>
        </div>
      `;
    }
    
    showSuccess('Protection angle calculation complete');
  };

  // Grounding Resistance Calculation
  window._calculateGroundingResistance = () => {
    const rho = parseFloat(document.getElementById('lps-rho')?.value);
    const L = parseFloat(document.getElementById('lps-rod-len')?.value);
    const d = parseFloat(document.getElementById('lps-rod-dia')?.value) / 1000; // mm to m
    
    if (!rho || !L || !d) {
      showError('Lengkapi parameter grounding');
      return;
    }
    
    // Classify soil
    const soilClass = classifySoil(rho);
    document.getElementById('lps-soil-class').innerHTML = `
      <span style="color: ${soilClass.type === 'VERY_WET' ? 'var(--success-400)' : soilClass.type === 'DRY' ? 'var(--warning-400)' : 'var(--text-tertiary)'}">
        ${soilClass.label} - ${soilClass.description} (${soilClass.groundingDifficulty})
      </span>
    `;
    
    const result = calculateSingleRodResistance(rho, L, d);
    const target = getGroundingTarget('BUILDING');
    
    const resultContainer = document.getElementById('lps-grounding-result');
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="result-card">
          <div style="text-align: center; margin-bottom: 16px;">
            <div class="metric-value" style="font-size: 2rem; color: ${result <= target.max ? 'var(--success-400)' : 'var(--warning-400)'}">${result}Ω</div>
            <div class="metric-label">Resistansi Single Rod</div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Jenis Tanah:</strong> ${soilClass.label}</p>
            <p><strong>Target SNI:</strong> <span style="color: ${result <= target.max ? 'var(--success-400)' : 'var(--warning-400)'}">${target.description} ${result <= target.max ? '✓' : '✗'}</span></p>
          </div>
        </div>
      `;
    }
    
    showSuccess(`Grounding resistance: ${result}Ω`);
  };

  // Wenner Resistivity Calculation
  window._calculateWennerResistivity = () => {
    const a = parseFloat(document.getElementById('lps-wenner-a')?.value);
    const R = parseFloat(document.getElementById('lps-wenner-r')?.value);
    
    if (!a || !R) {
      showError('Masukkan jarak elektroda dan resistansi');
      return;
    }
    
    const rho = calculateSoilResistivity(a, R);
    const soilClass = classifySoil(rho);
    
    const resultContainer = document.getElementById('lps-wenner-result');
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="result-card">
          <div style="text-align: center; margin-bottom: 16px;">
            <div class="metric-value">${rho}Ω.m</div>
            <div class="metric-label">Resistivitas Tanah (ρ = 2πaR)</div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Klasifikasi:</strong> <span style="color: ${soilClass.type === 'VERY_WET' ? 'var(--success-400)' : soilClass.type === 'DRY' ? 'var(--warning-400)' : 'var(--brand-400)'}">${soilClass.label}</span></p>
            <p><strong>Kesulitan:</strong> ${soilClass.groundingDifficulty}</p>
          </div>
        </div>
      `;
    }
    
    showSuccess(`Soil resistivity: ${rho}Ω.m (${soilClass.label})`);
  };

  // Multiple Rods Calculation
  window._calculateMultipleRods = () => {
    const singleR = parseFloat(document.getElementById('lps-multi-r')?.value);
    const n = parseInt(document.getElementById('lps-multi-n')?.value);
    const spacing = parseFloat(document.getElementById('lps-multi-space')?.value);
    const L = parseFloat(document.getElementById('lps-multi-len')?.value);
    
    if (!singleR || !n || !spacing || !L) {
      showError('Lengkapi parameter multiple rods');
      return;
    }
    
    const result = calculateMultipleRodResistance(singleR, n, spacing, L);
    
    const resultContainer = document.getElementById('lps-multi-result');
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="result-card">
          <div style="text-align: center; margin-bottom: 16px;">
            <div class="metric-value" style="font-size: 2rem; color: ${result <= 5 ? 'var(--success-400)' : result <= 10 ? 'var(--warning-400)' : 'var(--danger-400)'}">${result}Ω</div>
            <div class="metric-label">Resistansi Total (${n} rods)</div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Single Rod:</strong> ${singleR}Ω | <strong>Jumlah:</strong> ${n} rods</p>
            <p><strong>Jarak:</strong> ${spacing}m | <strong>Faktor koreksi:</strong> ~${(result * n / singleR).toFixed(2)}</p>
          </div>
        </div>
      `;
    }
    
    showSuccess(`Multiple rods resistance: ${result}Ω`);
  };

  // Separation Distance Calculation
  window._calculateSeparationDistance = () => {
    const lpl = document.getElementById('lps-sep-lpl')?.value || 'LPL_II';
    const kc = parseFloat(document.getElementById('lps-sep-kc')?.value) || 0.5;
    const L = parseFloat(document.getElementById('lps-sep-len')?.value);
    const actualDistance = parseFloat(document.getElementById('lps-sep-actual')?.value);
    
    if (!L) {
      showError('Masukkan panjang down conductor');
      return;
    }
    
    const ki = SEPARATION_FACTORS[lpl]?.ki || 0.06;
    const requiredDistance = calculateSeparationDistance(ki, kc, L);
    
    let complianceHtml = '';
    if (actualDistance) {
      const compliance = checkSeparationCompliance(actualDistance, requiredDistance);
      complianceHtml = `
        <div style="margin-top: 16px; padding: 16px; background: ${compliance.isCompliant ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; 
                      border-radius: 10px; border: 1px solid ${compliance.isCompliant ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-weight: 700; color: ${compliance.isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            <i class="fas ${compliance.isCompliant ? 'fa-check-circle' : 'fa-exclamation-triangle'}" style="margin-right: 8px;"></i>
            ${compliance.status}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Jarak Aktual:</strong> ${compliance.actualDistance}m</p>
            <p><strong>Margin:</strong> ${compliance.margin > 0 ? '+' : ''}${compliance.margin}m</p>
            ${compliance.alert ? `<p style="color: var(--danger-400);">${compliance.alert}</p>` : ''}
          </div>
        </div>
      `;
    }
    
    const resultContainer = document.getElementById('lps-separation-result');
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="result-card">
          <div style="text-align: center; margin-bottom: 16px;">
            <div class="metric-value" style="font-size: 2rem;">${requiredDistance}m</div>
            <div class="metric-label">Jarak Aman S = ki × kc × L / km</div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>ki (LPL):</strong> ${ki} | <strong>kc:</strong> ${kc} | <strong>L:</strong> ${L}m</p>
            <p style="margin-top: 8px;">Jarak minimum antara down conductor dan instalasi logam untuk mencegah side flash</p>
          </div>
          ${complianceHtml}
        </div>
      `;
    }
    
    showSuccess(`Separation distance: ${requiredDistance}m`);
  };

  // Grounding Test Evaluation
  window._evaluateGroundingTest = async () => {
    const measuredR = parseFloat(document.getElementById('lps-test-r')?.value);
    const targetR = parseFloat(document.getElementById('lps-test-target')?.value);
    const temp = parseFloat(document.getElementById('lps-test-temp')?.value) || 25;
    
    if (!measuredR || !targetR) {
      showError('Masukkan hasil pengukuran');
      return;
    }
    
    const result = evaluateGroundingTest(measuredR, targetR, temp);
    
    try {
      // Save to database
      const { error } = await supabase
        .from('lps_grounding_tests')
        .insert([{
          project_id: proyekId,
          resistance_ohm: measuredR,
          corrected_resistance: result.correctedResistance,
          temperature: temp,
          target_resistance: targetR,
          status: result.status,
          test_date: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      const resultContainer = document.getElementById('lps-test-result');
      if (resultContainer) {
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `
          <div class="result-card">
            <div style="text-align: center; margin-bottom: 16px;">
              <div class="metric-value" style="font-size: 2rem; color: ${result.isPass ? 'var(--success-400)' : 'var(--danger-400)'}">${result.correctedResistance}Ω</div>
              <div class="metric-label">Resistansi Terkoreksi (20°C)</div>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
              <p><strong>Terukur:</strong> ${result.measuredResistance}Ω @ ${result.temperature}°C</p>
              <p><strong>Target:</strong> < ${result.targetResistance}Ω</p>
              <p><strong>Margin:</strong> ${result.margin > 0 ? '+' : ''}${result.margin}Ω</p>
            </div>
            <div style="margin-top: 16px; padding: 12px; background: ${result.isPass ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; 
                        border-radius: 8px; text-align: center;">
              <span style="color: ${result.isPass ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 700; font-size: 1rem;">
                <i class="fas ${result.isPass ? 'fa-check-circle' : 'fa-times-circle'}" style="margin-right: 8px;"></i>
                ${result.status}
              </span>
            </div>
            ${result.recommendation ? `<div style="margin-top: 12px; font-size: 0.75rem; color: var(--text-tertiary);">${result.recommendation}</div>` : ''}
          </div>
        `;
      }
      
      showSuccess(`Grounding test ${result.status} - saved to database`);
    } catch (error) {
      console.error('Error saving grounding test:', error);
      showError('Gagal menyimpan data test');
    }
  };

  // Continuity Test Evaluation
  window._evaluateContinuityTest = () => {
    const resistance = parseFloat(document.getElementById('lps-continuity-r')?.value);
    const limit = parseFloat(document.getElementById('lps-continuity-limit')?.value) || 0.05;
    
    if (!resistance && resistance !== 0) {
      showError('Masukkan nilai resistansi joint');
      return;
    }
    
    const result = evaluateContinuityTest(resistance, limit);
    
    const resultContainer = document.getElementById('lps-continuity-result');
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="result-card">
          <div style="text-align: center; margin-bottom: 16px;">
            <div class="metric-value" style="font-size: 2rem; color: ${result.isPass ? 'var(--success-400)' : 'var(--danger-400)'}">${result.resistance}Ω</div>
            <div class="metric-label">Resistansi Joint</div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.6;">
            <p><strong>Batas:</strong> < ${result.limit}Ω (SNI 03-7015-2014)</p>
            <p><strong>Quality:</strong> ${result.quality}</p>
          </div>
          <div style="margin-top: 16px; padding: 12px; background: ${result.isPass ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; 
                      border-radius: 8px; text-align: center;">
            <span style="color: ${result.isPass ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 700; font-size: 1rem;">
              <i class="fas ${result.isPass ? 'fa-check-circle' : 'fa-times-circle'}" style="margin-right: 8px;"></i>
              ${result.status}
            </span>
          </div>
          ${!result.isPass ? `<div style="margin-top: 12px; font-size: 0.75rem; color: var(--danger-400);">${result.recommendation}</div>` : ''}
        </div>
      `;
    }
    
    showSuccess(`Continuity test: ${result.status} (${result.quality})`);
  };

  // Navigation handlers
  window._openLPSInspection = (id) => {
    navigate('lps-inspection', { id });
  };

  window._viewLPSReport = async (id) => {
    showInfo('Generating LPS report...');
    try {
      const { generateLPSReport } = await import('../lib/lps-report-generator.js');
      const summary = await fetchLPSSummary(id);
      await generateLPSReport(id, summary);
      showSuccess('Laporan LPS berhasil di-generate');
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Fitur laporan sedang dikembangkan');
    }
  };

  window._exportLPSData = async (id) => {
    showInfo('Mengexport data LPS...');
    try {
      const summary = await fetchLPSSummary(id);
      
      const exportData = {
        project_id: id,
        export_date: new Date().toISOString(),
        risk_assessments: summary.latestRisk || null,
        components: summary.components,
        grounding_tests: summary.groundingTests,
        inspections: summary.inspections,
        summary: {
          is_required: summary.isRequired,
          lpl_level: summary.lplLevel,
          total_components: summary.totalComponents,
          total_grounding_tests: summary.totalGroundingTests,
          passed_tests: summary.passedGroundingTests
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lps_data_${id}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Data LPS berhasil di-export');
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Gagal export data: ' + error.message);
    }
  };

  // Soil resistivity auto-classify on input
  const rhoInput = document.getElementById('lps-rho');
  if (rhoInput) {
    rhoInput.addEventListener('input', (e) => {
      const rho = parseFloat(e.target.value);
      if (rho) {
        const soilClass = classifySoil(rho);
        document.getElementById('lps-soil-class').innerHTML = `
          <span style="color: ${soilClass.type === 'VERY_WET' ? 'var(--success-400)' : soilClass.type === 'DRY' ? 'var(--warning-400)' : 'var(--text-tertiary)'}">
            ${soilClass.label} - ${soilClass.description}
          </span>
        `;
      }
    });
  }
}

export default {
  renderLPSCard,
  renderLPSModule,
  fetchLPSSummary,
  initLPSHandlers
};
