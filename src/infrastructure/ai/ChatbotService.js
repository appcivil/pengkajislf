/**
 * Infrastructure: ChatbotService
 * Implementasi IChatbotService dengan multi-provider AI
 */
import { IChatbotService } from '../../domain/services/IChatbotService.js';
import { MODELS, fetchOpenRouter, parseAIJson } from '../../lib/ai-router.js';
import { supabase } from '../../lib/supabase.js';
import { AdvancedReasoningService } from './AdvancedReasoningService.js';

export class ChatbotService extends IChatbotService {
  constructor(options = {}) {
    super();
    this.defaultModel = options.model || MODELS.GROQ_LLAMMA;
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 4096;
    this.dataProvider = options.dataProvider || null;
    this.memoryService = options.memoryService || null;
    this.reasoningService = new AdvancedReasoningService({
      model: this.defaultModel,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    });
  }

  /**
   * Generate response dari AI dengan memory
   */
  async generateResponse(message, session, options = {}) {
    const model = options.model || this.defaultModel;
    const context = options.context || {};
    const reasoningMode = options.reasoningMode || null;

    // Handle reasoning modes
    if (reasoningMode) {
      try {
        let result;
        const reasoningContext = {
          projectData: context.applicationData,
          moduleContext: context.moduleContext,
          userId: context.userId
        };

        switch (reasoningMode) {
          case 'think':
            result = await this.reasoningService.think(message, reasoningContext);
            return {
              content: result.thinking
                ? `<div class="thinking-process"><strong>🧠 Proses Berpikir:</strong><pre>${result.thinking}</pre></div><div class="final-answer">${result.answer}</div>`
                : result.answer,
              metadata: {
                model: result.metadata.model,
                mode: 'think',
                thinking: result.thinking,
                responseTime: Date.now()
              }
            };

          case 'deep':
            result = await this.reasoningService.deepReason(message, reasoningContext);
            return {
              content: result.answer,
              metadata: {
                model: result.metadata.model,
                mode: 'deep_reasoning',
                layers: result.layers,
                complexity: 'high',
                responseTime: Date.now()
              }
            };

          case 'research':
            result = await this.reasoningService.research(message, {
              depth: 'comprehensive',
              sources: ['regulasi', 'standar', 'best_practices']
            });
            return {
              content: result.answer,
              metadata: {
                model: result.metadata.model,
                mode: 'research',
                sections: result.sections,
                depth: result.metadata.depth,
                responseTime: Date.now()
              }
            };

          case 'daily':
            if (!reasoningContext.userId) {
              return {
                content: 'Silakan login untuk menggunakan fitur Daily Insights.',
                metadata: { mode: 'daily', error: 'no_user' }
              };
            }
            result = await this.reasoningService.daily(reasoningContext.userId);
            return {
              content: result.answer,
              metadata: {
                model: result.metadata.model,
                mode: 'daily',
                stats: result.stats,
                date: result.date,
                responseTime: Date.now()
              }
            };

          default:
            break;
        }
      } catch (error) {
        console.error('[ChatbotService] Reasoning mode error:', error);
        return {
          content: `Maaf, terjadi kesalahan dalam mode ${reasoningMode}: ${error.message}`,
          metadata: { error: true, mode: reasoningMode }
        };
      }
    }

    // Get relevant memories untuk context
    let memoryContext = '';
    if (this.memoryService && context.userId) {
      const memories = await this.memoryService.getContextMemories(
        context.userId,
        {
          projectId: context.projectId,
          moduleContext: context.moduleContext
        },
        { limit: 5 }
      );
      
      if (memories.length > 0) {
        memoryContext = '\n=== MEMORI RELEVAN ===\n';
        memories.forEach(mem => {
          memoryContext += `- ${mem.key}: ${JSON.stringify(mem.value)}\n`;
        });
      }
    }

    // Build prompt dengan context dan memory
    const prompt = this._buildChatPrompt(message, session, context, memoryContext);

    try {
      // Panggil AI service
      const response = await this._callAI(prompt, model, options);

      return {
        content: response.content,
        metadata: {
          model: model.id || model,
          tokens: response.tokens,
          temperature: options.temperature || this.temperature,
          finishReason: response.finishReason,
          responseTime: response.responseTime
        }
      };

      // Learn dari conversation jika memory service tersedia
      if (this.memoryService && context.userId) {
        this._learnFromConversation(context.userId, session.id, message, result.content, context)
          .catch(err => console.error('[ChatbotService] Learning error:', err));
      }

      return result;
    } catch (error) {
      console.error('[ChatbotService] generateResponse error:', error);
      
      // Fallback response
      return {
        content: `Maaf, terjadi kesalahan saat memproses permintaan Anda. ${error.message}`,
        metadata: {
          error: true,
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Generate streaming response
   */
  async generateStreamingResponse(message, session, onChunk, options = {}) {
    const model = options.model || this.defaultModel;
    const prompt = this._buildChatPrompt(message, session, {});

    try {
      // Untuk sekarang, simulate streaming dengan chunking
      const response = await this._callAI(prompt, model, options);
      const content = response.content;
      
      // Simulate streaming
      const words = content.split(' ');
      let accumulated = '';
      
      for (let i = 0; i < words.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + words[i];
        onChunk({
          content: accumulated,
          done: i === words.length - 1,
          metadata: {
            model: model.id || model,
            chunkIndex: i,
            totalChunks: words.length
          }
        });
        
        // Small delay untuk simulate streaming effect
        await new Promise(r => setTimeout(r, 20));
      }
    } catch (error) {
      console.error('[ChatbotService] generateStreamingResponse error:', error);
      onChunk({
        content: `Maaf, terjadi kesalahan: ${error.message}`,
        done: true,
        error: true
      });
    }
  }

  /**
   * Generate image
   */
  async generateImage(prompt, options = {}) {
    // Gunakan Gemini atau OpenRouter untuk image generation
    const imageModel = MODELS.GEMINI_FLASH;
    
    const enhancedPrompt = `Generate an image: ${prompt}\n\nStyle: Technical illustration, professional, clean, suitable for SLF technical documentation. Indonesian context.`;

    try {
      // Untuk sekarang, return placeholder
      // Di production, integrate dengan image generation API
      const response = await this._callAI(enhancedPrompt, imageModel, {
        ...options,
        maxTokens: 1024
      });

      // Extract image URL atau base64 dari response
      const imageUrl = this._extractImageUrl(response.content);

      return {
        url: imageUrl || '/assets/placeholder-image.png',
        metadata: {
          prompt,
          model: imageModel.id,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[ChatbotService] generateImage error:', error);
      return {
        url: '/assets/placeholder-image.png',
        metadata: {
          error: true,
          prompt
        }
      };
    }
  }

  /**
   * Generate slide presentation
   */
  async generateSlides(topic, data, options = {}) {
    const prompt = `Buat presentasi slide untuk: ${topic}

Data yang tersedia:
${JSON.stringify(data, null, 2)}

Format output: JSON dengan struktur:
{
  "title": "Judul Presentasi",
  "slides": [
    {
      "type": "title|content|image|table",
      "title": "Judul Slide",
      "content": ["Bullet point 1", "Bullet point 2"],
      "notes": "Speaker notes"
    }
  ],
  "metadata": {
    "totalSlides": N,
    "estimatedDuration": "N menit"
  }
}

Buat slide yang profesional dengan struktur:
1. Cover
2. Agenda/Outline
3. 3-5 Content slides
4. Kesimpulan
5. Q&A

Gunakan bahasa Indonesia akademik dan teknis.`;

    try {
      const response = await this._callAI(prompt, this.defaultModel, {
        ...options,
        maxTokens: 4096
      });

      const slides = this._parseSlidesResponse(response.content);

      return {
        slides,
        metadata: {
          topic,
          slideCount: slides.length,
          generatedAt: new Date().toISOString(),
          model: this.defaultModel.id
        }
      };
    } catch (error) {
      console.error('[ChatbotService] generateSlides error:', error);
      throw error;
    }
  }

  /**
   * Generate Excel report
   */
  async generateExcel(title, data, options = {}) {
    const prompt = `Buat struktur Excel report untuk: ${title}

Data:
${JSON.stringify(data, null, 2)}

Format: Deskripsikan struktur worksheet, kolom, formula, dan styling.

Gunakan bahasa Indonesia untuk header kolom.`;

    try {
      const response = await this._callAI(prompt, this.defaultModel, options);

      // Generate actual Excel file menggunakan xlsx library
      const XLSX = await import('xlsx');
      const workbook = this._createExcelWorkbook(response.content, data, title);
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

      return {
        buffer,
        metadata: {
          title,
          size: buffer.byteLength,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[ChatbotService] generateExcel error:', error);
      throw error;
    }
  }

  /**
   * Analyze data dengan AI
   */
  async analyzeData(data, analysisType, options = {}) {
    const prompts = {
      summary: `Berikan ringkasan analisis data berikut:\n${JSON.stringify(data, null, 2)}`,
      trend: `Analisis tren dan pola dalam data berikut:\n${JSON.stringify(data, null, 2)}`,
      compliance: `Evaluasi kepatutan data berikut terhadap standar SLF:\n${JSON.stringify(data, null, 2)}`,
      risk: `Identifikasi risiko dari data berikut:\n${JSON.stringify(data, null, 2)}`,
      recommendation: `Berikan rekomendasi berdasarkan data berikut:\n${JSON.stringify(data, null, 2)}`
    };

    const prompt = prompts[analysisType] || prompts.summary;

    try {
      const response = await this._callAI(prompt, this.defaultModel, options);
      return parseAIJson(response.content);
    } catch (error) {
      console.error('[ChatbotService] analyzeData error:', error);
      return { error: error.message };
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    return Object.entries(MODELS).map(([key, model]) => ({
      id: model.id || key,
      name: model.name || key,
      vendor: model.vendor,
      type: model.type || 'text',
      costTier: model.costTier || 'unknown',
      maxTokens: model.maxTokens,
      contextWindow: model.contextWindow,
      recommended: model.recommended || false
    }));
  }

  /**
   * Build chat prompt dengan context
   */
  _buildChatPrompt(message, session, context, memoryContext = '') {
    const parts = [];

    // Memory context (jika ada)
    if (memoryContext) {
      parts.push(memoryContext);
      parts.push('');
    }

    // System context
    if (context.applicationData) {
      parts.push('=== DATA APLIKASI ===');
      parts.push(JSON.stringify(context.applicationData, null, 2));
      parts.push('');
    }

    // Conversation history
    if (session && session.messages) {
      const recentMessages = session.messages
        .filter(m => m.role !== 'system')
        .slice(-10);
      
      if (recentMessages.length > 0) {
        parts.push('=== HISTORY PERCAKAPAN ===');
        for (const msg of recentMessages) {
          parts.push(`${msg.role.toUpperCase()}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`);
        }
        parts.push('');
      }
    }

    // User message
    parts.push('=== PESAN USER ===');
    parts.push(message);

    return parts.join('\n');
  }

  /**
   * Call AI service
   */
  async _callAI(prompt, model, options = {}) {
    const startTime = Date.now();

    // Get current session untuk authorization
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
    }

    // Gunakan manual fetch dengan apikey header (anon key)
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
        provider: model.proxyProvider || 'gemini',
        model: model.id,
        prompt,
        temperature: options.temperature || this.temperature,
        maxTokens: options.maxTokens || this.maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ChatbotService] Edge Function error:', response.status, errorText);
      throw new Error(`AI call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[ChatbotService] AI response data:', data);

    const responseTime = Date.now() - startTime;

    return {
      content: data.result || data.content || data.text || '',
      tokens: data.usage?.total_tokens,
      finishReason: data.finish_reason,
      responseTime
    };
  }

  /**
   * Extract image URL dari response
   */
  _extractImageUrl(content) {
    // Cari URL image dalam response
    const urlMatch = content.match(/https?:\/\/[^\s"<>]+\.(?:png|jpg|jpeg|gif|webp)/i);
    return urlMatch ? urlMatch[0] : null;
  }

  /**
   * Parse slides dari response
   */
  _parseSlidesResponse(content) {
    try {
      // Coba parse sebagai JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.slides || [];
      }
    } catch (e) {
      console.warn('Failed to parse slides JSON:', e);
    }

    // Fallback: extract slides dari text
    return this._extractSlidesFromText(content);
  }

  /**
   * Extract slides dari text format
   */
  _extractSlidesFromText(content) {
    const slides = [];
    const lines = content.split('\n');
    let currentSlide = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('Slide ') || trimmed.startsWith('# ')) {
        if (currentSlide) slides.push(currentSlide);
        currentSlide = {
          type: 'content',
          title: trimmed.replace(/^Slide \d+[:\-]\s*/, '').replace(/^#\s*/, ''),
          content: []
        };
      } else if (currentSlide && trimmed.startsWith('- ')) {
        currentSlide.content.push(trimmed.substring(2));
      } else if (currentSlide && trimmed) {
        currentSlide.content.push(trimmed);
      }
    }

    if (currentSlide) slides.push(currentSlide);

    return slides.length > 0 ? slides : [{
      type: 'content',
      title: 'Presentasi',
      content: [content.substring(0, 500)]
    }];
  }

  /**
   * Create Excel workbook
   */
  _createExcelWorkbook(structure, data, title) {
    // Placeholder - implementasi dengan xlsx library
    // Return minimal workbook structure
    return {
      SheetNames: ['Data'],
      Sheets: {
        'Data': {
          '!ref': 'A1:A1',
          'A1': { v: title }
        }
      }
    };
  }

  /**
   * Learn dari conversation untuk long-term memory
   */
  async _learnFromConversation(userId, sessionId, userMessage, aiResponse, context) {
    if (!this.memoryService) return;

    try {
      // Extract memories dari user message
      await this.memoryService.learnFromMessage(
        userId,
        { content: userMessage, role: 'user' },
        sessionId,
        context
      );

      // Remember preferences dari AI response patterns
      if (aiResponse.includes('preferensi') || aiResponse.includes('pengaturan')) {
        // AI sedang membahas preferensi, simpan konteksnya
        await this.memoryService.rememberInsight(
          userId,
          'preference_context',
          { topic: 'preferences', timestamp: new Date().toISOString() },
          { sessionId }
        );
      }

      // Remember project-specific learnings
      if (context.projectId) {
        // Analisis apakah ada insight penting tentang project
        if (aiResponse.includes('rekomendasi') || aiResponse.includes('saran')) {
          await this.memoryService.rememberProjectContext(
            userId,
            context.projectId,
            'last_recommendations',
            { recommendations: aiResponse.substring(0, 500), timestamp: new Date().toISOString() }
          );
        }
      }

      console.log('[ChatbotService] Learned from conversation');
    } catch (error) {
      console.error('[ChatbotService] Learning error:', error);
    }
  }
}
