/**
 * DISASTER MITIGATION MODULE - Proyek Detail Card Integration
 * Card untuk ringkasan Mitigasi Bencana di halaman proyek-detail
 * Berdasarkan: BNPB, Perka BNPB No. 2/2012, SNI 03-1726-2012
 * UI/UX: Presidential Quartz Style
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchDisasterMitigationSummary(projectId) {
  try {
    // Fetch disaster analysis data from localStorage
    const storageKey = `disasterAnalysis_${projectId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      const parsed = JSON.parse(storedData);
      const riskLevel = parsed.riskLevel || 'UNKNOWN';
      const hasHazardMap = parsed.hazardData?.gempa || parsed.hazardData?.banjir || parsed.hazardData?.kebakaran;
      const mitigationCount = parsed.mitigations?.length || 0;
      
      return {
        risk_level: riskLevel,
        has_hazard_map: hasHazardMap,
        mitigation_count: mitigationCount,
        overall_status: riskLevel === 'LOW' ? 'COMPLIANT' : riskLevel === 'MODERATE' ? 'IN_PROGRESS' : riskLevel === 'HIGH' ? 'NON_COMPLIANT' : 'NOT_STARTED',
        last_updated: parsed.lastUpdated || null
      };
    }
    
    // Return default empty state
    return {
      risk_level: 'UNKNOWN',
      has_hazard_map: false,
      mitigation_count: 0,
      overall_status: 'NOT_STARTED',
      last_updated: null
    };
  } catch (error) {
    console.error('Error fetching disaster mitigation summary:', error);
    return { 
      risk_level: 'ERROR',
      mitigation_count: 0,
      overall_status: 'ERROR',
      error_message: 'Gagal memuat data mitigasi bencana'
    };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderDisasterMitigationCard(project, summary = {}) {
  const statusColors = {
    'COMPLIANT': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'IN_PROGRESS': { bg: 'hsla(220, 95%, 52%, 0.1)', text: 'var(--brand-400)', border: 'var(--brand-500)' },
    'NON_COMPLIANT': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' },
    'ERROR': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' }
  };
  
  const st = statusColors[summary.overall_status] || statusColors['NOT_STARTED'];
  const hasData = summary.has_hazard_map || summary.mitigation_count > 0;
  const hasError = summary.overall_status === 'ERROR';
  
  const riskLabels = {
    'LOW': 'Risiko Rendah',
    'MODERATE': 'Risiko Sedang',
    'HIGH': 'Risiko Tinggi',
    'UNKNOWN': 'Belum Dianalisis',
    'ERROR': 'Error'
  };
  
  return `
    <div class="card-quartz clickable" id="disaster-mitigation-card" 
         onclick="window.navigate('disaster-mitigation', {id:'${project.id}'})">
      <div class="card-header">
        <div class="card-icon" style="background: ${st.bg}; color: ${st.text}; border-color: ${st.border}44">
          <i class="fas fa-house-tsunami" style="font-size: 1.4rem"></i>
        </div>
        <div class="card-phase" style="color: ${st.text}">PHASE 02E</div>
      </div>
      
      <h3 class="card-title">Mitigasi Bencana</h3>
      <p class="card-description">
        Analisis risiko gempa, banjir, kebakaran & rencana mitigasi berdasarkan SNI 1726:2019.
      </p>
      
      ${hasError ? `
        <div class="card-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <span>${summary.error_message || 'Terjadi kesalahan saat memuat data'}</span>
        </div>
      ` : hasData ? `
        <div class="card-metrics-grid">
          <div class="metric-item">
            <div class="metric-value" style="color: ${st.text}">${summary.mitigation_count}</div>
            <div class="metric-label">Mitigasi</div>
          </div>
          <div class="metric-item">
            <div class="metric-value" style="color: var(--brand-400)">${summary.has_hazard_map ? '✓' : '-'}</div>
            <div class="metric-label">Peta Bahaya</div>
          </div>
        </div>
        
        <div class="card-status-badge" style="background: ${st.bg}; color: ${st.text}; border-color: ${st.border}44">
          <i class="fas fa-shield-alt"></i>
          ${riskLabels[summary.risk_level] || 'Belum Dianalisis'}
        </div>
        
        ${summary.last_updated ? `
          <div class="card-last-updated">
            Diperbarui: ${new Date(summary.last_updated).toLocaleDateString('id-ID')}
          </div>
        ` : ''}
      ` : `
        <div class="card-empty-state">
          <div class="empty-icon">🌊</div>
          <div class="empty-text">Klik untuk mulai analisis risiko bencana</div>
        </div>
      `}
      
      <div class="card-badges">
        <span class="badge badge-regulation" style="background: hsla(0, 85%, 60%, 0.1); color: var(--danger-400); border-color: hsla(0, 85%, 60%, 0.2)">SNI 1726:2019</span>
        <span class="badge badge-standard" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); border-color: hsla(45, 90%, 60%, 0.2)">BNPB</span>
      </div>
    </div>
  `;
}

// ============================================================
// 3. HANDLER INITIALIZATION
// ============================================================

export function initDisasterMitigationHandlers(project, summary = {}) {
  const card = document.getElementById('disaster-mitigation-card');
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
    console.log('[DisasterMitigationModule] Navigating to disaster inspection for project:', project.id);
  });
}

// ============================================================
// 4. UTILITY FUNCTIONS
// ============================================================

/**
 * Export disaster mitigation data untuk integrasi laporan SLF
 */
export async function exportDisasterMitigationData(projectId) {
  try {
    const storageKey = `disasterAnalysis_${projectId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return { success: false, message: 'Data mitigasi bencana belum tersedia' };
    }
    
    const data = JSON.parse(storedData);
    
    return {
      success: true,
      data: {
        tingkat_risiko: data.riskLevel || 'UNKNOWN',
        jumlah_mitigasi: data.mitigations?.length || 0,
        data_bahaya: data.hazardData || {},
        rekomendasi: data.mitigations || [],
        standar_digunakan: ['SNI 1726:2019', 'Perka BNPB No. 2/2012', 'PBI 1983']
      }
    };
  } catch (error) {
    console.error('Error exporting disaster mitigation data:', error);
    return { success: false, message: 'Gagal mengekspor data mitigasi bencana' };
  }
}
