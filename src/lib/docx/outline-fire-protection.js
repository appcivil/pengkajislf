import {
  createTableBorders, headerCell, dataCell, heading2, heading3,
  bodyText, bulletItem, numberedItem, emptyLine, horizontalLine, pageBreak,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_SMALL,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_MUTED, COLOR_INFO,
  Table, TableRow, Paragraph, TextRun, WidthType, AlignmentType
} from './utils.js';

/**
 * Render Fire Protection & Life Safety Section for DOCX
 * Based on SNI 03-1735-2004, SNI 03-1745-2000, NFPA 13/101
 */
export function renderFireProtectionSection(fireData = {}) {
  const {
    assets = [],
    inspections = [],
    summary = {}
  } = fireData;

  const hasData = summary.total_assets > 0 || assets.length > 0;

  if (!hasData) {
    return [
      heading2('3.11. Pemeriksaan Fire Protection & Life Safety'),
      bodyText(
        'Data pemeriksaan sistem proteksi kebakaran belum tersedia. Pemeriksaan mencakup APAR, hydrant, sprinkler, detektor asap/heat, dan analisis risiko kebakaran berdasarkan SNI 03-1735-2004, SNI 03-1745-2000, dan NFPA 13/101.'
      ),
      emptyLine(),
    ];
  }

  // Statistics
  const aparCount = summary.apar_count || 0;
  const hydrantCount = summary.hydrant_count || 0;
  const sprinklerCount = summary.sprinkler_count || 0;
  const detectorCount = summary.detector_count || 0;
  const complianceRate = summary.compliance_rate || 0;
  const recentFailures = summary.recent_failures || 0;
  
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
          dataCell('Total Aset Fire Protection', 40, { bold: true }),
          dataCell(String(summary.total_assets || 0), 30, { center: true }),
          dataCell((summary.total_assets || 0) > 0 ? 'OK' : '-', 30, { center: true, color: (summary.total_assets || 0) > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('APAR (Alat Pemadam Ringan)', 40, { bold: true }),
          dataCell(String(aparCount), 30, { center: true }),
          dataCell(aparCount > 0 ? 'OK' : 'CHECK', 30, { center: true, color: aparCount > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Hydrant Box & Hose', 40, { bold: true }),
          dataCell(String(hydrantCount), 30, { center: true }),
          dataCell(hydrantCount > 0 ? 'OK' : 'CHECK', 30, { center: true, color: hydrantCount > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Sprinkler System', 40, { bold: true }),
          dataCell(String(sprinklerCount), 30, { center: true }),
          dataCell(sprinklerCount > 0 ? 'OK' : 'OPTIONAL', 30, { center: true, color: sprinklerCount > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Smoke/Heat Detector', 40, { bold: true }),
          dataCell(String(detectorCount), 30, { center: true }),
          dataCell(detectorCount > 0 ? 'OK' : 'CHECK', 30, { center: true, color: detectorCount > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Compliance Rate', 40, { bold: true }),
          dataCell(`${complianceRate}%`, 30, { center: true }),
          dataCell(complianceRate >= 90 ? 'EXCELLENT' : complianceRate >= 70 ? 'GOOD' : complianceRate >= 50 ? 'NEEDS WORK' : 'CRITICAL', 30, { center: true, bold: true, color: complianceRate >= 70 ? COLOR_SUCCESS : complianceRate >= 50 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Recent Failures (30 days)', 40, { bold: true }),
          dataCell(String(recentFailures), 30, { center: true }),
          dataCell(recentFailures === 0 ? 'OK' : `${recentFailures} ISSUES`, 30, { center: true, bold: true, color: recentFailures === 0 ? COLOR_SUCCESS : COLOR_DANGER }),
        ],
      }),
    ],
  });

  // Assets detail table
  const assetRows = assets.slice(0, 20).map((asset, idx) => {
    const statusColor = asset.status === 'PASS' ? COLOR_SUCCESS :
                       asset.status === 'FAIL' ? COLOR_DANGER : COLOR_WARNING;

    return new TableRow({
      children: [
        dataCell(asset.asset_type || '-', 15, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(asset.location || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(asset.capacity || asset.rating || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(asset.manufacturer || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(new Date(asset.last_inspection).toLocaleDateString('id-ID') || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(asset.status || '-', 10, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const assetTable = assetRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TIPE', 15),
          headerCell('LOKASI', 25),
          headerCell('KAPASITAS', 15),
          headerCell('MERK', 20),
          headerCell('LAST CHECK', 15),
          headerCell('STATUS', 10),
        ],
      }),
      ...assetRows,
    ],
  }) : null;

  // Inspection results
  const inspectionRows = inspections.slice(0, 10).map((insp, idx) => {
    const statusColor = insp.result === 'PASS' ? COLOR_SUCCESS :
                       insp.result === 'FAIL' ? COLOR_DANGER : COLOR_WARNING;

    return new TableRow({
      children: [
        dataCell(new Date(insp.inspection_date).toLocaleDateString('id-ID') || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(insp.asset_type || '-', 15, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(insp.location || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(insp.inspector || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(insp.result || '-', 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(insp.notes || '-', 10, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const inspectionTable = inspectionRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TANGGAL', 15),
          headerCell('ASSET', 15),
          headerCell('LOKASI', 25),
          headerCell('INSPEKTOR', 20),
          headerCell('HASIL', 15),
          headerCell('CATATAN', 10),
        ],
      }),
      ...inspectionRows,
    ],
  }) : null;

  // Build final content
  const content = [
    heading2('3.11. Pemeriksaan Fire Protection & Life Safety'),
    bodyText('Pemeriksaan sistem proteksi kebakaran dan keselamatan jiwa dilakukan berdasarkan SNI 03-1735-2004 (Sistem Proteksi Kebakaran Ringan), SNI 03-1745-2000 (Sistem Hydrant), dan referensi NFPA 13 (Sprinkler) serta NFPA 101 (Life Safety Code).'),
    emptyLine(),
    heading3('3.11.1. Summary Fire Protection'),
    summaryTable,
    emptyLine(),
  ];

  if (assetTable) {
    content.push(
      heading3('3.11.2. Daftar Aset Fire Protection'),
      bodyText(`Total ${assets.length} aset tercatat dalam sistem (menampilkan 20 pertama).`),
      assetTable, 
      emptyLine()
    );
  }

  if (inspectionTable) {
    content.push(
      heading3('3.11.3. Hasil Inspeksi Terkini'),
      inspectionTable, 
      emptyLine()
    );
  }

  // Add recommendations
  const recommendations = [];
  if (recentFailures > 0) {
    recommendations.push(`Segera perbaiki ${recentFailures} aset yang mengalami kegagalan inspeksi dalam 30 hari terakhir.`);
  }
  if (complianceRate < 70) {
    recommendations.push('Tingkatkan program maintenance rutin untuk mencapai compliance rate minimum 70%. Target: 90%.');
  }
  if (aparCount === 0) {
    recommendations.push('Segera instalasi APAR minimal sesuai SNI (1 unit per 15m radius atau sesuai hazard class).');
  }
  if (hydrantCount === 0) {
    recommendations.push('Sistem hydrant wajib untuk bangunan >4 lantai atau luas >500m² per SNI 03-1745-2000.');
  }
  if (detectorCount === 0) {
    recommendations.push('Pertimbangkan instalasi smoke detector untuk early warning system.');
  }

  if (recommendations.length > 0) {
    content.push(
      heading3('3.11.4. Rekomendasi'),
      ...recommendations.map((rec, idx) => numberedItem(rec, idx + 1)),
      emptyLine()
    );
  }

  content.push(
    bodyText(`Referensi: SNI 03-1735-2004, SNI 03-1745-2000, NFPA 13 (Sprinkler Systems), NFPA 101 (Life Safety Code).`),
    emptyLine()
  );

  return content;
}
