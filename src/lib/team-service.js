// ============================================================
//  TEAM MANAGEMENT SERVICE
//  Manajemen anggota tim, fungsionalitas penugasan, dan monitoring
// ============================================================
import { supabase } from './supabase.js';

/**
 * Mendapatkan daftar anggota tim (profil)
 */
export async function fetchTeamMembers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[Team] Gagal ambil profil tim, gunakan fallback:', err.message);
    // Mock Data Fallback
    return [
      { id: 'u1', full_name: 'Bpk. Ahmad Fauzi', role: 'Lead Engineer', status: 'Active', avatar_url: null },
      { id: 'u2', full_name: 'Ibu Siti Aminah', role: 'Surveyor Utama', status: 'Active', avatar_url: null },
      { id: 'u3', full_name: 'Andi Saputra', role: 'Drafter & Analyst', status: 'Active', avatar_url: null },
      { id: 'u4', full_name: 'Dewi Lestari', role: 'Admin Proyek', status: 'Away', avatar_url: null },
    ];
  }
}

/**
 * Mendapatkan statistik beban kerja tim
 */
export async function fetchTeamWorkload() {
  try {
    // Ambil data proyek untuk dihitung manual per assigned_to
    const { data: projects, error } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, assigned_to, status_slf, progress');
    
    if (error) throw error;

    const members = await fetchTeamMembers();
    
    return members.map(m => {
      const myProjects = (projects || []).filter(p => p.assigned_to === m.id);
      return {
        ...m,
        projectCount: myProjects.length,
        activeProjects: myProjects.filter(p => p.status_slf === 'DALAM_PENGKAJIAN').length,
        avgProgress: myProjects.length > 0 
          ? Math.round(myProjects.reduce((acc, curr) => acc + (curr.progress || 0), 0) / myProjects.length)
          : 0,
        recentProjects: myProjects.slice(0, 3)
      };
    });
  } catch (err) {
    console.warn('[Team] Gagal hitung beban kerja:', err.message);
    return [];
  }
}

/**
 * Menugaskan personil ke proyek
 */
export async function assignProject(proyekId, userId) {
  const { error } = await supabase
    .from('proyek')
    .update({ assigned_to: userId })
    .eq('id', proyekId);
    
  if (error) throw error;
  return true;
}

/**
 * Ambil PIC proyek berdasarkan ID proyek
 */
export async function getProjectPIC(proyekId) {
  try {
    const { data, error } = await supabase
      .from('proyek')
      .select('assigned_to')
      .eq('id', proyekId)
      .maybeSingle();

    if (error || !data?.assigned_to) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.assigned_to)
      .maybeSingle();

    return profile;
  } catch { return null; }
}
