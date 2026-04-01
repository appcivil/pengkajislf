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

    const { MODELS, fetchGemini } = await import('./ai-router.js');
    
    const prompt = `
      Anda adalah AI Ahli Pengkaji SLF.
      Tugas: Ubah catatan suara kasar berikut menjadi kalimat teknis formal berstandar PUPR.
      
      Catatan Kasar: "${rawText}"
      
      Output MURNI HASIL FORMAL (Tanpa pengantar):
    `;

    try {
      const res = await fetchGemini(MODELS.GEMINI, prompt);
      return res.replace(/["']/g, '').trim();
    } catch (e) {
      console.error("Formalization failed:", e);
      return rawText;
    }
  }

  /**
   * INFER STATUS FROM SPEECH (COMMAND ENGINE)
   * Heuristic + AI identification of checklist status from voice.
   */
  async inferStatus(rawText, options = []) {
    const text = rawText.toLowerCase();
    
    // 1. Fast Heuristics (Local, Instant)
    if (text.includes('sesuai') || text.includes('bagus') || text.includes('aman') || text.includes('berfungsi')) {
      return 'sesuai';
    }
    if (text.includes('tidak ada') || text.includes('belum ada') || text.includes('hilang')) {
      return 'tidak_ada';
    }
    if (text.includes('rusak') || text.includes('retak') || text.includes('patah') || text.includes('bocor')) {
      return 'rusak';
    }

    // 2. Intelligent Inference (AI)
    const { MODELS, fetchGemini } = await import('./ai-router.js');
    const prompt = `
      Konteks: Audit Bangunan SLF.
      Catatan Suara: "${rawText}"
      Opsi Status: ${options.map(o => o.value).join(', ')}
      
      Pilih status paling relevan dari opsi di atas berdasarkan catatan suara tersebut.
      HANYA OUTPUT NILAI KATA KUNCI STATUS (Tanpa penjelasan):
    `;

    try {
      const res = await fetchGemini(MODELS.GEMINI, prompt);
      const cleaned = res.toLowerCase().trim();
      return options.find(o => cleaned.includes(o.value.toLowerCase()))?.value || null;
    } catch (e) {
      return null;
    }
  }
}

export const voiceService = new VoiceService();
