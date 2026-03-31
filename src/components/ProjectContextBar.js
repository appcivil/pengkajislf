/**
 * PROJECT CONTEXT BAR
 * A premium glassmorphism header that shows the currently active project context 
 * across different pages (Checklist, Analysis, Reports).
 */
import { store } from '../lib/store.js';
import { navigate } from '../lib/router.js';
import { escHtml } from '../lib/utils.js';

export function renderProjectContextBar() {
  const { currentProyek, currentProyekId } = store.get();
  
  // If no project is selected, return empty or a generic search bar
  if (!currentProyekId || !currentProyek) {
    return '';
  }

  const statusMap = {
    'DALAM_PENGKAJIAN': { label: 'Dalam Pengkajian', cls: 'badge-proses' },
    'LAIK_FUNGSI': { label: 'Laik Fungsi', cls: 'badge-laik' },
    'TIDAK_LAIK_FUNGSI': { label: 'Tidak Laik', cls: 'badge-tidak-laik' }
  };
  const s = statusMap[currentProyek.status_slf] || { label: 'Proses Audit', cls: 'badge-proses' };

  return `
    <div class="project-context-bar animate-fade-in">
      <div class="context-left">
        <div class="context-project-info" onclick="window.navigate('proyek-detail', {id:'${currentProyekId}'})" role="button">
          <div class="context-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="context-text">
            <div class="context-label">PROYEK AKTIF</div>
            <div class="context-title truncate">${escHtml(currentProyek.nama_bangunan)}</div>
          </div>
        </div>
        
        <div class="divider-v"></div>
        
        <div class="context-status-pill ${s.cls}">
          <div class="status-dot"></div>
          <span>${s.label}</span>
        </div>
      </div>

      <div class="context-right">
        <div class="context-actions">
          <button class="ctx-btn" onclick="window.navigate('checklist', {id:'${currentProyekId}'})" title="Checklist Pemeriksaan">
            <i class="fas fa-clipboard-check"></i>
          </button>
          <button class="ctx-btn" onclick="window.navigate('analisis', {id:'${currentProyekId}'})" title="Analisis AI">
            <i class="fas fa-brain"></i>
          </button>
          <button class="ctx-btn primary" onclick="window.navigate('laporan', {id:'${currentProyekId}'})" title="Export Laporan">
            <i class="fas fa-file-export"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}
