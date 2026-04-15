/**
 * Repository Interface: IChatRepository
 * Interface untuk persistensi chat sessions dan messages
 */
export class IChatRepository {
  /**
   * Simpan chat session
   * @param {ChatSession} session
   * @returns {Promise<void>}
   */
  async saveSession(session) {
    throw new Error('Method saveSession harus diimplementasikan');
  }

  /**
   * Get session by ID
   * @param {string} sessionId
   * @returns {Promise<ChatSession|null>}
   */
  async getSession(sessionId) {
    throw new Error('Method getSession harus diimplementasikan');
  }

  /**
   * Get semua sessions untuk user/project
   * @param {Object} filters
   * @returns {Promise<ChatSession[]>}
   */
  async getSessions(filters = {}) {
    throw new Error('Method getSessions harus diimplementasikan');
  }

  /**
   * Hapus session
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId) {
    throw new Error('Method deleteSession harus diimplementasikan');
  }

  /**
   * Update session
   * @param {string} sessionId
   * @param {Object} updates
   * @returns {Promise<void>}
   */
  async updateSession(sessionId, updates) {
    throw new Error('Method updateSession harus diimplementasikan');
  }

  /**
   * Simpan message ke session
   * @param {string} sessionId
   * @param {ChatMessage} message
   * @returns {Promise<void>}
   */
  async saveMessage(sessionId, message) {
    throw new Error('Method saveMessage harus diimplementasikan');
  }

  /**
   * Get messages untuk session
   * @param {string} sessionId
   * @param {Object} options
   * @returns {Promise<ChatMessage[]>}
   */
  async getMessages(sessionId, options = {}) {
    throw new Error('Method getMessages harus diimplementasikan');
  }

  /**
   * Search messages
   * @param {string} query
   * @param {Object} filters
   * @returns {Promise<ChatMessage[]>}
   */
  async searchMessages(query, filters = {}) {
    throw new Error('Method searchMessages harus diimplementasikan');
  }

  /**
   * Get recent sessions
   * @param {number} limit
   * @returns {Promise<ChatSession[]>}
   */
  async getRecentSessions(limit = 10) {
    throw new Error('Method getRecentSessions harus diimplementasikan');
  }
}
