/**
 * Use Case: ListChatSessions
 * Mendapatkan daftar chat sessions
 */
import { SessionListDTO } from '../../dto/ChatDTO.js';

export class ListChatSessions {
  constructor(chatRepository) {
    this.chatRepository = chatRepository;
  }

  /**
   * Execute use case
   * @param {Object} filters
   * @returns {Promise<SessionListDTO>}
   */
  async execute({ 
    projectId = null, 
    moduleContext = null, 
    page = 1, 
    limit = 20,
    search = null 
  } = {}) {
    const filters = {
      projectId,
      moduleContext,
      search
    };

    // Get sessions dengan pagination
    const sessions = await this.chatRepository.getSessions({
      ...filters,
      limit,
      offset: (page - 1) * limit
    });

    // Get total count
    const total = await this.chatRepository.getSessionCount(filters);

    return new SessionListDTO({
      sessions,
      total,
      page,
      limit
    });
  }
}
