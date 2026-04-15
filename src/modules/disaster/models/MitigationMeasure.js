/**
 * MITIGATION MEASURE MODEL
 * Model untuk tindakan mitigasi bencana
 */

export class MitigationMeasure {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || '';
    this.description = data.description || '';
    this.category = data.category || 'structural'; // structural, nonStructural, emergency
    
    // Cost parameters
    this.unitCost = data.unitCost || 0;
    this.fixedCost = data.fixedCost || 0;
    this.maintenanceCost = data.maintenanceCost || 0; // annual percentage
    
    // Effectiveness for different hazards
    this.effectiveness = data.effectiveness || {
      earthquake: 0,
      tsunami: 0,
      flood: 0,
      landslide: 0,
      fire: 0
    };
    
    // Implementation parameters
    this.lifespan = data.lifespan || 30; // years
    this.implementationTime = data.implementationTime || 6; // months
    
    // Requirements
    this.requiresEngineering = data.requiresEngineering || false;
    this.requiresPermit = data.requiresPermit || false;
    
    // Status
    this.status = data.status || 'proposed'; // proposed, approved, implemented
    this.implementationYear = data.implementationYear || null;
  }

  /**
   * Calculate total cost untuk building area
   */
  calculateTotalCost(area) {
    const initialCost = this.fixedCost + (this.unitCost * area);
    const maintenanceTotal = initialCost * (this.maintenanceCost / 100) * this.lifespan;
    return initialCost + maintenanceTotal;
  }

  /**
   * Calculate annual benefit dari risk reduction
   */
  calculateAnnualBenefit(currentAAL, hazardType) {
    const effectiveness = this.effectiveness[hazardType] || 0;
    return currentAAL * effectiveness;
  }

  /**
   * Calculate Net Present Value
   */
  calculateNPV(annualBenefit, totalCost, discountRate = 0.03) {
    let npv = -totalCost;
    
    for (let year = 1; year <= this.lifespan; year++) {
      npv += annualBenefit / Math.pow(1 + discountRate, year);
    }
    
    return npv;
  }

  /**
   * Calculate benefit-cost ratio
   */
  calculateBCR(annualBenefit, totalCost) {
    const totalBenefit = annualBenefit * this.lifespan;
    return totalBenefit / totalCost;
  }

  /**
   * Get effectiveness untuk semua hazard
   */
  getTotalEffectiveness() {
    return Object.values(this.effectiveness).reduce((sum, val) => sum + val, 0);
  }

  /**
   * Get primary hazard (highest effectiveness)
   */
  getPrimaryHazard() {
    return Object.entries(this.effectiveness)
      .sort((a, b) => b[1] - a[1])[0];
  }

  /**
   * Serialize
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      unitCost: this.unitCost,
      fixedCost: this.fixedCost,
      maintenanceCost: this.maintenanceCost,
      effectiveness: this.effectiveness,
      lifespan: this.lifespan,
      implementationTime: this.implementationTime,
      requiresEngineering: this.requiresEngineering,
      requiresPermit: this.requiresPermit,
      status: this.status,
      implementationYear: this.implementationYear
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new MitigationMeasure(json);
  }
}

export default MitigationMeasure;
