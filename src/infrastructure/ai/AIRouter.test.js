import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIRouter, AI_MODELS, generateAI, aiRouter } from './AIRouter.js';

describe('AIRouter', () => {
  let router;

  beforeEach(() => {
    router = new AIRouter();
    vi.clearAllMocks();
  });

  describe('AI_MODELS', () => {
    it('should have KIMI model defined', () => {
      expect(AI_MODELS.KIMI).toBeDefined();
      expect(AI_MODELS.KIMI.id).toBe('moonshot-v1-8k');
      expect(AI_MODELS.KIMI.recommended).toBe(true);
    });

    it('should have Gemini models defined', () => {
      expect(AI_MODELS.GEMINI_FLASH).toBeDefined();
      expect(AI_MODELS.GEMINI_PRO).toBeDefined();
    });

    it('should have OpenRouter models defined', () => {
      expect(AI_MODELS.CLAUDE_SONNET).toBeDefined();
      expect(AI_MODELS.GPT4O).toBeDefined();
    });
  });

  describe('Constructor', () => {
    it('should initialize with rate limiter', () => {
      expect(router.rateLimiter).toBeDefined();
    });

    it('should initialize with deduplicator', () => {
      expect(router.deduplicator).toBeDefined();
    });
  });

  describe('getAvailableModels', () => {
    it('should return all models as array', () => {
      const models = router.getAvailableModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('key');
      expect(models[0]).toHaveProperty('name');
    });
  });

  describe('getRecommendedModel', () => {
    it('should return the recommended model key', () => {
      const recommended = router.getRecommendedModel();
      expect(recommended).toBeDefined();
      expect(AI_MODELS[recommended].recommended).toBe(true);
    });
  });

  describe('RequestDeduplicator', () => {
    it('should generate consistent cache keys', () => {
      const key1 = router.deduplicator.getCacheKey('test prompt', 'KIMI');
      const key2 = router.deduplicator.getCacheKey('test prompt', 'KIMI');
      expect(key1).toBe(key2);
    });

    it('should cache and retrieve data', () => {
      const key = 'test-key';
      const data = { text: 'response' };

      router.deduplicator.setCached(key, data);
      const cached = router.deduplicator.getCached(key);

      expect(cached).toEqual(data);
    });

    it('should return null for expired cache', () => {
      const key = 'expired-key';
      const data = { text: 'response' };

      router.deduplicator.setCached(key, data);
      router.deduplicator.cacheTtl = -1; // Expired

      const cached = router.deduplicator.getCached(key);
      expect(cached).toBeNull();
    });
  });

  describe('RateLimiter', () => {
    it('should allow request when under limit', () => {
      const check = router.rateLimiter.canMakeRequest('kimi');
      expect(check.allowed).toBe(true);
    });

    it('should track request timestamps', () => {
      router.rateLimiter.recordRequest('kimi');
      const log = router.rateLimiter.requestLog.get('kimi');
      expect(log).toBeDefined();
      expect(log.length).toBe(1);
    });

    it('should return wait time for rate limited provider', () => {
      // Fill up the rate limit
      for (let i = 0; i < 35; i++) {
        router.rateLimiter.recordRequest('kimi');
      }

      const waitTime = router.rateLimiter.getWaitTime('kimi');
      expect(waitTime).toBeGreaterThan(0);
    });
  });

  describe('normalizeResponse', () => {
    it('should normalize Gemini response', () => {
      const data = {
        candidates: [{ content: { parts: [{ text: 'Hello' }] } }],
        usageMetadata: { promptTokenCount: 10 }
      };

      const normalized = router.normalizeResponse(data, 'gemini');
      expect(normalized.text).toBe('Hello');
      expect(normalized.provider).toBe('gemini');
    });

    it('should normalize OpenAI-compatible response', () => {
      const data = {
        choices: [{ message: { content: 'Hello' } }],
        usage: { prompt_tokens: 10 }
      };

      const normalized = router.normalizeResponse(data, 'kimi');
      expect(normalized.text).toBe('Hello');
      expect(normalized.provider).toBe('kimi');
    });

    it('should handle empty responses gracefully', () => {
      const normalized = router.normalizeResponse({}, 'kimi');
      expect(normalized.text).toBe('');
    });
  });

  describe('buildRequestBody', () => {
    it('should build standard request body', () => {
      const config = AI_MODELS.KIMI;
      const body = router.buildRequestBody('test', config, { temperature: 0.5, maxTokens: 100 });

      expect(body.model).toBe(config.id);
      expect(body.messages).toEqual([{ role: 'user', content: 'test' }]);
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(100);
    });

    it('should build Gemini-specific request body', () => {
      const config = AI_MODELS.GEMINI_FLASH;
      const body = router.buildRequestBody('test', config, { temperature: 0.5, maxTokens: 100 });

      expect(body.contents).toBeDefined();
      expect(body.generationConfig).toBeDefined();
    });
  });

  describe('Exports', () => {
    it('should export singleton instance', () => {
      expect(aiRouter).toBeInstanceOf(AIRouter);
    });

    it('should export convenience function', () => {
      expect(typeof generateAI).toBe('function');
    });
  });
});
