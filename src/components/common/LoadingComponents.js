/**
 * Komponen Loading Animasi Profesional untuk SMART AI Pengkaji SLF
 * Dengan implementasi Light/Dark Mode penuh
 */

/**
 * Theme Manager untuk loading components
 */
class LoadingThemeManager {
  constructor() {
    this.currentTheme = 'auto';
    this.listeners = [];
    this.init();
  }

  init() {
    // Detect system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.notifyListeners(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme) {
    this.currentTheme = theme;
    const effectiveTheme = this.getEffectiveTheme();
    this.notifyListeners(effectiveTheme);
    return effectiveTheme;
  }

  getEffectiveTheme() {
    if (this.currentTheme !== 'auto') {
      return this.currentTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  onThemeChange(callback) {
    this.listeners.push(callback);
    // Call immediately with current theme
    callback(this.getEffectiveTheme());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(theme) {
    this.listeners.forEach(callback => callback(theme));
  }
}

// Global theme manager instance
export const themeManager = new LoadingThemeManager();

/**
 * Get theme-specific colors
 */
function getThemeColors(theme) {
  const themes = {
    light: {
      primary: '#aa3bff',
      secondary: '#c084fc',
      background: '#ffffff',
      surface: '#faf8ff',
      text: '#6b6375',
      textHeading: '#08060d',
      border: '#e5e4e7',
      shadow: 'rgba(170, 59, 255, 0.2)',
      overlay: 'rgba(255, 255, 255, 0.95)',
      skeleton: '#f0f0f0',
      skeletonHighlight: '#e0e0e0'
    },
    dark: {
      primary: '#c084fc',
      secondary: '#a855f7',
      background: '#0a0a0f',
      surface: '#16171d',
      text: '#9ca3af',
      textHeading: '#f3f4f6',
      border: '#2e303a',
      shadow: 'rgba(192, 132, 252, 0.2)',
      overlay: 'rgba(10, 10, 15, 0.95)',
      skeleton: '#2e303a',
      skeletonHighlight: '#3e404a'
    }
  };
  return themes[theme] || themes.light;
}

/**
 * Apply theme to element
 */
function applyTheme(element, theme) {
  const colors = getThemeColors(theme);
  element.style.setProperty('--loading-primary', colors.primary);
  element.style.setProperty('--loading-secondary', colors.secondary);
  element.style.setProperty('--loading-bg', colors.background);
  element.style.setProperty('--loading-surface', colors.surface);
  element.style.setProperty('--loading-text', colors.text);
  element.style.setProperty('--loading-text-heading', colors.textHeading);
  element.style.setProperty('--loading-border', colors.border);
  element.style.setProperty('--loading-shadow', colors.shadow);
  element.style.setProperty('--loading-overlay', colors.overlay);
  element.style.setProperty('--loading-skeleton', colors.skeleton);
  element.style.setProperty('--loading-skeleton-highlight', colors.skeletonHighlight);
  element.dataset.theme = theme;
  return element;
}

/**
 * Loading Logo dengan animasi pulse dan tema light/dark
 * @param {Object} props
 * @param {number} props.size - Ukuran logo (default: 120)
 * @param {string} props.text - Teks loading (default: 'Memuat...')
 * @param {boolean} props.showText - Tampilkan teks (default: true)
 * @param {string} props.theme - 'light' | 'dark' | 'auto' (default: 'auto')
 */
export function LoadingLogo({ size = 120, text = 'Memuat...', showText = true, theme = 'auto' }) {
  const container = document.createElement('div');
  container.className = 'loading-logo-container';
  
  const effectiveTheme = theme === 'auto' ? themeManager.getEffectiveTheme() : theme;
  applyTheme(container, effectiveTheme);
  
  container.innerHTML = `
    <div class="loading-logo-wrapper" data-theme="${effectiveTheme}">
      <div class="loading-logo-glow"></div>
      <img 
        src="/Logo SMART AI Pengkaji SLF (Small).png" 
        alt="SMART AI Pengkaji SLF"
        class="loading-logo-img"
        style="width: ${size}px; height: ${size}px;"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      />
      <div class="loading-logo-fallback" style="display: none; width: ${size}px; height: ${size}px;">
        <svg viewBox="0 0 100 100" class="loading-logo-svg">
          <defs>
            <linearGradient id="logoGradient-${effectiveTheme}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" class="loading-gradient-start"/>
              <stop offset="100%" class="loading-gradient-end"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="none" class="loading-logo-ring-bg" stroke-width="2" opacity="0.3"/>
          <circle cx="50" cy="50" r="35" fill="none" class="loading-logo-ring" stroke-width="3" 
                  stroke-dasharray="165 220" stroke-linecap="round"/>
          <text x="50" y="55" text-anchor="middle" class="loading-logo-text-svg" font-size="20" font-weight="bold">AI</text>
        </svg>
      </div>
      ${showText ? `<p class="loading-logo-text">${text}</p>` : ''}
    </div>
  `;
  
  // Listen for theme changes
  if (theme === 'auto') {
    themeManager.onThemeChange(newTheme => {
      applyTheme(container, newTheme);
      const wrapper = container.querySelector('.loading-logo-wrapper');
      if (wrapper) wrapper.dataset.theme = newTheme;
    });
  }
  
  return container;
}

/**
 * Loading Spinner dengan progress indicator dan tema
 * @param {Object} props
 * @param {number} props.progress - Progress 0-100 (optional)
 * @param {number} props.size - Ukuran spinner (default: 80)
 * @param {string} props.text - Teks loading
 * @param {string} props.theme - 'light' | 'dark' | 'auto' (default: 'auto')
 */
export function LoadingSpinner({ progress = null, size = 80, text = 'Memuat data...', theme = 'auto' }) {
  const container = document.createElement('div');
  container.className = 'loading-spinner-container';
  
  const effectiveTheme = theme === 'auto' ? themeManager.getEffectiveTheme() : theme;
  applyTheme(container, effectiveTheme);
  
  const hasProgress = progress !== null && !isNaN(progress);
  
  container.innerHTML = `
    <div class="loading-spinner-wrapper" data-theme="${effectiveTheme}" style="--spinner-size: ${size}px;">
      <div class="loading-spinner-ring">
        <svg viewBox="0 0 100 100" class="loading-spinner-svg">
          <defs>
            <linearGradient id="spinnerGradient-${effectiveTheme}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" class="loading-gradient-start"/>
              <stop offset="100%" class="loading-gradient-end"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill="none" class="loading-spinner-track" stroke-width="6"/>
          <circle cx="50" cy="50" r="42" fill="none" class="loading-spinner-indicator" stroke-width="6"
                  stroke-dasharray="264" stroke-dashoffset="${hasProgress ? 264 - (264 * progress / 100) : 66}"
                  stroke-linecap="round" class="${hasProgress ? '' : 'loading-spinner-animate'}"
                  transform="rotate(-90 50 50)"/>
        </svg>
        ${hasProgress ? `<span class="loading-spinner-percentage">${Math.round(progress)}%</span>` : ''}
      </div>
      ${text ? `<p class="loading-spinner-text">${text}</p>` : ''}
      ${hasProgress ? `<div class="loading-progress-bar"><div class="loading-progress-fill" style="width: ${progress}%"></div></div>` : ''}
    </div>
  `;
  
  if (theme === 'auto') {
    themeManager.onThemeChange(newTheme => {
      applyTheme(container, newTheme);
      const wrapper = container.querySelector('.loading-spinner-wrapper');
      if (wrapper) wrapper.dataset.theme = newTheme;
    });
  }
  
  return container;
}

/**
 * Full Screen Loading dengan tema light/dark
 * @param {Object} props
 * @param {string} props.message - Pesan loading
 * @param {boolean} props.showDots - Animasi dots (default: true)
 * @param {string} props.theme - 'light' | 'dark' | 'auto' (default: 'auto')
 */
export function LoadingScreen({ message = 'Sistem sedang memproses', showDots = true, theme = 'auto' }) {
  const overlay = document.createElement('div');
  overlay.className = 'loading-screen-overlay';
  
  const effectiveTheme = theme === 'auto' ? themeManager.getEffectiveTheme() : theme;
  applyTheme(overlay, effectiveTheme);
  
  overlay.innerHTML = `
    <div class="loading-screen-content" data-theme="${effectiveTheme}">
      <div class="loading-screen-particles"></div>
      <div class="loading-screen-logo">
        <div class="loading-screen-glow"></div>
        <img 
          src="/Logo SMART AI Pengkaji SLF (Small).png" 
          alt="SMART AI Pengkaji SLF"
          class="loading-screen-img"
        />
        <div class="loading-screen-pulse"></div>
      </div>
      <h2 class="loading-screen-title">SMART AI Pengkaji SLF</h2>
      <p class="loading-screen-message">
        ${message}
        ${showDots ? '<span class="loading-dots"><span></span><span></span><span></span></span>' : ''}
      </p>
      <div class="loading-screen-progress">
        <div class="loading-screen-bar"></div>
      </div>
      <p class="loading-screen-version">v2.0</p>
    </div>
  `;
  
  if (theme === 'auto') {
    themeManager.onThemeChange(newTheme => {
      applyTheme(overlay, newTheme);
      const content = overlay.querySelector('.loading-screen-content');
      if (content) content.dataset.theme = newTheme;
    });
  }
  
  return overlay;
}

/**
 * Loading Skeleton dengan tema light/dark
 * @param {Object} props
 * @param {string} props.type - Tipe: 'card', 'text', 'table', 'form'
 * @param {number} props.lines - Jumlah baris (untuk type 'text')
 * @param {number} props.rows - Jumlah baris (untuk type 'table')
 * @param {string} props.theme - 'light' | 'dark' | 'auto' (default: 'auto')
 */
export function LoadingSkeleton({ type = 'card', lines = 3, rows = 3, theme = 'auto' }) {
  const container = document.createElement('div');
  container.className = `loading-skeleton loading-skeleton-${type}`;
  
  const effectiveTheme = theme === 'auto' ? themeManager.getEffectiveTheme() : theme;
  applyTheme(container, effectiveTheme);
  
  const skeletons = {
    card: `
      <div class="skeleton-card" data-theme="${effectiveTheme}">
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-title-wrapper">
            <div class="skeleton-title"></div>
            <div class="skeleton-subtitle"></div>
          </div>
        </div>
        <div class="skeleton-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line" style="width: 85%"></div>
          <div class="skeleton-line" style="width: 70%"></div>
          <div class="skeleton-actions">
            <div class="skeleton-button"></div>
            <div class="skeleton-button skeleton-button-secondary"></div>
          </div>
        </div>
      </div>
    `,
    text: `
      <div class="skeleton-text" data-theme="${effectiveTheme}">
        ${Array(lines).fill(0).map((_, i) => 
          `<div class="skeleton-line" style="width: ${100 - (i * 8)}%"></div>`
        ).join('')}
      </div>
    `,
    table: `
      <div class="skeleton-table" data-theme="${effectiveTheme}">
        <div class="skeleton-row skeleton-header-row">
          ${Array(4).fill(0).map(() => '<div class="skeleton-cell skeleton-cell-header"></div>').join('')}
        </div>
        ${Array(rows).fill(0).map((_, rowIdx) => `
          <div class="skeleton-row" style="animation-delay: ${rowIdx * 0.1}s">
            ${Array(4).fill(0).map(() => '<div class="skeleton-cell"></div>').join('')}
          </div>
        `).join('')}
      </div>
    `,
    form: `
      <div class="skeleton-form" data-theme="${effectiveTheme}">
        <div class="skeleton-form-header">
          <div class="skeleton-form-title"></div>
          <div class="skeleton-form-desc"></div>
        </div>
        ${Array(4).fill(0).map((_, i) => `
          <div class="skeleton-field" style="animation-delay: ${i * 0.05}s">
            <div class="skeleton-label"></div>
            <div class="skeleton-input"></div>
            <div class="skeleton-hint"></div>
          </div>
        `).join('')}
        <div class="skeleton-form-actions">
          <div class="skeleton-button skeleton-button-primary"></div>
          <div class="skeleton-button skeleton-button-secondary"></div>
        </div>
      </div>
    `,
    list: `
      <div class="skeleton-list" data-theme="${effectiveTheme}">
        ${Array(rows).fill(0).map((_, i) => `
          <div class="skeleton-list-item" style="animation-delay: ${i * 0.08}s">
            <div class="skeleton-list-icon"></div>
            <div class="skeleton-list-content">
              <div class="skeleton-list-title"></div>
              <div class="skeleton-list-desc"></div>
            </div>
            <div class="skeleton-list-action"></div>
          </div>
        `).join('')}
      </div>
    `
  };
  
  container.innerHTML = skeletons[type] || skeletons.card;
  
  if (theme === 'auto') {
    themeManager.onThemeChange(newTheme => {
      applyTheme(container, newTheme);
      const inner = container.firstElementChild;
      if (inner) inner.dataset.theme = newTheme;
    });
  }
  
  return container;
}

/**
 * Loading Dots Animation dengan tema
 * @param {Object} props
 * @param {string} props.theme - 'light' | 'dark' | 'auto' (default: 'auto')
 */
export function LoadingDots({ theme = 'auto' }) {
  const container = document.createElement('span');
  container.className = 'loading-dots-inline';
  
  const effectiveTheme = theme === 'auto' ? themeManager.getEffectiveTheme() : theme;
  applyTheme(container, effectiveTheme);
  
  container.innerHTML = `
    <span class="loading-dot" data-theme="${effectiveTheme}"></span>
    <span class="loading-dot" data-theme="${effectiveTheme}" style="animation-delay: 0.16s"></span>
    <span class="loading-dot" data-theme="${effectiveTheme}" style="animation-delay: 0.32s"></span>
  `;
  
  if (theme === 'auto') {
    themeManager.onThemeChange(newTheme => {
      applyTheme(container, newTheme);
      container.querySelectorAll('.loading-dot').forEach(dot => {
        dot.dataset.theme = newTheme;
      });
    });
  }
  
  return container;
}

/**
 * Page Transition Loading dengan tema
 * @param {Object} props
 * @param {string} props.theme - 'light' | 'dark' | 'auto' (default: 'auto')
 */
export function PageTransitionLoader({ theme = 'auto' }) {
  const loader = document.createElement('div');
  loader.className = 'page-transition-loader';
  
  const effectiveTheme = theme === 'auto' ? themeManager.getEffectiveTheme() : theme;
  applyTheme(loader, effectiveTheme);
  
  loader.innerHTML = `
    <div class="page-transition-bar" data-theme="${effectiveTheme}"></div>
    <div class="page-transition-progress" data-theme="${effectiveTheme}"></div>
    <div class="page-transition-logo" data-theme="${effectiveTheme}">
      <img src="/Logo SMART AI Pengkaji SLF (Small).png" alt="Loading" />
    </div>
  `;
  
  if (theme === 'auto') {
    themeManager.onThemeChange(newTheme => {
      applyTheme(loader, newTheme);
      loader.querySelectorAll('[data-theme]').forEach(el => {
        el.dataset.theme = newTheme;
      });
    });
  }
  
  return loader;
}

/**
 * Smart Loading - Menampilkan loading yang sesuai konteks dengan tema
 * @param {Object} options
 */
export function SmartLoading(options = {}) {
  const { 
    type = 'logo',
    fullscreen = false,
    progress = null,
    text = 'Memuat...',
    target = document.body,
    theme = 'auto'
  } = options;
  
  let loader;
  
  const commonProps = { theme, text };
  
  switch (type) {
    case 'spinner':
      loader = LoadingSpinner({ ...commonProps, progress, size: options.size || 80 });
      break;
    case 'screen':
      loader = LoadingScreen({ ...commonProps, message: text, showDots: options.showDots !== false });
      fullscreen = true;
      break;
    case 'skeleton':
      loader = LoadingSkeleton({ 
        ...commonProps, 
        type: options.skeletonType || 'card',
        lines: options.lines || 3,
        rows: options.rows || 3
      });
      break;
    case 'dots':
      loader = LoadingDots({ theme });
      break;
    case 'page':
      loader = PageTransitionLoader({ theme });
      break;
    default:
      loader = LoadingLogo({ ...commonProps, size: options.size || 120, showText: true });
  }
  
  if (fullscreen) {
    loader.style.position = 'fixed';
    loader.style.top = '0';
    loader.style.left = '0';
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.style.zIndex = '9999';
  }
  
  target.appendChild(loader);
  
  // Return control object
  return {
    element: loader,
    updateProgress: (newProgress) => {
      const progressEl = loader.querySelector('.loading-spinner-percentage');
      const fillEl = loader.querySelector('.loading-progress-fill');
      const circleEl = loader.querySelector('.loading-spinner-indicator:not(.loading-spinner-animate)');
      
      if (progressEl) progressEl.textContent = `${Math.round(newProgress)}%`;
      if (fillEl) fillEl.style.width = `${newProgress}%`;
      if (circleEl && !circleEl.classList.contains('loading-spinner-animate')) {
        circleEl.setAttribute('stroke-dashoffset', 264 - (264 * newProgress / 100));
      }
    },
    updateText: (newText) => {
      const textEl = loader.querySelector('.loading-logo-text, .loading-spinner-text, .loading-screen-message');
      if (textEl) {
        const dots = textEl.querySelector('.loading-dots');
        textEl.innerHTML = newText + (dots ? dots.outerHTML : '');
      }
    },
    setTheme: (newTheme) => {
      applyTheme(loader, newTheme);
      loader.querySelectorAll('[data-theme]').forEach(el => {
        el.dataset.theme = newTheme;
      });
    },
    remove: () => {
      loader.classList.add('loading-fade-out');
      setTimeout(() => loader.remove(), 300);
    }
  };
}

// Export semua komponen dan theme manager
export default {
  LoadingLogo,
  LoadingSpinner,
  LoadingScreen,
  LoadingSkeleton,
  LoadingDots,
  PageTransitionLoader,
  SmartLoading,
  themeManager
};
