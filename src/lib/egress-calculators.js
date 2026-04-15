/**
 * EGRESS SYSTEM CALCULATORS
 * Perhitungan berdasarkan Permen PUPR No. 14/PRT/M/2017 (Pasal 220) dan Permen PUPR No. 26/PRT/M/2008
 * 
 * Fitur:
 * - Occupant Load Calculator
 * - Egress Width & Capacity Calculator
 * - Travel Distance Calculator
 * - Building Classification
 * - Compliance Checker
 */

/**
 * ============================================
 * 1. OCCUPANT LOAD CALCULATOR
 * ============================================
 * Perhitungan jumlah penghuni berdasarkan fungsi ruang (Permen 14/2017 Pasal 220)
 */

/**
 * Faktor occupant load berdasarkan fungsi ruang (m²/orang)
 */
export const OCCUPANT_FACTORS = {
  RS_INPATIENT: { factor: 10, label: 'Rumah Sakit (Rawat Inap)', category: 'IV' },
  OFFICE: { factor: 10, label: 'Kantor', category: 'II' },
  CORRIDOR: { factor: 0.5, label: 'Koridor (50% luasan)', category: 'II' },
  ASSEMBLY_STANDING: { factor: 1.5, label: 'Aula/Assembly (Berdiri)', category: 'III' },
  ASSEMBLY_SEATED: { factor: 0.75, label: 'Aula/Assembly (Duduk)', category: 'III' },
  RETAIL: { factor: 3, label: 'Perdagangan/Retail', category: 'II' },
  EDUCATION: { factor: 4, label: 'Pendidikan', category: 'III' },
  RESTAURANT: { factor: 1.5, label: 'Restoran', category: 'II' },
  HOTEL_GUEST_ROOM: { factor: 10, label: 'Kamar Hotel', category: 'II' },
  HOTEL_LOBBY: { factor: 3, label: 'Lobi Hotel', category: 'II' },
  INDUSTRIAL: { factor: 10, label: 'Industri', category: 'III' },
  WAREHOUSE: { factor: 30, label: 'Gudang', category: 'II' },
  PARKING: { factor: 30, label: 'Parkir', category: 'I' },
  RESIDENTIAL: { factor: 10, label: 'Hunian', category: 'I' }
};

/**
 * Hitung occupant load
 * @param {number} area - Luas ruang dalam m²
 * @param {string} roomFunction - Kode fungsi ruang
 * @returns {Object} Hasil perhitungan
 */
export function calculateOccupantLoad(area, roomFunction) {
  const config = OCCUPANT_FACTORS[roomFunction];
  if (!config) {
    return { error: 'Fungsi ruang tidak dikenal' };
  }
  
  let occupantLoad;
  if (roomFunction === 'CORRIDOR') {
    // Koridor: dihitung 50% luasan (factor 0.5 m²/orang)
    occupantLoad = Math.ceil(area / config.factor);
  } else {
    occupantLoad = Math.ceil(area / config.factor);
  }
  
  return {
    area,
    roomFunction,
    functionLabel: config.label,
    category: config.category,
    occupantFactor: config.factor,
    occupantLoad,
    unit: 'orang'
  };
}

/**
 * Hitung total occupant load untuk multiple ruang
 * @param {Array} rooms - Array objek {area, roomFunction}
 * @returns {Object} Total dan breakdown
 */
export function calculateTotalOccupantLoad(rooms) {
  const breakdown = rooms.map(room => calculateOccupantLoad(room.area, room.roomFunction));
  const total = breakdown.reduce((sum, item) => sum + item.occupantLoad, 0);
  
  return {
    total,
    breakdown,
    byCategory: breakdown.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.occupantLoad;
      return acc;
    }, {})
  };
}

/**
 * ============================================
 * 2. EGRESS WIDTH & CAPACITY CALCULATOR
 * ============================================
 * Perhitungan lebar exit dan kapasitas berdasarkan komponen
 */

/**
 * Kapasitas faktor berdasarkan komponen (orang/meter lebar efektif)
 */
export const CAPACITY_FACTORS = {
  DOOR: { factor: 200, minWidth: 0.9, label: 'Pintu/Door' },
  STAIR: { factor: 150, minWidth: 1.2, label: 'Tangga/Stair' },
  CORRIDOR: { factor: 150, minWidth: 1.5, label: 'Koridor/Corridor' },
  RAMP: { factor: 150, minWidth: 1.2, label: 'Ramp/Landai' },
  AISLE: { factor: 200, minWidth: 1.2, label: 'Gang/Aisle' }
};

/**
 * Minimum width berdasarkan jenis bangunan (meter)
 */
export const MIN_WIDTH_BY_BUILDING = {
  RS: { 
    DOOR: 0.9,
    STAIR: 1.2,
    CORRIDOR_ONE_WAY: 1.8,
    CORRIDOR_TWO_WAY: 2.4,
    CORRIDOR_GENERAL: 2.4
  },
  OFFICE: {
    DOOR: 0.9,
    STAIR: 1.0,
    CORRIDOR: 1.5
  },
  HIGH_RISE: { // >8 lantai
    STAIR: 1.2,
    CORRIDOR: 1.5
  },
  ASSEMBLY: {
    DOOR: 1.0,
    AISLE: 1.2,
    CORRIDOR: 2.0
  }
};

/**
 * Hitung kebutuhan lebar exit
 * @param {number} occupantLoad - Jumlah penghuni
 * @param {string} componentType - Tipe komponen (DOOR, STAIR, CORRIDOR, etc)
 * @param {number} measuredWidth - Lebar terukur (opsional)
 * @param {string} buildingType - Tipe bangunan (RS, OFFICE, etc)
 * @returns {Object} Hasil perhitungan
 */
export function calculateEgressWidth(occupantLoad, componentType, measuredWidth = null, buildingType = 'OFFICE') {
  const capacityConfig = CAPACITY_FACTORS[componentType];
  if (!capacityConfig) {
    return { error: 'Tipe komponen tidak dikenal' };
  }
  
  // Hitung lebar yang dibutuhkan
  const requiredWidth = occupantLoad / capacityConfig.factor;
  
  // Get minimum width
  let minWidth = capacityConfig.minWidth;
  const buildingMins = MIN_WIDTH_BY_BUILDING[buildingType];
  if (buildingMins && buildingMins[componentType]) {
    minWidth = Math.max(minWidth, buildingMins[componentType]);
  }
  
  // Lebar compliant adalah max(required, min)
  const compliantWidth = Math.max(requiredWidth, minWidth);
  
  // Kapasitas yang tersedia jika lebar terukur diketahui
  let providedCapacity = null;
  let status = 'UNKNOWN';
  
  if (measuredWidth !== null) {
    providedCapacity = Math.floor(measuredWidth * capacityConfig.factor);
    status = measuredWidth >= compliantWidth ? 'PASS' : 'FAIL';
  }
  
  return {
    occupantLoad,
    componentType,
    componentLabel: capacityConfig.label,
    capacityFactor: capacityConfig.factor,
    calculatedWidth: parseFloat(requiredWidth.toFixed(2)),
    minWidth,
    compliantWidth: parseFloat(compliantWidth.toFixed(2)),
    measuredWidth,
    providedCapacity,
    status,
    unit: 'meter'
  };
}

/**
 * Hitung kapasitas dari lebar yang ada
 * @param {number} width - Lebar dalam meter
 * @param {string} componentType - Tipe komponen
 * @returns {number} Kapasitas dalam orang
 */
export function calculateCapacityFromWidth(width, componentType) {
  const capacityConfig = CAPACITY_FACTORS[componentType];
  if (!capacityConfig) return 0;
  return Math.floor(width * capacityConfig.factor);
}

/**
 * ============================================
 * 3. TRAVEL DISTANCE CALCULATOR
 * ============================================
 * Perhitungan jarak tempuh maksimum (Permen 14/2017 & Permen 26/2008)
 */

/**
 * Batas travel distance berdasarkan kategori risiko (meter)
 */
export const TRAVEL_DISTANCE_LIMITS = {
  // Permen 14/2017 Pasal 220
  HEALTHCARE: { base: 45, label: 'RS/Kesehatan (Risiko IV)', category: 'IV' },
  OFFICE: { base: 60, label: 'Kantor (Risiko II)', category: 'II' },
  RESIDENTIAL: { base: 45, label: 'Hunian (Risiko I)', category: 'I' },
  ASSEMBLY: { base: 60, label: 'Aula/Assembly (Risiko III)', category: 'III' },
  EDUCATION: { base: 60, label: 'Pendidikan (Risiko III)', category: 'III' },
  INDUSTRIAL: { base: 60, label: 'Industri (Risiko III)', category: 'III' },
  RETAIL: { base: 60, label: 'Perdagangan (Risiko II)', category: 'II' },
  STORAGE: { base: 60, label: 'Gudang (Risiko II)', category: 'II' }
};

/**
 * Cek travel distance
 * @param {number} distance - Jarak tempuh terukur (meter)
 * @param {string} buildingClass - Kelas bangunan (HEALTHCARE, OFFICE, etc)
 * @param {boolean} hasSprinkler - Ada sprinkler?
 * @param {boolean} isDeadEnd - Dead end corridor?
 * @returns {Object} Hasil analisis
 */
export function checkTravelDistance(distance, buildingClass, hasSprinkler = false, isDeadEnd = false) {
  const limitConfig = TRAVEL_DISTANCE_LIMITS[buildingClass];
  if (!limitConfig) {
    return { error: 'Kelas bangunan tidak dikenal' };
  }
  
  let limit = limitConfig.base;
  
  // Dengan sprinkler: +25%
  if (hasSprinkler) {
    limit = limit * 1.25;
  }
  
  // Dead end corridor max 7.6m (Permen 26/2008)
  if (isDeadEnd) {
    limit = 7.6;
  }
  
  const utilization = (distance / limit) * 100;
  
  return {
    measured: distance,
    allowed: parseFloat(limit.toFixed(1)),
    baseLimit: limitConfig.base,
    hasSprinkler,
    isDeadEnd,
    utilization: parseFloat(utilization.toFixed(1)),
    status: distance <= limit ? 'COMPLIANT' : 'VIOLATION',
    remaining: parseFloat((limit - distance).toFixed(1)),
    buildingClass: limitConfig.label
  };
}

/**
 * ============================================
 * 4. BUILDING CLASSIFICATION
 * ============================================
 * Klasifikasi tingkat bahaya kebakaran (Permen 26/2008)
 */

/**
 * Kelas bangunan berdasarkan risiko kebakaran
 */
export const BUILDING_FIRE_CLASSES = {
  A: {
    id: 'A',
    name: 'Kelas A - Tinggi',
    description: 'Bangunan dengan risiko kebakaran tinggi',
    examples: ['Rumah Sakit', 'Hotel >8 lantai', 'Pabrik bahan berbahaya'],
    stringency: 'Tinggi',
    evacuationRequirements: 'Sangat ketat'
  },
  B: {
    id: 'B',
    name: 'Kelas B - Sedang',
    description: 'Bangunan dengan risiko kebakaran sedang',
    examples: ['Perkantoran 4-8 lantai', 'Apartemen', 'Hotel 4-8 lantai'],
    stringency: 'Sedang',
    evacuationRequirements: 'Ketat'
  },
  C: {
    id: 'C',
    name: 'Kelas C - Rendah',
    description: 'Bangunan dengan risiko kebakaran rendah',
    examples: ['Hunian <4 lantai', 'Kantor <4 lantai'],
    stringency: 'Standar',
    evacuationRequirements: 'Normal'
  }
};

/**
 * Tentukan kelas bangunan
 * @param {string} buildingFunction - Fungsi bangunan
 * @param {number} floorCount - Jumlah lantai
 * @returns {Object} Kelas bangunan
 */
export function classifyBuilding(buildingFunction, floorCount) {
  // RS selalu Kelas A
  if (buildingFunction === 'HEALTHCARE' || buildingFunction === 'RS_INPATIENT') {
    return BUILDING_FIRE_CLASSES.A;
  }
  
  // Hotel >8 lantai = Kelas A
  if (buildingFunction === 'HOTEL' && floorCount > 8) {
    return BUILDING_FIRE_CLASSES.A;
  }
  
  // Perkantoran, apartemen 4-8 lantai = Kelas B
  if ((buildingFunction === 'OFFICE' || buildingFunction === 'RESIDENTIAL') && 
      floorCount >= 4 && floorCount <= 8) {
    return BUILDING_FIRE_CLASSES.B;
  }
  
  // <4 lantai = Kelas C
  if (floorCount < 4) {
    return BUILDING_FIRE_CLASSES.C;
  }
  
  // Default
  return BUILDING_FIRE_CLASSES.B;
}

/**
 * ============================================
 * 5. COMMON PATH OF TRAVEL CALCULATOR
 * ============================================
 */

/**
 * Batas common path of travel (meter)
 */
export const COMMON_PATH_LIMITS = {
  HEALTHCARE: 30,
  ASSEMBLY: 23,
  HAZARDOUS: 15,
  OFFICE: 23,
  RESIDENTIAL: 15
};

/**
 * Cek common path distance
 * @param {number} distance - Jarak common path (meter)
 * @param {string} buildingFunction - Fungsi bangunan
 * @returns {Object} Hasil analisis
 */
export function checkCommonPathDistance(distance, buildingFunction) {
  const limit = COMMON_PATH_LIMITS[buildingFunction] || 23;
  
  return {
    measured: distance,
    allowed: limit,
    utilization: parseFloat(((distance / limit) * 100).toFixed(1)),
    status: distance <= limit ? 'COMPLIANT' : 'VIOLATION',
    remaining: limit - distance
  };
}

/**
 * ============================================
 * 6. STAIR DIMENSIONS CALCULATOR
 * ============================================
 * Verifikasi dimensi anak tangga (Permen 14/2017)
 */

/**
 * Validasi dimensi tangga
 * @param {number} riserHeight - Tinggi anak tangga (O) dalam mm
 * @param {number} treadDepth - Kedalaman pijakan (A) dalam mm
 * @param {number} nosing - Nosing protrusion dalam mm
 * @returns {Object} Hasil validasi
 */
export function validateStairDimensions(riserHeight, treadDepth, nosing = 0) {
  // 2O + A harus 600-650mm (comfort formula)
  const comfortFormula = 2 * riserHeight + treadDepth;
  
  return {
    riserHeight,
    treadDepth,
    nosing,
    comfortFormula,
    riserOk: riserHeight >= 150 && riserHeight <= 200,
    treadOk: treadDepth >= 250,
    comfortOk: comfortFormula >= 600 && comfortFormula <= 650,
    nosingOk: nosing <= 25,
    overallOk: (riserHeight >= 150 && riserHeight <= 200) && 
               treadDepth >= 250 && 
               comfortFormula >= 600 && comfortFormula <= 650 &&
               nosing <= 25
  };
}

/**
 * ============================================
 * 7. HEADROOM CLEARANCE CHECKER
 * ============================================
 */

/**
 * Cek headroom clearance
 * @param {number} headroom - Tinggi bebas (mm)
 * @param {string} location - Lokasi (STAIR_STRINGER, LANDING, EXIT)
 * @returns {Object} Hasil pengecekan
 */
export function checkHeadroomClearance(headroom, location) {
  const limits = {
    STAIR_STRINGER: 2000,
    LANDING: 2100,
    EXIT: 2100
  };
  
  const limit = limits[location] || 2100;
  
  return {
    measured: headroom,
    required: limit,
    status: headroom >= limit ? 'PASS' : 'FAIL',
    margin: headroom - limit
  };
}

/**
 * ============================================
 * 8. EMERGENCY LIGHTING CALCULATOR
 * ============================================
 */

/**
 * Standar lux level (Permen 14/2017 Tabel 5.A)
 */
export const LUX_REQUIREMENTS = {
  EXIT_SIGN: { min: 50, label: 'Exit Sign' },
  STAIR_TREAD: { min: 20, label: 'Tangga (tread)' },
  CORRIDOR_FLOOR: { min: 10, label: 'Koridor (floor level)' },
  OPERATING_ROOM: { min: 200, label: 'Kamar Operasi' },
  MOSQUE: { min: 200, label: 'Masjid' },
  GENERAL: { min: 10, label: 'Umum' }
};

/**
 * Cek emergency lighting compliance
 * @param {number} luxLevel - Level pencahayaan terukur (lux)
 * @param {string} locationType - Jenis lokasi
 * @returns {Object} Hasil pengecekan
 */
export function checkEmergencyLighting(luxLevel, locationType) {
  const requirement = LUX_REQUIREMENTS[locationType] || LUX_REQUIREMENTS.GENERAL;
  
  return {
    measured: luxLevel,
    required: requirement.min,
    status: luxLevel >= requirement.min ? 'PASS' : 'FAIL',
    locationType: requirement.label,
    margin: luxLevel - requirement.min
  };
}

/**
 * ============================================
 * 9. SMOKE ZONE CALCULATOR
 * ============================================
 */

/**
 * Cek smoke zone compliance
 * @param {number} zoneArea - Luas zona (m²)
 * @param {number} smokeLayerHeight - Tinggi lapisan asap (m dari lantai)
 * @param {number} pressureDifferential - Perbedaan tekanan (Pa)
 * @returns {Object} Hasil pengecekan
 */
export function checkSmokeZone(zoneArea, smokeLayerHeight, pressureDifferential = null) {
  const result = {
    area: zoneArea,
    maxArea: 1600,
    areaOk: zoneArea <= 1600,
    smokeLayerHeight,
    maxSmokeLayerHeight: 2.5,
    smokeLayerOk: smokeLayerHeight <= 2.5
  };
  
  if (pressureDifferential !== null) {
    result.pressureDifferential = pressureDifferential;
    result.minPressure = 25;
    result.maxPressure = 50;
    result.pressureOk = pressureDifferential >= 25 && pressureDifferential <= 50;
  }
  
  result.overallOk = result.areaOk && result.smokeLayerOk && 
                    (pressureDifferential === null || result.pressureOk);
  
  return result;
}

/**
 * ============================================
 * 10. REFUGE AREA CALCULATOR
 * ============================================
 * Untuk gedung >40m
 */

/**
 * Hitung kebutuhan refuge area
 * @param {number} occupantLoad - Jumlah penghuni
 * @param {number} providedArea - Luas yang tersedia (m²)
 * @returns {Object} Hasil perhitungan
 */
export function calculateRefugeArea(occupantLoad, providedArea) {
  const requiredArea = occupantLoad * 0.3; // 0.3 m²/orang
  
  return {
    occupantLoad,
    requiredArea: parseFloat(requiredArea.toFixed(2)),
    providedArea,
    status: providedArea >= requiredArea ? 'PASS' : 'FAIL',
    margin: parseFloat((providedArea - requiredArea).toFixed(2)),
    unit: 'm²'
  };
}

/**
 * ============================================
 * 11. EGRESS COMPLIANCE SCORECARD
 * ============================================
 */

/**
 * Hitung compliance score
 * @param {Object} params - Parameter penilaian
 * @returns {Object} Skor dan kategori
 */
export function calculateEgressComplianceScore(params) {
  const {
    exitNumberOk,
    travelDistanceOk,
    widthCapacityOk,
    stairProtectionOk,
    lightingSignOk
  } = params;
  
  let score = 0;
  
  if (exitNumberOk) score += 20;
  if (travelDistanceOk) score += 20;
  if (widthCapacityOk) score += 20;
  if (stairProtectionOk) score += 20;
  if (lightingSignOk) score += 20;
  
  return {
    score,
    maxScore: 100,
    passThreshold: 80,
    passed: score >= 80,
    breakdown: {
      exitNumber: exitNumberOk ? 20 : 0,
      travelDistance: travelDistanceOk ? 20 : 0,
      widthCapacity: widthCapacityOk ? 20 : 0,
      stairProtection: stairProtectionOk ? 20 : 0,
      lightingSign: lightingSignOk ? 20 : 0
    }
  };
}

/**
 * ============================================
 * 12. RSET CALCULATOR
 * ============================================
 * Required Safe Egress Time
 */

/**
 * Walking speeds (m/s)
 */
export const WALKING_SPEEDS = {
  HORIZONTAL: 1.2,
  STAIR_DOWN: 0.6,
  STAIR_UP: 0.4,
  EVACUATION_CHAIR: 0.3
};

/**
 * Hitung RSET
 * @param {number} travelDistance - Jarak tempuh (meter)
 * @param {string} pathType - Tipe jalur (HORIZONTAL, STAIR_DOWN, STAIR_UP)
 * @param {number} detectionTime - Waktu deteksi (detik)
 * @param {number} alarmTime - Waktu alarm (detik)
 * @param {number} preMovementTime - Waktu pre-movement (detik)
 * @returns {Object} Hasil perhitungan
 */
export function calculateRSET(travelDistance, pathType = 'HORIZONTAL', 
  detectionTime = 60, alarmTime = 30, preMovementTime = 180) {
  
  const speed = WALKING_SPEEDS[pathType] || WALKING_SPEEDS.HORIZONTAL;
  const travelTime = travelDistance / speed;
  const rset = detectionTime + alarmTime + preMovementTime + travelTime;
  
  return {
    detectionTime,
    alarmTime,
    preMovementTime,
    travelTime: parseFloat(travelTime.toFixed(1)),
    rset: parseFloat(rset.toFixed(1)),
    walkingSpeed: speed,
    travelDistance
  };
}

/**
 * ============================================
 * 13. LEGAL REFERENCE GENERATOR
 * ============================================
 */

/**
 * Generate kutipan pasal otomatis
 */
export function getLegalReferences() {
  return {
    PERMEN_14_2017: {
      pasal_220_2: {
        reference: 'Permen PUPR No. 14/PRT/M/2017 Pasal 220 ayat (2)',
        text: 'Setiap bangunan gedung wajib dilengkapi dengan minimal 2 jalur evakuasi terpisah...',
        category: 'Exit Number'
      },
      pasal_220_3: {
        reference: 'Permen PUPR No. 14/PRT/M/2017 Pasal 220 ayat (3)',
        text: 'Lebar minimum pintu evakuasi adalah 90 cm dan lebar tangga darurat adalah 120 cm...',
        category: 'Width Requirements'
      }
    },
    PERMEN_26_2008: {
      pasal_9: {
        reference: 'Permen PUPR No. 26/PRT/M/2008 Pasal 9',
        text: 'Dead end corridor maksimum 7,6 meter...',
        category: 'Travel Distance'
      },
      pasal_10: {
        reference: 'Permen PUPR No. 26/PRT/M/2008 Pasal 10',
        text: 'Tangga darurat harus berada dalam ruang terlindungi...',
        category: 'Stair Protection'
      },
      pasal_13: {
        reference: 'Permen PUPR No. 26/PRT/M/2008 Pasal 13',
        text: 'Tangga darurat harus berada dalam ruang terlindungi dengan dinding tahan api...',
        category: 'Stair Enclosure'
      }
    }
  };
}

/**
 * Get reference by category
 */
export function getReferenceByCategory(category) {
  const references = getLegalReferences();
  const results = [];
  
  Object.values(references).forEach(doc => {
    Object.values(doc).forEach(ref => {
      if (ref.category === category) {
        results.push(ref);
      }
    });
  });
  
  return results;
}
