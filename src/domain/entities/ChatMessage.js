/**
 * Domain Entity: ChatMessage
 * Representasi pesan dalam chatbot
 */
export class ChatMessage {
  constructor({
    id,
    role, // 'user' | 'assistant' | 'system'
    content,
    timestamp = new Date().toISOString(),
    metadata = {},
    attachments = [],
    model = null,
    tokens = null
  }) {
    this.id = id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.role = role;
    this.content = content;
    this.timestamp = timestamp;
    this.metadata = metadata;
    this.attachments = attachments;
    this.model = model;
    this.tokens = tokens;
  }

  /**
   * Validasi pesan
   */
  validate() {
    if (!this.role || !['user', 'assistant', 'system'].includes(this.role)) {
      throw new Error('Role harus user, assistant, atau system');
    }
    if (!this.content || typeof this.content !== 'string') {
      throw new Error('Content harus string yang valid');
    }
    return true;
  }

  /**
   * Format untuk display
   */
  getFormattedTime() {
    const date = new Date(this.timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Check apakah pesan memiliki attachment
   */
  hasAttachments() {
    return this.attachments && this.attachments.length > 0;
  }

  /**
   * Factory method untuk user message
   */
  static createUserMessage(content, attachments = []) {
    return new ChatMessage({
      role: 'user',
      content,
      attachments
    });
  }

  /**
   * Factory method untuk assistant message
   */
  static createAssistantMessage(content, metadata = {}) {
    return new ChatMessage({
      role: 'assistant',
      content,
      metadata
    });
  }

  /**
   * Factory method dari JSON
   */
  static fromJSON(json) {
    return new ChatMessage(json);
  }

  /**
   * Convert ke JSON
   */
  toJSON() {
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp,
      metadata: this.metadata,
      attachments: this.attachments,
      model: this.model,
      tokens: this.tokens
    };
  }
}

/**
 * Value Object: ChatAttachment
 * Attachment dalam pesan chat
 */
export class ChatAttachment {
  constructor({
    type, // 'image' | 'file' | 'document' | 'excel' | 'slide'
    name,
    url,
    size,
    mimeType,
    thumbnailUrl = null
  }) {
    this.type = type;
    this.name = name;
    this.url = url;
    this.size = size;
    this.mimeType = mimeType;
    this.thumbnailUrl = thumbnailUrl;
  }

  /**
   * Check apakah attachment adalah image
   */
  isImage() {
    return this.type === 'image' || this.mimeType?.startsWith('image/');
  }

  /**
   * Check apakah attachment adalah document
   */
  isDocument() {
    return ['file', 'document', 'excel', 'slide'].includes(this.type);
  }

  /**
   * Get icon class berdasarkan type
   */
  getIconClass() {
    const icons = {
      image: 'fa-image',
      file: 'fa-file',
      document: 'fa-file-alt',
      excel: 'fa-file-excel',
      slide: 'fa-file-powerpoint'
    };
    return icons[this.type] || 'fa-file';
  }
}
