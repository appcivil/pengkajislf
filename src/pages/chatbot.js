/**
 * Chatbot Page
 * Page untuk AI Chatbot dengan fitur lengkap
 */
import { ChatContainer } from '../components/chatbot/ChatContainer.js';
import { SupabaseChatRepository } from '../infrastructure/persistence/SupabaseChatRepository.js';
import { ChatbotService } from '../infrastructure/ai/ChatbotService.js';
import { ApplicationDataProvider } from '../infrastructure/chat/ApplicationDataProvider.js';
import {
  SendMessage,
  CreateChatSession,
  GenerateContent,
  GetChatHistory,
  ListChatSessions
} from '../application/use-cases/chatbot/index.js';
import { SendMessageRequest } from '../application/dto/ChatDTO.js';

// CSS Styles untuk chatbot
const chatStyles = `
.chat-page {
  height: calc(100vh - 60px);
  display: flex;
  overflow: hidden;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #0f172a);
  border-radius: 12px;
  margin: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary, #1e293b);
  border-bottom: 1px solid var(--border-color, #334155);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.chat-title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #f1f5f9);
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #94a3b8);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot.online {
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
}

.chat-header-right {
  display: flex;
  gap: 0.5rem;
}

.chat-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-sidebar {
  width: 260px;
  background: var(--bg-secondary, #1e293b);
  border-right: 1px solid var(--border-color, #334155);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #334155);
}

.btn-block {
  width: 100%;
  justify-content: center;
}

.sidebar-sessions {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.empty-sessions {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary, #94a3b8);
}

.empty-sessions i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.session-item:hover {
  background: var(--bg-hover, #334155);
}

.session-item.active {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.session-item i {
  color: var(--text-secondary, #94a3b8);
  font-size: 0.875rem;
}

.session-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.session-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #f1f5f9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  font-size: 0.75rem;
  color: var(--text-secondary, #94a3b8);
}

.session-item .delete-session {
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .delete-session {
  opacity: 1;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-message {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-message.assistant {
  align-self: flex-start;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-secondary, #1e293b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #94a3b8);
  font-size: 0.875rem;
  flex-shrink: 0;
}

.chat-message.user .message-avatar {
  background: #3b82f6;
  color: white;
}

.message-content {
  background: var(--bg-secondary, #1e293b);
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  max-width: 100%;
}

.chat-message.user .message-content {
  background: #3b82f6;
  color: white;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 4px;
}

.message-text {
  line-height: 1.6;
  font-size: 0.9375rem;
}

.message-text pre {
  background: rgba(0,0,0,0.3);
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-text code {
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
}

.message-text p {
  margin: 0 0 0.75rem 0;
}

.message-text p:last-child {
  margin-bottom: 0;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

.chat-message.user .message-meta {
  color: rgba(255,255,255,0.8);
}

.message-model {
  background: rgba(255,255,255,0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0,0,0,0.2);
  border-radius: 6px;
  font-size: 0.875rem;
}

.attachment-item.image {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.attachment-item.excel {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.attachment-item.slide {
  background: rgba(249, 115, 22, 0.15);
  color: #fb923c;
}

.attachment-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-input-area {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary, #1e293b);
  border-top: 1px solid var(--border-color, #334155);
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 20px;
  color: var(--text-secondary, #94a3b8);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-btn:hover {
  background: var(--bg-hover, #334155);
  border-color: #3b82f6;
  color: #3b82f6;
}

.quick-action-btn.reasoning {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
  border-color: rgba(139, 92, 246, 0.3);
  color: #a78bfa;
}

.quick-action-btn.reasoning:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
  border-color: #8b5cf6;
  color: #c4b5fd;
}

.quick-action-btn.reasoning.active {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-color: #8b5cf6;
  color: white;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
}

.quick-actions.secondary {
  margin-top: 0.5rem;
  opacity: 0.8;
}

.quick-actions.secondary .quick-action-btn {
  font-size: 0.75rem;
  padding: 0.375rem 0.625rem;
}

.quick-action-btn i {
  font-size: 0.875rem;
}

/* Thinking Process Styles */
.thinking-process {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.05));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.thinking-process pre {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.5rem;
  white-space: pre-wrap;
  font-family: 'Fira Code', monospace;
  font-size: 0.8125rem;
  color: #94a3b8;
}

.final-answer {
  border-top: 1px solid var(--border-color, #334155);
  padding-top: 1rem;
}

.input-container {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.input-wrapper {
  flex: 1;
  position: relative;
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 12px;
  display: flex;
  align-items: flex-end;
  padding: 0.5rem;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: #3b82f6;
}

.input-wrapper textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary, #f1f5f9);
  font-size: 0.9375rem;
  line-height: 1.5;
  resize: none;
  max-height: 150px;
  padding: 0.5rem;
  font-family: inherit;
}

.input-wrapper textarea:focus {
  outline: none;
}

.input-wrapper textarea::placeholder {
  color: var(--text-secondary, #94a3b8);
}

.attach-btn {
  color: var(--text-secondary, #94a3b8);
  padding: 0.5rem;
}

.attach-btn:hover {
  color: #3b82f6;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hints {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #94a3b8);
}

.typing-indicator {
  opacity: 0.7;
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 0;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: var(--text-secondary, #94a3b8);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Model Selector */
.model-selector {
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 8px;
  color: var(--text-primary, #f1f5f9);
  font-size: 0.8125rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  outline: none;
  margin-right: 0.5rem;
  max-width: 160px;
}

.model-selector:hover {
  border-color: #3b82f6;
}

.model-selector:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.model-selector option {
  background: var(--bg-secondary, #1e293b);
  color: var(--text-primary, #f1f5f9);
  padding: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .chat-sidebar {
    display: none;
  }
  
  .chat-message {
    max-width: 95%;
  }
  
  .quick-actions {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 0.5rem;
  }
}
`;

// Dependency injection
let chatRepository = null;
let chatbotService = null;
let dataProvider = null;
let sendMessageUseCase = null;
let createSessionUseCase = null;
let generateContentUseCase = null;
let getChatHistoryUseCase = null;
let listChatSessionsUseCase = null;

/**
 * Initialize dependencies
 */
async function initDependencies() {
  if (!chatRepository) {
    chatRepository = new SupabaseChatRepository();
    dataProvider = new ApplicationDataProvider();
    
    // Get memory service dari global atau buat instance baru
    let memoryService = window.memoryService;
    if (!memoryService) {
      const { MemoryService } = await import('../infrastructure/memory/MemoryService.js');
      const { SupabaseAIMemoryRepository } = await import('../infrastructure/persistence/SupabaseAIMemoryRepository.js');
      memoryService = new MemoryService(new SupabaseAIMemoryRepository());
    }
    
    chatbotService = new ChatbotService({
      dataProvider,
      memoryService
    });

    sendMessageUseCase = new SendMessage(chatRepository, chatbotService, dataProvider);
    createSessionUseCase = new CreateChatSession(chatRepository);
    generateContentUseCase = new GenerateContent(chatRepository, chatbotService);
    getChatHistoryUseCase = new GetChatHistory(chatRepository);
    listChatSessionsUseCase = new ListChatSessions(chatRepository);
  }
}

/**
 * Chatbot Page
 */
export async function chatbotPage(params = {}) {
  await initDependencies();

  const { projectId = null, moduleContext = null } = params;

  const page = document.createElement('div');
  page.className = 'page chat-page';

  // Add styles
  const styleEl = document.createElement('style');
  styleEl.textContent = chatStyles;
  page.appendChild(styleEl);

  // Create chat container
  const chatContainer = new ChatContainer({
    projectId,
    moduleContext,
    onClose: () => window.navigate('dashboard')
  });

  const chatEl = chatContainer.render();
  page.appendChild(chatEl);

  // Setup event listeners untuk chat events
  setupChatEventListeners(chatContainer);

  // Load initial data
  loadInitialData(chatContainer, projectId, moduleContext);

  return page;
}

/**
 * Setup chat event listeners
 */
function setupChatEventListeners(chatContainer) {
  // Send message
  document.addEventListener('chat-send-message', async (e) => {
    const { sessionId, content, projectId, moduleContext, model, reasoningMode } = e.detail;

    try {
      const request = new SendMessageRequest({
        sessionId,
        content,
        options: {
          projectId,
          moduleContext,
          model,
          reasoningMode
        }
      });

      const response = await sendMessageUseCase.execute(request);
      
      // Add AI response ke UI
      chatContainer._setLoading(false);
      chatContainer._addMessage({
        role: 'assistant',
        content: response.message.content,
        timestamp: response.timestamp,
        model: response.message.model,
        attachments: response.attachments
      });

      // Show suggested actions
      if (response.metadata?.suggestedActions?.length > 0) {
        // TODO: Render suggested actions
      }
    } catch (error) {
      console.error('Error sending message:', error);
      chatContainer._setLoading(false);
      chatContainer._addMessage({
        role: 'assistant',
        content: `Maaf, terjadi kesalahan: ${error.message}`,
        isError: true
      });
    }
  });

  // Create session
  document.addEventListener('chat-create-session', async (e) => {
    try {
      const { projectId, moduleContext } = e.detail;
      const request = {
        title: 'Chat Baru',
        projectId,
        moduleContext
      };

      const session = await createSessionUseCase.execute(request);
      
      chatContainer.setSession(session.id);
      chatContainer.loadMessages(session.messages);
      
      // Refresh session list
      refreshSessionList(chatContainer);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  });

  // Load session
  document.addEventListener('chat-load-session', async (e) => {
    try {
      const { sessionId } = e.detail;
      
      const { messages, session } = await getChatHistoryUseCase.execute({
        sessionId
      });
      
      chatContainer.setSession(sessionId);
      chatContainer.loadMessages(messages);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  });

  // Delete session
  document.addEventListener('chat-delete-session', async (e) => {
    try {
      const { sessionId } = e.detail;
      await chatRepository.deleteSession(sessionId);
      
      // Refresh session list
      refreshSessionList(chatContainer);
      
      // If current session deleted, create new one
      if (chatContainer.sessionId === sessionId) {
        chatContainer.setSession(null);
        chatContainer.loadMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  });

  // Generate content
  document.addEventListener('chat-generate-content', async (e) => {
    try {
      const { sessionId, type, prompt } = e.detail;
      
      chatContainer._setLoading(true);
      
      const result = await generateContentUseCase.execute({
        sessionId,
        type,
        prompt
      });

      chatContainer._setLoading(false);
      
      // Show generated content
      chatContainer._addMessage({
        role: 'assistant',
        content: `${type === 'image' ? '🖼️' : type === 'slide' ? '📑' : type === 'excel' ? '📊' : '📄'} ${result.type} telah dibuat: **${result.metadata.title || prompt}**`,
        attachments: [{
          type: result.type,
          name: result.metadata.filename,
          url: result.downloadUrl,
          size: result.metadata.size
        }]
      });
    } catch (error) {
      console.error('Error generating content:', error);
      chatContainer._setLoading(false);
      chatContainer._addMessage({
        role: 'assistant',
        content: `Gagal membuat ${e.detail.type}: ${error.message}`,
        isError: true
      });
    }
  });
}

/**
 * Load initial data
 */
async function loadInitialData(chatContainer, projectId, moduleContext) {
  try {
    // Load recent sessions
    refreshSessionList(chatContainer);

    // Create new session jika ada project context
    if (projectId) {
      const request = {
        title: moduleContext ? `Chat ${moduleContext}` : 'Chat Project',
        projectId,
        moduleContext
      };
      
      const session = await createSessionUseCase.execute(request);
      chatContainer.setSession(session.id);
      chatContainer.loadMessages(session.messages);
    } else {
      // Load most recent session atau show welcome
      const sessions = await listChatSessionsUseCase.execute({ limit: 1 });
      
      if (sessions.sessions.length > 0) {
        const session = sessions.sessions[0];
        const { messages } = await getChatHistoryUseCase.execute({
          sessionId: session.id
        });
        
        chatContainer.setSession(session.id);
        chatContainer.loadMessages(messages);
      } else {
        // Create new session
        const session = await createSessionUseCase.execute({
          title: 'Chat Baru'
        });
        chatContainer.setSession(session.id);
        chatContainer.loadMessages(session.messages);
      }
    }
  } catch (error) {
    console.error('Error loading initial data:', error);
    chatContainer.loadMessages([]);
  }
}

/**
 * Refresh session list
 */
async function refreshSessionList(chatContainer) {
  try {
    const sessions = await listChatSessionsUseCase.execute({ limit: 20 });
    chatContainer.updateSessionList(sessions.sessions);
  } catch (error) {
    console.error('Error refreshing session list:', error);
  }
}

/**
 * After render callback
 */
export function afterChatbotRender(params = {}) {
  // Focus input
  setTimeout(() => {
    const input = document.querySelector('#chat-input');
    if (input) input.focus();
  }, 100);
}

// Export untuk lazy loading
export default {
  chatbotPage,
  afterChatbotRender
};
