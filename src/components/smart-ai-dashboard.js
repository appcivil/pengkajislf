/**
 * SmartAI Pipeline Dashboard Component
 * UI untuk testing dan monitoring SmartAI Pipeline
 * @module components/smart-ai-dashboard
 */

import { getPipelineIntegration } from '../infrastructure/pipeline/pipeline-integration.js';

/**
 * Render SmartAI Dashboard
 * @returns {string} HTML string
 */
export function renderSmartAIDashboard() {
  return `
    <div class="smart-ai-dashboard">
      <div class="dashboard-header">
        <h2><i class="fas fa-robot"></i> SmartAI Pipeline Dashboard</h2>
        <p class="subtitle">Test dan monitoring seluruh pipeline AI</p>
      </div>

      <div class="dashboard-grid">
        <!-- File Upload Section -->
        <div class="dashboard-card upload-section">
          <h3><i class="fas fa-cloud-upload-alt"></i> File Upload</h3>
          <div class="upload-zone" id="smartai-upload-zone">
            <div class="upload-prompt">
              <i class="fas fa-file-import"></i>
              <p>Drag & drop file atau klik untuk browse</p>
              <small>Support: DOCX, XLSX, PPTX, PDF, JPG, PNG, DXF</small>
            </div>
            <input type="file" id="smartai-file-input" multiple 
                   accept=".docx,.xlsx,.pptx,.pdf,.jpg,.jpeg,.png,.gif,.dxf,.dwg" 
                   style="display: none;">
          </div>
          <div class="upload-options">
            <label>
              <input type="checkbox" id="enable-ocr" checked> Enable OCR
            </label>
            <label>
              <input type="checkbox" id="enable-rag" checked> Index ke RAG
            </label>
          </div>
        </div>

        <!-- RAG Query Section -->
        <div class="dashboard-card query-section">
          <h3><i class="fas fa-search"></i> RAG Query</h3>
          <div class="query-input-group">
            <input type="text" id="rag-query-input" 
                   placeholder="Tanya tentang dokumen... (contoh: 'apa itu SLF?')"
                   class="query-input">
            <button id="rag-query-btn" class="btn btn-primary">
              <i class="fas fa-paper-plane"></i> Query
            </button>
          </div>
          <div class="query-context">
            <label>Context Documents:</label>
            <select id="rag-context-select" multiple size="3">
              <option value="all">All Documents</option>
            </select>
          </div>
        </div>

        <!-- Job Monitor Section -->
        <div class="dashboard-card jobs-section">
          <h3><i class="fas fa-tasks"></i> Job Monitor</h3>
          <div class="jobs-filter">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="pending">Pending</button>
            <button class="filter-btn" data-filter="processing">Processing</button>
            <button class="filter-btn" data-filter="completed">Completed</button>
          </div>
          <div class="jobs-list" id="jobs-list">
            <div class="empty-state">Belum ada job</div>
          </div>
        </div>

        <!-- Pipeline Stats Section -->
        <div class="dashboard-card stats-section">
          <h3><i class="fas fa-chart-line"></i> Pipeline Stats</h3>
          <div class="stats-grid" id="pipeline-stats">
            <div class="stat-item">
              <span class="stat-value" id="stat-total-jobs">0</span>
              <span class="stat-label">Total Jobs</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="stat-active-jobs">0</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="stat-completed-jobs">0</span>
              <span class="stat-label">Completed</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="stat-cache-hits">0</span>
              <span class="stat-label">Cache Hits</span>
            </div>
          </div>
        </div>

        <!-- Results Section -->
        <div class="dashboard-card results-section full-width">
          <h3><i class="fas fa-file-alt"></i> Results Preview</h3>
          <div class="results-tabs">
            <button class="tab-btn active" data-tab="extracted">Extracted Text</button>
            <button class="tab-btn" data-tab="ocr">OCR Result</button>
            <button class="tab-btn" data-tab="chunks">RAG Chunks</button>
            <button class="tab-btn" data-tab="raw">Raw JSON</button>
          </div>
          <div class="results-content" id="results-content">
            <div class="empty-state">Pilih job untuk melihat hasil</div>
          </div>
        </div>

        <!-- Export Section -->
        <div class="dashboard-card export-section">
          <h3><i class="fas fa-download"></i> Export Results</h3>
          <div class="export-buttons">
            <button id="export-docx-btn" class="btn btn-secondary">
              <i class="fas fa-file-word"></i> DOCX
            </button>
            <button id="export-xlsx-btn" class="btn btn-secondary">
              <i class="fas fa-file-excel"></i> XLSX
            </button>
            <button id="export-json-btn" class="btn btn-secondary">
              <i class="fas fa-file-code"></i> JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize dashboard interactivity
 */
export function initSmartAIDashboard() {
  const pipeline = getPipelineIntegration();
  const jobs = new Map();
  let currentJobId = null;

  // File Upload Zone
  const uploadZone = document.getElementById('smartai-upload-zone');
  const fileInput = document.getElementById('smartai-file-input');

  uploadZone.addEventListener('click', () => fileInput.click());
  
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  });

  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
  });

  // Process files
  async function processFiles(files) {
    const enableOCR = document.getElementById('enable-ocr').checked;
    const enableRAG = document.getElementById('enable-rag').checked;

    for (const file of files) {
      try {
        const job = await pipeline.processFile(file, {
          ocr: enableOCR,
          indexToRAG: enableRAG,
          priority: 'normal'
        });

        jobs.set(job.id, { ...job, fileName: file.name });
        addJobToList(job, file.name);
        
        // Monitor job progress
        monitorJob(job.id);
      } catch (error) {
        console.error('Error processing file:', error);
        alert(`Error: ${error.message}`);
      }
    }
  }

  // Monitor job progress
  function monitorJob(jobId) {
    const interval = setInterval(async () => {
      const status = pipeline.getJobStatus(jobId);
      if (!status) return;

      updateJobStatus(jobId, status);

      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(interval);
        if (status.status === 'completed' && currentJobId === jobId) {
          showJobResults(status);
        }
      }
    }, 1000);
  }

  // Add job to list
  function addJobToList(job, fileName) {
    const jobsList = document.getElementById('jobs-list');
    
    // Remove empty state
    const emptyState = jobsList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const jobEl = document.createElement('div');
    jobEl.className = 'job-item';
    jobEl.id = `job-${job.id}`;
    jobEl.innerHTML = `
      <div class="job-info">
        <span class="job-filename">${fileName}</span>
        <span class="job-type">${job.type}</span>
      </div>
      <div class="job-status">
        <span class="status-badge pending">pending</span>
      </div>
      <div class="job-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
        <span class="progress-text">0%</span>
      </div>
    `;

    jobEl.addEventListener('click', () => {
      currentJobId = job.id;
      document.querySelectorAll('.job-item').forEach(el => el.classList.remove('selected'));
      jobEl.classList.add('selected');
      
      const status = pipeline.getJobStatus(job.id);
      if (status?.status === 'completed') {
        showJobResults(status);
      }
    });

    jobsList.insertBefore(jobEl, jobsList.firstChild);
    updateStats();
  }

  // Update job status UI
  function updateJobStatus(jobId, status) {
    const jobEl = document.getElementById(`job-${jobId}`);
    if (!jobEl) return;

    const statusBadge = jobEl.querySelector('.status-badge');
    const progressFill = jobEl.querySelector('.progress-fill');
    const progressText = jobEl.querySelector('.progress-text');

    statusBadge.className = `status-badge ${status.status}`;
    statusBadge.textContent = status.status;

    progressFill.style.width = `${status.progress}%`;
    progressText.textContent = `${status.progress}%`;

    updateStats();
  }

  // Show job results
  function showJobResults(status) {
    const resultsContent = document.getElementById('results-content');
    
    if (status.result) {
      resultsContent.innerHTML = `
        <pre class="result-json">${JSON.stringify(status.result, null, 2)}</pre>
      `;
    } else {
      resultsContent.innerHTML = '<div class="empty-state">No results available</div>';
    }
  }

  // Update stats
  function updateStats() {
    const stats = pipeline.getStats();
    document.getElementById('stat-total-jobs').textContent = stats.totalJobs || 0;
    document.getElementById('stat-active-jobs').textContent = 
      (stats.queueStats?.active || 0) + (stats.queueStats?.queued || 0);
    document.getElementById('stat-completed-jobs').textContent = 
      stats.queueStats?.completed || 0;
  }

  // RAG Query
  const queryBtn = document.getElementById('rag-query-btn');
  const queryInput = document.getElementById('rag-query-input');

  queryBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) return;

    queryBtn.disabled = true;
    queryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
      const result = await pipeline.query(query, { sync: true });
      
      const resultsContent = document.getElementById('results-content');
      resultsContent.innerHTML = `
        <div class="rag-result">
          <div class="query-section">
            <strong>Query:</strong> ${query}
          </div>
          <div class="chunks-section">
            <strong>Relevant Chunks (${result.chunkCount}):</strong>
            ${result.chunks?.map((chunk, i) => `
              <div class="chunk-item">
                <div class="chunk-header">[${i + 1}] Similarity: ${(chunk.similarity * 100).toFixed(1)}%</div>
                <div class="chunk-text">${chunk.text?.substring(0, 200)}...</div>
              </div>
            `).join('') || '<p>No relevant chunks found</p>'}
          </div>
          ${result.response ? `
            <div class="response-section">
              <strong>AI Response:</strong>
              <div class="ai-response">${result.response}</div>
            </div>
          ` : ''}
        </div>
      `;
    } catch (error) {
      console.error('Query error:', error);
      alert(`Query failed: ${error.message}`);
    } finally {
      queryBtn.disabled = false;
      queryBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Query';
    }
  });

  queryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') queryBtn.click();
  });

  // Export buttons
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    const resultsContent = document.getElementById('results-content');
    const jsonText = resultsContent.querySelector('.result-json')?.textContent;
    
    if (jsonText) {
      const blob = new Blob([jsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pipeline-result.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  // Initial stats update
  updateStats();
}

/**
 * Dashboard page component
 * @returns {Object} Page object
 */
export function smartAIDashboardPage() {
  return {
    html: renderSmartAIDashboard(),
    afterRender: initSmartAIDashboard
  };
}

export default smartAIDashboardPage;
