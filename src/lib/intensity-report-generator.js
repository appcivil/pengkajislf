/**
 * BUILDING INTENSITY REPORT GENERATOR
 * Generate Berita Acara Pemeriksaan Kesesuaian Fungsi & Intensitas
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function generateBeritaAcara(projectId, assessmentData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // Header
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BERITA ACARA PEMERIKSAAN', 105, 18, { align: 'center' });
  
  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Kesesuaian Fungsi dan Intensitas Bangunan', 105, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Nomor: ${assessmentData.ba_number || 'BA/KF/2024/XXX'}`, 105, 60, { align: 'center' });
  
  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 80;
  
  doc.text('Pada hari ini telah dilakukan pemeriksaan kesesuaian fungsi dan intensitas bangunan', 20, y);
  y += 6;
  doc.text(`Nama Bangunan: ${assessmentData.project_name || '-'}`, 20, y);
  y += 6;
  doc.text(`Lokasi: ${assessmentData.address || '-'}`, 20, y);
  y += 6;
  doc.text(`Pemilik: ${assessmentData.owner || '-'}`, 20, y);
  y += 12;
  
  // Hasil Pemeriksaan table
  doc.setFont('helvetica', 'bold');
  doc.text('HASIL PEMERIKSAAN:', 20, y);
  y += 8;
  
  const tableData = [
    ['1', 'Fungsi Bangunan', assessmentData.planned_function || '-', assessmentData.zone_name || '-', assessmentData.function_compliance || '-'],
    ['2', 'KDB', `${assessmentData.kdb_value?.toFixed(2) || 0}%`, `Max ${assessmentData.kdb_limit || 60}%`, assessmentData.kdb_status || '-'],
    ['3', 'KLB', `${assessmentData.klb_value?.toFixed(2) || 0}`, `Max ${assessmentData.klb_limit || 1.2}`, assessmentData.klb_status || '-'],
    ['4', 'KDH', `${assessmentData.kdh_value?.toFixed(2) || 0}%`, `Min ${assessmentData.kdh_limit || 30}%`, assessmentData.kdh_status || '-'],
  ];
  
  doc.autoTable({
    head: [['No', 'Parameter', 'Kondisi', 'Ketentuan', 'Status']],
    body: tableData,
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 }
  });
  
  // Kesimpulan
  y = doc.lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.text('KESIMPULAN:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  const conclusion = assessmentData.overall_status === 'SESUAI' 
    ? 'Bangunan sesuai dengan persyaratan fungsi dan intensitas.'
    : 'Bangunan TIDAK SESUAI dengan persyaratan fungsi dan/atau intensitas.';
  
  doc.text(conclusion, 20, y);
  
  // Rekomendasi
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('REKOMENDASI:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  if (assessmentData.recommendations && assessmentData.recommendations.length > 0) {
    assessmentData.recommendations.forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec}`, 25, y);
      y += 6;
    });
  }
  
  // Signature
  y += 20;
  doc.text('Pemeriksa,', 150, y);
  y += 25;
  doc.text('(_______________________)', 140, y);
  y += 6;
  doc.text(assessmentData.inspector_name || 'Nama Inspector', 145, y);
  
  return doc;
}

export function downloadBAReport(doc, filename = null) {
  const defaultFilename = `BA_Kesesuaian_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename || defaultFilename);
}

export default {
  generateBeritaAcara,
  downloadBAReport
};
