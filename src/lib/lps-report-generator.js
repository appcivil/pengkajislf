/**
 * LPS REPORT GENERATOR
 * Generate laporan kajian Sistem Proteksi Petir (LPS)
 * Berdasarkan SNI 03-7015-2014
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../lib/supabase.js';

/**
 * Generate laporan LPS lengkap
 * @param {string} projectId - ID proyek
 * @param {Object} summary - Summary data dari fetchLPSSummary
 */
export async function generateLPSReport(projectId, summary = {}) {
  try {
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('proyek')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectError) throw projectError;
    
    // Initialize PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFontSize(16);
    doc.text('LAPORAN KAJIAN SISTEM PROTEKSI PETIR (LPS)', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Berdasarkan SNI 03-7015-2014', 105, 28, { align: 'center' });
    
    // Project Info
    doc.setFontSize(10);
    doc.text(`Nama Bangunan: ${project.nama_bangunan || '-'}`, 20, 45);
    doc.text(`Lokasi: ${project.alamat || '-'}, ${project.kota || '-'}`, 20, 52);
    doc.text(`Nomor PBG: ${project.nomor_pbg || '-'}`, 20, 59);
    doc.text(`Tanggal Kajian: ${new Date().toLocaleDateString('id-ID')}`, 20, 66);
    
    // Risk Assessment Section
    if (summary.latestRisk) {
      doc.setFontSize(12);
      doc.text('A. ANALISIS RISIKO & KEWAJIBAN LPS', 20, 80);
      
      doc.setFontSize(10);
      doc.text(`Kerapatan Petir (Ng): ${summary.latestRisk.ng_density || '-'} sambaran/km²/th`, 20, 90);
      doc.text(`Area Koleksi (Ae): ${summary.latestRisk.collection_area || '-'} m²`, 20, 97);
      doc.text(`Nilai Risiko (R): ${summary.latestRisk.risk_calculated || '-'}`, 20, 104);
      doc.text(`Toleransi Risiko (RT): 10⁻⁵`, 20, 111);
      doc.text(`Status: ${summary.latestRisk.status === 'WAJIB' ? 'WAJIB LPS' : 'TIDAK WAJIB LPS'}`, 20, 118);
      doc.text(`LPL Rekomendasi: ${summary.latestRisk.lpl_level?.replace('LPL_', 'Level ') || '-'}`, 20, 125);
    }
    
    // Components Summary
    if (summary.totalComponents > 0) {
      doc.setFontSize(12);
      doc.text('B. EVALUASI SISTEM EXISTING', 20, 140);
      
      doc.setFontSize(10);
      doc.text(`Jumlah Air Terminal: ${summary.totalAirTerminals} unit`, 20, 150);
      doc.text(`Jumlah Down Conductor: ${summary.totalDownConductors} unit`, 20, 157);
      doc.text(`Jumlah Titik Grounding: ${summary.totalGroundingPoints} unit`, 20, 164);
    }
    
    // Grounding Tests Summary
    if (summary.totalGroundingTests > 0) {
      doc.setFontSize(12);
      doc.text('C. HASIL PENGUJIAN GROUNDING', 20, 180);
      
      doc.setFontSize(10);
      doc.text(`Total Pengujian: ${summary.totalGroundingTests}`, 20, 190);
      doc.text(`Lulus: ${summary.passedGroundingTests}`, 20, 197);
      doc.text(`Gagal: ${summary.failedGroundingTests}`, 20, 204);
    }
    
    // Kesimpulan
    doc.setFontSize(12);
    doc.text('D. KESIMPULAN & REKOMENDASI', 20, 230);
    
    doc.setFontSize(10);
    const conclusion = summary.isRequired 
      ? 'Bangunan WAJIB memiliki Sistem Proteksi Petir (LPS) sesuai SNI 03-7015-2014.'
      : 'Berdasarkan perhitungan risiko, bangunan tidak wajib memiliki LPS namun disarankan untuk tetap dipasang proteksi petir.';
    
    doc.text(conclusion, 20, 240, { maxWidth: 170 });
    
    // Save PDF
    const filename = `LPS_Report_${project.nama_bangunan?.replace(/\s+/g, '_') || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating LPS report:', error);
    throw error;
  }
}

/**
 * Generate surat pembebasan wajib LPS
 * @param {string} projectId - ID proyek
 * @param {Object} riskData - Data risk assessment
 */
export async function generateExemptionLetter(projectId, riskData) {
  try {
    const { data: project, error } = await supabase
      .from('proyek')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) throw error;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Letter header
    doc.setFontSize(14);
    doc.text('SURAT PERNYATAAN PEMBEBASAN WAJIB LPS', 105, 30, { align: 'center' });
    
    doc.setFontSize(11);
    const nomorSurat = `LPS/EXM/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    doc.text(`Nomor: ${nomorSurat}`, 105, 40, { align: 'center' });
    
    // Content
    doc.setFontSize(11);
    let y = 60;
    const content = [
      `Yang bertanda tangan di bawah ini, Tenaga Ahli Pengkaji, menerangkan bahwa:`,
      ``,
      `Nama Bangunan    : ${project.nama_bangunan || '-'}`,
      `Alamat          : ${project.alamat || '-'}`,
      `Nomor PBG       : ${project.nomor_pbg || '-'}`,
      ``,
      `Telah dilakukan penilaian risiko petir berdasarkan SNI 03-7015-2014 Pasal 6,`,
      `dengan hasil perhitungan:`,
      ``,
      `  - Kerapatan Petir (Ng)      : ${riskData.ng_density || '-'} sambaran/km²/th`,
      `  - Area Koleksi (Ae)          : ${riskData.collection_area || '-'} m²`,
      `  - Nilai Risiko (R)          : ${riskData.risk_calculated?.toExponential(2) || '-'}`,
      `  - Toleransi Risiko (RT)     : 10⁻⁵`,
      ``,
      `Karena nilai R ≤ RT (10⁻⁵), maka bangunan TIDAK WAJIB memiliki Sistem`,
      `Proteksi Petir (LPS) sesuai ketentuan SNI 03-7015-2014.`,
      ``,
      `Surat pernyataan ini dibuat dengan sebenarnya untuk digunakan sebagaimana mestinya.`
    ];
    
    content.forEach(line => {
      doc.text(line, 20, y);
      y += 6;
    });
    
    // Signature area
    y += 20;
    doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, y);
    y += 8;
    doc.text('Tenaga Ahli Pengkaji,', 130, y);
    y += 30;
    doc.text('(____________________)', 130, y);
    
    // Save
    const filename = `Surat_Pembebasan_LPS_${project.nama_bangunan?.replace(/\s+/g, '_') || 'Unknown'}.pdf`;
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating exemption letter:', error);
    throw error;
  }
}

export default {
  generateLPSReport,
  generateExemptionLetter
};
