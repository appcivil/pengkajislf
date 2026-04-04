// ============================================================
//  SUPABASE CLIENT
//  Inisialisasi koneksi Supabase
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Guard: tampilkan peringatan jelas jika konfigurasi belum diisi
if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    '[Supabase] ❌ KONFIGURASI TIDAK LENGKAP!\n' +
    'Pastikan file .env berisi:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key\n' +
    'Aplikasi tidak dapat terhubung ke database tanpa konfigurasi ini.'
  );
}

// FIX: Hapus duplikat `detectSessionInUrl` — hanya pakai satu nilai
// `detectSessionInUrl: false` mencegah konflik token di lingkungan multi-tab
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,   // Diperlukan untuk mode implicit agar bisa mendeteksi token di URL
      storageKey: 'sb-slf-auth-token',
      flowType: 'implicit',       // Menggunakan mode implicit (Legacy/Simple) untuk stabilitas koneksi awal
    },
  }
);

// Helper: cek apakah Supabase sudah dikonfigurasi dengan benar
export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON && !SUPABASE_URL.includes('placeholder'));
}

// Helper: get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper: get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export default supabase;
