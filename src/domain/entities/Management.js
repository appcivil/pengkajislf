/**
 * BERKAS ENTITY
 * Mewakili sebuah file dokumen dalam proyek.
 */
export class Berkas {
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

  isAnalyzed() {
    return this.status === 'Analyzed' || this.ai_summary !== '';
  }
}

/**
 * CHECKLIST ITEM ENTITY
 * Mewakili satu item pemeriksaan teknis dalam SLF.
 */
export class ChecklistItem {
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

  isComplete() {
    return this.status === 'Sesuai' || this.status === 'Tidak Sesuai';
  }
}
