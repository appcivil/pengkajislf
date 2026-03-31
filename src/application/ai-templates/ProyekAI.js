/**
 * PROYEK AI TEMPLATES
 * Pustaka prompt untuk asisten pengkaji.
 */
export const PROYEK_AI_TEMPLATES = {
  DOCUMENT_ANALYSIS: (fileName, currentCategory) => `
    Anda adalah AI Engineering Assistant untuk pengkajian SLF (Sertifikat Laik Fungsi).
    Analisis file berikut:
    Nama File: ${fileName}
    Kategori Awal: ${currentCategory || 'Belum dikategorikan'}
    
    Tugas:
    1. Klasifikasikan file ke salah satu kategori SIMBG: [umum, tanah, arsitektur, struktur, mep, lapangan].
    2. Tentukan subkategori yang tepat (misal: IMB, Gambar Denah, Perhitungan Struktur, dsb).
    3. Berikan ringkasan teknis isi dokumen (maks 3-5 kalimat).
    4. Berikan skor kelengkapan (0-100).
    5. Tentukan status teknis: [Final, In Review, Needs Revision].

    Kembalikan HANYA JSON:
    {
      "category": "...",
      "subcategory": "...",
      "ai_summary": "...",
      "completeness": 0,
      "status": "..."
    }
  `
};
