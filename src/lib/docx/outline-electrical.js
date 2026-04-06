import {
  createTableBorders, headerCell, dataCell, heading2, heading3,
  bodyText, bulletItem, emptyLine, horizontalLine, pageBreak,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_SMALL,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_MUTED,
  Table, TableRow, Paragraph, TextRun, WidthType, AlignmentType
} from './utils.js';

/**
 * Render Electrical System Inspection Section for DOCX
 * Based on PUIL 2020, SNI 0225:2011, IEC 60364
 */
export function renderElectricalSystemSection(electricalData = {}) {
  const {
    panels = [],
    measurements = [],
    thermalImages = [],
    complianceChecks = [],
    summary = {}
  } = electricalData;

  const hasData = panels.length > 0;

  if (!hasData) {
    return [
      heading2('3.6. Pemeriksaan Sistem Kelistrikan'),
      bodyText(
        'Data pemeriksaan sistem kelistrikan belum tersedia. Pemeriksaan sistem kelistrikan mencakup evaluasi pembebanan, thermal imaging, analisis proteksi, dan compliance check berdasarkan PUIL 2020, SNI 0225:2011, dan IEC 60364.'
      ),
      emptyLine(),
    ];
  }

  // Calculate statistics
  const safePanels = panels.filter(p => {
    const latestMeas = measurements.find(m => m.panel_id === p.id);
    return latestMeas?.loading_status === 'SAFE';
  }).length;

  const warningPanels = panels.filter(p => {
    const latestMeas = measurements.find(m => m.panel_id === p.id);
    return latestMeas?.loading_status === 'WARNING';
  }).length;

  const overloadPanels = panels.filter(p => {
    const latestMeas = measurements.find(m => m.panel_id === p.id);
    return latestMeas?.loading_status === 'OVERLOAD';
  }).length;

  const criticalHotspots = thermalImages.filter(t => t.temp_max > 70).length;
  const warningHotspots = thermalImages.filter(t => t.temp_max > 45 && t.temp_max <= 70).length;

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
          dataCell('Total Panel Terinspeksi', 40, { bold: true }),
          dataCell(String(panels.length), 30, { center: true }),
          dataCell('Normal', 30, { center: true, color: COLOR_SUCCESS }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Panel Loading Normal (≤80%)', 40, { bold: true }),
          dataCell(String(safePanels), 30, { center: true }),
          dataCell(safePanels > 0 ? 'Aman' : '-', 30, { center: true, color: safePanels > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Panel Loading Warning (>80%)', 40, { bold: true }),
          dataCell(String(warningPanels), 30, { center: true }),
          dataCell(warningPanels > 0 ? 'Perlu Monitoring' : '-', 30, { center: true, color: warningPanels > 0 ? COLOR_WARNING : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Panel Overload (>100%)', 40, { bold: true }),
          dataCell(String(overloadPanels), 30, { center: true }),
          dataCell(overloadPanels > 0 ? 'Kritis' : '-', 30, { center: true, color: overloadPanels > 0 ? COLOR_DANGER : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Hotspot Kritis (>70°C)', 40, { bold: true }),
          dataCell(String(criticalHotspots), 30, { center: true }),
          dataCell(criticalHotspots > 0 ? 'Immediate Action' : '-', 30, { center: true, color: criticalHotspots > 0 ? COLOR_DANGER : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Hotspot Warning (>45°C)', 40, { bold: true }),
          dataCell(String(warningHotspots), 30, { center: true }),
          dataCell(warningHotspots > 0 ? 'Waspada' : '-', 30, { center: true, color: warningHotspots > 0 ? COLOR_WARNING : COLOR_MUTED }),
        ],
      }),
    ],
  });

  // Panel details table
  const panelRows = panels.map((panel, idx) => {
    const latestMeas = measurements
      .filter(m => m.panel_id === panel.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const loadingStatus = latestMeas?.loading_status || 'NO DATA';
    const loadingPct = latestMeas?.loading_percentage?.toFixed(1) || '-';
    const current = latestMeas?.current?.toFixed(1) || '-';

    let statusColor = COLOR_MUTED;
    if (loadingStatus === 'SAFE') statusColor = COLOR_SUCCESS;
    else if (loadingStatus === 'WARNING') statusColor = COLOR_WARNING;
    else if (loadingStatus === 'OVERLOAD') statusColor = COLOR_DANGER;

    return new TableRow({
      children: [
        dataCell(panel.name || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(panel.type || '-', 15, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(panel.location || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${panel.mcb_rating || '-'} A`, 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${current} A`, 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${loadingPct}%`, 11, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(loadingStatus, 10, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const panelTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('NAMA PANEL', 20),
          headerCell('TIPE', 15),
          headerCell('LOKASI', 20),
          headerCell('MCB RATING', 12),
          headerCell('ARUS', 12),
          headerCell('LOADING', 11),
          headerCell('STATUS', 10),
        ],
      }),
      ...panelRows,
    ],
  });

  // Thermal analysis section
  const thermalRows = thermalImages
    .sort((a, b) => b.temp_max - a.temp_max)
    .slice(0, 10)
    .map((img, idx) => {
      const panel = panels.find(p => p.id === img.panel_id);
      let statusColor = COLOR_SUCCESS;
      let status = 'Normal';
      if (img.temp_max > 90) {
        statusColor = COLOR_DANGER;
        status = 'Darurat';
      } else if (img.temp_max > 70) {
        statusColor = COLOR_DANGER;
        status = 'Kritis';
      } else if (img.temp_max > 45) {
        statusColor = COLOR_WARNING;
        status = 'Waspada';
      }

      return new TableRow({
        children: [
          dataCell(img.component || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(panel?.name || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(`${img.temp_max?.toFixed(1) || '-'}°C`, 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(`${img.temp_ref?.toFixed(1) || '-'}°C`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(`${((img.temp_max - (img.temp_ref || 25)) / (img.temp_ref || 25) * 100).toFixed(0)}%`, 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(status, 10, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        ],
      });
    });

  const thermalTable = thermalRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('KOMPONEN', 25),
          headerCell('PANEL', 25),
          headerCell('SUHU MAX', 15),
          headerCell('SUHU REF', 15),
          headerCell('ΔT', 10),
          headerCell('STATUS', 10),
        ],
      }),
      ...thermalRows,
    ],
  }) : null;

  // Compliance findings
  const complianceRows = complianceChecks
    .filter(c => c.status !== 'PASS')
    .slice(0, 5)
    .map((check, idx) => {
      const statusColor = check.status === 'FAIL' ? COLOR_DANGER : COLOR_WARNING;
      return new TableRow({
        children: [
          dataCell(check.standard_id || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(check.category || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(check.message || '-', 35, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(check.status, 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
          dataCell(check.recommendation || '-', 10, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        ],
      });
    });

  const complianceTable = complianceRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('STANDAR', 20),
          headerCell('KATEGORI', 20),
          headerCell('TEMUAN', 35),
          headerCell('STATUS', 15),
          headerCell('REKOMENDASI', 10),
        ],
      }),
      ...complianceRows,
    ],
  }) : null;

  return [
    heading2('3.6. Pemeriksaan Sistem Kelistrikan'),
    
    bodyText(
      'Pemeriksaan sistem kelistrikan dilakukan berdasarkan Persyaratan Umum Instalasi Listrik (PUIL) 2020, SNI 0225:2011, dan IEC 60364. Evaluasi mencakup analisis pembebanan panel, thermal imaging, koordinasi proteksi, dan compliance check.'
    ),

    heading3('3.6.1. Ringkasan Status Sistem Kelistrikan'),
    summaryTable,
    emptyLine(),

    heading3('3.6.2. Detail Panel dan Loading Analysis'),
    bodyText('Berikut adalah daftar panel yang telah diinspeksi beserta status pembebanannya:'),
    panelTable,
    emptyLine(),

    ...(thermalTable ? [
      heading3('3.6.3. Analisis Thermal (Infrared Thermography)'),
      bodyText('Hasil pengukuran suhu dengan kamera thermal menunjukkan area-area dengan potensi overheating:'),
      thermalTable,
      emptyLine(),
    ] : []),

    ...(complianceTable ? [
      heading3('3.6.4. Compliance Check dan Temuan'),
      bodyText('Temuan ketidaksesuaian terhadap standar yang berlaku:'),
      complianceTable,
      emptyLine(),
    ] : [
      heading3('3.6.4. Compliance Check'),
      bodyText('Seluruh parameter pemeriksaan telah memenuhi persyaratan standar PUIL 2020, SNI 0225:2011, dan IEC 60364. Tidak ditemukan ketidaksesuaian kritis pada sistem kelistrikan.'),
      emptyLine(),
    ]),

    heading3('3.6.5. Rekomendasi Teknis'),
    ...(overloadPanels > 0 ? [
      bulletItem(`Ditemukan ${overloadPanels} panel dengan kondisi overload (>100% loading). Direkomendasikan segera melakukan redistribusi beban atau upgrade MCB sesuai perhitungan demand factor.`),
    ] : []),
    ...(warningPanels > 0 ? [
      bulletItem(`${warningPanels} panel berada pada kondisi warning (>80% loading). Perlu monitoring intensif dan evaluasi penambahan beban di masa depan.`),
    ] : []),
    ...(criticalHotspots > 0 ? [
      bulletItem(`Ditemukan ${criticalHotspots} hotspot kritis dengan suhu >70°C. Segera lakukan pemeriksaan koneksi, terminasi, dan kemungkinan adanya kabel yang undersized.`),
    ] : []),
    ...(criticalHotspots === 0 && overloadPanels === 0 && warningPanels === 0 ? [
      bulletItem('Sistem kelistrikan beroperasi dalam kondisi normal. Tidak ditemukan indikasi overload maupun hotspot kritis.'),
    ] : []),
    bulletItem('Direkomendasikan pemeriksaan berkala 6 bulan sekali untuk memastikan stabilitas sistem.'),
    bulletItem('Untuk panel dengan beban kritis, disarankan instalasi power quality meter untuk monitoring real-time.'),

    emptyLine(),
    horizontalLine(),
  ];
}
