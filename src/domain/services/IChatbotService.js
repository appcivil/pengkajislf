/**
 * Service Interface: IChatbotService
 * Interface untuk service chatbot AI
 */
export class IChatbotService {
  /**
   * Generate response dari AI
   * @param {string} message
   * @param {ChatSession} session
   * @param {Object} options
   * @returns {Promise<{content: string, metadata: Object}>}
   */
  async generateResponse(message, session, options = {}) {
    throw new Error('Method generateResponse harus diimplementasikan');
  }

  /**
   * Generate streaming response
   * @param {string} message
   * @param {ChatSession} session
   * @param {Function} onChunk
   * @param {Object} options
   * @returns {Promise<void>}
   */
  async generateStreamingResponse(message, session, onChunk, options = {}) {
    throw new Error('Method generateStreamingResponse harus diimplementasikan');
  }

  /**
   * Generate image
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<{url: string, metadata: Object}>}
   */
  async generateImage(prompt, options = {}) {
    throw new Error('Method generateImage harus diimplementasikan');
  }

  /**
   * Generate slide presentation
   * @param {string} topic
   * @param {Object} data
   * @param {Object} options
   * @returns {Promise<{slides: Array, metadata: Object}>}
   */
  async generateSlides(topic, data, options = {}) {
    throw new Error('Method generateSlides harus diimplementasikan');
  }

  /**
   * Generate Excel report
   * @param {string} title
   * @param {Object} data
   * @param {Object} options
   * @returns {Promise<{buffer: ArrayBuffer, metadata: Object}>}
   */
  async generateExcel(title, data, options = {}) {
    throw new Error('Method generateExcel harus diimplementasikan');
  }

  /**
   * Analyze data dengan AI
   * @param {Object} data
   * @param {string} analysisType
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async analyzeData(data, analysisType, options = {}) {
    throw new Error('Method analyzeData harus diimplementasikan');
  }

  /**
   * Get available models
   * @returns {Promise<Array>}
   */
  async getAvailableModels() {
    throw new Error('Method getAvailableModels harus diimplementasikan');
  }
}
