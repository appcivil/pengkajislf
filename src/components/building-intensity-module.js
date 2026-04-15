/**
 * BUILDING INTENSITY & ZONING COMPLIANCE MODULE
 * Pemeriksaan Aspek Intensitas Bangunan berdasarkan:
 * - PP Nomor 16 Tahun 2021 (Pasal 216 & 217)
 * - Permen ATR/BPN Nomor 6 Tahun 2023 (KKPR)
 * - Perda Garut Nomor 6 Tahun 2012 & Perda Jabar Nomor 1 Tahun 2022
 * UI/UX: Presidential Quartz Style
 */

import { supabase } from '../lib/supabase.js';
import * as IntensityCalc from '../lib/building-intensity-calculators.js';
import { showSuccess, showError, showInfo } from './toast.js';
import { openModal, confirm } from './modal.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchBuildingIntensitySummary(projectId) {
  try {
    const { data, error } = await supabase
      .from('building_intensity_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return data || {
      kdb_value: 0,
      klb_value: 0,
      kdh_value: 0,
      ktb_value: 0,
      overall_status: 'NOT_STARTED',
      violation_count: 0,
      assessment_date: null
    };
  } catch (error) {
    console.error('Error fetching building intensity summary:', error);
    return { overall_status: 'ERROR' };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderBuildingIntensityCard(project, summary = {}) {
  const statusColors = {
    'SESUAI': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'TIDAK_SESUAI': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'PERLU_ADJUSTMENT': { bg: 'hsla(45, 90%, 60%, 0.1)', text: 'var(--warning-400)', border: 'var(--warning-500)' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' },
    'ERROR': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' }
  };
  
  const st = statusColors[summary.overall_status] || statusColors['NOT_STARTED'];
  const hasData = summary.kdb_value > 0 || summary.klb_value > 0;
  
  return `
    <div class="card-quartz clickable" id="building-intensity-card" onclick="window.navigate('building-intensity', {id:'${project.id}'})" style="padding: var(--space-6); background: ${st.bg}; border-color: ${st.border}44">
      <div class="flex-between" style="margin-bottom: 20px">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: ${st.bg}; display: flex; align-items: center; justify-content: center; color: ${st.text}; border: 1px solid ${st.border}44">
          <i class="fas fa-ruler-combined" style="font-size: 1.4rem"></i>
        </div>
        <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: ${st.text}">
          ${summary.overall_status?.replace('_', ' ') || 'NOT STARTED'}
        </div>
      </div>
      
      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 4px">
        Intensitas & Kesesuaian Fungsi
      </h3>
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5">
        PP 16/2021 • KKPR • Perda Garut & Jabar
      </p>
      
      ${hasData ? `
        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px">
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
            <div style="font-size: 0.9rem; font-weight: 800; color: ${summary.kdb_status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">${summary.kdb_value?.toFixed(1) || 0}%</div>
            <div style="font-size: 9px; color: var(--text-tertiary)">KDB</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
            <div style="font-size: 0.9rem; font-weight: 800; color: ${summary.klb_status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">${summary.klb_value?.toFixed(2) || 0}</div>
            <div style="font-size: 9px; color: var(--text-tertiary)">KLB</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
            <div style="font-size: 0.9rem; font-weight: 800; color: ${summary.kdh_status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">${summary.kdh_value?.toFixed(1) || 0}%</div>
            <div style="font-size: 9px; color: var(--text-tertiary)">KDH</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
            <div style="font-size: 0.9rem; font-weight: 800; color: var(--brand-400)">${summary.floor_count || '-'}</div>
            <div style="font-size: 9px; color: var(--text-tertiary)">Lantai</div>
          </div>
        </div>
        
        ${summary.violation_count > 0 ? `
          <div style="margin-top: 12px; padding: 8px 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px">
            <span style="font-size: 10px; color: var(--danger-400)">
              <i class="fas fa-triangle-exclamation" style="margin-right: 4px"></i>
              ${summary.violation_count} pelanggaran ketentuan
            </span>
          </div>
        ` : ''}
      ` : `
        <div style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); border: 1px dashed hsla(220, 20%, 100%, 0.1); border-radius: 12px; text-align: center">
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 12px">
            Belum ada data pemeriksaan intensitas
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

export async function renderBuildingIntensityModule(projectId) {
  const assessments = await fetchAssessments(projectId);
  
  return `
    <div id="building-intensity-module" style="animation: page-fade-in 0.5s ease-out">
      <!-- Module Header -->
      <div class="card-quartz" style="padding: var(--space-6); margin-bottom: var(--space-6); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2)">
        <div class="flex-between" style="align-items: flex-start">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px">
              <i class="fas fa-ruler-combined" style="color: var(--brand-400); font-size: 1.5rem"></i>
              <h2 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0">
                Intensitas & Kesesuaian Fungsi
              </h2>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-tertiary); margin: 0">
              PP 16/2021 | KKPR | Perda Garut 6/2012 | Perda Jabar 1/2022
            </p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-outline btn-sm" onclick="window._exportIntensityData('${projectId}')">
              <i class="fas fa-download" style="margin-right: 8px"></i> Export
            </button>
            <button class="btn btn-primary btn-sm" onclick="window._generateBAReport('${projectId}')">
              <i class="fas fa-file-contract" style="margin-right: 8px"></i> Buat BA
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 0; margin-bottom: var(--space-6); overflow: hidden">
        <div class="flex" style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05)">
          ${renderTabButton('assessment', 'Assessment', 'fa-clipboard-check', true)}
          ${renderTabButton('zoning', 'Zoning & Fungsi', 'fa-map-marked-alt')}
          ${renderTabButton('intensity', 'KDB/KLB/KDH/KTB', 'fa-calculator')}
          ${renderTabButton('setback', 'Setback & Jarak', 'fa-arrows-left-right')}
          ${renderTabButton('perda', 'Perda Khusus', 'fa-gavel')}
          ${renderTabButton('analysis', 'Analisis & Simulasi', 'fa-chart-area')}
        </div>
      </div>

      <!-- TAB CONTENT: ASSESSMENT -->
      <div id="intensity-tab-assessment" class="intensity-tab-content active">
        ${renderAssessmentTab(projectId, assessments)}
      </div>

      <!-- TAB CONTENT: ZONING -->
      <div id="intensity-tab-zoning" class="intensity-tab-content" style="display: none;">
        ${renderZoningTab()}
      </div>

      <!-- TAB CONTENT: INTENSITY -->
      <div id="intensity-tab-intensity" class="intensity-tab-content" style="display: none;">
        ${renderIntensityCalculatorTab()}
      </div>

      <!-- TAB CONTENT: SETBACK -->
      <div id="intensity-tab-setback" class="intensity-tab-content" style="display: none;">
        ${renderSetbackTab()}
      </div>

      <!-- TAB CONTENT: PERDA -->
      <div id="intensity-tab-perda" class="intensity-tab-content" style="display: none;">
        ${renderPerdaTab()}
      </div>

      <!-- TAB CONTENT: ANALYSIS -->
      <div id="intensity-tab-analysis" class="intensity-tab-content" style="display: none;">
        ${renderAnalysisTab()}
      </div>
    </div>
  `;
}

function renderTabButton(id, label, icon, active = false) {
  return `
    <button class="intensity-tab-btn ${active ? 'active' : ''}" data-tab="${id}" 
            onclick="window._switchIntensityTab('${id}', this)"
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
  const latestAssessment = assessments[0];
  
  return `
    <div class="intensity-tab-panel" id="tab-assessment">
      <!-- Quick Actions -->
      <div class="grid-3-col" style="margin-bottom: var(--space-6)">
        <div class="card-quartz clickable" onclick="window._newAssessment('${projectId}')" 
             style="padding: var(--space-4); text-align: center; background: hsla(158, 85%, 45%, 0.1)">
          <i class="fas fa-plus-circle" style="font-size: 1.5rem; color: var(--success-400); margin-bottom: 8px"></i>
          <div style="font-size: 0.75rem; font-weight: 700; color: white">Pemeriksaan Baru</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">Buat BA baru</div>
        </div>
        <div class="card-quartz clickable" onclick="window._importKKPR('${projectId}')" 
             style="padding: var(--space-4); text-align: center; background: hsla(220, 95%, 52%, 0.1)">
          <i class="fas fa-file-import" style="font-size: 1.5rem; color: var(--brand-400); margin-bottom: 8px"></i>
          <div style="font-size: 0.75rem; font-weight: 700; color: white">Import KKPR</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">Data dari ATR/BPN</div>
        </div>
        <div class="card-quartz clickable" onclick="window._viewHistory('${projectId}')" 
             style="padding: var(--space-4); text-align: center; background: hsla(220, 20%, 100%, 0.05)">
          <i class="fas fa-history" style="font-size: 1.5rem; color: var(--text-secondary); margin-bottom: 8px"></i>
          <div style="font-size: 0.75rem; font-weight: 700; color: white">Riwayat</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary)">${assessments.length} pemeriksaan</div>
        </div>
      </div>

      ${latestAssessment ? renderLatestAssessment(latestAssessment) : renderEmptyState(projectId)}
    </div>
  `;
}

function renderLatestAssessment(assessment) {
  const complianceStatus = assessment.overall_status === 'SESUAI' ? 
    { icon: 'fa-check-circle', color: 'var(--success-400)', text: 'SESUAI' } :
    assessment.overall_status === 'TIDAK_SESUAI' ?
    { icon: 'fa-times-circle', color: 'var(--danger-400)', text: 'TIDAK SESUAI' } :
    { icon: 'fa-exclamation-circle', color: 'var(--warning-400)', text: 'PERLU ADJUSTMENT' };
  
  return `
    <div class="card-quartz" style="padding: var(--space-6)">
      <div class="flex-between" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1)">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px">BERITA ACARA TERAKHIR</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: white">${assessment.ba_number || 'BA/KF/XXXX/XXX'}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary)">
            ${new Date(assessment.assessment_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
          </div>
        </div>
        <div style="text-align: right">
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; 
                      background: ${complianceStatus.color}22; border-radius: 12px; border: 1px solid ${complianceStatus.color}44">
            <i class="fas ${complianceStatus.icon}" style="font-size: 1.5rem; color: ${complianceStatus.color}"></i>
            <span style="font-size: 1rem; font-weight: 800; color: ${complianceStatus.color}">${complianceStatus.text}</span>
          </div>
        </div>
      </div>

      <!-- Summary Grid -->
      <div class="grid-2-col" style="margin-bottom: 20px">
        <!-- Left: Intensity Summary -->
        <div>
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px">
            <i class="fas fa-chart-pie" style="margin-right: 8px; color: var(--brand-400)"></i>
            Ringkasan Intensitas
          </h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
            ${renderIntensityGauge('KDB', assessment.kdb_value || 0, assessment.kdb_status || 'NA', '%')}
            ${renderIntensityGauge('KLB', assessment.klb_value || 0, assessment.klb_status || 'NA', '', true)}
            ${renderIntensityGauge('KDH', assessment.kdh_value || 0, assessment.kdh_status || 'NA', '%')}
            ${renderIntensityGauge('KTB', assessment.ktb_value || 0, assessment.ktb_status || 'NA', '%')}
          </div>
        </div>

        <!-- Right: Zoning Info -->
        <div>
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px">
            <i class="fas fa-map-marked-alt" style="margin-right: 8px; color: var(--gold-400)"></i>
            Informasi Zoning
          </h4>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 16px; border-radius: 12px">
            <div style="margin-bottom: 12px">
              <div style="font-size: 0.7rem; color: var(--text-tertiary)">KODE ZONA</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: white">${assessment.zone_code || '-'}</div>
            </div>
            <div style="margin-bottom: 12px">
              <div style="font-size: 0.7rem; color: var(--text-tertiary)">NAMA ZONA</div>
              <div style="font-size: 0.9rem; color: var(--text-secondary)">${assessment.zone_name || '-'}</div>
            </div>
            <div style="margin-bottom: 12px">
              <div style="font-size: 0.7rem; color: var(--text-tertiary)">FUNGSI RENCANA</div>
              <div style="font-size: 0.9rem; color: var(--text-secondary)">${assessment.planned_function || '-'}</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary)">KESESUAIAN FUNGSI</div>
              <div style="font-size: 0.9rem; font-weight: 600; 
                          color: ${assessment.function_compliance === 'SESUAI' ? 'var(--success-400)' : 'var(--danger-400)'}">
                ${assessment.function_compliance || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      ${assessment.violations?.length > 0 ? `
        <div style="margin-top: 20px">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 16px">
            <i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: var(--danger-400)"></i>
            Temuan Pelanggaran (${assessment.violations.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: 8px">
            ${assessment.violations.map((v, i) => `
              <div style="padding: 12px 16px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; border-left: 3px solid var(--danger-400)">
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--danger-400); margin-bottom: 4px">
                  ${i + 1}. ${v.parameter || 'Pelanggaran'}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary)">
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

function renderIntensityGauge(label, value, status, unit = '', isRatio = false) {
  const color = status === 'C' ? 'var(--success-400)' : status === 'NC' ? 'var(--danger-400)' : 'var(--text-tertiary)';
  const bgColor = status === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : status === 'NC' ? 'hsla(0, 85%, 60%, 0.1)' : 'hsla(220, 20%, 100%, 0.05)';
  
  return `
    <div style="padding: 12px; background: ${bgColor}; border-radius: 8px; text-align: center">
      <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-bottom: 4px">${label}</div>
      <div style="font-size: 1.3rem; font-weight: 800; color: ${color}">
        ${isRatio ? value.toFixed(2) : value.toFixed(1)}${unit}
      </div>
      <div style="font-size: 0.65rem; color: ${color}; margin-top: 2px">${status === 'C' ? '✓' : status === 'NC' ? '✗' : '-'}</div>
    </div>
  `;
}

function renderEmptyState(projectId) {
  return `
    <div class="card-quartz" style="padding: var(--space-8); text-align: center">
      <i class="fas fa-clipboard-list" style="font-size: 4rem; color: var(--text-tertiary); margin-bottom: 24px; opacity: 0.5"></i>
      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 8px">
        Belum Ada Pemeriksaan
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-tertiary); max-width: 400px; margin: 0 auto 24px">
        Mulai pemeriksaan intensitas bangunan untuk menilai kesesuaian fungsi dan parameter KDB, KLB, KDH, KTB
      </p>
      <button class="btn btn-primary" onclick="window._newAssessment('${projectId}')">
        <i class="fas fa-plus" style="margin-right: 8px"></i> Pemeriksaan Baru
      </button>
    </div>
  `;
}

// ============================================================
// 5. ZONING & FUNGSI TAB
// ============================================================

function renderZoningTab() {
  return `
    <div class="intensity-tab-panel" id="tab-zoning" style="display: none">
      <div class="grid-2-col">
        <!-- Zoning Validation -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-map-marked-alt" style="margin-right: 8px; color: var(--brand-400)"></i>
            Validasi Zoning vs Fungsi
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Kode Zona (KKPR/RDTR)
            </label>
            <select id="zone-code" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="">Pilih Zona</option>
              <option value="R">R - Perumahan</option>
              <option value="C">C - Komersial</option>
              <option value="I">I - Industri</option>
              <option value="K">K - Perkantoran</option>
              <option value="M">M - Campuran</option>
              <option value="RT">RT - Ruang Terbuka Hijau</option>
              <option value="PUS">PUS - Kawasan Pusaka</option>
              <option value="RB">RB - Rawan Bencana</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Fungsi Rencana Bangunan
            </label>
            <select id="planned-function" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="">Pilih Fungsi</option>
              <option value="rumah_tinggal">Rumah Tinggal</option>
              <option value="rumah_kos">Rumah Kos</option>
              <option value="ruko">Ruko</option>
              <option value="kantor">Kantor</option>
              <option value="hotel">Hotel</option>
              <option value="pabrik">Pabrik</option>
              <option value="gudang">Gudang</option>
              <option value="mall">Mall/Pusat Perbelanjaan</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._validateZoning()">
            <i class="fas fa-check-circle" style="margin-right: 8px"></i> Validasi Kesesuaian
          </button>
          <div id="zoning-validation-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                  border-radius: 12px; display: none">
          </div>
        </div>

        <!-- Room Schedule Analysis -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-door-open" style="margin-right: 8px; color: var(--gold-400)"></i>
            Analisis Pemanfaatan Ruang Dalam
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Lantai
            </label>
            <input type="number" id="room-floor" class="form-control" value="1" min="1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Nama Ruang
            </label>
            <input type="text" id="room-name" class="form-control" placeholder="Contoh: Ruang Tamu"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas (m²)
            </label>
            <input type="number" id="room-area" class="form-control" value="0" min="0" step="0.1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-outline" style="width: 100%" onclick="window._addRoomSchedule()">
            <i class="fas fa-plus" style="margin-right: 8px"></i> Tambah Ruang
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 6. INTENSITY CALCULATOR TAB
// ============================================================

function renderIntensityCalculatorTab() {
  return `
    <div class="intensity-tab-panel" id="tab-intensity" style="display: none">
      <div class="grid-2-col">
        <!-- KDB Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-square" style="margin-right: 8px; color: var(--brand-400)"></i>
            KDB - Koefisien Dasar Bangunan
          </h4>
          <div style="background: hsla(220, 95%, 52%, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px">
            <div style="font-size: 0.7rem; color: var(--brand-300); font-family: monospace">
              Rumus: KDB = (Luas Lantai Dasar / Luas Persil) × 100%
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Lantai Dasar / Footprint (m²)
            </label>
            <input type="number" id="kdb-footprint" class="form-control" value="100" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Persil (m²)
            </label>
            <input type="number" id="kdb-site" class="form-control" value="200" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateKDB()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung KDB
          </button>
          <div id="kdb-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                       border-radius: 12px; display: none">
          </div>
        </div>

        <!-- KLB Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-layer-group" style="margin-right: 8px; color: var(--gold-400)"></i>
            KLB - Koefisien Lantai Bangunan (FAR)
          </h4>
          <div style="background: hsla(45, 90%, 60%, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px">
            <div style="font-size: 0.7rem; color: var(--gold-300); font-family: monospace">
              Rumus: KLB = Luas Total Lantai / Luas Persil
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Total Seluruh Lantai (m²)
            </label>
            <input type="number" id="klb-total" class="form-control" value="300" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Persil (m²)
            </label>
            <input type="number" id="klb-site" class="form-control" value="200" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateKLB()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung KLB
          </button>
          <div id="klb-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                       border-radius: 12px; display: none">
          </div>
        </div>

        <!-- KDH Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-tree" style="margin-right: 8px; color: var(--success-400)"></i>
            KDH - Koefisien Daerah Hijau
          </h4>
          <div style="background: hsla(158, 85%, 45%, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px">
            <div style="font-size: 0.7rem; color: var(--success-300); font-family: monospace">
              Rumus: KDH = (Luas RTH / Luas Persil) × 100%
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Ruang Terbuka Hijau (m²)
            </label>
            <input type="number" id="kdh-green" class="form-control" value="40" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Persil (m²)
            </label>
            <input type="number" id="kdh-site" class="form-control" value="200" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateKDH()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung KDH
          </button>
          <div id="kdh-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                       border-radius: 12px; display: none">
          </div>
        </div>

        <!-- Comprehensive Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-calculator" style="margin-right: 8px; color: var(--danger-400)"></i>
            Kalkulator Komprehensif
          </h4>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Luas Persil (m²)</label>
            <input type="number" id="comp-site" class="form-control" value="200" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Footprint (m²)</label>
            <input type="number" id="comp-footprint" class="form-control" value="100" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Total Lantai (m²)</label>
            <input type="number" id="comp-total" class="form-control" value="300" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 12px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Luas Hijau (m²)</label>
            <input type="number" id="comp-green" class="form-control" value="40" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 6px; font-size: 0.7rem; color: var(--text-secondary)">Basement (m²)</label>
            <input type="number" id="comp-basement" class="form-control" value="0" min="0"
                   style="width: 100%; padding: 10px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.85rem">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateAllIntensity()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Semua
          </button>
          <div id="comp-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                        border-radius: 12px; display: none">
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 7. SETBACK TAB
// ============================================================

function renderSetbackTab() {
  return `
    <div class="intensity-tab-panel" id="tab-setback" style="display: none">
      <div class="grid-2-col">
        <!-- Road Setback -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-road" style="margin-right: 8px; color: var(--brand-400)"></i>
            Sempadan Jalan
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Klasifikasi Jalan
            </label>
            <select id="road-class" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="">Pilih Klasifikasi</option>
              <option value="arteri">Jalan Arteri (8-15m)</option>
              <option value="kolektor">Jalan Kolektor (5-8m)</option>
              <option value="lokal">Jalan Lokal (3-5m)</option>
              <option value="lingkungan">Jalan Lingkungan (1.5-3m)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Lebar Jalan Aktual (m)
            </label>
            <input type="number" id="road-width" class="form-control" value="0" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateRoadSetback()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Sempadan
          </button>
          <div id="road-setback-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                              border-radius: 12px; display: none">
          </div>
        </div>

        <!-- River & Utility Setbacks -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-water" style="margin-right: 8px; color: var(--success-400)"></i>
            Sempadan Sungai & Utilitas
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Lebar Sungai (m)
            </label>
            <input type="number" id="river-width" class="form-control" value="0" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tegangan Listrik (kV)
            </label>
            <input type="number" id="voltage" class="form-control" value="0" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tipe Rel KA
            </label>
            <select id="railway-type" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="">Tidak Ada</option>
              <option value="utama">Jalur Utama (20m)</option>
              <option value="lokal">Jalur Lokal (10m)</option>
              <option value="industri">Jalur Industri (15m)</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateUtilitySetbacks()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Sempadan
          </button>
          <div id="utility-setback-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                  border-radius: 12px; display: none">
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 8. PERDA KHUSUS TAB
// ============================================================

function renderPerdaTab() {
  return `
    <div class="intensity-tab-panel" id="tab-perda" style="display: none">
      <div class="grid-2-col">
        <!-- Garut Special Regulations -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-landmark" style="margin-right: 8px; color: var(--success-400)"></i>
            Perda Kabupaten Garut No. 6/2012
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Kawasan Khusus
            </label>
            <select id="garut-zone" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="">Bukan Kawasan Khusus</option>
              <option value="cipanas">Kawasan Pusaka Cipanas</option>
              <option value="cangkuang">Kawasan Pusaka Cangkuang</option>
              <option value="galunggung">Kawasan Rawan Bencana Galunggung</option>
              <option value="pertanian">Kawasan Pertanian (LP2B)</option>
            </select>
          </div>
          <div id="garut-info" style="margin-bottom: 16px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); 
                                       border-radius: 8px; display: none">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._checkGarutCompliance()">
            <i class="fas fa-gavel" style="margin-right: 8px"></i> Cek Compliance Garut
          </button>
        </div>

        <!-- Jabar RDTR -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-map" style="margin-right: 8px; color: var(--brand-400)"></i>
            Perda Provinsi Jabar No. 1/2022 (RDTR)
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Kawasan Prioritas
            </label>
            <select id="jabar-region" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="">Luar Zona Prioritas</option>
              <option value="bandung_raya">Kawasan Bandung Raya</option>
              <option value="cekungan">Kawasan Cekungan Bandung</option>
              <option value="pantura">Kawasan Pantura Jabar</option>
            </select>
          </div>
          <div id="jabar-info" style="margin-bottom: 16px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); 
                                       border-radius: 8px; display: none">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._checkJabarCompliance()">
            <i class="fas fa-gavel" style="margin-right: 8px"></i> Cek RDTR Jabar
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 9. ANALYSIS & SIMULATION TAB
// ============================================================

function renderAnalysisTab() {
  return `
    <div class="intensity-tab-panel" id="tab-analysis" style="display: none">
      <div class="grid-2-col">
        <!-- Shadow Analysis -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-cloud-sun" style="margin-right: 8px; color: var(--gold-400)"></i>
            Analisis Bayangan (Hak Cahaya)
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tinggi Bangunan (m)
            </label>
            <input type="number" id="shadow-building-height" class="form-control" value="15" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Jarak ke Tetangga (m)
            </label>
            <input type="number" id="shadow-distance" class="form-control" value="5" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tinggi Bangunan Tetangga (m)
            </label>
            <input type="number" id="shadow-neighbor-height" class="form-control" value="8" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateShadow()">
            <i class="fas fa-sun" style="margin-right: 8px"></i> Analisis Bayangan
          </button>
          <div id="shadow-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                          border-radius: 12px; display: none">
          </div>
        </div>

        <!-- View Corridor -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-mountain" style="margin-right: 8px; color: var(--brand-400)"></i>
            View Corridor Check
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Landmark / Gunung
            </label>
            <select id="view-landmark" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="">Pilih Landmark</option>
              <option value="gede">Gunung Gede</option>
              <option value="galunggang">Gunung Galunggang</option>
              <option value="guntur">Gunung Guntur</option>
              <option value="cikuray">Gunung Cikuray</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tinggi Bangunan (m)
            </label>
            <input type="number" id="view-building-height" class="form-control" value="15" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._checkViewCorridor()">
            <i class="fas fa-eye" style="margin-right: 8px"></i> Cek View Corridor
          </button>
          <div id="view-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                       border-radius: 12px; display: none">
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 10. DATA FETCH FUNCTIONS
// ============================================================

async function fetchAssessments(projectId) {
  try {
    const { data, error } = await supabase
      .from('building_intensity_assessments')
      .select('*')
      .eq('project_id', projectId)
      .order('assessment_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return [];
  }
}

// ============================================================
// 11. HANDLERS INITIALIZATION
// ============================================================

export function initBuildingIntensityHandlers(projectId) {
  // Tab Switching
  window._switchIntensityTab = (tabId, btn) => {
    // Update button states
    document.querySelectorAll('.intensity-tab-btn').forEach(b => {
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
    document.querySelectorAll('.intensity-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    const targetContent = document.getElementById(`intensity-tab-${tabId}`);
    if (targetContent) {
      targetContent.style.display = 'block';
    }
  };
  
  // Calculator Handlers
  window._calculateKDB = () => {
    const footprint = parseFloat(document.getElementById('kdb-footprint')?.value || 0);
    const site = parseFloat(document.getElementById('kdb-site')?.value || 0);
    
    const result = IntensityCalc.calculateKDB(footprint, site);
    
    const resultDiv = document.getElementById('kdb-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">KDB (Koefisien Dasar Bangunan)</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--brand-400)">${result.percentage}</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Footprint</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${footprint} m²</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Sisa Lahan</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${result.remainingArea} m²</div>
          </div>
        </div>
      `;
    }
  };
  
  window._calculateKLB = () => {
    const total = parseFloat(document.getElementById('klb-total')?.value || 0);
    const site = parseFloat(document.getElementById('klb-site')?.value || 0);
    
    const result = IntensityCalc.calculateKLB(total, site);
    
    const resultDiv = document.getElementById('klb-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">KLB / FAR (Floor Area Ratio)</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--gold-400)">${result.ratio}</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Total Floor Area</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${total} m²</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Est. Floors</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${Math.ceil(result.decimal)} lantai</div>
          </div>
        </div>
      `;
    }
  };
  
  window._calculateKDH = () => {
    const green = parseFloat(document.getElementById('kdh-green')?.value || 0);
    const site = parseFloat(document.getElementById('kdh-site')?.value || 0);
    
    const result = IntensityCalc.calculateKDH(green, site);
    
    const resultDiv = document.getElementById('kdh-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">KDH (Koefisien Daerah Hijau)</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--success-400)">${result.percentage}</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Green Area</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${green} m²</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Non-Green</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${result.nonGreenArea} m²</div>
          </div>
        </div>
      `;
    }
  };
  
  window._calculateAllIntensity = () => {
    const site = parseFloat(document.getElementById('comp-site')?.value || 0);
    const footprint = parseFloat(document.getElementById('comp-footprint')?.value || 0);
    const total = parseFloat(document.getElementById('comp-total')?.value || 0);
    const green = parseFloat(document.getElementById('comp-green')?.value || 0);
    const basement = parseFloat(document.getElementById('comp-basement')?.value || 0);
    
    const result = IntensityCalc.calculateBuildingIntensity({
      siteArea: site,
      footprintArea: footprint,
      totalFloorArea: total,
      greenArea: green,
      basementArea: basement
    });
    
    const resultDiv = document.getElementById('comp-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">KDB</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--brand-400)">${result.summary.buildingCoverage}</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">KLB</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold-400)">${result.summary.floorRatio}</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">KDH</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-400)">${result.summary.greenCoverage}</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">KTB</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-secondary)">${result.summary.basementCoverage}</div>
          </div>
        </div>
        <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px">Land Use Composition</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <span class="badge" style="background: hsla(158, 85%, 45%, 0.2); color: var(--success-400); border: 1px solid var(--success-400)44; font-size: 10px">
              Hijau: ${result.summary.greenCoverage}
            </span>
            <span class="badge" style="background: hsla(220, 95%, 52%, 0.2); color: var(--brand-400); border: 1px solid var(--brand-400)44; font-size: 10px">
              Bangunan: ${result.summary.buildingCoverage}
            </span>
            <span class="badge" style="background: hsla(220, 20%, 100%, 0.1); color: var(--text-secondary); border: 1px solid var(--text-tertiary)44; font-size: 10px">
              Paving: ${result.summary.hardscapeCoverage}
            </span>
          </div>
        </div>
      `;
    }
  };
  
  // More handlers for zoning, setbacks, etc.
  window._validateZoning = () => {
    const zone = document.getElementById('zone-code')?.value;
    const func = document.getElementById('planned-function')?.value;
    
    if (!zone || !func) {
      showError('Pilih zona dan fungsi terlebih dahulu');
      return;
    }
    
    const result = IntensityCalc.validateZoningCompliance(func, zone);
    
    const resultDiv = document.getElementById('zoning-validation-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 16px; background: ${result.compliance.level === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 12px; border: 1px solid ${result.compliance.level === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}44">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px">
            <i class="fas ${result.compliance.level === 'C' ? 'fa-check-circle' : 'fa-times-circle'}" style="font-size: 2rem; color: ${result.compliance.level === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}"></i>
            <div>
              <div style="font-size: 1.2rem; font-weight: 800; color: ${result.compliance.level === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}">${result.compliance.status}</div>
              <div style="font-size: 0.75rem; color: var(--text-tertiary)">${result.zoneName}</div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px">${result.recommendation}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">Jenis Izin: ${result.permitType}</div>
        </div>
      `;
    }
  };
  
  // Navigation handlers
  window._newAssessment = (projectId) => {
    navigate('intensity-new-assessment', { projectId });
  };
  
  window._importKKPR = (projectId) => {
    showInfo('Fitur import KKPR akan segera hadir');
  };
  
  window._viewHistory = (projectId) => {
    showInfo('Menampilkan riwayat pemeriksaan...');
  };
  
  window._exportIntensityData = (projectId) => {
    showInfo('Mengekspor data intensitas...');
  };
  
  window._generateBAReport = (projectId) => {
    showInfo('Membuat Berita Acara...');
  };
}

// Default export
export default {
  renderBuildingIntensityCard,
  renderBuildingIntensityModule,
  fetchBuildingIntensitySummary,
  initBuildingIntensityHandlers
};
