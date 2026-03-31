/**
 * PROYEK ENTITY
 * Representasi inti dari sebuah proyek pengkajian SLF.
 */
export class Proyek {
  constructor({
    id,
    nama,
    alamat,
    status = 'Draft',
    skore = 0,
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString(),
    metadata = {}
  }) {
    this.id = id;
    this.nama = nama;
    this.alamat = alamat;
    this.status = status;
    this.skore = skore;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.metadata = metadata;
  }

  // Business Logic: Menghitung kelaikan berdasarkan skor
  isLaikFungsi() {
    return this.skore >= 80;
  }

  updateSkore(newSkore) {
    if (newSkore < 0 || newSkore > 100) throw new Error('Skor harus antara 0-100');
    this.skore = newSkore;
    this.updated_at = new Date().toISOString();
  }
}
