/**
 * AI ANTI-RATE LIMIT INTEGRATION
 * Modul terintegrasi untuk migrasi dari service lama ke sistem anti-rate-limit
 * Menyediakan API yang kompatibel dengan service lama namun dengan proteksi rate limit
 *
 * @module lib/ai-anti-rate-limit-integration
 */

import {
  analyzeWithAntiRateLimit,
  analyzeBatchWithAntiRateLimit,
  checkAIHealth,
  callAIWithFallback,
  executeAIBatch
} from './ai-rate-limit-index.js';

import {
  CHECKLIST_ANALYSIS_SCHEMA,
  DOCUMENT_ANALYSIS_SCHEMA,
  callAIWithStructuredOutput,
  validateStructuredOutput
} from './ai-structured-output-schema.js';

import {
  getRuleEngine,
  getWorkflowOrchestrator,
  VALIDATION_RULES
} from './ai-rule-engine.js';

import { MODELS, getDefaultModel, GEMINI_ROUTER } from './ai-router.js';

/**
 * Checklist Analyzer dengan Anti-Rate Limit
 * Wrapper yang kompatibel dengan API lama namun dengan proteksi modern
 */
export class AntiRateLimitChecklistAnalyzer {
  constructor(options = {}) {
    this.options = {
      maxConcurrency: options.maxConcurrency || 2,
      batchSize: options.batchSize || 3,
      enableStructuredOutput: options.enableStructuredOutput !== false,
      enableRuleValidation: options.enableRuleValidation !== false,
      autoFix: options.autoFix !== false,
      ...options
    };

    this.ruleEngine = getRuleEngine();
    this.workflowOrchestrator = getWorkflowOrchestrator();

    // Stats untuk monitoring
    this.stats = {
      totalAnalyses: 0,
      cacheHits: 0,
      rateLimitAvoided: 0,
      validationFailures: 0,
      autoFixesApplied: 0
    };
  }

  /**
   * Analisis single item dengan proteksi lengkap
   * API Compatible dengan analyzeChecklistItem lama
   */
  async analyzeItem(item, aspek, options = {}) {
    const startTime = Date.now();
    this.stats.totalAnalyses++;

    try {
      // Step 1: Analisis dengan anti-rate limit
      const aiResult = await analyzeWithAntiRateLimit(item, aspek, {
        ...this.options,
        ...options
      });

      // Step 2: Structured output validation (jika enabled)
      let structuredResult = aiResult;
      if (this.options.enableStructuredOutput && aiResult.result) {
        const validation = validateStructuredOutput(
          aiResult.result,
          CHECKLIST_ANALYSIS_SCHEMA
        );

        if (!validation.valid) {
          this.stats.validationFailures++;
          console.warn('[ChecklistAnalyzer] Validation failed:', validation.errors);
        }
      }

      // Step 3: Rule-based validation (jika enabled)
      let finalResult = structuredResult.result || structuredResult;
      if (this.options.enableRuleValidation) {
        const workflow = await this.workflowOrchestrator.executeWorkflow(
          finalResult,
          {
            category: 'CHECKLIST',
            autoFix: this.options.autoFix
          }
        );

        if (workflow.autoFixes?.length > 0) {
          this.stats.autoFixesApplied += workflow.autoFixes.length;
        }

        finalResult = workflow.data;
      }

      const endTime = Date.now();

      return {
        success: true,
        result: finalResult,
        _meta: {
          responseTime: endTime - startTime,
          provider: aiResult.provider || 'unknown',
          fromCache: aiResult.fromCache || false,
          validated: this.options.enableRuleValidation,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('[ChecklistAnalyzer] Analysis failed:', error);

      // Fallback result
      return {
        success: false,
        result: null,
        error: error.message,
        _meta: {
          responseTime: Date.now() - startTime,
          fallback: true
        }
      };
    }
  }

  /**
   * Batch analysis dengan queue dan rate limiting
   * API Compatible dengan runBatchSmartEngine lama
   */
  async analyzeBatch(items, aspek, onProgress, options = {}) {
    const startTime = Date.now();
    const results = [];

    try {
      // Pre-check AI health
      const health = await checkAIHealth();
      console.log('[ChecklistAnalyzer] AI Health:', health.providers?.overall);

      // Gunakan batch processing dengan anti-rate limit
      const batchOptions = {
        ...this.options,
        ...options,
        continueOnError: true
      };

      const batchResults = await analyzeBatchWithAntiRateLimit(
        items,
        aspek,
        batchOptions
      );

      // Process setiap hasil dengan validasi
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rawResult = batchResults.results?.[i];
        const error = batchResults.errors?.[i];

        if (rawResult && rawResult.success) {
          // Validate dan fix jika perlu
          let finalResult = rawResult.result;

          if (this.options.enableRuleValidation) {
            const workflow = await this.workflowOrchestrator.executeWorkflow(
              finalResult,
              { category: 'CHECKLIST', autoFix: this.options.autoFix }
            );
            finalResult = workflow.data;
          }

          results.push({
            kode: item.kode,
            nama: item.nama,
            ...finalResult,
            _meta: {
              provider: rawResult.provider,
              fromCache: rawResult.fromCache,
              responseTime: rawResult.responseTime,
              batchIndex: i
            }
          });
        } else {
          // Fallback untuk item yang gagal
          results.push({
            kode: item.kode,
            nama: item.nama,
            status: 'Perlu Review',
            faktual: item.catatan || 'Data tidak tersedia',
            analisis: `Analisis gagal: ${error || 'Unknown error'}`,
            risiko: 'Sedang',
            rekomendasi: 'Periksa kembali data teknis dan lakukan analisis manual',
            confidence: 0,
            _meta: {
              error: error || 'Unknown error',
              fallback: true
            }
          });
        }

        // Progress callback
        if (onProgress) {
          onProgress(i + 1, items.length, results[i]);
        }
      }

      const endTime = Date.now();
      const fromCache = results.filter(r => r._meta?.fromCache).length;

      return {
        results,
        summary: {
          total: items.length,
          success: results.filter(r => !r._meta?.error).length,
          failed: results.filter(r => r._meta?.error).length,
          fromCache,
          totalTime: endTime - startTime,
          avgTimePerItem: ((endTime - startTime) / items.length).toFixed(0)
        },
        stats: this.stats
      };

    } catch (error) {
      console.error('[ChecklistAnalyzer] Batch analysis failed:', error);

      // Return fallback untuk semua items
      const fallbackResults = items.map(item => ({
        kode: item.kode,
        nama: item.nama,
        status: 'Perlu Review',
        faktual: item.catatan || 'Data tidak tersedia',
        analisis: 'Batch analysis gagal, diperlukan review manual',
        risiko: 'Sedang',
        rekomendasi: 'Lakukan analisis manual',
        confidence: 0,
        _meta: { error: error.message, batchFailed: true }
      }));

      return {
        results: fallbackResults,
        summary: {
          total: items.length,
          success: 0,
          failed: items.length,
          fromCache: 0,
          totalTime: Date.now() - startTime,
          error: error.message
        },
        stats: this.stats
      };
    }
  }

  /**
   * Health check untuk monitoring
   */
  async getHealth() {
    const aiHealth = await checkAIHealth();
    const ruleStats = this.ruleEngine.getStats();

    return {
      ai: aiHealth,
      analyzer: {
        stats: this.stats,
        ruleEngine: ruleStats,
        options: this.options
      },
      status: this._determineOverallStatus(aiHealth, this.stats)
    };
  }

  _determineOverallStatus(aiHealth, stats) {
    if (aiHealth.providers?.overall === 'critical') return 'critical';
    if (aiHealth.providers?.overall === 'degraded') return 'degraded';
    if (stats.validationFailures > stats.totalAnalyses * 0.3) return 'degraded';
    return 'healthy';
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.stats = {
      totalAnalyses: 0,
      cacheHits: 0,
      rateLimitAvoided: 0,
      validationFailures: 0,
      autoFixesApplied: 0
    };
  }
}

/**
 * Document Analyzer dengan Anti-Rate Limit
 * Untuk analisis dokumen dan berkas
 */
export class AntiRateLimitDocumentAnalyzer {
  constructor(options = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      enableStructuredOutput: options.enableStructuredOutput !== false,
      schema: options.schema || DOCUMENT_ANALYSIS_SCHEMA,
      ...options
    };

    this.workflowOrchestrator = getWorkflowOrchestrator();
  }

  /**
   * Analyze document dengan structured output dan retry
   */
  async analyze(document, options = {}) {
    const schema = options.schema || this.options.schema;

    const result = await callAIWithStructuredOutput(
      async () => {
        // Simulasi AI call - replace dengan actual implementation
        const prompt = this._buildDocumentPrompt(document);
        return await callAIWithFallback(prompt, options);
      },
      schema,
      { maxRetries: this.options.maxRetries }
    );

    if (result.success) {
      // Run through workflow orchestrator
      const workflow = await this.workflowOrchestrator.executeWorkflow(
        result.data,
        { category: 'DOCUMENT' }
      );

      return {
        success: true,
        data: workflow.data,
        approved: workflow.approved,
        confidence: workflow.confidence,
        validation: workflow.validation
      };
    }

    return {
      success: false,
      error: result.error,
      validationErrors: result.validationErrors
    };
  }

  _buildDocumentPrompt(document) {
    return {
      system: 'Anda adalah sistem analisis dokumen untuk Sertifikat Laik Fungsi.',
      instructions: `Analisis dokumen: ${document.nama}`,
      context: `Kategori: ${document.kategori || 'Unknown'}`,
      input: JSON.stringify(document)
    };
  }
}

/**
 * Migration helper dari service lama
 * Memudahkan transisi tanpa breaking changes
 */
export function createCompatibleAnalyzer(type = 'checklist', options = {}) {
  switch (type) {
    case 'checklist':
      return new AntiRateLimitChecklistAnalyzer(options);
    case 'document':
      return new AntiRateLimitDocumentAnalyzer(options);
    default:
      throw new Error(`Unknown analyzer type: ${type}`);
  }
}

/**
 * Quick migration untuk file lama
 * Fungsi yang langsung mengganti import lama
 */
export function migrateLegacyImport(legacyModule) {
  // Return compatible API wrapper
  return {
    // Legacy API methods mapped to new implementation
    analyzeChecklistItem: async (item, aspek, options) => {
      const analyzer = createCompatibleAnalyzer('checklist', options);
      return await analyzer.analyzeItem(item, aspek, options);
    },

    analyzeChecklistBatch: async (items, aspek, onProgress, options) => {
      const analyzer = createCompatibleAnalyzer('checklist', options);
      return await analyzer.analyzeBatch(items, aspek, onProgress, options);
    },

    // New methods
    getHealth: checkAIHealth,
    createAnalyzer: createCompatibleAnalyzer
  };
}

// Export semua komponen
export {
  MODELS,
  getDefaultModel,
  GEMINI_ROUTER,
  CHECKLIST_ANALYSIS_SCHEMA,
  DOCUMENT_ANALYSIS_SCHEMA,
  getRuleEngine,
  getWorkflowOrchestrator,
  VALIDATION_RULES
};

// Default export untuk convenience
export default {
  AntiRateLimitChecklistAnalyzer,
  AntiRateLimitDocumentAnalyzer,
  createCompatibleAnalyzer,
  migrateLegacyImport,
  checkAIHealth,
  MODELS,
  getDefaultModel,
  getRuleEngine,
  getWorkflowOrchestrator
};
