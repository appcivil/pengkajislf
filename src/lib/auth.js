// ============================================================
//  AUTHENTICATION MODULE
//  Google OAuth via Supabase Auth
// ============================================================
import { supabase } from './supabase.js';
import { APP_CONFIG } from './config.js';

// State management
let _currentUser = null;
const _listeners = new Set();
const DEV_USER_KEY = 'slf_dev_user';

// Notify all auth state listeners
function notifyListeners(user) {
  _listeners.forEach(fn => fn(user));
}

// Initialize auth - call on app start
export async function initAuth() {
  // Listen to Supabase auth changes
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      _currentUser = session.user;
      localStorage.removeItem(DEV_USER_KEY);
    } else {
      const savedDevUser = localStorage.getItem(DEV_USER_KEY);
      if (savedDevUser) {
        try { _currentUser = JSON.parse(savedDevUser); } catch(e) { _currentUser = null; }
      } else {
        _currentUser = null;
      }
    }
    notifyListeners(_currentUser);
  });

  // Get initial session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      _currentUser = session.user;
    } else {
      const savedDevUser = localStorage.getItem(DEV_USER_KEY);
      if (savedDevUser) {
        try { _currentUser = JSON.parse(savedDevUser); } catch(e) { _currentUser = null; }
      }
    }
  } catch (err) {
    console.error('[Auth] getSession error:', err);
  }
  
  return _currentUser;
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

// Check if authenticated
export function isAuthenticated() {
  return !!_currentUser;
}

// Get user display info
export function getUserInfo() {
  if (!_currentUser) return null;
  const meta = _currentUser.user_metadata || {};
  return {
    id:        _currentUser.id,
    email:     _currentUser.email,
    name:      meta.full_name || meta.name || _currentUser.email?.split('@')[0] || 'User',
    role:      meta.role || (_currentUser.is_bypass ? 'Dev Bypass' : 'Pengkaji Teknis'),
    avatar:    meta.avatar_url || meta.picture || null,
    initials:  getInitials(meta.full_name || meta.name || _currentUser.email),
    is_bypass: !!_currentUser.is_bypass
  };
}

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '?';
}
