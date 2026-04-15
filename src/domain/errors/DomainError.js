/**
 * DOMAIN ERROR BASE CLASS
 * Base class untuk semua error di domain layer.
 * Memastikan konsistensi error handling di seluruh aplikasi.
 * 
 * @class DomainError
 * @extends Error
 */
export class DomainError extends Error {
  /**
   * @param {string} message - Pesan error
   * @param {string} code - Kode error unik
   * @param {Object} [metadata={}] - Metadata tambahan untuk debugging
   */
  constructor(message, code, metadata = {}) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }

  /**
   * Convert error ke format JSON untuk logging
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * VALIDATION ERROR
 * Error untuk validasi input/business logic
 * 
 * @class ValidationError
 * @extends DomainError
 */
export class ValidationError extends DomainError {
  /**
   * @param {string} message - Pesan error
   * @param {string} [field] - Field yang gagal validasi
   * @param {Object} [metadata={}] - Metadata tambahan
   */
  constructor(message, field = null, metadata = {}) {
    super(message, 'VALIDATION_ERROR', { ...metadata, field });
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * REPOSITORY ERROR
 * Error untuk operasi database/repository
 * 
 * @class RepositoryError
 * @extends DomainError
 */
export class RepositoryError extends DomainError {
  /**
   * @param {string} message - Pesan error
   * @param {string} [operation] - Operasi yang gagal (e.g., 'getAll', 'save')
   * @param {Object} [metadata={}] - Metadata tambahan
   */
  constructor(message, operation = null, metadata = {}) {
    super(message, 'REPOSITORY_ERROR', { ...metadata, operation });
    this.name = 'RepositoryError';
    this.operation = operation;
  }
}

/**
 * AI SERVICE ERROR
 * Error untuk layanan AI/ML
 * 
 * @class AIServiceError
 * @extends DomainError
 */
export class AIServiceError extends DomainError {
  /**
   * @param {string} message - Pesan error
   * @param {string} [provider] - Provider AI (e.g., 'gemini', 'openrouter')
   * @param {Object} [metadata={}] - Metadata tambahan
   */
  constructor(message, provider = null, metadata = {}) {
    super(message, 'AI_SERVICE_ERROR', { ...metadata, provider });
    this.name = 'AIServiceError';
    this.provider = provider;
  }
}

/**
 * NOT FOUND ERROR
 * Error untuk resource tidak ditemukan
 * 
 * @class NotFoundError
 * @extends DomainError
 */
export class NotFoundError extends DomainError {
  /**
   * @param {string} resource - Nama resource (e.g., 'Proyek', 'Berkas')
   * @param {string|number} id - ID resource yang dicari
   * @param {Object} [metadata={}] - Metadata tambahan
   */
  constructor(resource, id, metadata = {}) {
    super(`${resource} dengan ID "${id}" tidak ditemukan`, 'NOT_FOUND', { ...metadata, resource, id });
    this.name = 'NotFoundError';
    this.resource = resource;
    this.resourceId = id;
  }
}

/**
 * UNAUTHORIZED ERROR
 * Error untuk akses tidak diizinkan
 * 
 * @class UnauthorizedError
 * @extends DomainError
 */
export class UnauthorizedError extends DomainError {
  /**
   * @param {string} [message='Akses tidak diizinkan'] - Pesan error
   * @param {Object} [metadata={}] - Metadata tambahan
   */
  constructor(message = 'Akses tidak diizinkan', metadata = {}) {
    super(message, 'UNAUTHORIZED', metadata);
    this.name = 'UnauthorizedError';
  }
}

/**
 * SYNC ERROR
 * Error untuk operasi sinkronisasi
 * 
 * @class SyncError
 * @extends DomainError
 */
export class SyncError extends DomainError {
  /**
   * @param {string} message - Pesan error
   * @param {number} [failedCount=0] - Jumlah item yang gagal sync
   * @param {Object} [metadata={}] - Metadata tambahan
   */
  constructor(message, failedCount = 0, metadata = {}) {
    super(message, 'SYNC_ERROR', { ...metadata, failedCount });
    this.name = 'SyncError';
    this.failedCount = failedCount;
  }
}

export default DomainError;
