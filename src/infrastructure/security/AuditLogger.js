/**
 * DATABASE AUDIT LOGGER
 * Implementasi IAuditLogger untuk Supabase.
 */
import { supabase } from '../../lib/supabase.js';
import { IAuditLogger } from '../../domain/repositories/Interfaces.js';

export class DatabaseAuditLogger extends IAuditLogger {
  /**
   * Mencatat log ke database.
   */
  async log(action, details, userId = 'system') {
    const logData = {
      user_id: userId,
      action: action,
      details: typeof details === 'string' ? { message: details } : details,
      timestamp: new Date().toISOString(),
      ip_address: window.clientIP || 'unknown'
    };

    console.log(`[Audit] ${action}: `, logData);

    try {
      const { error } = await supabase.from('audit_logs').insert([logData]);
      if (error) {
        // Jika tabel belum ada, jangan hentikan aplikasi (fail-safe)
        console.warn("[Audit] Gagal menyimpan log: ", error.message);
      }
    } catch (e) {
      console.error("[Audit] Error fatal: ", e);
    }
  }
}
