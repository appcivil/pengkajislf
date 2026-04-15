/**
 * AI Rate Limit Manager - Production Ready
 * Manages rate limiting, circuit breaker, and provider fallback
 * @module lib/ai-rate-limit-manager
 */

import { MODELS } from './ai-router.js';

/**
 * Circuit Breaker Pattern untuk AI Providers
 * Mencegah cascade failure ketika provider down
 */
export class AICircuitBreaker {
  constructor(provider, config = {}) {
    this.provider = provider;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 menit
      halfOpenMaxCalls: config.halfOpenMaxCalls || 3,
      ...config
    };
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
    this.successes = 0;
  }

  /**
   * Check if circuit allows request
   */
  canExecute() {
    if (this.state === 'CLOSED') return true;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
        console.log(`[CircuitBreaker] ${this.provider} entering HALF_OPEN state`);
        return true;
      }
      return false;
    }
    
    if (this.state === 'HALF_OPEN') {
      return this.halfOpenCalls < this.config.halfOpenMaxCalls;
    }
    
    return false;
  }

  /**
   * Record successful call
   */
  recordSuccess() {
    this.failures = 0;
    this.successes++;
    
    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls / 2) {
        this.state = 'CLOSED';
        console.log(`[CircuitBreaker] ${this.provider} CLOSED (healthy)`);
      }
    }
  }

  /**
   * Record failed call
   */
  recordFailure(error) {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    const isRateLimit = this._isRateLimitError(error);
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      console.log(`[CircuitBreaker] ${this.provider} OPEN (failure in half-open)`);
    } else if (this.failures >= this.config.failureThreshold || isRateLimit) {
      this.state = 'OPEN';
      console.log(`[CircuitBreaker] ${this.provider} OPEN (${isRateLimit ? 'rate limit' : 'threshold reached'})`);
    }
  }

  /**
   * Check if error is rate limit
   */
  _isRateLimitError(error) {
    if (!error) return false;
    const message = error.message || error.toString();
    return message.includes('429') || 
           message.includes('quota') || 
           message.includes('rate limit') ||
           message.includes('too many requests');
  }

  /**
   * Get current state
   */
  getState() {
    return {
      provider: this.provider,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime,
      canExecute: this.canExecute()
    };
  }
}

/**
 * Token Bucket Rate Limiter
 * Implementasi rate limiting yang smooth
 */
export class TokenBucketRateLimiter {
  constructor(config = {}) {
    this.maxTokens = config.maxTokens || 10;
    this.tokensPerSecond = config.tokensPerSecond || 1;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.queue = [];
    this.processing = false;
  }

  /**
   * Acquire tokens with queuing
   */
  async acquire(tokens = 1, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const request = {
        tokens,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.queue.push(request);
      this.queue.sort((a, b) => {
        // Priority: high > normal > low
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.timestamp - b.timestamp;
      });
      
      this._processQueue();
    });
  }

  /**
   * Process queued requests
   */
  async _processQueue() {
    if (this.processing) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      this._refillTokens();
      
      const request = this.queue[0];
      
      if (this.tokens >= request.tokens) {
        this.tokens -= request.tokens;
        this.queue.shift();
        request.resolve();
      } else {
        // Wait for tokens to refill
        const tokensNeeded = request.tokens - this.tokens;
        const waitTime = Math.ceil(tokensNeeded / this.tokensPerSecond * 1000);
        await this._delay(Math.min(waitTime, 1000)); // Max 1 second wait per iteration
      }
    }
    
    this.processing = false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  _refillTokens() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.tokensPerSecond;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Delay helper
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current state
   */
  getState() {
    this._refillTokens();
    return {
      tokens: this.tokens,
      maxTokens: this.maxTokens,
      queueLength: this.queue.length
    };
  }
}

/**
 * AI Provider Registry dengan Fallback Chain
 */
export class AIProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.breakers = new Map();
    this.rateLimiters = new Map();
    this.stats = new Map();
    
    // Default provider chain (priority order) - Gratis model diprioritaskan
    this.fallbackChain = [
      { id: 'groq_llama_4_scout', model: MODELS.GROQ_LLAMA_4_SCOUT, priority: 1 },   // Llama 4 Scout - Latest & gratis
      { id: 'groq_gpt_oss_120b', model: MODELS.GROQ_GPT_OSS_120B, priority: 2 },    // GPT-OSS 120B - Powerful & gratis
      { id: 'groq_reasoning', model: MODELS.GROQ_REASONING, priority: 3 },           // DeepSeek R1 - Advanced reasoning
      { id: 'groq', model: MODELS.GROQ, priority: 4 },                                // Llama 3.3 70B - Cepat & capable
      { id: 'groq_vision', model: MODELS.GROQ_VISION, priority: 5 },                  // Llama 3.2 90B Vision - Multimodal
      { id: 'groq_qwen_32b', model: MODELS.GROQ_QWEN_32B, priority: 6 },              // Qwen 3 32B - Multilingual
      { id: 'groq_gpt_oss_20b', model: MODELS.GROQ_GPT_OSS_20B, priority: 7 },        // GPT-OSS 20B - Lightweight
      { id: 'kimi', model: MODELS.KIMI, priority: 8 },                              // Moonshot - Gratis
      { id: 'kimi_32k', model: MODELS.KIMI_32K, priority: 9 },                        // Moonshot 32K - Gratis
      { id: 'gemini_flash', model: MODELS.GEMINI_FLASH, priority: 10 },               // Gemini Flash - Murah
      { id: 'mistral', model: MODELS.MISTRAL, priority: 11 },                         // Mistral
      { id: 'openrouter', model: MODELS.OPENROUTER, priority: 12 }                    // OpenRouter fallback
    ];
    
    this._initializeProviders();
  }

  /**
   * Initialize all providers
   */
  _initializeProviders() {
    for (const provider of this.fallbackChain) {
      // Circuit breaker untuk tiap provider
      this.breakers.set(provider.id, new AICircuitBreaker(provider.id, {
        failureThreshold: 3,
        resetTimeout: 30000 // 30 detik untuk rate limit
      }));
      
      // Rate limiter per provider
      this.rateLimiters.set(provider.id, new TokenBucketRateLimiter({
        maxTokens: provider.id.includes('kimi') ? 3 : 10, // Kimi lebih ketat
        tokensPerSecond: provider.id.includes('kimi') ? 0.5 : 2
      }));
      
      // Stats tracking
      this.stats.set(provider.id, {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageResponseTime: 0,
        lastUsed: 0
      });
    }
  }

  /**
   * Get available provider dengan fallback
   */
  async getAvailableProvider(preferredProvider = null) {
    // Jika preferred provider specified dan healthy, gunakan itu
    if (preferredProvider) {
      const breaker = this.breakers.get(preferredProvider);
      if (breaker && breaker.canExecute()) {
        return this._getProviderConfig(preferredProvider);
      }
    }
    
    // Cari provider yang available berdasarkan priority
    for (const provider of this.fallbackChain) {
      const breaker = this.breakers.get(provider.id);
      
      if (breaker && breaker.canExecute()) {
        return this._getProviderConfig(provider.id);
      }
    }
    
    // All providers down - return first one dengan warning
    console.warn('[AIProviderRegistry] All providers in OPEN state, using first available');
    return this._getProviderConfig(this.fallbackChain[0].id);
  }

  /**
   * Get provider config
   */
  _getProviderConfig(providerId) {
    const chainItem = this.fallbackChain.find(p => p.id === providerId);
    if (!chainItem) return null;
    
    return {
      id: providerId,
      model: chainItem.model,
      breaker: this.breakers.get(providerId),
      rateLimiter: this.rateLimiters.get(providerId),
      stats: this.stats.get(providerId)
    };
  }

  /**
   * Execute with fallback
   */
  async executeWithFallback(callFn, options = {}) {
    const errors = [];
    const attemptedProviders = [];
    
    // Dapatkan daftar provider yang akan dicoba
    const providersToTry = options.preferredProvider 
      ? [options.preferredProvider, ...this.fallbackChain.map(p => p.id).filter(id => id !== options.preferredProvider)]
      : this.fallbackChain.map(p => p.id);
    
    for (const providerId of providersToTry) {
      const provider = this._getProviderConfig(providerId);
      
      if (!provider || !provider.breaker.canExecute()) {
        continue;
      }
      
      attemptedProviders.push(providerId);
      
      try {
        // Wait for rate limiter
        await provider.rateLimiter.acquire(1, options.priority || 'normal');
        
        // Execute call
        const startTime = Date.now();
        const result = await callFn(provider.model);
        const responseTime = Date.now() - startTime;
        
        // Record success
        provider.breaker.recordSuccess();
        this._updateStats(providerId, true, responseTime);
        
        return {
          success: true,
          result,
          provider: providerId,
          responseTime,
          fallbackUsed: attemptedProviders.length > 1
        };
        
      } catch (error) {
        // Record failure
        provider.breaker.recordFailure(error);
        this._updateStats(providerId, false, 0);
        
        errors.push({
          provider: providerId,
          error: error.message,
          isRateLimit: error.message?.includes('429') || error.message?.includes('quota')
        });
        
        // Jika bukan rate limit, dan ada provider lain, lanjut
        continue;
      }
    }
    
    // All providers failed
    throw new Error(`All AI providers failed. Attempted: ${attemptedProviders.join(', ')}. Errors: ${JSON.stringify(errors)}`);
  }

  /**
   * Update provider stats
   */
  _updateStats(providerId, success, responseTime) {
    const stats = this.stats.get(providerId);
    if (!stats) return;
    
    stats.totalCalls++;
    stats.lastUsed = Date.now();
    
    if (success) {
      stats.successfulCalls++;
      // Update average response time
      stats.averageResponseTime = 
        ((stats.averageResponseTime * (stats.successfulCalls - 1)) + responseTime) / 
        stats.successfulCalls;
    } else {
      stats.failedCalls++;
    }
  }

  /**
   * Get all provider states
   */
  getAllStates() {
    const states = {};
    for (const [id, breaker] of this.breakers) {
      states[id] = {
        circuitBreaker: breaker.getState(),
        rateLimiter: this.rateLimiters.get(id)?.getState(),
        stats: this.stats.get(id)
      };
    }
    return states;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const states = this.getAllStates();
    const healthy = Object.values(states).filter(s => s.circuitBreaker.state === 'CLOSED').length;
    const degraded = Object.values(states).filter(s => s.circuitBreaker.state === 'HALF_OPEN').length;
    const unhealthy = Object.values(states).filter(s => s.circuitBreaker.state === 'OPEN').length;
    
    return {
      overall: unhealthy === 0 ? 'healthy' : (unhealthy >= Object.keys(states).length / 2 ? 'critical' : 'degraded'),
      healthy,
      degraded,
      unhealthy,
      total: Object.keys(states).length,
      providers: states
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      breaker.halfOpenCalls = 0;
    }
    console.log('[AIProviderRegistry] All circuit breakers reset');
  }
}

/**
 * Singleton instance
 */
let providerRegistryInstance = null;

export function getAIProviderRegistry() {
  if (!providerRegistryInstance) {
    providerRegistryInstance = new AIProviderRegistry();
  }
  return providerRegistryInstance;
}

export default {
  AICircuitBreaker,
  TokenBucketRateLimiter,
  AIProviderRegistry,
  getAIProviderRegistry
};
