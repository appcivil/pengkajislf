/**
 * Canva AI Studio Page
 * Page untuk AI-powered design studio
 */
import { CanvaAIStudio, canvaStyles } from '../components/chatbot/CanvaAIStudio.js';

import { bindGlobal } from '../lib/global-listeners.js';
/**
 * Canva Studio Page
 */
export async function canvaStudioPage(params = {}) {
  const page = document.createElement('div');
  page.className = 'page canva-page';

  // Add styles
  const styleEl = document.createElement('style');
  styleEl.textContent = canvaStyles;
  page.appendChild(styleEl);

  // Create Canva Studio
  const canvaStudio = new CanvaAIStudio({
    projectId: params.projectId || null,
    onClose: () => window.navigate('dashboard')
  });

  const studioEl = canvaStudio.render();
  page.appendChild(studioEl);

  // Setup event listeners
  setupCanvaEventListeners(canvaStudio);

  return page;
}

/**
 * Setup Canva event listeners
 */
function setupCanvaEventListeners(canvaStudio) {
  // Guard idempoten: fungsi ini dipanggil dari render yang bisa berjalan
  // berkali-kali (setiap kunjungan halaman / render ulang). Listener pada
  // `window`/`document` TIDAK ikut terhapus saat DOM halaman diganti,
  // sehingga tanpa guard setiap kunjungan menambah satu set listener baru —
  // handler berjalan berkali-kali dan memori terus tumbuh.
  if (setupCanvaEventListeners._bound) return;
  setupCanvaEventListeners._bound = true;

  // Generate design
  bindGlobal(document, 'canva-generate', async (e) => {
    const { prompt, style, format } = e.detail;
    
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show result
      canvaStudio.showGeneratedResult({
        url: '/assets/placeholder-design.png',
        prompt,
        style,
        format
      });
    } catch (error) {
      console.error('Error generating design:', error);
    }
  });

  // Export design
  bindGlobal(document, 'canva-export', async (e) => {
    const { format } = e.detail;
    
    try {
      console.log('Exporting design as:', format);
      // Implementasi export
    } catch (error) {
      console.error('Error exporting design:', error);
    }
  });
}

/**
 * After render callback
 */
export function afterCanvaStudioRender(params = {}) {
  // Focus input
  setTimeout(() => {
    const input = document.querySelector('#ai-design-prompt');
    if (input) input.focus();
  }, 100);
}

// Export untuk lazy loading
export default {
  canvaStudioPage,
  afterCanvaStudioRender
};
