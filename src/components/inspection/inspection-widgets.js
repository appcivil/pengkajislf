// ============================================================
// INSPECTION WIDGETS - UI Factory untuk Modul Pemeriksaan SLF
// Menghentikan duplikasi UI di 14 file inspection
// ============================================================

/**
 * @typedef {Object} HeaderConfig
 * @property {string} icon - FontAwesome icon class (tanpa 'fas ')
 * @property {string} phase - Label phase (e.g., 'PHASE 02D')
 * @property {string} title - Judul pemeriksaan
 * @property {string} badge - Text badge regulasi (e.g., 'PP 16/2021')
 * @property {string} description - Deskripsi pemeriksaan
 * @property {string} projectId - ID proyek untuk tombol kembali
 * @property {string} accentColor - CSS variable untuk warna accent (default: --brand-400)
 * @property {string} gradientFrom - Warna gradient awal
 * @property {string} gradientTo - Warna gradient akhir
 */

/**
 * @typedef {Object} TabConfig
 * @property {string} id - ID unik tab
 * @property {string} icon - FontAwesome icon class
 * @property {string} label - Label tab
 * @property {boolean} active - Apakah tab aktif
 */

/**
 * Render header card yang konsisten untuk semua modul inspection.
 * Menggantikan 14 fungsi renderHeaderCard() yang duplikat.
 * 
 * @param {HeaderConfig} config - Konfigurasi header
 * @returns {string} HTML string
 * 
 * @example
 * const html = InspectionWidgets.renderHeaderCard({
 *   icon: 'couch',
 *   phase: 'PHASE 02D',
 *   title: 'Pemeriksaan Aspek Kenyamanan',
 *   badge: 'PP 16/2021',
 *   description: 'Evaluasi aspek kenyamanan...',
 *   projectId: 'abc-123',
 *   accentColor: 'var(--success-400)'
 * });
 */
export function renderHeaderCard(config) {
  const {
    icon = 'clipboard-check',
    phase = 'PHASE',
    title = 'Pemeriksaan',
    badge = 'SLF',
    description = '',
    projectId = '',
    accentColor = 'var(--brand-400)',
    gradientFrom = 'hsla(220, 95%, 52%, 0.15)',
    gradientTo = 'hsla(220, 95%, 52%, 0.1)'
  } = config;

  return `
    <div class="card-quartz inspection-header-card" style="padding: var(--space-6); margin-bottom: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, ${gradientFrom}, ${gradientTo}); display: flex; align-items: center; justify-content: center; color: ${accentColor};">
            <i class="fas fa-${icon}" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: ${accentColor};">${phase}</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">${title}</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: ${gradientFrom}; color: ${accentColor}; border: 1px solid ${gradientTo}; font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>${badge}
          </span>
          ${projectId ? `
          <button class="btn-ghost btn-xs" onclick="window.navigate('proyek-detail', {id: '${projectId}'}" style="color: var(--text-tertiary);">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Kembali
          </button>
          ` : ''}
        </div>
      </div>
      
      ${description ? `
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        ${description}
      </p>
      ` : ''}

      <div id="inspection-tabs-container" class="inspection-tabs-wrapper"></div>
    </div>
  `;
}

/**
 * Render tab navigation yang konsisten.
 * Menggantikan duplikasi tab navigation di setiap file inspection.
 * 
 * @param {TabConfig[]} tabs - Array konfigurasi tab
 * @param {string} activeTab - ID tab yang aktif
 * @param {Function} onSwitch - Callback saat tab switch
 * @returns {string} HTML string
 * 
 * @example
 * const tabs = [
 *   { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD', active: true },
 *   { id: 'occupancy', icon: 'users', label: 'RUANG' }
 * ];
 * const html = InspectionWidgets.renderTabNavigation(tabs, 'dashboard', switchTab);
 */
export function renderTabNavigation(tabs, activeTab, onSwitchCallback) {
  const container = document.getElementById('inspection-tabs-container');
  if (!container) return '';

  const tabsHtml = tabs.map(tab => {
    const isActive = tab.id === activeTab;
    const activeStyle = isActive 
      ? 'background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);'
      : 'color: var(--text-tertiary);';
    
    return `
      <button onclick="${onSwitchCallback}('${tab.id}')" 
              class="inspection-tab-item ${isActive ? 'active' : ''}"
              data-tab="${tab.id}"
              style="flex: 1; min-width: 120px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; ${activeStyle}">
        <i class="fas fa-${tab.icon}"></i> ${tab.label}
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card-quartz" style="padding: 6px; margin-bottom: 0; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
      ${tabsHtml}
    </div>
  `;

  return container.innerHTML;
}

/**
 * Render stat card untuk dashboard.
 * 
 * @param {Object} config - Konfigurasi stat card
 * @param {string} config.icon - FontAwesome icon
 * @param {string|number} config.value - Nilai utama
 * @param {string} config.label - Label statistik
 * @param {string} config.sublabel - Label sekunder (opsional)
 * @param {string} config.accentColor - Warna accent
 * @returns {string} HTML string
 */
export function renderStatCard({ icon, value, label, sublabel = '', accentColor = 'var(--brand-400)' }) {
  return `
    <div class="card-quartz inspection-stat-card" style="padding: 20px; text-align: center; background: linear-gradient(135deg, ${accentColor}15, ${accentColor}08);">
      <div style="width: 48px; height: 48px; border-radius: 14px; background: ${accentColor}20; display: flex; align-items: center; justify-content: center; color: ${accentColor}; margin: 0 auto 12px;">
        <i class="fas fa-${icon}" style="font-size: 1.4rem;"></i>
      </div>
      <div style="font-size: 2rem; font-weight: 800; color: white; margin-bottom: 4px;">${value}</div>
      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${label}</div>
      ${sublabel ? `<div style="font-size: 0.65rem; color: ${accentColor}; margin-top: 4px;">${sublabel}</div>` : ''}
    </div>
  `;
}

/**
 * Render grid stat cards untuk dashboard.
 * 
 * @param {Array<Object>} stats - Array stat configurations
 * @returns {string} HTML string
 */
export function renderStatsGrid(stats) {
  const cards = stats.map(stat => renderStatCard(stat)).join('');
  return `
    <div class="inspection-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
      ${cards}
    </div>
  `;
}

/**
 * Render status badge untuk compliance.
 * 
 * @param {string} status - Status: 'compliant', 'non_compliant', 'partial', 'pending'
 * @param {string} size - Ukuran: 'sm', 'md', 'lg'
 * @returns {string} HTML string
 */
export function renderComplianceBadge(status, size = 'md') {
  const styles = {
    compliant: { bg: 'hsla(160, 100%, 45%, 0.15)', color: 'var(--success-400)', text: 'Lengkap' },
    non_compliant: { bg: 'hsla(0, 80%, 60%, 0.15)', color: 'var(--danger-400)', text: 'Tidak Lengkap' },
    partial: { bg: 'hsla(35, 100%, 50%, 0.15)', color: 'var(--warning-400)', text: 'Sebagian' },
    pending: { bg: 'hsla(220, 20%, 50%, 0.15)', color: 'var(--text-tertiary)', text: 'Belum Diisi' }
  };

  const style = styles[status] || styles.pending;
  const sizeStyles = {
    sm: 'padding: 4px 8px; font-size: 10px;',
    md: 'padding: 6px 12px; font-size: 11px;',
    lg: 'padding: 8px 16px; font-size: 12px;'
  };

  return `
    <span class="badge compliance-badge" style="background: ${style.bg}; color: ${style.color}; border: 1px solid ${style.bg}; border-radius: 6px; font-weight: 600; ${sizeStyles[size]};">
      ${style.text}
    </span>
  `;
}

/**
 * Render section card dengan header.
 * 
 * @param {Object} config - Konfigurasi section
 * @param {string} config.title - Judul section
 * @param {string} config.icon - FontAwesome icon
 * @param {string} config.content - HTML content
 * @param {string} config.accentColor - Warna accent
 * @returns {string} HTML string
 */
export function renderSectionCard({ title, icon, content, accentColor = 'var(--brand-400)' }) {
  return `
    <div class="card-quartz inspection-section-card" style="padding: var(--space-5); margin-bottom: var(--space-4);">
      <div class="inspection-section-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle);">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: ${accentColor}15; display: flex; align-items: center; justify-content: center; color: ${accentColor};">
          <i class="fas fa-${icon}"></i>
        </div>
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1rem; color: white; margin: 0;">${title}</h4>
      </div>
      <div class="inspection-section-content">
        ${content}
      </div>
    </div>
  `;
}

/**
 * Render data table untuk inspection data.
 * 
 * @param {Object} config - Konfigurasi table
 * @param {Array<string>} config.headers - Array header kolom
 * @param {Array<Array>} config.rows - Array rows (array of values)
 * @param {Array<string>} [config.align] - Alignment per kolom (left, center, right)
 * @param {boolean} [config.striped] - Apakah striped rows
 * @returns {string} HTML string
 */
export function renderDataTable({ headers, rows, align = [], striped = true }) {
  const headerHtml = headers.map((h, i) => 
    `<th style="text-align: ${align[i] || 'left'}; padding: 12px; font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px;">${h}</th>`
  ).join('');

  const rowsHtml = rows.map((row, rowIdx) => {
    const bgStyle = striped && rowIdx % 2 === 1 ? 'background: hsla(220, 20%, 20%, 0.3);' : '';
    const cells = row.map((cell, i) => 
      `<td style="text-align: ${align[i] || 'left'}; padding: 12px; font-size: 0.8rem; color: var(--text-secondary); ${bgStyle}">${cell}</td>`
    ).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="inspection-table-wrapper" style="overflow-x: auto; border-radius: 12px; border: 1px solid var(--border-subtle);">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: hsla(220, 20%, 15%, 0.5);">${headerHtml}</tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

/**
 * Render action buttons bar.
 * 
 * @param {Array<Object>} buttons - Array button config
 * @param {string} buttons[].icon - FontAwesome icon
 * @param {string} buttons[].label - Label button
 * @param {string} buttons[].variant - Variant: 'primary', 'secondary', 'ghost', 'danger'
 * @param {string} buttons[].onclick - Onclick handler
 * @returns {string} HTML string
 */
export function renderActionBar(buttons) {
  const variantStyles = {
    primary: 'background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);',
    secondary: 'background: hsla(220, 20%, 25%, 0.5); color: var(--text-primary); border: 1px solid var(--border-subtle);',
    ghost: 'background: transparent; color: var(--text-tertiary);',
    danger: 'background: hsla(0, 80%, 60%, 0.15); color: var(--danger-400); border: 1px solid hsla(0, 80%, 60%, 0.3);'
  };

  const buttonsHtml = buttons.map(btn => `
    <button onclick="${btn.onclick}" 
            class="btn inspection-action-btn"
            style="padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: all 0.2s; ${variantStyles[btn.variant] || variantStyles.secondary}">
      <i class="fas fa-${btn.icon}"></i> ${btn.label}
    </button>
  `).join('');

  return `
    <div class="inspection-action-bar" style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: var(--space-4);">
      ${buttonsHtml}
    </div>
  `;
}

/**
 * Render empty state untuk tab kosong.
 * 
 * @param {Object} config - Konfigurasi empty state
 * @param {string} config.icon - FontAwesome icon
 * @param {string} config.title - Judul
 * @param {string} config.message - Pesan
 * @param {string} [config.actionLabel] - Label tombol action (opsional)
 * @param {string} [config.actionOnClick] - Handler tombol action
 * @returns {string} HTML string
 */
export function renderEmptyState({ icon = 'inbox', title = 'Data Kosong', message = 'Belum ada data yang tersedia.', actionLabel = '', actionOnClick = '' }) {
  return `
    <div class="inspection-empty-state" style="text-align: center; padding: 60px 20px; background: hsla(220, 20%, 10%, 0.3); border-radius: 16px; border: 2px dashed var(--border-subtle);">
      <div style="width: 64px; height: 64px; border-radius: 20px; background: hsla(220, 20%, 20%, 0.5); display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); margin: 0 auto 20px;">
        <i class="fas fa-${icon}" style="font-size: 1.8rem;"></i>
      </div>
      <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 8px;">${title}</h4>
      <p style="font-size: 0.85rem; color: var(--text-tertiary); max-width: 300px; margin: 0 auto 20px;">${message}</p>
      ${actionLabel ? `
      <button onclick="${actionOnClick}" class="btn btn-primary" style="padding: 10px 20px; border-radius: 10px; background: var(--gradient-brand); color: white; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 11px; font-weight: 700;">
        <i class="fas fa-plus" style="margin-right: 8px;"></i>${actionLabel}
      </button>
      ` : ''}
    </div>
  `;
}

/**
 * Render loading skeleton untuk inspection page.
 * 
 * @returns {string} HTML string
 */
export function renderLoadingSkeleton() {
  return `
    <div class="inspection-loading-skeleton">
      <div style="padding: var(--space-6); max-width: 1600px; margin: 0 auto;">
        <!-- Header skeleton -->
        <div style="padding: var(--space-6); margin-bottom: var(--space-6); background: var(--card-bg); border-radius: 16px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
            <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(90deg, var(--skeleton-start) 25%, var(--skeleton-end) 50%, var(--skeleton-start) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;"></div>
            <div style="flex: 1;">
              <div style="width: 80px; height: 12px; border-radius: 4px; background: linear-gradient(90deg, var(--skeleton-start) 25%, var(--skeleton-end) 50%, var(--skeleton-start) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; margin-bottom: 8px;"></div>
              <div style="width: 250px; height: 20px; border-radius: 4px; background: linear-gradient(90deg, var(--skeleton-start) 25%, var(--skeleton-end) 50%, var(--skeleton-start) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;"></div>
            </div>
          </div>
          <div style="height: 44px; border-radius: 10px; background: linear-gradient(90deg, var(--skeleton-start) 25%, var(--skeleton-end) 50%, var(--skeleton-start) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;"></div>
        </div>
        
        <!-- Content skeleton -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          ${Array(4).fill(0).map(() => `
            <div style="padding: 20px; text-align: center; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-subtle);">
              <div style="width: 48px; height: 48px; border-radius: 14px; margin: 0 auto 12px; background: linear-gradient(90deg, var(--skeleton-start) 25%, var(--skeleton-end) 50%, var(--skeleton-start) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;"></div>
              <div style="width: 40px; height: 32px; border-radius: 4px; margin: 0 auto 4px; background: linear-gradient(90deg, var(--skeleton-start) 25%, var(--skeleton-end) 50%, var(--skeleton-start) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;"></div>
              <div style="width: 80px; height: 12px; border-radius: 4px; margin: 0 auto; background: linear-gradient(90deg, var(--skeleton-start) 25%, var(--skeleton-end) 50%, var(--skeleton-start) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;"></div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <style>
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      </style>
    </div>
  `;
}

/**
 * Render score indicator dengan progress bar.
 * 
 * @param {Object} config - Konfigurasi score
 * @param {number} config.score - Nilai score (0-100)
 * @param {string} config.label - Label score
 * @param {string} config.size - Ukuran: 'sm', 'md', 'lg'
 * @returns {string} HTML string
 */
export function renderScoreIndicator({ score, label, size = 'md' }) {
  const getScoreColor = (s) => {
    if (s >= 80) return 'var(--success-400)';
    if (s >= 60) return 'var(--warning-400)';
    return 'var(--danger-400)';
  };

  const sizeStyles = {
    sm: { height: '6px', fontSize: '1.5rem' },
    md: { height: '8px', fontSize: '2rem' },
    lg: { height: '12px', fontSize: '3rem' }
  };

  const styles = sizeStyles[size];
  const color = getScoreColor(score);

  return `
    <div class="inspection-score-indicator" style="text-align: center;">
      <div style="font-size: ${styles.fontSize}; font-weight: 800; color: ${color}; margin-bottom: 8px;">${score}</div>
      ${label ? `<div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 12px;">${label}</div>` : ''}
      <div style="width: 100%; height: ${styles.height}; background: hsla(220, 20%, 20%, 0.5); border-radius: ${styles.height}; overflow: hidden;">
        <div style="width: ${score}%; height: 100%; background: ${color}; border-radius: ${styles.height}; transition: width 0.5s ease;"></div>
      </div>
    </div>
  `;
}

/**
 * Render modal container.
 * 
 * @param {Object} config - Konfigurasi modal
 * @param {string} config.id - ID modal
 * @param {string} config.title - Judul modal
 * @param {string} config.content - HTML content
 * @param {string} [config.size] - Ukuran: 'sm', 'md', 'lg', 'xl'
 * @returns {string} HTML string
 */
export function renderModal({ id, title, content, size = 'md' }) {
  const sizeStyles = {
    sm: 'max-width: 400px;',
    md: 'max-width: 600px;',
    lg: 'max-width: 800px;',
    xl: 'max-width: 1000px;'
  };

  return `
    <div id="${id}" class="inspection-modal" style="display: none; position: fixed; inset: 0; background: hsla(220, 25%, 5%, 0.8); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; padding: 20px;">
      <div class="card-quartz inspection-modal-content" style="${sizeStyles[size]} width: 100%; max-height: 90vh; overflow-y: auto; padding: 0; border-radius: 16px;">
        <div class="inspection-modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border-subtle);">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.1rem; color: white; margin: 0;">${title}</h4>
          <button onclick="document.getElementById('${id}').style.display='none'" style="background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 1.2rem; padding: 4px;">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="inspection-modal-body" style="padding: 24px;">
          ${content}
        </div>
      </div>
    </div>
  `;
}

/**
 * Export semua widgets untuk bundle.
 */
export const InspectionWidgets = {
  renderHeaderCard,
  renderTabNavigation,
  renderStatCard,
  renderStatsGrid,
  renderComplianceBadge,
  renderSectionCard,
  renderDataTable,
  renderActionBar,
  renderEmptyState,
  renderLoadingSkeleton,
  renderScoreIndicator,
  renderModal
};

export default InspectionWidgets;
