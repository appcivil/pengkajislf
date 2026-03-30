/**
 * EVIDENCE MAPPER
 * Memetakan Kode Item Checklist ke kata kunci pencarian dokumen di Drive Proyek.
 * Digunakan untuk fitur Smart Auto-Suggest & Full-Auto Capture.
 */

export const EVIDENCE_MAP = {
  // --- Aspek Administrasi ---
  'A01': ['IMB', 'PBG', 'Perizinan'],
  'A02': ['SLF', 'Sertifikat Laik Fungsi'],
  'A03': ['As-Built', 'Gambar'],
  'A04': ['DED', 'Rencana Teknis'],
  'A09': ['AMDAL', 'UKL', 'UPL', 'Lingkungan'],
  'ITEM-09A': ['Dinas', 'Instansi', 'Rekomendasi'],

  // --- Aspek Pemanfaatan / Intensitas ---
  'ITEM-01A': ['Fungsi', 'Pemanfaatan'],
  'ITEM-02A': ['KRK', 'KKPR', 'Intensitas', 'Siteplan', 'KDB'],
  'ITEM-02B': ['Basemen', 'Basement'],
  'ITEM-02C': ['Luas', 'Lantai'],
  'ITEM-02D': ['Jumlah Lantai'],
  'ITEM-02F': ['Ketinggian', 'Elevasi'],
  'ITEM-02G': ['KDH', 'Hijau', 'Resapan'],
  'ITEM-02H': ['GSB', 'Sempadan', 'Batas'],
  'ITEM-02I': ['Batas Persil', 'Jarak Bebas'],
  'ITEM-02J': ['Antar Bangunan'],

  // --- Aspek Arsitektur ---
  'ITEM-03A': ['Tampak', 'Arsitektur', 'Material'],
  'ITEM-03B': ['Tata Ruang', 'Interior'],
  'ITEM-04A': ['Lingkungan', 'SPPL'],

  // --- Aspek Struktur ---
  'ITEM-05A1': ['Sondir', 'Penyelidikan Tanah', 'Fondasi'],
  'ITEM-05A2': ['Kolom', 'Struktur'],
  'ITEM-05A3': ['Balok', 'Struktur'],
  'ITEM-05A4': ['Pelat', 'Slab'],
  'ITEM-05A5': ['Atap', 'Truss'],
  'ITEM-05A7': ['Basemen', 'Dinding Penahan'],

  // --- Aspek MEP ---
  'ITEM-05B': ['Kebakaran', 'Fire', 'Hydrant'],
  'ITEM-05C': ['Petir', 'LPT', 'Grounded'],
  'ITEM-05D': ['Listrik', 'PLN', 'SLO'],
  'ITEM-05E': ['Evakuasi', 'Tangga Darurat'],
  'ITEM-06C1': ['Air Bersih', 'PDAM'],
  'ITEM-06C2': ['Air Kotor', 'STP', 'Septic'],
  'ITEM-06C4': ['Drainase', 'Hujan', 'Peil Banjir']
};

/**
 * Mencari file yang relevan di list proyek_files berdasarkan kode checklist
 */
export function findRelevantDocumentRefs(kode, projectFiles = []) {
  const keywords = EVIDENCE_MAP[kode] || [];
  if (keywords.length === 0) return [];

  // Filter file yang mengandung kata kunci di namanya atau subkategorinya
  return projectFiles.filter(f => {
    const fileName = (f.name || '').toLowerCase();
    const subCat = (f.subcategory || '').toLowerCase();
    
    return keywords.some(k => {
      const key = k.toLowerCase();
      return fileName.includes(key) || subCat.includes(key);
    });
  });
}
