/**
 * Chat Container Component
 * Container utama untuk chatbot interface
 */
export class ChatContainer {
  constructor(options = {}) {
    this.options = {
      projectId: null,
      moduleContext: null,
      onClose: null,
      ...options
    };
    this.element = null;
    this.messageList = null;
    this.inputArea = null;
    this.sessionId = null;
    this.isLoading = false;
    this.selectedModel = 'KIMI'; // Default model - KIMI Moonshot
    this.reasoningMode = null; // think, deep, research, daily
  }

  /**
   * Render container
   */
  render() {
    this.element = document.createElement('div');
    this.element.className = 'chat-container';
    this.element.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="chat-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="chat-title">
            <h3>AI Assistant SLF</h3>
            <span class="chat-status">
              <span class="status-dot online"></span>
              Online
            </span>
          </div>
        </div>
        <div class="chat-header-right">
          <select class="model-selector" id="model-selector" title="Pilih Model AI">
            <option value="KIMI">🌙 KIMI 8K (Moonshot)</option>
            <option value="KIMI_32K">🌙 KIMI 32K</option>
            <option value="KIMI_128K">🌙 KIMI 128K</option>
            <option value="GROQ">🚀 Groq Llama 3.3</option>
            <option value="OPENAI">🧠 OpenAI GPT-4o</option>
            <option value="CLAUDE">📝 Claude 3.5 Sonnet</option>
            <option value="GEMINI_FLASH">⚡ Gemini Flash</option>
            <option value="GEMINI_PRO">🔬 Gemini Pro</option>
            <option value="MISTRAL">🌊 Mistral Large</option>
            <option value="OPENROUTER">🌐 OpenRouter</option>
          </select>
          <button class="btn btn-icon" id="chat-settings-btn" title="Pengaturan">
            <i class="fas fa-cog"></i>
          </button>
          <button class="btn btn-icon" id="chat-close-btn" title="Tutup">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="chat-body">
        <div class="chat-sidebar" id="chat-sidebar">
          <div class="sidebar-header">
            <button class="btn btn-primary btn-block" id="new-chat-btn">
              <i class="fas fa-plus"></i>
              Chat Baru
            </button>
          </div>
          <div class="sidebar-sessions" id="session-list">
            <!-- Session list akan di-render di sini -->
          </div>
        </div>
        
        <div class="chat-main">
          <div class="chat-messages" id="chat-messages">
            <!-- Messages akan di-render di sini -->
          </div>
          
          <div class="chat-input-area">
            <div class="quick-actions" id="quick-actions">
              <button class="quick-action-btn reasoning" data-action="think" title="Mode Berpikir - Tampilkan proses berpikir AI">
                <i class="fas fa-brain"></i>
                <span>Berpikir</span>
              </button>
              <button class="quick-action-btn reasoning" data-action="deep" title="Deep Reasoning - Analisis mendalam">
                <i class="fas fa-microscope"></i>
                <span>Deep</span>
              </button>
              <button class="quick-action-btn reasoning" data-action="research" title="Research - Teliti topik lengkap">
                <i class="fas fa-search"></i>
                <span>Research</span>
              </button>
              <button class="quick-action-btn reasoning" data-action="daily" title="Daily Insight - Ringkasan harian">
                <i class="fas fa-calendar-day"></i>
                <span>Daily</span>
              </button>
            </div>

            <div class="quick-actions secondary" id="content-actions">
              <button class="quick-action-btn" data-action="image" title="Generate Gambar">
                <i class="fas fa-image"></i>
                <span>Gambar</span>
              </button>
              <button class="quick-action-btn" data-action="slide" title="Buat Presentasi">
                <i class="fas fa-file-powerpoint"></i>
                <span>Slide</span>
              </button>
              <button class="quick-action-btn" data-action="excel" title="Buat Excel">
                <i class="fas fa-file-excel"></i>
                <span>Excel</span>
              </button>
              <button class="quick-action-btn" data-action="analyze" title="Analisis Data">
                <i class="fas fa-chart-bar"></i>
                <span>Analisis</span>
              </button>
            </div>
            
            <div class="input-container">
              <div class="input-wrapper">
                <textarea 
                  id="chat-input" 
                  placeholder="Ketik pesan atau perintah AI..."
                  rows="1"
                ></textarea>
                <button class="btn btn-icon attach-btn" id="attach-btn" title="Lampirkan file">
                  <i class="fas fa-paperclip"></i>
                </button>
                <input type="file" id="file-input" hidden accept="image/*,.pdf,.doc,.docx,.xls,.xlsx">
              </div>
              <button class="btn btn-primary send-btn" id="send-btn" disabled>
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
            
            <div class="input-hints">
              <span>Shift + Enter untuk baris baru</span>
              <span>Enter untuk kirim</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this._attachEventListeners();
    this._setupAutoResize();
    
    return this.element;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // Close button
    const closeBtn = this.element.querySelector('#chat-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.options.onClose) this.options.onClose();
      });
    }

    // Send button
    const sendBtn = this.element.querySelector('#send-btn');
    const input = this.element.querySelector('#chat-input');
    
    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => this._handleSend());
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._handleSend();
        }
      });

      input.addEventListener('input', () => {
        sendBtn.disabled = input.value.trim().length === 0;
      });
    }

    // Quick action buttons
    const quickActions = this.element.querySelectorAll('.quick-action-btn');
    quickActions.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this._handleQuickAction(action);
      });
    });

    // File attachment
    const attachBtn = this.element.querySelector('#attach-btn');
    const fileInput = this.element.querySelector('#file-input');
    
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this._handleFileSelect(e));
    }

    // New chat button
    const newChatBtn = this.element.querySelector('#new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => this._createNewSession());
    }

    // Settings button
    const settingsBtn = this.element.querySelector('#chat-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this._showSettings());
    }

    // Model selector
    const modelSelector = this.element.querySelector('#model-selector');
    if (modelSelector) {
      modelSelector.value = this.selectedModel;
      modelSelector.addEventListener('change', (e) => {
        this.selectedModel = e.target.value;
        console.log('[ChatContainer] Model changed to:', this.selectedModel);
      });
    }
  }

  /**
   * Setup auto-resize textarea
   */
  _setupAutoResize() {
    const textarea = this.element.querySelector('#chat-input');
    if (!textarea) return;

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    });
  }

  /**
   * Handle send message
   */
  async _handleSend() {
    const input = this.element.querySelector('#chat-input');
    const content = input.value.trim();
    
    if (!content || this.isLoading) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Add user message
    this._addMessage({
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    });

    // Show loading
    this._setLoading(true);

    try {
      // Dispatch event untuk diproses use case
      const event = new CustomEvent('chat-send-message', {
        detail: {
          sessionId: this.sessionId,
          content,
          projectId: this.options.projectId,
          moduleContext: this.options.moduleContext,
          model: this.selectedModel,
          reasoningMode: this.reasoningMode
        }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('[ChatContainer] Error sending message:', error);
      this._addMessage({
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        isError: true
      });
      this._setLoading(false);
    }
  }

  /**
   * Handle quick action
   */
  _handleQuickAction(action) {
    // Handle reasoning modes
    const reasoningModes = ['think', 'deep', 'research', 'daily'];
    if (reasoningModes.includes(action)) {
      // Toggle mode
      if (this.reasoningMode === action) {
        this.reasoningMode = null;
        this._updateReasoningUI();
        const input = this.element.querySelector('#chat-input');
        input.placeholder = 'Ketik pesan atau perintah AI...';
        return;
      }

      this.reasoningMode = action;
      this._updateReasoningUI();

      const placeholders = {
        think: 'Berpikir: Ketik pertanyaan untuk melihat proses berpikir AI...',
        deep: 'Deep: Ketik topik untuk analisis mendalam...',
        research: 'Research: Ketik topik untuk penelitian lengkap...',
        daily: 'Daily: Klik kirim untuk ringkasan harian...'
      };

      const input = this.element.querySelector('#chat-input');
      input.placeholder = placeholders[action];

      // Untuk daily, langsung trigger tanpa perlu input
      if (action === 'daily') {
        this._handleSend();
      }
      return;
    }

    // Handle content generation actions
    const prompts = {
      image: 'Buatkan gambar ilustrasi teknis untuk ',
      slide: 'Buatkan presentasi slide tentang ',
      excel: 'Buatkan laporan Excel untuk data ',
      analyze: 'Analisis data berikut dan berikan insight: '
    };

    const input = this.element.querySelector('#chat-input');
    input.value = prompts[action] || '';
    input.focus();
  }

  /**
   * Update UI untuk reasoning mode
   */
  _updateReasoningUI() {
    const buttons = this.element.querySelectorAll('.quick-action-btn.reasoning');
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      if (action === this.reasoningMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Handle file selection
   */
  _handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show file attachment preview
    const input = this.element.querySelector('#chat-input');
    input.placeholder = `Lampiran: ${file.name}`;
    input.dataset.attachment = JSON.stringify({
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Reset file input
    event.target.value = '';
  }

  /**
   * Add message ke chat
   */
  _addMessage(message) {
    const messagesContainer = this.element.querySelector('#chat-messages');
    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${message.role}${message.isError ? ' error' : ''}`;
    messageEl.dataset.messageId = message.id || `msg_${Date.now()}`;
    
    const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
    
    messageEl.innerHTML = `
      <div class="message-avatar">
        ${message.role === 'user' 
          ? '<i class="fas fa-user"></i>' 
          : '<i class="fas fa-robot"></i>'}
      </div>
      <div class="message-content">
        <div class="message-text">${this._formatMessageContent(message.content)}</div>
        ${message.attachments?.length ? this._renderAttachments(message.attachments) : ''}
        <div class="message-meta">
          <span class="message-time">${time}</span>
          ${message.model ? `<span class="message-model">${message.model}</span>` : ''}
        </div>
      </div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageEl;
  }

  /**
   * Format message content (handle markdown, code, etc)
   */
  _formatMessageContent(content) {
    if (!content) return '';
    
    // Escape HTML
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * Render attachments
   */
  _renderAttachments(attachments) {
    if (!attachments || attachments.length === 0) return '';

    return `
      <div class="message-attachments">
        ${attachments.map(att => `
          <div class="attachment-item ${att.type}">
            <i class="fas ${this._getAttachmentIcon(att.type)}"></i>
            <span class="attachment-name">${att.name}</span>
            ${att.url ? `<a href="${att.url}" target="_blank" download><i class="fas fa-download"></i></a>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Get attachment icon
   */
  _getAttachmentIcon(type) {
    const icons = {
      image: 'fa-image',
      file: 'fa-file',
      document: 'fa-file-alt',
      excel: 'fa-file-excel',
      slide: 'fa-file-powerpoint'
    };
    return icons[type] || 'fa-file';
  }

  /**
   * Set loading state
   */
  _setLoading(loading) {
    this.isLoading = loading;
    const sendBtn = this.element.querySelector('#send-btn');
    const input = this.element.querySelector('#chat-input');

    if (sendBtn) {
      sendBtn.disabled = loading;
      sendBtn.innerHTML = loading 
        ? '<i class="fas fa-spinner fa-spin"></i>' 
        : '<i class="fas fa-paper-plane"></i>';
    }

    if (input) {
      input.disabled = loading;
    }

    // Show/hide typing indicator
    const messagesContainer = this.element.querySelector('#chat-messages');
    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    
    if (loading && !existingIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'chat-message assistant typing-indicator';
      indicator.innerHTML = `
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `;
      messagesContainer.appendChild(indicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else if (!loading && existingIndicator) {
      existingIndicator.remove();
    }
  }

  /**
   * Update message content (untuk streaming)
   */
  updateMessageContent(messageId, content) {
    const messageEl = this.element.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      const textEl = messageEl.querySelector('.message-text');
      if (textEl) {
        textEl.innerHTML = this._formatMessageContent(content);
      }
    }
  }

  /**
   * Load messages dari session
   */
  loadMessages(messages) {
    const messagesContainer = this.element.querySelector('#chat-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';

    // Add welcome message jika kosong
    if (!messages || messages.length === 0) {
      this._addWelcomeMessage();
      return;
    }

    messages.forEach(msg => {
      if (msg.role !== 'system') {
        this._addMessage(msg);
      }
    });
  }

  /**
   * Add welcome message
   */
  _addWelcomeMessage() {
    const welcomeContent = `Halo! Saya adalah AI Assistant untuk aplikasi **Pengkajian SLF**.

Saya dapat membantu Anda dengan:
- 📊 **Analisis data** pengkajian bangunan
- 🖼️ **Generate gambar** ilustrasi teknis
- 📑 **Buat presentasi** slide profesional  
- 📈 **Generate Excel** untuk perhitungan
- ❓ **Jawab pertanyaan** tentang regulasi SLF

${this.options.projectId ? 'Saya memiliki akses ke data project ini untuk analisis yang lebih spesifik.' : ''}

Ada yang bisa saya bantu?`;

    this._addMessage({
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Update session list
   */
  updateSessionList(sessions) {
    const listContainer = this.element.querySelector('#session-list');
    if (!listContainer) return;

    if (!sessions || sessions.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-sessions">
          <i class="fas fa-comments"></i>
          <p>Belum ada percakapan</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = sessions.map(session => `
      <div class="session-item ${session.id === this.sessionId ? 'active' : ''}" data-session-id="${session.id}">
        <i class="fas fa-comment"></i>
        <div class="session-info">
          <span class="session-title">${session.title}</span>
          <span class="session-time">${new Date(session.updatedAt).toLocaleDateString('id-ID')}</span>
        </div>
        <button class="btn btn-icon delete-session" data-session-id="${session.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');

    // Attach session click handlers
    listContainer.querySelectorAll('.session-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-session')) {
          const sessionId = item.dataset.sessionId;
          this._loadSession(sessionId);
        }
      });
    });

    // Attach delete handlers
    listContainer.querySelectorAll('.delete-session').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sessionId = btn.dataset.sessionId;
        this._deleteSession(sessionId);
      });
    });
  }

  /**
   * Set current session
   */
  setSession(sessionId) {
    this.sessionId = sessionId;
    
    // Update active state di session list
    const sessionItems = this.element.querySelectorAll('.session-item');
    sessionItems.forEach(item => {
      item.classList.toggle('active', item.dataset.sessionId === sessionId);
    });
  }

  /**
   * Create new session
   */
  _createNewSession() {
    const event = new CustomEvent('chat-create-session', {
      detail: {
        projectId: this.options.projectId,
        moduleContext: this.options.moduleContext
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Load session
   */
  _loadSession(sessionId) {
    const event = new CustomEvent('chat-load-session', {
      detail: { sessionId }
    });
    document.dispatchEvent(event);
  }

  /**
   * Delete session
   */
  _deleteSession(sessionId) {
    if (confirm('Hapus percakapan ini?')) {
      const event = new CustomEvent('chat-delete-session', {
        detail: { sessionId }
      });
      document.dispatchEvent(event);
    }
  }

  /**
   * Show settings
   */
  _showSettings() {
    const event = new CustomEvent('chat-show-settings');
    document.dispatchEvent(event);
  }

  /**
   * Get element
   */
  getElement() {
    return this.element;
  }

  /**
   * Destroy component
   */
  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}
