/**
 * CHECKLIST FULL SCHEMA (PDF ALIGNED)
 * Detailed Item Mapping for Building Inspection.
 */

export const CHECKLIST_SECTIONS = [
  { id: 'identitas', label: 'Identitas & Kondisi Umum', icon: 'fa-id-card' },
  { id: 'tata-bangunan', label: 'Tata Bangunan Gedung', icon: 'fa-drafting-compass' },
  { id: 'keselamatan', label: 'Persyaratan Keselamatan', icon: 'fa-shield-halved' },
  { id: 'kesehatan', label: 'Persyaratan Kesehatan', icon: 'fa-heart-pulse' },
  { id: 'kemudahan', label: 'Persyaratan Kemudahan', icon: 'fa-wheelchair' }
];

export const FULL_CHECKLIST_SCHEMA = [
  // --- IDENTITAS (Section 1) ---
  { kode: 'ID-01', category: 'identitas', nama: 'Nama Pemilik Gedung', type: 'text' },
  { kode: 'ID-02', category: 'identitas', nama: 'Alamat Bangunan', type: 'text' },
  { kode: 'ID-03', category: 'identitas', nama: 'Kategori Kerusakan', type: 'radio', options: ['Tanpa Kerusakan','Rusak Ringan','Rusak Sedang','Rusak Berat'] },
  { kode: 'ID-04', category: 'identitas', nama: 'Bangunan Dimanfaatkan', type: 'boolean', trueLabel: 'Ya', falseLabel: 'Tidak' },
  { kode: 'ID-05', category: 'identitas', nama: 'Bangunan Terawat Dengan Baik', type: 'boolean', trueLabel: 'Ya', falseLabel: 'Tidak' },

  // --- TATA BANGUNAN (Section 2) ---
  { kode: 'TB-01', category: 'tata-bangunan', nama: 'Fungsi Bangunan Gedung', type: 'boolean', sub: 'Pemeriksaan Persyaratan Peruntukan' },
  { kode: 'TB-02', category: 'tata-bangunan', nama: 'Pemanfaatan Ruang Dalam', type: 'boolean' },
  { kode: 'TB-03', category: 'tata-bangunan', nama: 'Pemanfaatan Ruang Luar (Persil)', type: 'boolean' },
  { kode: 'TB-04', category: 'tata-bangunan', nama: 'Luas Lantai Dasar (LDB)', type: 'number', unit: 'm²', sub: 'Persyaratan Intensitas' },
  { kode: 'TB-05', category: 'tata-bangunan', nama: 'Luas Total Lantai', type: 'number', unit: 'm²' },
  { kode: 'TB-06', category: 'tata-bangunan', nama: 'Jumlah Lantai Bangunan', type: 'number', unit: 'Lantai' },
  { kode: 'TB-07', category: 'tata-bangunan', nama: 'Ketinggian Bangunan', type: 'number', unit: 'm' },
  { kode: 'TB-08', category: 'tata-bangunan', nama: 'Jarak Sempadan (GSB)', type: 'number', unit: 'm' },
  { kode: 'TB-09', category: 'tata-bangunan', nama: 'Daerah Hijau (RTH)', type: 'number', unit: '%' },
  { kode: 'TB-10', category: 'tata-bangunan', nama: 'Bentuk Denah Bangunan', type: 'text', sub: 'Arsitektur Bangunan' },
  { kode: 'TB-11', category: 'tata-bangunan', nama: 'Profil, Detail & Material', type: 'text' },
  { kode: 'TB-12', category: 'tata-bangunan', nama: 'Tinggi Lantai Dasar', type: 'number', unit: 'm' },
  { kode: 'TB-13', category: 'tata-bangunan', nama: 'Bentuk & Penutup Atap', type: 'text' },
  { kode: 'TB-14', category: 'tata-bangunan', nama: 'Pencahayaan Ruang Luar', type: 'text', sub: 'Keseimbangan Lingkungan' },

  // --- KESELAMATAN (Section 3) ---
  // STRUKTUR
  { kode: 'S-01', category: 'keselamatan', nama: 'Kondisi Pondasi', type: 'scale', sub: 'A. Sistem Struktur' },
  { kode: 'S-02', category: 'keselamatan', nama: 'Kondisi Kolom', type: 'scale' },
  { kode: 'S-03', category: 'keselamatan', nama: 'Kondisi Balok Lantai', type: 'scale' },
  { kode: 'S-04', category: 'keselamatan', nama: 'Kondisi Pelat Lantai', type: 'scale' },
  { kode: 'S-05', category: 'keselamatan', nama: 'Kondisi Rangka Atap', type: 'scale' },
  { kode: 'S-06', category: 'keselamatan', nama: 'Pengujian Kekuatan Material', type: 'text' },
  // KEBAKARAN
  { kode: 'F-01', category: 'keselamatan', nama: 'Pintu Tahan Api', type: 'boolean', sub: 'B. Sistem Proteksi Kebakaran (Pasif)' },
  { kode: 'F-02', category: 'keselamatan', nama: 'Tangga Kebakaran (Smoke Free)', type: 'boolean' },
  { kode: 'F-03', category: 'keselamatan', nama: 'Sistem Pipa Tegak (Standpipe)', type: 'boolean', sub: 'B. Sistem Proteksi Kebakaran (Aktif)' },
  { kode: 'F-04', category: 'keselamatan', nama: 'Sistem Springkler Otomatis', type: 'boolean' },
  { kode: 'F-05', category: 'keselamatan', nama: 'APAR (Alat Pemadam Api Ringan)', type: 'boolean' },
  { kode: 'F-06', category: 'keselamatan', nama: 'Sistem Alarm & Deteksi', type: 'boolean' },
  { kode: 'F-07', category: 'keselamatan', nama: 'Penunjuk Arah Keluar (Exit)', type: 'boolean' },
  // PETIR & LISTRIK
  { kode: 'L-01', category: 'keselamatan', nama: 'Kepala Penangkal Petir (Air Term.)', type: 'boolean', sub: 'C. Penangkal Petir' },
  { kode: 'L-02', category: 'keselamatan', nama: 'Sistem Pembumian (Grounding)', type: 'number', unit: 'Ohm' },
  { kode: 'L-03', category: 'keselamatan', nama: 'Kapasitas Sumber Listrik (PLN/Genset)', type: 'number', unit: 'kVA', sub: 'D. Instalasi Listrik' },
  { kode: 'L-04', category: 'keselamatan', nama: 'Panel Listrik Utama (MDP)', type: 'boolean' },

  // --- KESEHATAN (Section 4) ---
  { kode: 'H-01', category: 'kesehatan', nama: 'Ventilasi Alami (Luas Bukaan)', type: 'number', unit: '%', sub: 'Sistem Penghawaan' },
  { kode: 'H-02', category: 'kesehatan', nama: 'Kadar Karbon Dioksida (CO₂)', type: 'number', unit: 'ppm' },
  { kode: 'H-03', category: 'kesehatan', nama: 'Luminansi Pencahayaan Buatan', type: 'number', unit: 'Lux', sub: 'Sistem Pencahayaan' },
  { kode: 'H-04', category: 'kesehatan', nama: 'Kualitas Air Bersih (Visual/Lab)', type: 'boolean', sub: 'Sistem Air Bersih' },
  { kode: 'H-05', category: 'kesehatan', nama: 'Debit Air Bersih (Minimum)', type: 'number', unit: 'Ltr/mnt' },
  { kode: 'H-06', category: 'kesehatan', nama: 'Kondisi Peralatan Saniter', type: 'scale', sub: 'Sistem Pengelolaan Limbah' },
  { kode: 'H-07', category: 'kesehatan', nama: 'Ketersediaan Gas Medik (Jika Ada)', type: 'boolean', sub: 'Sistem Gas Medik' },
  { kode: 'H-08', category: 'kesehatan', nama: 'Kelembaban Ruang', type: 'number', unit: '% RH', sub: 'Kondisi Udara Dalam Ruang' },

  // --- KEMUDAHAN (Section 5) ---
  { kode: 'E-01', category: 'kemudahan', nama: 'Lebar Koridor Minimum', type: 'number', unit: 'm', sub: 'Hubungan Horizontal' },
  { kode: 'E-02', category: 'kemudahan', nama: 'Kondisi Tangga (Optrede/Aantrede)', type: 'scale', sub: 'Hubungan Vertikal' },
  { kode: 'E-03', category: 'kemudahan', nama: 'Ketersediaan Lift/Ram', type: 'boolean' },
  { kode: 'E-04', category: 'kemudahan', nama: 'Toilet Khusus Difabel', type: 'boolean', sub: 'Fasilitas Prasarana' },
  { kode: 'E-05', category: 'kemudahan', nama: 'Ruang Laktasi', type: 'boolean' },
  { kode: 'E-06', category: 'kemudahan', nama: 'Ruang Ibadah', type: 'boolean' }
];

export const SCALE_OPTIONS = [
  { value: 'tanpa_kerusakan', label: 'Tanpa Kerusakan', color: 'var(--success-text)' },
  { value: 'rusak_ringan', label: 'Rusak Ringan', color: 'var(--warning-text)' },
  { value: 'rusak_sedang', label: 'Rusak Sedang', color: 'var(--warning-text)' },
  { value: 'rusak_berat', label: 'Rusak Berat', color: 'var(--error-text)' }
];
