// ============================================================
//  DEEP REASONING ENGINE - Core Engine Class
//  Main engine that coordinates all deep reasoning components
// ============================================================

import { DEEP_REASONING_RULES, getRulesByCategory, getNSPKByType } from './deep-reasoning-rules.js';
import { DEEP_REASONING_WORKFLOWS, getWorkflowByCategory, getWorkflowById } from './deep-reasoning-workflows.js';
import { DEEP_REASONING_HOOKS, getHookByEvent } from './deep-reasoning-hooks.js';
import { DEEP_REASONING_SKILLS, getSkillByCategory } from './deep-reasoning-skills.js';

/**
 * Main Deep Reasoning Engine Class
 * Coordinates rules, workflows, hooks, and skills for SLF analysis
 */
export class DeepReasoningEngine {
    constructor() {
        this.rules = DEEP_REASONING_RULES;
        this.workflows = DEEP_REASONING_WORKFLOWS;
        this.hooks = DEEP_REASONING_HOOKS;
        this.skills = DEEP_REASONING_SKILLS;
        this.isInitialized = false;
    }

    /**
     * Initialize the engine
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('[DeepReasoningEngine] Already initialized');
            return;
        }

        console.log('[DeepReasoningEngine] Initializing...');

        // Load all components
        this.loadRules();
        this.loadWorkflows();
        this.loadHooks();
        this.loadSkills();

        this.isInitialized = true;
        console.log('[DeepReasoningEngine] Initialization complete');
    }

    /**
     * Load rules into memory
     */
    loadRules() {
        console.log('[DeepReasoningEngine] Loading rules...');
        // Rules are already loaded via import
        console.log(`[DeepReasoningEngine] Loaded ${Object.keys(this.rules).length} rule categories`);
    }

    /**
     * Load workflows into memory
     */
    loadWorkflows() {
        console.log('[DeepReasoningEngine] Loading workflows...');
        // Workflows are already loaded via import
        console.log(`[DeepReasoningEngine] Loaded ${Object.keys(this.workflows).length} workflow categories`);
    }

    /**
     * Load hooks into memory
     */
    loadHooks() {
        console.log('[DeepReasoningEngine] Loading hooks...');
        // Hooks are already loaded via import
        console.log(`[DeepReasoningEngine] Loaded ${Object.keys(this.hooks).length} hook categories`);
    }

    /**
     * Load skills into memory
     */
    loadSkills() {
        console.log('[DeepReasoningEngine] Loading skills...');
        // Skills are already loaded via import
        console.log(`[DeepReasoningEngine] Loaded ${Object.keys(this.skills).length} skill categories`);
    }

    /**
     * Enhance analysis result with deep reasoning
     */
    async enhanceAnalysis({ aiResult, componentName, kategori, aspek, rules }) {
        console.log('[DeepReasoningEngine] Enhancing analysis result...');

        // Get relevant rules if not provided
        if (!rules) {
            rules = getRulesByCategory(kategori);
        }

        // Apply deep reasoning logic
        const evidenceLinks = this.findRelevantEvidence(componentName, kategori, rules);
        
        const enhanced = {
            ...aiResult,
            deepReasoning: {
                rulesApplied: this.extractRelevantRules(rules, aspek),
                reasoningSteps: this.getReasoningSteps(kategori),
                confidenceScore: this.calculateConfidence(aiResult),
                recommendations: this.generateRecommendations(aiResult, rules),
                evidenceLinks: evidenceLinks // NEW: Link ke file fisik & regulasi
            }
        };

        return enhanced;
    }

    /**
     * Enhance aspect analysis
     */
    async enhanceAspectAnalysis({ analysisResult, aspek, items, workflowResult }) {
        console.log('[DeepReasoningEngine] Enhancing aspect analysis...');

        const workflow = getWorkflowByCategory(aspek);

        const enhanced = {
            ...analysisResult,
            deepReasoning: {
                workflowUsed: workflow?.name || 'Unknown',
                workflowSteps: workflow?.subWorkflows || [],
                reasoningSummary: this.summarizeReasoning(analysisResult),
                criticalFindings: this.identifyCriticalFindings(analysisResult)
            }
        };

        return enhanced;
    }

    /**
     * Enhance multi-agent result
     */
    async enhanceMultiAgentResult({ agentResults, synthesisResult }) {
        console.log('[DeepReasoningEngine] Enhancing multi-agent result...');

        const enhanced = {
            synthesisResult,
            agentResults,
            deepReasoning: {
                consensusLevel: this.calculateConsensusLevel(agentResults),
                conflictResolution: this.resolveConflicts(agentResults),
                finalRecommendation: this.generateFinalRecommendation(synthesisResult)
            }
        };

        return enhanced;
    }

    /**
     * Enhance consensus result
     */
    async enhanceConsensus({ consensusResult, checklist, proyek, analisisSummary, workflowResult }) {
        console.log('[DeepReasoningEngine] Enhancing consensus result...');

        const enhanced = {
            ...consensusResult,
            deepReasoning: {
                workflowResult,
                consensusConfidence: this.calculateConsensusConfidence(consensusResult),
                riskAssessment: this.assessConsensusRisks(consensusResult),
                actionPlan: this.generateActionPlan(consensusResult)
            }
        };

        return enhanced;
    }

    /**
     * Cari bukti fisik (lapangan) dan regulasi (NSPK) yang relevan
     */
    findRelevantEvidence(componentName, kategori, rules) {
        if (!componentName) return [];
        const nameLower = componentName.toLowerCase();
        const evidence = [];

        // 1. Cari dari rujukan NSPK/SNI di sistem rules
        const nspkRules = this.extractRelevantRules(rules, componentName);
        nspkRules.forEach(r => evidence.push({
            type: 'NSPK',
            name: r.name,
            ref: r.nomor || r.id,
            description: r.deskripsi || ''
        }));

        // 2. Placeholder untuk file fisik (akan diisi di integrasi level)
        // Integrasi level akan mem-pass file yang sebenarnya
        return evidence;
    }

    /**
     * Extract relevant rules for a specific aspect
     */
    extractRelevantRules(rules, aspect) {
        if (!rules || !aspect) return [];

        // Logic to filter rules based on aspect
        const relevant = [];
        Object.keys(rules).forEach(category => {
            if (rules[category].rules) {
                relevant.push(...rules[category].rules.filter(rule =>
                    rule.application?.toLowerCase().includes(aspect.toLowerCase()) ||
                    rule.name?.toLowerCase().includes(aspect.toLowerCase())
                ));
            } else if (Array.isArray(rules[category])) {
                relevant.push(...rules[category].filter(rule =>
                    rule.application?.toLowerCase().includes(aspect.toLowerCase()) ||
                    rule.name?.toLowerCase().includes(aspect.toLowerCase())
                ));
            }
        });

        return relevant;
    }

    /**
     * Get reasoning steps for a category
     */
    getReasoningSteps(category) {
        const categoryRules = getRulesByCategory('reasoningMethodology');
        return categoryRules?.deepReasoning?.steps || [];
    }

    /**
     * Calculate confidence score for analysis
     */
    calculateConfidence(result) {
        // Simple confidence calculation based on data completeness
        let score = 0;
        let total = 0;

        if (result.dataEksisting) { score += 20; total += 20; }
        if (result.perhitungan) { score += 30; total += 30; }
        if (result.analisis) { score += 30; total += 30; }
        if (result.rekomendasi) { score += 20; total += 20; }

        return total > 0 ? Math.round((score / total) * 100) : 0;
    }

    /**
     * Generate recommendations based on analysis and rules
     */
    generateRecommendations(result, rules) {
        const recommendations = [];

        // Check critical issues
        if (result.hasCriticalIssues) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Segera perbaiki untuk keselamatan',
                reason: 'Terdapat masalah kritis yang membahayakan'
            });
        }

        // Check compliance
        if (result.complianceScore < 70) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Perbaikan mayor diperlukan',
                reason: 'Skor kepatuhan di bawah standar'
            });
        }

        return recommendations;
    }

    /**
     * Summarize reasoning
     */
    summarizeReasoning(analysis) {
        if (!analysis) return 'No analysis data available';

        const summary = {
            totalItems: analysis.items?.length || 0,
            passedItems: analysis.items?.filter(i => i.status === 'passed')?.length || 0,
            failedItems: analysis.items?.filter(i => i.status === 'failed')?.length || 0,
            overallCompliance: analysis.overallScore || 0
        };

        return summary;
    }

    /**
     * Identify critical findings
     */
    identifyCriticalFindings(analysis) {
        const findings = [];

        if (analysis.items) {
            analysis.items.forEach(item => {
                if (item.status === 'failed' && item.priority === 'CRITICAL') {
                    findings.push({
                        item: item.kode,
                        issue: item.analisis,
                        recommendation: item.rekomendasi
                    });
                }
            });
        }

        return findings;
    }

    /**
     * Calculate consensus level among agents
     */
    calculateConsensusLevel(agentResults) {
        if (!agentResults || Object.keys(agentResults).length === 0) return 0;

        const results = Object.values(agentResults).filter(r => r.status !== 'failed');
        if (results.length === 0) return 0;

        // Simple consensus calculation
        const scores = results.map(r => r.score || 0);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        return Math.round(avg);
    }

    /**
     * Resolve conflicts between agents
     */
    resolveConflicts(agentResults) {
        const conflicts = [];

        // Find conflicting results
        const results = Object.values(agentResults);
        for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
                if (results[i].findings && results[j].findings) {
                    // Compare findings for conflicts
                    results[i].findings.forEach(finding1 => {
                        results[j].findings.forEach(finding2 => {
                            if (finding1.item === finding2.item &&
                                finding1.status !== finding2.status) {
                                conflicts.push({
                                    item: finding1.item,
                                    conflict: `${finding1.status} vs ${finding2.status}`,
                                    resolution: 'Manual review required'
                                });
                            }
                        });
                    });
                }
            }
        }

        return conflicts;
    }

    /**
     * Generate final recommendation
     */
    generateFinalRecommendation(synthesis) {
        if (!synthesis) return null;

        return {
            action: synthesis.recommendation || 'Review required',
            priority: synthesis.priority || 'MEDIUM',
            timeline: synthesis.timeline || '30 days',
            estimatedCost: synthesis.cost || 'TBD'
        };
    }

    /**
     * Calculate consensus confidence
     */
    calculateConsensusConfidence(consensus) {
        if (!consensus) return 0;

        const agreementCount = consensus.agreementCount || 0;
        const totalAgents = consensus.totalAgents || 1;

        return Math.round((agreementCount / totalAgents) * 100);
    }

    /**
     * Assess consensus risks
     */
    assessConsensusRisks(consensus) {
        const risks = [];

        if (consensus.consensusLevel < 70) {
            risks.push({
                type: 'LOW_CONSENSUS',
                severity: 'MEDIUM',
                description: 'Low agreement among agents, manual review recommended'
            });
        }

        return risks;
    }

    /**
     * Generate action plan
     */
    generateActionPlan(consensus) {
        const plan = [];

        if (consensus.actionItems) {
            plan.push(...consensus.actionItems);
        }

        return plan;
    }

    /**
     * Get rules for category
     */
    getRulesForCategory(category) {
        try {
            return getRulesByCategory(category);
        } catch (error) {
            console.warn(`[DeepReasoningEngine] Category ${category} not found`);
            return {};
        }
    }

    /**
     * Get workflow for category
     */
    getWorkflowForCategory(category) {
        try {
            return getWorkflowByCategory(category);
        } catch (error) {
            console.warn(`[DeepReasoningEngine] Workflow ${category} not found`);
            return null;
        }
    }

    /**
     * Reset engine state
     */
    async reset() {
        this.isInitialized = false;
        await this.initialize();
    }
}

// ============================================================
//  Component Classes
//  Wrapper classes for each deep reasoning component
// ============================================================

/**
 * RuleEngine Class
 * Manages regulatory rules and compliance
 */
export class RuleEngine {
    constructor() {
        this.rules = DEEP_REASONING_RULES;
    }

    /**
     * Get rules for category
     */
    getRulesForCategory(category) {
        try {
            return getRulesByCategory(category);
        } catch (error) {
            console.warn(`[RuleEngine] Category ${category} not found`);
            return {};
        }
    }

    /**
     * Get NSPK by type
     */
    getNSPKByType(type) {
        try {
            return getNSPKByType(type);
        } catch (error) {
            console.warn(`[RuleEngine] NSPK type ${type} not found`);
            return [];
        }
    }

    /**
     * Validate document against rules
     */
    validateDocument(docResult) {
        // Implement validation logic
        return {
            isValid: true,
            errors: [],
            warnings: []
        };
    }

    /**
     * Validate item result
     */
    validateItemResult(itemResult, rules) {
        // Implement item validation logic
        return {
            ...itemResult,
            isValid: true,
            validatedRules: rules || []
        };
    }

    /**
     * Validate OCR result
     */
    validateOCRResult(ocrResult) {
        // Implement OCR validation logic
        return {
            ...ocrResult,
            isValid: true,
            extractedFields: ocrResult.fields || {}
        };
    }

    /**
     * Register rule category
     */
    registerRuleCategory(category, rules) {
        this.rules[category] = rules;
    }

    /**
     * Get rules for item
     */
    getRulesForItem(item) {
        // Logic to find relevant rules for an item
        return [];
    }
}

/**
 * WorkflowEngine Class
 * Manages analysis workflows
 */
export class WorkflowEngine {
    constructor() {
        this.workflows = DEEP_REASONING_WORKFLOWS;
        this.registeredWorkflows = new Map();
    }

    /**
     * Get workflow for category
     */
    getWorkflowForCategory(category) {
        try {
            return getWorkflowByCategory(category);
        } catch (error) {
            console.warn(`[WorkflowEngine] Workflow ${category} not found`);
            return null;
        }
    }

    /**
     * Get workflow by ID
     */
    getWorkflowById(id) {
        try {
            return getWorkflowById(id);
        } catch (error) {
            console.warn(`[WorkflowEngine] Workflow ID ${id} not found`);
            return null;
        }
    }

    /**
     * Execute workflow
     */
    async executeWorkflow(workflowName, data) {
        console.log(`[WorkflowEngine] Executing workflow: ${workflowName}`);

        // Get workflow steps
        const workflow = this.registeredWorkflows.get(workflowName) ||
            this.workflows[workflowName];

        if (!workflow) {
            console.warn(`[WorkflowEngine] Workflow ${workflowName} not found`);
            return { success: false, error: 'Workflow not found' };
        }

        // Execute workflow steps
        const result = {
            workflowName,
            steps: [],
            result: data
        };

        // Add workflow-specific logic here
        result.success = true;

        return result;
    }

    /**
     * Register workflow
     */
    registerWorkflow(name, workflow) {
        this.registeredWorkflows.set(name, workflow);
    }

    /**
     * Get all workflows
     */
    getAllWorkflows() {
        return {
            ...this.workflows,
            registered: Array.from(this.registeredWorkflows.entries())
        };
    }
}

/**
 * HookManager Class
 * Manages lifecycle hooks
 */
export class HookManager {
    constructor() {
        this.hooks = DEEP_REASONING_HOOKS;
        this.registeredHooks = new Map();
    }

    /**
     * Get hook by event
     */
    getHookByEvent(event) {
        try {
            return getHookByEvent(event);
        } catch (error) {
            console.warn(`[HookManager] Hook ${event} not found`);
            return null;
        }
    }

    /**
     * Execute hook
     */
    async executeHook(hookName, data) {
        console.log(`[HookManager] Executing hook: ${hookName}`);

        const hook = this.registeredHooks.get(hookName) || this.hooks[hookName];

        if (!hook || !Array.isArray(hook)) {
            return;
        }

        // Execute all hook handlers
        for (const handler of hook) {
            try {
                await handler(data);
            } catch (error) {
                console.error(`[HookManager] Error in hook ${hookName}:`, error);
            }
        }
    }

    /**
     * Register hook
     */
    registerHook(name, hook) {
        if (!this.registeredHooks.has(name)) {
            this.registeredHooks.set(name, []);
        }
        this.registeredHooks.get(name).push(hook);
    }

    /**
     * Get all hooks
     */
    getAllHooks() {
        return {
            ...this.hooks,
            registered: Array.from(this.registeredHooks.entries())
        };
    }
}

/**
 * SkillRegistry Class
 * Manages AI skills
 */
export class SkillRegistry {
    constructor() {
        this.skills = DEEP_REASONING_SKILLS;
        this.registeredSkills = new Map();
    }

    /**
     * Get skill by category
     */
    getSkillByCategory(category) {
        try {
            return getSkillByCategory(category);
        } catch (error) {
            console.warn(`[SkillRegistry] Skill ${category} not found`);
            return null;
        }
    }

    /**
     * Execute skill
     */
    async executeSkill(skillName, data) {
        console.log(`[SkillRegistry] Executing skill: ${skillName}`);

        const skill = this.registeredSkills.get(skillName) || this.skills[skillName];

        if (!skill) {
            console.warn(`[SkillRegistry] Skill ${skillName} not found`);
            return { success: false, error: 'Skill not found' };
        }

        try {
            // Execute skill logic
            const result = await skill.execute(data);
            return { success: true, result };
        } catch (error) {
            console.error(`[SkillRegistry] Error executing skill ${skillName}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Register skill
     */
    registerSkill(name, skill) {
        this.registeredSkills.set(name, skill);
    }

    /**
     * Get skill
     */
    getSkill(skillName) {
        return this.registeredSkills.get(skillName) || this.skills[skillName];
    }

    /**
     * Get all skills
     */
    getAllSkills() {
        return {
            ...this.skills,
            registered: Array.from(this.registeredSkills.entries())
        };
    }
}
