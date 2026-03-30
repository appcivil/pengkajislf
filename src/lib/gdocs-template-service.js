// ============================================================
//  GOOGLE DOCS TEMPLATE SERVICE
//  Mengintegrasikan template Google Docs dengan data proyek SLF
//  Standar: PUPR / Buku Saku SLF 2024
// ============================================================

import { getSettings } from './settings.js';

// ── GENERATE FROM TEMPLATE ────────────────────────────────────

/**
 * Membuat salinan laporan dari template Google Docs dan mengisi data proyek.
 * @param {Object} proyek - Data proyek dari Supabase
 * @param {Object} analisis - Hasil analisis AI terakhir
 * @param {Array}  checklist - Array item checklist proyek
 * @param {function} onProgress - Callback (pct, msg)
 * @returns {Object} { id, editUrl, embedUrl, exportDocxUrl, exportPdfUrl }
 */
export async function generateFromTemplate(proyek, analisis, checklist, onProgress) {
  const settings = await getSettings();
  
  const gasUrl    = proyek.drive_proxy_url || settings.google?.defaultDriveProxy;
  const templateId = settings.google?.templateDocId;
  
  if (!gasUrl) {
    throw new Error(
      'Google Apps Script URL belum dikonfigurasi. ' +
      'Buka Pengaturan → Integrasi Google dan isi "GAS Proxy URL".'
    );
  }
  
  if (onProgress) onProgress(10, 'Menyiapkan data laporan...');
  
  // 1. Build semua placeholder data
  const placeholderData = buildPlaceholderData(proyek, analisis, checklist, settings);
  
  if (onProgress) onProgress(25, 'Mengirim request ke Google Apps Script...');
  
  // 2. Kirim ke GAS untuk generate dari template
  const tanggal = new Date().toISOString().split('T')[0];
  const docTitle = `Laporan SLF - ${proyek.nama_bangunan} - ${tanggal}`;
  
  const payload = {
    action: 'generateFromTemplate',
    templateId: templateId || undefined,
    proyekId: proyek.id,
    docTitle,
    data: placeholderData,
  };
  
  if (onProgress) onProgress(40, 'Mengirim payload ke GAS...');
  
  const resp = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  
  if (!resp.ok) {
    throw new Error(`GAS request gagal: HTTP ${resp.status} ${resp.statusText}`);
  }
  
  const result = await resp.json();
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  if (onProgress) onProgress(85, 'Dokumen berhasil di-generate...');
  
  // Simpan hasil doc ID di local storage untuk akses cepat
  cacheDocId(proyek.id, result.id);
  
  if (onProgress) onProgress(100, 'Selesai!');
  
  return {
    id:            result.id,
    title:         result.title,
    editUrl:       result.editUrl,
    embedUrl:      result.embedUrl,
    exportDocxUrl: result.exportDocxUrl,
    exportPdfUrl:  result.exportPdfUrl,
    folderId:      result.folderId,
    folderUrl:     result.folderUrl,
  };
}

/**
 * Update dokumen yang sudah ada (tidak membuat salinan baru).
 * Berguna untuk regenerasi setelah data diperbarui.
 * @param {string} docId - Google Docs ID dokumen target
 * @param {Object} proyek, analisis, checklist - Data terbaru
 * @param {function} onProgress
 */
export async function updateExistingDoc(docId, proyek, analisis, checklist, onProgress) {
  const settings = await getSettings();
  const gasUrl   = proyek.drive_proxy_url || settings.google?.defaultDriveProxy;
  
  if (!gasUrl) throw new Error('GAS Proxy URL belum dikonfigurasi.');
  
  if (onProgress) onProgress(10, 'Menyiapkan data terbaru...');
  const placeholderData = buildPlaceholderData(proyek, analisis, checklist, settings);
  
  if (onProgress) onProgress(40, 'Mengirim pembaruan ke Google Docs...');
  
  const resp = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'updateDocument',
      docId,
      data: placeholderData,
    }),
  });
  
  const result = await resp.json();
  if (result.error) throw new Error(result.error);
  
  if (onProgress) onProgress(100, 'Dokumen berhasil diperbarui!');
  return result;
}

// ── PLACEHOLDER DATA BUILDER ──────────────────────────────────

/**
 * Mengkonversi data proyek, analisis, dan checklist menjadi
 * map placeholder lengkap sesuai template Google Docs.
 *
 * Format key: KEY_TANPA_KURUNG_KURAWAL
 * Template menggunakan: {{KEY}}
 *
 * Konvensi tabel khusus (prefix "_"):
 *   _checklistAdmin  → Array item checklist administrasi
 *   _checklistTeknis → Array item checklist teknis
 *   _timAhli         → Array tenaga ahli  
 *   _rekomendasiP1   → Array rekomendasi prioritas 1
 *   _rekomendasiP2   → Array rekomendasi prioritas 2
 *   _rekomendasiP3   → Array rekomendasi prioritas 3
 *   _skorAspek       → Array skor per aspek dengan bobot
 */
export function buildPlaceholderData(proyek, analisis, checklist, settings) {
  const skor = analisis?.skor_total || 0;
  const riskLevel = analisis?.risk_level || 'medium';
  const statusSlf = analisis?.status_slf || 'DALAM_PENGKAJIAN';
  
  // Parse rekomendasi
  let rekList = [];
  try {
    rekList = typeof analisis?.rekomendasi === 'string'
      ? JSON.parse(analisis.rekomendasi)
      : (analisis?.rekomendasi || []);
  } catch(e) { rekList = []; }
  
  const rekP1 = rekList.filter(r => ['kritis','tinggi'].includes(r.prioritas?.toLowerCase()));
  const rekP2 = rekList.filter(r => r.prioritas?.toLowerCase() === 'sedang');
  const rekP3 = rekList.filter(r => r.prioritas?.toLowerCase() === 'rendah');
  
  // Narasi BAB IV — strip sebagian markup agar bisa masuk Docs
  const narasiRaw = analisis?.narasi_teknis
    ? cleanNarrativeForDocs(analisis.narasi_teknis)
    : 'Narasi analisis teknis belum tersedia. Lakukan Sintesis AI pada halaman Analisis terlebih dahulu.';

  // Skor per aspek
  const skorAspekList = [
    { aspek: 'Administrasi',          skor: analisis?.skor_administrasi || 0, bobot: '10%', acuan: 'PP 16/2021'           },
    { aspek: 'Struktur',              skor: analisis?.skor_struktur     || 0, bobot: '25%', acuan: 'SNI 9273:2025'        },
    { aspek: 'Arsitektur',            skor: analisis?.skor_arsitektur   || 0, bobot: '10%', acuan: 'NSPK BG'              },
    { aspek: 'MEP / Utilitas',        skor: analisis?.skor_mep          || 0, bobot: '15%', acuan: 'SNI PUIL/Plumbing'    },
    { aspek: 'Keselamatan Kebakaran', skor: analisis?.skor_kebakaran    || 0, bobot: '20%', acuan: 'Permen PU 26/2008'    },
    { aspek: 'Kesehatan',             skor: analisis?.skor_kesehatan    || 0, bobot: '8%',  acuan: 'Permen PUPR 14/2017'  },
    { aspek: 'Kenyamanan',            skor: analisis?.skor_kenyamanan   || 0, bobot: '6%',  acuan: 'SNI Kenyamanan'       },
    { aspek: 'Kemudahan',             skor: analisis?.skor_kemudahan    || 0, bobot: '6%',  acuan: 'Permen PU 30/2006'    },
  ];
  
  // Item checklist
  const adminItems  = (checklist || []).filter(c => c.kategori === 'administrasi');
  const teknisItems = (checklist || []).filter(c => c.kategori !== 'administrasi');
  
  const countOk  = (checklist || []).filter(i => ['ada_sesuai','baik'].includes(i.status)).length;
  const countBad = (checklist || []).filter(i => ['ada_tidak_sesuai','buruk','kritis','tidak_ada'].includes(i.status)).length;

  // ── Flat placeholder map (untuk teks/paragraf) ───────────────
  const flatData = {
    // Identitas Bangunan
    NAMA_BANGUNAN:       proyek.nama_bangunan   || '-',
    JENIS_BANGUNAN:      proyek.jenis_bangunan  || '-',
    FUNGSI_BANGUNAN:     proyek.fungsi_bangunan || '-',
    ALAMAT:              proyek.alamat           || '-',
    KOTA:                proyek.kota             || '-',
    PROVINSI:            proyek.provinsi         || '-',
    ALAMAT_LENGKAP:      `${proyek.alamat || '-'}, ${proyek.kota || '-'}, ${proyek.provinsi || '-'}`,
    PEMILIK:             proyek.pemilik          || '-',
    TAHUN_DIBANGUN:      String(proyek.tahun_dibangun || '-'),
    JUMLAH_LANTAI:       `${proyek.jumlah_lantai || '-'} Lantai`,
    LUAS_BANGUNAN:       proyek.luas_bangunan
                          ? `${Number(proyek.luas_bangunan).toLocaleString('id-ID')} m²`
                          : '-',
    LUAS_LAHAN:          proyek.luas_lahan
                          ? `${Number(proyek.luas_lahan).toLocaleString('id-ID')} m²`
                          : '-',
    JENIS_KONSTRUKSI:    proyek.jenis_konstruksi || '-',
    NOMOR_PBG:           proyek.nomor_pbg        || 'Belum tersedia',
    
    // Tanggal & Konsultan
    TANGGAL_LAPORAN:     formatTanggalId(new Date()),
    BULAN_TAHUN:         formatBulanTahunId(new Date()),
    TAHUN:               String(new Date().getFullYear()),
    NAMA_KONSULTAN:      settings.consultant?.name    || '-',
    ALAMAT_KONSULTAN:    settings.consultant?.address || '-',
    
    // Hasil Analisis — Skor
    SKOR_TOTAL:          String(skor),
    SKOR_ADMINISTRASI:   String(analisis?.skor_administrasi || 0),
    SKOR_STRUKTUR:       String(analisis?.skor_struktur     || 0),
    SKOR_ARSITEKTUR:     String(analisis?.skor_arsitektur   || 0),
    SKOR_MEP:            String(analisis?.skor_mep          || 0),
    SKOR_KEBAKARAN:      String(analisis?.skor_kebakaran    || 0),
    SKOR_KESEHATAN:      String(analisis?.skor_kesehatan    || 0),
    SKOR_KENYAMANAN:     String(analisis?.skor_kenyamanan   || 0),
    SKOR_KEMUDAHAN:      String(analisis?.skor_kemudahan    || 0),
    
    // Hasil Analisis — Status
    RISK_LEVEL:          mapRiskLabel(riskLevel),
    STATUS_SLF:          mapStatusSLF(statusSlf),
    STATUS_SLF_SINGKAT:  mapStatusSLFSingkat(statusSlf),
    STATUS_SLF_NARATIF:  mapStatusSLFNaratif(statusSlf),
    
    // Statistik Checklist
    TOTAL_ITEM:          String((checklist || []).length),
    ITEM_SESUAI:         String(countOk),
    ITEM_TIDAK_SESUAI:   String(countBad),
    PERSEN_KEPATUHAN:    `${skor}%`,
    
    // Narasi BAB IV (dipecah per baris agar lebih readable di Docs)
    NARASI_BAB4:         narasiRaw,

    // Narasi BAB V & VI (EXPERT CONSORTIUM)
    NARASI_BAB5:         analisis?.metadata?.expert_findings?.bab5_analisis 
                          ? cleanNarrativeForDocs(analisis.metadata.expert_findings.bab5_analisis)
                          : 'Analisis forensik belum dijalankan. Gunakan "Jalankan Konsorsium Ahli" di halaman Analisis.',
    NARASI_BAB6:         analisis?.metadata?.expert_findings?.bab6_kesimpulan
                          ? cleanNarrativeForDocs(analisis.metadata.expert_findings.bab6_kesimpulan)
                          : 'Kesimpulan akhir belum tersedia.',
    STATUS_FINAL_EXPERT: analisis?.metadata?.expert_findings?.status_final?.replace(/_/g, ' ') || '-',
    
    // Rekomendasi — Ringkasan singkat
    JUMLAH_REKOMENDASI:  String(rekList.length),
    REKOMENDASI_P1_COUNT: String(rekP1.length),
    REKOMENDASI_P2_COUNT: String(rekP2.length),
    REKOMENDASI_P3_COUNT: String(rekP3.length),
    
    // Kota & tanggal penetapan
    KOTA_PENETAPAN:      proyek.kota || 'Jakarta',
    TANGGAL_PENETAPAN:   formatTanggalId(new Date()),
  };
  
  // ── Objek tabel kompleks (prefix "_") ───────────────────────
  const tableData = {
    _checklistAdmin:  adminItems,
    _checklistTeknis: teknisItems,
    _timAhli:         settings.experts || [],
    _rekomendasiP1:   rekP1,
    _rekomendasiP2:   rekP2,
    _rekomendasiP3:   rekP3,
    _skorAspek:       skorAspekList,
  };
  
  return { ...flatData, ...tableData };
}

// ── URL HELPERS ───────────────────────────────────────────────

/**
 * Generate URL embed Google Docs untuk iframe
 * Mode embed memiliki toolbar minimal, header/footer tersembunyi
 */
export function getGoogleDocsEmbedUrl(docId) {
  return `https://docs.google.com/document/d/${docId}/edit?embedded=true&rm=minimal`;
}

/**
 * Generate URL edit Google Docs (Tab baru)
 */
export function getGoogleDocsEditUrl(docId) {
  return `https://docs.google.com/document/d/${docId}/edit`;
}

/**
 * Generate URL export DOCX dari Google Docs
 */
export function getGoogleDocsExportDocxUrl(docId) {
  return `https://docs.google.com/document/d/${docId}/export?format=docx`;
}

/**
 * Generate URL export PDF dari Google Docs
 */
export function getGoogleDocsExportPdfUrl(docId) {
  return `https://docs.google.com/document/d/${docId}/export?format=pdf`;
}

// ── CACHE HELPERS ─────────────────────────────────────────────

const CACHE_KEY = 'slf_gdoc_cache';

/**
 * Simpan mapping proyekId → docId ke localStorage agar tidak perlu generate ulang
 */
export function cacheDocId(proyekId, docId) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[proyekId] = { docId, generatedAt: new Date().toISOString() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch(e) { /* ignore */ }
}

/**
 * Ambil docId dari cache untuk proyek tertentu
 * @returns {{ docId: string, generatedAt: string } | null}
 */
export function getCachedDocId(proyekId) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    return cache[proyekId] || null;
  } catch(e) { return null; }
}

/**
 * Hapus cache docId untuk proyek tertentu (force regenerate)
 */
export function clearCachedDocId(proyekId) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    delete cache[proyekId];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch(e) { /* ignore */ }
}

/**
 * Verifikasi apakah konfigurasi GAS & template sudah tersedia
 * @returns {{ ready: boolean, gasUrl: boolean, templateId: boolean, message: string }}
 */
export async function checkGoogleIntegration() {
  const settings = await getSettings();
  const gasUrl     = settings.google?.defaultDriveProxy;
  const templateId = settings.google?.templateDocId;
  
  if (!gasUrl) {
    return { ready: false, gasUrl: false, templateId: !!templateId, message: 'GAS Proxy URL belum diisi di Pengaturan.' };
  }
  if (!templateId) {
    return { ready: false, gasUrl: true, templateId: false, message: 'Template Google Docs ID belum diisi di Pengaturan.' };
  }
  
  return { ready: true, gasUrl: true, templateId: true, message: 'Siap generate laporan.' };
}

/**
 * Test koneksi ke GAS dan validasi template
 */
export async function testGasConnection(gasUrl, templateId) {
  try {
    // Cek apakah GAS bisa diakses (GET request)
    const infoUrl = `${gasUrl}?action=getInfo`;
    const resp = await fetch(infoUrl, { method: 'GET' });
    
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    
    const info = await resp.json();
    
    // Jika templateId disediakan, cek validasinya
    if (templateId) {
      const tmplUrl = `${gasUrl}?action=checkTemplate&templateId=${encodeURIComponent(templateId)}`;
      const tmplResp = await fetch(tmplUrl, { method: 'GET' });
      const tmplInfo = await tmplResp.json();
      return { ...info, template: tmplInfo };
    }
    
    return { ...info, template: null };
  } catch(e) {
    throw new Error('Tidak dapat terhubung ke GAS: ' + e.message);
  }
}

// ── FORMAT HELPERS ────────────────────────────────────────────

function formatTanggalId(d) {
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return String(d); }
}

function formatBulanTahunId(d) {
  try {
    return new Date(d).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  } catch { return ''; }
}

function mapRiskLabel(level) {
  const map = { low: 'RENDAH', medium: 'SEDANG', high: 'TINGGI', critical: 'KRITIS' };
  return map[level] || level?.toUpperCase() || '-';
}

function mapStatusSLF(s) {
  const map = {
    LAIK_FUNGSI:           'LAIK FUNGSI',
    LAIK_FUNGSI_BERSYARAT: 'LAIK FUNGSI BERSYARAT',
    TIDAK_LAIK_FUNGSI:     'TIDAK LAIK FUNGSI',
    DALAM_PENGKAJIAN:      'DALAM PENGKAJIAN',
  };
  return map[s] || s || 'BELUM DIANALISIS';
}

function mapStatusSLFSingkat(s) {
  const map = {
    LAIK_FUNGSI:           'Laik',
    LAIK_FUNGSI_BERSYARAT: 'Bersyarat',
    TIDAK_LAIK_FUNGSI:     'Tidak Laik',
    DALAM_PENGKAJIAN:      'Proses',
  };
  return map[s] || '-';
}

function mapStatusSLFNaratif(s) {
  const map = {
    LAIK_FUNGSI:
      'Bangunan gedung telah memenuhi persyaratan kelaikan fungsi dan layak untuk diterbitkan Sertifikat Laik Fungsi (SLF). ' +
      'Seluruh aspek teknis, administratif, keselamatan, dan kemudahan telah terpenuhi sesuai standar PUPR yang berlaku.',
    LAIK_FUNGSI_BERSYARAT:
      'Bangunan gedung dapat dioperasikan dengan syarat pemilik/pengelola wajib segera menindaklanjuti seluruh rekomendasi teknis ' +
      'yang tertuang dalam laporan ini dalam jangka waktu yang telah ditentukan. SLF dapat diterbitkan dengan catatan pembinaan.',
    TIDAK_LAIK_FUNGSI:
      'Bangunan gedung belum memenuhi persyaratan minimum kelaikan fungsi. Terdapat temuan kritis yang berpotensi membahayakan ' +
      'keselamatan penghuni dan masyarakat sekitar. SLF tidak dapat diterbitkan sebelum dilakukan rehabilitasi dan perbaikan menyeluruh ' +
      'sesuai standar teknis yang berlaku.',
    DALAM_PENGKAJIAN:
      'Proses pengkajian teknis masih berlangsung. Status kelaikan fungsi bangunan gedung akan ditetapkan setelah seluruh pemeriksaan ' +
      'dan analisis teknis selesai dilakukan.',
  };
  return map[s] || 'Status belum ditentukan.';
}

/**
 * Bersihkan narasi AI agar bisa masuk ke Google Docs sebagai plain text.
 * Google Docs tidak support markdown — kita hilangkan formatting khusus.
 */
function cleanNarrativeForDocs(md) {
  return md
    // Hilangkan header markdown
    .replace(/^#{1,6}\s+/gm, '')
    // Hilangkan bold/italic
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    // Hilangkan kode inline
    .replace(/`(.+?)`/g, '$1')
    // Hilangkan emoji
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    // Batas panjang teks (GAS punya limit)
    .substring(0, 8000)
    .trim();
}
