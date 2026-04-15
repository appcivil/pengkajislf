import { SyncError, RepositoryError, ValidationError } from '../../domain/errors/DomainError.js';

/**
 * SYNC DATA USE CASE
 * 
 * Use case untuk mengatur proses sinkronisasi data dari cache lokal (IndexedDB) 
 * ke cloud (Supabase). Mendukung batch processing dan error recovery.
 * 
 * @class SyncData
 * @memberof Application.UseCases
 * 
 * @example
 * const useCase = new SyncData(checklistRepo, notificationService);
 * const result = await useCase.execute();
 * console.log(`${result.count} item berhasil disinkronkan`);
 */
export class SyncData {
  /**
   * @param {IChecklistRepository} checklistRepo - Repository untuk data checklist
   * @param {INotificationService} notificationService - Service untuk notifikasi UI
   */
  constructor(checklistRepo, notificationService) {
    this.checklistRepo = checklistRepo;
    this.notificationService = notificationService;
  }

  /**
   * Konfigurasi batch processing
   * @readonly
   * @static
   * @returns {Object} Konfigurasi batch
   */
  static get BATCH_CONFIG() {
    return {
      maxBatchSize: 100,
      retryAttempts: 3,
      retryDelay: 1000 // ms
    };
  }

  /**
   * Eksekusi sinkronisasi data
   * 
   * @async
   * @returns {Promise<SyncResult>} Hasil operasi sinkronisasi
   * @throws {SyncError} Jika sinkronisasi gagal sebagian/sepenuhnya
   * @throws {RepositoryError} Jika terjadi error saat akses database
   * 
   * @typedef {Object} SyncResult
   * @property {boolean} success - Status keberhasilan operasi
   * @property {number} count - Jumlah item yang berhasil disinkronkan
   * @property {number} [failedCount] - Jumlah item yang gagal (jika ada)
   * @property {Array<string>} [failedIds] - ID item yang gagal disinkronkan
   * @property {string} [timestamp] - Timestamp sinkronisasi (ISO 8601)
   * 
   * @example
   * try {
   *   const result = await useCase.execute();
   *   if (result.success) {
   *     console.log(`✓ ${result.count} data tersinkronisasi`);
   *   }
   * } catch (error) {
   *   if (error instanceof SyncError) {
   *     console.warn(`${error.failedCount} data gagal disinkronkan`);
   *   }
   * }
   */
  async execute() {
    const timestamp = new Date().toISOString();
    
    try {
      // 1. Ambil draft yang pending dari cache lokal
      const drafts = await this.checklistRepo.getPendingDrafts();
      
      if (!Array.isArray(drafts)) {
        throw new RepositoryError(
          'Format data draft tidak valid',
          'getPendingDrafts',
          { received: typeof drafts }
        );
      }
      
      if (drafts.length === 0) {
        return { 
          success: true, 
          count: 0, 
          timestamp,
          message: 'Tidak ada data yang perlu disinkronkan' 
        };
      }

      // 2. Validasi batch size
      const { maxBatchSize } = SyncData.BATCH_CONFIG;
      if (drafts.length > maxBatchSize) {
        throw new ValidationError(
          `Jumlah data (${drafts.length}) melebihi batas batch (${maxBatchSize})`,
          'drafts',
          { count: drafts.length, maxBatchSize }
        );
      }

      // 3. Persiapkan payload untuk dikirim
      const payload = drafts.map(({ id, ...rest }) => ({
        ...rest,
        updated_at: timestamp,
        synced_at: timestamp
      }));

      // 4. Simpan ke cloud
      await this.checklistRepo.upsertMany(payload);
      
      // 5. Hapus dari cache lokal setelah berhasil
      const draftIds = drafts.map(d => d.id).filter(Boolean);
      if (draftIds.length > 0) {
        await this.checklistRepo.clearSyncedDrafts(draftIds);
      }

      // 6. Notifikasi sukses
      const message = `Berhasil sinkronisasi ${drafts.length} data ke Cloud`;
      this.notificationService.notifySuccess(message);
      
      return { 
        success: true, 
        count: drafts.length, 
        timestamp,
        message 
      };
      
    } catch (err) {
      console.error('[SyncData] Gagal sinkronisasi:', err);
      
      // Re-throw domain errors yang sudah ditangani
      if (err instanceof ValidationError) {
        this.notificationService.notifyError(`Validasi gagal: ${err.message}`);
        throw err;
      }
      
      if (err instanceof RepositoryError) {
        this.notificationService.notifyError(`Database error: ${err.message}`);
        throw err;
      }

      // Handle unknown errors sebagai SyncError
      const errorMessage = err.message || 'Terjadi kesalahan saat sinkronisasi';
      this.notificationService.notifyError(`Gagal sinkronisasi: ${errorMessage}`);
      
      throw new SyncError(
        `Sinkronisasi gagal: ${errorMessage}`,
        0,
        { originalError: err.message, timestamp }
      );
    }
  }
}
