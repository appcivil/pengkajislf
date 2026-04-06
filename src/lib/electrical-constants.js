// ============================================================
// ELECTRICAL SYSTEM INSPECTION - CORE DATA & CONSTANTS
// PUIL 2020, SNI 0225:2011, IEC 60364, ASCE 41-17
// ============================================================

// Derating Factors based on PUIL 2020 Tabel 5.2.1
export const DERATING_FACTORS = {
  30: 1.0,
  35: 0.94,
  40: 0.87,
  45: 0.71,
  50: 0.61,
  55: 0.5,
  60: 0.41
};

// Temperature Correction Factors for cables
export const TEMPERATURE_CORRECTION_FACTORS = {
  PVC: {
    15: 1.22, 20: 1.17, 25: 1.12, 30: 1.07, 35: 1.02, 40: 0.97,
    45: 0.91, 50: 0.85, 55: 0.78, 60: 0.71, 65: 0.63, 70: 0.55
  },
  XLPE: {
    15: 1.20, 20: 1.15, 25: 1.11, 30: 1.06, 35: 1.00, 40: 0.95,
    45: 0.89, 50: 0.84, 55: 0.77, 60: 0.71, 65: 0.63, 70: 0.56
  },
  RUBBER: {
    25: 1.03, 30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82,
    55: 0.76, 60: 0.71, 65: 0.65, 70: 0.58, 75: 0.52, 80: 0.45
  }
};

// Soil Thermal Resistivity Correction (for underground cables)
export const SOIL_CORRECTION_FACTORS = {
  1.0: 1.18, 1.2: 1.10, 1.5: 1.00, 2.0: 0.87, 2.5: 0.78, 3.0: 0.70
};

// Grouping Correction Factors (PUIL 2020)
export const GROUPING_FACTORS = {
  1: 1.0,
  2: 0.88,
  3: 0.82,
  4: 0.77,
  5: 0.73,
  6: 0.68,
  7: 0.65,
  8: 0.62,
  9: 0.60
};

// Thermal Grades based on IEC 60364-4-42
export const THERMAL_GRADES = [
  { max: 45, grade: 'Normal', color: '#22c55e', action: 'Monitoring rutin', priority: 'Low' },
  { max: 70, grade: 'Waspada', color: '#eab308', action: 'Pembersihan terminal, cek koneksi', priority: 'Medium' },
  { max: 90, grade: 'Kritis', color: '#f97316', action: 'Penggantian komponen, penambahan ventilasi', priority: 'High' },
  { max: 999, grade: 'Darurat', color: '#ef4444', action: 'Shutdown segera, pemeriksaan menyeluruh', priority: 'Critical' }
];

// Loading Status Categories
export const LOADING_STATUS = {
  SAFE: { threshold: 80, label: 'Aman', color: '#22c55e', class: 'status-safe' },
  WARNING: { threshold: 100, label: 'Penuh', color: '#eab308', class: 'status-warning' },
  OVERLOAD: { threshold: Infinity, label: 'Overload', color: '#ef4444', class: 'status-overload' }
};

// Phase Imbalance Threshold (IEEE 1159)
export const PHASE_IMBALANCE_THRESHOLD = 10; // percent

// Standard Cable Current Ratings (Ampere) - PUIL 2020 Reference
// Based on installation method and cable type
export const CABLE_RATINGS = {
  PVC_CONDUIT: {
    '1.5': 17, '2.5': 24, '4': 32, '6': 40, '10': 54, '16': 72, '25': 93, '35': 117,
    '50': 149, '70': 186, '95': 226, '120': 261, '150': 298, '185': 343, '240': 404
  },
  PVC_TRAY: {
    '1.5': 19, '2.5': 26, '4': 35, '6': 44, '10': 60, '16': 80, '25': 104, '35': 130,
    '50': 166, '70': 207, '95': 252, '120': 292, '150': 334, '185': 384, '240': 453
  },
  XLPE_TRAY: {
    '1.5': 23, '2.5': 32, '4': 42, '6': 53, '10': 72, '16': 96, '25': 125, '35': 156,
    '50': 199, '70': 249, '95': 302, '120': 350, '150': 400, '185': 460, '240': 542
  }
};

// MCB/Icu Ratings Database
export const MCB_RATINGS = [
  1, 2, 3, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125
];

export const ICU_RATINGS = {
  'MCCB': [10, 15, 25, 36, 50, 70, 85, 100, 150, 200],
  'ACB': [50, 65, 80, 100, 120, 150]
};

// Voltage Drop Limits (PUIL 2020)
export const VOLTAGE_DROP_LIMITS = {
  LIGHTING: 3,      // 3% for lighting
  POWER: 5,         // 5% for power
  COMBINED: 5       // 5% for combined lighting & power
};

// Power Factor Reference Values
export const POWER_FACTOR_REFERENCES = {
  'Resistive': 1.0,
  'Fluorescent': 0.95,
  'LED': 0.9,
  'Motor_Standard': 0.8,
  'Motor_HighEff': 0.85,
  'AC_Split': 0.85,
  'AC_Central': 0.8,
  'Computer': 0.6,
  'UPS': 0.7,
  'Welding': 0.5
};

// PUIL 2020 Compliance Database
export const PUIL_DATABASE = [
  {
    id: 'PUIL-2020-5.2.5.3',
    category: 'overload',
    pasal: '5.2.5.3',
    judul: 'Batas Pembebanan Penghantar',
    teks: 'Arus pengenal penghantar tidak boleh kurang dari arus maksimum yang dapat mengalir pada penghantar tersebut dengan mempertimbangkan faktor koreksi suhu lingkungan.',
    tindakan: 'Upsizing kabel atau pembagian beban',
    referensi: ['PUIL 2020 Pasal 5.2.5']
  },
  {
    id: 'PUIL-2020-5.2.5.1',
    category: 'cable_selection',
    pasal: '5.2.5.1',
    judul: 'Pemilihan Penghantar',
    teks: 'Penghantar harus dipilih berdasarkan kondisi lingkungan pemasangan dan karakteristik beban yang dilayani.',
    tindakan: 'Pilih tipe kabel sesuai kondisi lingkungan',
    referensi: ['PUIL 2020 Pasal 5.2.5']
  },
  {
    id: 'PUIL-2020-6.2.1',
    category: 'protection_short_circuit',
    pasal: '6.2.1',
    judul: 'Proteksi Hubung Singkat',
    teks: 'Semua rangkaian harus dilindungi terhadap arus hubung singkat dengan menggunakan peralatan pemutus yang memiliki kemampuan pemutusan (Icu) yang mencukupi.',
    tindakan: 'Verifikasi Icu MCB sesuai dengan arus hubung singkat tersedia',
    referensi: ['PUIL 2020 Pasal 6.2']
  },
  {
    id: 'PUIL-2020-6.3.1',
    category: 'protection_overload',
    pasal: '6.3.1',
    judul: 'Proteksi Beban Lebih',
    teks: 'Penghantar harus dilindungi terhadap beban lebih oleh peralatan pemutus yang dipasang pada titik awal penghantar kecuali dengan persyaratan tertentu.',
    tindakan: 'Pastikan koordinasi proteksi beban lebih',
    referensi: ['PUIL 2020 Pasal 6.3']
  },
  {
    id: 'PUIL-2020-7.3.1',
    category: 'voltage_drop',
    pasal: '7.3.1',
    judul: 'Jatuh Tegangan',
    teks: 'Jatuh tegangan pada instalasi listrik tidak boleh melebihi batas yang diizinkan sesuai dengan jenis penggunaan.',
    tindakan: 'Verifikasi voltage drop < 3% untuk penerangan, < 5% untuk daya',
    referensi: ['PUIL 2020 Pasal 7.3']
  },
  {
    id: 'IEC-60364-4-42',
    category: 'thermal_high',
    pasal: '60364-4-42',
    judul: 'Perlindungan Terhadap Efek Panas',
    teks: 'Suhu permukaan peralatan listrik tidak boleh melebihi 70°C pada tempat yang dapat dijangkau atau 90°C untuk bagian internal.',
    tindakan: 'Perbaikan sistem ventilasi atau pembebanan ulang',
    referensi: ['IEC 60364-4-42']
  },
  {
    id: 'IEEE-1159-Imbalance',
    category: 'phase_imbalance',
    pasal: '1159',
    judul: 'Keseimbangan Tegangan dan Arus',
    teks: 'Ketidakseimbangan arus fasa tidak boleh melebihi 10% dari nilai rata-rata.',
    tindakan: 'Lakukan rebalancing beban antar fasa',
    referensi: ['IEEE 1159']
  },
  {
    id: 'PUIL-2020-8.5.1',
    category: 'hazardous_location',
    pasal: '8.5.1',
    judul: 'Instalasi di Tempat Berbahaya',
    teks: 'Instalasi listrik di tempat yang mengandung bahaya kebakaran atau ledakan harus memenuhi persyaratan khusus sesuai klasifikasi area.',
    tindakan: 'Gunakan peralatan tersertifikasi untuk area berbahaya',
    referensi: ['PUIL 2020 Pasal 8.5']
  },
  {
    id: 'SNI-0225-2011-6.4',
    category: 'grounding',
    pasal: '6.4',
    judul: 'Sistem Pentanahan',
    teks: 'Semua instalasi listrik harus dilengkapi dengan sistem pentanahan yang efektif dengan tahanan pentanahan maksimum 5 Ohm.',
    tindakan: 'Verifikasi nilai tahanan pentanahan',
    referensi: ['SNI 0225:2011 Pasal 6.4']
  },
  {
    id: 'PUIL-2020-5.3.1',
    category: 'neutral_sizing',
    pasal: '5.3.1',
    judul: 'Penghantar Netral',
    teks: 'Untuk sistem 3 fasa dengan beban tidak seimbang, penghantar netral harus memiliki ukuran yang memadai untuk mengalirkan arus ketidakseimbangan.',
    tindakan: 'Verifikasi ukuran kabel netral atau gunakan netral yang diperbesar',
    referensi: ['PUIL 2020 Pasal 5.3']
  }
];

// Measurement Point Types
export const MEASUREMENT_POINT_TYPES = [
  { id: 'kwh_meter', label: 'KWH Meter', icon: 'fa-bolt', phase: '3-phase' },
  { id: 'mcb_main', label: 'MCB Panel Utama', icon: 'fa-shield-halved', phase: '3-phase' },
  { id: 'mcb_distribution', label: 'MCB Distribusi', icon: 'fa-shield', phase: '1-phase' },
  { id: 'busbar', label: 'Busbar', icon: 'fa-grip-lines', phase: '3-phase' },
  { id: 'sub_panel', label: 'Sub Panel', icon: 'fa-box', phase: '3-phase' },
  { id: 'outlet', label: 'Stop Kontak', icon: 'fa-plug', phase: '1-phase' },
  { id: 'lighting_circuit', label: 'Rangkaian Penerangan', icon: 'fa-lightbulb', phase: '1-phase' },
  { id: 'motor_starter', label: 'Motor Starter', icon: 'fa-gear', phase: '3-phase' }
];

// Load Categories for Analysis
export const LOAD_CATEGORIES = {
  LIGHTING: { factor: 1.0, demand: 0.9 },
  HVAC: { factor: 0.8, demand: 0.9 },
  POWER: { factor: 0.75, demand: 0.8 },
  SOCKET: { factor: 0.5, demand: 0.6 },
  EMERGENCY: { factor: 1.0, demand: 1.0 }
};

// Default panel structure
export const DEFAULT_PANEL_STRUCTURE = {
  name: '',
  location: '',
  type: 'DISTRIBUTION', // MAIN, DISTRIBUTION, SUB
  phases: 3,
  voltage: 380, // Phase-to-phase voltage
  mcbRating: 100,
  mcbType: 'MCCB',
  busbarRating: 200,
  cableSize: '50',
  cableType: 'XLPE_TRAY',
  cableLength: 0,
  ambientTemp: 30,
  measurements: [],
  thermalImages: [],
  history: [],
  createdAt: null,
  updatedAt: null
};

// Export all as default
export default {
  DERATING_FACTORS,
  TEMPERATURE_CORRECTION_FACTORS,
  SOIL_CORRECTION_FACTORS,
  GROUPING_FACTORS,
  THERMAL_GRADES,
  LOADING_STATUS,
  PHASE_IMBALANCE_THRESHOLD,
  CABLE_RATINGS,
  MCB_RATINGS,
  ICU_RATINGS,
  VOLTAGE_DROP_LIMITS,
  POWER_FACTOR_REFERENCES,
  PUIL_DATABASE,
  MEASUREMENT_POINT_TYPES,
  LOAD_CATEGORIES,
  DEFAULT_PANEL_STRUCTURE
};
