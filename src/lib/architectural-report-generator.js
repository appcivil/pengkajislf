/**
 * ARCHITECTURAL REQUIREMENTS REPORT GENERATOR
 * Generate Berita Acara Pemeriksaan Persyaratan Arsitektur
 * Berdasarkan PP Nomor 16 Tahun 2021 (Pasal 218)
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function generateArchitecturalBA(projectId, assessmentData) {
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
  doc.text('Persyaratan Arsitektur', 105, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Nomor: ${assessmentData.ba_number || 'BA/ARS/2024/XXX'}`, 105, 60, { align: 'center' });
  
  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 80;
  
  doc.text('Pada hari ini telah dilakukan pemeriksaan persyaratan arsitektur bangunan', 20, y);
  y += 6;
  doc.text(`Nama Bangunan: ${assessmentData.project_name || '-'}`, 20, y);
  y += 6;
  doc.text(`Lokasi: ${assessmentData.address || '-'}`, 20, y);
  y += 6;
  doc.text(`Pemilik: ${assessmentData.owner || '-'}`, 20, y);
  y += 12;
  
  // A. Penampilan Bangunan
  doc.setFont('helvetica', 'bold');
  doc.text('A. PENAMPILAN BANGUNAN (Pasal 218 ayat 2):', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  const penampilanData = [
    ['1', 'Bentuk Arsitektur', assessmentData.facade_style || '-', assessmentData.golden_ratio_score >= 80 ? 'C' : 'NC'],
    ['2', 'Proporsi Fasad', `Ratio: ${assessmentData.height_width_ratio || '-'}`, assessmentData.golden_ratio_score >= 70 ? 'C' : 'NC'],
    ['3', 'Solid-to-Void', assessmentData.solid_void_ratio || '-', 'C'],
    ['4', 'ETTV', `${assessmentData.ettv_value?.toFixed(1) || 0} W/m²`, assessmentData.ettv_value <= 45 ? 'C' : 'NC']
  ];
  
  doc.autoTable({
    head: [['No', 'Aspek', 'Kondisi', 'Status']],
    body: penampilanData,
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 }
  });
  
  // B. Tata Ruang Dalam
  y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('B. TATA RUANG DALAM (Pasal 218 ayat 4):', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  const tataRuangData = [
    ['1', 'Efisiensi Denah', `${assessmentData.plan_efficiency?.toFixed(1) || 0}%`, assessmentData.plan_efficiency >= 70 ? 'C' : 'NC'],
    ['2', 'Tinggi Ruang', `Min: ${assessmentData.min_ceiling_height || 0}m`, assessmentData.min_ceiling_height >= 2.4 ? 'C' : 'NC'],
    ['3', 'Ruang Utama', `${assessmentData.room_count || 0} ruang`, 'C'],
    ['4', 'Elevasi Lantai Dasar', `+${assessmentData.ground_floor_elevation || 0}m`, assessmentData.ground_floor_elevation >= 0.6 ? 'C' : 'NC']
  ];
  
  doc.autoTable({
    head: [['No', 'Aspek', 'Kondisi', 'Status']],
    body: tataRuangData,
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 }
  });
  
  // C. Keselarasan Lingkungan
  y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('C. KESELARASAN LINGKUNGAN (Pasal 218 ayat 6):', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  const keselarasanData = [
    ['1', 'KDH (RTH)', `${assessmentData.kdh_percentage?.toFixed(1) || 0}%`, assessmentData.kdh_percentage >= 30 ? 'C' : 'NC'],
    ['2', 'Jumlah Pohon', `${assessmentData.tree_count || 0} pohon`, assessmentData.tree_count >= 1 ? 'C' : 'NC'],
    ['3', 'Pagar Depan', `${assessmentData.fence_front_height || 0}m`, assessmentData.fence_front_height <= 1.2 ? 'C' : 'NC']
  ];
  
  doc.autoTable({
    head: [['No', 'Aspek', 'Kondisi', 'Status']],
    body: keselarasanData,
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 }
  });
  
  // Skor Komposit
  y = doc.lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.text('SKOR KOMPOSIT ARSITEKTUR:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  const skorData = [
    ['Penampilan Bangunan (30%)', assessmentData.penampilan_score?.toFixed(1) || 0],
    ['Tata Ruang Dalam (40%)', assessmentData.tata_ruang_score?.toFixed(1) || 0],
    ['Keselarasan Lingkungan (30%)', assessmentData.keselarasan_score?.toFixed(1) || 0],
    ['TOTAL', assessmentData.total_score?.toFixed(1) || 0]
  ];
  
  doc.autoTable({
    head: [['Aspek', 'Skor']],
    body: skorData,
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
    ? `Bangunan memenuhi persyaratan arsitektur dengan skor ${assessmentData.total_score?.toFixed(1) || 0}/100 dan grade ${assessmentData.grade || '-'}.`
    : `Bangunan TIDAK SESUAI dengan persyaratan arsitektur. Diperlukan perbaikan.`;
  
  const conclusionLines = doc.splitTextToSize(conclusion, 170);
  doc.text(conclusionLines, 20, y);
  
  // Rekomendasi
  y += conclusionLines.length * 5 + 10;
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
  doc.text('Pemeriksa Arsitektur,', 150, y);
  y += 25;
  doc.text('(_______________________)', 140, y);
  y += 6;
  doc.text(assessmentData.inspector_name || 'Arsitek/Tenaga Ahli', 145, y);
  
  return doc;
}

export function downloadArchitecturalReport(doc, filename = null) {
  const defaultFilename = `BA_Persyaratan_Arsitektur_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename || defaultFilename);
}

export default {
  generateArchitecturalBA,
  downloadArchitecturalReport
};
