/**
 * RAG Engine untuk Retrieval-Augmented Generation
 * Menggunakan TensorFlow.js untuk embeddings dan IndexedDB untuk vector store
 * @module infrastructure/pipeline/engines/rag-engine
 */

import { IRAGEngine } from '../../../core/smart-ai/engine-interface.js';
import { PipelineType, CHUNKING_CONFIG } from '../../../core/smart-ai/types.js';

/**
 * Engine untuk RAG (Retrieval-Augmented Generation)
 */
export class RAGEngine extends IRAGEngine {
  constructor(config = {}) {
    super('RAGEngine', config);
    
    this.supportedTypes = ['text', 'document', 'query'];
    
    // Vector store (using Dexie.js or in-memory)
    this.vectorStore = config.vectorStore || new Map();
    this.embeddingModel = null;
    this.embeddingDimension = config.embeddingDimension || 384; // Default untuk MiniLM
    
    // Chunking config
    this.chunkSize = config.chunkSize || 500;
    this.chunkOverlap = config.chunkOverlap || 50;
    this.maxChunksPerDocument = config.maxChunksPerDocument || 100;
    
    // TensorFlow.js (lazy load)
    this.tf = null;
    this.useModel = config.useModel || 'universal-sentence-encoder';
    
    // In-memory index
    this.index = new Map();
    this.documentMetadata = new Map();
  }

  /**
   * Inisialisasi engine dan load embedding model
   * Menggunakan @xenova/transformers untuk menghindari CORS issues
   * @returns {Promise<boolean>}
   */
  async initialize() {
    try {
      // Dynamic import @xenova/transformers (ONNX-based, no CORS issues)
      const { pipeline, env } = await import('@xenova/transformers');
      
      // Configure transformers untuk browser environment
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      
      // Load feature extraction pipeline dengan model ringan
      // Xenova/all-MiniLM-L6-v2 adalah alternatif ringan dari sentence-transformers
      this.embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        revision: 'main',
        quantized: true // Gunakan model quantized untuk ukuran lebih kecil
      });
      
      // Update dimension untuk MiniLM (384 dimensions)
      this.embeddingDimension = 384;
      
      console.log('[RAGEngine] Initialized with Xenova Transformers (MiniLM-L6-v2)');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('[RAGEngine] Transformers initialization failed, using fallback:', error);
      
      // Fallback: use simple TF-IDF based embeddings
      this.useFallbackEmbeddings = true;
      this.isInitialized = true;
      return true;
    }
  }

  /**
   * Chunking teks
   * @param {string} text - Teks yang akan di-chunk
   * @param {Object} options - Options chunking
   * @returns {Promise<Array<Object>>}
   */
  async chunk(text, options = {}) {
    const strategy = options.strategy || 'semantic';
    const config = CHUNKING_CONFIG[strategy] || CHUNKING_CONFIG.document;
    
    const size = options.size || config.size || this.chunkSize;
    const overlap = options.overlap || config.overlap || this.chunkOverlap;
    const separators = config.separators || ['\n\n', '\n', '. ', '! ', '? '];

    const chunks = [];
    
    // Jika teks lebih pendek dari chunk size, return sebagai single chunk
    if (text.length <= size) {
      return [{
        id: `chunk-0`,
        text: text.trim(),
        index: 0,
        start: 0,
        end: text.length,
        metadata: options.metadata || {}
      }];
    }

    // Semantic chunking dengan respect ke separators
    let position = 0;
    let chunkIndex = 0;

    while (position < text.length && chunkIndex < this.maxChunksPerDocument) {
      // Cari chunk boundary
      let chunkEnd = Math.min(position + size, text.length);
      
      // Coba cari separator terdekat sebelum chunkEnd
      for (const separator of separators) {
        const searchStart = Math.max(position + size - overlap, position);
        const searchEnd = Math.min(position + size, text.length);
        const separatorIndex = text.lastIndexOf(separator, searchEnd);
        
        if (separatorIndex > searchStart) {
          chunkEnd = separatorIndex + separator.length;
          break;
        }
      }

      const chunkText = text.slice(position, chunkEnd).trim();
      
      if (chunkText) {
        chunks.push({
          id: `${options.documentId || 'doc'}-chunk-${chunkIndex}`,
          text: chunkText,
          index: chunkIndex,
          start: position,
          end: chunkEnd,
          metadata: {
            ...options.metadata,
            charCount: chunkText.length,
            wordCount: chunkText.split(/\s+/).length
          }
        });
        chunkIndex++;
      }

      position = chunkEnd - overlap;
      
      // Avoid infinite loop
      if (position <= 0 || position >= text.length) break;
    }

    return chunks;
  }

  /**
   * Generate embedding untuk teks
   * @param {string|Array<string>} text - Teks atau array teks
   * @returns {Promise<Array<number>|Array<Array<number>>>}
   */
  async embed(text) {
    await this.initialize();

    const texts = Array.isArray(text) ? text : [text];
    
    if (this.useFallbackEmbeddings) {
      // Fallback: simple TF-IDF embeddings
      return texts.map(t => this._fallbackEmbedding(t));
    }

    try {
      // Gunakan @xenova/transformers pipeline
      // Output format: [{embedding: [[number]]}] atau batch format
      const results = await this.embeddingModel(texts, { 
        pooling: 'mean',     // Mean pooling untuk sentence embedding
        normalize: true      // Normalize untuk cosine similarity
      });
      
      // Extract embeddings dari output
      const embeddings = results.map(result => {
        // Handle both single and batched outputs
        if (Array.isArray(result)) {
          return result[0]; // Take first if batched
        }
        return result.data || result;
      });
      
      return Array.isArray(text) ? embeddings : embeddings[0];
    } catch (error) {
      console.error('[RAGEngine] Embedding error:', error);
      return texts.map(t => this._fallbackEmbedding(t));
    }
  }

  /**
   * Simpan chunk ke vector store
   * @param {Array<Object>} chunks - Array chunk dengan embedding
   * @param {Object} metadata - Metadata untuk chunks
   * @returns {Promise<void>}
   */
  async index(chunks, metadata = {}) {
    const documentId = metadata.documentId || `doc-${Date.now()}`;
    
    // Simpan metadata dokumen
    this.documentMetadata.set(documentId, {
      id: documentId,
      createdAt: new Date().toISOString(),
      chunkCount: chunks.length,
      ...metadata
    });

    // Index setiap chunk
    for (const chunk of chunks) {
      if (!chunk.embedding) {
        chunk.embedding = await this.embed(chunk.text);
      }
      
      const indexEntry = {
        id: chunk.id,
        documentId,
        text: chunk.text,
        embedding: chunk.embedding,
        metadata: chunk.metadata
      };
      
      this.index.set(chunk.id, indexEntry);
      
      // Jika menggunakan external vector store
      if (this.vectorStore instanceof Map) {
        this.vectorStore.set(chunk.id, indexEntry);
      }
    }

    console.log(`[RAGEngine] Indexed ${chunks.length} chunks for document ${documentId}`);
  }

  /**
   * Retrieval - cari chunk yang relevan
   * @param {string} query - Query pencarian
   * @param {Object} options - Options retrieval
   * @returns {Promise<Array<Object>>}
   */
  async retrieve(query, options = {}) {
    await this.initialize();

    const topK = options.topK || 5;
    const minScore = options.minScore || 0.5;
    const filterDocumentIds = options.filterDocumentIds || null;

    // Generate query embedding
    const queryEmbedding = await this.embed(query);

    // Hitung similarity dengan semua chunks
    const similarities = [];
    
    for (const [id, entry] of this.index.entries()) {
      // Filter by document jika diminta
      if (filterDocumentIds && !filterDocumentIds.includes(entry.documentId)) {
        continue;
      }

      const similarity = this._cosineSimilarity(queryEmbedding, entry.embedding);
      
      if (similarity >= minScore) {
        similarities.push({
          ...entry,
          similarity,
          rank: 0 // Akan di-set setelah sorting
        });
      }
    }

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // Ambil topK
    const results = similarities.slice(0, topK);
    
    // Set rank
    results.forEach((r, i) => r.rank = i + 1);

    return results;
  }

  /**
   * Query dengan RAG (retrieve + generate)
   * @param {string} query - User query
   * @param {Function} generateFn - Function untuk generate response
   * @returns {Promise<Object>}
   */
  async query(query, generateFn) {
    // Retrieve relevant chunks
    const chunks = await this.retrieve(query, {
      topK: 5,
      minScore: 0.6
    });

    if (chunks.length === 0) {
      return {
        query,
        chunks: [],
        response: null,
        error: 'Tidak menemukan konten yang relevan'
      };
    }

    // Build context dari chunks
    const context = chunks.map((c, i) => 
      `[${i + 1}] ${c.text.substring(0, 300)}...`
    ).join('\n\n');

    // Generate response
    let response = null;
    if (generateFn && typeof generateFn === 'function') {
      try {
        response = await generateFn(query, context, chunks);
      } catch (error) {
        console.error('[RAGEngine] Generation error:', error);
      }
    }

    return {
      query,
      chunks,
      context,
      response,
      chunkCount: chunks.length
    };
  }

  /**
   * Proses dokumen lengkap (chunk + embed + index)
   * @param {string} documentId - ID dokumen
   * @param {string} text - Teks dokumen
   * @param {Object} metadata - Metadata dokumen
   * @returns {Promise<Object>}
   */
  async processDocument(documentId, text, metadata = {}) {
    // Chunking
    const chunks = await this.chunk(text, {
      documentId,
      strategy: metadata.strategy || 'semantic',
      metadata: {
        documentTitle: metadata.title,
        documentType: metadata.type
      }
    });

    // Generate embeddings
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await this.embed(chunkTexts);
    
    // Assign embeddings ke chunks
    chunks.forEach((chunk, i) => {
      chunk.embedding = embeddings[i];
    });

    // Index chunks
    await this.index(chunks, {
      documentId,
      title: metadata.title,
      type: metadata.type,
      createdAt: new Date().toISOString()
    });

    return {
      documentId,
      chunkCount: chunks.length,
      chunks
    };
  }

  /**
   * Hapus dokumen dari index
   * @param {string} documentId - ID dokumen
   * @returns {Promise<number>} Jumlah chunks yang dihapus
   */
  async deleteDocument(documentId) {
    let deletedCount = 0;
    
    for (const [id, entry] of this.index.entries()) {
      if (entry.documentId === documentId) {
        this.index.delete(id);
        
        if (this.vectorStore instanceof Map) {
          this.vectorStore.delete(id);
        }
        
        deletedCount++;
      }
    }
    
    this.documentMetadata.delete(documentId);
    
    return deletedCount;
  }

  /**
   * Dapatkan semua dokumen yang terindex
   * @returns {Promise<Array<Object>>}
   */
  async getIndexedDocuments() {
    return Array.from(this.documentMetadata.values());
  }

  /**
   * Dapatkan chunks dari dokumen tertentu
   * @param {string} documentId - ID dokumen
   * @returns {Promise<Array<Object>>}
   */
  async getDocumentChunks(documentId) {
    const chunks = [];
    
    for (const [id, entry] of this.index.entries()) {
      if (entry.documentId === documentId) {
        chunks.push(entry);
      }
    }
    
    return chunks.sort((a, b) => a.metadata.index - b.metadata.index);
  }

  /**
   * Dapatkan statistik index
   * @returns {Object}
   */
  getStats() {
    return {
      totalChunks: this.index.size,
      totalDocuments: this.documentMetadata.size,
      embeddingDimension: this.embeddingDimension,
      useFallbackEmbeddings: this.useFallbackEmbeddings
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Cosine similarity antara dua vectors
   * @private
   */
  _cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return 0;
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Fallback embedding menggunakan simple TF-IDF
   * @private
   */
  _fallbackEmbedding(text) {
    // Simple bag-of-words embedding
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    // Create simple hash-based embedding
    const embedding = new Array(this.embeddingDimension).fill(0);
    
    words.forEach((word, i) => {
      const hash = this._simpleHash(word);
      const index = hash % this.embeddingDimension;
      embedding[index] += 1;
    });

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      return embedding.map(v => v / norm);
    }
    
    return embedding;
  }

  /**
   * Simple string hash
   * @private
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    if (this.embeddingModel) {
      // Dispose TF model jika ada
      this.embeddingModel = null;
    }
    
    if (this.tf) {
      // Cleanup TF tensors
      this.tf = null;
    }
    
    this.index.clear();
    this.documentMetadata.clear();
    this.vectorStore.clear();
    
    this.isInitialized = false;
  }
}

export default RAGEngine;
