/**
 * SmartAI Orchestrator - Pusat kendali pipeline SmartAI
 * Mengorkestrasi semua engines dan mengelola alur pemrosesan
 * @module core/smart-ai/orchestrator
 */

import { TypeDetector, getTypeDetector } from './type-detector.js';
import { JobManager, getJobManager } from './job-manager.js';
import { CacheManager, getCacheManager } from './cache-manager.js';
import { FileType, JobStatus, PipelineType, DEFAULT_PIPELINE_CONFIG } from './types.js';
import { IEngine, IDocumentEngine, IImageEngine, ICADEngine, IRAGEngine } from './engine-interface.js';

/**
 * SmartAI Orchestrator - Singleton class untuk mengelola seluruh pipeline
 */
export class SmartAIOrchestrator {
  constructor(config = {}) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    
    // Core components
    this.typeDetector = getTypeDetector();
    this.jobManager = getJobManager(config.jobManager);
    this.cacheManager = getCacheManager(config.cacheManager);
    
    // Registered engines
    this.engines = new Map();
    this.pipelineEngines = new Map(); // pipeline type -> engine
    
    // Event handlers
    this.eventHandlers = new Map();
    
    // State
    this.isInitialized = false;
    this.processingStats = {
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      averageProcessingTime: 0
    };

    // Register job execution handler
    this.jobManager.onExecuteJob = this._executeJob.bind(this);
  }

  /**
   * Inisialisasi orchestrator
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Inisialisasi cache manager
      await this.cacheManager.initialize();
      
      // Start job manager processing
      this.jobManager.startProcessing();
      
      this.isInitialized = true;
      console.log('[SmartAIOrchestrator] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[SmartAIOrchestrator] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Register engine ke orchestrator
   * @param {string} name - Nama engine
   * @param {IEngine} engine - Instance engine
   * @param {Array<string>} [pipelineTypes] - Pipeline types yang di-handle
   * @returns {boolean}
   */
  registerEngine(name, engine, pipelineTypes = []) {
    if (!(engine instanceof IEngine)) {
      console.error(`[SmartAIOrchestrator] Engine ${name} harus mengimplementasikan IEngine`);
      return false;
    }

    this.engines.set(name, engine);
    
    // Register ke pipeline types
    pipelineTypes.forEach(type => {
      if (!this.pipelineEngines.has(type)) {
        this.pipelineEngines.set(type, []);
      }
      this.pipelineEngines.get(type).push(engine);
    });

    console.log(`[SmartAIOrchestrator] Engine '${name}' registered for pipelines:`, pipelineTypes);
    return true;
  }

  /**
   * Unregister engine
   * @param {string} name - Nama engine
   * @returns {boolean}
   */
  unregisterEngine(name) {
    const engine = this.engines.get(name);
    if (!engine) return false;

    this.engines.delete(name);
    
    // Remove dari pipeline mappings
    for (const [type, engines] of this.pipelineEngines.entries()) {
      const index = engines.indexOf(engine);
      if (index > -1) {
        engines.splice(index, 1);
      }
    }

    return true;
  }

  /**
   * Proses file melalui pipeline yang tepat
   * @param {File|Blob|string} input - Input file atau URL
   * @param {Object} options - Options pemrosesan
   * @returns {Promise<Object>} Job object
   */
  async process(input, options = {}) {
    await this.initialize();

    // Detect tipe file
    let detection;
    if (input instanceof File) {
      detection = this.typeDetector.detectFromFile(input);
    } else if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
      detection = this.typeDetector.detectFromURL(input);
    } else {
      detection = { fileType: 'unknown', pipelineType: null, confidence: 0 };
    }

    if (!detection.pipelineType) {
      throw new Error(`Tipe file tidak didukung: ${detection.fileType}`);
    }

    // Cek cache jika diaktifkan
    if (this.config.enableCache && !options.skipCache) {
      const cacheKey = this._generateCacheKey(input, detection, options);
      const cached = await this.cacheManager.get(cacheKey);
      
      if (cached) {
        console.log(`[SmartAIOrchestrator] Cache hit for ${detection.fileType}`);
        return {
          ...cached,
          fromCache: true,
          cacheKey
        };
      }
    }

    // Buat job baru
    const job = this.jobManager.createJob(
      { input, detection, options },
      detection.pipelineType,
      {
        projectId: options.projectId,
        createdBy: options.userId,
        priority: options.priority || 'normal',
        tags: options.tags || []
      }
    );

    return job;
  }

  /**
   * Query dengan RAG (Retrieve + Generate)
   * @param {string} query - User query
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async query(query, options = {}) {
    await this.initialize();

    // Cek cache untuk query yang sama
    if (this.config.enableCache && !options.skipCache) {
      const cacheKey = this.cacheManager.generateKey('query', { query, options });
      const cached = await this.cacheManager.get(cacheKey);
      
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    // Buat job untuk RAG query
    const job = this.jobManager.createJob(
      { query, options },
      PipelineType.QUERY,
      {
        priority: options.priority || 'high',
        tags: ['rag', 'query']
      }
    );

    // Jika sync mode, tunggu hasil
    if (options.sync) {
      return await this.waitForJob(job.id, options.timeout || 60000);
    }

    return job;
  }

  /**
   * Execute job (dipanggil oleh JobManager)
   * @private
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async _executeJob(job) {
    const startTime = Date.now();
    
    try {
      this.processingStats.totalJobs++;
      
      // Update progress
      this.jobManager.updateProgress(job.id, 10, 'Mendeteksi tipe konten...');

      // Route ke pipeline yang tepat
      const result = await this._routeToPipeline(job);

      // Cache hasil jika sukses
      if (this.config.enableCache && result.success !== false) {
        const cacheKey = this._generateCacheKeyFromJob(job);
        await this.cacheManager.set(cacheKey, result, {
          tag: job.type,
          ttl: this.config.cacheTTL
        });
      }

      // Update stats
      const processingTime = Date.now() - startTime;
      this.processingStats.successfulJobs++;
      this._updateAverageTime(processingTime);

      return result;

    } catch (error) {
      this.processingStats.failedJobs++;
      throw error;
    }
  }

  /**
   * Route job ke pipeline yang tepat
   * @private
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async _routeToPipeline(job) {
    const { type, input } = job;

    switch (type) {
      case PipelineType.DOCUMENT:
      case PipelineType.SPREADSHEET:
      case PipelineType.SLIDE:
      case PipelineType.PDF:
        return await this._processDocument(job);
      
      case PipelineType.IMAGE:
        return await this._processImage(job);
      
      case PipelineType.CAD:
        return await this._processCAD(job);
      
      case PipelineType.WEB_SCREENSHOT:
        return await this._processWebScreenshot(job);
      
      case PipelineType.RAG:
      case PipelineType.QUERY:
        return await this._processRAGQuery(job);
      
      default:
        throw new Error(`Pipeline type '${type}' tidak didukung`);
    }
  }

  /**
   * Proses dokumen (Word, Excel, PowerPoint, PDF)
   * @private
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async _processDocument(job) {
    this.jobManager.updateProgress(job.id, 20, 'Mengekstrak konten dokumen...');
    
    const { input, detection } = job.input;
    const engines = this.pipelineEngines.get(job.type);
    
    if (!engines || engines.length === 0) {
      throw new Error(`Tidak ada engine yang tersedia untuk pipeline ${job.type}`);
    }

    // Gunakan engine pertama yang support tipe file
    const engine = engines.find(e => e.supports(detection.fileType));
    if (!engine) {
      throw new Error(`Tidak ada engine yang support tipe file ${detection.fileType}`);
    }

    // Preprocessing
    const preprocessed = await engine.preprocess({ file: input.input, type: detection.fileType });
    
    this.jobManager.updateProgress(job.id, 50, 'Melakukan ekstraksi teks...');
    
    // Ekstraksi konten
    const text = await engine.extractText(preprocessed);
    const structure = await engine.extractStructure(preprocessed);
    const tables = await engine.extractTables(preprocessed);
    
    this.jobManager.updateProgress(job.id, 80, 'Menfinalisasi hasil...');

    // Chunking jika teks panjang dan diaktifkan
    let chunks = [];
    if (this.config.enableChunking && text.length > this.config.chunkSize) {
      chunks = this._chunkText(text, this.config.chunkSize, this.config.chunkOverlap);
    }

    // Postprocessing
    const result = await engine.postprocess({
      type: detection.fileType,
      text,
      structure,
      tables,
      chunks,
      metadata: {
        fileName: input.input instanceof File ? input.input.name : 'unknown',
        fileSize: input.input instanceof File ? input.input.size : 0,
        processingTime: Date.now()
      }
    });

    this.jobManager.updateProgress(job.id, 100, 'Selesai');

    return {
      success: true,
      type: job.type,
      fileType: detection.fileType,
      ...result
    };
  }

  /**
   * Proses gambar (OCR, preprocessing)
   * @private
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async _processImage(job) {
    this.jobManager.updateProgress(job.id, 20, 'Preprocessing gambar...');
    
    const { input, detection, options } = job.input;
    const engines = this.pipelineEngines.get(PipelineType.IMAGE);
    
    if (!engines || engines.length === 0) {
      throw new Error('Tidak ada image engine yang tersedia');
    }

    const engine = engines[0]; // Gunakan primary engine
    
    // Preprocessing gambar
    let processedImage = input.input;
    if (engine.enablePreprocessing && options.preprocess !== false) {
      processedImage = await engine.preprocessImage(input.input);
    }

    this.jobManager.updateProgress(job.id, 50, 'Melakukan OCR...');

    // OCR jika diaktifkan
    let ocrResult = null;
    if (engine.enableOCR && options.ocr !== false) {
      ocrResult = await engine.performOCR(processedImage);
    }

    this.jobManager.updateProgress(job.id, 80, 'Mendeteksi region...');

    // Deteksi region
    let regions = [];
    if (options.detectRegions) {
      regions = await engine.detectRegions(processedImage);
    }

    this.jobManager.updateProgress(job.id, 100, 'Selesai');

    return {
      success: true,
      type: PipelineType.IMAGE,
      fileType: detection.fileType,
      ocr: ocrResult,
      regions,
      image: processedImage
    };
  }

  /**
   * Proses file CAD (DXF/DWG)
   * @private
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async _processCAD(job) {
    this.jobManager.updateProgress(job.id, 20, 'Parsing file CAD...');
    
    const { input, detection } = job.input;
    const engines = this.pipelineEngines.get(PipelineType.CAD);
    
    if (!engines || engines.length === 0) {
      throw new Error('Tidak ada CAD engine yang tersedia');
    }

    const engine = engines[0];

    // Parse CAD file
    let content = input.input;
    if (input.input instanceof File) {
      content = await input.input.text();
    }

    const model = await engine.parse(content);
    
    this.jobManager.updateProgress(job.id, 50, 'Mengekstrak entity...');

    // Ekstrak entities
    const entities = await engine.extractEntities(model);

    this.jobManager.updateProgress(job.id, 80, 'Menganalisis geometri...');

    // Analisis pengukuran
    const measurements = await engine.analyzeMeasurements(model);

    this.jobManager.updateProgress(job.id, 100, 'Selesai');

    return {
      success: true,
      type: PipelineType.CAD,
      fileType: detection.fileType,
      entities,
      measurements,
      model: engine.enable3D ? model : null
    };
  }

  /**
   * Proses web screenshot
   * @private
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async _processWebScreenshot(job) {
    this.jobManager.updateProgress(job.id, 20, 'Mencari URL...');
    
    const { input, options } = job.input;
    const engines = this.pipelineEngines.get(PipelineType.WEB_SCREENSHOT);
    
    if (!engines || engines.length === 0) {
      throw new Error('Tidak ada web engine yang tersedia');
    }

    const engine = engines[0];

    let url = input.input;
    
    // Jika input adalah query, search dulu
    if (!url.startsWith('http') && options.search !== false) {
      const searchResults = await engine.search(url);
      if (searchResults.length > 0) {
        url = searchResults[0].url;
      }
    }

    this.jobManager.updateProgress(job.id, 50, 'Mengambil screenshot...');

    // Screenshot
    const screenshot = await engine.screenshot(url, {
      fullPage: options.fullPage !== false,
      width: options.width,
      height: options.height
    });

    this.jobManager.updateProgress(job.id, 80, 'Mengekstrak konten...');

    // Ekstrak konten
    const content = await engine.extractContent(url);
    const segments = await engine.segment(content.text || content);

    this.jobManager.updateProgress(job.id, 100, 'Selesai');

    return {
      success: true,
      type: PipelineType.WEB_SCREENSHOT,
      url,
      screenshot,
      content: segments,
      rawContent: content
    };
  }

  /**
   * Proses RAG query
   * @private
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async _processRAGQuery(job) {
    this.jobManager.updateProgress(job.id, 20, 'Mencari konten relevan...');
    
    const { query, options } = job.input;
    const engines = this.pipelineEngines.get(PipelineType.RAG);
    
    if (!engines || engines.length === 0) {
      throw new Error('Tidak ada RAG engine yang tersedia');
    }

    const engine = engines[0];

    // Retrieve relevant chunks
    const chunks = await engine.retrieve(query, {
      topK: options.topK || 5,
      minScore: options.minScore || 0.7
    });

    this.jobManager.updateProgress(job.id, 60, 'Menggenerasi jawaban...');

    // Generate response dengan context
    let response = null;
    if (options.generate && this.onGenerateResponse) {
      response = await this.onGenerateResponse(query, chunks, options);
    }

    this.jobManager.updateProgress(job.id, 100, 'Selesai');

    return {
      success: true,
      type: PipelineType.QUERY,
      query,
      chunks,
      response,
      chunkCount: chunks.length
    };
  }

  /**
   * Chunking teks
   * @private
   * @param {string} text - Teks yang akan di-chunk
   * @param {number} size - Ukuran chunk
   * @param {number} overlap - Overlap antar chunk
   * @returns {Array<string>}
   */
  _chunkText(text, size, overlap) {
    const chunks = [];
    const step = size - overlap;
    
    for (let i = 0; i < text.length; i += step) {
      const chunk = text.slice(i, i + size);
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  /**
   * Generate cache key
   * @private
   * @param {Object} input - Input
   * @param {Object} detection - Detection result
   * @param {Object} options - Options
   * @returns {string}
   */
  _generateCacheKey(input, detection, options) {
    const cacheInput = {
      type: detection.fileType,
      name: input instanceof File ? input.name : input,
      size: input instanceof File ? input.size : 0,
      lastModified: input instanceof File ? input.lastModified : 0,
      options: JSON.stringify(options)
    };
    
    return this.cacheManager.generateKey('process', cacheInput);
  }

  /**
   * Generate cache key dari job
   * @private
   * @param {Object} job - Job object
   * @returns {string}
   */
  _generateCacheKeyFromJob(job) {
    return this._generateCacheKey(
      job.input.input.input,
      job.input.detection,
      job.input.options
    );
  }

  /**
   * Update rata-rata waktu pemrosesan
   * @private
   * @param {number} time - Waktu pemrosesan
   */
  _updateAverageTime(time) {
    const { totalJobs, averageProcessingTime } = this.processingStats;
    this.processingStats.averageProcessingTime = 
      ((averageProcessingTime * (totalJobs - 1)) + time) / totalJobs;
  }

  /**
   * Tunggu job selesai
   * @param {string} jobId - Job ID
   * @param {number} timeout - Timeout dalam ms
   * @returns {Promise<Object>}
   */
  async waitForJob(jobId, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        const job = this.jobManager.getJob(jobId);
        
        if (!job) {
          clearInterval(checkInterval);
          reject(new Error('Job tidak ditemukan'));
          return;
        }

        if (job.status === JobStatus.COMPLETED) {
          clearInterval(checkInterval);
          resolve(job.result);
          return;
        }

        if (job.status === JobStatus.FAILED) {
          clearInterval(checkInterval);
          reject(job.error || new Error('Job failed'));
          return;
        }

        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for job'));
        }
      }, 100);
    });
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {Object|null}
   */
  getJobStatus(jobId) {
    const job = this.jobManager.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      type: job.type,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error
    };
  }

  /**
   * Dapatkan statistik orchestrator
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.processingStats,
      queueStats: this.jobManager.getStats(),
      cacheStats: this.cacheManager.getStats(),
      registeredEngines: Array.from(this.engines.keys()),
      pipelineMappings: Array.from(this.pipelineEngines.entries()).map(([type, engines]) => ({
        type,
        engines: engines.map(e => e.name)
      }))
    };
  }

  /**
   * Register callback untuk generate response (RAG)
   * @param {Function} callback - Callback function(query, chunks, options) => response
   */
  onGenerateResponse(callback) {
    this.onGenerateResponse = callback;
  }

  /**
   * Dispose dan cleanup resources
   */
  dispose() {
    this.jobManager.stopProcessing();
    this.jobManager.dispose();
    this.cacheManager.dispose();
    
    this.engines.clear();
    this.pipelineEngines.clear();
    this.eventHandlers.clear();
    
    this.isInitialized = false;
  }
}

// Singleton instance
let orchestratorInstance = null;

/**
 * Dapatkan singleton instance SmartAIOrchestrator
 * @param {Object} [config] - Konfigurasi (hanya digunakan saat inisialisasi)
 * @returns {SmartAIOrchestrator}
 */
export function getSmartAIOrchestrator(config) {
  if (!orchestratorInstance) {
    orchestratorInstance = new SmartAIOrchestrator(config);
  }
  return orchestratorInstance;
}

export default SmartAIOrchestrator;
