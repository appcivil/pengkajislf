import { PROYEK_AI_TEMPLATES } from '../ai-templates/ProyekAI.js';
import { nspkRepository } from '../../infrastructure/persistence/NSPKRepository.js';

/**
 * ANALISIS DOKUMEN AI USE CASE - RAG EDITION
 * Mengatur alur kerja analisis kecerdasan buatan dengan:
 * - Queue dan batch processing (anti rate limit)
 * - RAG (Retrieval Augmented Generation) dengan konteks regulasi NSPK
 * - Context-aware recommendations berdasarkan regulasi teknis
 */

/**
 * Job Manager untuk queue-based AI processing
 */
class AIJobManager {
  constructor(maxConcurrency = 2) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrency = maxConcurrency;
    this.results = new Map();
    this.processing = false;
  }

  /**
   * Submit job ke queue
   */
  async submit(jobId, taskFn, options = {}) {
    return new Promise((resolve, reject) => {
      const job = {
        id: jobId,
        task: taskFn,
        priority: options.priority || 'normal',
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Sort by priority: high > normal > low
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const insertIndex = this.queue.findIndex(
        j => priorityOrder[j.priority] > priorityOrder[job.priority]
      );

      if (insertIndex === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(insertIndex, 0, job);
      }

      this._processQueue();
    });
  }

  /**
   * Process queue dengan concurrency control
   */
  async _processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const job = this.queue.shift();
      this.running++;

      try {
        console.log(`[AIJobManager] Processing job ${job.id} (running: ${this.running})`);
        const result = await job.task();
        this.results.set(job.id, { success: true, result });
        job.resolve(result);
      } catch (error) {
        this.results.set(job.id, { success: false, error: error.message });
        job.reject(error);
      } finally {
        this.running--;
      }
    }

    this.processing = false;

    // Continue processing if there are more jobs
    if (this.queue.length > 0 && this.running < this.maxConcurrency) {
      this._processQueue();
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      running: this.running,
      maxConcurrency: this.maxConcurrency,
      totalProcessed: this.results.size
    };
  }
}

/**
 * Batch processor untuk analisis dokumen multiple
 */
class DocumentBatchProcessor {
  constructor(jobManager, options = {}) {
    this.jobManager = jobManager;
    this.batchSize = options.batchSize || 3;
    this.delayBetweenBatches = options.delayBetweenBatches || 2000; // 2 detik
  }

  /**
   * Process batch dokumen dengan rate limiting
   */
  async processBatch(documents, processFn, onProgress) {
    const results = [];
    const total = documents.length;

    for (let i = 0; i < total; i += this.batchSize) {
      const batch = documents.slice(i, i + this.batchSize);
      const batchNum = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(total / this.batchSize);

      console.log(`[DocumentBatchProcessor] Processing batch ${batchNum}/${totalBatches} (${batch.length} items)`);

      // Process batch dengan job manager
      const batchPromises = batch.map((doc, idx) =>
        this.jobManager.submit(
          `doc_${doc.id || i + idx}`,
          () => processFn(doc),
          { priority: doc.priority || 'normal' }
        )
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, idx) => {
        const doc = batch[idx];
        if (result.status === 'fulfilled') {
          results.push({ doc, result: result.value, success: true });
        } else {
          results.push({ doc, error: result.reason?.message, success: false });
        }
      });

      if (onProgress) {
        onProgress(Math.min(i + batch.length, total), total, batchResults);
      }

      // Delay antar batch untuk menghindari rate limit
      if (i + this.batchSize < total) {
        await this._delay(this.delayBetweenBatches);
      }
    }

    return results;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instances
let jobManagerInstance = null;
let batchProcessorInstance = null;

function getJobManager() {
  if (!jobManagerInstance) {
    jobManagerInstance = new AIJobManager(2); // Max 2 concurrent AI calls
  }
  return jobManagerInstance;
}

function getBatchProcessor() {
  if (!batchProcessorInstance) {
    batchProcessorInstance = new DocumentBatchProcessor(getJobManager(), {
      batchSize: 3,
      delayBetweenBatches: 2000
    });
  }
  return batchProcessorInstance;
}

export class AnalisisDokumenAI {
  constructor(fileRepo, aiService, notificationService, auditLogger) {
    this.fileRepo = fileRepo;
    this.aiService = aiService;
    this.notificationService = notificationService;
    this.auditLogger = auditLogger;
    this.jobManager = getJobManager();
    this.batchProcessor = getBatchProcessor();
  }

  /**
   * Analisis single dokumen dengan queue
   */
  async execute(fileId, userId = 'system', options = {}) {
    try {
      // Submit ke job queue untuk menghindari parallel request spike
      const result = await this.jobManager.submit(
        `file_${fileId}`,
        () => this._processSingleDocument(fileId, userId, options),
        { priority: options.priority || 'normal' }
      );

      return result;
    } catch (err) {
      this.notificationService.notifyError(`Gagal analisis AI: ${err.message}`);
      throw err;
    }
  }

  /**
   * Process single dokumen dengan RAG (Retrieval Augmented Generation)
   * Mengintegrasikan konteks regulasi NSPK untuk rekomendasi yang berbasis regulasi
   */
  async _processSingleDocument(fileId, userId, options) {
    // 1. Ambil data berkas
    const berkas = await this.fileRepo.getById(fileId);
    if (!berkas) throw new Error('Berkas tidak ditemukan');

    // 2. Retrieve relevant NSPK context (RAG)
    const nspkContext = this._getNSPKContext(berkas.kategori, berkas.subkategori, berkas.metadata);
    console.log(`[AnalisisDokumenAI] NSPK context retrieved for ${berkas.kategori}:`, 
      nspkContext ? `${nspkContext.length} chars` : 'none');

    // 3. Siapkan Prompt dengan konteks regulasi
    const basePrompt = PROYEK_AI_TEMPLATES.DOCUMENT_ANALYSIS(berkas.nama, berkas.kategori);
    const enrichedPrompt = nspkContext 
      ? `${basePrompt}\n\n${nspkContext}\n\nBerdasarkan regulasi di atas, berikan analisis dan rekomendasi yang mematuhi standar teknis Indonesia.`
      : basePrompt;

    // 4. Jalankan Analisis AI dengan retry logic
    this.notificationService.notifySuccess(`Menganalisis berkas: ${berkas.nama}...`);

    let aiResult;
    try {
      aiResult = await this._callAIWithRetry(enrichedPrompt, options);
      // Tambahkan metadata RAG
      aiResult.rag_context = nspkContext ? true : false;
      aiResult.regulatory_basis = nspkContext ? this._extractStandards(nspkContext) : [];
    } catch (error) {
      // Fallback: mark as needs manual review
      aiResult = {
        category: berkas.kategori,
        subcategory: berkas.subkategori,
        ai_summary: 'Analisis AI gagal. Diperlukan review manual.',
        completeness: 0,
        status: 'Needs Review',
        error: error.message,
        rag_context: false,
        regulatory_basis: []
      };
      this.notificationService.notifyError(`AI Error untuk ${berkas.nama}: ${error.message}`);
    }

    // 5. Siapkan Data Update dengan RAG metadata
    const updateData = {
      ai_status: aiResult.status === 'Needs Review' ? 'Failed' : 'Analyzed',
      category: aiResult.category || berkas.kategori,
      subcategory: aiResult.subcategory || berkas.subkategori,
      ai_summary: aiResult.ai_summary,
      completeness: aiResult.completeness || 0,
      status: aiResult.status || 'Draft',
      metadata: {
        ...berkas.metadata,
        ai_last_run: new Date().toISOString(),
        provider: 'CleanArch-AI-Engine-v3-RAG',
        anti_rate_limit: true,
        rag_enabled: true,
        regulatory_basis: aiResult.regulatory_basis || [],
        nspk_context_used: aiResult.rag_context || false
      }
    };

    // 5. Simpan Hasil
    await this.fileRepo.update(fileId, updateData);

    // 6. Catat Log Audit
    await this.auditLogger.log('AI_ANALYSIS', {
      fileId: fileId,
      fileName: berkas.nama,
      category: updateData.category,
      status: updateData.ai_status
    }, userId);

    this.notificationService.notifySuccess(`Analisis ${berkas.nama} selesai.` + 
      (aiResult.regulatory_basis?.length > 0 ? ` (Berdasarkan: ${aiResult.regulatory_basis.join(', ')})` : ''));
    return { success: true, data: updateData };
  }

  /**
   * Retrieve NSPK context untuk RAG berdasarkan kategori dan metadata
   * @private
   */
  _getNSPKContext(kategori, subkategori, metadata = {}) {
    try {
      // Map kategori berkas ke module type NSPK
      const categoryMap = {
        'struktur': 'struktur',
        'arsitektur': 'arsitektur',
        'elektrikal': 'elektrikal',
        'mep': 'elektrikal',
        'sanitasi': 'sanitasi',
        'kebakaran': 'kebakaran',
        'proteksi_kebakaran': 'kebakaran',
        'petir': 'petir',
        'lingkungan': 'tataruang',
        'acoustic': 'kenyamanan',
        'pencahayaan': 'kenyamanan',
        'dokumen_teknis': 'administrasi',
        'perizinan': 'administrasi'
      };

      const moduleType = categoryMap[kategori?.toLowerCase()] || kategori;
      
      // Jika ada informasi fungsi bangunan di metadata, gunakan untuk konteks spesifik
      const buildingFunction = metadata?.fungsi_bangunan || metadata?.building_function;
      
      if (buildingFunction) {
        // Get applicable standards untuk fungsi bangunan tersebut
        const applicable = nspkRepository.getApplicableStandards(buildingFunction);
        if (applicable.length > 0) {
          return applicable
            .slice(0, 3)
            .map(s => `### ${s.standard}: ${s.title}\n${s.content}`)
            .join('\n\n');
        }
      }
      
      // Fallback: get context by module type
      return nspkRepository.getContextForAI(moduleType, metadata);
    } catch (error) {
      console.warn('[AnalisisDokumenAI] Failed to retrieve NSPK context:', error);
      return null;
    }
  }

  /**
   * Extract standard names dari NSPK context
   * @private
   */
  _extractStandards(contextString) {
    if (!contextString) return [];
    
    // Extract standard codes (e.g., SNI 1726:2019, PUIL 2011, etc.)
    const standardPattern = /((?:SNI|PUIL|Permen|UU|PP)\s+(?:No\.\s+)?\d+(?:[\/:-]\d+)?(?:\/\w+)?)/g;
    const matches = contextString.match(standardPattern) || [];
    
    // Remove duplicates dan return
    return [...new Set(matches)];
  }

  /**
   * Call AI dengan exponential backoff retry
   */
  async _callAIWithRetry(prompt, options = {}) {
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.aiService.analyze(prompt);
      } catch (error) {
        lastError = error;

        const isRateLimit = error.message?.includes('429') ||
                           error.message?.toLowerCase().includes('quota') ||
                           error.message?.toLowerCase().includes('rate limit');

        if (isRateLimit && attempt < maxRetries) {
          // Exponential backoff: 2^attempt * 1000ms + jitter
          const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 1000);
          console.warn(`[AnalisisDokumenAI] Rate limit, retry ${attempt}/${maxRetries} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Analisis batch dokumen dengan rate limiting
   */
  async executeBatch(fileIds, userId = 'system', onProgress, options = {}) {
    try {
      const documents = await Promise.all(
        fileIds.map(async (id) => {
          const doc = await this.fileRepo.getById(id);
          return { id, ...doc, priority: options.priority || 'normal' };
        })
      );

      this.notificationService.notifySuccess(`Memulai analisis batch: ${documents.length} dokumen...`);

      const results = await this.batchProcessor.processBatch(
        documents.filter(d => d.id), // Filter out null docs
        (doc) => this._processSingleDocument(doc.id, userId, { ...options, priority: 'low' }),
        onProgress
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      this.notificationService.notifySuccess(
        `Batch analysis complete: ${successCount} sukses, ${failCount} gagal`
      );

      return {
        success: failCount === 0,
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failCount
        }
      };
    } catch (err) {
      this.notificationService.notifyError(`Gagal batch analysis: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get processing status
   */
  getStatus() {
    return {
      jobManager: this.jobManager.getStatus(),
      batchSize: this.batchProcessor.batchSize,
      delayBetweenBatches: this.batchProcessor.delayBetweenBatches
    };
  }
}
