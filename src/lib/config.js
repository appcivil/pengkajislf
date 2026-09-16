// ============================================================
//  APP CONFIGURATION
// ============================================================
export const APP_CONFIG = {
  name:    import.meta.env.VITE_APP_NAME    || 'Smart AI Pengkaji SLF',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  baseUrl: import.meta.env.VITE_BASE_URL    || (typeof window !== 'undefined' ? `${window.location.origin}/smartaipengkaji` : ''),
  base:    '/smartaipengkaji',
  isDev:   import.meta.env.DEV,

  // Google Apps Script (opsional)
  gasApiUrl: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '',

  // Feature Flags
  features: {
    aiEnabled:        import.meta.env.VITE_ENABLE_AI            !== 'false',
    gasIntegration:   !!(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL),
    isPublished:      !import.meta.env.DEV, // Set true di produksi untuk sembunyikan pendaftaran publik
    devBypass:        import.meta.env.DEV, // Aktifkan hanya di local
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


/**
 * URL dashboard Supabase untuk proyek yang sedang dipakai.
 *
 * SEBELUMNYA: project ref produksi di-hardcode langsung di
 * `src/pages/tim-kerja.js` dan `vite.config.js`. Akibatnya:
 *   - fork/pengguna lain terlempar ke dashboard proyek orang lain,
 *   - berpindah project berarti mengubah kode,
 *   - ref produksi ikut ter-commit di repo publik.
 *
 * Sekarang ref diturunkan dari VITE_SUPABASE_URL (atau VITE_SUPABASE_PROJECT_REF).
 *
 * @param {string} [path] bagian setelah /project/<ref>, mis. 'auth/users'
 * @returns {string|null} null bila ref tidak dapat ditentukan
 */
export function getSupabaseDashboardUrl(path = '') {
  const explicitRef = import.meta.env?.VITE_SUPABASE_PROJECT_REF;
  let ref = explicitRef || '';

  if (!ref) {
    const url = import.meta.env?.VITE_SUPABASE_URL || '';
    const match = String(url).match(/^https:\/\/([a-z0-9]{20})\.supabase\./i);
    ref = match ? match[1] : '';
  }

  if (!ref) {
    console.warn('[config] VITE_SUPABASE_URL belum diisi — tautan dashboard Supabase tidak tersedia.');
    return null;
  }

  const suffix = path ? `/${String(path).replace(/^\/+/, '')}` : '';
  return `https://supabase.com/dashboard/project/${ref}${suffix}`;
}
