/**
 * SETTINGS MANAGER
 * Mengelola persistensi identitas konsultan, pemilihan model AI, 
 * dan daftar tenaga ahli menggunakan LocalStorage.
 */

import { supabase } from './supabase.js';
import { store } from './store.js';
import { getUser } from './auth.js';

function getSettingsContext() {
  const organizationId = store.get().activeOrganizationId || null;
  const userId = getUser()?.id || 'anonymous';
  return { organizationId, key: 'slf_app_settings:' + userId + ':' + (organizationId || 'no-tenant') };
}

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
    ollamaEnabled: false,
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'gemma3:27b',
    availableLocalModels: []
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
  const { organizationId, key } = getSettingsContext();
  const saved = localStorage.getItem(key);
  let settings = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;

  // Never fall back to the former global settings row: each tenant has its
  // own record and the database enforces organization membership with RLS.
  if (organizationId) {
    try {
      const { data: remote, error } = await supabase
        .from('settings')
        .select('data')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      if (remote?.data) {
        settings = remote.data;
        localStorage.setItem(key, JSON.stringify(settings));
      }
    } catch (e) {
      console.warn('[Settings] Tenant settings fetch failed; using tenant-local cache.', e);
    }
  }

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
  const { organizationId, key } = getSettingsContext();
  if (!organizationId) {
    throw new Error('Pilih organisasi aktif sebelum menyimpan pengaturan.');
  }

  localStorage.setItem(key, JSON.stringify(data));

  const { error } = await supabase
    .from('settings')
    .upsert({
      organization_id: organizationId,
      data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'organization_id' });

  if (error) {
    console.error('[Settings] Tenant cloud sync failed:', error);
    throw error;
  }
  return true;
}
