// ============================================================
// MODULE CARDS - Decoupled Card Components for Proyek Detail
// Komponen card terpisah untuk setiap modul inspeksi
// ============================================================

import { renderModuleCardSkeleton } from './ModuleCardSkeleton.js';

// ============================================================
// BASE CARD RENDERER
// ============================================================

/**
 * Render base card structure yang reusable
 * @param {Object} config - Konfigurasi card
 * @param {string} config.title - Judul card
 * @param {string} config.phase - Phase code (e.g., 'PHASE 02')
 * @param {string} config.icon - FontAwesome icon class
 * @param {string} config.accentColor - CSS color variable
 * @param {string} config.description - Deskripsi singkat
 * @param {string} config.onClick - onclick handler string
 * @param {string} config.content - Custom content HTML
 * @param {string} config.footer - Footer content HTML
 * @param {boolean} config.loading - Show skeleton state
 * @param {Object} config.stats - Stats untuk card { value, label, sublabel }
 * @returns {string} HTML card
 */
function renderBaseCard({
  title,
  phase,
  icon = 'cube',
  accentColor = 'var(--brand-400)',
  description = '',
  onClick = '',
  content = '',
  footer = '',
  loading = false,
  stats = null
}) {
  if (loading) {
    return renderModuleCardSkeleton({ variant: 'default' });
  }

  const phaseBadge = phase ? `
    <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: ${accentColor};">
      ${phase}
    </div>
  ` : '';

  const statsHtml = stats ? `
    <div style="margin-top: 20px;">
      <div class="flex-between" style="margin-bottom: 8px;">
        <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary);">${stats.label}</span>
        <span style="font-size: 0.7rem; font-weight: 800; color: ${accentColor};">${stats.value}</span>
      </div>
      <div style="height: 6px; background: hsla(220, 20%, 100%, 0.05); border-radius: 10px;">
        <div style="width: ${stats.progress || 0}%; height: 100%; border-radius: 10px; background: var(--gradient-brand); box-shadow: var(--shadow-sapphire);"></div>
      </div>
      ${stats.sublabel ? `<div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">${stats.sublabel}</div>` : ''}
    </div>
  ` : '';

  return `
    <div class="card-quartz ${onClick ? 'clickable' : ''}" ${onClick ? `onclick="${onClick}"` : ''} style="padding: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: ${accentColor}1a; display: flex; align-items: center; justify-content: center; color: ${accentColor};">
          <i class="fas fa-${icon}" style="font-size: 1.4rem;"></i>
        </div>
        ${phaseBadge}
      </div>
      
      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 4px;">
        ${title}
      </h3>
      
      ${description ? `<p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5;">${description}</p>` : ''}
      
      ${content}
      ${statsHtml}
      ${footer}
    </div>
  `;
}

// ============================================================
// SPECIFIC MODULE CARDS
// ============================================================

/**
 * Render Audit Teknis Lapangan Card
 */
export function renderAuditTeknisCard(proyekId, stats, loading = false) {
  return renderBaseCard({
    title: 'Audit Teknis Lapangan',
    phase: 'PHASE 02',
    icon: 'clipboard-list-check',
    accentColor: 'var(--brand-400)',
    description: 'Inspeksi menyeluruh terhadap komponen arsitektur, struktur dan MEP.',
    onClick: `window.navigate('checklist', {id: '${proyekId}'})`,
    loading,
    stats: {
      value: `${stats.done}/${stats.total} ITEMS`,
      label: 'COMPLETION RATE',
      progress: stats.pct,
      sublabel: `${stats.pct}% selesai`
    }
  });
}

/**
 * Render Proteksi Petir (LPS) Card
 */
export function renderProteksiPetirCard(proyek, summary, loading = false) {
  const hasData = summary && !summary.error_message;

  return renderBaseCard({
    title: 'Proteksi Petir',
    phase: 'PHASE 02C',
    icon: 'cloud-bolt',
    accentColor: 'var(--warning-400)',
    description: 'Evaluasi sistem proteksi petir sesuai SNI 2848:2020.',
    onClick: `window.navigate('lps-inspection', {id: '${proyek.id}'})`,
    loading,
    content: hasData ? `
      <div style="margin-top: 16px;">
        <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); border: 1px solid hsla(45, 90%, 60%, 0.2); font-size: 10px;">
          ${summary.lps_class || 'Class IV'} LPS
        </span>
      </div>
    ` : ''
  });
}

/**
 * Render Risk Analysis AI Card
 */
export function renderRiskAnalysisCard(proyek, analisisData, loading = false) {
  return renderBaseCard({
    title: 'Risk Analysis AI',
    phase: 'PHASE 03',
    icon: 'brain-circuit',
    accentColor: 'var(--gold-400)',
    description: 'Automated technical scoring & mitigation recommendations.',
    onClick: `window.navigate('analisis', {id: '${proyek.id}'})`,
    loading,
    content: `
      <div style="margin-top: 20px; display: flex; align-items: center; gap: 8px;">
        <span class="badge" style="background: hsla(45, 90%, 60%, 0.1); color: var(--gold-400); border: 1px solid hsla(45, 90%, 60%, 0.2); font-size: 10px;">
          NEURAL ENGINE ACTIVE
        </span>
      </div>
    `
  });
}

/**
 * Render Manajemen Berkas SIMBG Card
 */
export function renderManajemenBerkasCard(proyek, loading = false) {
  return renderBaseCard({
    title: 'Manajemen Berkas SIMBG',
    phase: 'PHASE 01',
    icon: 'folder-tree',
    accentColor: 'var(--text-secondary)',
    description: 'Synchronization dengan SIMBG database.',
    onClick: `window.navigate('proyek-files', {id: '${proyek.id}'})`,
    loading
  });
}

/**
 * Render Laporan Kajian Card
 */
export function renderLaporanKajianCard(proyek, loading = false) {
  return renderBaseCard({
    title: 'Laporan Kajian SLF',
    phase: 'PHASE 04',
    icon: 'file-invoice',
    accentColor: 'var(--success-400)',
    description: 'Executive summary & full technical report.',
    onClick: `window.navigate('laporan', {id: '${proyek.id}'})`,
    loading
  });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Render array of module cards dengan loading state
 * @param {Array} cards - Array card objects { component, props, loading }
 * @returns {string} HTML grid of cards
 */
export function renderModuleCardsGrid(cards) {
  const cardsHtml = cards.map(({ component, props, loading }) => {
    if (loading) return renderModuleCardSkeleton({ variant: 'default' });
    return component(...props);
  }).join('');

  return `
    <div class="grid-2-col" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-6);">
      ${cardsHtml}
    </div>
  `;
}
