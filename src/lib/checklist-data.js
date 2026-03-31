/**
 * CHECKLIST DATA CONSTANTS
 * Formal NSPK PUPR Categories for Building Inspection.
 */

export const ADMIN_ITEMS = [
  { kode: 'A01', nama: 'PBG / IMB (Persetujuan Bangunan Gedung)', options: ['ada_sesuai','ada_tidak_sesuai','tidak_ada'] },
  { kode: 'A02', nama: 'Sertifikat Laik Fungsi Sebelumnya', options: ['ada_sesuai','ada_tidak_sesuai','tidak_ada','pertama_kali'] },
  { kode: 'A03', nama: 'Gambar As-Built Drawing', options: ['ada_sesuai','ada_tidak_sesuai','tidak_ada'] },
  { kode: 'A04', nama: 'Gambar Rencana Teknis (DED)', options: ['ada_sesuai','ada_tidak_sesuai','tidak_ada'] },
  { kode: 'A05', nama: 'Dokumen RKS / Spesifikasi Teknis', options: ['ada_sesuai','ada_tidak_sesuai','tidak_ada'] },
  { kode: 'A09', nama: 'Dokumen AMDAL / UKL-UPL', options: ['ada_sesuai','ada_tidak_sesuai','tidak_ada','tidak_wajib'] },
  { kode: 'A10', nama: 'IMB Perubahan / Renovasi', options: ['ada_sesuai','ada_tidak_sesuai','tidak_ada','tidak_ada_renovasi'] },
];

export const TEKNIS_ITEMS = [
  { kode: 'T01', nama: 'Fungsi Bangunan Gedung' },
  { kode: 'T02', nama: 'Pemanfaatan Setiap Ruang' },
  { kode: 'T03', nama: 'Luas Lantai Dasar (KDB)' },
  { kode: 'T04', nama: 'Ketinggian Bangunan (Puncak)' },
  { kode: 'T05', nama: 'Jarak Sempadan (GSB)' },
  { kode: 'T06', nama: 'Penampilan Bangunan (Fasad)' },
  { kode: 'T07', nama: 'Struktur Fondasi' },
  { kode: 'T08', nama: 'Struktur Kolom & Balok' },
  { kode: 'T09', nama: 'Sistem Proteksi Kebakaran' },
  { kode: 'T10', nama: 'Sistem Instalasi Listrik' },
];

export const KAJIAN_GROUPS = [
  { aspek: 'K.1.1. Peruntukan Bangunan', items: [
    { kode: 'K.1.1.1', nama: 'Fungsi Bangunan Gedung', ref: 'Pemeriksaan Visual' },
    { kode: 'K.1.1.2', nama: 'Pemanfaatan Ruang Dalam', ref: 'Sampel Ruang' }
  ]},
  { aspek: 'K.2.1. Sistem Struktur', items: [
    { kode: 'K.2.1.1', nama: 'Fondasi (Deformasi/Miring)', ref: 'Stabilitas Bawah' },
    { kode: 'K.2.1.2', nama: 'Struktur Kolom (Lantai Dasar)', ref: 'Visual Retak' }
  ]}
];

export const ADMIN_OPTIONS = [
  { value: 'ada_sesuai', label: '✓ Ada & Sesuai' },
  { value: 'ada_tidak_sesuai', label: '⚠ Tidak Sesuai' },
  { value: 'tidak_ada', label: '✗ Tidak Ada' },
  { value: 'tidak_wajib', label: '— Tidak Wajib' },
];

export const CONDITION_OPTIONS = [
  { value: 'baik', label: '✓ Baik / Sesuai' },
  { value: 'sedang', label: '⚠ Sedang / Minor' },
  { value: 'buruk', label: '⚠ Buruk / Perbaikan' },
  { value: 'kritis', label: '✗ Kritis / Bahaya' },
];
