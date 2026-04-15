import {
  createTableBorders, headerCell, dataCell, heading2, heading3,
  bodyText, bulletItem, numberedItem, emptyLine, horizontalLine, pageBreak,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_SMALL,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_MUTED, COLOR_INFO,
  Table, TableRow, Paragraph, TextRun, WidthType, AlignmentType
} from './utils.js';

/**
 * Render Environmental Impact Control Section for DOCX
 * Based on PP 16/2021, UU 32/2009, Permen LHK 4/2021, 68/2016
 */
export function renderEnvironmentalSection(environmentalData = {}) {
  const {
    documents = [],
    wastewater = [],
    waste = [],
    emissions = [],
    noise = [],
    hazardousWaste = [],
    energy = [],
    water = [],
    drainage = [],
    greenspace = [],
    summary = {}
  } = environmentalData;

  const hasData = documents.length > 0 || wastewater.length > 0 || waste.length > 0;

  if (!hasData) {
    return [
      heading2('3.9. Pemeriksaan Pengendalian Dampak Lingkungan'),
      bodyText(
        'Data pemeriksaan pengendalian dampak lingkungan belum tersedia. Pemeriksaan mencakup evaluasi dokumen AMDAL/UKL-UPL, kualitas air limbah (Permen LHK 68/2016), pengelolaan sampah, emisi udara (Permen LHK 22/2021), kebisingan (Kepmen LH 48/1996), Limbah B3, konservasi energi (SNI 03-6196-2000), dan air.'
      ),
      emptyLine(),
    ];
  }

  // Calculate overall environmental score
  const totalDocuments = documents.length;
  const validDocs = documents.filter(d => d.status === 'VALID').length;
  const expiredDocs = documents.filter(d => d.status === 'EXPIRED').length;
  
  const compliantWastewater = wastewater.filter(w => w.compliance_status === 'PASS').length;
  const totalWastewater = wastewater.length;
  
  const avgDiversionRate = waste.length > 0 
    ? waste.reduce((sum, w) => sum + (w.diversion_rate || 0), 0) / waste.length 
    : 0;
  
  const compliantEmissions = emissions.filter(e => e.compliance_status === 'PASS').length;
  const totalEmissions = emissions.length;
  
  const compliantNoise = noise.filter(n => n.compliance_status === 'PASS').length;
  const totalNoise = noise.length;
  
  const avgEUI = energy.length > 0 
    ? energy.reduce((sum, e) => sum + (e.eui || 0), 0) / energy.length 
    : 0;
  
  const avgCarbonIntensity = energy.length > 0
    ? energy.reduce((sum, e) => sum + (e.carbon_intensity || 0), 0) / energy.length
    : 0;
  
  const avgWaterFootprint = water.length > 0
    ? water.reduce((sum, w) => sum + (w.water_footprint || 0), 0) / water.length
    : 0;
  
  const avgGreenRatio = greenspace.length > 0
    ? greenspace.reduce((sum, g) => sum + (g.green_ratio || 0), 0) / greenspace.length
    : 0;

  const avgInfiltration = drainage.length > 0
    ? drainage.reduce((sum, d) => sum + (d.infiltration_percentage || 0), 0) / drainage.length
    : 0;

  const overallScore = summary.overallScore || calculateOverallScore({
    documents: validDocs === totalDocuments && totalDocuments > 0,
    wastewater: compliantWastewater === totalWastewater && totalWastewater > 0,
    waste: avgDiversionRate >= 60,
    emissions: compliantEmissions === totalEmissions && totalEmissions > 0,
    noise: compliantNoise === totalNoise && totalNoise > 0,
    energy: avgEUI <= 240,
    water: avgWaterFootprint <= 120,
    drainage: avgInfiltration >= 30,
    greenspace: avgGreenRatio >= 30
  });

  function calculateOverallScore(conditions) {
    const scores = Object.values(conditions).filter(Boolean).length;
    return Math.round((scores / Object.keys(conditions).length) * 100);
  }

  // Summary Table
  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('ASPEK LINGKUNGAN', 35),
          headerCell('PARAMETER', 35),
          headerCell('STATUS', 30),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Dokumen LH', 35, { bold: true }),
          dataCell(`${validDocs}/${totalDocuments} Valid`, 35, { center: true }),
          dataCell(validDocs === totalDocuments && totalDocuments > 0 ? 'COMPLIANT' : expiredDocs > 0 ? 'EXPIRED' : 'NEEDS ATTENTION', 30, { center: true, color: validDocs === totalDocuments && totalDocuments > 0 ? COLOR_SUCCESS : expiredDocs > 0 ? COLOR_DANGER : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Air Limbah', 35, { bold: true }),
          dataCell(`${compliantWastewater}/${totalWastewater} Pass`, 35, { center: true }),
          dataCell(compliantWastewater === totalWastewater && totalWastewater > 0 ? 'COMPLIANT' : 'NON-COMPLIANT', 30, { center: true, color: compliantWastewater === totalWastewater && totalWastewater > 0 ? COLOR_SUCCESS : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Pengelolaan Sampah', 35, { bold: true }),
          dataCell(`Diversion Rate: ${avgDiversionRate.toFixed(1)}%`, 35, { center: true }),
          dataCell(avgDiversionRate >= 70 ? 'EXCELLENT' : avgDiversionRate >= 60 ? 'GOOD' : avgDiversionRate >= 40 ? 'MODERATE' : 'POOR', 30, { center: true, color: avgDiversionRate >= 60 ? COLOR_SUCCESS : avgDiversionRate >= 40 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Emisi Udara', 35, { bold: true }),
          dataCell(`${compliantEmissions}/${totalEmissions} Pass`, 35, { center: true }),
          dataCell(compliantEmissions === totalEmissions && totalEmissions > 0 ? 'COMPLIANT' : 'NON-COMPLIANT', 30, { center: true, color: compliantEmissions === totalEmissions && totalEmissions > 0 ? COLOR_SUCCESS : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Kebisingan', 35, { bold: true }),
          dataCell(`${compliantNoise}/${totalNoise} Pass`, 35, { center: true }),
          dataCell(compliantNoise === totalNoise && totalNoise > 0 ? 'COMPLIANT' : 'NON-COMPLIANT', 30, { center: true, color: compliantNoise === totalNoise && totalNoise > 0 ? COLOR_SUCCESS : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Limbah B3', 35, { bold: true }),
          dataCell(`${hazardousWaste.filter(h => h.tracking_status === 'PROCESSED').length}/${hazardousWaste.length} Processed`, 35, { center: true }),
          dataCell(hazardousWaste.length > 0 && hazardousWaste.every(h => h.tracking_status === 'PROCESSED') ? 'COMPLIANT' : hazardousWaste.length > 0 ? 'PENDING' : 'NO DATA', 30, { center: true, color: hazardousWaste.length > 0 && hazardousWaste.every(h => h.tracking_status === 'PROCESSED') ? COLOR_SUCCESS : hazardousWaste.length > 0 ? COLOR_WARNING : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Konservasi Energi (EUI)', 35, { bold: true }),
          dataCell(`${avgEUI.toFixed(1)} kWh/m²/th`, 35, { center: true }),
          dataCell(avgEUI <= 240 ? 'COMPLIANT' : 'EXCEEDS STANDARD', 30, { center: true, color: avgEUI <= 240 ? COLOR_SUCCESS : avgEUI <= 300 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Carbon Intensity', 35, { bold: true }),
          dataCell(`${avgCarbonIntensity.toFixed(1)} kg CO₂/m²/th`, 35, { center: true }),
          dataCell(avgCarbonIntensity < 50 ? 'GOOD' : avgCarbonIntensity < 100 ? 'MODERATE' : 'HIGH', 30, { center: true, color: avgCarbonIntensity < 50 ? COLOR_SUCCESS : avgCarbonIntensity < 100 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Water Footprint', 35, { bold: true }),
          dataCell(`${avgWaterFootprint.toFixed(1)} L/org/hari`, 35, { center: true }),
          dataCell(avgWaterFootprint <= 120 ? 'COMPLIANT' : 'EXCEEDS STANDARD', 30, { center: true, color: avgWaterFootprint <= 120 ? COLOR_SUCCESS : avgWaterFootprint <= 150 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Drainase & Infiltrasi', 35, { bold: true }),
          dataCell(`${avgInfiltration.toFixed(1)}%`, 35, { center: true }),
          dataCell(avgInfiltration >= 30 ? 'COMPLIANT' : 'INSUFFICIENT', 30, { center: true, color: avgInfiltration >= 30 ? COLOR_SUCCESS : avgInfiltration >= 20 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Ruang Terbuka Hijau', 35, { bold: true }),
          dataCell(`${avgGreenRatio.toFixed(1)}%`, 35, { center: true }),
          dataCell(avgGreenRatio >= 30 ? 'COMPLIANT' : 'INSUFFICIENT', 30, { center: true, color: avgGreenRatio >= 30 ? COLOR_SUCCESS : avgGreenRatio >= 20 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('OVERALL ENVIRONMENTAL SCORE', 35, { bold: true }),
          dataCell(`${overallScore}/100`, 35, { center: true, bold: true }),
          dataCell(overallScore >= 80 ? 'BAIK' : overallScore >= 60 ? 'SEDANG' : 'PERLU PERBAIKAN', 30, { center: true, bold: true, color: overallScore >= 80 ? COLOR_SUCCESS : overallScore >= 60 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
    ],
  });

  // Document Detail Table
  const docRows = documents.map((doc, idx) => {
    const statusColor = doc.status === 'VALID' ? COLOR_SUCCESS :
                       doc.status === 'EXPIRED' ? COLOR_DANGER :
                       doc.status === 'EXPIRING_SOON' ? COLOR_WARNING : COLOR_MUTED;
    const daysUntil = doc.expiry_date ? Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    
    return new TableRow({
      children: [
        dataCell(doc.document_type || '-', 15, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(doc.registration_number || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(doc.issue_date || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(doc.expiry_date || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(daysUntil !== null ? `${daysUntil} hari` : '-', 12, { center: true, color: daysUntil < 0 ? COLOR_DANGER : daysUntil < 180 ? COLOR_WARNING : COLOR_SUCCESS, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(doc.status || '-', 13, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const docTable = docRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TIPE', 15),
          headerCell('NO REG', 20),
          headerCell('TERBIT', 15),
          headerCell('EXPIRED', 15),
          headerCell('SISA', 12),
          headerCell('STATUS', 13),
        ],
      }),
      ...docRows,
    ],
  }) : null;

  // Wastewater Quality Table
  const wastewaterRows = wastewater.map((w, idx) => {
    const phOk = w.ph >= 6 && w.ph <= 9;
    const bodOk = (w.bod || 0) <= 30;
    const codOk = (w.cod || 0) <= 100;
    const tssOk = (w.tss || 0) <= 50;
    const allOk = phOk && bodOk && codOk && tssOk;

    return new TableRow({
      children: [
        dataCell(w.sampling_date || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(w.sampling_location || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.ph || '-'}`, 10, { center: true, color: phOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.bod || '-'} mg/L`, 12, { center: true, color: bodOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.cod || '-'} mg/L`, 12, { center: true, color: codOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.tss || '-'} mg/L`, 12, { center: true, color: tssOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(w.compliance_status || '-', 14, { center: true, bold: true, color: allOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const wastewaterTable = wastewaterRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TANGGAL', 15),
          headerCell('LOKASI', 25),
          headerCell('pH', 10),
          headerCell('BOD', 12),
          headerCell('COD', 12),
          headerCell('TSS', 12),
          headerCell('STATUS', 14),
        ],
      }),
      ...wastewaterRows,
    ],
  }) : null;

  // Waste Audit Table
  const wasteRows = waste.map((w, idx) => {
    const diversion = w.diversion_rate || 0;
    const statusColor = diversion >= 70 ? COLOR_SUCCESS : diversion >= 60 ? COLOR_WARNING : COLOR_DANGER;

    return new TableRow({
      children: [
        dataCell(w.audit_date || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.daily_waste_total?.toFixed(1) || '-'} kg/hr`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.organic_weight?.toFixed(1) || '-'} kg`, 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.plastic_weight?.toFixed(1) || '-'} kg`, 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.paper_weight?.toFixed(1) || '-'} kg`, 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${w.residual_weight?.toFixed(1) || '-'} kg`, 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${diversion.toFixed(1)}%`, 12, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(diversion >= 70 ? 'ZERO WASTE' : diversion >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT', 18, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const wasteTable = wasteRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TANGGAL', 15),
          headerCell('TOTAL', 15),
          headerCell('ORGANIK', 10),
          headerCell('PLASTIK', 10),
          headerCell('KERTAS', 10),
          headerCell('RESIDU', 10),
          headerCell('DIVERSION', 12),
          headerCell('STATUS', 18),
        ],
      }),
      ...wasteRows,
    ],
  }) : null;

  // Emissions Table
  const emissionRows = emissions.map((e, idx) => {
    const pmOk = (e.pm10 || 0) <= 150;
    const pm25Ok = (e.pm25 || 0) <= 65;
    const so2Ok = (e.so2 || 0) <= 365;
    const no2Ok = (e.no2 || 0) <= 200;
    const allOk = pmOk && pm25Ok && so2Ok && no2Ok;

    return new TableRow({
      children: [
        dataCell(e.sampling_date || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(e.source_type || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.pm10 || '-'} µg/m³`, 13, { center: true, color: pmOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.pm25 || '-'} µg/m³`, 13, { center: true, color: pm25Ok ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.so2 || '-'} µg/m³`, 13, { center: true, color: so2Ok ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.no2 || '-'} µg/m³`, 13, { center: true, color: no2Ok ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(e.compliance_status || '-', 18, { center: true, bold: true, color: allOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const emissionTable = emissionRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TANGGAL', 15),
          headerCell('SUMBER', 15),
          headerCell('PM10', 13),
          headerCell('PM2.5', 13),
          headerCell('SO₂', 13),
          headerCell('NO₂', 13),
          headerCell('STATUS', 18),
        ],
      }),
      ...emissionRows,
    ],
  }) : null;

  // Energy Audit Table
  const energyRows = energy.map((e, idx) => {
    const euiOk = (e.eui || 0) <= (e.standard_eui || 240);
    const statusColor = euiOk ? COLOR_SUCCESS : COLOR_DANGER;

    return new TableRow({
      children: [
        dataCell(String(e.audit_year) || '-', 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(e.building_type || '-', 18, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.annual_consumption?.toFixed(0) || '-'} kWh`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.eui?.toFixed(1) || '-'} kWh/m²/th`, 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.standard_eui?.toFixed(0) || '-'} kWh/m²/th`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.efficiency_percentage?.toFixed(1) || '-'}%`, 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${e.carbon_emission?.toFixed(1) || '-'} ton CO₂`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const energyTable = energyRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TAHUN', 12),
          headerCell('TIPE', 18),
          headerCell('KONSUMSI', 15),
          headerCell('EUI', 15),
          headerCell('STANDAR', 15),
          headerCell('EFISIENSI', 10),
          headerCell('EMISI CO₂', 15),
        ],
      }),
      ...energyRows,
    ],
  }) : null;

  // Build final content
  const content = [
    heading2('3.9. Pemeriksaan Pengendalian Dampak Lingkungan'),
    bodyText('Pemeriksaan pengendalian dampak lingkungan dilakukan berdasarkan PP No. 16 Tahun 2021, UU No. 32 Tahun 2009, Permen LHK No. 4 Tahun 2021 (AMDAL/UKL-UPL), Permen LHK No. 68 Tahun 2016 (Baku Mutu Air Limbah), Permen LHK No. 22 Tahun 2021 (Kualitas Udara), Kepmen LH No. 48 Tahun 1996 (Kebisingan), dan SNI 03-6196-2000 (Konservasi Energi).'),
    emptyLine(),
    heading3('3.9.1. Ringkasan Compliance Lingkungan'),
    summaryTable,
    emptyLine(),
  ];

  if (docTable) {
    content.push(heading3('3.9.2. Dokumen Lingkungan (AMDAL/UKL-UPL)'), docTable, emptyLine());
  }

  if (wastewaterTable) {
    content.push(
      heading3('3.9.3. Kualitas Air Limbah (Permen LHK 68/2016)'),
      bodyText('Baku mutu air limbah sesuai Permen LHK No. 68 Tahun 2016: pH 6-9, BOD ≤30 mg/L (sungai) / ≤50 mg/L (laut), COD ≤100 mg/L (sungai) / ≤150 mg/L (laut), TSS ≤50 mg/L.'),
      wastewaterTable, 
      emptyLine()
    );
  }

  if (wasteTable) {
    content.push(
      heading3('3.9.4. Pengelolaan Sampah (Jakarta Zero Waste Perpres 97/2017)'),
      bodyText('Target Jakarta Zero Waste: Diversion rate ≥70% (30% pengurangan sampah TPA melalui pemilahan dan pengolahan organik).'),
      wasteTable, 
      emptyLine()
    );
  }

  if (emissionTable) {
    content.push(
      heading3('3.9.5. Kualitas Udara (Permen LHK 22/2021)'),
      bodyText('Baku mutu udara ambien sesuai Permen LHK No. 22 Tahun 2021: PM10 ≤150 µg/m³, PM2.5 ≤65 µg/m³, SO₂ ≤365 µg/m³, NO₂ ≤200 µg/m³.'),
      emissionTable, 
      emptyLine()
    );
  }

  if (energyTable) {
    content.push(
      heading3('3.9.6. Audit Energi & Carbon Footprint'),
      bodyText('EUI (Energy Use Intensity) dan efisiensi energi berdasarkan SNI 03-6196-2000. Target carbon neutral melalui renewable energy dan offsetting.'),
      energyTable, 
      emptyLine()
    );
  }

  // Add recommendations
  const recommendations = [];
  if (expiredDocs > 0) recommendations.push(`Segera perpanjang ${expiredDocs} dokumen lingkungan yang telah expired.`);
  if (compliantWastewater < totalWastewater) recommendations.push(`Tingkatkan treatment IPAL untuk memenuhi baku mutu Permen LHK 68/2016.`);
  if (avgDiversionRate < 60) recommendations.push(`Tingkatkan pemilahan sampah organik untuk composting. Target diversion rate ≥60%.`);
  if (avgEUI > 240) recommendations.push(`Lakukan audit energi detail. Potensi penghematan melalui LED retrofit dan AC inverter.`);
  if (avgInfiltration < 30) recommendations.push(`Tambah sumur resapan untuk mencapai target infiltrasi 30% sesuai Permen PU 20/2020.`);
  if (avgGreenRatio < 30) recommendations.push(`Tambah area hijau untuk mencapai target RTH 30%.`);

  if (recommendations.length > 0) {
    content.push(
      heading3('3.9.7. Rekomendasi Perbaikan'),
      ...recommendations.map((rec, idx) => numberedItem(rec, idx + 1)),
      emptyLine()
    );
  }

  content.push(
    bodyText(`Referensi: PP No. 16/2021, UU No. 32/2009, Permen LHK No. 4/2021, Permen LHK No. 68/2016, Permen LHK No. 22/2021, Kepmen LH No. 48/1996, SNI 03-6196-2000, Perpres No. 97/2017, Permen PU No. 20/PRT/M/2020.`),
    emptyLine()
  );

  return content;
}
