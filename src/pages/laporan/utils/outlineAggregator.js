// ============================================================
//  UTIL: Outline Aggregator
//  Menggabungkan semua data outline untuk laporan komprehensif
// ============================================================

export function aggregateOutlineData(data) {
  // Handle null/undefined data
  if (!data) {
    return {
      electrical: null,
      struktur: null,
      egress: null,
      environmental: null,
      lps: null,
      fireProtection: null,
      buildingIntensity: null,
      architectural: null,
      etabs: null,
      archSim: null,
      pathfinder: null,
      fireDesigner: null,
      summary: { totalSections: 0, sections: [], hasSimulations: false, hasFullAnalysis: false }
    };
  }

  return {
    electrical: aggregateElectrical(data.electrical),
    struktur: aggregateStruktur(data.struktur),
    egress: aggregateEgress(data.egress),
    environmental: aggregateEnvironmental(data.environmental),
    lps: aggregateLPS(data.lps),
    fireProtection: aggregateFireProtection(data.fireProtection),
    buildingIntensity: aggregateBuildingIntensity(data.buildingIntensity),
    architectural: aggregateArchitectural(data.architectural),
    etabs: data.etabs,
    archSim: data.archSim,
    pathfinder: data.pathfinder,
    fireDesigner: data.fireDesigner,
    summary: generateExecutiveSummary(data)
  };
}

function aggregateElectrical(electrical) {
  if (!electrical) return null;
  
  const { panels = [], measurements = [] } = electrical;
  
  return {
    summary: `Sistem kelistrikan dengan ${panels.length} panel dan ${measurements.length} pengukuran`,
    panels,
    measurements,
    compliance: calculateCompliance(panels, measurements),
    findings: generateFindings(panels, measurements, 'electrical')
  };
}

function aggregateStruktur(struktur) {
  if (!struktur) return null;
  
  const { ndtRebound, ndtUPV, strukturData } = struktur;
  
  return {
    summary: `Analisis struktur: ${ndtRebound?.count || 0} NDT Rebound, ${ndtUPV?.count || 0} UPV`,
    ndtRebound,
    ndtUPV,
    strukturData,
    compliance: calculateStructuralCompliance(ndtRebound, ndtUPV),
    findings: generateStructuralFindings(ndtRebound, ndtUPV)
  };
}

function aggregateEgress(egress) {
  if (!egress) return null;
  
  const { routes = [], components = [] } = egress;
  
  return {
    summary: `Sistem egress: ${routes.length} jalur, ${components.length} komponen`,
    routes,
    components,
    compliance: calculateEgressCompliance(routes, components),
    findings: generateEgressFindings(routes, components)
  };
}

function aggregateEnvironmental(environmental) {
  if (!environmental) return null;
  
  const { documents = [], wastewater = [] } = environmental;
  
  return {
    summary: `Pengelolaan lingkungan: ${documents.length} dokumen, ${wastewater.length} sistem`,
    documents,
    wastewater,
    compliance: calculateEnvironmentalCompliance(documents, wastewater),
    findings: generateEnvironmentalFindings(documents, wastewater)
  };
}

function aggregateLPS(lps) {
  if (!lps) return null;
  
  const { riskAssessments = [], components = [] } = lps;
  
  return {
    summary: `Sistem proteksi petir: ${riskAssessments.length} assessment, ${components.length} komponen`,
    riskAssessments,
    components,
    compliance: calculateLPSCompliance(riskAssessments, components),
    findings: generateLPSFindings(riskAssessments, components)
  };
}

function aggregateFireProtection(fire) {
  if (!fire) return null;
  
  const { assets = [], inspections = [] } = fire;
  
  return {
    summary: `Proteksi kebakaran: ${assets.length} aset, ${inspections.length} inspeksi`,
    assets,
    inspections,
    compliance: calculateFireCompliance(assets, inspections),
    findings: generateFireFindings(assets, inspections)
  };
}

function aggregateBuildingIntensity(intensity) {
  if (!intensity) return null;
  
  const { calculations = [], compliance } = intensity;
  
  return {
    summary: `Intensitas bangunan: ${calculations.length} perhitungan`,
    calculations,
    compliance,
    findings: generateIntensityFindings(calculations, compliance)
  };
}

function aggregateArchitectural(arch) {
  if (!arch) return null;
  
  const { requirements = [], simulations = [] } = arch;
  
  return {
    summary: `Persyaratan arsitektural: ${requirements.length} persyaratan, ${simulations.length} simulasi`,
    requirements,
    simulations,
    compliance: calculateArchitecturalCompliance(requirements, simulations),
    findings: generateArchitecturalFindings(requirements, simulations)
  };
}

function generateExecutiveSummary(data) {
  const sections = [
    data.electrical && 'Sistem Kelistrikan',
    data.struktur && 'Struktur Bangunan',
    data.egress && 'Sistem Egress',
    data.fireProtection && 'Proteksi Kebakaran',
    data.lps && 'Proteksi Petir',
    data.environmental && 'Pengelolaan Lingkungan',
    data.buildingIntensity && 'Intensitas Bangunan',
    data.architectural && 'Persyaratan Arsitektural',
    data.etabs && 'Analisis ETABS/FEMA 356',
    data.archSim && 'Simulasi ArchSim',
    data.pathfinder && 'Simulasi Pathfinder',
    data.fireDesigner && 'Simulasi FireDesigner'
  ].filter(Boolean);
  
  return {
    totalSections: sections.length,
    sections,
    hasSimulations: !!(data.etabs || data.archSim || data.pathfinder || data.fireDesigner),
    hasFullAnalysis: sections.length >= 8
  };
}

// ============================================================
// COMPLIANCE CALCULATORS
// ============================================================

function calculateCompliance(panels, measurements) {
  const total = panels.length + measurements.length;
  const passed = panels.filter(p => p.status === 'passed').length + 
                 measurements.filter(m => m.status === 'passed').length;
  return {
    score: total > 0 ? Math.round((passed / total) * 100) : 0,
    status: passed === total ? 'COMPLY' : 'PARTIAL'
  };
}

function calculateStructuralCompliance(ndtRebound, ndtUPV) {
  const reboundPass = ndtRebound?.results?.filter(r => r.grade !== 'D').length || 0;
  const upvPass = ndtUPV?.results?.filter(u => u.grade !== 'D').length || 0;
  const total = (ndtRebound?.count || 0) + (ndtUPV?.count || 0);
  const passed = reboundPass + upvPass;
  
  return {
    score: total > 0 ? Math.round((passed / total) * 100) : 0,
    status: passed === total ? 'COMPLY' : 'PARTIAL'
  };
}

function calculateEgressCompliance(routes, components) {
  const total = routes.length + components.length;
  const passed = routes.filter(r => r.status === 'passed').length +
                 components.filter(c => c.status === 'passed').length;
  return {
    score: total > 0 ? Math.round((passed / total) * 100) : 0,
    status: passed === total ? 'COMPLY' : 'PARTIAL'
  };
}

function calculateEnvironmentalCompliance(documents, wastewater) {
  return {
    score: documents.length > 0 ? 85 : 50,
    status: documents.length > 0 ? 'COMPLY' : 'PARTIAL'
  };
}

function calculateLPSCompliance(riskAssessments, components) {
  return {
    score: riskAssessments.length > 0 ? 90 : 60,
    status: riskAssessments.length > 0 ? 'COMPLY' : 'PARTIAL'
  };
}

function calculateFireCompliance(assets, inspections) {
  const total = assets.length + inspections.length;
  const passed = assets.filter(a => a.status === 'active').length +
                 inspections.filter(i => i.status === 'passed').length;
  return {
    score: total > 0 ? Math.round((passed / total) * 100) : 0,
    status: passed === total ? 'COMPLY' : 'PARTIAL'
  };
}

function calculateArchitecturalCompliance(requirements, simulations) {
  const passed = requirements.filter(r => r.status === 'passed').length;
  return {
    score: requirements.length > 0 ? Math.round((passed / requirements.length) * 100) : 0,
    status: passed === requirements.length ? 'COMPLY' : 'PARTIAL'
  };
}

// ============================================================
// FINDINGS GENERATORS
// ============================================================

function generateFindings(items, measurements, type) {
  const findings = [];
  
  items.forEach(item => {
    if (item.status !== 'passed') {
      findings.push({
        item: item.kode || item.name,
        description: item.nama || item.description,
        status: item.status,
        recommendation: item.catatan || 'Perlu perbaikan'
      });
    }
  });
  
  return findings;
}

function generateStructuralFindings(ndtRebound, ndtUPV) {
  const findings = [];
  
  ndtRebound?.results?.forEach(r => {
    if (r.grade === 'D') {
      findings.push({
        item: `NDT Rebound #${r.id}`,
        description: `Kekuatan beton rendah (${r.strength} MPa)`,
        status: 'CRITICAL',
        recommendation: 'Penguatan struktur diperlukan'
      });
    }
  });
  
  return findings;
}

function generateEgressFindings(routes, components) {
  return routes
    .filter(r => r.status !== 'passed')
    .map(r => ({
      item: `Egress Route ${r.name}`,
      description: r.issues || 'Tidak memenuhi persyaratan',
      status: r.status,
      recommendation: 'Perbaiki lebar jalur dan tanda arah'
    }));
}

function generateEnvironmentalFindings(documents, wastewater) {
  return documents
    .filter(d => d.status !== 'complete')
    .map(d => ({
      item: d.name,
      description: 'Dokumen lingkungan belum lengkap',
      status: d.status,
      recommendation: 'Lengkapi dokumen AMDAL/UKL-UPL'
    }));
}

function generateLPSFindings(riskAssessments, components) {
  return riskAssessments
    .filter(r => r.riskLevel === 'high')
    .map(r => ({
      item: `Risk Assessment ${r.zone}`,
      description: `Risiko petir tinggi (${r.ng} hari/thn)`,
      status: 'HIGH_RISK',
      recommendation: 'Tingkatkan sistem proteksi petir'
    }));
}

function generateFireFindings(assets, inspections) {
  return assets
    .filter(a => a.status !== 'active')
    .map(a => ({
      item: a.name,
      description: 'Sistem proteksi kebakaran tidak aktif',
      status: a.status,
      recommendation: 'Perbaiki dan lakukan maintenance'
    }));
}

function generateIntensityFindings(calculations, compliance) {
  return calculations
    .filter(c => !c.isCompliant)
    .map(c => ({
      item: c.type,
      description: `Tidak memenuhi ${c.parameter}`,
      status: 'NON_COMPLY',
      recommendation: `Perlu ${c.recommendation}`
    }));
}

function generateArchitecturalFindings(requirements, simulations) {
  return requirements
    .filter(r => r.status !== 'passed')
    .map(r => ({
      item: r.code,
      description: r.description,
      status: r.status,
      recommendation: r.recommendation
    }));
}
