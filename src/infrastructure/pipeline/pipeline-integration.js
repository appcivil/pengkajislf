/**
 * Pipeline Integration Module
 * Integrasi SmartAI Pipeline ke aplikasi yang sudah ada
 * @module infrastructure/pipeline/pipeline-integration
 */

import { 
  getSmartAIOrchestrator,
  FileType,
  PipelineType 
} from '../../core/smart-ai/index.js';

import {
  DocumentEngine,
  ImageEngine,
  CADEngine,
  RAGEngine,
  AIRouterEngine,
  OutputEngine,
  WebScreenshotEngine,
  VisualizationEngine
} from './engines/index.js';

import { getPipelineSupabaseService } from './pipeline-supabase-service.js';

/**
 * Initialize dan konfigurasi SmartAI Pipeline
 * Memregister semua engines dan setup integrasi dengan sistem yang ada
 */
export class PipelineIntegration {
  constructor(config = {}) {
    this.orchestrator = getSmartAIOrchestrator(config.orchestrator);
    this.supabaseService = getPipelineSupabaseService();
    this.config = {
      enableDocumentEngine: config.enableDocumentEngine !== false,
      enableImageEngine: config.enableImageEngine !== false,
      enableCADEngine: config.enableCADEngine !== false,
      enableRAGEngine: config.enableRAGEngine !== false,
      enableAIRouter: config.enableAIRouter !== false,
      enableOutputEngine: config.enableOutputEngine !== false,
      enableWebScreenshot: config.enableWebScreenshot !== false,
      enableVisualization: config.enableVisualization !== false,
      enableSupabaseSync: config.enableSupabaseSync !== false,
      ...config
    };
    
    this.isInitialized = false;
    this.engines = {};
  }

  /**
   * Inisialisasi pipeline integration
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.isInitialized) return true;

    console.log('[PipelineIntegration] Initializing SmartAI Pipeline...');

    try {
      // 1. Inisialisasi orchestrator
      await this.orchestrator.initialize();
      
      // 2. Inisialisasi Supabase service
      if (this.config.enableSupabaseSync) {
        await this.supabaseService.initialize();
      }

      // 3. Register engines
      await this._registerEngines();

      // 4. Setup event handlers untuk sync ke Supabase
      if (this.config.enableSupabaseSync) {
        this._setupSupabaseSync();
      }

      // 5. Setup AI generation handler untuk RAG
      this._setupRAGHandlers();

      this.isInitialized = true;
      console.log('[PipelineIntegration] Initialization complete');
      
      return true;
    } catch (error) {
      console.error('[PipelineIntegration] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Register semua engines ke orchestrator
   * @private
   */
  async _registerEngines() {
    // Document Engine (DOCX, XLSX, PPTX, PDF)
    if (this.config.enableDocumentEngine) {
      this.engines.document = new DocumentEngine({
        extractionMode: 'full',
        maxFileSize: 50 * 1024 * 1024
      });
      await this.engines.document.initialize();
      
      this.orchestrator.registerEngine(
        'document',
        this.engines.document,
        [PipelineType.DOCUMENT, PipelineType.SPREADSHEET, PipelineType.SLIDE, PipelineType.PDF]
      );
    }

    // Image Engine (OCR, preprocessing)
    if (this.config.enableImageEngine) {
      this.engines.image = new ImageEngine({
        enableOCR: false, // Disabled to prevent WorkerGlobalScope error in dev
        enablePreprocessing: true,
        ocrLanguage: 'ind+eng',
        maxFileSize: 20 * 1024 * 1024
      });
      await this.engines.image.initialize();
      
      this.orchestrator.registerEngine(
        'image',
        this.engines.image,
        [PipelineType.IMAGE]
      );
    }

    // CAD Engine (DXF/DWG)
    if (this.config.enableCADEngine) {
      this.engines.cad = new CADEngine({
        enable3D: false,
        renderMode: '2d',
        maxFileSize: 30 * 1024 * 1024
      });
      await this.engines.cad.initialize();
      
      this.orchestrator.registerEngine(
        'cad',
        this.engines.cad,
        [PipelineType.CAD]
      );
    }

    // RAG Engine (chunking, embedding, retrieval)
    if (this.config.enableRAGEngine) {
      this.engines.rag = new RAGEngine({
        chunkSize: 500,
        chunkOverlap: 50,
        useModel: 'universal-sentence-encoder'
      });
      await this.engines.rag.initialize();
      
      this.orchestrator.registerEngine(
        'rag',
        this.engines.rag,
        [PipelineType.RAG, PipelineType.QUERY]
      );
    }

    // AI Router Engine (model selection)
    if (this.config.enableAIRouter) {
      this.engines.aiRouter = new AIRouterEngine({
        lightModel: 'gpt-3.5-turbo',
        mediumModel: 'gpt-4',
        heavyModel: 'gpt-4-turbo'
      });
      await this.engines.aiRouter.initialize();
      
      this.orchestrator.registerEngine(
        'ai-router',
        this.engines.aiRouter,
        ['query']
      );
    }

    // Output Engine (DOCX/XLSX/PPTX/PDF export)
    if (this.config.enableOutputEngine) {
      this.engines.output = new OutputEngine({
        templates: ['slf_report', 'analysis_summary']
      });
      await this.engines.output.initialize();
    }

    // Web Screenshot Engine
    if (this.config.enableWebScreenshot) {
      this.engines.webScreenshot = new WebScreenshotEngine({
        apiEndpoint: '/functions/v1/screenshot',
        timeout: 30000
      });
      await this.engines.webScreenshot.initialize();
      
      this.orchestrator.registerEngine(
        'web-screenshot',
        this.engines.webScreenshot,
        [PipelineType.WEB_SCREENSHOT]
      );
    }

    // Visualization Engine (Chart.js, Three.js)
    if (this.config.enableVisualization) {
      this.engines.visualization = new VisualizationEngine({
        defaultChartOptions: {
          responsive: true,
          maintainAspectRatio: true
        }
      });
      await this.engines.visualization.initialize();
    }

    console.log('[PipelineIntegration] Engines registered:', Object.keys(this.engines));
  }

  /**
   * Setup sync ke Supabase
   * @private
   */
  _setupSupabaseSync() {
    // Sync job created
    this.orchestrator.jobManager.on('onJobCreated', async (job) => {
      try {
        await this.supabaseService.saveJob(job);
      } catch (error) {
        console.error('[PipelineIntegration] Failed to sync job created:', error);
      }
    });

    // Sync job progress
    this.orchestrator.jobManager.on('onJobProgress', async (job) => {
      try {
        await this.supabaseService.updateJobStatus(job.id, job.status, {
          progress: job.progress,
          result: job.result
        });
      } catch (error) {
        console.error('[PipelineIntegration] Failed to sync job progress:', error);
      }
    });

    // Sync job completed
    this.orchestrator.jobManager.on('onJobCompleted', async (job) => {
      try {
        await this.supabaseService.updateJobStatus(job.id, job.status, {
          result: job.result,
          completed_at: job.completedAt,
          processing_time_ms: job.completedAt ? 
            new Date(job.completedAt) - new Date(job.createdAt) : null
        });

        // Jika hasil berupa dokumen, simpan ke tabel documents
        if (job.result && job.type !== PipelineType.QUERY) {
          await this._saveDocumentResult(job);
        }
      } catch (error) {
        console.error('[PipelineIntegration] Failed to sync job completed:', error);
      }
    });

    // Sync job failed
    this.orchestrator.jobManager.on('onJobFailed', async (job) => {
      try {
        await this.supabaseService.updateJobStatus(job.id, 'failed', {
          error: job.error,
          completed_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('[PipelineIntegration] Failed to sync job failed:', error);
      }
    });
  }

  /**
   * Simpan hasil dokumen ke Supabase
   * @private
   */
  async _saveDocumentResult(job) {
    const result = job.result;
    if (!result) return;

    try {
      await this.supabaseService.saveDocument({
        jobId: job.id,
        fileName: result.metadata?.fileName || 'unknown',
        fileType: result.fileType,
        fileSize: result.metadata?.fileSize || 0,
        googleDriveId: result.metadata?.googleDriveId,
        text: result.text,
        structure: result.structure,
        tables: result.tables,
        metadata: {
          ...result.metadata,
          processingType: job.type
        },
        userId: job.metadata?.createdBy,
        projectId: job.metadata?.projectId
      });
    } catch (error) {
      console.error('[PipelineIntegration] Failed to save document result:', error);
    }
  }

  /**
   * Setup RAG handlers
   * @private
   */
  _setupRAGHandlers() {
    // Register AI generation handler untuk RAG
    this.orchestrator.onGenerateResponse(async (query, chunks, options) => {
      // Ini akan menggunakan AI service yang sudah ada di aplikasi
      // Misalnya OpenRouterAIService atau yang lainnya
      
      try {
        // Build context dari chunks
        const context = chunks.map((c, i) => 
          `[${i + 1}] ${c.text.substring(0, 500)}${c.text.length > 500 ? '...' : ''}`
        ).join('\n\n');

        // Build prompt
        const prompt = `Berdasarkan konteks berikut, jawab pertanyaan pengguna:

KONTEKS:
${context}

PERTANYAAN: ${query}

Berikan jawaban yang akurat dengan merujuk ke konteks di atas. Jika jawaban tidak ditemukan dalam konteks, katakan "Maaf, saya tidak menemukan informasi yang relevan."`;

        // Return prompt untuk diproses oleh AI service eksternal
        return {
          prompt,
          context,
          chunkCount: chunks.length,
          citations: chunks.map(c => ({
            id: c.id,
            similarity: c.similarity,
            text: c.text.substring(0, 200)
          }))
        };
      } catch (error) {
        console.error('[PipelineIntegration] RAG generation error:', error);
        return null;
      }
    });
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Proses file
   * @param {File} file - File yang akan diproses
   * @param {Object} options - Options pemrosesan
   * @returns {Promise<Object>} Job object
   */
  async processFile(file, options = {}) {
    await this.initialize();
    return await this.orchestrator.process(file, options);
  }

  /**
   * Proses batch files
   * @param {Array<File>} files - Array files
   * @param {Object} options - Options pemrosesan
   * @returns {Promise<Array<Object>>>} Array job objects
   */
  async processBatch(files, options = {}) {
    await this.initialize();
    
    const jobs = [];
    for (const file of files) {
      const job = await this.orchestrator.process(file, options);
      jobs.push(job);
    }
    
    return jobs;
  }

  /**
   * Query dengan RAG
   * @param {string} query - Query pengguna
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async query(query, options = {}) {
    await this.initialize();
    return await this.orchestrator.query(query, options);
  }

  /**
   * Index dokumen untuk RAG
   * @param {string} documentId - ID dokumen
   * @param {string} text - Teks dokumen
   * @param {Object} metadata - Metadata
   * @returns {Promise<Object>}
   */
  async indexDocument(documentId, text, metadata = {}) {
    await this.initialize();
    
    if (!this.engines.rag) {
      throw new Error('RAG engine tidak tersedia');
    }

    return await this.engines.rag.processDocument(documentId, text, metadata);
  }

  /**
   * Dapatkan status job
   * @param {string} jobId - Job ID
   * @returns {Object|null}
   */
  getJobStatus(jobId) {
    return this.orchestrator.getJobStatus(jobId);
  }

  /**
   * Cancel job
   * @param {string} jobId - Job ID
   * @returns {boolean}
   */
  cancelJob(jobId) {
    return this.orchestrator.jobManager.cancelJob(jobId);
  }

  /**
   * Tunggu job selesai
   * @param {string} jobId - Job ID
   * @param {number} timeout - Timeout dalam ms
   * @returns {Promise<Object>}
   */
  async waitForJob(jobId, timeout = 60000) {
    return await this.orchestrator.waitForJob(jobId, timeout);
  }

  /**
   * Dapatkan statistik pipeline
   * @returns {Object}
   */
  getStats() {
    return this.orchestrator.getStats();
  }

  /**
   * Dapatkan documents untuk project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array<Object>>}
   */
  async getProjectDocuments(projectId) {
    return await this.supabaseService.getDocumentsByProject(projectId);
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    // Dispose all engines
    for (const [name, engine] of Object.entries(this.engines)) {
      if (engine && typeof engine.dispose === 'function') {
        await engine.dispose();
      }
    }
    
    this.engines = {};
    this.orchestrator.dispose();
    this.isInitialized = false;
  }
}

// Singleton instance
let integrationInstance = null;

/**
 * Dapatkan singleton instance PipelineIntegration
 * @param {Object} [config] - Konfigurasi (hanya digunakan saat inisialisasi)
 * @returns {PipelineIntegration}
 */
export function getPipelineIntegration(config) {
  if (!integrationInstance) {
    integrationInstance = new PipelineIntegration(config);
  }
  return integrationInstance;
}

/**
 * Inisialisasi pipeline dengan konfigurasi default
 * @returns {Promise<boolean>}
 */
export async function initializePipeline() {
  const integration = getPipelineIntegration();
  return await integration.initialize();
}

/**
 * Quick access untuk process file
 * @param {File} file - File
 * @param {Object} options - Options
 * @returns {Promise<Object>}
 */
export async function processFile(file, options = {}) {
  const integration = getPipelineIntegration();
  return await integration.processFile(file, options);
}

/**
 * Quick access untuk query
 * @param {string} query - Query
 * @param {Object} options - Options
 * @returns {Promise<Object>}
 */
export async function queryRAG(query, options = {}) {
  const integration = getPipelineIntegration();
  return await integration.query(query, options);
}

export default PipelineIntegration;
