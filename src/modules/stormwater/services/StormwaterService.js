/**
 * StormwaterService - Service layer for stormwater data operations
 * Handles database operations for stormwater simulations and evaluations
 */

import { supabase } from '../../../lib/supabase.js';

export class StormwaterService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Save stormwater simulation results
   * @param {string} projectId - Project ID
   * @param {Object} simulationData - Simulation results
   * @returns {Promise<Object>} Saved record
   */
  async saveSimulation(projectId, simulationData) {
    const { data, error } = await this.supabase
      .from('stormwater_simulations')
      .upsert({
        project_id: projectId,
        simulation_data: simulationData,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'project_id'
      });

    if (error) throw error;
    return data;
  }

  /**
   * Load stormwater simulation for project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Simulation data
   */
  async loadSimulation(projectId) {
    const { data, error } = await this.supabase
      .from('stormwater_simulations')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.simulation_data || null;
  }

  /**
   * Save Pasal 224 evaluation results
   * @param {string} projectId - Project ID
   * @param {Object} evaluationData - Evaluation results
   * @returns {Promise<Object>} Saved record
   */
  async saveEvaluation(projectId, evaluationData) {
    const { data, error } = await this.supabase
      .from('stormwater_evaluations')
      .upsert({
        project_id: projectId,
        evaluation_data: evaluationData,
        compliance_score: evaluationData.summary?.score,
        compliance_status: evaluationData.summary?.status,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'project_id'
      });

    if (error) throw error;
    return data;
  }

  /**
   * Load evaluation for project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Evaluation data
   */
  async loadEvaluation(projectId) {
    const { data, error } = await this.supabase
      .from('stormwater_evaluations')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.evaluation_data || null;
  }

  /**
   * Get stormwater summary for project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Summary data
   */
  async getSummary(projectId) {
    try {
      const [simulation, evaluation] = await Promise.all([
        this.loadSimulation(projectId),
        this.loadEvaluation(projectId)
      ]);

      const hasData = !!(simulation || evaluation);

      return {
        hasData,
        simulationCount: simulation ? 1 : 0,
        evaluationScore: evaluation?.summary?.score || 0,
        complianceStatus: evaluation?.summary?.status || 'NOT_STARTED',
        peakRunoff: simulation?.summary?.peakOutflow || 0,
        volumeReduction: simulation?.summary?.volumeReduction || 0,
        lidCount: simulation?.lid?.length || 0,
        catchmentCount: simulation?.catchments?.length || 0
      };
    } catch (error) {
      console.error('Error getting stormwater summary:', error);
      return {
        hasData: false,
        simulationCount: 0,
        evaluationScore: 0,
        complianceStatus: 'ERROR'
      };
    }
  }

  /**
   * Save catchment configuration
   * @param {string} projectId - Project ID
   * @param {Array} catchments - Catchment array
   */
  async saveCatchments(projectId, catchments) {
    const { data, error } = await this.supabase
      .from('stormwater_catchments')
      .upsert({
        project_id: projectId,
        catchments: catchments,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id'
      });

    if (error) throw error;
    return data;
  }

  /**
   * Load catchment configuration
   * @param {string} projectId - Project ID
   */
  async loadCatchments(projectId) {
    const { data, error } = await this.supabase
      .from('stormwater_catchments')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.catchments || [];
  }

  /**
   * Export simulation to SWMM .inp format
   * @param {Object} simulationData - Simulation data
   * @returns {string} SWMM .inp content
   */
  generateSWMMInput(simulationData) {
    const { catchments, channels, storm } = simulationData;

    let inp = `[TITLE]\n`;
    inp += `ArchSim Stormwater Module Export\n`;
    inp += `Generated: ${new Date().toISOString()}\n\n`;

    // Options
    inp += `[OPTIONS]\n`;
    inp += `FLOW_UNITS CMS\n`;
    inp += `INFILTRATION HORTON\n`;
    inp += `FLOW_ROUTING KINWAVE\n`;
    inp += `START_DATE ${new Date().toISOString().split('T')[0]}\n`;
    inp += `REPORT_STEP 00:05:00\n\n`;

    // Rain gages
    inp += `[RAINGAGES]\n`;
    inp += `;;Name        Format  Interval  SCF  Source\n`;
    inp += `Gage01        INTENSITY 0:05      1.0  DESIGN ${storm.returnPeriod}yr\n\n`;

    // Subcatchments
    if (catchments && catchments.length > 0) {
      inp += `[SUBCATCHMENTS]\n`;
      inp += `;;Name   Rain Gage   Outlet   Area     %Imperv  Width   %Slope   CurbLen  SnowPack\n`;

      catchments.forEach((c, i) => {
        const area = (c.area / 10000).toFixed(4); // m2 to ha
        const imperv = c.type === 'roof' || c.type === 'pavement' ? 95 :
          c.type === 'green' ? 20 : 50;
        const width = Math.sqrt(c.area).toFixed(1);
        const slope = 1.0;
        inp += `Sub${String(i + 1).padStart(3, '0')} Gage01   Node${String(i + 1).padStart(3, '0')} ${area.padStart(8)} ${imperv.toString().padStart(8)} ${width.padStart(8)} ${slope.toString().padStart(8)} 0\n`;
      });
      inp += `\n`;

      // Subareas
      inp += `[SUBAREAS]\n`;
      inp += `;;Subcatch  N-Imperv  N-Perv  S-Imperv  S-Perv  %Zero  RouteTo  %Routed\n`;
      catchments.forEach((c, i) => {
        const nImperv = 0.015;
        const nPerv = c.type === 'green' ? 0.2 : 0.1;
        const sImperv = 0.5;
        const sPerv = 2.0;
        inp += `Sub${String(i + 1).padStart(3, '0')} ${nImperv.toFixed(3).padStart(8)} ${nPerv.toFixed(3).padStart(8)} ${sImperv.toString().padStart(8)} ${sPerv.toString().padStart(8)} 25     OUTLET   100\n`;
      });
      inp += `\n`;
    }

    // Nodes/Junctions
    if (channels && channels.length > 0) {
      inp += `[JUNCTIONS]\n`;
      inp += `;;Name   Elev   Ymax   Y0   Ysur   Apond\n`;
      channels.forEach((ch, i) => {
        inp += `Node${String(i + 1).padStart(3, '0')} 0.0    5.0    0.0  0.0    0\n`;
      });
      inp += `\n`;

      // Conduits
      inp += `[CONDUITS]\n`;
      inp += `;;Name   Node1   Node2   Length   N     Z1   Z2   Q0\n`;
      channels.forEach((ch, i) => {
        const fromNode = ch.fromNode || `Node${String(i + 1).padStart(3, '0')}`;
        const toNode = ch.toNode || `Node${String(i + 2).padStart(3, '0')}`;
        inp += `Con${String(i + 1).padStart(3, '0')} ${fromNode.padStart(7)} ${toNode.padStart(7)} ${ch.length.toFixed(1).padStart(8)} ${ch.roughness.toFixed(3).padStart(5)} 0.0  ${(ch.length * (ch.slope || 0.001)).toFixed(2).padStart(4)} 0\n`;
      });
      inp += `\n`;

      // Cross sections
      inp += `[XSECTIONS]\n`;
      inp += `;;Link   Shape      Geom1      Geom2      Geom3      Geom4      Barrels\n`;
      channels.forEach((ch, i) => {
        const cs = ch.crossSection;
        if (cs.type === 'circular') {
          inp += `Con${String(i + 1).padStart(3, '0')} CIRCULAR   ${(cs.diameter * 1000).toFixed(0).padStart(10)} 0.0        0.0        0.0        1\n`;
        } else if (cs.type === 'rectangular') {
          inp += `Con${String(i + 1).padStart(3, '0')} RECT_OPEN  ${cs.width.toFixed(2).padStart(10)} ${cs.height.toFixed(2).padStart(10)} 0.0        0.0        1\n`;
        }
      });
      inp += `\n`;
    }

    // Timeseries for design storm
    inp += `[TIMESERIES]\n`;
    inp += `;;Name   Date   Time   Value\n`;
    inp += `Storm1            0:00   0.0\n`;
    if (storm && storm.data) {
      storm.data.forEach((d, i) => {
        const time = `${Math.floor(d.time / 60)}:${String(d.time % 60).padStart(2, '0')}`;
        inp += `Storm1            ${time.padStart(6)} ${d.intensity.toFixed(2)}\n`;
      });
    }
    inp += `\n`;

    // Report
    inp += `[REPORT]\n`;
    inp += `INPUT YES\n`;
    inp += `CONTINUITY YES\n`;
    inp += `FLOWSTATS YES\n`;
    inp += `CONTROLS YES\n\n`;

    inp += `[END]\n`;

    return inp;
  }

  /**
   * Get hydrology statistics for a project
   */
  async getHydrologyStats(projectId) {
    const simulation = await this.loadSimulation(projectId);

    if (!simulation) {
      return null;
    }

    const { storm, catchments, summary } = simulation;

    return {
      designStorm: {
        returnPeriod: storm?.returnPeriod,
        duration: storm?.duration,
        totalDepth: storm?.totalDepth,
        city: storm?.city
      },
      catchmentStats: catchments?.map(c => ({
        name: c.name,
        area: c.area,
        cn: c.cn,
        peakFlow: c.peakFlow,
        totalVolume: c.totalVolume
      })),
      overall: {
        totalInflow: summary?.totalInflow,
        totalOutflow: summary?.totalOutflow,
        peakInflow: summary?.peakInflow,
        peakOutflow: summary?.peakOutflow,
        volumeReduction: summary?.volumeReduction,
        peakReduction: summary?.peakReduction
      }
    };
  }
}

export default StormwaterService;
