/**
 * COMFORT MODULE - Proyek Detail Card Integration
 * Card untuk ringkasan Aspek Kenyamanan di halaman proyek-detail
 * Berdasarkan: PP Nomor 16 Tahun 2021 (Pasal 226), SNI 03-6197-2000,
 * SNI 03-6572-2001, SNI 03-6389-2000, ASHRAE 55/62.1
 * UI/UX: Presidential Quartz Style
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchComfortSummary(projectId) {
  try {
    // Fetch comfort assessment data from localStorage
    const storageKey = `comfortData_${projectId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      const parsed = JSON.parse(storedData);
      const roomCount = parsed.rooms?.length || 0;
      const climateDataCount = parsed.climateData?.length || 0;
      const noiseDataCount = parsed.noiseData?.length || 0;
      const hasSummary = parsed.summary && Object.keys(parsed.summary).length > 0;
      
      return {
        room_count: roomCount,
        climate_data_count: climateDataCount,
        noise_data_count: noiseDataCount,
        has_summary: hasSummary,
        overall_status: hasSummary ? 'IN_PROGRESS' : roomCount > 0 ? 'DATA_COLLECTED' : 'NOT_STARTED',
        last_updated: parsed.lastUpdated || null
      };
    }
    
    // Return default empty state
    return {
      room_count: 0,
      climate_data_count: 0,
      noise_data_count: 0,
      has_summary: false,
      overall_status: 'NOT_STARTED',
      last_updated: null
    };
  } catch (error) {
    console.error('Error fetching comfort summary:', error);
    return { 
      room_count: 0, 
      overall_status: 'ERROR',
      error_message: 'Gagal memuat data kenyamanan'
    };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderComfortCard(project, summary = {}) {
  const statusColors = {
    'COMPLIANT': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'IN_PROGRESS': { bg: 'hsla(220, 95%, 52%, 0.1)', text: 'var(--brand-400)', border: 'var(--brand-500)' },
    'DATA_COLLECTED': { bg: 'hsla(45, 90%, 60%, 0.1)', text: 'var(--gold-400)', border: 'var(--gold-500)' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' },
    'ERROR': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' }
  };
  
  const st = statusColors[summary.overall_status] || statusColors['NOT_STARTED'];
  const hasData = summary.room_count > 0 || summary.climate_data_count > 0;
  const hasError = summary.overall_status === 'ERROR';
  
  return `
    <div class="card-quartz clickable" id="comfort-card" 
         onclick="window.navigate('comfort-inspection', {id:'${project.id}'})">
      <div class="card-header">
        <div class="card-icon" style="background: ${st.bg}; color: ${st.text}; border-color: ${st.border}44">
          <i class="fas fa-couch" style="font-size: 1.4rem"></i>
        </div>
        <div class="card-phase" style="color: ${st.text}">PHASE 02D</div>
      </div>
      
      <h3 class="card-title">Aspek Kenyamanan</h3>
      <p class="card-description">
        Evaluasi ruang gerak, kondisi udara (PMV/PPD), pandangan, getaran & kebisingan.
      </p>
      
      ${hasError ? `
        <div class="card-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <span>${summary.error_message || 'Terjadi kesalahan saat memuat data'}</span>
        </div>
      ` : hasData ? `
        <div class="card-metrics-grid">
          <div class="metric-item">
            <div class="metric-value" style="color: ${st.text}">${summary.room_count}</div>
            <div class="metric-label">Ruang</div>
          </div>
          <div class="metric-item">
            <div class="metric-value" style="color: var(--brand-400)">${summary.climate_data_count}</div>
            <div class="metric-label">Iklim</div>
          </div>
          <div class="metric-item">
            <div class="metric-value" style="color: var(--gold-400)">${summary.noise_data_count}</div>
            <div class="metric-label">Kebisingan</div>
          </div>
        </div>
        
        ${summary.has_summary ? `
          <div class="card-status-badge" style="background: ${st.bg}; color: ${st.text}; border-color: ${st.border}44">
            <i class="fas fa-check-circle"></i>
            Analisis Lengkap
          </div>
        ` : `
          <div class="card-status-badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); border-color: var(--gold-500)44">
            <i class="fas fa-clock"></i>
            Pengumpulan Data
          </div>
        `}
        
        ${summary.last_updated ? `
          <div class="card-last-updated">
            Diperbarui: ${new Date(summary.last_updated).toLocaleDateString('id-ID')}
          </div>
        ` : ''}
      ` : `
        <div class="card-empty-state">
          <div class="empty-icon">🛋️</div>
          <div class="empty-text">Klik untuk mulai evaluasi kenyamanan ruangan</div>
        </div>
      `}
      
      <div class="card-badges">
        <span class="badge badge-regulation" style="background: hsla(160, 100%, 45%, 0.1); color: var(--success-400); border-color: hsla(160, 100%, 45%, 0.2)">PP 16/2021</span>
        <span class="badge badge-standard" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); border-color: hsla(220, 95%, 52%, 0.2)">ASHRAE 55</span>
      </div>
    </div>
  `;
}

// ============================================================
// 3. HANDLER INITIALIZATION
// ============================================================

export function initComfortHandlers(project, summary = {}) {
  const card = document.getElementById('comfort-card');
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
    console.log('[ComfortModule] Navigating to comfort inspection for project:', project.id);
  });
}

// ============================================================
// 4. UTILITY FUNCTIONS
// ============================================================

/**
 * Export comfort data untuk integrasi laporan SLF
 */
export async function exportComfortData(projectId) {
  try {
    const storageKey = `comfortData_${projectId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return { success: false, message: 'Data kenyamanan belum tersedia' };
    }
    
    const data = JSON.parse(storedData);
    
    return {
      success: true,
      data: {
        ruangan_dievaluasi: data.rooms?.length || 0,
        data_iklim: data.climateData || [],
        data_kebisingan: data.noiseData || [],
        data_getaran: data.vibrationData || [],
        ringkasan: data.summary || null,
        standar_digunakan: ['PP 16/2021', 'SNI 03-6197-2000', 'ASHRAE 55']
      }
    };
  } catch (error) {
    console.error('Error exporting comfort data:', error);
    return { success: false, message: 'Gagal mengekspor data kenyamanan' };
  }
}
