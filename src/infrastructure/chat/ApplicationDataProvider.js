/**
 * Infrastructure: ApplicationDataProvider
 * Provider untuk mengakses data aplikasi sebagai context chatbot
 */
import { supabase } from '../../lib/supabase.js';

export class ApplicationDataProvider {
  constructor() {
    this.supabase = supabase;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 menit
  }

  /**
   * Get context data untuk AI
   */
  async getContextData(projectId = null, moduleContext = null) {
    const context = {
      timestamp: new Date().toISOString(),
      project: null,
      modules: {},
      user: null
    };

    if (projectId) {
      context.project = await this._getProjectData(projectId);
      context.modules = await this._getModuleData(projectId);
    }

    if (moduleContext && projectId) {
      context.currentModule = await this._getSpecificModuleData(projectId, moduleContext);
    }

    // Get user info
    context.user = await this._getCurrentUser();

    return context;
  }

  /**
   * Get project data
   */
  async _getProjectData(projectId) {
    const cacheKey = `project_${projectId}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      const result = data ? {
        id: data.id,
        name: data.nama_proyek || data.name,
        location: data.lokasi,
        buildingType: data.jenis_bangunan,
        totalFloors: data.jumlah_lantai,
        buildingArea: data.luas_bangunan,
        landArea: data.luas_tanah,
        status: data.status,
        createdAt: data.created_at
      } : null;

      this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[ApplicationDataProvider] getProjectData error:', error);
      return null;
    }
  }

  /**
   * Get semua module data untuk project
   */
  async _getModuleData(projectId) {
    const modules = {};

    // Architectural data
    modules.architectural = await this._getArchitecturalData(projectId);
    
    // Structural data
    modules.structural = await this._getStructuralData(projectId);
    
    // Fire protection data
    modules.fireProtection = await this._getFireProtectionData(projectId);
    
    // Electrical data
    modules.electrical = await this._getElectricalData(projectId);
    
    // Accessibility data
    modules.accessibility = await this._getAccessibilityData(projectId);
    
    // Comfort data
    modules.comfort = await this._getComfortData(projectId);

    return modules;
  }

  /**
   * Get specific module data
   */
  async _getSpecificModuleData(projectId, moduleName) {
    const cacheKey = `${moduleName}_${projectId}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    const moduleMap = {
      'architectural': this._getArchitecturalData,
      'structural': this._getStructuralData,
      'fire': this._getFireProtectionData,
      'electrical': this._getElectricalData,
      'lps': this._getLPSData,
      'accessibility': this._getAccessibilityData,
      'comfort': this._getComfortData,
      'water': this._getWaterData,
      'wastewater': this._getWastewaterData,
      'stormwater': this._getStormwaterData,
      'environmental': this._getEnvironmentalData
    };

    const getter = moduleMap[moduleName];
    if (!getter) return null;

    const result = await getter.call(this, projectId);
    this._setCache(cacheKey, result);
    return result;
  }

  /**
   * Get architectural data
   */
  async _getArchitecturalData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('architectural_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;

      return data ? {
        kdb: data.kdb,
        klb: data.klb,
        buildingHeight: data.building_height,
        floors: data.number_of_floors,
        compliance: data.compliance_status
      } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get structural data
   */
  async _getStructuralData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('structural_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;

      return data ? {
        structureSystem: data.structure_system,
        material: data.material,
        seismicZone: data.seismic_zone,
        soilType: data.soil_type,
        compliance: data.compliance_status
      } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get fire protection data
   */
  async _getFireProtectionData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('fire_protection_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;

      return data ? {
        buildingClassification: data.building_classification,
        fireLoad: data.fire_load,
        detectionSystem: data.detection_system,
        suppressionSystem: data.suppression_system,
        compliance: data.compliance_status
      } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get electrical data
   */
  async _getElectricalData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('electrical_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;

      return data ? {
        powerSource: data.power_source,
        installedPower: data.installed_power,
        groundingSystem: data.grounding_system,
        compliance: data.compliance_status
      } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get LPS data
   */
  async _getLPSData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('lps_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;

      return data ? {
        classOfLPS: data.class_of_lps,
        thunderstormDays: data.thunderstorm_days,
        riskAssessment: data.risk_assessment,
        compliance: data.compliance_status
      } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get accessibility data
   */
  async _getAccessibilityData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('accessibility_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;

      return data ? {
        rampGradient: data.ramp_gradient,
        rampWidth: data.ramp_width,
        doorWidth: data.door_width,
        corridorWidth: data.corridor_width,
        compliance: data.compliance_status
      } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get comfort data
   */
  async _getComfortData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('comfort_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;

      return data ? {
        daylightFactor: data.daylight_factor,
        airVelocity: data.air_velocity,
        indoorTemperature: data.indoor_temperature,
        relativeHumidity: data.relative_humidity,
        noiseLevel: data.noise_level,
        compliance: data.compliance_status
      } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get water system data
   */
  async _getWaterData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('water_system_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data ? { compliance: data.compliance_status } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get wastewater data
   */
  async _getWastewaterData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('wastewater_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data ? { compliance: data.compliance_status } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get stormwater data
   */
  async _getStormwaterData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('stormwater_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data ? { compliance: data.compliance_status } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get environmental data
   */
  async _getEnvironmentalData(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('environmental_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data ? { compliance: data.compliance_status } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current user
   */
  async _getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error || !user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get cache
   */
  _getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cache
   */
  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}
