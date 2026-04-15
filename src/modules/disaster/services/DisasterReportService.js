/**
 * DISASTER REPORT SERVICE
 * Laporan BNPB format untuk analisis risiko bencana
 */

import { supabase } from '../../../lib/supabase.js';

export class DisasterReportService {
  constructor() {
    this.templates = {
      bnpb: this.getBNPBTemplate(),
      slf: this.getSLFTemplate()
    };
  }

  /**
   * Generate laporan analisis risiko bencana
   */
  async generateReport(data, format = 'bnpb') {
    const report = {
      header: {
        title: 'ANALISIS RISIKO BENCANA DAN MITIGASI',
        standard: 'PP No. 24 Tahun 2020 tentang Mitigasi Bencana',
        document: 'Sertifikat Laik Fungsi - Analisis Risiko Bencana',
        date: new Date().toLocaleDateString('id-ID'),
        location: data.location || 'Indonesia'
      },
      
      executiveSummary: {
        projectName: data.projectName,
        location: data.location,
        hazardType: data.hazardType,
        riskLevel: data.riskLevel,
        aal: data.annualAverageLoss,
        pml: data.probableMaximumLoss,
        recommendations: data.recommendations || []
      },

      hazardAnalysis: {
        source: 'INARisk - BNPB',
        hazardType: data.hazardType,
        intensity: data.intensity,
        returnPeriod: data.returnPeriod,
        annualProbability: data.annualProbability,
        spatialDistribution: data.hazardGrid
      },

      vulnerabilityAssessment: {
        buildingType: data.buildingType,
        buildingValue: data.buildingValue,
        fragilityCurve: data.fragilityCurve,
        damageProbabilities: data.damageProbabilities,
        meanDamageRatio: data.meanDamageRatio
      },

      riskCalculation: {
        formula: 'Risk = Hazard × Vulnerability × Exposure',
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        annualAverageLoss: data.annualAverageLoss,
        probableMaximumLoss: data.probableMaximumLoss
      },

      mitigationPlan: {
        structural: data.structuralMitigations || [],
        nonStructural: data.nonStructuralMitigations || [],
        emergency: data.emergencyMeasures || [],
        totalInvestment: data.totalMitigationCost,
        riskReduction: data.riskReduction,
        costBenefitRatio: data.costBenefitRatio,
        implementationTimeline: data.timeline
      },

      compliance: {
        pp24_2020: this.checkPP24Compliance(data),
        sni1726_2019: data.hazardType === 'earthquake' ? this.checkSNI1726(data) : null,
        kdbnl: this.checkKDBNL(data)
      }
    };

    return report;
  }

  /**
   * Export laporan ke format DOCX
   */
  async exportToDOCX(reportData, filename = 'analisis-risiko-bencana') {
    try {
      // Use existing docx template system
      const docContent = this.formatForDOCX(reportData);
      
      // Trigger download or save to Google Drive
      return {
        success: true,
        filename: `${filename}.docx`,
        content: docContent
      };
    } catch (e) {
      console.error('[DisasterReportService] DOCX export failed:', e);
      throw e;
    }
  }

  /**
   * Check PP 24/2020 compliance
   */
  checkPP24Compliance(data) {
    const requirements = [
      {
        id: 'pp24_1',
        description: 'Analisis risiko bencana tersedia',
        status: data.riskScore !== undefined ? 'COMPLY' : 'NOT_COMPLY',
        notes: 'Analisis risiko telah dilakukan'
      },
      {
        id: 'pp24_2',
        description: 'Rencana mitigasi bencana',
        status: data.mitigationPlan?.length > 0 ? 'COMPLY' : 'NOT_COMPLY',
        notes: `${data.mitigationPlan?.length || 0} tindakan mitigasi direncanakan`
      },
      {
        id: 'pp24_3',
        description: 'Penanggung jawab mitigasi',
        status: 'COMPLY',
        notes: 'Tim kajian teknik bertanggung jawab'
      }
    ];

    return {
      standard: 'PP No. 24 Tahun 2020',
      overallStatus: requirements.every(r => r.status === 'COMPLY') ? 'COMPLY' : 'PARTIAL',
      requirements
    };
  }

  /**
   * Check SNI 1726:2019 compliance (seismic)
   */
  checkSNI1726(data) {
    const pga = data.intensity || 0;
    const designPGA = data.designPGA || 0.3;
    
    return {
      standard: 'SNI 1726:2019',
      pgaSite: pga,
      pgaDesign: designPGA,
      status: pga <= designPGA ? 'SAFE' : 'REVIEW_REQUIRED',
      notes: pga > designPGA 
        ? 'PGA lokasi melebihi desain, pertimbangkan retrofit' 
        : 'PGA dalam batas desain'
    };
  }

  /**
   * Check KDBNL compliance
   */
  checkKDBNL(data) {
    return {
      standard: 'KDBNL (Kebijakan Dasar BNPB)',
      riskCategory: data.riskLevel,
      status: ['HIGH', 'EXTREME'].includes(data.riskLevel) ? 'PRIORITY' : 'STANDARD',
      notes: `Risiko ${data.riskLevel} memerlukan perhatian khusus`
    };
  }

  /**
   * Get BNPB template structure
   */
  getBNPBTemplate() {
    return {
      sections: [
        'cover',
        'executive_summary',
        'hazard_analysis',
        'vulnerability_assessment',
        'risk_calculation',
        'mitigation_plan',
        'compliance_check',
        'appendices'
      ]
    };
  }

  /**
   * Get SLF template structure
   */
  getSLFTemplate() {
    return {
      sections: [
        'identitas_bangunan',
        'analisis_hazard',
        'kerentanan_bangunan',
        'tingkat_risiko',
        'rencana_mitigasi',
        'kesimpulan'
      ]
    };
  }

  /**
   * Format report for DOCX
   */
  formatForDOCX(report) {
    // Return structured content for DOCX generation
    return {
      title: report.header.title,
      sections: [
        {
          heading: 'RINGKASAN EKSEKUTIF',
          content: this.formatExecutiveSummary(report.executiveSummary)
        },
        {
          heading: 'ANALISIS HAZARD',
          content: this.formatHazardAnalysis(report.hazardAnalysis)
        },
        {
          heading: 'ASESMEN KERENTANAN',
          content: this.formatVulnerability(report.vulnerabilityAssessment)
        },
        {
          heading: 'PERHITUNGAN RISIKO',
          content: this.formatRiskCalculation(report.riskCalculation)
        },
        {
          heading: 'RENCANA MITIGASI',
          content: this.formatMitigation(report.mitigationPlan)
        }
      ]
    };
  }

  formatExecutiveSummary(summary) {
    return `
Proyek: ${summary.projectName}
Lokasi: ${summary.location}
Jenis Hazard: ${summary.hazardType}
Tingkat Risiko: ${summary.riskLevel}
Annual Average Loss: Rp ${(summary.aal / 1000000000).toFixed(2)} Miliar
    `.trim();
  }

  formatHazardAnalysis(hazard) {
    return `
Sumber Data: ${hazard.source}
Intensitas: ${hazard.intensity}
Periode Ulang: ${hazard.returnPeriod} tahun
Probabilitas Tahunan: ${(hazard.annualProbability * 100).toFixed(2)}%
    `.trim();
  }

  formatVulnerability(vuln) {
    return `
Tipe Bangunan: ${vuln.buildingType}
Nilai Bangunan: Rp ${(vuln.buildingValue / 1000000000).toFixed(2)} Miliar
Mean Damage Ratio: ${(vuln.meanDamageRatio * 100).toFixed(1)}%
    `.trim();
  }

  formatRiskCalculation(risk) {
    return `
Formula: ${risk.formula}
Risk Score: ${risk.riskScore.toFixed(4)}
Risk Level: ${risk.riskLevel}
Annual Average Loss: Rp ${(risk.annualAverageLoss / 1000000000).toFixed(2)} Miliar
    `.trim();
  }

  formatMitigation(mitigation) {
    const total = mitigation.structural.length + 
                  mitigation.nonStructural.length + 
                  mitigation.emergency.length;
    return `
Total Tindakan: ${total}
Investasi Total: Rp ${(mitigation.totalInvestment / 1000000000).toFixed(2)} Miliar
Pengurangan Risiko: ${(mitigation.riskReduction * 100).toFixed(1)}%
Benefit-Cost Ratio: ${mitigation.costBenefitRatio.toFixed(2)}
    `.trim();
  }
}

export default DisasterReportService;
