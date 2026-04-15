/**
 * SUPABASE REPOSITORY IMPLEMENTATIONS
 * 
 * Implementasi konkret dari repository interfaces untuk Supabase.
 * Menyediakan abstraksi data persistence dengan error handling konsisten.
 * 
 * @module Infrastructure.Persistence
 */
import { supabase } from '../../lib/supabase.js';
import { getPendingDrafts as getLocalDrafts, clearSyncedDrafts as clearLocalDrafts } from '../../lib/sync.js';
import { IChecklistRepository, IProyekRepository, IFileRepository, INotificationService } from '../../domain/repositories/Interfaces.js';
import { ProyekMapper } from '../../application/mappers/ProyekMapper.js';
import { Berkas } from '../../domain/entities/Management.js';
import { showSuccess, showError } from '../../components/toast.js';
import { RepositoryError, NotFoundError } from '../../domain/errors/DomainError.js';

/**
 * FILE MAPPER
 */
class FileMapper {
  static toDomain(raw) {
    if (!raw) return null;
    return new Berkas({
      id: raw.id,
      proyek_id: raw.proyek_id,
      nama: raw.name || raw.nama,
      kategori: raw.category || raw.kategori,
      subkategori: raw.subcategory || raw.subkategori,
      ai_summary: raw.ai_summary,
      completeness: raw.completeness,
      status: raw.status,
      metadata: raw.metadata
    });
  }
}

/**
 * Supabase Checklist Repository
 * 
 * @class SupabaseChecklistRepository
 * @extends IChecklistRepository
 * @memberof Infrastructure.Persistence
 */
export class SupabaseChecklistRepository extends IChecklistRepository {
  /**
   * Ambil draft yang pending dari IndexedDB (local cache)
   * @returns {Promise<Array>} Array draft items
   * @throws {RepositoryError} Jika gagal mengakses local storage
   */
  async getPendingDrafts() {
    try {
      return await getLocalDrafts();
    } catch (err) {
      throw new RepositoryError(
        'Gagal mengambil draft dari local storage',
        'getPendingDrafts',
        { originalError: err.message }
      );
    }
  }

  /**
   * Hapus draft yang sudah tersinkronisasi dari local cache
   * @param {Array<string>} ids - Array ID draft yang akan dihapus
   * @returns {Promise<void>}
   * @throws {RepositoryError} Jika gagal menghapus draft
   */
  async clearSyncedDrafts(ids) {
    try {
      return await clearLocalDrafts(ids);
    } catch (err) {
      throw new RepositoryError(
        'Gagal membersihkan draft yang sudah tersinkronisasi',
        'clearSyncedDrafts',
        { ids, originalError: err.message }
      );
    }
  }

  /**
   * Ambil checklist item berdasarkan ID
   * @param {string} id - UUID item
   * @returns {Promise<Object>} Data checklist item
   * @throws {NotFoundError} Jika item tidak ditemukan
   * @throws {RepositoryError} Jika terjadi error database
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Checklist Item', id);
        }
        throw error;
      }
      
      return data;
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      
      throw new RepositoryError(
        `Gagal mengambil checklist item dengan ID ${id}`,
        'getById',
        { id, originalError: err.message }
      );
    }
  }

  /**
   * Update checklist item
   * @param {string} id - UUID item
   * @param {Object} data - Data yang akan diupdate
   * @returns {Promise<void>}
   * @throws {RepositoryError} Jika update gagal
   */
  async update(id, data) {
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      throw new RepositoryError(
        `Gagal mengupdate checklist item ${id}`,
        'update',
        { id, originalError: err.message }
      );
    }
  }

  /**
   * Batch upsert banyak checklist items
   * @param {Array<Object>} items - Array items yang akan diupsert
   * @returns {Promise<void>}
   * @throws {RepositoryError} Jika upsert gagal
   */
  async upsertMany(items) {
    try {
      const { error } = await supabase
        .from('checklist_items')
        .upsert(items);
      
      if (error) throw error;
    } catch (err) {
      throw new RepositoryError(
        `Gagal menyimpan ${items.length} items ke database`,
        'upsertMany',
        { count: items.length, originalError: err.message }
      );
    }
  }
}

/**
 * Supabase Proyek Repository
 * 
 * @class SupabaseProyekRepository
 * @extends IProyekRepository
 * @memberof Infrastructure.Persistence
 */
export class SupabaseProyekRepository extends IProyekRepository {
  /**
   * Ambil semua proyek, diurutkan berdasarkan tanggal pembuatan (terbaru dulu)
   * @returns {Promise<Array<Proyek>>} Array domain entities Proyek
   * @throws {RepositoryError} Jika gagal mengambil data
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('proyek')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(row => ProyekMapper.toDomain(row));
    } catch (err) {
      throw new RepositoryError(
        'Gagal mengambil daftar proyek dari database',
        'getAll',
        { originalError: err.message }
      );
    }
  }

  /**
   * Ambil proyek berdasarkan ID
   * @param {string} id - UUID proyek
   * @returns {Promise<Proyek>} Domain entity Proyek
   * @throws {NotFoundError} Jika proyek tidak ditemukan
   * @throws {RepositoryError} Jika terjadi error database
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('proyek')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Proyek', id);
        }
        throw error;
      }
      
      return ProyekMapper.toDomain(data);
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      
      throw new RepositoryError(
        `Gagal mengambil proyek dengan ID ${id}`,
        'getById',
        { id, originalError: err.message }
      );
    }
  }

  /**
   * Simpan atau update proyek (upsert)
   * @param {Proyek} proyek - Domain entity Proyek
   * @returns {Promise<void>}
   * @throws {RepositoryError} Jika penyimpanan gagal
   */
  async save(proyek) {
    try {
      const payload = ProyekMapper.toPersistence(proyek);
      const { error } = await supabase.from('proyek').upsert(payload);
      
      if (error) throw error;
    } catch (err) {
      throw new RepositoryError(
        `Gagal menyimpan proyek ${proyek.id}`,
        'save',
        { id: proyek.id, originalError: err.message }
      );
    }
  }
}

/**
 * Supabase File Repository
 * 
 * @class SupabaseFileRepository
 * @extends IFileRepository
 * @memberof Infrastructure.Persistence
 */
export class SupabaseFileRepository extends IFileRepository {
  /**
   * Ambil berkas berdasarkan ID
   * @param {string} id - UUID berkas
   * @returns {Promise<Berkas|null>} Domain entity Berkas atau null
   * @throws {RepositoryError} Jika terjadi error database
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('proyek_files')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return FileMapper.toDomain(data);
    } catch (err) {
      throw new RepositoryError(
        `Gagal mengambil berkas dengan ID ${id}`,
        'getById',
        { id, originalError: err.message }
      );
    }
  }

  /**
   * Ambil semua berkas milik sebuah proyek
   * @param {string} projectId - UUID proyek
   * @returns {Promise<Array<Berkas>>} Array domain entities Berkas
   * @throws {RepositoryError} Jika gagal mengambil data
   */
  async getByProjectId(projectId) {
    try {
      const { data, error } = await supabase
        .from('proyek_files')
        .select('*')
        .eq('proyek_id', projectId);
      
      if (error) throw error;
      
      return data.map(FileMapper.toDomain);
    } catch (err) {
      throw new RepositoryError(
        `Gagal mengambil berkas untuk proyek ${projectId}`,
        'getByProjectId',
        { projectId, originalError: err.message }
      );
    }
  }

  /**
   * Update data berkas
   * @param {string} id - UUID berkas
   * @param {Object} data - Data yang akan diupdate
   * @returns {Promise<void>}
   * @throws {RepositoryError} Jika update gagal
   */
  async update(id, data) {
    try {
      const { error } = await supabase
        .from('proyek_files')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      throw new RepositoryError(
        `Gagal mengupdate berkas ${id}`,
        'update',
        { id, originalError: err.message }
      );
    }
  }
}

/**
 * Browser Notification Service
 * 
 * Implementasi konkret dari INotificationService menggunakan Toast UI.
 * Menyediakan notifikasi visual di browser.
 * 
 * @class BrowserNotificationService
 * @extends INotificationService
 * @memberof Infrastructure.Persistence
 */
export class BrowserNotificationService extends INotificationService {
  /**
   * Tampilkan notifikasi sukses
   * @param {string} message - Pesan yang akan ditampilkan
   */
  notifySuccess(message) {
    showSuccess(message);
  }

  /**
   * Tampilkan notifikasi error
   * @param {string} message - Pesan error yang akan ditampilkan
   */
  notifyError(message) {
    showError(message);
  }

  /**
   * Tampilkan notifikasi info
   * @param {string} message - Pesan info yang akan ditampilkan
   */
  notifyInfo(message) {
    // Implementation depends on available toast functions
    if (typeof showInfo === 'function') {
      showInfo(message);
    }
  }
}
