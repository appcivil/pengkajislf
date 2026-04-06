import { supabase } from '../lib/supabase.js';

/**
 * Fetch Struktur Bangunan (Structure System) summary for a project
 * Includes ASCE 41-17 Tier evaluation, NDT tests, Seismic analysis, Pushover data
 */
export async function fetchStrukturBangunanSummary(proyekId) {
  try {
    // Load simulations (NDT, seismic, etc.)
    const { data: simulations, error: simError } = await supabase
      .from('hasil_simulasi')
      .select('*')
      .eq('proyek_id', proyekId)
      .in('tipe_simulasi', ['ndt_rebound', 'ndt_upv'])
      .order('created_at', { ascending: false });
    
    if (simError) throw simError;
    
    // Load field test data
    const { data: fieldData, error: fieldError } = await supabase
      .from('field_test_data')
      .select('*')
      .eq('proyek_id', proyekId)
      .in('tipe_pengujian', ['ndt_rebound', 'ndt_upv'])
      .order('imported_at', { ascending: false });
    
    if (fieldError) throw fieldError;
    
    // Calculate summary stats
    const ndtRebound = simulations?.filter(s => s.tipe_simulasi === 'ndt_rebound') || [];
    const ndtUPV = simulations?.filter(s => s.tipe_simulasi === 'ndt_upv') || [];
    
    // Extract NDT results
    const reboundResults = ndtRebound.map(s => ({
      id: s.id,
      name: s.hasil?.nama_beton || 'Unknown',
      compressiveStrength: s.hasil?.compressive_strength_mpa || 0,
      reboundNumber: s.hasil?.average_rebound_number || 0,
      carbonationDepth: s.hasil?.carbonation_depth_mm || 0,
      age: s.input_params?.age_days || 0,
      createdAt: s.created_at,
      skorKelayakan: s.skor_kelayakan || 0
    }));
    
    const upvResults = ndtUPV.map(s => ({
      id: s.id,
      name: s.hasil?.nama_beton || 'Unknown',
      pulseVelocity: s.hasil?.average_pulse_velocity_km_s || 0,
      quality: s.hasil?.concrete_quality || 'Unknown',
      compressiveStrength: s.hasil?.estimated_strength_mpa || 0,
      createdAt: s.created_at,
      skorKelayakan: s.skor_kelayakan || 0
    }));
    
    // Get latest simulation for each type
    const latestRebound = reboundResults[0] || null;
    const latestUPV = upvResults[0] || null;
    
    // Calculate average scores
    const avgReboundScore = ndtRebound.length > 0 
      ? ndtRebound.reduce((acc, s) => acc + (s.skor_kelayakan || 0), 0) / ndtRebound.length 
      : 0;
    const avgUPVScore = ndtUPV.length > 0 
      ? ndtUPV.reduce((acc, s) => acc + (s.skor_kelayakan || 0), 0) / ndtUPV.length 
      : 0;
    
    return {
      totalSimulations: simulations?.length || 0,
      totalFieldData: fieldData?.length || 0,
      ndtRebound: {
        count: ndtRebound.length,
        results: reboundResults,
        latest: latestRebound,
        avgScore: Math.round(avgReboundScore)
      },
      ndtUPV: {
        count: ndtUPV.length,
        results: upvResults,
        latest: latestUPV,
        avgScore: Math.round(avgUPVScore)
      },
      // Tier evaluation placeholders (to be filled from actual tier data)
      tierEvaluation: {
        tier1: { completed: false, needsTier2: false },
        tier2: { completed: false },
        tier3: { completed: false }
      },
      // Seismic analysis placeholder
      seismic: {
        ss: null, // Short period spectral acceleration
        s1: null, // 1-second spectral acceleration
        fa: null, // Site coefficient (short period)
        fv: null, // Site coefficient (1-second)
        sms: null, // Modified spectral acceleration (short)
        sm1: null, // Modified spectral acceleration (1-sec)
        sds: null, // Design spectral acceleration (short)
        sd1: null  // Design spectral acceleration (1-sec)
      },
      hasData: simulations?.length > 0 || fieldData?.length > 0
    };
  } catch (error) {
    console.error('Error fetching struktur bangunan summary:', error);
    return {
      totalSimulations: 0,
      totalFieldData: 0,
      ndtRebound: { count: 0, results: [], latest: null, avgScore: 0 },
      ndtUPV: { count: 0, results: [], latest: null, avgScore: 0 },
      tierEvaluation: { tier1: { completed: false }, tier2: { completed: false }, tier3: { completed: false } },
      seismic: {},
      hasData: false
    };
  }
}
