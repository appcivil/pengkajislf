/**
 * RainfallEngine - Design Storm Generator (IDF Curves)
 * Generator untuk design storm berdasarkan Intensity-Duration-Frequency curves
 * Standar: SNI 2415:2016, SCS Hydrology
 */

export class RainfallEngine {
  constructor() {
    this.idfCurves = new Map(); // Intensity-Duration-Frequency
    this.stormTypes = ['SCS Type IA', 'SCS Type I', 'SCS Type II', 'SCS Type III', 'Block', 'Alternating', 'Chicago'];
    this.initializeDefaultIDF();
  }

  /**
   * Initialize Default IDF Curves untuk kota-kota besar Indonesia
   * Formula: I = a/(t+b)^c [mm/hour]
   */
  initializeDefaultIDF() {
    // Jakarta (Dinas PU DKI Jakarta)
    this.idfCurves.set('Jakarta', {
      a: 2990.5,
      b: 18.67,
      c: 0.86,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'DKI Jakarta'
    });

    // Bandung (Dinas PU Jawa Barat)
    this.idfCurves.set('Bandung', {
      a: 2450.3,
      b: 16.2,
      c: 0.82,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'Jawa Barat'
    });

    // Surabaya (Dinas PU Jawa Timur)
    this.idfCurves.set('Surabaya', {
      a: 2800.7,
      b: 17.8,
      c: 0.84,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'Jawa Timur'
    });

    // Medan (Sumatera Utara)
    this.idfCurves.set('Medan', {
      a: 3100.2,
      b: 19.5,
      c: 0.88,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'Sumatera Utara'
    });

    // Makassar (Sulawesi Selatan)
    this.idfCurves.set('Makassar', {
      a: 2650.4,
      b: 18.1,
      c: 0.83,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'Sulawesi Selatan'
    });

    // Semarang (Jawa Tengah)
    this.idfCurves.set('Semarang', {
      a: 2750.6,
      b: 17.5,
      c: 0.85,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'Jawa Tengah'
    });

    // Yogyakarta
    this.idfCurves.set('Yogyakarta', {
      a: 2700.8,
      b: 16.9,
      c: 0.84,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'DI Yogyakarta'
    });

    // Palembang
    this.idfCurves.set('Palembang', {
      a: 2900.3,
      b: 19.2,
      c: 0.87,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'Sumatera Selatan'
    });

    // Denpasar (Bali)
    this.idfCurves.set('Denpasar', {
      a: 2400.5,
      b: 15.8,
      c: 0.81,
      returnPeriods: [2, 5, 10, 25, 50, 100],
      region: 'Bali'
    });
  }

  /**
   * Add custom IDF curve
   */
  addIDFCurve(city, params) {
    this.idfCurves.set(city, {
      ...params,
      returnPeriods: params.returnPeriods || [2, 5, 10, 25, 50, 100]
    });
  }

  /**
   * Calculate rainfall intensity using IDF formula
   * @param {number} duration - Duration in minutes
   * @param {number} returnPeriod - Return period in years
   * @param {string} city - City name
   * @returns {number} Intensity in mm/hour
   */
  calculateIntensity(duration, returnPeriod, city = 'Jakarta') {
    const params = this.idfCurves.get(city);
    if (!params) {
      // Fallback to Jakarta if city not found
      console.warn(`IDF parameters not found for ${city}, using Jakarta`);
      return this.calculateIntensity(duration, returnPeriod, 'Jakarta');
    }

    // Adjust 'a' for return period using Gumbel distribution factor
    const kt = this.getGumbelFactor(returnPeriod);
    const aAdjusted = params.a * (1 + kt * 0.15); // simplified Gumbel adjustment

    return aAdjusted / Math.pow(duration + params.b, params.c);
  }

  /**
   * Get Gumbel reduced variate for return period
   */
  getGumbelFactor(returnPeriod) {
    return -Math.log(-Math.log(1 - 1 / returnPeriod));
  }

  /**
   * Generate hyetograph (rainfall time series)
   * @param {number} duration - Duration in minutes
   * @param {number} timestep - Timestep in minutes
   * @param {number} returnPeriod - Return period in years
   * @param {string} type - Storm type
   * @param {string} city - City name
   * @returns {Object} Hyetograph data
   */
  generateHyetograph(duration, timestep, returnPeriod, type = 'SCS Type II', city = 'Jakarta') {
    const intensity = this.calculateIntensity(duration, returnPeriod, city);
    const totalDepth = intensity * duration / 60; // mm

    const steps = Math.ceil(duration / timestep);
    const hyetograph = [];

    switch (type) {
      case 'SCS Type IA':
      case 'SCS Type I':
      case 'SCS Type II':
      case 'SCS Type III':
        for (let i = 0; i < steps; i++) {
          const t = (i * timestep) / duration;
          const ratio = this.getSCSTypeRatio(t, type);
          const prevRatio = i > 0 ? this.getSCSTypeRatio(((i - 1) * timestep) / duration, type) : 0;
          const depth = (ratio - prevRatio) * totalDepth;
          hyetograph.push({
            time: i * timestep,
            intensity: (depth / timestep) * 60, // mm/hour
            depth: depth,
            cumulative: ratio * totalDepth
          });
        }
        break;

      case 'Block':
        // Uniform block storm
        for (let i = 0; i < steps; i++) {
          hyetograph.push({
            time: i * timestep,
            intensity: intensity,
            depth: intensity * timestep / 60,
            cumulative: (i + 1) * intensity * timestep / 60
          });
        }
        break;

      case 'Chicago':
        // Chicago hyetograph for urban areas
        const peakFactor = 0.4; // peak position
        for (let i = 0; i < steps; i++) {
          const t = i * timestep;
          const r = t / duration;
          const ratio = r < peakFactor ?
            Math.pow(r / peakFactor, 0.5) :
            Math.pow((1 - r) / (1 - peakFactor), 2);
          const instIntensity = intensity * ratio * 1.5; // peak intensity multiplier
          hyetograph.push({
            time: t,
            intensity: instIntensity,
            depth: instIntensity * timestep / 60,
            cumulative: 0 // Will be calculated
          });
        }
        // Calculate cumulative
        let cum = 0;
        for (let i = 0; i < hyetograph.length; i++) {
          cum += hyetograph[i].depth;
          hyetograph[i].cumulative = cum;
        }
        break;

      case 'Alternating':
        // Alternating block method
        const blocks = steps;
        const blockDuration = duration / blocks;
        const intensities = [];
        
        // Calculate intensity for each block
        for (let i = 1; i <= blocks; i++) {
          const blockInt = this.calculateIntensity(i * blockDuration, returnPeriod, city);
          intensities.push({
            block: i,
            intensity: blockInt,
            depth: blockInt * blockDuration / 60
          });
        }
        
        // Reorder for alternating pattern (max at center)
        const ordered = this.alternatingOrder(intensities);
        
        let cumDepth = 0;
        for (let i = 0; i < ordered.length; i++) {
          cumDepth += ordered[i].depth;
          hyetograph.push({
            time: i * timestep,
            intensity: ordered[i].intensity,
            depth: ordered[i].depth,
            cumulative: cumDepth
          });
        }
        break;
    }

    return {
      city,
      returnPeriod,
      duration,
      timestep,
      totalDepth,
      type,
      data: hyetograph
    };
  }

  /**
   * Get SCS Type cumulative distribution ratio
   */
  getSCSTypeRatio(t, type = 'SCS Type II') {
    // SCS Dimensionless Unit Hydrograph cumulative distribution
    switch (type) {
      case 'SCS Type IA':
        // Type IA - 24 hour, flat peak
        if (t <= 0.2) return 0.5 * Math.pow(t / 0.2, 2);
        if (t <= 0.6) return 0.5 + 0.5 * ((t - 0.2) / 0.4);
        return 0.5 + 0.5 * (1 + Math.pow((t - 0.6) / 0.4, 2));
        
      case 'SCS Type I':
        // Type I - 24 hour
        if (t <= 0.25) return 0.5 * Math.pow(t / 0.25, 2);
        if (t <= 0.65) return 0.5 + 0.5 * ((t - 0.25) / 0.4);
        return 0.5 + 0.5 * (1 + Math.pow((t - 0.65) / 0.35, 2));
        
      case 'SCS Type II':
      default:
        // Type II - 24 hour, sharp peak
        if (t <= 0.3) return 0.5 * Math.pow(t / 0.3, 2);
        if (t <= 0.7) return 0.5 + 0.5 * ((t - 0.3) / 0.4);
        return 0.5 + 0.5 * (1 + Math.pow((t - 0.7) / 0.3, 2));
        
      case 'SCS Type III':
        // Type III - 24 hour, coastal storms
        if (t <= 0.35) return 0.5 * Math.pow(t / 0.35, 2);
        if (t <= 0.75) return 0.5 + 0.5 * ((t - 0.35) / 0.4);
        return 0.5 + 0.5 * (1 + Math.pow((t - 0.75) / 0.25, 2));
    }
  }

  /**
   * Reorder blocks in alternating pattern (largest in middle)
   */
  alternatingOrder(blocks) {
    const sorted = [...blocks].sort((a, b) => b.depth - a.depth);
    const result = new Array(blocks.length);
    let left = Math.floor(blocks.length / 2);
    let right = left;
    let dir = -1; // start left

    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        result[left] = sorted[i];
      } else {
        if (dir === -1) {
          left--;
          result[left] = sorted[i];
        } else {
          right++;
          result[right] = sorted[i];
        }
        dir *= -1;
      }
    }
    return result;
  }

  /**
   * Get available cities
   */
  getAvailableCities() {
    return Array.from(this.idfCurves.keys());
  }

  /**
   * Get storm types
   */
  getStormTypes() {
    return this.stormTypes;
  }

  /**
   * Calculate rainfall depth for specific duration and return period
   */
  calculateRainfallDepth(duration, returnPeriod, city = 'Jakarta') {
    const intensity = this.calculateIntensity(duration, returnPeriod, city);
    return intensity * duration / 60; // mm
  }
}

export default RainfallEngine;
