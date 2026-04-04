// ============================================================
//  GOOGLE DOCS TEMPLATE SERVICE
//  Mengintegrasikan template Google Docs dengan data proyek SLF
//  Standar: PUPR / Buku Saku SLF 2024
//  Versi: v2.0 — Tag Dinamis Per Sub-Item Komprehensif
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
 * map placeholder lengkap sesuai template Google Docs / DOCX.
 *
 * Format key: KEY_TANPA_KURUNG_KURAWAL
 * Template menggunakan: {{KEY}}
 *
 * Konvensi tabel khusus (prefix "_"):
 *   _checklistAdmin       → Array item checklist administrasi
 *   _checklistTeknis      → Array SEMUA item teknis (campur)
 *   _auditForensik        → Hanya item yang sudah dianalisis AI mendalam
 *   _checklistIdentitas   → Section 1: ID-01 s/d ID-05
 *   _checklistTataBangunan→ Section 2: TB-01 s/d TB-14
 *   _checklistStruktur    → Section 3A: S-01 s/d S-06
 *   _checklistKebakaran   → Section 3B: F-01 s/d F-07 (semua)
 *   _checklistKebPasif    → Section 3B: F-01, F-02 (pasif saja)
 *   _checklistKebAktif    → Section 3B: F-03 s/d F-07 (aktif saja)
 *   _checklistPetir       → Section 3C: L-01, L-02
 *   _checklistListrik     → Section 3D: L-03, L-04
 *   _checklistPetirListrik→ Gabungan semua L-
 *   _checklistKesehatan   → Section 4: H-01 s/d H-08
 *   _checklistPenghawaan  → H-01, H-02
 *   _checklistPencahayaan → H-03
 *   _checklistAirBersih   → H-04, H-05
 *   _checklistSanitasi    → H-06, H-07
 *   _checklistKemudahan   → Section 5: E-01 s/d E-06
 *   _checklistKoridor     → E-01
 *   _checklistVertical    → E-02, E-03
 *   _checklistFasilitas   → E-04, E-05, E-06
 *   _temuanSemua          → Semua item bermasalah/tidak sesuai
 *   _temuanKritis         → Hanya item risiko TINGGI/KRITIS
 *   _temuanStrukturKritis → Item struktur rusak sedang/berat
 *   _fotoEvidences        → Flattened list semua foto bukti
 *   _timAhli              → Array tenaga ahli
 *   _rekomendasiP1        → Rekomendasi prioritas KRITIS/TINGGI
 *   _rekomendasiP2        → Rekomendasi prioritas SEDANG
 *   _rekomendasiP3        → Rekomendasi prioritas RENDAH
 *   _skorAspek            → Array skor per aspek dengan bobot
 */
export function buildPlaceholderData(proyek, analisis, checklist, settings) {
  const skor      = analisis?.skor_total || 0;
  const riskLevel = analisis?.risk_level || 'medium';
  const statusSlf = analisis?.status_slf || 'DALAM_PENGKAJIAN';
  
  // ── Parse rekomendasi ─────────────────────────────────────────
  let rekList = [];
  try {
    rekList = typeof analisis?.rekomendasi === 'string'
      ? JSON.parse(analisis.rekomendasi)
      : (analisis?.rekomendasi || []);
  } catch(e) { rekList = []; }
  
  const rekP1 = rekList.filter(r => ['kritis','tinggi'].includes(r.prioritas?.toLowerCase()));
  const rekP2 = rekList.filter(r => r.prioritas?.toLowerCase() === 'sedang');
  const rekP3 = rekList.filter(r => r.prioritas?.toLowerCase() === 'rendah');
  
  // ── Narasi AI ─────────────────────────────────────────────────
  const narasiRaw = analisis?.narasi_teknis
    ? cleanNarrativeForDocs(analisis.narasi_teknis)
    : 'Narasi analisis teknis belum tersedia. Lakukan Sintesis AI pada halaman Analisis terlebih dahulu.';

  // ── Skor per aspek ────────────────────────────────────────────
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
  
  // ── Pengelompokan item checklist ──────────────────────────────
  const adminItems  = (checklist || []).filter(c => c.kategori === 'administrasi');
  const teknisItems = (checklist || []).filter(c => c.kategori !== 'administrasi');
  const allItems    = checklist || [];
  
  const countOk   = allItems.filter(i => ['ada_sesuai','baik','tanpa_kerusakan'].includes(i.status)).length;
  const countBad  = allItems.filter(i => ['ada_tidak_sesuai','buruk','kritis','tidak_ada','rusak_berat'].includes(i.status)).length;
  const countWarn = allItems.filter(i => ['rusak_ringan','rusak_sedang','sedang'].includes(i.status)).length;

  // ── FLAT PLACEHOLDER MAP ──────────────────────────────────────

  const flatData = {

    // ── 1. Identitas Bangunan Gedung ───────────────────────────
    NAMA_BANGUNAN:       proyek.nama_bangunan   || '-',
    JENIS_BANGUNAN:      proyek.jenis_bangunan  || '-',
    FUNGSI_BANGUNAN:     proyek.fungsi_bangunan || '-',
    ALAMAT:              proyek.alamat           || '-',
    KOTA:                proyek.kota             || '-',
    PROVINSI:            proyek.provinsi         || '-',
    KECAMATAN:           proyek.kecamatan        || '-',
    KELURAHAN:           proyek.kelurahan        || '-',
    ALAMAT_LENGKAP:      `${proyek.alamat || '-'}, ${proyek.kota || '-'}, ${proyek.provinsi || '-'}`,
    PEMILIK:             proyek.pemilik          || '-',
    PENANGGUNG_JAWAB:    proyek.penanggung_jawab || '-',
    TELEPON_PEMILIK:     proyek.telepon          || '-',
    EMAIL_PEMILIK:       proyek.email_pemilik    || '-',
    TAHUN_DIBANGUN:      String(proyek.tahun_dibangun || '-'),
    JUMLAH_LANTAI:       `${proyek.jumlah_lantai || '-'} Lantai`,
    NILAI_LANTAI:        proyek.jumlah_lantai ? String(proyek.jumlah_lantai) : '-',
    LUAS_BANGUNAN:       proyek.luas_bangunan
                          ? `${Number(proyek.luas_bangunan).toLocaleString('id-ID')} m\u00b2`
                          : '-',
    LUAS_LAHAN:          proyek.luas_lahan
                          ? `${Number(proyek.luas_lahan).toLocaleString('id-ID')} m\u00b2`
                          : '-',
    JENIS_KONSTRUKSI:    proyek.jenis_konstruksi || '-',
    NOMOR_PBG:           proyek.nomor_pbg        || 'Belum tersedia',

    // ── Posisi Geografis ───────────────────────────────────────
    POSISI_LAT:          proyek.latitude  ? String(proyek.latitude)  : '-',
    POSISI_LONG:         proyek.longitude ? String(proyek.longitude) : '-',
    POSISI_GPS:          (proyek.latitude && proyek.longitude)
                          ? `${proyek.latitude}, ${proyek.longitude}`
                          : '-',

    // ── Intensitas Bangunan (GSB/KDB/KLB) ─────────────────────
    GSB:                 proyek.gsb ? `${proyek.gsb} m`  : '-',
    KDB:                 proyek.kdb ? `${proyek.kdb}%`   : '-',
    KLB:                 proyek.klb ? String(proyek.klb) : '-',
    KDH:                 proyek.kdh ? `${proyek.kdh}%`   : '-',
    NILAI_GSB:           proyek.gsb ? String(proyek.gsb) : '-',
    NILAI_KDB:           proyek.kdb ? String(proyek.kdb) : '-',
    NILAI_KLB:           proyek.klb ? String(proyek.klb) : '-',
    NILAI_KDH:           proyek.kdh ? String(proyek.kdh) : '-',

    // ── Data Tanah & Kepemilikan ───────────────────────────────
    NO_DOKUMEN_TANAH:    proyek.no_dokumen_tanah   || '-',
    NAMA_PEMILIK_TANAH:  proyek.nama_pemilik_tanah || proyek.pemilik || '-',

    // ── Tanggal Pekerjaan ─────────────────────────────────────
    TANGGAL_MULAI_PEKERJAAN: proyek.tanggal_mulai
                              ? formatTanggalId(proyek.tanggal_mulai)
                              : '-',
    TANGGAL_TARGET:      proyek.tanggal_target
                          ? formatTanggalId(proyek.tanggal_target)
                          : '-',

    // ── Identifikasi Dokumen ───────────────────────────────────
    NOMOR_DOKUMEN:       `SLF/${String(proyek.id || '').substring(0,8).toUpperCase()}/${new Date().getFullYear()}`,
    PROYEK_ID_SHORT:     String(proyek.id || '').substring(0, 8).toUpperCase(),
    QR_VERIFIKASI:       `VERIFY:${String(proyek.id || '')}`,

    // ── 2. Nilai Terukur Per Item Numerik ─────────────────────
    // (diambil dari nilai yang diisi di checklist_items.nilai)
    NILAI_VENTILASI:     _getNilaiItem(allItems, 'H-01'),
    NILAI_CO2:           _getNilaiItem(allItems, 'H-02'),
    NILAI_PENCAHAYAAN:   _getNilaiItem(allItems, 'H-03'),
    NILAI_DEBIT_AIR:     _getNilaiItem(allItems, 'H-05'),
    NILAI_KELEMBABAN:    _getNilaiItem(allItems, 'H-08'),
    NILAI_LEBAR_KORIDOR: _getNilaiItem(allItems, 'E-01'),
    NILAI_GROUNDING:     _getNilaiItem(allItems, 'L-02'),
    NILAI_DAYA_LISTRIK:  _getNilaiItem(allItems, 'L-03'),
    NILAI_LUAS_DASAR:    _getNilaiItem(allItems, 'TB-04'),
    NILAI_LUAS_TOTAL:    _getNilaiItem(allItems, 'TB-05'),
    NILAI_KETINGGIAN:    _getNilaiItem(allItems, 'TB-07'),

    // ── 3. Identitas dari Checklist (ID-01 s/d ID-05) ─────────
    ID_NAMA_PEMILIK:       _getCatatanItem(allItems, 'ID-01'),
    ID_ALAMAT_BANGUNAN:    _getCatatanItem(allItems, 'ID-02'),
    ID_KATEGORI_KERUSAKAN: _getCatatanItem(allItems, 'ID-03'),
    ID_DIMANFAATKAN:       _mapYaTidak(_getStatusItem(allItems, 'ID-04')),
    ID_TERAWAT:            _mapYaTidak(_getStatusItem(allItems, 'ID-05')),

    // ── 4. Status Kepatuhan Per Aspek ─────────────────────────
    STATUS_ADMINISTRASI: _mapSkorToStatus(analisis?.skor_administrasi),
    STATUS_STRUKTUR:     _mapSkorToStatus(analisis?.skor_struktur),
    STATUS_ARSITEKTUR:   _mapSkorToStatus(analisis?.skor_arsitektur),
    STATUS_MEP:          _mapSkorToStatus(analisis?.skor_mep),
    STATUS_KEBAKARAN:    _mapSkorToStatus(analisis?.skor_kebakaran),
    STATUS_KESEHATAN:    _mapSkorToStatus(analisis?.skor_kesehatan),
    STATUS_KENYAMANAN:   _mapSkorToStatus(analisis?.skor_kenyamanan),
    STATUS_KEMUDAHAN:    _mapSkorToStatus(analisis?.skor_kemudahan),

    // ── 5. Konsultan & Tanggal ────────────────────────────────
    TANGGAL_LAPORAN:     formatTanggalId(new Date()),
    BULAN_TAHUN:         formatBulanTahunId(new Date()),
    TAHUN:               String(new Date().getFullYear()),
    NAMA_KONSULTAN:      settings.consultant?.name         || '-',
    ALAMAT_KONSULTAN:    settings.consultant?.address      || '-',
    TELEPON_KONSULTAN:   settings.consultant?.telepon      || settings.consultant?.phone   || '-',
    EMAIL_KONSULTAN:     settings.consultant?.email        || '-',
    NAMA_DIREKTUR:       settings.consultant?.director_name|| '-',
    JABATAN_DIREKTUR:    settings.consultant?.director_job || 'Direktur Utama',
    LISENSI_KONSULTAN:   settings.consultant?.license      || settings.consultant?.nib    || '-',
    NOMOR_SERTIFIKAT:    settings.consultant?.sertifikat   || '-',
    KOTA_PENETAPAN:      proyek.kota || 'Jakarta',
    TANGGAL_PENETAPAN:   formatTanggalId(new Date()),

    // ── 6. Hasil Analisis — Skor ──────────────────────────────
    SKOR_TOTAL:           String(skor),
    SKOR_ADMINISTRASI:    String(analisis?.skor_administrasi || 0),
    SKOR_STRUKTUR:        String(analisis?.skor_struktur     || 0),
    SKOR_ARSITEKTUR:      String(analisis?.skor_arsitektur   || 0),
    SKOR_MEP:             String(analisis?.skor_mep          || 0),
    SKOR_KEBAKARAN:       String(analisis?.skor_kebakaran    || 0),
    SKOR_KESEHATAN:       String(analisis?.skor_kesehatan    || 0),
    SKOR_KENYAMANAN:      String(analisis?.skor_kenyamanan   || 0),
    SKOR_KEMUDAHAN:       String(analisis?.skor_kemudahan    || 0),

    // ── 7. Hasil Analisis — Status & Risiko ───────────────────
    RISK_LEVEL:           mapRiskLabel(riskLevel),
    STATUS_SLF:           mapStatusSLF(statusSlf),
    STATUS_SLF_SINGKAT:   mapStatusSLFSingkat(statusSlf),
    STATUS_SLF_NARATIF:   mapStatusSLFNaratif(statusSlf),
    STATUS_FINAL_EXPERT:  analisis?.metadata?.expert_findings?.status_final?.replace(/_/g, ' ') || '-',

    // ── 8. Statistik Checklist ────────────────────────────────
    TOTAL_ITEM:           String(allItems.length),
    ITEM_SESUAI:          String(countOk),
    ITEM_TIDAK_SESUAI:    String(countBad),
    ITEM_PERINGATAN:      String(countWarn),
    PERSEN_KEPATUHAN:     `${skor}%`,

    // ── 9. Narasi AI ─────────────────────────────────────────
    NARASI_BAB4:          narasiRaw,
    NARASI_BAB5:          analisis?.metadata?.expert_findings?.bab5_analisis
                           ? cleanNarrativeForDocs(analisis.metadata.expert_findings.bab5_analisis)
                           : 'Analisis forensik belum dijalankan. Gunakan "Jalankan Konsorsium Ahli" di halaman Analisis.',
    NARASI_BAB6:          analisis?.metadata?.expert_findings?.bab6_kesimpulan
                           ? cleanNarrativeForDocs(analisis.metadata.expert_findings.bab6_kesimpulan)
                           : 'Kesimpulan akhir belum tersedia.',

    // ── 10. Rekomendasi Ringkasan ─────────────────────────────
    JUMLAH_REKOMENDASI:   String(rekList.length),
    REKOMENDASI_P1_COUNT: String(rekP1.length),
    REKOMENDASI_P2_COUNT: String(rekP2.length),
    REKOMENDASI_P3_COUNT: String(rekP3.length),

    // ── 11. Dasar Hukum & Standar ─────────────────────────────
    DASAR_HUKUM_1:        'Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung',
    DASAR_HUKUM_2:        'Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan UU No. 28/2002',
    DASAR_HUKUM_3:        'Peraturan Menteri PUPR Nomor 27/PRT/M/2018 tentang Sertifikat Laik Fungsi',
    DASAR_HUKUM_4:        'Peraturan Menteri PUPR Nomor 11/PRT/M/2018 tentang Tim Ahli Bangunan Gedung',
    DASAR_HUKUM_5:        'Peraturan Menteri PUPR Nomor 14/PRT/M/2017 tentang Persyaratan Kemudahan Bangunan',
    SNI_STRUKTUR:         'SNI 2847:2019 + SNI 1726:2019 + SNI 1727:2020 + SNI 9273:2025',
    SNI_MEP:              'SNI 0225:2020 (PUIL 2020) + SNI 8153:2015 (Plambing)',
    SNI_KEBAKARAN:        'SNI 03-3989-2000 + SNI 03-3985-2000 + SNI 03-3987-1995',
    SNI_KESEHATAN:        'SNI 03-6572-2001 + SNI 6197:2020 + SNI 6390:2020',
    SNI_KEMUDAHAN:        'Permen PU 30/2006 + Permen PUPR 14/2017',

    // ── 12. Metadata Sistem ───────────────────────────────────
    VERSI_SISTEM:         'Smart AI Pengkaji SLF v1.0',
  };
  
  // ── HELPER: Mapper item checklist + data forensik ────────────
  const mapItemForensik = (i, idx) => ({
    ...i,
    no:             String((idx ?? 0) + 1),
    // Data forensik dari deep reasoning AI
    faktual:        i.metadata?.deep_reasoning?.faktual       || '-',
    interpretasi:   i.metadata?.deep_reasoning?.interpretasi  || i.interpretasi || '-',
    analisis:       i.metadata?.deep_reasoning?.analisis      || '-',
    risiko:         i.metadata?.deep_reasoning?.risiko        || '-',
    rekomendasi:    i.metadata?.deep_reasoning?.rekomendasi   || i.rekomendasi  || '-',
    // Field terstruktur tambahan
    satuan:         _getSatuanByKode(i.kode),
    nilai_standar:  _getStandarByKode(i.kode),
    status_label:   _mapStatusLabel(i.status),
    foto_url:       Array.isArray(i.foto_urls) ? (i.foto_urls[0] || '-') : '-',
    jumlah_foto:    Array.isArray(i.foto_urls) ? String(i.foto_urls.length) : '0',
    is_bermasalah:  ['ada_tidak_sesuai','buruk','kritis','tidak_ada','rusak_berat','rusak_sedang'].includes(i.status) ? 'Ya' : 'Tidak',
  });

  // ── TABEL KOMPLEKS (prefix "_") ──────────────────────────────

  const tableData = {

    // ═══ Loop Utama ══════════════════════════════════════════════
    _checklistAdmin:         adminItems.map(mapItemForensik),
    _checklistTeknis:        teknisItems.map(mapItemForensik),
    _auditForensik:          teknisItems
                               .filter(i => i.metadata?.deep_reasoning?.last_run)
                               .map(mapItemForensik),

    // ═══ BARU: Loop Per Aspek — Section 1: Identitas ═════════════
    _checklistIdentitas:     allItems.filter(i => i.kode?.startsWith('ID-')).map(mapItemForensik),

    // ═══ BARU: Loop Per Aspek — Section 2: Tata Bangunan ═════════
    _checklistTataBangunan:  allItems.filter(i => i.kode?.startsWith('TB-')).map(mapItemForensik),
    // Sub-aspek Peruntukan (TB-01 s/d TB-03)
    _checklistPeruntukan:    allItems.filter(i => ['TB-01','TB-02','TB-03'].includes(i.kode)).map(mapItemForensik),
    // Sub-aspek Intensitas (TB-04 s/d TB-09)
    _checklistIntensitas:    allItems.filter(i => ['TB-04','TB-05','TB-06','TB-07','TB-08','TB-09'].includes(i.kode)).map(mapItemForensik),
    // Sub-aspek Arsitektur (TB-10 s/d TB-14)
    _checklistArsitektur:    allItems.filter(i => ['TB-10','TB-11','TB-12','TB-13','TB-14'].includes(i.kode)).map(mapItemForensik),

    // ═══ BARU: Loop Per Aspek — Section 3A: Struktur ═════════════
    _checklistStruktur:      allItems.filter(i => i.kode?.startsWith('S-')).map(mapItemForensik),

    // ═══ BARU: Loop Per Aspek — Section 3B: Kebakaran ═══════════
    _checklistKebakaran:     allItems.filter(i => i.kode?.startsWith('F-')).map(mapItemForensik),
    // Hanya Pasif (F-01, F-02)
    _checklistKebPasif:      allItems.filter(i => ['F-01','F-02'].includes(i.kode)).map(mapItemForensik),
    // Hanya Aktif (F-03 s/d F-07)
    _checklistKebAktif:      allItems.filter(i => ['F-03','F-04','F-05','F-06','F-07'].includes(i.kode)).map(mapItemForensik),

    // ═══ BARU: Loop Per Aspek — Section 3C: Petir ════════════════
    _checklistPetir:         allItems.filter(i => ['L-01','L-02'].includes(i.kode)).map(mapItemForensik),

    // ═══ BARU: Loop Per Aspek — Section 3D: Instalasi Listrik ════
    _checklistListrik:       allItems.filter(i => ['L-03','L-04'].includes(i.kode)).map(mapItemForensik),
    // Gabungan Petir + Listrik (semua L-)
    _checklistPetirListrik:  allItems.filter(i => i.kode?.startsWith('L-')).map(mapItemForensik),

    // ═══ BARU: Loop Per Aspek — Section 4: Kesehatan ═════════════
    _checklistKesehatan:     allItems.filter(i => i.kode?.startsWith('H-')).map(mapItemForensik),
    // Sub-aspek Penghawaan (H-01, H-02)
    _checklistPenghawaan:    allItems.filter(i => ['H-01','H-02'].includes(i.kode)).map(mapItemForensik),
    // Sub-aspek Pencahayaan (H-03)
    _checklistPencahayaan:   allItems.filter(i => ['H-03'].includes(i.kode)).map(mapItemForensik),
    // Sub-aspek Air Bersih (H-04, H-05)
    _checklistAirBersih:     allItems.filter(i => ['H-04','H-05'].includes(i.kode)).map(mapItemForensik),
    // Sub-aspek Sanitasi & Limbah (H-06, H-07)
    _checklistSanitasi:      allItems.filter(i => ['H-06','H-07'].includes(i.kode)).map(mapItemForensik),

    // ═══ BARU: Loop Per Aspek — Section 5: Kemudahan ════════════
    _checklistKemudahan:     allItems.filter(i => i.kode?.startsWith('E-')).map(mapItemForensik),
    // Sub-aspek Sirkulasi Horizontal (E-01)
    _checklistKoridor:       allItems.filter(i => ['E-01'].includes(i.kode)).map(mapItemForensik),
    // Sub-aspek Sirkulasi Vertikal (E-02, E-03)
    _checklistVertical:      allItems.filter(i => ['E-02','E-03'].includes(i.kode)).map(mapItemForensik),
    // Sub-aspek Fasilitas Difabel (E-04, E-05, E-06)
    _checklistFasilitas:     allItems.filter(i => ['E-04','E-05','E-06'].includes(i.kode)).map(mapItemForensik),

    // ═══ BARU: Loop Temuan & Item Bermasalah ═════════════════════
    // Semua item yang tidak sesuai/bermasalah
    _temuanSemua:            allItems
                               .filter(i => ['ada_tidak_sesuai','buruk','kritis','tidak_ada',
                                             'rusak_ringan','rusak_sedang','rusak_berat'].includes(i.status))
                               .map(mapItemForensik),
    // Hanya temuan risiko KRITIS/TINGGI (berdasarkan AI + kode struktur/kebakaran)
    _temuanKritis:           allItems
                               .filter(i => {
                                 const risiko = (i.metadata?.deep_reasoning?.risiko || '').toLowerCase();
                                 const badStatus = ['ada_tidak_sesuai','buruk','kritis','tidak_ada',
                                                    'rusak_berat','rusak_sedang'].includes(i.status);
                                 return badStatus && (risiko.includes('kritis') || risiko.includes('tinggi') ||
                                        i.kode?.startsWith('S-') || i.kode?.startsWith('F-'));
                               })
                               .map(mapItemForensik),
    // Temuan struktur rusak signifikan
    _temuanStrukturKritis:   allItems
                               .filter(i => i.kode?.startsWith('S-') &&
                                            ['rusak_sedang','rusak_berat'].includes(i.status))
                               .map(mapItemForensik),

    // ═══ BARU: Loop Foto Bukti Lapangan ████████████████████████
    // Menghasilkan satu baris per foto (bukan per item)
    _fotoEvidences:          allItems
                               .filter(i => Array.isArray(i.foto_urls) && i.foto_urls.length > 0)
                               .flatMap((i, itemIdx) =>
                                 (i.foto_urls || []).map((url, fotoIdx) => ({
                                   no:              `${itemIdx + 1}.${fotoIdx + 1}`,
                                   kode_item:       i.kode || '-',
                                   nama_item:       i.nama || '-',
                                   kondisi:         _mapStatusLabel(i.status),
                                   url_foto:        url,
                                   keterangan_foto: i.catatan || '-',
                                   risiko:          i.metadata?.deep_reasoning?.risiko || '-',
                                 }))),

    // ═══ Tim Ahli (diperkaya dengan jabatan & registrasi) ════════
    _timAhli: Object.entries(settings.experts || {}).map(([key, val], idx) => ({
      no:            String(idx + 1),
      bidang:        key.toUpperCase(),
      jabatan:       val.jabatan || (
                       key === 'architecture' ? 'Ahli Arsitektur' :
                       key === 'structure'    ? 'Ahli Struktur' :
                       key === 'fire'         ? 'Ahli Keselamatan Kebakaran' :
                       'Ahli MEP/Utilitas'
                     ),
      no_registrasi: val.no_registrasi || val.nib || '-',
      email:         val.email || '-',
      ...val,
    })),

    // ═══ Rekomendasi (diperkaya: target waktu, acuan SNI) ════════
    _rekomendasiP1: rekP1.map((r, idx) => ({
      no:               String(idx + 1),
      ...r,
      prioritas:        r.prioritas        || 'TINGGI',
      target_waktu:     r.target_waktu     || r.remedy_time || '7 Hari',
      acuan_sni:        r.acuan_sni        || r.referensi   || 'SNI & NSPK terkait',
      penanggung_jawab: r.penanggung_jawab || 'Pemilik/Pengelola Gedung',
    })),
    _rekomendasiP2: rekP2.map((r, idx) => ({
      no:               String(idx + 1),
      ...r,
      prioritas:        r.prioritas        || 'SEDANG',
      target_waktu:     r.target_waktu     || r.remedy_time || '30 Hari',
      acuan_sni:        r.acuan_sni        || r.referensi   || 'SNI & NSPK terkait',
      penanggung_jawab: r.penanggung_jawab || 'Pemilik/Pengelola Gedung',
    })),
    _rekomendasiP3: rekP3.map((r, idx) => ({
      no:               String(idx + 1),
      ...r,
      prioritas:        r.prioritas        || 'RENDAH',
      target_waktu:     r.target_waktu     || r.remedy_time || '90 Hari',
      acuan_sni:        r.acuan_sni        || r.referensi   || 'SNI & NSPK terkait',
      penanggung_jawab: r.penanggung_jawab || 'Pemilik/Pengelola Gedung',
    })),

    // ═══ Skor Aspek (diperkaya dengan keterangan & status) ═══════
    _skorAspek: skorAspekList.map(s => ({
      ...s,
      status:          _mapSkorToStatus(s.skor),
      keterangan_skor: _mapSkorToKeterangan(s.skor, s.aspek),
    })),
  };
  
  return { ...flatData, ...tableData };
}

// ── URL HELPERS ───────────────────────────────────────────────

/** Generate URL embed Google Docs untuk iframe */
export function getGoogleDocsEmbedUrl(docId) {
  return `https://docs.google.com/document/d/${docId}/edit?embedded=true&rm=minimal`;
}

/** Generate URL edit Google Docs (Tab baru) */
export function getGoogleDocsEditUrl(docId) {
  return `https://docs.google.com/document/d/${docId}/edit`;
}

/** Generate URL export DOCX dari Google Docs */
export function getGoogleDocsExportDocxUrl(docId) {
  return `https://docs.google.com/document/d/${docId}/export?format=docx`;
}

/** Generate URL export PDF dari Google Docs */
export function getGoogleDocsExportPdfUrl(docId) {
  return `https://docs.google.com/document/d/${docId}/export?format=pdf`;
}

// ── CACHE HELPERS ─────────────────────────────────────────────

const CACHE_KEY = 'slf_gdoc_cache';

/** Simpan mapping proyekId → docId ke localStorage */
export function cacheDocId(proyekId, docId) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[proyekId] = { docId, generatedAt: new Date().toISOString() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch(e) { /* ignore */ }
}

/** Ambil docId dari cache untuk proyek tertentu */
export function getCachedDocId(proyekId) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    return cache[proyekId] || null;
  } catch(e) { return null; }
}

/** Hapus cache docId untuk proyek tertentu (force regenerate) */
export function clearCachedDocId(proyekId) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    delete cache[proyekId];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch(e) { /* ignore */ }
}

/** Verifikasi konfigurasi GAS & template */
export async function checkGoogleIntegration() {
  const settings   = await getSettings();
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

/** Test koneksi ke GAS dan validasi template */
export async function testGasConnection(gasUrl, templateId) {
  try {
    const infoUrl = `${gasUrl}?action=getInfo`;
    const resp    = await fetch(infoUrl, { method: 'GET' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const info = await resp.json();
    
    if (templateId) {
      const tmplUrl  = `${gasUrl}?action=checkTemplate&templateId=${encodeURIComponent(templateId)}`;
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
 */
function cleanNarrativeForDocs(md) {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .substring(0, 8000)
    .trim();
}

// ── CHECKLIST ITEM HELPERS ────────────────────────────────────

/** Ambil nilai numerik terukur dari item berdasarkan kode */
function _getNilaiItem(items, kode) {
  const item = (items || []).find(i => i.kode === kode);
  if (!item) return '-';
  if (item.nilai !== undefined && item.nilai !== null && item.nilai !== '') {
    return `${item.nilai} ${_getSatuanByKode(kode)}`.trim();
  }
  return item.catatan || '-';
}

/** Ambil catatan/teks isian dari item berdasarkan kode */
function _getCatatanItem(items, kode) {
  const item = (items || []).find(i => i.kode === kode);
  if (!item) return '-';
  return item.catatan || item.status || '-';
}

/** Ambil nilai status dari item berdasarkan kode */
function _getStatusItem(items, kode) {
  const item = (items || []).find(i => i.kode === kode);
  return item?.status || '-';
}

/** Map status boolean ke Ya/Tidak */
function _mapYaTidak(status) {
  if (['ada_sesuai','baik','ya','true','1'].includes(String(status).toLowerCase())) return 'Ya';
  if (['tidak_ada','buruk','tidak','false','0'].includes(String(status).toLowerCase())) return 'Tidak';
  if (status === '-' || !status) return '-';
  return status;
}

/** Map status checklist ke label yang human-readable */
function _mapStatusLabel(status) {
  const map = {
    ada_sesuai:         'Ada & Sesuai',
    ada_tidak_sesuai:   'Ada, Tidak Sesuai',
    tidak_ada:          'Tidak Ada',
    pertama_kali:       'Pertama Kali',
    tidak_wajib:        'Tidak Wajib',
    tidak_ada_renovasi: 'Tidak Ada (Renovasi)',
    tanpa_kerusakan:    'Tanpa Kerusakan',
    rusak_ringan:       'Rusak Ringan',
    rusak_sedang:       'Rusak Sedang',
    rusak_berat:        'Rusak Berat',
    baik:               'Baik',
    buruk:              'Buruk',
    kritis:             'Kritis',
  };
  return map[status] || status || '-';
}

/** Map skor numerik ke status kepatuhan singkat */
function _mapSkorToStatus(skor) {
  const s = Number(skor) || 0;
  if (s >= 80) return 'SESUAI';
  if (s >= 60) return 'PERLU MITIGASI';
  if (s >= 40) return 'TIDAK SESUAI';
  return 'KRITIS';
}

/** Map skor ke keterangan deskriptif per aspek */
function _mapSkorToKeterangan(skor, aspek) {
  const s = Number(skor) || 0;
  if (s >= 80) return `${aspek} dalam kondisi prima, memenuhi seluruh persyaratan teknis yang berlaku.`;
  if (s >= 60) return `${aspek} memerlukan perhatian dan tindakan mitigasi atas beberapa ketidaksesuaian minor.`;
  if (s >= 40) return `${aspek} ditemukan ketidaksesuaian signifikan yang harus segera ditindaklanjuti.`;
  return `${aspek} dalam kondisi kritis, berpotensi membahayakan keselamatan. Perlu tindakan segera.`;
}

// ── SATUAN & STANDAR PER KODE ITEM ───────────────────────────

/** Mengembalikan satuan pengukuran berdasarkan kode item */
function _getSatuanByKode(kode) {
  const map = {
    'TB-04': 'm\u00b2', 'TB-05': 'm\u00b2', 'TB-06': 'Lantai', 'TB-07': 'm',
    'TB-08': 'm',       'TB-09': '%',
    'L-02':  'Ohm',     'L-03':  'kVA',
    'H-01':  '%',       'H-02':  'ppm',     'H-03': 'Lux',
    'H-05':  'Ltr/mnt', 'H-08':  '% RH',
    'E-01':  'm',
  };
  return map[kode] || '';
}

/** Mengembalikan nilai standar minimum/acuan berdasarkan kode item */
function _getStandarByKode(kode) {
  const map = {
    'TB-08': '≥ GSB RDTR',
    'TB-09': '≥ 20%',
    'L-02':  '≤ 5 Ohm',
    'H-01':  '≥ 5% luas lantai',
    'H-02':  '≤ 1000 ppm',
    'H-03':  '≥ 300 Lux (umum)',
    'H-05':  'Sesuai SNI 8153:2015',
    'H-08':  '40\u201360% RH',
    'E-01':  '≥ 1,8 m',
  };
  return map[kode] || 'Sesuai SNI/NSPK terkait';
}
