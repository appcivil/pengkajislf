/**
 * BERKAS ENTITY
 * 
 * Mewakili sebuah file dokumen/berkas dalam proyek pengkajian SLF.
 * Berkas dapat berupa dokumen administrasi, gambar teknik, foto lapangan,
 * atau dokumen pendukung lainnya.
 * 
 * @class Berkas
 * @memberof Domain.Entities
 * 
 * @example
 * const berkas = new Berkas({
 *   id: 'uuid-123',
 *   proyek_id: 'proyek-456',
 *   nama: 'Gambar Denah Lantai 1',
 *   kategori: 'arsitektur',
 *   subkategori: 'Gambar Denah',
 *   status: 'Analyzed'
 * });
 */
export class Berkas {
  /**
   * @param {Object} params - Parameter pembuatan berkas
   * @param {string} params.id - UUID unik berkas
   * @param {string} params.proyek_id - UUID proyek pemilik berkas
   * @param {string} params.nama - Nama berkas/dokumen
   * @param {string} params.kategori - Kategori SIMBG (umum, tanah, arsitektur, struktur, mep, lapangan)
   * @param {string} [params.subkategori=''] - Subkategori spesifik
   * @param {string} [params.ai_summary=''] - Ringkasan hasil analisis AI
   * @param {number} [params.completeness=0] - Skor kelengkapan dokumen (0-100)
   * @param {string} [params.status='Draft'] - Status berkas (Draft, Analyzed, Final)
   * @param {Object} [params.metadata={}] - Metadata tambahan
   */
  constructor({
    id,
    proyek_id,
    nama,
    kategori,
    subkategori = '',
    ai_summary = '',
    completeness = 0,
    status = 'Draft',
    metadata = {}
  }) {
    this.id = id;
    this.proyek_id = proyek_id;
    this.nama = nama;
    this.kategori = kategori;
    this.subkategori = subkategori;
    this.ai_summary = ai_summary;
    this.completeness = completeness;
    this.status = status;
    this.metadata = metadata;
  }

  /**
   * Cek apakah berkas sudah dianalisis oleh AI
   * @returns {boolean} True jika sudah dianalisis
   */
  isAnalyzed() {
    return this.status === 'Analyzed' || this.ai_summary !== '';
  }

  /**
   * Cek apakah berkas sudah final/valid
   * @returns {boolean} True jika status adalah Final
   */
  isFinal() {
    return this.status === 'Final';
  }

  /**
   * Update status berkas
   * @param {string} newStatus - Status baru
   * @returns {Berkas} Instance berkas (untuk chaining)
   */
  updateStatus(newStatus) {
    this.status = newStatus;
    return this;
  }
}

/**
 * CHECKLIST ITEM ENTITY
 * 
 * Mewakili satu item pemeriksaan teknis dalam daftar simak SLF.
 * Setiap item merepresentasikan satu aspek yang diperiksa dengan status
 * kesesuaian terhadap standar.
 * 
 * @class ChecklistItem
 * @memberof Domain.Entities
 * 
 * @example
 * const item = new ChecklistItem({
 *   id: 'check-123',
 *   proyek_id: 'proyek-456',
 *   kode: 'A.1',
 *   pernyataan: 'Kesesuaian peruntukan bangunan',
 *   kategori: 'administrasi',
 *   status: 'Sesuai'
 * });
 */
export class ChecklistItem {
  /**
   * Status yang dianggap lengkap/selesai
   * @readonly
   * @static
   * @returns {Array<string>}
   */
  static get COMPLETED_STATUSES() {
    return ['Sesuai', 'Tidak Sesuai'];
  }

  /**
   * @param {Object} params - Parameter pembuatan item
   * @param {string} params.id - UUID unik item
   * @param {string} params.proyek_id - UUID proyek
   * @param {string} params.kode - Kode item (e.g., 'A.1', 'B.2')
   * @param {string} params.pernyataan - Pernyataan pemeriksaan
   * @param {string} params.kategori - Kategori aspek (administrasi, arsitektur, struktur, mep)
   * @param {string} [params.status='Belum Diisi'] - Status pemeriksaan
   * @param {string} [params.keterangan=''] - Keterangan tambahan
   * @param {Array<string>} [params.foto_url=[]] - URL foto bukti
   * @param {string} [params.updated_at] - Timestamp update terakhir
   */
  constructor({
    id,
    proyek_id,
    kode,
    pernyataan,
    kategori,
    status = 'Belum Diisi',
    keterangan = '',
    foto_url = [],
    updated_at = new Date().toISOString()
  }) {
    this.id = id;
    this.proyek_id = proyek_id;
    this.kode = kode;
    this.pernyataan = pernyataan;
    this.kategori = kategori;
    this.status = status;
    this.keterangan = keterangan;
    this.foto_url = foto_url;
    this.updated_at = updated_at;
  }

  /**
   * Cek apakah item sudah lengkap diisi
   * @returns {boolean} True jika status adalah Sesuai atau Tidak Sesuai
   */
  isComplete() {
    return ChecklistItem.COMPLETED_STATUSES.includes(this.status);
  }

  /**
   * Cek apakah item memiliki foto bukti
   * @returns {boolean} True jika ada foto
   */
  hasEvidence() {
    return Array.isArray(this.foto_url) && this.foto_url.length > 0;
  }

  /**
   * Update status pemeriksaan
   * @param {string} newStatus - Status baru
   * @param {string} [keterangan=''] - Keterangan tambahan
   * @returns {ChecklistItem} Instance item (untuk chaining)
   */
  updateStatus(newStatus, keterangan = '') {
    this.status = newStatus;
    if (keterangan) {
      this.keterangan = keterangan;
    }
    this.updated_at = new Date().toISOString();
    return this;
  }
}
