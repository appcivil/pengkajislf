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
// ============================================================
export function renderBab2() {

  // =========================
  // AI PIPELINE FLOW
  // =========================
  const aiPipeline = [
    'Input Data (Dokumen + Checklist + Lapangan)',
    'Validasi & Normalisasi Data',
    'Klasifikasi Status (Rule-Based Engine)',
    'Analisis Risiko (Risk Matrix)',
    'AI Reasoning (Interpretasi Teknis)',
    'Scoring & Evaluasi Kelaikan',
    'Rekomendasi & Output SLF'
  ];

  // =========================
  // METODE INTI (UPGRADED)
  // =========================
  const metodeRows = [
    [
      'Verifikasi Administratif',
      'Validasi dokumen PBG/IMB, as-built drawing, fungsi bangunan, dan riwayat pemeliharaan sebagai baseline pemeriksaan (terkait BAB III.1).'
    ],
    [
      'Observasi Visual Terstruktur',
      'Inspeksi berbasis checklist per sub-item (TB, S, F, H, E) untuk mendeteksi kerusakan, ketidaksesuaian, dan degradasi material.'
    ],
    [
      'Fact vs Design Analysis',
      'Perbandingan kondisi eksisting dengan gambar rencana dan as-built drawing untuk mendeteksi deviasi teknis.'
    ],
    [
      'Pengujian Teknis & NDT',
      'Penggunaan alat uji (hammer test, UPV, lux meter, dll) untuk validasi kondisi teknis (input ke BAB IV).'
    ],
    [
      'AI-Assisted Reasoning',
      'Interpretasi hasil pemeriksaan menggunakan rule-based + risk-based engine untuk menghasilkan analisis teknis (BAB IV).'
    ],
    [
      'Risk & Scoring Evaluation',
      'Perhitungan tingkat risiko dan skor kepatuhan berbobot untuk menentukan status SLF (BAB V).'
    ],
    [
      'Rekomendasi Berbasis Risiko',
      'Penentuan tindakan teknis berdasarkan prioritas risiko (BAB VI).'
    ]
  ];

  // =========================
  // OUTPUT TERINTEGRASI
  // =========================
  const outputRows = [
    ['BAB III', 'Data checklist terstruktur per sub-item (TB, S, F, H, E)'],
    ['BAB IV', 'Analisis mendalam + dampak + risiko'],
    ['BAB V', 'Perhitungan skor dan evaluasi kelaikan'],
    ['BAB VI', 'Kesimpulan SLF dan rekomendasi teknis'],
  ];

  return [

    heading1('BAB II: METODOLOGI PEMERIKSAAN TERINTEGRASI'),

    bodyText(
      'Metodologi pemeriksaan ini disusun sebagai sistem evaluasi terintegrasi berbasis data, yang menghubungkan proses pengumpulan data lapangan dengan analisis berbasis Norma, Standar, Peraturan dan Ketentuan (NSPK), evaluasi risiko, serta penentuan status kelaikan fungsi bangunan gedung.'
    ),

    bodyText(
      'Pendekatan ini memastikan bahwa setiap temuan pada BAB III tidak hanya dicatat, tetapi dianalisis secara sistematis pada BAB IV, dihitung secara kuantitatif pada BAB V, dan diterjemahkan menjadi keputusan teknis pada BAB VI.'
    ),

    // =========================
    // 2.1 AI PIPELINE
    // =========================
    heading2('2.1. Arsitektur Metodologi'),

    bodyText(
      'Metodologi ini menggunakan pendekatan pipeline berbasis AI untuk memastikan keterhubungan antar tahapan pemeriksaan.'
    ),

    ...aiPipeline.flatMap((step, i) => [
      bulletItem(`${i + 1}. ${step}`)
    ]),

    bodyText(
      'Setiap tahapan dalam pipeline ini memiliki keterkaitan langsung dengan struktur laporan, sehingga memastikan konsistensi antara data, analisis, dan keputusan teknis.'
    ),

    // =========================
    // 2.2 PENDEKATAN ANALISIS
    // =========================
    heading2('2.2. Pendekatan Analisis'),

    bodyText(
      'Pendekatan pemeriksaan menggunakan kombinasi multi-layer analysis yang terdiri dari:'
    ),

    bulletItem('Rule-Based Analysis → berdasarkan NSPK, SNI, dan regulasi'),
    bulletItem('Risk-Based Analysis → berdasarkan tingkat keparahan temuan'),
    bulletItem('Performance-Based Analysis → berdasarkan dampak terhadap fungsi bangunan'),

    bodyText(
      'Pendekatan ini memungkinkan sistem untuk tidak hanya mendeteksi masalah, tetapi juga memahami implikasi teknisnya terhadap keselamatan, kesehatan, kenyamanan, dan kemudahan bangunan.'
    ),

    // =========================
    // 2.3 STRUKTUR PEMERIKSAAN
    // =========================
    heading2('2.3. Struktur Pemeriksaan Berbasis Sub-Item'),

    bodyText(
      'Pemeriksaan dilakukan secara granular berdasarkan sub-item teknis yang telah distandarisasi, sehingga memungkinkan analisis mendalam pada setiap elemen bangunan.'
    ),

    bulletItem('Tata Bangunan (TB-01 s/d TB-14)'),
    bulletItem('Struktur (S-01 s/d S-06)'),
    bulletItem('Proteksi Kebakaran (F-01 s/d F-07)'),
    bulletItem('Kesehatan Bangunan (H-01 s/d H-08)'),
    bulletItem('Kemudahan & Aksesibilitas (E-01 s/d E-06)'),

    bodyText(
      'Setiap sub-item menjadi unit analisis utama yang akan diproses pada BAB III (data), BAB IV (Analisis), dan BAB V (scoring).'
    ),

    // =========================
    // 2.4 METODE PEMERIKSAAN
    // =========================
    heading2('2.4. Metode Pemeriksaan'),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('METODE', 25),
            headerCell('PENJELASAN', 75),
          ],
        }),
        ...metodeRows.map((row, idx) =>
          new TableRow({
            children: [
              dataCell(row[0], 25, {
                bold: true,
                shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
              }),
              dataCell(row[1], 75, {
                shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
              }),
            ],
          })
        ),
      ],
    }),

    // =========================
    // 2.5 FLOW KE BAB LAIN
    // =========================
    heading2('2.5. Integrasi Antar BAB'),

    bodyText(
      'Metodologi ini dirancang agar setiap tahapan memiliki output yang langsung digunakan pada bab berikutnya.'
    ),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('OUTPUT', 30),
            headerCell('DIGUNAKAN PADA', 70),
          ],
        }),
        ...outputRows.map((row, idx) =>
          new TableRow({
            children: [
              dataCell(row[0], 30, {
                bold: true,
                shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
              }),
              dataCell(row[1], 70, {
                shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
              }),
            ],
          })
        ),
      ],
    }),

    // =========================
    // 2.6 VALIDASI & KONTROL
    // =========================
    heading2('2.6. Validasi dan Quality Control'),

    bulletItem('Validasi manual oleh tenaga ahli (human-in-the-loop)'),
    bulletItem('Cross-check antar data (dokumen vs lapangan)'),
    bulletItem('Penanganan data tidak lengkap → status "belum terverifikasi"'),
    bulletItem('Audit trail dokumentasi (foto, catatan, hasil uji)'),

    // =========================
    // 2.7 ASUMSI
    // =========================
    heading2('2.7. Batasan dan Asumsi'),

    bulletItem('Data tidak lengkap → dianalisis secara konservatif'),
    bulletItem('Elemen tidak dapat diakses → dikategorikan unknown'),
    bulletItem('Tidak ada uji → mengandalkan visual + evidence'),
    bulletItem('Perbedaan desain → dianggap ketidaksesuaian'),

    bodyText(
      'Dengan metodologi ini, seluruh proses pemeriksaan menjadi terstruktur, dapat ditelusuri, dan terintegrasi penuh dengan sistem analisis.'
    ),

    emptyLine(),
    horizontalLine(),
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