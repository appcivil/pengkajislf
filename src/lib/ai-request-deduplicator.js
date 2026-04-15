/**
 * AI Request Deduplicator - Production Ready
 * Mencegah duplicate requests dengan identical content
 * @module lib/ai-request-deduplicator
 */

import { getCacheManager } from '../core/smart-ai/cache-manager.js';

/**
 * Request deduplicator dengan multi-tier caching
 */
export class AIRequestDeduplicator {
  constructor(config = {}) {
    this.config = {
      cacheTTL: config.cacheTTL || 5 * 60 * 1000, // 5 menit default
      maxConcurrentRequests: config.maxConcurrentRequests || 10,
      enableMemoryCache: config.enableMemoryCache !== false,
      enablePersistentCache: config.enablePersistentCache !== false,
      ...config
    };
    
    // In-flight requests (memory)
    this.inFlightRequests = new Map();
    
    // Completed results cache (memory)
    this.memoryCache = new Map();
    
    // Cache manager dari smart-ai
    this.cacheManager = null;
    
    // Stats
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      inFlightDeduplications: 0,
      missedRequests: 0
    };
    
    this._initialized = false;
  }

  /**
   * Initialize dengan cache manager
   */
  async initialize() {
    if (this._initialized) return;
    
    try {
      this.cacheManager = getCacheManager({
        persistent: this.config.enablePersistentCache,
        memoryCacheSize: 100
      });
      await this.cacheManager.initialize();
      this._initialized = true;
    } catch (error) {
      console.warn('[AIRequestDeduplicator] Failed to initialize cache manager:', error);
      // Continue without persistent cache
      this._initialized = true;
    }
  }

  /**
   * Generate cache key dari request
   */
  generateCacheKey(prompt, model, options = {}) {
    // Normalisasi prompt untuk konsistensi
    const normalizedPrompt = this._normalizePrompt(prompt);
    
    // Create deterministic key
    const keyData = {
      prompt: normalizedPrompt,
      model: model.id || model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      responseFormat: options.responseFormat
    };
    
    // Simple hash
    const str = JSON.stringify(keyData);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `dedup_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Normalisasi prompt untuk konsistensi cache key
   */
  _normalizePrompt(prompt) {
    if (typeof prompt !== 'string') return JSON.stringify(prompt);
    
    return prompt
      .toLowerCase()
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .replace(/\n+/g, '\n')        // Normalize newlines
      .trim();
  }

  /**
   * Execute dengan deduplication
   */
  async execute(requestFn, prompt, model, options = {}) {
    await this.initialize();
    
    this.stats.totalRequests++;
    
    const cacheKey = this.generateCacheKey(prompt, model, options);
    
    // Check 1: Memory cache (fastest)
    if (this.config.enableMemoryCache) {
      const memoryResult = this.memoryCache.get(cacheKey);
      if (memoryResult && Date.now() - memoryResult.timestamp < this.config.cacheTTL) {
        this.stats.cacheHits++;
        console.log(`[AIRequestDeduplicator] Memory cache hit: ${cacheKey}`);
        return {
          ...memoryResult.data,
          fromCache: 'memory',
          cacheKey
        };
      }
    }
    
    // Check 2: Persistent cache
    if (this.config.enablePersistentCache && this.cacheManager) {
      try {
        const persistentResult = await this.cacheManager.get(cacheKey);
        if (persistentResult) {
          this.stats.cacheHits++;
          // Promote to memory cache
          this.memoryCache.set(cacheKey, {
            data: persistentResult,
            timestamp: Date.now()
          });
          console.log(`[AIRequestDeduplicator] Persistent cache hit: ${cacheKey}`);
          return {
            ...persistentResult,
            fromCache: 'persistent',
            cacheKey
          };
        }
      } catch (error) {
        // Ignore cache errors
      }
    }
    
    // Check 3: In-flight request (deduplication)
    if (this.inFlightRequests.has(cacheKey)) {
      this.stats.inFlightDeduplications++;
      console.log(`[AIRequestDeduplicator] Deduplicating in-flight request: ${cacheKey}`);
      return this.inFlightRequests.get(cacheKey);
    }
    
    // Execute new request
    this.stats.missedRequests++;
    const requestPromise = this._executeRequest(requestFn, cacheKey, prompt, model, options);
    
    // Track in-flight
    this.inFlightRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Cleanup in-flight tracking
      this.inFlightRequests.delete(cacheKey);
    }
  }

  /**
   * Execute actual request
   */
  async _executeRequest(requestFn, cacheKey, prompt, model, options) {
    try {
      const startTime = Date.now();
      const result = await requestFn();
      const responseTime = Date.now() - startTime;
      
      // Add metadata
      const enrichedResult = {
        ...result,
        _metadata: {
          responseTime,
          model: model.id || model,
          timestamp: Date.now(),
          cacheKey
        }
      };
      
      // Cache result
      await this._cacheResult(cacheKey, enrichedResult);
      
      return {
        ...enrichedResult,
        fromCache: false,
        cacheKey
      };
      
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  /**
   * Cache result ke semua tiers
   */
  async _cacheResult(cacheKey, result) {
    // Memory cache
    if (this.config.enableMemoryCache) {
      this.memoryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      // Cleanup old entries jika terlalu banyak
      if (this.memoryCache.size > 100) {
        const oldestKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(oldestKey);
      }
    }
    
    // Persistent cache
    if (this.config.enablePersistentCache && this.cacheManager) {
      try {
        await this.cacheManager.set(cacheKey, result, {
          ttl: this.config.cacheTTL,
          tag: 'ai_dedup'
        });
      } catch (error) {
        console.warn('[AIRequestDeduplicator] Failed to cache to persistent storage:', error);
      }
    }
  }

  /**
   * Pre-warm cache dengan hasil yang sudah diketahui
   */
  async prewarmCache(prompt, model, result, options = {}) {
    await this.initialize();
    
    const cacheKey = this.generateCacheKey(prompt, model, options);
    await this._cacheResult(cacheKey, result);
    
    console.log(`[AIRequestDeduplicator] Cache pre-warmed: ${cacheKey}`);
  }

  /**
   * Invalidate cache
   */
  async invalidate(cacheKey) {
    this.memoryCache.delete(cacheKey);
    
    if (this.cacheManager) {
      try {
        await this.cacheManager.delete(cacheKey);
      } catch (error) {
        console.warn('[AIRequestDeduplicator] Failed to invalidate cache:', error);
      }
    }
  }

  /**
   * Invalidate semua cache
   */
  async invalidateAll() {
    this.memoryCache.clear();
    
    if (this.cacheManager) {
      try {
        await this.cacheManager.clear('ai_dedup');
      } catch (error) {
        console.warn('[AIRequestDeduplicator] Failed to clear cache:', error);
      }
    }
    
    console.log('[AIRequestDeduplicator] All caches invalidated');
  }

  /**
   * Get stats
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      inFlightRequests: this.inFlightRequests.size
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.inFlightRequests.clear();
    this.memoryCache.clear();
    if (this.cacheManager) {
      this.cacheManager.dispose();
    }
    this._initialized = false;
  }
}

/**
 * Batch processor untuk mengelompokkan requests
 */
export class AIBatchProcessor {
  constructor(config = {}) {
    this.config = {
      batchSize: config.batchSize || 5,
      batchTimeout: config.batchTimeout || 100, // ms
      maxConcurrentBatches: config.maxConcurrentBatches || 2,
      ...config
    };
    
    this.pendingRequests = [];
    this.batchTimeoutId = null;
    this.processingBatches = 0;
  }

  /**
   * Add request ke batch
   */
  async add(requestFn, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({
        requestFn,
        metadata,
        resolve,
        reject
      });
      
      // Trigger batch processing
      this._scheduleBatchProcessing();
    });
  }

  /**
   * Schedule batch processing
   */
  _scheduleBatchProcessing() {
    if (this.batchTimeoutId) return;
    
    this.batchTimeoutId = setTimeout(() => {
      this._processBatch();
    }, this.config.batchTimeout);
  }

  /**
   * Process batch
   */
  async _processBatch() {
    this.batchTimeoutId = null;
    
    if (this.pendingRequests.length === 0) return;
    if (this.processingBatches >= this.config.maxConcurrentBatches) {
      // Schedule again
      this._scheduleBatchProcessing();
      return;
    }
    
    // Take batch
    const batch = this.pendingRequests.splice(0, this.config.batchSize);
    this.processingBatches++;
    
    try {
      // Process batch (parallel dengan rate limiting)
      const results = await Promise.allSettled(
        batch.map(item => item.requestFn())
      );
      
      // Resolve individual promises
      results.forEach((result, index) => {
        const item = batch[index];
        if (result.status === 'fulfilled') {
          item.resolve(result.value);
        } else {
          item.reject(result.reason);
        }
      });
      
    } finally {
      this.processingBatches--;
      
      // Process next batch jika masih ada
      if (this.pendingRequests.length > 0) {
        this._scheduleBatchProcessing();
      }
    }
  }

  /**
   * Flush semua pending requests
   */
  async flush() {
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }
    
    while (this.pendingRequests.length > 0) {
      await this._processBatch();
    }
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.length,
      processingBatches: this.processingBatches
    };
  }
}

/**
 * Singleton instances
 */
let deduplicatorInstance = null;
let batchProcessorInstance = null;

export function getAIRequestDeduplicator(config = {}) {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new AIRequestDeduplicator(config);
  }
  return deduplicatorInstance;
}

export function getAIBatchProcessor(config = {}) {
  if (!batchProcessorInstance) {
    batchProcessorInstance = new AIBatchProcessor(config);
  }
  return batchProcessorInstance;
}

export default {
  AIRequestDeduplicator,
  AIBatchProcessor,
  getAIRequestDeduplicator,
  getAIBatchProcessor
};
