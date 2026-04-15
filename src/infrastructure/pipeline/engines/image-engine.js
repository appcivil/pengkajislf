/**
 * Image Engine untuk pemrosesan gambar dan OCR
 * Menggunakan Tesseract.js untuk OCR dan Canvas API untuk preprocessing
 * @module infrastructure/pipeline/engines/image-engine
 */

import { IImageEngine } from '../../../core/smart-ai/engine-interface.js';
import { FileType, PipelineType } from '../../../core/smart-ai/types.js';

/**
 * Engine untuk pemrosesan gambar dan OCR
 */
export class ImageEngine extends IImageEngine {
  constructor(config = {}) {
    super('ImageEngine', config);
    
    this.supportedTypes = [
      FileType.JPEG,
      FileType.JPG,
      FileType.PNG,
      FileType.GIF,
      FileType.WEBP,
      FileType.TIFF
    ];
    
    this.enableOCR = config.enableOCR !== false;
    this.enablePreprocessing = config.enablePreprocessing !== false;
    this.ocrLanguage = config.ocrLanguage || 'ind+eng';
    this.maxFileSize = config.maxFileSize || 20 * 1024 * 1024; // 20MB
    
    // Tesseract instance (lazy load)
    this.tesseract = null;
    this.tesseractWorker = null;
  }

  /**
   * Inisialisasi engine dan load Tesseract jika OCR diaktifkan
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.enableOCR && !this.tesseract) {
      try {
        // Dynamic import Tesseract.js
        const Tesseract = await import('tesseract.js');
        this.tesseract = Tesseract.default || Tesseract;
        
        // Create worker
        this.tesseractWorker = await this.tesseract.createWorker(this.ocrLanguage);
        
        console.log('[ImageEngine] Tesseract initialized');
      } catch (error) {
        console.warn('[ImageEngine] Tesseract initialization failed:', error);
        this.enableOCR = false;
      }
    }
    
    this.isInitialized = true;
    return true;
  }

  /**
   * Proses gambar lengkap
   * @param {Object} input - Input dengan file
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async process(input, options = {}) {
    await this.initialize();
    
    const file = input.file || input;
    
    if (!(file instanceof File) && !(file instanceof Blob)) {
      throw new Error('Input harus berupa File atau Blob');
    }

    // Validasi ukuran
    if (file.size > this.maxFileSize) {
      throw new Error(`File terlalu besar. Maksimum ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Preprocessing
    let processedImage = file;
    if (this.enablePreprocessing && options.preprocess !== false) {
      processedImage = await this.preprocessImage(file, options.preprocessOptions);
    }

    // OCR
    let ocrResult = null;
    if (this.enableOCR && options.ocr !== false) {
      ocrResult = await this.performOCR(processedImage, options.ocrOptions);
    }

    // Deteksi region
    let regions = [];
    if (options.detectRegions) {
      regions = await this.detectRegions(processedImage);
    }

    // Generate thumbnail/preview jika diminta
    let thumbnail = null;
    if (options.generateThumbnail) {
      thumbnail = await this._generateThumbnail(processedImage, options.thumbnailSize);
    }

    return {
      success: true,
      type: PipelineType.IMAGE,
      originalFile: file,
      processedImage: processedImage !== file ? processedImage : null,
      ocr: ocrResult,
      regions,
      thumbnail,
      metadata: {
        size: file.size,
        type: file.type,
        name: file.name,
        lastModified: file.lastModified
      }
    };
  }

  /**
   * Preprocessing gambar
   * @param {Blob|File} image - Input gambar
   * @param {Object} options - Options preprocessing
   * @returns {Promise<Blob>}
   */
  async preprocessImage(image, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(image);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Hitung dimensi (resize jika terlalu besar)
        let { width, height } = img;
        const maxDimension = options.maxDimension || 4096;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Apply preprocessing
        ctx.filter = this._buildFilterString(options);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Reset filter
        ctx.filter = 'none';
        
        // Convert ke blob
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          image.type || 'image/jpeg',
          options.quality || 0.9
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * OCR - Optical Character Recognition
   * @param {Blob|File} image - Input gambar
   * @param {Object} options - Options OCR
   * @returns {Promise<Object>}
   */
  async performOCR(image, options = {}) {
    if (!this.enableOCR || !this.tesseractWorker) {
      return { text: '', confidence: 0, regions: [] };
    }

    try {
      const result = await this.tesseractWorker.recognize(image, {
        rectangle: options.rectangle || null
      });

      // Ekstrak regions dari result
      const regions = result.data.words?.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1
        }
      })) || [];

      return {
        text: result.data.text || '',
        confidence: result.data.confidence || 0,
        regions,
        paragraphs: result.data.paragraphs?.map(p => p.text) || [],
        lines: result.data.lines?.map(l => l.text) || []
      };
    } catch (error) {
      console.error('[ImageEngine] OCR error:', error);
      return { text: '', confidence: 0, regions: [], error: error.message };
    }
  }

  /**
   * Deteksi region/area penting dalam gambar
   * @param {Blob|File} image - Input gambar
   * @returns {Promise<Array<Object>>}
   */
  async detectRegions(image) {
    // Placeholder untuk deteksi region (table, text blocks, etc)
    // Implementasi nyata memerlukan OpenCV.js atau model ML
    
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(image);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // Simple region detection: bagi gambar ke grid
        const regions = [];
        const gridSize = 3;
        const cellWidth = img.width / gridSize;
        const cellHeight = img.height / gridSize;
        
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            regions.push({
              id: `region-${row}-${col}`,
              type: 'grid',
              bbox: {
                x: col * cellWidth,
                y: row * cellHeight,
                width: cellWidth,
                height: cellHeight
              },
              center: {
                x: (col + 0.5) * cellWidth,
                y: (row + 0.5) * cellHeight
              }
            });
          }
        }
        
        resolve(regions);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };
      
      img.src = url;
    });
  }

  /**
   * Resize gambar
   * @param {Blob|File} image - Input gambar
   * @param {Object} dimensions - { width, height }
   * @returns {Promise<Blob>}
   */
  async resize(image, dimensions) {
    return this.preprocessImage(image, {
      maxDimension: Math.max(dimensions.width, dimensions.height)
    });
  }

  /**
   * Convert gambar ke format lain
   * @param {Blob|File} image - Input gambar
   * @param {string} format - Format target (jpeg, png, webp)
   * @param {number} quality - Kualitas (0-1)
   * @returns {Promise<Blob>}
   */
  async convert(image, format = 'jpeg', quality = 0.9) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(image);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const mimeType = `image/${format}`;
        
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          mimeType,
          quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Generate thumbnail
   * @private
   */
  async _generateThumbnail(image, size = { width: 200, height: 200 }) {
    return this.preprocessImage(image, {
      maxDimension: Math.max(size.width, size.height),
      quality: 0.7
    });
  }

  /**
   * Build filter string untuk Canvas API
   * @private
   */
  _buildFilterString(options = {}) {
    const filters = [];
    
    if (options.grayscale) filters.push('grayscale(100%)');
    if (options.sepia) filters.push('sepia(100%)');
    if (options.brightness) filters.push(`brightness(${options.brightness}%)`);
    if (options.contrast) filters.push(`contrast(${options.contrast}%)`);
    if (options.saturation) filters.push(`saturate(${options.saturation}%)`);
    if (options.blur) filters.push(`blur(${options.blur}px)`);
    if (options.sharpen) filters.push('contrast(120%) saturate(120%)');
    
    return filters.join(' ') || 'none';
  }

  /**
   * Get OCR capabilities
   * @returns {Object}
   */
  getOCRCapabilities() {
    return {
      available: this.enableOCR && !!this.tesseract,
      languages: ['ind', 'eng', 'ind+eng'],
      supportsRTL: false,
      supportsVertical: false
    };
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
    this.tesseract = null;
    this.isInitialized = false;
  }
}

export default ImageEngine;
