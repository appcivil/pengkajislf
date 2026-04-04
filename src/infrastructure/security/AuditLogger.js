/**
 * DATABASE AUDIT LOGGER
 * Implementasi IAuditLogger untuk Supabase.
 * FIXED: Menggunakan tabel `system_logs` sesuai schema aktual (bukan `audit_logs`).
 */
import { supabase } from '../../lib/supabase.js';
import { IAuditLogger } from '../../domain/repositories/Interfaces.js';

export class DatabaseAuditLogger extends IAuditLogger {
  /**
   * Mencatat log ke tabel `system_logs` (sesuai supabase_schema.sql).
   * @param {string} action - Kode aksi (e.g., 'ANALISIS_AI', 'GENERATE_LAPORAN')
   * @param {object|string} details - Metadata tambahan
   * @param {string} userId - UUID user (default: 'system')
   */
  async log(action, details, userId = 'system') {
    // Guard: jangan log jika bukan UUID valid
    const resolvedUserId = userId && userId !== 'system' ? userId : null;

    const logData = {
      user_id:    resolvedUserId,
      action:     action,
      // Schema system_logs menggunakan field `metadata` bukan `details`
      metadata:   typeof details === 'string' ? { message: details } : (details ?? {}),
    };

    // Selalu log ke console untuk traceability
    console.log(`[Audit] [${action}]`, logData);

    try {
      const { error } = await supabase
        .from('system_logs')  // FIXED: gunakan tabel yang ada di schema
        .insert([logData]);

      if (error) {
        // Fail-safe: jangan hentikan aplikasi karena gagal log
        console.warn('[Audit] Gagal menyimpan log ke system_logs:', error.message);
      }
    } catch (e) {
      console.error('[Audit] Error fatal saat logging:', e);
    }
  }
}
