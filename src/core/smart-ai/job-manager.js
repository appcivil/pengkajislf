/**
 * Job Manager untuk mengelola queue dan status pemrosesan
 * @module core/smart-ai/job-manager
 */

import { JobStatus, PipelineType } from './types.js';

/**
 * Class untuk mengelola job pipeline
 */
export class JobManager {
  constructor(config = {}) {
    this.config = {
      maxConcurrentJobs: config.maxConcurrentJobs || 3,
      maxQueueSize: config.maxQueueSize || 100,
      jobTimeout: config.jobTimeout || 300000, // 5 menit
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    // Queue dan active jobs
    this.queue = [];
    this.activeJobs = new Map();
    this.completedJobs = new Map();
    
    // Event handlers
    this.eventHandlers = {
      onJobCreated: [],
      onJobStarted: [],
      onJobProgress: [],
      onJobCompleted: [],
      onJobFailed: [],
      onJobCancelled: []
    };

    // Processing state
    this.isProcessing = false;
    this.processInterval = null;
  }

  /**
   * Generate unique job ID
   * @private
   * @returns {string}
   */
  _generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Buat job baru
   * @param {Object} input - Input data
   * @param {string} pipelineType - Tipe pipeline
   * @param {Object} metadata - Metadata tambahan
   * @returns {Object} Job object
   */
  createJob(input, pipelineType, metadata = {}) {
    // Validasi queue capacity
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Queue penuh. Mohon tunggu beberapa saat.');
    }

    const job = {
      id: this._generateJobId(),
      type: pipelineType,
      status: JobStatus.PENDING,
      input: input,
      metadata: {
        ...metadata,
        createdBy: metadata.createdBy || 'system',
        projectId: metadata.projectId || null,
        priority: metadata.priority || 'normal' // 'high', 'normal', 'low'
      },
      progress: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      attempts: 0,
      logs: []
    };

    // Tambahkan ke queue dengan prioritas
    this._addToQueue(job);
    
    // Emit event
    this._emit('onJobCreated', job);
    
    // Auto-start processing jika belum berjalan
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return job;
  }

  /**
   * Tambahkan job ke queue dengan mempertimbangkan prioritas
   * @private
   * @param {Object} job - Job object
   */
  _addToQueue(job) {
    const priorityWeight = {
      'high': 3,
      'normal': 2,
      'low': 1
    };

    // Insert berdasarkan prioritas (higher priority = earlier in queue)
    const jobWeight = priorityWeight[job.metadata.priority] || 2;
    
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const queuedJobWeight = priorityWeight[this.queue[i].metadata.priority] || 2;
      if (jobWeight > queuedJobWeight) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, job);
  }

  /**
   * Start job processing loop
   */
  startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processInterval = setInterval(() => {
      this._processQueue();
    }, 100);
  }

  /**
   * Stop job processing loop
   */
  stopProcessing() {
    this.isProcessing = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Proses queue - cek dan jalankan job yang available
   * @private
   */
  async _processQueue() {
    // Cek concurrent limit
    if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
      return;
    }

    // Ambil job dari queue
    const job = this.queue.shift();
    if (!job) return;

    // Update status dan pindahkan ke active jobs
    job.status = JobStatus.PROCESSING;
    job.startedAt = new Date().toISOString();
    job.attempts++;
    
    this.activeJobs.set(job.id, job);
    this._emit('onJobStarted', job);

    // Jalankan job dengan timeout
    this._executeJob(job).catch(error => {
      console.error(`[JobManager] Error executing job ${job.id}:`, error);
    });
  }

  /**
   * Eksekusi job dengan timeout dan retry logic
   * @private
   * @param {Object} job - Job object
   */
  async _executeJob(job) {
    const startTime = Date.now();
    const timeout = this.config.jobTimeout;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), timeout);
      });

      // Execute job (akan diimplementasikan oleh orchestrator)
      // Ini placeholder - actual execution akan di-handle oleh orchestrator
      const result = await Promise.race([
        this._runJobExecution(job),
        timeoutPromise
      ]);

      // Success
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date().toISOString();
      job.result = result;
      job.progress = 100;
      
      this.activeJobs.delete(job.id);
      this.completedJobs.set(job.id, job);
      
      this._emit('onJobCompleted', job);

    } catch (error) {
      await this._handleJobError(job, error);
    }
  }

  /**
   * Placeholder untuk job execution - akan di-override oleh orchestrator
   * @private
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async _runJobExecution(job) {
    // Ini akan di-override oleh orchestrator yang mendaftarkan callback
    if (this.onExecuteJob) {
      return await this.onExecuteJob(job);
    }
    throw new Error('Job execution handler belum diregister');
  }

  /**
   * Handle job error dengan retry logic
   * @private
   * @param {Object} job - Job object
   * @param {Error} error - Error object
   */
  async _handleJobError(job, error) {
    job.error = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    // Retry jika belum mencapai max attempts
    if (job.attempts < this.config.retryAttempts) {
      job.status = JobStatus.PENDING;
      job.logs.push(`Retry attempt ${job.attempts} after error: ${error.message}`);
      
      // Delay sebelum retry
      await this._delay(this.config.retryDelay * job.attempts);
      
      // Kembalikan ke queue
      this._addToQueue(job);
      this.activeJobs.delete(job.id);
    } else {
      // Max retries reached - fail the job
      job.status = JobStatus.FAILED;
      job.completedAt = new Date().toISOString();
      
      this.activeJobs.delete(job.id);
      this.completedJobs.set(job.id, job);
      
      this._emit('onJobFailed', job);
    }
  }

  /**
   * Delay helper
   * @private
   * @param {number} ms - Milliseconds
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update progress job
   * @param {string} jobId - Job ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} [message] - Status message
   */
  updateProgress(jobId, progress, message = null) {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    job.progress = Math.min(Math.max(progress, 0), 100);
    if (message) {
      job.logs.push({
        timestamp: new Date().toISOString(),
        progress,
        message
      });
    }

    this._emit('onJobProgress', job);
  }

  /**
   * Update status job
   * @param {string} jobId - Job ID
   * @param {string} status - Status baru
   * @param {Object} [data] - Data tambahan
   */
  updateStatus(jobId, status, data = {}) {
    const job = this.activeJobs.get(jobId) || this.queue.find(j => j.id === jobId);
    if (!job) return;

    job.status = status;
    Object.assign(job, data);

    if (status === JobStatus.CANCELLED) {
      this._emit('onJobCancelled', job);
    }
  }

  /**
   * Cancel job yang sedang berjalan atau di queue
   * @param {string} jobId - Job ID
   * @returns {boolean}
   */
  cancelJob(jobId) {
    // Cek di active jobs
    if (this.activeJobs.has(jobId)) {
      const job = this.activeJobs.get(jobId);
      job.status = JobStatus.CANCELLED;
      job.completedAt = new Date().toISOString();
      
      this.activeJobs.delete(jobId);
      this.completedJobs.set(jobId, job);
      
      this._emit('onJobCancelled', job);
      return true;
    }

    // Cek di queue
    const queueIndex = this.queue.findIndex(j => j.id === jobId);
    if (queueIndex !== -1) {
      const job = this.queue[queueIndex];
      job.status = JobStatus.CANCELLED;
      job.completedAt = new Date().toISOString();
      
      this.queue.splice(queueIndex, 1);
      this.completedJobs.set(jobId, job);
      
      this._emit('onJobCancelled', job);
      return true;
    }

    return false;
  }

  /**
   * Dapatkan job by ID
   * @param {string} jobId - Job ID
   * @returns {Object|null}
   */
  getJob(jobId) {
    return this.activeJobs.get(jobId) || 
           this.queue.find(j => j.id === jobId) ||
           this.completedJobs.get(jobId) ||
           null;
  }

  /**
   * Dapatkan semua active jobs
   * @returns {Array<Object>}
   */
  getActiveJobs() {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Dapatkan semua queued jobs
   * @returns {Array<Object>}
   */
  getQueuedJobs() {
    return [...this.queue];
  }

  /**
   * Dapatkan semua completed jobs (dengan limit)
   * @param {number} [limit=50] - Limit jumlah jobs
   * @returns {Array<Object>}
   */
  getCompletedJobs(limit = 50) {
    return Array.from(this.completedJobs.values())
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, limit);
  }

  /**
   * Register event handler
   * @param {string} event - Nama event
   * @param {Function} handler - Handler function
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  /**
   * Unregister event handler
   * @param {string} event - Nama event
   * @param {Function} handler - Handler function
   */
  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  /**
   * Emit event ke semua handlers
   * @private
   * @param {string} event - Nama event
   * @param {Object} data - Data event
   */
  _emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[JobManager] Error in event handler:`, error);
        }
      });
    }
  }

  /**
   * Clear completed jobs dari memory
   * @param {number} [olderThanMinutes=60] - Hapus jobs yang lebih lama dari X menit
   */
  clearCompletedJobs(olderThanMinutes = 60) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60000);
    
    for (const [id, job] of this.completedJobs.entries()) {
      const completedAt = new Date(job.completedAt);
      if (completedAt < cutoff) {
        this.completedJobs.delete(id);
      }
    }
  }

  /**
   * Dapatkan statistik queue
   * @returns {Object}
   */
  getStats() {
    return {
      queued: this.queue.length,
      active: this.activeJobs.size,
      completed: this.completedJobs.size,
      maxConcurrent: this.config.maxConcurrentJobs,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.stopProcessing();
    this.queue = [];
    this.activeJobs.clear();
    this.completedJobs.clear();
    
    // Clear all event handlers
    Object.keys(this.eventHandlers).forEach(key => {
      this.eventHandlers[key] = [];
    });
  }
}

// Singleton instance
let managerInstance = null;

/**
 * Dapatkan singleton instance JobManager
 * @param {Object} [config] - Konfigurasi (hanya digunakan saat inisialisasi)
 * @returns {JobManager}
 */
export function getJobManager(config) {
  if (!managerInstance) {
    managerInstance = new JobManager(config);
  }
  return managerInstance;
}

export default JobManager;
