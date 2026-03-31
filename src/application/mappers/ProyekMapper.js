import { Proyek } from '../../domain/entities/Proyek.js';

/**
 * PROYEK MAPPER
 * Mentransformasi data antar lapisan (Infra <-> Domain).
 */
export class ProyekMapper {
  /**
   * Mengubah Baris Data Supabase ke Domain Entity
   */
  static toDomain(raw) {
    if (!raw) return null;
    return new Proyek({
      id: raw.id,
      nama: raw.nama,
      alamat: raw.alamat,
      status: raw.status,
      skore: raw.skore || 0,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      metadata: raw.metadata || {}
    });
  }

  /**
   * Mengubah Domain Entity ke Data Supabase (Upsert Payload)
   */
  static toPersistence(domain) {
    return {
      id: domain.id,
      nama: domain.nama,
      alamat: domain.alamat,
      status: domain.status,
      skore: domain.skore,
      metadata: domain.metadata,
      updated_at: new Date().toISOString()
    };
  }
}
