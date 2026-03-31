// ============================================================
//  APP CONFIGURATION
// ============================================================
export const APP_CONFIG = {
  name:    import.meta.env.VITE_APP_NAME    || 'Smart AI Pengkaji SLF',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  baseUrl: import.meta.env.VITE_BASE_URL    || '',
  base:    '/smartaipengkaji',

  // Google Apps Script (opsional)
  gasApiUrl: import.meta.env.VITE_GAS_API_URL || '',

  // Feature Flags
  features: {
    aiEnabled:        import.meta.env.VITE_ENABLE_AI            !== 'false',
    gasIntegration:   import.meta.env.VITE_ENABLE_GAS_INTEGRATION === 'true',
    isPublished:      true, // Set true untuk menyembunyikan pendaftaran publik
  },

  // SLF Status Options
  statusSLF: [
    { value: 'LAIK_FUNGSI',          label: 'Laik Fungsi',          badge: 'badge-laik' },
    { value: 'LAIK_FUNGSI_BERSYARAT',label: 'Laik Fungsi Bersyarat',badge: 'badge-bersyarat' },
    { value: 'TIDAK_LAIK_FUNGSI',    label: 'Tidak Laik Fungsi',    badge: 'badge-tidak-laik' },
    { value: 'DALAM_PENGKAJIAN',     label: 'Dalam Pengkajian',     badge: 'badge-proses' },
  ],

  // Risk Levels
  riskLevels: [
    { value: 'low',      label: 'Rendah',  badge: 'badge-low' },
    { value: 'medium',   label: 'Sedang',  badge: 'badge-medium' },
    { value: 'high',     label: 'Tinggi',  badge: 'badge-high' },
    { value: 'critical', label: 'Kritis',  badge: 'badge-critical' },
  ],

  // User Roles
  roles: {
    admin:     'Admin',
    direktur:  'Direktur',
    pemeriksa: 'Pemeriksa',
    reviewer:  'Reviewer',
    viewer:    'Viewer',
  },

  // Aspek Pemeriksaan SLF
  aspekSLF: [
    { id: 'administrasi',    name: 'Administrasi',      icon: 'fa-clipboard-list',   color: 'kpi-blue' },
    { id: 'arsitektur',      name: 'Arsitektur',        icon: 'fa-drafting-compass',  color: 'kpi-purple' },
    { id: 'struktur',        name: 'Struktur',          icon: 'fa-building',          color: 'kpi-red' },
    { id: 'mep',             name: 'MEP / Utilitas',    icon: 'fa-bolt',              color: 'kpi-yellow' },
    { id: 'keselamatan',     name: 'Keselamatan Kebakaran', icon: 'fa-fire-extinguisher', color: 'kpi-red' },
    { id: 'kesehatan',       name: 'Kesehatan',         icon: 'fa-heart-pulse',       color: 'kpi-green' },
    { id: 'kenyamanan',      name: 'Kenyamanan',        icon: 'fa-sun',               color: 'kpi-yellow' },
    { id: 'kemudahan',       name: 'Kemudahan',         icon: 'fa-universal-access',  color: 'kpi-cyan' },
  ],
};

export default APP_CONFIG;
