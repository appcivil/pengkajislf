/**
 * Type Definitions untuk SmartAI Pipeline
 * @module core/smart-ai/types
 */

/**
 * @typedef {Object} ProcessingJob
 * @property {string} id - Unique identifier job
 * @property {string} type - Tipe job (document, image, cad, web, rag)
 * @property {string} status - Status job (pending, processing, completed, failed)
 * @property {File|Blob|string} input - Input data
 * @property {Object} metadata - Metadata tambahan
 * @property {string} createdAt - Timestamp creation
 * @property {string|null} completedAt - Timestamp completion
 * @property {Object|null} result - Hasil pemrosesan
 * @property {Error|null} error - Error jika gagal
 */

/**
 * @typedef {Object} PipelineConfig
 * @property {boolean} enableChunking - Aktifkan chunking untuk file besar
 * @property {number} chunkSize - Ukuran chunk dalam token
 * @property {boolean} enableCache - Aktifkan caching
 * @property {number} cacheTTL - Cache time-to-live dalam ms
 * @property {boolean} enableQueue - Aktifkan job queue
 * @property {number} maxRetries - Maximum retry attempts
 */

/**
 * @typedef {Object} ProcessedDocument
 * @property {string} type - Tipe dokumen (docx, xlsx, pptx, pdf)
 * @property {string} text - Konten teks
 * @property {Array<Object>} sections - Section/struktur dokumen
 * @property {Array<Object>} tables - Tabel yang diekstrak
 * @property {Object} metadata - Metadata dokumen
 */

/**
 * @typedef {Object} ProcessedImage
 * @property {string} type - Tipe image (jpeg, png, etc)
 * @property {string} text - Hasil OCR
 * @property {Array<Object>} regions - Region yang terdeteksi
 * @property {Object} metadata - Metadata gambar
 */

/**
 * @typedef {Object} ProcessedCAD
 * @property {string} type - Tipe CAD (dxf, dwg)
 * @property {Array<Object>} entities - Entity geometri
 * @property {Object} bounds - Bounding box
 * @property {Object} layers - Layer information
 * @property {Object} metadata - Metadata CAD
 */

/**
 * @typedef {Object} RAGChunk
 * @property {string} id - Chunk identifier
 * @property {string} text - Teks chunk
 * @property {Array<number>} embedding - Vector embedding
 * @property {Object} metadata - Metadata (source, section, etc)
 * @property {number} score - Similarity score (untuk retrieval)
 */

/**
 * @typedef {Object} AIRequest
 * @property {string} model - Model AI yang digunakan
 * @property {string} prompt - Prompt untuk AI
 * @property {Array<RAGChunk>} context - Context chunks
 * @property {Object} options - Options tambahan
 */

/**
 * @typedef {Object} AIResponse
 * @property {string} text - Response text
 * @property {Object} structured - Structured data (jika ada)
 * @property {Array<Object>} citations - Sumber/kutipan
 * @property {Object} metadata - Metadata response
 */

/**
 * Enum untuk tipe file yang didukung
 * @readonly
 * @enum {string}
 */
export const FileType = {
  // Documents
  DOCX: 'docx',
  XLSX: 'xlsx',
  PPTX: 'pptx',
  PDF: 'pdf',
  
  // Images
  JPEG: 'jpeg',
  JPG: 'jpg',
  PNG: 'png',
  GIF: 'gif',
  WEBP: 'webp',
  TIFF: 'tiff',
  
  // CAD
  DXF: 'dxf',
  DWG: 'dwg',
  
  // Data
  CSV: 'csv',
  JSON: 'json',
  
  // Web
  URL: 'url',
  HTML: 'html',
  
  // Text
  TXT: 'txt',
  MD: 'md'
};

/**
 * Enum untuk status job
 * @readonly
 * @enum {string}
 */
export const JobStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  CHUNKING: 'chunking',
  EXTRACTING: 'extracting',
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Enum untuk tipe pipeline
 * @readonly
 * @enum {string}
 */
export const PipelineType = {
  DOCUMENT: 'document',
  SPREADSHEET: 'spreadsheet',
  SLIDE: 'slide',
  PDF: 'pdf',
  IMAGE: 'image',
  CAD: 'cad',
  WEB_SCREENSHOT: 'web_screenshot',
  RAG: 'rag',
  QUERY: 'query'
};

/**
 * Konfigurasi default pipeline
 * @type {PipelineConfig}
 */
export const DEFAULT_PIPELINE_CONFIG = {
  enableChunking: true,
  chunkSize: 500,
  chunkOverlap: 50,
  enableCache: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 jam
  enableQueue: true,
  maxRetries: 3,
  retryDelay: 1000,
  enableOCR: true,
  ocrLanguage: 'ind+eng',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedTypes: Object.values(FileType)
};

/**
 * Konfigurasi chunking untuk berbagai tipe konten
 * @type {Object}
 */
export const CHUNKING_CONFIG = {
  document: {
    strategy: 'semantic',
    size: 500,
    overlap: 50,
    separators: ['\n\n', '\n', '. ', '! ', '? ']
  },
  regulatory: {
    strategy: 'structured',
    size: 800,
    overlap: 100,
    separators: ['Pasal', 'Bab', 'Bagian', '\n\n'],
    preserveStructure: true
  },
  code: {
    strategy: 'syntax',
    size: 300,
    overlap: 30,
    separators: ['\nfunction ', '\nclass ', '\nconst ', '\nlet ', '\nvar ', '\n']
  },
  table: {
    strategy: 'row_based',
    maxRows: 20,
    preserveHeaders: true
  }
};

export default {
  FileType,
  JobStatus,
  PipelineType,
  DEFAULT_PIPELINE_CONFIG,
  CHUNKING_CONFIG
};
