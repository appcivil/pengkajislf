/**
 * KONDISI FISIK MODULE - Proyek Detail Card Integration
 * Card untuk ringkasan Pemeriksaan Kondisi Fisik di halaman proyek-detail
 * Berdasarkan: Permen PU 16/2010 - Penilaian Tingkat Kerusakan Bangunan
 * UI/UX: Presidential Quartz Style
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchKondisiSummary(projectId) {
  try {
    // Fetch latest analysis for damage assessment
    const { data: analisis, error } = await supabase
      .from('hasil_analisis')
      .select('skor_total, kategori_kerusakan, rekomendasi_utama, created_at')
      .eq('proyek_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (analisis) {
      const skor = analisis.skor_total || 0;
      let status = 'NOT_STARTED';
      
      if (skor >= 80) status = 'BAIK';
      else if (skor >= 60) status = 'SEDANG';
      else if (skor > 0) status = 'RUSAK';
      
      return {
        skor_total: skor,
        kategori_kerusakan: analisis.kategori_kerusakan || '-',
        rekomendasi_utama: analisis.rekomendasi_utama || '-',
        overall_status: status,
        last_analisis: analisis.created_at,
        has_data: true
      };
    }
    
    // Return default empty state
    return {
      skor_total: 0,
      kategori_kerusakan: '-',
      rekomendasi_utama: '-',
      overall_status: 'NOT_STARTED',
      last_analisis: null,
      has_data: false
    };
  } catch (error) {
    console.error('Error fetching kondisi summary:', error);
    return { 
      skor_total: 0, 
      overall_status: 'ERROR',
      error_message: 'Gagal memuat data kondisi fisik',
      has_data: false
    };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderKondisiCard(project, summary = {}) {
  const statusColors = {
    'BAIK': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'SEDANG': { bg: 'hsla(45, 90%, 60%, 0.1)', text: 'var(--gold-400)', border: 'var(--gold-500)' },
    'RUSAK': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' },
    'ERROR': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' }
  };
  
  const st = statusColors[summary.overall_status] || statusColors['NOT_STARTED'];
  const hasData = summary.has_data;
  const hasError = summary.overall_status === 'ERROR';
  
  return `
    <div class="card-quartz clickable" id="kondisi-card" 
         onclick="window.navigate('kondisi', {id:'${project.id}'})">
      <div class="card-header">
        <div class="card-icon" style="background: ${st.bg}; color: ${st.text}; border-color: ${st.border}44">
          <i class="fas fa-building-circle-exclamation" style="font-size: 1.4rem"></i>
        </div>
        <div class="card-phase" style="color: ${st.text}">PHASE 02.5</div>
      </div>
      
      <h3 class="card-title">Pemeriksaan Kondisi</h3>
      <p class="card-description">
        Penilaian tingkat kerusakan bangunan sesuai standar Permen PU 16/2010.
      </p>
      
      ${hasError ? `
        <div class="card-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <span>${summary.error_message || 'Terjadi kesalahan saat memuat data'}</span>
        </div>
      ` : hasData ? `
        <div class="card-score-section" style="background: ${st.bg}; border-color: ${st.border}44">
          <div class="score-display">
            <div class="score-value" style="color: ${st.text}">${summary.skor_total}%</div>
            <div class="score-label">SKOR KESELURUHAN</div>
          </div>
          <div class="score-status" style="color: ${st.text}">
            ${summary.overall_status}
          </div>
        </div>
        
        ${summary.kategori_kerusakan !== '-' ? `
          <div class="card-detail-row">
            <span class="detail-label">Kategori:</span>
            <span class="detail-value">${summary.kategori_kerusakan}</span>
          </div>
        ` : ''}
        
        ${summary.last_analisis ? `
          <div class="card-last-updated">
            Dianalisis: ${new Date(summary.last_analisis).toLocaleDateString('id-ID')}
          </div>
        ` : ''}
      ` : `
        <div class="card-empty-state">
          <div class="empty-icon">🏗️</div>
          <div class="empty-text">Klik untuk mulai pemeriksaan kondisi fisik</div>
        </div>
      `}
      
      <div class="card-badges">
        <span class="badge badge-regulation" style="background: hsla(0, 85%, 60%, 0.1); color: var(--danger-400); border-color: hsla(0, 85%, 60%, 0.2)">Permen PU 16/2010</span>
      </div>
    </div>
  `;
}

// ============================================================
// 3. HANDLER INITIALIZATION
// ============================================================

export function initKondisiHandlers(project, summary = {}) {
  const card = document.getElementById('kondisi-card');
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
}

// ============================================================
// 4. UTILITY FUNCTIONS
// ============================================================

/**
 * Get damage category description
 */
export function getDamageCategoryDescription(kategori) {
  const descriptions = {
    'Ringan': 'Kerusakan < 30% - Perbaikan lokal',
    'Sedang': 'Kerusakan 30-45% - Perbaikan signifikan',
    'Berat': 'Kerusakan 45-65% - Rehabilitasi mayor',
    'Sangat Berat': 'Kerusakan > 65% - Pertimbangan pembongkaran'
  };
  
  return descriptions[kategori] || 'Kategori tidak dikenali';
}

/**
 * Export kondisi data untuk integrasi laporan SLF
 */
export async function exportKondisiData(projectId) {
  try {
    const { data: analisisList, error } = await supabase
      .from('hasil_analisis')
      .select('*')
      .eq('proyek_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!analisisList || analisisList.length === 0) {
      return { success: false, message: 'Data analisis kondisi belum tersedia' };
    }
    
    const latest = analisisList[0];
    
    return {
      success: true,
      data: {
        skor_total: latest.skor_total,
        kategori_kerusakan: latest.kategori_kerusakan,
        rekomendasi_utama: latest.rekomendasi_utama,
        detail_analisis: latest.detail_analisis,
        jumlah_analisis: analisisList.length,
        analisis_terakhir: latest.created_at,
        standar_digunakan: ['Permen PU 16/2010']
      }
    };
  } catch (error) {
    console.error('Error exporting kondisi data:', error);
    return { success: false, message: 'Gagal mengekspor data kondisi' };
  }
}
