/**
 * DEEP REASONING HOOKS SYSTEM
 * 
 * File ini berisi semua titik kait (Hooks) yang digunakan oleh AI
 * untuk memodifikasi atau memperluas perilaku analisis SLF
 * pada tahap-tahap tertentu dalam proses penalaran.
 * 
 * Hooks memungkinkan:
 * 1. Pre-processing hooks (sebelum analisis)
 * 2. In-processing hooks (selama analisis)
 * 3. Post-processing hooks (setelah analisis)
 * 4. Custom validation hooks
 * 5. External integration hooks
 */

export const DEEP_REASONING_HOOKS = {
    metadata: {
        version: "1.0.0",
        lastUpdated: "2026-04-01",
        system: "Smart AI Pengkaji SLF",
        description: "Comprehensive hooks system for deep reasoning in SLF analysis"
    },

    // ==========================================
    // PRE-PROCESSING HOOKS
    // ==========================================
    preProcessing: {
        name: "Pre-Processing Hooks",
        description: "Hooks yang dijalankan sebelum analisis dimulai",

        hooks: {
            validateInput: {
                id: "HOOK-PRE-01",
                name: "Validasi Input Data",
                description: "Validasi kelengkapan dan integritas data input sebelum analisis",
                trigger: "beforeAnalysis",
                execution: "required",
                priority: "CRITICAL",

                validationRules: [
                    {
                        rule: "Dokumen Izin Wajib Ada",
                        check: "PBG/IMB atau izin setara tersedia",
                        impact: "Tidak dapat lanjut tanpa dokumen izin"
                    },
                    {
                        rule: "Dokumen Struktur Wajib Ada",
                        check: "Shop drawing struktur atau perhitungan struktur",
                        impact: "Analisis struktur tidak dapat dilakukan"
                    },
                    {
                        rule: "Dokumen Eksisting Wajib Ada",
                        check: "Foto, video, atau laporan lapangan tersedia",
                        impact: "Analisis kondisi aktual tidak dapat dilakukan"
                    },
                    {
                        rule: "Data Identifikasi Bangunan Lengkap",
                        check: "Nama, alamat, fungsi, luas, lantai tersedia",
                        impact: "Analisis tidak dapat dipersonalisasi"
                    }
                ],

                action: "Return error jika validasi gagal, lanjut jika sukses"
            },

            enrichContext: {
                id: "HOOK-PRE-02",
                name: "Enrichment Konteks",
                description: "Menambahkan konteks tambahan berdasarkan data yang tersedia",
                trigger: "beforeAnalysis",
                execution: "optional",
                priority: "HIGH",

                enrichmentTasks: [
                    {
                        task: "Identifikasi Zona Gempa",
                        source: "Lokasi bangunan",
                        action: "Retrieve data SNI 1726:2019 untuk zona gempa",
                        output: "Zona gempa, parameter gempa, faktor kecepatan"
                    },
                    {
                        task: "Identifikasi Klasifikasi Bangunan",
                        source: "Fungsi dan luas bangunan",
                        action: "Retrieve klasifikasi bangunan dari UU 28/2002",
                        output: "Kategori risiko, persyaratan khusus"
                    },
                    {
                        task: "Identifikasi Relevansi NSPK",
                        source: "Fungsi dan karakteristik bangunan",
                        action: "Filter NSPK yang relevan secara otomatis",
                        output: "List NSPK prioritas untuk analisis"
                    },
                    {
                        task: "Identifikasi Tahun Pembangunan",
                        source: "Dokumen izin",
                        action: "Retrieve standar yang berlaku saat pembangunan",
                        output: "NSPK legacy vs current untuk evaluasi"
                    }
                ],

                action: "Store enriched context dalam context object untuk digunakan selama analisis"
            },

            checkDataQuality: {
                id: "HOOK-PRE-03",
                name: "Quality Check Data",
                description: "Menilai kualitas data dan menentukan confidence level",
                trigger: "beforeAnalysis",
                execution: "optional",
                priority: "HIGH",

                qualityMetrics: [
                    {
                        metric: "Kelengkapan Dokumen",
                        calculation: "Jumlah dokumen tersedia / Total dokumen dibutuhkan",
                        threshold: "≥ 70% untuk analisis lengkap"
                    },
                    {
                        metric: "Kualitas Foto Eksisting",
                        calculation: "Jumlah foto jelas / Total foto",
                        threshold: "≥ 60% foto harus jelas"
                    },
                    {
                        metric: "Recency Data",
                        calculation: "Selisih tanggal data - tanggal analisis",
                        threshold: "Data maks 1 tahun untuk kondisi aktual"
                    },
                    {
                        metric: "Konsistensi Data",
                        calculation: "Jumlah data konsisten / Total data",
                        threshold: "Tidak ada kontradiksi mayor"
                    }
                ],

                action: "Return confidence score dan recommendations untuk data gaps"
            },

            initializeAnalysis: {
                id: "HOOK-PRE-04",
                name: "Inisialisasi Analisis",
                description: "Mempersiapkan struktur analisis dan workspace",
                trigger: "beforeAnalysis",
                execution: "required",
                priority: "CRITICAL",

                initializationTasks: [
                    "Buat struktur output A-G",
                    "Inisialisasi variabel tracking",
                    "Set persona dan konteks analisis",
                    "Load rules dan workflows yang relevan"
                ],

                action: "Return initialized analysis object"
            }
        }
    },

    // ==========================================
    // IN-PROCESSING HOOKS
    // ==========================================
    inProcessing: {
        name: "In-Processing Hooks",
        description: "Hooks yang dijalankan selama proses analisis",

        hooks: {
            stepTransition: {
                id: "HOOK-IN-01",
                name: "Transition Antara Step",
                description: "Validasi dan persiapan transisi antar step dalam workflow",
                trigger: "beforeEachStep",
                execution: "optional",
                priority: "MEDIUM",

                checks: [
                    {
                        check: "Step sebelumnya selesai",
                        action: "Verify semua output step sebelumnya tersedia"
                    },
                    {
                        check: "Data cukup untuk step berikutnya",
                        action: "Verify input requirements terpenuhi"
                    },
                    {
                        check: "Tidak ada blocking findings",
                        action: "Check jika findings kritis menghentikan analisis"
                    }
                ],

                action: "Return true untuk lanjut, false untuk stop/skip step"
            },

            calculationVerification: {
                id: "HOOK-IN-02",
                name: "Verifikasi Perhitungan",
                description: "Cross-check perhitungan yang dilakukan oleh AI",
                trigger: "afterCalculation",
                execution: "optional",
                priority: "HIGH",

                verificationTasks: [
                    {
                        task: "Unit Consistency Check",
                        action: "Verify semua satuan konsisten dan dalam SI"
                    },
                    {
                        task: "Reasonableness Check",
                        action: "Verify hasil dalam range yang reasonable"
                    },
                    {
                        task: "Cross-Reference Check",
                        action: "Compare dengan data sumber lain jika tersedia"
                    },
                    {
                        task: "Limit Check",
                        action: "Verify tidak melebihi batas fisik yang mungkin"
                    }
                ],

                action: "Flag perhitungan yang mencurigakan untuk review"
            },

            findingClassification: {
                id: "HOOK-IN-03",
                name: "Klasifikasi Temuan",
                description: "Klasifikasikan temuan berdasarkan severity dan impact",
                trigger: "onFinding",
                execution: "optional",
                priority: "HIGH",

                classificationRules: [
                    {
                        severity: "CRITICAL",
                        criteria: [
                            "Mengancam keselamatan jiwa",
                            "Potensi kegagalan struktur total",
                            "Sistem proteksi non-fungsional",
                            "Pelanggaran hukum mayor"
                        ],
                        action: "Immediate flag, required recommendation"
                    },
                    {
                        severity: "HIGH",
                        criteria: [
                            "Risiko keselamatan signifikan",
                            "Deteriorasi berat",
                            "Sistem tidak memenuhi standar",
                            "Deviasi dari izin yang signifikan"
                        ],
                        action: "Flag, recommendation required"
                    },
                    {
                        severity: "MEDIUM",
                        criteria: [
                            "Risiko operasional",
                            "Deteriorasi moderat",
                            "Kurang optimal tapi masih aman",
                            "Minor deviation dari standar"
                        ],
                        action: "Document, recommendation optional"
                    },
                    {
                        severity: "LOW",
                        criteria: [
                            "Minor cosmetic issues",
                            "Best practice tidak terpenuhi",
                            "Potential improvement areas"
                        ],
                        action: "Document, note for maintenance"
                    }
                ],

                action: "Return classified finding dengan action items"
            },

            nspkComplianceCheck: {
                id: "HOOK-IN-04",
                name: "Cek Kepatuhan NSPK",
                description: "Verifikasi kepatuhan terhadap NSPK secara real-time",
                trigger: "duringAnalysis",
                execution: "optional",
                priority: "HIGH",

                checkProcess: [
                    {
                        step: "Identify Relevant NSPK",
                        action: "Filter NSPK berdasarkan analisis saat ini"
                    },
                    {
                        step: "Extract Requirements",
                        action: "Extract persyaratan teknis dari NSPK"
                    },
                    {
                        step: "Compare with Actual",
                        action: "Compare kondisi aktual dengan persyaratan"
                    },
                    {
                        step: "Classify Compliance",
                        action: "Classify: Compliant, Non-compliant, Partially Compliant"
                    }
                ],

                action: "Return compliance status untuk setiap aspek"
            },

            riskAssessment: {
                id: "HOOK-IN-05",
                name: "Penilaian Risiko",
                description: "Evaluasi risiko dari temuan secara berkelanjutan",
                trigger: "onFinding",
                execution: "optional",
                priority: "HIGH",

                riskAssessmentProcess: [
                    {
                        step: "Identify Hazard",
                        action: "Identifikasi hazard dari temuan"
                    },
                    {
                        step: "Assess Probability",
                        action: "Estimasi probability (Low/Medium/High)"
                    },
                    {
                        step: "Assess Impact",
                        action: "Estimasi impact (Safety, Health, Operational, Financial)"
                    },
                    {
                        step: "Calculate Risk",
                        action: "Calculate risk level (Critical/High/Medium/Low)"
                    }
                ],

                action: "Return risk matrix dan risk score"
            }
        }
    },

    // ==========================================
    // POST-PROCESSING HOOKS
    // ==========================================
    postProcessing: {
        name: "Post-Processing Hooks",
        description: "Hooks yang dijalankan setelah analisis selesai",

        hooks: {
            formatOutput: {
                id: "HOOK-POST-01",
                name: "Format Output Standar",
                description: "Format output sesuai struktur A-G yang standar",
                trigger: "afterAnalysis",
                execution: "required",
                priority: "CRITICAL",

                outputStructure: {
                    A: {
                        title: "Persyaratan NSPK",
                        required: true,
                        format: "List point dengan sitasi"
                    },
                    B: {
                        title: "Data Eksisting",
                        required: true,
                        format: "Deskripsi naratif + gambar/tabel"
                    },
                    C: {
                        title: "Perhitungan Kuantitatif",
                        required: true,
                        format: "Rumus + substitusi + hasil"
                    },
                    D: {
                        title: "Analisis Kesesuaian",
                        required: true,
                        format: "Tabel + narasi + visualisasi"
                    },
                    E: {
                        title: "Risiko Teknis",
                        required: true,
                        format: "Matriks risiko + narasi"
                    },
                    F: {
                        title: "Evaluasi dan Implikasi Laik Fungsi",
                        required: true,
                        format: "Narasi + visualisasi"
                    },
                    G: {
                        title: "Matriks Temuan dan Rekomendasi",
                        required: true,
                        format: "Tabel matriks"
                    }
                },

                action: "Generate formatted output sesuai struktur"
            },

            calculateOverallScore: {
                id: "HOOK-POST-02",
                name: "Kalkulasi Skor Keseluruhan",
                description: "Hitung skor kepatuhan keseluruhan berdasarkan semua aspek",
                trigger: "afterAnalysis",
                execution: "required",
                priority: "CRITICAL",

                scoringMethodology: {
                    aspects: [
                        {
                            aspect: "Kesesuaian Fungsi",
                            weight: 0.15,
                            components: ["Fungsi sesuai izin", "Kapasitas adekuat", "Kelayakan operasional"]
                        },
                        {
                            aspect: "Struktur Bangunan",
                            weight: 0.35,
                            components: ["Fondasi", "Kolom", "Balok", "Pelat", "Atap"]
                        },
                        {
                            aspect: "Arsitektur",
                            weight: 0.15,
                            components: ["Fasad", "Tata ruang", "Aksesibilitas", "Kenyamanan"]
                        },
                        {
                            aspect: "Utilitas",
                            weight: 0.25,
                            components: ["Listrik", "MEP", "Proteksi kebakaran"]
                        },
                        {
                            aspect: "Lingkungan",
                            weight: 0.10,
                            components: ["RTH", "Drainase", "AMDAL"]
                        }
                    ],

                    criticalItems: [
                        "Kesesuaian fungsi bangunan",
                        "Struktur bangunan",
                        "Sistem proteksi kebakaran",
                        "Jalur evakuasi",
                        "Instalasi listrik"
                    ],

                    scoreCategories: [
                        { name: "Sangat Laik", min: 85, max: 100, action: "Diterbitkan" },
                        { name: "Laik Bersyarat", min: 70, max: 84, action: "Perbaikan Minor" },
                        { name: "Kurang Laik", min: 50, max: 69, action: "Perbaikan Mayor" },
                        { name: "Tidak Laik", min: 0, max: 49, action: "Tidak Diterbitkan" }
                    ]
                },

                action: "Return overall score dan category"
            },

            generateRecommendations: {
                id: "HOOK-POST-03",
                name: "Generate Rekomendasi",
                description: "Buat rekomendasi teknis berdasarkan temuan dan skor",
                trigger: "afterAnalysis",
                execution: "required",
                priority: "HIGH",

                recommendationLogic: [
                    {
                        condition: "Critical findings present",
                        action: "Immediate rectification required",
                        timeline: "30 hari atau sebelum SLF"
                    },
                    {
                        condition: "High severity findings",
                        action: "Prioritized remediation",
                        timeline: "60-90 hari"
                    },
                    {
                        condition: "Medium severity findings",
                        action: "Scheduled maintenance",
                        timeline: "6-12 bulan"
                    },
                    {
                        condition: "Low severity findings",
                        action: "Routine maintenance",
                        timeline: "12-24 bulan"
                    }
                ],

                action: "Return prioritized recommendation matrix"
            },

            generateSummary: {
                id: "HOOK-POST-04",
                name: "Generate Ringkasan Eksekutif",
                description: "Buat ringkasan eksekutif untuk pemilik bangunan",
                trigger: "afterAnalysis",
                execution: "optional",
                priority: "MEDIUM",

                summaryStructure: [
                    "Overall compliance score",
                    "Key findings (top 3-5)",
                    "Critical items that need attention",
                    "Recommended actions",
                    "Timeline for compliance"
                ],

                action: "Return executive summary dalam bahasa sederhana"
            },

            saveToDatabase: {
                id: "HOOK-POST-05",
                name: "Simpan ke Database",
                description: "Simpan hasil analisis ke database Supabase",
                trigger: "afterAnalysis",
                execution: "required",
                priority: "CRITICAL",

                saveProcess: [
                    {
                        step: "Save Analysis Result",
                        table: "analisis_slf",
                        fields: ["proyek_id", "aspek", "skor", "temuan", "rekomendasi"]
                    },
                    {
                        step: "Save Findings",
                        table: "temuan_slf",
                        fields: ["analisis_id", "kategori", "severity", "deskripsi"]
                    },
                    {
                        step: "Save Recommendations",
                        table: "rekomendasi_slf",
                        fields: ["analisis_id", "prioritas", "aksi", "timeline"]
                    },
                    {
                        step: "Save Evidence Links",
                        table: "evidence_links",
                        fields: ["analisis_id", "drive_id", "tipe", "deskripsi"]
                    }
                ],

                action: "Return saved record IDs untuk tracking"
            }
        }
    },

    // ==========================================
    // CUSTOM VALIDATION HOOKS
    // ==========================================
    customValidation: {
        name: "Custom Validation Hooks",
        description: "Hooks untuk validasi spesifik berdasarkan tipe bangunan",

        hooks: {
            highRiseBuilding: {
                id: "HOOK-VAL-01",
                name: "Validasi Gedung Tinggi (> 4 lantai)",
                description: "Validasi tambahan untuk gedung tinggi",
                trigger: "afterAnalysis",
                execution: "conditional",
                condition: "jumlah_lantai > 4",

                additionalChecks: [
                    {
                        check: "Sistem Evakuasi Bertingkat",
                        requirement: "Akses kegedung dan refuge area"
                    },
                    {
                        check: "Sistem Proteksi Kebakaran Bertingkat",
                        requirement: "Sistem sprinkler dan hydrant tiap lantai"
                    },
                    {
                        check: "Struktur Tahan Gempa",
                        requirement: "Analisis respons spektra dan daktilitas"
                    },
                    {
                        check: "Sistem Lift",
                        requirement: "Lift penumpang dan lift tanggap darurat"
                    },
                    {
                        check: "Sistem Pressurisasi Stair",
                        requirement: "Pressurisasi untuk jalur evakuasi"
                    }
                ],

                action: "Add additional findings jika ada non-compliance"
            },

            hospitalBuilding: {
                id: "HOOK-VAL-02",
                name: "Validasi Bangunan Rumah Sakit",
                description: "Validasi tambahan untuk bangunan RS",
                trigger: "afterAnalysis",
                execution: "conditional",
                condition: "fungsi_bangunan == 'Rumah Sakit'",

                additionalChecks: [
                    {
                        check: "Sistem Kelistrikan Redundan",
                        requirement: "Genset dan UPS dengan transfer switch otomatis"
                    },
                    {
                        check: "Sistem Gas Medis",
                        requirement: "Pipa gas medis dengan deteksi kebocoran"
                    },
                    {
                        check: "Sistem HVAC Khusus",
                        requirement: "Pressure rooms dan filtrasi udara"
                    },
                    {
                        check: "Akses Ambulans",
                        requirement: "Dedicated drop-off area untuk ambulan"
                    },
                    {
                        check: "Sistem Komunikasi Darurat",
                        requirement: "Nurse call dan system komunikasi"
                    }
                ],

                action: "Add additional findings untuk RS-specific requirements"
            },

            schoolBuilding: {
                id: "HOOK-VAL-03",
                name: "Validasi Bangunan Sekolah",
                description: "Validasi tambahan untuk bangunan sekolah",
                trigger: "afterAnalysis",
                execution: "conditional",
                condition: "fungsi_bangunan == 'Sekolah'",

                additionalChecks: [
                    {
                        check: "Jalur Evakuasi Khusus Anak",
                        requirement: "Lebar dan signage yang sesuai untuk anak"
                    },
                    {
                        check: "Aksesibilitas Difabel",
                        requirement: "Ramp dan toilet difabel wajib"
                    },
                    {
                        check: "Playground Safety",
                        requirement: "Area bermain dengan material aman"
                    },
                    {
                        check: "Lighting Level",
                        requirement: "Pencahayaan memadai untuk belajar"
                    },
                    {
                        check: "Noise Control",
                        requirement: "Akustik untuk kelas"
                    }
                ],

                action: "Add additional findings untuk school-specific requirements"
            },

            commercialBuilding: {
                id: "HOOK-VAL-04",
                name: "Validasi Bangunan Komersial",
                description: "Validasi tambahan untuk bangunan komersial",
                trigger: "afterAnalysis",
                execution: "conditional",
                condition: "fungsi_bangunan in ['Perkantoran', 'Ruko', 'Mall']",


                additionalChecks: [
                    {
                        check: "Park Space Ratio",
                        requirement: "Rasio park memenuhi standar Pemda"
                    },
                    {
                        check: "Signage dan Wayfinding",
                        requirement: "Signage jelas dan memadai"
                    },
                    {
                        check: "Loading Dock",
                        requirement: "Area loading bila diperlukan"
                    },
                    {
                        check: "Access Control",
                        requirement: "Sistem keamanan dan akses"
                    },
                    {
                        check: "HVAC Capacity",
                        requirement: "Kapasitas HVAC memadai untuk beban komersial"
                    }
                ],

                action: "Add additional findings untuk commercial-specific requirements"
            },

            heritageBuilding: {
                id: "HOOK-VAL-05",
                name: "Validasi Bangunan Cagar Budaya",
                description: "Validasi tambahan untuk bangunan cagar budaya",
                trigger: "afterAnalysis",
                execution: "conditional",
                condition: "status_bangunan == 'Cagar Budaya'",

                additionalChecks: [
                    {
                        check: "Preservasi Elemen Asli",
                        requirement: "Elemen asli dipertahankan"
                    },
                    {
                        check: "Restorasi Sesuai Standar",
                        requirement: "Permen PUPR No. 19 Tahun 2021"
                    },
                    {
                        check: "Adaptive Reuse",
                        requirement: "Perubahan fungsi tidak merusak karakter"
                    },
                    {
                        check: "Maintenance Plan",
                        requirement: "Plan maintenance khusus"
                    }
                ],

                action: "Add additional findings untuk heritage-specific requirements"
            }
        }
    },

    // ==========================================
    // EXTERNAL INTEGRATION HOOKS
    // ==========================================
    externalIntegration: {
        name: "External Integration Hooks",
        description: "Hooks untuk integrasi dengan sistem eksternal",

        hooks: {
            driveIntegration: {
                id: "HOOK-EXT-01",
                name: "Integrasi Google Drive",
                description: "Link evidence ke Google Drive",
                trigger: "afterAnalysis",
                execution: "optional",
                priority: "MEDIUM",

                integrationTasks: [
                    {
                        task: "Upload Analysis Report",
                        action: "Generate PDF dan upload ke Drive folder proyek"
                    },
                    {
                        task: "Link Evidence Files",
                        action: "Create links ke foto/dokumen di Drive"
                    },
                    {
                        task: "Organize Files",
                        action: "Organize files dalam folder terstruktur"
                    }
                ],

                action: "Return Drive folder URL dan file links"
            },

            notificationIntegration: {
                id: "HOOK-EXT-02",
                name: "Integrasi Notifikasi",
                description: "Kirim notifikasi ke stakeholder",
                trigger: "afterAnalysis",
                execution: "optional",
                priority: "LOW",

                notificationRules: [
                    {
                        trigger: "Critical findings",
                        recipient: "Pemilik bangunan",
                        message: "Immediate attention required"
                    },
                    {
                        trigger: "Analysis complete",
                        recipient: "Pemilik bangunan",
                        message: "Analysis report ready"
                    },
                    {
                        trigger: "Score < 70",
                        recipient: "Admin sistem",
                        message: "Low compliance score detected"
                    }
                ],

                action: "Send notification sesuai rules"
            },

            auditLog: {
                id: "HOOK-EXT-03",
                name: "Logging Audit Trail",
                description: "Log semua aktivitas untuk audit trail",
                trigger: "all",
                execution: "required",
                priority: "HIGH",

                logEntries: [
                    {
                        event: "Analysis Started",
                        data: ["user_id", "proyek_id", "timestamp"]
                    },
                    {
                        event: "Step Completed",
                        data: ["step_id", "duration", "findings"]
                    },
                    {
                        event: "Finding Created",
                        data: ["finding_id", "severity", "category"]
                    },
                    {
                        event: "Analysis Completed",
                        data: ["proyek_id", "score", "duration"]
                    }
                ],

                action: "Save to audit_log table"
            },

            feedbackCapture: {
                id: "HOOK-EXT-04",
                name: "Capture Feedback Expert",
                description: "Capture feedback dari pengkaji ahli",
                trigger: "manual",
                execution: "optional",
                priority: "MEDIUM",

                feedbackTypes: [
                    {
                        type: "Agreement",
                        action: "Mark analysis as verified by expert"
                    },
                    {
                        type: "Correction",
                        action: "Update analysis with expert input"
                    },
                    {
                        type: "Addition",
                        action: "Add findings from expert"
                    },
                    {
                        type: "Disagreement",
                        action: "Flag for review and reconciliation"
                    }
                ],

                action: "Save feedback and update analysis if needed"
            },

            modelLearning: {
                id: "HOOK-EXT-05",
                name: "Continuous Model Learning",
                description: "Gunakan feedback untuk mengimprove model",
                trigger: "afterFeedback",
                execution: "optional",
                priority: "LOW",

                learningProcess: [
                    {
                        task: "Compare AI vs Expert",
                        action: "Identify discrepancies antara AI dan expert judgement"
                    },
                    {
                        task: "Identify Patterns",
                        action: "Identify patterns dalam corrections"
                    },
                    {
                        task: "Update Weights",
                        action: "Adjust model weights berdasarkan feedback"
                    },
                    {
                        task: "Log Performance",
                        action: "Track model performance over time"
                    }
                ],

                action: "Update model parameters untuk future analyses"
            }
        }
    }
};

// Helper function untuk mengambil hook berdasarkan kategori
export function getHooksByCategory(category) {
    if (!DEEP_REASONING_HOOKS[category]) {
        throw new Error(`Hook category ${category} not found`);
    }
    return DEEP_REASONING_HOOKS[category];
}

// Helper function untuk mengambil hook berdasarkan ID
export function getHookById(id) {
    for (const category in DEEP_REASONING_HOOKS) {
        if (DEEP_REASONING_HOOKS[category].hooks) {
            for (const hookId in DEEP_REASONING_HOOKS[category].hooks) {
                const hook = DEEP_REASONING_HOOKS[category].hooks[hookId];
                if (hook.id === id) {
                    return hook;
                }
            }
        }
    }
    throw new Error(`Hook with ID ${id} not found`);
}

// Helper function untuk mengambil hooks berdasarkan trigger
export function getHooksByTrigger(trigger) {
    const hooks = [];
    for (const category in DEEP_REASONING_HOOKS) {
        if (DEEP_REASONING_HOOKS[category].hooks) {
            for (const hookId in DEEP_REASONING_HOOKS[category].hooks) {
                const hook = DEEP_REASONING_HOOKS[category].hooks[hookId];
                if (hook.trigger === trigger) {
                    hooks.push(hook);
                }
            }
        }
    }
    return hooks;
}

// Helper function untuk memuat semua hooks
export function createHooks() {
    return DEEP_REASONING_HOOKS;
}

// Helper function untuk mengambil hook berdasarkan event/trigger
export function getHookByEvent(event) {
    const hooks = [];
    for (const category in DEEP_REASONING_HOOKS) {
        if (DEEP_REASONING_HOOKS[category].hooks) {
            for (const hookId in DEEP_REASONING_HOOKS[category].hooks) {
                const hook = DEEP_REASONING_HOOKS[category].hooks[hookId];
                if (hook.trigger === event) {
                    hooks.push(hook);
                }
            }
        }
    }
    return hooks;
}

// Helper function untuk mendapatkan semua required hooks
export function getRequiredHooks() {
    const hooks = [];
    for (const category in DEEP_REASONING_HOOKS) {
        if (DEEP_REASONING_HOOKS[category].hooks) {
            for (const hookId in DEEP_REASONING_HOOKS[category].hooks) {
                const hook = DEEP_REASONING_HOOKS[category].hooks[hookId];
                if (hook.execution === "required") {
                    hooks.push(hook);
                }
            }
        }
    }
    return hooks;
}
