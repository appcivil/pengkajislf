/**
 * AUDIT SERVICE
 * Mencatat aktivitas pengguna untuk kepatuhan UU ITE & Kominfo (PSE).
 * Akuntabilitas data dan pelacakan forensik perubahan dokumen teknis.
 */
import { supabase } from './supabase.js';

/**
 * Mencatat aktivitas ke tabel 'system_logs' (Audit Trail).
 * @param {string} action - Deskripsi aksi (misal: 'SIMPAN_CHECKLIST', 'TERBIT_LAPORAN')
 * @param {string} proyekId - ID Proyek terkait
 * @param {object} metadata - Detail tambahan (IP, User Agent, Perubahan Data)
 */
export async function logActivity(action, proyekId, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const logEntry = {
      user_id: user.id,
      user_email: user.email,
      proyek_id: proyekId,
      action: action,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      }
    };

    // Mencoba simpan ke database (tabel system_logs harus tersedia)
    const { error } = await supabase.from('system_logs').insert([logEntry]);
    
    if (error) {
       // Fallback ke localStorage jika tabel log belum di-setup di Supabase
       if (error.code === '42P01' || error.status === 404) {
          console.warn('[AuditService] Tabel system_logs belum tersedia. Gunakan SQL Editor untuk membuatnya.');
       }
       
       const localLogs = JSON.parse(localStorage.getItem('slf_audit_logs') || '[]');
       localLogs.push(logEntry);
       localStorage.setItem('slf_audit_logs', JSON.stringify(localLogs.slice(-100))); // Simpan 100 terakhir
    }

  } catch (err) {
    console.error('[AuditService] Log Error:', err);
  }
}

/**
 * Mendapatkan log aktivitas untuk proyek tertentu (Hanya Administrator).
 */
export async function getAuditLogs(proyekId) {
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('proyek_id', proyekId)
      .order('created_at', { ascending: false });
      
    if (error) {
      if (error.code === '42P01' || error.status === 404) {
        return { isMissing: true };
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.warn('[AuditService] Gagal fetch log (mungkin tabel belum ada).');
    return { isMissing: true };
  }
}
