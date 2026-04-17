// ============================================================
// MODULE CARD SKELETON - Premium Loading Experience
// Skeleton screen yang halus untuk modul summary cards
// ============================================================

/**
 * Render skeleton card dengan shimmer effect
 * @param {Object} options - Konfigurasi skeleton
 * @param {string} options.variant - 'default' | 'compact' | 'mini'
 * @param {number} options.delay - Animation delay dalam ms
 * @returns {string} HTML skeleton
 */
export function renderModuleCardSkeleton({ variant = 'default', delay = 0 } = {}) {
  const sizes = {
    default: { padding: 'var(--space-6)', iconSize: '48px', titleWidth: '70%', descLines: 2 },
    compact: { padding: 'var(--space-5)', iconSize: '40px', titleWidth: '60%', descLines: 1 },
    mini: { padding: 'var(--space-4)', iconSize: '32px', titleWidth: '80%', descLines: 0 }
  };

  const size = sizes[variant];
  const shimmerStyle = `
    background: linear-gradient(90deg, 
      hsla(220, 20%, 15%, 0.5) 25%, 
      hsla(220, 20%, 25%, 0.5) 50%, 
      hsla(220, 20%, 15%, 0.5) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    animation-delay: ${delay}ms;
  `;

  const descSkeleton = size.descLines > 0 
    ? Array(size.descLines).fill(0).map((_, i) => `
        <div class="skeleton-line" style="${shimmerStyle} height: 12px; border-radius: 4px; width: ${90 - i * 20}%; margin-top: 8px;"></div>
      `).join('')
    : '';

  return `
    <div class="module-card-skeleton card-quartz" style="padding: ${size.padding}; opacity: 0.8;">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div class="skeleton-icon" style="${shimmerStyle} width: ${size.iconSize}; height: ${size.iconSize}; border-radius: 14px;"></div>
        <div class="skeleton-badge" style="${shimmerStyle} width: 60px; height: 16px; border-radius: 4px;"></div>
      </div>
      <div class="skeleton-title" style="${shimmerStyle} height: 20px; border-radius: 4px; width: ${size.titleWidth}; margin-bottom: 8px;"></div>
      ${descSkeleton}
      <div class="skeleton-footer" style="${shimmerStyle} height: 8px; border-radius: 10px; width: 100%; margin-top: 20px;"></div>
    </div>
    <style>
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    </style>
  `;
}

/**
 * Render grid skeleton untuk multiple cards
 * @param {number} count - Jumlah skeleton cards
 * @param {string} variant - Variant skeleton
 * @returns {string} HTML grid skeleton
 */
export function renderModuleCardGridSkeleton(count = 6, variant = 'default') {
  const cards = Array(count).fill(0).map((_, i) => 
    renderModuleCardSkeleton({ variant, delay: i * 100 })
  ).join('');

  return `
    <div class="module-skeleton-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-6);">
      ${cards}
    </div>
  `;
}

/**
 * Render hero section skeleton
 * @returns {string} HTML hero skeleton
 */
export function renderHeroSkeleton() {
  const shimmerStyle = `
    background: linear-gradient(90deg, 
      hsla(220, 20%, 15%, 0.5) 25%, 
      hsla(220, 20%, 25%, 0.5) 50%, 
      hsla(220, 20%, 15%, 0.5) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  `;

  return `
    <div class="hero-skeleton card-quartz" style="padding: var(--space-8); margin-bottom: var(--space-8); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2); position: relative; overflow: hidden;">
      <div class="skeleton-bg" style="position: absolute; right: -100px; top: -100px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, hsla(220, 95%, 52%, 0.05) 0%, transparent 70%); pointer-events: none;"></div>
      
      <div style="position: relative; z-index: 2;">
        <div class="skeleton-back" style="${shimmerStyle} width: 150px; height: 16px; border-radius: 4px; margin-bottom: 20px;"></div>
        <div class="skeleton-title" style="${shimmerStyle} height: 40px; border-radius: 8px; width: 60%; margin-bottom: 20px;"></div>
        <div class="flex" style="gap: 12px; margin-top: 20px;">
          <div style="${shimmerStyle} width: 100px; height: 28px; border-radius: 14px;"></div>
          <div style="${shimmerStyle} width: 120px; height: 28px; border-radius: 14px;"></div>
          <div style="${shimmerStyle} width: 150px; height: 28px; border-radius: 14px;"></div>
        </div>
      </div>

      <div style="margin-top: 40px; padding-top: 40px; border-top: 1px solid hsla(220, 20%, 100%, 0.05);">
        <div class="flex-between" style="margin-bottom: 12px;">
          ${Array(5).fill(0).map((_, i) => `
            <div style="flex: 1; text-align: center;">
              <div style="${shimmerStyle} width: 36px; height: 36px; border-radius: 50%; margin: 0 auto 12px;"></div>
              <div style="${shimmerStyle} width: 80px; height: 12px; border-radius: 4px; margin: 0 auto;"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render sidebar skeleton untuk right panel
 * @returns {string} HTML sidebar skeleton
 */
export function renderSidebarSkeleton() {
  const shimmerStyle = `
    background: linear-gradient(90deg, 
      hsla(220, 20%, 15%, 0.5) 25%, 
      hsla(220, 20%, 25%, 0.5) 50%, 
      hsla(220, 20%, 15%, 0.5) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  `;

  return `
    <div class="sidebar-skeleton" style="display: flex; flex-direction: column; gap: var(--space-6);">
      <!-- Risk Pulse Skeleton -->
      <div class="card-quartz" style="padding: var(--space-6); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2);">
        <div style="${shimmerStyle} width: 120px; height: 12px; border-radius: 4px; margin: 0 auto 24px;"></div>
        <div style="${shimmerStyle} height: 280px; border-radius: 50%; margin: 0 auto; width: 280px;"></div>
      </div>

      <!-- PIC Card Skeleton -->
      <div class="card-quartz" style="padding: var(--space-6); border-left: 4px solid transparent;">
        <div style="${shimmerStyle} width: 100px; height: 12px; border-radius: 4px; margin-bottom: 16px;"></div>
        <div class="flex" style="gap: 16px; align-items: center;">
          <div style="${shimmerStyle} width: 56px; height: 56px; border-radius: 50%;"></div>
          <div style="flex: 1;">
            <div style="${shimmerStyle} width: 150px; height: 20px; border-radius: 4px; margin-bottom: 8px;"></div>
            <div style="${shimmerStyle} width: 100px; height: 12px; border-radius: 4px;"></div>
          </div>
        </div>
      </div>

      <!-- SIMBG Skeleton -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div class="flex-between" style="margin-bottom: 20px;">
          <div style="${shimmerStyle} width: 120px; height: 16px; border-radius: 4px;"></div>
          <div style="${shimmerStyle} width: 80px; height: 12px; border-radius: 4px;"></div>
        </div>
        <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="${shimmerStyle} height: 44px; border-radius: 12px;"></div>
          <div style="${shimmerStyle} height: 44px; border-radius: 12px;"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render full page skeleton untuk proyek-detail
 * @returns {string} HTML full page skeleton
 */
export function renderProyekDetailFullSkeleton() {
  return `
    <div id="proyek-detail-page" style="animation: page-fade-in 0.8s ease-out;">
      ${renderHeroSkeleton()}
      
      <div class="grid-dashboard-main" style="display: grid; grid-template-columns: 1fr 380px; gap: var(--space-8);">
        <div style="display: flex; flex-direction: column; gap: var(--space-8);">
          ${renderModuleCardGridSkeleton(8, 'default')}
        </div>
        ${renderSidebarSkeleton()}
      </div>
    </div>
  `;
}
