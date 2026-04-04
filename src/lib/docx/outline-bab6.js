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
export function renderBab6(analisis, proyek) {
  const statusText = getStatusSLFLabel(analisis?.status_slf);
  const skor = analisis?.skor_total || 0;

  // =========================
  // AI INTERPRETASI (TETAP + DIPERKUAT)
  // =========================
  let interpretasi = '';
  if (analisis?.status_slf === 'LAIK_FUNGSI') {
    interpretasi = `Berdasarkan hasil evaluasi mendalam terhadap seluruh aspek kelaikan fungsi, bangunan gedung "${safeText(proyek?.nama_bangunan || '')}" dinyatakan memenuhi persyaratan teknis sesuai PP No. 16 Tahun 2021. Skor kepatuhan total mencapai ${skor}/100 yang mengindikasikan kesiapan operasional penuh. Bangunan dapat dioperasikan dan diterbitkan Sertifikat Laik Fungsi (SLF). Sistem AI tidak mengidentifikasi adanya risiko signifikan yang dapat mempengaruhi keandalan bangunan dalam jangka pendek maupun menengah.`;
  } else if (analisis?.status_slf === 'LAIK_FUNGSI_BERSYARAT') {
    interpretasi = `Berdasarkan hasil evaluasi mendalam, bangunan gedung "${safeText(proyek?.nama_bangunan || '')}" dinyatakan layak secara bersyarat dengan skor kepatuhan ${skor}/100. Terdapat beberapa ketidaksesuaian minor hingga sedang yang tidak secara langsung mengganggu keselamatan utama, namun berpotensi berkembang menjadi risiko lebih besar apabila tidak segera ditindaklanjuti. Bangunan dapat beroperasi dengan syarat seluruh rekomendasi teknis dilaksanakan dalam batas waktu yang ditentukan.`;
  } else {
    interpretasi = `Berdasarkan hasil evaluasi mendalam, bangunan gedung "${safeText(proyek?.nama_bangunan || '')}" BELUM memenuhi persyaratan kelaikan fungsi dengan skor kepatuhan ${skor}/100. Sistem AI mengidentifikasi adanya kondisi kritis yang berpotensi menyebabkan kegagalan sistem atau membahayakan keselamatan penghuni. Bangunan TIDAK DAPAT diterbitkan SLF sampai seluruh temuan kritis ditindaklanjuti melalui program rehabilitasi, retrofit, atau penguatan struktur secara menyeluruh.`;
  }

  // =========================
  // AI TIMEFRAME ENGINE
  // =========================
  const getTimeline = (prioritas) => {
    const p = String(prioritas || '').toLowerCase();
    if (['kritis'].includes(p)) return 'SEGERA (0–7 Hari)';
    if (['tinggi'].includes(p)) return 'MAKS. 30 Hari';
    if (['sedang'].includes(p)) return '1–3 Bulan';
    if (['rendah'].includes(p)) return '3–6 Bulan';
    return '-';
  };

  // =========================
  // LOAD REKOMENDASI
  // =========================
  let rekomendasi = [];
  try {
    rekomendasi = typeof analisis?.rekomendasi === 'string'
      ? JSON.parse(analisis.rekomendasi)
      : (analisis?.rekomendasi || []);
  } catch (e) { }

  // =========================
  // AI SORTING (PENTING!)
  // =========================
  const priorityRank = { kritis: 1, tinggi: 2, sedang: 3, rendah: 4 };

  rekomendasi.sort((a, b) => {
    const pa = priorityRank[(a.prioritas || '').toLowerCase()] || 5;
    const pb = priorityRank[(b.prioritas || '').toLowerCase()] || 5;
    return pa - pb;
  });

  // =========================
  // GROUPING
  // =========================
  const p1 = rekomendasi.filter(r => ['kritis', 'tinggi'].includes(r.prioritas?.toLowerCase()));
  const p2 = rekomendasi.filter(r => r.prioritas?.toLowerCase() === 'sedang');
  const p3 = rekomendasi.filter(r => r.prioritas?.toLowerCase() === 'rendah');

  // =========================
  // RENDER GROUP (DITAMBAH AI INFO)
  // =========================
  const renderGroup = (title, items) => {
    if (items.length === 0) return [];
    const result = [heading3(title)];

    result.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('NO', 6),
            headerCell('ASPEK', 14),
            headerCell('TINDAKAN', 35),
            headerCell('STANDAR ACUAN', 15),
            headerCell('PRIORITAS', 10),
            headerCell('WAKTU', 10),
            headerCell('KETERANGAN TEKNIS', 10),
          ],
        }),
        ...items.map((r, idx) => new TableRow({
          children: [
            dataCell(String(idx + 1), 6, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(safeText(r.aspek || '-'), 14, { bold: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(safeText(`${r.judul || ''}: ${r.tindakan || ''}`), 35, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(safeText(r.standar || '-'), 15, { italics: true, color: COLOR_MUTED, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(safeText(r.prioritas || '-').toUpperCase(), 10, {
              center: true, bold: true,
              color: ['kritis', 'tinggi'].includes(r.prioritas?.toLowerCase()) ? COLOR_DANGER
                : r.prioritas?.toLowerCase() === 'sedang' ? COLOR_WARNING
                  : COLOR_SUCCESS,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(getTimeline(r.prioritas), 10, { center: true }),
            dataCell(
              r.prioritas === 'kritis'
                ? 'Risiko keselamatan'
                : r.prioritas === 'tinggi'
                  ? 'Gangguan operasional'
                  : r.prioritas === 'sedang'
                    ? 'Penurunan kinerja'
                    : 'Pemeliharaan',
              10
            ),
          ],
        })),
      ],
    }));

    return result;
  };

  // =========================
  // OUTPUT
  // =========================
  const result = [
    heading1('BAB VI: KESIMPULAN DAN REKOMENDASI'),

    heading2('6.1. Kesimpulan Kelaikan Fungsi'),
    bodyText(interpretasi),

    emptyLine(),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: `STATUS: ${statusText}`,
                    bold: true,
                    size: FONT_SIZE_H1,
                    color:
                      analisis?.status_slf === 'LAIK_FUNGSI' ? COLOR_SUCCESS :
                        analisis?.status_slf === 'LAIK_FUNGSI_BERSYARAT' ? COLOR_WARNING :
                          COLOR_DANGER
                  })]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: `Skor Kepatuhan: ${skor}/100  |  Risiko: ${getRiskLabel(analisis?.risk_level).toUpperCase()}`,
                    size: FONT_SIZE_H3,
                    color: COLOR_SUBHEADING
                  })]
                })
              ]
            }),
          ],
        }),
      ],
    }),

    emptyLine(),

    heading2('6.2. Interpretasi Skor'),
    bodyText(`Skor total ${skor}/100 merupakan representasi kuantitatif dari tingkat kepatuhan terhadap standar teknis serta tingkat risiko yang teridentifikasi. Nilai ini dihasilkan melalui integrasi evaluasi berbasis aturan (NSPK), analisis risiko, dan reasoning AI.`),

    emptyLine(),

    heading2('6.3. Daftar Rekomendasi Teknis'),
    bodyText('Rekomendasi berikut disusun berdasarkan prioritas risiko dan urgensi tindakan untuk menjamin keselamatan, keandalan, dan keberlanjutan operasional bangunan.'),

    ...renderGroup('Prioritas 1: URGENT (Kritis/Tinggi)', p1),
    ...renderGroup('Prioritas 2: Jangka Pendek (Sedang)', p2),
    ...renderGroup('Prioritas 3: Jangka Menengah (Rendah)', p3),
  ];

  if (rekomendasi.length === 0) {
    result.push(bodyText('Tidak ditemukan temuan kritis yang memerlukan tindakan prioritas. Bangunan dalam kondisi memadai.'));
  }

  return result;
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