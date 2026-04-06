/**
 * REPORT GENERATOR
 * PDF and Excel export for SLF Technical Reports
 * Using jsPDF and SheetJS
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Generate SLF Technical Report PDF
 */
export async function generateSLFReport(proyek, checklistData, analysisData, options = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header function
  const addHeader = (pageNum) => {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('LAPORAN KAJIAN TEKNIS SLF', pageWidth / 2, 10, { align: 'center' });
    doc.text(`Halaman ${pageNum}`, pageWidth - 20, 10);
    doc.setDrawColor(200);
    doc.line(20, 15, pageWidth - 20, 15);
  };
  
  // Footer function
  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Dokumen ini dihasilkan oleh Smart AI Pengkaji SLF v2.1`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };
  
  let pageNum = 1;
  
  // Cover Page
  doc.setFontSize(24);
  doc.setTextColor(0);
  doc.text('LAPORAN', pageWidth / 2, 60, { align: 'center' });
  doc.text('KAJIAN TEKNIS', pageWidth / 2, 75, { align: 'center' });
  doc.text('SERTIFIKAT LAIK FUNGSI', pageWidth / 2, 90, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(proyek.nama_bangunan || 'Nama Bangunan', pageWidth / 2, 120, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Lokasi: ${proyek.lokasi || '-'}`, pageWidth / 2, 140, { align: 'center' });
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 150, { align: 'center' });
  
  addFooter();
  
  // Page A - Data Bangunan
  doc.addPage();
  pageNum++;
  addHeader(pageNum);
  
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('A. DATA BANGUNAN', 20, 30);
  
  doc.setFontSize(11);
  const buildingData = [
    ['Nama Bangunan', proyek.nama_bangunan || '-'],
    ['Alamat/Lokasi', proyek.lokasi || '-'],
    ['Koordinat', `${proyek.latitude || '-'}, ${proyek.longitude || '-'}`],
    ['Fungsi Bangunan', proyek.fungsi_bangunan || '-'],
    ['Jumlah Lantai', `${proyek.jumlah_lantai || '-'} lantai`],
    ['Luas Bangunan', `${proyek.luas_bangunan || '-'} m²`],
    ['Tinggi Bangunan', `${proyek.tinggi_bangunan || '-'} m`],
    ['Tahun Pembangunan', proyek.tahun_bangun || '-'],
    ['Pemilik', proyek.nama_pemilik || '-'],
    ['Status Kepemilikan', proyek.status_kepemilikan || '-']
  ];
  
  doc.autoTable({
    startY: 40,
    head: [['Parameter', 'Nilai']],
    body: buildingData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10 }
  });
  
  addFooter();
  
  // Page B - Metodologi
  doc.addPage();
  pageNum++;
  addHeader(pageNum);
  
  doc.setFontSize(16);
  doc.text('B. METODOLOGI EVALUASI', 20, 30);
  
  doc.setFontSize(11);
  const methodology = [
    'Evaluasi dilakukan berdasarkan standar ASCE 41-17 dan SNI 9274:2024.',
    '',
    '1. Tier 1 - Screening Evaluation',
    '   Form evaluasi screening berdasarkan Tabel 17-1 & 17-2 ASCE 41-17',
    '   untuk menentukan apakah bangunan memerlukan evaluasi lebih lanjut.',
    '',
    '2. Tier 2 - Deficiency-Based Evaluation',
    '   Evaluasi kuantitatif dengan perhitungan DCR (Demand Capacity Ratio)',
    '   untuk elemen-elemen yang tidak lulus Tier 1.',
    '',
    '3. Tier 3 - Systematic Evaluation',
    '   Analisis pushover untuk menentukan Performance Point dan',
    '   mekanisme keruntuhan struktur.',
    '',
    '4. Pengujian Material (NDT/MDT)',
    '   Pengujian Schmidt Hammer, UPV, Core Drill untuk menentukan',
    '   kondisi aktual kekuatan material.',
    '',
    '5. Analisis Seismik',
    '   Perhitungan parameter gempa berdasarkan SNI 1726:2019.'
  ];
  
  let y = 45;
  methodology.forEach(line => {
    doc.text(line, 20, y);
    y += 7;
  });
  
  addFooter();
  
  // Page C - Hasil Uji Material
  if (analysisData?.ndtTests?.length > 0) {
    doc.addPage();
    pageNum++;
    addHeader(pageNum);
    
    doc.setFontSize(16);
    doc.text('C. HASIL UJI MATERIAL', 20, 30);
    
    analysisData.ndtTests.forEach((test, idx) => {
      doc.setFontSize(12);
      doc.text(`${idx + 1}. ${test.type}`, 20, 50 + (idx * 60));
      
      const testData = [
        ['Parameter', 'Nilai'],
        ['Lokasi', test.location || '-'],
        ['fc\' Estimate', `${test.fc || '-'} MPa`],
        ['Kualitas', test.quality || '-'],
        ['Keterangan', test.notes || '-']
      ];
      
      doc.autoTable({
        startY: 55 + (idx * 60),
        body: testData,
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
        styles: { fontSize: 10 }
      });
    });
    
    addFooter();
  }
  
  // Page D - Analisis Struktur
  doc.addPage();
  pageNum++;
  addHeader(pageNum);
  
  doc.setFontSize(16);
  doc.text('D. ANALISIS STRUKTUR', 20, 30);
  
  if (analysisData?.seismic) {
    doc.setFontSize(12);
    doc.text('1. Analisis Seismik', 20, 50);
    
    const seismicData = [
      ['Parameter', 'Nilai'],
      ['Ss', analysisData.seismic.Ss || '-'],
      ['S1', analysisData.seismic.S1 || '-'],
      ['Site Class', analysisData.seismic.siteClass || '-'],
      ['Fa', analysisData.seismic.Fa || '-'],
      ['Fv', analysisData.seismic.Fv || '-'],
      ['SDS', analysisData.seismic.SDS || '-'],
      ['SD1', analysisData.seismic.SD1 || '-'],
      ['Seismicity Level', analysisData.seismic.seismicity || '-']
    ];
    
    doc.autoTable({
      startY: 55,
      head: [['Parameter', 'Nilai']],
      body: seismicData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    });
  }
  
  addFooter();
  
  // Page E - Kesimpulan
  doc.addPage();
  pageNum++;
  addHeader(pageNum);
  
  doc.setFontSize(16);
  doc.text('E. KESIMPULAN DAN REKOMENDASI', 20, 30);
  
  doc.setFontSize(11);
  
  // Summary box
  const status = analysisData?.statusSLF || 'DALAM_PENGKAJIAN';
  const statusLabels = {
    'LAIK_FUNGSI': { text: 'LAIK FUNGSI', color: [34, 197, 94] },
    'LAIK_FUNGSI_BERSYARAT': { text: 'LAIK FUNGSI BERSYARAT', color: [234, 179, 8] },
    'TIDAK_LAIK_FUNGSI': { text: 'TIDAK LAIK FUNGSI', color: [239, 68, 68] },
    'DALAM_PENGKAJIAN': { text: 'DALAM PENGKAJIAN', color: [59, 130, 246] }
  };
  
  const statusInfo = statusLabels[status] || statusLabels['DALAM_PENGKAJIAN'];
  
  doc.setFillColor(...statusInfo.color);
  doc.roundedRect(20, 45, pageWidth - 40, 30, 5, 5, 'F');
  doc.setTextColor(255);
  doc.setFontSize(14);
  doc.text(`STATUS: ${statusInfo.text}`, pageWidth / 2, 63, { align: 'center' });
  
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text('Rekomendasi:', 20, 95);
  
  const recommendations = analysisData?.recommendations || ['Evaluasi sedang berlangsung.'];
  y = 105;
  recommendations.forEach((rec, i) => {
    doc.text(`${i + 1}. ${rec}`, 25, y);
    y += 10;
  });
  
  addFooter();
  
  // Save
  return doc.save(`SLF_Report_${proyek.nama_bangunan || 'Building'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export test data to Excel
 */
export function exportTestDataToExcel(proyek, testData) {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: Project Info
  const projectSheet = XLSX.utils.aoa_to_sheet([
    ['DATA PROYEK'],
    ['Nama Bangunan', proyek.nama_bangunan],
    ['Lokasi', proyek.lokasi],
    ['Fungsi', proyek.fungsi_bangunan],
    ['Jumlah Lantai', proyek.jumlah_lantai],
    ['Luas (m²)', proyek.luas_bangunan],
    [''],
    ['HASIL PENGUJIAN']
  ]);
  
  // Sheet 2: NDT Results
  const ndtHeaders = ['Tipe Pengujian', 'Lokasi', 'Parameter', 'Nilai', 'Satuan', 'Kualitas', 'Keterangan'];
  const ndtRows = [];
  
  if (testData.schmidtHammer?.length > 0) {
    testData.schmidtHammer.forEach(test => {
      ndtRows.push([
        'Schmidt Hammer',
        test.location,
        'fc\'',
        test.fc,
        'MPa',
        test.quality,
        test.notes
      ]);
    });
  }
  
  if (testData.upv?.length > 0) {
    testData.upv.forEach(test => {
      ndtRows.push([
        'UPV',
        test.location,
        'Pulse Velocity',
        test.velocity,
        'km/s',
        test.classification,
        test.notes
      ]);
    });
  }
  
  if (testData.coreDrill?.length > 0) {
    testData.coreDrill.forEach(test => {
      ndtRows.push([
        'Core Drill',
        test.location,
        'fc\' Cylinder',
        test.fcCylinder,
        'MPa',
        test.class,
        test.notes
      ]);
    });
  }
  
  const ndtSheet = XLSX.utils.aoa_to_sheet([ndtHeaders, ...ndtRows]);
  
  // Sheet 3: Tier Checklist Results
  const tierHeaders = ['Kode', 'Item', 'Status', 'Catatan', 'Perlu Tier 2/3'];
  const tierRows = [];
  
  if (testData.tierResults) {
    Object.entries(testData.tierResults).forEach(([kode, val]) => {
      tierRows.push([
        kode,
        val.nama || '-',
        val.status || '-',
        val.catatan || '-',
        val.needsHigherTier ? 'Ya' : 'Tidak'
      ]);
    });
  }
  
  const tierSheet = XLSX.utils.aoa_to_sheet([tierHeaders, ...tierRows]);
  
  // Add sheets
  XLSX.utils.book_append_sheet(workbook, projectSheet, 'Proyek');
  XLSX.utils.book_append_sheet(workbook, ndtSheet, 'Hasil NDT');
  XLSX.utils.book_append_sheet(workbook, tierSheet, 'Tier Checklist');
  
  // Save
  XLSX.writeFile(workbook, `SLF_Data_${proyek.nama_bangunan || 'Building'}.xlsx`);
}

/**
 * Generate simple report summary
 */
export function generateReportSummary(proyek, analysisData) {
  const statusColors = {
    'LAIK_FUNGSI': '#22c55e',
    'LAIK_FUNGSI_BERSYARAT': '#eab308',
    'TIDAK_LAIK_FUNGSI': '#ef4444',
    'DALAM_PENGKAJIAN': '#3b82f6'
  };
  
  const statusLabels = {
    'LAIK_FUNGSI': 'Laik Fungsi',
    'LAIK_FUNGSI_BERSYARAT': 'Laik Fungsi Bersyarat',
    'TIDAK_LAIK_FUNGSI': 'Tidak Laik Fungsi',
    'DALAM_PENGKAJIAN': 'Dalam Pengkajian'
  };
  
  const status = analysisData?.statusSLF || 'DALAM_PENGKAJIAN';
  
  return `
    <div style="padding: 24px; background: hsla(220, 20%, 100%, 0.05); border-radius: 12px; border: 1px solid hsla(220, 20%, 100%, 0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h3 style="margin: 0; color: white; font-size: 1.2rem;">${proyek.nama_bangunan || 'Nama Bangunan'}</h3>
          <p style="margin: 4px 0 0; color: var(--text-tertiary); font-size: 0.9rem;">${proyek.lokasi || '-'}</p>
        </div>
        <div style="padding: 12px 24px; background: ${statusColors[status]}22; border: 2px solid ${statusColors[status]}; border-radius: 8px;">
          <span style="color: ${statusColors[status]}; font-weight: 700; font-size: 1rem;">${statusLabels[status]}</span>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
        <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Tier 1 Progress</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: white;">${analysisData?.tier1Progress || 0}%</div>
        </div>
        <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">DCR Checks</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: white;">${analysisData?.dcrCount || 0}</div>
        </div>
        <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">NDT Tests</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: white;">${analysisData?.ndtCount || 0}</div>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px;">
        <button onclick="window._exportPDFReport()" class="btn btn-primary" style="flex: 1;">
          <i class="fas fa-file-pdf" style="margin-right: 8px;"></i>Export PDF
        </button>
        <button onclick="window._exportExcelReport()" class="btn btn-secondary" style="flex: 1;">
          <i class="fas fa-file-excel" style="margin-right: 8px;"></i>Export Excel
        </button>
      </div>
    </div>
  `;
}
