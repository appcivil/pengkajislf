// ============================================================
//  AUTHENTICATION MODULE
//  Google OAuth via Supabase Auth
//  SECURITY FIX: Admin check divalidasi dari DB, bukan hanya client-side
// ============================================================
import { supabase } from './supabase.js';
import { APP_CONFIG } from './config.js';
import { store } from './store.js';

// State management
let _currentUser = null;
let _isAdmin     = false;   // SECURITY: cache admin status dari DB
const _listeners = new Set();
const DEV_USER_KEY = 'slf_dev_user';


// Notify all auth state listeners
function notifyListeners(user) {
  _listeners.forEach(fn => fn(user));
  // Global Store Sync
  store.set({ user });
}

// Initialize auth - call on app start
export async function initAuth() {
  console.log('[Auth] Initializing session...');
  
  // 1. Ambil session pertama kali secara eksplisit
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (session?.user) {
      _currentUser = session.user;
      // Fetch Profile asinkron di background
      _fetchAndSetProfile(_currentUser);
    } else {
      _currentUser = null;
    }
  } catch (e) {
    console.error('[Auth] Initial session fetch failed:', e);
    _currentUser = null;
  }

  // 2. Pasang listener untuk perubahan status selanjutnya
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] State Change:', event);
    if (session?.user) {
      _currentUser = session.user;
      await _fetchAndSetProfile(_currentUser);
    } else if (event === 'SIGNED_OUT') {
      _currentUser = null;
      _isAdmin = false;
      localStorage.removeItem(DEV_USER_KEY);
    }
    notifyListeners(_currentUser);
  });

  notifyListeners(_currentUser);
  return _currentUser;
}

// Helper untuk fetch profile dan set admin status
async function _fetchAndSetProfile(user) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('force_password_change, role, status')
      .eq('id', user.id)
      .single();

    if (profile) {
      user.profile = profile;
      _isAdmin = _checkIsAdminFromProfile(profile, user.email);
    } else {
      _isAdmin = _checkIsAdminFromEmail(user.email);
    }
  } catch (e) {
    _isAdmin = _checkIsAdminFromEmail(user.email);
  }
}

// Subscribe to auth changes
export function onAuthChange(callback) {
  _listeners.add(callback);
  // Immediately call with current state
  callback(_currentUser);
  // Return unsubscribe function
  return () => _listeners.delete(callback);
}

// Sign in with Google
export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}${APP_CONFIG.base}/`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) {
    if (error.message.includes('provider is not enabled')) {
      throw new Error('Metode Login Google belum diaktifkan di Dashboard Supabase Anda atau batasan kuota tercapai. Silakan gunakan Login Email sementara.');
    }
    throw error;
  }
  return data;
}

// Sign in with Email & Password
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// Sign up with Email & Password
export async function signUpWithEmail(email, password, fullName) {
  const redirectTo = `${window.location.origin}${APP_CONFIG.base}/`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: redirectTo
    }
  });
  if (error) throw error;
  return data;
}

// Dev Mode Bypass SignIn (No Backend Required)
export async function devModeBypass() {
  if (!APP_CONFIG.features.devBypass || !import.meta.env.DEV) {
    throw new Error("Bypass Dev Mode dinonaktifkan di lingkungan produksi.");
  }
  _currentUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'developer@local.host',
    user_metadata: { full_name: 'Bypass Admin' },
    is_bypass: true // Flag to show warning in UI
  };
  localStorage.setItem(DEV_USER_KEY, JSON.stringify(_currentUser));
  notifyListeners(_currentUser);
  return _currentUser;
}

// Sign out
export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch(e) { /* ignore error on signout */ }
  localStorage.removeItem(DEV_USER_KEY);
  _currentUser = null;
  notifyListeners(null);
}

// Get current user (synchronous)
export function getUser() {
  return _currentUser;
}

export function isAuthenticated() {
  return !!_currentUser;
}

// ── Admin Helpers ─────────────────────────────────────────────

/**
 * Cek admin dari profile database (paling aman).
 * Private — digunakan hanya oleh initAuth()
 */
function _checkIsAdminFromProfile(profile, email) {
  if (!profile) return _checkIsAdminFromEmail(email);
  const role = (profile.role || '').toLowerCase();
  return role === 'admin' || role === 'administrator' || _checkIsAdminFromEmail(email);
}

/**
 * Cek admin dari email (fallback).
 * Private — HANYA sebagai fallback ketika DB tidak dapat diakses.
 */
function _checkIsAdminFromEmail(email) {
  if (!email) return false;
  const SUPER_ADMIN_EMAILS = ['admin.skpslf@gmail.com', 'skpslf.official@gmail.com'];
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * isAdmin() — sinkron, menggunakan cache yang divalidasi dari DB.
 * SECURITY FIX: Tidak lagi bergantung pada user_metadata JWT yang bisa dispoofing.
 */
export function isAdmin() {
  if (!_currentUser) return false;
  if (_currentUser.is_bypass && import.meta.env.DEV) return true; // Hanya di DEV
  return _isAdmin; // Diisi dari DB saat initAuth()
}

/**
 * Async re-check admin status dari DB (gunakan setelah login).
 * Berguna untuk refresh admin status tanpa reload.
 */
export async function refreshAdminStatus() {
  if (!_currentUser) { _isAdmin = false; return false; }
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', _currentUser.id)
      .single();
    _isAdmin = _checkIsAdminFromProfile(profile, _currentUser.email);
  } catch {
    _isAdmin = _checkIsAdminFromEmail(_currentUser.email);
  }
  return _isAdmin;
}

// Get user display info
export function getUserInfo() {
  if (!_currentUser) return null;
  const meta = _currentUser.user_metadata || {};
  const profile = _currentUser.profile || {};
  
  return {
    id:        _currentUser.id,
    email:     _currentUser.email,
    name:      meta.full_name || meta.name || _currentUser.email?.split('@')[0] || 'User',
    role:      isAdmin() ? 'Administrator' : (profile.role || meta.role || 'Pengkaji Teknis'),
    avatar:    meta.avatar_url || meta.picture || null,
    initials:  getInitials(meta.full_name || meta.name || _currentUser.email),
    is_bypass: !!_currentUser.is_bypass,
    force_password_change: !!profile.force_password_change
  };
}

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '?';
}
