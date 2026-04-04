/**
 * DEEP REASONING RULES SYSTEM
 * 
 * File ini berisi semua aturan dasar (Rules) yang harus dipatuhi oleh AI
 * dalam melakukan analisis SLF (Sertifikat Laik Fungsi) Bangunan Gedung.
 * 
 * Rules mencakup:
 * 1. Kepatuhan NSPK (Undang-Undang, PP, Permen PUPR, SNI)
 * 2. Format output standar
 * 3. Metodologi penalaran forensik
 * 4. Dokumentasi dan sitasi
 * 5. Manajemen risiko
 */

export const DEEP_REASONING_RULES = {
    metadata: {
        version: "1.0.0",
        lastUpdated: "2026-04-01",
        system: "Smart AI Pengkaji SLF",
        description: "Comprehensive rules framework for deep reasoning in SLF analysis"
    },

    // ==========================================
    // SECTION 1: NSPK COMPLIANCE RULES
    // ==========================================
    nspkCompliance: {
        // 1. UNDANG-UNDANG
        undangUndang: {
            rules: [
                {
                    id: "UU-28-2002",
                    name: "UU No. 28 Tahun 2002 - Bangunan Gedung",
                    application: "Semua aspek penilaian SLF",
                    keyPoints: [
                        "Bangunan gedung harus memenuhi persyaratan administratif dan teknis",
                        "Persyaratan teknis meliputi: keselamatan, kesehatan, kenyamanan, kemudahan",
                        "Wajib memiliki Sertifikat Laik Fungsi untuk bangunan gedung",
                        "Bangunan gedung wajib dipelihara dan dirawat secara berkala"
                    ],
                    priority: "CRITICAL"
                },
                {
                    id: "UU-02-2017",
                    name: "UU No. 02 Tahun 2017 - Jasa Konstruksi",
                    application: "Verifikasi pelaksanaan konstruksi",
                    keyPoints: [
                        "Pelaksana konstruksi harus memiliki sertifikasi kompetensi",
                        "Pekerjaan konstruksi harus sesuai dengan standar teknis",
                        "Wajib menyusun dan menyimpan dokumen konstruksi"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "UU-06-2017",
                    name: "UU No. 6 Tahun 2017 - Arsitek",
                    application: "Verifikasi desain dan pelaksanaan arsitektur",
                    keyPoints: [
                        "Arsitek harus memiliki sertifikasi kompetensi",
                        "Desain arsitektur harus mempertimbangkan keselamatan dan kenyamanan",
                        "Wajib mempertahankan asas profesionalisme"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "UU-11-2020",
                    name: "UU No. 11 Tahun 2020 - Cipta Kerja",
                    application: "Penyederhanaan proses perizinan",
                    keyPoints: [
                        "Standardisasi persyaratan perizinan",
                        "Digitalisasi sistem perizinan",
                        "Pengintegrasian perizinan berbasis risiko"
                    ],
                    priority: "MEDIUM"
                },
                {
                    id: "PP-PERPENG-2-2022",
                    name: "PP Pengganti UU No. 2 Tahun 2022 - Cipta Kerja",
                    application: "Perubahan penyediaan perizinan berusaha",
                    keyPoints: [
                        "Penyederhanaan standar produk",
                        "Penghapusan izin tertentu",
                        "Integrasi perizinan berbasis risiko"
                    ],
                    priority: "MEDIUM"
                },
                {
                    id: "UU-06-2023",
                    name: "UU No. 6 Tahun 2023 - Penetapan PP Cipta Kerja",
                    application: "Implementasi PP Cipta Kerja",
                    keyPoints: [
                        "Penetapan PP Pengganti UU No. 2 Tahun 2022",
                        "Konsistensi dengan UU Cipta Kerja",
                        "Implementasi perizinan berbasis risiko"
                    ],
                    priority: "MEDIUM"
                }
            ]
        },

        // 2. PERATURAN PEMERINTAH
        peraturanPemerintah: {
            rules: [
                {
                    id: "PP-06-2021",
                    name: "PP No. 6 Tahun 2021 - Penyelenggaraan Perizinan Berusaha di Daerah",
                    application: "Verifikasi izin mendirikan bangunan",
                    keyPoints: [
                        "Izin mendirikan bangunan wajib dimiliki sebelum pembangunan",
                        "Bangunan harus sesuai dengan izin yang diberikan",
                        "Perubahan fungsi wajib mengajukan izin baru"
                    ],
                    priority: "CRITICAL"
                },
                {
                    id: "PP-14-2021",
                    name: "PP No. 14 Tahun 2021 - Perubahan PP No. 22/2020",
                    application: "Implementasi UU Jasa Konstruksi",
                    keyPoints: [
                        "Perubahan perizinan jasa konstruksi",
                        "Sertifikasi tenaga kerja konstruksi",
                        "Pengawasan pekerjaan konstruksi"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PP-15-2021",
                    name: "PP No. 15 Tahun 2021 - Pelaksanaan UU Arsitek",
                    application: "Implementasi UU Arsitek",
                    keyPoints: [
                        "Standar kompetensi arsitek",
                        "Lisensi praktik arsitek",
                        "Penyelenggaraan jasa arsitektur"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PP-16-2021",
                    name: "PP No. 16 Tahun 2021 - Pelaksanaan UU No. 28 Tahun 2002",
                    application: "Implementasi teknis penilaian SLF",
                    keyPoints: [
                        "Sertifikat Laik Fungsi diterbitkan berdasarkan hasil penilaian tim ahli",
                        "Masa berlaku SLF maksimal 5 tahun untuk bangunan tertentu",
                        "Wajib evaluasi berkala untuk bangunan fungsi khusus"
                    ],
                    priority: "CRITICAL"
                }
            ]
        },

        // 3. PERATURAN MENTERI PUPR
        permenPUPR: {
            rules: [
                {
                    id: "PERMEN-24-PRT-M-2008",
                    name: "Permen PUPR No. 24/PRT/M/2008 - Pemeliharaan Bangunan",
                    application: "Evaluasi kondisi fisik bangunan",
                    keyPoints: [
                        "Bangunan wajib dipelihara secara berkala",
                        "Pemeliharaan mencakup: struktur, arsitektur, utilitas",
                        "Wajib memiliki jadwal pemeliharaan yang terdokumentasi"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PERMEN-16-PRT-M-2010",
                    name: "Permen PUPR No. 16/PRT/M/2010 - Pemeriksaan Berkala",
                    application: "Pemeriksaan teknis bangunan",
                    keyPoints: [
                        "Bangunan wajib diperiksa secara berkala oleh penilik bangunan",
                        "Hasil pemeriksaan harus didokumentasikan",
                        "Bangunan yang tidak laik fungsi harus diberikan rekomendasi perbaikan"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PERMEN-14-PRT-M-2017",
                    name: "Permen PUPR No. 14/PRT/M/2017 - Kemudahan Bangunan",
                    application: "Verifikasi kemudahan akses",
                    keyPoints: [
                        "Bangunan harus menyediakan kemudahan untuk disabilitas",
                        "Akses keluar-masuk yang sesuai standar",
                        "Fasilitas sanitasi yang mudah diakses"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PERMEN-11-PRT-M-2018",
                    name: "Permen PUPR No. 11/PRT/M/2018 - Tim Ahli Bangunan",
                    application: "Verifikasi kompetensi tim pengkaji",
                    keyPoints: [
                        "Tim ahli bangunan gedung terdiri dari ahli struktur, arsitektur, utilitas",
                        "Pengkaji teknis harus memiliki sertifikasi kompetensi",
                        "Tim ahli bertanggung jawab atas keabsahan hasil penilaian"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PERMEN-22-PRT-M-2018",
                    name: "Permen PUPR No. 22/PRT/M/2018 - Pembangunan Bangunan Negara",
                    application: "Bangunan gedung negara",
                    keyPoints: [
                        "Standar khusus bangunan gedung negara",
                        "Prosedur pengadaan dan pembangunan",
                        "Pengawasan dan pemeliharaan"
                    ],
                    priority: "MEDIUM"
                },
                {
                    id: "PERMEN-27-PRT-M-2018",
                    name: "Permen PUPR No. 27/PRT/M/2018 - Sertifikat Laik Fungsi",
                    application: "Format dan prosedur SLF",
                    keyPoints: [
                        "SLF memuat hasil penilaian kesesuaian bangunan gedung",
                        "SLF mencakup aspek: administratif, teknis, dan operasional",
                        "SLF ditandatangani oleh kepala dinas penanggung jawab"
                    ],
                    priority: "CRITICAL"
                },
                {
                    id: "PERMEN-02-2020",
                    name: "Permen PUPR No. 2 Tahun 2020 - Perubahan Kedua IMB",
                    application: "Izin Mendirikan Bangunan Gedung",
                    keyPoints: [
                        "Perubahan ketentuan IMB/PBG",
                        "Simplifikasi proses perizinan",
                        "Integrasi dengan OSS"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PERMEN-03-2020",
                    name: "Permen PUPR No. 3 Tahun 2020 - Perubahan SLF",
                    application: "Update prosedur SLF",
                    keyPoints: [
                        "Simplifikasi prosedur SLF",
                        "Perubahan format dokumen",
                        "Integrasi dengan sistem OSS"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PERMEN-08-2021",
                    name: "Permen PUPR No. 8 Tahun 2021 - Kegagalan Bangunan",
                    application: "Identifikasi dan penilaian risiko kegagalan",
                    keyPoints: [
                        "Kegagalan bangunan diklasifikasikan: parsial, total, progresif",
                        "Penilaian kegagalan harus menggunakan metoda ilmiah",
                        "Wajib mengidentifikasi penyebab kegagalan secara akurat"
                    ],
                    priority: "CRITICAL"
                },
                {
                    id: "PERMEN-18-2021",
                    name: "Permen PUPR No. 18 Tahun 2021 - Standar Pembongkaran",
                    application: "Pembongkaran bangunan gedung",
                    keyPoints: [
                        "Prosedur pembongkaran aman",
                        "Perizinan pembongkaran",
                        "Pengelolaan material bekas"
                    ],
                    priority: "MEDIUM"
                },
                {
                    id: "PERMEN-19-2021",
                    name: "Permen PUPR No. 19 Tahun 2021 - Bangunan Cagar Budaya",
                    application: "Bangunan cagar budaya yang dilestarikan",
                    keyPoints: [
                        "Standar pemeliharaan bangunan cagar budaya",
                        "Pelestarian nilai sejarah",
                        "Adaptasi fungsi modern"
                    ],
                    priority: "MEDIUM"
                },
                {
                    id: "PERMEN-20-2021",
                    name: "Permen PUPR No. 20 Tahun 2021 - Bangunan Fungsi Khusus",
                    application: "Bangunan fungsi khusus",
                    keyPoints: [
                        "Standar khusus bangunan fungsi khusus",
                        "Perizinan tambahan",
                        "Pengawasan intensif"
                    ],
                    priority: "HIGH"
                },
                {
                    id: "PERMEN-10-2023",
                    name: "Permen PUPR No. 10 Tahun 2023 - Bangunan Cerdas",
                    application: "Evaluasi sistem smart building",
                    keyPoints: [
                        "Bangunan cerdas mengintegrasikan teknologi informasi",
                        "Wajib memiliki sistem monitoring dan kontrol otomatis",
                        "Evaluasi efisiensi energi dan kenyamanan pengguna"
                    ],
                    priority: "MEDIUM"
                }
            ]
        },

        // 4. SNI ARSITEKTUR
        sniArsitektur: [
            {
                id: "SNI-1733-2004",
                name: "Tata Cara Perencanaan Lingkungan Perumahan",
                application: "Evaluasi tapak dan lingkungan",
                keyPoints: [
                    "Kepadatan bangunan sesuai standar",
                    "Jarak antar bangunan memenuhi persyaratan",
                    "Penataan ruang terbuka hijau"
                ],
                priority: "HIGH"
            }
        ],

        // 5. SNI STRUKTUR
        sniStruktur: [
            {
                id: "SNI-1726-2019",
                name: "Tata Cara Perencanaan Ketahanan Gempa",
                application: "Analisis ketahanan struktur terhadap gempa",
                keyPoints: [
                    "Bangunan harus tahan terhadap gempa rencana",
                    "Wajib melakukan analisis respons spektra",
                    "Memperhitungkan faktor redundansi dan kelebihan kuat"
                ],
                priority: "CRITICAL"
            },
            {
                id: "SNI-1727-2020",
                name: "Beban Desain Minimum",
                application: "Kalkulasi beban struktur",
                keyPoints: [
                    "Beban hidup sesuai fungsi ruang",
                    "Beban mati termasuk semua elemen bangunan",
                    "Beban lingkungan: angin, gempa, suhu"
                ],
                priority: "CRITICAL"
            },
            {
                id: "SNI-1729-2020",
                name: "Spesifikasi Bangunan Baja Struktural",
                application: "Analisis elemen baja",
                keyPoints: [
                    "Material baja harus memenuhi standar mutu",
                    "Sambungan harus didesain sesuai standar",
                    "Perlindungan korosi wajib diperhatikan"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-8900-2020",
                name: "Panduan Desain Sederhana",
                application: "Bangunan bertingkat rendah",
                keyPoints: [
                    "Desain sederhana untuk bangunan ≤ 4 lantai",
                    "Metoda langsung untuk perhitungan struktur",
                    "Simplifikasi analisis sesuai batasan"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-7860-2020",
                name: "Ketentuan Seismik untuk Bangunan Baja",
                application: "Analisis seismik struktur baja",
                keyPoints: [
                    "Perencanaan seismik untuk struktur baja",
                    "Detail sambungan seismik",
                    "Ductility dan energy dissipation"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-2847-2019",
                name: "Persyaratan Beton Struktural",
                application: "Analisis elemen beton",
                keyPoints: [
                    "Kuat tekan beton sesuai desain",
                    "Tulangan sesuai spesifikasi",
                    "Cover beton memenuhi persyaratan"
                ],
                priority: "CRITICAL"
            },
            {
                id: "SNI-2052-2017",
                name: "Baja Tulangan Beton",
                application: "Material tulangan beton",
                keyPoints: [
                    "Spesifikasi baja tulangan",
                    "Kuat tarik dan屈服",
                    "Sambungan tulangan"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-8046-2016",
                name: "Stabilitas Lereng",
                application: "Analisis stabilitas lereng",
                keyPoints: [
                    "Analisis stabilitas lereng",
                    "Faktor keamanan minimum",
                    "Metode perbaikan lereng"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-03-1734-1989",
                name: "Tata Cara Perencanaan Beton dan Struktur Dinding Bertulang",
                application: "Perencanaan struktur beton",
                keyPoints: [
                    "Perencanaan struktur beton bertulang",
                    "Struktur dinding bertulang",
                    "Detail struktur"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-03-3976-1995",
                name: "Tata Cara Pengadukan dan Pengecoran Beton",
                application: "Pelaksanaan beton",
                keyPoints: [
                    "Prosedur pengadukan beton",
                    "Pengecoran dan compacting",
                    "Curing beton"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-03-2834-2000",
                name: "Tata Cara Pembuatan Rencana Campuran Beton Normal",
                application: "Mix design beton",
                keyPoints: [
                    "Mix design beton normal",
                    "Seleksi agregat",
                    "Proporsi semen-air"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-03-3449-2002",
                name: "Tata Cara Pembuatan Rencana Campuran Beton Ringan",
                application: "Mix design beton ringan",
                keyPoints: [
                    "Mix design beton ringan",
                    "Agregat ringan",
                    "Proporsi campuran"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-03-2847-2002",
                name: "Jumlah Benda Uji",
                application: "Pengujian beton",
                keyPoints: [
                    "Jumlah minimum benda uji",
                    "Prosedur sampling",
                    "Pengujian kuat tekan"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-03-4803-1998",
                name: "Uji Pantul Beton",
                application: "Pengujian non-destruktif",
                keyPoints: [
                    "Metode uji pantul",
                    "Evaluasi kualitas beton",
                    "Interpretasi hasil"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-03-1973-1980",
                name: "Metode Pengujian Berat Isi Beton",
                application: "Pengujian beton",
                keyPoints: [
                    "Metode pengujian berat isi",
                    "Perhitungan berat isi",
                    "Evaluasi kepadatan"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-03-4330-1997",
                name: "Metode Pengujian Elemen Struktur Beton dengan Alat Palu",
                application: "Pengujian non-destruktif",
                keyPoints: [
                    "Metode rebound hammer",
                    "Evaluasi kuat tekan beton",
                    "Kalibrasi alat"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-03-2459-2002",
                name: "Spesifikasi Sumur Resapan Air Hujan",
                application: "Sistem drainase",
                keyPoints: [
                    "Desain sumur resapan",
                    "Dimensi dan kapasitas",
                    "Konstruksi sumur"
                ],
                priority: "MEDIUM"
            }
        ],

        // 6. SNI MEP
        sniMep: [
            {
                id: "SNI-0225-2020",
                name: "Persyaratan Umum Instalasi Listrik (PUIL) 2020",
                application: "Verifikasi sistem listrik",
                keyPoints: [
                    "Instalasi harus aman dan sesuai standar",
                    "Proteksi terhadap bahaya listrik",
                    "Sistem grounding memenuhi persyaratan"
                ],
                priority: "CRITICAL"
            },
            {
                id: "SNI-0225-2011",
                name: "Persyaratan Umum Instalasi Listrik (PUIL) 2011",
                application: "Referensi PUIL lama",
                keyPoints: [
                    "Standar instalasi listrik 2011",
                    "Untuk referensi bangunan lama"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-6390-2020",
                name: "Konservasi Energi Tata Udara",
                application: "Evaluasi efisiensi AC",
                keyPoints: [
                    "Sistem HVAC efisien energi",
                    "Pengendalian suhu dan kelembapan",
                    "Ventilasi memenuhi standar kesehatan"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-6389-2020",
                name: "Konservasi Energi Selubung Bangunan",
                application: "Evaluasi efisiensi fasad",
                keyPoints: [
                    "Material fasad mempertimbangkan energi",
                    "Window-to-Wall Ratio optimum",
                    "Perlindungan panas dan silau"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-6197-2020",
                name: "Konservasi Energi Pencahayaan",
                application: "Evaluasi sistem pencahayaan",
                keyPoints: [
                    "Efisiensi energi pencahayaan",
                    "Utilisasi cahaya alami",
                    "Kontrol pencahayaan"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-8153-2015",
                name: "Sistem Plambing",
                application: "Verifikasi sistem air dan sanitasi",
                keyPoints: [
                    "Sistem air bersih memenuhi kebutuhan",
                    "Sistem pembuangan air limbah efektif",
                    "Prevention backflow dan kontaminasi"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-04-0227-2003",
                name: "Tegangan Standar",
                application: "Standar tegangan listrik",
                keyPoints: [
                    "Tegangan standar Indonesia",
                    "Toleransi tegangan",
                    "Klasifikasi tegangan"
                ],
                priority: "MEDIUM"
            },
            {
                id: "SNI-03-1746-2000",
                name: "Tata Cara Perencanaan Sarana Jalan Keluar",
                application: "Proteksi kebakaran",
                keyPoints: [
                    "Jalan keluar untuk penyelamatan",
                    "Jumlah dan lebar jalan keluar",
                    "Penandaan jalan keluar"
                ],
                priority: "CRITICAL"
            },
            {
                id: "SNI-03-6573-2001",
                name: "Tata Cara Perancangan Sistem Transportasi Vertikal",
                application: "Sistem lift",
                keyPoints: [
                    "Desain sistem lift",
                    "Kapasitas dan kecepatan",
                    "Safety requirements"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-05-7052-2004",
                name: "Syarat-syarat Umum Konstruksi Lift Penumpang",
                application: "Konstruksi lift",
                keyPoints: [
                    "Konstruksi lift traksi tanpa kamar mesin",
                    "Syarat teknis lift",
                    "Safety devices"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-03-3987-1995",
                name: "Tata Cara Perencanaan APAR",
                application: "Proteksi kebakaran",
                keyPoints: [
                    "Pemadam api ringan untuk pencegahan kebakaran",
                    "Jarak dan distribusi APAR",
                    "Tipe APAR sesuai bahaya"
                ],
                priority: "CRITICAL"
            },
            {
                id: "SNI-03-1745-2000",
                name: "Tata Cara Perencanaan Sistem Pipa Tegak & Slang",
                application: "Proteksi kebakaran",
                keyPoints: [
                    "Sistem pipa tegak dan slang kebakaran",
                    "Hydrant box dan slang",
                    "Tekanan dan flow rate"
                ],
                priority: "CRITICAL"
            },
            {
                id: "SNI-03-3985-2000",
                name: "Tata Cara Perencanaan Sistem Deteksi dan Alarm Kebakaran",
                application: "Proteksi kebakaran",
                keyPoints: [
                    "Sistem deteksi kebakaran",
                    "Sistem alarm kebakaran",
                    "Zoning dan coverage"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-03-3989-2000",
                name: "Tata Cara Perencanaan Sistem Springkler Otomatik",
                application: "Proteksi kebakaran",
                keyPoints: [
                    "Sistem springkler otomatik",
                    "Desain sprinkler",
                    "Coverage dan density"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-03-6571-2001",
                name: "Sistem Pengendalian Asap Kebakaran",
                application: "Proteksi kebakaran",
                keyPoints: [
                    "Sistem pengendalian asap",
                    "Smoke exhaust system",
                    "Pressurization stairwell"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-03-0712-2004",
                name: "Sistem Manajemen Asap",
                application: "Mal, Atrium, Ruang Besar",
                keyPoints: [
                    "Manajemen asap di mal, atrium, ruang bervolume besar",
                    "Smoke management design",
                    "Ventilasi asap"
                ],
                priority: "HIGH"
            },
            {
                id: "SNI-7062-2019",
                name: "Pengukuran Intensitas Pencahayaan",
                application: "Pengukuran pencahayaan",
                keyPoints: [
                    "Metode pengukuran intensitas pencahayaan",
                    "Standar intensitas pencahayaan",
                    "Alat ukur dan prosedur"
                ],
                priority: "MEDIUM"
            }
        ],

        // 7. ATURAN TERKAIT LAINNYA
        aturanLain: {
            lingkunganHidup: [
                {
                    id: "KLHK-13-2022",
                    name: "Pedoman Pelaksanaan 3R melalui Bank Sampah",
                    application: "Pengelolaan sampah",
                    keyPoints: [
                        "Implementasi 3R (Reduce, Reuse, Recycle)",
                        "Bank sampah",
                        "Pengelolaan sampah terpadu"
                    ],
                    priority: "MEDIUM"
                },
                {
                    id: "KLHK-68-2016",
                    name: "Baku Mutu Air Limbah",
                    application: "Pengolahan air limbah",
                    keyPoints: [
                        "Baku mutu air limbah domestik",
                        "Parameter pengujian",
                        "Standar kualitas air"
                    ],
                    priority: "HIGH"
                }
            ],
            esdm: [
                {
                    id: "ESDM-13-2020",
                    name: "Penyediaan Infrastruktur Pengisian Listrik",
                    application: "Kendaraan listrik",
                    keyPoints: [
                        "Infrastruktur SPKLU",
                        "Standar pengisian kendaraan listrik",
                        "Safety requirements"
                    ],
                    priority: "MEDIUM"
                }
            ],
            kesehatan: [
                {
                    id: "KESEHATAN-492-2010",
                    name: "Persyaratan Kualitas Air Minum",
                    application: "Kualitas air minum",
                    keyPoints: [
                        "Standar kualitas air minum",
                        "Parameter fisik, kimia, bakteriologis",
                        "Pengujian kualitas air"
                    ],
                    priority: "CRITICAL"
                },
                {
                    id: "KESEHATAN-32-2017",
                    name: "Standar Baku Mutu Kesehatan Lingkungan",
                    application: "Kesehatan lingkungan",
                    keyPoints: [
                        "Standar baku mutu kesehatan lingkungan",
                        "Parameter kesehatan lingkungan",
                        "Pengawasan kesehatan lingkungan"
                    ],
                    priority: "HIGH"
                }
            ],
            atrBpn: [
                {
                    id: "ATR-14-2022",
                    name: "Penyediaan dan Pemanfaatan Ruang Terbuka Hijau",
                    application: "Ruang terbuka hijau",
                    keyPoints: [
                        "Standar ruang terbuka hijau",
                        "Pemanfaatan RTH",
                        "Pengelolaan RTH"
                    ],
                    priority: "MEDIUM"
                }
            ],
            dalamNegeri: [
                {
                    id: "KEMENDAGRI-01-2007",
                    name: "Penataan Ruang Terbuka Hijau",
                    application: "Penataan RTH",
                    keyPoints: [
                        "Pedoman penataan RTH",
                        "Persentase RTH minimum",
                        "Pengelolaan RTH"
                    ],
                    priority: "MEDIUM"
                }
            ],
            perdagangan: [
                {
                    id: "PERDAGANGAN-02-2019",
                    name: "Pedoman Pembangunan Sarana Perdagangan",
                    application: "Sarana perdagangan",
                    keyPoints: [
                        "Standar sarana perdagangan",
                        "Pembangunan pasar modern",
                        "Pengelolaan sarana perdagangan"
                    ],
                    priority: "MEDIUM"
                }
            ]
        }
    },

    // ==========================================
    // SECTION 2: OUTPUT FORMAT RULES
    // ==========================================
    outputFormat: {
        mandatoryStructure: [
            {
                section: "A",
                title: "Persyaratan NSPK",
                requirements: [
                    "Cantumkan semua NSPK yang relevan",
                    "Gunakan format sitasi akademik yang konsisten",
                    "Prioritaskan SNI dan Permen PUPR",
                    "Gunakan ASCE hanya jika tidak tersedia di SNI"
                ],
                format: "List point dengan nomor urut"
            },
            {
                section: "B",
                title: "Data Eksisting",
                requirements: [
                    "Data dapat berupa: gambar, narasi, hasil lapangan",
                    "Sertakan tanggal pengambilan data",
                    "Dokumentasikan kondisi aktual",
                    "Identifikasi perbedaan dengan dokumen izin"
                ],
                format: "Deskripsi naratif + gambar/tabel"
            },
            {
                section: "C",
                title: "Perhitungan Kuantitatif",
                requirements: [
                    "Tampilkan langkah perhitungan",
                    "Gunakan satuan SI yang konsisten",
                    "Sertakan asumsi dan referensi rumus",
                    "Bandingkan dengan nilai batas NSPK"
                ],
                format: "Rumus + substitusi + hasil"
            },
            {
                section: "D",
                title: "Analisis Kesesuaian",
                requirements: [
                    "Buat tabel perbandingan",
                    "Sertakan visualisasi (grafik/diagram)",
                    "Analisis deviasi dari standar",
                    "Evaluasi dampak terhadap performa"
                ],
                format: "Tabel + narasi + visualisasi"
            },
            {
                section: "E",
                title: "Risiko Teknis",
                requirements: [
                    "Identifikasi semua risiko potensial",
                    "Klasifikasikan risiko (tinggi/medium/rendah)",
                    "Estimasi probabilitas dan dampak",
                    "Rekomendasi mitigasi"
                ],
                format: "Matriks risiko + narasi"
            },
            {
                section: "F",
                title: "Evaluasi dan Implikasi Laik Fungsi",
                requirements: [
                    "Kesimpulan kesesuaian tiap aspek",
                    "Visualisasi skor kepatuhan",
                    "Implikasi terhadap keseluruhan SLF",
                    "Rekomendasi perbaikan jika diperlukan"
                ],
                format: "Narasi + visualisasi (chart/gauge)"
            },
            {
                section: "G",
                title: "Matriks Temuan dan Rekomendasi",
                requirements: [
                    "Ringkasan semua temuan",
                    "Prioritas perbaikan",
                    "Target penyelesaian",
                    "Rekomendasi teknis spesifik"
                ],
                format: "Tabel matriks"
            }
        ],
        qualityStandards: {
            accuracy: "Data dan perhitungan harus akurat",
            completeness: "Semua aspek yang relevan harus dianalisis",
            consistency: "Format dan terminologi konsisten",
            clarity: "Bahasa teknis yang jelas dan mudah dipahami",
            traceability: "Sumber data dan referensi harus jelas"
        }
    },

    // ==========================================
    // SECTION 3: REASONING METHODOLOGY RULES
    // ==========================================
    reasoningMethodology: {
        deepReasoning: {
            steps: [
                {
                    step: 1,
                    name: "EKSTRAKSI",
                    description: "Identifikasi dan ekstraksi informasi kunci",
                    actions: [
                        "Ekstrak data dari dokumen izin",
                        "Identifikasi data eksisting dari lapangan",
                        "Ekstrak persyaratan NSPK yang relevan",
                        "Identifikasi anomali dan ketidakkonsistenan"
                    ]
                },
                {
                    step: 2,
                    name: "ANALISIS",
                    description: "Analisis mendalam menggunakan metodologi teknik",
                    actions: [
                        "Hitung parameter teknis yang diperlukan",
                        "Bandingkan dengan standar NSPK",
                        "Analisis sebab-akibat",
                        "Evaluasi performa sistem"
                    ]
                },
                {
                    step: 3,
                    name: "EVALUASI",
                    description: "Evaluasi kesesuaian dan risiko",
                    actions: [
                        "Tentukan tingkat kepatuhan",
                        "Identifikasi risiko potensial",
                        "Evaluasi implikasi keselamatan",
                        "Bandingkan dengan kondisi ideal"
                    ]
                },
                {
                    step: 4,
                    name: "SINTESIS",
                    description: "Sintesis kesimpulan dan rekomendasi",
                    actions: [
                        "Formulasikan kesimpulan teknis",
                        "Buat rekomendasi perbaikan",
                        "Tentukan prioritas penanganan",
                        "Sertakan justifikasi teknis"
                    ]
                }
            ]
        },
        forensicAnalysis: {
            principles: [
                "Evidence-based analysis: semua kesimpulan didukung bukti",
                "Systematic approach: analisis terstruktur dan metodis",
                "Peer reviewable: analisis dapat ditinjau oleh ahli lain",
                "Reproducible: hasil analisis dapat direproduksi",
                "Conservative: berhati-hati dalam asumsi dan estimasi"
            ],
            techniques: [
                "Visual inspection: inspeksi visual mendalam",
                "Non-destructive testing: pengujian non-destruktif",
                "Structural analysis: analisis struktur",
                "Historical analysis: analisis data historis",
                "Comparative analysis: analisis komparatif"
            ]
        }
    },

    // ==========================================
    // SECTION 4: DOCUMENTATION RULES
    // ==========================================
    documentation: {
        citationRules: {
            format: "APA-like untuk NSPK Indonesia",
            examples: [
                "Undang-Undang Republik Indonesia Nomor 28 Tahun 2002 (2002)",
                "Peraturan Menteri PUPR Nomor 27/PRT/M/2018 (2018)",
                "SNI 1726:2019 (2019)",
                "ASCE 7-16 (2016)"
            ],
            inText: "Gunakan format: (SNI 1726:2019) atau [SNI 1726:2019]",
            referenceList: "Daftar pustaka lengkap di akhir dokumen"
        },
        evidenceRules: {
            photoEvidence: [
                "Foto harus jelas dan fokus",
                "Sertakan skala referensi",
                "Tandai area yang relevan",
                "Catat tanggal dan lokasi"
            ],
            calculationEvidence: [
                "Tampilkan rumus lengkap",
                "Substitusi nilai",
                "Satuan yang jelas",
                "Hasil akhir dengan presisi"
            ],
            referenceEvidence: [
                "Cantumkan sumber data",
                "Verifikasi keandalan data",
                "Catat asumsi yang digunakan",
                "Dokumentasikan ketidakpastian"
            ]
        }
    },

    // ==========================================
    // SECTION 5: RISK MANAGEMENT RULES
    // ==========================================
    riskManagement: {
        riskCategories: [
            {
                category: "Risiko Struktur",
                severity: "CRITICAL",
                indicators: [
                    "Retak struktural signifikan",
                    "Defleksi berlebihan",
                    "Korosi tulangan",
                    "Kegagalan fondasi"
                ]
            },
            {
                category: "Risiko Kebakaran",
                severity: "CRITICAL",
                indicators: [
                    "Sistem proteksi non-fungsional",
                    "Jalur evakuasi terhalang",
                    "Beban api berlebihan",
                    "Material mudah terbakar"
                ]
            },
            {
                category: "Risiko Listrik",
                severity: "HIGH",
                indicators: [
                    "Instalasi tidak aman",
                    "Overload kabel",
                    "Grounding tidak memadai",
                    "Panel terbakar/panas"
                ]
            },
            {
                category: "Risiko Sanitasi",
                severity: "HIGH",
                indicators: [
                    "Air limbah tidak tertangani",
                    "Kontaminasi air bersih",
                    "Pembuangan sampah tidak benar",
                    "Genangan air"
                ]
            },
            {
                category: "Risiko Kenyamanan",
                severity: "MEDIUM",
                indicators: [
                    "Pencahayaan tidak adekuat",
                    "Suhu tidak nyaman",
                    "Kebisingan berlebihan",
                    "Kualitas udara buruk"
                ]
            }
        ],
        riskAssessment: {
            matrix: [
                { probability: "High", impact: "High", risk: "CRITICAL" },
                { probability: "High", impact: "Medium", risk: "HIGH" },
                { probability: "Medium", impact: "High", risk: "HIGH" },
                { probability: "Medium", impact: "Medium", risk: "MEDIUM" },
                { probability: "Low", impact: "High", risk: "MEDIUM" },
                { probability: "High", impact: "Low", risk: "MEDIUM" },
                { probability: "Low", impact: "Medium", risk: "LOW" },
                { probability: "Medium", impact: "Low", risk: "LOW" },
                { probability: "Low", impact: "Low", risk: "LOW" }
            ],
            thresholds: {
                CRITICAL: "Perbaikan segera, bangunan mungkin tidak laik fungsi",
                HIGH: "Perbaikan prioritas tinggi, risiko keselamatan",
                MEDIUM: "Perbaikan direkomendasikan, risiko operasional",
                LOW: "Perbaikan opsional, risiko minimal"
            }
        }
    },

    // ==========================================
    // SECTION 6: SCORING RULES
    // ==========================================
    scoring: {
        complianceScore: {
            formula: "Score = (Total Points Achieved / Total Maximum Points) × 100",
            categories: [
                { name: "Sangat Laik", min: 85, max: 100, action: "Diterbitkan" },
                { name: "Laik Bersyarat", min: 70, max: 84, action: "Perbaikan Minor" },
                { name: "Kurang Laik", min: 50, max: 69, action: "Perbaikan Mayor" },
                { name: "Tidak Laik", min: 0, max: 49, action: "Tidak Diterbitkan" }
            ]
        },
        weighting: {
            keselamatan: 0.40,
            kesehatan: 0.25,
            kenyamanan: 0.20,
            kemudahan: 0.10,
            lingkungan: 0.05
        },
        criticalItems: {
            mustPass: [
                "Kesesuaian fungsi bangunan",
                "Struktur bangunan",
                "Sistem proteksi kebakaran",
                "Jalur evakuasi",
                "Instalasi listrik"
            ],
            failureImpact: "Jika item kritis gagal, skor keseluruhan tidak boleh melebihi 50"
        }
    },

    // ==========================================
    // SECTION 7: INTEGRATION RULES
    // ==========================================
    integration: {
        database: {
            rules: [
                "Semua analisis harus disimpan di database Supabase",
                "Gunakan transaction untuk data terkait",
                "Validasi data sebelum insert/update",
                "Log semua perubahan data"
            ]
        },
        files: [
            "Sertakan link ke file evidence di Google Drive",
            "Gunakan nama file yang konsisten",
            "Organisasi file dalam folder terstruktur",
            "Version control untuk revisi dokumen"
        ],
        continuousLearning: [
            "Catat semua feedback dari pengkaji ahli",
            "Simpan perbandingan AI vs expert judgement",
            "Update model berdasarkan data historis",
            "Maintain audit trail untuk semua analisis"
        ]
    },

    // ==========================================
    // SECTION 8: QUALITY ASSURANCE RULES
    // ==========================================
    qualityAssurance: {
        preAnalysis: [
            "Verifikasi kelengkapan data input",
            "Validasi integritas dokumen",
            "Cek konsistensi data",
            "Identifikasi missing information"
        ],
        duringAnalysis: [
            "Gunakan NSPK yang paling update",
            "Verifikasi asumsi yang dibuat",
            "Cross-check perhitungan",
            "Document reasoning process"
        ],
        postAnalysis: [
            "Review hasil analisis",
            "Validasi kesimpulan",
            "Cek format output",
            "Verify all citations"
        ],
        peerReview: [
            "Analisis dapat ditinjau oleh ahli lain",
            "Sediakan semua dokumentasi",
            "Terima feedback constructively",
            "Update berdasarkan review"
        ]
    }
};

// Helper function untuk memuat semua aturan regulasi
export function loadRegulatoryRules() {
    return DEEP_REASONING_RULES;
}

// Helper function untuk mengambil rules berdasarkan kategori
export function getRulesByCategory(category) {
    if (!DEEP_REASONING_RULES[category]) {
        throw new Error(`Category ${category} not found in rules`);
    }
    return DEEP_REASONING_RULES[category];
}

// Helper function untuk mengambil NSPK berdasarkan jenis
export function getNSPKByType(type) {
    const nspkTypes = {
        'UU': DEEP_REASONING_RULES.nspkCompliance.undangUndang.rules,
        'PP': DEEP_REASONING_RULES.nspkCompliance.peraturanPemerintah.rules,
        'PERMEN': DEEP_REASONING_RULES.nspkCompliance.permenPUPR.rules,
        'SNI-ARSITEKTUR': DEEP_REASONING_RULES.nspkCompliance.sniArsitektur,
        'SNI-STRUKTUR': DEEP_REASONING_RULES.nspkCompliance.sniStruktur,
        'SNI-MEP': DEEP_REASONING_RULES.nspkCompliance.sniMep,
        'LINGKUNGAN': DEEP_REASONING_RULES.nspkCompliance.aturanLain.lingkunganHidup,
        'ESDM': DEEP_REASONING_RULES.nspkCompliance.aturanLain.esdm,
        'KESEHATAN': DEEP_REASONING_RULES.nspkCompliance.aturanLain.kesehatan,
        'ATR': DEEP_REASONING_RULES.nspkCompliance.aturanLain.atrBpn,
        'KEMENDAGRI': DEEP_REASONING_RULES.nspkCompliance.aturanLain.dalamNegeri,
        'PERDAGANGAN': DEEP_REASONING_RULES.nspkCompliance.aturanLain.perdagangan
    };

    if (!nspkTypes[type]) {
        throw new Error(`NSPK type ${type} not found`);
    }
    return nspkTypes[type];
}

// Helper function untuk mendapatkan format output
export function getOutputFormat() {
    return DEEP_REASONING_RULES.outputFormat;
}

// Helper function untuk mendapatkan langkah reasoning
export function getReasoningSteps() {
    return DEEP_REASONING_RULES.reasoningMethodology.deepReasoning.steps;
}