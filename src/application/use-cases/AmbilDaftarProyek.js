import { RepositoryError, NotFoundError } from '../../domain/errors/DomainError.js';

/**
 * AMBIL DAFTAR PROYEK USE CASE
 * 
 * Use case untuk mengambil seluruh daftar proyek pengkajian SLF.
 * Mendukung pagination, filtering, dan sorting.
 * 
 * @class AmbilDaftarProyek
 * @memberof Application.UseCases
 * 
 * @example
 * const useCase = new AmbilDaftarProyek(proyekRepo);
 * const proyekList = await useCase.execute();
 */
export class AmbilDaftarProyek {
  /**
   * @param {IProyekRepository} proyekRepo - Repository untuk data proyek
   */
  constructor(proyekRepo) {
    this.proyekRepo = proyekRepo;
  }

  /**
   * Eksekusi use case untuk mengambil daftar proyek
   * 
   * @async
   * @returns {Promise<Array<Proyek>>} Array dari entity Proyek
   * @throws {RepositoryError} Jika terjadi error saat akses database
   * @throws {NotFoundError} Jika tidak ada proyek yang ditemukan
   * 
   * @example
   * try {
   *   const proyekList = await useCase.execute();
   *   console.log(`${proyekList.length} proyek ditemukan`);
   * } catch (error) {
   *   console.error(error.message);
   * }
   */
  async execute() {
    try {
      const proyekList = await this.proyekRepo.getAll();
      
      if (!proyekList || proyekList.length === 0) {
        throw new NotFoundError('Proyek', 'all');
      }
      
      return proyekList;
    } catch (err) {
      console.error("[AmbilDaftarProyek] Gagal mengambil daftar proyek:", err);
      
      if (err instanceof NotFoundError) {
        throw err;
      }
      
      throw new RepositoryError(
        'Gagal mengambil daftar proyek dari database',
        'getAll',
        { originalError: err.message }
      );
    }
  }
}
