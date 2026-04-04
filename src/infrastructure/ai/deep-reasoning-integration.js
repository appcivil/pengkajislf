// ============================================================
//  DEEP REASONING ENGINE INTEGRATION
//  Menghubungkan sistem Deep Reasoning dengan AI Engine yang sudah ada
// ============================================================

import {
    DeepReasoningEngine,
    RuleEngine,
    WorkflowEngine,
    HookManager,
    SkillRegistry
} from './deep-reasoning-engine.js';

import {
    analyzeChecklistImage,
    analyzeDocument,
    analyzeComparativeAudit
} from '../../lib/gemini.js';

import {
    runSingleItemAnalysis,
    runAspectAnalysis,
    runOCRAnalysis,
    getMultiAgentConsensus
} from '../../lib/ai-router.js';

import {
    runSpecificAgentAnalysis,
    runCoordinatorSynthesis,
    AGENT_CONFIG
} from '../../lib/multi-agent-service.js';

/**
 * Class utama yang menghubungkan semua sistem
 */
export class SmartAIIntegration {
    constructor() {
        this.deepReasoningEngine = new DeepReasoningEngine();
        this.ruleEngine = new RuleEngine();
        this.workflowEngine = new WorkflowEngine();
        this.hookManager = new HookManager();
        this.skillRegistry = new SkillRegistry();

        this.isInitialized = false;
        this.cachedRegulations = null;
    }

    /**
     * Inisialisasi sistem dengan load semua aturan dan skills
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('[SmartAI Integration] Sudah terinisialisasi');
            return;
        }

        console.log('[SmartAI Integration] Memulai inisialisasi...');

        try {
            // Load rules dari aturan peraturan
            await this.loadRegulatoryRules();

            // Load workflows
            await this.loadWorkflows();

            // Load hooks
            await this.loadHooks();

            // Load skills
            await this.loadSkills();

            // Initialize deep reasoning engine
            await this.deepReasoningEngine.initialize();

            this.isInitialized = true;
            console.log('[SmartAI Integration] Inisialisasi selesai');
        } catch (error) {
            console.error('[SmartAI Integration] Gagal inisialisasi:', error);
            throw error;
        }
    }

    /**
     * Load aturan regulasi dari file external
     */
    async loadRegulatoryRules() {
        try {
            const { loadRegulatoryRules } = await import('./deep-reasoning-rules.js');
            const regulations = await loadRegulatoryRules();

            // Register semua rules ke rule engine
            Object.keys(regulations).forEach(category => {
                this.ruleEngine.registerRuleCategory(category, regulations[category]);
            });

            this.cachedRegulations = regulations;
            console.log(`[SmartAI Integration] Loaded ${Object.keys(regulations).length} regulation categories`);
        } catch (error) {
            console.warn('[SmartAI Integration] Gagal load regulatory rules:', error);
        }
    }

    /**
     * Load workflows
     */
    async loadWorkflows() {
        try {
            const { createWorkflows } = await import('./deep-reasoning-workflows.js');
            const workflows = createWorkflows();

            Object.entries(workflows).forEach(([name, workflow]) => {
                this.workflowEngine.registerWorkflow(name, workflow);
            });

            console.log(`[SmartAI Integration] Loaded ${Object.keys(workflows).length} workflows`);
        } catch (error) {
            console.warn('[SmartAI Integration] Gagal load workflows:', error);
        }
    }

    /**
     * Load hooks
     */
    async loadHooks() {
        try {
            const { createHooks } = await import('./deep-reasoning-hooks.js');
            const hooks = createHooks();

            Object.entries(hooks).forEach(([name, hook]) => {
                this.hookManager.registerHook(name, hook);
            });

            console.log(`[SmartAI Integration] Loaded ${Object.keys(hooks).length} hooks`);
        } catch (error) {
            console.warn('[SmartAI Integration] Gagal load hooks:', error);
        }
    }

    /**
     * Load skills
     */
    async loadSkills() {
        try {
            const { createSkills } = await import('./deep-reasoning-skills.js');
            const skills = createSkills();

            Object.entries(skills).forEach(([name, skill]) => {
                this.skillRegistry.registerSkill(name, skill);
            });

            console.log(`[SmartAI Integration] Loaded ${Object.keys(skills).length} skills`);
        } catch (error) {
            console.warn('[SmartAI Integration] Gagal load skills:', error);
        }
    }

    /**
     * Analisis checklist dengan Deep Reasoning + AI Vision
     */
    async analyzeWithDeepReasoning(target, aspek = '', options = {}) {
        // Pastikan sistem terinisialisasi
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Handle both (filesData, componentName...) and (item, aspek, options...)
        const isSingleItem = typeof target === 'object' && target.kode;
        const componentName = isSingleItem ? target.nama : target;
        const evidence = options.evidence || [];

        console.log(`[SmartAI Integration] Menganalisis ${componentName} dengan Deep Reasoning + ${evidence.length} bukti fisik`);

        // 1. Jalankan pre-analysis hooks
        await this.hookManager.executeHook('beforeAnalysis', { target, aspek, options });

        // 2. Dapatkan aturan yang relevan
        const kategori = isSingleItem ? target.kategori : 'teknis';
        const relevantRules = this.ruleEngine.getRulesForCategory(kategori);

        // 3. Eksekusi AI yang relevan
        let aiResult;
        if (isSingleItem) {
            // Panggil router untuk single item dengan konteks bukti
            aiResult = await runSingleItemAnalysis(target, aspek, { ...options, evidence });
        } else {
            // Legacy vision path
            aiResult = await analyzeChecklistImage(target, componentName, kategori, aspek);
        }

        // 4. Enhance hasil dengan Deep Reasoning
        const enhancedResult = await this.deepReasoningEngine.enhanceAnalysis({
            aiResult,
            componentName,
            kategori,
            aspek,
            evidence,
            rules: relevantRules
        });

        // 5. Jalankan post-analysis hooks
        await this.hookManager.executeHook('afterAnalysis', { result: enhancedResult });

        return enhancedResult;
    }

    /**
     * Analisis dokumen dengan Deep Reasoning
     */
    async analyzeDocumentWithDeepReasoning(fileData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log('[SmartAI Integration] Menganalisis dokumen dengan Deep Reasoning');

        // Eksekusi document analysis yang sudah ada
        const docResult = await analyzeDocument(fileData);

        // Enhance dengan rule validation
        const validatedResult = this.ruleEngine.validateDocument(docResult);

        return validatedResult;
    }

    /**
     * Analisis komparatif dengan Deep Reasoning
     */
    async analyzeComparativeWithDeepReasoning(filesData, itemName, itemKode, context = '') {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`[SmartAI Integration] Analisis komparatif ${itemName}`);

        // Eksekusi comparative audit yang sudah ada
        const compResult = await analyzeComparativeAudit(filesData, itemName, itemKode, context);

        // Enhance dengan workflow validation
        const workflowResult = await this.workflowEngine.executeWorkflow(
            'comparativeAnalysis',
            { compResult, itemName, itemKode }
        );

        return workflowResult;
    }

    /**
     * Jalankan analisis aspek dengan Deep Reasoning + AI Router
     */
    async runAspectAnalysisWithDeepReasoning(aspek, items, onProgress, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`[SmartAI Integration] Analisis aspek ${aspek} dengan Deep Reasoning`);

        // Jalankan workflow sebelum analysis
        const workflowResult = await this.workflowEngine.executeWorkflow(
            'aspectAnalysis',
            { aspek, items }
        );

        // Jalankan aspect analysis yang sudah ada
        const analysisResult = await runAspectAnalysis(
            aspek,
            items,
            onProgress,
            options
        );

        // Enhance dengan deep reasoning
        const enhancedAnalysis = await this.deepReasoningEngine.enhanceAspectAnalysis({
            analysisResult,
            aspek,
            items,
            workflowResult
        });

        return enhancedAnalysis;
    }

    /**
     * Jalankan single item analysis dengan Deep Reasoning
     */
    async runSingleItemWithDeepReasoning(item, aspek, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`[SmartAI Integration] Analisis item ${item.kode} dengan Deep Reasoning`);

        // Dapatkan aturan yang relevan untuk item ini
        const relevantRules = this.ruleEngine.getRulesForItem(item);

        // Jalankan single item analysis yang sudah ada
        const itemResult = await runSingleItemAnalysis(item, aspek, options);

        // Enhance dengan rule validation
        const validatedResult = this.ruleEngine.validateItemResult(itemResult, relevantRules);

        return validatedResult;
    }

    /**
     * Jalankan multi-agent analysis dengan Deep Reasoning
     */
    async runMultiAgentWithDeepReasoning(proyekId, agentIds = null) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`[SmartAI Integration] Multi-agent analysis untuk proyek ${proyekId}`);

        // Tentukan agents yang akan dijalankan
        const agentsToRun = agentIds || AGENT_CONFIG.map(a => a.id);
        const allResults = {};

        // Jalankan setiap agent dengan deep reasoning
        for (const agentId of agentsToRun) {
            console.log(`[SmartAI Integration] Menjalankan agent ${agentId}`);

            try {
                const agentResult = await runSpecificAgentAnalysis(proyekId, agentId, allResults);

                // Enhance dengan skill execution
                const enhancedResult = await this.skillRegistry.executeSkill(
                    `agent_${agentId}`,
                    { agentResult, agentId }
                );

                allResults[agentId] = enhancedResult;
            } catch (error) {
                console.error(`[SmartAI Integration] Error agent ${agentId}:`, error);
                allResults[agentId] = {
                    error: error.message,
                    status: 'failed'
                };
            }
        }

        // Coordinator synthesis
        const synthesisResult = await runCoordinatorSynthesis(Object.values(allResults));

        // Final enhancement dengan deep reasoning
        const finalResult = await this.deepReasoningEngine.enhanceMultiAgentResult({
            agentResults: allResults,
            synthesisResult
        });

        return finalResult;
    }

    /**
     * OCR Analysis dengan Deep Reasoning
     */
    async runOCRWithDeepReasoning(base64Data, mimeType) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log('[SmartAI Integration] OCR Analysis dengan Deep Reasoning');

        // Jalankan OCR yang sudah ada
        const ocrResult = await runOCRAnalysis(base64Data, mimeType);

        // Validate dengan rules
        const validatedResult = this.ruleEngine.validateOCRResult(ocrResult);

        return validatedResult;
    }

    /**
     * Multi-agent consensus dengan Deep Reasoning
     */
    async getConsensusWithDeepReasoning(checklist, proyek, analisisSummary) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log('[SmartAI Integration] Multi-agent consensus dengan Deep Reasoning');

        // Jalankan workflow untuk consensus
        const workflowResult = await this.workflowEngine.executeWorkflow(
            'consensusAnalysis',
            { checklist, proyek, analisisSummary }
        );

        // Jalankan multi-agent consensus yang sudah ada
        const consensusResult = await getMultiAgentConsensus(
            checklist,
            proyek,
            analisisSummary
        );

        // Enhance dengan deep reasoning
        const enhancedConsensus = await this.deepReasoningEngine.enhanceConsensus({
            consensusResult,
            checklist,
            proyek,
            analisisSummary,
            workflowResult
        });

        return enhancedConsensus;
    }

    /**
     * Query aturan regulasi
     */
    queryRegulation(query) {
        if (!this.cachedRegulations) {
            return null;
        }

        // Cari di semua kategori
        for (const category in this.cachedRegulations) {
            const rules = this.cachedRegulations[category];
            for (const rule of rules) {
                if (rule.nama.toLowerCase().includes(query.toLowerCase()) ||
                    rule.nomor?.toLowerCase().includes(query.toLowerCase())) {
                    return {
                        category,
                        rule
                    };
                }
            }
        }

        return null;
    }

    /**
     * Dapatkan semua aturan untuk kategori tertentu
     */
    getRulesForCategory(category) {
        return this.ruleEngine.getRulesForCategory(category);
    }

    /**
     * Dapatkan skill info
     */
    getSkillInfo(skillName) {
        return this.skillRegistry.getSkill(skillName);
    }

    /**
     * Dapatkan semua skill yang tersedia
     */
    getAllSkills() {
        return this.skillRegistry.getAllSkills();
    }

    /**
     * Dapatkan semua workflow yang tersedia
     */
    getAllWorkflows() {
        return this.workflowEngine.getAllWorkflows();
    }

    /**
     * Reset state (untuk testing)
     */
    async reset() {
        this.isInitialized = false;
        this.cachedRegulations = null;
        await this.initialize();
    }
}

/**
 * Singleton instance
 */
let integrationInstance = null;

/**
 * Get singleton instance
 */
export function getSmartAIIntegration() {
    if (!integrationInstance) {
        integrationInstance = new SmartAIIntegration();
    }
    return integrationInstance;
}

/**
 * Initialize integration (helper function)
 */
export async function initializeSmartAIIntegration() {
    const integration = getSmartAIIntegration();
    await integration.initialize();
    return integration;
}