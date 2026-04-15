/**
 * LIDController - Low Impact Development Controls
 * Simulasi sistem LID untuk pengelolaan air hujan berkelanjutan
 * Include: Rain Barrels, Green Roofs, Permeable Pavement, Rain Gardens, Bioswales, Detention Ponds
 * Standar: SNI 6398:2011 (Sumur Resapan), EPA SWMM LID Controls
 */

export class LIDController {
  constructor() {
    this.lidTypes = {
      'Rain Barrel': {
        storage: 0.2,      // m3 per unit
        drainage: 0.001, // m3/s drain rate
        evap: 0,
        infiltration: 0,
        surfaceArea: 0.1   // m2 per unit
      },
      'Green Roof': {
        storage: 0.05,     // m3/m2 (50mm growing medium)
        drainage: 0.0001,  // m/s
        evap: 0.8,        // high evapotranspiration
        infiltration: 0,
        surfaceArea: 1.0
      },
      'Permeable Pavement': {
        storage: 0.025,   // m3/m2 (25mm void space)
        drainage: 0.0003, // m/s infiltration to subbase
        evap: 0.3,
        infiltration: 0.0001,
        surfaceArea: 1.0
      },
      'Rain Garden': {
        storage: 0.15,    // m3/m2 (150mm ponding + soil)
        drainage: 0.0002, // m/s infiltration rate
        evap: 0.5,
        infiltration: 0.0002,
        surfaceArea: 1.0
      },
      'Bioswale': {
        storage: 0.1,     // m3/m2
        drainage: 0.0004, // m/s
        evap: 0.4,
        infiltration: 0.0003,
        surfaceArea: 1.0
      },
      'Detention Pond': {
        storage: 1.0,     // m3/m2 (1m depth)
        drainage: 0.00005, // slow release
        evap: 0.2,
        infiltration: 0.00001,
        surfaceArea: 1.0
      },
      'Infiltration Trench': {
        storage: 0.2,     // m3/m2
        drainage: 0.0005, // high infiltration
        evap: 0.1,
        infiltration: 0.0005,
        surfaceArea: 1.0
      },
      'Constructed Wetland': {
        storage: 0.5,     // m3/m2
        drainage: 0.0001,
        evap: 0.6,
        infiltration: 0.00005,
        surfaceArea: 1.0
      }
    };

    this.timeStep = 300; // 5 minutes default
  }

  /**
   * Simulate LID performance
   * @param {Array} inflowHydrograph - Inflow hydrograph
   * @param {string} lidType - Type of LID
   * @param {number} area - Surface area in m2
   * @param {Object} options - Additional options
   * @returns {Object} Simulation results
   */
  simulateLID(inflowHydrograph, lidType, area, options = {}) {
    const params = this.lidTypes[lidType];
    if (!params) {
      throw new Error(`Unknown LID type: ${lidType}`);
    }

    const storageVolume = params.storage * area; // m3
    const maxDrainage = params.drainage * area; // m3/s
    const maxInfiltration = (params.infiltration || 0) * area; // m3/s
    const evapRate = params.evap * 0.001 * area / 3600; // m3/s (assume 1mm/hr potential)

    const results = [];
    let currentStorage = options.initialStorage || 0;
    let totalEvap = 0;
    let totalInfiltrate = 0;
    let totalOutflow = 0;
    let totalInflow = 0;
    let overflowEvents = 0;

    inflowHydrograph.forEach((step, i) => {
      const inflow = step.flow * this.timeStep; // m3 per timestep
      totalInflow += inflow;

      const availableStorage = storageVolume - currentStorage;
      const stored = Math.min(inflow, availableStorage);
      const excess = inflow - stored;

      currentStorage += stored;

      // Drainage/infiltration (proportional to storage)
      const drainageRate = Math.min(
        currentStorage / this.timeStep,
        maxDrainage + maxInfiltration
      );
      const drainage = drainageRate * this.timeStep;
      currentStorage -= drainage;
      totalInfiltrate += Math.min(drainage, maxInfiltration * this.timeStep);

      // Evaporation
      const evap = Math.min(currentStorage, evapRate * this.timeStep);
      currentStorage -= evap;
      totalEvap += evap;

      // Outflow = excess + any overflow from full storage
      const overflow = excess > 0 ? excess : 0;
      if (overflow > 0) overflowEvents++;

      const controlledOutflow = Math.min(
        maxDrainage * this.timeStep,
        currentStorage
      );
      currentStorage -= controlledOutflow;
      totalOutflow += controlledOutflow + overflow;

      results.push({
        time: step.time,
        inflow: step.flow,
        outflow: (controlledOutflow + overflow) / this.timeStep, // m3/s
        storage: currentStorage,
        captured: stored,
        infiltrated: Math.min(drainage, maxInfiltration * this.timeStep),
        evaporated: evap,
        overflow: overflow
      });
    });

    // Calculate summary metrics
    const peakInflow = Math.max(...inflowHydrograph.map(s => s.flow));
    const peakOutflow = Math.max(...results.map(s => s.outflow));

    return {
      hydrograph: results,
      summary: {
        totalInflow,
        totalOutflow,
        totalCaptured: totalInflow - totalOutflow,
        totalInfiltrated: totalInfiltrate,
        totalEvaporated: totalEvap,
        peakInflow,
        peakOutflow,
        peakReduction: peakInflow > 0 ? (peakInflow - peakOutflow) / peakInflow : 0,
        volumeReduction: totalInflow > 0 ? (totalInflow - totalOutflow) / totalInflow : 0,
        overflowEvents,
        utilizationRate: (totalInfiltrate + totalEvap) / (storageVolume * results.length) * this.timeStep,
        performance: this.assessPerformance(totalInflow, totalOutflow, peakInflow, peakOutflow)
      },
      lidType,
      area,
      storageVolume
    };
  }

  /**
   * Simulate multiple LID systems in series/parallel
   * @param {Array} lidConfigs - Array of { type, area, position: 'series'|'parallel' }
   * @param {Array} inflowHydrograph - Inflow hydrograph
   * @returns {Object} Combined results
   */
  simulateLIDTrain(lidConfigs, inflowHydrograph) {
    let currentFlow = inflowHydrograph;
    const allResults = [];

    lidConfigs.forEach((config, idx) => {
      if (config.position === 'parallel') {
        // Parallel: split flow proportionally
        const splitRatio = config.flowSplit || 0.5;
        const splitFlow = currentFlow.map(s => ({
          ...s,
          flow: s.flow * splitRatio
        }));

        const result = this.simulateLID(splitFlow, config.type, config.area, config.options);
        allResults.push({ ...result, position: 'parallel', index: idx });

        // Remaining flow continues
        currentFlow = currentFlow.map((s, i) => ({
          ...s,
          flow: s.flow * (1 - splitRatio)
        }));
      } else {
        // Series: full flow goes through
        const result = this.simulateLID(currentFlow, config.type, config.area, config.options);
        allResults.push({ ...result, position: 'series', index: idx });

        // Outflow becomes inflow for next LID
        currentFlow = result.hydrograph.map(h => ({
          time: h.time,
          flow: h.outflow
        }));
      }
    });

    // Calculate combined performance
    const firstResult = allResults[0];
    const lastResult = allResults[allResults.length - 1];

    return {
      stages: allResults,
      combined: {
        totalInflow: firstResult.summary.totalInflow,
        totalOutflow: lastResult.summary.totalOutflow,
        peakInflow: firstResult.summary.peakInflow,
        peakOutflow: lastResult.summary.peakOutflow,
        peakReduction: firstResult.summary.peakInflow > 0 ?
          (firstResult.summary.peakInflow - lastResult.summary.peakOutflow) / firstResult.summary.peakInflow : 0,
        volumeReduction: firstResult.summary.totalInflow > 0 ?
          (firstResult.summary.totalInflow - lastResult.summary.totalOutflow) / firstResult.summary.totalInflow : 0
      }
    };
  }

  /**
   * Size LID system for target performance
   * @param {string} lidType - Type of LID
   * @param {Array} inflowHydrograph - Inflow hydrograph
   * @param {number} targetReduction - Target volume reduction (0-1)
   * @returns {Object} Recommended sizing
   */
  sizeLIDSystem(lidType, inflowHydrograph, targetReduction = 0.3) {
    const totalInflow = inflowHydrograph.reduce((a, s) => a + s.flow, 0) * this.timeStep;
    const targetCapture = totalInflow * targetReduction;

    const params = this.lidTypes[lidType];
    const runoffVolume = totalInflow * targetReduction;

    // Required storage volume
    const requiredStorage = runoffVolume / 0.8; // 80% utilization

    // Required surface area
    const requiredArea = requiredStorage / params.storage;

    // For detention: calculate required orifice size for target drain time
    const drainTime = 24; // hours
    const requiredDrainage = requiredStorage / (drainTime * 3600);

    return {
      lidType,
      targetReduction,
      requiredArea,
      requiredStorage,
      requiredDrainage,
      estimatedCost: this.estimateCost(lidType, requiredArea),
      performance: {
        expectedCapture: runoffVolume,
        expectedReduction: targetReduction,
        drainTime
      }
    };
  }

  /**
   * Estimate LID cost (simplified)
   */
  estimateCost(lidType, area) {
    const costs = {
      'Rain Barrel': 150, // USD per m2 equivalent
      'Green Roof': 150,
      'Permeable Pavement': 50,
      'Rain Garden': 30,
      'Bioswale': 25,
      'Detention Pond': 20,
      'Infiltration Trench': 35,
      'Constructed Wetland': 40
    };

    const unitCost = costs[lidType] || 50;
    return {
      unitCost,
      totalCost: unitCost * area,
      perArea: unitCost,
      currency: 'USD'
    };
  }

  /**
   * Assess LID performance
   */
  assessPerformance(totalInflow, totalOutflow, peakInflow, peakOutflow) {
    const volumeReduction = totalInflow > 0 ? (totalInflow - totalOutflow) / totalInflow : 0;
    const peakReduction = peakInflow > 0 ? (peakInflow - peakOutflow) / peakInflow : 0;

    if (volumeReduction >= 0.5 && peakReduction >= 0.4) return 'EXCELLENT';
    if (volumeReduction >= 0.3 && peakReduction >= 0.2) return 'GOOD';
    if (volumeReduction >= 0.2 && peakReduction >= 0.1) return 'FAIR';
    return 'POOR';
  }

  /**
   * Get available LID types
   */
  getLIDTypes() {
    return Object.keys(this.lidTypes);
  }

  /**
   * Get LID parameters
   */
  getLIDParameters(lidType) {
    return this.lidTypes[lidType] || null;
  }

  /**
   * Set time step for simulation
   */
  setTimeStep(seconds) {
    this.timeStep = seconds;
  }

  /**
   * Calculate Water Quality Capture Volume (WQCV)
   * Based on EPA recommendations: 0.5-1.0 inch of runoff over impervious area
   */
  calculateWQCV(imperviousArea, rainfallDepth = 25) { // 25mm = ~1 inch
    return {
      wqcv: imperviousArea * rainfallDepth / 1000, // m3
      recommendedLID: imperviousArea < 500 ? 'Rain Garden' :
        imperviousArea < 2000 ? 'Bioswale' : 'Detention Pond',
      treatmentPerformance: {
        TSS: 0.85, // 85% removal
        TP: 0.65,  // Total Phosphorus
        TN: 0.45,  // Total Nitrogen
        BOD: 0.70,
        metals: 0.80
      }
    };
  }
}

export default LIDController;
