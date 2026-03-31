/**
 * OPENROUTER AI SERVICE
 * Implementasi konkret untuk IAIService.
 */
import { MODELS, fetchOpenRouter, parseAIJson } from '../../lib/ai-router.js';
import { IAIService } from '../../domain/repositories/Interfaces.js';

export class OpenRouterAIService extends IAIService {
  constructor(modelId = MODELS.OPENROUTER.id) {
    super();
    this.modelId = modelId;
  }

  /**
   * Menganalisis teks menggunakan model OpenRouter.
   */
  async analyze(prompt, options = {}) {
    const model = { ...MODELS.OPENROUTER, id: options.modelId || this.modelId };
    
    try {
      const respText = await fetchOpenRouter(model, prompt);
      return parseAIJson(respText);
    } catch (err) {
      console.error("[Infrastructure/AI] OpenRouter call failed: ", err);
      throw err;
    }
  }
}
