// ============================================================
//  SERVICE: Laporan Service
//  Mengambil semua data outline untuk laporan
// ============================================================

import { supabase } from '../../../lib/supabase.js';
import { getSettings } from '../../../lib/settings.js';

// Fetch semua data yang diperlukan untuk laporan
export async function fetchAllOutlineData(proyekId) {
  // Gunakan Promise.allSettled agar failure di satu endpoint tidak crash seluruh halaman
  const results = await Promise.allSettled([
    fetchProyek(proyekId),
    fetchAnalisis(proyekId),
    fetchChecklist(proyekId),
    getSettings(),
    fetchProyekFiles(proyekId),
    fetchElectricalData(proyekId),
    fetchStrukturData(proyekId),
    fetchEgressData(proyekId),
    fetchEnvironmentalData(proyekId),
    fetchLPSData(proyekId),
    fetchFireProtectionData(proyekId),
    fetchBuildingIntensityData(proyekId),
    fetchArchitecturalData(proyekId)
  ]);

  const [
    proyekResult,
    analisisResult,
    checklistResult,
    settingsResult,
    filesResult,
    electricalResult,
    strukturResult,
    egressResult,
    environmentalResult,
    lpsResult,
    fireProtectionResult,
    buildingIntensityResult,
    architecturalResult
  ] = results;

  // Helper untuk extract value atau default
  const getValue = (result, defaultValue = null) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.warn('[fetchAllOutlineData] Request failed:', result.reason?.message || result.reason);
    return defaultValue;
  };

  return {
    proyek: getValue(proyekResult),
    analisis: getValue(analisisResult, {}),
    checklist: getValue(checklistResult, []),
    settings: getValue(settingsResult, {}),
    files: getValue(filesResult, []),
    electrical: getValue(electricalResult),
    struktur: getValue(strukturResult),
    egress: getValue(egressResult),
    environmental: getValue(environmentalResult),
    lps: getValue(lpsResult),
    fireProtection: getValue(fireProtectionResult),
    buildingIntensity: getValue(buildingIntensityResult),
    architectural: getValue(architecturalResult),
    // Simulation data dari global state
    etabs: getEtabsData(),
    archSim: getArchSimData(),
    pathfinder: getPathfinderData(),
    fireDesigner: getFireDesignerData()
  };
}

// ============================================================
// DATA FETCHERS
// ============================================================

async function fetchProyek(id) {
  const { data, error } = await supabase
    .from('proyek')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw new Error('Gagal mengambil data proyek: ' + error.message);
  return data;
}

async function fetchAnalisis(proyekId) {
  const { data, error } = await supabase
    .from('hasil_analisis')
    .select('*')
    .eq('proyek_id', proyekId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  return data || {};
}

async function fetchChecklist(proyekId) {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('proyek_id', proyekId);
  
  return data || [];
}

async function fetchProyekFiles(proyekId) {
  const { data, error } = await supabase
    .from('proyek_files')
    .select('*')
    .eq('proyek_id', proyekId)
    .order('created_at', { ascending: false });
  
  return data || [];
}

// ============================================================
// OUTLINE DATA FETCHERS
// ============================================================

async function fetchElectricalData(proyekId) {
  try {
    const { data, error } = await supabase
      .from('electrical_panels')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error) throw error;
    
    const { data: measurements, error: error2 } = await supabase
      .from('electrical_measurements')
      .select('*');
    
    if (error2) throw error2;
    
    const panelIds = (data || []).map(p => p.id);
    const filteredMeasurements = (measurements || []).filter(m => 
      panelIds.includes(m.panel_id)
    );
    
    return { panels: data || [], measurements: filteredMeasurements };
  } catch (err) {
    console.warn('[laporanService] Electrical data fetch failed:', err.message);
    return null;
  }
}

async function fetchStrukturData(proyekId) {
  try {
    const { data: strukturData, error: error3 } = await supabase
      .from('etabs_models')
      .select('*')
      .eq('proyek_id', proyekId)
      .maybeSingle();
    
    if (error3) throw error3;
    
    const { data: femaResults, error: error4 } = await supabase
      .from('fema356_analysis_results')
      .select('*')
      .eq('proyek_id', proyekId)
      .maybeSingle();
    
    return {
      ndtRebound: { count: 0, results: [] },
      ndtUPV: { count: 0, results: [] },
      strukturData,
      femaResults
    };
  } catch (err) {
    console.warn('[laporanService] Struktur data fetch failed:', err.message);
    return null;
  }
}

async function fetchEgressData(proyekId) {
  try {
    const { data: routes, error } = await supabase
      .from('egress_routes')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error) throw error;
    
    const { data: components, error: error2 } = await supabase
      .from('exit_components')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error2) throw error2;
    
    return { routes: routes || [], components: components || [] };
  } catch (err) {
    console.warn('[laporanService] Egress data fetch failed:', err.message);
    return null;
  }
}

async function fetchEnvironmentalData(proyekId) {
  try {
    const { data: documents, error } = await supabase
      .from('environmental_documents')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error) throw error;
    
    const { data: wastewater, error: error2 } = await supabase
      .from('wastewater_monitoring')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error2) throw error2;
    
    return { documents: documents || [], wastewater: wastewater || [] };
  } catch (err) {
    console.warn('[laporanService] Environmental data fetch failed:', err.message);
    return null;
  }
}

async function fetchLPSData(proyekId) {
  try {
    const { data: riskAssessments, error } = await supabase
      .from('lightning_risk_assessments')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error) throw error;
    
    const { data: components, error: error2 } = await supabase
      .from('lps_components')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error2) throw error2;
    
    return { riskAssessments: riskAssessments || [], components: components || [] };
  } catch (err) {
    console.warn('[laporanService] LPS data fetch failed:', err.message);
    return null;
  }
}

async function fetchFireProtectionData(proyekId) {
  try {
    const { data: assets, error } = await supabase
      .from('fire_assets')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error) throw error;
    
    const { data: inspections, error: error2 } = await supabase
      .from('fire_inspections')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error2) throw error2;
    
    return { assets: assets || [], inspections: inspections || [] };
  } catch (err) {
    console.warn('[laporanService] Fire protection data fetch failed:', err.message);
    return null;
  }
}

async function fetchBuildingIntensityData(proyekId) {
  try {
    const { data: calculations, error } = await supabase
      .from('building_intensity_assessments')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error) throw error;
    
    const calcArray = calculations || [];
    let compliance = null;
    
    if (calcArray.length > 0 && calcArray[0]?.id) {
      const { data: complianceData, error: error2 } = await supabase
        .from('building_setback_details')
        .select('*')
        .eq('assessment_id', calcArray[0].id)
        .maybeSingle();
      
      if (!error2) compliance = complianceData;
    }
    
    return { calculations: calcArray, compliance };
  } catch (err) {
    console.warn('[laporanService] Building intensity data fetch failed:', err.message);
    return null;
  }
}

async function fetchArchitecturalData(proyekId) {
  try {
    const { data: requirements, error } = await supabase
      .from('architectural_assessments')
      .select('*')
      .eq('project_id', proyekId);
    
    if (error) throw error;
    
    const reqArray = requirements || [];
    let rooms = [];
    
    if (reqArray.length > 0 && reqArray[0]?.id) {
      const { data: roomsData, error: error2 } = await supabase
        .from('architectural_rooms')
        .select('*')
        .eq('assessment_id', reqArray[0].id);
      
      if (!error2) rooms = roomsData || [];
    }
    
    return { requirements: reqArray, rooms };
  } catch (err) {
    console.warn('[laporanService] Architectural data fetch failed:', err.message);
    return null;
  }
}

// ============================================================
// SIMULATION DATA (from global state)
// ============================================================

function getEtabsData() {
  const hasModel = window._importedEtabsModel && 
    (window._importedEtabsModel.nodes?.length > 0 || 
     window._importedEtabsModel.elements?.length > 0);
  
  if (!hasModel && !window._lastFema356Results) {
    return null;
  }

  return {
    ...window._importedEtabsModel,
    fema356Results: window._lastFema356Results,
    timeHistoryResults: window._lastTimeHistoryResults,
    summary: {
      hasModel,
      hasFemaResults: !!window._lastFema356Results,
      hasTimeHistory: !!window._lastTimeHistoryResults,
      nodes: window._importedEtabsModel?.nodes?.length || 0,
      elements: window._importedEtabsModel?.elements?.length || 0,
      performanceLevel: window._lastFema356Results?.performanceLevel
    }
  };
}

function getArchSimData() {
  // Data dari archState jika tersedia
  if (typeof archState !== 'undefined' && archState?.state?.compliance?.status !== 'NOT_STARTED') {
    return {
      compliance: archState.state.compliance,
      projectData: archState.state.project
    };
  }
  return null;
}

function getPathfinderData() {
  if (typeof archState !== 'undefined' && archState?.state?.evacuationResults) {
    return { results: archState.state.evacuationResults };
  }
  return null;
}

function getFireDesignerData() {
  if (typeof archState !== 'undefined' && archState?.state?.fireResults) {
    return {
      results: archState.state.fireResults,
      fireConfig: archState.state.fireConfig
    };
  }
  return null;
}
