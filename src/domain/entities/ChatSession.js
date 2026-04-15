/**
 * Domain Entity: ChatSession
 * Sesi chat dengan konteks percakapan
 */
export class ChatSession {
  constructor({
    id,
    title = 'Chat Baru',
    messages = [],
    context = {},
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    projectId = null,
    moduleContext = null,
    settings = {}
  }) {
    this.id = id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = title;
    this.messages = messages.map(m => typeof m.toJSON === 'function' ? m.toJSON() : m);
    this.context = context;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.projectId = projectId;
    this.moduleContext = moduleContext;
    this.settings = {
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      maxTokens: 4096,
      enableDataAccess: true,
      ...settings
    };
  }

  /**
   * Tambah pesan ke sesi
   */
  addMessage(message) {
    this.messages.push(typeof message.toJSON === 'function' ? message.toJSON() : message);
    this.updatedAt = new Date().toISOString();
    
    // Update title jika ini pesan pertama user
    if (this.messages.length === 1 && message.role === 'user' && this.title === 'Chat Baru') {
      this.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
    }
  }

  /**
   * Get conversation history untuk AI context
   */
  getConversationHistory(limit = 20) {
    return this.messages
      .slice(-limit)
      .map(m => ({
        role: m.role,
        content: m.content
      }));
  }

  /**
   * Get context untuk AI dengan data aplikasi
   */
  getAIContext(dataProvider) {
    const context = {
      sessionId: this.id,
      projectId: this.projectId,
      moduleContext: this.moduleContext,
      conversationHistory: this.getConversationHistory(),
      applicationData: null
    };

    if (this.settings.enableDataAccess && dataProvider) {
      context.applicationData = dataProvider.getContextData(this.projectId, this.moduleContext);
    }

    return context;
  }

  /**
   * Update context
   */
  updateContext(key, value) {
    this.context[key] = value;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Clear messages
   */
  clearMessages() {
    this.messages = [];
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get message count
   */
  getMessageCount() {
    return this.messages.length;
  }

  /**
   * Check apakah sesi baru (belum ada percakapan)
   */
  isNew() {
    return this.messages.length === 0;
  }

  /**
   * Get last message
   */
  getLastMessage() {
    return this.messages[this.messages.length - 1] || null;
  }

  /**
   * Factory method dari JSON
   */
  static fromJSON(json) {
    return new ChatSession(json);
  }

  /**
   * Convert ke JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      messages: this.messages,
      context: this.context,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      projectId: this.projectId,
      moduleContext: this.moduleContext,
      settings: this.settings
    };
  }
}

/**
 * Value Object: ChatContext
 * Konteks khusus untuk chatbot
 */
export class ChatContext {
  constructor({
    type, // 'project' | 'module' | 'general'
    data = {},
    permissions = []
  }) {
    this.type = type;
    this.data = data;
    this.permissions = permissions;
  }

  /**
   * Check apakah punya permission
   */
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.permissions.includes('*');
  }

  /**
   * Get data untuk AI prompt
   */
  getPromptContext() {
    return {
      type: this.type,
      data: this.data,
      canAccessFiles: this.hasPermission('files'),
      canAccessDatabase: this.hasPermission('database'),
      canGenerateReports: this.hasPermission('reports'),
      canGenerateImages: this.hasPermission('images')
    };
  }
}
