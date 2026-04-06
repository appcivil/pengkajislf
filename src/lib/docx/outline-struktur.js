import {
  createTableBorders, headerCell, dataCell, heading2, heading3,
  bodyText, bulletItem, emptyLine, horizontalLine,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_SMALL,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_MUTED,
  Table, TableRow, Paragraph, TextRun, WidthType, AlignmentType
} from './utils.js';

/**
 * Render Struktur Bangunan (Building Structure) Section for DOCX
 * Based on ASCE 41-17, SNI 1726:2019, NDT Tests
 */
export function renderStrukturBangunanSection(strukturData = {}) {
  const {
    ndtRebound = { count: 0, results: [] },
    ndtUPV = { count: 0, results: [] },
    tierEvaluation = {},
    seismic = {},
    hasData = false
  } = strukturData;

  if (!hasData) {
    return [
      heading2('3.5. Pemeriksaan Struktur Bangunan'),
      bodyText(
        'Data pemeriksaan struktur bangunan belum tersedia. Pemeriksaan struktur mencakup evaluasi ketahanan gempa berdasarkan ASCE 41-17, pengujian material NDT/MDT, analisis seismik SNI 1726:2019, dan pushover analysis.'
      ),
      emptyLine(),
    ];
  }

  // Summary table
  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('PARAMETER', 40),
          headerCell('NILAI', 30),
          headerCell('STATUS', 30),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Jumlah Pengujian NDT', 40, { bold: true }),
          dataCell(String(ndtRebound.count + ndtUPV.count), 30, { center: true }),
          dataCell(ndtRebound.count + ndtUPV.count > 0 ? 'Tersedia' : '-', 30, { center: true, color: ndtRebound.count + ndtUPV.count > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Rebound Hammer Test', 40, { bold: true }),
          dataCell(String(ndtRebound.count), 30, { center: true }),
          dataCell(ndtRebound.count > 0 ? 'Complete' : '-', 30, { center: true, color: ndtRebound.count > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Ultrasonic Pulse Velocity (UPV)', 40, { bold: true }),
          dataCell(String(ndtUPV.count), 30, { center: true }),
          dataCell(ndtUPV.count > 0 ? 'Complete' : '-', 30, { center: true, color: ndtUPV.count > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Skor Kelayakan Rata-rata', 40, { bold: true }),
          dataCell(`${Math.round((ndtRebound.avgScore + ndtUPV.avgScore) / 2 || 0)}%`, 30, { center: true }),
          dataCell((ndtRebound.avgScore + ndtUPV.avgScore) / 2 >= 70 ? 'Laik' : 'Perlu Perhatian', 30, { center: true, color: (ndtRebound.avgScore + ndtUPV.avgScore) / 2 >= 70 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
    ],
  });

  // NDT Rebound Results table
  const reboundRows = ndtRebound.results.slice(0, 5).map((result, idx) => {
    const strength = result.compressiveStrength || 0;
    const status = strength >= 20 ? 'Kuat' : strength >= 15 ? 'Sedang' : 'Lemah';
    const statusColor = strength >= 20 ? COLOR_SUCCESS : strength >= 15 ? COLOR_WARNING : COLOR_DANGER;

    return new TableRow({
      children: [
        dataCell(result.name || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${result.reboundNumber?.toFixed(1) || '-'}`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${result.carbonationDepth?.toFixed(1) || '-'} mm`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${result.age || '-'} hari`, 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${strength.toFixed(1)} MPa`, 18, { center: true, bold: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(status, 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const reboundTable = reboundRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('LOKASI UJI', 25),
          headerCell('REBOUND NO.', 15),
          headerCell('KARBONASI', 15),
          headerCell('UMUR', 12),
          headerCell('KEKUATAN', 18),
          headerCell('STATUS', 15),
        ],
      }),
      ...reboundRows,
    ],
  }) : null;

  // UPV Results table
  const upvRows = ndtUPV.results.slice(0, 5).map((result, idx) => {
    const velocity = result.pulseVelocity || 0;
    let quality = result.quality || 'Unknown';
    let statusColor = COLOR_MUTED;
    if (velocity >= 4.0) { quality = 'Sangat Baik'; statusColor = COLOR_SUCCESS; }
    else if (velocity >= 3.5) { quality = 'Baik'; statusColor = COLOR_SUCCESS; }
    else if (velocity >= 3.0) { quality = 'Cukup'; statusColor = COLOR_WARNING; }
    else if (velocity >= 2.5) { quality = 'Kurang'; statusColor = COLOR_WARNING; }
    else { quality = 'Buruk'; statusColor = COLOR_DANGER; }

    return new TableRow({
      children: [
        dataCell(result.name || '-', 30, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${velocity.toFixed(2)} km/s`, 20, { center: true, bold: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(result.compressiveStrength ? `${result.compressiveStrength.toFixed(1)} MPa` : '-', 25, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(quality, 25, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const upvTable = upvRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('LOKASI UJI', 30),
          headerCell('PULSE VELOCITY', 20),
          headerCell('KEKUATAN EST.', 25),
          headerCell('KUALITAS', 25),
        ],
      }),
      ...upvRows,
    ],
  }) : null;

  // Tier evaluation status
  const tierRows = [
    {
      name: 'Tier 1: Screening',
      completed: tierEvaluation.tier1?.completed || false,
      needsTier2: tierEvaluation.tier1?.needsTier2 || false,
      description: 'Evaluasi screening awal berdasarkan checklis visual dan dokumentasi'
    },
    {
      name: 'Tier 2: Evaluation',
      completed: tierEvaluation.tier2?.completed || false,
      needsTier2: false,
      description: 'Analisis linear statik dan dinamik, verifikasi komponen struktur'
    },
    {
      name: 'Tier 3: Detailed',
      completed: tierEvaluation.tier3?.completed || false,
      needsTier2: false,
      description: 'Analisis non-linear (pushover), model elemen hingga, rehabilitasi'
    }
  ].map((tier, idx) => {
    const status = tier.completed ? 'Complete' : 'Pending';
    const statusColor = tier.completed ? COLOR_SUCCESS : COLOR_WARNING;
    return new TableRow({
      children: [
        dataCell(tier.name, 25, { bold: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(tier.description, 50, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(status, 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(tier.needsTier2 ? 'Required' : '-', 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const tierTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('ASCE 41-17 TIER', 25),
          headerCell('DESKRIPSI', 50),
          headerCell('STATUS', 15),
          headerCell('NEXT', 10),
        ],
      }),
      ...tierRows,
    ],
  });

  return [
    heading2('3.5. Pemeriksaan Struktur Bangunan'),
    
    bodyText(
      'Pemeriksaan struktur bangunan dilakukan berdasarkan ASCE 41-17 (Seismic Evaluation and Retrofit of Existing Buildings), SNI 1726:2019 (Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung dan Non Gedung), serta pengujian NDT (Non-Destructive Testing) untuk evaluasi kondisi material beton.'
    ),

    heading3('3.5.1. Ringkasan Status Struktur'),
    summaryTable,
    emptyLine(),

    heading3('3.5.2. Evaluasi Tier ASCE 41-17'),
    bodyText('Proses evaluasi ketahanan gempa mengikuti ketiga tier sistem ASCE 41-17:'),
    tierTable,
    emptyLine(),

    ...(reboundTable ? [
      heading3('3.5.3. Hasil Uji Rebound Hammer (NDT)'),
      bodyText('Pengujian kekerasan permukaan beton dengan Schmidt Hammer mengikuti ASTM C805:'),
      reboundTable,
      emptyLine(),
    ] : []),

    ...(upvTable ? [
      heading3('3.5.4. Hasil Uji Ultrasonic Pulse Velocity (UPV)'),
      bodyText('Pengujian kecepatan gelombang ultrasonik melalui beton mengikuti ASTM C597:'),
      upvTable,
      emptyLine(),
    ] : []),

    heading3('3.5.5. Rekomendasi Teknis Struktur'),
    ...((ndtRebound.avgScore + ndtUPV.avgScore) / 2 < 70 ? [
      bulletItem('Kekuatan beton hasil uji NDT menunjukkan nilai di bawah standar SNI. Direkomendasikan evaluasi struktur detail dan perhitungan kapasitas elemen struktur.'),
    ] : []),
    ...((ndtRebound.avgScore + ndtUPV.avgScore) / 2 >= 70 ? [
      bulletItem('Kondisi struktur umum dalam kategori baik berdasarkan hasil pengujian NDT. Kekuatan beton memenuhi persyaratan desain awal.'),
    ] : []),
    ...(ndtRebound.count === 0 && ndtUPV.count === 0 ? [
      bulletItem('Belum tersedia data pengujian NDT. Direkomendasikan melakukan Schmidt Hammer Test dan UPV Test pada elemen struktur kritis.'),
    ] : []),
    bulletItem('Verifikasi tier evaluation ASCE 41-17 untuk menentukan kebutuhan analisis seismik lebih lanjut.'),
    bulletItem('Untuk bangunan di wilayah seismic tinggi, direkomendasikan analisis pushover (Tier 3) untuk evaluasi performa gempa.'),
    ...(tierEvaluation.tier1?.needsTier2 ? [
      bulletItem('Hasil Tier 1 menunjukkan indikasi ketidaksesuaian. Wajib dilanjutkan ke Tier 2 Evaluation untuk verifikasi teknis.'),
    ] : []),

    emptyLine(),
    horizontalLine(),
  ];
}
