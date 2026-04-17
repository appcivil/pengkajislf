/**
 * WASTEWATER MODULE - Proyek Detail Card Integration
 * Card untuk ringkasan Sistem Air Limbah di halaman proyek-detail
 * Berdasarkan: SNI 03-6389-2000, Permen PU No. 18/PRT/M/2021
 * UI/UX: Presidential Quartz Style
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchWastewaterSummary(projectId) {
  try {
    if (!projectId) return { overall_status: 'NOT_STARTED' };
    
    // Fetch from Supabase wastewater_monitoring table
    const { data, error } = await supabase
      .from('wastewater_monitoring')
      .select('*')
      .eq('project_id', projectId)
      .order('sampling_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.warn('[WastewaterModule] Fetch error:', error);
      return { overall_status: 'ERROR', error_message: 'Gagal memuat data air limbah' };
    }
    
    // Fetch from localStorage as fallback
    const storageKey = `wastewaterData_${projectId}`;
    const storedData = localStorage.getItem(storageKey);
    const parsed = storedData ? JSON.parse(storedData) : null;
    
    // Merge data
    const monitoringData = data || parsed;
    
    if (monitoringData) {
      const isCompliant = monitoringData.compliance_status === 'COMPLIANT' || 
                         monitoringData.ph_value >= 6 && monitoringData.ph_value <= 9;
      
      return {
        has_data: true,
        ph_value: monitoringData.ph_value || null,
        bod_value: monitoringData.bod_value || null,
        cod_value: monitoringData.cod_value || null,
        tss_value: monitoringData.tss_value || null,
        compliance_status: monitoringData.compliance_status || 'UNKNOWN',
        overall_status: isCompliant ? 'COMPLIANT' : monitoringData.compliance_status === 'NON_COMPLIANT' ? 'NON_COMPLIANT' : 'IN_PROGRESS',
        last_updated: monitoringData.sampling_date || monitoringData.updated_at || null
      };
    }
    
    // Return default empty state
    return {
      has_data: false,
      overall_status: 'NOT_STARTED',
      last_updated: null
    };
  } catch (error) {
    console.error('Error fetching wastewater summary:', error);
    return { 
      has_data: false,
      overall_status: 'ERROR',
      error_message: 'Gagal memuat data air limbah'
    };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderWastewaterCard(project, summary = {}) {
  const statusColors = {
    'COMPLIANT': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)', icon: 'fa-check-circle' },
    'IN_PROGRESS': { bg: 'hsla(220, 95%, 52%, 0.1)', text: 'var(--brand-400)', border: 'var(--brand-500)', icon: 'fa-clock' },
    'NON_COMPLIANT': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)', icon: 'fa-exclamation-triangle' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)', icon: 'fa-water' },
    'ERROR': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)', icon: 'fa-exclamation-circle' }
  };
  
  const st = statusColors[summary.overall_status] || statusColors['NOT_STARTED'];
  const hasData = summary.has_data;
  const hasError = summary.overall_status === 'ERROR';
  
  const statusLabels = {
    'COMPLIANT': 'Memenuhi Standar',
    'IN_PROGRESS': 'Pengumpulan Data',
    'NON_COMPLIANT': 'Tidak Memenuhi',
    'NOT_STARTED': 'Belum Dimulai',
    'ERROR': 'Error'
  };
  
  return `
    <div class="card-quartz clickable" id="wastewater-card" 
         onclick="window.navigate('wastewater-inspection', {id:'${project.id}'})">
      <div class="card-header">
        <div class="card-icon" style="background: ${st.bg}; color: ${st.text}; border-color: ${st.border}44">
          <i class="fas ${st.icon}" style="font-size: 1.4rem"></i>
        </div>
        <div class="card-phase" style="color: ${st.text}">PHASE 02F</div>
      </div>
      
      <h3 class="card-title">Sistem Air Limbah</h3>
      <p class="card-description">
        Evaluasi kualitas air limbah, pengolahan IPAL, dan pemantauan parameter BOD, COD, TSS, pH.
      </p>
      
      ${hasError ? `
        <div class="card-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <span>${summary.error_message || 'Terjadi kesalahan saat memuat data'}</span>
        </div>
      ` : hasData ? `
        <div class="card-metrics-grid">
          <div class="metric-item">
            <div class="metric-value" style="color: ${st.text}">${summary.ph_value || '-'}</div>
            <div class="metric-label">pH</div>
          </div>
          <div class="metric-item">
            <div class="metric-value" style="color: var(--brand-400)">${summary.bod_value || '-'}<small style="font-size:0.6em">mg/L</small></div>
            <div class="metric-label">BOD</div>
          </div>
          <div class="metric-item">
            <div class="metric-value" style="color: var(--gold-400)">${summary.tss_value || '-'}<small style="font-size:0.6em">mg/L</small></div>
            <div class="metric-label">TSS</div>
          </div>
        </div>
        
        <div class="card-status-badge" style="background: ${st.bg}; color: ${st.text}; border-color: ${st.border}44">
          <i class="fas ${st.icon}"></i>
          ${statusLabels[summary.overall_status] || 'Belum Dianalisis'}
        </div>
        
        ${summary.last_updated ? `
          <div class="card-last-updated">
            Sampel: ${new Date(summary.last_updated).toLocaleDateString('id-ID')}
          </div>
        ` : ''}
      ` : `
        <div class="card-empty-state">
          <div class="empty-icon">🚰</div>
          <div class="empty-text">Klik untuk mulai evaluasi sistem air limbah</div>
        </div>
      `}
      
      <div class="card-badges">
        <span class="badge badge-regulation" style="background: hsla(200, 80%, 45%, 0.1); color: hsla(200, 80%, 55%, 1); border-color: hsla(200, 80%, 45%, 0.2)">SNI 03-6389-2000</span>
        <span class="badge badge-standard" style="background: hsla(160, 100%, 45%, 0.1); color: var(--success-400); border-color: hsla(160, 100%, 45%, 0.2)">Permen PU 18/2021</span>
      </div>
    </div>
  `;
}

// ============================================================
// 3. HANDLER INITIALIZATION
// ============================================================

export function initWastewaterHandlers(project, summary = {}) {
  const card = document.getElementById('wastewater-card');
  if (!card) return;
  
  // Add hover effect
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = 'var(--shadow-lg)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '';
  });
  
  // Log interaction for analytics
  card.addEventListener('click', () => {
    console.log('[WastewaterModule] Navigating to wastewater inspection for project:', project.id);
  });
}

// ============================================================
// 4. UTILITY FUNCTIONS
// ============================================================

/**
 * Export wastewater data untuk integrasi laporan SLF
 */
export async function exportWastewaterData(projectId) {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('wastewater_monitoring')
      .select('*')
      .eq('project_id', projectId)
      .order('sampling_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      return {
        success: true,
        data: {
          ph: data.ph_value,
          bod: data.bod_value,
          cod: data.cod_value,
          tss: data.tss_value,
          compliance_status: data.compliance_status,
          sampling_date: data.sampling_date,
          standar_digunakan: ['SNI 03-6389-2000', 'Permen PU No. 18/PRT/M/2021', 'PP No. 16 Tahun 2021']
        }
      };
    }
    
    // Fallback to localStorage
    const storageKey = `wastewaterData_${projectId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return { success: false, message: 'Data air limbah belum tersedia' };
    }
    
    const parsed = JSON.parse(storedData);
    
    return {
      success: true,
      data: {
        ph: parsed.ph_value,
        bod: parsed.bod_value,
        cod: parsed.cod_value,
        tss: parsed.tss_value,
        compliance_status: parsed.compliance_status,
        sampling_date: parsed.sampling_date,
        standar_digunakan: ['SNI 03-6389-2000', 'Permen PU No. 18/PRT/M/2021', 'PP No. 16 Tahun 2021']
      }
    };
  } catch (error) {
    console.error('Error exporting wastewater data:', error);
    return { success: false, message: 'Gagal mengekspor data air limbah' };
  }
}
