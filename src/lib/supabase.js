// ============================================================
//  SUPABASE CLIENT
//  Inisialisasi koneksi Supabase
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://dummy-id.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key';

if (SUPABASE_URL === 'https://dummy-id.supabase.co') {
  console.warn('[Supabase] VITE_SUPABASE_URL kosong. Menggunakan mode Fallback/Mock. Pastikan membuat file .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

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
