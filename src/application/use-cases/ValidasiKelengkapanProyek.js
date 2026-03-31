/**
 * VALIDASI KELENGKAPAN PROYEK USE CASE
 */
export class ValidasiKelengkapanProyek {
    constructor(fileRepo) {
        this.fileRepo = fileRepo;
    }

    async execute(proyekId) {
        // 1. Ambil semua berkas proyek
        const files = await this.fileRepo.getByProjectId(proyekId);
        
        // 2. Definisi Kebutuhan (Business Rules)
        const required = {
          'umum': ['Data Umum', 'Data Penyedia Jasa', 'Laporan Pemeriksaan SLF'],
          'tanah': ['Sertifikat Tanah', 'Hasil Penyelidikan Tanah'],
          'arsitektur': ['Gambar Denah', 'Gambar Tampak', 'Gambar Potongan'],
          'struktur': ['Perhitungan Struktur', 'Gambar Detail Struktur'],
          'mep': ['Gambar MEP', 'Laporan MEP'],
          'lapangan': ['Foto Lapangan', 'Hasil Uji Lab']
        };

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
                 audit.details.push({ cat, sub, status: 'Ada', score: found.completeness });
              } else {
                 audit.missing.push(`${cat}: ${sub}`);
                 audit.details.push({ cat, sub, status: 'Missing', score: 0 });
              }
           });
        });

        audit.score = Math.round((audit.counts.earned / audit.counts.total) * 100);
        return audit;
    }
}
