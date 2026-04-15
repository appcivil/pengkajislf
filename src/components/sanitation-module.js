/**
 * SANITATION MODULE - Project Detail Integration
 * Card component for displaying sanitation summary in project detail page
 * Pemeriksaan Sistem Pembuangan Kotoran dan Sampah
 */

import {
  getSepticTanks,
  getIPALs,
  getChutes,
  getEffluentTests,
  getSludgeRecords,
  initSanitationDatabase
} from '../lib/sanitation-data-manager.js';

import { calculateSepticTankVolume, calculateTreatmentEfficiency, getStatusBadge } from '../lib/sanitation-calculator.js';
import { generateFlowDiagram } from '../lib/sanitation-visualization.js';

// ============================================================
// SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchSanitationSummary(projectId) {
  try {
    await initSanitationDatabase();
    
    const [septicTanks, ipals, chutes, effluentTests, sludgeRecords] = await Promise.all([
      getSepticTanks(projectId),
      getIPALs(projectId),
      getChutes(projectId),
      getEffluentTests(projectId),
      getSludgeRecords(projectId)
    ]);
    
    const hasData = septicTanks.length > 0 || ipals.length > 0 || chutes.length > 0;
    
    // Calculate compliance for each septic tank
    const tankCompliance = septicTanks.map(tank => {
      const volume = calculateSepticTankVolume(tank.population || 5, tank.waterUsage || 100);
      return {
        id: tank.id,
        name: tank.name,
        status: volume.status,
        volume: tank.volume || volume.minVolume,
        population: tank.population || 5
      };
    });
    
    // Calculate compliance for effluent
    const latestTest = effluentTests.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0];
    let effluentStatus = 'UNKNOWN';
    if (latestTest) {
      const efficiency = calculateTreatmentEfficiency(
        latestTest.inletValues?.bod || 200,
        latestTest.parameters?.bod || 30,
        latestTest.inletValues?.tss || 150,
        latestTest.parameters?.tss || 45,
        latestTest.parameters?.ph || 7
      );
      effluentStatus = efficiency.status;
    }
    
    // Check sludge levels
    const criticalSludge = sludgeRecords.filter(r => r.urgency === 'CRITICAL');
    const sludgeStatus = criticalSludge.length > 0 ? 'CRITICAL' : 
                         sludgeRecords.some(r => r.urgency === 'HIGH') ? 'HIGH' : 'NORMAL';
    
    // Overall status
    const hasNonCompliantTanks = tankCompliance.some(t => t.status === 'NC');
    const overallStatus = hasNonCompliantTanks || effluentStatus === 'NC' ? 'NC' : 'C';
    
    return {
      hasData,
      overallStatus,
      counts: {
        septicTanks: septicTanks.length,
        ipals: ipals.length,
        chutes: chutes.length,
        effluentTests: effluentTests.length,
        sludgeRecords: sludgeRecords.length
      },
      tankCompliance,
      effluentStatus,
      sludgeStatus,
      latestTest,
      criticalSludge: criticalSludge.length
    };
  } catch (error) {
    console.error('Error fetching sanitation summary:', error);
    return {
      hasData: false,
      overallStatus: 'UNKNOWN',
      counts: { septicTanks: 0, ipals: 0, chutes: 0, effluentTests: 0, sludgeRecords: 0 },
      tankCompliance: [],
      effluentStatus: 'UNKNOWN',
      sludgeStatus: 'NORMAL'
    };
  }
}

// ============================================================
// SUMMARY CARD RENDERER
// ============================================================

export function renderSanitationCard(project, summary = {}) {
  const statusColors = {
    'C': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'NC': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'UNKNOWN': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' }
  };
  
  const st = statusColors[summary.overallStatus] || statusColors['UNKNOWN'];
  const hasData = summary.hasData;
  
  return `
    <div class="card-quartz" id="sanitation-card" style="padding: var(--space-6); grid-column: 1 / -1;">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(25, 85%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(25, 85%, 55%, 1);">
            <i class="fas fa-toilet" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: hsla(25, 85%, 55%, 1);">PHASE 02G</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Sistem Pembuangan Kotoran & Sampah</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border}44; font-size: 10px;">
            <i class="fas ${summary.overallStatus === 'C' ? 'fa-check-circle' : summary.overallStatus === 'NC' ? 'fa-circle-exclamation' : 'fa-circle-minus'}" style="margin-right: 6px;"></i>
            ${summary.overallStatus === 'C' ? 'COMPLIANT' : summary.overallStatus === 'NC' ? 'NON-COMPLIANT' : 'BELUM DINILAI'}
          </span>
          <span class="badge" style="background: hsla(25, 85%, 45%, 0.1); color: hsla(25, 85%, 55%, 1); border: 1px solid hsla(25, 85%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>PP 16/2021
          </span>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Pemeriksaan sistem pembuangan kotoran dan sampah berdasarkan PP 16/2021 Pasal 224, 
        SNI 03-3981-1995, dan SNI 2398:2017. Meliputi inlet/chute, septic tank, IPAL, dan jarak aman.
      </p>

      ${hasData ? `
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.counts?.septicTanks || 0}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">SEPTIC TANK</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.counts?.ipals || 0}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">IPAL</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.counts?.chutes || 0}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">CHUTE</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.effluentStatus === 'C' ? 'var(--success-400)' : summary.effluentStatus === 'NC' ? 'var(--danger-400)' : 'var(--text-tertiary)'};">${summary.counts?.effluentTests || 0}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">UJI EFFLUENT</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.sludgeStatus === 'CRITICAL' ? 'var(--danger-400)' : summary.sludgeStatus === 'HIGH' ? 'var(--warning-400)' : 'var(--success-400)'};">${summary.counts?.sludgeRecords || 0}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">RECORD LUMPUR</div>
          </div>
        </div>
        
        <!-- Alerts -->
        ${summary.criticalSludge > 0 ? `
          <div style="background: hsla(0, 85%, 60%, 0.1); border: 1px solid hsla(0, 85%, 60%, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 12px; color: var(--danger-400);">
              <i class="fas fa-triangle-exclamation" style="margin-right: 8px;"></i>
              Terdapat ${summary.criticalSludge} septic tank dengan tingkat lumpur kritis. Segera lakukan pengurasan!
            </div>
          </div>
        ` : ''}
        
        ${summary.tankCompliance?.some(t => t.status === 'NC') ? `
          <div style="background: hsla(0, 85%, 60%, 0.1); border: 1px solid hsla(0, 85%, 60%, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 12px; color: var(--danger-400);">
              <i class="fas fa-triangle-exclamation" style="margin-right: 8px;"></i>
              ${summary.tankCompliance.filter(t => t.status === 'NC').length} septic tank tidak memenuhi volume minimum SNI 03-3981-1995
            </div>
          </div>
        ` : ''}
        
        ${summary.effluentStatus === 'NC' ? `
          <div style="background: hsla(0, 85%, 60%, 0.1); border: 1px solid hsla(0, 85%, 60%, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 12px; color: var(--danger-400);">
              <i class="fas fa-triangle-exclamation" style="margin-right: 8px;"></i>
              Kualitas effluent tidak memenuhi baku mutu PM 68/2016. Periksa kinerja IPAL.
            </div>
          </div>
        ` : ''}
        
        <!-- Mini Flow Diagram -->
        <div style="margin: 20px 0; padding: 20px; background: hsla(220, 20%, 100%, 0.02); border-radius: 12px;">
          ${generateFlowDiagram({
            hasChute: summary.counts?.chutes > 0,
            hasSeptic: summary.counts?.septicTanks > 0,
            hasIPAL: summary.counts?.ipals > 0,
            septicStatus: summary.sludgeStatus === 'CRITICAL' ? 'critical' : 'normal',
            ipalStatus: summary.effluentStatus === 'NC' ? 'critical' : 'normal',
            flowRate: 100
          })}
        </div>
        
        <!-- Latest Test Summary -->
        ${summary.latestTest ? `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">
            <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 8px;">HASIL UJI EFFLUENT TERAKHIR</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
              <div style="background: hsla(220, 20%, 100%, 0.02); border-radius: 8px; padding: 12px;">
                <div style="font-size: 10px; color: var(--text-tertiary);">BOD</div>
                <div style="font-size: 18px; color: ${summary.latestTest.parameters?.bod <= 30 ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 700; font-family: var(--font-mono);">${summary.latestTest.parameters?.bod || '-'} <span style="font-size: 10px;">mg/L</span></div>
                <div style="font-size: 9px; color: var(--text-tertiary);">Standar: ≤30</div>
              </div>
              <div style="background: hsla(220, 20%, 100%, 0.02); border-radius: 8px; padding: 12px;">
                <div style="font-size: 10px; color: var(--text-tertiary);">TSS</div>
                <div style="font-size: 18px; color: ${summary.latestTest.parameters?.tss <= 50 ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 700; font-family: var(--font-mono);">${summary.latestTest.parameters?.tss || '-'} <span style="font-size: 10px;">mg/L</span></div>
                <div style="font-size: 9px; color: var(--text-tertiary);">Standar: ≤50</div>
              </div>
              <div style="background: hsla(220, 20%, 100%, 0.02); border-radius: 8px; padding: 12px;">
                <div style="font-size: 10px; color: var(--text-tertiary);">pH</div>
                <div style="font-size: 18px; color: ${summary.latestTest.parameters?.ph >= 6 && summary.latestTest.parameters?.ph <= 9 ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 700; font-family: var(--font-mono);">${summary.latestTest.parameters?.ph || '-'} <span style="font-size: 10px;"></span></div>
                <div style="font-size: 9px; color: var(--text-tertiary);">Standar: 6-9</div>
              </div>
              <div style="background: hsla(220, 20%, 100%, 0.02); border-radius: 8px; padding: 12px;">
                <div style="font-size: 10px; color: var(--text-tertiary);">Tanggal</div>
                <div style="font-size: 14px; color: white; font-weight: 600;">${new Date(summary.latestTest.testDate).toLocaleDateString('id-ID')}</div>
              </div>
            </div>
          </div>
        ` : ''}
        
      ` : ''}

      <!-- Action Button -->
      <div style="margin-top: 24px;">
        <button onclick="window.navigate('sanitation-inspection', {id: '${project.id}'})" 
                class="btn ${hasData ? 'btn-primary' : 'btn-outline'}" style="width: 100%;">
          <i class="fas ${hasData ? 'fa-pen-ruler' : 'fa-plus'}" style="margin-right: 8px;"></i>
          ${hasData ? 'Lanjutkan Pemeriksaan' : 'Mulai Pemeriksaan'}
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// HANDLERS INITIALIZATION
// ============================================================

export function initSanitationHandlers(projectId) {
  // Handlers are attached through the global window object in renderSanitationCard
  console.log('[Sanitation] Handlers initialized for project:', projectId);
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {
  fetchSanitationSummary,
  renderSanitationCard,
  initSanitationHandlers
};
