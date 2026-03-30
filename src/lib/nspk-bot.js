/**
 * ============================================================
 * NSPK INSIGHT BOT - SMART AI PENGKAJI SLF
 * ============================================================
 * Modul untuk melakukan pencarian referensi aturan otomatis
 * (SNI, PP, Permen) berdasarkan item audit.
 */

import { APP_CONFIG } from './config.js';
import { showSuccess, showError } from '../components/toast.js';

const GAS_URL = APP_CONFIG.gasApiUrl;

/**
 * Mapping Keyword ke SNI/PP Populer untuk Pencarian Bot
 */
const NSPK_MAPPING = {
  // Arsitektur
  'Garis Sempadan': ['GSB', 'Permen PUPR 16 2021'],
  'Kepadatan Bangunan': ['KDB', 'KLB', 'KDH'],
  'Pemanfaatan Ruang': ['RTRW', 'RDTR'],
  
  // Struktur
  'Pondasi': ['SNI 8460:2017', 'Geoteknik'],
  'Beton': ['SNI 2847:2019', 'Beton Struktural'],
  'Baja': ['SNI 1729:2020', 'Baja Struktural'],
  'Gempa': ['SNI 1726:2019', 'Ketahanan Gempa'],
  'Beban': ['SNI 1727:2020', 'Beban Desain'],
  
  // MEP
  'Listrik': ['PUIL 2011', 'SNI 0225:2011'],
  'Kebakaran': ['SNI 03-1735', 'SNI 03-3985', 'Fire Protection'],
  'Petir': ['SNI 03-7015', 'Proteksi Petir'],
  'Lift': ['SNI 03-6573'],
  'Air Bersih': ['SNI 8153:2015', 'Plumbing'],
};

/**
 * Fungsi Utama Bot: Cari & Ambil Referensi
 * @param {string} itemName Nama komponen audit
 * @param {string} proyekId ID Proyek aktif
 * @returns {Promise<Object>} Data referensi yang diambil
 */
export async function runNSPKBot(itemName, proyekId) {
  if (!GAS_URL) {
    showError('Google Apps Script Integration is not configured.');
    return null;
  }

  // 1. Identifikasi Keyword
  let query = itemName;
  for (const [key, rules] of Object.entries(NSPK_MAPPING)) {
    if (itemName.toLowerCase().includes(key.toLowerCase())) {
      query = rules[0]; // Ambil rule pertama sebagai query utama
      break;
    }
  }

  console.log(`[NSPK Bot] Mencari referensi untuk: ${query}`);

  try {
    // 2. Cari di Drive Global via GAS
    const searchRes = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'SEARCH_NSPK', query: query })
    });
    const searchData = await searchRes.json();

    if (searchData.status !== 'success' || !searchData.results.length) {
      console.warn('[NSPK Bot] Tidak ditemukan dokumen spesifik di Drive.');
      return { status: 'not_found', query };
    }

    // 3. Ambil yang paling relevan (index 0)
    const bestMatch = searchData.results[0];
    
    // 4. Salin ke Folder Proyek "Referensi NSPK"
    const captureRes = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'CAPTURE_NSPK',
        fileId: bestMatch.id,
        proyekId: proyekId
      })
    });
    const captureData = await captureRes.json();

    if (captureData.status === 'success') {
      showSuccess(`Bot berhasil mengambil referensi: ${bestMatch.name}`);
      return {
        status: 'success',
        name: bestMatch.name,
        url: captureData.url,
        fileId: captureData.fileId,
        query: query
      };
    }

    return null;
  } catch (err) {
    console.error('[NSPK Bot] Error:', err);
    showError('Bot gagal menjalankan tugas: ' + err.message);
    return null;
  }
}

/**
 * Helper untuk mendapatkan list referensi yang sudah ada di Drive Proyek (Mendatang)
 */
export async function getExistingReferences(proyekId) {
  // Implementasi untuk sinkronisasi ulang
}
