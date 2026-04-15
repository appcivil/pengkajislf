// ============================================================
//  SIMULATION HUB MODULE
//  Integrated Engineering Simulation Center for Project Detail
//  Menggabungkan: Pencahayaan, Ventilasi, Evakuasi, NDT
// ============================================================

import { loadSimulasi, getSimulasiSummary } from '../lib/simulation-engine.js';

/**
 * Render Simulation Hub Card untuk halaman detail proyek
 * Menampilkan summary semua simulasi yang telah dijalankan
 * @param {Object} proyek - Data proyek
 * @param {Object} simulasiSummary - Summary dari getSimulasiSummary
 * @returns {string} HTML string
 */
export function renderSimulationHubCard(proyek, simulasiSummary = {}) {
  console.log('[SimulationHub] Rendering card for project:', proyek?.id, 'Summary:', simulasiSummary);
  
  const simulations = simulasiSummary.simulations || [];
  const totalSimulasi = simulations.length;
  
  // Count by type
  const typeCounts = {
    lighting: simulations.filter(s => s.tipe === 'lighting' || s.tipe === 'pencahayaan').length,
    ventilation: simulations.filter(s => s.tipe === 'ventilation' || s.tipe === 'ventilasi').length,
    evacuation: simulations.filter(s => s.tipe === 'evacuation' || s.tipe === 'evakuasi').length,
    ndt: simulations.filter(s => s.tipe === 'ndt').length,
    fire: simulations.filter(s => s.tipe === 'fire' || s.tipe === 'kebakaran').length,
  };
  
  // Get latest simulation
  const latestSim = simulations.length > 0 ? simulations[0] : null;
  const latestType = latestSim ? getSimulationLabel(latestSim.tipe) : null;
  
  // Simulation type icons and colors
  const simTypes = [
    { key: 'lighting', icon: 'fa-sun', label: 'Pencahayaan', color: 'var(--gold-400)', count: typeCounts.lighting },
    { key: 'ventilation', icon: 'fa-wind', label: 'Ventilasi', color: 'var(--brand-400)', count: typeCounts.ventilation },
    { key: 'evacuation', icon: 'fa-running', label: 'Evakuasi', color: 'var(--danger-400)', count: typeCounts.evacuation },
    { key: 'ndt', icon: 'fa-wave-square', label: 'NDT Test', color: 'var(--success-400)', count: typeCounts.ndt },
  ];
  
  // Count simulations with results
  const withResults = simulations.filter(s => s.hasil && Object.keys(s.hasil).length > 0).length;
  const completionRate = totalSimulasi > 0 ? Math.round((withResults / totalSimulasi) * 100) : 0;

  return `
    <div class="card-quartz simulation-hub-card" style="padding: var(--space-6); position: relative; overflow: hidden; border: 2px solid hsla(280, 100%, 60%, 0.3); background: linear-gradient(135deg, hsla(280, 100%, 60%, 0.05), hsla(220, 95%, 52%, 0.02));">
      <!-- Header -->
      <div class="flex-between" style="margin-bottom: 20px">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, hsla(280, 100%, 60%, 0.2), hsla(220, 95%, 52%, 0.1)); display: flex; align-items: center; justify-content: center; color: var(--brand-400); border: 1px solid hsla(280, 100%, 60%, 0.3);">
          <i class="fas fa-flask" style="font-size: 1.4rem;"></i>
        </div>
        <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: hsla(280, 100%, 60%, 1);">PHASE 02E</div>
      </div>
      
      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 4px;">
        Engineering Simulation Hub
      </h3>
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 16px;">
        Simulasi Pyodide-based: Pencahayaan, Ventilasi, Evakuasi & NDT Analysis
      </p>
      
      <!-- Simulation Quick Access Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px;">
        ${simTypes.map(type => `
          <button class="sim-type-btn" 
                  onclick="window.navigate('simulation', {proyekId: '${proyek.id}', type: '${type.key}'}); event.stopPropagation();"
                  style="background: hsla(220, 20%, 100%, 0.03); border: 1px solid hsla(220, 20%, 100%, 0.08); border-radius: 10px; padding: 12px; text-align: left; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; position: relative; overflow: hidden;"
                  onmouseover="this.style.background='hsla(220, 95%, 52%, 0.1)'; this.style.borderColor='hsla(220, 95%, 52%, 0.3)';"
                  onmouseout="this.style.background='hsla(220, 20%, 100%, 0.03)'; this.style.borderColor='hsla(220, 20%, 100%, 0.08)';">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${type.color}15; display: flex; align-items: center; justify-content: center; color: ${type.color};">
              <i class="fas ${type.icon}" style="font-size: 0.9rem;"></i>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 0.75rem; font-weight: 700; color: white;">${type.label}</div>
              <div style="font-size: 0.65rem; color: var(--text-tertiary);">${type.count > 0 ? `${type.count} simulasi` : 'Belum dijalankan'}</div>
            </div>
            ${type.count > 0 ? `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${type.color};"></div>` : ''}
          </button>
        `).join('')}
      </div>
      
      <!-- Summary Stats -->
      ${totalSimulasi > 0 ? `
        <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 10px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary);">TOTAL SIMULASI</span>
            <span style="font-size: 0.8rem; font-weight: 800; color: var(--brand-400);">${totalSimulasi}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary);">COMPLETION</span>
            <span style="font-size: 0.8rem; font-weight: 800; color: ${completionRate >= 80 ? 'var(--success-400)' : completionRate >= 50 ? 'var(--gold-400)' : 'var(--danger-400)'};">${completionRate}%</span>
          </div>
          <div style="height: 4px; background: hsla(220, 20%, 100%, 0.05); border-radius: 2px; margin-top: 8px;">
            <div style="width: ${completionRate}%; height: 100%; border-radius: 2px; background: ${completionRate >= 80 ? 'var(--success-400)' : completionRate >= 50 ? 'var(--gold-400)' : 'var(--danger-400)'}; transition: width 0.3s;"></div>
          </div>
        </div>
        
        ${latestSim ? `
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: var(--text-tertiary);">
            <i class="fas fa-clock" style="color: var(--brand-400);"></i>
            <span>Terakhir: ${latestType} • ${formatRelativeTime(latestSim.created_at)}</span>
          </div>
        ` : ''}
      ` : `
        <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 10px; padding: 16px; text-align: center;">
          <i class="fas fa-flask" style="font-size: 1.5rem; color: var(--text-tertiary); margin-bottom: 8px; opacity: 0.5;"></i>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">Belum ada simulasi dijalankan</div>
          <div style="font-size: 0.65rem; color: var(--text-tertiary); opacity: 0.7; margin-top: 4px;">Klik jenis simulasi di atas untuk memulai</div>
        </div>
      `}
      
      <!-- Main Click Handler Overlay -->
      <div onclick="window.navigate('simulation', {proyekId: '${proyek.id}'});" 
           style="position: absolute; inset: 0; cursor: pointer; z-index: 1;"
           title="Buka Simulation Hub">
      </div>
    </div>
  `;
}

/**
 * Get human-readable label for simulation type
 */
function getSimulationLabel(tipe) {
  const labels = {
    'lighting': 'Pencahayaan',
    'pencahayaan': 'Pencahayaan',
    'ventilation': 'Ventilasi',
    'ventilasi': 'Ventilasi',
    'evacuation': 'Evakuasi',
    'evakuasi': 'Evakuasi',
    'ndt': 'NDT',
    'fire': 'Kebakaran',
    'kebakaran': 'Kebakaran',
  };
  return labels[tipe] || tipe;
}

/**
 * Format relative time (e.g., "2 jam yang lalu")
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'baru saja';
  if (diffMins < 60) return `${diffMins}m yang lalu`;
  if (diffHours < 24) return `${diffHours}j yang lalu`;
  if (diffDays < 7) return `${diffDays}h yang lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/**
 * Initialize handlers after render (if needed for interactivity)
 */
export function initSimulationHubHandlers(proyekId) {
  // Add any interactive handlers here if needed
  // Currently using inline onclick for simplicity
}

/**
 * Fetch simulation summary for a project
 * Wrapper untuk konsistensi dengan pattern module lain
 */
export async function fetchSimulationHubSummary(proyekId) {
  try {
    const summary = await getSimulasiSummary(proyekId);
    return summary || {};
  } catch (err) {
    console.warn('[SimulationHub] Failed to fetch summary:', err);
    return {};
  }
}
