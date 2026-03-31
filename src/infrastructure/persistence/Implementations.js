/**
 * SUPABASE CHECKLIST REPOSITORY
 * Implementasi repositori untuk Supabase & IndexedDB Sync.
 */
import { supabase } from '../../lib/supabase.js';
import { getPendingDrafts as getLocalDrafts, clearSyncedDrafts as clearLocalDrafts } from '../../lib/sync.js';
import { IChecklistRepository, IProyekRepository, IFileRepository, IAIService, INotificationService } from '../../domain/repositories/Interfaces.js';
import { ProyekMapper } from '../../application/mappers/ProyekMapper.js';
import { Berkas } from '../../domain/entities/Management.js';
import { showSuccess, showError } from '../../components/toast.js';

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

export class SupabaseChecklistRepository extends IChecklistRepository {
  async getPendingDrafts() {
    return await getLocalDrafts();
  }

  async clearSyncedDrafts(ids) {
    return await clearLocalDrafts(ids);
  }

  async upsertMany(items) {
    const { error } = await supabase
      .from('checklist_items')
      .upsert(items, { onConflict: 'proyek_id, kode' });

    if (error) throw error;
  }
}

/**
 * SUPABASE PROYEK REPOSITORY
 * Implementasi repositori untuk data Proyek.
 */
export class SupabaseProyekRepository extends IProyekRepository {
  async getAll() {
    const { data, error } = await supabase.from('proyek').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(row => ProyekMapper.toDomain(row));
  }

  async getById(id) {
    const { data, error } = await supabase.from('proyek').select('*').eq('id', id).single();
    if (error) throw error;
    return ProyekMapper.toDomain(data);
  }

  async save(proyek) {
    const payload = ProyekMapper.toPersistence(proyek);
    const { error } = await supabase.from('proyek').upsert(payload);
    if (error) throw error;
  }
}

/**
 * SUPABASE FILE REPOSITORY
 */
export class SupabaseFileRepository extends IFileRepository {
  async getById(id) {
    const { data, error } = await supabase.from('proyek_files').select('*').eq('id', id).single();
    if (error) throw error;
    return FileMapper.toDomain(data);
  }

  async getByProjectId(projectId) {
    const { data, error } = await supabase.from('proyek_files').select('*').eq('proyek_id', projectId);
    if (error) throw error;
    return data.map(FileMapper.toDomain);
  }

  async update(id, data) {
    const { error } = await supabase.from('proyek_files').update(data).eq('id', id);
    if (error) throw error;
  }
}

/**
 * BROWSER NOTIFICATION SERVICE
 * Implementasi konkret sistem notifikasi menggunakan Toast UI.
 */
export class BrowserNotificationService extends INotificationService {
  notifySuccess(message) {
    showSuccess(message);
  }
  notifyError(message) {
    showError(message);
  }
}
