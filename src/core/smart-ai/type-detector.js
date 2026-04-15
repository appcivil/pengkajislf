/**
 * Type Detector untuk mendeteksi tipe file dan konten
 * @module core/smart-ai/type-detector
 */

import { FileType, PipelineType } from './types.js';

/**
 * Class untuk mendeteksi tipe file dan konten
 */
export class TypeDetector {
  constructor() {
    // Mapping ekstensi file ke tipe
    this.extensionMap = {
      // Documents
      'docx': FileType.DOCX,
      'doc': FileType.DOCX,
      'xlsx': FileType.XLSX,
      'xls': FileType.XLSX,
      'pptx': FileType.PPTX,
      'ppt': FileType.PPTX,
      'pdf': FileType.PDF,
      
      // Images
      'jpg': FileType.JPG,
      'jpeg': FileType.JPEG,
      'png': FileType.PNG,
      'gif': FileType.GIF,
      'webp': FileType.WEBP,
      'tiff': FileType.TIFF,
      'tif': FileType.TIFF,
      
      // CAD
      'dxf': FileType.DXF,
      'dwg': FileType.DWG,
      
      // Data
      'csv': FileType.CSV,
      'json': FileType.JSON,
      
      // Web
      'html': FileType.HTML,
      'htm': FileType.HTML,
      
      // Text
      'txt': FileType.TXT,
      'md': FileType.MD
    };

    // Mapping MIME type ke tipe file
    this.mimeMap = {
      // Documents
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileType.DOCX,
      'application/msword': FileType.DOCX,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileType.XLSX,
      'application/vnd.ms-excel': FileType.XLSX,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileType.PPTX,
      'application/vnd.ms-powerpoint': FileType.PPTX,
      'application/pdf': FileType.PDF,
      
      // Images
      'image/jpeg': FileType.JPEG,
      'image/png': FileType.PNG,
      'image/gif': FileType.GIF,
      'image/webp': FileType.WEBP,
      'image/tiff': FileType.TIFF,
      
      // Data
      'text/csv': FileType.CSV,
      'application/json': FileType.JSON,
      
      // Web
      'text/html': FileType.HTML,
      
      // Text
      'text/plain': FileType.TXT,
      'text/markdown': FileType.MD
    };

    // Mapping tipe file ke pipeline
    this.pipelineMap = {
      [FileType.DOCX]: PipelineType.DOCUMENT,
      [FileType.XLSX]: PipelineType.SPREADSHEET,
      [FileType.PPTX]: PipelineType.SLIDE,
      [FileType.PDF]: PipelineType.PDF,
      [FileType.JPEG]: PipelineType.IMAGE,
      [FileType.JPG]: PipelineType.IMAGE,
      [FileType.PNG]: PipelineType.IMAGE,
      [FileType.GIF]: PipelineType.IMAGE,
      [FileType.WEBP]: PipelineType.IMAGE,
      [FileType.TIFF]: PipelineType.IMAGE,
      [FileType.DXF]: PipelineType.CAD,
      [FileType.DWG]: PipelineType.CAD,
      [FileType.CSV]: PipelineType.SPREADSHEET,
      [FileType.HTML]: PipelineType.WEB_SCREENSHOT,
      [FileType.URL]: PipelineType.WEB_SCREENSHOT
    };
  }

  /**
   * Deteksi tipe file dari File object
   * @param {File} file - File object
   * @returns {{fileType: string, pipelineType: string, confidence: number}}
   */
  detectFromFile(file) {
    if (!file || !(file instanceof File)) {
      throw new Error('Input harus berupa File object');
    }

    // Cek dari ekstensi
    const extension = this._getExtension(file.name);
    const mimeType = file.type;

    let detectedType = null;
    let confidence = 0;
    let detectionMethod = '';

    // Prioritas 1: MIME type jika tersedia dan valid
    if (mimeType && this.mimeMap[mimeType]) {
      detectedType = this.mimeMap[mimeType];
      confidence = 0.9;
      detectionMethod = 'mime';
    }

    // Prioritas 2: Ekstensi file
    if (!detectedType && extension && this.extensionMap[extension]) {
      detectedType = this.extensionMap[extension];
      confidence = 0.8;
      detectionMethod = 'extension';
    }

    // Prioritas 3: Magic bytes untuk file tanpa ekstensi atau MIME
    if (!detectedType) {
      detectedType = this._detectFromMagicBytes(file);
      if (detectedType) {
        confidence = 0.95;
        detectionMethod = 'magic_bytes';
      }
    }

    // Jika masih tidak terdeteksi, coba dari nama file pattern
    if (!detectedType) {
      detectedType = this._detectFromPattern(file.name);
      if (detectedType) {
        confidence = 0.6;
        detectionMethod = 'pattern';
      }
    }

    if (!detectedType) {
      return {
        fileType: 'unknown',
        pipelineType: null,
        confidence: 0,
        detectionMethod: 'none'
      };
    }

    const pipelineType = this.pipelineMap[detectedType] || null;

    return {
      fileType: detectedType,
      pipelineType,
      confidence,
      detectionMethod,
      extension,
      mimeType,
      size: file.size
    };
  }

  /**
   * Deteksi tipe dari URL
   * @param {string} url - URL
   * @returns {{fileType: string, pipelineType: string, confidence: number}}
   */
  detectFromURL(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Input harus berupa string URL');
    }

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = this._getExtension(pathname);

      // Cek jika URL adalah web page (tanpa ekstensi file)
      if (!extension || ['html', 'htm', 'php', 'asp', 'jsp'].includes(extension)) {
        return {
          fileType: FileType.URL,
          pipelineType: PipelineType.WEB_SCREENSHOT,
          confidence: 0.8,
          detectionMethod: 'url_pattern'
        };
      }

      // Cek dari ekstensi
      if (this.extensionMap[extension]) {
        const fileType = this.extensionMap[extension];
        return {
          fileType,
          pipelineType: this.pipelineMap[fileType] || null,
          confidence: 0.7,
          detectionMethod: 'url_extension'
        };
      }

      return {
        fileType: FileType.URL,
        pipelineType: PipelineType.WEB_SCREENSHOT,
        confidence: 0.5,
        detectionMethod: 'fallback'
      };
    } catch (error) {
      return {
        fileType: 'unknown',
        pipelineType: null,
        confidence: 0,
        detectionMethod: 'error',
        error: error.message
      };
    }
  }

  /**
   * Deteksi tipe dari content string (untuk text/blob)
   * @param {string} content - Content string
   * @param {string} [hint] - Hint tipe (opsional)
 * @returns {{fileType: string, pipelineType: string, confidence: number}}
   */
  detectFromContent(content, hint = null) {
    if (!content || typeof content !== 'string') {
      return {
        fileType: 'unknown',
        pipelineType: null,
        confidence: 0
      };
    }

    // Cek jika HTML
    if (content.trim().startsWith('<!DOCTYPE html>') || 
        content.trim().startsWith('<html') ||
        content.includes('<body') ||
        content.includes('<head>')) {
      return {
        fileType: FileType.HTML,
        pipelineType: PipelineType.WEB_SCREENSHOT,
        confidence: 0.9,
        detectionMethod: 'content_html'
      };
    }

    // Cek jika JSON
    try {
      JSON.parse(content);
      return {
        fileType: FileType.JSON,
        pipelineType: null,
        confidence: 0.95,
        detectionMethod: 'content_json'
      };
    } catch {
      // Bukan JSON valid
    }

    // Cek jika CSV (sederhana)
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      
      if (commaCount > 2 || tabCount > 2) {
        return {
          fileType: FileType.CSV,
          pipelineType: PipelineType.SPREADSHEET,
          confidence: 0.7,
          detectionMethod: 'content_csv'
        };
      }
    }

    // Default ke text
    return {
      fileType: FileType.TXT,
      pipelineType: null,
      confidence: 0.5,
      detectionMethod: 'content_text'
    };
  }

  /**
   * Deteksi batch untuk multiple files
   * @param {Array<File>} files - Array File objects
   * @returns {Array<Object>}
   */
  detectBatch(files) {
    if (!Array.isArray(files)) {
      throw new Error('Input harus berupa array File objects');
    }

    return files.map(file => ({
      file,
      detection: this.detectFromFile(file)
    }));
  }

  /**
   * Cek apakah tipe file didukung
   * @param {string} fileType - Tipe file
   * @returns {boolean}
   */
  isSupported(fileType) {
    return Object.values(FileType).includes(fileType.toLowerCase());
  }

  /**
   * Dapatkan daftar tipe yang didukung untuk pipeline tertentu
   * @param {string} pipelineType - Tipe pipeline
   * @returns {Array<string>}
   */
  getSupportedTypesForPipeline(pipelineType) {
    return Object.entries(this.pipelineMap)
      .filter(([fileType, pipe]) => pipe === pipelineType)
      .map(([fileType]) => fileType);
  }

  /**
   * Ekstrak ekstensi dari nama file
   * @private
   * @param {string} filename - Nama file
   * @returns {string|null}
   */
  _getExtension(filename) {
    if (!filename || typeof filename !== 'string') return null;
    const match = filename.toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/);
    return match ? match[1] : null;
  }

  /**
   * Deteksi dari magic bytes (signature file)
   * @private
   * @param {File} file - File object
   * @returns {string|null}
   */
  _detectFromMagicBytes(file) {
    // TODO: Implementasi pembacaan magic bytes untuk deteksi yang lebih akurat
    // Memerlukan FileReader untuk membaca beberapa bytes pertama
    // Ini placeholder untuk implementasi future
    return null;
  }

  /**
   * Deteksi dari pattern nama file
   * @private
   * @param {string} filename - Nama file
   * @returns {string|null}
   */
  _detectFromPattern(filename) {
    const patterns = {
      [FileType.PDF]: /\.pdf$/i,
      [FileType.DOCX]: /\.(docx|doc)$/i,
      [FileType.XLSX]: /\.(xlsx|xls)$/i,
      [FileType.PPTX]: /\.(pptx|ppt)$/i,
      [FileType.DXF]: /\.dxf$/i,
      [FileType.DWG]: /\.dwg$/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(filename)) {
        return type;
      }
    }

    return null;
  }

  /**
   * Dapatkan informasi capabilities detector
   * @returns {Object}
   */
  getCapabilities() {
    return {
      supportedFileTypes: Object.values(FileType),
      supportedPipelines: Object.values(PipelineType),
      extensionMap: this.extensionMap,
      mimeMap: Object.keys(this.mimeMap)
    };
  }
}

// Singleton instance
let detectorInstance = null;

/**
 * Dapatkan singleton instance TypeDetector
 * @returns {TypeDetector}
 */
export function getTypeDetector() {
  if (!detectorInstance) {
    detectorInstance = new TypeDetector();
  }
  return detectorInstance;
}

export default TypeDetector;
