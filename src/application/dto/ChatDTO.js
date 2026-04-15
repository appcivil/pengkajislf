/**
 * Data Transfer Objects untuk Chatbot Module
 */

/**
 * DTO untuk send message request
 */
export class SendMessageRequest {
  constructor({
    sessionId,
    content,
    attachments = [],
    context = {},
    options = {}
  }) {
    this.sessionId = sessionId;
    this.content = content;
    this.attachments = attachments;
    this.context = context;
    this.options = options;
  }

  validate() {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Content tidak boleh kosong');
    }
    if (this.content.length > 10000) {
      throw new Error('Content terlalu panjang (max 10000 karakter)');
    }
    return true;
  }
}

/**
 * DTO untuk chat response
 */
export class ChatResponseDTO {
  constructor({
    message,
    session,
    metadata = {},
    attachments = [],
    suggestedActions = []
  }) {
    this.message = message;
    this.session = session;
    this.metadata = metadata;
    this.attachments = attachments;
    this.suggestedActions = suggestedActions;
    this.timestamp = new Date().toISOString();
  }

  static fromDomain(message, session, metadata = {}) {
    return new ChatResponseDTO({
      message: typeof message.toJSON === 'function' ? message.toJSON() : message,
      session: typeof session.toJSON === 'function' ? session.toJSON() : session,
      metadata
    });
  }
}

/**
 * DTO untuk session list
 */
export class SessionListDTO {
  constructor({ sessions, total, page = 1, limit = 20 }) {
    this.sessions = sessions.map(s => typeof s.toJSON === 'function' ? s.toJSON() : s);
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.hasMore = total > page * limit;
  }
}

/**
 * DTO untuk create session
 */
export class CreateSessionRequest {
  constructor({
    title = 'Chat Baru',
    projectId = null,
    moduleContext = null,
    settings = {}
  }) {
    this.title = title;
    this.projectId = projectId;
    this.moduleContext = moduleContext;
    this.settings = settings;
  }
}

/**
 * DTO untuk AI capabilities
 */
export class AICapabilitiesDTO {
  constructor({
    models = [],
    features = [],
    limits = {}
  }) {
    this.models = models;
    this.features = features;
    this.limits = limits;
  }

  static default() {
    return new AICapabilitiesDTO({
      models: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'chat' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', type: 'chat' },
        { id: 'kimi-8k', name: 'Kimi 8K', type: 'chat' }
      ],
      features: [
        { id: 'chat', name: 'AI Chat', enabled: true },
        { id: 'image', name: 'Image Generation', enabled: true },
        { id: 'slide', name: 'Slide AI', enabled: true },
        { id: 'excel', name: 'Excel Generation', enabled: true },
        { id: 'data_access', name: 'Data Access', enabled: true }
      ],
      limits: {
        maxMessagesPerSession: 100,
        maxAttachmentSize: 10 * 1024 * 1024, // 10MB
        maxContextLength: 128000
      }
    });
  }
}

/**
 * DTO untuk generated content
 */
export class GeneratedContentDTO {
  constructor({
    type, // 'image' | 'slide' | 'excel' | 'document'
    content,
    metadata = {},
    downloadUrl = null,
    previewUrl = null
  }) {
    this.type = type;
    this.content = content;
    this.metadata = metadata;
    this.downloadUrl = downloadUrl;
    this.previewUrl = previewUrl;
    this.generatedAt = new Date().toISOString();
  }

  /**
   * Check apakah content bisa di-download
   */
  isDownloadable() {
    return !!this.downloadUrl;
  }

  /**
   * Get file extension
   */
  getFileExtension() {
    const extensions = {
      image: 'png',
      slide: 'pptx',
      excel: 'xlsx',
      document: 'docx'
    };
    return extensions[this.type] || 'bin';
  }
}

/**
 * DTO untuk suggested action
 */
export class SuggestedActionDTO {
  constructor({
    id,
    type, // 'command' | 'query' | 'generate' | 'navigate'
    label,
    description = '',
    icon = null,
    payload = {}
  }) {
    this.id = id;
    this.type = type;
    this.label = label;
    this.description = description;
    this.icon = icon;
    this.payload = payload;
  }
}
