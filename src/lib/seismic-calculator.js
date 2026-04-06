/**
 * SEISMIC ANALYSIS CALCULATOR
 * Berbasis SNI 1726:2019 & ASCE 41-17
 */

// ==========================================
// PUSGEN SEISMIC DATA (Peta Gempa Indonesia)
// ==========================================

// Data Ss dan S1 untuk wilayah Indonesia (simplified from PuSGeN)
export const PUSGEN_DATA = {
  // Sumatera
  'sumatera_utara': { region: 'Sumatera Utara', Ss: 0.60, S1: 0.25, description: 'Moderate seismicity' },
  'sumatera_barat': { region: 'Sumatera Barat', Ss: 0.90, S1: 0.40, description: 'High seismicity (fault zone)' },
  'sumatera_selatan': { region: 'Sumatera Selatan', Ss: 0.50, S1: 0.20, description: 'Low-Moderate seismicity' },
  'aceh': { region: 'Aceh', Ss: 0.85, S1: 0.38, description: 'High seismicity (subduction zone)' },
  'riau': { region: 'Riau', Ss: 0.40, S1: 0.15, description: 'Low seismicity' },
  
  // Jawa
  'jakarta': { region: 'DKI Jakarta', Ss: 0.40, S1: 0.15, description: 'Low seismicity' },
  'jabodetabek': { region: 'Jabodetabek', Ss: 0.40, S1: 0.15, description: 'Low seismicity' },
  'jawa_barat': { region: 'Jawa Barat', Ss: 0.50, S1: 0.20, description: 'Low-Moderate seismicity' },
  'jawa_tengah': { region: 'Jawa Tengah', Ss: 0.45, S1: 0.18, description: 'Low-Moderate seismicity' },
  'jawa_timur': { region: 'Jawa Timur', Ss: 0.55, S1: 0.22, description: 'Moderate seismicity' },
  'yogyakarta': { region: 'DI Yogyakarta', Ss: 0.50, S1: 0.20, description: 'Low-Moderate seismicity' },
  'banten': { region: 'Banten', Ss: 0.45, S1: 0.17, description: 'Low seismicity' },
  
  // Bali & Nusa Tenggara
  'bali': { region: 'Bali', Ss: 0.60, S1: 0.25, description: 'Moderate seismicity' },
  'ntt': { region: 'Nusa Tenggara Timur', Ss: 0.55, S1: 0.22, description: 'Moderate seismicity' },
  'ntb': { region: 'Nusa Tenggara Barat', Ss: 0.50, S1: 0.20, description: 'Low-Moderate seismicity' },
  
  // Kalimantan
  'kalimantan_barat': { region: 'Kalimantan Barat', Ss: 0.25, S1: 0.10, description: 'Very low seismicity' },
  'kalimantan_tengah': { region: 'Kalimantan Tengah', Ss: 0.20, S1: 0.08, description: 'Very low seismicity' },
  'kalimantan_selatan': { region: 'Kalimantan Selatan', Ss: 0.25, S1: 0.10, description: 'Very low seismicity' },
  'kalimantan_timur': { region: 'Kalimantan Timur', Ss: 0.30, S1: 0.12, description: 'Very low seismicity' },
  
  // Sulawesi
  'sulawesi_utara': { region: 'Sulawesi Utara', Ss: 0.55, S1: 0.22, description: 'Moderate seismicity' },
  'sulawesi_tengah': { region: 'Sulawesi Tengah', Ss: 0.60, S1: 0.25, description: 'Moderate-High seismicity' },
  'sulawesi_selatan': { region: 'Sulawesi Selatan', Ss: 0.50, S1: 0.20, description: 'Low-Moderate seismicity' },
  'sulawesi_barat': { region: 'Sulawesi Barat', Ss: 0.70, S1: 0.30, description: 'High seismicity (Palu fault)' },
  
  // Maluku & Papua
  'maluku': { region: 'Maluku', Ss: 0.65, S1: 0.28, description: 'Moderate-High seismicity' },
  'maluku_utara': { region: 'Maluku Utara', Ss: 0.60, S1: 0.25, description: 'Moderate seismicity' },
  'papua': { region: 'Papua', Ss: 0.55, S1: 0.22, description: 'Moderate seismicity' },
  'papua_barat': { region: 'Papua Barat', Ss: 0.60, S1: 0.25, description: 'Moderate-High seismicity' }
};

// Site Class definitions (SNI 1726:2019 Table 3)
export const SITE_CLASSES = {
  'SA': { name: 'Hard Rock', vs_min: 1500, description: 'Batuan sangat keras' },
  'SB': { name: 'Rock', vs_min: 760, vs_max: 1500, description: 'Batuan' },
  'SC': { name: 'Very Dense Soil & Soft Rock', vs_min: 360, vs_max: 760, description: 'Tanah sangat padat/batuan lunak' },
  'SD': { name: 'Stiff Soil', vs_min: 180, vs_max: 360, description: 'Tanah keras' },
  'SE': { name: 'Soft Soil', vs_max: 180, description: 'Tanah lunak' },
  'SF': { name: 'Special Study', description: 'Perlu studi geoteknik khusus' }
};

// Fa and Fv factors (SNI 1726:2019 Table 6 & 7)
export const SITE_COEFFICIENTS = {
  Fa: {
    'SA': [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    'SB': [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    'SC': [1.2, 1.2, 1.1, 1.0, 1.0, 1.0],
    'SD': [1.6, 1.4, 1.2, 1.1, 1.0, 1.0],
    'SE': [2.5, 1.7, 1.2, 0.9, 0.9, 0.9],
    'SF': [null, null, null, null, null, null]
  },
  Fv: {
    'SA': [0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
    'SB': [0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
    'SC': [1.5, 1.3, 1.2, 1.1, 1.0, 1.0],
    'SD': [2.0, 1.6, 1.4, 1.2, 1.1, 1.0],
    'SE': [3.5, 2.4, 1.9, 1.5, 1.2, 1.0],
    'SF': [null, null, null, null, null, null]
  }
};

/**
 * Hitung parameter gempa desain SNI 1726:2019
 * @param {number} Ss - Spectral acceleration at short period (g)
 * @param {number} S1 - Spectral acceleration at 1s period (g)
 * @param {string} siteClass - Kelas situs (SA, SB, SC, SD, SE, SF)
 * @returns {object} Parameter gempa desain
 */
export function calculateSeismicParameters(Ss, S1, siteClass = 'SD') {
  // Get Fa and Fv from tables
  const Fa = getFa(Ss, siteClass);
  const Fv = getFv(S1, siteClass);
  
  // Calculate SMS and SM1
  const SMS = Fa * Ss;
  const SM1 = Fv * S1;
  
  // Calculate SDS and SD1 (2/3 factor for design level)
  const SDS = (2/3) * SMS;
  const SD1 = (2/3) * SM1;
  
  // Determine seismic design category
  const sdc = getSeismicDesignCategory(SDS, SD1);
  
  // Seismicity level
  const seismicity = getSeismicityLevel(SDS, SD1);
  
  return {
    input: { Ss, S1, siteClass },
    site: {
      Fa,
      Fv,
      class: siteClass,
      className: SITE_CLASSES[siteClass]?.name
    },
    max: {
      SMS: Math.round(SMS * 1000) / 1000,
      SM1: Math.round(SM1 * 1000) / 1000
    },
    design: {
      SDS: Math.round(SDS * 1000) / 1000,
      SD1: Math.round(SD1 * 1000) / 1000
    },
    category: {
      sdc,
      seismicity,
      description: getSeismicityDescription(seismicity)
    },
    periodParams: {
      T0: 0.2 * SD1 / SDS,
      Ts: SD1 / SDS,
      TL: 6.0
    }
  };
}

function getFa(Ss, siteClass) {
  const table = SITE_COEFFICIENTS.Fa[siteClass];
  if (!table) return 1.0;
  
  const ranges = [0.25, 0.50, 0.75, 1.00, 1.25, 1.50];
  let index = ranges.findIndex(r => Ss <= r);
  if (index === -1) index = ranges.length - 1;
  
  return table[index] || 1.0;
}

function getFv(S1, siteClass) {
  const table = SITE_COEFFICIENTS.Fv[siteClass];
  if (!table) return 1.0;
  
  const ranges = [0.10, 0.20, 0.30, 0.40, 0.50, 0.60];
  let index = ranges.findIndex(r => S1 <= r);
  if (index === -1) index = ranges.length - 1;
  
  return table[index] || 1.0;
}

function getSeismicDesignCategory(SDS, SD1) {
  let sdsCat, sd1Cat;
  
  if (SDS < 0.167) sdsCat = 'A';
  else if (SDS < 0.333) sdsCat = 'B';
  else if (SDS < 0.50) sdsCat = 'C';
  else sdsCat = 'D';
  
  if (SD1 < 0.067) sd1Cat = 'A';
  else if (SD1 < 0.133) sd1Cat = 'B';
  else if (SD1 < 0.20) sd1Cat = 'C';
  else sd1Cat = 'D';
  
  const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
  const sdsIndex = categories.indexOf(sdsCat);
  const sd1Index = categories.indexOf(sd1Cat);
  
  return categories[Math.max(sdsIndex, sd1Index)];
}

function getSeismicityLevel(SDS, SD1) {
  if (SDS >= 0.50 || SD1 >= 0.20) return 'High';
  if (SDS >= 0.33) return 'Moderate';
  if (SDS >= 0.17) return 'Low';
  return 'Very Low';
}

function getSeismicityDescription(level) {
  const descriptions = {
    'High': { color: '#ef4444', description: 'Tinggi - Perlu analisis rinci Tier 2/3' },
    'Moderate': { color: '#f97316', description: 'Sedang - Tier 1 screening mungkin cukup' },
    'Low': { color: '#eab308', description: 'Rendah - Evaluasi sederhana' },
    'Very Low': { color: '#22c55e', description: 'Sangat Rendah - Minimal requirements' }
  };
  return descriptions[level] || descriptions['Low'];
}

/**
 * Generate Response Spectrum data points
 * @param {number} SDS - Design spectral acceleration at short period
 * @param {number} SD1 - Design spectral acceleration at 1s
 * @returns {array} Array of {T, Sa} points
 */
export function generateResponseSpectrum(SDS, SD1) {
  const points = [];
  const T0 = 0.2 * SD1 / SDS;
  const Ts = SD1 / SDS;
  const TL = 6.0;
  
  for (let T = 0; T <= 6; T += 0.05) {
    let Sa;
    
    if (T < T0) {
      Sa = SDS * (0.4 + 0.6 * T / T0);
    } else if (T < Ts) {
      Sa = SDS;
    } else if (T <= TL) {
      Sa = SD1 / T;
    } else {
      Sa = SD1 * TL / (T * T);
    }
    
    points.push({
      T: Math.round(T * 100) / 100,
      Sa: Math.round(Sa * 1000) / 1000
    });
  }
  
  return points;
}

/**
 * Lookup Ss/S1 berdasarkan wilayah
 * @param {string} region - Kode wilayah
 * @returns {object|null} Data Ss dan S1
 */
export function lookupSeismicByRegion(region) {
  return PUSGEN_DATA[region] || null;
}
