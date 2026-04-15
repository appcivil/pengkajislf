/**
 * Use Case: SendMessage
 * Mengirim pesan ke chatbot dan mendapatkan response
 */
import { ChatMessage } from '../../../domain/entities/ChatMessage.js';
import { ChatResponseDTO } from '../../dto/ChatDTO.js';
import { MODELS } from '../../../lib/ai-router.js';

export class SendMessage {
  constructor(chatRepository, chatbotService, dataProvider = null) {
    this.chatRepository = chatRepository;
    this.chatbotService = chatbotService;
    this.dataProvider = dataProvider;
  }

  /**
   * Execute use case
   * @param {SendMessageRequest} request
   * @returns {Promise<ChatResponseDTO>}
   */
  async execute(request) {
    // Validasi request
    request.validate();

    // Get atau create session
    let session = await this.chatRepository.getSession(request.sessionId);
    if (!session) {
      throw new Error(`Session dengan ID ${request.sessionId} tidak ditemukan`);
    }

    // Create user message
    const userMessage = ChatMessage.createUserMessage(
      request.content,
      request.attachments
    );

    // Save user message
    await this.chatRepository.saveMessage(session.id, userMessage);
    session.addMessage(userMessage);

    // Generate AI response
    const aiContext = session.getAIContext(this.dataProvider);
    aiContext.userId = session.userId;

    // Get model dari request options atau session settings
    const modelKey = request.options?.model || session.settings?.model || 'GROQ';
    const model = MODELS[modelKey] || MODELS.GROQ;

    // Get reasoning mode dari request
    const reasoningMode = request.options?.reasoningMode || null;

    const aiResponse = await this.chatbotService.generateResponse(
      request.content,
      session,
      {
        ...request.options,
        model,
        reasoningMode,
        context: aiContext,
        attachments: request.attachments || []  // Pass attachments for processing
      }
    );

    // Create assistant message
    const assistantMessage = ChatMessage.createAssistantMessage(
      aiResponse.content,
      aiResponse.metadata
    );
    assistantMessage.model = aiResponse.metadata?.model || session.settings.model;
    assistantMessage.tokens = aiResponse.metadata?.tokens;

    // Save assistant message
    await this.chatRepository.saveMessage(session.id, assistantMessage);
    session.addMessage(assistantMessage);

    // Update session
    await this.chatRepository.saveSession(session);

    // Generate suggested actions berdasarkan context
    const suggestedActions = this._generateSuggestedActions(
      aiResponse.content,
      session,
      aiResponse.metadata
    );

    return ChatResponseDTO.fromDomain(assistantMessage, session, {
      ...aiResponse.metadata,
      suggestedActions
    });
  }

  /**
   * Generate suggested actions berdasarkan response
   */
  _generateSuggestedActions(content, session, metadata) {
    const actions = [];
    const lowerContent = content.toLowerCase();

    // Detect intent dan suggest actions
    if (lowerContent.includes('laporan') || lowerContent.includes('report')) {
      actions.push({
        id: 'generate_report',
        type: 'generate',
        label: 'Buat Laporan',
        icon: 'fa-file-alt',
        payload: { type: 'report' }
      });
    }

    if (lowerContent.includes('presentasi') || lowerContent.includes('slide')) {
      actions.push({
        id: 'generate_slides',
        type: 'generate',
        label: 'Buat Presentasi',
        icon: 'fa-file-powerpoint',
        payload: { type: 'slides' }
      });
    }

    if (lowerContent.includes('excel') || lowerContent.includes('spreadsheet')) {
      actions.push({
        id: 'generate_excel',
        type: 'generate',
        label: 'Buat Excel',
        icon: 'fa-file-excel',
        payload: { type: 'excel' }
      });
    }

    if (lowerContent.includes('gambar') || lowerContent.includes('image') || lowerContent.includes('visual')) {
      actions.push({
        id: 'generate_image',
        type: 'generate',
        label: 'Buat Gambar',
        icon: 'fa-image',
        payload: { type: 'image' }
      });
    }

    if (lowerContent.includes('analisis') || lowerContent.includes('analysis')) {
      actions.push({
        id: 'analyze_data',
        type: 'command',
        label: 'Analisis Data',
        icon: 'fa-chart-bar',
        payload: { type: 'analysis' }
      });
    }

    // Jika ada data project, suggest navigasi
    if (session.projectId) {
      actions.push({
        id: 'view_project',
        type: 'navigate',
        label: 'Lihat Project',
        icon: 'fa-project-diagram',
        payload: { route: 'proyek-detail', params: { id: session.projectId } }
      });
    }

    return actions.slice(0, 3); // Max 3 suggestions
  }
}
