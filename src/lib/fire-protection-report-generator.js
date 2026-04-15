/**
 * FIRE PROTECTION REPORT GENERATOR
 * Generate laporan kajian Fire Protection & Life Safety
 * Berdasarkan SNI 03-1735-2004, SNI 03-1745-2000, NFPA 13/101
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supabase } from './supabase.js';

// ============================================================
// MAIN REPORT GENERATOR
// ============================================================

export async function generateFireProtectionReport(projectId, options = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Fetch data
  const projectData = await fetchProjectData(projectId);
  const assets = await fetchAssets(projectId);
  const inspections = await fetchInspections(projectId);
  const riskAssessment = await fetchRiskAssessment(projectId);

  // Generate sections
  addCoverPage(doc, projectData);
  addTableOfContents(doc);
  addExecutiveSummary(doc, projectData, assets, inspections);
  addAssetInventory(doc, assets);
  addInspectionResults(doc, inspections);
  addRiskAssessmentSection(doc, riskAssessment);
  addComplianceChecklist(doc, assets, inspections);
  addRecommendations(doc, inspections);
  addAppendices(doc, options);

  return doc;
}

// ============================================================
// DATA FETCHERS
// ============================================================

async function fetchProjectData(projectId) {
  try {
    const { data, error } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, alamat, kota, pemilik, fungsi_bangunan, jumlah_lantai, luas_bangunan')
      .eq('id', projectId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching project data:', error);
    return {};
  }
}

async function fetchAssets(projectId) {
  try {
    const { data, error } = await supabase
      .from('fire_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('asset_type', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fire assets:', error);
    return [];
  }
}

async function fetchInspections(projectId) {
  try {
    const { data, error } = await supabase
      .from('fire_inspections')
      .select(`
        *,
        fire_inspection_files(file_url, file_type)
      `)
      .eq('project_id', projectId)
      .order('inspection_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return [];
  }
}

async function fetchRiskAssessment(projectId) {
  try {
    const { data, error } = await supabase
      .from('fire_risk_assessments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching risk assessment:', error);
    return null;
  }
}

// ============================================================
// PDF SECTIONS
// ============================================================

function addCoverPage(doc, project) {
  // Header
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KAJIAN', 105, 25, { align: 'center' });
  
  // Title
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(20);
  doc.text('FIRE PROTECTION & LIFE SAFETY', 105, 70, { align: 'center' });
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem Proteksi Kebakaran dan Keselamatan Jiwa', 105, 80, { align: 'center' });
  
  // Project Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(project.nama_bangunan || 'NAMA BANGUNAN', 105, 120, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(project.alamat || '-', 105, 130, { align: 'center' });
  doc.text(`${project.kota || '-'}`, 105, 137, { align: 'center' });
  
  // Standards
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(40, 160, 170, 160);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Berdasarkan:', 105, 170, { align: 'center' });
  doc.text('SNI 03-1735-2004 | SNI 03-1745-2000 | SNI 03-3973-2003', 105, 177, { align: 'center' });
  doc.text('NFPA 13 | NFPA 101 | NFPA 10', 105, 184, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Tanggal: ${today}`, 105, 220, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Dokumen ini bersifat rahasia dan hanya untuk keperluan resmi.', 105, 280, { align: 'center' });
  
  doc.addPage();
}

function addTableOfContents(doc) {
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DAFTAR ISI', 20, 30);
  
  const sections = [
    '1. Executive Summary',
    '2. Daftar Aset Fire Protection',
    '3. Hasil Inspeksi',
    '4. Analisis Risiko Kebakaran',
    '5. Checklist Compliance',
    '6. Rekomendasi',
    '7. Lampiran'
  ];
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  let y = 50;
  sections.forEach((section, index) => {
    doc.text(section, 25, y);
    doc.text(`${3 + index}`, 180, y);
    y += 12;
  });
  
  doc.addPage();
}

function addExecutiveSummary(doc, project, assets, inspections) {
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('1. EXECUTIVE SUMMARY', 20, 30);
  
  // Building Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('Informasi Bangunan:', 20, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const info = [
    `Nama Bangunan: ${project.nama_bangunan || '-'}`,
    `Fungsi: ${project.fungsi_bangunan || '-'}`,
    `Jumlah Lantai: ${project.jumlah_lantai || '-'}`,
    `Luas Bangunan: ${project.luas_bangunan ? project.luas_bangunan + ' m²' : '-'}`,
    `Pemilik: ${project.pemilik || '-'}`
  ];
  
  let y = 55;
  info.forEach(line => {
    doc.text(line, 25, y);
    y += 8;
  });
  
  // Asset Summary
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Ringkasan Aset:', 20, y);
  
  const assetCounts = countAssetsByType(assets);
  const assetSummary = [
    `APAR: ${assetCounts.APAR || 0} unit`,
    `Hydrant: ${assetCounts.HYDRANT || 0} unit`,
    `Sprinkler: ${assetCounts.SPRINKLER || 0} unit`,
    `Smoke Detector: ${assetCounts.DETECTOR || 0} unit`,
    `MCP: ${assetCounts.MCP || 0} unit`,
    `Fire Pump: ${assetCounts.FIRE_PUMP || 0} unit`
  ];
  
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  assetSummary.forEach(line => {
    doc.text(line, 25, y);
    y += 8;
  });
  
  // Inspection Summary
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Status Inspeksi:', 20, y);
  
  const passCount = inspections.filter(i => i.overall_status === 'PASS').length;
  const failCount = inspections.filter(i => i.overall_status === 'FAIL').length;
  const pendingCount = inspections.filter(i => i.overall_status === 'PENDING').length;
  
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Inspeksi: ${inspections.length}`, 25, y);
  y += 8;
  doc.setTextColor(0, 150, 0);
  doc.text(`✓ Lulus: ${passCount}`, 25, y);
  y += 8;
  doc.setTextColor(220, 38, 38);
  doc.text(`✗ Gagal: ${failCount}`, 25, y);
  y += 8;
  doc.setTextColor(255, 165, 0);
  doc.text(`○ Pending: ${pendingCount}`, 25, y);
  
  doc.addPage();
}

function addAssetInventory(doc, assets) {
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DAFTAR ASET FIRE PROTECTION', 20, 30);
  
  if (assets.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tidak ada data aset fire protection.', 20, 50);
    doc.addPage();
    return;
  }
  
  const tableData = assets.map(asset => [
    asset.asset_type,
    asset.location_name || '-',
    asset.floor_level?.toString() || '-',
    asset.status,
    asset.last_inspection_date ? new Date(asset.last_inspection_date).toLocaleDateString('id-ID') : '-'
  ]);
  
  doc.autoTable({
    head: [['Tipe', 'Lokasi', 'Lantai', 'Status', 'Inspeksi Terakhir']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [220, 38, 38], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  doc.addPage();
}

function addInspectionResults(doc, inspections) {
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('3. HASIL INSPEKSI', 20, 30);
  
  if (inspections.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tidak ada data inspeksi.', 20, 50);
    doc.addPage();
    return;
  }
  
  let y = 40;
  
  inspections.slice(0, 5).forEach((inspection, index) => {
    if (y > 250) {
      doc.addPage();
      y = 30;
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Inspeksi #${index + 1} - ${new Date(inspection.inspection_date).toLocaleDateString('id-ID')}`, 20, y);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const statusColor = inspection.overall_status === 'PASS' ? [0, 150, 0] : 
                        inspection.overall_status === 'FAIL' ? [220, 38, 38] : [255, 165, 0];
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`Status: ${inspection.overall_status || 'PENDING'}`, 25, y);
    
    doc.setTextColor(0, 0, 0);
    y += 8;
    doc.text(`Aset: ${inspection.asset_type || '-'}`, 25, y);
    y += 8;
    doc.text(`Lokasi: ${inspection.location_name || '-'}`, 25, y);
    y += 8;
    doc.text(`Inspector: ${inspection.inspector_name || '-'}`, 25, y);
    
    if (inspection.findings?.length > 0) {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Temuan:', 25, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      inspection.findings.forEach((finding, fIndex) => {
        if (y > 280) {
          doc.addPage();
          y = 30;
        }
        doc.text(`  ${fIndex + 1}. ${finding.description}`, 30, y);
        y += 6;
      });
    }
    
    y += 15;
  });
  
  doc.addPage();
}

function addRiskAssessmentSection(doc, riskAssessment) {
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('4. ANALISIS RISIKO KEBAKARAN', 20, 30);
  
  if (!riskAssessment) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Belum ada analisis risiko kebakaran.', 20, 50);
    doc.addPage();
    return;
  }
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  let y = 50;
  
  doc.text(`Risk Score: ${riskAssessment.risk_score || '-'}`, 20, y);
  y += 10;
  doc.text(`Risk Level: ${riskAssessment.risk_level || '-'}`, 20, y);
  y += 10;
  doc.text(`Probabilitas: ${riskAssessment.probability || '-'}`, 20, y);
  y += 10;
  doc.text(`Konsekuensi: ${riskAssessment.consequence || '-'}`, 20, y);
  y += 10;
  
  if (riskAssessment.hazards?.length > 0) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Identified Hazards:', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    riskAssessment.hazards.forEach((hazard, index) => {
      doc.text(`${index + 1}. ${hazard.description} (${hazard.severity})`, 25, y);
      y += 8;
    });
  }
  
  if (riskAssessment.mitigation_measures?.length > 0) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Mitigation Measures:', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    riskAssessment.mitigation_measures.forEach((measure, index) => {
      doc.text(`${index + 1}. ${measure}`, 25, y);
      y += 8;
    });
  }
  
  doc.addPage();
}

function addComplianceChecklist(doc, assets, inspections) {
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('5. CHECKLIST COMPLIANCE', 20, 30);
  
  const checklist = generateComplianceChecklist(assets, inspections);
  
  const tableData = checklist.map(item => [
    item.item,
    item.requirement,
    item.status === 'PASS' ? '✓' : item.status === 'FAIL' ? '✗' : '○',
    item.notes || '-'
  ]);
  
  doc.autoTable({
    head: [['Item', 'Persyaratan', 'Status', 'Catatan']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [220, 38, 38], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 80 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 'auto' }
    },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  doc.addPage();
}

function addRecommendations(doc, inspections) {
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('6. REKOMENDASI', 20, 30);
  
  // Collect all findings that need action
  const recommendations = [];
  inspections.forEach(inspection => {
    if (inspection.findings) {
      inspection.findings
        .filter(f => f.requires_action)
        .forEach(f => {
          recommendations.push({
            priority: f.priority || 'MEDIUM',
            description: f.description,
            assetType: inspection.asset_type,
            location: inspection.location_name
          });
        });
    }
  });
  
  if (recommendations.length === 0) {
    doc.setTextColor(0, 150, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('✓ Tidak ada rekomendasi kritis. Sistem fire protection dalam kondisi baik.', 20, 50);
  } else {
    let y = 50;
    
    // Sort by priority
    const priorityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    recommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .forEach((rec, index) => {
        if (y > 270) {
          doc.addPage();
          y = 30;
        }
        
        const color = rec.priority === 'CRITICAL' ? [220, 38, 38] : 
                      rec.priority === 'HIGH' ? [255, 100, 0] : 
                      rec.priority === 'MEDIUM' ? [255, 165, 0] : [0, 150, 0];
        
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${index + 1}. [${rec.priority}]`, 20, y);
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(rec.description, 160);
        doc.text(lines, 25, y + 5);
        
        y += 10 + (lines.length * 5);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Lokasi: ${rec.assetType} - ${rec.location}`, 25, y);
        y += 15;
      });
  }
  
  doc.addPage();
}

function addAppendices(doc, options) {
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('7. LAMPIRAN', 20, 30);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('A. Referensi Standar', 20, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const standards = [
    'SNI 03-1735-2004: Tata cara perencanaan dan pemasangan sistem deteksi dan alarm kebakaran',
    'SNI 03-1745-2000: Tata cara perencanaan dan pemasangan sprinkler otomatik',
    'SNI 03-3973-2003: Pemasangan alat pemadam api ringan (APAR)',
    'NFPA 10: Standard for Portable Fire Extinguishers',
    'NFPA 13: Standard for the Installation of Sprinkler Systems',
    'NFPA 101: Life Safety Code',
    'NFPA 72: National Fire Alarm and Signaling Code'
  ];
  
  let y = 60;
  standards.forEach((std, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${std}`, 170);
    doc.text(lines, 25, y);
    y += 5 * lines.length + 3;
  });
  
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('B. Definisi dan Singkatan', 20, y);
  
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const definitions = [
    'APAR: Alat Pemadam Api Ringan',
    'MCP: Manual Call Point',
    'FRR: Fire Resistance Rating',
    'LPM: Liter Per Menit',
    'DCP: Dry Chemical Powder'
  ];
  
  definitions.forEach(def => {
    doc.text(`• ${def}`, 25, y);
    y += 6;
  });
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function countAssetsByType(assets) {
  return assets.reduce((acc, asset) => {
    acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
    return acc;
  }, {});
}

function generateComplianceChecklist(assets, inspections) {
  const checklist = [];
  
  // APAR Compliance
  const aparCount = assets.filter(a => a.asset_type === 'APAR').length;
  checklist.push({
    item: 'Jumlah APAR',
    requirement: 'Minimum 1 unit per 500 m² atau sesuai kelas bahaya',
    status: aparCount > 0 ? 'PASS' : 'FAIL',
    notes: `${aparCount} unit terdeteksi`
  });
  
  // Hydrant Compliance
  const hydrantCount = assets.filter(a => a.asset_type === 'HYDRANT').length;
  checklist.push({
    item: 'Jumlah Hydrant',
    requirement: 'Indoor: max 30m jarak tempuh, Outdoor: max 45m',
    status: hydrantCount > 0 ? 'PASS' : 'PENDING',
    notes: `${hydrantCount} unit terdeteksi`
  });
  
  // Smoke Detector Compliance
  const detectorCount = assets.filter(a => a.asset_type === 'DETECTOR').length;
  checklist.push({
    item: 'Smoke Detector',
    requirement: 'Coverage max 7.5m radius, spacing max 11m',
    status: detectorCount > 0 ? 'PASS' : 'PENDING',
    notes: `${detectorCount} unit terdeteksi`
  });
  
  // MCP Compliance
  const mcpCount = assets.filter(a => a.asset_type === 'MCP').length;
  checklist.push({
    item: 'Manual Call Point',
    requirement: 'Max 30m jarak tempuh, ketinggian 1.2-1.4m',
    status: mcpCount > 0 ? 'PASS' : 'PENDING',
    notes: `${mcpCount} unit terdeteksi`
  });
  
  // Inspection Compliance
  const recentInspections = inspections.filter(i => {
    const daysSince = (new Date() - new Date(i.inspection_date)) / (1000 * 60 * 60 * 24);
    return daysSince <= 365;
  });
  
  checklist.push({
    item: 'Inspeksi Rutin',
    requirement: 'Inspeksi dalam 12 bulan terakhir',
    status: recentInspections.length > 0 ? 'PASS' : 'FAIL',
    notes: `${recentInspections.length} inspeksi dalam 12 bulan terakhir`
  });
  
  return checklist;
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

export async function downloadFireProtectionReport(projectId, filename = null) {
  const doc = await generateFireProtectionReport(projectId);
  const defaultFilename = `Fire_Protection_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename || defaultFilename);
}

export async function getFireProtectionReportBlob(projectId) {
  const doc = await generateFireProtectionReport(projectId);
  return doc.output('blob');
}

export default {
  generateFireProtectionReport,
  downloadFireProtectionReport,
  getFireProtectionReportBlob
};
