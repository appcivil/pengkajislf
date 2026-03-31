/**
 * AMBIL DAFTAR PROYEK USE CASE
 */
export class AmbilDaftarProyek {
  constructor(proyekRepo) {
    this.proyekRepo = proyekRepo;
  }

  async execute() {
    try {
      const proyekList = await this.proyekRepo.getAll();
      return proyekList;
    } catch (err) {
      console.error("[Use Case] Gagal mengambil proyek:", err);
      throw err;
    }
  }
}
