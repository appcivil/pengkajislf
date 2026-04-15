/**
 * Interface Standar untuk Semua Engines
 * Mengimplementasikan pola Interface untuk memastikan konsistensi antar engines
 * @module core/smart-ai/engine-interface
 */

import { JobStatus } from './types.js';

/**
 * Interface dasar untuk semua engines
 * Setiap engine harus mengimplementasikan method-method ini
 */
export class IEngine {
  /**
   * @param {string} name - Nama engine
   * @param {Object} config - Konfigurasi engine
   */
  constructor(name, config = {}) {
    if (new.target === IEngine) {
      throw new Error('IEngine adalah interface abstract, tidak bisa diinstansiasi langsung');
    }
    this.name = name;
    this.config = config;
    this.supportedTypes = [];
    this.isInitialized = false;
  }

  /**
   * Inisialisasi engine
   * @returns {Promise<boolean>}
   */
  async initialize() {
    throw new Error('Method initialize() harus diimplementasikan');
  }

  /**
   * Cek apakah engine support tipe file tertentu
   * @param {string} fileType - Tipe file
   * @returns {boolean}
   */
  supports(fileType) {
    return this.supportedTypes.includes(fileType.toLowerCase());
  }

  /**
   * Proses input
   * @param {Object} input - Input data
   * @param {Object} options - Options pemrosesan
   * @returns {Promise<Object>}
   */
  async process(input, options = {}) {
    throw new Error('Method process() harus diimplementasikan');
  }

  /**
   * Preprocessing input sebelum diproses
   * @param {Object} input - Input data
   * @returns {Promise<Object>}
   */
  async preprocess(input) {
    // Default: return input as-is
    return input;
  }

  /**
   * Postprocessing hasil
   * @param {Object} result - Hasil pemrosesan
   * @returns {Promise<Object>}
   */
  async postprocess(result) {
    // Default: return result as-is
    return result;
  }

  /**
   * Dapatkan informasi capabilities engine
   * @returns {Object}
   */
  getCapabilities() {
    return {
      name: this.name,
      supportedTypes: this.supportedTypes,
      isInitialized: this.isInitialized,
      config: this.config
    };
  }

  /**
   * Cleanup resources
   * @returns {Promise<void>}
   */
  async dispose() {
    this.isInitialized = false;
  }
}

/**
 * Interface untuk Document Engines (Word, Excel, PowerPoint, PDF)
 */
export class IDocumentEngine extends IEngine {
  constructor(name, config) {
    super(name, config);
    this.extractionMode = config.extractionMode || 'full'; // 'full', 'text_only', 'structure_only'
  }

  /**
   * Ekstrak teks dari dokumen
   * @param {Object} input - Input dokumen
   * @returns {Promise<string>}
   */
  async extractText(input) {
    throw new Error('Method extractText() harus diimplementasikan');
  }

  /**
   * Ekstrak struktur dari dokumen
   * @param {Object} input - Input dokumen
   * @returns {Promise<Array<Object>>}
   */
  async extractStructure(input) {
    throw new Error('Method extractStructure() harus diimplementasikan');
  }

  /**
   * Ekstrak tabel dari dokumen
   * @param {Object} input - Input dokumen
   * @returns {Promise<Array<Object>>}
   */
  async extractTables(input) {
    throw new Error('Method extractTables() harus diimplementasikan');
  }

  /**
   * Generate preview dari dokumen
   * @param {Object} input - Input dokumen
   * @returns {Promise<string>} - HTML atau URL preview
   */
  async generatePreview(input) {
    throw new Error('Method generatePreview() harus diimplementasikan');
  }
}

/**
 * Interface untuk Image Engine
 */
export class IImageEngine extends IEngine {
  constructor(name, config) {
    super(name, config);
    this.enableOCR = config.enableOCR !== false;
    this.enablePreprocessing = config.enablePreprocessing !== false;
  }

  /**
   * Preprocessing gambar (enhancement, denoise, etc)
   * @param {Blob|File} image - Input gambar
   * @returns {Promise<Blob>}
   */
  async preprocessImage(image) {
    throw new Error('Method preprocessImage() harus diimplementasikan');
  }

  /**
   * OCR - Optical Character Recognition
   * @param {Blob|File} image - Input gambar
   * @returns {Promise<Object>} - { text: string, confidence: number, regions: Array }
   */
  async performOCR(image) {
    throw new Error('Method performOCR() harus diimplementasikan');
  }

  /**
   * Deteksi region/area penting dalam gambar
   * @param {Blob|File} image - Input gambar
   * @returns {Promise<Array<Object>>}
   */
  async detectRegions(image) {
    throw new Error('Method detectRegions() harus diimplementasikan');
  }

  /**
   * Resize/scale gambar
   * @param {Blob|File} image - Input gambar
   * @param {Object} dimensions - { width, height }
   * @returns {Promise<Blob>}
   */
  async resize(image, dimensions) {
    throw new Error('Method resize() harus diimplementasikan');
  }
}

/**
 * Interface untuk CAD Engine
 */
export class ICADEngine extends IEngine {
  constructor(name, config) {
    super(name, config);
    this.enable3D = config.enable3D !== false;
    this.renderMode = config.renderMode || '2d'; // '2d', '3d', 'hybrid'
  }

  /**
   * Parse file CAD ke model internal
   * @param {string|ArrayBuffer} content - Konten file CAD
   * @returns {Promise<Object>}
   */
  async parse(content) {
    throw new Error('Method parse() harus diimplementasikan');
  }

  /**
   * Ekstrak entity geometri
   * @param {Object} model - Model CAD yang sudah diparse
   * @returns {Promise<Array<Object>>}
   */
  async extractEntities(model) {
    throw new Error('Method extractEntities() harus diimplementasikan');
  }

  /**
   * Render CAD ke canvas/target
   * @param {Object} model - Model CAD
   * @param {HTMLElement} target - Target element
   * @returns {Promise<Object>}
   */
  async render(model, target) {
    throw new Error('Method render() harus diimplementasikan');
  }

  /**
   * Analisis dimensi dan pengukuran
   * @param {Object} model - Model CAD
   * @returns {Promise<Object>}
   */
  async analyzeMeasurements(model) {
    throw new Error('Method analyzeMeasurements() harus diimplementasikan');
  }

  /**
   * Export ke format lain
   * @param {Object} model - Model CAD
   * @param {string} format - Format target (svg, pdf, json)
   * @returns {Promise<Blob>}
   */
  async export(model, format) {
    throw new Error('Method export() harus diimplementasikan');
  }
}

/**
 * Interface untuk RAG Engine
 */
export class IRAGEngine extends IEngine {
  constructor(name, config) {
    super(name, config);
    this.vectorStore = config.vectorStore;
    this.embeddingModel = config.embeddingModel;
  }

  /**
   * Chunking teks
   * @param {string} text - Teks yang akan di-chunk
   * @param {Object} options - Options chunking
   * @returns {Promise<Array<string>>}
   */
  async chunk(text, options = {}) {
    throw new Error('Method chunk() harus diimplementasikan');
  }

  /**
   * Generate embedding untuk teks
   * @param {string|Array<string>} text - Teks atau array teks
   * @returns {Promise<Array<number>|Array<Array<number>>>}
   */
  async embed(text) {
    throw new Error('Method embed() harus diimplementasikan');
  }

  /**
   * Simpan chunk ke vector store
   * @param {Array<Object>} chunks - Array chunk dengan embedding
   * @param {Object} metadata - Metadata untuk chunks
   * @returns {Promise<void>}
   */
  async index(chunks, metadata = {}) {
    throw new Error('Method index() harus diimplementasikan');
  }

  /**
   * Retrieval - cari chunk yang relevan
   * @param {string} query - Query pencarian
   * @param {Object} options - Options retrieval
   * @returns {Promise<Array<Object>>}
   */
  async retrieve(query, options = {}) {
    throw new Error('Method retrieve() harus diimplementasikan');
  }

  /**
   * Query dengan RAG (retrieve + generate)
   * @param {string} query - User query
   * @param {Function} generateFn - Function untuk generate response
   * @returns {Promise<Object>}
   */
  async query(query, generateFn) {
    throw new Error('Method query() harus diimplementasikan');
  }
}

/**
 * Interface untuk Web Screenshot Engine
 */
export class IWebEngine extends IEngine {
  constructor(name, config) {
    super(name, config);
    this.proxyUrl = config.proxyUrl;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Search URL dari query
   * @param {string} query - Query pencarian
   * @returns {Promise<Array<Object>>}
   */
  async search(query) {
    throw new Error('Method search() harus diimplementasikan');
  }

  /**
   * Screenshot halaman web
   * @param {string} url - URL target
   * @param {Object} options - Options screenshot
   * @returns {Promise<Blob>}
   */
  async screenshot(url, options = {}) {
    throw new Error('Method screenshot() harus diimplementasikan');
  }

  /**
   * Ekstrak konten dari halaman
   * @param {string} url - URL target
   * @returns {Promise<Object>}
   */
  async extractContent(url) {
    throw new Error('Method extractContent() harus diimplementasikan');
  }

  /**
   * Segmentasi konten (heading, paragraf, tabel)
   * @param {string} content - Konten HTML/text
   * @returns {Promise<Array<Object>>}
   */
  async segment(content) {
    throw new Error('Method segment() harus diimplementasikan');
  }
}

/**
 * Interface untuk Output Engine
 */
export class IOutputEngine extends IEngine {
  constructor(name, config) {
    super(name, config);
    this.templates = config.templates || {};
  }

  /**
   * Generate dokumen output
   * @param {Object} data - Data untuk dokumen
   * @param {string} format - Format output (docx, xlsx, pptx, pdf)
   * @returns {Promise<Blob>}
   */
  async generate(data, format) {
    throw new Error('Method generate() harus diimplementasikan');
  }

  /**
   * Apply template ke data
   * @param {Object} data - Data
   * @param {string} templateName - Nama template
   * @returns {Promise<Object>}
   */
  async applyTemplate(data, templateName) {
    throw new Error('Method applyTemplate() harus diimplementasikan');
  }

  /**
   * Merge multiple outputs
   * @param {Array<Object>} outputs - Array outputs
   * @param {string} format - Format final
   * @returns {Promise<Blob>}
   */
  async merge(outputs, format) {
    throw new Error('Method merge() harus diimplementasikan');
  }
}

export default {
  IEngine,
  IDocumentEngine,
  IImageEngine,
  ICADEngine,
  IRAGEngine,
  IWebEngine,
  IOutputEngine
};
