/**
 * AI RULE ENGINE - Rule-Based Validation System
 * Validasi deterministik untuk output AI sebelum diterima sebagai keputusan final
 *
 * @module lib/ai-rule-engine
 */

/**
 * Definisi aturan validasi
 */
export const VALIDATION_RULES = {
  // Aturan untuk analisis checklist
  CHECKLIST: {
    // 1. Normalisasi dan Validasi Field Wajib
    required_fields: {
      id: 'required_fields',
      priority: 1,
      condition: (data) => {
        const required = ['kode', 'nama', 'status', 'faktual', 'analisis', 'risiko', 'rekomendasi'];
        const missing = required.filter(f => !data[f]);
        return {
          valid: missing.length === 0,
          missing,
          message: missing.length > 0 ? `Field wajib tidak lengkap: ${missing.join(', ')}` : null
        };
      }
    },

    // 2. Validasi Skor Confidence
    confidence_range: {
      id: 'confidence_range',
      priority: 2,
      condition: (data) => {
        const confidence = data.confidence;
        if (confidence === undefined) return { valid: true, warning: 'Confidence tidak tersedia' };

        const valid = confidence >= 0 && confidence <= 1;
        return {
          valid,
          message: valid ? null : `Confidence ${confidence} di luar range 0-1`,
          warning: confidence < 0.7 ? 'Confidence rendah, perlu review manual' : null
        };
      }
    },

    // 3. Validasi Konsistensi Status dan Risiko
    status_risk_consistency: {
      id: 'status_risk_consistency',
      priority: 3,
      condition: (data) => {
        const status = data.status;
        const risiko = data.risiko;

        // Jika status Kritis, risiko harus Kritis
        if (status === 'Kritis' && risiko !== 'Kritis') {
          return {
            valid: false,
            message: 'Inkonsistensi: Status Kritis harus memiliki risiko Kritis',
            auto_fix: { risiko: 'Kritis' }
          };
        }

        // Jika risiko Kritis, status harus Kritis atau Tidak Sesuai
        if (risiko === 'Kritis' && !['Kritis', 'Tidak Sesuai'].includes(status)) {
          return {
            valid: false,
            message: 'Inkonsistensi: Risiko Kritis harus memiliki status Kritis atau Tidak Sesuai',
            auto_fix: { status: 'Kritis' }
          };
        }

        return { valid: true };
      }
    },

    // 4. Validasi Panjang Analisis
    analysis_length: {
      id: 'analysis_length',
      priority: 4,
      condition: (data) => {
        const analisis = data.analisis || '';
        const minLength = 50; // Minimal 50 karakter
        const maxLength = 5000; // Maksimal 5000 karakter

        if (analisis.length < minLength) {
          return {
            valid: false,
            message: `Analisis terlalu singkat (${analisis.length} karakter), minimal ${minLength} karakter`
          };
        }

        if (analisis.length > maxLength) {
          return {
            valid: true,
            warning: `Analisis sangat panjang (${analisis.length} karakter), dipertimbangkan untuk dipersingkat`,
            trim_suggestion: analisis.substring(0, maxLength) + '...'
          };
        }

        return { valid: true };
      }
    },

    // 5. Validasi Konten Analisis
    analysis_content: {
      id: 'analysis_content',
      priority: 5,
      condition: (data) => {
        const analisis = data.analisis || '';
        const requiredKeywords = ['SNI', 'standar', 'analisis', 'temuan'];
        const missingKeywords = requiredKeywords.filter(kw =>
          !analisis.toLowerCase().includes(kw.toLowerCase())
        );

        if (missingKeywords.length > 2) {
          return {
            valid: true, // Tidak block, hanya warning
            warning: `Analisis kurang referensi teknis: ${missingKeywords.join(', ')}`
          };
        }

        return { valid: true };
      }
    },

    // 6. Validasi Rekomendasi
    rekomendasi_quality: {
      id: 'rekomendasi_quality',
      priority: 6,
      condition: (data) => {
        const rekomendasi = data.rekomendasi || '';

        if (data.status === 'Tidak Sesuai' || data.status === 'Kritis') {
          if (rekomendasi.length < 20) {
            return {
              valid: false,
              message: 'Rekomendasi terlalu singkat untuk status tidak sesuai/kritis'
            };
          }

          // Check action-oriented words
          const actionWords = ['perbaiki', 'ganti', 'tambah', 'hapus', 'perkuat', 'perlebar', 'perbaikan'];
          const hasAction = actionWords.some(w => rekomendasi.toLowerCase().includes(w));

          if (!hasAction) {
            return {
              valid: true,
              warning: 'Rekomendasi sebaiknya mengandung kata kerja aksi (perbaiki, ganti, tambah, dll)'
            };
          }
        }

        return { valid: true };
      }
    }
  },

  // Aturan untuk dokumen
  DOCUMENT: {
    completeness_range: {
      id: 'completeness_range',
      priority: 1,
      condition: (data) => {
        const completeness = data.completeness;
        if (completeness === undefined) {
          return { valid: false, message: 'Completeness tidak tersedia' };
        }

        const valid = completeness >= 0 && completeness <= 100;
        return {
          valid,
          message: valid ? null : `Completeness ${completeness} di luar range 0-100`
        };
      }
    },

    status_consistency: {
      id: 'status_consistency',
      priority: 2,
      condition: (data) => {
        const completeness = data.completeness;
        const status = data.status;

        if (completeness === 100 && status !== 'Lengkap') {
          return {
            valid: false,
            message: 'Inkonsistensi: Completeness 100% harus memiliki status Lengkap',
            auto_fix: { status: 'Lengkap' }
          };
        }

        if (completeness < 50 && status === 'Lengkap') {
          return {
            valid: false,
            message: 'Inkonsistensi: Completeness < 50% tidak boleh status Lengkap',
            auto_fix: { status: 'Tidak Lengkap' }
          };
        }

        return { valid: true };
      }
    }
  }
};

/**
 * Rule Engine Class
 */
export class AIRuleEngine {
  constructor() {
    this.rules = new Map();
    this.stats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      autoFixes: 0
    };
  }

  /**
   * Register aturan custom
   */
  registerRule(category, ruleId, ruleFn, priority = 10) {
    if (!this.rules.has(category)) {
      this.rules.set(category, new Map());
    }
    this.rules.get(category).set(ruleId, { fn: ruleFn, priority });
  }

  /**
   * Validasi data dengan aturan
   */
  validate(data, category = 'CHECKLIST', options = {}) {
    this.stats.totalValidations++;

    const result = {
      valid: true,
      errors: [],
      warnings: [],
      autoFixes: [],
      rulesChecked: 0,
      rulesPassed: 0,
      rulesFailed: 0
    };

    // Get rules untuk category
    const rules = VALIDATION_RULES[category] || {};
    const customRules = this.rules.get(category) || new Map();

    // Combine dan sort by priority
    const allRules = [
      ...Object.entries(rules).map(([id, rule]) => ({ id, ...rule })),
      ...Array.from(customRules.entries()).map(([id, rule]) => ({ id, ...rule }))
    ].sort((a, b) => (a.priority || 10) - (b.priority || 10));

    for (const rule of allRules) {
      result.rulesChecked++;

      try {
        const checkResult = rule.condition(data);

        if (!checkResult.valid) {
          result.valid = false;
          result.rulesFailed++;

          const error = {
            ruleId: rule.id,
            field: checkResult.field || null,
            message: checkResult.message,
            severity: 'error'
          };

          result.errors.push(error);

          // Auto-fix jika tersedia
          if (checkResult.auto_fix && options.autoFix !== false) {
            Object.assign(data, checkResult.auto_fix);
            result.autoFixes.push({ ruleId: rule.id, fixes: checkResult.auto_fix });
            this.stats.autoFixes++;
          }
        } else {
          result.rulesPassed++;

          // Collect warnings
          if (checkResult.warning) {
            result.warnings.push({
              ruleId: rule.id,
              message: checkResult.warning,
              severity: 'warning'
            });
          }
        }
      } catch (error) {
        console.warn(`[RuleEngine] Rule ${rule.id} failed:`, error);
        result.warnings.push({
          ruleId: rule.id,
          message: `Rule validation error: ${error.message}`,
          severity: 'warning'
        });
      }
    }

    // Update stats
    if (result.valid && result.errors.length === 0) {
      this.stats.passedValidations++;
    } else {
      this.stats.failedValidations++;
    }

    return result;
  }

  /**
   * Batch validation untuk multiple items
   */
  validateBatch(items, category = 'CHECKLIST', options = {}) {
    const results = items.map(item => ({
      item,
      validation: this.validate(item, category, options)
    }));

    const summary = {
      total: items.length,
      valid: results.filter(r => r.validation.valid).length,
      invalid: results.filter(r => !r.validation.valid).length,
      withWarnings: results.filter(r => r.validation.warnings.length > 0).length,
      autoFixed: results.filter(r => r.validation.autoFixes.length > 0).length
    };

    return { results, summary };
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      autoFixes: 0
    };
  }
}

/**
 * Scoring Engine untuk perhitungan bobot
 */
export class AIScoringEngine {
  constructor() {
    this.weights = new Map();
  }

  /**
   * Set bobot untuk kategori
   */
  setWeight(category, weight) {
    this.weights.set(category, weight);
  }

  /**
   * Kalkulasi skor berdasarkan rule-based weights
   */
  calculateScore(results, options = {}) {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const [category, result] of Object.entries(results)) {
      const weight = this.weights.get(category) || 1;
      const score = this._calculateCategoryScore(result);

      totalWeight += weight;
      weightedScore += score * weight;
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      raw: finalScore,
      normalized: Math.round(finalScore),
      category: this._getScoreCategory(finalScore, options.thresholds),
      details: results
    };
  }

  _calculateCategoryScore(result) {
    if (typeof result === 'number') return result;
    if (result?.skor !== undefined) return result.skor;
    if (result?.score !== undefined) return result.score;
    if (result?.completeness !== undefined) return result.completeness;

    // Calculate dari boolean results
    if (Array.isArray(result?.items)) {
      const passed = result.items.filter(i => i.valid !== false).length;
      return (passed / result.items.length) * 100;
    }

    return 0;
  }

  _getScoreCategory(score, thresholds = {}) {
    const t = { excellent: 90, good: 80, fair: 70, poor: 60, ...thresholds };

    if (score >= t.excellent) return 'Excellent';
    if (score >= t.good) return 'Good';
    if (score >= t.fair) return 'Fair';
    if (score >= t.poor) return 'Poor';
    return 'Critical';
  }
}

/**
 * Workflow Orchestrator
 * Lapisan 1-5 dari arsitektur rule-based
 */
export class AIWorkflowOrchestrator {
  constructor(ruleEngine, scoringEngine) {
    this.ruleEngine = ruleEngine || new AIRuleEngine();
    this.scoringEngine = scoringEngine || new AIScoringEngine();
  }

  /**
   * Execute full workflow: AI Extraction -> Validation -> Scoring -> Decision
   */
  async executeWorkflow(aiResult, options = {}) {
    const workflow = {
      timestamp: Date.now(),
      stages: {}
    };

    // Lapisan 1: Normalisasi
    workflow.stages.normalization = this._normalize(aiResult);

    // Lapisan 2: AI Extraction (sudah dari input)
    workflow.stages.extraction = {
      success: true,
      data: aiResult,
      confidence: aiResult.confidence || 0.5
    };

    // Lapisan 3: Validasi Aturan
    workflow.stages.validation = this.ruleEngine.validate(
      workflow.stages.normalization.data,
      options.category || 'CHECKLIST',
      { autoFix: options.autoFix !== false }
    );

    // Lapisan 4: Scoring
    workflow.stages.scoring = this.scoringEngine.calculateScore({
      [options.category || 'CHECKLIST']: workflow.stages.validation
    }, options.scoring);

    // Lapisan 5: Decision
    workflow.stages.decision = this._makeDecision(workflow.stages);

    // Final result
    return {
      approved: workflow.stages.decision.approved,
      confidence: workflow.stages.extraction.confidence,
      score: workflow.stages.scoring.normalized,
      category: workflow.stages.scoring.category,
      data: workflow.stages.normalization.data,
      validation: workflow.stages.validation,
      workflow
    };
  }

  _normalize(data) {
    const normalized = { ...data };

    // Normalize strings
    for (const [key, value] of Object.entries(normalized)) {
      if (typeof value === 'string') {
        normalized[key] = value.trim();
      }
    }

    // Normalize status ke enum yang valid
    const statusMap = {
      'sesuai': 'Sesuai',
      'tidak sesuai': 'Tidak Sesuai',
      'kritis': 'Kritis',
      'perlu review': 'Perlu Review'
    };
    if (normalized.status) {
      normalized.status = statusMap[normalized.status?.toLowerCase()] || normalized.status;
    }

    return {
      success: true,
      data: normalized
    };
  }

  _makeDecision(stages) {
    const validation = stages.validation;
    const scoring = stages.scoring;

    // Decision logic
    const approved =
      validation.valid &&
      scoring.normalized >= 60 &&
      stages.extraction.confidence >= 0.5;

    const requiresReview =
      !validation.valid ||
      validation.warnings.length > 0 ||
      scoring.normalized < 70 ||
      stages.extraction.confidence < 0.7;

    return {
      approved,
      requiresReview,
      reason: approved
        ? 'Validasi lulus dan skor memenuhi threshold'
        : !validation.valid
          ? 'Validasi gagal'
          : scoring.normalized < 60
            ? 'Skor di bawah threshold'
            : 'Confidence rendah'
    };
  }
}

// Singleton instances
let ruleEngineInstance = null;
let scoringEngineInstance = null;
let orchestratorInstance = null;

export function getRuleEngine() {
  if (!ruleEngineInstance) {
    ruleEngineInstance = new AIRuleEngine();
  }
  return ruleEngineInstance;
}

export function getScoringEngine() {
  if (!scoringEngineInstance) {
    scoringEngineInstance = new AIScoringEngine();
  }
  return scoringEngineInstance;
}

export function getWorkflowOrchestrator() {
  if (!orchestratorInstance) {
    orchestratorInstance = new AIWorkflowOrchestrator(
      getRuleEngine(),
      getScoringEngine()
    );
  }
  return orchestratorInstance;
}

export default {
  AIRuleEngine,
  AIScoringEngine,
  AIWorkflowOrchestrator,
  VALIDATION_RULES,
  getRuleEngine,
  getScoringEngine,
  getWorkflowOrchestrator
};
