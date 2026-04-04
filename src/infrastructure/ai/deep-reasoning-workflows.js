/**
 * DEEP REASONING WORKFLOWS SYSTEM
 * 
 * File ini berisi semua alur kerja (Workflows) yang digunakan oleh AI
 * dalam melakukan analisis SLF (Sertifikat Laik Fungsi) Bangunan Gedung.
 * 
 * Workflows mencakup:
 * 1. Workflow analisis struktur
 * 2. Workflow analisis MEP
 * 3. Workflow analisis arsitektur
 * 4. Workflow analisis lingkungan
 * 5. Workflow verifikasi instansi terkait
 */

export const DEEP_REASONING_WORKFLOWS = {
    metadata: {
        version: "1.0.0",
        lastUpdated: "2026-04-01",
        system: "Smart AI Pengkaji SLF",
        description: "Comprehensive workflows for deep reasoning in SLF analysis"
    },

    // ==========================================
    // WORKFLOW 1: ANALISIS STRUKTUR
    // ==========================================
    structuralAnalysis: {
        name: "Strukural Analysis Workflow",
        description: "Workflow untuk analisis keselamatan struktur bangunan",
        persona: "Anda adalah Ahli Rekayasa Struktur Forensik dengan pengalaman 20+ tahun",

        subWorkflows: {
            foundation: {
                id: "WF-STR-01",
                name: "Analisis Fondasi",
                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA FONDASI",
                        actions: [
                            "Ekstrak data fondasi dari dokumen struktur (pondasi, cakar ayam, bored pile)",
                            "Identifikasi jenis tanah dan daya dukung dari laporan sondir",
                            "Ekstrak data beban rencana dari desain struktural",
                            "Identifikasi data eksisting: retak, settlement, penurunan"
                        ],
                        nspkReferences: [
                            "SNI 2847:2019 - Fondasi Caisson",
                            "SNI 8460:2017 - Desain Fondasi",
                            "Permen PUPR No. 8 Tahun 2021 - Kegagalan Fondasi"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI FISIK",
                        actions: [
                            "Inspeksi visual kondisi fondasi yang terlihat",
                            "Identifikasi indikator differential settlement",
                            "Periksa kondisi pondasi batu kali untuk bangunan lama",
                            "Evaluasi geoteknik: lereng, muka air tanah, tanah lunak"
                        ],
                        checkPoints: [
                            "Tidak ada retak pada struktur di atas fondasi",
                            "Tidak ada indikasi settlement berlebih (> 25mm)",
                            "Daya dukung fondasi > beban aktual",
                            "Tidak ada rembesan pada dinding basemen"
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI DAYA DUKUNG",
                        actions: [
                            "Hitung beban aktual kolom (P_actual)",
                            "Hitung kapasitas daya dukung fondasi (Q_ultimate)",
                            "Kalkulasi Factor of Safety (FS = Q_ultimate / P_actual)",
                            "Bandingkan dengan FS minimum SNI (FS ≥ 2.0)"
                        ],
                        formulas: [
                            {
                                name: "Factor of Safety",
                                formula: "FS = Q_ultimate / P_actual",
                                threshold: "FS ≥ 2.0 (SNI)"
                            },
                            {
                                name: "Batas Penurunan Izin",
                                formula: "ΔS_maks ≤ L/300",
                                where: "L = bentang elemen atau dimensi fondasi"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI RISIKO",
                        actions: [
                            "Klasifikasikan tingkat risiko (CRITICAL/HIGH/MEDIUM/LOW)",
                            "Identifikasi mode kegagalan potensial",
                            "Estimasi dampak terhadap keselamatan penghuni",
                            "Tentukan urgensi perbaikan"
                        ],
                        riskCategories: [
                            { risk: "CRITICAL", condition: "FS < 1.5 atau settlement > 50mm" },
                            { risk: "HIGH", condition: "FS < 2.0 atau settlement > 25mm" },
                            { risk: "MEDIUM", condition: "FS ≥ 2.0 tapi ada retak kecil" },
                            { risk: "LOW", condition: "FS ≥ 2.5, tidak ada masalah" }
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian fondasi",
                            "Buat rekomendasi teknis jika diperlukan",
                            "Tentukan prioritas penanganan",
                            "Sertakan justifikasi berbasis NSPK"
                        ],
                        outputFormat: "Output A-G sesuai format standar"
                    }
                ]
            },

            columns: {
                id: "WF-STR-02",
                name: "Analisis Kolom",
                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA KOLOM",
                        actions: [
                            "Ekstrak data dimensi kolom dari shop drawing",
                            "Identifikasi jumlah dan diameter tulangan",
                            "Identifikasi mutu beton (K) dari desain",
                            "Ekstrak data beban kolom (beban mati + hidup)"
                        ],
                        nspkReferences: [
                            "SNI 2847:2019 - Elemen Kolom Beton",
                            "SNI 1726:2019 - Beban Gempa",
                            "SNI 1729:2020 - Kolom Baja (jika berlaku)"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI FISIK KOLOM",
                        actions: [
                            "Inspeksi visual kondisi kolom (retak, spalling, korosi)",
                            "Klasifikasikan jenis retak: vertikal (aksial), diagonal (geser)",
                            "Identifikasi soft story (lantai dengan kolom kurang kaku)",
                            "Periksa integritas sambungan balok-kolom"
                        ],
                        damageLevels: [
                            { level: "Ringan", description: "Retak halus < 0.3mm, sedikit spalling" },
                            { level: "Sedang", description: "Retak 0.3-1.0mm, spalling moderat" },
                            { level: "Berat", description: "Retak > 1.0mm, tulangan terlihat" },
                            { level: "Kritis", description: "Buckling, tulangan patah, deformasi" }
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI KAPASITAS KOLOM",
                        actions: [
                            "Hitung kapasitas aksial kolom (P_n)",
                            "Hitung beban aktual kolom (P_u)",
                            "Kalkulasi rasio Demand/Capacity (P_u/P_n)",
                            "Bandingkan dengan batas (P_u/P_n ≤ 1.0)"
                        ],
                        formulas: [
                            {
                                name: "Kapasitas Aksial Beton",
                                formula: "P_n = 0.80 × [0.85 × f'c × (A_g - A_st) + f_y × A_st]",
                                threshold: "P_u ≤ φ × P_n (φ = 0.65)"
                            },
                            {
                                name: "Rasio Slenderness",
                                formula: "kL/r ≤ 50 (kolom braced) atau 100 (unbraced)",
                                threshold: "Jika melebihi, analisis second-order diperlukan"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI KEKAKUAN LATERAL",
                        actions: [
                            "Hitung kekakuan kolom terhadap gempa",
                            "Evaluasi konfigurasi sistem rangka",
                            "Identifikasi potensi soft story mekanik",
                            "Verifikasi regularitas struktur"
                        ],
                        checkPoints: [
                            "Tidak ada lantai dengan kekakuan < 70% lantai di bawahnya",
                            "Rasio masa lateral konsisten antar lantai",
                            "Tidak ada kolom yang dibongkar tanpa kompensasi"
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian kolom",
                            "Buat rekomendasi perbaikan (jika diperlukan)",
                            "Tentukan prioritas penanganan",
                            "Sertakan justifikasi teknis"
                        ]
                    }
                ]
            },

            beams: {
                id: "WF-STR-03",
                name: "Analisis Balok",
                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA BALOK",
                        actions: [
                            "Ekstrak data dimensi balok (lebar, tinggi)",
                            "Identifikasi tulangan tarik dan tekan",
                            "Identifikasi mutu beton dan baja",
                            "Ekstrak data beban balok"
                        ],
                        nspkReferences: [
                            "SNI 2847:2019 - Elemen Lentur",
                            "SNI 1727:2020 - Beban Desain"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI FISIK BALOK",
                        actions: [
                            "Inspeksi visual kondisi balok",
                            "Klasifikasikan retak: lentur (tegangan tarik), geser (diagonal)",
                            "Ukur defleksi (lendutan) balok",
                            "Identifikasi korosi tulangan"
                        ],
                        crackPatterns: [
                            { type: "Retak Lentur", location: "Midspan, vertikal dari bawah", cause: "Beban berlebih" },
                            { type: "Retak Geser", location: "Support, diagonal 45°", cause: "Kurang shear reinforcement" },
                            { type: "Retak Torsi", location: "Spiral di sepanjang elemen", cause: "Beban torsi" }
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI BALOK",
                        actions: [
                            "Hitung kapasitas lentur (M_n)",
                            "Hitung kapasitas geser (V_n)",
                            "Hitung defleksi aktual (Δ_actual)",
                            "Bandingkan dengan batas SNI"
                        ],
                        formulas: [
                            {
                                name: "Batas Lendutan",
                                formula: "Δ_maks ≤ L/240 (beban hidup)",
                                threshold: "L/480 untuk beban hidup jangka panjang"
                            },
                            {
                                name: "Kapasitas Geser",
                                formula: "V_n = V_c + V_s",
                                threshold: "V_u ≤ φ × V_n (φ = 0.75)"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI SAMBUNGAN",
                        actions: [
                            "Periksa sambungan balok-kolom",
                            "Verifikasi detail anchorage",
                            "Evaluasi konstruksi sambungan ( welded, bolted )",
                            "Identifikasi kegagalan sambungan"
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian balok",
                            "Buat rekomendasi perbaikan",
                            "Tentukan prioritas penanganan"
                        ]
                    }
                ]
            },

            slabs: {
                id: "WF-STR-04",
                name: "Analisis Pelat Lantai",
                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA PELAT",
                        actions: [
                            "Ekstrak ketebalan pelat",
                            "Identifikasi tulangan pelat (mesh atau bar)",
                            "Identifikasi jenis pelat: one-way, two-way, flat slab",
                            "Ekstrak beban pelat"
                        ],
                        nspkReferences: [
                            "SNI 2847:2019 - Elemen Pelat",
                            "SNI 1727:2020 - Beban Lantai"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI FISIK PELAT",
                        actions: [
                            "Inspeksi visual permukaan pelat",
                            "Identifikasi retak mapping pattern",
                            "Ukur defleksi pelat",
                            "Periksa kondisi punching shear (jika flat slab)"
                        ],
                        crackPatterns: [
                            { type: "Retak Shrinkage", pattern: "Random, halus", cause: "Pengeringan beton" },
                            { type: "Retak Susut", pattern: "Grid, regular", cause: "Pergerakan thermal" },
                            { type: "Retak Lentur", pattern: "Di bawah beban, paralel span", cause: "Beban berlebih" }
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI PELAT",
                        actions: [
                            "Hitung momen desain pelat",
                            "Hitung kapasitas lentur pelat",
                            "Hitung defleksi pelat",
                            "Verifikasi punching shear (untuk kolom interior)"
                        ],
                        formulas: [
                            {
                                name: "Batas Defleksi",
                                formula: "Δ_maks ≤ L/360 (beban hidup)",
                                threshold: "L/480 untuk defleksi total"
                            },
                            {
                                name: "Punching Shear",
                                formula: "V_u ≤ φ × V_c",
                                threshold: "Kritikal untuk flat slab tanpa drop panel"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI VIBRASI",
                        actions: [
                            "Evaluasi frekuensi natural pelat",
                            "Tinjau respon terhadap getaran mesin",
                            "Verifikasi kenyamanan pengguna"
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian pelat",
                            "Buat rekomendasi perbaikan",
                            "Tentukan prioritas penanganan"
                        ]
                    }
                ]
            },

            roof: {
                id: "WF-STR-05",
                name: "Analisis Rangka Atap",
                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA ATAP",
                        actions: [
                            "Identifikasi jenis atap: baja kayu, rangka baja, beton",
                            "Ekstrak data dimensi dan profil",
                            "Identifikasi beban angin desain",
                            "Ekstrak data penutup atap"
                        ],
                        nspkReferences: [
                            "SNI 1727:2020 - Beban Angin",
                            "SNI 1729:2020 - Baja Struktural",
                            "SNI 7973:2013 - Konstruksi Kayu"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI FISIK ATAP",
                        actions: [
                            "Inspeksi kondisi rangka atap",
                            "Identifikasi korosi (baja) atau rayap (kayu)",
                            "Periksa sambungan (bolted, welded, nailed)",
                            "Evaluasi kondisi penutup atap"
                        ],
                        damageIndicators: [
                            "Korosi pada profil baja (> 20% area)",
                            "Hole atau kebocoran pada penutup",
                            "Kelonggaran sambungan",
                            "Deformasi rangka"
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI ATAP",
                        actions: [
                            "Hitung beban angin desain (SNI 1727)",
                            "Hitung kapasitas elemen atap",
                            "Verifikasi stabilitas lateral",
                            "Hitung kapasitas sambungan"
                        ],
                        formulas: [
                            {
                                name: "Beban Angin",
                                formula: "p = q_z × G × C_p",
                                threshold: "q_z berdasarkan zona gempa dan tinggi"
                            },
                            {
                                name: "Kapasitas Sambungan",
                                formula: "P_n ≤ φ × R_n",
                                threshold: "φ = 0.75 untuk sambungan"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI KEDAP AIRAN",
                        actions: [
                            "Verifikasi sistem drainase atap",
                            "Periksa talang dan downspout",
                            "Evaluasi potensi kebocoran"
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian atap",
                            "Buat rekomendasi perbaikan",
                            "Tentukan prioritas penanganan"
                        ]
                    }
                ]
            }
        }
    },

    // ==========================================
    // WORKFLOW 2: ANALISIS MEP
    // ==========================================
    mepAnalysis: {
        name: "MEP Analysis Workflow",
        description: "Workflow untuk analisis sistem Mekanikal, Elektrikal, dan Plambing",

        subWorkflows: {
            electrical: {
                id: "WF-MEP-01",
                name: "Analisis Sistem Listrik",
                persona: "Anda adalah Ahli Instalasi Listrik (Engineer Tenaga Listrik)",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA LISTRIK",
                        actions: [
                            "Ekstrak kapasitas trafo dan panel utama",
                            "Identifikasi sistem distribusi (MDP, SDP, DB)",
                            "Ekstrak data beban terpasang dan beban maksimum",
                            "Identifikasi jenis kabel dan ukuran"
                        ],
                        nspkReferences: [
                            "SNI 0225:2020 - PUIL",
                            "SNI 04-0227:2003 - Tegangan Standar"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI SISTEM LISTRIK",
                        actions: [
                            "Inspeksi panel utama dan distribusi",
                            "Periksa kondisi kabel (isolasi, terminasi)",
                            "Uji sistem grounding dan earthing",
                            "Identifikasi hot-spot dengan thermal imaging"
                        ],
                        checkPoints: [
                            "Panel tertutup dengan baik",
                            "Labeling jelas dan akurat",
                            "Kabel tidak terkelupas atau terpapar",
                            "Tidak ada kabel overloaded"
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI LISTRIK",
                        actions: [
                            "Hitung beban aktual vs kapasitas",
                            "Kalkulasi voltage drop (ΔV)",
                            "Verifikasi rating MCB/ELCB",
                            "Hitung impedansi sistem"
                        ],
                        formulas: [
                            {
                                name: "Voltage Drop",
                                formula: "ΔV% = (V_sumber - V_ujung) / V_sumber × 100%",
                                threshold: "Maks 4% untuk feeder, 5% total"
                            },
                            {
                                name: "Tahanan Grounding",
                                formula: "R_earth ≤ 5 Ohm",
                                threshold: "Wajib ≤ 5 Ohm (PUIL)"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI KESELAMATAN",
                        actions: [
                            "Verifikasi proteksi terhadap bahaya listrik",
                            "Periksa sistem ELCB/RCCB",
                            "Evaluasi potensi bahaya arus bocor",
                            "Tinjau akses untuk emergency shutdown"
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian listrik",
                            "Buat rekomendasi perbaikan",
                            "Tentukan prioritas penanganan"
                        ]
                    }
                ]
            },

            hvac: {
                id: "WF-MEP-02",
                name: "Analisis Sistem HVAC",
                persona: "Anda adalah Ahli Tata Udara dan Refrigerasi",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA HVAC",
                        actions: [
                            "Identifikasi jenis sistem: Split, Central, VRF",
                            "Ekstrak kapasitas pendingin (PK/TR)",
                            "Identifikasi sistem distribusi udara",
                            "Ekstrak data kontrol dan automasi"
                        ],
                        nspkReferences: [
                            "SNI 6390:2020 - Konservasi Energi HVAC",
                            "SNI 03-6572:2001 - Sistem Ventilasi"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI SISTEM HVAC",
                        actions: [
                            "Inspeksi kondisi unit indoor dan outdoor",
                            "Periksa kondisi ducting dan diffuser",
                            "Uji operasi kontrol dan sensor",
                            "Evaluasi kinerja sistem"
                        ],
                        performanceMetrics: [
                            { metric: "ACH", name: "Air Changes per Hour", threshold: "≥ 6 ACH untuk ruang non-AC" },
                            { metric: "CO2", name: "Konsentrasi CO2", threshold: "< 1000 ppm" },
                            { metric: "Temp", name: "Suhu Ruang", threshold: "24-26°C (AC)" }
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI HVAC",
                        actions: [
                            "Hitung beban pendinginan aktual",
                            "Kalkulasi ACH dari debit suplai",
                            "Verifikasi efisiensi energi (EER/COP)",
                            "Bandingkan dengan standar konservasi energi"
                        ],
                        formulas: [
                            {
                                name: "ACH",
                                formula: "ACH = (Q_suplai m3/h) / V_ruang m3",
                                threshold: "≥ 6 ACH untuk ventilasi minimum"
                            },
                            {
                                name: "Beban Pendinginan",
                                formula: "Q = m × Cp × ΔT",
                                threshold: "Dibandingkan dengan kapasitas unit"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI KUALITAS UDARA",
                        actions: [
                            "Tinjau infiltrasi dan exfiltrasi",
                            "Evaluasi distribusi udara",
                            "Periksa filter dan maintenance"
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian HVAC",
                            "Buat rekomendasi perbaikan",
                            "Tentukan prioritas penanganan"
                        ]
                    }
                ]
            },

            plumbing: {
                id: "WF-MEP-03",
                name: "Analisis Sistem Plambing",
                persona: "Anda adalah Ahli Rekayasa Plambing",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA PLAMBING",
                        actions: [
                            "Identifikasi sistem air bersih",
                            "Identifikasi sistem air kotor",
                            "Ekstrak data tangki reservoir dan pompa",
                            "Identifikasi sistem STP (jika ada)"
                        ],
                        nspkReferences: [
                            "SNI 8153:2015 - Sistem Plambing",
                            "Permen Kesehatan No. 32 Tahun 2017"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI SISTEM PLAMBING",
                        actions: [
                            "Inspeksi tangki air dan pompa",
                            "Periksa kondisi pipa dan fitting",
                            "Uji kualitas air (physical/chemical)",
                            "Evaluasi sistem drainase"
                        ],
                        checkPoints: [
                            "Tangki kedap air dan terlindung",
                            "Pipa tidak bocor atau korosi",
                            "Tekanan air memadai (≥ 1 bar)",
                            "Sistem vent berfungsi"
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI PLAMBING",
                        actions: [
                            "Hitung kebutuhan air harian",
                            "Verifikasi kapasitas reservoir",
                            "Kalkulasi kapasitas pompa",
                            "Verifikasi sistem STP"
                        ],
                        formulas: [
                            {
                                name: "Kebutuhan Air",
                                formula: "Q = Populasi × L/orang/hari",
                                threshold: "Minimum 150 L/orang/hari (permen PU)"
                            },
                            {
                                name: "Tekanan Sisa",
                                formula: "H_pompa - (H_statis + H_friksi) ≥ 1 bar",
                                threshold: "Minimum 1 bar pada kran tertinggi"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI SANITASI",
                        actions: [
                            "Verifikasi pemisahan black/grey water",
                            "Evaluasi efisiensi STP",
                            "Periksa potensi kontaminasi backflow"
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian plambing",
                            "Buat rekomendasi perbaikan",
                            "Tentukan prioritas penanganan"
                        ]
                    }
                ]
            },

            fireProtection: {
                id: "WF-MEP-04",
                name: "Analisis Sistem Proteksi Kebakaran",
                persona: "Anda adalah Fire Safety Engineer Senior",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA KEBAKARAN",
                        actions: [
                            "Identifikasi sistem aktif: sprinkler, hydrant, APAR",
                            "Identifikasi sistem pasif: fire door, fire wall, fire stop",
                            "Ekstrak sistem alarm dan deteksi",
                            "Identifikasi sistem manajemen kebakaran"
                        ],
                        nspkReferences: [
                            "SNI 03-3987:1995 - APAR",
                            "SNI 03-1746:2000 - Jalur Evakuasi",
                            "Permen PUPR No. 18 Tahun 2021 - Standar Pembongkaran"
                        ]
                    },
                    {
                        step: 2,
                        name: "INSPEKSI SISTEM KEBAKARAN",
                        actions: [
                            "Uji operasi sistem sprinkler dan hydrant",
                            "Periksa kondisi APAR (expired, pressure)",
                            "Verifikasi sistem alarm dan deteksi",
                            "Inspeksi jalur evakuasi"
                        ],
                        checkPoints: [
                            "APAR tersedia dan dalam masa berlaku",
                            "Jalur evakuasi tidak terhalang",
                            "Pintu darurat dapat dibuka dari dalam",
                            "Signage kebakaran jelas dan terlihat"
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI KEBAKARAN",
                        actions: [
                            "Hitung Fire Load Density",
                            "Verifikasi jarak tempuh evakuasi",
                            "Hitung lebar pintu eskalasi",
                            "Evaluasi kompartemenisasi"
                        ],
                        formulas: [
                            {
                                name: "Fire Load Density",
                                formula: "FLD = Total Energi Kalor (MJ) / Luas Kompartemen (m2)",
                                threshold: "Dibandingkan dengan kapasitas sistem"
                            },
                            {
                                name: "Travel Distance",
                                formula: "D_aktual ≤ 30m (tanpa sprinkler) atau 45m (dengan sprinkler)",
                                threshold: "Sesuai SNI 03-1746:2000"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "EVALUASI KEPATUHAN",
                        actions: [
                            "Verifikasi kepatuhan terhadap regulasi",
                            "Evaluasi efektivitas sistem",
                            "Identifikasi risiko kebakaran"
                        ]
                    },
                    {
                        step: 5,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian proteksi kebakaran",
                            "Buat rekomendasi perbaikan",
                            "Tentukan prioritas penanganan"
                        ]
                    }
                ]
            }
        }
    },

    // ==========================================
    // WORKFLOW 3: ANALISIS ARSITEKTUR
    // ==========================================
    architecturalAnalysis: {
        name: "Architectural Analysis Workflow",
        description: "Workflow untuk analisis kesesuaian arsitektur bangunan",

        subWorkflows: {
            buildingFunction: {
                id: "WF-ARC-01",
                name: "Analisis Fungsi Bangunan",
                persona: "Anda adalah Ahli Tata Guna Lahan Forensik",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA FUNGSI",
                        actions: [
                            "Ekstrak fungsi bangunan dari dokumen izin",
                            "Identifikasi fungsi aktual dari lapangan",
                            "Ekstrak data zonasi dan rencana kota",
                            "Identifikasi perubahan fungsi (jika ada)"
                        ],
                        nspkReferences: [
                            "UU No. 28 Tahun 2002 - Fungsi Bangunan",
                            "PP No. 16 Tahun 2021 - Perubahan Fungsi"
                        ]
                    },
                    {
                        step: 2,
                        name: "VERIFIKASI KONSENSI",
                        actions: [
                            "Bandingkan fungsi legal vs aktual",
                            "Identifikasi alih fungsi sebagian/total",
                            "Evaluasi dampak terhadap beban struktur",
                            "Tinjau izin perubahan fungsi"
                        ]
                    },
                    {
                        step: 3,
                        name: "ANALISIS DAMPAK",
                        actions: [
                            "Evaluasi dampak terhadap keselamatan",
                            "Analisis beban tambahan (jika perubahan)",
                            "Tinjau dampak terhadap fasilitas penunjang"
                        ]
                    },
                    {
                        step: 4,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian fungsi",
                            "Buat rekomendasi penyesuaian (jika diperlukan)"
                        ]
                    }
                ]
            },

            spacePlanning: {
                id: "WF-ARC-02",
                name: "Analisis Tata Ruang Dalam",
                persona: "Anda adalah Ahli Fisika Bangunan",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA RUANG",
                        actions: [
                            "Ekstrak layout ruang dari as-built",
                            "Identifikasi fungsi tiap ruang",
                            "Ekstrak data dimensi ruang",
                            "Identifikasi penggunaan ruang aktual"
                        ],
                        nspkReferences: [
                            "SNI 03-6575:2001 - Pencahayaan",
                            "SNI 03-2396:2001 - Pencahayaan Alami"
                        ]
                    },
                    {
                        step: 2,
                        name: "VERIFIKASI DIMENSI",
                        actions: [
                            "Verifikasi tinggi bersih ruang",
                            "Evaluasi luas ruang vs kapasitas",
                            "Periksa rasio volume ruang",
                            "Tinjau sirkulasi dalam ruang"
                        ]
                    },
                    {
                        step: 3,
                        name: "EVALUASI KENYAMANAN",
                        actions: [
                            "Evaluasi pencahayaan (alami & buatan)",
                            "Tinjau ventilasi dan penghawaan",
                            "Analisis akustik dan kebisingan",
                            "Evaluasi akses dan mobilitas"
                        ]
                    },
                    {
                        step: 4,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian tata ruang",
                            "Buat rekomendasi perbaikan"
                        ]
                    }
                ]
            },

            buildingEnvelope: {
                id: "WF-ARC-03",
                name: "Analisis Selubung Bangunan",
                persona: "Anda adalah Ahli Forensik Fasad Arsitektur",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA FASAD",
                        actions: [
                            "Ekstrak desain fasad dari dokumen",
                            "Identifikasi material fasad",
                            "Ekstrak detail konstruksi selubung",
                            "Identifikasi kondisi aktual fasad"
                        ],
                        nspkReferences: [
                            "SNI 6389:2020 - Konservasi Energi Selubung",
                            "SNI 6197:2020 - Konservasi Energi Pencahayaan"
                        ]
                    },
                    {
                        step: 2,
                        name: "VERIFIKASI MATERIAL",
                        actions: [
                            "Bandingkan material eksisting vs desain",
                            "Evaluasi kondisi material (deteriorasi)",
                            "Periksa detail konstruksi",
                            "Tinjau performa termal"
                        ]
                    },
                    {
                        step: 3,
                        name: "ANALISIS KINERJA",
                        actions: [
                            "Hitung Window-to-Wall Ratio (WWR)",
                            "Evaluasi Solar Reflectance Index (SRI)",
                            "Tinjau shading dan glare",
                            "Analisis kebocoran air (water tightness)"
                        ],
                        formulas: [
                            {
                                name: "WWR",
                                formula: "WWR = (Luas Kaca / Luas Total Dinding) × 100%",
                                threshold: "WWR optimum 20-40% untuk efisiensi energi"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian fasad",
                            "Buat rekomendasi perbaikan"
                        ]
                    }
                ]
            },

            accessibility: {
                id: "WF-ARC-04",
                name: "Analisis Aksesibilitas",
                persona: "Anda adalah Ahli Desain Inklusif",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA AKSES",
                        actions: [
                            "Identifikasi jalur akses difabel",
                            "Ekstrak data fasilitas difabel",
                            "Identifikasi kondisi lift dan toilet difabel",
                            "Periksa guiding block dan signage"
                        ],
                        nspkReferences: [
                            "Permen PUPR No. 14/PRT/M/2017 - Kemudahan Bangunan",
                            "UU No. 8 Tahun 2016 - Penyandang Disabilitas"
                        ]
                    },
                    {
                        step: 2,
                        name: "VERIFIKASI AKSESIBILITAS",
                        actions: [
                            "Verifikasi kemiringan ramp (max 1:12)",
                            "Periksa lebar jalur difabel",
                            "Evaluasi toilet difabel",
                            "Tinjau fasilitas pendukung"
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI KEPATUHAN",
                        actions: [
                            "Hitung indeks pemenuhan aksesibilitas",
                            "Identifikasi hambatan fisik",
                            "Evaluasi keramahan lingkungan"
                        ]
                    },
                    {
                        step: 4,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian aksesibilitas",
                            "Buat rekomendasi perbaikan"
                        ]
                    }
                ]
            }
        }
    },

    // ==========================================
    // WORKFLOW 4: ANALISIS LINGKUNGAN
    // ==========================================
    environmentalAnalysis: {
        name: "Environmental Analysis Workflow",
        description: "Workflow untuk analisis dampak lingkungan",

        subWorkflows: {
            amdal: {
                id: "WF-ENV-01",
                name: "Analisis Dokumen Lingkungan",
                persona: "Anda adalah Ahli Audit Lingkungan (Amdal)",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DOKUMEN LINGKUNGAN",
                        actions: [
                            "Ekstrak dokumen AMDAL/UKL-UPL/SPPL",
                            "Identifikasi matriks RKL-RPL",
                            "Ekstrak data pemantauan lingkungan",
                            "Identifikasi komitmen lingkungan"
                        ],
                        nspkReferences: [
                            "UU No. 32 Tahun 2009 - Perlindungan dan Pengelolaan Lingkungan Hidup",
                            "Permen LHK No. 13 Tahun 2020 - 3R melalui Bank Sampah"
                        ]
                    },
                    {
                        step: 2,
                        name: "VERIFIKASI PELAKSANAAN",
                        actions: [
                            "Verifikasi pelaksanaan RKL-RPL",
                            "Identifikasi deviasi dari komitmen",
                            "Evaluasi efektivitas pengelolaan",
                            "Tinjau hasil pemantauan"
                        ]
                    },
                    {
                        step: 3,
                        name: "EVALUASI DAMPAK",
                        actions: [
                            "Evaluasi emisi (genset, kendaraan)",
                            "Tinjau baku mutu air dan udara",
                            "Analisis kebisingan dan vibrasi",
                            "Evaluasi pengelolaan limbah"
                        ]
                    },
                    {
                        step: 4,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kepatuhan lingkungan",
                            "Buat rekomendasi perbaikan"
                        ]
                    }
                ]
            },

            openSpace: {
                id: "WF-ENV-02",
                name: "Analisis Ruang Terbuka Hijau",
                persona: "Anda adalah Ahli Lanskap dan Lingkungan",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA RTH",
                        actions: [
                            "Ekstrak data luas RTH dari izin",
                            "Identifikasi jenis RTH (alami/buatan)",
                            "Ekstrak data vegetasi dan penanaman",
                            "Identifikasi kondisi aktual RTH"
                        ],
                        nspkReferences: [
                            "SNI 1733:2004 - Lingkungan Perumahan",
                            "Permen ATR No. 14 Tahun 2022 - RTH"
                        ]
                    },
                    {
                        step: 2,
                        name: "VERIFIKASI KEPADUAN",
                        actions: [
                            "Hitung KDH aktual",
                            "Bandingkan dengan KDH izin",
                            "Evaluasi kualitas vegetasi",
                            "Tinjau fungsi ekologis RTH"
                        ]
                    },
                    {
                        step: 3,
                        name: "EVALUASI HIDROLOGI",
                        actions: [
                            "Evaluasi kapasitas infiltrasi",
                            "Tinjau manajemen air hujan",
                            "Analisis mitigasi banjir"
                        ]
                    },
                    {
                        step: 4,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian RTH",
                            "Buat rekomendasi perbaikan"
                        ]
                    }
                ]
            },

            drainage: {
                id: "WF-ENV-03",
                name: "Analisis Sistem Drainase",
                persona: "Anda adalah Ahli Hidrologi Permukaan",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DATA DRAINASE",
                        actions: [
                            "Ekstrak sistem drainase dari desain",
                            "Identifikasi saluran dan sumur resapan",
                            "Ekstrak data topografi",
                            "Identifikasi kondisi aktual drainase"
                        ],
                        nspkReferences: [
                            "SNI 03-2459:2002 - Sumur Resapan",
                            "SNI 03-2453:2002 - Sumur Resapan Pekarangan"
                        ]
                    },
                    {
                        step: 2,
                        name: "VERIFIKASI SISTEM",
                        actions: [
                            "Verifikasi kapasitas saluran",
                            "Periksa kondisi sumur resapan",
                            "Evaluasi kinerja sistem",
                            "Identifikasi bottleneck"
                        ]
                    },
                    {
                        step: 3,
                        name: "KALKULASI HIDROLOGI",
                        actions: [
                            "Hitung debit limpasan (Q = CIA)",
                            "Verifikasi kapasitas infiltrasi",
                            "Evaluasi risiko genangan"
                        ],
                        formulas: [
                            {
                                name: "Debit Limpasan Rasional",
                                formula: "Q = 0.278 × C × I × A",
                                threshold: "Dibandingkan dengan kapasitas drainase"
                            }
                        ]
                    },
                    {
                        step: 4,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kesesuaian drainase",
                            "Buat rekomendasi perbaikan"
                        ]
                    }
                ]
            }
        }
    },

    // ==========================================
    // WORKFLOW 5: VERIFIKASI INSTANSI TERKAIT
    // ==========================================
    institutionalVerification: {
        name: "Institutional Verification Workflow",
        description: "Workflow untuk verifikasi rekomendasi instansi terkait",

        subWorkflows: {
            crossCheck: {
                id: "WF-INST-01",
                name: "Cross-Check Dokumen Instansi",
                persona: "Anda adalah Asesor Audit Legal Lintas Instansi",

                steps: [
                    {
                        step: 1,
                        name: "EKSTRAKSI DOKUMEN INSTANSI",
                        actions: [
                            "Ekstrak SLO PLN (SLO Utilitas Listrik)",
                            "Ekstrak rekomendasi Damkar (Sistem Proteksi)",
                            "Ekstrak rekomendasi Lift (Sistem Transportasi)",
                            "Ekstrak dokumen AMDAL/UKL-UPL"
                        ],
                        nspkReferences: [
                            "PP No. 16 Tahun 2021 - Integrasi Izin",
                            "Permen PUPR No. 27/PRT/M/2018 - SLF"
                        ]
                    },
                    {
                        step: 2,
                        name: "VERIFIKASI VALIDITAS",
                        actions: [
                            "Verifikasi keabsahan dan masa berlaku",
                            "Cek konsistensi dengan kondisi aktual",
                            "Identifikasi rekomendasi yang belum terpenuhi",
                            "Tinjau perubahan setelah penerbitan"
                        ]
                    },
                    {
                        step: 3,
                        name: "EVALUASI REALISASI",
                        actions: [
                            "Hitung indeks realisasi kewajiban",
                            "Identifikasi gap antara rekomendasi dan realisasi",
                            "Evaluasi dampak terhadap SLF"
                        ]
                    },
                    {
                        step: 4,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan kepatuhan instansi",
                            "Buat rekomendasi penyelesaian"
                        ]
                    }
                ]
            },

            riskAssessment: {
                id: "WF-INST-02",
                name: "Penilaian Risiko Hukum",
                persona: "Anda adalah Analis Risiko Kepatuhan",

                steps: [
                    {
                        step: 1,
                        name: "IDENTIFIKASI RISIKO",
                        actions: [
                            "Identifikasi risiko ketidakpatuhan",
                            "Klasifikasikan tingkat risiko",
                            "Estimasi dampak hukum dan operasional"
                        ]
                    },
                    {
                        step: 2,
                        name: "ANALISIS MITIGASI",
                        actions: [
                            "Buat strategi mitigasi risiko",
                            "Tentukan prioritas penyelesaian",
                            "Estimasi biaya dan waktu"
                        ]
                    },
                    {
                        step: 3,
                        name: "SINTESIS KESIMPULAN",
                        actions: [
                            "Formulasikan kesimpulan risiko hukum",
                            "Buat rekomendasi penanganan"
                        ]
                    }
                ]
            }
        }
    }
};

// Helper function untuk memuat semua workflows
export function createWorkflows() {
    return DEEP_REASONING_WORKFLOWS;
}

// Helper function untuk mengambil workflow berdasarkan kategori
export function getWorkflowByCategory(category) {
    if (!DEEP_REASONING_WORKFLOWS[category]) {
        throw new Error(`Workflow category ${category} not found`);
    }
    return DEEP_REASONING_WORKFLOWS[category];
}

// Helper function untuk mengambil sub-workflow berdasarkan ID
export function getWorkflowById(id) {
    for (const category in DEEP_REASONING_WORKFLOWS) {
        if (DEEP_REASONING_WORKFLOWS[category].subWorkflows) {
            for (const subWorkflowId in DEEP_REASONING_WORKFLOWS[category].subWorkflows) {
                const workflow = DEEP_REASONING_WORKFLOWS[category].subWorkflows[subWorkflowId];
                if (workflow.id === id) {
                    return workflow;
                }
            }
        }
    }
    throw new Error(`Workflow with ID ${id} not found`);
}

// Helper function untuk mendapatkan semua workflow IDs
export function getAllWorkflowIds() {
    const ids = [];
    for (const category in DEEP_REASONING_WORKFLOWS) {
        if (DEEP_REASONING_WORKFLOWS[category].subWorkflows) {
            for (const subWorkflowId in DEEP_REASONING_WORKFLOWS[category].subWorkflows) {
                const workflow = DEEP_REASONING_WORKFLOWS[category].subWorkflows[subWorkflowId];
                ids.push(workflow.id);
            }
        }
    }
    return ids;
}