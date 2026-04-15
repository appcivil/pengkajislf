/**
 * LIGHTNING PROTECTION SYSTEM (LPS) CALCULATORS
 * Perhitungan berdasarkan SNI 03-7015-2014 (mengacu pada IEC 62305 series)
 * 
 * Fitur:
 * - Risk Assessment Calculator (Pasal 6)
 * - Rolling Sphere Method (Pasal 8.1.2)
 * - Protection Angle Method (Pasal 8.2)
 * - Grounding Resistance Calculator (Pasal 10)
 * - Separation Distance Calculator (Pasal 12)
 * - Mesh Size Calculator (Pasal 8.3)
 */

/**
 * ============================================
 * 1. RISK ASSESSMENT CALCULATOR (SNI 03-7015-2014 Pasal 6)
 * ============================================
 * R = N × P × L (Frekuensi sambaran × Probabilitas kerusakan × Kerugian)
 * Toleransi risiko RT = 10⁻⁵ (satu kerugian per 100 tahun)
 */

/**
 * Hitung area ekivalen koleksi (Ae) untuk struktur persegi panjang
 * Ae = L×W + 6H(L+W) + π(3H)²
 * @param {number} L - Panjang bangunan (m)
 * @param {number} W - Lebar bangunan (m)
 * @param {number} H - Tinggi bangunan (m)
 * @returns {number} Area ekivalen dalam m²
 */
export function calculateCollectionArea(L, W, H) {
  const Ae = (L * W) + (6 * H * (L + W)) + (Math.PI * Math.pow(3 * H, 2));
  return Math.round(Ae * 100) / 100;
}

/**
 * Hitung frekuensi sambaran petir tahunan (N)
 * N = Ng × Ae × Cd × 10⁻⁶
 * @param {number} Ng - Kerapatan petir (sambaran/km²/tahun)
 * @param {number} Ae - Area ekivalen koleksi (m²)
 * @param {number} Cd - Faktor lingkungan (0.25-2.0)
 * @returns {number} Frekuensi sambaran per tahun
 */
export function calculateStrikeFrequency(Ng, Ae, Cd = 1.0) {
  const N = Ng * Ae * Cd * 1e-6;
  return Math.round(N * 1000000) / 1000000;
}

/**
 * Faktor lingkungan (Cd) berdasarkan kondisi lokasi
 */
export const ENVIRONMENT_FACTORS = {
  RURAL_ISOLATED: { value: 1.0, label: 'Pedesaan Terisolasi' },
  SUBURBAN: { value: 0.5, label: 'Pinggiran Kota' },
  URBAN: { value: 0.25, label: 'Perkotaan' },
  URBAN_DENSE: { value: 0.1, label: 'Perkotaan Padat (>20m tinggi)' },
  MOUNTAIN: { value: 2.0, label: 'Pegunungan' }
};

/**
 * Kelas bangunan berdasarkan fungsi (untuk klasifikasi otomatis)
 */
export const BUILDING_CLASSES = {
  CLASS_I: {
    id: 'CLASS_I',
    name: 'Kelas I - Bangunan Vital',
    description: 'RS, sekolah, gedung publik, penampungan banyak orang',
    lplRequired: 'LPL_I_II',
    lpsMandatory: true,
    examples: ['Rumah Sakit', 'Sekolah', 'Stadion', 'Pasar', 'Terminal']
  },
  CLASS_II: {
    id: 'CLASS_II',
    name: 'Kelas II - Bangunan Komersial',
    description: 'Kantor, apartemen, hotel, perdagangan',
    lplRequired: 'EVALUATE_RISK',
    lpsMandatory: null,
    examples: ['Kantor', 'Apartemen', 'Hotel', 'Mall']
  },
  CLASS_III: {
    id: 'CLASS_III',
    name: 'Kelas III - Industri/Gudang',
    description: 'Gudang, industri, bangunan dengan bahan berbahaya',
    lplRequired: 'BASED_ON_CONTENT',
    lpsMandatory: null,
    examples: ['Gudang', 'Pabrik', 'Instalasi Bahan Berbahaya']
  }
};

/**
 * Level Proteksi Petir (LPL) dan parameter terkait
 */
export const LPL_LEVELS = {
  LPL_I: {
    level: 'I',
    rollingSphereRadius: 20, // meter
    protectionAngle: 25, // derajat (untuk h < 20m)
    meshSize: 5, // meter
    downConductorSpacing: 10, // meter
    maxImpulseCurrent: 200, // kA
    label: 'Level I - Perlindungan Tinggi'
  },
  LPL_II: {
    level: 'II',
    rollingSphereRadius: 30,
    protectionAngle: 35,
    meshSize: 10,
    downConductorSpacing: 15,
    maxImpulseCurrent: 150,
    label: 'Level II - Perlindungan Standar'
  },
  LPL_III: {
    level: 'III',
    rollingSphereRadius: 45,
    protectionAngle: 45,
    meshSize: 15,
    downConductorSpacing: 20,
    maxImpulseCurrent: 100,
    label: 'Level III - Perlindungan Moderat'
  },
  LPL_IV: {
    level: 'IV',
    rollingSphereRadius: 60,
    protectionAngle: 55,
    meshSize: 15,
    downConductorSpacing: 20,
    maxImpulseCurrent: 100,
    label: 'Level IV - Perlindungan Dasar'
  }
};

/**
 * Hitung risiko petir lengkap
 * @param {Object} params - Parameter perhitungan
 * @param {number} params.Ng - Kerapatan petir (sambaran/km²/tahun)
 * @param {number} params.L - Panjang bangunan (m)
 * @param {number} params.W - Lebar bangunan (m)
 * @param {number} params.H - Tinggi bangunan (m)
 * @param {number} params.Cd - Faktor lingkungan
 * @param {string} params.buildingClass - Kelas bangunan
 * @returns {Object} Hasil perhitungan risiko
 */
export function calculateRiskAssessment(params) {
  const { Ng, L, W, H, Cd = 1.0, buildingClass = 'CLASS_II' } = params;
  
  // Hitung area koleksi
  const Ae = calculateCollectionArea(L, W, H);
  
  // Hitung frekuensi sambaran
  const N = calculateStrikeFrequency(Ng, Ae, Cd);
  
  // Probabilitas kerusakan (simplified - asumsi struktur logam)
  const Pt = 0.01; // 1% untuk struktur dengan LPS
  
  // Nilai kerugian (L) - berdasarkan kelas bangunan
  const lossFactors = {
    'CLASS_I': 0.1,   // Kerugian tinggi (bangunan vital)
    'CLASS_II': 0.05, // Kerugian sedang
    'CLASS_III': 0.08 // Kerugian tinggi (bahan berbahaya)
  };
  const Lt = lossFactors[buildingClass] || 0.05;
  
  // Hitung risiko tahunan R = N × Pt × Lt
  const R = N * Pt * Lt;
  
  // Toleransi risiko RT = 10^-5
  const RT = 1e-5;
  
  // Tentukan kebutuhan LPS
  const isRequired = R > RT;
  
  // Rekomendasi LPL berdasarkan risiko
  let lplRecommended = 'LPL_IV';
  if (R > 1e-3) {
    lplRecommended = 'LPL_I';
  } else if (R > 1e-4) {
    lplRecommended = 'LPL_II';
  } else if (R > 1e-5) {
    lplRecommended = 'LPL_III';
  }
  
  // Periksa apakah bangunan kelas I (wajib LPS)
  const classInfo = BUILDING_CLASSES[buildingClass];
  const isMandatory = classInfo?.lpsMandatory || false;
  
  return {
    collectionArea: Ae,
    strikeFrequency: N,
    riskValue: Math.round(R * 100000000) / 100000000,
    toleranceRisk: RT,
    isRequired: isRequired || isMandatory,
    isMandatory: isMandatory,
    lplRecommended: lplRecommended,
    lplDetails: LPL_LEVELS[lplRecommended],
    buildingClass: classInfo,
    status: isRequired || isMandatory ? 'WAJIB' : 'TIDAK_WAJIB',
    recommendation: isRequired || isMandatory 
      ? `Bangunan WAJIB memiliki LPS Level ${lplRecommended.replace('LPL_', '')}` 
      : 'Risiko dapat ditoleransi, LPS tidak wajib namun disarankan',
    factors: {
      Ng,
      Ae,
      Cd,
      N,
      Pt,
      Lt
    }
  };
}

/**
 * ============================================
 * 2. ROLLING SPHERE METHOD (SNI 03-7015-2014 Pasal 8.1.2)
 * ============================================
 * Metode bola berguling untuk menentukan zona perlindungan
 */

/**
 * Hitung zona perlindungan dari air terminal menggunakan Rolling Sphere Method
 * @param {number} sphereRadius - Radius bola berguling (sesuai LPL: 20, 30, 45, 60m)
 * @param {number} rodHeight - Tinggi air terminal/rod (m)
 * @param {number} structureHeight - Tinggi struktur yang dilindungi (m)
 * @returns {Object} Zona perlindungan
 */
export function calculateRollingSphereProtection(sphereRadius, rodHeight, structureHeight) {
  // Tinggi efektif rod di atas struktur
  const h = rodHeight - structureHeight;
  
  if (h <= 0) {
    return {
      isProtected: false,
      radius: 0,
      reason: 'Tinggi rod harus lebih tinggi dari struktur'
    };
  }
  
  // Radius zona perlindungan di permukaan tanah
  // r = √(h(2R - h))
  const r = Math.sqrt(h * (2 * sphereRadius - h));
  
  // Tinggi perlindungan maksimum pada jarak tertentu dari rod
  // hp = √(R² - x²) + h - R, dimana x adalah jarak horizontal dari rod
  
  // Cek apakah struktur terlindungi
  const isProtected = h >= (sphereRadius * 0.1); // Simplified check
  
  return {
    sphereRadius,
    rodHeight,
    structureHeight,
    effectiveHeight: h,
    protectedRadius: Math.round(r * 100) / 100,
    isProtected,
    protectionHeight: (distance) => {
      // Hitung tinggi perlindungan pada jarak x dari rod
      if (distance > r) return 0;
      const hp = Math.sqrt(Math.pow(sphereRadius, 2) - Math.pow(distance, 2)) + h - sphereRadius;
      return Math.max(0, Math.round(hp * 100) / 100);
    }
  };
}

/**
 * Cek apakah titik tertentu terlindungi oleh air terminal
 * @param {Object} rodPos - Posisi air terminal {x, y, z}
 * @param {number} rodHeight - Tinggi air terminal
 * @param {Object} point - Titik yang dicek {x, y, z}
 * @param {number} sphereRadius - Radius bola berguling
 * @returns {boolean} True jika titik terlindungi
 */
export function isPointProtected(rodPos, rodHeight, point, sphereRadius) {
  // Hitung jarak horizontal dari rod ke titik
  const dx = point.x - rodPos.x;
  const dy = point.y - rodPos.y;
  const horizontalDistance = Math.sqrt(dx * dx + dy * dy);
  
  // Tinggi efektif rod
  const h = rodHeight;
  
  // Radius zona perlindungan di permukaan tanah
  const r = Math.sqrt(h * (2 * sphereRadius - h));
  
  // Jika jarak horizontal > radius, tidak terlindungi
  if (horizontalDistance > r) return false;
  
  // Hitung tinggi perlindungan pada jarak tersebut
  const protectedHeight = Math.sqrt(
    Math.pow(sphereRadius, 2) - Math.pow(horizontalDistance, 2)
  ) + h - sphereRadius;
  
  // Titik terlindungi jika z <= protectedHeight
  return point.z <= protectedHeight;
}

/**
 * ============================================
 * 3. PROTECTION ANGLE METHOD (SNI 03-7015-2014 Pasal 8.2)
 * ============================================
 * Metode sudut perlindungan untuk bangunan sederhana
 */

/**
 * Sudut perlindungan berdasarkan LPL dan tinggi
 * @param {string} lpl - Level Proteksi Petir (LPL_I, LPL_II, LPL_III, LPL_IV)
 * @param {number} height - Tinggi air terminal (m)
 * @returns {number} Sudut perlindungan (derajat)
 */
export function getProtectionAngle(lpl, height) {
  const level = LPL_LEVELS[lpl];
  if (!level) return 45;
  
  // Sudut perlindungan berkurang dengan ketinggian
  if (height <= 20) {
    return level.protectionAngle;
  } else if (height <= 30) {
    return Math.max(25, level.protectionAngle - 5);
  } else {
    return Math.max(25, level.protectionAngle - 10);
  }
}

/**
 * Hitung radius zona perlindungan menggunakan Protection Angle Method
 * @param {number} rodHeight - Tinggi air terminal (m)
 * @param {number} angle - Sudut perlindungan (derajat)
 * @returns {Object} Zona perlindungan cone
 */
export function calculateProtectionZone(rodHeight, angle) {
  const angleRad = (angle * Math.PI) / 180;
  
  // Radius di permukaan tanah
  const groundRadius = rodHeight * Math.tan(angleRad);
  
  // Tinggi di mana zona perlindungan berakhir
  const protectionHeight = rodHeight - (groundRadius / Math.tan(angleRad));
  
  return {
    rodHeight,
    protectionAngle: angle,
    groundRadius: Math.round(groundRadius * 100) / 100,
    protectionHeight: Math.max(0, Math.round(protectionHeight * 100) / 100),
    getRadiusAtHeight: (h) => {
      if (h >= rodHeight) return 0;
      const remainingHeight = rodHeight - h;
      return Math.round(remainingHeight * Math.tan(angleRad) * 100) / 100;
    }
  };
}

/**
 * ============================================
 * 4. MESH SIZE CALCULATOR (SNI 03-7015-2014)
 * ============================================
 * Ukuran mesh penangkap berdasarkan LPL
 */

/**
 * Dapatkan ukuran mesh sesuai LPL
 * @param {string} lpl - Level Proteksi Petir
 * @returns {Object} Ukuran mesh {width, height}
 */
export function getMeshSize(lpl) {
  const level = LPL_LEVELS[lpl];
  if (!level) return { width: 15, height: 15 };
  
  return {
    width: level.meshSize,
    height: level.meshSize,
    maxDimension: level.meshSize
  };
}

/**
 * Hitung jumlah mesh yang dibutuhkan untuk area tertentu
 * @param {number} areaLength - Panjang area (m)
 * @param {number} areaWidth - Lebar area (m)
 * @param {string} lpl - Level Proteksi Petir
 * @returns {Object} Jumlah mesh dan estimasi material
 */
export function calculateMeshRequirements(areaLength, areaWidth, lpl) {
  const meshSize = getMeshSize(lpl);
  
  const meshCountX = Math.ceil(areaLength / meshSize.width);
  const meshCountY = Math.ceil(areaWidth / meshSize.height);
  
  // Total panjang konduktor (horizontal + vertical)
  const horizontalLength = (meshCountY + 1) * areaLength;
  const verticalLength = (meshCountX + 1) * areaWidth;
  const totalConductorLength = horizontalLength + verticalLength;
  
  return {
    meshSize,
    meshCount: {
      x: meshCountX,
      y: meshCountY,
      total: meshCountX * meshCountY
    },
    conductorLength: {
      horizontal: horizontalLength,
      vertical: verticalLength,
      total: Math.round(totalConductorLength)
    },
    perimeter: 2 * (areaLength + areaWidth),
    area: areaLength * areaWidth
  };
}

/**
 * ============================================
 * 5. GROUNDING RESISTANCE CALCULATOR (SNI 03-7015-2014 Pasal 10)
 * ============================================
 * Perhitungan resistansi pembumian sistem
 */

/**
 * Hitung resistansi single ground rod
 * Formula: R = ρ × (ln(8L/d) - 1) / (2πL)
 * @param {number} rho - Resistivitas tanah (Ω.m)
 * @param {number} L - Panjang elektroda (m)
 * @param {number} d - Diameter elektroda (m)
 * @returns {number} Resistansi (Ω)
 */
export function calculateSingleRodResistance(rho, L, d) {
  const R = rho * (Math.log(8 * L / d) - 1) / (2 * Math.PI * L);
  return Math.round(R * 100) / 100;
}

/**
 * Hitung resistansi multiple ground rods
 * Formula: Rtotal = R/n × k (dengan k sebagai faktor koreksi)
 * @param {number} singleRodR - Resistansi single rod (Ω)
 * @param {number} n - Jumlah rod
 * @param {number} spacing - Jarak antar rod (m)
 * @param {number} rodLength - Panjang rod (m)
 * @returns {number} Resistansi total (Ω)
 */
export function calculateMultipleRodResistance(singleRodR, n, spacing, rodLength) {
  // Faktor koreksi sederhana berdasarkan jarak antar rod
  // k ≈ 1 + 0.1 × (rodLength / spacing) untuk jarak < 2×rodLength
  let k = 1;
  if (spacing < 2 * rodLength) {
    k = 1 + 0.1 * (rodLength / spacing);
  }
  
  const Rtotal = (singleRodR / n) * k;
  return Math.round(Rtotal * 100) / 100;
}

/**
 * Hitung resistansi ground grid (mesh)
 * Formula sederhana: R = ρ × (1/L + 1/√(20×A))
 * @param {number} rho - Resistivitas tanah (Ω.m)
 * @param {number} totalConductorLength - Total panjang konduktor (m)
 * @param {number} area - Area grid (m²)
 * @returns {number} Resistansi grid (Ω)
 */
export function calculateGridResistance(rho, totalConductorLength, area) {
  const R = rho * (1 / totalConductorLength + 1 / Math.sqrt(20 * area));
  return Math.round(R * 100) / 100;
}

/**
 * Klasifikasi tanah berdasarkan resistivitas
 * @param {number} rho - Resistivitas tanah (Ω.m)
 * @returns {Object} Klasifikasi tanah
 */
export function classifySoil(rho) {
  if (rho < 100) {
    return {
      type: 'VERY_WET',
      label: 'Sangat Basah',
      description: 'Tanah organik, lempung basah',
      resistivity: rho,
      groundingDifficulty: 'Mudah'
    };
  } else if (rho < 500) {
    return {
      type: 'WET',
      label: 'Basah',
      description: 'Lempung, pasir lempung basah',
      resistivity: rho,
      groundingDifficulty: 'Normal'
    };
  } else if (rho < 1000) {
    return {
      type: 'MOIST',
      label: 'Lembab',
      description: 'Pasir, kerikil lembab',
      resistivity: rho,
      groundingDifficulty: 'Sedang'
    };
  } else {
    return {
      type: 'DRY',
      label: 'Kering',
      description: 'Batu, pasir kering, granit',
      resistivity: rho,
      groundingDifficulty: 'Sulit'
    };
  }
}

/**
 * Target resistansi berdasarkan jenis sistem
 * @param {string} systemType - Jenis sistem
 * @returns {Object} Target resistansi
 */
export function getGroundingTarget(systemType = 'BUILDING') {
  const targets = {
    'ELECTRONIC': { max: 2, label: 'Sistem Elektronik', description: '< 2Ω' },
    'BUILDING': { max: 5, label: 'Bangunan Biasa', description: '< 5Ω' },
    'LPS_ONLY': { max: 10, label: 'LPS Only', description: '< 10Ω' }
  };
  return targets[systemType] || targets['BUILDING'];
}

/**
 * ============================================
 * 6. SOIL RESISTIVITY MEASUREMENT (Wenner Method)
 * ============================================
 * ρ = 2πaR
 */

/**
 * Hitung resistivitas tanah menggunakan metode Wenner (4-pole)
 * @param {number} a - Jarak antar elektroda (m)
 * @param {number} R - Nilai resistansi terukur (Ω)
 * @returns {number} Resistivitas tanah (Ω.m)
 */
export function calculateSoilResistivity(a, R) {
  const rho = 2 * Math.PI * a * R;
  return Math.round(rho * 100) / 100;
}

/**
 * Koreksi resistansi berdasarkan suhu tanah
 * @param {number} R - Resistansi terukur (Ω)
 * @param {number} T - Suhu tanah saat pengukuran (°C)
 * @param {number} Tref - Suhu referensi (default 20°C)
 * @returns {number} Resistansi terkoreksi (Ω)
 */
export function correctResistanceForTemperature(R, T, Tref = 20) {
  // Faktor koreksi suhu: α ≈ 0.02 per °C untuk tanah
  const alpha = 0.02;
  const Rcorrected = R * (1 + alpha * (Tref - T));
  return Math.round(Rcorrected * 100) / 100;
}

/**
 * ============================================
 * 7. SEPARATION DISTANCE CALCULATOR (SNI 03-7015-2014 Pasal 12)
 * ============================================
 * S = ki × (kc × L) / km
 * Cegahan side flash
 */

/**
 * Hitung jarak aman (separation distance) antara LPS dan instalasi logam
 * @param {number} ki - Faktor bergantung pada LPL (LPL I: 0.08, LPL II: 0.06, LPL III/IV: 0.04)
 * @param {number} kc - Faktor pengurangan (0.5 untuk multiple down conductor, 1 untuk single)
 * @param {number} L - Panjang down conductor dari air terminal ke titik referensi (m)
 * @param {number} km - Faktor material (1 untuk logam)
 * @returns {number} Jarak aman (m)
 */
export function calculateSeparationDistance(ki, kc, L, km = 1) {
  const S = (ki * kc * L) / km;
  return Math.round(S * 100) / 100;
}

/**
 * Faktor ki berdasarkan LPL
 */
export const SEPARATION_FACTORS = {
  'LPL_I': { ki: 0.08, kc_single: 1, kc_multiple: 0.5 },
  'LPL_II': { ki: 0.06, kc_single: 1, kc_multiple: 0.5 },
  'LPL_III': { ki: 0.04, kc_single: 1, kc_multiple: 0.5 },
  'LPL_IV': { ki: 0.04, kc_single: 1, kc_multiple: 0.5 }
};

/**
 * Cek apakah jarak aktual memenuhi syarat
 * @param {number} actualDistance - Jarak aktual (m)
 * @param {number} requiredDistance - Jarak yang disyaratkan (m)
 * @returns {Object} Status kepatuhan
 */
export function checkSeparationCompliance(actualDistance, requiredDistance) {
  const isCompliant = actualDistance >= requiredDistance;
  const margin = actualDistance - requiredDistance;
  
  return {
    isCompliant,
    actualDistance,
    requiredDistance,
    margin: Math.round(margin * 100) / 100,
    status: isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
    alert: !isCompliant ? `Jarak kurang ${Math.abs(margin).toFixed(2)}m - Risiko side flash!` : null
  };
}

/**
 * ============================================
 * 8. LIGHTNING PROTECTION ZONES (LPZ)
 * ============================================
 * Zonasi internal untuk proteksi surya
 */

export const LPZ_ZONES = {
  LPZ_0A: {
    id: 'LPZ_0A',
    name: 'LPZ 0A',
    description: 'Direct strike zone - tidak dilindungi dari sambaran langsung',
    threat: 'Full lightning current, full magnetic field',
    protection: 'Tidak aman untuk peralatan sensitif'
  },
  LPZ_0B: {
    id: 'LPZ_0B',
    name: 'LPZ 0B',
    description: 'Protected against direct strike',
    threat: 'Partial current, full magnetic field',
    protection: 'Dilindungi oleh LPS eksternal'
  },
  LPZ_1: {
    id: 'LPZ_1',
    name: 'LPZ 1',
    description: 'Limited surge current (shielded)',
    threat: 'Surge current limited by SPD at boundary',
    protection: 'Boundary LPZ 0-1 dengan SPD Type 1'
  },
  LPZ_2: {
    id: 'LPZ_2',
    name: 'LPZ 2',
    description: 'Surge protection installed at boundary',
    threat: 'Low surge current',
    protection: 'SPD Type 2 di boundary LPZ 1-2'
  },
  LPZ_3: {
    id: 'LPZ_3',
    name: 'LPZ 3+',
    description: 'Equipment zone with SPD protection',
    threat: 'Minimal surge',
    protection: 'SPD Type 3 di equipment'
  }
};

/**
 * ============================================
 * 9. SPD COORDINATION
 * ============================================
 */

export const SPD_TYPES = {
  TYPE_1: {
    id: 'TYPE_1',
    name: 'Tipe 1 (Class B)',
    location: 'Boundary LPZ 0-1',
    description: 'Direct lightning current SPD',
    impulseCurrent: 'Iimp 12.5/50 kA (10/350μs)',
    application: 'Main distribution board'
  },
  TYPE_2: {
    id: 'TYPE_2',
    name: 'Tipe 2 (Class C)',
    location: 'Boundary LPZ 1-2',
    description: 'Surge protection for switching transients',
    impulseCurrent: 'Imax 40/100 kA (8/20μs)',
    application: 'Sub-distribution boards'
  },
  TYPE_3: {
    id: 'TYPE_3',
    name: 'Tipe 3 (Class D)',
    location: 'Equipment',
    description: 'Fine protection for sensitive equipment',
    impulseCurrent: 'Imax 10/20 kA (8/20μs)',
    application: 'Socket outlets, equipment terminals'
  }
};

/**
 * ============================================
 * 10. MAGNETIC FIELD SHIELDING
 * ============================================
 * Perhitungan medan magnet induksi pada loop kabel
 * H = I × k / (2πd)
 */

/**
 * Hitung medan magnet induksi dari petir
 * @param {number} I - Arus petir (A) - tipikal 30kA
 * @param {number} d - Jarak dari konduktor (m)
 * @param {number} k - Faktor bentuk (0.01 untuk loop persegi)
 * @returns {number} Medan magnet (A/m)
 */
export function calculateMagneticField(I, d, k = 0.01) {
  const H = (I * k) / (2 * Math.PI * d);
  return Math.round(H * 100) / 100;
}

/**
 * Hitung tegangan induksi pada loop kabel
 * @param {number} H - Medan magnet (A/m)
 * @param {number} A - Luas loop (m²)
 * @param {number} riseTime - Rise time arus petir (s) - tipikal 10μs
 * @returns {number} Tegangan induksi (V)
 */
export function calculateInducedVoltage(H, A, riseTime = 10e-6) {
  const mu0 = 4 * Math.PI * 1e-7; // Permeabilitas ruang hampa
  const dHdt = H / riseTime;
  const V = mu0 * A * dHdt;
  return Math.round(V * 100) / 100;
}

/**
 * ============================================
 * 11. SNI DATABASE REFERENCE
 * ============================================
 */

export const SNI_REFERENCES = {
  '6': {
    pasal: 'Pasal 6',
    title: 'Risk Assessment',
    description: 'Penilaian risiko petir untuk menentukan kebutuhan LPS'
  },
  '8.1.2': {
    pasal: 'Pasal 8.1.2',
    title: 'Rolling Sphere Method',
    description: 'Metode bola berguling untuk penentuan zona perlindungan'
  },
  '8.2': {
    pasal: 'Pasal 8.2',
    title: 'Protection Angle Method',
    description: 'Metode sudut perlindungan untuk bangunan sederhana'
  },
  '8.3': {
    pasal: 'Pasal 8.3',
    title: 'Mesh Method',
    description: 'Metode mesh untuk air terminal pada atap datar'
  },
  '9.4': {
    pasal: 'Pasal 9.4',
    title: 'Natural Down Conductors',
    description: 'Penggunaan tulangan beton sebagai down conductor alami'
  },
  '10': {
    pasal: 'Pasal 10',
    title: 'Earthing System',
    description: 'Sistem pembumian untuk LPS'
  },
  '12': {
    pasal: 'Pasal 12',
    title: 'Separation Distance',
    description: 'Jarak aman untuk pencegahan side flash'
  },
  '12.3': {
    pasal: 'Pasal 12.3',
    title: 'SPD Coordination',
    description: 'Koordinasi surge protective device'
  }
};

/**
 * Generate kutipan pasal SNI
 * @param {string} pasal - Nomor pasal
 * @returns {Object} Referensi pasal
 */
export function getSNIReference(pasal) {
  return SNI_REFERENCES[pasal] || {
    pasal: `Pasal ${pasal}`,
    title: 'Referensi SNI',
    description: 'Lihat dokumen SNI 03-7015-2014 lengkap'
  };
}

/**
 * ============================================
 * 12. CONTINUITY TEST CALCULATOR
 * ============================================
 */

/**
 * Evaluasi hasil uji kontinuitas
 * @param {number} resistance - Resistansi terukur (Ω)
 * @param {number} limit - Batas maksimum (default 0.05Ω per SNI)
 * @returns {Object} Status uji kontinuitas
 */
export function evaluateContinuityTest(resistance, limit = 0.05) {
  const isPass = resistance <= limit;
  
  return {
    resistance: Math.round(resistance * 1000) / 1000,
    limit,
    isPass,
    status: isPass ? 'PASS' : 'FAIL',
    quality: resistance < 0.01 ? 'Excellent' : 
            resistance < 0.03 ? 'Good' : 
            resistance <= 0.05 ? 'Acceptable' : 'Poor',
    recommendation: !isPass 
      ? 'Periksa koneksi joint - resistansi terlalu tinggi, perlu perbaikan' 
      : 'Koneksi joint memenuhi syarat'
  };
}

/**
 * ============================================
 * 13. GROUNDING TEST - FALL OF POTENTIAL
 * ============================================
 */

/**
 * Evaluasi hasil uji resistansi pembumian dengan metode Fall of Potential
 * @param {number} measuredR - Resistansi terukur (Ω)
 * @param {number} targetR - Target resistansi (Ω)
 * @param {number} temperature - Suhu saat pengukuran (°C)
 * @returns {Object} Status pengujian
 */
export function evaluateGroundingTest(measuredR, targetR, temperature = 25) {
  // Koreksi suhu ke 20°C
  const Rcorrected = correctResistanceForTemperature(measuredR, temperature, 20);
  
  const isPass = Rcorrected <= targetR;
  const margin = targetR - Rcorrected;
  
  return {
    measuredResistance: measuredR,
    correctedResistance: Rcorrected,
    temperature,
    targetResistance: targetR,
    isPass,
    margin: Math.round(margin * 100) / 100,
    status: isPass ? 'PASS' : 'FAIL',
    recommendation: !isPass 
      ? `Resistansi grounding melebihi target. Pertimbangkan: 1) Tambah ground rod, 2) Gunakan soil treatment, 3) Perbesar grid`
      : 'Sistem grounding memenuhi syarat'
  };
}

/**
 * ============================================
 * EXPORT ALL FUNCTIONS
 * ============================================
 */
export default {
  // Risk Assessment
  calculateCollectionArea,
  calculateStrikeFrequency,
  calculateRiskAssessment,
  ENVIRONMENT_FACTORS,
  BUILDING_CLASSES,
  LPL_LEVELS,
  
  // Rolling Sphere
  calculateRollingSphereProtection,
  isPointProtected,
  
  // Protection Angle
  getProtectionAngle,
  calculateProtectionZone,
  
  // Mesh
  getMeshSize,
  calculateMeshRequirements,
  
  // Grounding
  calculateSingleRodResistance,
  calculateMultipleRodResistance,
  calculateGridResistance,
  classifySoil,
  getGroundingTarget,
  
  // Soil Resistivity
  calculateSoilResistivity,
  correctResistanceForTemperature,
  
  // Separation Distance
  calculateSeparationDistance,
  SEPARATION_FACTORS,
  checkSeparationCompliance,
  
  // LPZ & SPD
  LPZ_ZONES,
  SPD_TYPES,
  
  // Magnetic Field
  calculateMagneticField,
  calculateInducedVoltage,
  
  // SNI Reference
  SNI_REFERENCES,
  getSNIReference,
  
  // Tests
  evaluateContinuityTest,
  evaluateGroundingTest
};
