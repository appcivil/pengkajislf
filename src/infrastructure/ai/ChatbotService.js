/**
 * Infrastructure: ChatbotService
 * Implementasi IChatbotService dengan multi-provider AI
 */
import { IChatbotService } from '../../domain/services/IChatbotService.js';
import { MODELS, fetchOpenRouter, parseAIJson } from '../../lib/ai-router.js';
import { supabase } from '../../lib/supabase.js';
import { AdvancedReasoningService } from './AdvancedReasoningService.js';
import { extractTextFromPDF, extractTextFromImage, batchOCRProcess } from '../../lib/ocr-service.js';

export class ChatbotService extends IChatbotService {
  constructor(options = {}) {
    super();
    this.defaultModel = options.model || MODELS.GROQ_REASONING || MODELS.GROQ;
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 4096;
    this.dataProvider = options.dataProvider || null;
    this.memoryService = options.memoryService || null;
    this.reasoningService = new AdvancedReasoningService({
      model: MODELS.GROQ_REASONING || MODELS.GROQ, // Prioritaskan reasoning model
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
    const attachments = options.attachments || [];

    // Process attachments - read file content
    let attachmentContent = '';
    if (attachments && attachments.length > 0) {
      attachmentContent = await this._processAttachments(attachments);
    }

    // Combine message with attachment content
    const fullMessage = attachmentContent
      ? `${message}\n\n=== KONTEN FILE LAMPIRAN ===\n${attachmentContent}`
      : message;

    // Handle reasoning modes
    if (reasoningMode) {
      try {
        let result;
        const reasoningContext = {
          projectData: context.applicationData,
          moduleContext: context.moduleContext,
          userId: context.userId,
          model // Pass selected model
        };

        switch (reasoningMode) {
          case 'think':
            result = await this.reasoningService.think(fullMessage, reasoningContext);
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
            result = await this.reasoningService.deepReason(fullMessage, reasoningContext);
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
            result = await this.reasoningService.research(fullMessage, {
              depth: 'comprehensive',
              sources: ['regulasi', 'standar', 'best_practices'],
              model // Pass selected model
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
            result = await this.reasoningService.daily(reasoningContext.userId, {
              model // Pass selected model
            });
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

    // Build prompt dengan context dan memory (gunakan fullMessage yang sudah include konten lampiran)
    const prompt = this._buildChatPrompt(fullMessage, session, context, memoryContext);

    try {
      // Panggil AI service dengan fallback dan progress reporting
      const response = await this._callAIWithFallback(prompt, model, options, (status, data) => {
        this._dispatchProgressEvent('ai_progress', { status, ...data });
      });

      return {
        content: response.content,
        metadata: {
          model: response.modelUsed || model.id || model,
          tokens: response.tokens,
          finishReason: response.finishReason,
          responseTime: response.responseTime,
          attachments: attachments?.length || 0,
          fallbackUsed: response.fallbackUsed || false
        }
      };
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
    const attachments = options.attachments || [];

    // Process attachments - read file content (same as generateResponse)
    let attachmentContent = '';
    if (attachments && attachments.length > 0) {
      attachmentContent = await this._processAttachments(attachments);
    }

    // Combine message with attachment content
    const fullMessage = attachmentContent
      ? `${message}\n\n=== KONTEN FILE LAMPIRAN ===\n${attachmentContent}`
      : message;

    const prompt = this._buildChatPrompt(fullMessage, session, {});

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

    // System directive: Bahasa Indonesia wajib
    parts.push(`[SYSTEM DIRECTIVE - LANGUAGE PROTOCOL]
Anda adalah AI Assistant untuk Sistem Pengkajian SLF (Sertifikat Laik Fungsi) Indonesia.
✓ WAJIB menggunakan Bahasa Indonesia yang baik dan benar
✓ Gaya bahasa: akademik, teknis, formal, profesional
✓ Hindari slang, singkatan tidak baku, atau campuran bahasa (kecuali istilah teknis standar)
✓ Gunakan terminologi engineering dan perizinan bangunan Indonesia yang tepat
✓ Struktur kalimat: jelas, logis, komprehensif
✓ Prioritaskan kejelasan dan akurasi teknis
---`);
    parts.push('');

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
   * Call AI service with fallback chain and progress reporting
   */
  async _callAIWithFallback(prompt, model, options = {}, onProgress = null) {
    const startTime = Date.now();
    const fallbackChain = this._buildFallbackChain(model);

    let lastError = null;

    for (let i = 0; i < fallbackChain.length; i++) {
      const currentModel = fallbackChain[i];
      const modelName = currentModel.name || currentModel.id || 'Unknown';

      // Report progress
      if (onProgress) {
        if (i === 0) {
          onProgress('Mencoba model utama...', { model: modelName, attempt: i + 1, total: fallbackChain.length });
        } else {
          onProgress(`Model sebelumnya gagal, mencoba fallback ${i}...`, { model: modelName, attempt: i + 1, total: fallbackChain.length, previousError: lastError?.message });
        }
      }

      try {
        const result = await this._callSingleAI(prompt, currentModel, options);

        if (onProgress) {
          onProgress('Berhasil mendapatkan respons!', { model: modelName, responseTime: result.responseTime });
        }

        return {
          ...result,
          modelUsed: modelName,
          fallbackUsed: i > 0
        };
      } catch (error) {
        lastError = error;
        console.warn(`[ChatbotService] Model ${modelName} gagal:`, error.message);

        if (onProgress) {
          onProgress(`Model ${modelName} gagal: ${error.message.substring(0, 50)}...`, { error: error.message, model: modelName });
        }

        // Jeda sebelum retry
        if (i < fallbackChain.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    throw new Error(`Semua model AI gagal. Error terakhir: ${lastError?.message}`);
  }

  /**
   * Build fallback chain of models to try
   */
  _buildFallbackChain(primaryModel) {
    const chain = [primaryModel];

    // Tambahkan model fallback berdasarkan yang tersedia
    const fallbacks = [
      MODELS.GROQ_REASONING,
      MODELS.GROQ,
      MODELS.KIMI,
      MODELS.KIMI_32K,
      MODELS.GEMINI_FLASH,
      MODELS.MISTRAL,
      MODELS.OPENROUTER
    ];

    for (const fallback of fallbacks) {
      if (fallback && fallback.id !== primaryModel?.id) {
        // Hindari duplikat
        if (!chain.some(m => m.id === fallback.id)) {
          chain.push(fallback);
        }
      }
    }

    return chain.filter(m => m); // Hapus null/undefined
  }

  /**
   * Call single AI service (original implementation)
   */
  async _callSingleAI(prompt, model, options = {}) {
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
   * Legacy: Call AI service (single call, no fallback)
   */
  async _callAI(prompt, model, options = {}) {
    return this._callAIWithFallback(prompt, model, options);
  }

  /**
   * Dispatch progress event untuk UI updates
   */
  _dispatchProgressEvent(type, data) {
    const event = new CustomEvent('chat-ai-progress', {
      detail: { type, ...data, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
    console.log(`[ChatbotService] Progress: ${type}`, data);
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

  /**
   * Process attachments - extract file content for AI using DocumentEngine and OCR
   */
  async _processAttachments(attachments) {
    const contents = [];

    for (const file of attachments) {
      try {
        let content = '';
        const fileName = file.name?.toLowerCase() || '';
        const fileType = file.type || '';

        // Determine file type and process accordingly
        if (fileType.startsWith('image/')) {
          // For images, use OCR to extract text
          console.log(`[ChatbotService] Processing image: ${file.name}`);
          content = await this._extractImageContent(file);
        } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
          // For PDFs, use OCR service
          console.log(`[ChatbotService] Processing PDF: ${file.name}`);
          content = await this._extractPDFContent(file);
        } else if (this._isTextFile(file)) {
          // For text files, read as text
          content = await this._fileToText(file);
          if (content.length > 10000) {
            content = content.substring(0, 10000) + '\n... (truncated)';
          }
        } else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // For DOCX, extract text using DocumentEngine
          console.log(`[ChatbotService] Processing DOCX: ${file.name}`);
          content = await this._extractDOCXContent(file);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.csv') ||
                   fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   fileType === 'text/csv') {
          // For spreadsheets, extract tables
          console.log(`[ChatbotService] Processing spreadsheet: ${file.name}`);
          content = await this._extractSpreadsheetContent(file);
        } else if (fileName.endsWith('.pptx') || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          // For PowerPoint, extract slides
          console.log(`[ChatbotService] Processing PPTX: ${file.name}`);
          content = await this._extractPPTXContent(file);
        } else {
          // For other files, note the type
          content = `[File: ${file.name}, Type: ${file.type || 'unknown'}, Size: ${this._formatFileSize(file.size)}]\nNote: File content extraction not supported for this file type.`;
        }

        contents.push(`--- ${file.name} ---\n${content}`);
      } catch (error) {
        console.error(`[ChatbotService] Error processing attachment ${file.name}:`, error);
        contents.push(`--- ${file.name} ---\nError: ${error.message || 'Could not read file content'}`);
      }
    }

    return contents.join('\n\n');
  }

  /**
   * Extract content from image using OCR
   */
  async _extractImageContent(file) {
    try {
      const result = await extractTextFromImage(file, {
        language: 'ind',
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] ${file.name}: ${(m.progress * 100).toFixed(0)}%`);
          }
        }
      });

      if (result.success && result.text?.trim()) {
        let content = `[Image: ${file.name}]\n`;
        content += `Extracted Text:\n${result.text}`;
        if (result.confidence) {
          content += `\n\nOCR Confidence: ${result.confidence}%`;
        }
        return content;
      } else {
        // Fallback to base64 if no text extracted
        const base64 = await this._fileToBase64(file);
        return `[Image: ${file.name}]\nBase64: ${base64.substring(0, 100)}... (truncated)\nNote: No text could be extracted from this image.`;
      }
    } catch (error) {
      console.error(`[ChatbotService] OCR error for ${file.name}:`, error);
      return `[Image: ${file.name}]\nError during OCR: ${error.message}`;
    }
  }

  /**
   * Extract content from PDF using OCR service with chunking support
   */
  async _extractPDFContent(file, options = {}) {
    const maxPages = options.maxPages || 50; // Increased from 10 to 50
    const chunkSize = options.chunkSize || 12000; // Characters per chunk

    try {
      const result = await extractTextFromPDF(file, {
        extractImages: true,
        maxPages,
        onProgress: (current, total, msg) => {
          console.log(`[PDF OCR] ${file.name}: ${msg}`);
        }
      });

      if (result.success && result.fullText?.trim()) {
        let fullText = result.fullText;

        // Check if text needs chunking
        if (fullText.length > chunkSize) {
          console.log(`[ChatbotService] PDF ${file.name} exceeds ${chunkSize} chars, using chunking`);
          return this._chunkDocumentContent(file.name, fullText, {
            type: 'PDF',
            totalPages: result.numPages,
            hasTables: result.hasTables,
            chunkSize
          });
        }

        let content = `[PDF: ${file.name}, Pages: ${result.numPages}]\n`;
        content += `Extracted Text:\n${fullText}`;

        if (result.hasTables) {
          content += `\n\n[Tables detected in PDF]`;
        }

        return content;
      } else {
        return `[PDF: ${file.name}]\nNote: Could not extract text from this PDF. It may be a scanned image without OCR layer.`;
      }
    } catch (error) {
      console.error(`[ChatbotService] PDF extraction error for ${file.name}:`, error);
      return `[PDF: ${file.name}]\nError during PDF extraction: ${error.message}`;
    }
  }

  /**
   * Chunk large document content into manageable pieces
   */
  _chunkDocumentContent(fileName, fullText, metadata = {}) {
    const { type = 'Document', chunkSize = 12000, totalPages, hasTables } = metadata;

    // Split text into chunks by paragraphs to preserve context
    const chunks = this._splitIntoChunks(fullText, chunkSize);
    const totalChunks = chunks.length;

    let content = `[${type}: ${fileName}`;
    if (totalPages) content += `, Pages: ${totalPages}`;
    content += `]\n`;
    content += `Total Chunks: ${totalChunks}\n`;
    content += `Note: Document is split into ${totalChunks} parts due to size. AI will process all parts.\n\n`;

    if (hasTables) {
      content += `[Tables detected in document]\n\n`;
    }

    // Include all chunks with separators
    chunks.forEach((chunk, index) => {
      content += `=== CHUNK ${index + 1}/${totalChunks} ===\n`;
      content += chunk;
      content += '\n\n';
    });

    return content;
  }

  /**
   * Split text into chunks at paragraph boundaries
   */
  _splitIntoChunks(text, maxChunkSize) {
    const chunks = [];
    const paragraphs = text.split(/\n\n+/);

    let currentChunk = '';

    for (const paragraph of paragraphs) {
      // If single paragraph is too long, split it by sentences
      if (paragraph.length > maxChunkSize) {
        // First, save current chunk if exists
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }

        // Split long paragraph by sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        // Check if adding this paragraph would exceed chunk size
        if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
          chunks.push(currentChunk.trim());
          currentChunk = paragraph + '\n\n';
        } else {
          currentChunk += paragraph + '\n\n';
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Extract content from DOCX file with chunking support
   */
  async _extractDOCXContent(file, options = {}) {
    const chunkSize = options.chunkSize || 12000;

    try {
      // Dynamic import DocumentEngine
      const { default: DocumentEngine } = await import('../pipeline/engines/document-engine.js');
      const engine = new DocumentEngine();
      await engine.initialize();

      const result = await engine.process({ file, type: 'docx' });
      await engine.dispose();

      let fullText = result.text || '';

      // Add structure info if available
      if (result.structure?.length > 0) {
        const headings = result.structure.filter(s => s.level > 0);
        if (headings.length > 0) {
          fullText += '\n\nDocument Structure:\n';
          headings.forEach(h => {
            fullText += `${'  '.repeat(h.level - 1)}- ${h.text}\n`;
          });
        }
      }

      // Check if chunking is needed
      if (fullText.length > chunkSize) {
        console.log(`[ChatbotService] DOCX ${file.name} exceeds ${chunkSize} chars, using chunking`);
        return this._chunkDocumentContent(file.name, fullText, {
          type: 'Document',
          chunkSize
        });
      }

      let content = `[Document: ${file.name}]\n`;
      content += `Extracted Text:\n${fullText}`;

      return content;
    } catch (error) {
      console.error(`[ChatbotService] DOCX extraction error for ${file.name}:`, error);
      return `[Document: ${file.name}]\nError during document extraction: ${error.message}`;
    }
  }

  /**
   * Extract content from spreadsheet (XLSX/CSV) with row limit
   */
  async _extractSpreadsheetContent(file, options = {}) {
    const maxRowsPerSheet = options.maxRowsPerSheet || 100; // Increased from 20 to 100
    const chunkSize = options.chunkSize || 12000;

    try {
      // Dynamic import DocumentEngine
      const { default: DocumentEngine } = await import('../pipeline/engines/document-engine.js');
      const engine = new DocumentEngine();
      await engine.initialize();

      const type = file.name.endsWith('.csv') ? 'csv' : 'xlsx';
      const result = await engine.process({ file, type });
      await engine.dispose();

      let content = `[Spreadsheet: ${file.name}]\n`;
      let fullText = '';

      if (result.tables?.length > 0) {
        result.tables.forEach((table, idx) => {
          fullText += `\n--- Sheet: ${table.name} (${table.rowCount} rows) ---\n`;
          // Show first N rows
          const previewRows = table.data.slice(0, maxRowsPerSheet);
          previewRows.forEach(row => {
            fullText += row.join('\t') + '\n';
          });
          if (table.rowCount > maxRowsPerSheet) {
            fullText += `... (${table.rowCount - maxRowsPerSheet} more rows - not shown)\n`;
          }
        });
      } else if (result.text?.trim()) {
        fullText = result.text;
      }

      // Check if chunking is needed
      if (fullText.length > chunkSize) {
        console.log(`[ChatbotService] Spreadsheet ${file.name} exceeds ${chunkSize} chars, using chunking`);
        return this._chunkDocumentContent(file.name, fullText, {
          type: 'Spreadsheet',
          chunkSize,
          totalSheets: result.tables?.length
        });
      }

      content += fullText;
      return content;
    } catch (error) {
      console.error(`[ChatbotService] Spreadsheet extraction error for ${file.name}:`, error);
      return `[Spreadsheet: ${file.name}]\nError during extraction: ${error.message}`;
    }
  }

  /**
   * Extract content from PowerPoint (PPTX) with chunking support
   */
  async _extractPPTXContent(file, options = {}) {
    const chunkSize = options.chunkSize || 12000;

    try {
      // Dynamic import DocumentEngine
      const { default: DocumentEngine } = await import('../pipeline/engines/document-engine.js');
      const engine = new DocumentEngine();
      await engine.initialize();

      const result = await engine.process({ file, type: 'pptx' });
      await engine.dispose();

      let fullText = '';

      if (result.structure?.length > 0) {
        fullText += `Slides:\n`;
        result.structure.forEach(slide => {
          fullText += `\n--- Slide ${slide.index} ---\n${slide.text}`;
        });
      }

      if (result.text?.trim() && !result.structure?.length) {
        fullText += `Content:\n${result.text}`;
      }

      // Check if chunking is needed
      if (fullText.length > chunkSize) {
        console.log(`[ChatbotService] PPTX ${file.name} exceeds ${chunkSize} chars, using chunking`);
        return this._chunkDocumentContent(file.name, fullText, {
          type: 'Presentation',
          totalSlides: result.structure?.length,
          chunkSize
        });
      }

      let content = `[Presentation: ${file.name}]\n`;
      content += fullText;

      return content;
    } catch (error) {
      console.error(`[ChatbotService] PPTX extraction error for ${file.name}:`, error);
      return `[Presentation: ${file.name}]\nError during extraction: ${error.message}`;
    }
  }

  /**
   * Check if file is a text file that can be read
   */
  _isTextFile(file) {
    const textTypes = [
      'text/', 'application/json', 'application/xml',
      'application/javascript', 'application/typescript',
      'application/x-httpd-php', 'application/x-python-code',
      '.txt', '.md', '.csv', '.json', '.xml', '.js', '.ts',
      '.html', '.css', '.py', '.php', '.java', '.c', '.cpp',
      '.h', '.sql', '.log'
    ];

    const fileName = file.name?.toLowerCase() || '';
    const fileType = file.type?.toLowerCase() || '';

    return textTypes.some(type =>
      fileType.includes(type) || fileName.endsWith(type)
    );
  }

  /**
   * Read file as text
   */
  _fileToText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Read file as base64
   */
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Format file size
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
