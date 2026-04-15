/**
 * PENGENDALIAN DAMPAK LINGKUNGAN - DOMAIN ENTITIES
 * Modul pemeriksaan aspek lingkungan untuk SLF
 * Berdasarkan PP 16/2021, UU 32/2009, Permen LHK 4/2021, 68/2016
 * UI Style: Presidential Quartz
 */

// ============================================================
// 1. DOKUMEN LINGKUNGAN (AMDAL/UKL-UPL)
// ============================================================

export class EnvironmentalDocument {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.documentType = data.documentType || 'UKL_UPL'; // 'AMDAL', 'UKL_UPL', 'DELH', 'DPLH'
    this.registrationNumber = data.registrationNumber || '';
    this.issueDate = data.issueDate || null;
    this.expiryDate = data.expiryDate || null;
    this.issuingAgency = data.issuingAgency || '';
    this.businessName = data.businessName || '';
    this.buildingOwnerMatch = data.buildingOwnerMatch || true;
    this.status = data.status || 'VALID'; // 'VALID', 'EXPIRED', 'INVALID'
    this.notes = data.notes || '';
    this.photos = data.photos || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  getValidityPeriod() {
    const periods = {
      'AMDAL': 5, // tahun
      'UKL_UPL': 3, // tahun
      'DELH': 1, // tahun
      'DPLH': 1 // tahun
    };
    return periods[this.documentType] || 3;
  }

  isExpiringSoon(months = 6) {
    if (!this.expiryDate) return false;
    const expiry = new Date(this.expiryDate);
    const warningDate = new Date();
    warningDate.setMonth(warningDate.getMonth() + months);
    return expiry <= warningDate && expiry > new Date();
  }

  isExpired() {
    if (!this.expiryDate) return false;
    return new Date(this.expiryDate) < new Date();
  }

  getDaysUntilExpiry() {
    if (!this.expiryDate) return null;
    const diff = new Date(this.expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  static determineRequiredDocument(buildingArea, capacity) {
    if (buildingArea > 5000 || capacity > 100) {
      return { type: 'AMDAL', description: 'Wajib AMDAL (luas >5000m² atau kapasitas >100 orang)' };
    } else if (buildingArea > 1000) {
      return { type: 'UKL_UPL', description: 'Wajib UKL-UPL (luas 1000-5000m²)' };
    } else {
      return { type: 'DELH_DPLH', description: 'DELH/DPLH (luas <1000m²)' };
    }
  }
}

// ============================================================
// 2. AIR LIMBAH (WASTEWATER)
// ============================================================

export class WastewaterMonitoring {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.samplingDate = data.samplingDate || null;
    this.samplingLocation = data.samplingLocation || '';
    this.laboratory = data.laboratory || '';
    this.parameters = data.parameters || {
      ph: null,
      bod: null,
      cod: null,
      tss: null,
      ammonia: null,
      oil: null,
      coliform: null
    };
    this.standards = data.standards || WastewaterMonitoring.getDefaultStandards();
    this.complianceStatus = data.complianceStatus || 'UNKNOWN'; // 'PASS', 'FAIL', 'PARTIAL'
    this.ipalOperational = data.ipalOperational || true;
    this.ipalType = data.ipalType || '';
    this.sludgeVolume = data.sludgeVolume || 0;
    this.aeratorConsumption = data.aeratorConsumption || 0; // kWh/m³
    this.photos = data.photos || [];
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date();
  }

  static getDefaultStandards() {
    return {
      ph: { min: 6, max: 9, unit: '' },
      bod: { max: 30, unit: 'mg/L' },
      cod: { max: 100, unit: 'mg/L' },
      tss: { max: 50, unit: 'mg/L' },
      ammonia: { max: 10, unit: 'mg/L' },
      oil: { max: 5, unit: 'mg/L' },
      coliform: { max: 1000, unit: 'MPN/100mL' }
    };
  }

  checkCompliance() {
    const results = {};
    let overallCompliance = true;

    for (const [param, value] of Object.entries(this.parameters)) {
      if (value === null || value === undefined) continue;
      
      const std = this.standards[param];
      if (!std) continue;

      let status = 'PASS';
      let deviation = 0;

      if (param === 'ph') {
        if (value < std.min || value > std.max) {
          status = 'FAIL';
          deviation = value < std.min ? std.min - value : value - std.max;
          overallCompliance = false;
        }
      } else {
        if (value > std.max) {
          status = 'FAIL';
          deviation = value - std.max;
          overallCompliance = false;
        }
      }

      results[param] = {
        value,
        standard: std.max || `${std.min}-${std.max}`,
        status,
        deviation: deviation > 0 ? deviation.toFixed(2) : 0,
        unit: std.unit
      };
    }

    this.complianceStatus = overallCompliance ? 'PASS' : 'FAIL';
    return {
      parameters: results,
      overallStatus: this.complianceStatus,
      recommendation: overallCompliance 
        ? 'Pengelolaan air limbah memenuhi baku mutu Permen LHK 68/2016'
        : 'Perlu peningkatan treatment IPAL atau evaluasi sistem'
    };
  }

  calculateRemovalEfficiency(influent, effluent) {
    if (!influent || !effluent) return null;
    const efficiency = ((influent - effluent) / influent) * 100;
    return {
      bod: efficiency,
      status: efficiency >= 80 ? 'GOOD' : efficiency >= 60 ? 'MODERATE' : 'POOR'
    };
  }
}

// ============================================================
// 3. NERACA AIR (WATER MASS BALANCE)
// ============================================================

export class WaterMassBalance {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.cleanWaterInflow = data.cleanWaterInflow || 0; // m³/bulan
    this.wastewaterOutflow = data.wastewaterOutflow || 0; // m³/bulan
    this.rainwaterInflow = data.rainwaterInflow || 0; // m³/bulan
    this.evaporationLoss = data.evaporationLoss || 0; // m³/bulan
    this.leakageEstimate = data.leakageEstimate || 0; // m³/bulan
    this.recycledWater = data.recycledWater || 0; // m³/bulan
    this.measurementPeriod = data.measurementPeriod || 'monthly';
    this.createdAt = data.createdAt || new Date();
  }

  calculateBalance() {
    const totalIn = this.cleanWaterInflow + this.rainwaterInflow;
    const totalOut = this.wastewaterOutflow + this.evaporationLoss + this.leakageEstimate;
    const unaccounted = totalIn - totalOut - this.recycledWater;
    const efficiency = totalIn > 0 ? ((this.wastewaterOutflow / totalIn) * 100) : 0;
    const lossPercentage = totalIn > 0 ? ((unaccounted / totalIn) * 100) : 0;

    return {
      totalInflow: totalIn.toFixed(2),
      totalOutflow: totalOut.toFixed(2),
      unaccountedWater: unaccounted.toFixed(2),
      efficiency: efficiency.toFixed(1),
      lossPercentage: lossPercentage.toFixed(1),
      status: lossPercentage <= 20 ? 'GOOD' : lossPercentage <= 30 ? 'MODERATE' : 'POOR',
      recommendation: lossPercentage > 20 
        ? `Deteksi kehilangan air ${lossPercentage.toFixed(1)}%. Perlu audit kebocoran pipa.` 
        : 'Neraca air dalam batas normal (80-90% efisiensi)'
    };
  }
}

// ============================================================
// 4. SAMPAH PADAT (SOLID WASTE)
// ============================================================

export class WasteAudit {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.auditDate = data.auditDate || null;
    this.dailyWasteTotal = data.dailyWasteTotal || 0; // kg/hari
    this.composition = data.composition || {
      organic: 0, // kg
      plastic: 0, // kg
      paper: 0, // kg
      metal: 0, // kg
      glass: 0, // kg
      b3: 0, // kg
      residual: 0 // kg
    };
    this.managementMethods = data.managementMethods || {
      reduce: 0, // %
      reuse: 0, // %
      recycle: 0, // %
      composting: 0, // %
      landfilled: 0 // %
    };
    this.tpsCondition = data.tpsCondition || {
      area: 0, // m²
      ventilation: false,
      paving: false,
      separationBins: 0,
      distanceFromBuilding: 0 // m
    };
    this.photos = data.photos || [];
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date();
  }

  calculateDiversionRate() {
    const diverted = this.composition.organic + this.composition.plastic + 
                     this.composition.paper + this.composition.metal + this.composition.glass;
    const total = Object.values(this.composition).reduce((a, b) => a + b, 0);
    const rate = total > 0 ? (diverted / total) * 100 : 0;
    
    return {
      diversionRate: rate.toFixed(1),
      landfillRate: (100 - rate).toFixed(1),
      composition: {
        organic: ((this.composition.organic / total) * 100).toFixed(1),
        plastic: ((this.composition.plastic / total) * 100).toFixed(1),
        paper: ((this.composition.paper / total) * 100).toFixed(1),
        metal: ((this.composition.metal / total) * 100).toFixed(1),
        b3: ((this.composition.b3 / total) * 100).toFixed(1),
        residual: ((this.composition.residual / total) * 100).toFixed(1)
      },
      status: rate >= 70 ? 'EXCELLENT' : rate >= 60 ? 'GOOD' : rate >= 40 ? 'MODERATE' : 'POOR',
      zeroWasteTarget: rate >= 70 ? 'Tercapai' : 'Belum Tercapai',
      recommendation: rate < 60 
        ? `Tingkatkan pemilahan sampah organik untuk composting. Potensi pengurangan sampah TPA ${(60-rate).toFixed(0)}%`
        : 'Pengelolaan sampah mendekati zero waste'
    };
  }

  checkTPSCompliance() {
    const minDistance = 10; // meter
    const hasSeparation = this.tpsCondition.separationBins >= 4;
    const distanceOk = this.tpsCondition.distanceFromBuilding >= minDistance;
    
    return {
      area: this.tpsCondition.area,
      ventilation: this.tpsCondition.ventilation,
      paving: this.tpsCondition.paving,
      separationBins: this.tpsCondition.separationBins,
      distance: this.tpsCondition.distanceFromBuilding,
      distanceCompliant: distanceOk,
      separationCompliant: hasSeparation,
      overallStatus: distanceOk && hasSeparation && this.tpsCondition.paving ? 'COMPLIANT' : 'NON_COMPLIANT',
      issues: [
        !distanceOk && `Jarak TPS ke bangunan ${this.tpsCondition.distanceFromBuilding}m (minimum 10m)`,
        !hasSeparation && 'Pemisahan sampah kurang dari 4 jenis',
        !this.tpsCondition.paving && 'Lantai TPS tidak diperkeras',
        !this.tpsCondition.ventilation && 'Ventilasi TPS tidak memadai'
      ].filter(Boolean)
    };
  }
}

// ============================================================
// 5. EMISI UDARA (AIR EMISSION)
// ============================================================

export class AirEmission {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.samplingDate = data.samplingDate || null;
    this.sourceType = data.sourceType || 'STACK'; // 'STACK', 'FUGITIVE', 'AMBIENT'
    this.sourceDescription = data.sourceDescription || '';
    this.stackParameters = data.stackParameters || {
      height: 0, // m
      diameter: 0, // m
      temperature: 0, // °C
      flowRate: 0 // m³/s
    };
    this.measurements = data.measurements || {
      so2: null, // mg/Nm³
      nox: null, // mg/Nm³
      co: null, // mg/Nm³
      pm10: null, // mg/Nm³
      pm25: null, // mg/Nm³
      opacity: null, // %
      o3: null, // μg/m³
      hc: null // mg/Nm³
    };
    this.standards = data.standards || AirEmission.getDefaultStandards(this.sourceType);
    this.complianceStatus = data.complianceStatus || 'UNKNOWN';
    this.photos = data.photos || [];
    this.createdAt = data.createdAt || new Date();
  }

  static getDefaultStandards(sourceType) {
    if (sourceType === 'AMBIENT') {
      return {
        pm10: { max: 150, unit: 'μg/m³' },
        pm25: { max: 65, unit: 'μg/m³' },
        so2: { max: 365, unit: 'μg/m³' },
        no2: { max: 200, unit: 'μg/m³' },
        co: { max: 10000, unit: 'μg/m³' },
        o3: { max: 160, unit: 'μg/m³' }
      };
    }
    // Stack emission standards (Permen LHK 21/2008)
    return {
      so2: { max: 900, unit: 'mg/Nm³' },
      nox: { max: 850, unit: 'mg/Nm³' },
      co: { max: 1000, unit: 'mg/Nm³' },
      pm10: { max: 150, unit: 'mg/Nm³' },
      opacity: { max: 40, unit: '%' }
    };
  }

  checkCompliance() {
    const results = {};
    let overallCompliance = true;

    for (const [param, value] of Object.entries(this.measurements)) {
      if (value === null || value === undefined) continue;
      
      const std = this.standards[param];
      if (!std) continue;

      const status = value <= std.max ? 'PASS' : 'FAIL';
      if (status === 'FAIL') overallCompliance = false;

      results[param] = {
        value,
        standard: std.max,
        status,
        unit: std.unit,
        deviation: value > std.max ? (value - std.max).toFixed(2) : 0
      };
    }

    this.complianceStatus = overallCompliance ? 'PASS' : 'FAIL';
    return {
      parameters: results,
      overallStatus: this.complianceStatus,
      sourceType: this.sourceType,
      recommendation: overallCompliance
        ? 'Emisi memenuhi baku mutu'
        : 'Perlu pengendalian emisi atau peningkatan scrubber'
    };
  }

  calculateFugitiveEmission(area, emissionFactor) {
    // kg/hari = area (m2) * emissionFactor (kg/m2/hari)
    const dailyEmission = area * emissionFactor;
    const annualEmission = dailyEmission * 365 / 1000; // ton/tahun
    
    return {
      dailyEmission: dailyEmission.toFixed(3) + ' kg/hari',
      annualEmission: annualEmission.toFixed(2) + ' ton/tahun',
      area: area + ' m²',
      emissionFactor: emissionFactor + ' kg/m²/hari'
    };
  }
}

// ============================================================
// 6. KEBISINGAN & GETARAN (NOISE & VIBRATION)
// ============================================================

export class NoiseMeasurement {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.measurementDate = data.measurementDate || null;
    this.location = data.location || '';
    this.timeOfDay = data.timeOfDay || 'DAY'; // 'DAY', 'NIGHT'
    this.measurementPoints = data.measurementPoints || [];
    this.vibrationData = data.vibrationData || {
      ppv: 0, // Peak Particle Velocity mm/s
      frequency: 0 // Hz
    };
    this.sensitiveAreaNearby = data.sensitiveAreaNearby || false;
    this.sensitiveAreaType = data.sensitiveAreaType || ''; // 'RS', 'SEKOLAH', 'PERMUKIMAN'
    this.photos = data.photos || [];
    this.createdAt = data.createdAt || new Date();
  }

  static getNoiseStandards() {
    return {
      day: { residential: 55, commercial: 65, industrial: 70 },
      night: { residential: 45, commercial: 55, industrial: 60 }
    };
  }

  checkCompliance(areaType = 'residential') {
    const standards = NoiseMeasurement.getNoiseStandards();
    const limit = standards[this.timeOfDay.toLowerCase()][areaType];
    
    const results = this.measurementPoints.map(point => {
      const status = point.value <= limit ? 'PASS' : 'FAIL';
      return {
        ...point,
        limit,
        status,
        excess: point.value > limit ? (point.value - limit).toFixed(1) : 0
      };
    });

    const maxValue = Math.max(...this.measurementPoints.map(p => p.value), 0);
    const overallStatus = maxValue <= limit ? 'PASS' : 'FAIL';

    return {
      points: results,
      maxValue: maxValue.toFixed(1),
      limit: limit + ' dB(A)',
      overallStatus,
      areaType,
      recommendation: overallStatus === 'FAIL'
        ? `Kebisingan melebihi baku mutu ${limit} dB(A). Perlu peredam suara atau batasi operasional malam.`
        : 'Tingkat kebisingan memenuhi baku mutu'
    };
  }

  checkVibrationCompliance() {
    const limit = 0.3; // mm/s (SNI 03-6884-2002)
    const status = this.vibrationData.ppv <= limit ? 'PASS' : 'FAIL';
    
    return {
      ppv: this.vibrationData.ppv.toFixed(2) + ' mm/s',
      frequency: this.vibrationData.frequency + ' Hz',
      limit: limit + ' mm/s',
      status,
      recommendation: status === 'FAIL'
        ? 'Getaran melebihi 0.3 mm/s. Perlu isolasi getaran pada mesin.'
        : 'Getaran dalam batas aman'
    };
  }
}

// ============================================================
// 7. LIMBAH B3 (HAZARDOUS WASTE)
// ============================================================

export class HazardousWaste {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.wasteType = data.wasteType || ''; // 'OLI_BEKAS', 'AKI', 'LAMPU_TL', 'ELEKTRONIK', 'KIMIA'
    this.wasteCategory = data.wasteCategory || 'B3';
    this.quantity = data.quantity || 0; // kg
    this.storageLocation = data.storageLocation || '';
    this.storageCondition = data.storageCondition || 'GOOD';
    this.vendorName = data.vendorName || '';
    this.vendorRegistration = data.vendorRegistration || '';
    this.manifestNumber = data.manifestNumber || '';
    this.transportDate = data.transportDate || null;
    this.processingDate = data.processingDate || null;
    this.processingMethod = data.processingMethod || ''; // 'LANDFILL', 'INCINERATION', 'RECYCLING'
    this.trackingStatus = data.trackingStatus || 'IN_STORAGE'; // 'IN_STORAGE', 'IN_TRANSIT', 'PROCESSED'
    this.photos = data.photos || [];
    this.createdAt = data.createdAt || new Date();
  }

  getHazardSymbol() {
    const symbols = {
      'OLI_BEKAS': '🛢️',
      'AKI': '🔋',
      'LAMPU_TL': '💡',
      'ELEKTRONIK': '💻',
      'KIMIA': '☠️',
      'MEDIS': '🏥'
    };
    return symbols[this.wasteType] || '⚠️';
  }

  getWasteLabel() {
    const labels = {
      'OLI_BEKAS': 'Oli Bekas',
      'AKI': 'Aki/Baterai',
      'LAMPU_TL': 'Lampu TL/LED',
      'ELEKTRONIK': 'Limbah Elektronik',
      'KIMIA': 'Limbah Kimia',
      'MEDIS': 'Limbah Medis'
    };
    return labels[this.wasteType] || this.wasteType;
  }

  checkVendorCompliance() {
    const hasVendor = !!this.vendorName;
    const hasRegistration = !!this.vendorRegistration;
    const hasManifest = !!this.manifestNumber;
    
    return {
      vendorRegistered: hasVendor && hasRegistration,
      manifestComplete: hasManifest,
      overallStatus: hasVendor && hasRegistration && hasManifest ? 'COMPLIANT' : 'NON_COMPLIANT',
      issues: [
        !hasVendor && 'Vendor pengangkut belum ditunjuk',
        !hasRegistration && 'Vendor tidak terdaftar di DLH',
        !hasManifest && 'Dokumen manifest tidak lengkap'
      ].filter(Boolean)
    };
  }
}

// ============================================================
// 8. KONSERVASI ENERGI (ENERGY CONSERVATION)
// ============================================================

export class EnergyAudit {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.auditYear = data.auditYear || new Date().getFullYear();
    this.monthlyConsumption = data.monthlyConsumption || []; // kWh per bulan
    this.buildingArea = data.buildingArea || 0; // m²
    this.buildingType = data.buildingType || 'office'; // 'office', 'hotel', 'hospital', 'mall', 'residential', 'school'
    this.equipmentBreakdown = data.equipmentBreakdown || {
      ac: 0, // %
      lighting: 0,
      equipment: 0,
      others: 0
    };
    this.savingsMeasures = data.savingsMeasures || [];
    this.photos = data.photos || [];
    this.createdAt = data.createdAt || new Date();
  }

  static getEUIStandards() {
    return {
      'office': 240,
      'hotel': 300,
      'hospital': 380,
      'mall': 350,
      'residential': 150,
      'school': 200
    };
  }

  calculateEUI() {
    const annualKWh = this.monthlyConsumption.reduce((a, b) => a + b, 0);
    const eui = this.buildingArea > 0 ? annualKWh / this.buildingArea : 0;
    const standardEUI = EnergyAudit.getEUIStandards()[this.buildingType] || 240;
    const efficiency = (eui / standardEUI) * 100;
    
    let grade;
    if (efficiency <= 60) grade = 'Sangat Efisien (Green Building)';
    else if (efficiency <= 80) grade = 'Efisien';
    else if (efficiency <= 100) grade = 'Standar';
    else if (efficiency <= 120) grade = 'Boros';
    else grade = 'Sangat Boros';

    const potentialSaving = Math.max(0, eui - (standardEUI * 0.8));
    const savingPercent = eui > 0 ? (potentialSaving / eui) * 100 : 0;

    return {
      annualConsumption: annualKWh.toFixed(0) + ' kWh/tahun',
      eui: eui.toFixed(2) + ' kWh/m²/th',
      standardEUI: standardEUI + ' kWh/m²/th',
      efficiency: efficiency.toFixed(1) + '%',
      grade,
      status: efficiency <= 100 ? 'PASS' : 'FAIL',
      potentialSaving: potentialSaving.toFixed(2) + ' kWh/m²/th',
      savingPotentialPercent: savingPercent.toFixed(1) + '%',
      recommendation: efficiency > 100 
        ? `Potensi penghematan ${savingPercent.toFixed(0)}% melalui audit energi detail`
        : 'Konsumsi energi dalam batas standar'
    };
  }

  calculatePotentialSavings() {
    const measures = [
      { name: 'LED Retrofit', savingPercent: 40, costEstimate: 'Medium' },
      { name: 'AC Inverter', savingPercent: 30, costEstimate: 'High' },
      { name: 'Smart Sensors', savingPercent: 15, costEstimate: 'Low' },
      { name: 'Solar Panel 10kWp', savingPercent: 20, costEstimate: 'High' }
    ];
    
    return measures;
  }

  calculateCarbonFootprint(annualLiterDiesel = 0) {
    const annualKWh = this.monthlyConsumption.reduce((a, b) => a + b, 0);
    const emissionElectricity = annualKWh * 0.85; // kg CO2
    const emissionDiesel = annualLiterDiesel * 2.68;
    const totalEmission = emissionElectricity + emissionDiesel;
    const totalTon = totalEmission / 1000;
    const carbonIntensity = this.buildingArea > 0 ? totalEmission / this.buildingArea : 0;
    const treesNeeded = Math.ceil(totalEmission / 20);

    return {
      electricityEmission: (emissionElectricity / 1000).toFixed(2) + ' ton CO₂/th',
      dieselEmission: (emissionDiesel / 1000).toFixed(2) + ' ton CO₂/th',
      totalEmission: totalTon.toFixed(2) + ' ton CO₂/th',
      carbonIntensity: carbonIntensity.toFixed(2) + ' kg CO₂/m²/th',
      treesNeeded: treesNeeded + ' pohon',
      status: carbonIntensity < 50 ? 'GOOD' : carbonIntensity < 100 ? 'MODERATE' : 'POOR',
      recommendation: `Tanam ${treesNeeded} pohon untuk carbon neutral, atau pasang solar panel ${(annualKWh * 0.2 / 1000).toFixed(1)} kWp`
    };
  }
}

// ============================================================
// 9. KONSERVASI AIR (WATER CONSERVATION)
// ============================================================

export class WaterAudit {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.monthlyConsumption = data.monthlyConsumption || []; // m³ per bulan
    this.buildingArea = data.buildingArea || 0;
    this.occupantCount = data.occupantCount || 0;
    this.rainwaterSystem = data.rainwaterSystem || {
      catchmentArea: 0, // m²
      annualRainfall: 0, // mm/tahun
      tankCapacity: 0, // m³
      efficiency: 0.9,
      usage: '' // 'FLUSHING', 'IRRIGATION', 'OTHERS'
    };
    this.createdAt = data.createdAt || new Date();
  }

  calculateWaterFootprint() {
    const annualM3 = this.monthlyConsumption.reduce((a, b) => a + b, 0);
    const dailyPerCapita = this.occupantCount > 0 ? (annualM3 * 1000 / 365 / this.occupantCount) : 0;
    
    const standards = {
      residential: 120,
      office: 50,
      hotel: 200,
      hospital: 300
    };

    return {
      annualConsumption: annualM3.toFixed(1) + ' m³/tahun',
      dailyPerCapita: dailyPerCapita.toFixed(1) + ' L/org/hari',
      standard: '50-120 L/org/hari',
      status: dailyPerCapita <= 120 ? 'GOOD' : 'POOR',
      recommendation: dailyPerCapita > 120 
        ? 'Penggunaan air di atas standar. Pertimbangkan water saving devices.'
        : 'Penggunaan air efisien'
    };
  }

  calculateRainwaterPotential() {
    const { catchmentArea, annualRainfall, tankCapacity, efficiency } = this.rainwaterSystem;
    const volume = efficiency * catchmentArea * (annualRainfall / 1000); // m³/tahun
    const utilization = tankCapacity > 0 ? Math.min(100, (volume / tankCapacity) * 100).toFixed(1) : 0;
    
    return {
      catchmentArea: catchmentArea + ' m²',
      annualRainfall: annualRainfall + ' mm/th',
      potentialVolume: volume.toFixed(2) + ' m³/tahun',
      tankCapacity: tankCapacity + ' m³',
      utilization: utilization + '%',
      status: volume > 0 ? 'ACTIVE' : 'NOT_INSTALLED',
      recommendation: volume > 0
        ? `Sistem harvesting dapat menampung ${volume.toFixed(1)} m³ air hujan per tahun`
        : 'Pertimbangkan instalasi rainwater harvesting untuk konservasi air'
    };
  }
}

// ============================================================
// 10. DRAINASE & BANJIR (DRAINAGE & FLOOD)
// ============================================================

export class DrainageAnalysis {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.catchmentArea = data.catchmentArea || 0; // m²
    this.runoffCoefficient = data.runoffCoefficient || 0.9; // beton 0.9, tanah 0.3
    this.rainfallIntensity = data.rainfallIntensity || 100; // mm/jam
    this.timeConcentration = data.timeConcentration || 15; // menit
    this.infiltrationWells = data.infiltrationWells || [];
    this.siteElevation = data.siteElevation || {
      buildingFloor: 0,
      roadLevel: 0,
      floodHistory: false
    };
    this.createdAt = data.createdAt || new Date();
  }

  calculateRationalMethod() {
    const Q = (this.runoffCoefficient * this.rainfallIntensity * this.catchmentArea) / 360; // m³/s
    const volumeHourly = Q * 3600; // m³/jam
    const wellsNeeded = Math.ceil(volumeHourly / 1); // asumsi 1 sumur 1m³/jam
    
    return {
      peakDischarge: Q.toFixed(3) + ' m³/s',
      volumeHourly: volumeHourly.toFixed(2) + ' m³',
      runoffCoefficient: this.runoffCoefficient,
      infiltrationWellsNeeded: wellsNeeded + ' sumur',
      status: wellsNeeded <= (this.catchmentArea / 100) ? 'PASS' : 'FAIL',
      recommendation: `Direkomendasikan ${wellsNeeded} sumur resapan diameter 1m x kedalaman 2m`
    };
  }

  checkFloodRisk() {
    const elevationDiff = this.siteElevation.buildingFloor - this.siteElevation.roadLevel;
    const floodRisk = elevationDiff < 0.5 || this.siteElevation.floodHistory;
    
    return {
      buildingElevation: this.siteElevation.buildingFloor + ' m',
      roadElevation: this.siteElevation.roadLevel + ' m',
      elevationDifference: elevationDiff.toFixed(2) + ' m',
      floodHistory: this.siteElevation.floodHistory,
      riskLevel: floodRisk ? 'HIGH' : 'LOW',
      status: floodRisk ? 'FAIL' : 'PASS',
      recommendation: floodRisk
        ? 'Risiko banjir tinggi. Perlu sistem proteksi (pompa, sandbag) atau peninggian lantai dasar.'
        : 'Elevasi bangunan aman dari risiko banjir'
    };
  }

  calculateInfiltrationCapacity() {
    const totalWellVolume = this.infiltrationWells.reduce((sum, well) => {
      const volume = Math.PI * Math.pow((well.diameter || 1) / 2, 2) * (well.depth || 2);
      return sum + volume;
    }, 0);
    
    const infiltrationRate = totalWellVolume * 0.5; // asumsi 50% efisiensi
    const percentage = this.catchmentArea > 0 ? (infiltrationRate / (this.catchmentArea * 0.001)) * 100 : 0;
    
    return {
      totalWellVolume: totalWellVolume.toFixed(2) + ' m³',
      infiltrationCapacity: infiltrationRate.toFixed(2) + ' m³/hari',
      infiltrationPercentage: percentage.toFixed(1) + '%',
      status: percentage >= 30 ? 'PASS' : 'FAIL',
      recommendation: percentage < 30
        ? `Infiltrasi ${percentage.toFixed(0)}% (minimum 30%). Tambah ${Math.ceil((30 - percentage) / 10)} sumur resapan.`
        : 'Kapasitas resapan memenuhi persyaratan'
    };
  }
}

// ============================================================
// 11. RTH & RUANG TERBUKA (GREEN OPEN SPACE)
// ============================================================

export class GreenSpaceAnalysis {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.projectId = data.projectId || null;
    this.totalSiteArea = data.totalSiteArea || 0; // m²
    this.greenSpaceArea = data.greenSpaceArea || 0; // m²
    this.vegetationTypes = data.vegetationTypes || [];
    this.thermalData = data.thermalData || {
      surfaceTemperatures: [], // array of {location, material, temperature}
      hotspots: []
    };
    this.ndviData = data.ndviData || {
      average: 0,
      healthy: 0,
      stressed: 0
    };
    this.photos = data.photos || [];
    this.createdAt = data.createdAt || new Date();
  }

  calculateGreenRatio() {
    const ratio = this.totalSiteArea > 0 ? (this.greenSpaceArea / this.totalSiteArea) * 100 : 0;
    const minimumRequired = 30; // KDB max 70%
    
    return {
      greenSpaceArea: this.greenSpaceArea.toFixed(1) + ' m²',
      totalSiteArea: this.totalSiteArea.toFixed(1) + ' m²',
      greenRatio: ratio.toFixed(1) + '%',
      minimumRequired: minimumRequired + '%',
      status: ratio >= minimumRequired ? 'PASS' : 'FAIL',
      recommendation: ratio < minimumRequired
        ? `RTH ${ratio.toFixed(1)}% (minimum ${minimumRequired}%). Tambah ${(minimumRequired - ratio).toFixed(0)}% area hijau.`
        : 'Persentase RTH memenuhi persyaratan'
    };
  }

  analyzeVegetationHealth() {
    const { average, healthy, stressed } = this.ndviData;
    const total = healthy + stressed;
    const healthyPercent = total > 0 ? (healthy / total) * 100 : 0;
    
    return {
      averageNDVI: average.toFixed(2),
      healthyVegetation: healthyPercent.toFixed(1) + '%',
      stressedVegetation: (100 - healthyPercent).toFixed(1) + '%',
      status: average > 0.3 ? 'HEALTHY' : average > 0.2 ? 'MODERATE' : 'STRESSED',
      recommendation: average < 0.3
        ? 'Vegetasi stress (NDVI <0.3). Perlu perbaikan irigasi atau penggantian tanaman.'
        : 'Vegetasi sehat'
    };
  }

  identifyHeatIslands() {
    const hotspots = this.thermalData.hotspots || [];
    const surfaceTemps = this.thermalData.surfaceTemperatures || [];
    
    const hotAreas = surfaceTemps.filter(s => s.temperature > 35);
    const avgTemp = surfaceTemps.length > 0 
      ? surfaceTemps.reduce((sum, s) => sum + s.temperature, 0) / surfaceTemps.length 
      : 0;

    return {
      averageSurfaceTemp: avgTemp.toFixed(1) + '°C',
      hotspotCount: hotspots.length,
      hotAreaCount: hotAreas.length,
      status: avgTemp > 35 ? 'HIGH_HEAT' : avgTemp > 30 ? 'MODERATE' : 'NORMAL',
      recommendation: avgTemp > 35
        ? 'Identifikasi urban heat island. Perlu penambahan vegetasi atau material reflektif.'
        : 'Suhu permukaan dalam batas normal'
    };
  }
}

// ============================================================
// 12. ENVIRONMENTAL DASHBOARD SUMMARY
// ============================================================

export class EnvironmentalDashboard {
  constructor(data = {}) {
    this.projectId = data.projectId || null;
    this.documents = data.documents || [];
    this.wastewater = data.wastewater || null;
    this.waste = data.waste || null;
    this.emission = data.emission || null;
    this.noise = data.noise || null;
    this.hazardousWaste = data.hazardousWaste || [];
    this.energy = data.energy || null;
    this.water = data.water || null;
    this.drainage = data.drainage || null;
    this.greenSpace = data.greenSpace || null;
  }

  calculateOverallScore() {
    const scores = [];
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

    // Calculate individual scores
    if (this.documents.length > 0) {
      const validDocs = this.documents.filter(d => d.status === 'VALID').length;
      scores.push({ category: 'Dokumen', score: (validDocs / this.documents.length) * 100, weight: weights.documents });
    }

    if (this.wastewater) {
      scores.push({ category: 'Air Limbah', score: this.wastewater.complianceStatus === 'PASS' ? 100 : 0, weight: weights.wastewater });
    }

    if (this.waste) {
      const diversion = this.waste.calculateDiversionRate();
      scores.push({ category: 'Sampah', score: parseFloat(diversion.diversionRate), weight: weights.waste });
    }

    if (this.emission) {
      scores.push({ category: 'Emisi', score: this.emission.complianceStatus === 'PASS' ? 100 : 0, weight: weights.emission });
    }

    if (this.energy) {
      const eui = this.energy.calculateEUI();
      scores.push({ category: 'Energi', score: eui.status === 'PASS' ? 100 : 60, weight: weights.energy });
    }

    if (this.water) {
      const footprint = this.water.calculateWaterFootprint();
      scores.push({ category: 'Air', score: footprint.status === 'GOOD' ? 100 : 60, weight: weights.water });
    }

    // Calculate weighted average
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / (totalWeight || 1);

    return {
      overallScore: Math.round(weightedScore),
      categoryScores: scores,
      status: weightedScore >= 80 ? 'BAIK' : weightedScore >= 60 ? 'SEDANG' : 'PERLU PERBAIKAN',
      grade: weightedScore >= 90 ? 'A' : weightedScore >= 80 ? 'B' : weightedScore >= 70 ? 'C' : weightedScore >= 60 ? 'D' : 'E'
    };
  }
}

// Export semua entities
export default {
  EnvironmentalDocument,
  WastewaterMonitoring,
  WaterMassBalance,
  WasteAudit,
  AirEmission,
  NoiseMeasurement,
  HazardousWaste,
  EnergyAudit,
  WaterAudit,
  DrainageAnalysis,
  GreenSpaceAnalysis,
  EnvironmentalDashboard
};
