/**
 * NDT/MDT MATERIAL TESTING CALCULATORS
 * Berbasis SNI dan ASTM standards
 */

// ==========================================
// SCHMIDT HAMMER TEST (ASTM C805)
// ==========================================

/**
 * Koreksi sudut pukulan Schmidt Hammer
 * @param {number} Rn - Rebound number
 * @param {number} angle - Sudut pukulan (0=horizontal, 90=atas, -90=bawah)
 * @returns {number} Rn terkoreksi
 */
export function correctReboundNumber(Rn, angle = 0) {
  // Koreksi berdasarkan ASTM C805
  const corrections = {
    90: 1.15,   // Pukulan dari bawah ke atas
    45: 1.08,   // 45 derajat ke atas
    0: 1.0,     // Horizontal
    '-45': 0.92, // 45 derajat ke bawah
    '-90': 0.85  // Pukulan dari atas ke bawah
  };
  
  const correction = corrections[angle] || 1.0;
  return Rn * correction;
}

/**
 * Konversi Rebound Number ke kuat tekan beton (fc')
 * Menggunakan kurva standar ASTM C805 / SNI
 * @param {number} Rn - Rebound number (sudah terkoreksi)
 * @returns {number} fc' dalam MPa
 */
export function calculateFcFromRebound(Rn) {
  // Formula empiris berbasis ASTM C805
  // fc' = 0.0117 * Rn^2 + 0.8845 * Rn - 8.1916
  const fc = 0.0117 * Math.pow(Rn, 2) + 0.8845 * Rn - 8.1916;
  return Math.max(0, fc); // Tidak negatif
}

/**
 * Uji Grubbs untuk deteksi outlier
 * @param {number[]} data - Array nilai
 * @param {number} alpha - Significance level (default 0.05)
 * @returns {object} Hasil uji outlier
 */
export function grubbsTest(data, alpha = 0.05) {
  const n = data.length;
  if (n < 3) return { outliers: [], cleaned: data, statistics: null };
  
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (n - 1));
  
  const G_critical = getGrubbsCriticalValue(n, alpha);
  
  const outliers = [];
  const cleaned = [];
  
  data.forEach(value => {
    const G = Math.abs(value - mean) / std;
    if (G > G_critical) {
      outliers.push({ value, G, mean, std });
    } else {
      cleaned.push(value);
    }
  });
  
  return {
    outliers,
    cleaned,
    statistics: {
      mean,
      std,
      G_critical,
      n
    }
  };
}

function getGrubbsCriticalValue(n, alpha) {
  // Tabel kritis Grubbs untuk α = 0.05
  const criticalValues = {
    3: 1.153, 4: 1.463, 5: 1.672, 6: 1.822, 7: 1.938,
    8: 2.032, 9: 2.110, 10: 2.176, 11: 2.234, 12: 2.285,
    13: 2.331, 14: 2.371, 15: 2.409, 16: 2.443, 17: 2.475,
    18: 2.504, 19: 2.532, 20: 2.557, 21: 2.580, 22: 2.603,
    23: 2.624, 24: 2.644, 25: 2.663, 30: 2.745, 35: 2.811,
    40: 2.866, 50: 2.956, 100: 3.207
  };
  
  return criticalValues[n] || 3.0;
}

/**
 * Analisis lengkap Schmidt Hammer
 * @param {number[]} readings - 10 nilai pantul
 * @param {number} angle - Sudut pukulan
 * @returns {object} Hasil analisis lengkap
 */
export function analyzeSchmidtHammer(readings, angle = 0) {
  if (!readings || readings.length === 0) {
    return { error: 'Data tidak valid' };
  }
  
  // 1. Koreksi sudut
  const correctedReadings = readings.map(Rn => correctReboundNumber(Rn, angle));
  
  // 2. Deteksi outlier dengan Grubbs
  const grubbsResult = grubbsTest(correctedReadings);
  
  // 3. Hitung statistik
  const validReadings = grubbsResult.cleaned;
  const n = validReadings.length;
  const meanRn = validReadings.reduce((a, b) => a + b, 0) / n;
  const minRn = Math.min(...validReadings);
  const maxRn = Math.max(...validReadings);
  const stdRn = Math.sqrt(validReadings.reduce((sq, x) => sq + Math.pow(x - meanRn, 2), 0) / (n - 1));
  const cv = (stdRn / meanRn) * 100; // Coefficient of variation
  
  // 4. Konversi ke fc'
  const fc = calculateFcFromRebound(meanRn);
  const fcMin = calculateFcFromRebound(minRn);
  const fcMax = calculateFcFromRebound(maxRn);
  
  // 5. Klasifikasi kualitas beton
  let quality;
  if (fc >= 30) quality = { label: 'Sangat Baik (K-300+)', color: '#22c55e' };
  else if (fc >= 25) quality = { label: 'Baik (K-250)', color: '#84cc16' };
  else if (fc >= 20) quality = { label: 'Sedang (K-200)', color: '#eab308' };
  else if (fc >= 15) quality = { label: 'Kurang (K-150)', color: '#f97316' };
  else quality = { label: 'Buruk (< K-150)', color: '#ef4444' };
  
  // 6. Compliance SNI 2847:2019
  const compliance = fc >= 20.75; // Minimum K-250
  
  return {
    input: {
      rawReadings: readings,
      angle,
      correctedReadings
    },
    statistics: {
      n,
      meanRn: Math.round(meanRn * 100) / 100,
      minRn: Math.round(minRn * 100) / 100,
      maxRn: Math.round(maxRn * 100) / 100,
      stdRn: Math.round(stdRn * 100) / 100,
      cv: Math.round(cv * 100) / 100
    },
    grubbsTest: {
      outliers: grubbsResult.outliers,
      outliersRemoved: readings.length - n,
      criticalValue: grubbsResult.statistics?.G_critical
    },
    concrete: {
      fc: Math.round(fc * 100) / 100,
      fcMin: Math.round(fcMin * 100) / 100,
      fcMax: Math.round(fcMax * 100) / 100,
      fcChar: Math.round((fc - 1.64 * stdRn * 0.0117) * 100) / 100 // Karakteristik
    },
    quality,
    compliance: {
      sni2847: compliance,
      message: compliance ? 'Memenuhi SNI 2847:2019 (K-250)' : 'Di bawah SNI 2847:2019'
    }
  };
}

// ==========================================
// UPV - ULTRASONIC PULSE VELOCITY (ASTM C597)
// ==========================================

/**
 * Klasifikasi kualitas beton berdasarkan UPV
 * @param {number} velocity - Pulse velocity (km/s)
 * @returns {object} Klasifikasi kualitas
 */
export function classifyUPV(velocity) {
  // Klasifikasi berdasarkan ASTM C597 / SNI
  if (velocity >= 4.5) {
    return { label: 'Excellent', quality: 'Sangat Baik', color: '#22c55e', description: 'Beton padat, tidak ada void' };
  } else if (velocity >= 4.0) {
    return { label: 'Very Good', quality: 'Baik Sekali', color: '#84cc16', description: 'Kualitas beton tinggi' };
  } else if (velocity >= 3.5) {
    return { label: 'Good', quality: 'Baik', color: '#22d3ee', description: 'Kualitas beton normal' };
  } else if (velocity >= 3.0) {
    return { label: 'Fair', quality: 'Sedang', color: '#eab308', description: 'Ada keretakan/halusinasi' };
  } else if (velocity >= 2.0) {
    return { label: 'Poor', quality: 'Kurang', color: '#f97316', description: 'Keretakan signifikan atau honeycomb' };
  } else {
    return { label: 'Very Poor', quality: 'Buruk', color: '#ef4444', description: 'Kerusakan serius, void besar' };
  }
}

/**
 * Analisis UPV lengkap
 * @param {number} time - Waktu tempuh (μs)
 * @param {number} distance - Jarak transduser (mm)
 * @returns {object} Hasil analisis
 */
export function analyzeUPV(time, distance) {
  if (!time || !distance || time <= 0) {
    return { error: 'Data tidak valid' };
  }
  
  // Hitung kecepatan (km/s)
  const velocity = (distance / 1000) / (time / 1000000); // mm/μs → km/s
  
  // Estimasi kuat tekan berdasarkan korelasi UPV-fc'
  // Formula: fc' = 0.0056 * V^3.6 (empiris)
  const fcEstimate = 0.0056 * Math.pow(velocity, 3.6);
  
  // Modulus elastisitas dinamis
  // Ed = ρ * V^2 * (1+μ)(1-2μ)/(1-μ)
  // Asumsi: ρ = 2400 kg/m3, μ = 0.2
  const rho = 2400;
  const mu = 0.2;
  const Ed = rho * Math.pow(velocity * 1000, 2) * (1 + mu) * (1 - 2 * mu) / (1 - mu) / 1000000; // MPa
  
  return {
    input: { time, distance },
    velocity: Math.round(velocity * 100) / 100,
    classification: classifyUPV(velocity),
    concrete: {
      fcEstimate: Math.round(fcEstimate * 100) / 100,
      dynamicModulus: Math.round(Ed * 100) / 100
    },
    unit: {
      velocity: 'km/s',
      fc: 'MPa',
      Ed: 'GPa'
    }
  };
}

// ==========================================
// CORE DRILL TEST (ASTM C42)
// ==========================================

/**
 * Analisis Core Drill
 * @param {number} diameter - Diameter core (mm)
 * @param {number} height - Tinggi core (mm)
 * @param {number} maxLoad - Beban maksimum (kN)
 * @param {number} l_d_ratio - Ratio L/D (default 2.0)
 * @returns {object} Hasil analisis
 */
export function analyzeCoreDrill(diameter, height, maxLoad, l_d_ratio = 2.0) {
  if (!diameter || !maxLoad || diameter <= 0) {
    return { error: 'Data tidak valid' };
  }
  
  // Hitung area
  const area = Math.PI * Math.pow(diameter / 2, 2); // mm²
  
  // Kuat tekan core
  const fc_core = (maxLoad * 1000) / area; // MPa
  
  // Koreksi L/D ratio (ASTM C42)
  // Faktor koreksi untuk L/D < 2.0
  let correctionFactor = 1.0;
  if (l_d_ratio < 1.0) {
    correctionFactor = 0.75;
  } else if (l_d_ratio < 1.75) {
    correctionFactor = 0.85;
  } else if (l_d_ratio < 2.0) {
    correctionFactor = 0.95;
  }
  
  const fc_corrected = fc_core * correctionFactor;
  
  // Konversi ke silinder 150x300mm (faktor 0.8)
  const fc_cylinder = fc_corrected * 0.8;
  
  // Klasifikasi
  let strengthClass;
  if (fc_cylinder >= 50) strengthClass = 'K-500';
  else if (fc_cylinder >= 40) strengthClass = 'K-400';
  else if (fc_cylinder >= 35) strengthClass = 'K-350';
  else if (fc_cylinder >= 30) strengthClass = 'K-300';
  else if (fc_cylinder >= 25) strengthClass = 'K-250';
  else if (fc_cylinder >= 20) strengthClass = 'K-200';
  else strengthClass = '< K-200';
  
  return {
    input: { diameter, height, maxLoad, l_d_ratio },
    geometry: {
      area: Math.round(area * 100) / 100,
      l_d_ratio: Math.round(l_d_ratio * 100) / 100
    },
    strength: {
      fcCore: Math.round(fc_core * 100) / 100,
      fcCorrected: Math.round(fc_corrected * 100) / 100,
      fcCylinder: Math.round(fc_cylinder * 100) / 100,
      class: strengthClass
    },
    correction: {
      factor: correctionFactor,
      reason: l_d_ratio < 2.0 ? 'L/D ratio correction' : 'None'
    }
  };
}

// ==========================================
// REBAR SCANNER
// ==========================================

/**
 * Verifikasi hasil scanning tulangan
 * @param {object} scanned - Hasil scanning
 * @param {object} design - Data desain
 * @returns {object} Hasil verifikasi
 */
export function verifyRebar(scanned, design) {
  const checks = [];
  
  // Cek diameter
  const diaDiff = Math.abs(scanned.diameter - design.diameter);
  const diaOk = diaDiff <= 2; // Toleransi 2mm
  checks.push({
    item: 'Diameter',
    scanned: scanned.diameter,
    design: design.diameter,
    diff: diaDiff,
    status: diaOk ? 'OK' : 'NG',
    tolerance: '±2mm'
  });
  
  // Cek cover
  const coverDiff = Math.abs(scanned.cover - design.cover);
  const coverOk = coverDiff <= 5; // Toleransi 5mm
  checks.push({
    item: 'Cover',
    scanned: scanned.cover,
    design: design.cover,
    diff: coverDiff,
    status: coverOk ? 'OK' : 'NG',
    tolerance: '±5mm'
  });
  
  // Cek spacing (jika ada)
  if (scanned.spacing && design.spacing) {
    const spacingDiff = Math.abs(scanned.spacing - design.spacing);
    const spacingOk = spacingDiff <= 20; // Toleransi 20mm
    checks.push({
      item: 'Spacing',
      scanned: scanned.spacing,
      design: design.spacing,
      diff: spacingDiff,
      status: spacingOk ? 'OK' : 'NG',
      tolerance: '±20mm'
    });
  }
  
  const allOk = checks.every(c => c.status === 'OK');
  
  return {
    checks,
    overall: allOk ? 'ACCEPTABLE' : 'NOT ACCEPTABLE',
    recommendation: allOk 
      ? 'Hasil scanning sesuai dengan gambar desain'
      : 'Terdapat penyimpangan dari gambar desain, perlu evaluasi lebih lanjut'
  };
}

// ==========================================
// ULTRASONIC THICKNESS GAUGE (UTG) - BAJA
// ==========================================

/**
 * Evaluasi penipisan baja
 * @param {number} nominal - Tebal nominal (mm)
 * @param {number} measured - Tebal terukur (mm)
 * @param {string} element - Elemen (flange/web)
 * @returns {object} Hasil evaluasi
 */
export function evaluateSteelThickness(nominal, measured, element = 'flange') {
  const loss = nominal - measured;
  const lossPercent = (loss / nominal) * 100;
  const remainingPercent = (measured / nominal) * 100;
  
  // Batas penipisan berdasarkan SNI
  // Flange: max 10%, Web: max 15%
  const limit = element === 'flange' ? 10 : 15;
  const acceptable = lossPercent <= limit;
  
  // Remaining capacity
  const remainingCapacity = Math.pow(measured / nominal, 2); // Kapasitas proporsional terhadap kuat geser
  
  let condition;
  if (lossPercent <= 5) {
    condition = { label: 'Baik', color: '#22c55e', priority: 'Low' };
  } else if (lossPercent <= 10) {
    condition = { label: 'Sedang', color: '#eab308', priority: 'Medium' };
  } else if (lossPercent <= 15) {
    condition = { label: 'Kurang', color: '#f97316', priority: 'High' };
  } else {
    condition = { label: 'Kritis', color: '#ef4444', priority: 'Critical' };
  }
  
  return {
    input: { nominal, measured, element },
    loss: {
      absolute: Math.round(loss * 100) / 100,
      percent: Math.round(lossPercent * 100) / 100
    },
    remaining: {
      thickness: measured,
      percent: Math.round(remainingPercent * 100) / 100,
      capacity: Math.round(remainingCapacity * 100) / 100
    },
    assessment: {
      acceptable,
      limit: limit + '%',
      condition,
      action: acceptable 
        ? 'Lanjutkan monitoring rutin'
        : 'Perlu perbaikan/penguatan struktural'
    }
  };
}

// ==========================================
// COMBINED ANALYSIS
// ==========================================

/**
 * Analisis kombinasi Schmidt + UPV untuk estimasi kuat tekan yang lebih akurat
 * @param {object} schmidtResult - Hasil analisis Schmidt
 * @param {object} upvResult - Hasil analisis UPV
 * @returns {object} Hasil analisis kombinasi
 */
export function combinedNDTAnalysis(schmidtResult, upvResult) {
  if (schmidtResult.error || upvResult.error) {
    return { error: 'Data input tidak lengkap' };
  }
  
  const fcSchmidt = schmidtResult.concrete.fc;
  const fcUPV = upvResult.concrete.fcEstimate;
  
  // Weighted average (Schmidt lebih akurat untuk surface, UPV untuk internal)
  // Weight 60% Schmidt, 40% UPV
  const fcCombined = 0.6 * fcSchmidt + 0.4 * fcUPV;
  
  // Koreksi berdasarkan kecepatan UPV (kualitas internal)
  let correction = 1.0;
  if (upvResult.velocity >= 4.0) correction = 1.0; // Baik
  else if (upvResult.velocity >= 3.5) correction = 0.95;
  else if (upvResult.velocity >= 3.0) correction = 0.90;
  else correction = 0.85;
  
  const fcCorrected = fcCombined * correction;
  
  return {
    methods: {
      schmidt: fcSchmidt,
      upv: fcUPV
    },
    combined: {
      raw: Math.round(fcCombined * 100) / 100,
      corrected: Math.round(fcCorrected * 100) / 100
    },
    quality: schmidtResult.quality,
    internalQuality: upvResult.classification,
    recommendation: `Kuat tekan estimasi: ${Math.round(fcCorrected * 100) / 100} MPa (${schmidtResult.quality.label})`
  };
}
