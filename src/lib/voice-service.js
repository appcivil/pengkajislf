/**
 * VOICE SERVICE
 * Wrapper for Web Speech API and Technical Formalization
 */

export class VoiceService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.supported = false;
      return;
    }
    this.supported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'id-ID';
    this.recognition.interimResults = false;
    this.recognition.continuous = false;
  }

  start(onResult, onError) {
    if (!this.supported) {
      if (onError) onError('Browser tidak mendukung Speech Recognition.');
      return;
    }

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      if (onError) onError(event.error);
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn("Recognition already started or error:", e);
    }
  }

  stop() {
    if (this.supported) this.recognition.stop();
  }

  /**
   * Formalize a spoken raw note into professional engineering language using AI
   */
  async formalize(rawText) {
    if (!rawText || rawText.length < 5) return rawText;

    const { MODELS, safeCall, fetchGemini, parseAIJson } = await import('./ai-router.js');
    
    const prompt = `
      Anda adalah AI Ahli Pengkaji SLF.
      Tugas: Ubah catatan suara kasar berikut menjadi kalimat teknis formal berstandar PUPR.
      
      Catatan Kasar: "${rawText}"
      
      Output MURNI HASIL FORMAL (Tanpa pengantar):
    `;

    try {
      // Use Flash model for speed
      const res = await fetchGemini(MODELS.GEMINI, prompt);
      return res.replace(/["']/g, '').trim();
    } catch (e) {
      console.error("Formalization failed:", e);
      return rawText; // Fallback to raw
    }
  }
}

export const voiceService = new VoiceService();
