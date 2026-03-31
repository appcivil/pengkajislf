/**
 * SCORING ENGINE - SNI 9273:2025 & NSPK Compliance
 * Logic for calculating engineering scores and SLF status.
 */

// ── Bobot Penilaian Per Aspek (%) ─────────────────────────────
export const BOBOT_ASPEK = {
  administrasi: 10,
  pemanfaatan:  10,
  arsitektur:   15,
  struktur:     25,
  mekanikal:    15,
  kesehatan:    10,
  kenyamanan:    8,
  kemudahan:     7,
};

// ── Nilai Status → Skor (0-100) ───────────────────────────────
export const NILAI_STATUS_ADMIN = {
  ada_sesuai:         100,
  ada_tidak_sesuai:    40,
  tidak_ada:            0,
  pertama_kali:        80,
  tidak_wajib:        100,
  tidak_ada_renovasi: 100,
  '':                   0,
};

export const NILAI_STATUS_TEKNIS = {
  baik:     100,
  sedang:    65,
  buruk:     30,
  kritis:     0,
  tidak_ada: 90,
  '':         0,
};

// ── Aspek → kode checklist mapping ───────────────────────────
export const ASPEK_MAP = {
  administrasi: ['A01','A02','A03','A04','A05','A06','A07','A08','A09','A10','ITEM-09A'],
  pemanfaatan:  ['ITEM-01A','ITEM-01B','ITEM-01C','ITEM-02A','ITEM-02B','ITEM-02C','ITEM-02D','ITEM-02E','ITEM-02F','ITEM-02G','ITEM-02H','ITEM-02I','ITEM-02J'],
  arsitektur:   ['ITEM-03A','ITEM-03B','ITEM-03C','ITEM-04A'],
  struktur:     ['ITEM-05A1','ITEM-05A2','ITEM-05A3','ITEM-05A4','ITEM-05A5','ITEM-05A6','ITEM-05A7','ITEM-05A8','ITEM-05A9','ITEM-05A10'],
  mekanikal:    ['ITEM-05B','ITEM-05C','ITEM-05D','ITEM-05E'],
  kesehatan:    ['ITEM-06A','ITEM-06B','ITEM-06C1','ITEM-06C2','ITEM-06C3','ITEM-06C4','ITEM-06D'],
  kenyamanan:   ['ITEM-07A','ITEM-07B','ITEM-07C','ITEM-07D'],
  kemudahan:    ['ITEM-08A','ITEM-08B'],
};

/**
 * Menghitung skor total berbobot
 * @param {Object} scores - Skor per aspek { administrasi: 80, ... }
 * @returns {number} Skor total (0-100)
 */
export function calculateTotalScore(scores) {
  let weightedTotal = 0;
  let totalWeights = 0;

  for (const [aspek, weight] of Object.entries(BOBOT_ASPEK)) {
    const score = scores[aspek] || 0;
    weightedTotal += (score * weight);
    totalWeights += weight;
  }

  return totalWeights > 0 ? Math.round(weightedTotal / totalWeights) : 0;
}

/**
 * Menentukan status SLF berdasarkan skor aspek dan total
 * @param {Object} scores - Skor per aspek
 * @param {number} totalScore - Skor total
 * @returns {string} Status SLF
 */
export function determineSLFStatus(scores, totalScore) {
  // Kritikal: Struktur & Mekanikal harus memadai
  if (scores.struktur < 50 || scores.mekanikal < 50 || totalScore < 50) {
    return 'TIDAK_LAIK_FUNGSI';
  }

  if (totalScore >= 80 && scores.struktur >= 70 && scores.mekanikal >= 70) {
    return 'LAIK_FUNGSI';
  }

  return 'LAIK_FUNGSI_BERSYARAT';
}

/**
 * Menentukan tingkat risiko
 * @param {number} totalScore 
 * @returns {string} low, medium, high, critical
 */
export function determineRiskLevel(totalScore) {
  if (totalScore >= 80) return 'low';
  if (totalScore >= 65) return 'medium';
  if (totalScore >= 45) return 'high';
  return 'critical';
}
