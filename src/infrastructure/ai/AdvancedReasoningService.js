/**
 * Infrastructure: AdvancedReasoningService
 * Layanan untuk fitur Berpikir, Deep Reasoning, Research, dan Daily
 */
import { MODELS } from '../../lib/ai-router.js';
import { supabase } from '../../lib/supabase.js';

export class AdvancedReasoningService {
  constructor(options = {}) {
    this.defaultModel = options.model || MODELS.GROQ;
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 4096;
  }

  /**
   * Mode Berpikir - Chain of Thought dengan visible reasoning
   */
  async think(query, context = {}) {
    const thinkingPrompt = `[MODE BERPIKIR]

Anda adalah AI Ahli Pengkajian SLF dengan kemampuan berpikir mendalam.
Tunjukkan proses berpikir Anda langkah demi langkah.

Format jawaban:
<think>
1. [Analisis permasalahan]
2. [Identifikasi faktor-faktor penting]
3. [Evaluasi berdasarkan standar SNI/NSPK]
4. [Pertimbangan teknis]
5. [Kesimpulan sementara]
</think>

<answer>
[Jawaban final yang komprehensif dan terstruktur]
</answer>

Pertanyaan: ${query}

${context.projectData ? `Data Proyek:\n${JSON.stringify(context.projectData, null, 2)}` : ''}
${context.moduleContext ? `Konteks Modul: ${context.moduleContext}` : ''}`;

    const response = await this._callAI(thinkingPrompt, this.defaultModel);

    // Parse thinking dan answer
    const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
    const answerMatch = response.match(/<answer>([\s\S]*?)<\/answer>/);

    return {
      mode: 'think',
      thinking: thinkMatch ? thinkMatch[1].trim() : '',
      answer: answerMatch ? answerMatch[1].trim() : response,
      raw: response,
      metadata: {
        model: this.defaultModel.id || this.defaultModel,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Mode Deep Reasoning - Analisis multi-layer kompleks
   */
  async deepReason(query, context = {}) {
    const deepPrompt = `[MODE DEEP REASONING]

Anda adalah Senior Technical Consultant SLF dengan 20+ tahun pengalaman.
Lakukan analisis mendalam dengan pendekatan:

## Layer 1: Analisis Konseptual
- Identifikasi prinsip dasar yang relevan
- Mapping ke regulasi dan standar

## Layer 2: Analisis Teknis
- Evaluasi parameter teknis
- Identifikasi critical points
- Analisis risk assessment

## Layer 3: Analisis Implementasi
- Feasibility dari segi konstruksi
- Cost-benefit implikasi
- Timeline dan resource requirements

## Layer 4: Analisis Compliance
- Mapping ke Peraturan Menteri PUPR
- NSPK (Norma, Standar, Prosedur, Kriteria)
- SNI yang berlaku

## Layer 5: Rekomendasi Strategis
- Prioritas aksi
- Mitigasi risiko
- Alternative solutions

Pertanyaan: ${query}

${context.projectData ? `\n### DATA PROYEK\n${JSON.stringify(context.projectData, null, 2)}` : ''}
${context.historicalData ? `\n### DATA HISTORIS\n${context.historicalData}` : ''}

Berikan output terstruktur dengan format di atas.`;

    const response = await this._callAI(deepPrompt, MODELS.CLAUDE || this.defaultModel);

    return {
      mode: 'deep_reasoning',
      answer: response,
      layers: this._parseLayers(response),
      metadata: {
        model: (MODELS.CLAUDE || this.defaultModel).id,
        timestamp: new Date().toISOString(),
        complexity: 'high'
      }
    };
  }

  /**
   * Mode Research - Pengumpulan dan sintesis informasi
   */
  async research(topic, options = {}) {
    const { depth = 'comprehensive', sources = ['regulasi', 'standar', 'best_practices'] } = options;

    const researchPrompt = `[MODE RESEARCH]

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

    const response = await this._callAI(researchPrompt, MODELS.GEMINI_PRO || this.defaultModel, {
      maxTokens: 8192
    });

    return {
      mode: 'research',
      topic,
      answer: response,
      sections: this._parseResearchSections(response),
      metadata: {
        model: (MODELS.GEMINI_PRO || this.defaultModel).id,
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
    const { date = new Date(), projectId = null } = options;

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

    const response = await this._callAI(dailyPrompt, MODELS.GROQ);

    return {
      mode: 'daily',
      date: date.toISOString().split('T')[0],
      answer: response,
      stats: dailyData,
      metadata: {
        model: MODELS.GROQ.id,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Helper: Call AI via Edge Function
   */
  async _callAI(prompt, model, options = {}) {
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
        provider: model.proxyProvider || 'groq',
        model: model.id,
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
