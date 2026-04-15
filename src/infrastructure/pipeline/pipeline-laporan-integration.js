/**
 * Pipeline Integration untuk Halaman Laporan
 * Menghubungkan SmartAI Pipeline dengan DOCX Preview dan Generation
 * @module infrastructure/pipeline/pipeline-laporan-integration
 */

/**
 * Class untuk mengintegrasikan Pipeline ke Laporan
 */
export class PipelineLaporanIntegration {
  constructor() {
    this.pipeline = null;
    this.isInitialized = false;
    this.docxPreviewCache = new Map();
    this.maxCacheSize = 5; // LRU cache limit
  }

  /**
   * Set cache dengan LRU eviction
   * @private
   */
  _setCache(key, value) {
    if (this.docxPreviewCache.size >= this.maxCacheSize) {
      // Evict oldest entry (first key)
      const firstKey = this.docxPreviewCache.keys().next().value;
      this.docxPreviewCache.delete(firstKey);
      console.log('[PipelineLaporan] Cache evicted:', firstKey);
    }
    this.docxPreviewCache.set(key, value);
  }

  /**
   * Inisialisasi integrasi
   */
  async initialize() {
    if (this.isInitialized) return;

    // Tunggu pipeline global tersedia
    if (!window.smartAIPipeline) {
      console.log('[PipelineLaporan] Waiting for pipeline...');
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (window.smartAIPipeline) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => { clearInterval(check); resolve(); }, 5000);
      });
    }

    this.pipeline = window.smartAIPipeline;
    this.isInitialized = true;
    console.log('[PipelineLaporan] Integration initialized');
  }

  /**
   * Generate DOCX dengan struktur yang diekstrak oleh Pipeline
   * @param {Object} data - Data laporan
   * @param {Object} options - Options
   * @returns {Promise<Blob>} Blob DOCX
   */
  async generateDOCXWithPipeline(data, options = {}) {
    await this.initialize();

    const outputEngine = this.pipeline.engines?.output;

    if (!outputEngine) {
      throw new Error('Output Engine tidak tersedia');
    }

    // Transform data ke format yang dibutuhkan OutputEngine
    const reportData = this._transformReportData(data);

    // Generate dengan template
    const blob = await outputEngine.generateSLFReport(reportData);

    return blob;
  }

  /**
   * Preview DOCX dengan struktur extraction
   * @param {Blob} blob - Blob DOCX
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Options preview
   * @returns {Promise<Object>} Hasil preview dengan struktur
   */
  async previewDOCX(blob, container, options = {}) {
    await this.initialize();

    const docEngine = this.pipeline.engines?.document;

    // Cache key
    const cacheKey = await this._generateBlobHash(blob);

    // Check cache
    if (this.docxPreviewCache.has(cacheKey)) {
      const cached = this.docxPreviewCache.get(cacheKey);
      this._renderPreview(cached, container, options);
      return cached;
    }

    // Convert blob ke file untuk processing
    const file = new File([blob], 'preview.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    // Process dengan Document Engine
    let extractionResult = null;
    if (docEngine) {
      try {
        extractionResult = await docEngine.process({
          file,
          type: 'docx'
        });
      } catch (err) {
        console.warn('[PipelineLaporan] Extraction failed, using fallback:', err);
      }
    }

    // Fallback ke docx-preview jika Document Engine gagal
    const previewResult = await this._renderWithDocxPreview(blob, container);

    // Combine extraction dengan preview
    const result = {
      preview: previewResult,
      structure: extractionResult?.structure || [],
      text: extractionResult?.text || '',
      tables: extractionResult?.tables || [],
      cacheKey
    };

    // Cache result
    this.docxPreviewCache.set(cacheKey, result);

    // Render navigation jika struktur tersedia
    if (result.structure?.length > 0) {
      this._renderDocumentNavigation(result.structure, options.navContainer);
    }

    return result;
  }

  /**
   * Extract struktur dokumen dari DOCX
   * @param {Blob} blob - Blob DOCX
   * @returns {Promise<Object>} Struktur dokumen
   */
  async extractDocumentStructure(blob) {
    await this.initialize();

    const docEngine = this.pipeline.engines?.document;
    if (!docEngine) {
      throw new Error('Document Engine tidak tersedia');
    }

    const file = new File([blob], 'extract.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const result = await docEngine.process({
      file,
      type: 'docx',
      extractOnly: true
    });

    return {
      structure: result.structure,
      headings: this._extractHeadings(result.structure),
      tables: result.tables,
      text: result.text
    };
  }

  /**
   * Generate summary dari dokumen laporan
   * @param {Blob} blob - Blob DOCX
   * @returns {Promise<Object>} Summary dokumen
   */
  async generateDocumentSummary(blob) {
    await this.initialize();

    // Extract struktur
    const structure = await this.extractDocumentStructure(blob);

    // Hit statistik
    const stats = {
      totalPages: Math.ceil(structure.text.length / 3000), // Estimasi
      wordCount: structure.text.split(/\s+/).length,
      headingCount: structure.headings?.length || 0,
      tableCount: structure.tables?.length || 0
    };

    // Generate summary dengan AI jika RAG tersedia
    let aiSummary = null;
    if (this.pipeline.engines?.rag) {
      try {
        // Index sementara untuk query
        const tempId = `temp-${Date.now()}`;
        await this.pipeline.engines.rag.indexDocument(tempId, structure.text.substring(0, 5000), {
          title: 'Laporan SLF',
          type: 'report'
        });

        // Query summary
        const summaryResult = await this.pipeline.query(
          'Ringkasan isi laporan, temuan utama, dan kesimpulan',
          { sync: true, topK: 3 }
        );

        aiSummary = summaryResult.chunks?.map(c => c.text).join('\n');

        // Cleanup
        await this.pipeline.engines.rag.deleteDocument(tempId);
      } catch (err) {
        console.warn('[PipelineLaporan] AI summary failed:', err);
      }
    }

    return {
      stats,
      structure: structure.headings,
      summary: aiSummary,
      keySections: this._identifyKeySections(structure.headings)
    };
  }

  /**
   * Export laporan ke berbagai format
   * @param {Object} data - Data laporan
   * @param {string} format - Format export (docx, xlsx, json, html)
   * @returns {Promise<Blob>} Blob hasil export
   */
  async exportReport(data, format = 'docx') {
    await this.initialize();

    const outputEngine = this.pipeline.engines?.output;
    if (!outputEngine) {
      throw new Error('Output Engine tidak tersedia');
    }

    const reportData = this._transformReportData(data);

    switch (format.toLowerCase()) {
      case 'docx':
        return await outputEngine.generateSLFReport(reportData);
      case 'xlsx':
        return await this._generateSpreadsheetReport(reportData, outputEngine);
      case 'json':
        return await outputEngine.generate({
          title: reportData.title,
          sections: [
            { type: 'heading', text: 'Data Laporan SLF' },
            { type: 'paragraph', text: JSON.stringify(reportData, null, 2) }
          ]
        }, 'json');
      case 'html':
        return await outputEngine.generate({
          title: reportData.title,
          sections: this._dataToSections(reportData)
        }, 'html');
      default:
        throw new Error(`Format ${format} tidak didukung`);
    }
  }

  /**
   * Clear preview cache
   */
  clearCache() {
    this.docxPreviewCache.clear();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  _transformReportData(data) {
    const {
      proyek = {},
      analisis = {},
      checklist = [],
      summaries = {}
    } = data;

    return {
      title: `Laporan Evaluasi SLF - ${proyek.nama_bangunan || 'Unknown'}`,
      projectName: proyek.nama_bangunan || 'Unknown',
      location: proyek.lokasi || '-',
      assessments: {
        structural: {
          summary: summaries.struktur?.summary || '-',
          score: analisis.skor_struktur || 0
        },
        architectural: {
          summary: summaries.architectural?.summary || '-',
          score: analisis.skor_arsitektur || 0
        },
        mep: {
          summary: summaries.electrical?.summary || '-',
          score: analisis.skor_mep || 0
        },
        fireProtection: {
          summary: summaries.fireProtection?.summary || '-',
          score: analisis.skor_kebakaran || 0
        }
      },
      conclusion: {
        text: analisis.narasi_teknis || 'Tidak tersedia',
        status: analisis.status_slf || 'PENDING',
        totalScore: analisis.skor_total || 0
      },
      recommendations: this._extractRecommendations(checklist)
    };
  }

  _extractRecommendations(checklist) {
    if (!Array.isArray(checklist)) return [];

    return checklist
      .filter(item => item.status === 'NON_COMPLY' || item.status === 'PARTIAL')
      .map(item => ({
        item: item.kode,
        description: item.nama,
        recommendation: item.catatan || 'Perlu perbaikan'
      }));
  }

  async _renderWithDocxPreview(blob, container) {
    // Gunakan docx-preview library yang sudah ada
    const docxPreview = await import('docx-preview');

    // Cari target element yang sudah ada di DOM
    let target = document.getElementById('docx-render-target');
    
    // Jika tidak ada, buat baru tapi jangan hapus container
    if (!target && container) {
      target = document.createElement('div');
      target.id = 'docx-render-target';
      target.className = 'render-target';
      target.style.cssText = 'padding:20mm;min-height:257mm;';
      
      // Cari page-container untuk append
      const pageContainer = container.querySelector('#docx-page-container');
      if (pageContainer) {
        pageContainer.innerHTML = '';
        pageContainer.appendChild(target);
      } else {
        // Fallback: append ke container tapi jangan hapis struktur lain
        container.appendChild(target);
      }
    } else if (target) {
      // Clear existing content
      target.innerHTML = '';
    }

    await docxPreview.renderAsync(blob, target, null, {
      className: 'docx-render-output',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true
    });

    return {
      element: target,
      pages: target.querySelectorAll('.docx-wrapper section').length
    };
  }

  _renderPreview(result, container, options) {
    if (!container) return;

    // Cari target yang sudah ada, jangan hapus seluruh container
    const target = document.getElementById('docx-render-target');
    if (target && result.preview?.element) {
      target.innerHTML = '';
      target.appendChild(result.preview.element);
    }
  }

  _renderDocumentNavigation(structure, navContainer) {
    if (!navContainer || !structure?.length) return;

    const headings = structure.filter(s => s.level > 0 || s.type === 'heading');

    // Escape HTML untuk mencegah XSS
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    navContainer.innerHTML = `
      <div class="pipeline-docx-nav">
        <h4>Navigasi Dokumen</h4>
        <ul>
          ${headings.map(h => `
            <li class="nav-level-${escapeHtml(h.level || 1)}">
              <a href="#${escapeHtml(h.id || '')}" data-target="${escapeHtml(h.id || '')}">
                ${escapeHtml(h.text?.substring(0, 50)) || 'Untitled'}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  _extractHeadings(structure) {
    if (!structure) return [];
    return structure.filter(s => s.level > 0 || s.type === 'heading');
  }

  _identifyKeySections(headings) {
    const keyPatterns = [
      /kesimpulan/i,
      /rekomendasi/i,
      /temuan/i,
      /catatan/i,
      /penutup/i
    ];

    return headings
      .filter(h => keyPatterns.some(p => p.test(h.text)))
      .map(h => ({
        title: h.text,
        type: 'key'
      }));
  }

  async _generateSpreadsheetReport(data, outputEngine) {
    // Transform ke format XLSX
    const sheets = [
      {
        name: 'Ringkasan',
        data: [
          ['Laporan Evaluasi SLF'],
          [''],
          ['Nama Bangunan', data.projectName],
          ['Lokasi', data.location],
          ['Status', data.conclusion?.status],
          ['Skor Total', data.conclusion?.totalScore]
        ]
      },
      {
        name: 'Penilaian',
        data: [
          ['Aspek', 'Skor', 'Keterangan'],
          ['Struktur', data.assessments?.structural?.score, data.assessments?.structural?.summary],
          ['Arsitektur', data.assessments?.architectural?.score, data.assessments?.architectural?.summary],
          ['MEP', data.assessments?.mep?.score, data.assessments?.mep?.summary],
          ['Proteksi Kebakaran', data.assessments?.fireProtection?.score, data.assessments?.fireProtection?.summary]
        ]
      },
      {
        name: 'Rekomendasi',
        data: [
          ['Item', 'Deskripsi', 'Rekomendasi'],
          ...(data.recommendations || []).map(r => [r.item, r.description, r.recommendation])
        ]
      }
    ];

    return await outputEngine.generate({
      title: data.title,
      sheets
    }, 'xlsx');
  }

  _dataToSections(data) {
    const sections = [
      { type: 'heading', text: data.title },
      { type: 'paragraph', text: `Proyek: ${data.projectName}` },
      { type: 'paragraph', text: `Lokasi: ${data.location}` }
    ];

    // Add assessments
    sections.push({ type: 'heading', text: 'Penilaian Aspek' });
    Object.entries(data.assessments || {}).forEach(([key, val]) => {
      sections.push({
        type: 'paragraph',
        text: `${key}: ${val.score} - ${val.summary}`
      });
    });

    // Add conclusion
    sections.push({ type: 'heading', text: 'Kesimpulan' });
    sections.push({ type: 'paragraph', text: data.conclusion?.text });

    return sections;
  }

  async _generateBlobHash(blob) {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Singleton instance
let _instance = null;

/**
 * Dapatkan instance PipelineLaporanIntegration
 * @returns {PipelineLaporanIntegration}
 */
export function getPipelineLaporanIntegration() {
  if (!_instance) {
    _instance = new PipelineLaporanIntegration();
  }
  return _instance;
}

export default PipelineLaporanIntegration;
