/**
 * HAZARD DATA MODEL
 * Data structure untuk hazard information dari INARisk
 */

export class HazardData {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.type = data.type || 'earthquake';
    this.name = data.name || '';
    this.description = data.description || '';
    
    // Spatial data
    this.bounds = data.bounds || [95, -11, 141, 6]; // Indonesia bounds
    this.center = data.center || { lat: -2.5, lon: 118 };
    
    // Intensity parameters
    this.intensity = data.intensity || 0;
    this.unit = data.unit || this.getDefaultUnit(this.type);
    this.returnPeriod = data.returnPeriod || 100;
    
    // Grid data untuk heatmap
    this.grid = data.grid || [];
    this.resolution = data.resolution || 100; // meters
    
    // Metadata
    this.source = data.source || 'INARisk';
    this.timestamp = data.timestamp || new Date().toISOString();
    this.modelVersion = data.modelVersion || '1.0';
    
    // Probability
    this.annualProbability = data.annualProbability || (1 / this.returnPeriod);
    this.recurrenceInterval = data.returnPeriod;
  }

  /**
   * Get default unit berdasarkan hazard type
   */
  getDefaultUnit(type) {
    const units = {
      earthquake: 'g (PGA)',
      tsunami: 'm (height)',
      flood: 'm (depth)',
      landslide: 'index',
      fire: 'index'
    };
    return units[type] || 'unit';
  }

  /**
   * Get intensity classification
   */
  getIntensityClassification() {
    switch (this.type) {
      case 'earthquake':
        if (this.intensity < 0.1) return { level: 'Very Low', color: '#10b981' };
        if (this.intensity < 0.2) return { level: 'Low', color: '#34d399' };
        if (this.intensity < 0.3) return { level: 'Moderate', color: '#fbbf24' };
        if (this.intensity < 0.4) return { level: 'High', color: '#f59e0b' };
        if (this.intensity < 0.5) return { level: 'Very High', color: '#ef4444' };
        return { level: 'Extreme', color: '#dc2626' };
      
      case 'tsunami':
        if (this.intensity < 3) return { level: 'Minor', color: '#10b981' };
        if (this.intensity < 8) return { level: 'Moderate', color: '#fbbf24' };
        if (this.intensity < 15) return { level: 'Major', color: '#ef4444' };
        return { level: 'Extreme', color: '#7f1d1d' };
      
      case 'flood':
        if (this.intensity < 0.5) return { level: 'Minor', color: '#10b981' };
        if (this.intensity < 1.5) return { level: 'Moderate', color: '#fbbf24' };
        if (this.intensity < 3) return { level: 'Major', color: '#ef4444' };
        return { level: 'Extreme', color: '#7f1d1d' };
      
      default:
        if (this.intensity < 0.3) return { level: 'Low', color: '#10b981' };
        if (this.intensity < 0.6) return { level: 'Moderate', color: '#fbbf24' };
        return { level: 'High', color: '#ef4444' };
    }
  }

  /**
   * Get color untuk visualization
   */
  getIntensityColor() {
    return this.getIntensityClassification().color;
  }

  /**
   * Get max intensity dari grid
   */
  getMaxIntensity() {
    if (!this.grid || this.grid.length === 0) return this.intensity;
    return Math.max(...this.grid.map(cell => cell.intensity));
  }

  /**
   * Get average intensity dari grid
   */
  getAverageIntensity() {
    if (!this.grid || this.grid.length === 0) return this.intensity;
    const sum = this.grid.reduce((acc, cell) => acc + cell.intensity, 0);
    return sum / this.grid.length;
  }

  /**
   * Serialize untuk storage
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      description: this.description,
      bounds: this.bounds,
      center: this.center,
      intensity: this.intensity,
      unit: this.unit,
      returnPeriod: this.returnPeriod,
      grid: this.grid,
      resolution: this.resolution,
      source: this.source,
      timestamp: this.timestamp,
      modelVersion: this.modelVersion,
      annualProbability: this.annualProbability
    };
  }

  /**
   * Create dari JSON
   */
  static fromJSON(json) {
    return new HazardData(json);
  }
}

export default HazardData;
