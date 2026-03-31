import { supabase } from './supabase.js';

/**
 * NUMBERING SERVICE
 * Logika untuk menghasilkan nomor surat otomatis berdasarkan format.
 */

/**
 * Menghasilkan nomor surat berdasarkan format dan nomor urut.
 * Placeholders: [SEQ], [MONTH], [ROMAN_MONTH], [YEAR]
 */
export function formatDocumentNumber(format, seq, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const romanMonth = getRomanMonth(month);
  const paddedSeq = String(seq).padStart(3, '0');

  return format
    .replace(/\[SEQ\]/g, paddedSeq)
    .replace(/\[MONTH\]/g, String(month).padStart(2, '0'))
    .replace(/\[ROMAN_MONTH\]/g, romanMonth)
    .replace(/\[YEAR\]/g, String(year));
}

/**
 * Mendapatkan nomor urut berikutnya dengan menghitung jumlah proyek 
 * yang sudah memiliki nomor surat.
 */
export async function getNextSequence() {
  try {
    // Menghitung proyek yang sudah memiliki metadata.nomor_surat
    const { count, error } = await supabase
      .from('proyek')
      .select('*', { count: 'exact', head: true })
      .not('metadata->>nomor_surat', 'is', null);

    if (error) throw error;
    return (count || 0) + 1;
  } catch (err) {
    console.error('[NumberingService] Failed to get sequence:', err);
    return 1; // Fallback ke 1
  }
}

function getRomanMonth(m) {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return roman[m - 1] || String(m);
}
