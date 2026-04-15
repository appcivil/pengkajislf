/**
 * RISK MATRIX
 * Risk = Hazard × Vulnerability × Exposure
 * Kalkulasi risiko multi-hazard dengan berbagai metodologi
 */

export class RiskMatrix {
  constructor() {
    // Risk classification thresholds
    this.riskThresholds = {
      low: 0.15,
      moderate: 0.35,
      high: 0.65,
      extreme: 0.85
    };
    
    // Annual Average Loss (AAL) calculation parameters
    this.aalParams = {
      discountRate: 0.03,
      timeHorizon: 50
    };
  }

  /**
   * Calculate risk using standard formula
   * Risk = Hazard × Vulnerability × Exposure
   */
  calculateRisk(hazard, vulnerability, exposure) {
    const riskScore = hazard * vulnerability * exposure;
    
    return {
      riskScore: parseFloat(riskScore.toFixed(4)),
      riskLevel: this.classifyRisk(riskScore),
      components: {
        hazard: parseFloat(hazard.toFixed(4)),
        vulnerability: parseFloat(vulnerability.toFixed(4)),
        exposure: parseFloat(exposure.toFixed(4))
      },
      formula: 'H × V × E'
    };
  }

  /**
   * Calculate Probabilistic Risk (annual basis)
   */
  calculateProbabilisticRisk(hazardData, vulnerability, exposure) {
    const aep = 1 / hazardData.returnPeriod;
    const riskScore = aep * vulnerability.meanDamageRatio * exposure.value;
    
    return {
      riskScore: parseFloat(riskScore.toFixed(6)),
      annualExceedanceProbability: aep,
      annualAverageLoss: parseFloat(riskScore.toFixed(2)),
      riskLevel: this.classifyRisk(riskScore * 100), // Scale up for classification
      returnPeriod: hazardData.returnPeriod
    };
  }

  /**
   * Calculate multi-hazard risk
   */
  calculateMultiHazardRisk(hazards, buildingData) {
    const risks = hazards.map(hazard => {
      const vuln = buildingData.vulnerabilities[hazard.type];
      const risk = this.calculateRisk(
        hazard.intensity,
        vuln.meanDamageRatio,
        buildingData.exposure
      );
      return {
        hazardType: hazard.type,
        ...risk
      };
    });

    // Aggregate risks (assuming independence)
    const totalRisk = risks.reduce((sum, r) => sum + r.riskScore, 0);
    const dominantHazard = risks.reduce((max, r) => 
      r.riskScore > max.riskScore ? r : max, risks[0]);

    return {
      individualRisks: risks,
      totalRisk: parseFloat(totalRisk.toFixed(4)),
      dominantHazard: dominantHazard.hazardType,
      riskLevel: this.classifyRisk(totalRisk),
      requiresMitigation: totalRisk > this.riskThresholds.moderate
    };
  }

  /**
   * Calculate Annual Average Loss (AAL)
   */
  calculateAAL(lossExceedanceCurve, exposureValue) {
    // Integrate loss exceedance curve
    let aal = 0;
    
    for (let i = 0; i < lossExceedanceCurve.length - 1; i++) {
      const current = lossExceedanceCurve[i];
      const next = lossExceedanceCurve[i + 1];
      
      // Trapezoidal integration
      const width = next.rate - current.rate;
      const avgLoss = (current.loss + next.loss) / 2;
      aal += avgLoss * width;
    }

    const percentage = (aal / exposureValue) * 100;

    return {
      aal: parseFloat(aal.toFixed(2)),
      percentageOfExposure: parseFloat(percentage.toFixed(3)),
      currency: 'IDR'
    };
  }

  /**
   * Calculate Probable Maximum Loss (PML)
   */
  calculatePML(damageRatios, confidence = 0.95) {
    const sorted = [...damageRatios].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * confidence);
    
    return {
      pml: sorted[index] || sorted[sorted.length - 1],
      confidence: confidence,
      percentile: confidence * 100
    };
  }

  /**
   * Classify risk level
   */
  classifyRisk(riskScore) {
    if (riskScore >= this.riskThresholds.extreme) return {
      level: 'EXTREME',
      code: 'E',
      color: '#7f1d1d',
      action: 'Immediate evacuation and structural intervention required'
    };
    
    if (riskScore >= this.riskThresholds.high) return {
      level: 'HIGH',
      code: 'H',
      color: '#dc2626',
      action: 'Priority mitigation measures within 1 year'
    };
    
    if (riskScore >= this.riskThresholds.moderate) return {
      level: 'MODERATE',
      code: 'M',
      color: '#f59e0b',
      action: 'Mitigation measures within 3 years'
    };
    
    if (riskScore >= this.riskThresholds.low) return {
      level: 'LOW',
      code: 'L',
      color: '#10b981',
      action: 'Standard monitoring and maintenance'
    };

    return {
      level: 'NEGLIGIBLE',
      code: 'N',
      color: '#3b82f6',
      action: 'Routine inspections sufficient'
    };
  }

  /**
   * Generate risk matrix table
   */
  generateRiskMatrix() {
    const likelihoods = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
    const consequences = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
    
    const matrix = [];
    
    for (let i = 0; i < likelihoods.length; i++) {
      const row = [];
      for (let j = 0; j < consequences.length; j++) {
        const score = ((i + 1) * (j + 1)) / 25;
        row.push({
          likelihood: likelihoods[i],
          consequence: consequences[j],
          score: score,
          level: this.classifyRisk(score)
        });
      }
      matrix.push(row);
    }
    
    return matrix;
  }

  /**
   * Calculate risk reduction from mitigation
   */
  calculateRiskReduction(baselineRisk, mitigatedRisk) {
    const reduction = baselineRisk - mitigatedRisk;
    const percentage = (reduction / baselineRisk) * 100;
    
    return {
      absoluteReduction: parseFloat(reduction.toFixed(4)),
      percentageReduction: parseFloat(percentage.toFixed(2)),
      effectiveness: percentage > 70 ? 'High' : 
                   percentage > 40 ? 'Moderate' : 'Low'
    };
  }

  /**
   * Get risk tolerance criteria
   */
  getRiskToleranceCriteria() {
    return {
      individualRisk: {
        acceptable: 0.0001,  // 1 in 10,000 per year
        tolerable: 0.00001   // 1 in 100,000 per year
      },
      societalRisk: {
        acceptable: 0.001,   // 1 in 1,000 per year
        tolerable: 0.0001    // 1 in 10,000 per year
      },
      economicRisk: {
        acceptable: 0.10,    // 10% of asset value
        tolerable: 0.05      // 5% of asset value
      }
    };
  }
}

export default RiskMatrix;
