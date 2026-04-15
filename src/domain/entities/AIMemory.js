/**
 * Domain Entity: AIMemory
 * Long-term memory untuk menyimpan informasi penting dari percakapan
 */
export class AIMemory {
  constructor({
    id,
    userId,
    type, // 'preference' | 'fact' | 'context' | 'insight'
    category, // 'user' | 'project' | 'domain' | 'system'
    key,
    value,
    confidence = 1.0, // 0.0 - 1.0
    sourceSessionId = null,
    metadata = {},
    expiresAt = null, // null = never expires
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    accessCount = 0,
    lastAccessedAt = null
  }) {
    this.id = id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = userId;
    this.type = type;
    this.category = category;
    this.key = key;
    this.value = value;
    this.confidence = confidence;
    this.sourceSessionId = sourceSessionId;
    this.metadata = metadata;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.accessCount = accessCount;
    this.lastAccessedAt = lastAccessedAt;
  }

  /**
   * Update value dengan merge untuk object
   */
  updateValue(newValue, merge = true) {
    if (merge && typeof this.value === 'object' && typeof newValue === 'object') {
      this.value = { ...this.value, ...newValue };
    } else {
      this.value = newValue;
    }
    this.updatedAt = new Date().toISOString();
    this.confidence = Math.min(this.confidence + 0.1, 1.0);
  }

  /**
   * Increment access count
   */
  markAccessed() {
    this.accessCount++;
    this.lastAccessedAt = new Date().toISOString();
  }

  /**
   * Check apakah memory masih valid (belum expired)
   */
  isValid() {
    if (!this.expiresAt) return true;
    return new Date(this.expiresAt) > new Date();
  }

  /**
   * Get relevance score berdasarkan frequency dan recency
   */
  getRelevanceScore() {
    const recencyWeight = 0.6;
    const frequencyWeight = 0.4;
    
    // Recency score (exponential decay)
    const daysSinceAccess = this.lastAccessedAt 
      ? (Date.now() - new Date(this.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    const recencyScore = Math.exp(-daysSinceAccess / 7); // 7-day half-life
    
    // Frequency score (normalized)
    const frequencyScore = Math.min(this.accessCount / 10, 1.0);
    
    return (recencyScore * recencyWeight) + (frequencyScore * frequencyWeight);
  }

  /**
   * Format untuk AI prompt context
   */
  toPromptContext() {
    return {
      key: this.key,
      value: this.value,
      type: this.type,
      confidence: this.confidence
    };
  }

  /**
   * Factory method untuk user preference
   */
  static createUserPreference(userId, key, value, metadata = {}) {
    return new AIMemory({
      userId,
      type: 'preference',
      category: 'user',
      key,
      value,
      metadata,
      expiresAt: null
    });
  }

  /**
   * Factory method untuk learned fact
   */
  static createLearnedFact(userId, key, value, sourceSessionId, confidence = 0.8) {
    return new AIMemory({
      userId,
      type: 'fact',
      category: 'domain',
      key,
      value,
      sourceSessionId,
      confidence,
      // Facts expire after 90 days
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  /**
   * Factory method untuk project context
   */
  static createProjectContext(userId, projectId, key, value) {
    return new AIMemory({
      userId,
      type: 'context',
      category: 'project',
      key: `project_${projectId}_${key}`,
      value,
      metadata: { projectId },
      expiresAt: null
    });
  }

  /**
   * Factory method untuk insight
   */
  static createInsight(userId, key, value, metadata = {}) {
    return new AIMemory({
      userId,
      type: 'insight',
      category: 'system',
      key,
      value,
      metadata,
      // Insights expire after 30 days
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  /**
   * Factory dari JSON
   */
  static fromJSON(json) {
    return new AIMemory(json);
  }

  /**
   * Convert ke JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      category: this.category,
      key: this.key,
      value: this.value,
      confidence: this.confidence,
      sourceSessionId: this.sourceSessionId,
      metadata: this.metadata,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      accessCount: this.accessCount,
      lastAccessedAt: this.lastAccessedAt
    };
  }
}

/**
 * Value Object: MemoryQuery
 * Query untuk mencari memory
 */
export class MemoryQuery {
  constructor({
    userId,
    types = null,
    categories = null,
    keyPattern = null,
    minConfidence = 0.5,
    limit = 10,
    orderBy = 'relevance' // 'relevance' | 'recency' | 'frequency'
  }) {
    this.userId = userId;
    this.types = types;
    this.categories = categories;
    this.keyPattern = keyPattern;
    this.minConfidence = minConfidence;
    this.limit = limit;
    this.orderBy = orderBy;
  }

  /**
   * Build filter criteria untuk repository
   */
  buildFilters() {
    const filters = {
      userId: this.userId,
      minConfidence: this.minConfidence
    };

    if (this.types) {
      filters.types = Array.isArray(this.types) ? this.types : [this.types];
    }

    if (this.categories) {
      filters.categories = Array.isArray(this.categories) ? this.categories : [this.categories];
    }

    if (this.keyPattern) {
      filters.keyPattern = this.keyPattern;
    }

    return filters;
  }
}

/**
 * Value Object: MemoryImportance
 * Penilaian kepentingan memory untuk AI context
 */
export class MemoryImportance {
  constructor({
    memory,
    relevanceScore,
    contextMatchScore = 1.0,
    priority = 1.0
  }) {
    this.memory = memory;
    this.relevanceScore = relevanceScore;
    this.contextMatchScore = contextMatchScore;
    this.priority = priority;
  }

  /**
   * Get final importance score
   */
  getScore() {
    return this.relevanceScore * this.contextMatchScore * this.priority * this.memory.confidence;
  }

  /**
   * Check apakah memory cukup penting untuk disertakan
   */
  isImportant(threshold = 0.3) {
    return this.getScore() >= threshold;
  }
}
