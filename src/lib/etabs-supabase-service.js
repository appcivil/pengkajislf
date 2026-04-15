/**
 * ETABS/FEA Supabase Integration Service
 * Menyimpan model, hasil analisis, dan laporan ke database
 */

import { supabase } from './supabase.js';

/**
 * Save ETABS imported model to Supabase
 */
export async function saveEtabsModel(proyekId, model, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('etabs_models')
      .upsert({
        proyek_id: proyekId,
        nodes: model.nodes,
        elements: model.elements,
        materials: model.materials,
        sections: model.sections,
        loads: model.loads || [],
        constraints: model.constraints || [],
        metadata: {
          source: model.metadata,
          import_date: new Date().toISOString(),
          ...metadata
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'proyek_id'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[ETABS Supabase] Error saving model:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Load ETABS model from Supabase
 */
export async function loadEtabsModel(proyekId) {
  try {
    const { data, error } = await supabase
      .from('etabs_models')
      .select('*')
      .eq('proyek_id', proyekId)
      .single();

    if (error) throw error;
    
    if (!data) {
      return { success: false, error: 'Model not found' };
    }

    return {
      success: true,
      model: {
        nodes: data.nodes,
        elements: data.elements,
        materials: data.materials,
        sections: data.sections,
        loads: data.loads,
        constraints: data.constraints,
        metadata: data.metadata
      }
    };
  } catch (err) {
    console.error('[ETABS Supabase] Error loading model:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save FEMA 356 Pushover Analysis Results
 */
export async function saveFema356Results(proyekId, results) {
  try {
    const { data, error } = await supabase
      .from('fema356_analysis_results')
      .upsert({
        proyek_id: proyekId,
        max_displacement: results.maxRoofDisplacement,
        max_base_shear: results.maxBaseShear,
        ductility: results.ductility,
        performance_level: results.performanceLevel,
        capacity_curve: {
          displacement: results.capacityCurve?.displacement || results.roofDisplacement,
          base_shear: results.capacityCurve?.baseShear || results.baseShear
        },
        hinges: results.hinges || [],
        performance_points: results.performancePoints || [],
        created_at: new Date().toISOString()
      }, {
        onConflict: 'proyek_id'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[ETABS Supabase] Error saving FEMA 356:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Load FEMA 356 Results
 */
export async function loadFema356Results(proyekId) {
  try {
    const { data, error } = await supabase
      .from('fema356_analysis_results')
      .select('*')
      .eq('proyek_id', proyekId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[ETABS Supabase] Error loading FEMA 356:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save Time History Analysis Results
 */
export async function saveTimeHistoryResults(proyekId, results) {
  try {
    const { data, error } = await supabase
      .from('timehistory_analysis_results')
      .upsert({
        proyek_id: proyekId,
        ground_motion: results.groundMotion,
        peaks: results.peaks,
        time_series: {
          time: results.time?.slice(0, 500), // Limit storage
          displacement: results.displacement?.slice(0, 500),
          velocity: results.velocity?.slice(0, 500),
          acceleration: results.acceleration?.slice(0, 500)
        },
        created_at: new Date().toISOString()
      }, {
        onConflict: 'proyek_id'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[ETABS Supabase] Error saving Time History:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Load Time History Results
 */
export async function loadTimeHistoryResults(proyekId) {
  try {
    const { data, error } = await supabase
      .from('timehistory_analysis_results')
      .select('*')
      .eq('proyek_id', proyekId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[ETABS Supabase] Error loading Time History:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save Analysis Report to Supabase (before DOCX generation)
 */
export async function saveAnalysisReport(proyekId, reportData) {
  try {
    const { data, error } = await supabase
      .from('structural_analysis_reports')
      .upsert({
        proyek_id: proyekId,
        report_type: reportData.type, // 'fema356', 'timehistory', 'static', 'modal'
        title: reportData.title,
        content: reportData.content,
        summary: reportData.summary,
        drive_file_id: reportData.driveFileId || null,
        docx_url: reportData.docxUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[ETABS Supabase] Error saving report:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all analysis reports for a project
 */
export async function getAnalysisReports(proyekId) {
  try {
    const { data, error } = await supabase
      .from('structural_analysis_reports')
      .select('*')
      .eq('proyek_id', proyekId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error('[ETABS Supabase] Error getting reports:', err);
    return { success: false, error: err.message, data: [] };
  }
}

/**
 * Update report with Google Drive file ID
 */
export async function updateReportDriveId(reportId, driveFileId, docxUrl) {
  try {
    const { data, error } = await supabase
      .from('structural_analysis_reports')
      .update({
        drive_file_id: driveFileId,
        docx_url: docxUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[ETABS Supabase] Error updating report:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete analysis report
 */
export async function deleteAnalysisReport(reportId) {
  try {
    const { error } = await supabase
      .from('structural_analysis_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[ETABS Supabase] Error deleting report:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if structural model exists for project
 */
export async function hasStructuralModel(proyekId) {
  try {
    const { count, error } = await supabase
      .from('etabs_models')
      .select('*', { count: 'exact', head: true })
      .eq('proyek_id', proyekId);

    if (error) throw error;
    return { success: true, exists: count > 0 };
  } catch (err) {
    return { success: false, exists: false, error: err.message };
  }
}

/**
 * Get structural model summary for dashboard
 */
export async function getStructuralModelSummary(proyekId) {
  try {
    const { data, error } = await supabase
      .from('etabs_models')
      .select('metadata, updated_at')
      .eq('proyek_id', proyekId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    
    if (!data) {
      return { success: true, hasModel: false };
    }

    return {
      success: true,
      hasModel: true,
      summary: {
        nodes: data.metadata?.source?.points || 0,
        elements: data.metadata?.source?.elements || 0,
        stories: data.metadata?.source?.stories || 0,
        lastUpdated: data.updated_at
      }
    };
  } catch (err) {
    console.error('[ETABS Supabase] Error getting summary:', err);
    return { success: false, error: err.message };
  }
}
