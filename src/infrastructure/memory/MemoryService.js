/**
 * Infrastructure: MemoryService
 * Service untuk mengelola AI memory dengan learning capabilities
 */
import { AIMemory, MemoryQuery, MemoryImportance } from '../../domain/entities/AIMemory.js';

export class MemoryService {
  constructor(memoryRepository) {
    this.repository = memoryRepository;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 menit
  }

  /**
   * Learn dari conversation message
   * Ekstrak informasi penting dan simpan sebagai memory
   */
  async learnFromMessage(userId, message, sessionId, context = {}) {
    const extractedMemories = this._extractMemoriesFromMessage(userId, message, sessionId, context);
    
    if (extractedMemories.length === 0) return [];

    // Batch save
    const saved = await this.repository.batchSave(extractedMemories);
    
    // Update cache
    saved.forEach(mem => {
      this._setCache(mem.id, mem);
      this._setCache(`key_${mem.userId}_${mem.key}`, mem);
    });

    return saved;
  }

  /**
   * Get memories untuk AI context
   */
  async getContextMemories(userId, currentContext = {}, options = {}) {
    const { limit = 10, includeProject = true, minConfidence = 0.6 } = options;

    // Get dari cache atau query
    const cacheKey = `context_${userId}_${JSON.stringify(currentContext)}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    // Build query
    const query = new MemoryQuery({
      userId,
      minConfidence,
      limit: limit * 2 // Get more untuk ranking
    });

    let memories = await this.repository.query(query);

    // Filter yang masih valid
    memories = memories.filter(m => m.isValid());

    // Rank berdasarkan relevance dengan current context
    const ranked = memories.map(mem => {
      const relevanceScore = mem.getRelevanceScore();
      const contextMatchScore = this._calculateContextMatch(mem, currentContext);
      
      return new MemoryImportance({
        memory: mem,
        relevanceScore,
        contextMatchScore,
        priority: this._getMemoryPriority(mem)
      });
    });

    // Sort dan filter
    ranked.sort((a, b) => b.getScore() - a.getScore());
    
    const important = ranked
      .filter(r => r.isImportant(0.3))
      .slice(0, limit)
      .map(r => r.memory);

    // Mark as accessed
    await Promise.all(important.map(m => this.repository.markAccessed(m.id)));

    // Cache result
    this._setCache(cacheKey, important);

    return important;
  }

  /**
   * Remember user preference
   */
  async rememberPreference(userId, key, value, metadata = {}) {
    const existing = await this.repository.getByKey(userId, `pref_${key}`);

    if (existing) {
      // Update existing
      existing.updateValue(value, true);
      await this.repository.update(existing.id, {
        value: existing.value,
        confidence: existing.confidence,
        updatedAt: existing.updatedAt
      });
      this._setCache(existing.id, existing);
      return existing;
    } else {
      // Create new
      const memory = AIMemory.createUserPreference(userId, `pref_${key}`, value, metadata);
      const saved = await this.repository.save(memory);
      this._setCache(saved.id, saved);
      this._setCache(`key_${saved.userId}_${saved.key}`, saved);
      return saved;
    }
  }

  /**
   * Get user preference
   */
  async getPreference(userId, key, defaultValue = null) {
    const cacheKey = `key_${userId}_pref_${key}`;
    const cached = this._getCache(cacheKey);
    if (cached) {
      await this.repository.markAccessed(cached.id);
      return cached.value;
    }

    const memory = await this.repository.getByKey(userId, `pref_${key}`);
    if (memory && memory.isValid()) {
      this._setCache(cacheKey, memory);
      await this.repository.markAccessed(memory.id);
      return memory.value;
    }

    return defaultValue;
  }

  /**
   * Remember project-specific context
   */
  async rememberProjectContext(userId, projectId, key, value) {
    const existing = await this.repository.getByKey(userId, `project_${projectId}_${key}`);

    if (existing) {
      existing.updateValue(value);
      await this.repository.update(existing.id, {
        value: existing.value,
        updatedAt: existing.updatedAt
      });
      return existing;
    } else {
      const memory = AIMemory.createProjectContext(userId, projectId, key, value);
      return await this.repository.save(memory);
    }
  }

  /**
   * Get project context
   */
  async getProjectContext(userId, projectId, key) {
    const memory = await this.repository.getByKey(userId, `project_${projectId}_${key}`);
    return memory && memory.isValid() ? memory.value : null;
  }

  /**
   * Remember insight/analytics
   */
  async rememberInsight(userId, key, value, metadata = {}) {
    const memory = AIMemory.createInsight(userId, key, value, metadata);
    return await this.repository.save(memory);
  }

  /**
   * Forget (delete) specific memory
   */
  async forget(userId, key) {
    const memory = await this.repository.getByKey(userId, key);
    if (memory) {
      await this.repository.delete(memory.id);
      this.cache.delete(memory.id);
      this.cache.delete(`key_${userId}_${key}`);
      return true;
    }
    return false;
  }

  /**
   * Get user profile dari memories
   */
  async buildUserProfile(userId) {
    const preferences = await this.repository.getByCategory(userId, 'user');
    const insights = await this.repository.getByCategory(userId, 'system');
    
    const profile = {
      userId,
      preferences: {},
      insights: [],
      patterns: {},
      expertise: [],
      frequentlyDiscussed: []
    };

    // Extract preferences
    preferences.forEach(pref => {
      if (pref.isValid()) {
        const cleanKey = pref.key.replace('pref_', '');
        profile.preferences[cleanKey] = pref.value;
      }
    });

    // Extract insights
    insights.forEach(insight => {
      if (insight.isValid()) {
        profile.insights.push({
          key: insight.key,
          value: insight.value,
          confidence: insight.confidence
        });
      }
    });

    // Calculate patterns
    profile.patterns = await this._analyzePatterns(userId);

    return profile;
  }

  /**
   * Extract memories dari message menggunakan simple heuristics
   */
  _extractMemoriesFromMessage(userId, message, sessionId, context) {
    const memories = [];
    const content = message.content || message;

    // Extract preferences dari pattern "Saya suka/ingin/prefer"
    const preferencePatterns = [
      { regex: /saya\s+(?:suka|senang|prefer|ingin)\s+(.+)/gi, type: 'preference' },
      { regex: /biasanya\s+saya\s+(.+)/gi, type: 'preference' },
      { regex: /selalu\s+(.+)/gi, type: 'preference' },
    ];

    preferencePatterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = this._sanitizeKey(match[1].substring(0, 50));
        memories.push(AIMemory.createUserPreference(
          userId,
          key,
          match[1],
          { source: 'message', sessionId }
        ));
      }
    });

    // Extract facts untuk domain knowledge
    if (content.includes('standar') || content.includes('SNI') || content.includes('Peraturan')) {
      const factPattern = /(?:standar|SNI|Peraturan)\s+([^,.]+)/gi;
      let match;
      while ((match = factPattern.exec(content)) !== null) {
        memories.push(AIMemory.createLearnedFact(
          userId,
          this._sanitizeKey(match[0]),
          match[0],
          sessionId,
          0.7
        ));
      }
    }

    // Extract project context
    if (context.projectId) {
      // Analisis preferences untuk project
      if (content.includes('project') || content.includes('proyek')) {
        memories.push(AIMemory.createProjectContext(
          userId,
          context.projectId,
          'interaction',
          { lastTopic: content.substring(0, 100), timestamp: new Date().toISOString() }
        ));
      }
    }

    return memories.slice(0, 5); // Limit extractions per message
  }

  /**
   * Calculate context match score
   */
  _calculateContextMatch(memory, currentContext) {
    let score = 1.0;

    // Project match
    if (currentContext.projectId && memory.metadata?.projectId) {
      score *= memory.metadata.projectId === currentContext.projectId ? 1.2 : 0.8;
    }

    // Module match
    if (currentContext.moduleContext && memory.metadata?.moduleContext) {
      score *= memory.metadata.moduleContext === currentContext.moduleContext ? 1.1 : 0.9;
    }

    return score;
  }

  /**
   * Get priority berdasarkan memory type
   */
  _getMemoryPriority(memory) {
    const priorities = {
      'preference': 1.5,
      'context': 1.3,
      'insight': 1.2,
      'fact': 1.0
    };
    return priorities[memory.type] || 1.0;
  }

  /**
   * Analyze patterns dari conversation history
   */
  async _analyzePatterns(userId) {
    // Placeholder - implementasi analytics
    return {
      commonTopics: [],
      questionTypes: {},
      expertiseAreas: []
    };
  }

  /**
   * Sanitize key untuk storage
   */
  _sanitizeKey(key) {
    return key
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);
  }

  /**
   * Cache helpers
   */
  _getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}
