/**
 * EGRESS SYSTEM CALCULATORS
 * Sistem Jalur Evakuasi berdasarkan:
 * - Permen PUPR No. 14/PRT/M/2017 (Pasal 220)
 * - Permen PUPR No. 26/PRT/M/2008
 */

// ============================================================
// 1. OCCUPANT LOAD CALCULATORS
// ============================================================

/**
 * Area per occupant berdasarkan fungsi ruang (Permen 14/2017)
 */
const OCCUPANT_LOAD_FACTORS = {
  'rs_rawat_inap': { areaPerPerson: 10, name: 'RS Rawat Inap' },
  'rs_rawat_jalan': { areaPerPerson: 3, name: 'RS Rawat Jalan' },
  'kantor': { areaPerPerson: 10, name: 'Kantor' },
  'koridor': { areaPerPerson: null, percentOfArea: 0.5, name: 'Koridor (50% luas)' },
  'aula_berdiri': { areaPerPerson: 1.5, name: 'Aula (Berdiri)' },
  'aula_duduk': { areaPerPerson: 0.75, name: 'Aula (Duduk)' },
  'retail': { areaPerPerson: 3, name: 'Retail/Toko' },
  'restoran': { areaPerPerson: 1.5, name: 'Restoran' },
  'hotel_kamar': { areaPerPerson: 10, name: 'Hotel Kamar' },
  'hotel_lobby': { areaPerPerson: 3, name: 'Hotel Lobby' },
  'industri': { areaPerPerson: 10, name: 'Industri' },
  'gudang': { areaPerPerson: 30, name: 'Gudang' },
  'parkir': { areaPerPerson: 30, name: 'Parkir' },
  'laboratorium': { areaPerPerson: 5, name: 'Laboratorium' },
  'perpustakaan': { areaPerPerson: 5, name: 'Perpustakaan' },
  'olah_raga': { areaPerPerson: 3, name: 'Ruang Olah Raga' }
};

/**
 * Kapasitas factor untuk komponen evakuasi (Permen 14/2017)
 */
const CAPACITY_FACTORS = {
  'door': 200,      // orang/meter lebar efektif
  'stair': 150,     // orang/meter lebar efektif
  'corridor': 150,  // orang/meter lebar efektif
  'ramp': 150,      // orang/meter lebar efektif
  'aisle': 200      // orang/meter untuk assembly
};

/**
 * Lebar minimum komponen evakuasi (meter)
 */
const MINIMUM_WIDTHS = {
  'door': {
    'default': 0.9,
    'rs': 1.2,
    'assembly': 1.5
  },
  'stair': {
    'default': 1.0,
    'rs': 1.2,
    'highrise': 1.2
  },
  'corridor': {
    'default': 1.2,
    'rs_1way': 1.8,
    'rs_2way': 2.4,
    'assembly': 2.0,
    'highrise': 1.5
  }
};

/**
 * Jarak tempuh maksimum (meter) berdasarkan klasifikasi
 */
const TRAVEL_DISTANCE_LIMITS = {
  'healthcare': 45,    // RS (Kategori Risiko IV)
  'office': 60,        // Kantor (Kategori II)
  'residential': 45,   // Hunian
  'assembly': 60,      // Aula/Assembly
  'mercantile': 60,    // Perdagangan
  'industrial': 60,   // Industri
  'storage': 75,       // Gudang
  'parking': 60       // Parkir
};

/**
 * Klasifikasi bahaya kebakaran (Permen 26/2008)
 */
const FIRE_CLASSIFICATION = {
  'A': {
    name: 'Kelas A (Tinggi)',
    description: 'RS, hotel >8 lantai, gedung >24m',
    requirements: {
      stairMinWidth: 1.2,
      corridorMinWidth: 2.4,
      smokeProofRequired: true,
      pressurizationRequired: true
    }
  },
  'B': {
    name: 'Kelas B (Sedang)',
    description: 'Kantor 4-8 lantai, hotel 4-8 lantai',
    requirements: {
      stairMinWidth: 1.0,
      corridorMinWidth: 1.5,
      smokeProofRequired: false,
      pressurizationRequired: true
    }
  },
  'C': {
    name: 'Kelas C (Rendah)',
    description: 'Hunian <4 lantai, kantor <4 lantai',
    requirements: {
      stairMinWidth: 1.0,
      corridorMinWidth: 1.2,
      smokeProofRequired: false,
      pressurizationRequired: false
    }
  }
};

// ============================================================
// CALCULATION FUNCTIONS
// ============================================================

/**
 * Hitung Occupant Load untuk ruang (Permen 14/2017 Pasal 220)
 * @param {string} roomType - Tipe ruang
 * @param {number} area - Luas ruang (m²)
 * @returns {Object} Hasil perhitungan occupant load
 */
export function calculateOccupantLoad(roomType, area) {
  const factor = OCCUPANT_LOAD_FACTORS[roomType];
  if (!factor) {
    return { error: 'Tipe ruang tidak dikenal', occupantLoad: 0 };
  }
  
  let occupantLoad;
  if (factor.percentOfArea) {
    occupantLoad = Math.ceil(area * factor.percentOfArea / factor.areaPerPerson);
  } else {
    occupantLoad = Math.ceil(area / factor.areaPerPerson);
  }
  
  return {
    roomType: factor.name,
    area: area,
    areaPerPerson: factor.areaPerPerson,
    percentFactor: factor.percentOfArea,
    occupantLoad: occupantLoad,
    calculation: factor.percentOfArea 
      ? `(${area} m² × ${factor.percentOfArea * 100}%) / ${factor.areaPerPerson} m²/orang`
      : `${area} m² / ${factor.areaPerPerson} m²/orang`,
    note: factor.percentOfArea ? 'Koridor dihitung 50% luasan' : null
  };
}

/**
 * Hitung kebutuhan lebar exit (Permen 14/2017)
 * @param {number} occupantLoad - Jumlah penghuni
 * @param {string} componentType - door, stair, corridor, ramp
 * @param {number} measuredWidth - Lebar terukur (meter)
 * @param {string} buildingClass - A, B, C atau rs, assembly
 * @returns {Object} Analisis lebar egress
 */
export function calculateEgressWidth(occupantLoad, componentType, measuredWidth, buildingClass = 'default') {
  const capacityFactor = CAPACITY_FACTORS[componentType] || 150;
  const requiredWidth = occupantLoad / capacityFactor;
  
  // Get minimum width based on building class
  let minWidth = MINIMUM_WIDTHS[componentType]?.default || 0.9;
  if (buildingClass === 'A' || buildingClass === 'rs') {
    minWidth = MINIMUM_WIDTHS[componentType]?.rs || minWidth;
  } else if (buildingClass === 'assembly') {
    minWidth = MINIMUM_WIDTHS[componentType]?.assembly || minWidth;
  }
  
  const compliantWidth = Math.max(requiredWidth, minWidth);
  const isPass = measuredWidth >= compliantWidth;
  
  // Calculate capacity with measured width
  const actualCapacity = Math.floor(measuredWidth * capacityFactor);
  
  return {
    componentType,
    occupantLoad,
    capacityFactor: `${capacityFactor} orang/m`,
    requiredWidth: {
      calculated: parseFloat(requiredWidth.toFixed(2)),
      minimum: minWidth,
      compliant: parseFloat(compliantWidth.toFixed(2))
    },
    measuredWidth: parseFloat(measuredWidth.toFixed(2)),
    actualCapacity,
    status: isPass ? 'PASS' : 'FAIL',
    utilization: parseFloat((occupantLoad / actualCapacity * 100).toFixed(1)),
    deficiency: isPass ? 0 : parseFloat((compliantWidth - measuredWidth).toFixed(2)),
    recommendation: !isPass 
      ? `Tambahkan lebar ${(compliantWidth - measuredWidth).toFixed(2)}m atau kurangi occupant load`
      : null
  };
}

/**
 * Cek jarak tempuh (Travel Distance) (Permen 14/2017 & 26/2008)
 * @param {number} distance - Jarak terukur (meter)
 * @param {string} buildingClass - healthcare, office, residential, assembly
 * @param {boolean} hasSprinkler - Ada sprinkler
 * @param {boolean} isDeadEnd - Dead end corridor
 * @returns {Object} Status compliance travel distance
 */
export function checkTravelDistance(distance, buildingClass, hasSprinkler = false, isDeadEnd = false) {
  let limit = TRAVEL_DISTANCE_LIMITS[buildingClass] || 60;
  
  // Apply sprinkler bonus (+25%)
  const sprinklerBonus = hasSprinkler ? 1.25 : 1.0;
  const adjustedLimit = limit * sprinklerBonus;
  
  // Dead end corridor limit (Permen 26/2008)
  const deadEndLimit = 7.6;
  const effectiveLimit = isDeadEnd ? deadEndLimit : adjustedLimit;
  
  const isCompliant = distance <= effectiveLimit;
  const utilization = (distance / effectiveLimit * 100).toFixed(1);
  
  return {
    measured: distance,
    baseLimit: limit,
    hasSprinkler,
    sprinklerBonus: hasSprinkler ? '+25%' : '0%',
    adjustedLimit: parseFloat(adjustedLimit.toFixed(1)),
    isDeadEnd,
    effectiveLimit: parseFloat(effectiveLimit.toFixed(1)),
    utilization: `${utilization}%`,
    status: isCompliant ? 'COMPLIANT' : 'VIOLATION',
    excess: isCompliant ? 0 : parseFloat((distance - effectiveLimit).toFixed(1)),
    violation: !isCompliant,
    recommendation: !isCompliant
      ? isDeadEnd 
        ? 'Dead end corridor melebihi 7.6m - tambahkan exit tambahan'
        : `Jarak ${distance}m melebihi batas ${effectiveLimit}m - pertimbangkan exit tambahan`
      : null
  };
}

/**
 * Hitung Common Path of Travel
 * @param {number} commonPathDistance - Jarak common path (meter)
 * @param {string} occupancyType - healthcare, assembly, office
 * @returns {Object} Status compliance
 */
export function checkCommonPathOfTravel(commonPathDistance, occupancyType) {
  const limits = {
    'healthcare': 30,
    'assembly': 23,
    'hazardous': 15,
    'office': 30,
    'residential': 30
  };
  
  const limit = limits[occupancyType] || 30;
  const isCompliant = commonPathDistance <= limit;
  
  return {
    measured: commonPathDistance,
    limit: limit,
    status: isCompliant ? 'COMPLIANT' : 'VIOLATION',
    utilization: `${(commonPathDistance / limit * 100).toFixed(1)}%`,
    recommendation: !isCompliant
      ? `Common path ${commonPathDistance}m melebihi batas ${limit}m - diverge sebelum jarak ini`
      : null
  };
}

/**
 * Validasi dimensi tangga (Permen 14/2017)
 * @param {number} riser - Tinggi anak tangga (mm)
 * @param {number} tread - Lebar pijakan (mm)
 * @param {number} nosing - Proyeksi nosing (mm)
 * @returns {Object} Validasi tangga
 */
export function validateStairDimensions(riser, tread, nosing = 0) {
  // Permen 14/2017 requirements
  const riserMax = 200;
  const riserMin = 150;
  const treadMin = 250;
  const nosingMax = 25;
  
  // Comfort formula: 2O + A = 600-650mm
  const comfortFormula = 2 * riser + tread;
  const isComfortable = comfortFormula >= 600 && comfortFormula <= 650;
  
  const riserValid = riser >= riserMin && riser <= riserMax;
  const treadValid = tread >= treadMin;
  const nosingValid = nosing <= nosingMax;
  
  return {
    dimensions: {
      riser: { value: riser, min: riserMin, max: riserMax, valid: riserValid },
      tread: { value: tread, min: treadMin, valid: treadValid },
      nosing: { value: nosing, max: nosingMax, valid: nosingValid }
    },
    comfort: {
      formula: `2 × ${riser} + ${tread} = ${comfortFormula}mm`,
      value: comfortFormula,
      ideal: '600-650mm',
      status: isComfortable ? 'COMFORTABLE' : comfortFormula < 600 ? 'TOO STEEP' : 'TOO SHALLOW'
    },
    overall: {
      status: riserValid && treadValid && nosingValid ? 'PASS' : 'FAIL',
      violations: [
        !riserValid ? `Riser harus ${riserMin}-${riserMax}mm` : null,
        !treadValid ? `Tread minimal ${treadMin}mm` : null,
        !nosingValid ? `Nosing maksimal ${nosingMax}mm` : null
      ].filter(Boolean)
    }
  };
}

/**
 * Hitung Egress Time (RSET - Required Safe Egress Time)
 * @param {Object} params - Parameter perhitungan
 * @returns {Object} Analisis waktu evakuasi
 */
export function calculateEgressTime(params) {
  const {
    detectionTime = 1,      // menit
    alarmTime = 0.5,        // menit
    preMovementTime = 2,    // menit (recognition + reaction)
    travelDistance = 45,    // meter
    hasStairs = true,
    occupantDensity = 0.5   // orang/m² (affects walking speed)
  } = params;
  
  // Walking speeds (m/s)
  const horizontalSpeed = occupantDensity > 1.0 ? 0.8 : 1.2;
  const stairSpeed = 0.6;  // m/s naik/turun tangga
  
  // Split distance (assume 50% horizontal, 50% stairs if hasStairs)
  const horizontalDist = hasStairs ? travelDistance * 0.5 : travelDistance;
  const stairDist = hasStairs ? travelDistance * 0.5 : 0;
  
  const horizontalTime = horizontalDist / horizontalSpeed / 60;  // convert to minutes
  const stairTime = stairDist / stairSpeed / 60;
  
  const totalTravelTime = horizontalTime + stairTime;
  const rset = detectionTime + alarmTime + preMovementTime + totalTravelTime;
  
  return {
    phases: {
      detection: { time: detectionTime, description: 'Deteksi api/asap' },
      alarm: { time: alarmTime, description: 'Alarm berbunyi' },
      preMovement: { time: preMovementTime, description: 'Reaksi & persiapan' },
      travel: { 
        time: parseFloat(totalTravelTime.toFixed(2)), 
        horizontal: parseFloat(horizontalTime.toFixed(2)),
        stairs: parseFloat(stairTime.toFixed(2)),
        description: 'Pergerakan ke exit'
      }
    },
    totalRSET: parseFloat(rset.toFixed(2)),
    walkingSpeed: {
      horizontal: `${horizontalSpeed} m/s`,
      stairs: `${stairSpeed} m/s`
    },
    assessment: {
      // Compare with typical ASET (Available Safe Egress Time) of 15-30 minutes
      typicalASET: 15,
      safetyMargin: parseFloat((15 - rset).toFixed(2)),
      status: rset < 15 ? 'SAFE' : rset < 20 ? 'MARGINAL' : 'UNSAFE'
    }
  };
}

/**
 * Hitung Area Refuge Floor
 * @param {number} totalOccupants - Total penghuni gedung
 * @param {number} providedArea - Luas area refuge yang tersedia (m²)
 * @returns {Object} Analisis refuge area
 */
export function calculateRefugeArea(totalOccupants, providedArea) {
  // Minimum 0.3 m²/orang untuk gedung >40m (Permen 26/2008)
  const minAreaPerPerson = 0.3;
  const requiredArea = totalOccupants * minAreaPerPerson;
  const isCompliant = providedArea >= requiredArea;
  
  return {
    totalOccupants,
    providedArea,
    minAreaPerPerson: `${minAreaPerPerson} m²/orang`,
    requiredArea: parseFloat(requiredArea.toFixed(1)),
    capacity: Math.floor(providedArea / minAreaPerPerson),
    status: isCompliant ? 'COMPLIANT' : 'INSUFFICIENT',
    utilization: `${(requiredArea / providedArea * 100).toFixed(1)}%`,
    deficiency: isCompliant ? 0 : parseFloat((requiredArea - providedArea).toFixed(1))
  };
}

/**
 * Skor Compliance Egress Komposit
 * @param {Object} scores - Skor tiap komponen
 * @returns {Object} Skor komposit
 */
export function calculateEgressComplianceScore(scores) {
  const {
    exitNumber = 0,      // 20 poin
    travelDistance = 0,  // 20 poin
    widthCapacity = 0,   // 20 poin
    stairProtection = 0, // 20 poin
    lightingSign = 0     // 20 poin
  } = scores;
  
  const totalScore = exitNumber + travelDistance + widthCapacity + stairProtection + lightingSign;
  const isPass = totalScore >= 80;
  
  return {
    components: {
      exitNumber: { score: exitNumber, max: 20, weight: '20%' },
      travelDistance: { score: travelDistance, max: 20, weight: '20%' },
      widthCapacity: { score: widthCapacity, max: 20, weight: '20%' },
      stairProtection: { score: stairProtection, max: 20, weight: '20%' },
      lightingSign: { score: lightingSign, max: 20, weight: '20%' }
    },
    total: {
      score: totalScore,
      max: 100,
      percentage: `${totalScore}%`,
      isPass,
      grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : totalScore >= 70 ? 'C' : 'D'
    },
    status: isPass ? 'LAIK' : 'TIDAK_LAIK',
    threshold: '80/100'
  };
}

// ============================================================
// DEFAULT EXPORTS
// ============================================================

export default {
  OCCUPANT_LOAD_FACTORS,
  CAPACITY_FACTORS,
  MINIMUM_WIDTHS,
  TRAVEL_DISTANCE_LIMITS,
  FIRE_CLASSIFICATION,
  calculateOccupantLoad,
  calculateEgressWidth,
  checkTravelDistance,
  checkCommonPathOfTravel,
  validateStairDimensions,
  calculateEgressTime,
  calculateRefugeArea,
  calculateEgressComplianceScore
};
