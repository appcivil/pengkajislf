/**
 * MITIGATION OPTIMIZER
 * Optimalisasi tindakan mitigasi berdasarkan cost-benefit analysis
 */

export class MitigationOptimizer {
  constructor() {
    this.mitigationMeasures = {
      structural: [
        {
          id: 'retrofit_base_isolation',
          name: 'Base Isolation System',
          description: 'Lead rubber bearings atau friction pendulum untuk gempa',
          unitCost: 1500000, // per m²
          effectiveness: { earthquake: 0.75 },
          lifespan: 50,
          maintenanceCost: 0.02
        },
        {
          id: 'retrofit_steel_bracing',
          name: 'Steel Bracing Retrofit',
          description: 'Penambahan baja penahan (bracing) struktur',
          unitCost: 800000,
          effectiveness: { earthquake: 0.55, wind: 0.40 },
          lifespan: 40,
          maintenanceCost: 0.015
        },
        {
          id: 'retrofit_shear_walls',
          name: 'Shear Wall Addition',
          description: 'Penambahan dinding geser untuk stabilitas lateral',
          unitCost: 650000,
          effectiveness: { earthquake: 0.60, wind: 0.50 },
          lifespan: 50,
          maintenanceCost: 0.01
        },
        {
          id: 'retrofit_jacketing',
          name: 'Column Jacketing',
          description: 'Perkuatan kolom dengan CFRP atau besi',
          unitCost: 450000,
          effectiveness: { earthquake: 0.45 },
          lifespan: 30,
          maintenanceCost: 0.02
        },
        {
          id: 'retrofit_dampers',
          name: 'Viscous Dampers',
          description: 'Viscous atau friction dampers untuk redaman gempa',
          unitCost: 1200000,
          effectiveness: { earthquake: 0.65, wind: 0.45 },
          lifespan: 35,
          maintenanceCost: 0.03
        },
        {
          id: 'retrofit_flood_proofing',
          name: 'Flood Proofing',
          description: 'Peninggian struktur dan waterproofing',
          unitCost: 550000,
          effectiveness: { flood: 0.70 },
          lifespan: 30,
          maintenanceCost: 0.025
        },
        {
          id: 'retrofit_tsunami_barriers',
          name: 'Tsunami Barriers',
          description: 'Dinding penahan dan pintu air',
          unitCost: 900000,
          effectiveness: { tsunami: 0.60 },
          lifespan: 40,
          maintenanceCost: 0.02
        }
      ],
      nonStructural: [
        {
          id: 'nsd_early_warning',
          name: 'Early Warning System',
          description: 'Sistem peringatan dini terintegrasi',
          unitCost: 50000000, // fixed cost
          effectiveness: { earthquake: 0.15, tsunami: 0.25, flood: 0.20 },
          lifespan: 15,
          maintenanceCost: 0.10
        },
        {
          id: 'nsd_flexible_utilities',
          name: 'Flexible Utility Connections',
          description: 'Koneksi utilitas fleksibel untuk gempa',
          unitCost: 150000,
          effectiveness: { earthquake: 0.30 },
          lifespan: 25,
          maintenanceCost: 0.05
        },
        {
          id: 'nsd_securing_contents',
          name: 'Securing Building Contents',
          description: 'Pengamanan perabot dan peralatan',
          unitCost: 100000,
          effectiveness: { earthquake: 0.35 },
          lifespan: 20,
          maintenanceCost: 0.03
        },
        {
          id: 'nsd_generator_backup',
          name: 'Backup Power System',
          description: 'Generator dan UPS untuk kontinuitas operasi',
          unitCost: 2500000,
          effectiveness: { earthquake: 0.20, flood: 0.15, wind: 0.15 },
          lifespan: 20,
          maintenanceCost: 0.08
        }
      ],
      emergency: [
        {
          id: 'emg_evacuation_plan',
          name: 'Evacuation Plan Development',
          description: 'Rencana evakuasi dan simulasi',
          unitCost: 25000000,
          effectiveness: { all: 0.40 },
          lifespan: 5,
          maintenanceCost: 0.20
        },
        {
          id: 'emg_training',
          name: 'Emergency Response Training',
          description: 'Pelatihan tanggap darurat berkala',
          unitCost: 15000000,
          effectiveness: { all: 0.30 },
          lifespan: 3,
          maintenanceCost: 0.50
        }
      ]
    };
  }

  /**
   * Optimize mitigation package for given budget
   */
  optimizeMitigation(riskAssessment, budget, buildingArea) {
    const allMeasures = [
      ...this.mitigationMeasures.structural,
      ...this.mitigationMeasures.nonStructural,
      ...this.mitigationMeasures.emergency
    ];

    // Calculate benefit for each measure
    const measuresWithBenefit = allMeasures.map(measure => {
      const cost = this.calculateTotalCost(measure, buildingArea);
      const benefit = this.calculateBenefit(measure, riskAssessment);
      const costBenefitRatio = benefit > 0 ? cost / benefit : Infinity;
      
      return {
        ...measure,
        totalCost: cost,
        annualBenefit: benefit,
        costBenefitRatio,
        npv: this.calculateNPV(measure, benefit, cost)
      };
    });

    // Sort by cost-benefit ratio (ascending = better)
    measuresWithBenefit.sort((a, b) => a.costBenefitRatio - b.costBenefitRatio);

    // Select measures within budget
    const selected = [];
    let remainingBudget = budget;
    let totalRiskReduction = 0;

    for (const measure of measuresWithBenefit) {
      if (measure.totalCost <= remainingBudget && measure.costBenefitRatio < 5) {
        selected.push(measure);
        remainingBudget -= measure.totalCost;
        
        // Calculate risk reduction
        const hazardType = Object.keys(measure.effectiveness)[0];
        if (hazardType === 'all') {
          totalRiskReduction += measure.effectiveness.all * 0.5;
        } else {
          totalRiskReduction += measure.effectiveness[hazardType] * 0.3;
        }
      }
    }

    return {
      selectedMeasures: selected,
      totalCost: budget - remainingBudget,
      remainingBudget,
      estimatedRiskReduction: Math.min(totalRiskReduction, 0.85),
      priority: this.prioritizeMeasures(selected),
      implementationTimeline: this.createTimeline(selected)
    };
  }

  /**
   * Calculate total cost including maintenance
   */
  calculateTotalCost(measure, area) {
    const initialCost = measure.unitCost * (measure.unitCost > 1000000 ? 1 : area);
    const maintenanceCost = initialCost * measure.maintenanceCost * measure.lifespan;
    return initialCost + maintenanceCost;
  }

  /**
   * Calculate annual benefit dari risk reduction
   */
  calculateBenefit(measure, riskAssessment) {
    const aal = riskAssessment.aal || 0;
    let effectiveness = 0;
    
    // Combine effectiveness for all applicable hazards
    Object.keys(measure.effectiveness).forEach(hazard => {
      if (hazard === 'all') {
        effectiveness += measure.effectiveness.all;
      } else if (riskAssessment.hazards && riskAssessment.hazards[hazard]) {
        effectiveness += measure.effectiveness[hazard];
      }
    });

    return aal * Math.min(effectiveness, 0.95);
  }

  /**
   * Calculate Net Present Value
   */
  calculateNPV(measure, annualBenefit, totalCost, discountRate = 0.03) {
    let npv = -totalCost;
    
    for (let year = 1; year <= measure.lifespan; year++) {
      npv += annualBenefit / Math.pow(1 + discountRate, year);
    }
    
    return npv;
  }

  /**
   * Calculate Cost-Benefit Ratio
   */
  calculateCostBenefitRatio(measure, riskAssessment, buildingArea) {
    const cost = this.calculateTotalCost(measure, buildingArea);
    const benefit = this.calculateBenefit(measure, riskAssessment) * measure.lifespan;
    
    return {
      ratio: cost / benefit,
      cost,
      benefit,
      bcr: benefit / cost
    };
  }

  /**
   * Prioritize measures berdasarkan urgency dan impact
   */
  prioritizeMeasures(measures) {
    return measures.map(m => ({
      ...m,
      priority: m.effectiveness.earthquake > 0.5 ? 'CRITICAL' :
                m.effectiveness.earthquake > 0.3 ? 'HIGH' :
                m.effectiveness.all > 0 ? 'MEDIUM' : 'LOW',
      implementationPhase: m.category === 'structural' ? 'Phase 1' : 'Phase 2'
    }));
  }

  /**
   * Create implementation timeline
   */
  createTimeline(measures) {
    const phases = {
      'Phase 1 (0-6 months)': [],
      'Phase 2 (6-12 months)': [],
      'Phase 3 (1-2 years)': []
    };

    measures.forEach(measure => {
      if (measure.category === 'emergency') {
        phases['Phase 1 (0-6 months)'].push(measure);
      } else if (measure.category === 'structural' && measure.totalCost > 100000000) {
        phases['Phase 3 (1-2 years)'].push(measure);
      } else {
        phases['Phase 2 (6-12 months)'].push(measure);
      }
    });

    return phases;
  }

  /**
   * Compare mitigation scenarios
   */
  compareScenarios(riskAssessment, scenarios, buildingArea) {
    return scenarios.map(scenario => {
      const measures = scenario.measureIds.map(id => 
        this.findMeasureById(id)
      ).filter(Boolean);

      const totalCost = measures.reduce((sum, m) => sum + this.calculateTotalCost(m, buildingArea), 0);
      const totalBenefit = measures.reduce((sum, m) => sum + this.calculateBenefit(m, riskAssessment), 0);

      return {
        name: scenario.name,
        measures,
        totalCost,
        annualBenefit: totalBenefit,
        paybackPeriod: totalCost / totalBenefit,
        bcr: (totalBenefit * 30) / totalCost, // 30-year BCR
        riskReduction: this.estimateRiskReduction(measures, riskAssessment)
      };
    });
  }

  /**
   * Find measure by ID
   */
  findMeasureById(id) {
    const allMeasures = [
      ...this.mitigationMeasures.structural,
      ...this.mitigationMeasures.nonStructural,
      ...this.mitigationMeasures.emergency
    ];
    return allMeasures.find(m => m.id === id);
  }

  /**
   * Estimate total risk reduction from measures
   */
  estimateRiskReduction(measures, riskAssessment) {
    let reduction = 0;
    
    measures.forEach(measure => {
      Object.keys(measure.effectiveness).forEach(hazard => {
        const hazardRisk = riskAssessment.hazards?.[hazard]?.contribution || 0.2;
        reduction += measure.effectiveness[hazard] * hazardRisk;
      });
    });

    return Math.min(reduction, 0.90);
  }

  /**
   * Get mitigation categories
   */
  getCategories() {
    return [
      { id: 'structural', name: 'Structural Mitigation', icon: '🏗️' },
      { id: 'nonStructural', name: 'Non-Structural Mitigation', icon: '🔧' },
      { id: 'emergency', name: 'Emergency Preparedness', icon: '🚨' }
    ];
  }
}

export default MitigationOptimizer;
