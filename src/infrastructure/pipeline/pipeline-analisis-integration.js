/**
 * Pipeline Integration untuk Halaman Analisis AI
 * Menghubungkan SmartAI Pipeline dengan Deep Reasoning Analysis
 * @module infrastructure/pipeline/pipeline-analisis-integration
 */

import { getPipelineIntegration } from './pipeline-integration.js';

/**
 * Class untuk mengintegrasikan Pipeline ke Analisis AI
 */
export class PipelineAnalisisIntegration {
  constructor() {
    this.pipeline = null;
    this.isInitialized = false;
  }

  /**
   * Inisialisasi integrasi
   */
  async initialize() {
    if (this.isInitialized) return;

    // Tunggu pipeline global tersedia
    if (!window.smartAIPipeline) {
      console.log('[PipelineAnalisis] Waiting for pipeline...');
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
    console.log('[PipelineAnalisis] Integration initialized');
  }

  /**
   * Analisis item dengan RAG Query untuk konteks
   * @param {Object} item - Checklist item
   * @param {string} aspek - Aspek analisis
   * @param {Object} options - Options tambahan
   * @returns {Promise<Object>} Hasil analisis dengan konteks RAG
   */
  async analyzeWithRAG(item, aspek, options = {}) {
    await this.initialize();

    const { evidence = [], projectId = null } = options;

    // 1. Build query dari item
    const query = this._buildAnalysisQuery(item, aspek);

    // 2. Query RAG untuk dapat konteks regulasi
    console.log('[PipelineAnalisis] Querying RAG for:', query);
    const ragResult = await this.pipeline.query(query, {
      sync: true,
      topK: 5,
      minScore: 0.6,
      filterDocumentIds: options.documentIds || null
    });

    // 3. Process evidence files jika ada
    const processedEvidence = [];
    for (const file of evidence) {
      if (file.category === 'nspk' || file.category === 'lapangan') {
        try {
          // Fetch dan proses file untuk OCR/extraction
          const fileData = await this._fetchFileData(file.url);
          if (fileData) {
            const processed = await this.pipeline.processFile(fileData, {
              ocr: true,
              priority: 'normal',
              projectId
            });
            processedEvidence.push({
              fileId: file.id,
              fileName: file.name,
              processingResult: processed
            });
          }
        } catch (err) {
          console.warn('[PipelineAnalisis] Failed to process evidence:', file.name, err);
        }
      }
    }

    // 4. Combine RAG context dengan evidence
    const enhancedContext = this._buildEnhancedContext(ragResult, processedEvidence);

    // 5. Route ke AI untuk analisis final
    const aiResult = await this._routeToAI(item, aspek, enhancedContext);

    return {
      ...aiResult,
      ragContext: ragResult.chunks,
      evidenceProcessed: processedEvidence.length,
      sources: ragResult.chunks?.map(c => ({
        documentId: c.documentId,
        similarity: c.similarity,
        text: c.text?.substring(0, 200)
      })) || []
    };
  }

  /**
   * Analisis aspek dengan RAG untuk semua items
   * @param {string} aspek - Nama aspek
   * @param {Array} items - Items checklist
   * @param {Object} options - Options
   * @returns {Promise<Object>} Hasil analisis aspek
   */
  async analyzeAspectWithRAG(aspek, items, options = {}) {
    await this.initialize();

    // 1. Query regulasi untuk aspek ini
    const aspectQuery = `peraturan ${aspek.toLowerCase()} SLF SNI`;
    const ragResult = await this.pipeline.query(aspectQuery, {
      sync: true,
      topK: 8,
      minScore: 0.5
    });

    // 2. Analisis setiap item dengan konteks regulasi
    const itemResults = [];
    for (const item of items) {
      const itemAnalysis = await this.analyzeWithRAG(item, aspek, {
        ...options,
        documentIds: ragResult.chunks?.map(c => c.documentId)
      });
      itemResults.push({
        itemId: item.id,
        kode: item.kode,
        nama: item.nama,
        analysis: itemAnalysis
      });
    }

    // 3. Generate summary dengan AI Router
    const summary = await this._generateAspectSummary(aspek, itemResults, ragResult);

    return {
      skor_aspek: this._calculateAspectScore(itemResults),
      narasi_teknis: summary.narasi,
      item_analyses: itemResults,
      regulasi_references: ragResult.chunks?.map(c => ({
        docId: c.documentId,
        text: c.text?.substring(0, 300),
        similarity: c.similarity
      })) || [],
      confidence: summary.confidence
    };
  }

  /**
   * Query regulasi NSPK
   * @param {string} query - Query string
   * @param {Object} options - Options
   * @returns {Promise<Object>} Hasil query
   */
  async queryRegulasi(query, options = {}) {
    await this.initialize();

    const result = await this.pipeline.query(query, {
      sync: true,
      topK: options.topK || 5,
      minScore: options.minScore || 0.6,
      filterDocumentIds: options.nspkOnly ? await this._getNSPKDocumentIds() : null
    });

    return result;
  }

  /**
   * Index dokumen ke RAG
   * @param {File} file - File object
   * @param {Object} metadata - Metadata dokumen
   * @returns {Promise<Object>} Hasil indexing
   */
  async indexDocument(file, metadata = {}) {
    await this.initialize();

    // Proses file melalui pipeline dengan auto-index ke RAG
    const job = await this.pipeline.processFile(file, {
      ocr: metadata.type?.startsWith('image/'),
      indexToRAG: true,
      priority: 'normal',
      projectId: metadata.projectId,
      metadata
    });

    return job;
  }

  /**
   * Index multiple dokumen
   * @param {Array<File>} files - Array file objects
   * @param {Object} metadata - Metadata umum
   * @returns {Promise<Array>} Array job results
   */
  async indexDocuments(files, metadata = {}) {
    await this.initialize();

    const jobs = [];
    for (const file of files) {
      try {
        const job = await this.indexDocument(file, {
          ...metadata,
          fileName: file.name,
          fileType: file.type
        });
        jobs.push(job);
      } catch (err) {
        console.error('[PipelineAnalisis] Failed to index:', file.name, err);
      }
    }

    return jobs;
  }

  /**
   * Dapatkan statistik RAG
   * @returns {Object} Statistik RAG
   */
  getRAGStats() {
    if (!this.pipeline?.engines?.rag) {
      return { totalChunks: 0, indexedDocuments: 0 };
    }
    return this.pipeline.engines.rag.getStats();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  _buildAnalysisQuery(item, aspek) {
    const queries = [
      item.kode,
      item.nama,
      item.keterangan || '',
      aspek,
      'SLF',
      'SNI'
    ].filter(Boolean).join(' ');
    return queries;
  }

  _buildEnhancedContext(ragResult, evidence) {
    let context = '';

    // Add RAG context
    if (ragResult.chunks?.length > 0) {
      context += '## Konteks Regulasi:\n';
      ragResult.chunks.forEach((chunk, i) => {
        context += `[${i + 1}] ${chunk.text?.substring(0, 300)}...\n`;
      });
    }

    // Add evidence context
    if (evidence.length > 0) {
      context += '\n## Bukti Fisik yang Diproses:\n';
      evidence.forEach((ev, i) => {
        context += `[${i + 1}] ${ev.fileName}\n`;
      });
    }

    return context;
  }

  async _routeToAI(item, aspek, context) {
    // Gunakan AI Router dari pipeline jika tersedia
    const aiRouter = this.pipeline.engines?.aiRouter;

    if (aiRouter) {
      const prompt = this._buildAnalysisPrompt(item, aspek, context);
      return await aiRouter.route({
        prompt,
        context: { item, aspek },
        taskType: 'analysis',
        complexity: 'medium'
      });
    }

    // Fallback ke implementasi lama
    return {
      analysis: 'AI Router tidak tersedia',
      status: 'pending',
      confidence: 0
    };
  }

  _buildAnalysisPrompt(item, aspek, context) {
    return `
Analisis komponen berikut untuk SLF (Sertifikat Laik Fungsi):

Kode: ${item.kode}
Nama: ${item.nama}
Aspek: ${aspek}
Keterangan: ${item.keterangan || '-'}
Status Saat Ini: ${item.status || 'Belum dinilai'}

${context}

Berikan analisis:
1. Status kelayakan (COMPLY / PARTIAL / NON_COMPLY)
2. Catatan teknis singkat
3. Confidence score (0-1)
`;
  }

  async _generateAspectSummary(aspek, itemResults, ragResult) {
    // Calculate score
    const validResults = itemResults.filter(r => r.analysis?.confidence > 0);
    const avgScore = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + (r.analysis.confidence || 0), 0) / validResults.length
      : 0;

    // Generate narasi
    const complyCount = itemResults.filter(r => r.analysis?.status === 'COMPLY').length;
    const total = itemResults.length;

    return {
      narasi: `Analisis ${aspek}: ${complyCount} dari ${total} item memenuhi standar (${Math.round((complyCount/total)*100)}%). Berdasarkan referensi regulasi: ${ragResult.chunks?.length || 0} dokumen relevan.`,
      confidence: avgScore
    };
  }

  _calculateAspectScore(itemResults) {
    if (itemResults.length === 0) return 0;

    const scores = itemResults.map(r => {
      switch (r.analysis?.status) {
        case 'COMPLY': return 100;
        case 'PARTIAL': return 60;
        case 'NON_COMPLY': return 0;
        default: return r.analysis?.confidence ? r.analysis.confidence * 100 : 0;
      }
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  async _fetchFileData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const blob = await response.blob();
      return new File([blob], 'evidence', { type: blob.type });
    } catch (err) {
      console.error('[PipelineAnalisis] Fetch error:', err);
      return null;
    }
  }

  async _getNSPKDocumentIds() {
    // Query untuk dapat ID dokumen NSPK dari Supabase
    try {
      const { data } = await supabase
        .from('smartai_documents')
        .select('id')
        .eq('metadata->>type', 'nspk');
      return data?.map(d => d.id) || null;
    } catch (err) {
      return null;
    }
  }
}

// Singleton instance
let _instance = null;

/**
 * Dapatkan instance PipelineAnalisisIntegration
 * @returns {PipelineAnalisisIntegration}
 */
export function getPipelineAnalisisIntegration() {
  if (!_instance) {
    _instance = new PipelineAnalisisIntegration();
  }
  return _instance;
}

export default PipelineAnalisisIntegration;
