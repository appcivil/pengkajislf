/**
 * Repository Interface: IAIMemoryRepository
 * Interface untuk persistensi AI memory
 */
export class IAIMemoryRepository {
  /**
   * Simpan memory
   * @param {AIMemory} memory
   * @returns {Promise<AIMemory>}
   */
  async save(memory) {
    throw new Error('Method save harus diimplementasikan');
  }

  /**
   * Get memory by ID
   * @param {string} id
   * @returns {Promise<AIMemory|null>}
   */
  async getById(id) {
    throw new Error('Method getById harus diimplementasikan');
  }

  /**
   * Get memory by key
   * @param {string} userId
   * @param {string} key
   * @returns {Promise<AIMemory|null>}
   */
  async getByKey(userId, key) {
    throw new Error('Method getByKey harus diimplementasikan');
  }

  /**
   * Query memories dengan filter
   * @param {MemoryQuery} query
   * @returns {Promise<AIMemory[]>}
   */
  async query(query) {
    throw new Error('Method query harus diimplementasikan');
  }

  /**
   * Get relevant memories untuk context
   * @param {string} userId
   * @param {string} context
   * @param {Object} options
   * @returns {Promise<AIMemory[]>}
   */
  async getRelevantForContext(userId, context, options = {}) {
    throw new Error('Method getRelevantForContext harus diimplementasikan');
  }

  /**
   * Update memory
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<AIMemory>}
   */
  async update(id, updates) {
    throw new Error('Method update harus diimplementasikan');
  }

  /**
   * Delete memory
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('Method delete harus diimplementasikan');
  }

  /**
   * Mark memory as accessed
   * @param {string} id
   * @returns {Promise<void>}
   */
  async markAccessed(id) {
    throw new Error('Method markAccessed harus diimplementasikan');
  }

  /**
   * Get user memory stats
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserStats(userId) {
    throw new Error('Method getUserStats harus diimplementasikan');
  }

  /**
   * Cleanup expired memories
   * @param {string} userId
   * @returns {Promise<number>} Jumlah yang dihapus
   */
  async cleanupExpired(userId) {
    throw new Error('Method cleanupExpired harus diimplementasikan');
  }

  /**
   * Get memories by category
   * @param {string} userId
   * @param {string} category
   * @returns {Promise<AIMemory[]>}
   */
  async getByCategory(userId, category) {
    throw new Error('Method getByCategory harus diimplementasikan');
  }

  /**
   * Search memories dengan text similarity (jika vector search tersedia)
   * @param {string} userId
   * @param {string} searchText
   * @param {Object} options
   * @returns {Promise<AIMemory[]>}
   */
  async search(userId, searchText, options = {}) {
    throw new Error('Method search harus diimplementasikan');
  }

  /**
   * Batch save memories
   * @param {AIMemory[]} memories
   * @returns {Promise<AIMemory[]>}
   */
  async batchSave(memories) {
    throw new Error('Method batchSave harus diimplementasikan');
  }
}
