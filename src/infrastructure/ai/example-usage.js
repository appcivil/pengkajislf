// ============================================================
//  DEEP REASONING ENGINE - CONTOH PENGGUNAAN
//  Panduan implementasi Deep Reasoning Engineering di aplikasi
// ============================================================

import {
    getSmartAIIntegration,
    initializeSmartAIIntegration
} from './deep-reasoning-integration.js';
import {
    analyzeChecklistImage,
    analyzeDocument,
    analyzeComparativeAudit
} from '../../lib/gemini.js';
import {
    runAspectAnalysis,
    runSingleItemAnalysis,
    runOCRAnalysis,
    getMultiAgentConsensus
} from '../../lib/ai-router.js';

// ============================================================
//  BAGIAN 1: INISIALISASI SISTEM
// ============================================================

/**
 * Contoh 1.1: Inisialisasi di awal aplikasi
 * Panggil ini di main.js atau saat aplikasi dimuat
 */
async function initializeSystem() {
    try {
        console.log('[Example] Menginisialisasi Smart AI Integration...');
        const integration = await initializeSmartAIIntegration();

        console.log('[Example] Inisialisasi berhasil!');
        console.log('[Example] Rules loaded:', Object.keys(integration.getRulesForCategory('undang_undang') || {}).length);
        console.log('[Example] Skills available:', integration.getAllSkills().length);
        console.log('[Example] Workflows available:', integration.getAllWorkflows().length);

        return integration;
    } catch (error) {
        console.error('[Example] Gagal inisialisasi:', error);
        throw error;
    }
}

// ============================================================
//  BAGIAN 2: ANALISIS CHECKLIST DENGAN DEEP REASONING
// ============================================================

/**
 * Contoh 2.1: Analisis checklist gambar dengan Deep Reasoning
 */
async function exampleAnalyzeChecklist() {
    const integration = getSmartAIIntegration();

    // Data gambar (biasanya dari file input)
    const filesData = [
        {
            base64: 'base64_encoded_image_string_here',
            mimeType: 'image/jpeg'
        }
    ];

    const componentName = 'Kolom Beton';
    const kategori = 'teknis';
    const aspek = 'struktur';

    try {
        // Analisis dengan Deep Reasoning
        const result = await integration.analyzeWithDeepReasoning(
            filesData,
            componentName,
            kategori,
            aspek
        );

        console.log('[Example] Hasil analisis checklist:', result);

        // Hasil akan mencakup:
        // - status, catatan, rekomendasi (dari AI Vision)
        // - reasoning_steps (langkah penalaran Deep Reasoning)
        // - legal_references (referensi regulasi)
        // - deep_reasoning_enabled: true

        return result;
    } catch (error) {
        console.error('[Example] Gagal analisis checklist:', error);
        throw error;
    }
}

// ============================================================
//  BAGIAN 3: ANALISIS ASPEK KOMPREHENSIF
// ============================================================

/**
 * Contoh 3.1: Analisis aspek Struktur dengan Deep Reasoning
 */
async function exampleAnalyzeAspekStruktur() {
    const integration = getSmartAIIntegration();

    // Data items checklist
    const items = [
        {
            kode: 'STR-001',
            nama: 'Kolom Struktur',
            status: 'tidak_sesuai',
            catatan: 'Retak diagonal di beberapa kolom',
            metadata: {
                nspk_ref: 'SNI 2847:2019'
            }
        },
        {
            kode: 'STR-002',
            nama: 'Balok Lantai',
            status: 'sesuai',
            catatan: 'Kondisi baik',
            metadata: {}
        }
    ];

    const aspek = 'struktur';

    // Progress callback
    const onProgress = (current, total, message) => {
        console.log(`[Example] Progress: ${current}/${total} - ${message}`);
    };

    try {
        // Jalankan analisis aspek dengan Deep Reasoning
        const result = await integration.runAspectAnalysisWithDeepReasoning(
            aspek,
            items,
            onProgress
        );

        console.log('[Example] Hasil analisis aspek:', result);

        // Hasil akan mencakup:
        // - skor_aspek (0-100)
        // - narasi_teknis (laporan teknis lengkap)
        // - rekomendasi (daftar rekomendasi perbaikan)
        // - meta (provider, kategori, risk_highlights)

        return result;
    } catch (error) {
        console.error('[Example] Gagal analisis aspek:', error);
        throw error;
    }
}

// ============================================================
//  BAGIAN 4: MULTI-AGENT ANALYSIS
// ============================================================

/**
 * Contoh 4.1: Jalankan semua agents untuk proyek
 */
async function exampleMultiAgentAnalysis(proyekId) {
    const integration = getSmartAIIntegration();

    try {
        console.log('[Example] Menjalankan Multi-Agent Analysis...');

        // Jalankan semua agents (Arsitek, Struktur, MEP, Legal)
        const result = await integration.runMultiAgentWithDeepReasoning(proyekId);

        console.log('[Example] Hasil Multi-Agent Analysis:', result);

        // Hasil akan mencakup:
        // - agentResults: { arsitek: {...}, struktur: {...}, mep: {...}, legal: {...} }
        // - consensusResult: { bab5_analisis, bab6_kesimpulan, status_final, risk_score }
        // - enhancedAnalysis: analisis tambahan dari Deep Reasoning

        return result;
    } catch (error) {
        console.error('[Example] Gagal Multi-Agent Analysis:', error);
        throw error;
    }
}

/**
 * Contoh 4.2: Jalankan spesifik agent saja
 */
async function exampleSpecificAgentAnalysis(proyekId, agentId) {
    const integration = getSmartAIIntegration();

    try {
        // Jalankan hanya agent tertentu (misal: 'struktur')
        const result = await integration.runMultiAgentWithDeepReasoning(
            proyekId,
            [agentId]
        );

        console.log(`[Example] Hasil Agent ${agentId}:`, result);
        return result;
    } catch (error) {
        console.error('[Example] Gagal analisis agent:', error);
        throw error;
    }
}

// ============================================================
//  BAGIAN 5: QUERY REGULASI
// ============================================================

/**
 * Contoh 5.1: Query aturan regulasi
 */
async function exampleQueryRegulation(query) {
    const integration = getSmartAIIntegration();

    // Cari regulasi berdasarkan keyword
    const result = integration.queryRegulation(query);

    if (result) {
        console.log(`[Example] Ditemukan regulasi di kategori ${result.category}:`);
        console.log('[Example]', result.rule);
    } else {
        console.log('[Example] Regulasi tidak ditemukan');
    }

    return result;
}

/**
 * Contoh 5.2: Dapatkan semua aturan untuk kategori tertentu
 */
async function exampleGetRulesForCategory(category) {
    const integration = getSmartAIIntegration();

    // Kategori yang tersedia:
    // - undang_undang
    // - peraturan_pemerintah
    // - peraturan_menteri
    // - sni_arsitektur
    // - sni_struktur
    // - sni_mep
    // - aturan_lainnya

    const rules = integration.getRulesForCategory(category);

    console.log(`[Example] Rules untuk ${category}:`, rules?.length || 0);
    return rules;
}

// ============================================================
//  BAGIAN 6: SKILLS & WORKFLOWS
// ============================================================

/**
 * Contoh 6.1: Dapatkan info skill
 */
async function exampleGetSkillInfo() {
    const integration = getSmartAIIntegration();

    // Dapatkan semua skill yang tersedia
    const allSkills = integration.getAllSkills();
    console.log('[Example] Available skills:', allSkills.map(s => s.name));

    // Dapatkan info skill spesifik
    const forensicAnalysis = integration.getSkillInfo('forensic_analysis');
    console.log('[Example] Forensic Analysis skill:', forensicAnalysis);

    return { allSkills, forensicAnalysis };
}

/**
 * Contoh 6.2: Dapatkan info workflow
 */
async function exampleGetWorkflowInfo() {
    const integration = getSmartAIIntegration();

    // Dapatkan semua workflow yang tersedia
    const allWorkflows = integration.getAllWorkflows();
    console.log('[Example] Available workflows:', Object.keys(allWorkflows));

    return allWorkflows;
}

// ============================================================
//  BAGIAN 7: ANALISIS DOKUMEN & OCR
// ============================================================

/**
 * Contoh 7.1: Analisis dokumen dengan Deep Reasoning
 */
async function exampleAnalyzeDocument(fileData) {
    const integration = getSmartAIIntegration();

    try {
        // Analisis dokumen
        const result = await integration.analyzeDocumentWithDeepReasoning(fileData);

        console.log('[Example] Hasil analisis dokumen:', result);

        // Hasil akan mencakup:
        // - category, subcategory
        // - extracted_text
        // - metadata (doc_no, date, owner)
        // - regulation_validated: true
        // - deep_reasoning_enabled: true

        return result;
    } catch (error) {
        console.error('[Example] Gagal analisis dokumen:', error);
        throw error;
    }
}

/**
 * Contoh 7.2: OCR Analysis untuk IMB/PBG
 */
async function exampleOCRAnalysis(base64Data, mimeType) {
    const integration = getSmartAIIntegration();

    try {
        // Jalankan OCR dengan Deep Reasoning
        const result = await integration.runOCRWithDeepReasoning(base64Data, mimeType);

        console.log('[Example] Hasil OCR:', result);

        // Hasil akan mencakup:
        // - nama_bangunan, pemilik, alamat
        // - luas_bangunan, luas_lahan, jumlah_lantai
        // - nomor_pbg, fungsi_bangunan
        // - gsb, kdb, klb, kdh
        // - rule_validation: validasi terhadap regulasi

        return result;
    } catch (error) {
        console.error('[Example] Gagal OCR:', error);
        throw error;
    }
}

// ============================================================
//  BAGIAN 8: ANALISIS KOMPARATIF
// ============================================================

/**
 * Contoh 8.1: Analisis komparatif dokumen
 */
async function exampleComparativeAudit() {
    const integration = getSmartAIIntegration();

    // Data dokumen untuk komparasi
    const filesData = [
        {
            base64: 'base64_krk',
            mimeType: 'image/jpeg'
        },
        {
            base64: 'base64_siteplan',
            mimeType: 'image/jpeg'
        }
    ];

    const itemName = 'Koefisien Dasar Bangunan (KDB)';
    const itemKode = 'ARS-003';
    const context = 'Verifikasi kesesuaian KDB antara KRK dan Siteplan';

    try {
        // Analisis komparatif dengan Deep Reasoning
        const result = await integration.analyzeComparativeWithDeepReasoning(
            filesData,
            itemName,
            itemKode,
            context
        );

        console.log('[Example] Hasil komparatif:', result);

        // Hasil akan mencakup:
        // - status, catatan
        // - comparative_analysis: { legal_data, technical_data, verification, conclusion }
        // - deep_reasoning_enabled: true

        return result;
    } catch (error) {
        console.error('[Example] Gagal analisis komparatif:', error);
        throw error;
    }
}

// ============================================================
//  BAGIAN 9: CONSENSUS ANALYSIS
// ============================================================

/**
 * Contoh 9.1: Multi-agent consensus dengan Deep Reasoning
 */
async function exampleConsensusAnalysis(checklist, proyek, analisisSummary) {
    const integration = getSmartAIIntegration();

    try {
        // Jalankan consensus analysis
        const result = await integration.getConsensusWithDeepReasoning(
            checklist,
            proyek,
            analisisSummary
        );

        console.log('[Example] Hasil consensus:', result);

        // Hasil akan mencakup:
        // - bab5_analisis: narasi Bab V lengkap
        // - bab6_kesimpulan: narasi Bab VI lengkap
        // - status_final: LAYAK_FUNGSI | LAYAK_FUNGSI_DENGAN_CATATAN | TIDAK_LAYAK_FUNGSI
        // - risk_score: 0-100
        // - enhanced_consensus: analisis tambahan dari Deep Reasoning

        return result;
    } catch (error) {
        console.error('[Example] Gagal consensus analysis:', error);
        throw error;
    }
}

// ============================================================
//  BAGIAN 10: IMPLEMENTASI DI COMPONENT REACT/VUE
// ============================================================

/**
 * Contoh 10.1: Implementasi di React Component
 * 
 * @example
 * // ChecklistAnalysis.jsx
 * import { useState, useEffect } from 'react';
 * import { getSmartAIIntegration } from '../infrastructure/ai/deep-reasoning-integration.js';
 * 
 * function ChecklistAnalysisComponent({ filesData, componentName, kategori, aspek }) {
 *   const [loading, setLoading] = useState(false);
 *   const [result, setResult] = useState(null);
 *   const [error, setError] = useState(null);
 * 
 *   const handleAnalyze = async () => {
 *     setLoading(true);
 *     setError(null);
 *     
 *     try {
 *       const integration = getSmartAIIntegration();
 *       const analysisResult = await integration.analyzeWithDeepReasoning(
 *         filesData,
 *         componentName,
 *         kategori,
 *         aspek
 *       );
 *       
 *       setResult(analysisResult);
 *     } catch (err) {
 *       setError(err.message);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleAnalyze} disabled={loading}>
 *         {loading ? 'Menganalisis...' : 'Analisis dengan Deep Reasoning'}
 *       </button>
 *       
 *       {error && <div className="error">{error}</div>}
 *       
 *       {result && (
 *         <div className="result">
 *           <h3>Hasil Analisis</h3>
 *           <p>Status: {result.status}</p>
 *           <p>Catatan: {result.catatan}</p>
 *           
 *           {result.deep_reasoning_enabled && (
 *             <div className="deep-reasoning">
 *               <h4>Deep Reasoning Analysis</h4>
 *               <ul>
 *                 {result.reasoning_steps?.map((step, i) => (
 *                   <li key={i}>{step}</li>
 *                 ))}
 *               </ul>
 *               
 *               <h4>Referensi Regulasi</h4>
 *               <ul>
 *                 {result.legal_references?.map((ref, i) => (
 *                   <li key={i}>{ref}</li>
 *                 ))}
 *               </ul>
 *             </div>
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 */

// ============================================================
//  BAGIAN 11: ERROR HANDLING & FALLBACK
// ============================================================

/**
 * Contoh 11.1: Error handling dengan fallback
 */
async function exampleWithErrorHandling() {
    const integration = getSmartAIIntegration();

    try {
        // Coba gunakan Deep Reasoning
        const result = await integration.analyzeWithDeepReasoning(
            filesData,
            componentName,
            kategori,
            aspek
        );

        return result;
    } catch (deepReasoningError) {
        console.warn('[Example] Deep Reasoning gagal, menggunakan fallback:', deepReasoningError.message);

        // Fallback ke sistem standar
        try {
            const fallbackResult = await analyzeChecklistImage(
                filesData,
                componentName,
                kategori,
                aspek
            );

            return {
                ...fallbackResult,
                fallback_used: true,
                deep_reasoning_enabled: false
            };
        } catch (fallbackError) {
            console.error('[Example] Semua sistem gagal:', fallbackError);
            throw new Error('Gagal melakukan analisis. Silakan coba lagi.');
        }
    }
}

// ============================================================
//  EXPORT FUNCTIONS
// ============================================================

export {
    // Initialization
    initializeSystem,

    // Checklist Analysis
    exampleAnalyzeChecklist,

    // Aspect Analysis
    exampleAnalyzeAspekStruktur,

    // Multi-Agent
    exampleMultiAgentAnalysis,
    exampleSpecificAgentAnalysis,

    // Regulation Query
    exampleQueryRegulation,
    exampleGetRulesForCategory,

    // Skills & Workflows
    exampleGetSkillInfo,
    exampleGetWorkflowInfo,

    // Document & OCR
    exampleAnalyzeDocument,
    exampleOCRAnalysis,

    // Comparative Audit
    exampleComparativeAudit,

    // Consensus
    exampleConsensusAnalysis,

    // Error Handling
    exampleWithErrorHandling
};

// ============================================================
//  USAGE GUIDE
// ============================================================

/**
 * PANDUAN PENGGUNAAN:
 * 
 * 1. INISIALISASI:
 *    - Panggil initializeSystem() sekali saat aplikasi dimuat
 *    - Ini akan load semua rules, workflows, hooks, dan skills
 * 
 * 2. ANALISIS CHECKLIST:
 *    - Gunakan analyzeWithDeepReasoning() untuk analisis gambar checklist
 *    - Hasil akan mencakup analisis AI Vision + Deep Reasoning
 * 
 * 3. ANALISIS ASPEK:
 *    - Gunakan runAspectAnalysisWithDeepReasoning() untuk analisis per aspek
 *    - Hasil akan mencakup skor, narasi teknis, dan rekomendasi
 * 
 * 4. MULTI-AGENT:
 *    - Gunakan runMultiAgentWithDeepReasoning() untuk menjalankan semua agents
 *    - Hasil akan mencakup analisis dari setiap agent + consensus
 * 
 * 5. QUERY REGULASI:
 *    - Gunakan queryRegulation() untuk mencari aturan regulasi
 *    - Gunakan getRulesForCategory() untuk mendapatkan aturan per kategori
 * 
 * 6. FALLBACK:
 *    - Sistem otomatis fallback ke sistem standar jika Deep Reasoning gagal
 *    - Tidak perlu error handling manual
 * 
 * CATATAN:
 * - Deep Reasoning akan meningkatkan kualitas analisis
 * - Semua fungsi tetap kompatibel dengan sistem yang sudah ada
 * - Deep Reasoning bersifat opsional, tidak mengganggu flow yang sudah ada
 */