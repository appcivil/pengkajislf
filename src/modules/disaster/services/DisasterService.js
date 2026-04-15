/**
 * DISASTER SERVICE
 * Service untuk manajemen data mitigasi bencana
 */

import { supabase } from '../../../lib/supabase.js';
import { InaRiskConnector } from '../core/InaRiskConnector.js';

export class DisasterService {
  constructor() {
    this.inarisk = new InaRiskConnector();
    this.cache = new Map();
  }

  /**
   * Load disaster analysis untuk project
   */
  async loadAnalysis(projectId) {
    try {
      const { data, error } = await supabase
        .from('disaster_analysis')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[DisasterService] Load analysis failed:', e);
      return null;
    }
  }

  /**
   * Save disaster analysis
   */
  async saveAnalysis(projectId, analysis) {
    try {
      const { data, error } = await supabase
        .from('disaster_analysis')
        .upsert({
          project_id: projectId,
          hazard_type: analysis.hazardType,
          intensity: analysis.intensity,
          vulnerability: analysis.vulnerability,
          risk_score: analysis.riskScore,
          mitigation_plan: analysis.mitigationPlan,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[DisasterService] Save analysis failed:', e);
      throw e;
    }
  }

  /**
   * Load mitigation measures untuk project
   */
  async loadMitigations(projectId) {
    try {
      const { data, error } = await supabase
        .from('disaster_mitigations')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('[DisasterService] Load mitigations failed:', e);
      return [];
    }
  }

  /**
   * Save mitigation measure
   */
  async saveMitigation(projectId, mitigation) {
    try {
      const { data, error } = await supabase
        .from('disaster_mitigations')
        .upsert({
          project_id: projectId,
          measure_id: mitigation.id,
          name: mitigation.name,
          category: mitigation.category,
          cost: mitigation.totalCost,
          effectiveness: mitigation.effectiveness,
          status: mitigation.status || 'proposed'
        });

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[DisasterService] Save mitigation failed:', e);
      throw e;
    }
  }

  /**
   * Fetch hazard data dari INARisk
   */
  async fetchHazardData(type, bounds, returnPeriod = 100) {
    return this.inarisk.fetchHazardData(type, bounds, returnPeriod);
  }

  /**
   * Get available hazard types
   */
  getHazardTypes() {
    return this.inarisk.getHazardTypes();
  }

  /**
   * Get return periods
   */
  getReturnPeriods() {
    return this.inarisk.getReturnPeriods();
  }
}

export default DisasterService;
