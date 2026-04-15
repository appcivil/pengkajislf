/**
 * Use Case: GetChatHistory
 * Mendapatkan history chat untuk session
 */
import { ChatResponseDTO } from '../../dto/ChatDTO.js';

export class GetChatHistory {
  constructor(chatRepository) {
    this.chatRepository = chatRepository;
  }

  /**
   * Execute use case
   * @param {Object} params
   * @returns {Promise<{messages: Array, session: Object}>}
   */
  async execute({ sessionId, limit = 50, offset = 0 }) {
    // Get session
    const session = await this.chatRepository.getSession(sessionId);
    if (!session) {
      throw new Error(`Session dengan ID ${sessionId} tidak ditemukan`);
    }

    // Get messages
    const messages = await this.chatRepository.getMessages(sessionId, {
      limit,
      offset
    });

    return {
      messages,
      session: typeof session.toJSON === 'function' ? session.toJSON() : session,
      pagination: {
        total: session.getMessageCount(),
        limit,
        offset,
        hasMore: session.getMessageCount() > offset + limit
      }
    };
  }
}
