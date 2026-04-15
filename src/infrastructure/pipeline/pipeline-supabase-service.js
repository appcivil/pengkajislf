/**
 * Pipeline Supabase Service
 * Service untuk integrasi pipeline dengan Supabase (job tracking, metadata, vector storage)
 * @module infrastructure/pipeline/pipeline-supabase-service
 */

import { supabase } from '../../lib/supabase.js';

/**
 * Service untuk menyimpan dan mengelola data pipeline di Supabase
 */
export class PipelineSupabaseService {
  constructor() {
    this.tables = {
      jobs: 'smartai_jobs',
      documents: 'smartai_documents',
      chunks: 'smartai_chunks',
      embeddings: 'smartai_embeddings',
      cache: 'smartai_cache',
      logs: 'smartai_logs'
    };
    this.isInitialized = false;
  }

  /**
   * Inisialisasi service dan cek tabel
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Cek koneksi Supabase dengan query sederhana
      const { error } = await supabase
        .from(this.tables.jobs)
        .select('id', { count: 'exact', head: true });

      if (error && error.code === '42P01') {
        // Tabel belum ada, buat tabel
        await this._createTables();
      }

      this.isInitialized = true;
      console.log('[PipelineSupabaseService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[PipelineSupabaseService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Buat tabel-tabel yang diperlukan (jika belum ada)
   * @private
   */
  async _createTables() {
    // Catatan: Tabel harus dibuat melalui migration SQL di Supabase Dashboard
    // atau menggunakan Supabase CLI. Di sini kita hanya log saja.
    console.log('[PipelineSupabaseService] Tables not found. Please run migration SQL.');
    console.log('[PipelineSupabaseService] Required tables:', Object.values(this.tables));
  }

  // ============================================================================
  // JOB MANAGEMENT
  // ============================================================================

  /**
   * Simpan job ke Supabase
   * @param {Object} job - Job object
   * @returns {Promise<Object>}
   */
  async saveJob(job) {
    await this.initialize();

    try {
      const jobRecord = {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        input_metadata: job.metadata,
        result: job.result,
        error: job.error,
        created_at: job.createdAt,
        started_at: job.startedAt,
        completed_at: job.completedAt,
        user_id: job.metadata?.createdBy || null,
        project_id: job.metadata?.projectId || null,
        priority: job.metadata?.priority || 'normal',
        tags: job.metadata?.tags || []
      };

      const { data, error } = await supabase
        .from(this.tables.jobs)
        .upsert(jobRecord, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[PipelineSupabaseService] Error saving job:', error);
      // Fallback: tidak throw error, biarkan job tetap jalan di local
      return null;
    }
  }

  /**
   * Update status job
   * @param {string} jobId - Job ID
   * @param {string} status - Status baru
   * @param {Object} [updates] - Data tambahan
   * @returns {Promise<boolean>}
   */
  async updateJobStatus(jobId, status, updates = {}) {
    await this.initialize();

    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...updates
      };

      if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(this.tables.jobs)
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[PipelineSupabaseService] Error updating job status:', error);
      return false;
    }
  }

  /**
   * Dapatkan job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>}
   */
  async getJob(jobId) {
    await this.initialize();

    try {
      const { data, error } = await supabase
        .from(this.tables.jobs)
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[PipelineSupabaseService] Error getting job:', error);
      return null;
    }
  }

  /**
   * Dapatkan jobs by project
   * @param {string} projectId - Project ID
   * @param {Object} [options] - Options
   * @returns {Promise<Array<Object>>}
   */
  async getJobsByProject(projectId, options = {}) {
    await this.initialize();

    try {
      let query = supabase
        .from(this.tables.jobs)
        .select('*')
        .eq('project_id', projectId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[PipelineSupabaseService] Error getting jobs by project:', error);
      return [];
    }
  }

  /**
   * Dapatkan jobs by user
   * @param {string} userId - User ID
   * @param {Object} [options] - Options
   * @returns {Promise<Array<Object>>}
   */
  async getJobsByUser(userId, options = {}) {
    await this.initialize();

    try {
      let query = supabase
        .from(this.tables.jobs)
        .select('*')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[PipelineSupabaseService] Error getting jobs by user:', error);
      return [];
    }
  }

  // ============================================================================
  // DOCUMENT STORAGE
  // ============================================================================

  /**
   * Simpan metadata dokumen
   * @param {Object} document - Document metadata
   * @returns {Promise<Object>}
   */
  async saveDocument(document) {
    await this.initialize();

    try {
      const docRecord = {
        id: document.id || crypto.randomUUID(),
        job_id: document.jobId,
        file_name: document.fileName,
        file_type: document.fileType,
        file_size: document.fileSize,
        google_drive_id: document.googleDriveId,
        extracted_text: document.text,
        structure: document.structure,
        tables: document.tables,
        metadata: document.metadata,
        created_at: new Date().toISOString(),
        user_id: document.userId,
        project_id: document.projectId
      };

      const { data, error } = await supabase
        .from(this.tables.documents)
        .upsert(docRecord)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[PipelineSupabaseService] Error saving document:', error);
      return null;
    }
  }

  /**
   * Dapatkan dokumen by ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object|null>}
   */
  async getDocument(documentId) {
    await this.initialize();

    try {
      const { data, error } = await supabase
        .from(this.tables.documents)
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[PipelineSupabaseService] Error getting document:', error);
      return null;
    }
  }

  /**
   * Dapatkan dokumen by project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array<Object>>}
   */
  async getDocumentsByProject(projectId) {
    await this.initialize();

    try {
      const { data, error } = await supabase
        .from(this.tables.documents)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[PipelineSupabaseService] Error getting documents by project:', error);
      return [];
    }
  }

  // ============================================================================
  // CHUNK & EMBEDDING STORAGE (RAG)
  // ============================================================================

  /**
   * Simpan chunk dengan embedding
   * @param {string} documentId - Document ID
   * @param {Array<Object>} chunks - Array chunks dengan embedding
   * @returns {Promise<boolean>}
   */
  async saveChunks(documentId, chunks) {
    await this.initialize();

    try {
      const chunkRecords = chunks.map((chunk, index) => ({
        id: crypto.randomUUID(),
        document_id: documentId,
        chunk_index: index,
        text: chunk.text,
        embedding: chunk.embedding,
        metadata: chunk.metadata || {},
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from(this.tables.chunks)
        .upsert(chunkRecords);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[PipelineSupabaseService] Error saving chunks:', error);
      return false;
    }
  }

  /**
   * Search chunks dengan similarity search
   * @param {Array<number>} queryEmbedding - Query embedding vector
   * @param {Object} [options] - Options
   * @returns {Promise<Array<Object>>}
   */
  async searchSimilarChunks(queryEmbedding, options = {}) {
    await this.initialize();

    try {
      const { data, error } = await supabase
        .rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: options.threshold || 0.7,
          match_count: options.limit || 5,
          filter_document_ids: options.documentIds || null
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[PipelineSupabaseService] Error searching chunks:', error);
      // Fallback: return empty array
      return [];
    }
  }

  /**
   * Dapatkan chunks by document
   * @param {string} documentId - Document ID
   * @returns {Promise<Array<Object>>}
   */
  async getChunksByDocument(documentId) {
    await this.initialize();

    try {
      const { data, error } = await supabase
        .from(this.tables.chunks)
        .select('*')
        .eq('document_id', documentId)
        .order('chunk_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[PipelineSupabaseService] Error getting chunks:', error);
      return [];
    }
  }

  // ============================================================================
  // CACHE SYNC (Optional - untuk sync cache lokal ke Supabase)
  // ============================================================================

  /**
   * Simpan cache entry ke Supabase (untuk multi-device sync)
   * @param {string} key - Cache key
   * @param {Object} data - Cache data
   * @param {Object} [options] - Options
   * @returns {Promise<boolean>}
   */
  async syncCacheEntry(key, data, options = {}) {
    await this.initialize();

    try {
      const cacheRecord = {
        key,
        data,
        tag: options.tag || 'general',
        expires_at: options.expires ? new Date(options.expires).toISOString() : null,
        user_id: options.userId || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(this.tables.cache)
        .upsert(cacheRecord);

      if (error) throw error;
      return true;
    } catch (error) {
      // Cache sync failure tidak critical
      console.warn('[PipelineSupabaseService] Cache sync failed:', error);
      return false;
    }
  }

  /**
   * Dapatkan cache entry dari Supabase
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>}
   */
  async getCacheEntry(key) {
    await this.initialize();

    try {
      const { data, error } = await supabase
        .from(this.tables.cache)
        .select('*')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  // ============================================================================
  // LOGGING
  // ============================================================================

  /**
   * Log pipeline event
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} [metadata] - Metadata tambahan
   * @returns {Promise<boolean>}
   */
  async log(level, message, metadata = {}) {
    await this.initialize();

    try {
      const logRecord = {
        level,
        message,
        metadata,
        job_id: metadata.jobId || null,
        user_id: metadata.userId || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(this.tables.logs)
        .insert(logRecord);

      if (error) throw error;
      return true;
    } catch (error) {
      // Log failure tidak critical
      console.warn('[PipelineSupabaseService] Logging failed:', error);
      return false;
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Dapatkan statistik pipeline
   * @param {string} [projectId] - Filter by project
   * @returns {Promise<Object>}
   */
  async getStats(projectId = null) {
    await this.initialize();

    try {
      let query = supabase
        .from(this.tables.jobs)
        .select('status', { count: 'exact' });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { count: totalJobs, error: countError } = await query;

      if (countError) throw countError;

      // Dapatkan breakdown by status
      const { data: statusBreakdown, error: statusError } = await supabase
        .from(this.tables.jobs)
        .select('status')
        .then(result => {
          if (projectId) {
            return supabase
              .from(this.tables.jobs)
              .select('status')
              .eq('project_id', projectId);
          }
          return result;
        });

      const stats = {
        totalJobs: totalJobs || 0,
        byStatus: {},
        byType: {}
      };

      if (statusBreakdown) {
        statusBreakdown.forEach(job => {
          stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;
        });
      }

      return stats;
    } catch (error) {
      console.error('[PipelineSupabaseService] Error getting stats:', error);
      return { totalJobs: 0, byStatus: {}, byType: {} };
    }
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Dapatkan singleton instance PipelineSupabaseService
 * @returns {PipelineSupabaseService}
 */
export function getPipelineSupabaseService() {
  if (!serviceInstance) {
    serviceInstance = new PipelineSupabaseService();
  }
  return serviceInstance;
}

export default PipelineSupabaseService;
