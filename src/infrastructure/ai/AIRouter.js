// ============================================================
// AI ROUTER - Consolidated AI Service Router
// Menggantikan ai-router.js dan ai-router-anti-rate-limit.js
// Dengan rate limiting terintegrasi dan proper error handling
// ============================================================

import { supabase } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';
import { AIServiceError } from '../../domain/errors/DomainError.js';

// Model Registry dengan metadata lengkap
export const AI_MODELS = {
  // Kimi Family
  KIMI: {
    id: 'moonshot-v1-8k',
    name: 'Kimi (Moonshot)',
    provider: 'kimi',
    type: 'text',
    costTier: 'free',
    maxTokens: 8192,
    contextWindow: 8000,
    recommended: true
  },
  KIMI_32K: {
    id: 'moonshot-v1-32k',
    name: 'Kimi 32K',
    provider: 'kimi',
    type: 'text',
    costTier: 'free',
    maxTokens: 32768,
    contextWindow: 32000
  },
  KIMI_128K: {
    id: 'moonshot-v1-128k',
    name: 'Kimi 128K',
    provider: 'kimi',
    type: 'text',
    costTier: 'free',
    maxTokens: 128000,
    contextWindow: 128000
  },

  // Gemini Family
  GEMINI_FLASH: {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    type: 'text',
    costTier: 'low',
    maxTokens: 8192
  },
  GEMINI_PRO: {
    id: 'gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    type: 'text',
    costTier: 'medium',
    maxTokens: 8192
  },

  // OpenRouter Models
  CLAUDE_SONNET: {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    type: 'text',
    costTier: 'medium',
    maxTokens: 8192
  },
  GPT4O: {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openrouter',
    type: 'text',
    costTier: 'high',
    maxTokens: 4096
  }
};

// Rate Limiting Configuration
const RATE_LIMITS = {
  kimi: { requestsPerMinute: 30, cooldownMs: 2000 },
  gemini: { requestsPerMinute: 60, cooldownMs: 1000 },
  openrouter: { requestsPerMinute: 20, cooldownMs: 3000 },
  default: { requestsPerMinute: 30, cooldownMs: 2000 }
};

class RateLimiter {
  constructor() {
    this.requestLog = new Map();
  }

  canMakeRequest(provider) {
    const now = Date.now();
    const limits = RATE_LIMITS[provider] || RATE_LIMITS.default;
    const log = this.requestLog.get(provider) || [];

    // Clean old entries
    const cutoff = now - 60000; // 1 minute
    const recent = log.filter(timestamp => timestamp > cutoff);

    if (recent.length >= limits.requestsPerMinute) {
      const oldest = recent[0];
      const waitTime = 60000 - (now - oldest);
      return { allowed: false, waitTime };
    }

    return { allowed: true, waitTime: 0 };
  }

  recordRequest(provider) {
    const log = this.requestLog.get(provider) || [];
    log.push(Date.now());
    this.requestLog.set(provider, log);
  }

  getWaitTime(provider) {
    const check = this.canMakeRequest(provider);
    return check.waitTime;
  }
}

class RequestDeduplicator {
  constructor() {
    this.pending = new Map();
    this.cache = new Map();
    this.cacheTtl = 5 * 60 * 1000; // 5 minutes
  }

  getCacheKey(prompt, model) {
    return `${model}:${this.hashString(prompt)}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTtl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCached(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  getPending(key) {
    return this.pending.get(key);
  }

  setPending(key, promise) {
    this.pending.set(key, promise);
    promise.finally(() => {
      this.pending.delete(key);
    });
  }
}

export class AIRouter {
  constructor() {
    this.rateLimiter = new RateLimiter();
    this.deduplicator = new RequestDeduplicator();
    this.logger = logger;
    this.proxyUrl = import.meta.env.VITE_AI_PROXY_URL || '';
    this.useProxy = import.meta.env.PROD && !!this.proxyUrl;
  }

  async generate(prompt, options = {}) {
    const {
      model = 'KIMI',
      temperature = 0.7,
      maxTokens,
      stream = false,
      deduplicate = true,
      cache = true
    } = options;

    const modelConfig = AI_MODELS[model] || AI_MODELS.KIMI;
    const cacheKey = this.deduplicator.getCacheKey(prompt, model);

    try {
      // Check cache
      if (cache) {
        const cached = this.deduplicator.getCached(cacheKey);
        if (cached) {
          this.logger.debug(`[AI Router] Cache hit for model ${model}`);
          return cached;
        }
      }

      // Check deduplication
      if (deduplicate) {
        const pending = this.deduplicator.getPending(cacheKey);
        if (pending) {
          this.logger.debug(`[AI Router] Deduplicating request for model ${model}`);
          return await pending;
        }
      }

      // Rate limiting
      const rateCheck = this.rateLimiter.canMakeRequest(modelConfig.provider);
      if (!rateCheck.allowed) {
        this.logger.warn(`[AI Router] Rate limit hit for ${modelConfig.provider}, waiting ${rateCheck.waitTime}ms`);
        await this.delay(rateCheck.waitTime);
      }

      // Create request promise
      const requestPromise = this.executeRequest(prompt, modelConfig, { temperature, maxTokens, stream });

      if (deduplicate) {
        this.deduplicator.setPending(cacheKey, requestPromise);
      }

      const result = await requestPromise;

      // Cache result
      if (cache) {
        this.deduplicator.setCached(cacheKey, result);
      }

      return result;

    } catch (error) {
      this.logger.error(`[AI Router] Request failed:`, error);
      throw new AIServiceError(
        `AI request failed: ${error.message}`,
        modelConfig.provider,
        { model, promptLength: prompt.length }
      );
    }
  }

  async executeRequest(prompt, modelConfig, options) {
    this.rateLimiter.recordRequest(modelConfig.provider);

    if (this.useProxy) {
      return this.executeViaProxy(prompt, modelConfig, options);
    } else {
      return this.executeDirect(prompt, modelConfig, options);
    }
  }

  async executeViaProxy(prompt, modelConfig, options) {
    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
      },
      body: JSON.stringify({
        provider: modelConfig.provider,
        model: modelConfig.id,
        prompt,
        temperature: options.temperature,
        max_tokens: options.maxTokens || modelConfig.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeResponse(data, modelConfig.provider);
  }

  async executeDirect(prompt, modelConfig, options) {
    // Direct API call (development only)
    const endpoints = {
      kimi: 'https://api.moonshot.ai/v1/chat/completions',
      gemini: `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent`,
      openrouter: 'https://openrouter.ai/api/v1/chat/completions'
    };

    const apiKey = this.getApiKey(modelConfig.provider);
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${modelConfig.provider}`);
    }

    const response = await fetch(endpoints[modelConfig.provider], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(this.buildRequestBody(prompt, modelConfig, options))
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeResponse(data, modelConfig.provider);
  }

  buildRequestBody(prompt, modelConfig, options) {
    const base = {
      model: modelConfig.id,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature,
      max_tokens: options.maxTokens || modelConfig.maxTokens
    };

    if (modelConfig.provider === 'gemini') {
      return {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens || modelConfig.maxTokens
        }
      };
    }

    return base;
  }

  normalizeResponse(data, provider) {
    switch (provider) {
      case 'gemini':
        return {
          text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
          usage: data.usageMetadata,
          provider
        };
      case 'kimi':
      case 'openrouter':
      default:
        return {
          text: data.choices?.[0]?.message?.content || data.text || '',
          usage: data.usage,
          provider
        };
    }
  }

  getApiKey(provider) {
    const keys = {
      kimi: import.meta.env.VITE_KIMI_API_KEY,
      gemini: import.meta.env.VITE_GEMINI_API_KEY,
      openrouter: import.meta.env.VITE_OPENROUTER_API_KEY
    };
    return keys[provider];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods
  getAvailableModels() {
    return Object.entries(AI_MODELS).map(([key, config]) => ({
      key,
      ...config
    }));
  }

  getRecommendedModel() {
    const entry = Object.entries(AI_MODELS).find(([_, config]) => config.recommended);
    return entry ? entry[0] : 'KIMI';
  }

  getRateLimitStatus(provider) {
    return {
      canRequest: this.rateLimiter.canMakeRequest(provider).allowed,
      waitTime: this.rateLimiter.getWaitTime(provider)
    };
  }

  clearCache() {
    this.deduplicator.cache.clear();
    this.logger.info('[AI Router] Cache cleared');
  }
}

// Singleton instance
export const aiRouter = new AIRouter();

// Convenience exports
export const generateAI = (prompt, options) => aiRouter.generate(prompt, options);
export const getAIModels = () => aiRouter.getAvailableModels();
export const getRecommendedAIModel = () => aiRouter.getRecommendedModel();

export default aiRouter;
