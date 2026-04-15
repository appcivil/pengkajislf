/**
 * Canva AI Studio Component
 * AI-powered design and content creation studio
 */
export class CanvaAIStudio {
  constructor(options = {}) {
    this.options = {
      projectId: null,
      onClose: null,
      ...options
    };
    this.element = null;
    this.currentTool = 'design';
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'canva-studio-overlay';
    this.element.innerHTML = `
      <div class="canva-studio-container">
        <div class="canva-studio-header">
          <div class="canva-logo">
            <i class="fas fa-palette"></i>
            <span>AI Design Studio</span>
          </div>
          <div class="canva-actions">
            <button class="btn btn-icon" id="canva-help-btn">
              <i class="fas fa-question-circle"></i>
            </button>
            <button class="btn btn-icon" id="canva-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div class="canva-studio-body">
          <div class="canva-sidebar">
            <div class="tool-sections">
              <button class="tool-section active" data-tool="design">
                <i class="fas fa-paint-brush"></i>
                <span>AI Design</span>
              </button>
              <button class="tool-section" data-tool="template">
                <i class="fas fa-layer-group"></i>
                <span>Templates</span>
              </button>
              <button class="tool-section" data-tool="brand">
                <i class="fas fa-copyright"></i>
                <span>Brand Kit</span>
              </button>
              <button class="tool-section" data-tool="magic">
                <i class="fas fa-wand-magic-sparkles"></i>
                <span>Magic Tools</span>
              </button>
            </div>
            
            <div class="quick-templates">
              <h4>Template SLF</h4>
              <div class="template-grid">
                <div class="template-item" data-template="cover">
                  <div class="template-preview">
                    <i class="fas fa-file-alt"></i>
                  </div>
                  <span>Cover Report</span>
                </div>
                <div class="template-item" data-template="infographic">
                  <div class="template-preview">
                    <i class="fas fa-chart-pie"></i>
                  </div>
                  <span>Infographic</span>
                </div>
                <div class="template-item" data-template="diagram">
                  <div class="template-preview">
                    <i class="fas fa-project-diagram"></i>
                  </div>
                  <span>Diagram</span>
                </div>
                <div class="template-item" data-template="certificate">
                  <div class="template-preview">
                    <i class="fas fa-certificate"></i>
                  </div>
                  <span>Sertifikat</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="canva-workspace">
            <div class="ai-prompt-area">
              <div class="prompt-input-container">
                <i class="fas fa-wand-magic-sparkles ai-icon"></i>
                <input 
                  type="text" 
                  id="ai-design-prompt" 
                  placeholder="Deskripsikan desain yang ingin Anda buat..."
                />
                <button class="btn btn-primary" id="generate-design-btn">
                  <i class="fas fa-bolt"></i>
                  Generate
                </button>
              </div>
              <div class="prompt-suggestions">
                <span class="suggestion-label">Coba:</span>
                <button class="suggestion-chip">Cover laporan SLF professional</button>
                <button class="suggestion-chip">Diagram alir pengkajian</button>
                <button class="suggestion-chip">Infographic standar kebakaran</button>
              </div>
            </div>
            
            <div class="design-canvas-area">
              <div class="canvas-container" id="design-canvas">
                <div class="canvas-placeholder">
                  <i class="fas fa-paint-brush"></i>
                  <p>AI akan menghasilkan desain di sini</p>
                  <span>Masukkan prompt atau pilih template</span>
                </div>
              </div>
              
              <div class="canvas-toolbar">
                <button class="toolbar-btn" title="Undo">
                  <i class="fas fa-undo"></i>
                </button>
                <button class="toolbar-btn" title="Redo">
                  <i class="fas fa-redo"></i>
                </button>
                <div class="toolbar-divider"></div>
                <button class="toolbar-btn" title="Add Text">
                  <i class="fas fa-font"></i>
                </button>
                <button class="toolbar-btn" title="Add Image">
                  <i class="fas fa-image"></i>
                </button>
                <button class="toolbar-btn" title="Add Shape">
                  <i class="fas fa-shapes"></i>
                </button>
                <div class="toolbar-divider"></div>
                <button class="toolbar-btn" title="Background">
                  <i class="fas fa-fill-drip"></i>
                </button>
                <button class="toolbar-btn" title="Animate">
                  <i class="fas fa-film"></i>
                </button>
              </div>
            </div>
            
            <div class="properties-panel">
              <div class="panel-section">
                <h4>AI Style</h4>
                <div class="style-options">
                  <button class="style-btn active" data-style="professional">
                    <i class="fas fa-briefcase"></i>
                    <span>Professional</span>
                  </button>
                  <button class="style-btn" data-style="modern">
                    <i class="fas fa-rocket"></i>
                    <span>Modern</span>
                  </button>
                  <button class="style-btn" data-style="minimal">
                    <i class="fas fa-minus"></i>
                    <span>Minimal</span>
                  </button>
                  <button class="style-btn" data-style="technical">
                    <i class="fas fa-cogs"></i>
                    <span>Technical</span>
                  </button>
                </div>
              </div>
              
              <div class="panel-section">
                <h4>Format Output</h4>
                <div class="format-options">
                  <label class="format-option">
                    <input type="radio" name="format" value="png" checked>
                    <span>PNG</span>
                  </label>
                  <label class="format-option">
                    <input type="radio" name="format" value="jpg">
                    <span>JPG</span>
                  </label>
                  <label class="format-option">
                    <input type="radio" name="format" value="pdf">
                    <span>PDF</span>
                  </label>
                  <label class="format-option">
                    <input type="radio" name="format" value="pptx">
                    <span>PPTX</span>
                  </label>
                </div>
              </div>
              
              <div class="panel-section">
                <h4>Dimensi</h4>
                <div class="dimension-presets">
                  <button class="dim-btn active" data-dims="1920,1080">HD</button>
                  <button class="dim-btn" data-dims="1080,1080">Square</button>
                  <button class="dim-btn" data-dims="1080,1920">Story</button>
                  <button class="dim-btn" data-dims="a4">A4</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="canva-studio-footer">
          <div class="footer-left">
            <span class="ai-status">
              <i class="fas fa-check-circle"></i>
              AI Ready
            </span>
          </div>
          <div class="footer-right">
            <button class="btn btn-secondary" id="save-draft-btn">
              <i class="fas fa-save"></i>
              Simpan Draft
            </button>
            <button class="btn btn-primary" id="export-design-btn">
              <i class="fas fa-download"></i>
              Export
            </button>
          </div>
        </div>
      </div>
    `;

    this._attachEventListeners();
    return this.element;
  }

  _attachEventListeners() {
    // Close button
    this.element.querySelector('#canva-close-btn').addEventListener('click', () => {
      if (this.options.onClose) this.options.onClose();
    });

    // Tool sections
    this.element.querySelectorAll('.tool-section').forEach(btn => {
      btn.addEventListener('click', () => {
        this.element.querySelectorAll('.tool-section').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
        this._onToolChange(this.currentTool);
      });
    });

    // Template items
    this.element.querySelectorAll('.template-item').forEach(item => {
      item.addEventListener('click', () => {
        const template = item.dataset.template;
        this._loadTemplate(template);
      });
    });

    // Style buttons
    this.element.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.element.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Suggestion chips
    this.element.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = this.element.querySelector('#ai-design-prompt');
        input.value = chip.textContent;
        input.focus();
      });
    });

    // Generate button
    this.element.querySelector('#generate-design-btn').addEventListener('click', () => {
      this._generateDesign();
    });

    // Export button
    this.element.querySelector('#export-design-btn').addEventListener('click', () => {
      this._exportDesign();
    });
  }

  _onToolChange(tool) {
    console.log('[CanvaAIStudio] Tool changed:', tool);
    // Implementasi perubahan tool
  }

  _loadTemplate(template) {
    const templates = {
      cover: 'Template cover laporan SLF dengan desain professional',
      infographic: 'Template infographic untuk visualisasi data pengkajian',
      diagram: 'Template diagram alir proses pengkajian teknis',
      certificate: 'Template sertifikat atau dokumen formal'
    };

    const input = this.element.querySelector('#ai-design-prompt');
    input.value = templates[template] || '';
  }

  async _generateDesign() {
    const prompt = this.element.querySelector('#ai-design-prompt').value;
    if (!prompt.trim()) return;

    const canvas = this.element.querySelector('#design-canvas');
    canvas.innerHTML = `
      <div class="generating-indicator">
        <div class="ai-spinner"></div>
        <p>AI sedang membuat desain...</p>
        <span>${prompt}</span>
      </div>
    `;

    // Dispatch event untuk generate
    const event = new CustomEvent('canva-generate', {
      detail: {
        prompt,
        style: this.element.querySelector('.style-btn.active')?.dataset.style || 'professional',
        format: this.element.querySelector('input[name="format"]:checked')?.value || 'png'
      }
    });
    document.dispatchEvent(event);
  }

  _exportDesign() {
    const event = new CustomEvent('canva-export', {
      detail: {
        format: this.element.querySelector('input[name="format"]:checked')?.value || 'png'
      }
    });
    document.dispatchEvent(event);
  }

  showGeneratedResult(result) {
    const canvas = this.element.querySelector('#design-canvas');
    canvas.innerHTML = `
      <div class="generated-result">
        <img src="${result.url}" alt="Generated design" />
        <div class="result-actions">
          <button class="btn btn-secondary" onclick="this.closest('.generated-result').querySelector('img').download">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn btn-secondary">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </div>
    `;
  }

  getElement() {
    return this.element;
  }

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}

// CSS Styles untuk Canva AI Studio
export const canvaStyles = `
.canva-studio-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.canva-studio-container {
  width: 100%;
  max-width: 1400px;
  height: 90vh;
  background: var(--bg-primary, #0f172a);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}

.canva-studio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary, #1e293b);
  border-bottom: 1px solid var(--border-color, #334155);
}

.canva-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.canva-logo i {
  font-size: 1.5rem;
  -webkit-text-fill-color: #8b5cf6;
}

.canva-actions {
  display: flex;
  gap: 0.5rem;
}

.canva-studio-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canva-sidebar {
  width: 280px;
  background: var(--bg-secondary, #1e293b);
  border-right: 1px solid var(--border-color, #334155);
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1.5rem;
}

.tool-sections {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tool-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #94a3b8);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.tool-section:hover {
  background: var(--bg-hover, #334155);
  color: var(--text-primary, #f1f5f9);
}

.tool-section.active {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.tool-section i {
  width: 20px;
  text-align: center;
}

.quick-templates h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.template-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-item:hover {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.template-preview {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-radius: 8px;
  color: white;
  font-size: 1.25rem;
}

.template-item span {
  font-size: 0.75rem;
  color: var(--text-secondary, #94a3b8);
  text-align: center;
}

.canva-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-prompt-area {
  padding: 1.5rem;
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
  border-bottom: 1px solid var(--border-color, #334155);
}

.prompt-input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-primary, #0f172a);
  border: 2px solid var(--border-color, #334155);
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  transition: border-color 0.2s;
}

.prompt-input-container:focus-within {
  border-color: #8b5cf6;
}

.ai-icon {
  color: #8b5cf6;
  font-size: 1.25rem;
}

.prompt-input-container input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary, #f1f5f9);
  font-size: 1rem;
  padding: 0.5rem;
}

.prompt-input-container input:focus {
  outline: none;
}

.prompt-input-container input::placeholder {
  color: var(--text-secondary, #94a3b8);
}

.prompt-suggestions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.suggestion-label {
  font-size: 0.75rem;
  color: var(--text-secondary, #94a3b8);
}

.suggestion-chip {
  padding: 0.375rem 0.75rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  color: #a78bfa;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background: rgba(139, 92, 246, 0.2);
}

.design-canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  background: var(--bg-primary, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.canvas-placeholder {
  text-align: center;
  color: var(--text-secondary, #94a3b8);
}

.canvas-placeholder i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.canvas-placeholder p {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary, #f1f5f9);
}

.generating-indicator {
  text-align: center;
  color: var(--text-secondary, #94a3b8);
}

.ai-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-color, #334155);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary, #1e293b);
  border-top: 1px solid var(--border-color, #334155);
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: var(--bg-hover, #334155);
  color: var(--text-primary, #f1f5f9);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color, #334155);
  margin: 0 0.5rem;
}

.properties-panel {
  width: 260px;
  background: var(--bg-secondary, #1e293b);
  border-left: 1px solid var(--border-color, #334155);
  padding: 1rem;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 1.5rem;
}

.panel-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.style-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.style-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 0.5rem;
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 8px;
  color: var(--text-secondary, #94a3b8);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.style-btn:hover {
  border-color: #8b5cf6;
}

.style-btn.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.style-btn i {
  font-size: 1.25rem;
}

.format-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--text-secondary, #94a3b8);
}

.format-option:has(input:checked) {
  background: rgba(139, 92, 246, 0.15);
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.format-option input {
  display: none;
}

.dimension-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dim-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-color, #334155);
  border-radius: 6px;
  color: var(--text-secondary, #94a3b8);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.dim-btn:hover, .dim-btn.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.canva-studio-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary, #1e293b);
  border-top: 1px solid var(--border-color, #334155);
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #22c55e;
}

.footer-right {
  display: flex;
  gap: 0.75rem;
}

.generated-result {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.generated-result img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.result-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}
`;
