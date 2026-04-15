// ============================================================
// WATER DEMAND CALCULATOR - SNI 6774:2008 & Permen 14/2017
// Perhitungan kebutuhan air berdasarkan fungsi bangunan
// ============================================================

export class WaterDemandCalculator {
  constructor() {
    this.standards = {
      hospital_inpatient: { 
        daily: 1000, unit: 'bed', peakFactor: 1.5, 
        name: 'Rumah Sakit Rawat Inap',
        description: 'Per tempat tidur per hari'
      },
      hospital_outpatient: { 
        daily: 40, unit: 'patient', peakFactor: 1.3,
        name: 'Rumah Sakit Rawat Jalan',
        description: 'Per pasien per hari'
      },
      office: { 
        daily: 100, unit: 'person', peakFactor: 1.2,
        name: 'Perkantoran',
        description: 'Per orang per hari'
      },
      public: { 
        daily: 20, unit: 'person', peakFactor: 1.5,
        name: 'Ruang Publik',
        description: 'Per orang per hari'
      },
      residential: { 
        daily: 250, unit: 'person', peakFactor: 1.3,
        name: 'Perumahan',
        description: 'Per orang per hari'
      },
      commercial: { 
        daily: 40, unit: 'person', peakFactor: 1.4,
        name: 'Pertokoan',
        description: 'Per orang per hari'
      },
      school: { 
        daily: 50, unit: 'student', peakFactor: 1.3,
        name: 'Sekolah',
        description: 'Per siswa per hari'
      },
      hotel: { 
        daily: 300, unit: 'room', peakFactor: 1.4,
        name: 'Hotel',
        description: 'Per kamar per hari'
      },
      restaurant: {
        daily: 40, unit: 'customer', peakFactor: 1.5,
        name: 'Restoran/Kafe',
        description: 'Per pelanggan per hari'
      },
      car_wash: {
        daily: 200, unit: 'unit', peakFactor: 1.2,
        name: 'Cuci Mobil',
        description: 'Per unit per hari'
      }
    };

    this.fixtureUnits = {
      toilet_private: 3,
      toilet_public: 6,
      sink_private: 1,
      sink_public: 2,
      shower: 2,
      bath_tub: 4,
      kitchen_sink: 3,
      pantry_sink: 2,
      water_heater: 1,
      hose_bib: 3,
      urinal: 4
    };
  }

  calculateDemand(buildingType, units, options = {}) {
    const std = this.standards[buildingType];
    if (!std) {
      throw new Error(`Unknown building type: ${buildingType}`);
    }

    const dailyDemand = units * std.daily; // L/day
    const averageHourly = dailyDemand / 24; // L/hour
    const peakHourFlow = averageHourly * std.peakFactor; // L/hour at peak
    const peakFlowRate = peakHourFlow / 3600; // L/s

    // Storage calculations (SNI 6774)
    const groundTankPercent = options.groundTankPercent || 0.30; // 30% default
    const roofTankPercent = options.roofTankPercent || 0.15; // 15% default
    
    const groundTankVolume = dailyDemand * groundTankPercent;
    const roofTankVolume = dailyDemand * roofTankPercent;

    // Fire demand integration
    const fireSprinklerFlow = 1500; // LPM (light hazard)
    const fireHydrantFlow = 400; // LPM
    const fireDuration = 60; // minutes
    const fireDemand = (fireSprinklerFlow + fireHydrantFlow) * fireDuration; // liters

    // Total storage including fire reserve
    const totalGroundTank = groundTankVolume + fireDemand;

    return {
      buildingType,
      buildingName: std.name,
      units,
      unitType: std.unit,
      
      // Demand calculations
      dailyDemand,
      averageHourly,
      peakHourFlow,
      peakFlowRate,
      peakFactor: std.peakFactor,
      
      // Storage requirements
      groundTankVolume,
      roofTankVolume,
      fireReserve: fireDemand,
      totalGroundTank,
      
      // Unit conversions
      dailyDemandM3: (dailyDemand / 1000).toFixed(2), // m³/day
      peakFlowRateGpm: (peakFlowRate * 15.85).toFixed(2), // GPM
      
      // Metadata
      description: std.description,
      calculationDate: new Date().toISOString()
    };
  }

  calculateFromFixtures(fixtureCounts) {
    let totalFU = 0;
    const breakdown = [];

    for (const [type, count] of Object.entries(fixtureCounts)) {
      const fu = this.fixtureUnits[type] || 0;
      const subtotal = fu * count;
      totalFU += subtotal;
      if (count > 0) {
        breakdown.push({ type, count, fu, subtotal });
      }
    }

    // Hunter's Curve - simplified
    let flowRate;
    if (totalFU < 1000) {
      flowRate = 0.14 * Math.sqrt(totalFU); // L/s
    } else {
      flowRate = 0.35 * Math.pow(totalFU, 0.54); // L/s
    }

    // Apply simultaneity factor based on total FU
    const simultaneityFactor = this.getSimultaneityFactor(totalFU);
    const adjustedFlow = flowRate * simultaneityFactor;

    return {
      totalFixtureUnits: totalFU,
      flowRate: parseFloat(flowRate.toFixed(3)),
      simultaneityFactor: parseFloat(simultaneityFactor.toFixed(2)),
      adjustedFlow: parseFloat(adjustedFlow.toFixed(3)),
      breakdown
    };
  }

  getSimultaneityFactor(totalFU) {
    // SNI simultaneity factor table
    if (totalFU <= 10) return 1.0;
    if (totalFU <= 50) return 0.9;
    if (totalFU <= 100) return 0.8;
    if (totalFU <= 500) return 0.7;
    if (totalFU <= 1000) return 0.6;
    return 0.5;
  }

  calculatePipeSize(flowRateLps, velocityMin = 0.6, velocityMax = 3.0) {
    // Q = A * v, A = π * r²
    // D = √(4Q / πv)
    const Q = flowRateLps / 1000; // m³/s
    
    // Calculate diameter for max velocity (minimum diameter)
    const Dmin = Math.sqrt((4 * Q) / (Math.PI * velocityMax)); // meters
    // Calculate diameter for min velocity (maximum diameter)
    const Dmax = Math.sqrt((4 * Q) / (Math.PI * velocityMin)); // meters

    // Standard pipe sizes (mm)
    const standardSizes = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300];
    
    // Find recommended size
    let recommended = standardSizes.find(d => d >= Dmin * 1000) || 300;
    
    return {
      flowRate: flowRateLps,
      diameterMin: (Dmin * 1000).toFixed(1), // mm
      diameterMax: (Dmax * 1000).toFixed(1), // mm
      recommended: recommended, // mm
      recommendedInch: this.mmToInch(recommended),
      velocityAtRecommended: ((Q / (Math.PI * Math.pow(recommended/2000, 2))) || 0).toFixed(2)
    };
  }

  mmToInch(mm) {
    const inches = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];
    const mmSizes = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300];
    const idx = mmSizes.indexOf(mm);
    return idx >= 0 ? `"${inches[idx]}"` : `"${(mm / 25.4).toFixed(1)}"`;
  }

  calculateHeadLoss(flowRateLps, diameterMm, lengthM, material = 'PVC') {
    const roughness = { PVC: 140, Steel: 100, CI: 110, PE: 150 }[material] || 140;
    const Q = flowRateLps / 1000; // m³/s
    const D = diameterMm / 1000; // m

    // Hazen-Williams equation
    // hL = 10.67 * L * (Q/C)^1.852 / D^4.87
    const hL = 10.67 * lengthM * Math.pow(Q / roughness, 1.852) / Math.pow(D, 4.87);
    
    // Velocity
    const A = Math.PI * Math.pow(D / 2, 2);
    const v = Q / A;

    return {
      flowRate: flowRateLps,
      diameter: diameterMm,
      length: lengthM,
      material,
      roughness,
      headLoss: parseFloat(hL.toFixed(3)),
      velocity: parseFloat(v.toFixed(2)),
      velocityOk: v >= 0.6 && v <= 3.0
    };
  }

  // Water quality index calculation
  calculateWQI(parameters) {
    // Standard WQI formula (weighted average)
    const weights = {
      ph: 0.15,
      turbidity: 0.15,
      tds: 0.15,
      chlorine: 0.20,
      ecoli: 0.20,
      lead: 0.15
    };

    const standards = {
      ph: { min: 6.5, max: 8.5, optimal: 7.0 },
      turbidity: { max: 5, optimal: 0 },
      tds: { max: 1000, optimal: 150 },
      chlorine: { min: 0.2, max: 2.0, optimal: 0.5 },
      ecoli: { max: 0, optimal: 0 },
      lead: { max: 0.01, optimal: 0 }
    };

    let totalScore = 0;
    let totalWeight = 0;
    const details = {};

    for (const [param, value] of Object.entries(parameters)) {
      const std = standards[param];
      const weight = weights[param] || 0;
      
      if (!std || weight === 0) continue;

      let score = 100;
      
      if (param === 'ph') {
        if (value < std.min || value > std.max) {
          score = 0;
        } else {
          const dist = Math.abs(value - std.optimal);
          score = Math.max(0, 100 - dist * 50);
        }
      } else if (std.max !== undefined) {
        if (value > std.max) {
          score = 0;
        } else {
          score = Math.max(0, 100 * (1 - value / (std.max * 2)));
        }
      }

      totalScore += score * weight;
      totalWeight += weight;
      details[param] = { value, score: Math.round(score), weight };
    }

    const wqi = totalWeight > 0 ? totalScore / totalWeight : 0;
    let category;
    if (wqi >= 90) category = 'Excellent';
    else if (wqi >= 70) category = 'Good';
    else if (wqi >= 50) category = 'Fair';
    else category = 'Poor';

    return {
      wqi: Math.round(wqi),
      category,
      details,
      potable: wqi >= 70
    };
  }
}

export const waterCalculator = new WaterDemandCalculator();
