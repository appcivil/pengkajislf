/**
 * ENVIRONMENTAL CALCULATORS
 * Algoritma perhitungan untuk Pengendalian Dampak Lingkungan
 * PP 16/2021, UU 32/2009, Permen LHK 4/2021, 68/2016, 21/2008
 */

// ============================================================
// 1. VALIDASI BAKU MUTU AIR LIMBAH (Permen LHK 68/2016)
// ============================================================

export const WASTEWATER_STANDARDS = {
  ph: { min: 6, max: 9, unit: '' },
  bod: { max: 30, unit: 'mg/L' },      // Badan sungai
  cod: { max: 100, unit: 'mg/L' },     // Badan sungai
  tss: { max: 50, unit: 'mg/L' },
  ammonia: { max: 10, unit: 'mg/L' },  // Untuk sungai
  oil: { max: 5, unit: 'mg/L' },
  coliform: { max: 1000, unit: 'MPN/100mL' },
  // Standar tambahan untuk badan air laut
  bod_sea: { max: 50, unit: 'mg/L' },
  cod_sea: { max: 150, unit: 'mg/L' },
  ammonia_sea: { max: 5, unit: 'mg/L' }
};

export function checkWastewaterQuality(labResults, waterBodyType = 'RIVER') {
  const standards = { ...WASTEWATER_STANDARDS };
  
  // Adjust standards for sea discharge
  if (waterBodyType === 'SEA') {
    standards.bod = standards.bod_sea;
    standards.cod = standards.cod_sea;
    standards.ammonia = standards.ammonia_sea;
  }

  const results = {};
  let compliance = true;

  for (const [param, value] of Object.entries(labResults)) {
    if (value === null || value === undefined) continue;
    
    const std = standards[param];
    if (!std) continue;

    let status = 'C';
    let deviation = 0;
    let percentage = 0;

    if (param === 'ph') {
      if (value < std.min || value > std.max) {
        status = 'NC';
        deviation = value < std.min ? std.min - value : value - std.max;
        percentage = value < std.min ? (value / std.min) * 100 : (value / std.max) * 100;
        compliance = false;
      }
    } else {
      percentage = (value / std.max) * 100;
      if (value > std.max) {
        status = 'NC';
        deviation = value - std.max;
        compliance = false;
      }
    }

    results[param] = {
      value: parseFloat(value),
      standard: std.max || `${std.min}-${std.max}`,
      unit: std.unit,
      status,
      deviation: deviation > 0 ? parseFloat(deviation.toFixed(2)) : 0,
      utilization: parseFloat(percentage.toFixed(1))
    };
  }

  return {
    parameters: results,
    overallStatus: compliance ? 'C' : 'NC',
    compliance,
    recommendation: compliance 
      ? 'Pengelolaan air limbah memenuhi baku mutu Permen LHK 68/2016' 
      : 'Perlu peningkatan treatment atau evaluasi IPAL',
    legalReference: 'Permen LHK No. 68 Tahun 2016 tentang Baku Mutu Air Limbah'
  };
}

// ============================================================
// 2. NERACA AIR (WATER MASS BALANCE)
// ============================================================

export function calculateWaterMassBalance(data) {
  const {
    cleanWaterInflow = 0,    // m³/bulan
    wastewaterOutflow = 0,   // m³/bulan
    rainwaterInflow = 0,     // m³/bulan
    evaporationLoss = 0,     // m³/bulan
    leakageEstimate = 0,     // m³/bulan
    recycledWater = 0          // m³/bulan
  } = data;

  const totalIn = cleanWaterInflow + rainwaterInflow;
  const totalOut = wastewaterOutflow + evaporationLoss + leakageEstimate;
  const unaccounted = totalIn - totalOut - recycledWater;
  const efficiency = totalIn > 0 ? ((wastewaterOutflow / totalIn) * 100) : 0;
  const lossPercentage = totalIn > 0 ? ((Math.abs(unaccounted) / totalIn) * 100) : 0;
  const recyclingRate = totalIn > 0 ? ((recycledWater / totalIn) * 100) : 0;

  let status;
  if (efficiency >= 80 && efficiency <= 90) status = 'GOOD';
  else if (efficiency >= 70) status = 'MODERATE';
  else status = 'POOR';

  return {
    totalInflow: parseFloat(totalIn.toFixed(2)),
    totalOutflow: parseFloat(totalOut.toFixed(2)),
    unaccountedWater: parseFloat(unaccounted.toFixed(2)),
    efficiency: parseFloat(efficiency.toFixed(1)),
    lossPercentage: parseFloat(lossPercentage.toFixed(1)),
    recyclingRate: parseFloat(recyclingRate.toFixed(1)),
    status,
    recommendation: lossPercentage > 20 
      ? `Deteksi kehilangan air ${lossPercentage.toFixed(1)}%. Perlu audit kebocoran pipa atau evaluasi meter.` 
      : `Neraca air dalam batas normal. Efisiensi ${efficiency.toFixed(0)}% (target 80-90%).`,
    legalReference: 'PP No. 16 Tahun 2021 tentang Perubahan atas PP 22/2021 (PPLH)'
  };
}

// ============================================================
// 3. EUI (ENERGY USE INTENSITY) & BENCHMARKING
// ============================================================

export const EUI_STANDARDS = {
  office: 240,
  hotel: 300,
  hospital: 380,
  mall: 350,
  residential: 150,
  school: 200,
  industrial: 400,
  warehouse: 120
};

export function calculateEUI(annualKWh, buildingArea, buildingType = 'office') {
  const eui = buildingArea > 0 ? annualKWh / buildingArea : 0;
  const standardEUI = EUI_STANDARDS[buildingType] || 240;
  const efficiency = (eui / standardEUI) * 100;
  
  let grade;
  if (efficiency <= 60) grade = 'Sangat Efisien (Green Building)';
  else if (efficiency <= 80) grade = 'Efisien';
  else if (efficiency <= 100) grade = 'Standar';
  else if (efficiency <= 120) grade = 'Boros';
  else grade = 'Sangat Boros';

  const potentialSaving = Math.max(0, eui - (standardEUI * 0.8));
  const savingPercent = eui > 0 ? (potentialSaving / eui) * 100 : 0;

  let status;
  if (efficiency <= 100) status = 'C';
  else if (efficiency <= 120) status = 'NC_MINOR';
  else status = 'NC_MAJOR';

  return {
    annualConsumption: annualKWh.toFixed(0) + ' kWh/tahun',
    eui: parseFloat(eui.toFixed(2)),
    euiFormatted: eui.toFixed(2) + ' kWh/m²/th',
    standardEUI: standardEUI + ' kWh/m²/th',
    efficiency: parseFloat(efficiency.toFixed(1)),
    efficiencyFormatted: efficiency.toFixed(1) + '%',
    grade,
    status,
    potentialSaving: parseFloat(potentialSaving.toFixed(2)),
    savingPotentialPercent: parseFloat(savingPercent.toFixed(1)),
    recommendation: efficiency > 100 
      ? `Potensi penghematan ${savingPercent.toFixed(0)}% melalui audit energi detail (penggantian lampu LED, inverter AC).`
      : 'Konsumsi energi dalam batas standar SNI 03-6196-2000',
    legalReference: 'SNI 03-6196-2000 tentang Konservasi Energi pada Bangunan Gedung'
  };
}

// ============================================================
// 4. WASTE DIVERSION RATE (Zero Waste)
// ============================================================

export function calculateWasteDiversion(composition) {
  const totalWaste = Object.values(composition).reduce((a, b) => a + b, 0);
  if (totalWaste === 0) {
    return {
      diversionRate: 0,
      status: 'UNKNOWN',
      recommendation: 'Data sampah belum tersedia'
    };
  }

  const diverted = (composition.organic || 0) + (composition.plastic || 0) + 
                   (composition.paper || 0) + (composition.metal || 0) + 
                   (composition.glass || 0);
  const diversionRate = (diverted / totalWaste) * 100;
  const landfillRate = ((composition.residual || 0) / totalWaste) * 100;

  // Target Perpres 97/2017 (Jakarta Zero Waste): 30% reduction, 70% diversion
  const targetDiversion = 70;

  return {
    totalWaste: totalWaste.toFixed(1) + ' kg/hari',
    diversionRate: parseFloat(diversionRate.toFixed(1)),
    diversionFormatted: diversionRate.toFixed(1) + '%',
    landfillRate: parseFloat(landfillRate.toFixed(1)),
    composition: {
      organic: ((composition.organic || 0) / totalWaste * 100).toFixed(1) + '%',
      plastic: ((composition.plastic || 0) / totalWaste * 100).toFixed(1) + '%',
      paper: ((composition.paper || 0) / totalWaste * 100).toFixed(1) + '%',
      metal: ((composition.metal || 0) / totalWaste * 100).toFixed(1) + '%',
      glass: ((composition.glass || 0) / totalWaste * 100).toFixed(1) + '%',
      b3: ((composition.b3 || 0) / totalWaste * 100).toFixed(1) + '%',
      residual: ((composition.residual || 0) / totalWaste * 100).toFixed(1) + '%'
    },
    zeroWasteTarget: diversionRate >= targetDiversion ? 'Tercapai' : 'Belum Tercapai',
    status: diversionRate >= 60 ? 'C' : 'NC',
    recommendation: diversionRate < targetDiversion 
      ? `Tingkatkan pemilahan sampah organik untuk composting. Potensi pengurangan sampah TPA ${(targetDiversion - diversionRate).toFixed(0)}%.`
      : 'Pengelolaan sampah mendekati zero waste (diversion >70%)',
    legalReference: 'Perpres No. 97 Tahun 2017 tentang Jakarta Zero Waste'
  };
}

// ============================================================
// 5. CARBON FOOTPRINT CALCULATION
// ============================================================

export function calculateCarbonFootprint(annualKWh, annualLiterDiesel = 0, buildingArea = 0) {
  // Faktor emisi PLN 2024: 0.85 kg CO2/kWh (grid average)
  // Faktor emisi solar: 2.68 kg CO2/liter
  const EMISSION_FACTOR_ELECTRICITY = 0.85;
  const EMISSION_FACTOR_DIESEL = 2.68;
  const CO2_ABSORPTION_PER_TREE = 20; // kg CO2/tahun

  const emissionElectricity = annualKWh * EMISSION_FACTOR_ELECTRICITY;
  const emissionDiesel = annualLiterDiesel * EMISSION_FACTOR_DIESEL;
  const totalEmission = emissionElectricity + emissionDiesel;
  const totalTon = totalEmission / 1000;
  const carbonIntensity = buildingArea > 0 ? totalEmission / buildingArea : 0;
  const treesNeeded = Math.ceil(totalEmission / CO2_ABSORPTION_PER_TREE);
  const solarPanelNeeded = (annualKWh * 0.2 / 1000); // kWp untuk offset 20%

  let status;
  if (carbonIntensity < 50) status = 'GOOD';
  else if (carbonIntensity < 100) status = 'MODERATE';
  else status = 'POOR';

  return {
    electricityEmission: (emissionElectricity / 1000).toFixed(2) + ' ton CO₂/th',
    dieselEmission: (emissionDiesel / 1000).toFixed(2) + ' ton CO₂/th',
    totalEmission: totalTon.toFixed(2) + ' ton CO₂/th',
    carbonIntensity: parseFloat(carbonIntensity.toFixed(2)),
    carbonIntensityFormatted: carbonIntensity.toFixed(2) + ' kg CO₂/m²/th',
    treesNeeded,
    solarPanelRecommendation: solarPanelNeeded.toFixed(1) + ' kWp',
    status,
    recommendation: status === 'POOR'
      ? `Tanam ${treesNeeded} pohon untuk carbon neutral, atau pasang ${solarPanelNeeded.toFixed(1)} kWp solar panel.`
      : 'Intensitas karbon dalam batas acceptable',
    legalReference: 'IPCC Guidelines for National Greenhouse Gas Inventories'
  };
}

// ============================================================
// 6. DRAINASE RATIONAL METHOD
// ============================================================

export function calculateDrainageRational(area, runoffCoefficient, rainfallIntensity, timeConcentration = 15) {
  // Q = C × I × A / 360 (m³/detik)
  // I dalam mm/jam, A dalam m²
  const Q = (runoffCoefficient * rainfallIntensity * area) / 360;
  const volumeHourly = Q * 3600; // m³/jam
  const volumeDaily = volumeHourly * 24; // m³/hari hujan
  const wellsNeeded = Math.ceil(volumeHourly / 1); // asumsi 1 sumur 1m³/jam
  const minWells = Math.ceil(area / 100); // 1 sumur per 100m²

  let status;
  if (wellsNeeded <= minWells) status = 'PASS';
  else if (wellsNeeded <= minWells * 1.5) status = 'WARNING';
  else status = 'FAIL';

  return {
    peakDischarge: parseFloat(Q.toFixed(3)),
    peakDischargeFormatted: Q.toFixed(3) + ' m³/s',
    volumeHourly: parseFloat(volumeHourly.toFixed(2)),
    volumeHourlyFormatted: volumeHourly.toFixed(2) + ' m³/jam',
    volumeDaily: parseFloat(volumeDaily.toFixed(2)),
    runoffCoefficient,
    rainfallIntensity: rainfallIntensity + ' mm/jam',
    timeConcentration: timeConcentration + ' menit',
    infiltrationWellsNeeded: wellsNeeded,
    minimumWellsRequired: minWells,
    status,
    recommendation: `Direkomendasikan ${wellsNeeded} sumur resapan diameter 1m x kedalaman 2m (${minWells} minimum)`,
    legalReference: 'Permen PU No. 20/PRT/M/2020 tentang Drainase Perkotaan'
  };
}

// ============================================================
// 7. RAINWATER HARVESTING POTENTIAL
// ============================================================

export function calculateRainwaterPotential(catchmentArea, annualRainfall, efficiency = 0.9) {
  // V = 0.9 × luas atap × curah hujan (mm = L/m²)
  // Dalam m³: V = efficiency × area (m²) × rainfall (mm) / 1000
  const volume = efficiency * catchmentArea * (annualRainfall / 1000);
  const monthlyAverage = volume / 12;
  const dailyAverage = volume / 365;

  // Usage recommendations
  const toiletFlushing = Math.min(volume * 0.3, volume); // 30% untuk flushing
  const irrigation = Math.min(volume * 0.5, volume - toiletFlushing);
  const other = volume - toiletFlushing - irrigation;

  return {
    catchmentArea: catchmentArea + ' m²',
    annualRainfall: annualRainfall + ' mm/th',
    efficiency: (efficiency * 100) + '%',
    potentialVolume: parseFloat(volume.toFixed(2)),
    potentialVolumeFormatted: volume.toFixed(2) + ' m³/tahun',
    monthlyAverage: parseFloat(monthlyAverage.toFixed(2)),
    dailyAverage: parseFloat(dailyAverage.toFixed(2)),
    usageBreakdown: {
      toiletFlushing: parseFloat(toiletFlushing.toFixed(2)),
      irrigation: parseFloat(irrigation.toFixed(2)),
      other: parseFloat(other.toFixed(2))
    },
    status: volume > 10 ? 'RECOMMENDED' : 'OPTIONAL',
    recommendation: volume > 10
      ? `Potensi ${volume.toFixed(1)} m³/tahun. Direkomendasikan tank ${Math.min(5, volume * 0.5).toFixed(1)} m³ untuk flushing toilet dan irigasi.`
      : 'Potensi terbatas, pertimbangkan untuk irigasi saja',
    legalReference: 'Permen PU No. 20/PRT/M/2020 tentan Manajemen Air Hujan'
  };
}

// ============================================================
// 8. WATER FOOTPRINT CALCULATION
// ============================================================

export function calculateWaterFootprint(monthlyConsumption, occupantCount, buildingType = 'office') {
  const annualM3 = monthlyConsumption.reduce((a, b) => a + b, 0);
  const dailyPerCapita = occupantCount > 0 ? (annualM3 * 1000 / 365 / occupantCount) : 0;
  
  const standards = {
    residential: 120,
    office: 50,
    hotel: 200,
    hospital: 300,
    school: 80,
    mall: 100
  };

  const standard = standards[buildingType] || 100;
  const efficiency = (dailyPerCapita / standard) * 100;

  let status;
  if (dailyPerCapita <= standard * 0.8) status = 'EXCELLENT';
  else if (dailyPerCapita <= standard) status = 'GOOD';
  else if (dailyPerCapita <= standard * 1.2) status = 'MODERATE';
  else status = 'POOR';

  return {
    annualConsumption: annualM3.toFixed(1) + ' m³/tahun',
    dailyPerCapita: parseFloat(dailyPerCapita.toFixed(1)),
    dailyPerCapitaFormatted: dailyPerCapita.toFixed(1) + ' L/org/hari',
    standard: standard + ' L/org/hari',
    efficiency: parseFloat(efficiency.toFixed(1)),
    status,
    recommendation: dailyPerCapita > standard
      ? `Penggunaan air ${(dailyPerCapita - standard).toFixed(0)} L/org/hari di atas standar. Pertimbangkan water saving devices.`
      : 'Penggunaan air efisien',
    legalReference: 'SNI 03-7065-2005 tentang Pedoman Audit Air'
  };
}

// ============================================================
// 9. GREEN SPACE RATIO
// ============================================================

export function calculateGreenRatio(greenSpaceArea, totalSiteArea) {
  const ratio = totalSiteArea > 0 ? (greenSpaceArea / totalSiteArea) * 100 : 0;
  const minimumRequired = 30; // KDB max 70% berarti RTH min 30%
  const shortfall = Math.max(0, minimumRequired - ratio);
  const additionalAreaNeeded = (shortfall / 100) * totalSiteArea;

  let status;
  if (ratio >= minimumRequired) status = 'C';
  else if (ratio >= minimumRequired * 0.8) status = 'NC_MINOR';
  else status = 'NC_MAJOR';

  return {
    greenSpaceArea: parseFloat(greenSpaceArea.toFixed(1)),
    totalSiteArea: parseFloat(totalSiteArea.toFixed(1)),
    greenRatio: parseFloat(ratio.toFixed(1)),
    greenRatioFormatted: ratio.toFixed(1) + '%',
    minimumRequired: minimumRequired + '%',
    shortfall: parseFloat(shortfall.toFixed(1)),
    additionalAreaNeeded: parseFloat(additionalAreaNeeded.toFixed(1)),
    status,
    recommendation: ratio < minimumRequired
      ? `RTH ${ratio.toFixed(1)}% kurang dari minimum ${minimumRequired}%. Tambah ${additionalAreaNeeded.toFixed(0)} m² area hijau.`
      : 'Persentase RTH memenuhi persyaratan KDB',
    legalReference: 'PP No. 16 Tahun 2021 tentang Penyelenggaraan Perumahan dan Kawasan Permukiman'
  };
}

// ============================================================
// 10. NOISE COMPLIANCE CHECK
// ============================================================

export const NOISE_STANDARDS = {
  day: { residential: 55, commercial: 65, industrial: 70, hospital: 55, school: 55 },
  night: { residential: 45, commercial: 55, industrial: 60, hospital: 45, school: 45 }
};

export function checkNoiseCompliance(measurements, areaType = 'residential', timeOfDay = 'day') {
  const standards = NOISE_STANDARDS[timeOfDay] || NOISE_STANDARDS.day;
  const limit = standards[areaType] || 55;

  const results = measurements.map(point => {
    const value = parseFloat(point.value);
    const status = value <= limit ? 'C' : 'NC';
    const excess = value > limit ? parseFloat((value - limit).toFixed(1)) : 0;
    
    return {
      location: point.location || 'Unknown',
      value,
      limit,
      unit: 'dB(A)',
      status,
      excess,
      percentage: parseFloat(((value / limit) * 100).toFixed(1))
    };
  });

  const maxValue = Math.max(...measurements.map(p => parseFloat(p.value)), 0);
  const overallStatus = maxValue <= limit ? 'C' : 'NC';

  return {
    measurements: results,
    maxValue: parseFloat(maxValue.toFixed(1)),
    limit: limit + ' dB(A)',
    areaType,
    timeOfDay,
    overallStatus,
    recommendation: overallStatus === 'NC'
      ? `Kebisingan melebihi baku mutu ${limit} dB(A). Perlu peredam suara atau batasi operasional malam.`
      : 'Tingkat kebisingan memenuhi baku mutu Permen LH 48/1996',
    legalReference: 'Kepmen LH No. 48 Tahun 1996 tentang Baku Tingkat Kebisingan'
  };
}

// ============================================================
// 11. VIBRATION COMPLIANCE
// ============================================================

export function checkVibrationCompliance(ppv, frequency = 50) {
  const limit = 0.3; // mm/s (SNI 03-6884-2002)
  const status = ppv <= limit ? 'C' : 'NC';

  return {
    ppv: parseFloat(ppv.toFixed(2)),
    ppvFormatted: ppv.toFixed(2) + ' mm/s',
    frequency: frequency + ' Hz',
    limit: limit + ' mm/s',
    status,
    recommendation: status === 'NC'
      ? 'Getaran melebihi 0.3 mm/s. Perlu isolasi getaran pada mesin (genset, pompa).'
      : 'Getaran dalam batas aman SNI 03-6884-2002',
    legalReference: 'SNI 03-6884-2002 tentang Evaluasi Getaran Bangunan'
  };
}

// ============================================================
// 12. AIR EMISSION COMPLIANCE
// ============================================================

export const AMBIENT_AIR_STANDARDS = {
  pm10: { max: 150, unit: 'μg/m³' },
  pm25: { max: 65, unit: 'μg/m³' },
  so2: { max: 365, unit: 'μg/m³' },
  no2: { max: 200, unit: 'μg/m³' },
  co: { max: 10000, unit: 'μg/m³' },
  o3: { max: 160, unit: 'μg/m³' }
};

export const STACK_EMISSION_STANDARDS = {
  so2: { max: 900, unit: 'mg/Nm³' },
  nox: { max: 850, unit: 'mg/Nm³' },
  co: { max: 1000, unit: 'mg/Nm³' },
  pm: { max: 150, unit: 'mg/Nm³' },
  opacity: { max: 40, unit: '%' }
};

export function checkAmbientAirQuality(measurements) {
  const results = {};
  let overallCompliance = true;

  for (const [param, value] of Object.entries(measurements)) {
    if (value === null || value === undefined) continue;
    
    const std = AMBIENT_AIR_STANDARDS[param];
    if (!std) continue;

    const status = value <= std.max ? 'C' : 'NC';
    if (status === 'NC') overallCompliance = false;

    results[param] = {
      value,
      standard: std.max,
      unit: std.unit,
      status,
      deviation: value > std.max ? parseFloat((value - std.max).toFixed(2)) : 0,
      percentage: parseFloat(((value / std.max) * 100).toFixed(1))
    };
  }

  return {
    parameters: results,
    overallStatus: overallCompliance ? 'C' : 'NC',
    compliance: overallCompliance,
    recommendation: overallCompliance
      ? 'Kualitas udara ambien memenuhi baku mutu Permen LHK 22/2021'
      : 'Perlu pengendalian sumber emisi atau peningkatan ventilasi',
    legalReference: 'Permen LHK No. 22 Tahun 2021 tentang Penyelenggaraan Perlindungan dan Pengelolaan Kualitas Udara'
  };
}

// ============================================================
// 13. ENVIRONMENTAL DASHBOARD SCORE
// ============================================================

export function calculateEnvironmentalScore(categories) {
  const weights = {
    documents: 10,
    wastewater: 15,
    waste: 15,
    emission: 10,
    noise: 10,
    b3: 10,
    energy: 10,
    water: 10,
    drainage: 5,
    greenSpace: 5
  };

  const scores = [];
  let totalWeight = 0;

  for (const [category, data] of Object.entries(categories)) {
    if (!data) continue;
    
    const weight = weights[category] || 5;
    let score = 0;

    // Calculate score based on status
    if (data.status === 'C' || data.status === 'PASS' || data.status === 'GOOD' || data.status === 'EXCELLENT') {
      score = 100;
    } else if (data.status === 'NC_MINOR' || data.status === 'MODERATE') {
      score = 70;
    } else if (data.status === 'WARNING') {
      score = 60;
    } else {
      score = 40;
    }

    scores.push({ category, score, weight });
    totalWeight += weight;
  }

  const weightedScore = totalWeight > 0 
    ? scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight 
    : 0;

  const grade = weightedScore >= 90 ? 'A' : 
                weightedScore >= 80 ? 'B' : 
                weightedScore >= 70 ? 'C' : 
                weightedScore >= 60 ? 'D' : 'E';

  const status = weightedScore >= 80 ? 'BAIK' : 
                 weightedScore >= 60 ? 'SEDANG' : 
                 'PERLU PERBAIKAN';

  return {
    overallScore: Math.round(weightedScore),
    grade,
    status,
    categoryScores: scores,
    recommendation: weightedScore < 60 
      ? 'Beberapa aspek lingkungan tidak memenuhi persyaratan. Prioritaskan perbaikan pada aspek dengan skor rendah.'
      : weightedScore < 80 
        ? 'Pengelolaan lingkungan memadai namun masih ada ruang untuk perbaikan.'
        : 'Pengelolaan lingkungan sangat baik. Pertahankan standard yang sudah diterapkan.'
  };
}

// ============================================================
// 14. DOCUMENT VALIDITY CHECK
// ============================================================

export function checkDocumentValidity(documentType, issueDate, expiryDate = null) {
  const validityPeriods = {
    'AMDAL': 5 * 365, // 5 tahun dalam hari
    'UKL_UPL': 3 * 365,
    'DELH': 1 * 365,
    'DPLH': 1 * 365
  };

  const period = validityPeriods[documentType] || 1095; // default 3 tahun
  
  let calculatedExpiry;
  if (!expiryDate && issueDate) {
    const issue = new Date(issueDate);
    calculatedExpiry = new Date(issue);
    calculatedExpiry.setDate(calculatedExpiry.getDate() + period);
  }

  const actualExpiry = expiryDate ? new Date(expiryDate) : calculatedExpiry;
  const today = new Date();
  const daysUntilExpiry = actualExpiry ? Math.ceil((actualExpiry - today) / (1000 * 60 * 60 * 24)) : null;
  
  let status;
  if (!actualExpiry) status = 'UNKNOWN';
  else if (daysUntilExpiry < 0) status = 'EXPIRED';
  else if (daysUntilExpiry < 180) status = 'EXPIRING_SOON';
  else status = 'VALID';

  return {
    documentType,
    issueDate,
    expiryDate: actualExpiry,
    daysUntilExpiry,
    validityPeriod: `${period / 365} tahun`,
    status,
    recommendation: status === 'EXPIRED' 
      ? `Dokumen telah expired ${Math.abs(daysUntilExpiry)} hari yang lalu. Segera lakukan perpanjangan.`
      : status === 'EXPIRING_SOON'
        ? `Dokumen akan expired dalam ${daysUntilExpiry} hari. Persiapkan perpanjangan.`
        : 'Dokumen masih berlaku',
    legalReference: 'Permen LHK No. 4 Tahun 2021 tentang AMDAL dan UKL-UPL'
  };
}

// ============================================================
// 15. FUGITIVE EMISSION ESTIMATION
// ============================================================

export function estimateFugitiveEmission(sources) {
  // Faktor emisi (kg/hari per unit)
  const emissionFactors = {
    parking: { pm10: 0.005, nox: 0.01, area: true }, // per m²
    kitchen: { pm10: 0.05, nox: 0.02, area: false }, // per dapur
    coldStorage: { pm10: 0.001, nox: 0.005, area: false }, // per unit
    generator: { pm10: 0.1, nox: 0.5, area: false } // per unit
  };

  let totalEmissions = { pm10: 0, nox: 0 };

  for (const source of sources) {
    const factor = emissionFactors[source.type];
    if (!factor) continue;

    const multiplier = factor.area ? source.area : source.count;
    totalEmissions.pm10 += factor.pm10 * multiplier;
    totalEmissions.nox += factor.nox * multiplier;
  }

  return {
    dailyEmissions: {
      pm10: totalEmissions.pm10.toFixed(3) + ' kg/hari',
      nox: totalEmissions.nox.toFixed(3) + ' kg/hari'
    },
    annualEmissions: {
      pm10: (totalEmissions.pm10 * 365 / 1000).toFixed(2) + ' ton/tahun',
      nox: (totalEmissions.nox * 365 / 1000).toFixed(2) + ' ton/tahun'
    },
    recommendation: totalEmissions.pm10 > 1 
      ? 'Emisi difus signifikan. Pertimbangkan penambahan vegetasi buffer.'
      : 'Emisi difus dalam batas acceptable'
  };
}

// ============================================================
// 16. INFILTRATION WELL REQUIREMENTS
// ============================================================

export function calculateInfiltrationRequirements(siteArea, runoffCoefficient, rainfallIntensity) {
  // Perhitungan debit limpasan
  const Q = (runoffCoefficient * rainfallIntensity * siteArea) / 360; // m³/s
  const hourlyVolume = Q * 3600; // m³/jam

  // 1 sumur resapan diameter 1m x 2m = ~1.57 m³
  const wellVolume = Math.PI * Math.pow(0.5, 2) * 2; // m³
  const wellsNeeded = Math.ceil(hourlyVolume / wellVolume);
  
  // Minimum 1 sumur per 100 m² (Permen PU 20/2020)
  const minWells = Math.ceil(siteArea / 100);
  const requiredWells = Math.max(wellsNeeded, minWells);

  // Target infiltrasi 30%
  const totalInfiltrationCapacity = requiredWells * wellVolume * 0.5; // 50% efisiensi
  const infiltrationPercentage = (totalInfiltrationCapacity / (siteArea * 0.001)) * 100;

  return {
    siteArea: siteArea + ' m²',
    runoffCoefficient,
    rainfallIntensity: rainfallIntensity + ' mm/jam',
    peakDischarge: Q.toFixed(3) + ' m³/s',
    hourlyVolume: hourlyVolume.toFixed(2) + ' m³/jam',
    wellsNeeded: requiredWells,
    minWells,
    infiltrationPercentage: infiltrationPercentage.toFixed(1) + '%',
    status: infiltrationPercentage >= 30 ? 'PASS' : 'FAIL',
    recommendation: infiltrationPercentage < 30
      ? `Tambah ${Math.ceil((30 - infiltrationPercentage) / 5)} sumur resapan untuk mencapai target 30% infiltrasi.`
      : `Kapasitas infiltrasi ${infiltrationPercentage.toFixed(0)}% memenuhi persyaratan 30%.`
  };
}

// ============================================================
// LEGAL REFERENCES EXPORT
// ============================================================

export const LEGAL_REFERENCES = {
  PP_16_2021: 'PP No. 16 Tahun 2021 tentang Perubahan atas PP 22/2021 (PPLH)',
  UU_32_2009: 'UU No. 32 Tahun 2009 tentang Perlindungan dan Pengelolaan Lingkungan Hidup',
  PERMEN_LHK_4_2021: 'Permen LHK No. 4 Tahun 2021 tentang AMDAL dan UKL-UPL',
  PERMEN_LHK_68_2016: 'Permen LHK No. 68 Tahun 2016 tentang Baku Mutu Air Limbah',
  PERMEN_LHK_21_2008: 'Permen LHK No. 21 Tahun 2008 tentang Baku Mutu Emisi',
  PERMEN_LHK_22_2021: 'Permen LHK No. 22 Tahun 2021 tentang Kualitas Udara Ambien',
  KEPMEN_LH_48_1996: 'Kepmen LH No. 48 Tahun 1996 tentang Baku Tingkat Kebisingan',
  SNI_03_6196_2000: 'SNI 03-6196-2000 tentang Konservasi Energi pada Bangunan Gedung',
  SNI_03_6884_2002: 'SNI 03-6884-2002 tentang Evaluasi Getaran',
  PERMEN_PU_20_2020: 'Permen PU No. 20/PRT/M/2020 tentang Drainase Perkotaan',
  PERPRES_97_2017: 'Perpres No. 97 Tahun 2017 tentang Jakarta Zero Waste'
};

// Export all functions
export default {
  checkWastewaterQuality,
  calculateWaterMassBalance,
  calculateEUI,
  calculateWasteDiversion,
  calculateCarbonFootprint,
  calculateDrainageRational,
  calculateRainwaterPotential,
  calculateWaterFootprint,
  calculateGreenRatio,
  checkNoiseCompliance,
  checkVibrationCompliance,
  checkAmbientAirQuality,
  calculateEnvironmentalScore,
  checkDocumentValidity,
  estimateFugitiveEmission,
  calculateInfiltrationRequirements,
  WASTEWATER_STANDARDS,
  EUI_STANDARDS,
  NOISE_STANDARDS,
  AMBIENT_AIR_STANDARDS,
  STACK_EMISSION_STANDARDS,
  LEGAL_REFERENCES
};
