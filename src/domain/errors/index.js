/**
 * DOMAIN ERRORS MODULE
 * 
 * Modul ini menyediakan base classes untuk error handling yang konsisten
 * di seluruh aplikasi. Setiap layer dapat menggunakan error spesifik
 * sesuai dengan konteksnya.
 * 
 * @module Domain.Errors
 * @example
 * import { 
 *   DomainError, 
 *   ValidationError, 
 *   RepositoryError,
 *   NotFoundError 
 * } from './errors';
 * 
 * // Throw specific error
 * throw new NotFoundError('Proyek', 'uuid-123');
 * 
 * // Catch and handle
 * try {
 *   await useCase.execute();
 * } catch (error) {
 *   if (error instanceof NotFoundError) {
 *     console.log(`${error.resource} tidak ditemukan`);
 *   }
 * }
 */

export {
  DomainError,
  ValidationError,
  RepositoryError,
  AIServiceError,
  NotFoundError,
  UnauthorizedError,
  SyncError
} from './DomainError.js';
