/**
 * Output Generator Engine
 * Engine untuk generate output documents (DOCX, XLSX, PPTX, PDF)
 * @module infrastructure/pipeline/engines/output-engine
 */

import { IOutputEngine } from '../../../core/smart-ai/engine-interface.js';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';

/**
 * Engine untuk generate output documents
 */
export class OutputEngine extends IOutputEngine {
  constructor(config = {}) {
    super('OutputEngine', config);
    
    this.supportedTypes = ['docx', 'xlsx', 'pptx', 'pdf', 'json', 'html'];
    
    // Templates
    this.templates = {
      slf_report: this._getSLFReportTemplate(),
      analysis_summary: this._getAnalysisSummaryTemplate(),
      blank: { sections: [] }
    };
    
    // Default styling
    this.defaultStyles = {
      font: 'Arial',
      fontSize: 11,
      headingFont: 'Arial',
      headingColor: '000000',
      lineSpacing: 360 // 1.5 line spacing
    };
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
   * Generate dokumen output
   * @param {Object} data - Data untuk dokumen
   * @param {string} format - Format output
   * @returns {Promise<Blob>}
   */
  async generate(data, format) {
    await this.initialize();

    switch (format.toLowerCase()) {
      case 'docx':
        return await this._generateDOCX(data);
      case 'xlsx':
        return await this._generateXLSX(data);
      case 'json':
        return await this._generateJSON(data);
      case 'html':
        return await this._generateHTML(data);
      default:
        throw new Error(`Format tidak didukung: ${format}`);
    }
  }

  /**
   * Apply template ke data
   * @param {Object} data - Data
   * @param {string} templateName - Nama template
   * @returns {Promise<Object>}
   */
  async applyTemplate(data, templateName) {
    const template = this.templates[templateName] || this.templates.blank;
    
    return {
      ...template,
      data,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Merge multiple outputs
   * @param {Array<Object>} outputs - Array outputs
   * @param {string} format - Format final
   * @returns {Promise<Blob>}
   */
  async merge(outputs, format) {
    if (format === 'docx') {
      return await this._mergeDOCX(outputs);
    }
    
    if (format === 'xlsx') {
      return await this._mergeXLSX(outputs);
    }
    
    throw new Error(`Merge tidak didukung untuk format: ${format}`);
  }

  /**
   * Generate laporan SLF lengkap
   * @param {Object} reportData - Data laporan
   * @returns {Promise<Blob>}
   */
  async generateSLFReport(reportData) {
    const template = await this.applyTemplate(reportData, 'slf_report');
    
    const sections = [
      this._createTitleSection(reportData.title || 'Laporan Evaluasi SLF'),
      this._createMetadataSection(reportData),
      ...this._createAssessmentSections(reportData.assessments || {}),
      this._createConclusionSection(reportData.conclusion || {}),
      this._createRecommendationSection(reportData.recommendations || [])
    ];

    return await this._generateDOCX({ sections });
  }

  /**
   * Generate analysis summary
   * @param {Object} analysisData - Data analisis
   * @returns {Promise<Blob>}
   */
  async generateAnalysisSummary(analysisData) {
    const sections = [
      this._createTitleSection('Ringkasan Analisis'),
      this._createParagraphSection('Ringkasan hasil analisis dokumen:', {
        heading: 'Hasil Analisis'
      }),
      ...this._createKeyFindingsSections(analysisData.findings || []),
      this._createStatisticsSection(analysisData.statistics || {})
    ];

    return await this._generateDOCX({ sections });
  }

  // ============================================================================
  // PRIVATE METHODS - DOCX Generation
  // ============================================================================

  /**
   * Generate DOCX document
   * @private
   */
  async _generateDOCX(data) {
    const sections = [];
    
    // Process each section
    for (const section of data.sections || []) {
      const docxElements = this._convertSectionToDocx(section);
      sections.push(...docxElements);
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: sections
      }]
    });

    return await Packer.toBlob(doc);
  }

  /**
   * Convert section ke DOCX elements
   * @private
   */
  _convertSectionToDocx(section) {
    const elements = [];

    switch (section.type) {
      case 'title':
        elements.push(new Paragraph({
          text: section.text,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER
        }));
        break;

      case 'heading':
        elements.push(new Paragraph({
          text: section.text,
          heading: this._mapHeadingLevel(section.level || 1)
        }));
        break;

      case 'paragraph':
        elements.push(new Paragraph({
          children: [new TextRun({
            text: section.text,
            size: this._ptToHalfPt(this.defaultStyles.fontSize)
          })],
          spacing: { line: this.defaultStyles.lineSpacing }
        }));
        break;

      case 'table':
        elements.push(this._createDocxTable(section.data, section.headers));
        break;

      case 'list':
        section.items.forEach(item => {
          elements.push(new Paragraph({
            text: item,
            bullet: { level: 0 }
          }));
        });
        break;

      case 'pagebreak':
        elements.push(new Paragraph({
          pageBreakBefore: true
        }));
        break;

      default:
        if (section.text) {
          elements.push(new Paragraph({
            text: section.text
          }));
        }
    }

    return elements;
  }

  /**
   * Create DOCX table
   * @private
   */
  _createDocxTable(data, headers) {
    const rows = [];
    
    // Header row
    if (headers) {
      const headerCells = headers.map(h => new TableCell({
        children: [new Paragraph({
          text: h,
          bold: true
        })]
      }));
      rows.push(new TableRow({ children: headerCells }));
    }

    // Data rows
    for (const row of data || []) {
      const cells = Object.values(row).map(val => new TableCell({
        children: [new Paragraph({
          text: String(val)
        })]
      }));
      rows.push(new TableRow({ children: cells }));
    }

    return new Table({
      rows,
      width: { size: 100, type: 'pct' }
    });
  }

  /**
   * Map heading level
   * @private
   */
  _mapHeadingLevel(level) {
    const levels = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4
    };
    return levels[level] || HeadingLevel.HEADING_1;
  }

  /**
   * Convert pt to half-points (DOCX unit)
   * @private
   */
  _ptToHalfPt(pt) {
    return pt * 2;
  }

  // ============================================================================
  // PRIVATE METHODS - XLSX Generation
  // ============================================================================

  /**
   * Generate XLSX spreadsheet
   * @private
   */
  async _generateXLSX(data) {
    const workbook = XLSX.utils.book_new();

    // Create sheets from data
    if (data.sheets) {
      for (const [name, sheetData] of Object.entries(data.sheets)) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      }
    } else if (data.tables) {
      // Single table
      const worksheet = XLSX.utils.json_to_sheet(data.tables);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    }

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Merge multiple XLSX
   * @private
   */
  async _mergeXLSX(outputs) {
    const mergedWorkbook = XLSX.utils.book_new();
    
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      // Add sheet dengan nama unik
      const sheetName = `Data_${i + 1}`;
      const worksheet = XLSX.utils.json_to_sheet(output.data || []);
      XLSX.utils.book_append_sheet(mergedWorkbook, worksheet, sheetName);
    }

    const buffer = XLSX.write(mergedWorkbook, { type: 'array', bookType: 'xlsx' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ============================================================================
  // PRIVATE METHODS - Other Formats
  // ============================================================================

  /**
   * Generate JSON
   * @private
   */
  async _generateJSON(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    return new Blob([jsonStr], { type: 'application/json' });
  }

  /**
   * Generate HTML report
   * @private
   */
  async _generateHTML(data) {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title || 'Report'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; border-bottom: 2px solid #333; }
    h2 { color: #555; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>`;

    for (const section of data.sections || []) {
      switch (section.type) {
        case 'title':
          html += `<h1>${this._escapeHtml(section.text)}</h1>`;
          break;
        case 'heading':
          html += `<h${section.level || 2}>${this._escapeHtml(section.text)}</h${section.level || 2}>`;
          break;
        case 'paragraph':
          html += `<p>${this._escapeHtml(section.text)}</p>`;
          break;
        case 'table':
          html += this._generateHTMLTable(section.data, section.headers);
          break;
      }
    }

    html += '</body></html>';
    return new Blob([html], { type: 'text/html' });
  }

  /**
   * Generate HTML table
   * @private
   */
  _generateHTMLTable(data, headers) {
    let html = '<table>';
    
    if (headers) {
      html += '<thead><tr>';
      headers.forEach(h => {
        html += `<th>${this._escapeHtml(h)}</th>`;
      });
      html += '</tr></thead>';
    }
    
    html += '<tbody>';
    data.forEach(row => {
      html += '<tr>';
      Object.values(row).forEach(val => {
        html += `<td>${this._escapeHtml(String(val))}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    
    return html;
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

  // ============================================================================
  // PRIVATE METHODS - Section Creators
  // ============================================================================

  _createTitleSection(text) {
    return { type: 'title', text };
  }

  _createMetadataSection(data) {
    return {
      type: 'table',
      headers: ['Field', 'Value'],
      data: [
        { field: 'Tanggal', value: new Date().toLocaleDateString('id-ID') },
        { field: 'Proyek', value: data.projectName || '-' },
        { field: 'Lokasi', value: data.location || '-' }
      ]
    };
  }

  _createAssessmentSections(assessments) {
    const sections = [];
    
    for (const [aspect, data] of Object.entries(assessments)) {
      sections.push({
        type: 'heading',
        text: aspect,
        level: 2
      });
      
      sections.push({
        type: 'paragraph',
        text: data.summary || 'Tidak ada ringkasan'
      });
    }
    
    return sections;
  }

  _createConclusionSection(conclusion) {
    return {
      type: 'paragraph',
      text: conclusion.text || 'Belum ada kesimpulan'
    };
  }

  _createRecommendationSection(recommendations) {
    return {
      type: 'list',
      items: recommendations.length > 0 ? recommendations : ['Tidak ada rekomendasi']
    };
  }

  _createParagraphSection(text, options = {}) {
    return {
      type: 'paragraph',
      text,
      ...options
    };
  }

  _createKeyFindingsSections(findings) {
    return findings.map((finding, i) => ({
      type: 'paragraph',
      text: `${i + 1}. ${finding}`
    }));
  }

  _createStatisticsSection(stats) {
    return {
      type: 'table',
      headers: ['Metrik', 'Nilai'],
      data: Object.entries(stats).map(([key, val]) => ({
        metric: key,
        value: val
      }))
    };
  }

  // ============================================================================
  // PRIVATE METHODS - Templates
  // ============================================================================

  _getSLFReportTemplate() {
    return {
      title: 'Laporan Evaluasi SLF',
      sections: [
        { type: 'title', text: 'Laporan Evaluasi SLF' },
        { type: 'heading', text: '1. Informasi Proyek', level: 1 },
        { type: 'heading', text: '2. Hasil Pengkajian', level: 1 },
        { type: 'heading', text: '3. Kesimpulan', level: 1 },
        { type: 'heading', text: '4. Rekomendasi', level: 1 }
      ]
    };
  }

  _getAnalysisSummaryTemplate() {
    return {
      title: 'Ringkasan Analisis',
      sections: [
        { type: 'title', text: 'Ringkasan Analisis' },
        { type: 'heading', text: 'Temuan Utama', level: 1 },
        { type: 'heading', text: 'Statistik', level: 1 }
      ]
    };
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    this.isInitialized = false;
  }
}

export default OutputEngine;
