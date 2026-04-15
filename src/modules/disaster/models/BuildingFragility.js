/**
 * BUILDING FRAGILITY MODEL
 * Model untuk kurva kerentanan bangunan
 */

export class BuildingFragility {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.buildingType = data.buildingType || 'c1';
    this.buildingName = data.buildingName || '';
    
    // Fragility curve parameters
    this.fragilityCurves = data.fragilityCurves || this.getDefaultFragility(this.buildingType);
    
    // Building characteristics
    this.characteristics = {
      yearBuilt: data.yearBuilt || 2020,
      stories: data.stories || 1,
      totalArea: data.totalArea || 100,
      replacementCost: data.replacementCost || 3500000, // per m²
      occupancy: data.occupancy || 'residential',
      ...data.characteristics
    };
    
    // Seismic parameters
    this.seismicParams = {
      fundamentalPeriod: data.fundamentalPeriod || 0.5,
      seismicCoefficient: data.seismicCoefficient || 0.3,
      ductilityFactor: data.ductilityFactor || 3.0,
      ...data.seismicParams
    };
  }

  /**
   * Get default fragility curves berdasarkan building type
   */
  getDefaultFragility(type) {
    const defaults = {
      // Concrete Moment Frame
      c1: {
        slight: { median: 0.10, beta: 0.40 },
        moderate: { median: 0.20, beta: 0.40 },
        extensive: { median: 0.40, beta: 0.40 },
        complete: { median: 0.70, beta: 0.40 }
      },
      // Concrete Shear Wall
      c2: {
        slight: { median: 0.08, beta: 0.35 },
        moderate: { median: 0.18, beta: 0.35 },
        extensive: { median: 0.35, beta: 0.35 },
        complete: { median: 0.60, beta: 0.35 }
      },
      // Steel Moment Frame
      s1: {
        slight: { median: 0.09, beta: 0.45 },
        moderate: { median: 0.19, beta: 0.45 },
        extensive: { median: 0.38, beta: 0.45 },
        complete: { median: 0.65, beta: 0.45 }
      },
      // Reinforced Masonry
      rm1: {
        slight: { median: 0.12, beta: 0.50 },
        moderate: { median: 0.25, beta: 0.50 },
        extensive: { median: 0.50, beta: 0.50 },
        complete: { median: 0.80, beta: 0.50 }
      },
      // Wood Light Frame
      w1: {
        slight: { median: 0.18, beta: 0.60 },
        moderate: { median: 0.35, beta: 0.60 },
        extensive: { median: 0.60, beta: 0.60 },
        complete: { median: 0.90, beta: 0.60 }
      },
      // Unreinforced Masonry
      urm: {
        slight: { median: 0.07, beta: 0.55 },
        moderate: { median: 0.15, beta: 0.55 },
        extensive: { median: 0.30, beta: 0.55 },
        complete: { median: 0.60, beta: 0.55 }
      }
    };
    
    return defaults[type] || defaults.c1;
  }

  /**
   * Calculate probability of damage state
   */
  calculateDamageProbability(intensity) {
    const curves = this.fragilityCurves;
    
    const probComplete = this.logNormalCDF(intensity, curves.complete.median, curves.complete.beta);
    const probExtensive = this.logNormalCDF(intensity, curves.extensive.median, curves.extensive.beta);
    const probModerate = this.logNormalCDF(intensity, curves.moderate.median, curves.moderate.beta);
    const probSlight = this.logNormalCDF(intensity, curves.slight.median, curves.slight.beta);

    return {
      none: Math.max(0, 1 - probSlight),
      slight: Math.max(0, probSlight - probModerate),
      moderate: Math.max(0, probModerate - probExtensive),
      extensive: Math.max(0, probExtensive - probComplete),
      complete: probComplete
    };
  }

  /**
   * Log-normal CDF
   */
  logNormalCDF(x, median, beta) {
    if (x <= 0) return 0;
    const lnX = Math.log(x);
    const lnMedian = Math.log(median);
    const z = (lnX - lnMedian) / beta;
    return this.standardNormalCDF(z);
  }

  /**
   * Standard normal CDF
   */
  standardNormalCDF(z) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Calculate mean damage ratio
   */
  calculateMeanDamageRatio(intensity) {
    const weights = { none: 0, slight: 0.05, moderate: 0.25, extensive: 0.60, complete: 1.0 };
    const probabilities = this.calculateDamageProbability(intensity);
    
    return Object.keys(probabilities).reduce((sum, state) => {
      return sum + probabilities[state] * weights[state];
    }, 0);
  }

  /**
   * Get total replacement cost
   */
  getTotalReplacementCost() {
    return this.characteristics.totalArea * this.characteristics.replacementCost;
  }

  /**
   * Serialize
   */
  toJSON() {
    return {
      id: this.id,
      buildingType: this.buildingType,
      buildingName: this.buildingName,
      fragilityCurves: this.fragilityCurves,
      characteristics: this.characteristics,
      seismicParams: this.seismicParams
    };
  }
}

export default BuildingFragility;
