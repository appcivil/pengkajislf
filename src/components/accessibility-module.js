/**
 * AKSESIBILITAS & KEMUDAHAN MODULE
 * Pemeriksaan Aspek Kemudahan berdasarkan PP 16/2021, SNI 8153:2015, dll.
 * UI Style: Presidential Quartz
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { openModal, confirm } from '../components/modal.js';
import {
  calculateHorizontalAccessibility,
  calculateRampAccessibility,
  calculateDoorAccessibility,
  evaluateFloorSurface,
  calculateStairAccessibility,
  calculateElevatorAccessibility,
  calculateEscalatorAccessibility,
  calculateLandingZone,
  calculateAccessibleToilet,
  calculateAccessibleParking,
  checkSignageAccessibility,
  calculateAccessibilityScore,
  analyzeAccessibleEvacuationPath,
  calculateRepairPriority,
  evaluateInfrastructure,
  generateBIMCsv,
  generateComplianceSummary,
  simulateWheelchairPath,
  calculateWhatIfScenario,
  ACCESSIBILITY_STANDARDS,
  INFRASTRUCTURE_CHECKLIST,
  LEGAL_REFERENCES
} from '../lib/accessibility-calculators.js';
import {
  saveAccessibilityScore,
  saveAccessibilityElement,
  fetchAccessibilityData,
  uploadAccessibilityFile,
  fetchAccessibilityFiles,
  deleteAccessibilityFile,
  exportToCSV,
  backupToDrive,
  syncWithDrive,
  getAccessibilityAnalytics
} from '../lib/accessibility-service.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchAccessibilitySummary(projectId) {
  try {
    const [corridors, ramps, stairs, elevators, toilets, parking, signage, infrastructure, overall] = await Promise.all([
      supabase.from('accessibility_corridors').select('*').eq('project_id', projectId),
      supabase.from('accessibility_ramps').select('*').eq('project_id', projectId),
      supabase.from('accessibility_stairs').select('*').eq('project_id', projectId),
      supabase.from('accessibility_elevators').select('*').eq('project_id', projectId),
      supabase.from('accessibility_toilets').select('*').eq('project_id', projectId),
      supabase.from('accessibility_parking').select('*').eq('project_id', projectId),
      supabase.from('accessibility_signage').select('*').eq('project_id', projectId),
      supabase.from('accessibility_infrastructure').select('*').eq('project_id', projectId).limit(1),
      supabase.from('accessibility_scores').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1)
    ]);

    const hasData = corridors.data?.length > 0 || ramps.data?.length > 0 || stairs.data?.length > 0;

    // Calculate compliance counts
    const corridorCompliant = corridors.data?.filter(c => c.status === 'C').length || 0;
    const rampCompliant = ramps.data?.filter(r => r.status === 'C').length || 0;
    const stairCompliant = stairs.data?.filter(s => s.status === 'C').length || 0;
    const elevatorCompliant = elevators.data?.filter(e => e.status === 'C').length || 0;
    const toiletCompliant = toilets.data?.filter(t => t.status === 'C').length || 0;

    const totalItems = (corridors.data?.length || 0) + (ramps.data?.length || 0) + 
                      (stairs.data?.length || 0) + (elevators.data?.length || 0) + 
                      (toilets.data?.length || 0);
    const compliantItems = corridorCompliant + rampCompliant + stairCompliant + elevatorCompliant + toiletCompliant;

    const overallScore = overall.data?.[0]?.score || 0;

    return {
      hasData,
      overallScore: overallScore,
      grade: overall.data?.[0]?.grade || '-',
      status: overall.data?.[0]?.status || 'BELUM DINILAI',
      totalItems: totalItems,
      compliantItems: compliantItems,
      complianceRate: totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0,
      corridorCount: corridors.data?.length || 0,
      rampCount: ramps.data?.length || 0,
      stairCount: stairs.data?.length || 0,
      elevatorCount: elevators.data?.length || 0,
      toiletCount: toilets.data?.length || 0,
      parkingSlots: parking.data?.[0]?.accessible_slots || 0,
      requiredParking: parking.data?.[0]?.required_slots || 0,
      infrastructure: infrastructure.data?.[0] || null
    };
  } catch (error) {
    console.error('Error fetching accessibility summary:', error);
    return {
      hasData: false,
      overallScore: 0,
      grade: '-',
      status: 'BELUM DINILAI',
      totalItems: 0,
      compliantItems: 0,
      complianceRate: 0
    };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderAccessibilityCard(project, summary = {}) {
  const statusColors = {
    'Sangat Baik': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'Baik': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'Cukup': { bg: 'hsla(45, 90%, 60%, 0.1)', text: 'var(--gold-400)', border: 'var(--gold-500)' },
    'Kurang': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'Perlu Perbaikan': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'BELUM DINILAI': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' }
  };

  const st = statusColors[summary.status] || statusColors['BELUM DINILAI'];
  const hasData = summary.hasData;

  return `
    <div class="card-quartz" id="accessibility-card" style="padding: var(--space-6); grid-column: 1 / -1;">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(280, 70%, 50%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(280, 70%, 60%, 1);">
            <i class="fas fa-wheelchair" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: hsla(280, 70%, 60%, 1);">PHASE 02G</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Pemeriksaan Aspek Kemudahan</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border}44; font-size: 10px;">
            <i class="fas ${summary.grade === 'A' || summary.grade === 'B' ? 'fa-check-circle' : summary.grade === 'C' ? 'fa-circle-exclamation' : 'fa-circle-minus'}" style="margin-right: 6px;"></i>
            ${summary.status}
          </span>
          <span class="badge" style="background: hsla(280, 70%, 50%, 0.1); color: hsla(280, 70%, 60%, 1); border: 1px solid hsla(280, 70%, 50%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>PP 16/2021
          </span>
        </div>
      </div>

      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Pemeriksaan aksesibilitas berdasarkan Pasal 226 & 227 PP 16/2021, SNI 8153:2015, SNI 03-1733-1989, SNI 03-6197-2000, dan Permen PU 30/2006.
        Meliputi akses horizontal, akses vertikal, prasarana, sarana, dan signage.
      </p>

      ${hasData ? `
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.overallScore}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">SCORE (${summary.grade})</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.complianceRate >= 80 ? 'var(--success-400)' : summary.complianceRate >= 60 ? 'var(--warning-400)' : 'var(--danger-400)'}">${summary.complianceRate}%</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">COMPLIANCE</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.corridorCount}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">KORIDOR</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.elevatorCount}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">LIFT</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.parkingSlots >= summary.requiredParking ? 'var(--success-400)' : 'var(--warning-400)'}">${summary.parkingSlots}/${summary.requiredParking}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">PARKIR DIFABEL</div>
          </div>
        </div>

        <!-- Compliance Score -->
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">
          <div class="flex-between" style="margin-bottom: 8px;">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary);">ACCESSIBILITY SCORE</span>
            <span style="font-size: 0.7rem; font-weight: 800; color: ${summary.overallScore >= 80 ? 'var(--success-400)' : summary.overallScore >= 60 ? 'var(--warning-400)' : 'var(--danger-400)'}">${summary.overallScore}/100</span>
          </div>
          <div style="height: 6px; background: hsla(220, 20%, 100%, 0.05); border-radius: 10px;">
            <div style="width: ${summary.overallScore}%; height: 100%; border-radius: 10px; background: ${summary.overallScore >= 80 ? 'var(--success-500)' : summary.overallScore >= 60 ? 'var(--warning-500)' : 'var(--danger-500)'}; box-shadow: 0 0 10px ${summary.overallScore >= 80 ? 'var(--success-500)' : summary.overallScore >= 60 ? 'var(--warning-500)' : 'var(--danger-500)'}66;"></div>
          </div>
          ${summary.totalItems - summary.compliantItems > 0 ? `
            <div style="margin-top: 8px; font-size: 10px; color: var(--danger-400);">
              <i class="fas fa-triangle-exclamation" style="margin-right: 4px;"></i>
              ${summary.totalItems - summary.compliantItems} aspek perlu perbaikan
            </div>
          ` : ''}
        </div>

        <!-- Quick Actions -->
        <div style="margin-top: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          <button onclick="window._openAccessibilityCalculator('corridor')" class="btn btn-outline btn-sm" style="border-color: hsla(220, 20%, 100%, 0.1);">
            <i class="fas fa-ruler-horizontal" style="margin-right: 6px;"></i> Kalkulator Koridor
          </button>
          <button onclick="window._openAccessibilityCalculator('ramp')" class="btn btn-outline btn-sm" style="border-color: hsla(220, 20%, 100%, 0.1);">
            <i class="fas fa-angle-up" style="margin-right: 6px;"></i> Kalkulator Ramp
          </button>
          <button onclick="window._openAccessibilityCalculator('stair')" class="btn btn-outline btn-sm" style="border-color: hsla(220, 20%, 100%, 0.1);">
            <i class="fas fa-stairs" style="margin-right: 6px;"></i> Kalkulator Tangga
          </button>
          <button onclick="window._openAccessibilityCalculator('parking')" class="btn btn-outline btn-sm" style="border-color: hsla(220, 20%, 100%, 0.1);">
            <i class="fas fa-car" style="margin-right: 6px;"></i> Kalkulator Parkir
          </button>
        </div>

        <!-- Presidential Tab Navigation -->
        <div class="card-quartz" style="padding: 6px; margin-top: 24px; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
          <button onclick="window._switchAccessibilityTab('horizontal', this)" 
                  class="accessibility-tab-item active"
                  data-tab="horizontal"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
            <i class="fas fa-arrows-left-right"></i> AKSES HORIZONTAL
          </button>
          <button onclick="window._switchAccessibilityTab('vertical', this)" 
                  class="accessibility-tab-item"
                  data-tab="vertical"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-arrows-up-down"></i> AKSES VERTIKAL
          </button>
          <button onclick="window._switchAccessibilityTab('facilities', this)" 
                  class="accessibility-tab-item"
                  data-tab="facilities"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-building"></i> PRASARANA & SARANA
          </button>
          <button onclick="window._switchAccessibilityTab('scoring', this)" 
                  class="accessibility-tab-item"
                  data-tab="scoring"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-chart-radar"></i> SCORING & SIMULASI
          </button>
          <button onclick="window._switchAccessibilityTab('report', this)" 
                  class="accessibility-tab-item"
                  data-tab="report"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-file-alt"></i> LAPORAN
          </button>
        </div>

        <!-- TAB CONTENT: HORIZONTAL ACCESS -->
        <div id="accessibility-tab-horizontal" class="accessibility-tab-content active" style="margin-top: 20px;">
          ${renderHorizontalAccessTab()}
        </div>

        <!-- TAB CONTENT: VERTICAL ACCESS -->
        <div id="accessibility-tab-vertical" class="accessibility-tab-content" style="display: none; margin-top: 20px;">
          ${renderVerticalAccessTab()}
        </div>

        <!-- TAB CONTENT: FACILITIES -->
        <div id="accessibility-tab-facilities" class="accessibility-tab-content" style="display: none; margin-top: 20px;">
          ${renderFacilitiesTab()}
        </div>

        <!-- TAB CONTENT: SCORING -->
        <div id="accessibility-tab-scoring" class="accessibility-tab-content" style="display: none; margin-top: 20px;">
          ${renderScoringTab()}
        </div>

        <!-- TAB CONTENT: REPORT -->
        <div id="accessibility-tab-report" class="accessibility-tab-content" style="display: none; margin-top: 20px;">
          ${renderReportTab()}
        </div>
      ` : `
        <div style="margin-top: 20px; padding: 24px; background: hsla(220, 20%, 100%, 0.02); border: 1px dashed hsla(220, 20%, 100%, 0.1); border-radius: 12px; text-align: center;">
          <i class="fas fa-wheelchair" style="font-size: 2rem; color: var(--text-tertiary); margin-bottom: 12px;"></i>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Belum ada data pemeriksaan aksesibilitas</p>
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">Mulai analisis dengan input data koridor, ramp, tangga, dan fasilitas</p>
          <button onclick="window._initAccessibilityAnalysis('${project.id}')" class="btn btn-primary btn-sm">
            <i class="fas fa-play" style="margin-right: 6px;"></i> Mulai Analisis
          </button>
        </div>
      `}

      <style>
        .accessibility-tab-item:hover { background: hsla(220, 20%, 100%, 0.05); }
        .accessibility-tab-item.active { background: var(--gradient-brand) !important; color: white !important; }
        .accessibility-tab-content { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      </style>
    </div>
  `;
}

// ============================================================
// 3. TAB CONTENT RENDERERS
// ============================================================

function renderHorizontalAccessTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Corridor Analysis -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-ruler-horizontal"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Analisis Jalur Sirkulasi</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 8153:2015 - Pasal 227</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Bebas (cm)</label>
            <input type="number" id="acc-corridor-width" class="form-input" placeholder="150" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tinggi Bebas (cm)</label>
            <input type="number" id="acc-corridor-height" class="form-input" placeholder="220" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jumlah Obstacle</label>
          <input type="number" id="acc-corridor-obstacles" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
        </div>

        <button onclick="window._analyzeCorridor()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Analisis Koridor
        </button>

        <div id="acc-corridor-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Ramp Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-angle-up"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Kalkulator Kemiringan Ramp</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 8153:2015 - Max 8.33%</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kenaikan Vertikal (cm)</label>
            <input type="number" id="acc-ramp-rise" class="form-input" placeholder="30" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jarak Horizontal (m)</label>
            <input type="number" id="acc-ramp-run" class="form-input" placeholder="6" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._analyzeRamp()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-chart-line" style="margin-right: 6px;"></i> Hitung Kemiringan
        </button>

        <div id="acc-ramp-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Door Analysis -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-door-open"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Pemeriksaan Pintu Akses</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 8153:2015 - Min 90cm</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Bukaan (cm)</label>
            <input type="number" id="acc-door-width" class="form-input" placeholder="90" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Ambang Threshold (cm)</label>
            <input type="number" id="acc-door-threshold" class="form-input" placeholder="1.5" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._analyzeDoor()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Validasi Pintu
        </button>

        <div id="acc-door-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Floor Surface -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-layer-group"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Analisis Lantai & Permukaan</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 8153:2015 - Slip Resist 0.6</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Koefisien Gesek</label>
            <input type="number" id="acc-floor-slip" class="form-input" placeholder="0.6" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kedataran (mm)</label>
            <input type="number" id="acc-floor-evenness" class="form-input" placeholder="6" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._analyzeFloor()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-shoe-prints" style="margin-right: 6px;"></i> Evaluasi Permukaan
        </button>

        <div id="acc-floor-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderVerticalAccessTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Stair Analysis -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-stairs"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Analisis Tangga</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 03-1733-1989 - 2R+T = 60-65</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tinggi Riser (cm)</label>
            <input type="number" id="acc-stair-riser" class="form-input" placeholder="17" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kedalaman Tread (cm)</label>
            <input type="number" id="acc-stair-tread" class="form-input" placeholder="28" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Tangga (cm)</label>
            <input type="number" id="acc-stair-width" class="form-input" placeholder="140" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jumlah Anak Tangga</label>
            <input type="number" id="acc-stair-count" class="form-input" placeholder="10" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._analyzeStair()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Analisis Tangga
        </button>

        <div id="acc-stair-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Elevator Checklist -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-elevator"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Evaluasi Lift/Elevator</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 8153:2015 - Min 140x110cm</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Kabin (cm)</label>
            <input type="number" id="acc-elevator-width" class="form-input" placeholder="150" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kedalaman Kabin (cm)</label>
            <input type="number" id="acc-elevator-depth" class="form-input" placeholder="130" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Fitur Aksesibilitas</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);">
              <input type="checkbox" id="acc-elevator-braille" style="accent-color: var(--brand-400);"> Tombol Braille
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);">
              <input type="checkbox" id="acc-elevator-handrail" style="accent-color: var(--brand-400);"> Handrail
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);">
              <input type="checkbox" id="acc-elevator-mirror" style="accent-color: var(--brand-400);"> Cermin
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);">
              <input type="checkbox" id="acc-elevator-emergency" style="accent-color: var(--brand-400);"> Alarm Darurat
            </label>
          </div>
        </div>

        <button onclick="window._analyzeElevator()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Evaluasi Lift
        </button>

        <div id="acc-elevator-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Landing Zone -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-square"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Analisis Area Pendaratan</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 8153:2015 - 150x150cm</div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tipe Landing</label>
          <select id="acc-landing-type" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="stair">Tangga</option>
            <option value="ramp">Ramp</option>
            <option value="wheelchair">Ruang Putar Wheelchair</option>
            <option value="door">Pintu</option>
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar (cm)</label>
            <input type="number" id="acc-landing-width" class="form-input" placeholder="150" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kedalaman (cm)</label>
            <input type="number" id="acc-landing-depth" class="form-input" placeholder="150" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._analyzeLanding()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-ruler-combined" style="margin-right: 6px;"></i> Analisis Landing
        </button>

        <div id="acc-landing-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Escalator Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(280, 70%, 50%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(280, 70%, 60%, 1);">
            <i class="fas fa-angle-double-up"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Kalkulator Eskalator</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 8153:2015 - Max 30°</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Sudut Kemiringan (°)</label>
            <input type="number" id="acc-escalator-angle" class="form-input" placeholder="30" max="30" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kecepatan (m/s)</label>
            <input type="number" id="acc-escalator-speed" class="form-input" placeholder="0.5" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._analyzeEscalator()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(280, 70%, 50%, 0.2); border-color: hsla(280, 70%, 50%, 0.3); color: hsla(280, 70%, 60%, 1);">
          <i class="fas fa-chart-line" style="margin-right: 6px;"></i> Evaluasi Eskalator
        </button>

        <div id="acc-escalator-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderFacilitiesTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Infrastructure Checklist -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-network-wired"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Inventarisasi Prasarana Utilitas</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">PP 16/2021 Pasal 226 ayat 7</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
          ${INFRASTRUCTURE_CHECKLIST.prasarana.map(item => `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); padding: 8px; background: hsla(220, 20%, 100%, 0.02); border-radius: 6px;">
              <input type="checkbox" id="acc-infra-${item.id}" class="acc-infra-check" data-type="prasarana" style="accent-color: var(--brand-400);">
              <span>${item.name} ${item.required ? '<span style="color: var(--danger-400);">*</span>' : ''}</span>
            </label>
          `).join('')}
        </div>

        <button onclick="window._saveInfrastructureChecklist()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-save" style="margin-right: 6px;"></i> Simpan Prasarana
        </button>

        <div id="acc-infra-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Supporting Facilities -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-building-user"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Evaluasi Sarana Penunjang</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">PP 16/2021 - Fasilitas Penunjang</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
          ${INFRASTRUCTURE_CHECKLIST.sarana.map(item => `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); padding: 8px; background: hsla(220, 20%, 100%, 0.02); border-radius: 6px;">
              <input type="checkbox" id="acc-sarana-${item.id}" class="acc-sarana-check" data-type="sarana" style="accent-color: var(--success-400);">
              <span>${item.name} ${item.required ? '<span style="color: var(--danger-400);">*</span>' : ''}</span>
            </label>
          `).join('')}
        </div>

        <button onclick="window._saveSaranaChecklist()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-save" style="margin-right: 6px;"></i> Simpan Sarana
        </button>

        <div id="acc-sarana-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Accessible Toilet -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-restroom"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Analisis Toilet Aksesibel</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">SNI 03-6197-2000</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Ruang (cm)</label>
            <input type="number" id="acc-toilet-width" class="form-input" placeholder="160" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kedalaman Ruang (cm)</label>
            <input type="number" id="acc-toilet-depth" class="form-input" placeholder="200" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tinggi Kloset (cm)</label>
            <input type="number" id="acc-toilet-height" class="form-input" placeholder="45" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kolong Wastafel (cm)</label>
            <input type="number" id="acc-toilet-clearance" class="form-input" placeholder="70" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);">
            <input type="checkbox" id="acc-toilet-grabbar" style="accent-color: var(--gold-400);"> Handrail
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);">
            <input type="checkbox" id="acc-toilet-emergency" style="accent-color: var(--gold-400);"> Alarm Darurat
          </label>
        </div>

        <button onclick="window._analyzeToilet()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Analisis Toilet
        </button>

        <div id="acc-toilet-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Accessible Parking -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-car"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Kalkulator Parkir Difabel</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Permen PU 30/2006 - 2%</div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Total Slot Parkir</label>
          <input type="number" id="acc-parking-total" class="form-input" placeholder="100" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Slot Difabel Ada</label>
            <input type="number" id="acc-parking-existing" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Dimensi (cm)</label>
            <input type="text" id="acc-parking-dimensions" class="form-input" placeholder="400x600" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._analyzeParking()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Kebutuhan
        </button>

        <div id="acc-parking-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderScoringTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Accessibility Score Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-chart-radar"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Accessibility Score Calculator</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Universal Design Audit</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Akses Horizontal (0-100)</label>
            <input type="number" id="acc-score-horizontal" class="form-input" placeholder="80" min="0" max="100" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Akses Vertikal (0-100)</label>
            <input type="number" id="acc-score-vertical" class="form-input" placeholder="75" min="0" max="100" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Fasilitas (0-100)</label>
            <input type="number" id="acc-score-facilities" class="form-input" placeholder="70" min="0" max="100" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Signage (0-100)</label>
            <input type="number" id="acc-score-signage" class="form-input" placeholder="85" min="0" max="100" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._calculateAccessibilityScore()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Skor
        </button>

        <div id="acc-score-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Wheelchair Path Simulation -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-wheelchair"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Persona Simulation</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Wheelchair Path Feasibility</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Koridor (cm)</label>
            <input type="number" id="acc-sim-corridor" class="form-input" placeholder="150" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Pintu (cm)</label>
            <input type="number" id="acc-sim-door" class="form-input" placeholder="90" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
          </div>
        </div>

        <button onclick="window._simulateWheelchairPath()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-play" style="margin-right: 6px;"></i> Simulasi Jalur
        </button>

        <div id="acc-sim-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- What-If Scenario -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-flask"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">What-If Scenario</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Simulasi Perubahan Desain</div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tipe Skenario</label>
          <select id="acc-whatif-type" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="corridor_widening">Pelebaran Koridor</option>
            <option value="ramp_relocation">Pemindahan Ramp</option>
            <option value="lift_addition">Penambahan Lift</option>
          </select>
        </div>

        <div id="acc-whatif-params" style="margin-bottom: 12px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Saat Ini (cm)</label>
              <input type="number" id="acc-whatif-current" class="form-input" placeholder="120" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            </div>
            <div>
              <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Baru (cm)</label>
              <input type="number" id="acc-whatif-new" class="form-input" placeholder="160" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            </div>
          </div>
        </div>

        <button onclick="window._runWhatIfScenario()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-lightbulb" style="margin-right: 6px;"></i> Jalankan Simulasi
        </button>

        <div id="acc-whatif-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Repair Priority Matrix -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Prioritas Perbaikan</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Impact vs Effort Analysis</div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Dampak Keselamatan</label>
          <select id="acc-priority-impact" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="high">High - Berbahaya</option>
            <option value="medium">Medium - Hambatan</option>
            <option value="low">Low - Ketidaknyamanan</option>
          </select>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kemudahan Implementasi</label>
          <select id="acc-priority-ease" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="easy">Easy - Mudah</option>
            <option value="medium">Medium - Sedang</option>
            <option value="hard">Hard - Sulit</option>
          </select>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jumlah Pengguna Terdampak</label>
          <input type="number" id="acc-priority-users" class="form-input" placeholder="10" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
        </div>

        <button onclick="window._calculateRepairPriority()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-sort-amount-down" style="margin-right: 6px;"></i> Hitung Prioritas
        </button>

        <div id="acc-priority-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderReportTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Compliance Check -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-gavel"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">PP 16/2021 Compliance Check</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Auto-check berdasarkan pasal</div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); margin-bottom: 12px;">REFERENSI REGULASI</div>
          ${Object.entries(LEGAL_REFERENCES).map(([key, refs]) => `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--brand-400); margin-bottom: 4px;">${key.toUpperCase()}</div>
              ${Object.entries(refs).map(([sub, desc]) => `
                <div style="font-size: 10px; color: var(--text-secondary); padding-left: 12px;">
                  • ${desc}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>

        <button onclick="window._generateComplianceReport()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-file-contract" style="margin-right: 6px;"></i> Generate Compliance Report
        </button>

        <div id="acc-compliance-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Export Options -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-file-export"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Export & BIM Integration</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">CSV, PDF, BIM-ready formats</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button onclick="window._exportToCSV()" class="btn btn-outline btn-sm" style="border-color: hsla(220, 20%, 100%, 0.1);">
            <i class="fas fa-file-csv" style="margin-right: 6px;"></i> Export CSV
          </button>
          <button onclick="window._exportToPDF()" class="btn btn-outline btn-sm" style="border-color: hsla(220, 20%, 100%, 0.1);">
            <i class="fas fa-file-pdf" style="margin-right: 6px;"></i> Export PDF
          </button>
        </div>

        <div style="margin-top: 12px; padding: 12px; background: hsla(220, 20%, 100%, 0.02); border-radius: 8px;">
          <div style="font-size: 10px; color: var(--text-tertiary); margin-bottom: 8px;">BIM-COMPATIBLE FORMATS</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span class="badge" style="background: hsla(220, 20%, 100%, 0.05); color: var(--text-secondary); font-size: 9px;">Revit</span>
            <span class="badge" style="background: hsla(220, 20%, 100%, 0.05); color: var(--text-secondary); font-size: 9px;">ArchiCAD</span>
            <span class="badge" style="background: hsla(220, 20%, 100%, 0.05); color: var(--text-secondary); font-size: 9px;">IFC</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 4. HANDLER INITIALIZATION
// ============================================================

export function initAccessibilityHandlers(projectId) {
  // Tab switching
  window._switchAccessibilityTab = (tabName, btn) => {
    document.querySelectorAll('.accessibility-tab-item').forEach(el => {
      el.classList.remove('active');
      el.style.background = '';
      el.style.color = 'var(--text-tertiary)';
    });

    document.querySelectorAll('.accessibility-tab-content').forEach(el => {
      el.style.display = 'none';
    });

    btn.classList.add('active');
    btn.style.background = 'var(--gradient-brand)';
    btn.style.color = 'white';

    const content = document.getElementById(`accessibility-tab-${tabName}`);
    if (content) {
      content.style.display = 'block';
    }
  };

  // Calculator modals
  window._openAccessibilityCalculator = (type) => {
    navigate('accessibility-inspection', { projectId, calculator: type });
  };

  // Init analysis
  window._initAccessibilityAnalysis = async (pid) => {
    showInfo('Memulai analisis aksesibilitas...');
    try {
      // Create initial records
      const { error } = await supabase.from('accessibility_scores').insert({
        project_id: pid,
        score: 0,
        grade: '-',
        status: 'DALAM ANALISIS'
      });

      if (error) throw error;

      showSuccess('Analisis aksesibilitas dimulai. Silakan input data.');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showError('Gagal memulai analisis: ' + err.message);
    }
  };

  // Corridor analysis with save to Supabase
  window._analyzeCorridor = async () => {
    const width = parseFloat(document.getElementById('acc-corridor-width')?.value) || 0;
    const height = parseFloat(document.getElementById('acc-corridor-height')?.value) || 0;
    const obstacles = parseInt(document.getElementById('acc-corridor-obstacles')?.value) || 0;
    const location = document.getElementById('acc-corridor-location')?.value || 'Lokasi tidak ditentukan';

    const result = calculateHorizontalAccessibility(width, height, []);

    const resultDiv = document.getElementById('acc-corridor-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.status} | ${result.wheelchairAccessible ? 'Wheelchair Accessible' : 'Tidak Aksesibel'}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Lebar Efektif: ${result.effectiveWidth}</div>
            <div>Two-Way Traffic: ${result.twoWayTraffic ? 'Yes' : 'No'}</div>
            ${result.bottleneck ? `<div>${result.bottleneck}</div>` : ''}
          </div>
          <button onclick="window._saveCorridorData()" class="btn btn-primary btn-sm" style="margin-top: 12px; width: 100%;">
            <i class="fas fa-save" style="margin-right: 6px;"></i> Simpan ke Database
          </button>
        </div>
      `;
      resultDiv.style.display = 'block';
    }

    window._currentCorridorData = {
      location,
      width,
      height,
      effective_width: result.effectiveWidth,
      obstacle_count: obstacles,
      wheelchair_accessible: result.wheelchairAccessible,
      two_way_traffic: result.twoWayTraffic,
      status: result.status,
      compliance_issues: result.bottleneck ? [result.bottleneck] : []
    };
  };

  window._saveCorridorData = async () => {
    if (!window._currentCorridorData) {
      showError('Analisis koridor terlebih dahulu');
      return;
    }
    try {
      await saveAccessibilityElement(projectId, 'corridor', window._currentCorridorData);
      showSuccess('Data koridor disimpan');
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };

  // Ramp analysis with save to Supabase
  window._analyzeRamp = async () => {
    const rise = parseFloat(document.getElementById('acc-ramp-rise')?.value) || 0;
    const run = parseFloat(document.getElementById('acc-ramp-run')?.value) || 0;
    const location = document.getElementById('acc-ramp-location')?.value || 'Lokasi tidak ditentukan';

    const result = calculateRampAccessibility(rise, run);

    const resultDiv = document.getElementById('acc-ramp-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'C' ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'C' ? 'var(--gold-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.status === 'C' ? 'var(--gold-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.status} | Kemiringan: ${result.slope}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Rasio: ${result.ratio}</div>
            <div>Landing Dibutuhkan: ${result.landingRequired ? 'Ya (' + result.landingCount + ')' : 'Tidak'}</div>
            <div>Handrail: ${result.handrailRequired ? 'Wajib' : 'Opsional'}</div>
          </div>
          <button onclick="window._saveRampData()" class="btn btn-primary btn-sm" style="margin-top: 12px; width: 100%;">
            <i class="fas fa-save" style="margin-right: 6px;"></i> Simpan ke Database
          </button>
        </div>
      `;
      resultDiv.style.display = 'block';
    }

    window._currentRampData = {
      location,
      rise,
      run,
      slope_ratio: result.ratio,
      landing_count: result.landingCount || 0,
      landing_required: result.landingRequired,
      handrail_required: result.handrailRequired,
      status: result.status,
      max_slope: parseFloat(result.slope),
      compliance_issues: result.landingRequired && !result.landingExists ? ['Landing diperlukan'] : []
    };
  };

  window._saveRampData = async () => {
    if (!window._currentRampData) {
      showError('Analisis ramp terlebih dahulu');
      return;
    }
    try {
      await saveAccessibilityElement(projectId, 'ramp', window._currentRampData);
      showSuccess('Data ramp disimpan');
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };

  // Door analysis
  window._analyzeDoor = () => {
    const width = parseFloat(document.getElementById('acc-door-width')?.value) || 0;
    const threshold = parseFloat(document.getElementById('acc-door-threshold')?.value) || 0;

    const result = calculateDoorAccessibility(width, 'wheelchair', threshold);

    const resultDiv = document.getElementById('acc-door-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.overallStatus === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.overallStatus === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.overallStatus === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.overallStatus}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Lebar: ${result.clearOpening} (min: ${result.requiredWidth})</div>
            <div>Ambang: ${result.thresholdHeight} (max: ${result.thresholdMax})</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Floor analysis
  window._analyzeFloor = () => {
    const slip = parseFloat(document.getElementById('acc-floor-slip')?.value) || 0;
    const evenness = parseFloat(document.getElementById('acc-floor-evenness')?.value) || 0;

    const result = evaluateFloorSurface(slip, evenness, false);

    const resultDiv = document.getElementById('acc-floor-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.overallStatus === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.overallStatus === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.overallStatus === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.overallStatus} | Risk: ${result.riskLevel}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Slip Resistance: ${result.slipCoefficient}/${result.slipStandard}</div>
            <div>Evenness: ${result.evenness} (max: ${result.evennessStandard})</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Stair analysis
  window._analyzeStair = () => {
    const riser = parseFloat(document.getElementById('acc-stair-riser')?.value) || 0;
    const tread = parseFloat(document.getElementById('acc-stair-tread')?.value) || 0;
    const width = parseFloat(document.getElementById('acc-stair-width')?.value) || 0;
    const count = parseInt(document.getElementById('acc-stair-count')?.value) || 0;

    const result = calculateStairAccessibility(riser, tread, width, count);

    const resultDiv = document.getElementById('acc-stair-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'C' ? 'hsla(220, 95%, 52%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'C' ? 'var(--brand-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.status === 'C' ? 'var(--brand-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.status} | ${result.comfortStatus}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Formula: ${result.formula2RT}</div>
            <div>Handrail: ${result.handrail} sisi</div>
            ${result.issues.length > 0 ? `<div style="color: var(--danger-400);">Issues: ${result.issues.join(', ')}</div>` : ''}
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Elevator analysis
  window._analyzeElevator = () => {
    const width = parseFloat(document.getElementById('acc-elevator-width')?.value) || 0;
    const depth = parseFloat(document.getElementById('acc-elevator-depth')?.value) || 0;

    const features = {
      brailleButtons: document.getElementById('acc-elevator-braille')?.checked || false,
      handrailLower: document.getElementById('acc-elevator-handrail')?.checked || false,
      mirror: document.getElementById('acc-elevator-mirror')?.checked || false,
      emergencyAlarm: document.getElementById('acc-elevator-emergency')?.checked || false
    };

    const result = calculateElevatorAccessibility(width, depth, 90, features);

    const resultDiv = document.getElementById('acc-elevator-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.overallStatus === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.overallStatus === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.overallStatus === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.overallStatus} | Fitur: ${result.featureScore}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Ukuran: ${result.cabinSize} (min: ${result.cabinRequired})</div>
            <div>Feature Score: ${result.featurePercentage}%</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Landing analysis
  window._analyzeLanding = () => {
    const type = document.getElementById('acc-landing-type')?.value || 'stair';
    const width = parseFloat(document.getElementById('acc-landing-width')?.value) || 0;
    const depth = parseFloat(document.getElementById('acc-landing-depth')?.value) || 0;

    const result = calculateLandingZone(type, width, depth);

    const resultDiv = document.getElementById('acc-landing-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'C' ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'C' ? 'var(--gold-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.status === 'C' ? 'var(--gold-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.status} | ${result.description}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Ukuran: ${result.actualSize}</div>
            <div>Standar: ${result.requiredSize}</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Escalator analysis
  window._analyzeEscalator = () => {
    const angle = parseFloat(document.getElementById('acc-escalator-angle')?.value) || 0;
    const speed = parseFloat(document.getElementById('acc-escalator-speed')?.value) || 0;

    const result = calculateEscalatorAccessibility(angle, speed, 100);

    const resultDiv = document.getElementById('acc-escalator-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.overallStatus === 'C' ? 'hsla(280, 70%, 50%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.overallStatus === 'C' ? 'hsla(280, 70%, 60%, 1)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.overallStatus === 'C' ? 'hsla(280, 70%, 60%, 1)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.overallStatus}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Sudut: ${result.angle} (max: ${result.maxAngle})</div>
            <div>Kecepatan: ${result.speed} (range: ${result.speedRange})</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Toilet analysis
  window._analyzeToilet = () => {
    const width = parseFloat(document.getElementById('acc-toilet-width')?.value) || 0;
    const depth = parseFloat(document.getElementById('acc-toilet-depth')?.value) || 0;

    const fixtures = {
      wcHeight: parseFloat(document.getElementById('acc-toilet-height')?.value) || 0,
      lavatoryClearance: parseFloat(document.getElementById('acc-toilet-clearance')?.value) || 0,
      grabBars: document.getElementById('acc-toilet-grabbar')?.checked || false,
      emergencyCord: document.getElementById('acc-toilet-emergency')?.checked || false,
      doorWidth: 90
    };

    const result = calculateAccessibleToilet(width, depth, fixtures);

    const resultDiv = document.getElementById('acc-toilet-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.overallStatus === 'C' ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.overallStatus === 'C' ? 'var(--gold-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.overallStatus === 'C' ? 'var(--gold-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            Status: ${result.overallStatus} | ${result.turningSpace}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Kloset: ${result.wcHeight} (${result.wcHeightRange})</div>
            <div>Kolong: ${result.lavatoryClearance}</div>
            <div>Handrail: ${result.grabBars} | Alarm: ${result.emergencyCord}</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Parking analysis
  window._analyzeParking = () => {
    const total = parseInt(document.getElementById('acc-parking-total')?.value) || 0;

    const result = calculateAccessibleParking(total);

    const resultDiv = document.getElementById('acc-parking-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; border: 1px solid var(--danger-400)33;">
          <div style="font-weight: 700; color: var(--danger-400); margin-bottom: 8px;">
            Kebutuhan: ${result.requiredAccessible} slot
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Total: ${result.totalSlots} slot</div>
            <div>Dimensi: ${result.dimensions}</div>
            <div>Aisle: ${result.aisleToBuilding}</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Accessibility score
  window._calculateAccessibilityScore = () => {
    const scores = {
      horizontal: parseInt(document.getElementById('acc-score-horizontal')?.value) || 0,
      vertical: parseInt(document.getElementById('acc-score-vertical')?.value) || 0,
      facilities: parseInt(document.getElementById('acc-score-facilities')?.value) || 0,
      signage: parseInt(document.getElementById('acc-score-signage')?.value) || 0
    };

    const result = calculateAccessibilityScore(scores);

    const resultDiv = document.getElementById('acc-score-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.grade === 'A' || result.grade === 'B' ? 'hsla(158, 85%, 45%, 0.1)' : result.grade === 'C' ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.grade === 'A' || result.grade === 'B' ? 'var(--success-400)' : result.grade === 'C' ? 'var(--gold-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.grade === 'A' || result.grade === 'B' ? 'var(--success-400)' : result.grade === 'C' ? 'var(--gold-400)' : 'var(--danger-400)'}; margin-bottom: 8px; font-size: 1.2rem;">
            Score: ${result.overallScore}/100 | Grade: ${result.grade}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Status: ${result.status}</div>
            <div>Horizontal: ${scores.horizontal} | Vertical: ${scores.vertical}</div>
            <div>Facilities: ${scores.facilities} | Signage: ${scores.signage}</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Wheelchair simulation
  window._simulateWheelchairPath = () => {
    const corridor = parseFloat(document.getElementById('acc-sim-corridor')?.value) || 0;
    const door = parseFloat(document.getElementById('acc-sim-door')?.value) || 0;

    const result = simulateWheelchairPath(corridor, door, []);

    const resultDiv = document.getElementById('acc-sim-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.feasible ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.feasible ? 'var(--success-400)' : 'var(--danger-400)'}33;">
          <div style="font-weight: 700; color: ${result.feasible ? 'var(--success-400)' : 'var(--danger-400)'}; margin-bottom: 8px;">
            ${result.feasible ? 'Jalur FEASIBLE' : 'Jalur TIDAK FEASIBLE'}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Wheelchair: ${result.wheelchair.width}cm x ${result.wheelchair.length}cm</div>
            <div>Koridor: ${result.corridorPass ? 'PASS' : 'FAIL'}</div>
            <div>Pintu: ${result.doorPass ? 'PASS' : 'FAIL'}</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // What-if scenario
  window._runWhatIfScenario = () => {
    const type = document.getElementById('acc-whatif-type')?.value || 'corridor_widening';
    const current = parseFloat(document.getElementById('acc-whatif-current')?.value) || 0;
    const newVal = parseFloat(document.getElementById('acc-whatif-new')?.value) || 0;

    const params = type === 'corridor_widening' ? { currentWidth: current, newWidth: newVal } :
                    type === 'ramp_relocation' ? { verticalRise: current, availableSpace: newVal } :
                    { floors: Math.max(current, 1) };

    const result = calculateWhatIfScenario(type, params);

    const resultDiv = document.getElementById('acc-whatif-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px; border: 1px solid var(--gold-400)33;">
          <div style="font-weight: 700; color: var(--gold-400); margin-bottom: 8px;">
            ${result.scenario}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            ${Object.entries(result).filter(([k]) => k !== 'scenario').map(([k, v]) => `
              <div>${k}: ${v}</div>
            `).join('')}
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Repair priority
  window._calculateRepairPriority = () => {
    const impact = document.getElementById('acc-priority-impact')?.value || 'medium';
    const ease = document.getElementById('acc-priority-ease')?.value || 'medium';
    const users = parseInt(document.getElementById('acc-priority-users')?.value) || 0;

    const result = calculateRepairPriority(impact, ease, users);

    const resultDiv = document.getElementById('acc-priority-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.priority === 'CRITICAL' ? 'hsla(0, 85%, 60%, 0.2)' : result.priority === 'HIGH' ? 'hsla(0, 85%, 60%, 0.1)' : result.priority === 'MEDIUM' ? 'hsla(45, 90%, 60%, 0.1)' : 'hsla(158, 85%, 45%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.priority === 'CRITICAL' || result.priority === 'HIGH' ? 'var(--danger-400)' : result.priority === 'MEDIUM' ? 'var(--gold-400)' : 'var(--success-400)'}33;">
          <div style="font-weight: 700; color: ${result.priority === 'CRITICAL' || result.priority === 'HIGH' ? 'var(--danger-400)' : result.priority === 'MEDIUM' ? 'var(--gold-400)' : 'var(--success-400)'}; margin-bottom: 8px; font-size: 1.1rem;">
            Priority: ${result.priority}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            <div>Quadrant: ${result.quadrant}</div>
            <div>Score: ${result.score}</div>
            <div style="margin-top: 4px; color: var(--text-tertiary);">${result.recommendation}</div>
          </div>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  };

  // Export functions with Google Drive integration
  window._exportToCSV = async () => {
    try {
      showInfo('Generating CSV export...');
      const data = await fetchAccessibilityData(projectId);
      await exportToCSV(projectId, data);
    } catch (err) {
      showError('Gagal export CSV: ' + err.message);
    }
  };

  window._exportToPDF = () => {
    navigate('accessibility-inspection', { projectId, mode: 'report' });
  };

  window._generateComplianceReport = async () => {
    try {
      showInfo('Generating compliance report...');
      const summary = generateComplianceSummary(projectId);
      // Report generation handled by inspection page
      navigate('accessibility-inspection', { projectId, mode: 'compliance' });
    } catch (err) {
      showError('Gagal generate laporan: ' + err.message);
    }
  };

  // Google Drive File Upload
  window._uploadAccessibilityFile = async (inputElement, fileType = 'photo') => {
    try {
      const file = inputElement.files[0];
      if (!file) {
        showError('Pilih file terlebih dahulu');
        return;
      }

      showInfo('Mengunggah file ke Google Drive...');

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        const fileData = {
          name: file.name,
          base64: base64,
          mimeType: file.type
        };

        const result = await uploadAccessibilityFile(projectId, fileData, fileType);
        if (result) {
          showSuccess('File berhasil diunggah ke Drive');
          // Refresh file list if exists
          if (window._refreshAccessibilityFiles) {
            window._refreshAccessibilityFiles();
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showError('Gagal mengunggah file: ' + err.message);
    }
  };

  // Fetch and display files
  window._loadAccessibilityFiles = async () => {
    try {
      const files = await fetchAccessibilityFiles(projectId);
      return files;
    } catch (err) {
      console.error('Error loading files:', err);
      return [];
    }
  };

  // Delete file
  window._deleteAccessibilityFile = async (fileId, driveFileId) => {
    try {
      const confirmed = await confirm({
        title: 'Hapus File',
        message: 'Apakah Anda yakin ingin menghapus file ini dari Drive?',
        confirmText: 'Hapus',
        danger: true
      });

      if (confirmed) {
        await deleteAccessibilityFile(fileId, driveFileId);
        if (window._refreshAccessibilityFiles) {
          window._refreshAccessibilityFiles();
        }
      }
    } catch (err) {
      showError('Gagal menghapus file: ' + err.message);
    }
  };

  // Backup to Drive
  window._backupAccessibilityToDrive = async () => {
    try {
      showInfo('Membuat backup ke Google Drive...');
      await backupToDrive(projectId);
      showSuccess('Backup berhasil dibuat');
    } catch (err) {
      showError('Gagal membuat backup: ' + err.message);
    }
  };

  // Sync with Drive
  window._syncAccessibilityWithDrive = async () => {
    try {
      showInfo('Sinkronisasi dengan Google Drive...');
      const result = await syncWithDrive(projectId);
      showSuccess(`Sinkronisasi selesai: ${result.synced} file diperbarui`);
    } catch (err) {
      showError('Gagal sinkronisasi: ' + err.message);
    }
  };

  // Get analytics
  window._getAccessibilityAnalytics = async () => {
    try {
      const analytics = await getAccessibilityAnalytics(projectId);
      return analytics;
    } catch (err) {
      showError('Gagal mengambil analytics: ' + err.message);
      return null;
    }
  };
}
