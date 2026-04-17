import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download professional PDF for Legal Statements
 */
export async function downloadLegalPdf(p, s, type, findings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const experts = s.experts || {};
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (type === 'konsultan') {
    await buildConsultantPdf(doc, p, s, experts, dateStr, findings);
  } else {
    await buildOwnerPdf(doc, p, s, dateStr, findings);
  }

  const fileName = type === 'konsultan' ? 
    `Surat Pernyataan Konsultan - ${p.nama_bangunan}.pdf` : 
    `Surat Pernyataan Pemilik - ${p.nama_bangunan}.pdf`;
  
  doc.save(fileName);
}

async function buildConsultantPdf(doc, p, s, experts, dateStr, findings) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let y = 20;

  // Header / Kop Surat
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const kopLines = s.consultant?.kop_text ? s.consultant.kop_text.split('\n') : ['KOP SURAT PERUSAHAAN'];
  kopLines.forEach((line, i) => {
    doc.text(line.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 6;
  });
  
  // Garis bawah kop
  y += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Judul
  doc.setFontSize(14);
  doc.text('SURAT PERNYATAAN KELAIKAN FUNGSI', pageWidth / 2, y, { align: 'center' });
  y += 7;
  doc.text('BANGUNAN GEDUNG', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Meta Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor    : ${p.metadata?.nomor_surat || '__________'}`, margin, y);
  y += 6;
  doc.text(`Tanggal  : ${dateStr}`, margin, y);
  y += 6;
  doc.text(`Lampiran : 1 (Satu) Berkas`, margin, y);
  y += 12;

  // Pembuka
  const day = new Date().getDate();
  const month = new Date().toLocaleDateString('id-ID', { month: 'long' });
  const year = new Date().getFullYear();
  
  const openingText = `Pada hari ini, tanggal ${day} bulan ${month} tahun ${year}, yang bertanda tangan di bawah ini:`;
  const wrappedOpening = doc.splitTextToSize(openingText, pageWidth - 2 * margin);
  doc.text(wrappedOpening, margin, y);
  y += wrappedOpening.length * 5 + 5;

  // Checkbox jasa
  doc.text('[ ] Penyedia jasa pengkaji teknis / Penyedia jasa pengawas konstruksi /', margin, y);
  y += 5;
  doc.text('    Penyedia jasa manajemen konstruksi / Instansi penyelenggara SLF Pemerintah Daerah', margin, y);
  y += 10;

  // Data Perusahaan
  autoTable(doc, {
    startY: y,
    margin: { left: margin + 5, right: margin },
    tableWidth: pageWidth - 2 * margin - 10,
    body: [
      ['Nama perusahaan/instansi', ':', s.consultant?.name || '-'],
      ['Alamat', ':', s.consultant?.address || '-'],
      ['Telepon', ':', p.telepon || '-'],
      ['Email', ':', p.email_pemilik || '-'],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 5 },
      2: { cellWidth: 'auto' }
    }
  });
  y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;

  // Ahli Pemeriksa
  doc.setFont('helvetica', 'bold');
  doc.text('Pelaksana pemeriksaan kelaikan fungsi bangunan gedung:', margin, y);
  y += 8;
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    startY: y,
    margin: { left: margin + 5, right: margin },
    tableWidth: pageWidth - 2 * margin - 10,
    body: [
      ['1)', 'Bidang Arsitektur / Tata Ruang-Luar:', ''],
      ['', `a) Nama  : ${experts.architecture?.name || '____________________'}`, ''],
      ['', `b) No. SKK: ${experts.architecture?.skk || '____________________'}`, ''],
      ['2)', 'Bidang Struktur:', ''],
      ['', `a) Nama  : ${experts.structure?.name || '____________________'}`, ''],
      ['', `b) No. SKK: ${experts.structure?.skk || '____________________'}`, ''],
      ['3)', 'Bidang Utilitas / MEP:', ''],
      ['', `a) Nama  : ${experts.mep?.name || '____________________'}`, ''],
      ['', `b) No. SKK: ${experts.mep?.skk || '____________________'}`, ''],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 5 }
    }
  });
  y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;

  // Data Bangunan
  doc.setFont('helvetica', 'bold');
  doc.text('Telah melaksanakan pemeriksaan kelaikan fungsi bangunan gedung pada:', margin, y);
  y += 8;
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    startY: y,
    margin: { left: margin + 5, right: margin },
    tableWidth: pageWidth - 2 * margin - 10,
    body: [
      ['1)', 'Nama bangunan', ':', p.nama_bangunan || '-'],
      ['2)', 'Alamat bangunan', ':', p.alamat || '-'],
      ['3)', 'Posisi koordinat', ':', `Lat: ${p.latitude || 0}, Lng: ${p.longitude || 0}`],
      ['4)', 'Fungsi bangunan', ':', p.fungsi_bangunan || '-'],
      ['5)', 'Klasifikasi kompleksitas', ':', p.klasifikasi || 'Bangunan Tidak Sederhana'],
      ['6)', 'Ketinggian bangunan', ':', `${p.ketinggian || '-'} Meter`],
      ['7)', 'Jumlah lantai bangunan', ':', `${p.jumlah_lantai || 1} Lantai`],
      ['8)', 'Luas lantai bangunan', ':', `${p.luas_bangunan || 0} m2`],
      ['9)', 'Jumlah basement', ':', `${p.jumlah_basement || 0} Lantai`],
      ['10)', 'Luas lantai basement', ':', `${p.luas_basement || 0} m2`],
      ['11)', 'Luas lahan', ':', `${p.luas_lahan || 0} m2`],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 55 },
      2: { cellWidth: 5 },
      3: { cellWidth: 'auto' }
    }
  });
  y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;

  // Berdasarkan pemeriksaan
  doc.setFont('helvetica', 'bold');
  doc.text('Berdasarkan hasil pemeriksaan persyaratan kelaikan fungsi yang terdiri dari:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  
  const items = [
    '1) Pemeriksaan dokumen administratif bangunan gedung;',
    '2) Pemeriksaan persyaratan teknis bangunan gedung, yaitu:',
    '    a. pemeriksaan persyaratan tata bangunan, meliputi peruntukan, intensitas,',
    '        arsitektur dan pengendalian dampak lingkungan;',
    '    b. pemeriksaan persyaratan keandalan bangunan gedung, meliputi keselamatan,',
    '        kesehatan, kenyamanan, dan kemudahan.'
  ];
  
  items.forEach(item => {
    doc.text(item, margin, y);
    y += 5;
  });
  y += 5;

  // Pernyataan
  doc.text('Dengan ini menyatakan bahwa:', margin, y);
  y += 8;

  // Kotak Pernyataan Laik Fungsi
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('BANGUNAN GEDUNG DINYATAKAN LAIK FUNGSI', pageWidth / 2, y + 2, { align: 'center' });
  y += 15;
  doc.setFont('helvetica', 'normal');

  // Penutup
  const closingText = `Sesuai kesimpulan dari analisis dan evaluasi terhadap hasil pemeriksaan dokumen dan pemeriksaan kondisi fisik bangunan gedung sebagaimana termuat dalam Laporan Pemeriksaan Kelaikan Fungsi Bangunan Gedung terlampir.`;
  const wrappedClosing = doc.splitTextToSize(closingText, pageWidth - 2 * margin);
  doc.text(wrappedClosing, margin, y);
  y += wrappedClosing.length * 5 + 5;

  const validityText = 'Surat pernyataan ini berlaku sepanjang tidak ada perubahan yang dilakukan oleh pemilik atau pengguna terhadap bangunan gedung atau penyebab gangguan lainnya yang dibuktikan kemudian.';
  const wrappedValidity = doc.splitTextToSize(validityText, pageWidth - 2 * margin);
  doc.text(wrappedValidity, margin, y);
  y += wrappedValidity.length * 5 + 5;

  const responsibilityText = 'Demikian surat pernyataan ini dibuat dengan penuh tanggung jawab profesional sesuai dengan ketentuan dalam Undang-undang Nomor 2 Tahun 2017 tentang Jasa Konstruksi.';
  const wrappedResp = doc.splitTextToSize(responsibilityText, pageWidth - 2 * margin);
  doc.text(wrappedResp, margin, y);
  y += wrappedResp.length * 5 + 10;

  // Tanda tangan
  const signY = y;
  doc.text(`${p.kota || 'Bandung'}, ${dateStr}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text((s.consultant?.name || 'NAMA PERUSAHAAN').toUpperCase(), pageWidth - margin - 5, y, { align: 'right' });
  y += 25;
  doc.text((s.consultant?.director_name || 'NAMA DIREKTUR').toUpperCase(), pageWidth - margin - 5, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(s.consultant?.director_job || 'Direktur', pageWidth - margin - 5, y, { align: 'right' });
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('TTE Terverifikasi secara Digital (UU ITE)', pageWidth - margin - 5, y, { align: 'right' });
  doc.setTextColor(0);
  doc.setFontSize(11);
}

async function buildOwnerPdf(doc, p, s, dateStr, findings) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let y = 20;

  // Judul
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT PERNYATAAN PEMILIK / PENGELOLA', pageWidth / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(12);
  doc.text('TENTANG KESEDIAAN MEMELIHARA BANGUNAN GEDUNG', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Pembuka
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Yang bertanda tangan di bawah ini:', margin, y);
  y += 8;

  // Data Pemilik
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
    body: [
      ['Nama Pemilik', ':', p.pemilik || '____________________'],
      ['Nomor Identitas', ':', p.ktp_pemilik || '____________________'],
      ['Alamat', ':', p.alamat_pemilik || '____________________'],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 5 },
      2: { cellWidth: 'auto' }
    }
  });
  y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : y + 20;

  // Data Bangunan
  doc.text('Adalah selaku pemilik/pengelola bangunan gedung yang berlokasi di:', margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
    body: [
      ['Nama Bangunan', ':', p.nama_bangunan || '-'],
      ['Alamat Bangunan', ':', p.alamat || '-'],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 5 },
      2: { cellWidth: 'auto' }
    }
  });
  y = doc.lastAutoTable.finalY + 10;

  // Pernyataan
  const statementText = 'Dengan ini menyatakan bahwa saya akan memelihara dan merawat bangunan gedung tersebut sesuai dengan standar teknis dan peruntukannya, serta menjamin kebenaran seluruh dokumen yang disampaikan dalam permohonan SLF melalui sistem SIMBG.';
  const wrappedStatement = doc.splitTextToSize(statementText, pageWidth - 2 * margin);
  doc.text(wrappedStatement, margin, y);
  y += wrappedStatement.length * 5 + 5;

  const responsibilityText = 'Apabila dikemudian hari ditemukan ketidakbenaran atas pernyataan ini, saya bersedia mempertanggungjawabkannya sesuai ketentuan hukum yang berlaku.';
  const wrappedResp = doc.splitTextToSize(responsibilityText, pageWidth - 2 * margin);
  doc.text(wrappedResp, margin, y);
  y += wrappedResp.length * 5 + 10;

  // Lampiran Temuan
  if (findings && findings.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('LAMPIRAN: DAFTAR TEMUAN DAN REKOMENDASI PERBAIKAN', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    const tableBody = findings.map((f, i) => [
      String(i + 1),
      f.nama || '-',
      f.catatan || '-',
      f.rekomendasi || '-',
      f.remedy_time || '-'
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['No', 'Aspek Pemeriksaan', 'Temuan / Kondisi', 'Rekomendasi Teknis', 'Target']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Tanda tangan
  doc.text(`${p.kota || 'Bandung'}, ${dateStr}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Pemilik Bangunan,', pageWidth - margin - 5, y, { align: 'right' });
  y += 25;
  doc.text((p.pemilik || 'NAMA').toUpperCase(), pageWidth - margin - 5, y, { align: 'right' });
}
