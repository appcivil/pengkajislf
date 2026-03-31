/**
 * SETTINGS MANAGER
 * Mengelola persistensi identitas konsultan, pemilihan model AI, 
 * dan daftar tenaga ahli menggunakan LocalStorage.
 */

import { supabase } from './supabase.js';

const SETTINGS_KEY = 'slf_app_settings';
const GLOBAL_ID = '00000000-0000-0000-0000-000000000000';

const DEFAULT_SETTINGS = {
  consultant: {
    name: 'PT. Konsultan Pengkaji Indonesia',
    address: 'Jl. Jenderal Sudirman No. 123, Jakarta Pusat',
    logo: null,
    signature: null,
    stamp: null,
    kop_image: null,
    kop_text: 'PEMERINTAH KABUPATEN __________\nDINAS PEKERJAAN UMUM DAN PENATAAN RUANG\nJl. Raya No. 123, Kota __________, Prov. __________',
    director_name: '',
    director_job: 'Direktur',
    nomor_surat_format: '[SEQ]/SP-SLF/[ROMAN_MONTH]/[YEAR]', // Default format
  },
  ai: {
    defaultModel: 'gemini-3.1-flash-lite-preview',
  },
  experts: {
    architecture: { name: '', skk: '', signature: null, qr_code: null },
    structure: { name: '', skk: '', signature: null, qr_code: null },
    mep: { name: '', skk: '', signature: null, qr_code: null },
  },
  google: {
    defaultDriveProxy: '',
    templateDocId: '',
  },
  watermark: {
    enabled: true,
    show_gps: true,
    show_time: true,
    company_logo: null,
    company_name: 'DPUPR KABUPATEN __________',
    verified_label: 'Diverifikasi oleh SmartAI SLF',
    activity_prefix: 'Kegiatan:',
    opacity: 0.85,
    resolution: 'medium',
    custom_tags: ''
  }
};

/**
 * Mendapatkan pengaturan saat ini (Asinkron).
 * Mengambil dari LocalStorage dulu (cepat), lalu cek Supabase (sinkron).
 */
export async function getSettings() {
  // 1. Ambil dari lokal dulu
  const saved = localStorage.getItem(SETTINGS_KEY);
  let settings = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;

  // 2. Jika online, coba ambil dari Supabase
  try {
    const { data: remote, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', GLOBAL_ID)
      .maybeSingle();

    if (remote && remote.data) {
      settings = remote.data;
      // Update lokal agar sinkron
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (e) {
    console.warn('[Settings] Failed to fetch remote settings, using local.', e);
  }

  // Merge dengan default untuk kestabilan struktur
  return {
    consultant: { ...DEFAULT_SETTINGS.consultant, ...settings.consultant },
    ai:         { ...DEFAULT_SETTINGS.ai, ...settings.ai },
    experts:    settings.experts || DEFAULT_SETTINGS.experts,
    google:     { ...DEFAULT_SETTINGS.google, ...(settings.google || {}) },
    watermark:  { ...DEFAULT_SETTINGS.watermark, ...(settings.watermark || {}) },
  };
}

/**
 * Menyimpan pengaturan ke LocalStorage DAN Supabase (Global).
 */
export async function saveSettings(data) {
  // Simpan Lokal
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));

  // Simpan Cloud (Upsert kpd GLOBAL_ID)
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        id: GLOBAL_ID, 
        data: data,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('[Settings] Cloud sync failed:', e);
    throw e;
  }
}
