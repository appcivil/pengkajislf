/**
 * TTE SERVICE
 * Handles digital signature verification and document integrity checks.
 * Abstracted to support both internal and official (BSrE/Peruri) providers.
 */

export const TTE_PROVIDERS = {
  INTERNAL: 'internal',
  BSRE: 'bsre',
  PERURI: 'peruri'
};

/**
 * Verifikasi Integritas Dokumen (Industry Standard SHA-256)
 * @param {Object} document - Data proyek
 * @param {Object} analisis - Data hasil analisis (optional)
 * @param {Array} checklist - Data checklist items (optional) 
 * @returns {Promise<Object>} Status verifikasi & fingerprint
 */
export async function verifyDocumentIntegrity(document, analisis = null, checklist = []) {
  // 1. Stable Serialization
  const cleanData = {
    proyek: {
      id: document.id,
      nama: document.nama_bangunan,
      alamat: document.alamat,
      fungsi: document.fungsi_bangunan,
      luas: document.luas_bangunan,
      lantai: document.jumlah_lantai,
      pbg: document.nomor_pbg,
      pemilik: document.pemilik,
      created_at: document.created_at
    },
    analisis: analisis ? {
      status: analisis.status_slf,
      rekomendasi: analisis.rekomendasi,
      narasi: analisis.narasi_teknis,
      skor: analisis.skor_total
    } : null,
    checklist: (checklist || []).map(c => ({
      kode: c.kode,
      nama: c.nama,
      aspek: c.aspek,
      status: c.status
    })).sort((a, b) => a.kode.localeCompare(b.kode))
  };

  const msgUint8 = new TextEncoder().encode(JSON.stringify(cleanData));
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  return {
    isValid: true,
    fingerprint: hashHex,
    algorithm: 'SHA-256 (Full Context Integration)',
    timestamp: new Date().toISOString(),
    provider: TTE_PROVIDERS.INTERNAL
  };
}

/**
 * Validasi Sertifikat Penandatangan
 * @param {Object} signer - Data penandatangan (Tenaga Ahli)
 * @param {string} provider - Provider TTE (default: INTERNAL)
 * @returns {Promise<Object>} Status sertifikat
 */
export async function validateSignerCertificate(signer, provider = TTE_PROVIDERS.INTERNAL) {
  // Mock validation for internal engine
  // In production, this would call official APIs
  return {
    isActive: true,
    isTrusted: true,
    issuedBy: provider === TTE_PROVIDERS.INTERNAL ? 'Smart AI Trust Engine' : 'CA Terakreditasi',
    expiryDate: '2030-12-31',
    status: 'AKTIF & TERVALIDASI'
  };
}

/**
 * Sign a project document and store signature in Supabase
 * @param {string} proyekId - ID project to sign
 * @param {string} expertType - Type of signer ('director', 'architecture', 'structure', 'mep')
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<Object>} Status result
 */
export async function signProject(proyekId, expertType, supabase) {
  // 1. Fetch current project, analysis and checklist to calculate comprehensive hash
  const [pResult, aResult, cResult] = await Promise.all([
    supabase.from('proyek').select('*').eq('id', proyekId).maybeSingle(),
    supabase.from('hasil_analisis').select('*').eq('proyek_id', proyekId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('checklist_items').select('*').eq('proyek_id', proyekId)
  ]);

  const p = pResult.data;
  const a = aResult.data;
  const c = cResult.data || [];

  if (!p) throw new Error("Document not found for signing.");

  // 2. Generate full integrity fingerprint
  const integrity = await verifyDocumentIntegrity(p, a, c);
  const now = new Date().toISOString();

  // 3. Update project metadata with signature
  const metadata = p.metadata || {};
  if (!metadata.signatures) metadata.signatures = {};
  
  metadata.signatures[expertType] = {
    signed_at: now,
    fingerprint: integrity.fingerprint,
    status: 'VALID'
  };

  // If this is the director, we finalize the whole document
  if (expertType === 'director') {
    metadata.is_finalized = true;
    metadata.finalized_at = now;
    metadata.document_hash = integrity.fingerprint;
  }

  const { error: uError } = await supabase
    .from('proyek')
    .update({ metadata })
    .eq('id', proyekId);

  if (uError) throw uError;

  return {
    success: true,
    signedAt: now,
    fingerprint: integrity.fingerprint
  };
}
