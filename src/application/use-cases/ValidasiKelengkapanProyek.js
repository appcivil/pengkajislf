import { ValidationError, RepositoryError, NotFoundError } from '../../domain/errors/DomainError.js';

/**
 * VALIDASI KELENGKAPAN PROYEK USE CASE
 * 
 * Use case untuk memvalidasi kelengkapan dokumen proyek SLF.
 * Memeriksa keberadaan dokumen-dokumen wajib sesuai kategori SIMBG.
 * 
 * @class ValidasiKelengkapanProyek
 * @memberof Application.UseCases
 * 
 * @example
 * const useCase = new ValidasiKelengkapanProyek(fileRepo);
 * const audit = await useCase.execute('proyek-uuid-123');
 * console.log(`Skor kelengkapan: ${audit.score}%`);
 */
export class ValidasiKelengkapanProyek {
  /**
   * @param {IFileRepository} fileRepo - Repository untuk data berkas
   */
  constructor(fileRepo) {
    this.fileRepo = fileRepo;
  }

  /**
   * Definisi dokumen wajib per kategori SIMBG
   * @readonly
   * @static
   * @returns {Object.<string, Array<string>>} Mapping kategori ke dokumen wajib
   */
  static get REQUIRED_DOCUMENTS() {
    return {
      'umum': ['Data Umum', 'Data Penyedia Jasa', 'Laporan Pemeriksaan SLF'],
      'tanah': ['Sertifikat Tanah', 'Hasil Penyelidikan Tanah'],
      'arsitektur': ['Gambar Denah', 'Gambar Tampak', 'Gambar Potongan'],
      'struktur': ['Perhitungan Struktur', 'Gambar Detail Struktur'],
      'mep': ['Gambar MEP', 'Laporan MEP'],
      'lapangan': ['Foto Lapangan', 'Hasil Uji Lab']
    };
  }

  /**
   * Eksekusi validasi kelengkapan proyek
   * 
   * @async
   * @param {string} proyekId - UUID proyek yang akan divalidasi
   * @returns {Promise<ValidationAudit>} Hasil audit kelengkapan dokumen
   * @throws {ValidationError} Jika proyekId tidak valid
   * @throws {RepositoryError} Jika terjadi error saat akses database
   * @throws {NotFoundError} Jika proyek tidak ditemukan
   * 
   * @typedef {Object} ValidationAudit
   * @property {number} score - Skor kelengkapan (0-100)
   * @property {Array<string>} missing - Daftar dokumen yang kurang
   * @property {Array<DetailItem>} details - Detail per kategori/subkategori
   * @property {Object} counts - Statistik hitungan
   * @property {number} counts.total - Total poin maksimal
   * @property {number} counts.earned - Poin yang didapat
   * 
   * @typedef {Object} DetailItem
   * @property {string} cat - Kategori dokumen
   * @property {string} sub - Subkategori dokumen
   * @property {string} status - Status ('Ada' atau 'Missing')
   * @property {number} score - Skor untuk item ini
   * 
   * @example
   * try {
   *   const audit = await useCase.execute('proyek-uuid-123');
   *   if (audit.score < 100) {
   *     console.warn('Dokumen kurang:', audit.missing);
   *   }
   * } catch (error) {
   *   console.error('Validasi gagal:', error.message);
   * }
   */
  async execute(proyekId) {
    // Validasi input
    if (!proyekId || typeof proyekId !== 'string') {
      throw new ValidationError(
        'Proyek ID harus berupa string yang valid',
        'proyekId',
        { received: proyekId }
      );
    }

    try {
      // 1. Ambil semua berkas proyek
      const files = await this.fileRepo.getByProjectId(proyekId);
      
      if (!files) {
        throw new NotFoundError('Berkas proyek', proyekId);
      }
      
      // 2. Definisi Kebutuhan (Business Rules)
      const required = ValidasiKelengkapanProyek.REQUIRED_DOCUMENTS;

      /** @type {ValidationAudit} */
      const audit = {
        score: 0,
        missing: [],
        details: [],
        counts: { total: 0, earned: 0 }
      };

      // 3. Iterasi Kategori & Subkategori
      Object.keys(required).forEach(cat => {
        required[cat].forEach(sub => {
          audit.counts.total += 100;
          const found = files.find(f => 
            (f.kategori || "").toLowerCase() === cat.toLowerCase() && 
            (f.subkategori || "").toLowerCase().includes(sub.toLowerCase())
          );

          if (found) {
            audit.counts.earned += found.completeness || 100;
            audit.details.push({ cat, sub, status: 'Ada', score: found.completeness || 100 });
          } else {
            audit.missing.push(`${cat}: ${sub}`);
            audit.details.push({ cat, sub, status: 'Missing', score: 0 });
          }
        });
      });

      audit.score = Math.round((audit.counts.earned / audit.counts.total) * 100);
      return audit;
      
    } catch (err) {
      console.error(`[ValidasiKelengkapanProyek] Error validasi proyek ${proyekId}:`, err);
      
      // Re-throw domain errors
      if (err instanceof ValidationError || err instanceof NotFoundError) {
        throw err;
      }
      
      throw new RepositoryError(
        `Gagal mengambil data berkas untuk proyek ${proyekId}`,
        'getByProjectId',
        { proyekId, originalError: err.message }
      );
    }
  }
}
