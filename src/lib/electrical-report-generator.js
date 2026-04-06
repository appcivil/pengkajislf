// ============================================================
// ELECTRICAL SYSTEM INSPECTION - TECHNICAL REPORT GENERATOR
// PDF, Excel, and DOCX Report Generation
// Laporan Pemeriksaan Sistem Kelistrikan SLF
// ============================================================

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ============================================================
// 1. REPORT DATA FORMATTER
// ============================================================

/**
 * Format report data from analysis results
 * @param {Object} projectData - Project information
 * @param {Array} panels - Panel data with measurements
 * @param {Object} analysis - Analysis results
 * @returns {Object} Formatted report data
 */
export function formatReportData(projectData, panels, analysis) {
  return {
    project: {
      name: projectData.name || 'Proyek SLF',
      location: projectData.location || '-',
      date: new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      inspector: projectData.inspector || '-',
      consultant: projectData.consultant || 'Konsultan SLF'
    },
    panels: panels.map((panel, idx) => ({
      no: idx + 1,
      name: panel.name,
      location: panel.location,
      type: panel.type,
      mcbRating: panel.mcbRating,
      busbarRating: panel.busbarRating,
      cableSize: panel.cableSize,
      measurements: panel.measurements || [],
      latestMeasurement: panel.measurements?.[panel.measurements.length - 1] || null,
      thermalImages: panel.thermalImages || [],
      loading: calculatePanelLoading(panel),
      thermalStatus: getPanelThermalStatus(panel)
    })),
    summary: {
      totalPanels: panels.length,
      safePanels: panels.filter(p => calculatePanelLoading(p) < 80).length,
      warningPanels: panels.filter(p => {
        const loading = calculatePanelLoading(p);
        return loading >= 80 && loading <= 100;
      }).length,
      overloadPanels: panels.filter(p => calculatePanelLoading(p) > 100).length,
      hotspotCount: panels.reduce((sum, p) => sum + (p.thermalImages?.length || 0), 0)
    },
    compliance: analysis.compliance || null,
    recommendations: analysis.recommendations || []
  };
}

function calculatePanelLoading(panel) {
  if (!panel.measurements || panel.measurements.length === 0) return 0;
  const latest = panel.measurements[panel.measurements.length - 1];
  if (!latest.current || !panel.mcbRating) return 0;
  return (latest.current / panel.mcbRating) * 100;
}

function getPanelThermalStatus(panel) {
  if (!panel.thermalImages || panel.thermalImages.length === 0) return 'No Data';
  const maxTemp = Math.max(...panel.thermalImages.map(t => t.tempMax || 0));
  if (maxTemp > 90) return 'DARURAT';
  if (maxTemp > 70) return 'KRITIS';
  if (maxTemp > 45) return 'WASPADA';
  return 'NORMAL';
}

// ============================================================
// 2. EXCEL REPORT GENERATOR
// ============================================================

/**
 * Generate comprehensive Excel report
 * @param {Object} reportData - Formatted report data
 */
export function generateExcelReport(reportData) {
  const wb = XLSX.utils.book_new();
  
  // 1. Cover Sheet
  const coverData = [
    ['LAPORAN PEMERIKSAAN SISTEM KELISTRIKAN'],
    ['Sertifikat Laik Fungsi (SLF)'],
    [],
    ['Informasi Proyek'],
    ['Nama Proyek', reportData.project.name],
    ['Lokasi', reportData.project.location],
    ['Tanggal Pemeriksaan', reportData.project.date],
    ['Konsultan', reportData.project.consultant],
    ['Inspektur', reportData.project.inspector],
    [],
    ['Ringkasan'],
    ['Total Panel', reportData.summary.totalPanels],
    ['Panel Aman', reportData.summary.safePanels],
    ['Panel Warning', reportData.summary.warningPanels],
    ['Panel Overload', reportData.summary.overloadPanels],
    ['Hotspot Terdeteksi', reportData.summary.hotspotCount]
  ];
  const coverWs = XLSX.utils.aoa_to_sheet(coverData);
  XLSX.utils.book_append_sheet(wb, coverWs, 'Cover');
  
  // 2. Panel Summary Sheet
  const panelSummary = reportData.panels.map(p => ({
    'No': p.no,
    'Nama Panel': p.name,
    'Lokasi': p.location,
    'Tipe': p.type,
    'MCB Rating (A)': p.mcbRating,
    'Busbar Rating (A)': p.busbarRating,
    'Kabel Size': p.cableSize,
    'Loading %': p.loading.toFixed(2),
    'Status Thermal': p.thermalStatus,
    'Jumlah Pengukuran': p.measurements.length
  }));
  const panelWs = XLSX.utils.json_to_sheet(panelSummary);
  XLSX.utils.book_append_sheet(wb, panelWs, 'Daftar Panel');
  
  // 3. Measurement Details Sheet
  const measurements = [];
  reportData.panels.forEach(panel => {
    panel.measurements.forEach((m, idx) => {
      measurements.push({
        'Panel': panel.name,
        'No': idx + 1,
        'Waktu': new Date(m.timestamp).toLocaleString('id-ID'),
        'Lokasi': m.location || panel.location,
        'Fasa': m.phase || '3P',
        'Tegangan (V)': m.voltage?.toFixed(2) || '-',
        'Arus (A)': m.current?.toFixed(2) || '-',
        'Daya Aktif (kW)': m.power ? (m.power / 1000).toFixed(2) : '-',
        'Power Factor': m.powerFactor?.toFixed(2) || '-',
        'Suhu (°C)': m.temperature?.toFixed(1) || '-',
        'THD (%)': m.thd?.toFixed(2) || '-',
        'Loading %': m.loadingPercentage?.toFixed(2) || '-',
        'Status': m.status || '-'
      });
    });
  });
  
  if (measurements.length > 0) {
    const measurementWs = XLSX.utils.json_to_sheet(measurements);
    XLSX.utils.book_append_sheet(wb, measurementWs, 'Data Pengukuran');
  }
  
  // 4. Thermal Analysis Sheet
  const thermalData = [];
  reportData.panels.forEach(panel => {
    panel.thermalImages.forEach((t, idx) => {
      thermalData.push({
        'Panel': panel.name,
        'No': idx + 1,
        'Komponen': t.component || '-',
        'Suhu Max (°C)': t.tempMax?.toFixed(1) || '-',
        'Suhu Min (°C)': t.tempMin?.toFixed(1) || '-',
        'Suhu Rata-rata (°C)': t.tempAvg?.toFixed(1) || '-',
        'Status': t.status || '-',
        'Catatan': t.notes || '-'
      });
    });
  });
  
  if (thermalData.length > 0) {
    const thermalWs = XLSX.utils.json_to_sheet(thermalData);
    XLSX.utils.book_append_sheet(wb, thermalWs, 'Analisis Thermal');
  }
  
  // 5. Recommendations Sheet
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    const recData = reportData.recommendations.map((rec, idx) => ({
      'No': idx + 1,
      'Prioritas': rec.priority,
      'Kategori': rec.category,
      'Masalah': rec.issue,
      'Tindakan': rec.actions?.join('; ') || rec.action || '-'
    }));
    const recWs = XLSX.utils.json_to_sheet(recData);
    XLSX.utils.book_append_sheet(wb, recWs, 'Rekomendasi');
  }
  
  // 6. Compliance Check Sheet
  if (reportData.compliance && reportData.compliance.checks) {
    const complianceData = reportData.compliance.checks.map((check, idx) => ({
      'No': idx + 1,
      'Item': check.item,
      'Status': check.status,
      'Keterangan': check.message,
      'Klausul': check.clause || '-'
    }));
    const complianceWs = XLSX.utils.json_to_sheet(complianceData);
    XLSX.utils.book_append_sheet(wb, complianceWs, 'Compliance Check');
  }
  
  // Generate file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `SLF_Electrical_Report_${reportData.project.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ============================================================
// 3. PDF REPORT GENERATOR
// ============================================================

/**
 * Generate PDF report using jsPDF
 * @param {Object} reportData - Formatted report data
 */
export function generatePDFReport(reportData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Helper functions
  const addHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('LAPORAN PEMERIKSAAN SISTEM KELISTRIKAN', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Sertifikat Laik Fungsi (SLF)', pageWidth / 2, 20, { align: 'center' });
  };
  
  const addFooter = (pageNum) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Halaman ${pageNum}`, pageWidth - 20, pageHeight - 6);
    doc.text(`Dokumen: SLF-ELEC-${new Date().getFullYear()}-${String(pageNum).padStart(3, '0')}`, 10, pageHeight - 6);
  };
  
  let currentY = 35;
  let pageNum = 1;
  
  // Cover Page
  addHeader();
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('LAPORAN TEKNIS', pageWidth / 2, 50, { align: 'center' });
  doc.setFontSize(14);
  doc.text('PEMERIKSAAN SISTEM KELISTRIKAN', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text('A. INFORMASI PROYEK', 15, 80);
  doc.setFontSize(10);
  doc.text(`Nama Proyek: ${reportData.project.name}`, 20, 90);
  doc.text(`Lokasi: ${reportData.project.location}`, 20, 98);
  doc.text(`Tanggal Pemeriksaan: ${reportData.project.date}`, 20, 106);
  doc.text(`Konsultan: ${reportData.project.consultant}`, 20, 114);
  doc.text(`Inspektur: ${reportData.project.inspector}`, 20, 122);
  
  doc.setFontSize(11);
  doc.text('B. RINGKASAN HASIL', 15, 140);
  doc.setFontSize(10);
  doc.text(`Total Panel Terinspeksi: ${reportData.summary.totalPanels}`, 20, 150);
  doc.text(`Panel Aman (<80%): ${reportData.summary.safePanels}`, 20, 158);
  doc.text(`Panel Warning (80-100%): ${reportData.summary.warningPanels}`, 20, 166);
  doc.text(`Panel Overload (>100%): ${reportData.summary.overloadPanels}`, 20, 174);
  doc.text(`Hotspot Termal Terdeteksi: ${reportData.summary.hotspotCount}`, 20, 182);
  
  addFooter(pageNum);
  
  // Panel List Page
  doc.addPage();
  pageNum++;
  currentY = 35;
  addHeader();
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('C. DAFTAR PANEL LISTRIK', 15, currentY);
  currentY += 10;
  
  // Panel table
  const panelHeaders = ['No', 'Nama Panel', 'Lokasi', 'MCB (A)', 'Loading %', 'Status'];
  const panelData = reportData.panels.map(p => [
    p.no,
    p.name,
    p.location,
    p.mcbRating,
    p.loading.toFixed(1),
    p.loading > 100 ? 'OVERLOAD' : p.loading > 80 ? 'WARNING' : 'AMAN'
  ]);
  
  doc.autoTable({
    head: [panelHeaders],
    body: panelData,
    startY: currentY,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        addHeader();
      }
      addFooter(data.pageNumber);
    }
  });
  
  // Measurement Details
  if (reportData.panels.some(p => p.measurements.length > 0)) {
    doc.addPage();
    pageNum++;
    addHeader();
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('D. DATA PENGUKURAN', 15, 35);
    
    let tableY = 45;
    reportData.panels.forEach((panel, pidx) => {
      if (panel.measurements.length === 0) return;
      
      if (tableY > 250) {
        doc.addPage();
        pageNum++;
        addHeader();
        tableY = 45;
      }
      
      doc.setFontSize(10);
      doc.text(`Panel: ${panel.name}`, 15, tableY);
      tableY += 5;
      
      const measurementHeaders = ['Waktu', 'Lokasi', 'V(V)', 'I(A)', 'kW', 'cos φ', 'Suhu(°C)', 'Status'];
      const measurementData = panel.measurements.map(m => [
        new Date(m.timestamp).toLocaleDateString('id-ID'),
        m.location || panel.location,
        m.voltage?.toFixed(1) || '-',
        m.current?.toFixed(2) || '-',
        m.power ? (m.power / 1000).toFixed(2) : '-',
        m.powerFactor?.toFixed(2) || '-',
        m.temperature?.toFixed(1) || '-',
        m.status || '-'
      ]);
      
      doc.autoTable({
        head: [measurementHeaders],
        body: measurementData,
        startY: tableY,
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        tableWidth: 'wrap'
      });
      
      tableY = doc.lastAutoTable.finalY + 10;
    });
    
    addFooter(pageNum);
  }
  
  // Thermal Analysis
  if (reportData.panels.some(p => p.thermalImages.length > 0)) {
    doc.addPage();
    pageNum++;
    addHeader();
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('E. ANALISIS THERMAL', 15, 35);
    
    let thermalY = 45;
    reportData.panels.forEach((panel) => {
      if (panel.thermalImages.length === 0) return;
      
      if (thermalY > 250) {
        doc.addPage();
        pageNum++;
        addHeader();
        thermalY = 45;
      }
      
      doc.setFontSize(10);
      doc.text(`Panel: ${panel.name}`, 15, thermalY);
      thermalY += 5;
      
      const thermalHeaders = ['Komponen', 'Max (°C)', 'Min (°C)', 'Avg (°C)', 'Status'];
      const thermalData = panel.thermalImages.map(t => [
        t.component || '-',
        t.tempMax?.toFixed(1) || '-',
        t.tempMin?.toFixed(1) || '-',
        t.tempAvg?.toFixed(1) || '-',
        t.status || '-'
      ]);
      
      doc.autoTable({
        head: [thermalHeaders],
        body: thermalData,
        startY: thermalY,
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [234, 179, 8], textColor: 0 }
      });
      
      thermalY = doc.lastAutoTable.finalY + 10;
    });
    
    addFooter(pageNum);
  }
  
  // Recommendations
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    doc.addPage();
    pageNum++;
    addHeader();
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('F. REKOMENDASI TEKNIS', 15, 35);
    
    let recY = 45;
    reportData.recommendations.forEach((rec, idx) => {
      if (recY > 270) {
        doc.addPage();
        pageNum++;
        addHeader();
        recY = 35;
      }
      
      const priorityColor = rec.priority === 'CRITICAL' ? [239, 68, 68] : 
                           rec.priority === 'HIGH' ? [249, 115, 22] : 
                           rec.priority === 'MEDIUM' ? [234, 179, 8] : [34, 197, 94];
      
      doc.setFillColor(...priorityColor);
      doc.roundedRect(15, recY, 8, 8, 1, 1, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`${idx + 1}. [${rec.priority}] ${rec.category}`, 28, recY + 6);
      recY += 8;
      
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Masalah: ${rec.issue}`, 28, recY + 4);
      recY += 6;
      
      if (rec.actions) {
        rec.actions.forEach((action, aidx) => {
          doc.text(`  ${aidx + 1}. ${action}`, 28, recY + 4);
          recY += 5;
        });
      }
      
      recY += 5;
    });
    
    addFooter(pageNum);
  }
  
  // Compliance & Conclusion
  doc.addPage();
  pageNum++;
  addHeader();
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('G. KESIMPULAN DAN KEPATUHAN STANDAR', 15, 35);
  
  if (reportData.compliance) {
    doc.setFontSize(10);
    doc.text(`Skor Kepatuhan: ${reportData.compliance.complianceScore}%`, 20, 50);
    doc.text(`Status: ${reportData.compliance.overallStatus}`, 20, 58);
    
    if (reportData.compliance.applicableClauses) {
      doc.text('Klausul Standar yang Berlaku:', 20, 72);
      let clauseY = 80;
      reportData.compliance.applicableClauses.forEach((clause, idx) => {
        if (clause) {
          doc.text(`${idx + 1}. ${clause.id} - ${clause.judul}`, 25, clauseY);
          clauseY += 6;
        }
      });
    }
  }
  
  doc.setFontSize(11);
  doc.text('H. KESIMPULAN', 15, 200);
  doc.setFontSize(10);
  const conclusion = generateConclusionText(reportData);
  const splitConclusion = doc.splitTextToSize(conclusion, pageWidth - 40);
  doc.text(splitConclusion, 20, 210);
  
  addFooter(pageNum);
  
  // Save
  doc.save(`SLF_Electrical_Report_${reportData.project.name}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function generateConclusionText(reportData) {
  const issues = [];
  
  if (reportData.summary.overloadPanels > 0) {
    issues.push(`${reportData.summary.overloadPanels} panel dalam kondisi overload`);
  }
  if (reportData.summary.warningPanels > 0) {
    issues.push(`${reportData.summary.warningPanels} panel dalam kondisi warning (80-100% loading)`);
  }
  if (reportData.summary.hotspotCount > 0) {
    issues.push(`${reportData.summary.hotspotCount} hotspot termal terdeteksi`);
  }
  
  if (issues.length === 0) {
    return `Berdasarkan hasil pemeriksaan pada tanggal ${reportData.project.date}, sistem kelistrikan pada proyek ${reportData.project.name} menunjukkan kondisi NORMAL dan memenuhi persyaratan standar PUIL 2020, SNI 0225:2011, dan IEC 60364. Semua panel beroperasi dalam batas aman dengan loading di bawah 80% dan tidak terdeteksi adanya hotspot termal yang membahayakan.`;
  }
  
  return `Berdasarkan hasil pemeriksaan pada tanggal ${reportData.project.date}, sistem kelistrikan pada proyek ${reportData.project.name} menunjukkan beberapa temuan yang memerlukan perhatian: ${issues.join(', ')}. Tindakan korektif direkomendasikan sesuai dengan prioritas yang telah diidentifikasi dalam bagian rekomendasi teknis untuk memastikan keamanan dan keandalan sistem kelistrikan sesuai dengan persyaratan standar PUIL 2020, SNI 0225:2011, dan IEC 60364.`;
}

// ============================================================
// 4. CSV EXPORT
// ============================================================

/**
 * Export measurements to CSV
 * @param {Array} measurements - Measurement records
 * @param {string} filename - Output filename
 */
export function exportToCSV(measurements, filename = 'electrical_measurements.csv') {
  if (measurements.length === 0) return;
  
  const headers = Object.keys(measurements[0]);
  const csvContent = [
    headers.join(','),
    ...measurements.map(row => 
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

// ============================================================
// 5. INTEGRATION WITH EXISTING SLF REPORT
// ============================================================

/**
 * Generate electrical inspection data for integration
 * with the main SLF report (Bab 3 or Lampiran)
 * @param {Object} reportData - Electrical report data
 * @returns {Object} Data formatted for SLF report
 */
export function generateSLFReportIntegration(reportData) {
  return {
    bab3_section: {
      title: '3.x Sistem Kelistrikan',
      subsections: [
        {
          title: '3.x.1 Data Teknis Panel',
          content: reportData.panels.map(p => 
            `Panel ${p.name} (${p.location}): MCB ${p.mcbRating}A, Busbar ${p.busbarRating}A, Kabel ${p.cableSize}mm². Loading terukur ${p.loading.toFixed(1)}% - ${p.loading > 100 ? 'OVERLOAD' : p.loading > 80 ? 'PENUH' : 'AMAN'}.`
          ).join('\n\n')
        },
        {
          title: '3.x.2 Hasil Pengukuran Beban',
          content: generateMeasurementSummary(reportData.panels)
        },
        {
          title: '3.x.3 Analisis Termal',
          content: generateThermalSummary(reportData.panels)
        }
      ]
    },
    lampiran: {
      title: 'Lampiran: Data Pengukuran Kelistrikan',
      tables: [
        {
          title: 'Tabel Hasil Pengukuran Beban Listrik',
          data: formatMeasurementTable(reportData.panels)
        },
        {
          title: 'Tabel Analisis Suhu Komponen',
          data: formatThermalTable(reportData.panels)
        }
      ]
    },
    kesimpulan: generateConclusionText(reportData),
    rekomendasi: reportData.recommendations.map(r => 
      `[${r.priority}] ${r.category}: ${r.issue}. ${r.actions?.join(' ')}`
    )
  };
}

function generateMeasurementSummary(panels) {
  const measurements = panels.flatMap(p => p.measurements);
  if (measurements.length === 0) return 'Belum ada data pengukuran.';
  
  const avgVoltage = measurements.reduce((s, m) => s + (m.voltage || 0), 0) / measurements.length;
  const maxCurrent = Math.max(...measurements.map(m => m.current || 0));
  const avgPowerFactor = measurements.reduce((s, m) => s + (m.powerFactor || 0), 0) / measurements.length;
  
  return `Berdasarkan ${measurements.length} titik pengukuran, diperoleh tegangan rata-rata ${avgVoltage.toFixed(1)}V, arus maksimum ${maxCurrent.toFixed(2)}A, dan faktor daya rata-rata ${avgPowerFactor.toFixed(2)}.`;
}

function generateThermalSummary(panels) {
  const thermalImages = panels.flatMap(p => p.thermalImages);
  if (thermalImages.length === 0) return 'Tidak ada data thermal.';
  
  const critical = thermalImages.filter(t => (t.tempMax || 0) > 70).length;
  const warning = thermalImages.filter(t => {
    const tmax = t.tempMax || 0;
    return tmax > 45 && tmax <= 70;
  }).length;
  
  return `Pemeriksaan thermal camera mendeteksi ${thermalImages.length} titik pengukuran suhu, dengan ${critical} titik kritis (>70°C) dan ${warning} titik waspada (45-70°C).`;
}

function formatMeasurementTable(panels) {
  return panels.flatMap((p, pidx) => 
    (p.measurements || []).map((m, midx) => ({
      'No': `${pidx + 1}.${midx + 1}`,
      'Panel': p.name,
      'Lokasi': m.location || p.location,
      'V (V)': m.voltage?.toFixed(1) || '-',
      'I (A)': m.current?.toFixed(2) || '-',
      'kW': m.power ? (m.power / 1000).toFixed(2) : '-',
      'cos φ': m.powerFactor?.toFixed(2) || '-',
      'Loading %': m.loadingPercentage?.toFixed(1) || '-',
      'Suhu (°C)': m.temperature?.toFixed(1) || '-'
    }))
  );
}

function formatThermalTable(panels) {
  return panels.flatMap((p, pidx) => 
    (p.thermalImages || []).map((t, tidx) => ({
      'No': `${pidx + 1}.${tidx + 1}`,
      'Panel': p.name,
      'Komponen': t.component || '-',
      'Max (°C)': t.tempMax?.toFixed(1) || '-',
      'Min (°C)': t.tempMin?.toFixed(1) || '-',
      'Avg (°C)': t.tempAvg?.toFixed(1) || '-',
      'Status': t.status || '-'
    }))
  );
}

// Export all functions
export default {
  formatReportData,
  generateExcelReport,
  generatePDFReport,
  exportToCSV,
  generateSLFReportIntegration
};
