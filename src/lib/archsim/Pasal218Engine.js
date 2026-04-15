/**
 * Pasal218Engine.js - Compliance Engine untuk Evaluasi Pasal 218
 * Auto-evaluation berdasarkan Permen PUPR No. 6/2017
 */

import { archState } from './StateManager.js';

export class Pasal218Engine {
  constructor() {
    this.rules = {
      penampilan: {
        ayat: '218 (2)',
        title: 'Penampilan Bangunan',
        items: [
          { 
            id: 'bentuk_bangunan', 
            label: 'Bentuk Bangunan',
            weight: 0.15, 
            check: (data) => data.shape !== 'irregular' && data.shape !== undefined,
            criteria: 'Bangunan tidak memiliki bentuk yang tidak beraturan ekstrem'
          },
          { 
            id: 'bentuk_denah', 
            label: 'Efisiensi Denah',
            weight: 0.15, 
            check: (data) => data.floorEfficiency > 0.7,
            criteria: 'Efisiensi denah minimal 70%'
          },
          { 
            id: 'tampak_bangunan', 
            label: 'Rasio Fasad',
            weight: 0.15, 
            check: (data) => data.facadeRatio > 0.4,
            criteria: 'Rasio bukaan fasad minimal 40%'
          },
          { 
            id: 'atap', 
            label: 'Bentuk Atap',
            weight: 0.15, 
            check: (data) => ['pelana', 'limasan', 'datar', 'membran', 'kubah'].includes(data.roofType),
            criteria: 'Atap sesuai ketentuan (pelana, limasan, datar, membran, kubah)'
          },
          { 
            id: 'material_warna', 
            label: 'Material & Warna',
            weight: 0.15, 
            check: (data) => data.materials?.length > 0 && data.colorScheme !== undefined,
            criteria: 'Material dan warna telah ditentukan'
          },
          { 
            id: 'pagar', 
            label: 'Pagar',
            weight: 0.15, 
            check: (data) => data.hasFence && data.fenceHeight >= 0.8 && data.fenceHeight <= 2.0,
            criteria: 'Pagar tinggi 0.8 - 2.0 meter'
          },
          { 
            id: 'kulit_bangunan', 
            label: 'Kulit Bangunan',
            weight: 0.1, 
            check: (data) => data.cladding !== 'none' && data.cladding !== undefined,
            criteria: 'Kulit/elevasi bangunan terdefinisi'
          }
        ]
      },
      tataRuang: {
        ayat: '218 (4)',
        title: 'Tata Ruang Dalam',
        items: [
          { 
            id: 'ruang_utama', 
            label: 'Ruang Utama',
            weight: 0.12, 
            check: (data) => data.mainRooms >= 3,
            criteria: 'Minimal 3 ruang utama (tidak termasuk kamar mandi/toilet)'
          },
          { 
            id: 'dinding', 
            label: 'Dinding',
            weight: 0.12, 
            check: (data) => data.wallHeight >= 2.8,
            criteria: 'Tinggi dinding minimal 2.8 meter'
          },
          { 
            id: 'penyekat', 
            label: 'Penyekat',
            weight: 0.10, 
            check: (data) => data.partitions?.length > 0,
            criteria: 'Penyekat ruang memenuhi ketentuan'
          },
          { 
            id: 'pintu_jendela', 
            label: 'Pintu & Jendela',
            weight: 0.12, 
            check: (data) => data.openingRatio > 0.2,
            criteria: 'Rasio bukaan minimal 20% dari luas dinding'
          },
          { 
            id: 'tinggi_ruang', 
            label: 'Tinggi Ruang',
            weight: 0.12, 
            check: (data) => data.ceilingHeight >= 2.4,
            criteria: 'Tinggi ruang minimal 2.4 meter'
          },
          { 
            id: 'lantai_dasar', 
            label: 'Lantai Dasar',
            weight: 0.10, 
            check: (data) => data.groundFloorHeight >= 0.5,
            criteria: 'Lantai dasar minimal 0.5 meter dari peil jalan'
          },
          { 
            id: 'rongga_atap', 
            label: 'Rongga Atap',
            weight: 0.10, 
            check: (data) => data.roofSpace >= 0.6,
            criteria: 'Rongga atap minimal 0.6 meter'
          },
          { 
            id: 'penutup_lantai', 
            label: 'Penutup Lantai',
            weight: 0.12, 
            check: (data) => data.floorFinish !== 'none' && data.floorFinish !== undefined,
            criteria: 'Penutup lantai telah ditentukan'
          },
          { 
            id: 'penutup_plafon', 
            label: 'Penutup Plafon',
            weight: 0.10, 
            check: (data) => data.ceilingFinish !== 'none' && data.ceilingFinish !== undefined,
            criteria: 'Penutup plafon telah ditentukan'
          }
        ]
      },
      lingkungan: {
        ayat: '218 (6)',
        title: 'Tata Lingkungan',
        items: [
          { 
            id: 'peil', 
            label: 'Ketinggian Lantai',
            weight: 0.09, 
            check: (data) => data.siteLevel !== null && data.siteLevel !== undefined,
            criteria: 'Ketinggian lantai bangunan terhadap peil jalan'
          },
          { 
            id: 'ruang_terbuka', 
            label: 'Ruang Terbuka',
            weight: 0.10, 
            check: (data) => data.openSpaceRatio > 0.3,
            criteria: 'Ruang terbuka hijau minimal 30% dari luas lahan'
          },
          { 
            id: 'sempadan', 
            label: 'Sempadan Bangunan',
            weight: 0.09, 
            check: (data) => data.setback >= 3,
            criteria: 'Sempadan bangunan minimal 3 meter'
          },
          { 
            id: 'daerah_hijau', 
            label: 'Daerah Hijau',
            weight: 0.09, 
            check: (data) => data.greenArea > 0 && data.greenAreaRatio >= 0.1,
            criteria: 'Minimal 10% daerah hijau dari luas lahan'
          },
          { 
            id: 'tata_tanaman', 
            label: 'Tata Tanaman',
            weight: 0.09, 
            check: (data) => data.landscaping?.length > 0,
            criteria: 'Tata tanaman sesuai ketentuan'
          },
          { 
            id: 'perkerasan', 
            label: 'Perkerasan',
            weight: 0.09, 
            check: (data) => data.pavement !== 'none' && data.pavementArea > 0,
            criteria: 'Perkerasan halaman/laluan'
          },
          { 
            id: 'sirkulasi', 
            label: 'Sirkulasi',
            weight: 0.10, 
            check: (data) => data.hasCirculation && data.circulationWidth >= 2,
            criteria: 'Sirkulasi minimal lebar 2 meter'
          },
          { 
            id: 'pedestrian', 
            label: 'Jalur Pejalan',
            weight: 0.09, 
            check: (data) => data.pedestrianPath && data.pedestrianWidth >= 1.2,
            criteria: 'Jalur pejalan minimal 1.2 meter'
          },
          { 
            id: 'furniture', 
            label: 'Street Furniture',
            weight: 0.09, 
            check: (data) => data.streetFurniture?.length > 0,
            criteria: 'Furniture luar ruang'
          },
          { 
            id: 'signage', 
            label: 'Signage',
            weight: 0.09, 
            check: (data) => data.signage,
            criteria: 'Penandaan/signage sesuai ketentuan'
          },
          { 
            id: 'pencahayaan', 
            label: 'Pencahayaan Luar',
            weight: 0.09, 
            check: (data) => data.outdoorLighting && data.luxLevel >= 5,
            criteria: 'Pencahayaan luar minimal 5 lux'
          }
        ]
      }
    };
  }

  evaluate(projectData) {
    let totalScore = 0;
    let maxScore = 0;
    const results = {};
    const recommendations = [];

    Object.entries(this.rules).forEach(([category, rule]) => {
      results[category] = { 
        score: 0, 
        maxScore: 0,
        items: {},
        passed: 0,
        failed: 0,
        ayat: rule.ayat,
        title: rule.title
      };
      
      rule.items.forEach(item => {
        const passed = item.check(projectData);
        const itemMaxScore = item.weight * 100;
        const itemScore = passed ? itemMaxScore : 0;
        
        results[category].score += itemScore;
        results[category].maxScore += itemMaxScore;
        results[category].items[item.id] = { 
          passed, 
          weight: item.weight,
          label: item.label,
          criteria: item.criteria,
          score: itemScore,
          maxScore: itemMaxScore
        };

        if (passed) {
          results[category].passed++;
        } else {
          results[category].failed++;
          recommendations.push({
            id: item.id,
            label: item.label,
            criteria: item.criteria,
            category: rule.title,
            weight: item.weight
          });
        }

        maxScore += itemMaxScore;
        totalScore += itemScore;
      });
    });

    const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const status = this.determineStatus(finalScore, results);
    
    const compliance = {
      score: parseFloat(finalScore.toFixed(2)),
      rawScore: totalScore,
      maxScore: maxScore,
      details: results,
      status: status,
      passedCount: this.countPassed(results),
      failedCount: this.countFailed(results),
      totalItems: this.countTotal(results),
      recommendations: recommendations,
      timestamp: new Date().toISOString()
    };

    // Update global state
    archState.setState({ compliance });

    return compliance;
  }

  determineStatus(score, results) {
    // Check if any critical items failed
    const criticalCategories = ['penampilan', 'tataRuang'];
    const hasCriticalFailure = criticalCategories.some(cat => {
      const catData = results[cat];
      if (!catData) return false;
      const catScore = (catData.score / catData.maxScore) * 100;
      return catScore < 50;
    });

    if (hasCriticalFailure) return 'NON_COMPLIANT';
    if (score >= 85) return 'COMPLIANT';
    if (score >= 70) return 'PARTIAL_COMPLIANT';
    if (score >= 50) return 'MINOR_COMPLIANT';
    return 'NON_COMPLIANT';
  }

  countPassed(results) {
    return Object.values(results).reduce((sum, cat) => sum + (cat.passed || 0), 0);
  }

  countFailed(results) {
    return Object.values(results).reduce((sum, cat) => sum + (cat.failed || 0), 0);
  }

  countTotal(results) {
    return Object.values(results).reduce((sum, cat) => sum + Object.keys(cat.items).length, 0);
  }

  quickCheck(projectData, checkId) {
    // Quick check single item
    for (const [category, rule] of Object.entries(this.rules)) {
      const item = rule.items.find(i => i.id === checkId);
      if (item) {
        return {
          id: checkId,
          passed: item.check(projectData),
          weight: item.weight,
          label: item.label,
          criteria: item.criteria,
          category: rule.title
        };
      }
    }
    return null;
  }

  getCategoryScore(results, category) {
    const cat = results[category];
    if (!cat || cat.maxScore === 0) return 0;
    return (cat.score / cat.maxScore) * 100;
  }

  generateReport(projectData) {
    const evaluation = this.evaluate(projectData);
    
    return {
      timestamp: evaluation.timestamp,
      projectId: projectData.id,
      score: evaluation.score,
      status: evaluation.status,
      summary: {
        penampilan: this.getCategoryScore(evaluation.details, 'penampilan').toFixed(1),
        tataRuang: this.getCategoryScore(evaluation.details, 'tataRuang').toFixed(1),
        lingkungan: this.getCategoryScore(evaluation.details, 'lingkungan').toFixed(1)
      },
      recommendations: evaluation.recommendations,
      passedCount: evaluation.passedCount,
      failedCount: evaluation.failedCount,
      totalItems: evaluation.totalItems,
      details: evaluation.details
    };
  }

  exportToJSON(projectData) {
    return JSON.stringify(this.generateReport(projectData), null, 2);
  }
}

// Quick compliance calculator untuk data spesifik
export function calculateComplianceScore(data) {
  const engine = new Pasal218Engine();
  return engine.evaluate(data);
}

// Generate recommendation text
export function generateRecommendationText(compliance) {
  const recs = compliance.recommendations || [];
  if (recs.length === 0) {
    return 'Seluruh ketentuan Pasal 218 telah terpenuhi. Bangunan sesuai standar.';
  }

  return recs.map((rec, i) => 
    `${i + 1}. ${rec.label}: ${rec.criteria} (bobot ${(rec.weight * 100).toFixed(0)}%)`
  ).join('\n');
}

export default { Pasal218Engine, calculateComplianceScore, generateRecommendationText };
