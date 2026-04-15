/**
 * WaterQualityModel - Buildup-Washoff Pollutants Simulation
 * Model kualitas air untuk simulasi polutan dalam sistem drainase
 * Standar: EPA SWMM, SNI 2415:2016
 */

export class WaterQualityModel {
  constructor() {
    this.pollutants = {
      'TSS': { // Total Suspended Solids
        buildupRate: 10,      // kg/ha/day
        buildupMax: 100,      // kg/ha
        washoffCoeff: 0.1,   // 1/mm
        removalEfficiency: 0.85
      },
      'TP': { // Total Phosphorus
        buildupRate: 0.2,
        buildupMax: 2,
        washoffCoeff: 0.08,
        removalEfficiency: 0.65
      },
      'TN': { // Total Nitrogen
        buildupRate: 1.5,
        buildupMax: 15,
        washoffCoeff: 0.06,
        removalEfficiency: 0.45
      },
      'COD': { // Chemical Oxygen Demand
        buildupRate: 5,
        buildupMax: 50,
        washoffCoeff: 0.1,
        removalEfficiency: 0.70
      },
      'BOD': { // Biological Oxygen Demand
        buildupRate: 3,
        buildupMax: 30,
        washoffCoeff: 0.09,
        removalEfficiency: 0.70
      },
      'Lead': {
        buildupRate: 0.01,
        buildupMax: 0.1,
        washoffCoeff: 0.12,
        removalEfficiency: 0.90
      },
      'Zinc': {
        buildupRate: 0.05,
        buildupMax: 0.5,
        washoffCoeff: 0.11,
        removalEfficiency: 0.85
      },
      'Oil': {
        buildupRate: 0.8,
        buildupMax: 8,
        washoffCoeff: 0.15,
        removalEfficiency: 0.80
      }
    };

    this.dryDays = 5; // Antecedent dry days
  }

  /**
   * Calculate pollutant buildup over dry days
   * @param {string} pollutant - Pollutant name
   * @param {number} area - Catchment area in ha
   * @param {number} dryDays - Number of dry days
   * @returns {number} Buildup in kg
   */
  calculateBuildup(pollutant, area, dryDays = this.dryDays) {
    const params = this.pollutants[pollutant];
    if (!params) return 0;

    // Saturation buildup: B = Bmax * (1 - exp(-k*t))
    const k = params.buildupRate / params.buildupMax;
    const buildup = params.buildupMax * (1 - Math.exp(-k * dryDays));

    return buildup * area; // kg
  }

  /**
   * Calculate washoff during rainfall
   * @param {string} pollutant - Pollutant name
   * @param {number} buildup - Current buildup in kg
   * @param {number} runoff - Runoff volume in mm over catchment
   * @returns {number} Washoff in kg
   */
  calculateWashoff(pollutant, buildup, runoff) {
    const params = this.pollutants[pollutant];
    if (!params) return 0;

    // Exponential washoff: W = B * (1 - exp(-C*R))
    const washoff = buildup * (1 - Math.exp(-params.washoffCoeff * runoff));

    return washoff;
  }

  /**
   * Simulate water quality for a storm event
   * @param {Object} catchment - Catchment data
   * @param {Object} hyetograph - Rainfall hyetograph
   * @param {Object} runoffHydrograph - Runoff hydrograph
   * @returns {Object} Water quality results
   */
  simulateEvent(catchment, hyetograph, runoffHydrograph) {
    const area = (catchment.area || 10000) / 10000; // Convert to hectares
    const results = {};

    Object.keys(this.pollutants).forEach(pollutant => {
      // Initial buildup
      let buildup = this.calculateBuildup(pollutant, area, this.dryDays);
      const eventResults = [];
      let totalWashoff = 0;
      let peakConc = 0;

      // Step through hydrograph
      for (let i = 0; i < runoffHydrograph.length; i++) {
        const step = runoffHydrograph[i];
        const rainfall = hyetograph.data[i]?.depth || 0;

        // Calculate washoff for this step
        const washoff = this.calculateWashoff(pollutant, buildup, step.effectiveRain || rainfall);
        totalWashoff += washoff;
        buildup -= washoff;

        // Concentration (mg/L)
        const volume = step.flow * 300; // m3 (assuming 5-min timestep)
        const concentration = volume > 0 ? (washoff * 1000000) / (volume * 1000) : 0;

        if (concentration > peakConc) peakConc = concentration;

        eventResults.push({
          time: step.time,
          buildup,
          washoff,
          concentration,
          flow: step.flow
        });
      }

      results[pollutant] = {
        hydrograph: eventResults,
        totalWashoff,
        peakConcentration: peakConc,
        remainingBuildup: buildup,
        averageConcentration: eventResults.reduce((a, b) => a + b.concentration, 0) / eventResults.length,
        emc: this.calculateEMC(eventResults) // Event Mean Concentration
      };
    });

    return {
      pollutants: results,
      summary: this.calculateSummary(results)
    };
  }

  /**
   * Calculate Event Mean Concentration (EMC)
   */
  calculateEMC(hydrograph) {
    let totalLoad = 0;
    let totalVolume = 0;

    hydrograph.forEach(step => {
      const volume = step.flow * 300; // m3 (5-min timestep)
      totalLoad += step.concentration * volume;
      totalVolume += volume;
    });

    return totalVolume > 0 ? totalLoad / totalVolume : 0;
  }

  /**
   * Calculate water quality summary
   */
  calculateSummary(results) {
    const summary = {
      totalLoads: {},
      peakConcentrations: {},
      emc: {}
    };

    Object.keys(results).forEach(pollutant => {
      summary.totalLoads[pollutant] = results[pollutant].totalWashoff;
      summary.peakConcentrations[pollutant] = results[pollutant].peakConcentration;
      summary.emc[pollutant] = results[pollutant].emc;
    });

    return summary;
  }

  /**
   * Apply LID treatment to water quality
   * @param {Object} waterQualityResults - Results from simulateEvent
   * @param {string} lidType - Type of LID
   * @returns {Object} Treated water quality
   */
  applyLIDTreatment(waterQualityResults, lidType) {
    const removalRates = {
      'Rain Barrel': { TSS: 0.05, TP: 0.05, TN: 0.05, COD: 0.05, BOD: 0.05, Lead: 0.10, Zinc: 0.10, Oil: 0.15 },
      'Green Roof': { TSS: 0.90, TP: 0.70, TN: 0.50, COD: 0.75, BOD: 0.70, Lead: 0.95, Zinc: 0.90, Oil: 0.85 },
      'Permeable Pavement': { TSS: 0.85, TP: 0.60, TN: 0.40, COD: 0.70, BOD: 0.65, Lead: 0.85, Zinc: 0.80, Oil: 0.75 },
      'Rain Garden': { TSS: 0.90, TP: 0.75, TN: 0.55, COD: 0.80, BOD: 0.75, Lead: 0.95, Zinc: 0.90, Oil: 0.85 },
      'Bioswale': { TSS: 0.85, TP: 0.70, TN: 0.50, COD: 0.75, BOD: 0.70, Lead: 0.90, Zinc: 0.85, Oil: 0.80 },
      'Detention Pond': { TSS: 0.80, TP: 0.60, TN: 0.40, COD: 0.65, BOD: 0.60, Lead: 0.75, Zinc: 0.70, Oil: 0.65 },
      'Infiltration Trench': { TSS: 0.95, TP: 0.80, TN: 0.60, COD: 0.85, BOD: 0.80, Lead: 0.98, Zinc: 0.95, Oil: 0.90 },
      'Constructed Wetland': { TSS: 0.90, TP: 0.85, TN: 0.75, COD: 0.85, BOD: 0.80, Lead: 0.90, Zinc: 0.90, Oil: 0.85 }
    };

    const removals = removalRates[lidType] || removalRates['Rain Garden'];
    const treated = { ...waterQualityResults };

    Object.keys(treated.pollutants).forEach(pollutant => {
      const removal = removals[pollutant] || 0.5;
      const p = treated.pollutants[pollutant];

      p.treatedLoad = p.totalWashoff * (1 - removal);
      p.treatedEMC = p.emc * (1 - removal);
      p.removalEfficiency = removal;
      p.lidType = lidType;
    });

    return treated;
  }

  /**
   * Check compliance with water quality standards
   * @param {Object} results - Water quality results
   * @param {string} standard - Standard to check against
   * @returns {Object} Compliance status
   */
  checkCompliance(results, standard = 'PP82_2001') {
    const standards = {
      'PP82_2001': { // PP No. 82 Tahun 2001 (Baku Mutu Air)
        TSS: 50,
        BOD: 20,
        COD: 100,
        TP: 2,
        TN: 20,
        Lead: 0.1,
        Zinc: 2.0,
        Oil: 3.0
      },
      'KLH': { // Kementerian LH
        TSS: 30,
        BOD: 15,
        COD: 80,
        TP: 1.5,
        TN: 15
      }
    };

    const std = standards[standard] || standards['PP82_2001'];
    const compliance = {};

    Object.keys(results.pollutants).forEach(pollutant => {
      const emc = results.pollutants[pollutant].emc;
      const limit = std[pollutant];

      if (limit) {
        compliance[pollutant] = {
          emc,
          limit,
          status: emc <= limit ? 'COMPLIANT' : 'NON_COMPLIANT',
          ratio: emc / limit
        };
      }
    });

    return {
      standard,
      pollutants: compliance,
      overallStatus: Object.values(compliance).every(c => c.status === 'COMPLIANT') ? 'COMPLIANT' : 'NON_COMPLIANT'
    };
  }

  /**
   * Set antecedent dry days
   */
  setDryDays(days) {
    this.dryDays = days;
  }

  /**
   * Get available pollutants
   */
  getPollutants() {
    return Object.keys(this.pollutants);
  }

  /**
   * Get pollutant parameters
   */
  getPollutantParameters(pollutant) {
    return this.pollutants[pollutant] || null;
  }

  /**
   * Calculate annual load
   * @param {string} pollutant - Pollutant name
   * @param {number} area - Area in ha
   * @param {number} annualRainfall - Annual rainfall in mm
   * @returns {number} Annual load in kg
   */
  calculateAnnualLoad(pollutant, area, annualRainfall) {
    const params = this.pollutants[pollutant];
    if (!params) return 0;

    // Simplified annual load estimate
    const events = 100; // Assume 100 runoff events per year
    const avgBuildup = this.calculateBuildup(pollutant, area, 3); // 3-day avg dry period
    const avgRunoff = annualRainfall * 0.6 / events; // 60% runoff coefficient
    const avgWashoff = this.calculateWashoff(pollutant, avgBuildup, avgRunoff);

    return avgWashoff * events;
  }
}

export default WaterQualityModel;
