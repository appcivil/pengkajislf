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

export function renderExpertTeam(settings, proyek) {
  const rows = [];
  
  // Headers
  rows.push(new TableRow({
    tableHeader: true, // Ulangi header jika tabel terpotong halaman
    cantSplit: true,
    children: [
      headerCell('NO', 10),
      headerCell('NAMA TENAGA AHLI', 60),
      headerCell('TANDA TANGAN', 30),
    ]
  }));

  // Data (Handling as Object)
  Object.entries(settings.experts).forEach(([type, exp], idx) => {
    const roleLabel = type === 'architecture' ? 'Bidang Arsitektur' : type === 'structure' ? 'Bidang Struktur' : 'Bidang MEP';
    rows.push(new TableRow({
      children: [
        dataCell(String(idx + 1), 10, { center: true }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: safeText(exp.name || 'NAMA AHLI'), bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN })]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `${roleLabel}  |  SKA/SKK: ${safeText(exp.skk || exp.ska || '-')}`, size: FONT_SIZE_SMALL, font: FONT_MAIN, color: COLOR_MUTED }),
              ]
            }),
          ]
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: proyek.metadata?.signatures?.[type]?.status === 'VALID' ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "TTE VERIFIED", size: 12, bold: true, color: "3b82f6" }),
                new TextRun({ break: 1 }),
                new TextRun({ text: formatTanggal(new Date(proyek.metadata.signatures[type].signed_at)), size: 10, color: "333333", bold: true })
              ]
            })
          ] : [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "BELUM TTE", size: 12, bold: true, color: "ef4444" }),
                new TextRun({ break: 1 }),
                new TextRun({ text: "(Tanda Tangan)", size: 10, color: "666666", italics: true })
              ]
            })
          ],
          verticalAlign: VerticalAlign.CENTER
        })
      ]
    }));
  });

  return [
    heading1('TIM TENAGA AHLI PENGKAJI TEKNIS'),
    bodyText(`Laporan kajian teknis kelaikan fungsi bangunan gedung ${proyek.nama_bangunan} ini disusun dan dipertanggungjawabkan oleh Tim Tenaga Ahli ${settings.consultant.name} sebagai berikut:`),
    
    emptyLine(),
    
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: rows
    }),
    
    emptyLine(),
    bodyText(`Ditetapkan di: ${proyek.kota || 'Jakarta'}`),
    bodyText(`Tanggal: ${formatTanggal(new Date())}`),
    
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Mengetahui & Mengesahkan,', size: FONT_SIZE_BODY, font: FONT_MAIN }),
        new TextRun({ break: 1 }),
        new TextRun({ text: settings.consultant.name.toUpperCase(), bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN }),
      ]
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: proyek.metadata?.signatures?.director?.status === 'VALID' ? [
            // TTE AKTIF (Dokumen Disahkan)
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "TTE BSrE VERIFIED", size: 12, bold: true, color: "3b82f6" }),
                    new TextRun({ break: 1 }),
                    new TextRun({ text: "Sertifikat Elektronik Aktif", size: 10, color: "1e40af" }),
                    new TextRun({ break: 1 }),
                    new TextRun({ text: `ID: ${proyek.metadata.signatures.director.fingerprint ? proyek.metadata.signatures.director.fingerprint.substring(0, 12).toUpperCase() : 'VALID'}`, size: 9, color: "64748b", font: "Courier New" })
                  ],
                  border: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "3b82f6" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "3b82f6" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "3b82f6" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "3b82f6" },
                  },
                  shading: { fill: "eff6ff" },
                  spacing: { before: 200, after: 200 }
                })
              ],
              verticalAlign: VerticalAlign.CENTER
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Ditandatangani secara elektronik pada:`, size: 10, color: "666666" })], spacing: { before: 200 } }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatTanggal(new Date(proyek.metadata.signatures.director.signed_at)), size: 11, bold: true, color: "333333" })] }),
              ],
              verticalAlign: VerticalAlign.CENTER
            })
          ] : [
            // TTE BELUM AKTIF
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "DRAFT DOKUMEN", size: 12, bold: true, color: "ef4444" }),
                    new TextRun({ break: 1 }),
                    new TextRun({ text: "Belum Diverifikasi TTE", size: 10, color: "991b1b" }),
                  ],
                  border: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "ef4444" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "ef4444" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "ef4444" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "ef4444" },
                  },
                  shading: { fill: "fef2f2" },
                  spacing: { before: 200, after: 200 }
                })
              ],
              verticalAlign: VerticalAlign.CENTER
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Tanda Tangan Asli / TTE)", size: 11, italics: true, color: "666666" })], spacing: { before: 600 } }),
              ]
            })
          ]
        })
      ]
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({ text: (settings.consultant?.director_name || 'NAMA DIREKTUR').toUpperCase(), bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN, underline: {} }),
        new TextRun({ break: 1 }),
        new TextRun({ text: settings.consultant?.director_job || 'Direktur', size: FONT_SIZE_SMALL, font: FONT_MAIN, color: COLOR_MUTED }),
      ]
    }),
    
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `ID Dokumen: ${proyek.id.toUpperCase()}`, size: 14, font: FONT_MAIN, color: "888888" }),
      ]
    }),
  ];
}

// ============================================================
export function renderLampiranA(checklist) {
  const items = (checklist || []).filter(c => (c.catatan && c.catatan !== '-') || (c.rekomendasi) || ['ada_tidak_sesuai', 'buruk', 'kritis'].includes(c.status));

  const tableRows = items.length === 0 
    ? [new TableRow({ children: [dataCell('Tidak ada catatan khusus/dokumentasi lampiran yang perlu direkam.', 100)]})]
    : items.map((item, idx) => new TableRow({
        cantSplit: true,
        children: [
          dataCell(String(idx + 1), 6, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
          dataCell(item.kode || '-', 10, { center: true, bold: true }),
          dataCell(item.nama || '-', 34),
          dataCell(getStatusLabel(item.status), 15, { center: true, bold: true }),
          dataCell(item.catatan || item.hasil || 'Terlampir di folder dokumentasi proyek', 35, { size: FONT_SIZE_SMALL }),
        ]
      }));

  return [
    pageBreak(),
    heading1('LAMPIRAN A: DOKUMENTASI LAPANGAN'),
    bodyText('Pada lampiran ini disertakan matriks catatan fakta lapangan dan dokumentasi komponen-komponen kritis atau anomali yang diobservasi.'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          tableHeader: true, cantSplit: true,
          children: [
            headerCell('NO', 6), headerCell('KODE', 10), headerCell('ELEMEN', 34),
            headerCell('KONDISI', 15), headerCell('KETERANGAN / FOTO REFerensi', 35)
          ]
        }),
        ...(items.length > 0 ? tableRows : [new TableRow({ children: [dataCell('Tidak ada catatan kritis', 100, { center: true })]})])
      ]
    }),
    emptyLine(),
  ];
}

// ============================================================
export function renderLampiranB(settings) {
  const expertsObj = settings?.experts || {};
  const experts = Object.entries(expertsObj).map(([key, val]) => ({
    name: val.name,
    bidang: key === 'architecture' ? 'Arsitektur' : key === 'structure' ? 'Struktur' : 'MEP',
    jabatan: 'Tenaga Ahli',
    skk: val.skk || '-',
    no_registrasi: '-'
  })).filter(e => e.name); // Hanya tampilkan yang ada namanya
  
  const tableRows = experts.map((e, idx) => new TableRow({
    cantSplit: true,
    children: [
      dataCell(String(idx + 1), 5, { center: true }),
      dataCell(e.name || '-', 25, { bold: true }),
      dataCell(e.bidang || '-', 15),
      dataCell(e.jabatan || '-', 15),
      dataCell(e.skk || '-', 20),
      dataCell(e.no_registrasi || '-', 20),
    ]
  }));

  return [
    pageBreak(),
    heading1('LAMPIRAN B: PROFIL TENAGA AHLI'),
    bodyText('Daftar lengkap konsorsium tenaga ahli pemeriksa keandalan bangunan gedung yang menyusun laporan ini berdasarkan kompetensinya.'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          tableHeader: true, cantSplit: true,
          children: [
            headerCell('NO', 5), headerCell('NAMA LENGKAP', 25), headerCell('BIDANG', 15),
            headerCell('JABATAN', 15), headerCell('NO. SKK / SKA', 20), headerCell('NO. REGISTRASI', 20)
          ]
        }),
        ...(experts.length > 0 ? tableRows : [new TableRow({ children: [dataCell('Data tenaga ahli tidak dilampirkan.', 100)]})])
      ]
    }),
    emptyLine(),
  ];
}