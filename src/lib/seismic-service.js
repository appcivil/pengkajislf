/**
 * ============================================================
 * INDONESIAN SEISMIC HAZARD INTELLIGENCE (LITE)
 * Memetakan Kota/Kabupaten ke Nilai Gempa (PGA) berdasarkan 
 * Peta Sumber dan Bahaya Gempa Indonesia 2017/2019
 * ============================================================
 */

const SEISMIC_DB = {
  "aceh": { pga: 0.4, risk: "Tinggi", note: "Sesar Semangko Aktif" },
  "padang": { pga: 0.5, risk: "Sangat Tinggi", note: "Zona Megathrust Mentawai" },
  "bengkulu": { pga: 0.45, risk: "Tinggi", note: "Zona Subduksi & Sesar Darat" },
  "lampung": { pga: 0.35, risk: "Tinggi", note: "Selat Sunda & Sesar Semangko" },
  "jakarta": { pga: 0.25, risk: "Sedang-Tinggi", note: "Cekungan Jakarta, Efek Amplifikasi Tanah Lunak" },
  "bogor": { pga: 0.3, risk: "Tinggi", note: "Sesar Cimandiri & Lembang" },
  "bandung": { pga: 0.3, risk: "Tinggi", note: "Sesar Lembang Aktif" },
  "cianjur": { pga: 0.4, risk: "Sangat Tinggi", note: "Sesar Cugenang & Cimandiri" },
  "sukabumi": { pga: 0.4, risk: "Tinggi", note: "Sesar Cimandiri" },
  "garut": { pga: 0.35, risk: "Tinggi", note: "Zona Megathrust Selatan Jawa" },
  "semarang": { pga: 0.25, risk: "Sedang", note: "Sesar Semarang & Lasem" },
  "yogyakarta": { pga: 0.4, risk: "Sangat Tinggi", note: "Sesar Opak Aktif" },
  "surabaya": { pga: 0.2, risk: "Sedang", note: "Sesar Kendeng" },
  "denpasar": { pga: 0.35, risk: "Tinggi", note: "Back-arc Thrust Bali" },
  "mataram": { pga: 0.45, risk: "Sangat Tinggi", note: "Flores Back-arc Thrust" },
  "palu": { pga: 0.6, risk: "Ekstrim", note: "Sesar Palu-Koro Aktif" },
  "makassar": { pga: 0.15, risk: "Rendah", note: "Relatif Stabil" },
  "manado": { pga: 0.4, risk: "Tinggi", note: "Zona Subduksi Laut Maluku" },
  "jayapura": { pga: 0.5, risk: "Sangat Tinggi", note: "Zona Patahan Aktif Papua" },
  "balikpapan": { pga: 0.1, risk: "Rendah", note: "Kawasan Ibu Kota Nusantara (IKN) Stabil" },
  "samarinda": { pga: 0.1, risk: "Rendah", note: "Relatif Aman dari Gempa Besar" }
};

/**
 * Mendeteksi informasi gempa berdasarkan teks alamat
 */
export function getSeismicInfoByAddress(address = "") {
  const lowAddress = address.toLowerCase();
  
  // Mencari kecocokan kota di dalam alamat
  const city = Object.keys(SEISMIC_DB).find(key => lowAddress.includes(key));
  
  if (city) {
    return {
      location: city.toUpperCase(),
      ...SEISMIC_DB[city]
    };
  }

  // Default jika tidak ditemukan (Asumsi Indonesia Rata-rata)
  return {
    location: "Nasional (Umum)",
    pga: 0.2,
    risk: "Sedang",
    note: "Parameter gempa standar SNI 1726:2019"
  };
}

/**
 * Menyusun narasi teknis untuk disuntikkan ke prompt AI
 */
export function getSeismicPromptContext(info) {
  return `### INFORMASI ZONASI GEMPA (SEISMIC INTELLIGENCE) ###
Lokasi Terdeteksi: ${info.location}
Nilai PGA (Peak Ground Acceleration) Perkiraan: ${info.pga}g
Tingkat Risiko: ${info.risk}
Catatan Geologi: ${info.note}

Instruksi khusus untuk Ahli Struktur: 
WAJIB mempertimbangkan parameter guncangan di atas dalam melakukan audit kelaikan sistem struktur bangunan ini. Hubungkan temuan lapangan (misal: retakan) dengan potensi beban gempa di wilayah tersebut.`;
}
