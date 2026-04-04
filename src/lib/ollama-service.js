/**
 * OLLAMA SERVICE UTILITY
 * Logic untuk berkomunikasi dengan server Ollama lokal.
 */
import { getSettings, saveSettings } from './settings.js';

/**
 * Mengambil daftar model dari Ollama lokal.
 */
export async function fetchLocalModels() {
  const settings = await getSettings();
  const endpoint = settings.ai.ollamaEndpoint || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
    
    const data = await response.json();
    const models = data.models || [];
    
    // Simpan hasil scan ke settings
    settings.ai.availableLocalModels = models.map(m => m.name);
    
    // Auto-detect gemma3:27b jika ada dan belum diatur
    if (models.some(m => m.name === 'gemma3:27b') && !settings.ai.ollamaModel) {
      settings.ai.ollamaModel = 'gemma3:27b';
    } else if (models.length > 0 && !settings.ai.ollamaModel) {
      settings.ai.ollamaModel = models[0].name;
    }
    
    await saveSettings(settings);
    return models;
  } catch (err) {
    console.error('[Ollama] Failed to fetch models:', err);
    throw new Error('Koneksi ke Ollama gagal. Pastikan Ollama berjalan dan OLLAMA_ORIGINS="*" sudah diatur.');
  }
}

/**
 * Menjalankan completion menggunakan Ollama.
 */
export async function generateOllamaCompletion(prompt, systemPrompt = '', model = 'gemma3:27b') {
  const settings = await getSettings();
  const endpoint = settings.ai.ollamaEndpoint || 'http://localhost:11434';
  
  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.9,
        num_ctx: 32000 // High context for deep reasoning
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Ollama API Error: ${response.status}`);
  }

  const result = await response.json();
  return result.message.content;
}
