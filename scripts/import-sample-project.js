/**
 * Script Import Sample Project - SKT Puncak Darajat
 * ================================================
 * Script ini digunakan untuk mengimport sample project ke dalam aplikasi
 * 
 * Cara penggunaan:
 * 1. Jalankan aplikasi (npm run dev)
 * 2. Buka browser console (F12)
 * 3. Copy paste kode di bawah ini ke console
 * 4. Tekan Enter untuk menjalankan
 */

// ==========================================
// SAMPLE PROJECT DATA - SKT PUNCAK DARAJAT
// ==========================================
const SAMPLE_PROJECT = {
  "version": "2.1",
  "exportedAt": "2026-04-15T21:30:00.000Z",
  "project": {
    "id": "skt-puncak-darajat-001",
    "nama_bangunan": "Puncak Darajat Resort & Hot Spring",
    "jenis_bangunan": "Komersial",
    "alamat": "Jl. Puncak Darajat No. 123, Desa Tanjung Karya, Kecamatan Pasirwangi, Kabupaten Garut, Jawa Barat 44161",
    "kota": "Garut",
    "provinsi": "Jawa Barat",
    "kode_pos": "44161",
    "pemilik": "PT Puncak Darajat Sejahtera",
    "penanggung_jawab": "Otang Sugianto",
    "telepon": "+62 812-3456-7890",
    "email_pemilik": "info@puncakdarajat.com",
    "jenis_konstruksi": "Beton Bertulang",
    "jumlah_lantai": 4,
    "luas_bangunan": 2850.5,
    "luas_lahan": 4520.0,
    "tinggi_bangunan": 18.5,
    "nomor_pbg": "PBG-2023-12345678",
    "no_dokumen_tanah": "HGB No. 97/Garut",
    "nama_pemilik_tanah": "Otang Sugianto",
    "pemilik_tanah_sama": false,
    "latitude": -7.2108,
    "longitude": 107.9026,
    "gsb": 5.0,
    "kdb": 0.65,
    "klb": 2.8,
    "kdh": 0.35,
    "status_slf": "DALAM_PENGKAJIAN",
    "progress": 45,
    "simbg_id": "SIMBG-2023-987654321",
    "simbg_email": "admin@puncakdarajat.com",
    "created_at": "2023-10-15T08:30:00.000Z",
    "updated_at": "2026-04-15T14:22:00.000Z",
    "ai_focus": "komprehensif",
    "assigned_to": "tim-kajian-001",
    "tanggal_mulai": "2023-10-15",
    "tanggal_target": "2024-03-15",
    "deskripsi": "Resort dan pemandian air panas dengan fasilitas hotel, restoran, kolam renang air panas, dan area rekreasi keluarga",
    "tahun_bangun": 2019,
    "fungsi_spesifik": "Hotel, Resort, Kolam Renang Air Panas"
  },
  "checklists": {
    "tier1": {
      "administrasi": {
        "status": "compliant",
        "score": 85,
        "items": {
          "ADM-001": {
            "kode": "ADM-001",
            "nama": "Izin Mendirikan Bangunan (IMB/PBG)",
            "status": "ada",
            "keterangan": "PBG-2023-12345678 terbit 15 Mei 2023",
            "verified": true
          },
          "ADM-002": {
            "kode": "ADM-002",
            "nama": "Sertifikat Tanah",
            "status": "ada",
            "keterangan": "HGB No. 97 atas nama Otang Sugianto",
            "verified": true
          },
          "ADM-003": {
            "kode": "ADM-003",
            "nama": "Akta Jual Beli",
            "status": "ada",
            "keterangan": "AJB tanggal 20 Oktober 2019",
            "verified": true
          },
          "ADM-004": {
            "kode": "ADM-004",
            "nama": "Ijin Pemanfaatan",
            "status": "ada",
            "keterangan": "IP dari Dinas Pariwisata Garut",
            "verified": true
          },
          "ADM-005": {
            "kode": "ADM-005",
            "nama": "Surat Pernyataan Laik Fungsi",
            "status": "proses",
            "keterangan": "Dalam penyusunan",
            "verified": false
          }
        }
      },
      "arsitektur": {
        "status": "partial",
        "score": 72,
        "items": {
          "ARS-001": {
            "kode": "ARS-001",
            "nama": "Kesesuaian Rencana Tapak",
            "status": "sesuai",
            "keterangan": "Site plan sesuai KRK",
            "verified": true
          },
          "ARS-002": {
            "kode": "ARS-002",
            "nama": "Intensitas Bangunan (KDB)",
            "status": "perlu_perhatian",
            "keterangan": "KDB aktual 68%, batas maksimal 65%",
            "nilai_aktual": 68,
            "nilai_batas": 65,
            "verified": false
          },
          "ARS-003": {
            "kode": "ARS-003",
            "nama": "Intensitas Bangunan (KLB)",
            "status": "sesuai",
            "keterangan": "KLB aktual 2.8, batas maksimal 3.0",
            "nilai_aktual": 2.8,
            "nilai_batas": 3.0,
            "verified": true
          },
          "ARS-004": {
            "kode": "ARS-004",
            "nama": "Jalur Evakuasi",
            "status": "sesuai",
            "keterangan": "2 jalur evakuasi tersedia, lebar tangga 1.4m",
            "verified": true
          },
          "ARS-005": {
            "kode": "ARS-005",
            "nama": "Persyaratan Kemudahan (Accessibility)",
            "status": "perlu_perhatian",
            "keterangan": "Ramp ada tapi kemiringan 10%, melebihi batas 8.33%",
            "verified": false
          }
        }
      }
    },
    "tier2": {
      "struktur": {
        "status": "compliant",
        "score": 88,
        "items": {
          "STR-001": {
            "kode": "STR-001",
            "nama": "Sistem Struktur Utama",
            "status": "sesuai",
            "keterangan": "Sistem rangka pemikul momen (SRPM) beton bertulang",
            "verified": true
          },
          "STR-002": {
            "kode": "STR-002",
            "nama": "Analisis Ketahanan Gempa",
            "status": "sesuai",
            "keterangan": "Analisis ETABS telah dilakukan",
            "verified": true
          },
          "STR-003": {
            "kode": "STR-003",
            "nama": "Uji Non-Destructive Test (NDT)",
            "status": "sesuai",
            "keterangan": "Hammer test dan UPV dilakukan 2023",
            "verified": true
          }
        }
      },
      "proteksi_kebakaran": {
        "status": "partial",
        "score": 68,
        "items": {
          "PKB-001": {
            "kode": "PKB-001",
            "nama": "Deteksi dan Alarm Kebakaran",
            "status": "sesuai",
            "keterangan": "Smoke detector dan manual call point terpasang di semua lantai",
            "verified": true
          },
          "PKB-002": {
            "kode": "PKB-002",
            "nama": "Sistem Sprinkler",
            "status": "tidak_sesuai",
            "keterangan": "Hanya terpasang di area dapur dan boiler room",
            "rekomendasi": "Tambah sprinkler di koridor dan kamar hotel",
            "verified": false
          },
          "PKB-003": {
            "kode": "PKB-003",
            "nama": "Sistem Hidran",
            "status": "sesuai",
            "keterangan": "Hydrant indoor dan outdoor tersedia dengan tekanan memadai",
            "verified": true
          },
          "PKB-004": {
            "kode": "PKB-004",
            "nama": "Material Tahan Api",
            "status": "perlu_perhatian",
            "keterangan": "Sebagian partisi menggunakan gypsum tahan api, perlu verifikasi rating",
            "verified": false
          }
        }
      },
      "proteksi_petir": {
        "status": "compliant",
        "score": 82,
        "items": {
          "PPT-001": {
            "kode": "PPT-001",
            "nama": "External LPS",
            "status": "sesuai",
            "keterangan": "Air terminal Franklin rod terpasang 4 titik",
            "verified": true
          },
          "PPT-002": {
            "kode": "PPT-002",
            "nama": "Internal LPS",
            "status": "sesuai",
            "keterangan": "Bonding dan isolasi jarak aman sesuai SNI 2848:2020",
            "verified": true
          },
          "PPT-003": {
            "kode": "PPT-003",
            "nama": "Surge Protection Device (SPD)",
            "status": "perlu_perhatian",
            "keterangan": "SPD terpasang di panel utama tapi perlu verifikasi koordinasi level",
            "verified": false
          }
        }
      },
      "kelistrikan": {
        "status": "compliant",
        "score": 85,
        "items": {
          "KLT-001": {
            "kode": "KLT-001",
            "nama": "Sumber Daya dan Distribusi",
            "status": "sesuai",
            "keterangan": "Daya terpasang 250 kVA dari PLN, genset backup 100 kVA",
            "verified": true
          },
          "KLT-002": {
            "kode": "KLT-002",
            "nama": "Sistem Penerangan",
            "status": "sesuai",
            "keterangan": "Iluminasi sesuai SNI 6197:2011, rata-rata 300 lux",
            "verified": true
          },
          "KLT-003": {
            "kode": "KLT-003",
            "nama": "Sistem Grounding",
            "status": "sesuai",
            "keterangan": "Resistansi grounding 3.2 ohm, dibawah batas 5 ohm",
            "verified": true
          }
        }
      }
    },
    "tier3": {
      "air_bersih": {
        "status": "compliant",
        "score": 80,
        "items": {
          "AB-001": {
            "kode": "AB-001",
            "nama": "Kebutuhan Air Bersih",
            "status": "sesuai",
            "keterangan": "Kebutuhan 35.000 liter/hari untuk 80 kamar + restoran + kolam",
            "verified": true
          },
          "AB-002": {
            "kode": "AB-002",
            "nama": "Tangki Penyimpanan",
            "status": "sesuai",
            "keterangan": "Tangki ground 50.000 liter + roof tank 10.000 liter",
            "verified": true
          },
          "AB-003": {
            "kode": "AB-003",
            "nama": "Kualitas Air",
            "status": "sesuai",
            "keterangan": "Hasil uji lab memenuhi Permenkes",
            "verified": true
          }
        }
      },
      "air_kotor": {
        "status": "partial",
        "score": 65,
        "items": {
          "AK-001": {
            "kode": "AK-001",
            "nama": "Sistem Pembuangan Air Kotor",
            "status": "sesuai",
            "keterangan": "Sistem pemipaan terpisah untuk black water dan grey water",
            "verified": true
          },
          "AK-002": {
            "kode": "AK-002",
            "nama": "Ventilasi Plumbing",
            "status": "perlu_perhatian",
            "keterangan": "Vent stack ada tapi diameter kurang dari spec",
            "rekomendasi": "Perbesar vent stack dari 2 inch ke 3 inch",
            "verified": false
          }
        }
      },
      "limbah": {
        "status": "compliant",
        "score": 78,
        "items": {
          "LMB-001": {
            "kode": "LMB-001",
            "nama": "Sistem Pembuangan Kotoran",
            "status": "sesuai",
            "keterangan": "Septic tank 2 kompartemen dengan volume 30 m³",
            "verified": true
          },
          "LMB-002": {
            "kode": "LMB-002",
            "nama": "Sistem Pengelolaan Sampah",
            "status": "sesuai",
            "keterangan": "TPS terpadu dengan pemilahan organik-anorganik",
            "verified": true
          }
        }
      },
      "kenyamanan": {
        "status": "compliant",
        "score": 86,
        "items": {
          "KNY-001": {
            "kode": "KNY-001",
            "nama": "Pencahayaan Alami",
            "status": "sesuai",
            "keterangan": "Daylight Factor rata-rata 1.8% di ruang tamu dan kamar",
            "verified": true
          },
          "KNY-002": {
            "kode": "KNY-002",
            "nama": "Penghawaan Alami",
            "status": "sesuai",
            "keterangan": "Kecepatan udara 0.18 m/s dengan temperatur 26°C",
            "verified": true
          },
          "KNY-003": {
            "kode": "KNY-003",
            "nama": "Kebisingan",
            "status": "sesuai",
            "keterangan": "Noise level 42 dB di area kamar",
            "verified": true
          }
        }
      },
      "air_hujan": {
        "status": "partial",
        "score": 70,
        "items": {
          "AH-001": {
            "kode": "AH-001",
            "nama": "Drainase Permukaan",
            "status": "sesuai",
            "keterangan": "Sistem drainase tersedia dengan kapasitas cukup",
            "verified": true
          },
          "AH-002": {
            "kode": "AH-002",
            "nama": "Sistem Resapan",
            "status": "perlu_perhatian",
            "keterangan": "Sumur resapan ada 4 unit, perlu ditambah untuk luas lahan",
            "rekomendasi": "Tambah 2 sumur resapan di area parkir timur",
            "verified": false
          }
        }
      },
      "lingkungan": {
        "status": "compliant",
        "score": 88,
        "items": {
          "LGK-001": {
            "kode": "LGK-001",
            "nama": "Dampak Udara",
            "status": "sesuai",
            "keterangan": "Emisi boiler dan genset dalam batas aman",
            "verified": true
          },
          "LGK-002": {
            "kode": "LGK-002",
            "nama": "Dampak Air",
            "status": "sesuai",
            "keterangan": "Efluen dari IPAL memenuhi baku mutu",
            "verified": true
          }
        }
      }
    }
  },
  "photos": [
    {
      "id": "photo-001",
      "proyekId": "skt-puncak-darajat-001",
      "itemKode": "ADM-001",
      "nama_file": "IMB puncak darajat.pdf",
      "keterangan": "Dokumen PBG terbit 2023",
      "tipe": "dokumen",
      "createdAt": "2023-10-19T17:59:00.000Z"
    },
    {
      "id": "photo-002",
      "proyekId": "skt-puncak-darajat-001",
      "itemKode": "ADM-002",
      "nama_file": "97 Otang Sugianto.pdf",
      "keterangan": "Sertifikat HGB No. 97",
      "tipe": "dokumen",
      "createdAt": "2023-10-19T17:59:00.000Z"
    },
    {
      "id": "photo-003",
      "proyekId": "skt-puncak-darajat-001",
      "itemKode": "STR-002",
      "nama_file": "DRM pengkaji.pdf",
      "keterangan": "Laporan analisis ETABS",
      "tipe": "dokumen",
      "createdAt": "2023-10-19T18:01:00.000Z"
    },
    {
      "id": "photo-004",
      "proyekId": "skt-puncak-darajat-001",
      "itemKode": "GENERAL",
      "nama_file": "Foto Lokasi.pdf",
      "keterangan": "Foto-foto lokasi bangunan",
      "tipe": "foto",
      "createdAt": "2023-10-20T08:43:00.000Z"
    },
    {
      "id": "photo-005",
      "proyekId": "skt-puncak-darajat-001",
      "itemKode": "GENERAL",
      "nama_file": "laporan kajian.pdf",
      "keterangan": "Laporan kajian teknis lengkap",
      "tipe": "dokumen",
      "createdAt": "2023-10-19T18:04:00.000Z"
    }
  ],
  "ndtTests": [
    {
      "id": "ndt-001",
      "proyekId": "skt-puncak-darajat-001",
      "type": "hammer_test",
      "lokasi": "Kolom Lantai 1 - Area Lobby",
      "tanggal": "2023-08-15",
      "hasil": {
        "kuat_tekan": 28.5,
        "satuan": "MPa",
        "rebound_number_rata": 42.3
      },
      "status": "合格",
      "catatan": "Hasil memenuhi spesifikasi K-300"
    },
    {
      "id": "ndt-002",
      "proyekId": "skt-puncak-darajat-001",
      "type": "upv",
      "lokasi": "Balok Lantai 3 - Area Restoran",
      "tanggal": "2023-08-15",
      "hasil": {
        "kecepatan_pulse": 4200,
        "satuan": "m/s",
        "kualitas_beton": "Baik"
      },
      "status": "合格",
      "catatan": "Tidak ada indikasi retak atau void"
    }
  ]
};

// ==========================================
// IMPORT FUNCTION
// ==========================================
async function importSampleProject() {
  console.log('🚀 Starting sample project import...');
  
  try {
    // Dynamic import of required modules
    const { importProjectFromJSON, initLocalDB } = await import('../src/lib/local-data-manager.js');
    const { supabase } = await import('../src/lib/supabase.js');
    
    // Initialize IndexedDB
    console.log('📦 Initializing local database...');
    await initLocalDB();
    
    // Check if project already exists
    const { data: existing } = await supabase
      .from('proyek')
      .select('id')
      .eq('id', SAMPLE_PROJECT.project.id)
      .maybeSingle();
    
    if (existing) {
      console.log('⚠️ Project already exists, skipping import');
      alert('Sample project sudah ada di database!');
      return;
    }
    
    // Import via JSON
    console.log('📥 Importing project data...');
    const result = await importProjectFromJSON(JSON.stringify(SAMPLE_PROJECT));
    
    console.log('✅ Import successful!');
    console.log('📋 Project ID:', result.id);
    console.log('🏗️ Project Name:', result.project.nama_bangunan);
    
    // Also save to Supabase
    console.log('☁️ Syncing to Supabase...');
    const { error } = await supabase.from('proyek').insert(SAMPLE_PROJECT.project);
    
    if (error) {
      console.warn('⚠️ Supabase sync warning:', error.message);
    } else {
      console.log('✅ Supabase sync complete');
    }
    
    alert('Sample project SKT Puncak Darajat berhasil diimport!\n\nSilakan refresh halaman dan lihat daftar proyek.');
    
    return result;
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    alert('Import gagal: ' + error.message);
    throw error;
  }
}

// ==========================================
// ALTERNATIVE: Manual Import via Console
// ==========================================
function showManualInstructions() {
  console.log(`
========================================
MANUAL IMPORT INSTRUCTIONS
========================================

1. Buka aplikasi di browser
2. Buka DevTools (F12) -> Console
3. Jalankan perintah berikut:

// Import modul
const { importProjectFromJSON } = await import('./src/lib/local-data-manager.js');

// Import data
const sampleData = ${JSON.stringify(SAMPLE_PROJECT, null, 2)};
await importProjectFromJSON(JSON.stringify(sampleData));

// Refresh halaman untuk melihat hasil
location.reload();

========================================
`);
}

// ==========================================
// EXPORT FOR GLOBAL USE
// ==========================================
window.importSampleProject = importSampleProject;
window.SAMPLE_PROJECT_DATA = SAMPLE_PROJECT;
window.showImportInstructions = showManualInstructions;

// Auto-run if in browser console context
if (typeof window !== 'undefined' && window.document) {
  console.log('%c SKT Puncak Darajat Sample Project ', 'background: #2563eb; color: white; font-size: 16px; padding: 10px; border-radius: 8px;');
  console.log('Available commands:');
  console.log('  - importSampleProject() : Import sample project to app');
  console.log('  - SAMPLE_PROJECT_DATA   : View raw data');
  console.log('  - showImportInstructions() : Show manual import guide');
  
  // Ask user if they want to import now
  setTimeout(() => {
    if (confirm('Import sample project SKT Puncak Darajat sekarang?')) {
      importSampleProject();
    }
  }, 1000);
}

export { importSampleProject, SAMPLE_PROJECT };
