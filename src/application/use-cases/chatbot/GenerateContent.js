/**
 * Use Case: GenerateContent
 * Generate berbagai jenis content (image, slide, excel)
 */
import { GeneratedContentDTO } from '../../dto/ChatDTO.js';
import { ChatMessage } from '../../../domain/entities/ChatMessage.js';

export class GenerateContent {
  constructor(chatRepository, chatbotService) {
    this.chatRepository = chatRepository;
    this.chatbotService = chatbotService;
  }

  /**
   * Execute use case
   * @param {Object} params
   * @returns {Promise<GeneratedContentDTO>}
   */
  async execute({ sessionId, type, prompt, data = {}, options = {} }) {
    // Get session
    const session = await this.chatRepository.getSession(sessionId);
    if (!session) {
      throw new Error(`Session dengan ID ${request.sessionId} tidak ditemukan`);
    }

    let result;

    switch (type) {
      case 'image':
        result = await this._generateImage(prompt, options);
        break;
      case 'slide':
        result = await this._generateSlides(prompt, data, options);
        break;
      case 'excel':
        result = await this._generateExcel(prompt, data, options);
        break;
      case 'document':
        result = await this._generateDocument(prompt, data, options);
        break;
      default:
        throw new Error(`Tipe content '${type}' tidak didukung`);
    }

    // Add message ke session
    const message = new ChatMessage({
      role: 'assistant',
      content: `Saya telah menghasilkan ${type} berdasarkan permintaan Anda: "${prompt}"`,
      metadata: {
        type: 'generated_content',
        contentType: type,
        contentId: result.metadata?.id
      },
      attachments: [{
        type,
        name: result.metadata?.filename || `${type}_${Date.now()}`,
        url: result.downloadUrl,
        size: result.metadata?.size,
        mimeType: result.metadata?.mimeType
      }]
    });

    await this.chatRepository.saveMessage(sessionId, message);

    return result;
  }

  /**
   * Generate image
   */
  async _generateImage(prompt, options) {
    const imageResult = await this.chatbotService.generateImage(prompt, options);

    return new GeneratedContentDTO({
      type: 'image',
      content: imageResult.url,
      metadata: {
        ...imageResult.metadata,
        prompt,
        filename: `generated_image_${Date.now()}.png`
      },
      downloadUrl: imageResult.url,
      previewUrl: imageResult.url
    });
  }

  /**
   * Generate slides
   */
  async _generateSlides(topic, data, options) {
    const slidesResult = await this.chatbotService.generateSlides(topic, data, options);

    // Generate PPTX file dari slides data
    const pptxBuffer = await this._createPPTX(slidesResult.slides);
    const blob = new Blob([pptxBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
    });
    const downloadUrl = URL.createObjectURL(blob);

    return new GeneratedContentDTO({
      type: 'slide',
      content: slidesResult.slides,
      metadata: {
        ...slidesResult.metadata,
        slideCount: slidesResult.slides.length,
        topic,
        filename: `presentasi_${topic.replace(/\s+/g, '_')}_${Date.now()}.pptx`
      },
      downloadUrl,
      previewUrl: null
    });
  }

  /**
   * Generate Excel
   */
  async _generateExcel(title, data, options) {
    const excelResult = await this.chatbotService.generateExcel(title, data, options);

    // Create Excel file
    const blob = new Blob([excelResult.buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const downloadUrl = URL.createObjectURL(blob);

    return new GeneratedContentDTO({
      type: 'excel',
      content: excelResult.buffer,
      metadata: {
        ...excelResult.metadata,
        title,
        filename: `${title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
      },
      downloadUrl,
      previewUrl: null
    });
  }

  /**
   * Generate document
   */
  async _generateDocument(title, data, options) {
    // Generate document content menggunakan AI
    const docResult = await this.chatbotService.generateResponse(
      `Buat dokumen dengan judul: ${title}\nData: ${JSON.stringify(data)}`,
      null,
      options
    );

    return new GeneratedContentDTO({
      type: 'document',
      content: docResult.content,
      metadata: {
        title,
        filename: `${title.replace(/\s+/g, '_')}_${Date.now()}.docx`
      },
      downloadUrl: null,
      previewUrl: null
    });
  }

  /**
   * Create PPTX dari slides data
   */
  async _createPPTX(slides) {
    // Placeholder - akan diimplementasikan dengan library pptxgenjs
    // Untuk sekarang, return empty buffer
    return new ArrayBuffer(0);
  }
}
