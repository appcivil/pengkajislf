/**
 * EGRESS SYSTEM ENTITY
 * Domain entity untuk Sistem Jalur Evakuasi (Means of Egress)
 * Berdasarkan Permen PUPR No. 14/PRT/M/2017 (Pasal 220) dan Permen PUPR No. 26/PRT/M/2008
 */

/**
 * Kelas EgressRoute - Representasi jalur evakuasi
 */
export class EgressRoute {
  constructor({
    id,
    projectId,
    floorLevel,
    roomOrigin,
    exitDestination,
    pathGeometry = [],
    travelDistance = 0,
    isDeadEnd = false,
    widthClear = 0,
    capacityPersons = 0,
    occupantLoad = 0,
    complianceStatus = 'UNKNOWN',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.projectId = projectId;
    this.floorLevel = floorLevel;
    this.roomOrigin = roomOrigin;
    this.exitDestination = exitDestination;
    this.pathGeometry = pathGeometry;
    this.travelDistance = travelDistance;
    this.isDeadEnd = isDeadEnd;
    this.widthClear = widthClear;
    this.capacityPersons = capacityPersons;
    this.occupantLoad = occupantLoad;
    this.complianceStatus = complianceStatus;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Hitung utilization rate (persentase penggunaan kapasitas)
   */
  getUtilizationRate() {
    if (this.capacityPersons === 0) return 0;
    return Math.round((this.occupantLoad / this.capacityPersons) * 100);
  }

  /**
   * Cek apakah jalur compliant
   */
  isCompliant() {
    return this.complianceStatus === 'COMPLIANT' || this.complianceStatus === 'PASS';
  }

  /**
   * Update status compliance berdasarkan analisis
   */
  updateComplianceStatus(analysis) {
    if (analysis.travelDistanceOk && analysis.widthOk && analysis.capacityOk) {
      this.complianceStatus = 'COMPLIANT';
    } else {
      this.complianceStatus = 'NON_COMPLIANT';
    }
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * Kelas ExitComponent - Komponen exit (pintu, tangga, ramp)
 */
export class ExitComponent {
  constructor({
    id,
    routeId,
    componentType, // 'DOOR', 'STAIR', 'RAMP', 'CORRIDOR'
    widthMeasured = 0,
    swingDirection, // 'IN', 'OUT', 'SLIDING'
    hardwareType, // 'PANIC_BAR', 'PUSH_BAR', 'LEVER', 'KNOB'
    fireRating = 0, // menit
    pressureTest = null, // Pa (untuk pressurized stair)
    photos = [],
    headroomClearance = 0,
    riserHeight = 0,
    treadDepth = 0,
    handrailProvision = false,
    status = 'UNKNOWN',
    notes = '',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.routeId = routeId;
    this.componentType = componentType;
    this.widthMeasured = widthMeasured;
    this.swingDirection = swingDirection;
    this.hardwareType = hardwareType;
    this.fireRating = fireRating;
    this.pressureTest = pressureTest;
    this.photos = photos;
    this.headroomClearance = headroomClearance;
    this.riserHeight = riserHeight;
    this.treadDepth = treadDepth;
    this.handrailProvision = handrailProvision;
    this.status = status;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Validasi dimensi anak tangga (2O + A = 600-650mm)
   */
  validateStairDimensions() {
    if (this.componentType !== 'STAIR') return null;
    
    const O = this.riserHeight;
    const A = this.treadDepth;
    const comfortFormula = 2 * O + A;
    
    return {
      riserOk: O >= 150 && O <= 200,
      treadOk: A >= 250,
      comfortOk: comfortFormula >= 600 && comfortFormula <= 650,
      comfortValue: comfortFormula,
      nosingOk: this.nosing <= 25
    };
  }

  /**
   * Cek kepatuhan arah buka pintu
   */
  isDoorSwingCompliant(occupantLoad) {
    if (this.componentType !== 'DOOR') return null;
    
    // WAJIB swing out untuk occupant > 50 orang
    if (occupantLoad > 50 && this.swingDirection !== 'OUT') {
      return false;
    }
    return true;
  }
}

/**
 * Kelas EmergencyLighting - Sistem penerangan darurat
 */
export class EmergencyLighting {
  constructor({
    id,
    projectId,
    location = '',
    luxLevel = 0,
    batteryBackup = 0, // menit
    lampType = 'LED', // 'LED', 'INCANDESCENT', 'FLUORESCENT'
    lastTested = null,
    exitSignVisible = false,
    visibilityDistance = 0,
    signHeight = 0,
    photoluminescent = false,
    photoluminescentLuminance = 0,
    status = 'UNKNOWN',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.projectId = projectId;
    this.location = location;
    this.luxLevel = luxLevel;
    this.batteryBackup = batteryBackup;
    this.lampType = lampType;
    this.lastTested = lastTested;
    this.exitSignVisible = exitSignVisible;
    this.visibilityDistance = visibilityDistance;
    this.signHeight = signHeight;
    this.photoluminescent = photoluminescent;
    this.photoluminescentLuminance = photoluminescentLuminance;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Cek compliance berdasarkan jenis lokasi
   */
  checkCompliance(locationType) {
    const limits = {
      'EXIT_SIGN': { minLux: 50, maxHeight: 1800 },
      'STAIR': { minLux: 20 },
      'CORRIDOR': { minLux: 10 },
      'OPERATING_ROOM': { minLux: 200 },
      'MOSQUE': { minLux: 200 }
    };
    
    const limit = limits[locationType] || { minLux: 10 };
    
    return {
      luxOk: this.luxLevel >= limit.minLux,
      heightOk: limit.maxHeight ? this.signHeight <= limit.maxHeight : true,
      batteryOk: this.batteryBackup >= 30,
      requiredLux: limit.minLux
    };
  }
}

/**
 * Kelas SmokeZone - Zona kompartemen asap
 */
export class SmokeZone {
  constructor({
    id,
    projectId,
    floorLevel,
    zoneName = '',
    area = 0,
    smokeStopDoors = 0,
    smokeLayerHeight = 2.5, // meter dari lantai
    pressurized = false,
    pressureDifferential = 0,
    escapeAirVelocity = 0,
    exhaustCapacity = 0,
    boundaryGeometry = [],
    complianceStatus = 'UNKNOWN',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.projectId = projectId;
    this.floorLevel = floorLevel;
    this.zoneName = zoneName;
    this.area = area;
    this.smokeStopDoors = smokeStopDoors;
    this.smokeLayerHeight = smokeLayerHeight;
    this.pressurized = pressurized;
    this.pressureDifferential = pressureDifferential;
    this.escapeAirVelocity = escapeAirVelocity;
    this.exhaustCapacity = exhaustCapacity;
    this.boundaryGeometry = boundaryGeometry;
    this.complianceStatus = complianceStatus;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Cek compliance zona asap
   */
  checkCompliance() {
    return {
      areaOk: this.area <= 1600,
      pressureOk: this.pressurized ? (this.pressureDifferential >= 25 && this.pressureDifferential <= 50) : true,
      velocityOk: this.escapeAirVelocity >= 2.5,
      smokeLayerOk: this.smokeLayerHeight <= 2.5
    };
  }
}

/**
 * Kelas OccupantLoad - Perhitungan jumlah penghuni
 */
export class OccupantLoad {
  constructor({
    id,
    projectId,
    floorLevel,
    roomName = '',
    roomFunction, // 'RS_INPATIENT', 'OFFICE', 'CORRIDOR', 'ASSEMBLY_STANDING', 'ASSEMBLY_SEATED'
    roomArea = 0,
    occupantFactor = 0, // m²/orang
    calculatedLoad = 0,
    actualLoad = 0,
    notes = '',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.projectId = projectId;
    this.floorLevel = floorLevel;
    this.roomName = roomName;
    this.roomFunction = roomFunction;
    this.roomArea = roomArea;
    this.occupantFactor = occupantFactor;
    this.calculatedLoad = calculatedLoad;
    this.actualLoad = actualLoad;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Hitung occupant load berdasarkan fungsi ruang
   */
  static calculateOccupantLoad(area, roomFunction) {
    const factors = {
      'RS_INPATIENT': 10,      // 10 m²/orang
      'OFFICE': 10,            // 10 m²/orang
      'CORRIDOR': 0.5,         // 50% dari luasan (factor 0.5 m²/orang)
      'ASSEMBLY_STANDING': 1.5, // 1.5 m²/orang (berdiri)
      'ASSEMBLY_SEATED': 0.75,  // 0.75 m²/orang (duduk)
      'RETAIL': 3,
      'EDUCATION': 4,
      'RESTAURANT': 1.5
    };
    
    const factor = factors[roomFunction] || 10;
    
    if (roomFunction === 'CORRIDOR') {
      return Math.ceil(area / factor);
    }
    
    return Math.ceil(area / factor);
  }

  /**
   * Hitung total occupant load untuk lantai
   */
  static calculateTotalForFloor(occupantLoads) {
    return occupantLoads.reduce((sum, load) => sum + load.calculatedLoad, 0);
  }
}

/**
 * Kelas EgressAnalysis - Hasil analisis evakuasi
 */
export class EgressAnalysis {
  constructor({
    id,
    projectId,
    floorLevel,
    totalOccupantLoad = 0,
    availableExitCapacity = 0,
    requiredExitWidth = 0,
    providedExitWidth = 0,
    maxTravelDistance = 0,
    allowedTravelDistance = 0,
    commonPathDistance = 0,
    allowedCommonPathDistance = 0,
    numberOfExits = 0,
    requiredNumberOfExits = 0,
    hasSprinkler = false,
    buildingClass = 'II', // A, B, C berdasarkan Permen 26/2008
    complianceScore = 0,
    recommendations = [],
    status = 'UNKNOWN',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.projectId = projectId;
    this.floorLevel = floorLevel;
    this.totalOccupantLoad = totalOccupantLoad;
    this.availableExitCapacity = availableExitCapacity;
    this.requiredExitWidth = requiredExitWidth;
    this.providedExitWidth = providedExitWidth;
    this.maxTravelDistance = maxTravelDistance;
    this.allowedTravelDistance = allowedTravelDistance;
    this.commonPathDistance = commonPathDistance;
    this.allowedCommonPathDistance = allowedCommonPathDistance;
    this.numberOfExits = numberOfExits;
    this.requiredNumberOfExits = requiredNumberOfExits;
    this.hasSprinkler = hasSprinkler;
    this.buildingClass = buildingClass;
    this.complianceScore = complianceScore;
    this.recommendations = recommendations;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Hitung compliance score
   */
  calculateComplianceScore() {
    let score = 0;
    
    // Exit Number: 20 poin
    if (this.numberOfExits >= this.requiredNumberOfExits) score += 20;
    else score += (this.numberOfExits / this.requiredNumberOfExits) * 20;
    
    // Travel Distance: 20 poin
    if (this.maxTravelDistance <= this.allowedTravelDistance) score += 20;
    else score += Math.max(0, 20 - ((this.maxTravelDistance - this.allowedTravelDistance) / this.allowedTravelDistance) * 20);
    
    // Width Capacity: 20 poin
    if (this.providedExitWidth >= this.requiredExitWidth) score += 20;
    else score += (this.providedExitWidth / this.requiredExitWidth) * 20;
    
    // Stair Protection: 20 poin (placeholder)
    score += 20;
    
    // Lighting/Sign: 20 poin (placeholder)
    score += 20;
    
    this.complianceScore = Math.round(score);
    return this.complianceScore;
  }

  /**
   * Cek kelaikan (Pass threshold: 80/100)
   */
  isLaik() {
    return this.complianceScore >= 80;
  }
}

/**
 * Kelas EvacuationDrill - Simulasi evakuasi
 */
export class EvacuationDrill {
  constructor({
    id,
    projectId,
    drillDate,
    totalEvacuationTime = 0,
    totalOccupants = 0,
    issues = [],
    recommendations = [],
    attendanceList = [],
    photos = [],
    status = 'COMPLETED',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.projectId = projectId;
    this.drillDate = drillDate;
    this.totalEvacuationTime = totalEvacuationTime;
    this.totalOccupants = totalOccupants;
    this.issues = issues;
    this.recommendations = recommendations;
    this.attendanceList = attendanceList;
    this.photos = photos;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Hitung RSET (Required Safe Egress Time)
   */
  calculateRSET(detectionTime = 60, alarmTime = 30, preMovementTime = 180) {
    return detectionTime + alarmTime + preMovementTime + this.totalEvacuationTime;
  }
}
