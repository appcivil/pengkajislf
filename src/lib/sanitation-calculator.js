/**
 * SANITATION CALCULATOR LIBRARY
 * Perhitungan Sistem Pembuangan Kotoran dan Sampah
 * Berdasarkan: PP 16/2021 Pasal 224, SNI 03-3981-1995, SNI 2398:2017, Permen PU No. 4/PRT/M/2017
 * 
 * Fitur:
 * 1. Perhitungan Volume Septic Tank
 * 2. Perhitungan Dimensi Chute
 * 3. Perhitungan Kemiringan Pipa (Manning's Formula)
 * 4. Analisis Removal Efficiency IPAL
 * 5. Validasi Jarak Aman
 * 6. Estimasi Produksi Lumpur
 */

// ============================================================
// STANDARDS & CONSTANTS
// ============================================================

export const SANITATION_STANDARDS = {
  // SNI 03-3981-1995 - Septic Tank
  SEPTIC_TANK: {
    MIN_VOLUME_M3: 1.8,
    BASE_POPULATION: 5,
    VOLUME_PER_PERSON_M3: 0.12,
    SLUDGE_PER_PERSON_L_PER_DAY: 0.5,
    COMPARTMENT_RATIO: { SEDIMENTATION: 2, DIGESTION: 1 },
    MIN_DESLUDGING_INTERVAL_YEARS: 3
  },
  
  // PP 16/2021 Pasal 224 - Inlet/Chute
  CHUTE: {
    MIN_DIMENSION_M: 0.6,
    MIN_AREA_M2: 0.36,
    MIN_SLOPE_PERCENT: 2.0, // 2% or 1:50
    CORRECTION_FACTORS: {
      RESIDENTIAL: 1.0,
      COMMERCIAL: 1.2,
      HOSPITAL: 1.5,
      INDUSTRIAL: 2.0,
      HOTEL: 1.3,
      RESTAURANT: 1.4
    }
  },
  
  // SNI 2398:2017 - Pipa Pembuangan
  PIPE: {
    MIN_SLOPE_PERCENT: 2.0,
    MIN_VELOCITY_M_S: 0.6,
    MAX_VELOCITY_M_S: 3.0,
    ROUGHNESS_PVC: 0.013,
    ROUGHNESS_CONCRETE: 0.015,
    ROUGHNESS_CLAY: 0.014
  },
  
  // Baku Mutu - PM 68/2016 & PP 16/2021
  EFFLUENT_STANDARDS: {
    BOD_MG_L: 30,
    TSS_MG_L: 50,
    PH_MIN: 6,
    PH_MAX: 9,
    COLIFORM_MPN_100ML: 1000,
    MIN_REMOVAL_EFFICIENCY_PERCENT: 80
  },
  
  // Jarak Aman - PP 16/2021 & SNI
  SAFETY_DISTANCE: {
    TO_WELL_MIN_M: 10,
    TO_BUILDING_MIN_M: 2,
    TO_WATER_SOURCE_MIN_M: 10,
    TO_BOUNDARY_MIN_M: 1.5
  }
};

// Legal References for Auto-citation
export const LEGAL_REFERENCES = {
  PP_16_2021_PASAL_224: {
    title: 'PP Nomor 16 Tahun 2021 Pasal 224',
    description: 'Sistem pembuangan kotoran dan sampah harus memenuhi persyaratan teknis',
    details: [
      'Ayat (8) huruf a: Dimensi inlet/saluran pembuangan sampah',
      'Ayat (8) huruf b: Volume dan konstruksi penampungan',
      'Ayat (8) huruf c: Kualitas pengolahan air limbah'
    ]
  },
  SNI_03_3981_1995: {
    title: 'SNI 03-3981-1995',
    description: 'Tata cara perencanaan septic tank',
    details: [
      'Volume minimum 1.8 m³ untuk 5 orang',
      'Kompartemenasi 2:1 (sedimentasi:pembusukan)',
      'Kedap air untuk mencegah rembesan'
    ]
  },
  SNI_2398_2017: {
    title: 'SNI 2398:2017',
    description: 'Spesifikasi pipa pembuangan air kotor',
    details: [
      'Kemiringan minimum 2% (1:50)',
      'Kecepatan aliran 0.6 - 3.0 m/s',
      'Kriteria self-cleansing velocity'
    ]
  },
  PERMEN_PU_4_2017: {
    title: 'Permen PU No. 4/PRT/M/2017',
    description: 'Persyaratan teknis sistem pembuangan air limbah',
    details: [
      'Jarak septic tank ke sumber air minum',
      'Konstruksi kedap air',
      'Pengolahan air limbah domestik'
    ]
  },
  PM_68_2016: {
    title: 'Permen LHK No. 68 Tahun 2016',
    description: 'Baku mutu air limbah domestik',
    details: [
      'BOD maksimum 30 mg/L',
      'TSS maksimum 50 mg/L',
      'pH 6-9',
      'Coliform maksimum 1000 MPN/100mL'
    ]
  }
};

// ============================================================
// 1. PERHITUNGAN VOLUME SEPTIC TANK (SNI 03-3981-1995)
// ============================================================

/**
 * Menghitung volume septic tank berdasarkan jumlah penghuni
 * Formula: V = 1.8m³ + (N-5) × 0.12m³ untuk N > 5
 * 
 * @param {number} population - Jumlah penghuni (orang)
 * @param {number} waterUsage - Konsumsi air per orang per hari (L/hari), default 100
 * @param {number} desludgingInterval - Interval pengurasan (tahun), default 3
 * @returns {Object} Hasil perhitungan volume septic tank
 */
export function calculateSepticTankVolume(population, waterUsage = 100, desludgingInterval = 3) {
  const std = SANITATION_STANDARDS.SEPTIC_TANK;
  
  // Validasi input
  if (!population || population < 1) {
    throw new Error('Jumlah penghuni minimal 1 orang');
  }
  
  // Kapasitas minimum untuk 5 orang = 1.8 m³
  const baseVolume = std.MIN_VOLUME_M3;
  
  // Volume tambahan untuk penghuni > 5: 0.12 m³ per orang
  const additionalVolume = Math.max(0, population - std.BASE_POPULATION) * std.VOLUME_PER_PERSON_M3;
  
  // Volume lumpur yang terakumulasi
  // 0.5 L/org/hari × 365 hari × tahun / 1000 = m³
  const sludgeVolume = (population * std.SLUDGE_PER_PERSON_L_PER_DAY * 365 * desludgingInterval) / 1000;
  
  // Total volume minimal
  const minVolume = baseVolume + additionalVolume;
  
  // Volume total dengan pertimbangan lumpur (safety factor 10%)
  const totalVolume = minVolume + (sludgeVolume * 0.1);
  
  // Kompartemenasi (2:1)
  const compartment1 = (minVolume * std.COMPARTMENT_RATIO.SEDIMENTATION / 
    (std.COMPARTMENT_RATIO.SEDIMENTATION + std.COMPARTMENT_RATIO.DIGESTION));
  const compartment2 = (minVolume * std.COMPARTMENT_RATIO.DIGESTION / 
    (std.COMPARTMENT_RATIO.SEDIMENTATION + std.COMPARTMENT_RATIO.DIGESTION));
  
  // Hitung tanggal pengurasan berikutnya
  const today = new Date();
  const nextDesludging = new Date(today.getTime() + desludgingInterval * 365 * 24 * 60 * 60 * 1000);
  
  // Prediksi pengurasan berdasarkan akumulasi lumpur
  const daysUntilFull = Math.floor((minVolume * 0.7 * 1000) / (population * std.SLUDGE_PER_PERSON_L_PER_DAY));
  const predictedFullDate = new Date(today.getTime() + daysUntilFull * 24 * 60 * 60 * 1000);
  
  return {
    // Input parameters
    population,
    waterUsage,
    desludgingInterval,
    
    // Volume calculations
    baseVolume: baseVolume.toFixed(2),
    additionalVolume: additionalVolume.toFixed(2),
    minVolume: minVolume.toFixed(2),
    sludgeVolume: sludgeVolume.toFixed(2),
    totalVolume: totalVolume.toFixed(2),
    recommendedVolume: (minVolume * 1.1).toFixed(2), // 10% safety factor
    
    // Compartment breakdown
    compartment1: compartment1.toFixed(2),
    compartment2: compartment2.toFixed(2),
    compartmentRatio: `${std.COMPARTMENT_RATIO.SEDIMENTATION}:${std.COMPARTMENT_RATIO.DIGESTION}`,
    
    // Desludging predictions
    nextDesludging: nextDesludging.toLocaleDateString('id-ID'),
    predictedFullDate: predictedFullDate.toLocaleDateString('id-ID'),
    daysUntilFull,
    
    // Compliance status
    status: minVolume >= std.MIN_VOLUME_M3 ? 'C' : 'NC',
    complianceMessage: minVolume >= std.MIN_VOLUME_M3 
      ? 'Volume septic tank memenuhi SNI 03-3981-1995'
      : `Volume tidak memenuhi minimum ${std.MIN_VOLUME_M3} m³`,
    
    // Formula used
    formula: `V = ${baseVolume} + (${Math.max(0, population - std.BASE_POPULATION)} × ${std.VOLUME_PER_PERSON_M3}) = ${minVolume.toFixed(2)} m³`,
    sludgeFormula: `Lumpur = ${population} × ${std.SLUDGE_PER_PERSON_L_PER_DAY} L/hari × 365 hari × ${desludgingInterval} tahun`
  };
}

/**
 * Menghitung dimensi fisik septic tank berdasarkan volume
 * @param {number} volume - Volume total (m³)
 * @param {number} depth - Kedalaman desired (m), default 2
 * @param {number} width - Lebar desired (m), default 1.2
 * @returns {Object} Dimensi yang dihitung
 */
export function calculateSepticTankDimensions(volume, depth = 2.0, width = 1.2) {
  const vol = parseFloat(volume);
  const d = parseFloat(depth);
  const w = parseFloat(width);
  
  // Hitung panjang yang diperlukan
  const length = vol / (d * w);
  
  // Validasi dimensi minimum
  const MIN_DEPTH = 1.5;
  const MIN_WIDTH = 0.8;
  const MIN_LENGTH = 1.5;
  
  return {
    volume: vol.toFixed(2),
    depth: d.toFixed(2),
    width: w.toFixed(2),
    length: length.toFixed(2),
    surfaceArea: (length * w).toFixed(2),
    
    validations: {
      depthValid: d >= MIN_DEPTH,
      widthValid: w >= MIN_WIDTH,
      lengthValid: length >= MIN_LENGTH,
      ratioValid: (length / w) >= 1.5 && (length / w) <= 4
    },
    
    recommendations: [
      !d >= MIN_DEPTH && `Kedalaman minimal ${MIN_DEPTH}m direkomendasikan`,
      !w >= MIN_WIDTH && `Lebar minimal ${MIN_WIDTH}m direkomendasikan`,
      !length >= MIN_LENGTH && `Panjang minimal ${MIN_LENGTH}m direkomendasikan`
    ].filter(Boolean)
  };
}

// ============================================================
// 2. PERHITUNGAN DIMENSI CHUTE (PP 16/2021 Pasal 224)
// ============================================================

/**
 * Menghitung dimensi chute/saluran sampah vertikal
 * 
 * @param {number} buildingHeight - Tinggi bangunan (m)
 * @param {number} wasteGeneration - Timbulan sampah (kg/hari)
 * @param {string} buildingType - Tipe bangunan (residential/commercial/hospital/industrial)
 * @param {number} numUnits - Jumlah unit/hunian
 * @returns {Object} Hasil perhitungan dimensi chute
 */
export function calculateChuteDimension(buildingHeight, wasteGeneration, buildingType = 'residential', numUnits = 1) {
  const std = SANITATION_STANDARDS.CHUTE;
  const correctionFactor = std.CORRECTION_FACTORS[buildingType.toUpperCase()] || 1.0;
  
  // Standar minimal 0.6m × 0.6m = 0.36 m²
  const minArea = std.MIN_AREA_M2;
  const minDimension = std.MIN_DIMENSION_M;
  
  // Kecepatan jatuh bebas untuk estimasi waktu tempuh
  // v = √(2gh), t = √(2h/g)
  const g = 9.81; // m/s²
  const fallTime = Math.sqrt((2 * buildingHeight) / g);
  const velocity = Math.sqrt(2 * g * buildingHeight);
  
  // Estimasi area yang diperlukan
  // Asumsi: 150 kg/m²/day loading dengan koreksi tipe bangunan
  const baseLoading = 150; // kg/m²/day
  const requiredArea = (wasteGeneration / baseLoading) * correctionFactor;
  
  // Untuk bangunan tinggi, pertimbangkan tambahan area
  const heightFactor = buildingHeight > 20 ? 1.1 : buildingHeight > 10 ? 1.05 : 1.0;
  const adjustedRequiredArea = requiredArea * heightFactor;
  
  // Hitung dimensi optimal
  const actualArea = Math.max(minArea, adjustedRequiredArea);
  const sideDimension = Math.sqrt(actualArea);
  
  // Jumlah chute yang direkomendasikan
  const recommendedChutes = Math.ceil(wasteGeneration / (baseLoading * minArea * 0.8));
  
  return {
    // Input
    buildingHeight,
    wasteGeneration,
    buildingType,
    numUnits,
    correctionFactor,
    
    // Minimum requirements
    minDimension,
    minArea: minArea.toFixed(2),
    
    // Calculated requirements
    requiredArea: adjustedRequiredArea.toFixed(2),
    actualArea: actualArea.toFixed(2),
    sideDimension: sideDimension.toFixed(2),
    
    // Recommendations
    recommendedChutes,
    recommendedDimension: Math.max(minDimension, sideDimension).toFixed(2),
    
    // Physics calculations
    fallTime: fallTime.toFixed(2),
    velocity: velocity.toFixed(2),
    
    // Compliance
    status: adjustedRequiredArea <= minArea ? 'C' : 'NC',
    complianceMessage: adjustedRequiredArea <= minArea
      ? 'Dimensi chute memenuhi PP 16/2021 Pasal 224'
      : 'Dimensi chute tidak memenuhi standar minimum',
    
    // Recommendations
    recommendation: adjustedRequiredArea > minArea 
      ? `Tambahkan ${recommendedChutes > 1 ? recommendedChutes + ' unit' : 'chute tambahan'} atau perbesar dimensi menjadi ${(sideDimension * 1.2).toFixed(2)}m × ${(sideDimension * 1.2).toFixed(2)}m`
      : 'Dimensi chute memenuhi syarat',
    
    formula: `Area = (${wasteGeneration} kg / ${baseLoading} kg/m²) × ${correctionFactor} = ${requiredArea.toFixed(2)} m²`
  };
}

/**
 * Validasi kemiringan chute
 * @param {number} slope - Kemiringan aktual (%)
 * @returns {Object} Hasil validasi
 */
export function validateChuteSlope(slope) {
  const minSlope = SANITATION_STANDARDS.PIPE.MIN_SLOPE_PERCENT;
  
  return {
    actualSlope: slope,
    minSlope,
    isValid: slope >= minSlope,
    status: slope >= minSlope ? 'C' : 'NC',
    message: slope >= minSlope
      ? `Kemiringan ${slope}% memenuhi minimum ${minSlope}%`
      : `Kemiringan ${slope}% kurang dari minimum ${minSlope}%`,
    recommendation: slope < minSlope 
      ? 'Perbesar kemiringan atau tambahkan sistem flushing'
      : null
  };
}

// ============================================================
// 3. PERHITUNGAN KEMIRINGAN PIPA (Manning's Formula)
// ============================================================

/**
 * Menghitung kemiringan pipa menggunakan formula Manning
 * Formula: Q = (1/n) × A × R^(2/3) × S^(1/2)
 * Sehingga: S = (Q × n / (A × R^(2/3)))^2
 * 
 * @param {number} diameter - Diameter pipa (mm)
 * @param {number} flowRate - Debit aliran (L/hari)
 * @param {string} pipeMaterial - Material pipa (pvc/concrete/clay)
 * @returns {Object} Hasil perhitungan kemiringan
 */
export function calculatePipeSlope(diameter, flowRate, pipeMaterial = 'pvc') {
  const std = SANITATION_STANDARDS.PIPE;
  
  // Pilih roughness coefficient
  const roughness = {
    'pvc': std.ROUGHNESS_PVC,
    'concrete': std.ROUGHNESS_CONCRETE,
    'clay': std.ROUGHNESS_CLAY
  }[pipeMaterial.toLowerCase()] || std.ROUGHNESS_PVC;
  
  // Konversi unit
  const D = diameter / 1000; // mm ke m
  const Q = flowRate / 86400; // L/hari ke m³/s (1 hari = 86400 detik)
  
  // Hydraulic radius untuk pipa penuh: R = D/4
  const R = D / 4;
  
  // Luas penampang pipa penuh: A = π × D² / 4
  const A = Math.PI * Math.pow(D, 2) / 4;
  
  // Manning's equation: S = (Q × n / (A × R^(2/3)))^2
  const R_pow = Math.pow(R, 2/3);
  const slope = Math.pow((Q * roughness) / (A * R_pow), 2);
  
  // Minimal 2% (0.02) untuk self-cleansing velocity
  const minSlope = std.MIN_SLOPE_PERCENT / 100;
  const actualSlope = Math.max(slope, minSlope);
  
  // Hitung kecepatan aliran aktual
  // v = (1/n) × R^(2/3) × S^(1/2)
  const velocity = (1/roughness) * R_pow * Math.sqrt(actualSlope);
  
  // Cek self-cleansing velocity (minimum 0.6 m/s)
  const selfCleansing = velocity >= std.MIN_VELOCITY_M_S;
  
  return {
    // Input
    diameter,
    flowRate,
    pipeMaterial,
    roughness,
    
    // Calculations
    calculatedSlope: slope.toFixed(4),
    calculatedSlopePercent: (slope * 100).toFixed(2),
    requiredSlope: minSlope,
    requiredSlopePercent: std.MIN_SLOPE_PERCENT,
    actualSlope: actualSlope.toFixed(4),
    actualSlopePercent: (actualSlope * 100).toFixed(2),
    
    // Velocity
    velocity: velocity.toFixed(2),
    velocityStatus: velocity >= std.MIN_VELOCITY_M_S && velocity <= std.MAX_VELOCITY_M_S ? 'OK' : 
                    velocity < std.MIN_VELOCITY_M_S ? 'TOO_LOW' : 'TOO_HIGH',
    minVelocity: std.MIN_VELOCITY_M_S,
    maxVelocity: std.MAX_VELOCITY_M_S,
    selfCleansing,
    
    // Geometry
    hydraulicRadius: R.toFixed(4),
    crossSectionalArea: A.toFixed(4),
    
    // Compliance
    status: slope >= minSlope && selfCleansing ? 'C' : 'NC',
    complianceMessage: slope >= minSlope 
      ? `Kemiringan ${(slope * 100).toFixed(2)}% memenuhi minimum ${std.MIN_SLOPE_PERCENT}%`
      : `Kemiringan ${(slope * 100).toFixed(2)}% kurang dari minimum ${std.MIN_SLOPE_PERCENT}%`,
    
    // Recommendation
    recommendation: slope < minSlope 
      ? `Perbesar kemiringan minimal ${std.MIN_SLOPE_PERCENT}% atau gunakan pipa diameter lebih besar`
      : !selfCleansing 
        ? 'Kecepatan aliran kurang dari 0.6 m/s, pertimbangkan penambahan slope'
        : 'Kemiringan dan kecepatan memenuhi standar',
    
    formula: `S = (Q×n / (A×R^(2/3)))^2 = (${Q.toExponential(2)}×${roughness} / (${A.toFixed(4)}×${R_pow.toFixed(4)}))^2 = ${slope.toFixed(4)}`
  };
}

/**
 * Kalkulator hidrolik lengkap untuk sistem pembuangan
 * @param {Array} pipeSegments - Array segmen pipa [{diameter, length, flowRate, material}]
 * @returns {Object} Analisis hidrolik lengkap
 */
export function calculateHydraulicProfile(pipeSegments) {
  const results = pipeSegments.map((segment, index) => {
    const slope = calculatePipeSlope(segment.diameter, segment.flowRate, segment.material);
    const headLoss = slope.actualSlope * segment.length;
    
    return {
      segment: index + 1,
      ...segment,
      ...slope,
      headLoss: headLoss.toFixed(2),
      elevationDrop: (slope.actualSlopePercent * segment.length / 100).toFixed(2)
    };
  });
  
  const totalHeadLoss = results.reduce((sum, r) => sum + parseFloat(r.headLoss), 0);
  const allCompliant = results.every(r => r.status === 'C');
  
  return {
    segments: results,
    totalHeadLoss: totalHeadLoss.toFixed(2),
    overallStatus: allCompliant ? 'C' : 'NC',
    criticalSegments: results.filter(r => r.status === 'NC').map(r => r.segment)
  };
}

// ============================================================
// 4. ANALISIS REMOVAL EFFICIENCY IPAL
// ============================================================

/**
 * Menghitung efisiensi pengolahan IPAL
 * 
 * @param {number} bodInlet - BOD inlet (mg/L)
 * @param {number} bodOutlet - BOD outlet (mg/L)
 * @param {number} tssInlet - TSS inlet (mg/L)
 * @param {number} tssOutlet - TSS outlet (mg/L)
 * @param {number} ph - pH effluent
 * @param {number} coliform - Coliform (MPN/100mL)
 * @returns {Object} Hasil analisis efisiensi
 */
export function calculateTreatmentEfficiency(bodInlet, bodOutlet, tssInlet, tssOutlet, ph = 7, coliform = 0) {
  const std = SANITATION_STANDARDS.EFFLUENT_STANDARDS;
  
  // Hitung removal efficiency
  const bodRemoval = bodInlet > 0 ? ((bodInlet - bodOutlet) / bodInlet * 100) : 0;
  const tssRemoval = tssInlet > 0 ? ((tssInlet - tssOutlet) / tssInlet * 100) : 0;
  
  // Cek compliance dengan baku mutu
  const bodCompliance = bodOutlet <= std.BOD_MG_L;
  const tssCompliance = tssOutlet <= std.TSS_MG_L;
  const phCompliance = ph >= std.PH_MIN && ph <= std.PH_MAX;
  const coliformCompliance = coliform <= std.COLIFORM_MPN_100ML || coliform === 0;
  
  // Cek removal efficiency target
  const bodRemovalTarget = std.MIN_REMOVAL_EFFICIENCY_PERCENT;
  const bodRemovalCompliance = bodRemoval >= bodRemovalTarget;
  
  // Overall compliance
  const allCompliant = bodCompliance && tssCompliance && phCompliance && coliformCompliance;
  
  // Generate recommendations
  const recommendations = [];
  if (!bodCompliance) {
    recommendations.push('BOD melebihi baku mutu. Periksa media biofilter aerob atau tambahkan retention time.');
  }
  if (!bodRemovalCompliance) {
    recommendations.push(`Efisiensi BOD ${bodRemoval.toFixed(1)}% kurang dari target ${bodRemovalTarget}%. Evaluasi kinerja unit anaerob dan aerob.`);
  }
  if (!tssCompliance) {
    recommendations.push('TSS melebihi baku mutu. Periksa unit pengendapan atau filter.');
  }
  if (!phCompliance) {
    recommendations.push(`pH ${ph} di luar rentang 6-9. Periksa kondisi proses biological.`);
  }
  if (!coliformCompliance && coliform > 0) {
    recommendations.push('Coliform melebihi baku mutu. Pertimbangkan penambahan unit disinfeksi (klorin/UV).');
  }
  
  return {
    // Input values
    inlet: { bod: bodInlet, tss: tssInlet },
    outlet: { bod: bodOutlet, tss: tssOutlet, ph, coliform },
    
    // Removal efficiency
    bodRemoval: bodRemoval.toFixed(2) + '%',
    bodRemovalValue: bodRemoval,
    tssRemoval: tssRemoval.toFixed(2) + '%',
    tssRemovalValue: tssRemoval,
    
    // Standards
    standards: {
      bod: std.BOD_MG_L,
      tss: std.TSS_MG_L,
      phMin: std.PH_MIN,
      phMax: std.PH_MAX,
      coliform: std.COLIFORM_MPN_100ML,
      minRemoval: std.MIN_REMOVAL_EFFICIENCY_PERCENT
    },
    
    // Compliance status
    compliance: {
      bod: bodCompliance ? 'Memenuhi' : 'Tidak Memenuhi',
      bodRemoval: bodRemovalCompliance ? 'Memenuhi' : 'Tidak Memenuhi',
      tss: tssCompliance ? 'Memenuhi' : 'Tidak Memenuhi',
      ph: phCompliance ? 'Memenuhi' : 'Tidak Memenuhi',
      coliform: coliformCompliance ? 'Memenuhi' : 'Tidak Memenuhi'
    },
    
    // Overall status
    status: allCompliant ? 'C' : 'NC',
    overallCompliance: allCompliant ? 'Memenuhi Baku Mutu' : 'Tidak Memenuhi Baku Mutu',
    
    // Recommendations
    recommendations: recommendations.length > 0 ? recommendations : ['Operasional normal'],
    
    // Formulas
    formulas: {
      bod: `Removal BOD = (${bodInlet} - ${bodOutlet}) / ${bodInlet} × 100% = ${bodRemoval.toFixed(2)}%`,
      tss: `Removal TSS = (${tssInlet} - ${tssOutlet}) / ${tssInlet} × 100% = ${tssRemoval.toFixed(2)}%`
    }
  };
}

/**
 * Kalkulator volume IPAL Biofilter
 * @param {number} population - Jumlah penghuni
 * @param {number} bodLoad - Beban BOD per orang per hari (g/org/hari), default 40
 * @returns {Object} Volume kompartemen IPAL
 */
export function calculateIPALVolume(population, bodLoad = 40) {
  // Beban BOD harian total (kg/hari)
  const totalBOD = (population * bodLoad) / 1000;
  
  // Volume kompartemen berdasarkan beban BOD dan retention time
  // Anaerob: 30% dari total, retention time 2-4 hari
  // Aerob: 50% dari total, retention time 4-6 hari
  // Pengendapan akhir: 20% dari total
  
  const baseVolume = totalBOD * 6; // 6 hari retention time per kg BOD
  
  const anaerobVolume = baseVolume * 0.30;
  const aerobVolume = baseVolume * 0.50;
  const settlingVolume = baseVolume * 0.20;
  const totalVolume = anaerobVolume + aerobVolume + settlingVolume;
  
  return {
    population,
    bodLoad,
    totalBOD: totalBOD.toFixed(3),
    
    compartments: {
      anaerob: {
        volume: anaerobVolume.toFixed(2),
        percentage: '30%',
        retentionTime: '2-4 hari',
        purpose: 'Penguraian anaerobik awal'
      },
      aerob: {
        volume: aerobVolume.toFixed(2),
        percentage: '50%',
        retentionTime: '4-6 hari',
        purpose: 'Penguraian aerobik (biofilter)'
      },
      settling: {
        volume: settlingVolume.toFixed(2),
        percentage: '20%',
        retentionTime: '2 hari',
        purpose: 'Pengendapan akhir'
      }
    },
    
    totalVolume: totalVolume.toFixed(2),
    volumePerPerson: (totalVolume / population).toFixed(2),
    
    recommendations: [
      `Bak anaerob: ${anaerobVolume.toFixed(2)} m³ (30%)`,
      `Bak aerob: ${aerobVolume.toFixed(2)} m³ (50%)`,
      `Bak pengendap: ${settlingVolume.toFixed(2)} m³ (20%)`
    ]
  };
}

// ============================================================
// 5. VALIDASI JARAK AMAN
// ============================================================

/**
 * Menghitung jarak antara dua koordinat menggunakan formula Haversine
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} Jarak dalam meter
 */
export function calculateHaversineDistance(coord1, coord2) {
  const toRad = (x) => x * Math.PI / 180;
  const R = 6371; // Radius bumi dalam km
  
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = R * c;
  
  return distanceKm * 1000; // Konversi ke meter
}

/**
 * Validasi jarak aman septic tank dan IPAL
 * @param {Object} tankCoords - Koordinat tank {lat, lng}
 * @param {Object} wellCoords - Koordinat sumur {lat, lng}
 * @param {Object} buildingCoords - Koordinat bangunan {lat, lng}
 * @param {Object} waterSourceCoords - Koordinat sumber air lain {lat, lng}
 * @returns {Object} Hasil validasi jarak
 */
export function calculateSafetyDistance(tankCoords, wellCoords, buildingCoords, waterSourceCoords = null) {
  const std = SANITATION_STANDARDS.SAFETY_DISTANCE;
  
  // Hitung jarak ke sumur
  const distToWell = tankCoords && wellCoords 
    ? calculateHaversineDistance(tankCoords, wellCoords)
    : null;
  
  // Hitung jarak ke bangunan
  const distToBuilding = tankCoords && buildingCoords
    ? calculateHaversineDistance(tankCoords, buildingCoords)
    : null;
  
  // Hitung jarak ke sumber air lain
  const distToWaterSource = tankCoords && waterSourceCoords
    ? calculateHaversineDistance(tankCoords, waterSourceCoords)
    : null;
  
  // Cek compliance
  const wellCompliance = distToWell !== null ? distToWell >= std.TO_WELL_MIN_M : null;
  const buildingCompliance = distToBuilding !== null ? distToBuilding >= std.TO_BUILDING_MIN_M : null;
  const waterSourceCompliance = distToWaterSource !== null ? distToWaterSource >= std.TO_WATER_SOURCE_MIN_M : null;
  
  // Overall status
  const allChecked = [wellCompliance, buildingCompliance, waterSourceCompliance].filter(c => c !== null);
  const overallStatus = allChecked.length > 0 && allChecked.every(c => c === true) ? 'C' : 'NC';
  
  // Generate recommendations
  const recommendations = [];
  if (wellCompliance === false) {
    recommendations.push(`Jarak ke sumur ${distToWell.toFixed(1)}m kurang dari minimum ${std.TO_WELL_MIN_M}m. Pertimbangkan relokasi atau penambahan pelindung.`);
  }
  if (buildingCompliance === false) {
    recommendations.push(`Jarak ke bangunan ${distToBuilding.toFixed(1)}m kurang dari minimum ${std.TO_BUILDING_MIN_M}m. Pastikan konstruksi kedap air.`);
  }
  if (waterSourceCompliance === false) {
    recommendations.push(`Jarak ke sumber air ${distToWaterSource.toFixed(1)}m kurang dari minimum ${std.TO_WATER_SOURCE_MIN_M}m. Wajib relokasi.`);
  }
  
  return {
    distances: {
      toWell: distToWell !== null ? distToWell.toFixed(2) : null,
      toBuilding: distToBuilding !== null ? distToBuilding.toFixed(2) : null,
      toWaterSource: distToWaterSource !== null ? distToWaterSource.toFixed(2) : null
    },
    
    standards: {
      toWell: std.TO_WELL_MIN_M,
      toBuilding: std.TO_BUILDING_MIN_M,
      toWaterSource: std.TO_WATER_SOURCE_MIN_M
    },
    
    compliance: {
      toWell: wellCompliance,
      toBuilding: buildingCompliance,
      toWaterSource: waterSourceCompliance
    },
    
    status: overallStatus,
    allCompliant: allChecked.every(c => c === true),
    
    recommendations: recommendations.length > 0 ? recommendations : ['Jarak aman memenuhi semua standar'],
    
    legalReference: distToWell !== null && !wellCompliance 
      ? 'PP 16/2021 dan SNI 03-3981-1995: Jarak septik tank ke sumur minimal 10m'
      : null
  };
}

/**
 * Validasi jarak manual (tanpa koordinat GPS)
 * @param {number} distanceToWell - Jarak ke sumur (m)
 * @param {number} distanceToBuilding - Jarak ke bangunan (m)
 * @param {number} distanceToWaterSource - Jarak ke sumber air (m)
 * @returns {Object} Hasil validasi
 */
export function validateSafetyDistanceManual(distanceToWell, distanceToBuilding, distanceToWaterSource = null) {
  const std = SANITATION_STANDARDS.SAFETY_DISTANCE;
  
  const wellCompliance = distanceToWell >= std.TO_WELL_MIN_M;
  const buildingCompliance = distanceToBuilding >= std.TO_BUILDING_MIN_M;
  const waterSourceCompliance = distanceToWaterSource !== null ? distanceToWaterSource >= std.TO_WATER_SOURCE_MIN_M : null;
  
  const allChecked = [wellCompliance, buildingCompliance];
  if (waterSourceCompliance !== null) allChecked.push(waterSourceCompliance);
  
  return {
    distances: {
      toWell: distanceToWell,
      toBuilding: distanceToBuilding,
      toWaterSource: distanceToWaterSource
    },
    compliance: {
      toWell: wellCompliance,
      toBuilding: buildingCompliance,
      toWaterSource: waterSourceCompliance
    },
    status: allChecked.every(c => c === true) ? 'C' : 'NC',
    violations: [
      !wellCompliance && `Jarak ke sumur kurang dari ${std.TO_WELL_MIN_M}m`,
      !buildingCompliance && `Jarak ke bangunan kurang dari ${std.TO_BUILDING_MIN_M}m`,
      waterSourceCompliance === false && `Jarak ke sumber air kurang dari ${std.TO_WATER_SOURCE_MIN_M}m`
    ].filter(Boolean)
  };
}

// ============================================================
// 6. ESTIMASI PRODUKSI LUMPUR
// ============================================================

/**
 * Menghitung estimasi produksi lumpur dan jadwal pengurasan
 * @param {number} population - Jumlah penghuni
 * @param {number} tankVolume - Volume septic tank (m³)
 * @param {number} currentSludgeLevel - Tingkat pengisian lumpur saat ini (%)
 * @returns {Object} Estimasi produksi lumpur
 */
export function calculateSludgeProduction(population, tankVolume, currentSludgeLevel = 0) {
  const std = SANITATION_STANDARDS.SEPTIC_TANK;
  
  // Produksi lumpur harian (L/hari)
  const dailyProduction = population * std.SLUDGE_PER_PERSON_L_PER_DAY;
  
  // Produksi tahunan (m³/tahun)
  const yearlyProduction = (dailyProduction * 365) / 1000;
  
  // Kapasitas lumpur maksimum (70% dari volume tank untuk lumpur)
  const maxSludgeCapacity = tankVolume * 0.7;
  
  // Lumpur saat ini (m³)
  const currentSludge = (currentSludgeLevel / 100) * tankVolume;
  
  // Sisa kapasitas lumpur
  const remainingCapacity = maxSludgeCapacity - currentSludge;
  
  // Estimasi hari sampai penuh
  const daysUntilFull = Math.floor((remainingCapacity * 1000) / dailyProduction);
  
  // Tanggal prediksi penuh
  const today = new Date();
  const fullDate = new Date(today.getTime() + daysUntilFull * 24 * 60 * 60 * 1000);
  
  // Rekomendasi tanggal pengurasan (saat mencapai 80%)
  const desludgingLevel = maxSludgeCapacity * 0.8;
  const daysUntilDesludging = Math.floor(((desludgingLevel - currentSludge) * 1000) / dailyProduction);
  const desludgingDate = new Date(today.getTime() + daysUntilDesludging * 24 * 60 * 60 * 1000);
  
  // Status pengurasan
  let urgencyLevel = 'NORMAL';
  if (currentSludgeLevel >= 70) urgencyLevel = 'CRITICAL';
  else if (currentSludgeLevel >= 50) urgencyLevel = 'HIGH';
  else if (currentSludgeLevel >= 30) urgencyLevel = 'MEDIUM';
  
  return {
    // Production rates
    dailyProduction: dailyProduction.toFixed(1),
    dailyProductionLiters: dailyProduction,
    yearlyProduction: yearlyProduction.toFixed(2),
    
    // Capacity calculations
    tankVolume,
    maxSludgeCapacity: maxSludgeCapacity.toFixed(2),
    currentSludgeLevel,
    currentSludgeVolume: currentSludge.toFixed(2),
    remainingCapacity: remainingCapacity.toFixed(2),
    
    // Predictions
    daysUntilFull,
    predictedFullDate: fullDate.toLocaleDateString('id-ID'),
    daysUntilDesludging,
    recommendedDesludgingDate: desludgingDate.toLocaleDateString('id-ID'),
    
    // Status
    urgencyLevel,
    urgencyColor: {
      'NORMAL': 'green',
      'MEDIUM': 'yellow',
      'HIGH': 'orange',
      'CRITICAL': 'red'
    }[urgencyLevel],
    
    // Recommendations
    recommendation: urgencyLevel === 'CRITICAL' 
      ? 'Segera lakukan pengurasan! Tingkat lumpur sudah kritis.'
      : urgencyLevel === 'HIGH'
        ? 'Jadwalkan pengurasan dalam waktu dekat.'
        : urgencyLevel === 'MEDIUM'
          ? 'Monitor tingkat lumpur dan jadwalkan pengurasan preventif.'
          : 'Tingkat lumpur normal. Lanjutkan pemantauan rutin.',
    
    formulas: {
      daily: `${population} org × ${std.SLUDGE_PER_PERSON_L_PER_DAY} L/org/hari = ${dailyProduction} L/hari`,
      yearly: `${dailyProduction} L × 365 hari / 1000 = ${yearlyProduction.toFixed(2)} m³/tahun`,
      maxCapacity: `${tankVolume} m³ × 70% = ${maxSludgeCapacity.toFixed(2)} m³`
    }
  };
}

// ============================================================
// 7. UJI KEDAP AIR (WATER TIGHTNESS TEST)
// ============================================================

/**
 * Menghitung tingkat kebocoran dari uji kedap air
 * @param {number} initialWaterLevel - Tinggi air awal (m)
 * @param {number} finalWaterLevel - Tinggi air akhir (m)
 * @param {number} tankArea - Luas permukaan air (m²)
 * @param {number} duration - Durasi pengujian (jam)
 * @returns {Object} Hasil uji kedap air
 */
export function calculateWaterTightness(initialWaterLevel, finalWaterLevel, tankArea, duration) {
  // Penurunan tinggi air (m)
  const levelDrop = initialWaterLevel - finalWaterLevel;
  
  // Volume kehilangan (L)
  const volumeLoss = levelDrop * tankArea * 1000;
  
  // Laju kebocoran (L/m²/jam)
  const leakageRate = volumeLoss / (tankArea * duration);
  
  // Standar: maksimum 1 L/m²/hari = 0.042 L/m²/jam
  const standardRate = 0.042; // L/m²/jam
  const standardDaily = 1.0; // L/m²/hari
  
  // Konversi ke L/m²/hari
  const leakageRateDaily = leakageRate * 24;
  
  // Status uji
  const passed = leakageRateDaily <= standardDaily;
  
  return {
    initialWaterLevel,
    finalWaterLevel,
    levelDrop: levelDrop.toFixed(3),
    tankArea,
    duration,
    
    volumeLoss: volumeLoss.toFixed(1),
    leakageRate: leakageRate.toFixed(4),
    leakageRateDaily: leakageRateDaily.toFixed(2),
    
    standard: {
      hourly: standardRate.toFixed(4),
      daily: standardDaily.toFixed(1)
    },
    
    status: passed ? 'LOLOS' : 'TIDAK LOLOS',
    passed,
    
    message: passed 
      ? `Tingkat kebocoran ${leakageRateDaily.toFixed(2)} L/m²/hari memenuhi standar < ${standardDaily} L/m²/hari`
      : `Tingkat kebocoran ${leakageRateDaily.toFixed(2)} L/m²/hari melebihi standar ${standardDaily} L/m²/hari`,
    
    recommendation: !passed 
      ? 'Perbaiki waterproofing pada dinding dan lantai tank. Lakukan perbaikan retak dan perkuat seal.'
      : 'Konstruksi kedap air memenuhi persyaratan',
    
    formula: `Kebocoran = ${levelDrop.toFixed(3)}m × ${tankArea}m² × 1000 / (${duration}jam × ${tankArea}m²) = ${leakageRate.toFixed(4)} L/m²/jam`
  };
}

// ============================================================
// 8. COMPLIANCE CHECKER & AUTO-CITATION
// ============================================================

/**
 * Memeriksa compliance berdasarkan PP 16/2021 Pasal 224
 * @param {Object} inspectionData - Data hasil inspeksi
 * @returns {Object} Status compliance lengkap
 */
export function checkPP16Compliance(inspectionData) {
  const results = {
    pasal224: {
      title: 'PP 16/2021 Pasal 224',
      ayat: {}
    }
  };
  
  // Ayat (8) huruf a - Dimensi inlet
  if (inspectionData.chute) {
    const chute = inspectionData.chute;
    results.pasal224.ayat['8a'] = {
      title: 'Ayat (8) huruf a - Dimensi Inlet',
      items: [
        {
          description: 'Dimensi chute/saluran pembuangan sampah',
          standard: 'Minimum 0.6m × 0.6m',
          measured: `${chute.dimension}m × ${chute.dimension}m`,
          status: chute.compliant ? 'C' : 'NC'
        },
        {
          description: 'Kemiringan saluran vertikal',
          standard: 'Minimum 2%',
          measured: `${chute.slope}%`,
          status: chute.slope >= 2 ? 'C' : 'NC'
        }
      ]
    };
  }
  
  // Ayat (8) huruf b - Volume penampungan
  if (inspectionData.septicTank) {
    const tank = inspectionData.septicTank;
    const std = SANITATION_STANDARDS.SEPTIC_TANK;
    results.pasal224.ayat['8b'] = {
      title: 'Ayat (8) huruf b - Volume Penampungan',
      items: [
        {
          description: 'Volume septic tank minimum',
          standard: `≥ ${std.MIN_VOLUME_M3} m³ (SNI 03-3981-1995)`,
          measured: `${tank.volume} m³`,
          status: tank.volume >= std.MIN_VOLUME_M3 ? 'C' : 'NC'
        },
        {
          description: 'Rasio kompartemen sedimentasi:pembusukan',
          standard: '2:1',
          measured: tank.compartmentRatio || 'Tidak diukur',
          status: tank.compartmentRatio === '2:1' ? 'C' : 'NC'
        },
        {
          description: 'Jarak ke sumur gali',
          standard: '≥ 10 m',
          measured: `${tank.distanceToWell} m`,
          status: tank.distanceToWell >= 10 ? 'C' : 'NC'
        },
        {
          description: 'Jarak ke bangunan',
          standard: '≥ 2 m',
          measured: `${tank.distanceToBuilding} m`,
          status: tank.distanceToBuilding >= 2 ? 'C' : 'NC'
        }
      ]
    };
  }
  
  // Ayat (8) huruf c - Kualitas pengolahan
  if (inspectionData.effluent) {
    const eff = inspectionData.effluent;
    const std = SANITATION_STANDARDS.EFFLUENT_STANDARDS;
    results.pasal224.ayat['8c'] = {
      title: 'Ayat (8) huruf c - Kualitas Pengolahan',
      items: [
        {
          description: 'BOD effluent',
          standard: `≤ ${std.BOD_MG_L} mg/L (PM 68/2016)`,
          measured: `${eff.bod} mg/L`,
          status: eff.bod <= std.BOD_MG_L ? 'C' : 'NC'
        },
        {
          description: 'TSS effluent',
          standard: `≤ ${std.TSS_MG_L} mg/L (PM 68/2016)`,
          measured: `${eff.tss} mg/L`,
          status: eff.tss <= std.TSS_MG_L ? 'C' : 'NC'
        },
        {
          description: 'pH effluent',
          standard: `${std.PH_MIN} - ${std.PH_MAX}`,
          measured: eff.ph,
          status: (eff.ph >= std.PH_MIN && eff.ph <= std.PH_MAX) ? 'C' : 'NC'
        },
        {
          description: 'Efisiensi pengurangan BOD',
          standard: `≥ ${std.MIN_REMOVAL_EFFICIENCY_PERCENT}%`,
          measured: `${eff.bodRemoval}%`,
          status: eff.bodRemoval >= std.MIN_REMOVAL_EFFICIENCY_PERCENT ? 'C' : 'NC'
        }
      ]
    };
  }
  
  // Hitung overall compliance
  let totalItems = 0;
  let compliantItems = 0;
  
  Object.values(results.pasal224.ayat).forEach(ayat => {
    ayat.items.forEach(item => {
      totalItems++;
      if (item.status === 'C') compliantItems++;
    });
  });
  
  results.summary = {
    totalItems,
    compliantItems,
    nonCompliantItems: totalItems - compliantItems,
    complianceRate: totalItems > 0 ? ((compliantItems / totalItems) * 100).toFixed(1) : 0,
    overallStatus: totalItems > 0 && compliantItems === totalItems ? 'C' : 'NC'
  };
  
  return results;
}

/**
 * Generate kutipan pasal otomatis berdasarkan temuan
 * @param {Array} findings - Array temuan inspeksi
 * @returns {Array} Kutipan pasal yang relevan
 */
export function generateLegalCitations(findings) {
  const citations = [];
  
  findings.forEach(finding => {
    switch (finding.type) {
      case 'SEPTIC_VOLUME_INSUFFICIENT':
        citations.push({
          pasal: 'SNI 03-3981-1995',
          title: 'Tata Cara Perencanaan Septic Tank',
          quote: 'Volume septic tank minimum untuk 5 orang adalah 1,8 m³. Untuk setiap penambahan 1 orang, volume ditambah 0,12 m³.',
          recommendation: 'Perbesar volume septic tank atau tambahkan unit baru sesuai jumlah penghuni.',
          priority: 'HIGH'
        });
        break;
        
      case 'DISTANCE_TO_WELL_INSUFFICIENT':
        citations.push({
          pasal: 'PP 16/2021 Pasal 224',
          title: 'Sistem Pembuangan Kotoran dan Sampah',
          quote: 'Jarak septik tank ke sumur gali minimal 10 meter untuk mencegah kontaminasi air tanah.',
          recommendation: 'Relokasi septik tank atau sumur, atau tambahkan pelindung kedap air.',
          priority: 'CRITICAL'
        });
        break;
        
      case 'CHUTE_DIMENSION_INSUFFICIENT':
        citations.push({
          pasal: 'PP 16/2021 Pasal 224 Ayat (8) huruf a',
          title: 'Dimensi Inlet/Saluran Sampah',
          quote: 'Dimensi saluran vertikal sampah minimal 0,6m × 0,6m untuk memastikan aliran lancar.',
          recommendation: 'Perbesar dimensi chute atau tambahkan unit chute tambahan.',
          priority: 'MEDIUM'
        });
        break;
        
      case 'EFFLUENT_NON_COMPLIANT':
        citations.push({
          pasal: 'Permen LHK No. 68 Tahun 2016',
          title: 'Baku Mutu Air Limbah Domestik',
          quote: 'Baku mutu BOD maksimum 30 mg/L, TSS maksimum 50 mg/L, pH 6-9.',
          recommendation: 'Periksa kinerja unit pengolahan (biofilter, pengendapan), evaluasi retention time.',
          priority: 'HIGH'
        });
        break;
        
      case 'PIPE_SLOPE_INSUFFICIENT':
        citations.push({
          pasal: 'SNI 2398:2017',
          title: 'Pipa Pembuangan Air Kotor',
          quote: 'Kemiringan pipa minimal 2% (1:50) untuk mencapai self-cleansing velocity 0,6 m/s.',
          recommendation: 'Perbesar kemiringan pipa atau gunakan diameter lebih besar.',
          priority: 'MEDIUM'
        });
        break;
        
      case 'WATER_TIGHTNESS_FAILED':
        citations.push({
          pasal: 'Permen PU No. 4/PRT/M/2017',
          title: 'Konstruksi Kedap Air',
          quote: 'Septic tank harus kedap air dengan tingkat kebocoran maksimum 1 L/m²/hari.',
          recommendation: 'Perbaiki waterproofing, seal retak, dan perkuat struktur tank.',
          priority: 'HIGH'
        });
        break;
        
      case 'SLUDGE_LEVEL_CRITICAL':
        citations.push({
          pasal: 'SNI 03-3981-1995',
          title: 'Pengurasan Septic Tank',
          quote: 'Septic tank harus dikuras setiap 3-5 tahun atau jika tingkat lumpur mencapai 70%.',
          recommendation: 'Segera lakukan pengurasan oleh penyedia jasa berizin.',
          priority: 'HIGH'
        });
        break;
    }
  });
  
  return citations;
}

// ============================================================
// 9. SIMULASI WHAT-IF
// ============================================================

/**
 * Simulasi skenario what-if untuk perbaikan sistem
 * @param {Object} currentParams - Parameter sistem saat ini
 * @param {Object} changes - Perubahan yang di-simulasikan
 * @returns {Object} Hasil simulasi
 */
export function simulateWhatIf(currentParams, changes) {
  const results = {
    current: {},
    simulated: {},
    comparison: {}
  };
  
  // Simulasi penambahan penghuni
  if (changes.populationIncrease) {
    const newPopulation = currentParams.population + changes.populationIncrease;
    
    const currentVolume = calculateSepticTankVolume(currentParams.population);
    const newVolume = calculateSepticTankVolume(newPopulation);
    
    results.current.septicTank = currentVolume;
    results.simulated.septicTank = newVolume;
    results.comparison.septicTank = {
      populationChange: `+${changes.populationIncrease} orang`,
      volumeChange: `${currentVolume.minVolume} → ${newVolume.minVolume} m³`,
      action: newVolume.minVolume > currentVolume.minVolume 
        ? `Perlu penambahan volume ${(newVolume.minVolume - currentVolume.minVolume).toFixed(2)} m³`
        : 'Volume masih mencukupi'
    };
  }
  
  // Simulasi perubahan IPAL
  if (changes.ipalUpgrade) {
    const currentIPAL = calculateIPALVolume(currentParams.population);
    const upgradedIPAL = calculateIPALVolume(currentParams.population, changes.ipalUpgrade.bodLoad);
    
    results.current.ipal = currentIPAL;
    results.simulated.ipal = upgradedIPAL;
    results.comparison.ipal = {
      volumeChange: `${currentIPAL.totalVolume} → ${upgradedIPAL.totalVolume} m³`,
      efficiency: `Efisiensi meningkat dengan volume aerob lebih besar`
    };
  }
  
  // Simulasi perubahan dimensi chute
  if (changes.chuteUpgrade) {
    const currentChute = calculateChuteDimension(
      currentParams.buildingHeight, 
      currentParams.wasteGeneration, 
      currentParams.buildingType
    );
    const upgradedChute = calculateChuteDimension(
      changes.chuteUpgrade.buildingHeight || currentParams.buildingHeight,
      changes.chuteUpgrade.wasteGeneration || currentParams.wasteGeneration,
      changes.chuteUpgrade.buildingType || currentParams.buildingType
    );
    
    results.current.chute = currentChute;
    results.simulated.chute = upgradedChute;
    results.comparison.chute = {
      dimensionChange: `${currentChute.sideDimension}m → ${upgradedChute.sideDimension}m`,
      compliance: upgradedChute.status === 'C' ? 'Memenuhi standar' : 'Masih tidak memenuhi'
    };
  }
  
  return results;
}

// ============================================================
// 10. UTILITY FUNCTIONS
// ============================================================

/**
 * Format angka dengan satuan
 * @param {number} value - Nilai
 * @param {string} unit - Satuan
 * @returns {string} Nilai terformat
 */
export function formatWithUnit(value, unit) {
  if (value === null || value === undefined) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return `${num.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${unit}`;
}

/**
 * Generate status badge
 * @param {string} status - Status (C/NC/PASS/FAIL)
 * @returns {string} HTML badge
 */
export function getStatusBadge(status) {
  const styles = {
    'C': { bg: 'hsla(158, 85%, 45%, 0.2)', color: 'var(--success-400)', icon: 'fa-check', text: 'COMPLIANT' },
    'NC': { bg: 'hsla(0, 85%, 60%, 0.2)', color: 'var(--danger-400)', icon: 'fa-xmark', text: 'NON-COMPLIANT' },
    'PASS': { bg: 'hsla(158, 85%, 45%, 0.2)', color: 'var(--success-400)', icon: 'fa-check', text: 'PASS' },
    'FAIL': { bg: 'hsla(0, 85%, 60%, 0.2)', color: 'var(--danger-400)', icon: 'fa-xmark', text: 'FAIL' },
    'LOLOS': { bg: 'hsla(158, 85%, 45%, 0.2)', color: 'var(--success-400)', icon: 'fa-check', text: 'LOLOS' },
    'TIDAK LOLOS': { bg: 'hsla(0, 85%, 60%, 0.2)', color: 'var(--danger-400)', icon: 'fa-xmark', text: 'TIDAK LOLOS' }
  };
  
  const style = styles[status] || styles['NC'];
  
  return `<span class="badge" style="background: ${style.bg}; color: ${style.color}; border: 1px solid ${style.color}44; font-size: 10px;">
    <i class="fas ${style.icon}" style="margin-right: 4px;"></i>${style.text}
  </span>`;
}

/**
 * Export semua fungsi kalkulator
 */
export default {
  calculateSepticTankVolume,
  calculateSepticTankDimensions,
  calculateChuteDimension,
  validateChuteSlope,
  calculatePipeSlope,
  calculateHydraulicProfile,
  calculateTreatmentEfficiency,
  calculateIPALVolume,
  calculateHaversineDistance,
  calculateSafetyDistance,
  validateSafetyDistanceManual,
  calculateSludgeProduction,
  calculateWaterTightness,
  checkPP16Compliance,
  generateLegalCitations,
  simulateWhatIf,
  formatWithUnit,
  getStatusBadge,
  SANITATION_STANDARDS,
  LEGAL_REFERENCES
};
