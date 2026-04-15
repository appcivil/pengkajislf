/**
 * Floating Chat Button Component
 * Quick access button untuk chatbot di pojok kanan bawah
 */
export class FloatingChatButton {
  constructor(options = {}) {
    this.options = {
      position: 'bottom-right',
      projectId: null,
      moduleContext: null,
      ...options
    };
    this.element = null;
    this.isOpen = false;
    this.miniChat = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'floating-chat-wrapper';
    this.element.innerHTML = `
      <div class="floating-chat-mini" id="mini-chat-container" style="display: none;">
        <div class="mini-chat-header">
          <div class="mini-chat-title">
            <i class="fas fa-robot"></i>
            <span>AI Assistant</span>
          </div>
          <div class="mini-chat-actions">
            <button class="btn btn-icon btn-sm" id="expand-chat-btn" title="Buka Full Chat">
              <i class="fas fa-expand"></i>
            </button>
            <button class="btn btn-icon btn-sm" id="close-mini-chat-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="mini-chat-messages" id="mini-chat-messages">
          <div class="mini-welcome">
            <i class="fas fa-sparkles"></i>
            <p>Halo! Ada yang bisa saya bantu?</p>
          </div>
        </div>
        <div class="mini-chat-input">
          <input type="text" id="mini-chat-input" placeholder="Tanya AI..." />
          <button class="btn btn-primary btn-sm" id="mini-send-btn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
      
      <button class="floating-chat-btn" id="fab-chat-btn" title="AI Chat">
        <span class="fab-icon">
          <i class="fas fa-comments"></i>
        </span>
        <span class="fab-pulse"></span>
      </button>
    `;

    this._attachEventListeners();
    return this.element;
  }

  _attachEventListeners() {
    // Main FAB
    const fab = this.element.querySelector('#fab-chat-btn');
    fab.addEventListener('click', () => this._toggleMiniChat());

    // Expand to full chat
    const expandBtn = this.element.querySelector('#expand-chat-btn');
    expandBtn.addEventListener('click', () => {
      this._openFullChat();
    });

    // Close mini chat
    const closeBtn = this.element.querySelector('#close-mini-chat-btn');
    closeBtn.addEventListener('click', () => this._closeMiniChat());

    // Mini chat send
    const miniInput = this.element.querySelector('#mini-chat-input');
    const miniSend = this.element.querySelector('#mini-send-btn');

    miniSend.addEventListener('click', () => this._sendMiniMessage());
    miniInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this._sendMiniMessage();
    });

    // Quick action buttons
    this._setupQuickActions();
  }

  _setupQuickActions() {
    const quickActions = [
      { icon: 'fa-image', label: 'Gambar', action: 'image' },
      { icon: 'fa-file-powerpoint', label: 'Slide', action: 'slide' },
      { icon: 'fa-file-excel', label: 'Excel', action: 'excel' },
      { icon: 'fa-palette', label: 'Design', action: 'design' }
    ];

    const quickActionsHtml = quickActions.map(action => `
      <button class="quick-action-fab" data-action="${action.action}" title="${action.label}">
        <i class="fas ${action.icon}"></i>
      </button>
    `).join('');

    const quickActionsContainer = document.createElement('div');
    quickActionsContainer.className = 'quick-actions-fab';
    quickActionsContainer.innerHTML = quickActionsHtml;
    quickActionsContainer.style.display = 'none';

    this.element.appendChild(quickActionsContainer);

    // Toggle quick actions on long press
    const fab = this.element.querySelector('#fab-chat-btn');
    let pressTimer;

    fab.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => {
        quickActionsContainer.style.display = 
          quickActionsContainer.style.display === 'none' ? 'flex' : 'none';
      }, 500);
    });

    fab.addEventListener('mouseup', () => clearTimeout(pressTimer));
    fab.addEventListener('mouseleave', () => clearTimeout(pressTimer));

    // Quick action handlers
    quickActionsContainer.querySelectorAll('.quick-action-fab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this._handleQuickAction(action);
        quickActionsContainer.style.display = 'none';
      });
    });
  }

  _toggleMiniChat() {
    const miniChat = this.element.querySelector('#mini-chat-container');
    this.isOpen = !this.isOpen;
    miniChat.style.display = this.isOpen ? 'flex' : 'none';
    
    if (this.isOpen) {
      setTimeout(() => {
        this.element.querySelector('#mini-chat-input').focus();
      }, 100);
    }
  }

  _closeMiniChat() {
    const miniChat = this.element.querySelector('#mini-chat-container');
    this.isOpen = false;
    miniChat.style.display = 'none';
  }

  _openFullChat() {
    this._closeMiniChat();
    
    const params = {};
    if (this.options.projectId) params.id = this.options.projectId;
    if (this.options.moduleContext) params.moduleContext = this.options.moduleContext;
    
    window.navigate('chatbot', params);
  }

  _sendMiniMessage() {
    const input = this.element.querySelector('#mini-chat-input');
    const content = input.value.trim();
    
    if (!content) return;

    // Add user message
    this._addMiniMessage('user', content);
    input.value = '';

    // Dispatch event untuk diproses
    const event = new CustomEvent('floating-chat-message', {
      detail: {
        content,
        projectId: this.options.projectId,
        moduleContext: this.options.moduleContext
      }
    });
    document.dispatchEvent(event);
  }

  _addMiniMessage(role, content) {
    const container = this.element.querySelector('#mini-chat-messages');
    
    // Remove welcome jika ada
    const welcome = container.querySelector('.mini-welcome');
    if (welcome) welcome.remove();

    const messageEl = document.createElement('div');
    messageEl.className = `mini-message ${role}`;
    messageEl.innerHTML = `
      <div class="mini-message-content">${content}</div>
    `;

    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
  }

  _handleQuickAction(action) {
    const prompts = {
      image: 'Buatkan gambar ilustrasi untuk ',
      slide: 'Buatkan presentasi slide tentang ',
      excel: 'Buatkan laporan Excel untuk data ',
      design: 'Bantu desain ' 
    };

    const miniChat = this.element.querySelector('#mini-chat-container');
    miniChat.style.display = 'flex';
    this.isOpen = true;

    const input = this.element.querySelector('#mini-chat-input');
    input.value = prompts[action] || '';
    input.focus();
  }

  showAIResponse(content) {
    this._addMiniMessage('assistant', content);
  }

  showTyping() {
    const container = this.element.querySelector('#mini-chat-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'mini-message assistant typing';
    typingEl.id = 'mini-typing-indicator';
    typingEl.innerHTML = `
      <div class="mini-typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
  }

  hideTyping() {
    const typingEl = this.element.querySelector('#mini-typing-indicator');
    if (typingEl) typingEl.remove();
  }

  getElement() {
    return this.element;
  }

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}

// CSS Styles
export const floatingChatStyles = `
.floating-chat-wrapper {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.floating-chat-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-chat-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 30px rgba(59, 130, 246, 0.5);
}

.fab-icon {
  position: relative;
  z-index: 2;
}

.fab-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  opacity: 0.3;
  animation: fabPulse 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes fabPulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 0.1; }
}

.floating-chat-mini {
  width: 360px;
  height: 500px;
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.mini-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-secondary, #1e293b);
  border-bottom: 1px solid var(--border-color, #334155);
}

.mini-chat-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary, #f1f5f9);
}

.mini-chat-title i {
  color: #3b82f6;
}

.mini-chat-actions {
  display: flex;
  gap: 0.25rem;
}

.mini-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mini-welcome {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary, #94a3b8);
}

.mini-welcome i {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  color: #3b82f6;
}

.mini-message {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  line-height: 1.5;
  animation: fadeIn 0.3s ease;
}

.mini-message.user {
  align-self: flex-end;
  background: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}

.mini-message.assistant {
  align-self: flex-start;
  background: var(--bg-secondary, #1e293b);
  color: var(--text-primary, #f1f5f9);
  border-bottom-left-radius: 4px;
}

.mini-message.typing {
  padding: 1rem;
}

.mini-typing-dots {
  display: flex;
  gap: 0.25rem;
}

.mini-typing-dots span {
  width: 8px;
  height: 8px;
  background: var(--text-secondary, #94a3b8);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite;
}

.mini-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.mini-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.mini-chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-secondary, #1e293b);
  border-top: 1px solid var(--border-color, #334155);
}

.mini-chat-input input {
  flex: 1;
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  color: var(--text-primary, #f1f5f9);
  font-size: 0.9375rem;
}

.mini-chat-input input:focus {
  outline: none;
  border-color: #3b82f6;
}

.quick-actions-fab {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  margin-right: 0.5rem;
  animation: slideUp 0.3s ease;
}

.quick-action-fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-secondary, #1e293b);
  border: 1px solid var(--border-color, #334155);
  color: var(--text-secondary, #94a3b8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.quick-action-fab:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  transform: scale(1.1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 480px) {
  .floating-chat-wrapper {
    bottom: 1rem;
    right: 1rem;
  }
  
  .floating-chat-mini {
    width: calc(100vw - 2rem);
    height: 60vh;
    position: fixed;
    bottom: 5rem;
    right: 1rem;
  }
}
`;
