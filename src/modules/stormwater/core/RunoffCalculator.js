/**
 * RunoffCalculator - SCS Curve Number & Rational Method
 * Perhitungan limpasan permukaan berdasarkan SCS CN Method dan Rational Method
 * Standar: SNI 2415:2016, USDA SCS TR-55
 */

export class RunoffCalculator {
  constructor() {
    this.curveNumbers = {
      'Roof (Metal)': 98,
      'Roof (Tile)': 95,
      'Roof (Concrete)': 98,
      'Roof (Green)': 65,
      'Concrete Pavement': 98,
      'Asphalt': 96,
      'Gravel': 76,
      'Lawn (Good)': 61,
      'Lawn (Poor)': 79,
      'Green Roof': 65,
      'Permeable Pavement': 75,
      'Rain Garden': 70,
      'Bioswale': 75,
      'Natural Grass': 74,
      'Woods (Good)': 55,
      'Woods (Poor)': 70,
      'Bare Soil': 85
    };

    this.runoffCoefficients = {
      'Commercial': 0.85,
      'Industrial': 0.85,
      'Residential (High)': 0.65,
      'Residential (Low)': 0.5,
      'Park': 0.2,
      'Roof': 0.95,
      'Pavement': 0.95,
      'Green Space': 0.3,
      'Forest': 0.15
    };
  }

  /**
   * Calculate SCS Curve Number runoff
   * @param {Object} catchment - Catchment data { area, curveNumber, landUse }
   * @param {number} rainfall - Rainfall depth in mm
   * @returns {Object} Runoff results
   */
  calculateSCSRunoff(catchment, rainfall) {
    const CN = catchment.curveNumber || this.getCNForLandUse(catchment.landUse) || 80;
    const S = (25400 / CN) - 254; // Potential maximum retention (mm)
    const Ia = 0.2 * S; // Initial abstraction (mm)

    const P = rainfall; // Rainfall depth (mm)
    let runoff = 0;

    if (P > Ia) {
      runoff = Math.pow(P - Ia, 2) / (P - Ia + S);
    }

    const area = catchment.area || 100; // m2

    return {
      runoffDepth: runoff, // mm
      runoffVolume: (runoff * area) / 1000, // m3
      infiltration: P - runoff, // mm
      initialAbstraction: Ia,
      curveNumber: CN,
      potentialRetention: S,
      percentRunoff: (runoff / P) * 100
    };
  }

  /**
   * Calculate runoff using Rational Method
   * Q = CiA
   * @param {Object} catchment - Catchment data
   * @param {number} intensity - Rainfall intensity (mm/hr)
   * @param {number} timeOfConcentration - Time of concentration (minutes)
   * @returns {Object} Peak flow results
   */
  calculateRationalMethod(catchment, intensity, timeOfConcentration) {
    const C = this.getRunoffCoefficient(catchment.landUse) || 0.5;
    const A = (catchment.area || 100) / 10000; // convert m2 to ha
    const Q = C * intensity * A; // m3/hr

    return {
      peakFlow: Q / 3600, // m3/s
      runoffCoefficient: C,
      intensity: intensity,
      area: catchment.area,
      areaHa: A,
      timeOfConcentration: timeOfConcentration,
      formula: 'Q = CiA'
    };
  }

  /**
   * Get Curve Number for land use type
   */
  getCNForLandUse(landUse) {
    const cnMap = {
      'roof': 98,
      'pavement': 98,
      'asphalt': 96,
      'concrete': 98,
      'grass': 74,
      'lawn': 74,
      'green': 65,
      'permeable': 75,
      'garden': 70,
      'woods': 60,
      'bare': 85
    };
    return cnMap[landUse?.toLowerCase()] || 80;
  }

  /**
   * Get runoff coefficient
   */
  getRunoffCoefficient(landUse) {
    return this.runoffCoefficients[landUse] || 0.5;
  }

  /**
   * Calculate Time of Concentration using Kirpich equation
   * Tc = 0.0195 * L^0.77 * S^-0.385
   * @param {Object} catchment - Catchment data { flowLength, slope }
   * @returns {number} Time of concentration in minutes
   */
  calculateTimeOfConcentration(catchment) {
    const L = catchment.flowLength || 100; // m (flow length)
    const S = catchment.slope || 0.01; // m/m (slope)

    // Kirpich equation for developed areas
    const Tc = 0.0195 * Math.pow(L, 0.77) * Math.pow(S, -0.385);

    return Tc; // minutes
  }

  /**
   * Calculate Time of Concentration using SCS Lag Method
   */
  calculateSCSLag(catchment) {
    const L = catchment.flowLength || 100; // m
    const CN = catchment.curveNumber || 80;
    const S = (25400 / CN) - 254; // mm

    // SCS lag equation (hours)
    const lag = Math.pow(L, 0.8) * Math.pow((1000 / CN - 9), 0.7) / (1900 * Math.pow(S / 1000, 0.5));

    return lag * 60; // convert to minutes
  }

  /**
   * Generate runoff hydrograph using Unit Hydrograph method
   * @param {Object} catchment - Catchment data
   * @param {Object} hyetograph - Rainfall hyetograph
   * @param {string} method - Method: 'SCS' or 'Rational'
   * @returns {Array} Hydrograph data
   */
  generateHydrograph(catchment, hyetograph, method = 'SCS') {
    const hydrograph = [];
    const Tc = this.calculateTimeOfConcentration(catchment);
    const area = catchment.area || 100; // m2

    if (method === 'SCS') {
      // SCS Dimensionless Unit Hydrograph
      const tp = 0.6 * Tc; // time to peak (minutes)
      const Qp = (0.208 * area) / (tp / 60); // peak flow per mm of runoff (m3/s/mm)

      const effectiveRain = [];

      // Calculate effective rainfall (runoff) for each time step
      let cumulativeRain = 0;
      hyetograph.data.forEach((step) => {
        cumulativeRain += step.depth;
        const runoffResult = this.calculateSCSRunoff(catchment, cumulativeRain);
        effectiveRain.push(runoffResult.runoffDepth);
      });

      // Convolution with unit hydrograph
      hyetograph.data.forEach((step, t) => {
        let flow = 0;
        for (let tau = 0; tau <= t; tau++) {
          const rain = effectiveRain[tau] - (tau > 0 ? effectiveRain[tau - 1] : 0);
          const tSinceRain = (t - tau) * hyetograph.timestep;
          const u = this.getUnitHydrographOrdinate(tSinceRain, tp, Qp);
          flow += rain * u;
        }
        hydrograph.push({
          time: step.time,
          flow: flow,
          rainfall: step.intensity,
          cumulativeRain: step.cumulative,
          effectiveRain: effectiveRain[t]
        });
      });
    } else if (method === 'Rational') {
      // Simplified triangular hydrograph for Rational Method
      const tc = Tc;
      const peakTime = tc;
      const baseTime = 2.67 * tc;
      const rationalResult = this.calculateRationalMethod(
        catchment,
        Math.max(...hyetograph.data.map(d => d.intensity)),
        tc
      );
      const peakFlow = rationalResult.peakFlow;

      const maxTime = Math.max(...hyetograph.data.map(d => d.time)) + baseTime;
      const timestep = hyetograph.timestep;

      for (let t = 0; t <= maxTime; t += timestep) {
        let flow = 0;
        if (t <= peakTime) {
          flow = peakFlow * (t / peakTime);
        } else if (t <= baseTime) {
          flow = peakFlow * (baseTime - t) / (baseTime - peakTime);
        }
        hydrograph.push({
          time: t,
          flow: flow,
          rainfall: 0,
          cumulativeRain: 0
        });
      }
    }

    return hydrograph;
  }

  /**
   * Get SCS triangular unit hydrograph ordinate
   */
  getUnitHydrographOrdinate(t, tp, Qp) {
    // SCS triangular unit hydrograph
    if (t <= 0) return 0;
    if (t <= tp) return Qp * (t / tp);
    if (t <= 2.67 * tp) return Qp * (2.67 - (t / tp)) / 1.67;
    return 0;
  }

  /**
   * Calculate composite CN for multiple subcatchments
   */
  calculateCompositeCN(catchments) {
    let totalArea = 0;
    let weightedCN = 0;

    catchments.forEach(c => {
      const area = c.area || 0;
      const cn = c.curveNumber || this.getCNForLandUse(c.landUse) || 80;
      totalArea += area;
      weightedCN += area * cn;
    });

    return totalArea > 0 ? weightedCN / totalArea : 80;
  }

  /**
   * Calculate total runoff volume for multiple catchments
   */
  calculateTotalRunoff(catchments, rainfall) {
    let totalVolume = 0;
    let totalArea = 0;

    catchments.forEach(c => {
      const result = this.calculateSCSRunoff(c, rainfall);
      totalVolume += result.runoffVolume;
      totalArea += c.area || 0;
    });

    return {
      totalVolume,
      totalArea,
      averageDepth: totalArea > 0 ? (totalVolume * 1000 / totalArea) : 0
    };
  }
}

export default RunoffCalculator;
