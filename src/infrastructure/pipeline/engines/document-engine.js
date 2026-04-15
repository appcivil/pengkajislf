/**
 * Document Engine untuk pemrosesan DOCX, XLSX, PPTX, PDF
 * @module infrastructure/pipeline/engines/document-engine
 */

import { IDocumentEngine } from '../../../core/smart-ai/engine-interface.js';
import { FileType, PipelineType } from '../../../core/smart-ai/types.js';
import * as docx from 'docx';
import PizZip from 'pizzip';
import * as XLSX from 'xlsx';

/**
 * Engine untuk pemrosesan dokumen Office dan PDF
 */
export class DocumentEngine extends IDocumentEngine {
  constructor(config = {}) {
    super('DocumentEngine', config);
    
    this.supportedTypes = [
      FileType.DOCX,
      FileType.XLSX,
      FileType.PPTX,
      FileType.PDF,
      FileType.CSV
    ];
    
    this.extractionMode = config.extractionMode || 'full';
    this.maxFileSize = config.maxFileSize || 50 * 1024 * 1024; // 50MB
  }

  /**
   * Inisialisasi engine
   * @returns {Promise<boolean>}
   */
  async initialize() {
    this.isInitialized = true;
    return true;
  }

  /**
   * Preprocessing dokumen
   * @param {Object} input - Input dengan file dan type
   * @returns {Promise<Object>}
   */
  async preprocess(input) {
    const { file, type } = input;
    
    if (!file) {
      throw new Error('File diperlukan untuk preprocessing');
    }

    // Validasi ukuran file
    if (file.size > this.maxFileSize) {
      throw new Error(`File terlalu besar. Maksimum ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Convert ke buffer
    const buffer = await file.arrayBuffer();
    
    return {
      file,
      type,
      buffer,
      size: file.size,
      name: file.name
    };
  }

  /**
   * Proses dokumen lengkap
   * @param {Object} input - Input dokumen
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async process(input, options = {}) {
    const preprocessed = await this.preprocess(input);
    const { type } = preprocessed;

    const result = {
      type,
      text: '',
      structure: [],
      tables: [],
      metadata: {}
    };

    switch (type) {
      case FileType.DOCX:
        Object.assign(result, await this._processDOCX(preprocessed, options));
        break;
      case FileType.XLSX:
      case FileType.CSV:
        Object.assign(result, await this._processSpreadsheet(preprocessed, options));
        break;
      case FileType.PPTX:
        Object.assign(result, await this._processPPTX(preprocessed, options));
        break;
      case FileType.PDF:
        Object.assign(result, await this._processPDF(preprocessed, options));
        break;
      default:
        throw new Error(`Tipe dokumen tidak didukung: ${type}`);
    }

    return this.postprocess(result);
  }

  /**
   * Ekstrak teks dari dokumen
   * @param {Object} input - Input dokumen yang sudah dipreprocess
   * @returns {Promise<string>}
   */
  async extractText(input) {
    const result = await this.process(input, { extractOnly: true });
    return result.text || '';
  }

  /**
   * Ekstrak struktur dari dokumen
   * @param {Object} input - Input dokumen
   * @returns {Promise<Array<Object>>}
   */
  async extractStructure(input) {
    const result = await this.process(input, { structureOnly: true });
    return result.structure || [];
  }

  /**
   * Ekstrak tabel dari dokumen
   * @param {Object} input - Input dokumen
   * @returns {Promise<Array<Object>>}
   */
  async extractTables(input) {
    const result = await this.process(input, { tablesOnly: true });
    return result.tables || [];
  }

  /**
   * Generate preview dari dokumen
   * @param {Object} input - Input dokumen
   * @returns {Promise<string>}
   */
  async generatePreview(input) {
    const preprocessed = await this.preprocess(input);
    const { type, buffer } = preprocessed;

    switch (type) {
      case FileType.DOCX:
        return this._generateDOCXPreview(buffer);
      case FileType.XLSX:
        return this._generateSpreadsheetPreview(buffer);
      case FileType.PDF:
        return this._generatePDFPreview(buffer);
      default:
        return '<div>Preview tidak tersedia untuk tipe ini</div>';
    }
  }

  /**
   * Postprocessing hasil
   * @param {Object} result - Hasil pemrosesan
   * @returns {Promise<Object>}
   */
  async postprocess(result) {
    // Bersihkan teks
    if (result.text) {
      result.text = this._cleanText(result.text);
    }

    // Normalisasi struktur
    if (result.structure) {
      result.structure = this._normalizeStructure(result.structure);
    }

    return result;
  }

  // ============================================================================
  // PRIVATE METHODS - DOCX
  // ============================================================================

  /**
   * Proses file DOCX
   * @private
   */
  async _processDOCX(preprocessed, options) {
    try {
      const { buffer } = preprocessed;
      
      // Gunakan PizZip untuk extract content
      const zip = new PizZip(buffer);
      
      // Extract document.xml
      const xmlContent = zip.file('word/document.xml');
      if (!xmlContent) {
        throw new Error('Invalid DOCX file: document.xml not found');
      }

      const xmlText = xmlContent.asText();
      
      // Parse XML sederhana untuk ekstrak teks
      const text = this._extractTextFromXML(xmlText);
      
      // Ekstrak paragraphs untuk struktur
      const paragraphs = this._extractParagraphsFromXML(xmlText);
      
      // Ekstrak tabel jika ada
      const tables = [];
      if (!options.extractOnly) {
        const tablesXML = zip.file('word/tables.xml');
        if (tablesXML) {
          // TODO: Parse tabel dari XML
        }
      }

      return {
        text,
        structure: paragraphs.map((p, i) => ({
          id: `p-${i}`,
          type: 'paragraph',
          text: p.text,
          style: p.style,
          level: this._detectHeadingLevel(p.style)
        })),
        tables
      };
    } catch (error) {
      console.error('[DocumentEngine] Error processing DOCX:', error);
      return { text: '', structure: [], tables: [] };
    }
  }

  /**
   * Generate preview HTML untuk DOCX
   * @private
   */
  async _generateDOCXPreview(buffer) {
    try {
      const result = await this._processDOCX({ buffer }, {});
      
      // Generate HTML sederhana
      let html = '<div class="docx-preview">';
      
      result.structure.forEach(p => {
        const tag = p.level > 0 ? `h${p.level}` : 'p';
        html += `<${tag}>${this._escapeHtml(p.text)}</${tag}>`;
      });
      
      html += '</div>';
      return html;
    } catch (error) {
      return '<div>Error generating preview</div>';
    }
  }

  // ============================================================================
  // PRIVATE METHODS - SPREADSHEET
  // ============================================================================

  /**
   * Proses file XLSX/CSV
   * @private
   */
  async _processSpreadsheet(preprocessed, options) {
    try {
      const { buffer, type } = preprocessed;
      
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      const result = {
        text: '',
        structure: [],
        tables: []
      };

      // Proses setiap sheet
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Tambah ke tables
        result.tables.push({
          name: sheetName,
          data: jsonData,
          rowCount: jsonData.length,
          colCount: jsonData[0]?.length || 0
        });

        // Konversi ke teks
        result.text += this._tableToText(jsonData, sheetName);
      });

      // Structure dari sheet names
      result.structure = workbook.SheetNames.map((name, i) => ({
        id: `sheet-${i}`,
        type: 'sheet',
        title: name,
        index: i,
        rowCount: result.tables[i]?.rowCount || 0
      }));

      return result;
    } catch (error) {
      console.error('[DocumentEngine] Error processing spreadsheet:', error);
      return { text: '', structure: [], tables: [] };
    }
  }

  /**
   * Generate preview untuk spreadsheet
   * @private
   */
  async _generateSpreadsheetPreview(buffer) {
    try {
      const result = await this._processSpreadsheet({ buffer }, {});
      
      let html = '<div class="spreadsheet-preview">';
      
      result.tables.forEach(table => {
        html += `<h4>${this._escapeHtml(table.name)}</h4>`;
        html += '<table class="preview-table">';
        
        // Hanya tampilkan max 10 baris untuk preview
        const previewData = table.data.slice(0, 10);
        
        previewData.forEach((row, i) => {
          html += '<tr>';
          row.forEach(cell => {
            const tag = i === 0 ? 'th' : 'td';
            html += `<${tag}>${this._escapeHtml(String(cell || ''))}</${tag}>`;
          });
          html += '</tr>';
        });
        
        if (table.rowCount > 10) {
          html += `<tr><td colspan="${row.length}" style="text-align:center;color:#666">... ${table.rowCount - 10} baris lagi ...</td></tr>`;
        }
        
        html += '</table>';
      });
      
      html += '</div>';
      return html;
    } catch (error) {
      return '<div>Error generating preview</div>';
    }
  }

  // ============================================================================
  // PRIVATE METHODS - PPTX
  // ============================================================================

  /**
   * Proses file PPTX
   * @private
   */
  async _processPPTX(preprocessed, options) {
    try {
      const { buffer } = preprocessed;
      const zip = new PizZip(buffer);
      
      // List semua slide
      const slideFiles = Object.keys(zip.files).filter(
        name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      ).sort();

      const result = {
        text: '',
        structure: [],
        tables: []
      };

      slideFiles.forEach((slideFile, index) => {
        const xmlContent = zip.file(slideFile).asText();
        const slideText = this._extractTextFromXML(xmlContent);
        
        result.text += `\n--- Slide ${index + 1} ---\n${slideText}\n`;
        
        result.structure.push({
          id: `slide-${index}`,
          type: 'slide',
          index: index + 1,
          text: slideText.substring(0, 200) + (slideText.length > 200 ? '...' : '')
        });
      });

      return result;
    } catch (error) {
      console.error('[DocumentEngine] Error processing PPTX:', error);
      return { text: '', structure: [], tables: [] };
    }
  }

  // ============================================================================
  // PRIVATE METHODS - PDF
  // ============================================================================

  /**
   * Proses file PDF
   * @private
   */
  async _processPDF(preprocessed, options) {
    // PDF processing memerlukan library PDF.js atau pdf-lib
    // Implementasi placeholder - akan menggunakan service worker atau server
    console.log('[DocumentEngine] PDF processing - using placeholder');
    
    return {
      text: '[PDF content extraction requires server-side processing or PDF.js]',
      structure: [],
      tables: [],
      needsServerProcessing: true
    };
  }

  /**
   * Generate preview untuk PDF
   * @private
   */
  async _generatePDFPreview(buffer) {
    // PDF preview menggunakan object tag atau iframe
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    return `<iframe src="${url}" style="width:100%;height:600px;border:none;"></iframe>`;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Extract teks dari XML
   * @private
   */
  _extractTextFromXML(xml) {
    // Regex untuk extract teks dari XML tags
    const textMatches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    return textMatches
      .map(match => match.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract paragraphs dari XML
   * @private
   */
  _extractParagraphsFromXML(xml) {
    const paragraphs = [];
    const paraMatches = xml.match(/<w:p[^>]*>.*?<\/w:p>/gs) || [];
    
    paraMatches.forEach(para => {
      const text = this._extractTextFromXML(para);
      if (text) {
        const styleMatch = para.match(/<w:pStyle[^>]*w:val="([^"]*)"/);
        paragraphs.push({
          text,
          style: styleMatch ? styleMatch[1] : 'Normal'
        });
      }
    });
    
    return paragraphs;
  }

  /**
   * Deteksi level heading dari style
   * @private
   */
  _detectHeadingLevel(style) {
    if (style.includes('Heading1') || style === 'Judul1') return 1;
    if (style.includes('Heading2') || style === 'Judul2') return 2;
    if (style.includes('Heading3') || style === 'Judul3') return 3;
    if (style.includes('Heading4') || style === 'Judul4') return 4;
    return 0;
  }

  /**
   * Konversi tabel ke teks
   * @private
   */
  _tableToText(data, sheetName) {
    let text = `\n=== ${sheetName} ===\n`;
    data.forEach(row => {
      text += row.join('\t') + '\n';
    });
    return text;
  }

  /**
   * Bersihkan teks
   * @private
   */
  _cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .trim();
  }

  /**
   * Normalisasi struktur
   * @private
   */
  _normalizeStructure(structure) {
    return structure
      .filter(item => item.text && item.text.trim())
      .map((item, index) => ({
        ...item,
        id: item.id || `struct-${index}`,
        text: item.text.trim()
      }));
  }

  /**
   * Escape HTML entities
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    this.isInitialized = false;
  }
}

export default DocumentEngine;
