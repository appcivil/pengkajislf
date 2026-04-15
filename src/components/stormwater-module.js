/**
 * STORMWATER MANAGEMENT MODULE
 * Modul pemeriksaan sistem pengelolaan air hujan untuk SLF
 * Berdasarkan: PP 16/2021 Pasal 224 ayat (11), SNI 2415:2016, SNI 6398:2011
 * UI/UX: Presidential Quartz Style
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError } from './toast.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchStormwaterSummary(projectId) {
  try {
    const { data: simulationData, error: simError } = await supabase
      .from('stormwater_simulations')
      .select('*')
      .eq('project_id', projectId)
      .single();

    const { data: evaluationData, error: evalError } = await supabase
      .from('stormwater_evaluations')
      .select('*')
      .eq('project_id', projectId)
      .single();

    const hasData = !!(simulationData || evaluationData);

    const simSummary = simulationData?.simulation_data?.summary || {};
    const evalSummary = evaluationData?.evaluation_data?.summary || {};

    // Calculate overall status
    let overallStatus = 'NOT_STARTED';
    if (evalSummary.status) {
      overallStatus = evalSummary.status;
    } else if (hasData) {
      overallStatus = 'IN_PROGRESS';
    }

    return {
      hasData,
      overallStatus,
      simulationCount: simulationData ? 1 : 0,
      evaluationScore: parseFloat(evalSummary.score) || 0,
      complianceStatus: evalSummary.status || 'NOT_STARTED',
      peakRunoff: simSummary.peakOutflow || 0,
      volumeReduction: simSummary.volumeReduction || 0,
      lidCount: simulationData?.simulation_data?.lid?.length || 0,
      catchmentCount: simulationData?.simulation_data?.catchments?.length || 0,
      lastUpdated: simulationData?.created_at || evaluationData?.created_at || null
    };
  } catch (error) {
    console.error('Error fetching stormwater summary:', error);
    return {
      hasData: false,
      overallStatus: 'NOT_STARTED',
      simulationCount: 0,
      evaluationScore: 0,
      complianceStatus: 'NOT_STARTED',
      peakRunoff: 0,
      volumeReduction: 0,
      lidCount: 0,
      catchmentCount: 0
    };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderStormwaterCard(project, summary = {}) {
  const statusColors = {
    'COMPLIANT': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)', icon: 'fa-check-circle' },
    'PARTIAL': { bg: 'hsla(45, 90%, 60%, 0.1)', text: 'var(--warning-400)', border: 'var(--warning-500)', icon: 'fa-exclamation-circle' },
    'NON_COMPLIANT': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)', icon: 'fa-times-circle' },
    'IN_PROGRESS': { bg: 'hsla(220, 95%, 52%, 0.1)', text: 'var(--brand-400)', border: 'var(--brand-500)', icon: 'fa-spinner' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)', icon: 'fa-cloud-rain' }
  };

  const st = statusColors[summary.overallStatus] || statusColors['NOT_STARTED'];
  const hasData = summary.hasData;

  return `
    <div class="card-quartz clickable" id="stormwater-card" onclick="window.navigate('stormwater',{id:'${project.id}'} )" 
      style="padding: var(--space-6); background: ${st.bg}; border-color: ${st.border}44">
      
      <div class="flex-between" style="margin-bottom: 20px">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: ${st.bg}; display: flex; align-items: center; justify-content: center; color: ${st.text}; border: 1px solid ${st.border}44">
          <i class="fas fa-cloud-showers-heavy" style="font-size: 1.4rem"></i>
        </div>
        <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: ${st.text}">
          ${summary.evaluationScore > 0 ? summary.evaluationScore + '%' : '-'}
        </div>
      </div>
      
      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 4px">
        Sistem Pengelolaan Air Hujan
      </h3>
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5">
        PP 16/2021 • Pasal 224 (11) • SNI 2415:2016
      </p>
      
      ${hasData ? `
        <div style="margin-top: 20px">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="text-align: center; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 8px;">
              <div style="font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px;">Peak Flow</div>
              <div style="font-size: 0.9rem; font-weight: 700; color: ${st.text}; font-family: var(--font-mono);">
                ${(summary.peakRunoff || 0).toFixed(2)} m³/s
              </div>
            </div>
            <div style="text-align: center; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 8px;">
              <div style="font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px;">LID Capture</div>
              <div style="font-size: 0.9rem; font-weight: 700; color: ${st.text}; font-family: var(--font-mono);">
                ${((summary.volumeReduction || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${summary.catchmentCount > 0 ? `
              <span style="font-size: 0.65rem; background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 3px 8px; border-radius: 4px;">
                ${summary.catchmentCount} Catchments
              </span>
            ` : ''}
            ${summary.lidCount > 0 ? `
              <span style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 3px 8px; border-radius: 4px;">
                ${summary.lidCount} LID
              </span>
            ` : ''}
          </div>
        </div>
      ` : `
        <div style="margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px; text-align: center;">
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin: 0;">
            <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
            Klik untuk melakukan evaluasi sistem drainase
          </p>
        </div>
      `}
      
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.7rem; color: var(--text-tertiary);">
            Status: <span style="color: ${st.text}; font-weight: 600;">${formatStatus(summary.overallStatus)}</span>
          </span>
          <i class="fas fa-arrow-right" style="font-size: 0.75rem; color: ${st.text};"></i>
        </div>
      </div>
    </div>
  `;
}

function formatStatus(status) {
  const statusMap = {
    'COMPLIANT': 'Memenuhi',
    'PARTIAL': 'Sebagian',
    'NON_COMPLIANT': 'Tidak Memenuhi',
    'IN_PROGRESS': 'Dalam Proses',
    'NOT_STARTED': 'Belum Mulai'
  };
  return statusMap[status] || status;
}

// ============================================================
// 3. HANDLER INITIALIZATION
// ============================================================

export function initStormwaterHandlers(project, summary = {}) {
  // Handlers are initialized through the card click event
  // Additional handlers can be added here if needed
}

// ============================================================
// 4. QUICK ACTIONS
// ============================================================

export async function quickRunSimulation(projectId) {
  try {
    // Import engine dynamically
    const { StormwaterEngine } = await import('../modules/stormwater/core/StormwaterEngine.js');
    const engine = new StormwaterEngine();

    // Run with default config
    const config = {
      city: 'Jakarta',
      returnPeriod: 25,
      duration: 120,
      timestep: 5,
      stormType: 'SCS Type II',
      catchments: [
        { id: 'roof', area: 500, curveNumber: 98, landUse: 'roof', flowLength: 50, slope: 0.01 },
        { id: 'pavement', area: 200, curveNumber: 96, landUse: 'pavement', flowLength: 30, slope: 0.005 }
      ]
    };

    const results = engine.runSimulation(config);

    // Save to database
    const { StormwaterService } = await import('../modules/stormwater/services/StormwaterService.js');
    const service = new StormwaterService();
    await service.saveSimulation(projectId, results);

    showSuccess('Simulasi cepat berhasil dijalankan');
    return results;
  } catch (error) {
    console.error('Error running quick simulation:', error);
    showError('Gagal menjalankan simulasi');
    return null;
  }
}

export async function exportStormwaterData(projectId) {
  try {
    const { StormwaterService } = await import('../modules/stormwater/services/StormwaterService.js');
    const service = new StormwaterService();

    const simulation = await service.loadSimulation(projectId);
    if (!simulation) {
      showError('Tidak ada data simulasi untuk di-export');
      return;
    }

    const inp = service.generateSWMMInput(simulation);

    // Download file
    const blob = new Blob([inp], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stormwater-${projectId}.inp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('File SWMM berhasil di-download');
  } catch (error) {
    console.error('Error exporting data:', error);
    showError('Gagal mengekspor data');
  }
}

// ============================================================
// 5. MODULE INFO
// ============================================================

export const STORMWATER_MODULE_INFO = {
  name: 'Sistem Pengelolaan Air Hujan',
  description: 'Evaluasi sistem drainase dan pengelolaan air hujan sesuai PP 16/2021 Pasal 224 ayat (11)',
  standards: [
    'PP 16/2021 Pasal 224 ayat (11)',
    'SNI 2415:2016 - Tata Cara Perencanaan Sistem Drainase Perkotaan',
    'SNI 6398:2011 - Tata Cara Perencanaan Teknik Sumur Resapan Air Hujan',
    'Permen PUPR 22/PRT/M/2020 - Penyelenggaraan Sistem Drainase Perkotaan'
  ],
  features: [
    'Design Storm Generator (IDF Curves)',
    'SCS Curve Number Method',
    'Hydraulic Routing (Kinematic/Dynamic Wave)',
    'LID Controls (Green Infrastructure)',
    'Water Quality Simulation',
    'Pasal 224 Compliance Check',
    'SWMM .inp Export'
  ]
};

export default {
  fetchStormwaterSummary,
  renderStormwaterCard,
  initStormwaterHandlers,
  quickRunSimulation,
  exportStormwaterData,
  STORMWATER_MODULE_INFO
};
