/**
 * AI Router Engine
 * Routing query ke model AI yang tepat berdasarkan kompleksitas dan konteks
 * Strategi: ringan → klasifikasi, sedang → ekstraksi, berat → reasoning
 * @module infrastructure/pipeline/engines/ai-router-engine
 */

import { IEngine } from '../../../core/smart-ai/engine-interface.js';

/**
 * Engine untuk routing AI model dengan tiered strategy
 */
export class AIRouterEngine extends IEngine {
  constructor(config = {}) {
    super('AIRouterEngine', config);
    
    this.supportedTypes = ['query', 'classification', 'extraction', 'reasoning'];
    
    // Model tiers
    this.tiers = {
      light: config.lightModel || 'gpt-3.5-turbo',      // Klasifikasi sederhana
      medium: config.mediumModel || 'gpt-4',            // Ekstraksi struktur
      heavy: config.heavyModel || 'gpt-4-turbo',        // Reasoning kompleks
      vision: config.visionModel || 'gpt-4-vision'       // Vision tasks
    };
    
    // Cost tracking (per 1K tokens)
    this.costs = {
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4-vision': { input: 0.01, output: 0.03 }
    };
    
    // Thresholds untuk routing
    this.thresholds = {
      classification: { maxTokens: 500, complexity: 'low' },
      extraction: { maxTokens: 2000, complexity: 'medium' },
      reasoning: { maxTokens: 4000, complexity: 'high' }
    };
    
    // External AI service (akan diinject)
    this.aiService = config.aiService || null;
    
    // Stats
    this.stats = {
      totalCalls: 0,
      callsByTier: {},
      estimatedCost: 0,
      cacheHits: 0
    };
  }

  /**
   * Inisialisasi engine
   * @returns {Promise<boolean>}
   */
  async initialize() {
    this.isInitialized = true;
    return true;
  }

  /**
   * Analisis query untuk menentukan kompleksitas dan tier
   * @param {string} query - User query
   * @param {Object} context - Konteks tambahan
   * @returns {Object} Analisis kompleksitas
   */
  analyzeQuery(query, context = {}) {
    const analysis = {
      complexity: 'medium',
      tier: 'medium',
      estimatedTokens: 0,
      taskType: 'general',
      reasons: []
    };

    // 1. Analisis panjang query
    const queryLength = query.length;
    const wordCount = query.split(/\s+/).length;
    
    if (queryLength > 2000 || wordCount > 300) {
      analysis.complexity = 'high';
      analysis.reasons.push('Query panjang dan kompleks');
    } else if (queryLength < 100 || wordCount < 20) {
      analysis.complexity = 'low';
      analysis.reasons.push('Query singkat sederhana');
    }

    // 2. Deteksi task type dari keywords
    const keywords = this._extractKeywords(query);
    
    // Classification patterns
    if (/\b(apa|siapa|dimana|kapan|bagaimana|mengapa|kenapa)\b/i.test(query) && 
        wordCount < 30 && !query.includes('jelaskan') && !query.includes('analisis')) {
      analysis.taskType = 'classification';
      analysis.complexity = 'low';
      analysis.reasons.push('Pertanyaan factual sederhana');
    }
    
    // Extraction patterns
    if (/\b(ekstrak|extract|ambil|dapatkan|list|daftar|tabel)\b/i.test(query) ||
        context.hasDocuments || context.hasTables) {
      analysis.taskType = 'extraction';
      analysis.complexity = 'medium';
      analysis.reasons.push('Task ekstraksi data');
    }
    
    // Reasoning patterns
    if (/\b(analisis|evaluasi|bandingkan|bandingkan|kenapa|sebab|akibat|strategi|rekomendasi|saran)\b/i.test(query) ||
        queryLength > 500 ||
        context.requiresCalculation ||
        context.multiStep) {
      analysis.taskType = 'reasoning';
      analysis.complexity = 'high';
      analysis.reasons.push('Memerlukan analisis dan reasoning');
    }

    // Vision patterns
    if (context.hasImages || context.hasScreenshots) {
      analysis.taskType = 'vision';
      analysis.tier = 'vision';
      analysis.reasons.push('Vision task dengan gambar');
      return analysis;
    }

    // 3. Estimasi tokens (rough approximation: 1 token ≈ 4 chars)
    const contextLength = context.text ? context.text.length : 0;
    analysis.estimatedTokens = Math.ceil((queryLength + contextLength) / 4) + 500; // +500 for response

    // 4. Determine tier
    switch (analysis.complexity) {
      case 'low':
        analysis.tier = 'light';
        break;
      case 'high':
        analysis.tier = analysis.estimatedTokens > 8000 ? 'heavy' : 'medium';
        break;
      default:
        analysis.tier = 'medium';
    }

    // Override jika konteks besar
    if (contextLength > 10000) {
      analysis.tier = 'heavy';
      analysis.reasons.push('Konteks besar memerlukan model kuat');
    }

    return analysis;
  }

  /**
   * Route dan execute AI call
   * @param {string} query - User query
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async process(query, options = {}) {
    await this.initialize();

    const analysis = this.analyzeQuery(query, options.context || {});
    const model = this.tiers[analysis.tier];
    
    // Build prompt
    const prompt = this._buildPrompt(query, options.context, analysis.taskType);
    
    // Check cache jika diaktifkan
    if (options.useCache !== false) {
      const cacheKey = this._generateCacheKey(prompt, model);
      // Cache check akan diimplementasikan via cache-manager
    }

    // Execute AI call
    const result = await this._executeAICall(prompt, model, analysis, options);
    
    // Update stats
    this.stats.totalCalls++;
    this.stats.callsByTier[analysis.tier] = (this.stats.callsByTier[analysis.tier] || 0) + 1;
    this.stats.estimatedCost += this._estimateCost(result.usage, model);

    return {
      success: true,
      analysis,
      model,
      result: result.text,
      structured: result.structured,
      usage: result.usage,
      cost: this._estimateCost(result.usage, model)
    };
  }

  /**
   * Execute AI call (placeholder - akan menggunakan AI service eksternal)
   * @private
   */
  async _executeAICall(prompt, model, analysis, options) {
    // Jika ada AI service yang diinject, gunakan itu
    if (this.aiService && typeof this.aiService.generate === 'function') {
      return await this.aiService.generate(prompt, {
        model,
        temperature: options.temperature || this._getTemperature(analysis.taskType),
        maxTokens: options.maxTokens || this._getMaxTokens(analysis.tier),
        responseFormat: options.responseFormat
      });
    }

    // Placeholder response untuk development
    return {
      text: `[AI Response Placeholder] Tier: ${analysis.tier}, Model: ${model}`,
      structured: null,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 500,
        totalTokens: Math.ceil(prompt.length / 4) + 500
      }
    };
  }

  /**
   * Build prompt berdasarkan task type
   * @private
   */
  _buildPrompt(query, context, taskType) {
    const basePrompt = query;
    
    switch (taskType) {
      case 'classification':
        return `Klasifikasikan pertanyaan berikut dan berikan jawaban singkat:\n${basePrompt}`;
      
      case 'extraction':
        return `Ekstrak informasi yang diminta dari konteks berikut:\n\nKonteks:\n${context?.text || ''}\n\nPertanyaan: ${basePrompt}\n\nBerikan hasil dalam format terstruktur.`;
      
      case 'reasoning':
        return `Analisis pertanyaan berikut secara mendalam:\n\n${basePrompt}\n\n${context?.text ? `Konteks:\n${context.text}\n\n` : ''}Berikan analisis langkah demi langkah dengan justifikasi.`;
      
      default:
        return basePrompt;
    }
  }

  /**
   * Extract keywords dari query
   * @private
   */
  _extractKeywords(text) {
    const stopWords = new Set(['yang', 'dan', 'atau', 'dengan', 'untuk', 'dari', 'pada', 'dalam', 'ke', 'di']);
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
  }

  /**
   * Get temperature berdasarkan task type
   * @private
   */
  _getTemperature(taskType) {
    switch (taskType) {
      case 'classification': return 0.1;
      case 'extraction': return 0.2;
      case 'reasoning': return 0.7;
      default: return 0.5;
    }
  }

  /**
   * Get max tokens berdasarkan tier
   * @private
   */
  _getMaxTokens(tier) {
    switch (tier) {
      case 'light': return 1000;
      case 'medium': return 2000;
      case 'heavy': return 4000;
      case 'vision': return 2000;
      default: return 2000;
    }
  }

  /**
   * Estimate cost dari usage
   * @private
   */
  _estimateCost(usage, model) {
    if (!usage || !this.costs[model]) return 0;
    
    const costs = this.costs[model];
    const inputCost = (usage.promptTokens / 1000) * costs.input;
    const outputCost = (usage.completionTokens / 1000) * costs.output;
    
    return inputCost + outputCost;
  }

  /**
   * Generate cache key
   * @private
   */
  _generateCacheKey(prompt, model) {
    // Simple hash
    let hash = 0;
    const str = prompt + model;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `ai_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get routing stats
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      averageCostPerCall: this.stats.totalCalls > 0 
        ? this.stats.estimatedCost / this.stats.totalCalls 
        : 0
    };
  }

  /**
   * Register AI service
   * @param {Object} service - AI service dengan method generate()
   */
  registerAIService(service) {
    this.aiService = service;
  }

  /**
   * Update tier configuration
   * @param {string} tier - Tier name
   * @param {string} model - Model name
   */
  updateTier(tier, model) {
    if (this.tiers[tier]) {
      this.tiers[tier] = model;
    }
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    this.aiService = null;
    this.isInitialized = false;
  }
}

export default AIRouterEngine;
