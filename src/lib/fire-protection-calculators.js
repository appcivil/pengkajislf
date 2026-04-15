/**
 * FIRE PROTECTION & LIFE SAFETY CALCULATORS
 * Library perhitungan berdasarkan SNI 03-1735-2004, SNI 03-1745-2000, NFPA 13, NFPA 101
 * SNI 03-3973-2003 (APAR), PUJK (Kepmen PU PR no. 20/PRT/M/2010)
 */

// ============================================================
// 1. DETEKTOR ASAP (Smoke Detector) - SNI 03-1735-2004
// ============================================================

/**
 * Calculate smoke detector coverage area
 * @param {number} ceilingHeight - Tinggi ceiling dalam meter
 * @param {string} detectorType - 'ionization' | 'photoelectric'
 * @returns {Object} Coverage specification
 */
export function calculateSmokeDetectorCoverage(ceilingHeight, detectorType = 'photoelectric') {
  // SNI 03-1735-2004 Pasal 5.2.1 - Spacing and Location
  const specs = {
    ceilingHeight,
    detectorType,
    maxRadius: ceilingHeight <= 4 ? 7.5 : ceilingHeight <= 6 ? 6.7 : 5.3, // meter
    maxWallDistance: ceilingHeight <= 4 ? 5.3 : ceilingHeight <= 6 ? 4.7 : 3.8, // meter
    maxArea: ceilingHeight <= 4 ? 100 : ceilingHeight <= 6 ? 80 : 50, // m²
    spacing: ceilingHeight <= 4 ? 9.1 : ceilingHeight <= 6 ? 8.0 : 6.4 // meter between detectors
  };
  
  return {
    ...specs,
    recommendedQuantity: (floorArea) => Math.ceil(floorArea / specs.maxArea),
    isWithinLimits: (actualSpacing, actualWallDist) => {
      return actualSpacing <= specs.spacing && actualWallDist <= specs.maxWallDistance;
    }
  };
}

/**
 * Check heat detector placement compliance
 * @param {number} ceilingHeight - Tinggi ceiling (m)
 * @param {number} distanceFromHeatSource - Jarak dari sumber panas (m)
 * @param {number} distanceFromObstacle - Jarak dari obstacle (m)
 * @returns {Object} Compliance check result
 */
export function checkHeatDetectorPlacement(ceilingHeight, distanceFromHeatSource, distanceFromObstacle) {
  // SNI 03-1735-2004 Pasal 5.3
  const minDistanceFromHeatSource = 0.5; // meter
  const maxCeilingHeight = 7.5; // meter for standard heat detectors
  
  const checks = {
    ceilingHeight: {
      value: ceilingHeight,
      max: maxCeilingHeight,
      pass: ceilingHeight <= maxCeilingHeight
    },
    heatSourceDistance: {
      value: distanceFromHeatSource,
      min: minDistanceFromHeatSource,
      pass: distanceFromHeatSource >= minDistanceFromHeatSource
    },
    obstacleDistance: {
      value: distanceFromObstacle,
      min: 0.5, // meter
      pass: distanceFromObstacle >= 0.5
    }
  };
  
  const allPass = Object.values(checks).every(c => c.pass);
  
  return {
    checks,
    allPass,
    recommendations: allPass ? [] : [
      !checks.heatSourceDistance.pass && 'Jarak dari sumber panas harus ≥ 0.5m',
      !checks.obstacleDistance.pass && 'Jarak dari obstacle harus ≥ 0.5m',
      !checks.ceilingHeight.pass && 'Untuk ceiling > 7.5m gunakan detector khusus'
    ].filter(Boolean)
  };
}

// ============================================================
// 2. MANUAL CALL POINT (MCP) - SNI 03-1735-2004
// ============================================================

/**
 * Check MCP placement compliance
 * @param {number} distanceBetweenMCP - Jarak antar MCP (m)
 * @param {number} mountingHeight - Tinggi pemasangan (m)
 * @param {boolean} isAccessible - Apakah mudah diakses
 * @returns {Object} Compliance result
 */
export function checkMCPPlacement(distanceBetweenMCP, mountingHeight, isAccessible) {
  // SNI 03-1735-2004 Pasal 6.1
  const requirements = {
    maxSpacing: 30, // meter between MCP
    mountingHeight: { min: 1.2, max: 1.6, ideal: 1.4 }, // meter
    color: 'red' // standard
  };
  
  const checks = {
    spacing: {
      value: distanceBetweenMCP,
      max: requirements.maxSpacing,
      pass: distanceBetweenMCP <= requirements.maxSpacing
    },
    height: {
      value: mountingHeight,
      ideal: requirements.mountingHeight.ideal,
      pass: mountingHeight >= requirements.mountingHeight.min && 
            mountingHeight <= requirements.mountingHeight.max
    },
    accessibility: {
      value: isAccessible,
      pass: isAccessible
    }
  };
  
  return {
    requirements,
    checks,
    allPass: Object.values(checks).every(c => c.pass),
    status: Object.values(checks).every(c => c.pass) ? 'COMPLIANT' : 'NON_COMPLIANT'
  };
}

// ============================================================
// 3. APAR (Alat Pemadam Api Ringan) - SNI 03-3973-2003, NFPA 10
// ============================================================

/**
 * Calculate APAR coverage and requirements
 * @param {string} hazardClass - 'A' | 'B' | 'C' (kelas kebakaran)
 * @param {number} floorArea - Luas lantai (m²)
 * @param {string} buildingType - 'office' | 'industrial' | 'healthcare' | 'highrise'
 * @returns {Object} APAR requirements
 */
export function calculateAPARRequirements(hazardClass, floorArea, buildingType) {
  // SNI 03-3973-2003 & NFPA 10
  const coverage = {
    'A': { maxTravelDistance: 15, maxArea: 140 }, // meter, m²
    'B': { maxTravelDistance: 9, maxArea: 93 },
    'C': { maxTravelDistance: 15, maxArea: 140 }
  };
  
  const capacityRequirements = {
    'highrise': { minCapacity: 6, type: 'DCP' }, // kg
    'healthcare': { minCapacity: 6, type: 'DCP' },
    'industrial': { minCapacity: 9, type: 'DCP' },
    'office': { minCapacity: 4, type: 'DCP' }
  };
  
  const req = coverage[hazardClass] || coverage['A'];
  const cap = capacityRequirements[buildingType] || capacityRequirements['office'];
  
  const requiredQuantity = Math.ceil(floorArea / req.maxArea);
  
  return {
    hazardClass,
    coverage: req,
    capacity: cap,
    requiredQuantity,
    placement: {
      maxTravelDistance: req.maxTravelDistance,
      mountingHeight: { min: 0.3, max: 1.5 }, // meter from floor
      visibility: 'MUST_BE_VISIBLE',
      accessibility: 'NO_OBSTRUCTION'
    },
    inspection: {
      pressureCheck: 'GREEN_ZONE',
      weightCheck: 'FULL_WEIGHT',
      labelCheck: 'UPDATED',
      cardInspection: 'MONTHLY'
    }
  };
}

/**
 * Check APAR pressure gauge status
 * @param {number} pressure - Pressure reading (psi/bar)
 * @param {string} unit - 'psi' | 'bar'
 * @returns {Object} Pressure status
 */
export function checkAPARPressure(pressure, unit = 'psi') {
  // Standard APAR pressure ranges
  const ranges = unit === 'bar' 
    ? { green: { min: 12, max: 18 }, red: { max: 12 } }
    : { green: { min: 175, max: 260 }, red: { max: 175 } };
  
  const status = pressure >= ranges.green.min && pressure <= ranges.green.max 
    ? 'GREEN' 
    : pressure < ranges.red.max 
      ? 'RED_LOW' 
      : 'RED_HIGH';
  
  return {
    pressure,
    unit,
    status,
    isValid: status === 'GREEN',
    message: status === 'GREEN' ? 'Pressure normal' : 
             status === 'RED_LOW' ? 'Pressure rendah - perlu isi ulang' : 
             'Pressure tinggi - perlu periksa'
  };
}

// ============================================================
// 4. HYDRANT - Perhitungan Debit Aliran
// ============================================================

/**
 * Calculate hydrant flow rate
 * Formula: Q = 0.067 × d² × √P
 * @param {number} nozzleDiameter - Diameter nozzle (mm)
 * @param {number} pressure - Tekanan (kPa atau bar)
 * @param {string} pressureUnit - 'kPa' | 'bar'
 * @returns {Object} Flow calculation results
 */
export function calculateHydrantFlow(nozzleDiameter, pressure, pressureUnit = 'kPa') {
  // Q = 0.067 × d² × √P (Q dalam LPM, d dalam mm, P dalam bar)
  const P_bar = pressureUnit === 'kPa' ? pressure / 100 : pressure;
  const Q = 0.067 * Math.pow(nozzleDiameter, 2) * Math.sqrt(P_bar);
  
  // Standar minimal
  const standards = {
    outdoor: { min: 400, unit: 'LPM' },
    indoor: { min: 150, unit: 'LPM' },
    residualPressure: { min: 100, unit: 'kPa' } // 1 bar
  };
  
  return {
    inputs: { nozzleDiameter, pressure, pressureUnit },
    flowRate: {
      value: Math.round(Q * 10) / 10,
      unit: 'LPM'
    },
    standards,
    compliance: {
      outdoor: Q >= standards.outdoor.min,
      indoor: Q >= standards.indoor.min
    },
    recommendation: Q < standards.indoor.min 
      ? 'Debit tidak memenuhi standar - perlu periksa pompa/tangki'
      : Q < standards.outdoor.min 
        ? 'Memenuhi standar indoor, kurang untuk outdoor'
        : 'Debit memenuhi standar'
  };
}

// ============================================================
// 5. SPRINKLER - SNI 03-1745-2000, NFPA 13
// ============================================================

/**
 * Calculate sprinkler requirements
 * @param {string} hazardClass - 'Light', 'Ordinary', 'Extra', 'High Piled'
 * @param {number} designArea - Area of operation (m²)
 * @returns {Object} Sprinkler design parameters
 */
export function calculateSprinklerRequirements(hazardClass, designArea) {
  // SNI 03-1745-2000 & NFPA 13 Design Criteria
  const designCriteria = {
    'Light': { density: 4.1, spacing: 4.6, area: 139 }, // mm/min, m, m²
    'Ordinary-I': { density: 6.1, spacing: 4.6, area: 139 },
    'Ordinary-II': { density: 6.1, spacing: 4.6, area: 139 },
    'Extra': { density: 12.2, spacing: 3.7, area: 186 },
    'High-Hazard': { density: 16.3, spacing: 3.0, area: 279 }
  };
  
  const criteria = designCriteria[hazardClass] || designCriteria['Light'];
  
  // Calculate required flow
  const requiredFlow = criteria.density * designArea; // L/min
  
  // Calculate number of sprinklers in design area
  const sprinklersInArea = Math.ceil(designArea / criteria.area);
  
  // Flow per sprinkler
  const flowPerSprinkler = requiredFlow / sprinklersInArea;
  
  return {
    hazardClass,
    criteria,
    designArea,
    requiredFlow: Math.round(requiredFlow),
    sprinklersInArea,
    flowPerSprinkler: Math.round(flowPerSprinkler * 10) / 10,
    kFactor: Math.round(flowPerSprinkler / Math.sqrt(0.7)), // Q = K√P, P=0.7 bar (70 kPa)
    placement: {
      maxSpacing: criteria.spacing,
      maxCoverageArea: criteria.area,
      distanceFromWall: criteria.spacing / 2,
      deflectorClearance: { min: 0.075, max: 0.150 } // meter from ceiling
    }
  };
}

/**
 * Calculate sprinkler activation time (RTI-based)
 * @param {number} rti - Response Time Index (m·s)^0.5
 * @param {number} ambientTemp - Suhu ambient (°C)
 * @param {number} activationTemp - Suhu aktivasi sprinkler (°C)
 * @param {number} fireGrowthRate - laju pertumbuhan api (kW/s²)
 * @returns {Object} Activation time estimation
 */
export function calculateSprinklerActivationTime(rti, ambientTemp, activationTemp, fireGrowthRate = 0.047) {
  // Simplified activation time calculation
  // t = (RTI / √u) × ln[(T_activation - T_ambient) / (T_g - T_ambient)]
  // where u = gas velocity, T_g = gas temperature
  
  const tempRise = activationTemp - ambientTemp;
  const typicalGasVelocity = 2.5; // m/s (typical for growing fire)
  const typicalGasTemp = 150; // °C at activation time
  
  const activationTime = (rti / Math.sqrt(typicalGasVelocity)) * 
                       Math.log(tempRise / (typicalGasTemp - ambientTemp));
  
  return {
    inputs: { rti, ambientTemp, activationTemp, fireGrowthRate },
    estimatedActivationTime: Math.max(0, Math.round(activationTime)), // seconds
    rtiRating: rti < 50 ? 'Quick Response' : rti < 80 ? 'Standard' : 'Special',
    factors: {
      rti,
      temperatureRise: tempRise,
      gasVelocity: typicalGasVelocity
    }
  };
}

// ============================================================
// 6. EGRESS & EVAKUASI - NFPA 101, PUJK
// ============================================================

/**
 * Calculate egress requirements
 * @param {number} floorArea - Luas lantai (m²)
 * @param {string} occupancyType - 'RS' | 'office' | 'retail' | 'assembly'
 * @param {number} travelDistance - Jarak tempuh (m)
 * @param {number} exitWidth - Lebar pintu keluar (m)
 * @returns {Object} Egress analysis
 */
export function calculateEgressRequirements(floorArea, occupancyType, travelDistance, exitWidth) {
  // Occupant load factors (m²/person) - NFPA 101 & PUJK
  const occupantLoadFactors = {
    'RS': 10,
    'office': 10,
    'retail': 3,
    'assembly': 1.5,
    'education': 5
  };
  
  // Maximum travel distances (m) - PUJK Kepmen 20/2010
  const maxTravelDistances = {
    'RS': { sprinklered: 45, unsprinklered: 30 },
    'office': { sprinklered: 60, unsprinklered: 45 },
    'retail': { sprinklered: 45, unsprinklered: 30 },
    'assembly': { sprinklered: 60, unsprinklered: 45 }
  };
  
  // Exit capacity (persons per unit width) - mm
  const exitCapacity = 0.55; // persons per mm per minute
  
  const factor = occupantLoadFactors[occupancyType] || 10;
  const occupantLoad = Math.ceil(floorArea / factor);
  const maxDistances = maxTravelDistances[occupancyType] || maxTravelDistances['office'];
  
  // Required exit width
  const requiredExitWidth = occupantLoad / (exitCapacity * 60); // meters
  
  return {
    occupancyType,
    floorArea,
    occupantLoad,
    loadFactor: factor,
    travelDistance: {
      actual: travelDistance,
      maxSprinklered: maxDistances.sprinklered,
      maxUnsprinklered: maxDistances.unsprinklered,
      compliant: travelDistance <= maxDistances.sprinklered
    },
    exitWidth: {
      actual: exitWidth,
      required: Math.round(requiredExitWidth * 100) / 100,
      compliant: exitWidth >= requiredExitWidth,
      minRequired: occupancyType === 'RS' ? 1.2 : 0.9 // meter
    },
    deadEndLimit: 7.6, // meters for sprinklered buildings
    doorRequirements: {
      swingDirection: 'WITH_EGRESS_PATH',
      panicBar: occupantLoad > 50,
      pushBar: true
    }
  };
}

/**
 * Calculate emergency lighting requirements
 * @param {number} area - Area yang perlu penerangan (m²)
 * @param {string} locationType - 'exit_sign' | 'corridor' | 'stairway' | 'assembly'
 * @returns {Object} Lighting requirements
 */
export function calculateEmergencyLighting(area, locationType) {
  // SNI & NFPA lighting requirements (lux)
  const luxRequirements = {
    'exit_sign': 50,
    'corridor': 10,
    'stairway': 20,
    'assembly': 15,
    'critical_path': 5
  };
  
  const requiredLux = luxRequirements[locationType] || 10;
  
  // Simplified fixture calculation
  const fixtureOutput = 1000; // lumens per fixture (typical)
  const utilizationFactor = 0.5;
  const maintenanceFactor = 0.8;
  
  const requiredLumens = requiredLux * area;
  const effectiveLumensPerFixture = fixtureOutput * utilizationFactor * maintenanceFactor;
  const requiredFixtures = Math.ceil(requiredLumens / effectiveLumensPerFixture);
  
  return {
    locationType,
    area,
    requiredLux,
    requiredLumens,
    requiredFixtures,
    batteryBackup: {
      minDuration: 90, // minutes per SNI
      load: requiredFixtures * 20 // watts estimate
    }
  };
}

// ============================================================
// 7. WATER SUPPLY & FIRE PUMP
// ============================================================

/**
 * Calculate water supply duration
 * @param {number} tankVolume - Volume tangki (liter)
 * @param {number} sprinklerFlow - Debit sprinkler (LPM)
 * @param {number} hydrantFlow - Debit hydrant (LPM)
 * @param {number} hoseReelFlow - Debit hose reel (LPM)
 * @returns {Object} Duration calculation
 */
export function calculateWaterSupplyDuration(tankVolume, sprinklerFlow, hydrantFlow = 0, hoseReelFlow = 0) {
  const totalFlow = sprinklerFlow + hydrantFlow + hoseReelFlow;
  const durationMinutes = tankVolume / totalFlow;
  
  // Required durations per standards
  const requiredDurations = {
    'sprinkler_only': 30,
    'sprinkler_hydrant': 60,
    'high_hazard': 120
  };
  
  return {
    inputs: { tankVolume, sprinklerFlow, hydrantFlow, hoseReelFlow },
    totalFlow,
    durationMinutes: Math.round(durationMinutes * 10) / 10,
    durationHours: Math.round(durationMinutes / 60 * 10) / 10,
    requiredDuration: hydrantFlow > 0 ? requiredDurations['sprinkler_hydrant'] : requiredDurations['sprinkler_only'],
    compliance: durationMinutes >= (hydrantFlow > 0 ? requiredDurations['sprinkler_hydrant'] : requiredDurations['sprinkler_only']),
    tankVolumeRequired: totalFlow * (hydrantFlow > 0 ? requiredDurations['sprinkler_hydrant'] : requiredDurations['sprinkler_only'])
  };
}

/**
 * Calculate fire pump power requirement
 * @param {number} flow - Debit (m³/s atau LPM)
 * @param {number} head - Head (meter)
 * @param {number} efficiency - Efisiensi pompa (default 0.7)
 * @param {string} flowUnit - 'm3/s' | 'LPM'
 * @returns {Object} Pump power calculation
 */
export function calculateFirePumpPower(flow, head, efficiency = 0.7, flowUnit = 'LPM') {
  // P = (Q × H) / (102 × η) - formula dalam kW, Q dalam m³/s
  const Q_m3s = flowUnit === 'LPM' ? flow / 60000 : flow;
  const powerKW = (Q_m3s * head * 9.81) / (efficiency * 1000);
  const powerHP = powerKW / 0.746;
  
  // Electrical requirements
  const voltage = 380; // V (3-phase)
  const current = (powerKW * 1000) / (voltage * 0.85 * Math.sqrt(3)); // assuming pf=0.85
  
  return {
    inputs: { flow, head, efficiency, flowUnit },
    powerKW: Math.round(powerKW * 100) / 100,
    powerHP: Math.round(powerHP * 100) / 100,
    electrical: {
      voltage,
      current: Math.round(current * 10) / 10,
      powerFactor: 0.85,
      cableSize: current < 50 ? '6 mm²' : current < 100 ? '16 mm²' : '25 mm²'
    },
    backupRequired: {
      diesel: powerKW > 75, // Larger pumps need diesel backup
      electric: true
    }
  };
}

// ============================================================
// 8. FIRE RESISTANCE RATING (FRR)
// ============================================================

/**
 * Check Fire Resistance Rating requirements
 * @param {string} elementType - 'column' | 'beam' | 'floor' | 'wall' | 'door'
 * @param {number} buildingHeight - Tinggi bangunan (m)
 * @param {string} occupancyType - Jenis penggunaan
 * @param {boolean} hasSprinkler - Apakah ada sprinkler
 * @returns {Object} FRR requirements
 */
export function checkFRRRequirements(elementType, buildingHeight, occupancyType, hasSprinkler) {
  // SNI & PUJK FRR requirements (hours)
  const frrTable = {
    'column': {
      'low': 1,
      'medium': 2,
      'high': 3
    },
    'beam': {
      'low': 1,
      'medium': 1.5,
      'high': 2
    },
    'floor': {
      'low': 1,
      'medium': 1.5,
      'high': 2
    },
    'wall': {
      'low': 1,
      'medium': 1,
      'high': 2
    },
    'door': {
      'low': 0.5,
      'medium': 0.75,
      'high': 1
    }
  };
  
  // Determine risk level based on height and occupancy
  let riskLevel = 'low';
  if (buildingHeight > 24 || occupancyType === 'high_hazard') {
    riskLevel = 'high';
  } else if (buildingHeight > 8 || occupancyType === 'assembly') {
    riskLevel = 'medium';
  }
  
  // Reduce FRR if sprinklered (per code allowances)
  const reductionFactor = hasSprinkler ? 0.5 : 1;
  
  const requiredFRR = frrTable[elementType][riskLevel] * reductionFactor;
  
  return {
    elementType,
    buildingHeight,
    occupancyType,
    hasSprinkler,
    riskLevel,
    requiredFRR,
    requiredFRRMinutes: requiredFRR * 60,
    reductionApplied: hasSprinkler,
    notes: hasSprinkler 
      ? 'FRR dapat dikurangi 50% karena adanya sistem sprinkler' 
      : 'FRR penuh diperlukan tanpa sprinkler'
  };
}

// ============================================================
// 9. FIRE RISK ASSESSMENT MATRIX
// ============================================================

/**
 * Calculate fire risk score
 * @param {number} probability - Probabilitas kebakaran (1-5)
 * @param {number} consequence - Konsekuensi (1-5)
 * @param {string} consequenceType - 'life' | 'property' | 'business'
 * @returns {Object} Risk assessment
 */
export function calculateFireRisk(probability, consequence, consequenceType = 'life') {
  const riskScore = probability * consequence;
  
  // Risk matrix
  let riskLevel;
  if (riskScore <= 4) riskLevel = 'LOW';
  else if (riskScore <= 9) riskLevel = 'MEDIUM';
  else if (riskScore <= 14) riskLevel = 'HIGH';
  else riskLevel = 'EXTREME';
  
  const probabilityLabels = {
    1: 'Very Unlikely',
    2: 'Unlikely',
    3: 'Possible',
    4: 'Likely',
    5: 'Very Likely'
  };
  
  const consequenceLabels = {
    1: 'Negligible',
    2: 'Minor',
    3: 'Moderate',
    4: 'Major',
    5: 'Catastrophic'
  };
  
  return {
    inputs: { probability, consequence, consequenceType },
    riskScore,
    riskLevel,
    probabilityLabel: probabilityLabels[probability],
    consequenceLabel: consequenceLabels[consequence],
    actionRequired: {
      'LOW': 'Monitor',
      'MEDIUM': 'Review controls',
      'HIGH': 'Immediate action required',
      'EXTREME': 'Stop operations - immediate intervention'
    }[riskLevel],
    colorCode: {
      'LOW': '#22c55e',
      'MEDIUM': '#eab308',
      'HIGH': '#f97316',
      'EXTREME': '#ef4444'
    }[riskLevel]
  };
}

// ============================================================
// 10. DEFICIENCY SCORING
// ============================================================

/**
 * Calculate deficiency scorecard
 * @param {Array} deficiencies - Array of deficiency objects {type, severity, count}
 * @returns {Object} Scorecard results
 */
export function calculateDeficiencyScore(deficiencies) {
  // Weighting system
  const weights = {
    'critical': 10, // Life safety issues
    'major': 5,     // Significant non-compliance
    'minor': 1      // Documentation/minor issues
  };
  
  let totalScore = 0;
  const breakdown = {
    critical: { count: 0, score: 0 },
    major: { count: 0, score: 0 },
    minor: { count: 0, score: 0 }
  };
  
  deficiencies.forEach(def => {
    const weight = weights[def.severity] || 1;
    const score = weight * (def.count || 1);
    totalScore += score;
    
    if (breakdown[def.severity]) {
      breakdown[def.severity].count += def.count || 1;
      breakdown[def.severity].score += score;
    }
  });
  
  // SLF Pass threshold
  const passThreshold = 30; // Adjust based on building size/complexity
  
  return {
    totalScore,
    breakdown,
    passThreshold,
    result: totalScore <= passThreshold ? 'PASS' : 'FAIL',
    passMargin: passThreshold - totalScore,
    recommendations: totalScore > passThreshold 
      ? [`${breakdown.critical.count} isu kritis harus diselesaikan sebelum SLF`] 
      : []
  };
}

// ============================================================
// 11. UTILITY FUNCTIONS
// ============================================================

/**
 * Haversine formula for distance calculation
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if point is within coverage area
 * @param {Object} point - {x, y} coordinates
 * @param {Object} detector - {x, y, radius}
 * @returns {boolean}
 */
export function isPointInCoverage(point, detector) {
  const distance = Math.sqrt(
    Math.pow(point.x - detector.x, 2) + 
    Math.pow(point.y - detector.y, 2)
  );
  return distance <= detector.radius;
}

/**
 * Generate standard references
 * @param {string} feature - Feature name
 * @returns {Object} Standard references
 */
export function getStandardReferences(feature) {
  const standards = {
    'smoke_detector': {
      primary: 'SNI 03-1735-2004',
      international: 'NFPA 72',
      title: 'Tata cara perencanaan dan pemasangan sistem deteksi kebakaran'
    },
    'sprinkler': {
      primary: 'SNI 03-1745-2000',
      international: 'NFPA 13',
      title: 'Tata cara perencanaan dan pemasangan sprinkler otomatis'
    },
    'apar': {
      primary: 'SNI 03-3973-2003',
      international: 'NFPA 10',
      title: 'Alat pemadam api ringan (APAR)'
    },
    'egress': {
      primary: 'PUJK (Kepmen PU PR 20/2010)',
      international: 'NFPA 101',
      title: 'Persyaratan Umum Jalan, Konstruksi, dan Kebakaran'
    }
  };
  
  return standards[feature] || { primary: '-', international: '-', title: '-' };
}

// Export all functions as default
export default {
  calculateSmokeDetectorCoverage,
  checkHeatDetectorPlacement,
  checkMCPPlacement,
  calculateAPARRequirements,
  checkAPARPressure,
  calculateHydrantFlow,
  calculateSprinklerRequirements,
  calculateSprinklerActivationTime,
  calculateEgressRequirements,
  calculateEmergencyLighting,
  calculateWaterSupplyDuration,
  calculateFirePumpPower,
  checkFRRRequirements,
  calculateFireRisk,
  calculateDeficiencyScore,
  haversineDistance,
  isPointInCoverage,
  getStandardReferences
};
