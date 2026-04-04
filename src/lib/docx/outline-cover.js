import {
  getStatusLabel, getRiskLabel, getStatusSLFLabel, formatTanggal, safeText,
  createTableBorders, headerCell, dataCell, heading1, heading2, heading3, 
  bodyText, bulletItem, numberedItem, emptyLine, pageBreak, horizontalLine,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H1, FONT_SIZE_H2, FONT_SIZE_H3, FONT_SIZE_SMALL, FONT_SIZE_CAPTION,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUBHEADING, COLOR_MUTED, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_HEADER_BG, COLOR_TABLE_ALT, COLOR_BORDER, COLOR_COVER_BG, COLOR_ACCENT, COLOR_WHITE, COLOR_NAVY,
  MARGIN_TOP, MARGIN_BOTTOM, MARGIN_LEFT, MARGIN_RIGHT, LINE_SPACING,
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip
} from './utils.js';

// ============================================================
export function renderCover(proyek, settings) {
  return [
    // Top spacer
    ...Array(4).fill(null).map(() => new Paragraph({ spacing: { before: 400 } })),

    // Consultant Logo (Placeholder logic for now)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({
        text: 'LOGO KONSULTAN',
        size: 24, bold: true, color: COLOR_MUTED, font: FONT_MAIN, italics: true
      })]
    }),

    // Header line
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({
        text: '________________________________________',
        size: 24, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),

    // Main title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [new TextRun({
        text: 'LAPORAN', size: 40, bold: true, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({
        text: 'PENILAIAN KELAIKAN FUNGSI', size: 36, bold: true, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: 'BANGUNAN GEDUNG', size: 36, bold: true, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),

    // Separator
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 200 },
      children: [new TextRun({
        text: '________________________________________',
        size: 24, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),

    // Building name
    new Paragraph({ spacing: { before: 600 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({
        text: safeText(proyek.nama_bangunan).toUpperCase(),
        size: 32, bold: true, color: COLOR_PRIMARY, font: FONT_MAIN
      })]
    }),

    // Location
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({
        text: safeText(proyek.alamat || ''),
        size: 24, color: COLOR_SUBHEADING, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: `${safeText(proyek.kota || '')}, ${safeText(proyek.provinsi || '')}`,
        size: 24, color: COLOR_SUBHEADING, font: FONT_MAIN
      })]
    }),

    // Spacer
    ...Array(4).fill(null).map(() => new Paragraph({ spacing: { before: 400 } })),

    // Owner
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({
        text: 'Diajukan oleh:', size: FONT_SIZE_SMALL, color: COLOR_MUTED, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: safeText(proyek.pemilik || 'N/A').toUpperCase(),
        size: 28, bold: true, color: COLOR_PRIMARY, font: FONT_MAIN
      })]
    }),

    // Date & Year
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({
        text: formatTanggal(new Date()),
        size: FONT_SIZE_BODY, color: COLOR_MUTED, font: FONT_MAIN
      })]
    }),

    // Footer
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [new TextRun({
        text: 'Ditetapkan Dan Diterbitkan oleh:',
        size: FONT_SIZE_SMALL, color: COLOR_MUTED, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100 },
      children: [new TextRun({
        text: settings.consultant.name.toUpperCase(),
        size: 32, bold: true, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60 },
      children: [new TextRun({
        text: 'Smart AI Pengkaji SLF v1.0',
        size: FONT_SIZE_SMALL, color: COLOR_MUTED, font: FONT_MAIN, italics: true
      })]
    }),
  ];
}

// ============================================================
export function renderKataPengantar(proyek, settings) {
  return [
    heading1('KATA PENGANTAR', { pageBreakBefore: false }),
    bodyText('Puji dan syukur ke hadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya sehingga laporan teknis Pengkajian Kelaikan Fungsi Bangunan Gedung ini dapat disusun dan diselesaikan dengan baik.'),
    
    bodyText(`Laporan ini disusun sebagai bagian dari proses evaluasi teknis terhadap kondisi bangunan gedung ${safeText(proyek.nama_bangunan)} yang berlokasi di ${safeText([proyek.alamat, proyek.kota, proyek.provinsi].filter(Boolean).join(', ')) || '-'}, yang bertujuan untuk menilai tingkat kelaikan fungsi berdasarkan aspek keselamatan, kesehatan, kenyamanan, dan kemudahan sesuai dengan ketentuan peraturan perundang-undangan yang berlaku. Dalam penyusunannya, laporan ini mengintegrasikan pendekatan pemeriksaan lapangan, verifikasi administratif, serta analisis berbasis kecerdasan buatan (Artificial Intelligence) guna menghasilkan evaluasi yang lebih komprehensif, sistematis, dan dapat dipertanggungjawabkan.`),
    
    bodyText('Kami menyadari bahwa perkembangan teknologi menuntut adanya inovasi dalam proses pengkajian teknis. Oleh karena itu, pendekatan berbasis AI yang digunakan dalam laporan ini diharapkan mampu meningkatkan kualitas analisis, khususnya dalam mengidentifikasi risiko, mengevaluasi tingkat kepatuhan, serta merumuskan rekomendasi teknis yang tepat sasaran.'),
    
    bodyText('Laporan ini disusun secara terstruktur mulai dari pendahuluan, metodologi pemeriksaan, hasil pemeriksaan, analisis dan evaluasi, hingga kesimpulan dan rekomendasi. Setiap bagian saling terintegrasi untuk memberikan gambaran menyeluruh mengenai kondisi bangunan yang dikaji.'),
    
    bodyText('Kami menyampaikan terima kasih kepada seluruh pihak yang telah berkontribusi dalam proses pengumpulan data, pelaksanaan pemeriksaan lapangan, serta penyusunan laporan ini. Dukungan dan kerja sama yang baik sangat membantu dalam menghasilkan laporan yang akurat dan berkualitas.'),
    
    bodyText('Kami menyadari bahwa laporan ini masih memiliki keterbatasan. Oleh karena itu, kami terbuka terhadap masukan dan saran yang konstruktif guna penyempurnaan di masa yang akan datang.'),
    
    bodyText('Akhir kata, semoga laporan ini dapat memberikan manfaat sebagai dasar pengambilan keputusan teknis serta menjadi referensi dalam upaya peningkatan keandalan dan kelaikan fungsi bangunan gedung.'),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 800 },
      children: [
        new TextRun({ text: `${proyek.kota || 'Jakarta'}, ${formatTanggal(new Date())}`, size: FONT_SIZE_BODY, font: FONT_MAIN }),
        new TextRun({ break: 1 }),
        new TextRun({ text: 'Direktur Utama', bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN }),
        new TextRun({ break: 4 }), // Ruang untuk tanda tangan
        new TextRun({ text: (settings.consultant?.director_name || 'NAMA DIREKTUR').toUpperCase(), underline: {}, bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN }),
      ]
    })
  ];
}

// ============================================================
export function renderDaftarIsi() {
  return [
    heading1('DAFTAR ISI'),
    new TableOfContents("ToC", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    pageBreak(),
  ];
}