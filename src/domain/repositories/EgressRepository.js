/**
 * EGRESS SYSTEM REPOSITORY INTERFACE
 * Kontrak untuk operasi data sistem jalur evakuasi
 */

/**
 * IEgressRepository - Interface untuk repository egress
 */
export class IEgressRepository {
  /**
   * Ambil semua data egress untuk sebuah proyek
   * @param {string} projectId - ID proyek
   * @returns {Promise<Object>} Data egress lengkap
   */
  async getByProjectId(projectId) {
    throw new Error('Not implemented');
  }

  /**
   * Ambil data summary untuk sebuah proyek
   * @param {string} projectId - ID proyek
   * @returns {Promise<Object>} Summary data
   */
  async getSummary(projectId) {
    throw new Error('Not implemented');
  }

  /**
   * Simpan data egress route
   * @param {Object} routeData - Data route
   * @returns {Promise<Object>} Route yang tersimpan
   */
  async saveRoute(routeData) {
    throw new Error('Not implemented');
  }

  /**
   * Simpan data exit component
   * @param {Object} componentData - Data komponen
   * @returns {Promise<Object>} Component yang tersimpan
   */
  async saveComponent(componentData) {
    throw new Error('Not implemented');
  }

  /**
   * Simpan data emergency lighting
   * @param {Object} lightingData - Data lighting
   * @returns {Promise<Object>} Lighting yang tersimpan
   */
  async saveEmergencyLighting(lightingData) {
    throw new Error('Not implemented');
  }

  /**
   * Simpan data smoke zone
   * @param {Object} zoneData - Data zone
   * @returns {Promise<Object>} Zone yang tersimpan
   */
  async saveSmokeZone(zoneData) {
    throw new Error('Not implemented');
  }

  /**
   * Simpan data occupant load
   * @param {Object} occupantData - Data occupant
   * @returns {Promise<Object>} Occupant yang tersimpan
   */
  async saveOccupantLoad(occupantData) {
    throw new Error('Not implemented');
  }

  /**
   * Simpan data analysis
   * @param {Object} analysisData - Data analysis
   * @returns {Promise<Object>} Analysis yang tersimpan
   */
  async saveAnalysis(analysisData) {
    throw new Error('Not implemented');
  }

  /**
   * Simpan data evacuation drill
   * @param {Object} drillData - Data drill
   * @returns {Promise<Object>} Drill yang tersimpan
   */
  async saveEvacuationDrill(drillData) {
    throw new Error('Not implemented');
  }

  /**
   * Hapus data egress route
   * @param {string} routeId - ID route
   * @returns {Promise<boolean>} Status penghapusan
   */
  async deleteRoute(routeId) {
    throw new Error('Not implemented');
  }

  /**
   * Hapus data exit component
   * @param {string} componentId - ID component
   * @returns {Promise<boolean>} Status penghapusan
   */
  async deleteComponent(componentId) {
    throw new Error('Not implemented');
  }

  /**
   * Upload foto ke storage
   * @param {File} file - File foto
   * @param {string} projectId - ID proyek
   * @returns {Promise<string>} URL atau ID file
   */
  async uploadPhoto(file, projectId) {
    throw new Error('Not implemented');
  }

  /**
   * Hapus foto dari storage
   * @param {string} fileId - ID file
   * @returns {Promise<boolean>} Status penghapusan
   */
  async deletePhoto(fileId) {
    throw new Error('Not implemented');
  }
}

/**
 * EGRESS REPOSITORY IMPLEMENTATION (Supabase)
 */
export class EgressSupabaseRepository extends IEgressRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async getByProjectId(projectId) {
    const [routesResult, componentsResult, lightingResult, zonesResult, occupantResult, analysisResult, drillsResult] = await Promise.all([
      this.supabase.from('egress_routes').select('*').eq('project_id', projectId),
      this.supabase.from('exit_components').select('*').eq('project_id', projectId),
      this.supabase.from('emergency_lighting').select('*').eq('project_id', projectId),
      this.supabase.from('smoke_zones').select('*').eq('project_id', projectId),
      this.supabase.from('occupant_loads').select('*').eq('project_id', projectId),
      this.supabase.from('egress_analysis').select('*').eq('project_id', projectId),
      this.supabase.from('evacuation_drills').select('*').eq('project_id', projectId)
    ]);

    return {
      routes: routesResult.data || [],
      components: componentsResult.data || [],
      lighting: lightingResult.data || [],
      smokeZones: zonesResult.data || [],
      occupantLoads: occupantResult.data || [],
      analysis: analysisResult.data || [],
      drills: drillsResult.data || []
    };
  }

  async getSummary(projectId) {
    const { data: analysis, error } = await this.supabase
      .from('egress_analysis')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const latestAnalysis = analysis?.[0];
    
    // Count data
    const { data: counts } = await this.supabase
      .rpc('get_egress_counts', { p_project_id: projectId });

    return {
      hasData: !!latestAnalysis || (counts && counts.total_routes > 0),
      complianceScore: latestAnalysis?.compliance_score || 0,
      status: latestAnalysis?.status || 'NOT_STARTED',
      totalRoutes: counts?.total_routes || 0,
      totalComponents: counts?.total_components || 0,
      totalLighting: counts?.total_lighting || 0,
      totalSmokeZones: counts?.total_smoke_zones || 0,
      nonCompliantItems: counts?.non_compliant || 0,
      latestAnalysis,
      lastUpdated: latestAnalysis?.updated_at || null
    };
  }

  async saveRoute(routeData) {
    const { data, error } = await this.supabase
      .from('egress_routes')
      .upsert({
        ...routeData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async saveComponent(componentData) {
    const { data, error } = await this.supabase
      .from('exit_components')
      .upsert({
        ...componentData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async saveEmergencyLighting(lightingData) {
    const { data, error } = await this.supabase
      .from('emergency_lighting')
      .upsert({
        ...lightingData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async saveSmokeZone(zoneData) {
    const { data, error } = await this.supabase
      .from('smoke_zones')
      .upsert({
        ...zoneData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async saveOccupantLoad(occupantData) {
    const { data, error } = await this.supabase
      .from('occupant_loads')
      .upsert({
        ...occupantData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async saveAnalysis(analysisData) {
    const { data, error } = await this.supabase
      .from('egress_analysis')
      .upsert({
        ...analysisData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async saveEvacuationDrill(drillData) {
    const { data, error } = await this.supabase
      .from('evacuation_drills')
      .upsert({
        ...drillData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRoute(routeId) {
    const { error } = await this.supabase
      .from('egress_routes')
      .delete()
      .eq('id', routeId);

    if (error) throw error;
    return true;
  }

  async deleteComponent(componentId) {
    const { error } = await this.supabase
      .from('exit_components')
      .delete()
      .eq('id', componentId);

    if (error) throw error;
    return true;
  }

  async uploadPhoto(file, projectId) {
    const filePath = `${projectId}/egress/${Date.now()}_${file.name}`;
    const { data, error } = await this.supabase.storage
      .from('project-photos')
      .upload(filePath, file);

    if (error) throw error;
    return data.path;
  }

  async deletePhoto(fileId) {
    const { error } = await this.supabase.storage
      .from('project-photos')
      .remove([fileId]);

    if (error) throw error;
    return true;
  }
}
