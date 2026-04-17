/**
 * AKSESIBILITAS & KEMUDAHAN CALCULATORS
 * Pemeriksaan Aspek Kemudahan berdasarkan:
 * - PP Nomor 16 Tahun 2021 (Pasal 226 ayat 7 & Pasal 227)
 * - SNI 8153:2015 (Aksesibilitas)
 * - SNI 03-1733-1989 (Tangga)
 * - SNI 03-6197-2000 (Toilet)
 * - Permen PU No. 30/PRT/M/2006 (Aksesibilitas)
 */

// ============================================================
// STANDARDS & CONSTANTS
// ============================================================

export const ACCESSIBILITY_STANDARDS = {
  // Horizontal Accessibility (SNI 8153:2015)
  corridor: {
    pedestrian: 120,      // cm - jalur umum
    wheelchair: 150,      // cm - wheelchair 90cm + clearance 60cm
    twoWheelchairs: 200,  // cm - passing space
    crutches: 140,        // cm - tongkat/tuna daksa
    visualImpaired: 180  // cm - dengan guide cane
  },
  headroom: {
    minimum: 200,         // cm
    optimal: 240          // cm
  },
  // Ramp Standards (SNI 8153:2015 & Permen PU 30/2006)
  ramp: {
    general: { max: 5, ratio: '1:20', description: 'Ideal' },
    maximum: { max: 8.33, ratio: '1:12', description: 'Absolute max' },
    cross: { max: 2, ratio: '1:50', description: 'Cross slope' }
  },
  // Door Standards
  door: {
    general: 80,          // cm
    wheelchair: 90,       // cm
    doubleLeaf: 120,      // cm
    threshold: 2.5        // cm max
  },
  // Floor Surface
  floor: {
    slipResistance: 0.6,
    evenness: 6,          // mm max deviation
    roughness: 'R9'       // minimum slip rating
  },
  // Stair Standards (SNI 03-1733-1989)
  stair: {
    riser: { min: 15, max: 20 },
    tread: { min: 25 },
    width: { general: 120, public: 150 },
    formula: { min: 60, max: 65, optimal: 63 }, // 2R + T
    maxRisersWithoutLanding: 12
  },
  // Landing Standards
  landing: {
    stair: { depth: 120 },
    wheelchair: { width: 150, depth: 150 },
    ramp: { interval: 900 } // cm (9 meter)
  },
  // Elevator Standards
  elevator: {
    cabinWidth: 140,
    cabinDepth: 110,
    doorWidth: 90,
    handrailLower: 80,
    handrailUpper: 90
  },
  // Escalator Standards
  escalator: {
    maxAngle: 30,
    speed: { min: 0.5, max: 0.75 },
    stepWidth: { standard: 60, accessible: 100 }
  },
  // Toilet Standards
  toilet: {
    roomWidth: 150,
    roomDepth: 180,
    turningCircle: 150,
    wcHeight: { min: 43, max: 48, optimal: 45 },
    lavatoryHeight: 80,
    clearanceUnder: 70,
    grabBarLength: 75,
    grabBarHeight: 75,
    pullCordHeight: 40,
    doorWidth: 90
  },
  // Parking Standards (Permen PU 30/2006)
  parking: {
    slotWidth: 400,
    slotDepth: 600,
    aisleWidth: 180,
    ratio: { slotsPer: 25, maxSlots: 4, percentage: 0.02 }
  },
  // Signage Standards
  signage: {
    height: { min: 140, max: 160 },
    fontSize: 15,         // mm minimum
    contrastRatio: 4.5,
    braille: true
  }
};

export const LEGAL_REFERENCES = {
  pp16_2021: {
    pasal_226: 'Pasal 226 ayat 7 - Prasarana & Sarana',
    pasal_227: 'Pasal 227 - Aksesibilitas'
  },
  sni: {
    sni8153: 'SNI 8153:2015 - Aksesibilitas',
    sni1733: 'SNI 03-1733-1989 - Tangga',
    sni6197: 'SNI 03-6197-2000 - Toilet'
  },
  permen: {
    pu30_2006: 'Permen PU No. 30/PRT/M/2006 - Aksesibilitas'
  }
};

// ============================================================
// 1. HORIZONTAL ACCESSIBILITY CALCULATIONS
// ============================================================

/**
 * Calculate horizontal accessibility compliance
 * @param {number} corridorWidth - Width in cm
 * @param {number} corridorLength - Length in meters
 * @param {Array} obstacles - Array of obstacle objects {type, width, position}
 */
export function calculateHorizontalAccessibility(corridorWidth, corridorLength, obstacles = []) {
  const standards = ACCESSIBILITY_STANDARDS.corridor;
  const headroom = ACCESSIBILITY_STANDARDS.headroom;

  // Calculate effective width
  let effectiveWidth = corridorWidth;
  let bottleneckCount = 0;
  obstacles.forEach(obs => {
    if (obs.position === 'protruding') {
      effectiveWidth -= obs.width;
      bottleneckCount++;
    }
  });

  // Check turning space (150x150 cm)
  const turningSpaceRequired = 150 * 150;

  // Compliance checks
  const wheelchairPass = effectiveWidth >= standards.wheelchair;
  const twoWayTraffic = effectiveWidth >= standards.twoWheelchairs;
  const headroomPass = headroom.minimum >= 200;

  return {
    corridorWidth: corridorWidth + ' cm',
    effectiveWidth: effectiveWidth + ' cm',
    turningSpaceRequired: '150 × 150 cm',
    wheelchairAccessible: wheelchairPass,
    twoWayTraffic: twoWayTraffic,
    headroom: headroom.minimum + ' cm',
    status: (wheelchairPass && headroomPass) ? 'C' : 'NC',
    complianceLevel: wheelchairPass ? 'FULL' : (effectiveWidth >= standards.pedestrian ? 'PARTIAL' : 'NONE'),
    bottleneck: bottleneckCount > 0 ? `Ada ${bottleneckCount} obstacle` : 'Bebas obstacle',
    standardReference: 'SNI 8153:2015',
    recommendations: generateCorridorRecommendations(wheelchairPass, twoWayTraffic, effectiveWidth, standards)
  };
}

function generateCorridorRecommendations(wheelchairPass, twoWayTraffic, effectiveWidth, standards) {
  const recommendations = [];
  if (!wheelchairPass) {
    recommendations.push(`Lebar efektif ${effectiveWidth} cm kurang dari standar wheelchair ${standards.wheelchair} cm`);
  }
  if (!twoWayTraffic) {
    recommendations.push(`Tidak memenuhi lebar untuk 2 wheelchair berpapasan (${standards.twoWheelchairs} cm)`);
  }
  return recommendations;
}

/**
 * Calculate ramp accessibility compliance
 * @param {number} verticalRise - Vertical rise in cm
 * @param {number} horizontalRun - Horizontal run in meters
 * @param {string} rampType - 'interior' or 'exterior'
 */
export function calculateRampAccessibility(verticalRise, horizontalRun, rampType = 'interior') {
  const standards = ACCESSIBILITY_STANDARDS.ramp;

  // Calculate slope percentage
  const slopePercent = (verticalRise / (horizontalRun * 100)) * 100;
  const slopeRatio = horizontalRun / (verticalRise / 100);

  // Calculate required landings
  const landingInterval = 900; // cm (9 meters)
  const requiredLandings = Math.floor((horizontalRun * 100) / landingInterval);

  // Landing requirements
  const needsLanding = verticalRise > 75;

  // Handrail requirements
  const handrailRequired = slopePercent > 5 || horizontalRun > 6;

  // Compliance status
  let status = 'NC';
  let recommendation = '';

  if (slopePercent <= standards.general.max) {
    status = 'C';
    recommendation = 'Memenuhi standar ideal';
  } else if (slopePercent <= standards.maximum.max) {
    status = 'C';
    recommendation = 'Memenuhi standar maksimal, pertimbangkan landasan istirahat';
  } else {
    recommendation = 'TIDAK MEMENUHI - Terlalu curam, pertimbangkan lift';
  }

  return {
    slope: slopePercent.toFixed(2) + '%',
    ratio: '1:' + slopeRatio.toFixed(1),
    status: status,
    landingRequired: needsLanding,
    landingCount: requiredLandings,
    landingPositions: Array.from({length: requiredLandings}, (_, i) => (i + 1) * 9 + ' m'),
    handrailRequired: handrailRequired,
    crossSlopeMax: standards.cross.max + '%',
    recommendation: recommendation,
    standardReference: 'SNI 8153:2015 & Permen PU 30/2006',
    legalReference: 'PP 16/2021 Pasal 227 ayat 2 huruf a'
  };
}

/**
 * Calculate door accessibility
 * @param {number} clearOpening - Clear opening width in cm
 * @param {string} doorType - 'general', 'wheelchair', 'double'
 * @param {number} thresholdHeight - Threshold height in cm
 */
export function calculateDoorAccessibility(clearOpening, doorType = 'general', thresholdHeight = 0) {
  const standards = ACCESSIBILITY_STANDARDS.door;

  let requiredWidth;
  switch (doorType) {
    case 'wheelchair':
      requiredWidth = standards.wheelchair;
      break;
    case 'double':
      requiredWidth = standards.doubleLeaf;
      break;
    default:
      requiredWidth = standards.general;
  }

  const widthPass = clearOpening >= requiredWidth;
  const thresholdPass = thresholdHeight <= standards.threshold;

  return {
    clearOpening: clearOpening + ' cm',
    requiredWidth: requiredWidth + ' cm',
    widthStatus: widthPass ? 'C' : 'NC',
    thresholdHeight: thresholdHeight + ' cm',
    thresholdMax: standards.threshold + ' cm',
    thresholdStatus: thresholdPass ? 'C' : 'NC',
    overallStatus: (widthPass && thresholdPass) ? 'C' : 'NC',
    doorType: doorType,
    standardReference: 'SNI 8153:2015',
    recommendations: !widthPass ? [`Lebar bukaan ${clearOpening} cm kurang dari standar ${requiredWidth} cm`] : []
  };
}

/**
 * Evaluate floor surface accessibility
 * @param {number} slipCoefficient - Slip resistance coefficient
 * @param {number} evenness - Evenness deviation in mm
 * @param {boolean} hasHoles - Has holes/broken surfaces
 */
export function evaluateFloorSurface(slipCoefficient, evenness, hasHoles = false) {
  const standards = ACCESSIBILITY_STANDARDS.floor;

  const slipPass = slipCoefficient >= standards.slipResistance;
  const evennessPass = evenness <= standards.evenness;
  const holesPass = !hasHoles;

  return {
    slipCoefficient: slipCoefficient,
    slipStandard: standards.slipResistance,
    slipStatus: slipPass ? 'C' : 'NC',
    evenness: evenness + ' mm',
    evennessStandard: standards.evenness + ' mm',
    evennessStatus: evennessPass ? 'C' : 'NC',
    surfaceCondition: hasHoles ? 'Berlubang/Rusak' : 'Baik',
    surfaceStatus: holesPass ? 'C' : 'NC',
    overallStatus: (slipPass && evennessPass && holesPass) ? 'C' : 'NC',
    standardReference: 'SNI 8153:2015',
    riskLevel: !slipPass ? 'HIGH' : (!evennessPass ? 'MEDIUM' : 'LOW')
  };
}

// ============================================================
// 2. VERTICAL ACCESSIBILITY CALCULATIONS
// ============================================================

/**
 * Calculate stair accessibility (SNI 03-1733-1989)
 * @param {number} riserHeight - Riser height in cm
 * @param {number} treadDepth - Tread depth in cm
 * @param {number} stairWidth - Stair width in cm
 * @param {number} totalRisers - Total number of risers
 */
export function calculateStairAccessibility(riserHeight, treadDepth, stairWidth, totalRisers) {
  const standards = ACCESSIBILITY_STANDARDS.stair;

  // Comfort formula: 2R + T = 60-65 cm (optimal 63)
  const comfortFormula = (2 * riserHeight) + treadDepth;

  // Compliance checks
  const riserOK = riserHeight >= standards.riser.min && riserHeight <= standards.riser.max;
  const treadOK = treadDepth >= standards.tread.min;
  const widthOK = stairWidth >= standards.width.general;
  const comfortOK = comfortFormula >= standards.formula.min && comfortFormula <= standards.formula.max;

  // Landing requirements
  const landingRequired = totalRisers > standards.maxRisersWithoutLanding;

  // Handrail requirements
  const handrailSides = stairWidth > 200 ? 2 : 1;

  // Issues
  const issues = [];
  if (!riserOK) issues.push(`Riser tidak standar (${standards.riser.min}-${standards.riser.max} cm)`);
  if (!treadOK) issues.push(`Tread terlalu pendek (min ${standards.tread.min} cm)`);
  if (!widthOK) issues.push(`Lebar tangga kurang (min ${standards.width.general} cm)`);
  if (!comfortOK) issues.push(`Formula 2R+T tidak nyaman (${standards.formula.min}-${standards.formula.max} cm)`);

  // Comfort status
  let comfortStatus = 'Nyaman';
  if (!comfortOK) {
    comfortStatus = comfortFormula < standards.formula.min ? 'Terlalu landai' : 'Terlalu curam';
  }

  return {
    riser: riserHeight + ' cm',
    tread: treadDepth + ' cm',
    formula2RT: `2(${riserHeight}) + ${treadDepth} = ${comfortFormula} cm`,
    comfortStatus: comfortStatus,
    comfortFormula: comfortFormula,
    comfortOK: comfortOK,
    stairWidth: stairWidth + ' cm',
    landingRequired: landingRequired,
    landingEvery: '12 anak tangga',
    handrail: handrailSides + ' sisi',
    status: (riserOK && treadOK && widthOK) ? 'C' : 'NC',
    issues: issues,
    standardReference: 'SNI 03-1733-1989',
    legalReference: 'PP 16/2021 Pasal 227 ayat 2 huruf b'
  };
}

/**
 * Calculate elevator accessibility compliance
 * @param {number} cabinWidth - Cabin width in cm
 * @param {number} cabinDepth - Cabin depth in cm
 * @param {number} doorWidth - Door width in cm
 * @param {Object} features - Object with boolean features
 */
export function calculateElevatorAccessibility(cabinWidth, cabinDepth, doorWidth, features = {}) {
  const standards = ACCESSIBILITY_STANDARDS.elevator;

  const cabinOK = cabinWidth >= standards.cabinWidth && cabinDepth >= standards.cabinDepth;
  const doorOK = doorWidth >= standards.doorWidth;

  const featureChecks = {
    brailleButtons: features.brailleButtons || false,
    handrailLower: features.handrailLower || false,
    handrailUpper: features.handrailUpper || false,
    mirror: features.mirror || false,
    emergencyAlarm: features.emergencyAlarm || false,
    intercom: features.intercom || false
  };

  const featureScore = Object.values(featureChecks).filter(v => v).length;
  const featureTotal = Object.keys(featureChecks).length;

  return {
    cabinSize: `${cabinWidth} × ${cabinDepth} cm`,
    cabinRequired: `${standards.cabinWidth} × ${standards.cabinDepth} cm`,
    cabinStatus: cabinOK ? 'C' : 'NC',
    doorWidth: doorWidth + ' cm',
    doorRequired: standards.doorWidth + ' cm',
    doorStatus: doorOK ? 'C' : 'NC',
    features: featureChecks,
    featureScore: `${featureScore}/${featureTotal}`,
    featurePercentage: Math.round((featureScore / featureTotal) * 100),
    overallStatus: (cabinOK && doorOK && featureScore >= 4) ? 'C' : 'NC',
    standardReference: 'SNI 8153:2015',
    legalReference: 'PP 16/2021 Pasal 227 ayat 2 huruf b'
  };
}

/**
 * Calculate escalator accessibility
 * @param {number} angle - Inclination angle in degrees
 * @param {number} speed - Speed in m/s
 * @param {number} stepWidth - Step width in cm
 */
export function calculateEscalatorAccessibility(angle, speed, stepWidth) {
  const standards = ACCESSIBILITY_STANDARDS.escalator;

  const angleOK = angle <= standards.maxAngle;
  const speedOK = speed >= standards.speed.min && speed <= standards.speed.max;
  const widthOK = stepWidth >= standards.stepWidth.accessible;

  return {
    angle: angle + '°',
    maxAngle: standards.maxAngle + '°',
    angleStatus: angleOK ? 'C' : 'NC',
    speed: speed + ' m/s',
    speedRange: `${standards.speed.min}-${standards.speed.max} m/s`,
    speedStatus: speedOK ? 'C' : 'NC',
    stepWidth: stepWidth + ' cm',
    accessibleWidth: standards.stepWidth.accessible + ' cm',
    widthStatus: widthOK ? 'C' : 'NC',
    overallStatus: (angleOK && speedOK && widthOK) ? 'C' : 'NC',
    recommendation: !widthOK ? `Lebar step ${stepWidth} cm kurang dari standar ${standards.stepWidth.accessible} cm untuk difabel` : 'Memenuhi standar',
    standardReference: 'SNI 8153:2015'
  };
}

/**
 * Calculate landing zone requirements
 * @param {string} type - 'stair', 'ramp', 'door', 'wheelchair'
 * @param {number} width - Width in cm
 * @param {number} depth - Depth in cm
 */
export function calculateLandingZone(type, width, depth) {
  const standards = ACCESSIBILITY_STANDARDS.landing;

  let requiredWidth, requiredDepth, status, description;

  switch (type) {
    case 'stair':
      requiredWidth = width; // Same as stair width
      requiredDepth = standards.stair.depth;
      status = depth >= requiredDepth ? 'C' : 'NC';
      description = 'Landing tangga';
      break;
    case 'wheelchair':
    case 'door':
      requiredWidth = standards.wheelchair.width;
      requiredDepth = standards.wheelchair.depth;
      status = (width >= requiredWidth && depth >= requiredDepth) ? 'C' : 'NC';
      description = 'Ruang putar wheelchair';
      break;
    case 'ramp':
      requiredWidth = standards.wheelchair.width;
      requiredDepth = standards.wheelchair.depth;
      status = (width >= requiredWidth && depth >= requiredDepth) ? 'C' : 'NC';
      description = 'Landasan istirahat ramp';
      break;
    default:
      requiredWidth = 150;
      requiredDepth = 150;
      status = 'NC';
      description = 'Unknown';
  }

  return {
    type: type,
    description: description,
    actualSize: `${width} × ${depth} cm`,
    requiredSize: `${requiredWidth} × ${requiredDepth} cm`,
    status: status,
    turningCircle: type === 'wheelchair' ? '150 cm diameter' : null,
    standardReference: 'SNI 8153:2015'
  };
}

// ============================================================
// 3. FACILITIES CALCULATIONS
// ============================================================

/**
 * Calculate accessible toilet compliance
 * @param {number} roomWidth - Room width in cm
 * @param {number} roomDepth - Room depth in cm
 * @param {Object} fixtures - Fixture specifications
 */
export function calculateAccessibleToilet(roomWidth, roomDepth, fixtures = {}) {
  const standards = ACCESSIBILITY_STANDARDS.toilet;

  // Turning space check
  const turningSpaceOK = roomWidth >= standards.turningCircle && roomDepth >= standards.roomDepth;

  // Fixture checks
  const wcHeightOK = fixtures.wcHeight >= standards.wcHeight.min && fixtures.wcHeight <= standards.wcHeight.max;
  const hasGrabBars = fixtures.grabBars || false;
  const hasEmergencyCord = fixtures.emergencyCord || false;
  const doorWidthOK = (fixtures.doorWidth || 0) >= standards.doorWidth;

  // Lavatory clearance
  const lavatoryOK = (fixtures.lavatoryClearance || 0) >= standards.clearanceUnder;

  return {
    roomSize: `${roomWidth} × ${roomDepth} cm`,
    turningSpace: turningSpaceOK ? `Memenuhi (${standards.turningCircle} cm diameter)` : 'Tidak memenuhi',
    turningSpaceOK: turningSpaceOK,
    wcHeight: `${fixtures.wcHeight || 0} cm`,
    wcHeightRange: `${standards.wcHeight.min}-${standards.wcHeight.max} cm`,
    wcStatus: wcHeightOK ? 'C' : 'NC',
    lavatoryClearance: `${fixtures.lavatoryClearance || 0} cm kolong`,
    lavatoryRequired: `${standards.clearanceUnder} cm`,
    lavatoryStatus: lavatoryOK ? 'C' : 'NC',
    grabBars: hasGrabBars ? 'Ada' : 'Tidak ada',
    grabBarStatus: hasGrabBars ? 'C' : 'NC',
    emergencyCord: hasEmergencyCord ? 'Ada' : 'Tidak ada',
    emergencyStatus: hasEmergencyCord ? 'C' : 'NC',
    doorWidth: `${fixtures.doorWidth || 0} cm`,
    doorRequired: `${standards.doorWidth} cm`,
    doorStatus: doorWidthOK ? 'C' : 'NC',
    overallStatus: (turningSpaceOK && wcHeightOK && hasGrabBars && doorWidthOK) ? 'C' : 'NC',
    layoutRecommendation: turningSpaceOK
      ? 'Layout memungkinkan transfer samping'
      : 'Perlu perlebaran atau penyesuaian layout',
    standardReference: 'SNI 03-6197-2000',
    legalReference: 'PP 16/2021 Pasal 226 ayat 7'
  };
}

/**
 * Calculate accessible parking requirements
 * @param {number} totalSlots - Total parking slots
 * @param {string} buildingType - Building type
 */
export function calculateAccessibleParking(totalSlots, buildingType = 'general') {
  const standards = ACCESSIBILITY_STANDARDS.parking;

  // Calculate required accessible slots
  let requiredAccessible;
  if (totalSlots <= 25) {
    requiredAccessible = 1;
  } else if (totalSlots <= 50) {
    requiredAccessible = 2;
  } else if (totalSlots <= 100) {
    requiredAccessible = 3;
  } else if (totalSlots <= 200) {
    requiredAccessible = 4;
  } else {
    requiredAccessible = Math.ceil(totalSlots * standards.ratio.percentage);
  }

  return {
    totalSlots: totalSlots,
    requiredAccessible: requiredAccessible,
    existingAccessible: 0,
    deficit: requiredAccessible,
    dimensions: `${standards.slotWidth} × ${standards.slotDepth} cm`,
    transferSpace: 'Sisi kiri atau kanan (80 cm)',
    aisleToBuilding: `${standards.aisleWidth} cm (bebas tangga)`,
    surface: 'Rata (slope max 2%)',
    status: requiredAccessible > 0 ? 'C' : 'NC',
    priority: requiredAccessible > 0 ? 'High' : 'Low',
    standardReference: 'Permen PU 30/2006',
    legalReference: 'PP 16/2021 Pasal 226 ayat 7'
  };
}

/**
 * Check signage accessibility compliance
 * @param {number} height - Signage height from floor in cm
 * @param {boolean} hasBraille - Has Braille text
 * @param {string} contrast - Contrast description
 * @param {number} fontSize - Font size in mm
 */
export function checkSignageAccessibility(height, hasBraille, contrast, fontSize) {
  const standards = ACCESSIBILITY_STANDARDS.signage;

  const heightOK = height >= standards.height.min && height <= standards.height.max;
  const fontOK = fontSize >= standards.fontSize;

  return {
    height: height + ' cm',
    heightRange: `${standards.height.min}-${standards.height.max} cm`,
    heightStatus: heightOK ? 'C' : 'NC',
    hasBraille: hasBraille,
    brailleStatus: hasBraille ? 'C' : 'NC',
    contrast: contrast,
    fontSize: fontSize + ' mm',
    fontRequired: standards.fontSize + ' mm',
    fontStatus: fontOK ? 'C' : 'NC',
    overallStatus: (heightOK && hasBraille && fontOK) ? 'C' : 'NC',
    standardReference: 'SNI 8153:2015',
    legalReference: 'PP 16/2021 Pasal 227'
  };
}

// ============================================================
// 4. UNIVERSAL DESIGN SCORING
// ============================================================

/**
 * Calculate overall accessibility score
 * @param {Object} scores - Scores for each category (0-100)
 */
export function calculateAccessibilityScore(scores = {}) {
  const weights = {
    horizontal: 0.25,
    vertical: 0.25,
    facilities: 0.25,
    signage: 0.25
  };

  const horizontalScore = scores.horizontal || 0;
  const verticalScore = scores.vertical || 0;
  const facilitiesScore = scores.facilities || 0;
  const signageScore = scores.signage || 0;

  const weightedScore = 
    (horizontalScore * weights.horizontal) +
    (verticalScore * weights.vertical) +
    (facilitiesScore * weights.facilities) +
    (signageScore * weights.signage);

  // Determine grade
  let grade, status;
  if (weightedScore >= 90) {
    grade = 'A';
    status = 'Sangat Baik';
  } else if (weightedScore >= 80) {
    grade = 'B';
    status = 'Baik';
  } else if (weightedScore >= 70) {
    grade = 'C';
    status = 'Cukup';
  } else if (weightedScore >= 60) {
    grade = 'D';
    status = 'Kurang';
  } else {
    grade = 'E';
    status = 'Perlu Perbaikan';
  }

  return {
    overallScore: Math.round(weightedScore),
    grade: grade,
    status: status,
    breakdown: {
      horizontal: { score: horizontalScore, weight: '25%' },
      vertical: { score: verticalScore, weight: '25%' },
      facilities: { score: facilitiesScore, weight: '25%' },
      signage: { score: signageScore, weight: '25%' }
    },
    complianceLevel: weightedScore >= 70 ? 'COMPLIANT' : 'NON_COMPLIANT',
    legalReference: 'PP 16/2021 Pasal 226 & 227'
  };
}

// ============================================================
// 5. EVACUATION PATH ANALYSIS
// ============================================================

/**
 * Analyze accessible evacuation path
 * @param {Array} pathPoints - Array of path coordinates/segments
 * @param {Object} obstacles - Obstacles in path
 */
export function analyzeAccessibleEvacuationPath(pathPoints, obstacles = []) {
  const standards = {
    minWidth: 150,
    refugeInterval: 30, // meters
    maxDistance: 60     // meters to exit
  };

  let totalDistance = 0;
  let hasBarriers = false;
  let barrierCount = 0;

  // Calculate total path distance
  for (let i = 1; i < pathPoints.length; i++) {
    const dx = pathPoints[i].x - pathPoints[i-1].x;
    const dy = pathPoints[i].y - pathPoints[i-1].y;
    totalDistance += Math.sqrt(dx*dx + dy*dy);
  }

  // Check for barriers
  obstacles.forEach(obs => {
    if (obs.type === 'stairs' || obs.type === 'narrow') {
      hasBarriers = true;
      barrierCount++;
    }
  });

  // Calculate required refuge areas
  const requiredRefuges = Math.ceil(totalDistance / standards.refugeInterval);

  return {
    totalDistance: totalDistance.toFixed(2) + ' m',
    minWidthRequired: standards.minWidth + ' cm',
    hasBarriers: hasBarriers,
    barrierCount: barrierCount,
    refugeAreasRequired: requiredRefuges,
    status: (!hasBarriers && totalDistance <= standards.maxDistance) ? 'C' : 'NC',
    recommendations: hasBarriers
      ? [`Ada ${barrierCount} barrier pada jalur evakuasi, pertimbangkan area of refuge`]
      : ['Jalur evakuasi aksesibel'],
    standardReference: 'SNI 8153:2015',
    legalReference: 'PP 16/2021 Pasal 227'
  };
}

// ============================================================
// 6. PRIORITY MATRIX
// ============================================================

/**
 * Calculate repair priority
 * @param {string} impact - Safety impact level (high/medium/low)
 * @param {string} ease - Implementation ease (easy/medium/hard)
 * @param {number} affectedUsers - Number of affected users
 */
export function calculateRepairPriority(impact, ease, affectedUsers = 0) {
  const impactScores = { high: 3, medium: 2, low: 1 };
  const easeScores = { easy: 3, medium: 2, hard: 1 };

  const priorityScore = (impactScores[impact] || 1) * (easeScores[ease] || 1) + (affectedUsers > 10 ? 1 : 0);

  let priority, quadrant;
  if (priorityScore >= 8) {
    priority = 'CRITICAL';
    quadrant = 'High Impact / Easy';
  } else if (priorityScore >= 5) {
    priority = 'HIGH';
    quadrant = 'High Impact / Medium Effort';
  } else if (priorityScore >= 3) {
    priority = 'MEDIUM';
    quadrant = 'Medium Impact / Medium Effort';
  } else {
    priority = 'LOW';
    quadrant = 'Low Impact / High Effort';
  }

  return {
    priority: priority,
    quadrant: quadrant,
    score: priorityScore,
    impact: impact,
    ease: ease,
    affectedUsers: affectedUsers,
    recommendation: priority === 'CRITICAL' ? 'Segera perbaiki' : priority === 'HIGH' ? 'Prioritas tinggi' : 'Jadwalkan perbaikan'
  };
}

// ============================================================
// 7. UTILITY INFRASTRUCTURE CHECKLIST
// ============================================================

export const INFRASTRUCTURE_CHECKLIST = {
  prasarana: [
    { id: 'air_bersih', name: 'Sistem Air Bersih', standard: 'SNI 8153:2015', required: true },
    { id: 'air_kotor', name: 'Sistem Air Kotor/Drainase', standard: 'PP 16/2021', required: true },
    { id: 'listrik', name: 'Sistem Listrik', standard: 'SPLN', required: true },
    { id: 'komunikasi', name: 'Sistem Komunikasi', standard: 'SNI', required: true },
    { id: 'gas', name: 'Sistem Gas (LPG/Pipa)', standard: 'SNI', required: false },
    { id: 'sampah', name: 'Sistem Pembuangan Sampah', standard: 'PP 16/2021', required: true }
  ],
  sarana: [
    { id: 'parkir', name: 'Parkir (Mobil/Motor/Difabel)', standard: 'Permen PU 30/2006', required: true },
    { id: 'sanitasi', name: 'Sanitasi (Toilet/Wastafel)', standard: 'SNI 03-6197-2000', required: true },
    { id: 'ibadah', name: 'Tempat Ibadah', standard: 'PP 16/2021', required: false },
    { id: 'laktasi', name: 'Ruang Laktasi', standard: 'PP 16/2021', required: false },
    { id: 'sampah_terpilah', name: 'Tempat Sampah Terpilah', standard: 'PP 16/2021', required: true },
    { id: 'merokok', name: 'Area Merokok Terpisah', standard: 'PP 109/2022', required: false }
  ]
};

/**
 * Evaluate infrastructure completeness
 * @param {Object} existing - Existing facilities object
 */
export function evaluateInfrastructure(existing = {}) {
  const prasaranaTotal = INFRASTRUCTURE_CHECKLIST.prasarana.length;
  const saranaTotal = INFRASTRUCTURE_CHECKLIST.sarana.length;

  let prasaranaExists = 0;
  let saranaExists = 0;
  let requiredMissing = [];

  INFRASTRUCTURE_CHECKLIST.prasarana.forEach(item => {
    if (existing[item.id]) {
      prasaranaExists++;
    } else if (item.required) {
      requiredMissing.push(item.name);
    }
  });

  INFRASTRUCTURE_CHECKLIST.sarana.forEach(item => {
    if (existing[item.id]) {
      saranaExists++;
    } else if (item.required) {
      requiredMissing.push(item.name);
    }
  });

  const prasaranaPct = Math.round((prasaranaExists / prasaranaTotal) * 100);
  const saranaPct = Math.round((saranaExists / saranaTotal) * 100);
  const overallPct = Math.round(((prasaranaExists + saranaExists) / (prasaranaTotal + saranaTotal)) * 100);

  return {
    prasarana: {
      total: prasaranaTotal,
      exists: prasaranaExists,
      percentage: prasaranaPct
    },
    sarana: {
      total: saranaTotal,
      exists: saranaExists,
      percentage: saranaPct
    },
    overall: {
      percentage: overallPct,
      status: overallPct >= 80 ? 'C' : overallPct >= 60 ? 'NC-MAJOR' : 'NC-CRITICAL'
    },
    requiredMissing: requiredMissing,
    standardReference: 'PP 16/2021 Pasal 226 ayat 7'
  };
}

// ============================================================
// 8. CSV/EXPORT GENERATORS
// ============================================================

/**
 * Generate CSV data for BIM import
 * @param {Object} accessibilityData - All accessibility data
 */
export function generateBIMCsv(accessibilityData) {
  const headers = ['Element_Type', 'X_Coordinate', 'Y_Coordinate', 'Z_Coordinate', 'Width', 'Height', 'Status', 'Notes'];
  const rows = [headers];

  // Add corridors
  if (accessibilityData.corridors) {
    accessibilityData.corridors.forEach((c, i) => {
      rows.push([
        'Corridor',
        c.x || 0,
        c.y || 0,
        c.z || 0,
        c.width,
        c.length,
        c.status,
        `Koridor ${i + 1}`
      ]);
    });
  }

  // Add obstacles
  if (accessibilityData.obstacles) {
    accessibilityData.obstacles.forEach((o, i) => {
      rows.push([
        'Obstacle',
        o.x || 0,
        o.y || 0,
        o.z || 0,
        o.width,
        o.height || 0,
        'BARRIER',
        o.type
      ]);
    });
  }

  // Add facilities
  if (accessibilityData.facilities) {
    accessibilityData.facilities.forEach((f, i) => {
      rows.push([
        'Accessible_Facility',
        f.x || 0,
        f.y || 0,
        f.z || 0,
        f.width || 0,
        f.depth || 0,
        f.status,
        f.type
      ]);
    });
  }

  return rows.map(row => row.join(',')).join('\n');
}

// ============================================================
// 9. REPORT GENERATION HELPERS
// ============================================================

/**
 * Generate compliance summary text
 * @param {Object} results - All inspection results
 */
export function generateComplianceSummary(results) {
  const compliant = Object.values(results).filter(r => r.status === 'C').length;
  const nonCompliant = Object.values(results).filter(r => r.status === 'NC').length;
  const total = Object.keys(results).length;

  let summary = `Berdasarkan hasil pemeriksaan Aspek Kemudahan, `;

  if (nonCompliant === 0) {
    summary += `seluruh parameter memenuhi persyaratan PP 16/2021 Pasal 226 dan 227.`;
  } else if (compliant > nonCompliant) {
    summary += `mayoritas parameter (${compliant}/${total}) memenuhi standar dengan ${nonCompliant} aspek perlu perbaikan.`;
  } else {
    summary += `terdapat ${nonCompliant} aspek yang tidak memenuhi standar dan memerlukan perbaikan signifikan.`;
  }

  return {
    text: summary,
    compliant: compliant,
    nonCompliant: nonCompliant,
    total: total,
    complianceRate: Math.round((compliant / total) * 100),
    overallStatus: nonCompliant === 0 ? 'COMPLIANT' : nonCompliant <= 2 ? 'PARTIAL' : 'NON_COMPLIANT'
  };
}

// ============================================================
// 10. SIMULATION HELPERS
// ============================================================

/**
 * Simulate wheelchair path feasibility
 * @param {number} corridorWidth - Corridor width in cm
 * @param {number} doorWidth - Door width in cm
 * @param {Array} turns - Array of turn angles
 */
export function simulateWheelchairPath(corridorWidth, doorWidth, turns = []) {
  const wheelchair = {
    width: 70,
    length: 120,
    turningRadius: 75
  };

  const corridorPass = corridorWidth >= (wheelchair.width + 80); // 80cm clearance
  const doorPass = doorWidth >= 90;

  // Check turns
  const turnIssues = turns.filter(angle => angle > 90).length;

  return {
    wheelchair: wheelchair,
    corridorPass: corridorPass,
    doorPass: doorPass,
    turnIssues: turnIssues,
    feasible: corridorPass && doorPass && turnIssues === 0,
    recommendations: turnIssues > 0
      ? [`Ada ${turnIssues} belokan tajam yang memerlukan ruang putar tambahan`]
      : []
  };
}

/**
 * Calculate what-if scenarios
 * @param {string} scenarioType - Type of scenario
 * @param {Object} params - Scenario parameters
 */
export function calculateWhatIfScenario(scenarioType, params) {
  switch (scenarioType) {
    case 'corridor_widening':
      // If corridor is widened, can wheelchair pass?
      const newWidth = params.newWidth;
      const canPass = newWidth >= 150;
      return {
        scenario: 'Pelebaran Koridor',
        currentWidth: params.currentWidth + ' cm',
        proposedWidth: newWidth + ' cm',
        wheelchairCanPass: canPass,
        impact: canPass ? 'Positif - Memungkinkan akses wheelchair' : 'Tidak signifikan - Masih kurang lebar'
      };

    case 'ramp_relocation':
      // Calculate new ramp length if moved
      const rise = params.verticalRise;
      const maxSlope = 8.33;
      const minRun = (rise / maxSlope) * 100;
      return {
        scenario: 'Pemindahan Ramp',
        verticalRise: rise + ' cm',
        minimumHorizontalRun: minRun.toFixed(2) + ' m',
        requiredLandings: Math.ceil(rise / 75),
        feasibility: minRun <= params.availableSpace ? 'Feasible' : 'Not Feasible'
      };

    case 'lift_addition':
      // Estimate lift cost
      const floors = params.floors || 2;
      const baseCost = 150000000; // 150jt base
      const floorCost = 25000000; // 25jt per floor
      const estimatedCost = baseCost + (floorCost * (floors - 1));
      return {
        scenario: 'Penambahan Lift',
        floors: floors,
        estimatedCost: 'Rp ' + estimatedCost.toLocaleString('id-ID'),
        roi: 'Aksesibilitas penuh untuk difabel',
        priority: floors > 3 ? 'HIGH' : 'MEDIUM'
      };

    default:
      return { error: 'Unknown scenario type' };
  }
}

/**
 * Get grade from score
 * @param {number} score - Score value (0-100)
 * @returns {Object} Grade object with grade letter and color
 */
export function getGradeFromScore(score) {
  if (score >= 90) return { grade: 'A', color: 'var(--success-400)' };
  if (score >= 80) return { grade: 'B', color: 'var(--success-300)' };
  if (score >= 70) return { grade: 'C', color: 'var(--warning-400)' };
  if (score >= 60) return { grade: 'D', color: 'var(--orange-400)' };
  return { grade: 'E', color: 'var(--danger-400)' };
}
