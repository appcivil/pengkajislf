/**
 * Web Screenshot Engine
 * Pipeline screenshot otomatis dari internet dengan pendekatan hybrid
 * Menggunakan Puppeteer/Playwright pattern (backend) + frontend rendering
 * @module infrastructure/pipeline/engines/web-screenshot-engine
 */

import { IWebEngine } from '../../../core/smart-ai/engine-interface.js';

/**
 * Engine untuk screenshot web dan content extraction
 */
export class WebScreenshotEngine extends IWebEngine {
  constructor(config = {}) {
    super('WebScreenshotEngine', config);
    
    this.supportedTypes = ['url', 'html'];
    
    // API endpoint untuk screenshot (akan menggunakan Supabase Edge Function)
    this.apiEndpoint = config.apiEndpoint || '/functions/v1/screenshot';
    this.proxyUrl = config.proxyUrl || null;
    
    // Timeout settings
    this.timeout = config.timeout || 30000;
    this.waitUntil = config.waitUntil || 'networkidle2';
    
    // Viewport settings
    this.defaultViewport = {
      width: config.viewportWidth || 1920,
      height: config.viewportHeight || 1080,
      deviceScaleFactor: config.deviceScaleFactor || 1
    };
    
    // Search settings
    this.searchEngine = config.searchEngine || 'duckduckgo';
  }

  /**
   * Inisialisasi engine
   * @returns {Promise<boolean>}
   */
  async initialize() {
    this.isInitialized = true;
    return true;
  }

  /**
   * Proses URL - screenshot dan ekstrak konten
   * @param {Object} input - Input dengan url atau query
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async process(input, options = {}) {
    await this.initialize();
    
    const { url, query } = input;
    
    let targetUrl = url;
    
    // Jika input adalah query, search dulu
    if (!targetUrl && query) {
      const searchResults = await this.search(query, { limit: 1 });
      if (searchResults.length > 0) {
        targetUrl = searchResults[0].url;
      } else {
        throw new Error('Tidak menemukan URL dari query');
      }
    }

    if (!targetUrl) {
      throw new Error('URL atau query diperlukan');
    }

    // Screenshot
    const screenshot = await this.screenshot(targetUrl, {
      fullPage: options.fullPage !== false,
      width: options.width,
      height: options.height,
      selector: options.selector // Screenshot specific element
    });

    // Ekstrak konten
    const content = await this.extractContent(targetUrl);
    
    // Segmentasi konten
    const segments = await this.segment(content.text || content);

    return {
      success: true,
      url: targetUrl,
      screenshot: screenshot.blob,
      screenshotBase64: screenshot.base64,
      content: segments,
      metadata: {
        title: content.title,
        description: content.description,
        timestamp: new Date().toISOString(),
        viewport: screenshot.viewport
      }
    };
  }

  /**
   * Search query untuk mendapatkan URL
   * @param {string} query - Query pencarian
   * @param {Object} options - Options
   * @returns {Promise<Array<Object>>}
   */
  async search(query, options = {}) {
    const limit = options.limit || 5;
    
    // Gunakan DuckDuckGo Instant Answer API (no key required)
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    try {
      // Fallback: Gunakan search sederhana dengan CORS proxy
      // Di production, gunakan Supabase Edge Function
      if (this.proxyUrl) {
        const response = await fetch(`${this.proxyUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        if (response.ok) {
          return await response.json();
        }
      }

      // Fallback: Return mock results untuk development
      return this._generateMockSearchResults(query, limit);
    } catch (error) {
      console.error('[WebScreenshotEngine] Search error:', error);
      return this._generateMockSearchResults(query, limit);
    }
  }

  /**
   * Screenshot halaman web
   * @param {string} url - URL target
   * @param {Object} options - Options screenshot
   * @returns {Promise<Object>}
   */
  async screenshot(url, options = {}) {
    // Di production, gunakan Supabase Edge Function dengan Puppeteer/Playwright
    // Untuk development, gunakan html2canvas untuk halaman yang bisa diakses

    try {
      // Coba menggunakan Edge Function jika tersedia
      if (this._isEdgeFunctionAvailable()) {
        return await this._screenshotViaEdgeFunction(url, options);
      }

      // Fallback: Client-side screenshot untuk halaman same-origin atau CORS-friendly
      return await this._screenshotClientSide(url, options);
    } catch (error) {
      console.error('[WebScreenshotEngine] Screenshot error:', error);
      
      // Return placeholder untuk development
      return {
        blob: null,
        base64: null,
        viewport: this.defaultViewport,
        error: error.message
      };
    }
  }

  /**
   * Ekstrak konten dari halaman
   * @param {string} url - URL target
   * @returns {Promise<Object>}
   */
  async extractContent(url) {
    try {
      // Fetch dengan CORS proxy jika diperlukan
      const fetchUrl = this.proxyUrl ? `${this.proxyUrl}/fetch?url=${encodeURIComponent(url)}` : url;
      
      const response = await fetch(fetchUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Parse menggunakan DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Ekstrak metadata
      const title = doc.querySelector('title')?.textContent || '';
      const description = doc.querySelector('meta[name="description"]')?.content || '';
      
      // Ekstrak konten utama (menggunakan readability-like approach)
      const mainContent = this._extractMainContent(doc);

      return {
        title,
        description,
        text: mainContent.text,
        html: mainContent.html,
        url
      };
    } catch (error) {
      console.error('[WebScreenshotEngine] Content extraction error:', error);
      
      return {
        title: '',
        description: '',
        text: `Error extracting content: ${error.message}`,
        html: '',
        url
      };
    }
  }

  /**
   * Segmentasi konten (heading, paragraf, tabel)
   * @param {string} content - Konten HTML atau teks
   * @returns {Promise<Array<Object>>}
   */
  async segment(content) {
    const segments = [];
    
    if (typeof content === 'string') {
      // Jika konten adalah HTML
      if (content.includes('<')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Extract headings
        doc.querySelectorAll('h1, h2, h3, h4').forEach((el, i) => {
          segments.push({
            id: `heading-${i}`,
            type: 'heading',
            level: parseInt(el.tagName[1]),
            text: el.textContent.trim(),
            tagName: el.tagName.toLowerCase()
          });
        });
        
        // Extract paragraphs
        doc.querySelectorAll('p').forEach((el, i) => {
          const text = el.textContent.trim();
          if (text.length > 20) {
            segments.push({
              id: `paragraph-${i}`,
              type: 'paragraph',
              text: text.substring(0, 300)
            });
          }
        });
        
        // Extract tables
        doc.querySelectorAll('table').forEach((table, i) => {
          const rows = [];
          table.querySelectorAll('tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent.trim());
            rows.push(cells);
          });
          
          segments.push({
            id: `table-${i}`,
            type: 'table',
            rows: rows.slice(0, 10) // Limit rows
          });
        });
      } else {
        // Plain text - split by paragraphs
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
        
        paragraphs.forEach((para, i) => {
          // Deteksi heading
          if (/^(Pasal|Bab|Bagian|#+\s)/i.test(para)) {
            segments.push({
              id: `heading-${i}`,
              type: 'heading',
              level: 2,
              text: para.trim()
            });
          } else {
            segments.push({
              id: `paragraph-${i}`,
              type: 'paragraph',
              text: para.trim().substring(0, 300)
            });
          }
        });
      }
    }

    return segments;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Check if Edge Function is available
   * @private
   */
  _isEdgeFunctionAvailable() {
    // Check berdasarkan konfigurasi
    return !!this.apiEndpoint;
  }

  /**
   * Screenshot via Edge Function (Puppeteer/Playwright)
   * @private
   */
  async _screenshotViaEdgeFunction(url, options) {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        fullPage: options.fullPage,
        viewport: {
          width: options.width || this.defaultViewport.width,
          height: options.height || this.defaultViewport.height
        },
        selector: options.selector,
        waitUntil: this.waitUntil,
        timeout: this.timeout
      })
    });

    if (!response.ok) {
      throw new Error(`Edge Function error: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert base64 ke blob
    const byteCharacters = atob(data.screenshot);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    return {
      blob,
      base64: data.screenshot,
      viewport: data.viewport || this.defaultViewport
    };
  }

  /**
   * Client-side screenshot untuk development/testing
   * @private
   */
  async _screenshotClientSide(url, options) {
    // Buka di iframe hidden dan screenshot menggunakan html2canvas
    // Ini terbatas oleh CORS
    
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1920px;height:1080px;';
      iframe.src = url;
      
      iframe.onload = async () => {
        try {
          // Gunakan html2canvas jika tersedia
          const { default: html2canvas } = await import('html2canvas');
          const canvas = await html2canvas(iframe.contentDocument.body);
          
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          const base64 = canvas.toDataURL('image/png');
          
          document.body.removeChild(iframe);
          
          resolve({
            blob,
            base64,
            viewport: this.defaultViewport
          });
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };
      
      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Failed to load URL in iframe'));
      };
      
      document.body.appendChild(iframe);
      
      // Timeout
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
          reject(new Error('Screenshot timeout'));
        }
      }, this.timeout);
    });
  }

  /**
   * Extract main content dari dokumen
   * @private
   */
  _extractMainContent(doc) {
    // Coba cari main content areas
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '#content',
      'body'
    ];

    let mainElement = null;
    
    for (const selector of selectors) {
      mainElement = doc.querySelector(selector);
      if (mainElement) break;
    }

    if (mainElement) {
      // Remove script dan style elements
      mainElement.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());
      
      return {
        text: mainElement.textContent.trim(),
        html: mainElement.innerHTML
      };
    }

    return {
      text: doc.body?.textContent.trim() || '',
      html: doc.body?.innerHTML || ''
    };
  }

  /**
   * Generate mock search results untuk development
   * @private
   */
  _generateMockSearchResults(query, limit) {
    return [
      {
        title: `Search Result for: ${query}`,
        url: `https://example.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Mock search result for development purposes.`
      }
    ];
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    this.isInitialized = false;
  }
}

export default WebScreenshotEngine;
