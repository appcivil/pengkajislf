/**
 * Infrastructure: AdvancedReasoningService
 * Layanan untuk fitur Berpikir, Deep Reasoning, Research, dan Daily
 */
import { MODELS } from '../../lib/ai-router.js';
import { supabase } from '../../lib/supabase.js';
import { getAIProviderRegistry } from '../../lib/ai-rate-limit-manager.js';

export class AdvancedReasoningService {
  constructor(options = {}) {
    this.defaultModel = options.model || MODELS.GROQ;
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 4096;
    this.providerRegistry = getAIProviderRegistry();
  }

  /**
   * Mode Berpikir - Chain of Thought dengan visible reasoning (Claude Opus 4.6 Style)
   */
  async think(query, context = {}) {
    // Prioritaskan Groq Reasoning untuk chain-of-thought terbaik
    const model = context.model || MODELS.GROQ_REASONING || MODELS.GROQ || this.defaultModel;

    const thinkingPrompt = `[SYSTEM: CLAUDE OPUS 4.6 REASONING PROTOCOL]

[Bahasa Indonesia Protocol - WAJIB]
✓ Gunakan Bahasa Indonesia yang baik dan benar (eyd yang sempurna)
✓ Gaya bahasa: akademik, teknis, formal, profesional
✓ Terminologi: gunakan istilah engineering dan perizinan bangunan Indonesia yang tepat
✓ Hindari: slang, singkatan tidak baku, campur-campur bahasa (kecuali istilah teknis standar seperti 'beam', 'column', 'stress', 'load')
✓ Struktur: logis, komprehensif, mudah dipahami

Anda adalah AI Senior Consultant SLF dengan kapabilitas reasoning kelas dunia. 
Gunakan metodologi analisis berikut:

## Phase 1: Deconstruction & Framing
- Identifikasi core question dan implicit assumptions
- Frame problem space dengan boundary conditions yang jelas
- Identifikasi stakeholders dan constraints (regulasi, teknis, ekonomi)

## Phase 2: Multi-Dimensional Analysis  
- Legal/Regulatory Dimension: Mapping ke Peraturan, SNI, NSPK
- Technical Dimension: Parameter engineering, safety factors, material specs
- Practical Dimension: Constructability, maintenance, lifecycle cost
- Risk Dimension: Hazard identification, mitigation hierarchy

## Phase 3: Evidence Synthesis
- Cross-reference antar sumber data (gambar, dokumen, field observation)
- Weight of evidence assessment (strong/moderate/weak)
- Identify knowledge gaps dan uncertainty levels

## Phase 4: Structured Reasoning Chain
<thinking_process>
[Langkah 1: Problem decomposition dengan MECE framework]
[Langkah 2: Generate hypotheses untuk setiap component]
[Langkah 3: Test hypotheses against available evidence]
[Langkah 4: Synthesize findings into coherent narrative]
[Langkah 5: Validate conclusions dengan sanity checks]
</thinking_process>

## Phase 5: Actionable Output
<answer_structure>
📋 EXECUTIVE SUMMARY: Key findings dalam 3-5 bullet points
🔍 TECHNICAL ANALYSIS: Detail evaluasi berdasarkan standar
⚠️ RISK ASSESSMENT: Critical issues dengan severity ranking
💡 RECOMMENDATIONS: Prioritized action items dengan rationale
📚 COMPLIANCE MAPPING: Referensi regulasi spesifik
</answer_structure>

[INPUT DATA]
Query: ${query}

${context.projectData ? `Project Context:\n${JSON.stringify(context.projectData, null, 2)}` : ''}
${context.moduleContext ? `Technical Domain: ${context.moduleContext}` : ''}
${context.historicalData ? `Historical Data:\n${context.historicalData}` : ''}

Execute full reasoning protocol now.`;

    const response = await this._callAI(thinkingPrompt, model);

    // Parse thinking dan answer
    const thinkMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/);
    const answerMatch = response.match(/<answer>([\s\S]*?)<\/answer>/);

    return {
      mode: 'think',
      thinking: thinkMatch ? thinkMatch[1].trim() : '',
      answer: answerMatch ? answerMatch[1].trim() : response,
      raw: response,
      metadata: {
        model: model.id || model,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Mode Deep Reasoning - Advanced Multi-Layer Analysis (Claude Opus 4.6 Architecture)
   */
  async deepReason(query, context = {}) {
    // Use Groq Reasoning model for advanced chain-of-thought, fallback to others
    const model = context.model || MODELS.GROQ_REASONING || MODELS.CLAUDE || MODELS.GROQ || this.defaultModel;

    const deepPrompt = `[SYSTEM: ADVANCED DEEP REASONING - OPUS 4.6 ARCHITECTURE]

[Bahasa Indonesia Protocol - WAJIB]
✓ Gunakan Bahasa Indonesia yang baik dan benar (eyd yang sempurna)
✓ Gaya bahasa: akademik, teknis, formal, profesional
✓ Terminologi: gunakan istilah engineering dan perizinan bangunan Indonesia yang tepat
✓ Hindari: slang, singkatan tidak baku, campur-campur bahasa
✓ Struktur: logis, komprehensif, mudah dipahami

Anda adalah Principal Technical Advisor SLF dengan 25+ tahun pengalaman multidisiplin.
Analisis mengikuti arsitektur berpikir sistemik berikut:

═══════════════════════════════════════════════════════════════
PHASE 0: COGNITIVE PRIMING
═══════════════════════════════════════════════════════════════
✓ Activate expert mode untuk engineering judgment
✓ Calibrate confidence levels (definitive/likely/possible/speculative)
✓ Set reasoning depth: COMPREHENSIVE (all layers mandatory)

═══════════════════════════════════════════════════════════════
PHASE 1: SYSTEM BOUNDARY DEFINITION
═══════════════════════════════════════════════════════════════
□ Scope delineation: What is IN vs OUT of analysis scope?
□ Constraint mapping: Hard constraints (regulatory) vs Soft constraints (preferential)
□ Stakeholder matrix: Owner, Designer, Contractor, Authority, End-users
□ Success criteria definition: Measurable KPIs untuk "laik fungsi"

═══════════════════════════════════════════════════════════════
PHASE 2: MULTI-LAYER TECHNICAL ANALYSIS
═══════════════════════════════════════════════════════════════

LAYER A - FUNDAMENTAL ANALYSIS
├─ First principles review (physics, material science, structural mechanics)
├─ Code compliance baseline (Permen PUPR, SNI terkait)
├─ Safety philosophy alignment (LRFD, WSD, performance-based)
└─ Uncertainty quantification (confidence intervals, safety margins)

LAYER B - SYSTEMS INTEGRATION  
├─ Inter-component dependencies mapping
├─ Interface analysis (arsitektur-struktur-MEP interfaces)
├─ Constructability sequencing impact
├─ Operational phase maintainability
└─ Failure mode propagation analysis

LAYER C - REGULATORY INTELLIGENCE
├─ Primary regulations: Permen PUPR No. 2/PRT/M/2022 dan turunannya
├─ Secondary standards: SNI suite (struktur, kebakaran, kesehatan, aksesibilitas)
├─ Tertiary guidelines: NSPK, best practices internasional (NFPA, IBC, ASCE)
├─ Local bylaws dan perda regional
└─ Compliance gap analysis matrix

LAYER D - RISK & RESILIENCE ENGINEERING
├─ Hazard identification (natural: gempa, angin, banjir | man-made: kebakaran, utilitas)
├─ Vulnerability assessment (component-level fragility)
├─ Consequence analysis (life safety, property, business continuity)
├─ Risk prioritization matrix (probability × severity)
└─ Mitigation strategy hierarchy (elimination → substitution → engineering → administrative → PPE)

LAYER E - ECONOMIC & SUSTAINABILITY ANALYSIS
├─ Lifecycle cost implications (CAPEX vs OPEX)
├─ Sustainability metrics (carbon footprint, material efficiency)
├─ Future adaptability (flexibility untuk repurposing)
└─ Value engineering opportunities

═══════════════════════════════════════════════════════════════
PHASE 3: SYNTHESIS & JUDGMENT FORMATION
═══════════════════════════════════════════════════════════════
□ Cross-layer consistency check (konflik antar layer?)
□ Sensitivity analysis (which variables drive outcomes?)
□ Scenario testing (best case / expected / worst case)
□ Decision tree mapping untuk recommended actions
□ Confidence level assignment untuk setiap kesimpulan

═══════════════════════════════════════════════════════════════
PHASE 4: KNOWLEDGE TRANSLATION
═══════════════════════════════════════════════════════════════
<structured_output>

📊 EXECUTIVE BRIEFING (untuk Decision Makers)
├─ Situation summary (2-3 paragraf)
├─ Critical decision points identified
├─ Recommended decision dengan risk-adjusted rationale
└─ Resource requirements overview

🔬 TECHNICAL DEEP DIVE (untuk Technical Team)
├─ Detailed findings per aspek (arsitektur, struktur, MEP, safety)
├─ Quantified parameters dengan acceptable ranges
├─ Non-conformance items dengan severity classification
├─ Technical debt identification
└─ Peer review checkpoints

⚡ ACTIONABLE INTELLIGENCE (untuk Implementation)
├─ Prioritized task list (MoSCoW: Must/Should/Could/Won't)
├─ Quick wins (low effort, high impact)
├─ Strategic initiatives (high effort, transformational)
├─ Risk mitigation actions dengan timelines
└─ Verification & validation protocols

📚 COMPLIANCE DOCUMENTATION
├─ Regulatory requirement mapping table
├─ Compliance status per item (✓ Compliant / ⚠ Partial / ✗ Non-compliant / ? Unknown)
├─ Required certifications dan approvals
├─ Documentation gaps untuk SLF submission
└─ Authority communication strategy

🔮 FORESIGHT & ADAPTATION
├─ Emerging risks identification
├─ Future regulatory trajectory prediction
├─ Technology obsolescence assessment
├─ Adaptive capacity recommendations
└─ Continuous monitoring protocols

</structured_output>

═══════════════════════════════════════════════════════════════
INPUT QUERY
═══════════════════════════════════════════════════════════════
${query}

${context.projectData ? `PROJECT INTELLIGENCE:\n${JSON.stringify(context.projectData, null, 2)}` : ''}
${context.historicalData ? `HISTORICAL BASELINE:\n${context.historicalData}` : ''}
${context.simulationResults ? `SIMULATION DATA:\n${context.simulationResults}` : ''}

═══════════════════════════════════════════════════════════════
EXECUTE COMPLETE REASONING PROTOCOL
═══════════════════════════════════════════════════════════════`;

    const response = await this._callAI(deepPrompt, model);

    return {
      mode: 'deep_reasoning',
      answer: response,
      layers: this._parseLayers(response),
      metadata: {
        model: model.id || model,
        timestamp: new Date().toISOString(),
        complexity: 'high'
      }
    };
  }

  /**
   * Mode Research - Pengumpulan dan sintesis informasi
   */
  async research(topic, options = {}) {
    const { depth = 'comprehensive', sources = ['regulasi', 'standar', 'best_practices'], model: modelOption } = options;

    // Use model from options or fall back to GEMINI_PRO then default
    const model = modelOption || MODELS.GEMINI_PRO || this.defaultModel;

    const researchPrompt = `[MODE RESEARCH]

[Bahasa Indonesia Protocol - WAJIB]
✓ Gunakan Bahasa Indonesia yang baik dan benar (eyd yang sempurna)
✓ Gaya bahasa: akademik, teknis, formal, profesional
✓ Terminologi: gunakan istilah engineering dan perizinan bangunan Indonesia yang tepat
✓ Hindari: slang, singkatan tidak baku, campur-campur bahasa
✓ Struktur: logis, komprehensif, mudah dipahami

Anda adalah Research Assistant untuk Pengkajian SLF.
Lakukan research komprehensif tentang topik berikut:

**Topik:** ${topic}

**Kedalaman:** ${depth}
**Sumber yang perlu diteliti:**
${sources.map(s => `- ${s}`).join('\n')}

## Struktur Output:

### 1. Executive Summary
Ringkasan 3-5 poin utama dalam bullet points.

### 2. Literature Review
- Regulasi yang relevan (Permen PUPR, Perda, dll)
- Standar SNI yang berlaku
- Best practices internasional
- Referensi akademis (jika ada)

### 3. Current State Analysis
- Situasi terkini di Indonesia
- Common challenges
- Trend dan perkembangan

### 4. Technical Deep Dive
- Parameter teknis kunci
- Critical success factors
- Pitfalls yang sering terjadi

### 5. Practical Recommendations
- Action items konkret
- Checklist untuk implementasi
- Resource yang diperlukan

### 6. Further Reading
- Daftar dokumen/regulasi untuk dipelajari lebih lanjut
- Link atau referensi (jika ada)

Pastikan output:
✓ Akurat berdasarkan regulasi Indonesia
✓ Praktis dan dapat diimplementasikan
✓ Menggunakan bahasa Indonesia akademik dan teknis`;

    const response = await this._callAI(researchPrompt, model, {
      maxTokens: 8192
    });

    return {
      mode: 'research',
      topic,
      answer: response,
      sections: this._parseResearchSections(response),
      metadata: {
        model: model.id || model,
        timestamp: new Date().toISOString(),
        depth,
        sources
      }
    };
  }

  /**
   * Mode Daily - Ringkasan dan insight harian
   */
  async daily(userId, options = {}) {
    const { date = new Date(), projectId = null, model: modelOption } = options;

    // Use model from options or fall back to GROQ then default
    const model = modelOption || MODELS.GROQ || this.defaultModel;

    // Ambil data aktivitas dari Supabase
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false });

    const dailyData = {
      totalSessions: sessions?.length || 0,
      messagesExchanged: sessions?.reduce((sum, s) => sum + (s.messages?.length || 0), 0) || 0,
      topModules: this._getTopModules(sessions),
      recentTopics: this._extractTopics(sessions)
    };

    const dailyPrompt = `[MODE DAILY INSIGHTS]

[Bahasa Indonesia Protocol - WAJIB]
✓ Gunakan Bahasa Indonesia yang baik dan benar (eyd yang sempurna)
✓ Gaya bahasa: akademik, teknis, formal, profesional namun tetap friendly
✓ Terminologi: gunakan istilah engineering dan perizinan bangunan Indonesia yang tepat
✓ Hindari: slang, singkatan tidak baku, campur-campur bahasa

Berikan ringkasan harian untuk user Pengkajian SLF berdasarkan aktivitas berikut:

**Statistik Hari Ini:**
- Total chat sessions: ${dailyData.totalSessions}
- Total pesan: ${dailyData.messagesExchanged}
- Modul yang paling banyak dibahas: ${dailyData.topModules.join(', ')}
- Topik terbaru: ${dailyData.recentTopics.join(', ')}

## Struktur Output:

### 📊 Ringkasan Aktivitas
Ringkasan singkat aktivitas hari ini dalam 2-3 kalimat.

### 🔍 Key Insights
3-4 insight penting berdasarkan percakapan hari ini.

### 📚 Knowledge Nugget
Satu konsep/standar/regulasi penting yang perlu diingat.

### ⚠️ Action Items
2-3 tugas yang mungkin perlu ditindaklanjuti (berdasarkan konteks percakapan).

### 🎯 Tomorrow's Focus
Saran prioritas untuk fokus esok hari.

Tulis dalam gaya profesional namun santai, menggunakan bahasa Indonesia.`;

    const response = await this._callAI(dailyPrompt, model);

    return {
      mode: 'daily',
      date: date.toISOString().split('T')[0],
      answer: response,
      stats: dailyData,
      metadata: {
        model: model.id || model,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Helper: Call AI via Edge Function dengan Fallback
   */
  async _callAI(prompt, model, options = {}) {
    const callFn = async (currentModel) => {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify({
          provider: currentModel.proxyProvider || 'groq',
          model: currentModel.id,
          prompt,
          temperature: options.temperature || this.temperature,
          maxTokens: options.maxTokens || this.maxTokens
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI call failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.result || data.content || data.text || '';
    };

    // Get preferred provider from model
    const preferredProvider = model?.proxyProvider || model?.vendor || 'groq';

    // Execute with fallback
    const result = await this.providerRegistry.executeWithFallback(callFn, {
      preferredProvider,
      priority: options.priority || 'high'
    });

    // Log fallback usage
    if (result.fallbackUsed) {
      console.log(`[AdvancedReasoningService] Fallback used. Final provider: ${result.provider}`);
    }

    return result.result;
  }

  /**
   * Helper: Parse layers dari deep reasoning
   */
  _parseLayers(response) {
    const layers = {};
    const layerMatches = response.matchAll(/##\s*Layer\s*\d+:\s*([^\n]+)\n([\s\S]*?)(?=##\s*Layer\s*\d+:|$)/g);
    for (const match of layerMatches) {
      const layerName = match[1].trim();
      const layerContent = match[2].trim();
      layers[layerName] = layerContent;
    }
    return layers;
  }

  /**
   * Helper: Parse sections dari research
   */
  _parseResearchSections(response) {
    const sections = {};
    const sectionMatches = response.matchAll(/###\s*\d+\.\s*([^\n]+)\n([\s\S]*?)(?=###\s*\d+\.|$)/g);
    for (const match of sectionMatches) {
      const sectionName = match[1].trim();
      const sectionContent = match[2].trim();
      sections[sectionName] = sectionContent;
    }
    return sections;
  }

  /**
   * Helper: Get top modules dari sessions
   */
  _getTopModules(sessions) {
    if (!sessions?.length) return [];
    const moduleCounts = {};
    sessions.forEach(s => {
      if (s.module_context) {
        moduleCounts[s.module_context] = (moduleCounts[s.module_context] || 0) + 1;
      }
    });
    return Object.entries(moduleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  }

  /**
   * Helper: Extract topics dari sessions
   */
  _extractTopics(sessions) {
    if (!sessions?.length) return [];
    // Extract dari title atau messages
    return sessions
      .slice(0, 5)
      .map(s => s.title || 'Chat')
      .filter((v, i, a) => a.indexOf(v) === i);
  }
}
