// ============================================================
// ELECTRICAL SYSTEM INSPECTION - CALCULATION ENGINE
// PUIL 2020, SNI 0225:2011, IEC 60364, ASCE 41-17
// ============================================================

import {
  DERATING_FACTORS,
  THERMAL_GRADES,
  LOADING_STATUS,
  PHASE_IMBALANCE_THRESHOLD,
  CABLE_RATINGS,
  VOLTAGE_DROP_LIMITS,
  PUIL_DATABASE
} from './electrical-constants.js';

// ============================================================
// 1. POWER CALCULATIONS
// ============================================================

/**
 * Calculate electrical power parameters
 * @param {Object} params - Input parameters
 * @param {number} params.voltage - Voltage in Volts
 * @param {number} params.current - Current in Amperes
 * @param {number} params.powerFactor - cos φ (0-1)
 * @param {number} params.phases - 1 or 3 phases
 * @returns {Object} Power calculation results
 */
export function calculatePower({ voltage, current, powerFactor, phases = 3 }) {
  const sqrt3 = Math.sqrt(3);
  
  if (phases === 3) {
    // 3-phase calculations
    const P = voltage * current * powerFactor * sqrt3; // Active Power (W)
    const S = voltage * current * sqrt3;               // Apparent Power (VA)
    const Q = Math.sqrt(S * S - P * P);                // Reactive Power (VAR)
    
    return {
      activePower: P,           // Watt
      activePowerKW: (P / 1000).toFixed(2),      // kW
      apparentPower: S,         // VA
      apparentPowerKVA: (S / 1000).toFixed(2),   // kVA
      reactivePower: Q,         // VAR
      reactivePowerKVAR: (Q / 1000).toFixed(2),  // kVAR
      powerFactor: powerFactor,
      current: current,
      voltage: voltage,
      phases: phases
    };
  } else {
    // 1-phase calculations
    const P = voltage * current * powerFactor;
    const S = voltage * current;
    const Q = Math.sqrt(Math.max(0, S * S - P * P));
    
    return {
      activePower: P,
      activePowerKW: (P / 1000).toFixed(2),
      apparentPower: S,
      apparentPowerKVA: (S / 1000).toFixed(2),
      reactivePower: Q,
      reactivePowerKVAR: (Q / 1000).toFixed(2),
      powerFactor: powerFactor,
      current: current,
      voltage: voltage,
      phases: phases
    };
  }
}

/**
 * Estimate kWh consumption
 * @param {number} powerKW - Power in kW
 * @param {number} hours - Operating hours per day
 * @param {number} days - Days per month
 * @param {number} loadFactor - Load factor (0-1)
 * @returns {Object} Energy consumption estimates
 */
export function estimateEnergyConsumption(powerKW, hours = 8, days = 30, loadFactor = 0.7) {
  const dailyKWh = powerKW * hours * loadFactor;
  const monthlyKWh = dailyKWh * days;
  const yearlyKWh = monthlyKWh * 12;
  
  return {
    dailyKWh: dailyKWh.toFixed(2),
    monthlyKWh: monthlyKWh.toFixed(2),
    yearlyKWh: yearlyKWh.toFixed(2),
    parameters: { hours, days, loadFactor }
  };
}

// ============================================================
// 2. LOADING & CAPACITY CALCULATIONS
// ============================================================

/**
 * Calculate actual loading percentage with derating factor
 * @param {number} measuredCurrent - Measured current in Amperes
 * @param {number} ambientTemp - Ambient temperature in Celsius
 * @param {number} mcbRating - MCB rated current
 * @returns {Object} Loading analysis result
 */
export function calculateActualLoading(measuredCurrent, ambientTemp, mcbRating) {
  // Get derating factor based on temperature
  const factor = getDeratingFactor(ambientTemp);
  const correctedCapacity = mcbRating * factor;
  const loading = (measuredCurrent / correctedCapacity) * 100;
  
  let status, statusInfo;
  if (loading > 100) {
    status = 'OVERLOAD';
    statusInfo = LOADING_STATUS.OVERLOAD;
  } else if (loading > 80) {
    status = 'WARNING';
    statusInfo = LOADING_STATUS.WARNING;
  } else {
    status = 'SAFE';
    statusInfo = LOADING_STATUS.SAFE;
  }
  
  return {
    loading: loading.toFixed(2),
    loadingRaw: loading,
    status: status,
    statusInfo: statusInfo,
    deratingFactor: factor,
    correctedCapacity: correctedCapacity.toFixed(2),
    mcbRating: mcbRating,
    measuredCurrent: measuredCurrent,
    ambientTemp: ambientTemp,
    margin: (correctedCapacity - measuredCurrent).toFixed(2)
  };
}

/**
 * Get derating factor for given temperature
 * @param {number} temp - Temperature in Celsius
 * @returns {number} Derating factor
 */
export function getDeratingFactor(temp) {
  const temps = Object.keys(DERATING_FACTORS).map(Number).sort((a, b) => a - b);
  
  for (let t of temps) {
    if (temp <= t) return DERATING_FACTORS[t];
  }
  return 0.5; // Default for very high temps
}

/**
 * Calculate cable capacity with all correction factors
 * @param {string} cableSize - Cable size in mm²
 * @param {string} cableType - Cable type (PVC_CONDUIT, PVC_TRAY, XLPE_TRAY)
 * @param {number} ambientTemp - Ambient temperature
 * @param {number} groupingFactor - Number of cables grouped
 * @returns {Object} Corrected cable capacity
 */
export function calculateCableCapacity(cableSize, cableType = 'XLPE_TRAY', ambientTemp = 30, groupingCount = 1) {
  const baseRating = CABLE_RATINGS[cableType]?.[cableSize] || 0;
  const tempFactor = getDeratingFactor(ambientTemp);
  const groupFactor = getGroupingFactor(groupingCount);
  
  const correctedRating = baseRating * tempFactor * groupFactor;
  
  return {
    baseRating: baseRating,
    correctedRating: correctedRating.toFixed(2),
    tempFactor: tempFactor,
    groupFactor: groupFactor,
    cableSize: cableSize,
    cableType: cableType
  };
}

/**
 * Get grouping factor
 * @param {number} count - Number of grouped cables
 * @returns {number} Grouping factor
 */
export function getGroupingFactor(count) {
  const factors = {
    1: 1.0, 2: 0.88, 3: 0.82, 4: 0.77,
    5: 0.73, 6: 0.68, 7: 0.65, 8: 0.62, 9: 0.60
  };
  return factors[count] || 0.55;
}

// ============================================================
// 3. PHASE IMBALANCE ANALYSIS
// ============================================================

/**
 * Calculate phase imbalance percentage
 * @param {Object} currents - Currents for each phase {R, S, T}
 * @returns {Object} Imbalance analysis
 */
export function calculatePhaseImbalance({ R, S, T }) {
  const currents = [R, S, T];
  const avg = (R + S + T) / 3;
  const max = Math.max(R, S, T);
  const min = Math.min(R, S, T);
  const maxDeviation = Math.max(Math.abs(max - avg), Math.abs(min - avg));
  
  const imbalance = avg > 0 ? (maxDeviation / avg) * 100 : 0;
  
  return {
    imbalance: imbalance.toFixed(2),
    imbalanceRaw: imbalance,
    average: avg.toFixed(2),
    max: max.toFixed(2),
    min: min.toFixed(2),
    maxDeviation: maxDeviation.toFixed(2),
    isCritical: imbalance > PHASE_IMBALANCE_THRESHOLD,
    threshold: PHASE_IMBALANCE_THRESHOLD,
    phases: { R: R.toFixed(2), S: S.toFixed(2), T: T.toFixed(2) }
  };
}

/**
 * Recommend phase rebalancing
 * @param {Object} currents - Currents for each phase
 * @returns {Object} Rebalancing recommendations
 */
export function recommendRebalancing({ R, S, T }) {
  const avg = (R + S + T) / 3;
  const phases = [
    { name: 'R', current: R, diff: R - avg },
    { name: 'S', current: S, diff: S - avg },
    { name: 'T', current: T, diff: T - avg }
  ];
  
  phases.sort((a, b) => b.diff - a.diff);
  
  const overloaded = phases.filter(p => p.diff > 0);
  const underloaded = phases.filter(p => p.diff < 0).reverse();
  
  const recommendations = [];
  for (let i = 0; i < Math.min(overloaded.length, underloaded.length); i++) {
    const transfer = Math.min(overloaded[i].diff, Math.abs(underloaded[i].diff));
    recommendations.push({
      from: overloaded[i].name,
      to: underloaded[i].name,
      transferAmount: transfer.toFixed(2)
    });
  }
  
  return {
    recommendations: recommendations,
    currentImbalance: calculatePhaseImbalance({ R, S, T }),
    targetBalance: avg.toFixed(2)
  };
}

// ============================================================
// 4. VOLTAGE DROP CALCULATIONS
// ============================================================

/**
 * Calculate voltage drop (PUIL 2020 method)
 * @param {Object} params - Calculation parameters
 * @returns {Object} Voltage drop results
 */
export function calculateVoltageDrop({ current, length, cableSize, cableType = 'copper', powerFactor = 0.85, voltage = 380 }) {
  // Resistance and reactance per km for common cable sizes (copper)
  const cableData = {
    '1.5': { R: 12.1, X: 0.13 },
    '2.5': { R: 7.41, X: 0.12 },
    '4': { R: 4.61, X: 0.11 },
    '6': { R: 3.08, X: 0.11 },
    '10': { R: 1.83, X: 0.10 },
    '16': { R: 1.15, X: 0.10 },
    '25': { R: 0.727, X: 0.099 },
    '35': { R: 0.524, X: 0.095 },
    '50': { R: 0.387, X: 0.093 },
    '70': { R: 0.268, X: 0.091 },
    '95': { R: 0.193, X: 0.089 },
    '120': { R: 0.153, X: 0.089 },
    '150': { R: 0.124, X: 0.088 },
    '185': { R: 0.099, X: 0.087 },
    '240': { R: 0.077, X: 0.086 }
  };
  
  // Aluminum multipliers
  const AL_MULTIPLIER = 1.65;
  
  const data = cableData[cableSize] || { R: 0.5, X: 0.09 };
  let R = data.R;
  let X = data.X;
  
  if (cableType === 'aluminum') {
    R *= AL_MULTIPLIER;
    X *= AL_MULTIPLIER;
  }
  
  // Convert length to km
  const L = length / 1000;
  
  // Voltage drop formula: ΔV = I × L × (R cos φ + X sin φ)
  const sinPhi = Math.sqrt(1 - powerFactor * powerFactor);
  const voltageDrop = current * L * (R * powerFactor + X * sinPhi);
  const voltageDropPercent = (voltageDrop / voltage) * 100;
  
  return {
    voltageDrop: voltageDrop.toFixed(2),
    voltageDropPercent: voltageDropPercent.toFixed(2),
    voltageAtEnd: (voltage - voltageDrop).toFixed(2),
    isCompliant: voltageDropPercent <= VOLTAGE_DROP_LIMITS.POWER,
    limit: VOLTAGE_DROP_LIMITS.POWER,
    parameters: { current, length, cableSize, cableType, powerFactor, voltage }
  };
}

// ============================================================
// 5. THERMAL ANALYSIS
// ============================================================

/**
 * Get thermal grade for given temperature
 * @param {number} temp - Temperature in Celsius
 * @returns {Object} Thermal grade information
 */
export function getThermalGrade(temp) {
  for (let grade of THERMAL_GRADES) {
    if (temp <= grade.max) {
      return { ...grade, actualTemp: temp };
    }
  }
  return { ...THERMAL_GRADES[THERMAL_GRADES.length - 1], actualTemp: temp };
}

/**
 * Analyze thermal image data
 * @param {Array} hotspots - Array of hotspot data [{x, y, temp, component}]
 * @returns {Object} Thermal analysis result
 */
export function analyzeThermalData(hotspots) {
  if (!hotspots || hotspots.length === 0) {
    return { summary: 'No data', critical: 0, warning: 0, normal: 0 };
  }
  
  let critical = 0, warning = 0, normal = 0, emergency = 0;
  const analyzed = hotspots.map(spot => {
    const grade = getThermalGrade(spot.temp);
    if (grade.grade === 'Darurat') emergency++;
    else if (grade.grade === 'Kritis') critical++;
    else if (grade.grade === 'Waspada') warning++;
    else normal++;
    return { ...spot, grade };
  });
  
  const maxTemp = Math.max(...hotspots.map(s => s.temp));
  const avgTemp = hotspots.reduce((sum, s) => sum + s.temp, 0) / hotspots.length;
  
  return {
    hotspots: analyzed,
    summary: maxTemp > 90 ? 'DARURAT' : maxTemp > 70 ? 'KRISIS' : maxTemp > 45 ? 'WASPADA' : 'NORMAL',
    counts: { normal, warning, critical, emergency },
    maxTemp: maxTemp.toFixed(1),
    avgTemp: avgTemp.toFixed(1),
    highestGrade: getThermalGrade(maxTemp)
  };
}

/**
 * Calculate temperature trend from historical data
 * @param {Array} history - Array of {date, temp} objects
 * @returns {Object} Trend analysis
 */
export function calculateTemperatureTrend(history) {
  if (!history || history.length < 2) {
    return { trend: 'insufficient_data', slope: 0, prediction: null };
  }
  
  // Sort by date
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Simple linear regression
  const n = sorted.length;
  const x = sorted.map((_, i) => i);
  const y = sorted.map(h => h.temp);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumXX = x.reduce((total, xi) => total + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict next value
  const nextX = n;
  const prediction = slope * nextX + intercept;
  
  let trend;
  if (slope > 0.5) trend = 'increasing';
  else if (slope < -0.5) trend = 'decreasing';
  else trend = 'stable';
  
  return {
    trend: trend,
    slope: slope.toFixed(4),
    intercept: intercept.toFixed(2),
    prediction: prediction.toFixed(2),
    rSquared: calculateRSquared(x, y, slope, intercept),
    daysToCritical: slope > 0 ? Math.max(0, Math.ceil((70 - prediction) / slope)) : null
  };
}

function calculateRSquared(x, y, slope, intercept) {
  const n = x.length;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  return (1 - ssResidual / ssTotal).toFixed(4);
}

// ============================================================
// 6. PROTECTION COORDINATION
// ============================================================

/**
 * Analyze protection coordination (selectivity)
 * @param {Object} mainMCB - Main MCB data {rating, type, curve}
 * @param {Array} branchMCBs - Array of branch MCB data
 * @returns {Object} Coordination analysis
 */
export function analyzeProtectionCoordination(mainMCB, branchMCBs) {
  const issues = [];
  const ratios = [];
  
  for (let branch of branchMCBs) {
    const ratio = mainMCB.rating / branch.rating;
    ratios.push({
      branch: branch.name,
      ratio: ratio.toFixed(2),
      mainRating: mainMCB.rating,
      branchRating: branch.rating
    });
    
    // Check selectivity ratio (should be >= 1.6 for MCB-MCB)
    if (ratio < 1.6) {
      issues.push({
        type: 'selectivity',
        severity: ratio < 1.2 ? 'critical' : 'warning',
        message: `Rasio selectivity ${ratio.toFixed(2)} < 1.6 untuk ${branch.name}`,
        recommendation: 'Pertimbangkan upgrade MCB utama atau pembagian beban'
      });
    }
    
    // Check curve coordination
    if (mainMCB.curve && branch.curve) {
      const curveOrder = ['B', 'C', 'D', 'K', 'Z'];
      const mainIdx = curveOrder.indexOf(mainMCB.curve);
      const branchIdx = curveOrder.indexOf(branch.curve);
      
      if (branchIdx > mainIdx) {
        issues.push({
          type: 'curve_coordination',
          severity: 'warning',
          message: `Kurva cabang (${branch.curve}) lebih sensitif dari utama (${mainMCB.curve})`,
          recommendation: 'Pertimbangkan penggunaan kurva C untuk MCB utama'
        });
      }
    }
  }
  
  return {
    ratios: ratios,
    issues: issues,
    isCoordinated: issues.length === 0,
    totalBranches: branchMCBs.length
  };
}

/**
 * Estimate short circuit current
 * @param {Object} params - System parameters
 * @returns {Object} Short circuit analysis
 */
export function estimateShortCircuitCurrent({ transformerKVA, transformerZ = 4, voltage = 380, cableLength = 0, cableSize = '50' }) {
  // Transformer impedance in ohms
  const Zt = (transformerZ / 100) * (Math.pow(voltage, 2) / (transformerKVA * 1000));
  
  // Cable impedance (simplified)
  const cableData = {
    '1.5': 12.1, '2.5': 7.41, '4': 4.61, '6': 3.08, '10': 1.83,
    '16': 1.15, '25': 0.727, '35': 0.524, '50': 0.387, '70': 0.268,
    '95': 0.193, '120': 0.153, '150': 0.124, '185': 0.099, '240': 0.077
  };
  const Rcable = (cableData[cableSize] || 0.5) * (cableLength / 1000);
  
  // Total impedance
  const Ztotal = Math.sqrt(Math.pow(Zt, 2) + Math.pow(Rcable, 2));
  
  // 3-phase short circuit current
  const Ik3 = (voltage / (Math.sqrt(3) * Ztotal));
  
  // Peak current (asymmetrical)
  const Ip = Ik3 * 2.5;
  
  return {
    ik3: Ik3.toFixed(2),
    ik3kA: (Ik3 / 1000).toFixed(2),
    ip: Ip.toFixed(2),
    ipkA: (Ip / 1000).toFixed(2),
    impedance: {
      transformer: Zt.toFixed(4),
      cable: Rcable.toFixed(4),
      total: Ztotal.toFixed(4)
    },
    parameters: { transformerKVA, transformerZ, voltage, cableLength, cableSize }
  };
}

/**
 * Verify breaking capacity
 * @param {number} icu - MCB breaking capacity in kA
 * @param {number} ik - Calculated short circuit current in kA
 * @returns {Object} Verification result
 */
export function verifyBreakingCapacity(icu, ik) {
  const margin = ((icu - ik) / ik) * 100;
  
  return {
    icu: icu,
    ik: ik,
    margin: margin.toFixed(2),
    isAdequate: icu > ik,
    status: icu > ik * 1.2 ? 'Aman' : icu > ik ? 'Memenuhi' : 'Tidak Memenuhi',
    recommendation: icu <= ik ? `Upgrade ke MCB dengan Icu > ${(ik * 1.2).toFixed(1)} kA` : null
  };
}

// ============================================================
// 7. COMPLIANCE & RECOMMENDATIONS
// ============================================================

/**
 * Generate compliance check based on findings
 * @param {Object} findings - Analysis findings
 * @returns {Object} Compliance report
 */
export function generateComplianceCheck(findings) {
  const checks = [];
  const applicableClauses = [];
  
  // Check overload conditions
  if (findings.loading?.status === 'OVERLOAD') {
    checks.push({
      item: 'Batas Pembebanan',
      status: 'FAIL',
      message: 'Pembebanan melebihi 100% kapasitas MCB',
      clause: 'PUIL-2020-5.2.5.3'
    });
    applicableClauses.push(PUIL_DATABASE.find(p => p.id === 'PUIL-2020-5.2.5.3'));
  }
  
  // Check thermal conditions
  if (findings.thermal?.summary === 'KRISIS' || findings.thermal?.summary === 'DARURAT') {
    checks.push({
      item: 'Batas Suhu Operasi',
      status: 'FAIL',
      message: 'Suhu komponen melebihi batas aman',
      clause: 'IEC-60364-4-42'
    });
    applicableClauses.push(PUIL_DATABASE.find(p => p.id === 'IEC-60364-4-42'));
  }
  
  // Check phase imbalance
  if (findings.imbalance?.isCritical) {
    checks.push({
      item: 'Keseimbangan Fasa',
      status: 'FAIL',
      message: `Ketidakseimbangan fasa ${findings.imbalance.imbalance}% > 10%`,
      clause: 'IEEE-1159-Imbalance'
    });
    applicableClauses.push(PUIL_DATABASE.find(p => p.id === 'IEEE-1159-Imbalance'));
  }
  
  // Check voltage drop
  if (findings.voltageDrop && !findings.voltageDrop.isCompliant) {
    checks.push({
      item: 'Jatuh Tegangan',
      status: 'FAIL',
      message: `Voltage drop ${findings.voltageDrop.voltageDropPercent}% melebihi batas 5%`,
      clause: 'PUIL-2020-7.3.1'
    });
    applicableClauses.push(PUIL_DATABASE.find(p => p.id === 'PUIL-2020-7.3.1'));
  }
  
  // Check protection coordination
  if (findings.protection && !findings.protection.isCoordinated) {
    checks.push({
      item: 'Koordinasi Proteksi',
      status: 'WARNING',
      message: 'Terdapat masalah koordinasi proteksi',
      clause: 'PUIL-2020-6.2.1'
    });
    applicableClauses.push(PUIL_DATABASE.find(p => p.id === 'PUIL-2020-6.2.1'));
  }
  
  // Calculate compliance score
  const passed = checks.filter(c => c.status === 'PASS').length;
  const total = checks.length;
  const score = total > 0 ? (passed / total) * 100 : 100;
  
  return {
    checks: checks,
    applicableClauses: applicableClauses,
    passedCount: passed,
    totalCount: total,
    complianceScore: score.toFixed(1),
    overallStatus: score >= 90 ? 'COMPLIANT' : score >= 70 ? 'MINOR_NON_COMPLIANT' : 'MAJOR_NON_COMPLIANT'
  };
}

/**
 * Generate recommendations based on analysis
 * @param {Object} analysis - Full analysis results
 * @returns {Array} Priority-sorted recommendations
 */
export function generateRecommendations(analysis) {
  const recommendations = [];
  
  // Loading recommendations
  if (analysis.loading?.status === 'OVERLOAD') {
    recommendations.push({
      priority: 'HIGH',
      category: 'Loading',
      issue: `Overload ${analysis.loading.loading}% pada panel`,
      actions: [
        'Lakukan pembagian beban ke panel lain',
        'Pertimbangkan upgrade kapasitas MCB',
        'Identifikasi beban non-prioritas untuk shedding'
      ]
    });
  } else if (analysis.loading?.status === 'WARNING') {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Loading',
      issue: 'Pembebanan mendekati batas maksimum (80-100%)',
      actions: [
        'Monitor beban secara berkala',
        'Rencanakan pembagian beban jika ada penambahan beban baru',
        'Verifikasi kembali perhitungan beban desain'
      ]
    });
  }
  
  // Thermal recommendations
  if (analysis.thermal?.counts?.emergency > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Thermal',
      issue: `${analysis.thermal.counts.emergency} titik suhu darurat (>90°C) terdeteksi`,
      actions: [
        'SHUTDOWN SEKETIKA sistem untuk inspeksi',
        'Periksa koneksi longgar atau korosi',
        'Tambahkan sistem ventilasi paksa',
        'Pertimbangkan pemindahan beban ke panel lain'
      ]
    });
  } else if (analysis.thermal?.counts?.critical > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Thermal',
      issue: `${analysis.thermal.counts.critical} titik suhu kritis (70-90°C)`,
      actions: [
        'Bersihkan terminal dan kontaktor dari debu/korosi',
        'Periksa kencangkan baut terminal',
        'Tambahkan exhaust fan pada ruang panel',
        'Jadwalkan pemeriksaan ulang dalam 1 minggu'
      ]
    });
  } else if (analysis.thermal?.counts?.warning > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Thermal',
      issue: `${analysis.thermal.counts.warning} titik suhu waspada (45-70°C)`,
      actions: [
        'Lakukan pembersihan rutin panel',
        'Verifikasi ventilasi alami cukup',
        'Monitor suhu pada pemeriksaan berikutnya'
      ]
    });
  }
  
  // Imbalance recommendations
  if (analysis.imbalance?.isCritical) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Balance',
      issue: `Ketidakseimbangan fasa ${analysis.imbalance.imbalance}% melebihi batas 10%`,
      actions: [
        'Lakukan rebalancing beban antar fasa',
        'Identifikasi beban single-phase besar dan redistribusikan',
        'Verifikasi ukuran netral cukup untuk arus ketidakseimbangan'
      ]
    });
  }
  
  // Voltage drop recommendations
  if (analysis.voltageDrop && !analysis.voltageDrop.isCompliant) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Voltage',
      issue: `Jatuh tegangan ${analysis.voltageDrop.voltageDropPercent}% melebihi batas`,
      actions: [
        'Pertimbangkan upsizing kabel distribusi',
        'Tambah panel sub-distribusi lebih dekat dengan beban',
        'Verifikasi koneksi tidak longgar'
      ]
    });
  }
  
  // Sort by priority
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ============================================================
// 8. SIMULATION & WHAT-IF ANALYSIS
// ============================================================

/**
 * Simulate MCB upgrade scenario
 * @param {Object} current - Current conditions
 * @param {number} newMCBRating - New MCB rating to simulate
 * @returns {Object} Simulation result
 */
export function simulateMCBUpgrade(current, newMCBRating) {
  const newLoading = (current.measuredCurrent / newMCBRating) * 100;
  const newStatus = newLoading > 100 ? 'OVERLOAD' : newLoading > 80 ? 'WARNING' : 'SAFE';
  
  return {
    scenario: 'MCB Upgrade',
    currentRating: current.mcbRating,
    newRating: newMCBRating,
    currentLoading: current.loading,
    newLoading: newLoading.toFixed(2),
    currentStatus: current.status,
    newStatus: newStatus,
    improvement: current.loading - newLoading,
    recommendation: newMCBRating > current.mcbRating * 1.5 
      ? 'Pertimbangkan koordinasi proteksi dengan MCB upstream'
      : null
  };
}

/**
 * Simulate load transfer between phases
 * @param {Object} currents - Current currents {R, S, T}
 * @param {number} loadToTransfer - Load amount to transfer (Amperes)
 * @param {string} fromPhase - Source phase
 * @param {string} toPhase - Destination phase
 * @returns {Object} Simulation result
 */
export function simulateLoadTransfer(currents, loadToTransfer, fromPhase, toPhase) {
  const newCurrents = { ...currents };
  newCurrents[fromPhase] -= loadToTransfer;
  newCurrents[toPhase] += loadToTransfer;
  
  const currentImbalance = calculatePhaseImbalance(currents);
  const newImbalance = calculatePhaseImbalance(newCurrents);
  
  return {
    scenario: 'Load Transfer',
    transferAmount: loadToTransfer,
    from: fromPhase,
    to: toPhase,
    before: { ...currents, imbalance: currentImbalance.imbalance },
    after: { 
      R: newCurrents.R.toFixed(2),
      S: newCurrents.S.toFixed(2),
      T: newCurrents.T.toFixed(2),
      imbalance: newImbalance.imbalance
    },
    improvement: (parseFloat(currentImbalance.imbalance) - parseFloat(newImbalance.imbalance)).toFixed(2),
    isBalanced: !newImbalance.isCritical
  };
}

// ============================================================
// 9. UTILITY FUNCTIONS
// ============================================================

/**
 * Format electrical values with units
 * @param {number} value - Value to format
 * @param {string} unit - Unit (A, V, kW, etc.)
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted value
 */
export function formatElectrical(value, unit, decimals = 2) {
  return `${Number(value).toFixed(decimals)} ${unit}`;
}

/**
 * Generate summary text for report
 * @param {Object} analysis - Complete analysis
 * @returns {string} Summary text
 */
export function generateSummaryText(analysis) {
  const date = new Date().toLocaleDateString('id-ID');
  const issues = [];
  
  if (analysis.loading?.status === 'OVERLOAD') {
    issues.push(`${analysis.panelName || 'Panel'}: ${analysis.loading.loading}% OVERLOAD`);
  }
  if (analysis.thermal?.counts?.critical > 0) {
    issues.push(`${analysis.thermal.counts.critical} titik suhu kritis`);
  }
  if (analysis.imbalance?.isCritical) {
    issues.push(`Imbalance fasa ${analysis.imbalance.imbalance}%`);
  }
  
  if (issues.length === 0) {
    return `Berdasarkan hasil pengukuran pada tanggal ${date}, sistem kelistrikan menunjukkan kondisi NORMAL dengan pembebanan ${analysis.loading?.loading || 'N/A'}% dan suhu komponen dalam batas aman.`;
  }
  
  return `Berdasarkan hasil pengukuran pada tanggal ${date}, sistem kelistrikan menunjukkan kondisi yang memerlukan perhatian: ${issues.join(', ')}. Tindakan korektif direkomendasikan sesuai prioritas.`;
}

// Export all functions
export default {
  calculatePower,
  estimateEnergyConsumption,
  calculateActualLoading,
  getDeratingFactor,
  calculateCableCapacity,
  getGroupingFactor,
  calculatePhaseImbalance,
  recommendRebalancing,
  calculateVoltageDrop,
  getThermalGrade,
  analyzeThermalData,
  calculateTemperatureTrend,
  analyzeProtectionCoordination,
  estimateShortCircuitCurrent,
  verifyBreakingCapacity,
  generateComplianceCheck,
  generateRecommendations,
  simulateMCBUpgrade,
  simulateLoadTransfer,
  formatElectrical,
  generateSummaryText
};
