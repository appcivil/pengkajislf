/**
 * ARCHITECTURAL REQUIREMENTS MODULE
 * Pemeriksaan Aspek Persyaratan Arsitektur berdasarkan:
 * - PP Nomor 16 Tahun 2021 (Pasal 218)
 * - SNI 03-6197-2000, SNI 03-2396-2001, SNI 03-6389-2000
 * UI/UX: Presidential Quartz Style
 */

import { supabase } from '../lib/supabase.js';
import * as ArchCalc from '../lib/architectural-requirements-calculators.js';
import { showSuccess, showError, showInfo } from './toast.js';

// ArchSim Pro Integration
import { archState, StateManager } from '../lib/archsim/StateManager.js';
import { Renderer3D } from '../lib/archsim/Renderer3D.js';
import { Pasal218Engine } from '../lib/archsim/Pasal218Engine.js';
import '../lib/archsim/ArchViewport.js';
import { SunSimulator, SpaceAnalyzer } from '../lib/archsim/SimulationEngine.js';

// Evacuation Module Integration
import '../lib/evacuation/EvacuationDesigner.js';
import '../lib/evacuation/EgressCompliancePanel.js';
import { PathfinderEngine } from '../lib/evacuation/PathfinderEngine.js';
import { EvacuationReportService } from '../lib/evacuation/EvacuationReportService.js';

// Fire Module Integration
import '../lib/fire/FireDesigner.js';
import '../lib/fire/FireCompliancePanel.js';
import { FireDynamicsEngine } from '../lib/fire/FireDynamicsEngine.js';
import { FireReportService } from '../lib/fire/FireReportService.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchArchitecturalSummary(projectId) {
  try {
    const { data, error } = await supabase
      .from('architectural_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return data || {
      penampilan_score: 0,
      tata_ruang_score: 0,
      keselarasan_score: 0,
      total_score: 0,
      grade: '-',
      overall_status: 'NOT_STARTED',
      plan_efficiency: 0,
      ettv_value: 0,
      kdh_percentage: 0
    };
  } catch (error) {
    console.error('Error fetching architectural summary:', error);
    return { overall_status: 'ERROR' };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderArchitecturalCard(project, summary = {}) {
  const statusColors = {
    'SESUAI': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'TIDAK_SESUAI': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'PERLU_ADJUSTMENT': { bg: 'hsla(45, 90%, 60%, 0.1)', text: 'var(--warning-400)', border: 'var(--warning-500)' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' }
  };
  
  const st = statusColors[summary.overall_status] || statusColors['NOT_STARTED'];
  const hasData = summary.total_score > 0;
  
  return `
    <div class="card-quartz clickable" id="architectural-card" onclick="window.navigate('architectural',{id:'${project.id}'})" style="padding: var(--space-6); background: ${st.bg}; border-color: ${st.border}44">
      <div class="flex-between" style="margin-bottom: 20px">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: ${st.bg}; display: flex; align-items: center; justify-content: center; color: ${st.text}; border: 1px solid ${st.border}44">
          <i class="fas fa-building" style="font-size: 1.4rem"></i>
        </div>
        <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: ${st.text}">
          ${summary.grade || '-'}
        </div>
      </div>
      
      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 4px">
        Persyaratan Arsitektur
      </h3>
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5">
        PP 16/2021 • SNI 03-6197-2000
      </p>
      
      ${hasData ? `
        <div style="margin-top: 20px">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px">
            <span style="font-size: 0.7rem; color: var(--text-tertiary)">TOTAL SCORE</span>
            <span style="font-size: 1.2rem; font-weight: 800; color: ${st.text}">${summary.total_score?.toFixed(1) || 0}/100</span>
          </div>
          <div style="height: 6px; background: hsla(220, 20%, 100%, 0.05); border-radius: 10px; margin-bottom: 16px">
            <div style="width: ${summary.total_score}%; height: 100%; border-radius: 10px; background: ${st.text}; box-shadow: 0 0 10px ${st.text}66"></div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px">
            <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
              <div style="font-size: 0.9rem; font-weight: 800; color: ${summary.penampilan_score >= 70 ? 'var(--success-400)' : 'var(--warning-400)'}">${summary.penampilan_score?.toFixed(0) || 0}</div>
              <div style="font-size: 9px; color: var(--text-tertiary)">Penampilan</div>
            </div>
            <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
              <div style="font-size: 0.9rem; font-weight: 800; color: ${summary.tata_ruang_score >= 70 ? 'var(--success-400)' : 'var(--warning-400)'}">${summary.tata_ruang_score?.toFixed(0) || 0}</div>
              <div style="font-size: 9px; color: var(--text-tertiary)">Tata Ruang</div>
            </div>
            <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
              <div style="font-size: 0.9rem; font-weight: 800; color: ${summary.keselarasan_score >= 70 ? 'var(--success-400)' : 'var(--warning-400)'}">${summary.keselarasan_score?.toFixed(0) || 0}</div>
              <div style="font-size: 9px; color: var(--text-tertiary)">Keselarasan</div>
            </div>
          </div>
        </div>
      ` : `
        <div style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); border: 1px dashed hsla(220, 20%, 100%, 0.1); border-radius: 12px; text-align: center">
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 12px">
            Belum ada pemeriksaan arsitektur
          </p>
          <span class="badge" style="background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border}44; font-size: 10px">
            KLIK UNTUK MEMULAI
          </span>
        </div>
      `}
    </div>
  `;
}

// ============================================================
// 3. MAIN MODULE COMPONENT
// ============================================================

export async function renderArchitecturalModule(projectId) {
  const assessments = await fetchAssessments(projectId);
  
  return `
    <div id="architectural-module" style="animation: page-fade-in 0.5s ease-out">
      <!-- Module Header -->
      <div class="card-quartz" style="padding: var(--space-6); margin-bottom: var(--space-6); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2)">
        <div class="flex-between" style="align-items: flex-start">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px">
              <i class="fas fa-building" style="color: var(--brand-400); font-size: 1.5rem"></i>
              <h2 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0">
                Persyaratan Arsitektur
              </h2>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-tertiary); margin: 0">
              PP 16/2021 Pasal 218 | SNI 03-6197-2000 | SNI 03-6389-2000
            </p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-outline btn-sm" onclick="window._uploadFacadePhotos('${projectId}')">
              <i class="fas fa-camera" style="margin-right: 8px"></i> Foto Fasad
            </button>
            <button class="btn btn-primary btn-sm" onclick="window._generateArchBA('${projectId}')">
              <i class="fas fa-file-contract" style="margin-right: 8px"></i> Buat BA
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 0; margin-bottom: var(--space-6); overflow: hidden">
        <div class="flex" style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05)">
          ${renderTabButton('assessment', 'Assessment', 'fa-clipboard-check', true)}
          ${renderTabButton('penampilan', 'Penampilan', 'fa-ruler-combined')}
          ${renderTabButton('tataruang', 'Tata Ruang', 'fa-door-open')}
          ${renderTabButton('keselarasan', 'Keselarasan', 'fa-tree')}
          ${renderTabButton('evakuasi', 'Evakuasi', 'fa-running')}
          ${renderTabButton('kebakaran', 'Kebakaran', 'fa-fire')}
          ${renderTabButton('analisis', 'Analisis', 'fa-chart-pie')}
        </div>
      </div>

      <!-- TAB CONTENT: ASSESSMENT -->
      <div id="arch-tab-assessment" class="arch-tab-content active">
        ${renderAssessmentTab(projectId, assessments)}
      </div>

      <!-- TAB CONTENT: PENAMPILAN -->
      <div id="arch-tab-penampilan" class="arch-tab-content" style="display: none;">
        ${renderPenampilanTab()}
      </div>

      <!-- TAB CONTENT: TATARUANG -->
      <div id="arch-tab-tataruang" class="arch-tab-content" style="display: none;">
        ${renderTataRuangTab()}
      </div>

      <!-- TAB CONTENT: KESELARASAN -->
      <div id="arch-tab-keselarasan" class="arch-tab-content" style="display: none;">
        ${renderKeselarasanTab()}
      </div>

      <!-- TAB CONTENT: EVAKUASI -->
      <div id="arch-tab-evakuasi" class="arch-tab-content" style="display: none;">
        ${renderEvakuasiTab(projectId)}
      </div>

      <!-- TAB CONTENT: KEBAKARAN -->
      <div id="arch-tab-kebakaran" class="arch-tab-content" style="display: none;">
        ${renderKebakaranTab(projectId)}
      </div>

      <!-- TAB CONTENT: ANALISIS -->
      <div id="arch-tab-analisis" class="arch-tab-content" style="display: none;">
        ${renderAnalisisTab()}
      </div>
    </div>
  `;
}

function renderTabButton(id, label, icon, active = false) {
  return `
    <button class="arch-tab-btn ${active ? 'active' : ''}" data-tab="${id}" 
            onclick="window._switchArchTab('${id}', this)"
            style="flex: 1; padding: 16px; background: ${active ? 'hsla(220, 95%, 52%, 0.1)' : 'transparent'}; 
                   border: none; border-bottom: 2px solid ${active ? 'var(--brand-400)' : 'transparent'}; 
                   color: ${active ? 'white' : 'var(--text-tertiary)'}; cursor: pointer;
                   font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px;
                   display: flex; align-items: center; justify-content: center; gap: 8px;
                   transition: all 0.2s">
      <i class="fas ${icon}"></i>
      ${label}
    </button>
  `;
}

// ============================================================
// 4. ASSESSMENT TAB
// ============================================================

function renderAssessmentTab(projectId, assessments = []) {
  const latest = assessments[0];
  
  return `
    <div class="arch-tab-panel" id="tab-assessment">
      <!-- Quick Actions -->
      <div class="grid-3-col" style="margin-bottom: var(--space-6)">
        <div class="card-quartz clickable" onclick="window._newArchAssessment('${projectId}')" 
             style="padding: var(--space-4); text-align: center; background: hsla(158, 85%, 45%, 0.1)">
          <i class="fas fa-plus-circle" style="font-size: 1.5rem; color: var(--success-400); margin-bottom: 8px"></i>
          <div style="font-size: 0.75rem; font-weight: 700; color: white">Pemeriksaan Baru</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">Input data arsitektur</div>
        </div>
        <div class="card-quartz clickable" onclick="window._uploadPlanFiles('${projectId}')" 
             style="padding: var(--space-4); text-align: center; background: hsla(220, 95%, 52%, 0.1)">
          <i class="fas fa-file-upload" style="font-size: 1.5rem; color: var(--brand-400); margin-bottom: 8px"></i>
          <div style="font-size: 0.75rem; font-weight: 700; color: white">Upload Denah</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">PDF/DWG</div>
        </div>
        <div class="card-quartz clickable" onclick="window._viewArchHistory('${projectId}')" 
             style="padding: var(--space-4); text-align: center; background: hsla(220, 20%, 100%, 0.05)">
          <i class="fas fa-history" style="font-size: 1.5rem; color: var(--text-secondary); margin-bottom: 8px"></i>
          <div style="font-size: 0.75rem; font-weight: 700; color: white">Riwayat</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">${assessments.length} pemeriksaan</div>
        </div>
      </div>

      ${latest ? renderLatestAssessment(latest) : renderEmptyState(projectId)}
    </div>
  `;
}

function renderLatestAssessment(assessment) {
  const statusColor = assessment.overall_status === 'SESUAI' ? 'var(--success-400)' : 
                      assessment.overall_status === 'TIDAK_SESUAI' ? 'var(--danger-400)' : 'var(--warning-400)';
  
  return `
    <div class="card-quartz" style="padding: var(--space-6)">
      <div class="flex-between" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1)">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px">BERITA ACARA TERAKHIR</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: white">${assessment.ba_number || 'BA/ARS/XXXX/XXX'}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary)">
            ${new Date(assessment.assessment_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
          </div>
        </div>
        <div style="text-align: right">
          <div style="font-size: 3rem; font-weight: 800; color: ${statusColor}; line-height: 1">${assessment.grade || '-'}</div>
          <div style="font-size: 0.75rem; color: ${statusColor}">${assessment.overall_status || '-'}</div>
        </div>
      </div>

      <!-- Score Radar -->
      <div class="grid-3-col" style="margin-bottom: 20px">
        <div style="background: hsla(220, 20%, 100%, 0.03); padding: 16px; border-radius: 12px; text-align: center">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 8px">PENAMPILAN</div>
          <div style="font-size: 2rem; font-weight: 800; color: ${assessment.penampilan_score >= 70 ? 'var(--success-400)' : 'var(--warning-400)'}">${assessment.penampilan_score?.toFixed(0) || 0}</div>
          <div style="font-size: 0.65rem; color: ${assessment.penampilan_status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">${assessment.penampilan_status || '-'}</div>
        </div>
        <div style="background: hsla(220, 20%, 100%, 0.03); padding: 16px; border-radius: 12px; text-align: center">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 8px">TATA RUANG</div>
          <div style="font-size: 2rem; font-weight: 800; color: ${assessment.tata_ruang_score >= 70 ? 'var(--success-400)' : 'var(--warning-400)'}">${assessment.tata_ruang_score?.toFixed(0) || 0}</div>
          <div style="font-size: 0.65rem; color: ${assessment.tata_ruang_status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">${assessment.tata_ruang_status || '-'}</div>
        </div>
        <div style="background: hsla(220, 20%, 100%, 0.03); padding: 16px; border-radius: 12px; text-align: center">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 8px">KESELARASAN</div>
          <div style="font-size: 2rem; font-weight: 800; color: ${assessment.keselarasan_score >= 70 ? 'var(--success-400)' : 'var(--warning-400)'}">${assessment.keselarasan_score?.toFixed(0) || 0}</div>
          <div style="font-size: 0.65rem; color: ${assessment.keselarasan_status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">${assessment.keselarasan_status || '-'}</div>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid-4-col" style="margin-bottom: 20px">
        <div style="background: hsla(220, 20%, 100%, 0.03); padding: 12px; border-radius: 8px; text-align: center">
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">Plan Efficiency</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: white">${assessment.plan_efficiency?.toFixed(1) || 0}%</div>
        </div>
        <div style="background: hsla(220, 20%, 100%, 0.03); padding: 12px; border-radius: 8px; text-align: center">
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">ETTV</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: ${assessment.ettv_value <= 45 ? 'var(--success-400)' : 'var(--danger-400)'}">${assessment.ettv_value?.toFixed(1) || 0}</div>
        </div>
        <div style="background: hsla(220, 20%, 100%, 0.03); padding: 12px; border-radius: 8px; text-align: center">
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">KDH</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: ${assessment.kdh_percentage >= 30 ? 'var(--success-400)' : 'var(--warning-400)'}">${assessment.kdh_percentage?.toFixed(1) || 0}%</div>
        </div>
        <div style="background: hsla(220, 20%, 100%, 0.03); padding: 12px; border-radius: 8px; text-align: center">
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">Golden Ratio</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: ${assessment.golden_ratio_score >= 80 ? 'var(--success-400)' : 'var(--warning-400)'}">${assessment.golden_ratio_score?.toFixed(0) || 0}</div>
        </div>
      </div>

      ${assessment.violations?.length > 0 ? `
        <div style="margin-top: 20px">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px">
            <i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: var(--danger-400)"></i>
            Temuan (${assessment.violations.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: 8px">
            ${assessment.violations.map((v, i) => `
              <div style="padding: 12px 16px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; border-left: 3px solid var(--danger-400)">
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--danger-400)">
                  ${i + 1}. ${v.aspect || 'Pelanggaran'}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px">
                  ${v.description || v.message || 'Detail pelanggaran'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderEmptyState(projectId) {
  return `
    <div class="card-quartz" style="padding: var(--space-8); text-align: center">
      <i class="fas fa-building" style="font-size: 4rem; color: var(--text-tertiary); margin-bottom: 24px; opacity: 0.5"></i>
      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px">
        Belum Ada Pemeriksaan Arsitektur
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-tertiary); max-width: 400px; margin: 0 auto 24px">
        Mulai pemeriksaan untuk menilai penampilan bangunan, tata ruang dalam, dan keselarasan lingkungan
      </p>
      <button class="btn btn-primary" onclick="window._newArchAssessment('${projectId}')">
        <i class="fas fa-plus" style="margin-right: 8px"></i> Pemeriksaan Baru
      </button>
    </div>
  `;
}

// ============================================================
// 5. PENAMPILAN TAB
// ============================================================

function renderPenampilanTab() {
  return `
    <div class="arch-tab-panel" id="tab-penampilan" style="display: none">
      <div class="grid-2-col">
        <!-- Golden Ratio Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-ruler-combined" style="margin-right: 8px; color: var(--gold-400)"></i>
            Proporsi Golden Ratio
          </h4>
          <div style="background: hsla(45, 90%, 60%, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px">
            <div style="font-size: 0.7rem; color: var(--gold-300); font-family: monospace">
              Golden Ratio (φ) = 1.618 | Ideal: Tinggi / Lebar ≈ 1.618
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tinggi Total Bangunan (m)
            </label>
            <input type="number" id="arch-height" class="form-control" value="12" min="0" step="0.1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Lebar Fasad (m)
            </label>
            <input type="number" id="arch-width" class="form-control" value="8" min="0" step="0.1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateGoldenRatio()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Analisis Proporsi
          </button>
          <div id="golden-ratio-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                               border-radius: 12px; display: none">
          </div>
        </div>

        <!-- ETTV Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-temperature-half" style="margin-right: 8px; color: var(--brand-400)"></i>
            ETTV (SNI 03-6389-2000)
          </h4>
          <div style="background: hsla(220, 95%, 52%, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px">
            <div style="font-size: 0.7rem; color: var(--brand-300); font-family: monospace">
              Max ETTV = 45 W/m² | Orientasi: E/W = 210, N/S = 130 W/m²
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Luas Dinding (m²)</label>
            <input type="number" id="ettv-wall" class="form-control" value="100" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Luas Jendela (m²)</label>
            <input type="number" id="ettv-window" class="form-control" value="30" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Orientasi</label>
            <select id="ettv-orientation" class="form-control"
                    style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
              <option value="north">Utara (130 W/m²)</option>
              <option value="south">Selatan (130 W/m²)</option>
              <option value="east">Timur (210 W/m²)</option>
              <option value="west">Barat (210 W/m²)</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateETTV()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung ETTV
          </button>
          <div id="ettv-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                       border-radius: 12px; display: none">
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 6. TATA RUANG TAB
// ============================================================

function renderTataRuangTab() {
  return `
    <div class="arch-tab-panel" id="tab-tataruang" style="display: none">
      <div class="grid-2-col">
        <!-- Plan Efficiency -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-chart-pie" style="margin-right: 8px; color: var(--success-400)"></i>
            Efisiensi Denah
          </h4>
          <div style="background: hsla(158, 85%, 45%, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px">
            <div style="font-size: 0.7rem; color: var(--success-300); font-family: monospace">
              Efisiensi = (Luas Program / Luas Total) × 100% | Ideal: 80-85%
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Luas Total (m²)</label>
            <input type="number" id="plan-total" class="form-control" value="200" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Luas Program/Ruang Fungsi (m²)</label>
            <input type="number" id="plan-program" class="form-control" value="160" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Luas Sirkulasi (m²)</label>
            <input type="number" id="plan-circulation" class="form-control" value="25" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Luas Service (m²)</label>
            <input type="number" id="plan-service" class="form-control" value="15" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculatePlanEfficiency()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Efisiensi
          </button>
          <div id="plan-efficiency-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                   border-radius: 12px; display: none">
          </div>
        </div>

        <!-- Room Validation -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-door-open" style="margin-right: 8px; color: var(--brand-400)"></i>
            Validasi Ruang (SNI 03-6197)
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tipe Ruang
            </label>
            <select id="room-type" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="tidur">Kamar Tidur (min 9m²)</option>
              <option value="keluarga">Ruang Keluarga (min 12m²)</option>
              <option value="makan">Ruang Makan (min 9m²)</option>
              <option value="dapur">Dapur (min 5m²)</option>
              <option value="mandi">Kamar Mandi (min 2m²)</option>
              <option value="kerja">Ruang Kerja (min 6m²)</option>
              <option value="lobi">Lobi (min 15m²)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Ruang (m²)
            </label>
            <input type="number" id="room-area" class="form-control" value="12" min="0" step="0.1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tinggi Ruang (m)
            </label>
            <input type="number" id="room-height" class="form-control" value="2.8" min="0" step="0.1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._validateRoom()">
            <i class="fas fa-check-circle" style="margin-right: 8px"></i> Validasi Ruang
          </button>
          <div id="room-validation-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                   border-radius: 12px; display: none">
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// DATA FETCH FUNCTIONS
// ============================================================

async function fetchAssessments(projectId) {
  try {
    const { data, error } = await supabase
      .from('architectural_assessments')
      .select('*')
      .eq('project_id', projectId)
      .order('assessment_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching architectural assessments:', error);
    return [];
  }
}

// ============================================================
// HANDLERS INITIALIZATION
// ============================================================

export function initArchitecturalHandlers(projectId) {
  // Tab Switching
  window._switchArchTab = (tabId, btn) => {
    // Update button states
    document.querySelectorAll('.arch-tab-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = 'transparent';
      b.style.borderBottomColor = 'transparent';
      b.style.color = 'var(--text-tertiary)';
    });
    if (btn) {
      btn.classList.add('active');
      btn.style.background = 'hsla(220, 95%, 52%, 0.1)';
      btn.style.borderBottomColor = 'var(--brand-400)';
      btn.style.color = 'white';
    }

    // Show/hide tab content
    document.querySelectorAll('.arch-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    const targetContent = document.getElementById(`arch-tab-${tabId}`);
    if (targetContent) {
      targetContent.style.display = 'block';
    }
  };
  
  // Calculator Handlers
  window._calculateGoldenRatio = () => {
    const height = parseFloat(document.getElementById('arch-height')?.value || 0);
    const width = parseFloat(document.getElementById('arch-width')?.value || 0);
    
    const result = ArchCalc.analyzeFacadeProportion(height, width, []);
    
    const resultDiv = document.getElementById('golden-ratio-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">Rasio Tinggi:Lebar</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: ${result.analysis.isGoldenRatio ? 'var(--success-400)' : 'var(--warning-400)'}">${result.proportions.heightToWidthFormatted}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">Golden Ratio = 1.618</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Deviasi</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${result.proportions.deviationPercent}</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Status</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: ${result.analysis.isGoldenRatio ? 'var(--success-400)' : 'var(--warning-400)'}">${result.analysis.status}</div>
          </div>
        </div>
      `;
    }
  };
  
  window._calculateETTV = () => {
    const wallArea = parseFloat(document.getElementById('ettv-wall')?.value || 0);
    const windowArea = parseFloat(document.getElementById('ettv-window')?.value || 0);
    const orientation = document.getElementById('ettv-orientation')?.value || 'east';
    
    const result = ArchCalc.calculateETTV({
      wallArea,
      windowArea,
      orientation
    });
    
    const resultDiv = document.getElementById('ettv-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">ETTV Value</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: ${result.ettv.isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}">${result.ettv.value}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">Max: 45 W/m²</div>
        </div>
        <div style="padding: 12px; background: ${result.ettv.isCompliant ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px">
          <div style="font-size: 0.8rem; font-weight: 700; color: ${result.ettv.isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}">
            ${result.ettv.isCompliant ? '✓ MEMENUHI STANDAR' : '✗ MELEBIHI BATAS'}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px">
            Rating: ${result.rating.grade} - ${result.rating.desc}
          </div>
        </div>
      `;
    }
  };
  
  window._calculatePlanEfficiency = () => {
    const total = parseFloat(document.getElementById('plan-total')?.value || 0);
    const program = parseFloat(document.getElementById('plan-program')?.value || 0);
    const circulation = parseFloat(document.getElementById('plan-circulation')?.value || 0);
    const service = parseFloat(document.getElementById('plan-service')?.value || 0);
    
    const result = ArchCalc.calculatePlanEfficiency({
      program,
      circulation,
      service
    }, total);
    
    const resultDiv = document.getElementById('plan-efficiency-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">Efisiensi Denah</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: ${result.efficiency.status === 'C' ? 'var(--success-400)' : 'var(--warning-400)'}">${result.efficiency.grossEfficiency}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">Grade: ${result.efficiency.grade} - ${result.efficiency.description}</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px">
          <div style="padding: 10px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">Program</div>
            <div style="font-size: 1rem; font-weight: 800; color: var(--brand-400)">${result.ratios.program}</div>
          </div>
          <div style="padding: 10px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">Sirkulasi</div>
            <div style="font-size: 1rem; font-weight: 800; color: var(--gold-400)">${result.ratios.circulation}</div>
          </div>
          <div style="padding: 10px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">Service</div>
            <div style="font-size: 1rem; font-weight: 800; color: var(--text-secondary)">${result.ratios.service}</div>
          </div>
        </div>
      `;
    }
  };
  
  window._validateRoom = () => {
    const type = document.getElementById('room-type')?.value;
    const area = parseFloat(document.getElementById('room-area')?.value || 0);
    const height = parseFloat(document.getElementById('room-height')?.value || 0);
    
    const result = ArchCalc.validateRoom(type, area, height);
    
    const resultDiv = document.getElementById('room-validation-result');
    if (resultDiv && !result.error) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 16px; background: ${result.compliance.area === 'C' && result.compliance.height === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 12px">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px">
            <i class="fas ${result.compliance.area === 'C' && result.compliance.height === 'C' ? 'fa-check-circle' : 'fa-exclamation-circle'}" 
               style="font-size: 1.5rem; color: ${result.compliance.area === 'C' && result.compliance.height === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}"></i>
            <div>
              <div style="font-size: 1rem; font-weight: 800; color: ${result.compliance.area === 'C' && result.compliance.height === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">
                ${result.compliance.area === 'C' && result.compliance.height === 'C' ? 'SESUAI STANDAR' : 'TIDAK SESUAI'}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-tertiary)">${result.roomType}</div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary)">
            <div>Luas: ${result.actual.area} (Min: ${result.standards.minArea}m²)</div>
            <div>Tinggi: ${result.actual.height} (Min: ${result.standards.minHeight}m)</div>
          </div>
        </div>
      `;
    }
  };
  
  // Navigation handlers
  window._newArchAssessment = (projectId) => {
    navigate('architectural-new-assessment', { projectId });
  };
  
  window._uploadFacadePhotos = (projectId) => {
    showInfo('Fitur upload foto fasad akan segera hadir');
  };
  
  window._uploadPlanFiles = (projectId) => {
    showInfo('Fitur upload denah akan segera hadir');
  };
  
  window._generateArchBA = (projectId) => {
    showInfo('Membuat Berita Acara Arsitektur...');
  };
  
  window._viewArchHistory = (projectId) => {
    showInfo('Menampilkan riwayat pemeriksaan...');
  };

  // ============================================================
  // ArchSim Pro Integration Functions
  // ============================================================
  
  window._openArchSimPro = (projectId) => {
    showInfo('Membuka ArchSim Pro 3D Simulator...');
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'archsim-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="
        width: 100%;
        max-width: 1200px;
        height: 90vh;
        background: #0a0a0a;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 100;
        ">
          <button id="close-archsim" style="
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
          ">
            <i class="fas fa-times"></i> Tutup
          </button>
        </div>
        <arch-viewport id="archsim-viewport"></arch-viewport>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handler
    modal.querySelector('#close-archsim').addEventListener('click', () => {
      modal.remove();
    });
    
    // Initialize with project data
    const viewport = modal.querySelector('#archsim-viewport');
    if (viewport) {
      // Set project data
      archState.setState({
        project: { id: projectId, nama: 'Proyek ' + projectId }
      });
    }
    
    showSuccess('ArchSim Pro loaded with 3D viewport');
  };
  
  window._runPasal218Evaluation = (projectId) => {
    const engine = new Pasal218Engine();
    
    // Get project data from current state or fetch from Supabase
    const projectData = archState.state.project || {};
    
    const result = engine.evaluate(projectData);
    
    showSuccess(`Evaluasi Pasal 218: ${result.score}% - ${result.status}`);
    
    // Save results
    archState.setState({ compliance: result });
    
    return result;
  };
  
  window._runSunSimulation = (projectId, date = new Date()) => {
    const sunSim = new SunSimulator();
    
    // Default to Jakarta coordinates
    sunSim.setLocation(-6.2088, 106.8456, 7);
    
    const sunPath = sunSim.getSunPath(date);
    const currentPos = sunSim.calculateSunPosition(date);
    
    // Update state
    archState.setState({
      sunPosition: {
        azimuth: currentPos.azimuth,
        elevation: currentPos.elevation
      }
    });
    
    showInfo(`Simulasi Matahari: Azimuth ${currentPos.azimuth}°, Elev ${currentPos.elevation}°`);
    
    return { sunPath, currentPos };
  };
  
  window._analyzeSpace = (floorPlan) => {
    const analyzer = new SpaceAnalyzer();
    const result = analyzer.analyzeFloorPlan(floorPlan);
    
    showSuccess(`Analisis Ruang: Efisiensi ${result.efficiencies.usableEfficiency}%`);
    
    return result;
  };

  // Evacuation handlers
  window._openEvacuationSimulator = (projectId) => {
    const tabContent = document.getElementById('arch-tab-evakuasi');
    if (tabContent) {
      tabContent.innerHTML = renderEvakuasiTab(projectId);
      
      // Initialize evacuation designer after render
      setTimeout(() => {
        const designer = document.createElement('evacuation-designer');
        designer.id = 'evacuation-designer-instance';
        tabContent.appendChild(designer);
      }, 100);
    }
  };

  window._generateEvacuationReport = async (results) => {
    const service = new EvacuationReportService();
    const projectData = archState.state.project || {};
    await service.generateReport(results, projectData);
  };

  // Fire handlers
  window._openFireSimulator = (projectId) => {
    const tabContent = document.getElementById('arch-tab-kebakaran');
    if (tabContent) {
      // Initialize fire designer
      setTimeout(() => {
        const designer = document.createElement('fire-designer');
        designer.id = 'fire-designer-instance';
        tabContent.appendChild(designer);
      }, 100);
    }
  };

  window._generateFireReport = async (results) => {
    const service = new FireReportService();
    const projectData = archState.state.project || {};
    await service.generateReport(results, projectData);
  };

  window._openFireCompliance = () => {
    const panel = document.createElement('fire-compliance-panel');
    panel.style.cssText = 'position: fixed; right: 20px; top: 100px; width: 400px; height: calc(100vh - 140px); z-index: 1000;';
    document.body.appendChild(panel);
    
    // Auto-remove after use
    setTimeout(() => {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    }, 300000); // 5 minutes
  };
}

// Kebakaran Tab Renderer
function renderKebakaranTab(projectId) {
  return `
    <div class="arch-tab-panel" id="tab-kebakaran">
      <div class="card-quartz" style="padding: var(--space-6); margin-bottom: var(--space-6)">
        <div class="flex-between" style="margin-bottom: 20px">
          <div>
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0">
              <i class="fas fa-fire" style="margin-right: 8px; color: var(--danger-400)"></i>
              Simulasi Kebakaran & Asap
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-tertiary); margin: 8px 0 0 0">
              Zone Model | T-Squared Fire Growth | ASET Analysis | SNI 03-1736-2000
            </p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-outline btn-sm" onclick="window._openFireSimulator('${projectId}')">
              <i class="fas fa-play" style="margin-right: 8px"></i> Buka Simulator
            </button>
            <button class="btn btn-primary btn-sm" onclick="window._openFireCompliance()">
              <i class="fas fa-clipboard-check" style="margin-right: 8px"></i> Compliance
            </button>
            <button class="btn btn-primary btn-sm" onclick="window._generateFireReport()">
              <i class="fas fa-file-alt" style="margin-right: 8px"></i> Laporan
            </button>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 24px">
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 20px; border-radius: 12px; text-align: center">
            <div style="font-size: 2rem; color: var(--danger-400); margin-bottom: 8px">🔥</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: white">T-Squared Fire</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px">αt² Growth</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 20px; border-radius: 12px; text-align: center">
            <div style="font-size: 2rem; color: #94a3b8; margin-bottom: 8px">💨</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: white">Smoke Transport</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px">2-Zone Model</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 20px; border-radius: 12px; text-align: center">
            <div style="font-size: 2rem; color: var(--warning-400); margin-bottom: 8px">⏱️</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: white">ASET Analysis</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px">Available Time</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 20px; border-radius: 12px; text-align: center">
            <div style="font-size: 2rem; color: var(--success-400); margin-bottom: 8px">📊</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: white">Safety Factor</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px">ASET/RSET</div>
          </div>
        </div>
      </div>
      
      <div id="fire-container" style="height: 600px; border-radius: 12px; overflow: hidden;">
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: hsla(220, 20%, 100%, 0.02); border: 2px dashed hsla(220, 20%, 100%, 0.1); border-radius: 12px;">
          <div style="text-align: center; color: var(--text-tertiary);">
            <i class="fas fa-fire" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>Klik "Buka Simulator" untuk memulai simulasi kebakaran</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Evakuasi Tab Renderer
function renderEvakuasiTab(projectId) {
  return `
    <div class="arch-tab-panel" id="tab-evakuasi">
      <div class="card-quartz" style="padding: var(--space-6); margin-bottom: var(--space-6)">
        <div class="flex-between" style="margin-bottom: 20px">
          <div>
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0">
              <i class="fas fa-running" style="margin-right: 8px; color: var(--danger-400)"></i>
              Simulasi Evakuasi Jalur Keluar
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-tertiary); margin: 8px 0 0 0">
              Social Force Model | SNI 03-1746-2000 | RSET/ASET Analysis
            </p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-outline btn-sm" onclick="window._openEvacuationSimulator('${projectId}')">
              <i class="fas fa-play" style="margin-right: 8px"></i> Buka Simulator
            </button>
            <button class="btn btn-primary btn-sm" onclick="window._generateEvacuationReport()">
              <i class="fas fa-file-alt" style="margin-right: 8px"></i> Laporan
            </button>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px">
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 20px; border-radius: 12px; text-align: center">
            <div style="font-size: 2rem; color: var(--danger-400); margin-bottom: 8px">🚨</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: white">RSET Analysis</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px">Required Safe Egress Time</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 20px; border-radius: 12px; text-align: center">
            <div style="font-size: 2rem; color: var(--brand-400); margin-bottom: 8px">👥</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: white">Social Force Model</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px">Helbing & Molnár</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 20px; border-radius: 12px; text-align: center">
            <div style="font-size: 2rem; color: var(--success-400); margin-bottom: 8px">📊</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: white">Compliance Check</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px">SNI 03-1746-2000</div>
          </div>
        </div>
      </div>
      
      <div id="evacuation-container" style="height: 600px; border-radius: 12px; overflow: hidden;">
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: hsla(220, 20%, 100%, 0.02); border: 2px dashed hsla(220, 20%, 100%, 0.1); border-radius: 12px;">
          <div style="text-align: center; color: var(--text-tertiary);">
            <i class="fas fa-running" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>Klik "Buka Simulator" untuk memulai simulasi evakuasi</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ArchSim Pro exports
export function initArchSimPro(projectId, container) {
  // Initialize 3D viewport
  const viewport = document.createElement('arch-viewport');
  container.appendChild(viewport);
  
  // Load project data
  archState.setState({
    project: { id: projectId }
  });
  
  return viewport;
}

export function evaluateCompliance(projectData) {
  const engine = new Pasal218Engine();
  return engine.evaluate(projectData);
}

export { archState, StateManager, Pasal218Engine, SunSimulator, SpaceAnalyzer };

// Default export
export default {
  renderArchitecturalCard,
  renderArchitecturalModule,
  fetchArchitecturalSummary,
  initArchitecturalHandlers,
  initArchSimPro,
  evaluateCompliance,
  archState
};
