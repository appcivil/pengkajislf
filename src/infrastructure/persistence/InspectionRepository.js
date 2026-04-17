// ============================================================
// INSPECTION REPOSITORY - Clean Architecture Facade
// Abstraksi database untuk semua modul pemeriksaan SLF
// ============================================================

import { supabase } from '../../lib/supabase.js';

/**
 * Repository facade untuk operasi database inspection.
 * Menghentikan praktik direct Supabase calls di UI layer.
 * 
 * @example
 * const repo = new InspectionRepository();
 * const project = await repo.getProject(projectId);
 * const rooms = await repo.getComfortRooms(projectId);
 */
export class InspectionRepository {
  constructor() {
    this.supabase = supabase;
  }

  // ============================================================
  // PROJECT OPERATIONS
  // ============================================================

  /**
   * Mengambil data proyek berdasarkan ID
   * @param {string} projectId - UUID proyek
   * @returns {Promise<Object|null>} Data proyek
   */
  async getProject(projectId) {
    const { data, error } = await this.supabase
      .from('proyek')
      .select('id, nama_bangunan, alamat, luas_bangunan, fungsi_bangunan, type_bangunan, jumlah_lantai')
      .eq('id', projectId)
      .single();
    
    if (error) throw new RepositoryError(`Gagal memuat proyek: ${error.message}`);
    return data;
  }

  /**
   * Mengambil daftar semua proyek untuk dropdown
   * @returns {Promise<Array>} Daftar proyek
   */
  async getAllProjects() {
    const { data, error } = await this.supabase
      .from('proyek')
      .select('id, nama_bangunan, alamat')
      .order('created_at', { ascending: false });
    
    if (error) throw new RepositoryError(`Gagal memuat daftar proyek: ${error.message}`);
    return data || [];
  }

  // ============================================================
  // COMFORT MODULE OPERATIONS
  // ============================================================

  async getComfortRooms(projectId) {
    const { data, error } = await this.supabase
      .from('comfort_rooms')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw new RepositoryError(`Gagal memuat data ruangan: ${error.message}`);
    return data || [];
  }

  async getComfortClimateData(projectId) {
    const { data, error } = await this.supabase
      .from('comfort_climate')
      .select('*')
      .eq('project_id', projectId)
      .order('measured_at', { ascending: false });
    
    if (error) throw new RepositoryError(`Gagal memuat data iklim: ${error.message}`);
    return data || [];
  }

  async getComfortNoiseData(projectId) {
    const { data, error } = await this.supabase
      .from('comfort_noise')
      .select('*')
      .eq('project_id', projectId)
      .order('measured_at', { ascending: false });
    
    if (error) throw new RepositoryError(`Gagal memuat data kebisingan: ${error.message}`);
    return data || [];
  }

  async getComfortVibrationData(projectId) {
    const { data, error } = await this.supabase
      .from('comfort_vibration')
      .select('*')
      .eq('project_id', projectId)
      .order('measured_at', { ascending: false });
    
    if (error) throw new RepositoryError(`Gagal memuat data getaran: ${error.message}`);
    return data || [];
  }

  async getComfortViewData(projectId) {
    const { data, error } = await this.supabase
      .from('comfort_view')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw new RepositoryError(`Gagal memuat data pandangan: ${error.message}`);
    return data || [];
  }

  async getComfortSummary(projectId) {
    const { data, error } = await this.supabase
      .from('comfort_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error
      throw new RepositoryError(`Gagal memuat ringkasan: ${error.message}`);
    }
    return data;
  }

  // ============================================================
  // ELECTRICAL MODULE OPERATIONS
  // ============================================================

  async getElectricalPanels(projectId) {
    const { data, error } = await this.supabase
      .from('electrical_panels')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw new RepositoryError(`Gagal memuat data panel: ${error.message}`);
    return data || [];
  }

  async getElectricalMeasurements(panelId, options = {}) {
    let query = this.supabase
      .from('electrical_measurements')
      .select('*')
      .eq('panel_id', panelId)
      .order('measured_at', { ascending: false });
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw new RepositoryError(`Gagal memuat pengukuran: ${error.message}`);
    return data || [];
  }

  async getElectricalThermalImages(panelId) {
    const { data, error } = await this.supabase
      .from('electrical_thermal_images')
      .select('*')
      .eq('panel_id', panelId)
      .order('captured_at', { ascending: false });
    
    if (error) throw new RepositoryError(`Gagal memuat data thermal: ${error.message}`);
    return data || [];
  }

  // ============================================================
  // ARCHITECTURAL MODULE OPERATIONS
  // ============================================================

  async getArchitecturalData(projectId) {
    const { data, error } = await this.supabase
      .from('architectural_assessments')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError(`Gagal memuat data arsitektur: ${error.message}`);
    }
    return data;
  }

  // ============================================================
  // STRUCTURAL MODULE OPERATIONS
  // ============================================================

  async getStructuralData(projectId) {
    const { data, error } = await this.supabase
      .from('structural_assessments')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError(`Gagal memuat data struktur: ${error.message}`);
    }
    return data;
  }

  // ============================================================
  // FIRE PROTECTION MODULE OPERATIONS
  // ============================================================

  async getFireProtectionData(projectId) {
    const { data, error } = await this.supabase
      .from('fire_protection_assessments')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError(`Gagal memuat data proteksi kebakaran: ${error.message}`);
    }
    return data;
  }

  // ============================================================
  // ACCESSIBILITY MODULE OPERATIONS
  // ============================================================

  async getAccessibilityData(projectId) {
    const { data, error } = await this.supabase
      .from('accessibility_assessments')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError(`Gagal memuat data aksesibilitas: ${error.message}`);
    }
    return data;
  }

  // ============================================================
  // WATER SYSTEM MODULE OPERATIONS
  // ============================================================

  async getWaterSystemData(projectId) {
    const { data, error } = await this.supabase
      .from('water_system_assessments')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError(`Gagal memuat data sistem air: ${error.message}`);
    }
    return data;
  }

  // ============================================================
  // WASTEWATER MODULE OPERATIONS
  // ============================================================

  async getWastewaterData(projectId) {
    const { data, error } = await this.supabase
      .from('wastewater_assessments')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError(`Gagal memuat data air limbah: ${error.message}`);
    }
    return data;
  }

  // ============================================================
  // GENERIC CRUD OPERATIONS
  // ============================================================

  /**
   * Insert data ke tabel
   * @param {string} table - Nama tabel
   * @param {Object} data - Data untuk diinsert
   * @returns {Promise<Object>} Data yang diinsert
   */
  async insert(table, data) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw new RepositoryError(`Gagal menyimpan data: ${error.message}`);
    return result;
  }

  /**
   * Update data di tabel
   * @param {string} table - Nama tabel
   * @param {string} id - ID record
   * @param {Object} data - Data untuk diupdate
   * @returns {Promise<Object>} Data yang diupdate
   */
  async update(table, id, data) {
    const { data: result, error } = await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new RepositoryError(`Gagal mengupdate data: ${error.message}`);
    return result;
  }

  /**
   * Delete data dari tabel
   * @param {string} table - Nama tabel
   * @param {string} id - ID record
   */
  async delete(table, id) {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw new RepositoryError(`Gagal menghapus data: ${error.message}`);
  }

  /**
   * Query generic dengan filter
   * @param {string} table - Nama tabel
   * @param {Object} filters - Object key-value untuk filter
   * @param {Object} options - Opsi tambahan (order, limit)
   * @returns {Promise<Array>} Hasil query
   */
  async query(table, filters = {}, options = {}) {
    let query = this.supabase.from(table).select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.ascending ?? false 
      });
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw new RepositoryError(`Query gagal: ${error.message}`);
    return data || [];
  }
}

/**
 * Custom Error Class untuk Repository
 */
export class RepositoryError extends Error {
  constructor(message, code = 'REPOSITORY_ERROR') {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
  }
}

/**
 * Singleton instance untuk convenience
 * Gunakan ini untuk import cepat
 */
export const inspectionRepository = new InspectionRepository();
