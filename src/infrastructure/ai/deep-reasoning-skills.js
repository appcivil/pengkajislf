/**
 * DEEP REASONING SKILLS SYSTEM
 * 
 * File ini berisi semua keahlian (Skills) khusus yang digunakan oleh AI
 * untuk menangani tugas-tugas spesifik dalam analisis SLF (Sertifikat Laik Fungsi)
 * Bangunan Gedung.
 * 
 * Skills mencakup:
 * 1. Technical analysis skills (struktur, MEP, arsitektur)
 * 2. Document processing skills
 * 3. Data interpretation skills
 * 4. Risk assessment skills
 * 5. Communication skills
 */

export const DEEP_REASONING_SKILLS = {
    metadata: {
        version: "1.0.0",
        lastUpdated: "2026-04-01",
        system: "Smart AI Pengkaji SLF",
        description: "Comprehensive skills system for deep reasoning in SLF analysis"
    },

    // ==========================================
    // TECHNICAL ANALYSIS SKILLS
    // ==========================================
    technicalAnalysis: {
        name: "Technical Analysis Skills",
        description: "Keahlian analisis teknis untuk berbagai aspek bangunan",

        skills: {
            structuralForensics: {
                id: "SKILL-TECH-01",
                name: "Forensik Struktur",
                description: "Analisis forensik untuk mengidentifikasi penyebab masalah struktur",
                persona: "Ahli Rekayasa Struktur Forensik",

                capabilities: [
                    {
                        capability: "Analisis Retak Beton",
                        actions: [
                            "Identifikasi jenis retak: tensile, shear, shrinkage, settlement",
                            "Interpretasi pola retak untuk diagnosis",
                            "Estimasi waktu retak terbentuk",
                            "Evaluasi keparahan retak berdasarkan lebar dan kedalaman"
                        ],
                        techniques: [
                            "Mapping retak dengan skala 1:100",
                            "Klasifikasi severity: ringan (<0.3mm), sedang (0.3-1mm), berat (>1mm)",
                            "Correlation dengan lokasi dan jenis elemen",
                            "Comparison dengan retak kritis SNI 03-4330-1997"
                        ]
                    },
                    {
                        capability: "Analisis Korosi Tulangan",
                        actions: [
                            "Identifikasi tanda-tanda korosi visual",
                            "Estimasi kehilangan penampang tulangan",
                            "Evaluasi dampak terhadap kapasitas struktur",
                            "Rekomendasi perbaikan korosi"
                        ],
                        techniques: [
                            "Visual inspection untuk rust staining",
                            "Uji covermeter untuk ketebalan concrete cover",
                            "Half-cell potential test untuk aktivitas korosi",
                            "Calculation kehilangan kapasitas akibat korosi"
                        ]
                    },
                    {
                        capability: "Analisis Settlement",
                        actions: [
                            "Identifikasi differential settlement",
                            "Estimasi magnitude settlement",
                            "Evaluasi dampak terhadap struktur",
                            "Identifikasi penyebab settlement"
                        ],
                        techniques: [
                            "Level survey untuk elevasi",
                            "Analisis pola retak akibat settlement",
                            "Comparison dengan data geoteknik",
                            "Evaluation kebutuhan perbaikan"
                        ]
                    },
                    {
                        capability: "Verifikasi Perhitungan Struktur",
                        actions: [
                            "Cross-check perhitungan desain",
                            "Verifikasi asumsi dan input data",
                            "Validate metodologi perhitungan",
                            "Check konsistensi dengan NSPK"
                        ],
                        techniques: [
                            "Independent structural calculation",
                            "Comparison dengan software lain",
                            "Manual spot-check critical elements",
                            "Verification load combinations SNI 1727:2020"
                        ]
                    }
                ]
            },

            mepSystemAnalysis: {
                id: "SKILL-TECH-02",
                name: "Analisis Sistem MEP",
                description: "Analisis sistem Mekanikal, Elektrikal, dan Plambing",
                persona: "Ahli Teknik MEP Senior",

                capabilities: [
                    {
                        capability: "Analisis Sistem Listrik",
                        actions: [
                            "Verifikasi kapasitas trafo dan distribusi",
                            "Check voltage drop pada feeder",
                            "Evaluate grounding dan earthing",
                            "Analyze proteksi dan safety"
                        ],
                        techniques: [
                            "Load calculation sesuai PUIL",
                            "Voltage drop calculation ΔV% = (√3 × I × (Rcosφ + Xsinφ) × L) / V",
                            "Ground resistance measurement verification",
                            "Coordination study untuk proteksi"
                        ]
                    },
                    {
                        capability: "Analisis Sistem HVAC",
                        actions: [
                            "Verifikasi kapasitas cooling",
                            "Calculate air changes (ACH)",
                            "Evaluate efisiensi energi",
                            "Check kualitas udara"
                        ],
                        techniques: [
                            "Cooling load calculation ASHRAE",
                            "ACH = (Q_supply m3/h) / V_room m3",
                            "EER/COP analysis untuk efisiensi",
                            "CO2 dan temperature monitoring"
                        ]
                    },
                    {
                        capability: "Analisis Sistem Plambing",
                        actions: [
                            "Verify kapasitas reservoir dan pompa",
                            "Check sistem drainase dan vent",
                            "Evaluate kualitas air",
                            "Analyze sistem STP jika ada"
                        ],
                        techniques: [
                            "Water demand calculation",
                            "Pump head calculation",
                            "Flow rate verification",
                            "Water quality testing"
                        ]
                    },
                    {
                        capability: "Analisis Proteksi Kebakaran",
                        actions: [
                            "Verify sistem sprinkler dan hydrant",
                            "Check APAR dan fire extinguisher",
                            "Evaluate sistem deteksi dan alarm",
                            "Analyze jalur evakuasi"
                        ],
                        techniques: [
                            "Hydraulic calculation untuk sprinkler",
                            "Travel distance calculation",
                            "Fire load density analysis",
                            "Compartmentation check"
                        ]
                    }
                ]
            },

            architecturalEvaluation: {
                id: "SKILL-TECH-03",
                name: "Evaluasi Arsitektur",
                description: "Evaluasi aspek arsitektur bangunan",
                persona: "Ahli Fisika Bangunan",

                capabilities: [
                    {
                        capability: "Analisis Fasad dan Selubung",
                        actions: [
                            "Evaluasi kondisi material fasad",
                            "Analyze performa termal",
                            "Check water tightness",
                            "Verify estetika dan konsistensi"
                        ],
                        techniques: [
                            "Visual inspection fasad",
                            "WWR (Window-to-Wall Ratio) calculation",
                            "SRI (Solar Reflectance Index) evaluation",
                            "Water penetration test"
                        ]
                    },
                    {
                        capability: "Analisis Tata Ruang Dalam",
                        actions: [
                            "Verify dimensi ruang",
                            "Evaluate sirkulasi internal",
                            "Check pencahayaan dan ventilasi",
                            "Assess akustik dan kenyamanan"
                        ],
                        techniques: [
                            "Space planning analysis",
                            "Flow diagram circulation",
                            "Daylight factor calculation",
                            "Noise level measurement"
                        ]
                    },
                    {
                        capability: "Evaluasi Aksesibilitas",
                        actions: [
                            "Check compliance dengan standar difabel",
                            "Verify ramp dan toilet difabel",
                            "Evaluate signage dan wayfinding",
                            "Assess kemudahan navigasi"
                        ],
                        techniques: [
                            "Universal design checklist",
                            "Slope measurement (max 1:12)",
                            "Clear width verification",
                            "Signage visibility check"
                        ]
                    }
                ]
            },

            environmentalAssessment: {
                id: "SKILL-TECH-04",
                name: "Penilaian Lingkungan",
                description: "Penilaian dampak lingkungan bangunan",
                persona: "Ahli Lingkungan Bangunan",

                capabilities: [
                    {
                        capability: "Analisis RTH dan Drainase",
                        actions: [
                            "Calculate KDH (Koefisien Dasar Hijau)",
                            "Verify kapasitas drainase",
                            "Evaluate sistem resapan",
                            "Check manajemen air hujan"
                        ],
                        techniques: [
                            "RTH area calculation",
                            "Runoff coefficient analysis",
                            "Infiltration test",
                            "Drainage capacity calculation"
                        ]
                    },
                    {
                        capability: "Analisis AMDAL/UKL-UPL",
                        actions: [
                            "Review dokumen lingkungan",
                            "Verify pelaksanaan RKL-RPL",
                            "Evaluate monitoring results",
                            "Check compliance dengan komitmen"
                        ],
                        techniques: [
                            "Document review checklist",
                            "Site inspection verification",
                            "Monitoring data analysis",
                            "Compliance matrix"
                        ]
                    },
                    {
                        capability: "Analisis Energi dan Efisiensi",
                        actions: [
                            "Evaluate OTTV (Overall Thermal Transfer Value)",
                            "Check konservasi energi sistem",
                            "Analyze konsumsi energi",
                            "Identifikasi improvement opportunities"
                        ],
                        techniques: [
                            "OTTV calculation",
                            "Energy audit procedure",
                            "BCI (Building Carbon Index) calculation",
                            "Energy efficiency recommendation"
                        ]
                    }
                ]
            }
        }
    },

    // ==========================================
    // DOCUMENT PROCESSING SKILLS
    // ==========================================
    documentProcessing: {
        name: "Document Processing Skills",
        description: "Keahlian dalam memproses dan mengekstrak informasi dari dokumen",

        skills: {
            documentExtraction: {
                id: "SKILL-DOC-01",
                name: "Ekstraksi Dokumen Teknis",
                description: "Ekstrak informasi dari berbagai jenis dokumen teknis",
                persona: "Spesialis Dokumentasi Teknik",

                capabilities: [
                    {
                        capability: "Ekstraksi Shop Drawing",
                        actions: [
                            "Identifikasi dan ekstrak dimensi elemen struktur",
                            "Ekstrak detail tulangan dan material",
                            "Identifikasi notas dan spesifikasi",
                            "Verify konsistensi antar drawing"
                        ],
                        techniques: [
                            "Coordinate reading untuk dimensi",
                            "Symbol recognition untuk elemen",
                            "Schedule extraction untuk material",
                            "Cross-reference drawing numbering"
                        ]
                    },
                    {
                        capability: "Ekstraksi Laporan Struktur",
                        actions: [
                            "Ekstrak hasil perhitungan struktur",
                            "Identifikasi asumsi dan parameter",
                            "Extract load combinations",
                            "Verify methodology used"
                        ],
                        techniques: [
                            "Formula recognition",
                            "Variable identification",
                            "Result extraction",
                            "Methodology verification"
                        ]
                    },
                    {
                        capability: "Ekstraksi Izin dan Legal",
                        actions: [
                            "Ekstrak data dari PBG/IMB",
                            "Identifikasi fungsi dan persyaratan",
                            "Extract kondisi dan rekomendasi",
                            "Verify validity dan masa berlaku"
                        ],
                        techniques: [
                            "Legal document parsing",
                            "Condition extraction",
                            "Validity check",
                            "Compliance identification"
                        ]
                    },
                    {
                        capability: "Ekstraksi Laporan Lapangan",
                        actions: [
                            "Ekstrak temuan dari laporan lapangan",
                            "Identifikasi kondisi aktual",
                            "Extract foto dan dokumentasi",
                            "Verify timeline dan coverage"
                        ],
                        techniques: [
                            "Finding extraction",
                            "Condition classification",
                            "Photo documentation review",
                            "Coverage verification"
                        ]
                    }
                ]
            },

            documentVerification: {
                id: "SKILL-DOC-02",
                name: "Verifikasi Dokumen",
                description: "Verifikasi keabsahan dan konsistensi dokumen",
                persona: "Spesialis Verifikasi Dokumen",

                capabilities: [
                    {
                        capability: "Cross-Reference Dokumen",
                        actions: [
                            "Cross-reference shop drawing dengan laporan",
                            "Verify konsistensi antar dokumen",
                            "Identifikasi discrepancies",
                            "Flag conflicts untuk resolution"
                        ],
                        techniques: [
                            "Comparison matrix",
                            "Discrepancy identification",
                            "Conflict flagging",
                            "Reconciliation tracking"
                        ]
                    },
                    {
                        capability: "Version Control Check",
                        actions: [
                            "Identifikasi versi dokumen",
                            "Check revision history",
                            "Verify latest version usage",
                            "Track changes antar versi"
                        ],
                        techniques: [
                            "Revision tracking",
                            "Version comparison",
                            "Change log analysis",
                            "Latest version verification"
                        ]
                    },
                    {
                        capability: "Authenticity Verification",
                        actions: [
                            "Verify signature dan stamp",
                            "Check keabsahan dokumen",
                            "Verify issuer authority",
                            "Check tampering indicators"
                        ],
                        techniques: [
                            "Signature verification",
                            "Stamp validation",
                            "Authority check",
                            "Tamper detection"
                        ]
                    }
                ]
            },

            documentSynthesis: {
                id: "SKILL-DOC-03",
                name: "Sintesis Dokumen",
                description: "Mensintesis informasi dari berbagai dokumen",
                persona: "Spesialis Sintesis Dokumen",

                capabilities: [
                    {
                        capability: "Integrate Multiple Sources",
                        actions: [
                            "Integrate informasi dari berbagai dokumen",
                            "Identifikasi data yang saling melengkapi",
                            "Resolve conflicts antar sumber",
                            "Build comprehensive picture"
                        ],
                        techniques: [
                            "Information mapping",
                            "Cross-validation",
                            "Conflict resolution",
                            "Holistic view building"
                        ]
                    },
                    {
                        capability: "Generate Evidence Trail",
                        actions: [
                            "Create traceable evidence chain",
                            "Link findings ke dokumen sumber",
                            "Document evidence locations",
                            "Build audit trail"
                        ],
                        techniques: [
                            "Evidence chaining",
                            "Source linking",
                            "Location tracking",
                            "Audit trail building"
                        ]
                    }
                ]
            }
        }
    },

    // ==========================================
    // DATA INTERPRETATION SKILLS
    // ==========================================
    dataInterpretation: {
        name: "Data Interpretation Skills",
        description: "Keahlian dalam menginterpretasikan data teknis",

        skills: {
            numericalAnalysis: {
                id: "SKILL-DATA-01",
                name: "Analisis Numerik",
                description: "Analisis data numerik dan perhitungan",
                persona: "Ahli Analisis Data Teknik",

                capabilities: [
                    {
                        capability: "Structural Calculation",
                        actions: [
                            "Hitung kapasitas elemen struktur",
                            "Verify perhitungan desain",
                            "Perform independent calculation",
                            "Compare hasil dengan standar"
                        ],
                        techniques: [
                            "Beton: P_n = 0.80 × [0.85 × f'c × (A_g - A_st) + f_y × A_st]",
                            "Baja: P_n = 0.85 × A_g × F_y",
                            "Shear: V_n = V_c + V_s",
                            "Moment: M_n = A_s × f_y × (d - a/2)"
                        ]
                    },
                    {
                        capability: "MEP Calculation",
                        actions: [
                            "Hitung beban listrik",
                            "Calculate voltage drop",
                            "Verify kapasitas HVAC",
                            "Check air flow rates"
                        ],
                        techniques: [
                            "Voltage drop: ΔV% = (√3 × I × (Rcosφ + Xsinφ) × L) / V",
                            "ACH = (Q_supply m3/h) / V_room m3",
                            "Cooling load: Q = m × Cp × ΔT",
                            "Pipe sizing: Hazen-Williams formula"
                        ]
                    },
                    {
                        capability: "Statistical Analysis",
                        actions: [
                            "Analyze trends dalam data",
                            "Identifikasi outliers",
                            "Calculate confidence intervals",
                            "Perform regression analysis"
                        ],
                        techniques: [
                            "Descriptive statistics",
                            "Trend analysis",
                            "Outlier detection",
                            "Confidence interval calculation"
                        ]
                    }
                ]
            },

            visualAnalysis: {
                id: "SKILL-DATA-02",
                name: "Analisis Visual",
                description: "Analisis data visual: foto, video, drawing",
                persona: "Spesialis Analisis Visual",

                capabilities: [
                    {
                        capability: "Photo Analysis",
                        actions: [
                            "Identifikasi kondisi struktur dari foto",
                            "Measure dimensions menggunakan scale reference",
                            "Document damages dan defects",
                            "Compare dengan dokumentasi sebelumnya"
                        ],
                        techniques: [
                            "Scale-based measurement",
                            "Damage identification",
                            "Condition assessment",
                            "Comparative analysis"
                        ]
                    },
                    {
                        capability: "Drawing Analysis",
                        actions: [
                            "Extract dimensions dari drawing",
                            "Identifikasi detail konstruksi",
                            "Verify accuracy dan completeness",
                            "Check compliance dengan standar"
                        ],
                        techniques: [
                            "Dimension extraction",
                            "Detail interpretation",
                            "Compliance check",
                            "Completeness verification"
                        ]
                    },
                    {
                        capability: "Video Analysis",
                        actions: [
                            "Identifikasi kondisi dinamis",
                            "Document movement atau vibration",
                            "Capture operational conditions",
                            "Identifikasi hidden defects"
                        ],
                        techniques: [
                            "Frame-by-frame analysis",
                            "Movement detection",
                            "Operational documentation",
                            "Hidden defect identification"
                        ]
                    }
                ]
            },

            patternRecognition: {
                id: "SKILL-DATA-03",
                name: "Pengenalan Pola",
                description: "Identifikasi pola dalam data dan kondisi",
                persona: "Spesialis Pattern Recognition",

                capabilities: [
                    {
                        capability: "Defect Pattern Analysis",
                        actions: [
                            "Identifikasi pola kerusakan",
                            "Correlate dengan penyebab",
                            "Predict deterioration progression",
                            "Identifikasi systemic issues"
                        ],
                        techniques: [
                            "Pattern mapping",
                            "Correlation analysis",
                            "Progression modeling",
                            "System identification"
                        ]
                    },
                    {
                        capability: "Performance Trend Analysis",
                        actions: [
                            "Identifikasi trends performa",
                            "Predict degradation",
                            "Identifikasi maintenance needs",
                            "Compare dengan benchmarks"
                        ],
                        techniques: [
                            "Trend analysis",
                            "Degradation modeling",
                            "Need prediction",
                            "Benchmark comparison"
                        ]
                    }
                ]
            }
        }
    },

    // ==========================================
    // RISK ASSESSMENT SKILLS
    // ==========================================
    riskAssessment: {
        name: "Risk Assessment Skills",
        description: "Keahlian dalam penilaian risiko",

        skills: {
            hazardIdentification: {
                id: "SKILL-RISK-01",
                name: "Identifikasi Hazard",
                description: "Identifikasi potensi hazard dan bahaya",
                persona: "Risk Assessment Specialist",

                capabilities: [
                    {
                        capability: "Structural Hazard Identification",
                        actions: [
                            "Identifikasi potensi kegagalan struktur",
                            "Assess risk of collapse",
                            "Identifikasi hazardous elements",
                            "Evaluate earthquake vulnerability"
                        ],
                        techniques: [
                            "Failure mode analysis",
                            "Collapse risk assessment",
                            "Element hazard identification",
                            "Seismic vulnerability assessment"
                        ]
                    },
                    {
                        capability: "Fire Hazard Identification",
                        actions: [
                            "Identifikasi fire hazards",
                            "Assess fire spread potential",
                            "Identifikasi evacuation barriers",
                            "Evaluate smoke risks"
                        ],
                        techniques: [
                            "Fire hazard analysis",
                            "Spread assessment",
                            "Evacuation barrier identification",
                            "Smoke risk evaluation"
                        ]
                    },
                    {
                        capability: "Electrical Hazard Identification",
                        actions: [
                            "Identifikasi electrical hazards",
                            "Assess shock risks",
                            "Identifikasi fire risks from electrical",
                            "Evaluate system failures"
                        ],
                        techniques: [
                            "Electrical hazard analysis",
                            "Shock risk assessment",
                            "Electrical fire evaluation",
                            "System failure analysis"
                        ]
                    }
                ]
            },

            riskQuantification: {
                id: "SKILL-RISK-02",
                name: "Kuantifikasi Risiko",
                description: "Kuantifikasi tingkat risiko",
                persona: "Risk Quantification Specialist",

                capabilities: [
                    {
                        capability: "Probability Assessment",
                        actions: [
                            "Estimasi probability of failure",
                            "Assess likelihood of occurrence",
                            "Evaluate frequency of events",
                            "Predict failure probability"
                        ],
                        techniques: [
                            "Probability estimation",
                            "Likelihood assessment",
                            "Frequency analysis",
                            "Failure prediction"
                        ]
                    },
                    {
                        capability: "Impact Assessment",
                        actions: [
                            "Assess safety impact",
                            "Evaluate health impact",
                            "Assess operational impact",
                            "Estimate financial impact"
                        ],
                        techniques: [
                            "Safety impact assessment",
                            "Health impact evaluation",
                            "Operational impact analysis",
                            "Financial impact estimation"
                        ]
                    },
                    {
                        capability: "Risk Score Calculation",
                        actions: [
                            "Calculate risk scores",
                            "Build risk matrix",
                            "Prioritize risks",
                            "Determine acceptability"
                        ],
                        techniques: [
                            "Risk score: Risk = Probability × Impact",
                            "Risk matrix development",
                            "Prioritization methodology",
                            "Acceptability criteria"
                        ]
                    }
                ]
            },

            riskMitigation: {
                id: "SKILL-RISK-03",
                name: "Mitigasi Risiko",
                description: "Buat rekomendasi mitigasi risiko",
                persona: "Risk Mitigation Specialist",

                capabilities: [
                    {
                        capability: "Mitigation Strategy Development",
                        actions: [
                            "Buat strategi mitigasi",
                            "Identifikasi control measures",
                            "Evaluate effectiveness",
                            "Prioritize actions"
                        ],
                        techniques: [
                            "Strategy development",
                            "Control measure identification",
                            "Effectiveness evaluation",
                            "Action prioritization"
                        ]
                    },
                    {
                        capability: "Cost-Benefit Analysis",
                        actions: [
                            "Assess mitigation costs",
                            "Evaluate benefits",
                            "Calculate ROI",
                            "Recommend optimal approach"
                        ],
                        techniques: [
                            "Cost assessment",
                            "Benefit evaluation",
                            "ROI calculation",
                            "Optimization analysis"
                        ]
                    }
                ]
            }
        }
    },

    // ==========================================
    // COMMUNICATION SKILLS
    // ==========================================
    communication: {
        name: "Communication Skills",
        description: "Keahlian komunikasi untuk laporan dan rekomendasi",

        skills: {
            technicalWriting: {
                id: "SKILL-COMM-01",
                name: "Penulisan Teknis",
                description: "Menulis laporan teknis yang jelas dan akurat",
                persona: "Technical Writer Specialist",

                capabilities: [
                    {
                        capability: "Report Generation",
                        actions: [
                            "Generate structured reports",
                            "Format output sesuai standar A-G",
                            "Include calculations dan justifications",
                            "Document evidence dan references"
                        ],
                        techniques: [
                            "Structure: A (NSPK), B (Data), C (Calculations), D (Analysis)",
                            "E (Risks), F (Evaluation), G (Findings & Recommendations)",
                            "Proper citations dan references",
                            "Clear and concise language"
                        ]
                    },
                    {
                        capability: "Recommendation Writing",
                        actions: [
                            "Buat actionable recommendations",
                            "Prioritize by urgency",
                            "Include specific actions",
                            "Provide timeline estimates"
                        ],
                        techniques: [
                            "SMART recommendations",
                            "Prioritization matrix",
                            "Action-oriented language",
                            "Realistic timelines"
                        ]
                    }
                ]
            },

            executiveSummary: {
                id: "SKILL-COMM-02",
                name: "Ringkasan Eksekutif",
                description: "Buat ringkasan eksekutif untuk stakeholder",
                persona: "Executive Communication Specialist",

                capabilities: [
                    {
                        capability: "Summary Generation",
                        actions: [
                            "Summarize key findings",
                            "Highlight critical items",
                            "Provide overall assessment",
                            "Include next steps"
                        ],
                        techniques: [
                            "Top 3-5 key findings",
                            "Critical item highlighting",
                            "Overall score interpretation",
                            "Clear next steps"
                        ]
                    },
                    {
                        capability: "Stakeholder Communication",
                        actions: [
                            "Adapt message untuk audience",
                            "Use non-technical language",
                            "Focus on impact dan actions",
                            "Provide context"
                        ],
                        techniques: [
                            "Audience adaptation",
                            "Plain language principles",
                            "Impact-focused messaging",
                            "Contextual explanation"
                        ]
                    }
                ]
            },

            visualCommunication: {
                id: "SKILL-COMM-03",
                name: "Komunikasi Visual",
                description: "Presentasi visual informasi teknis",
                persona: "Visual Communication Specialist",

                capabilities: [
                    {
                        capability: "Table Generation",
                        actions: [
                            "Create compliance tables",
                            "Generate comparison matrices",
                            "Format finding tables",
                            "Build summary tables"
                        ],
                        techniques: [
                            "Compliance table structure",
                            "Comparison matrix format",
                            "Finding table layout",
                            "Summary table design"
                        ]
                    },
                    {
                        capability: "Visualization Description",
                        actions: [
                            "Describe required visualizations",
                            "Specify chart types",
                            "Define data presentation",
                            "Guide visualization creation"
                        ],
                        techniques: [
                            "Appropriate chart selection",
                            "Data visualization principles",
                            "Clear labeling",
                            "Color coding for clarity"
                        ]
                    }
                ]
            }
        }
    }
};

// Helper function untuk memuat semua skills
export function createSkills() {
    return DEEP_REASONING_SKILLS;
}

// Helper function untuk mengambil skill berdasarkan kategori
export function getSkillByCategory(category) {
    if (!DEEP_REASONING_SKILLS[category]) {
        throw new Error(`Skill category ${category} not found`);
    }
    return DEEP_REASONING_SKILLS[category];
}

// Helper function untuk mengambil skill berdasarkan ID
export function getSkillById(id) {
    for (const category in DEEP_REASONING_SKILLS) {
        if (DEEP_REASONING_SKILLS[category].skills) {
            for (const skillId in DEEP_REASONING_SKILLS[category].skills) {
                const skill = DEEP_REASONING_SKILLS[category].skills[skillId];
                if (skill.id === id) {
                    return skill;
                }
            }
        }
    }
    throw new Error(`Skill with ID ${id} not found`);
}

// Helper function untuk mengambil skills berdasarkan persona
export function getSkillsByPersona(persona) {
    const skills = [];
    for (const category in DEEP_REASONING_SKILLS) {
        if (DEEP_REASONING_SKILLS[category].skills) {
            for (const skillId in DEEP_REASONING_SKILLS[category].skills) {
                const skill = DEEP_REASONING_SKILLS[category].skills[skillId];
                if (skill.persona.includes(persona) || skill.persona === persona) {
                    skills.push(skill);
                }
            }
        }
    }
    return skills;
}

// Helper function untuk mendapatkan semua skill IDs
export function getAllSkillIds() {
    const ids = [];
    for (const category in DEEP_REASONING_SKILLS) {
        if (DEEP_REASONING_SKILLS[category].skills) {
            for (const skillId in DEEP_REASONING_SKILLS[category].skills) {
                const skill = DEEP_REASONING_SKILLS[category].skills[skillId];
                ids.push(skill.id);
            }
        }
    }
    return ids;
}

// Helper function untuk mencari skill berdasarkan keyword
export function searchSkills(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const category in DEEP_REASONING_SKILLS) {
        if (DEEP_REASONING_SKILLS[category].skills) {
            for (const skillId in DEEP_REASONING_SKILLS[category].skills) {
                const skill = DEEP_REASONING_SKILLS[category].skills[skillId];
                if (
                    skill.name.toLowerCase().includes(lowerKeyword) ||
                    skill.description.toLowerCase().includes(lowerKeyword) ||
                    skill.id.toLowerCase().includes(lowerKeyword)
                ) {
                    results.push(skill);
                }
            }
        }
    }
    return results;
}