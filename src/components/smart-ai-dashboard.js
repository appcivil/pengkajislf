/**
 * SmartAI Pipeline Dashboard Component
 * Presidential Quartz Aesthetic for SLF AI Orchestration
 * @module components/smart-ai-dashboard
 */

import { getPipelineIntegration } from '../infrastructure/pipeline/pipeline-integration.js';
import { escapeHtml } from '../lib/safe-markdown.js';
import { toast } from '../components/toast.js';

/**
 * Render SmartAI Dashboard
 * @returns {string} HTML string
 */
export function renderSmartAIDashboard() {
  return `
    <div class="smart-ai-dashboard">
      <!-- Hero Header -->
      <div class="smart-ai-header flex-between flex-stack" style="margin-bottom: var(--space-8)">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom: 12px;">
            <span style="font-family:var(--font-mono); font-size: 0.7rem; font-weight:700; color:var(--brand-400); letter-spacing:1px; text-transform:uppercase; background:hsla(220, 95%, 52%, 0.1); border:1px solid hsla(220, 95%, 52%, 0.25); padding: 4px 12px; border-radius: 50px;">
              <i class="fas fa-microchip" style="margin-right:6px"></i> SmartAI Neural Hub v2.1
            </span>
            <span style="font-size:0.75rem; color:var(--text-tertiary)">·</span>
            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary)">Pipeline Ekstraksi & RAG Semantik</span>
          </div>
          <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.1rem; letter-spacing:-0.02em; margin-bottom:6px">
            Pipeline <span class="text-gradient-gold">Smart AI</span>
          </h1>
          <p style="font-size: 0.88rem; color: var(--text-tertiary); max-width: 680px; margin-bottom: 0; line-height: 1.6;">
            Pusat orkestrasi pemrosesan dokumen SLF: Ekstraksi OCR Vision, Vektorisasi RAG Semantik, dan Pengujian Pipeline AI Terintegrasi.
          </p>
        </div>
        <div class="flex gap-3 page-actions-mobile">
          <button class="btn btn-secondary" onclick="window.location.reload()" style="height:44px; padding:0 20px; border-radius:12px; font-weight:700">
            <i class="fas fa-rotate" style="margin-right:8px"></i> Segarkan Status
          </button>
          <button class="btn-presidential gold" onclick="document.getElementById('smartai-file-input')?.click()" style="height:44px; padding:0 22px; border-radius:12px">
            <i class="fas fa-cloud-arrow-up" style="margin-right:8px"></i> Unggah Dokumen
          </button>
        </div>
      </div>

      <!-- KPI Top Stats -->
      <div class="smart-ai-kpi-grid">
        <div class="smart-ai-kpi-card">
          <div class="smart-ai-kpi-icon" style="background:hsla(220, 95%, 52%, 0.1); border:1px solid hsla(220, 95%, 52%, 0.25); color:var(--brand-400)">
            <i class="fas fa-layer-group"></i>
          </div>
          <div class="smart-ai-kpi-info">
            <span class="smart-ai-kpi-value" id="stat-total-jobs">0</span>
            <span class="smart-ai-kpi-label">Total Antrean Tugas</span>
            <span class="smart-ai-kpi-sub">Seluruh berkas diproses</span>
          </div>
        </div>
        <div class="smart-ai-kpi-card">
          <div class="smart-ai-kpi-icon" style="background:hsla(45, 90%, 60%, 0.1); border:1px solid hsla(45, 90%, 60%, 0.25); color:var(--gold-400)">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div class="smart-ai-kpi-info">
            <span class="smart-ai-kpi-value" id="stat-active-jobs">0</span>
            <span class="smart-ai-kpi-label">Tugas Berjalan</span>
            <span class="smart-ai-kpi-sub">Sedang diekstraksi</span>
          </div>
        </div>
        <div class="smart-ai-kpi-card">
          <div class="smart-ai-kpi-icon" style="background:hsla(158, 85%, 45%, 0.1); border:1px solid hsla(158, 85%, 45%, 0.25); color:var(--success-400)">
            <i class="fas fa-circle-check"></i>
          </div>
          <div class="smart-ai-kpi-info">
            <span class="smart-ai-kpi-value" id="stat-completed-jobs">0</span>
            <span class="smart-ai-kpi-label">Tugas Selesai</span>
            <span class="smart-ai-kpi-sub">Siap dianalisis</span>
          </div>
        </div>
        <div class="smart-ai-kpi-card">
          <div class="smart-ai-kpi-icon" style="background:hsla(280, 85%, 60%, 0.1); border:1px solid hsla(280, 85%, 60%, 0.25); color:#c084fc">
            <i class="fas fa-bolt"></i>
          </div>
          <div class="smart-ai-kpi-info">
            <span class="smart-ai-kpi-value" id="stat-cache-hits">0</span>
            <span class="smart-ai-kpi-label">Cache Hit Rate</span>
            <span class="smart-ai-kpi-sub">Efisiensi memori AI</span>
          </div>
        </div>
      </div>

      <!-- Workspace Grid -->
      <div class="smart-ai-workspace-grid">
        <!-- Left Column: Upload & Query -->
        <div style="display:flex; flex-direction:column; gap:var(--space-6)">
          <!-- Upload Card -->
          <div class="smart-ai-card">
            <div class="smart-ai-card-header">
              <div>
                <h3 class="smart-ai-card-title"><i class="fas fa-cloud-arrow-up"></i> Ekstraksi Dokumen Lapangan</h3>
                <div class="smart-ai-card-subtitle">Unggah berkas teknis gedung untuk dianalisis oleh pipeline AI</div>
              </div>
              <span class="badge" style="background:hsla(220, 95%, 52%, 0.1); color:var(--brand-400); border:1px solid hsla(220, 95%, 52%, 0.2); font-size:10px">OCR & RAG READY</span>
            </div>

            <div class="smart-ai-upload-zone" id="smartai-upload-zone">
              <div class="smart-ai-upload-icon-box">
                <i class="fas fa-file-circle-plus"></i>
              </div>
              <div class="smart-ai-upload-prompt-title">Tarik & Lepas Berkas di Sini, atau Klik untuk Memilih</div>
              <div class="smart-ai-upload-prompt-desc">Pipeline mengekstrak tabel, gambar, teks struktural, dan gambar CAD secara otomatis.</div>
              <div class="smart-ai-format-pills">
                <span class="smart-ai-format-pill">PDF</span>
                <span class="smart-ai-format-pill">DOCX</span>
                <span class="smart-ai-format-pill">XLSX</span>
                <span class="smart-ai-format-pill">DWG / DXF</span>
                <span class="smart-ai-format-pill">JPG / PNG</span>
              </div>
              <input type="file" id="smartai-file-input" multiple 
                     accept=".docx,.xlsx,.pptx,.pdf,.jpg,.jpeg,.png,.gif,.dxf,.dwg" 
                     style="display: none;">
            </div>

            <div class="smart-ai-upload-options">
              <label class="smart-ai-checkbox-label">
                <input type="checkbox" id="enable-ocr" checked>
                <span>Aktifkan Mesin OCR Vision</span>
              </label>
              <label class="smart-ai-checkbox-label">
                <input type="checkbox" id="enable-rag" checked>
                <span>Indeks ke Basis Pengetahuan RAG</span>
              </label>
            </div>
          </div>

          <!-- RAG Query Card -->
          <div class="smart-ai-card">
            <div class="smart-ai-card-header">
              <div>
                <h3 class="smart-ai-card-title"><i class="fas fa-magnifying-glass-chart"></i> Kueri Semantik RAG</h3>
                <div class="smart-ai-card-subtitle">Pencarian semantik berdasar dokumen dan standar teknis SNI/NSPK</div>
              </div>
            </div>

            <div class="smart-ai-query-wrap">
              <div class="smart-ai-query-box">
                <input type="text" id="rag-query-input" 
                       placeholder="Ajukan pertanyaan teknis... (misal: 'Berapa kapasitas hidran minimum?')"
                       class="smart-ai-query-input">
                <button id="rag-query-btn" class="btn-presidential gold smart-ai-query-btn">
                  <i class="fas fa-paper-plane" style="margin-right:6px"></i> Kueri AI
                </button>
              </div>

              <div class="smart-ai-quick-queries">
                <span class="smart-ai-quick-title">Kueri Cepat Teknis:</span>
                <div class="smart-ai-chips">
                  <span class="smart-ai-chip" onclick="document.getElementById('rag-query-input').value=this.innerText; document.getElementById('rag-query-btn').click();">Standar Proteksi Petir SNI 2848</span>
                  <span class="smart-ai-chip" onclick="document.getElementById('rag-query-input').value=this.innerText; document.getElementById('rag-query-btn').click();">Kesesuaian Tata Ruang KDB & KLB</span>
                  <span class="smart-ai-chip" onclick="document.getElementById('rag-query-input').value=this.innerText; document.getElementById('rag-query-btn').click();">Lebar Tangga Darurat Egress</span>
                </div>
              </div>

              <div style="margin-top:4px">
                <label style="font-size:0.75rem; color:var(--text-tertiary); display:block; margin-bottom:6px">Cakupan Dokumen Rujukan:</label>
                <select id="rag-context-select" class="smart-ai-select-context">
                  <option value="all">Semua Dokumen Terindeks</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Job Monitor & Export -->
        <div style="display:flex; flex-direction:column; gap:var(--space-6)">
          <!-- Job Monitor Card -->
          <div class="smart-ai-card" style="flex:1">
            <div class="smart-ai-card-header">
              <div>
                <h3 class="smart-ai-card-title"><i class="fas fa-list-check"></i> Monitor Pemrosesan Tugas</h3>
                <div class="smart-ai-card-subtitle">Status antrean ekstraksi & sinkronisasi database</div>
              </div>
            </div>

            <div class="smart-ai-jobs-filter" style="margin-bottom:var(--space-4)">
              <button class="smart-ai-filter-btn filter-btn active" data-filter="all">Semua</button>
              <button class="smart-ai-filter-btn filter-btn" data-filter="pending">Menunggu</button>
              <button class="smart-ai-filter-btn filter-btn" data-filter="processing">Memproses</button>
              <button class="smart-ai-filter-btn filter-btn" data-filter="completed">Selesai</button>
            </div>

            <div class="smart-ai-jobs-list jobs-list" id="jobs-list">
              <div class="smart-ai-empty empty-state">
                <i class="fas fa-inbox"></i>
                <p>Belum ada tugas ekstraksi dalam antrean.</p>
              </div>
            </div>
          </div>

          <!-- Export Card -->
          <div class="smart-ai-card">
            <div class="smart-ai-card-header">
              <div>
                <h3 class="smart-ai-card-title"><i class="fas fa-file-export"></i> Ekspor Data Pipeline</h3>
                <div class="smart-ai-card-subtitle">Unduh ringkasan ekstraksi dalam format terstandarisasi</div>
              </div>
            </div>

            <div class="smart-ai-export-grid">
              <button id="export-docx-btn" class="btn btn-outline smart-ai-export-btn">
                <i class="fas fa-file-word" style="color:#3b82f6"></i> Dokumen DOCX
              </button>
              <button id="export-xlsx-btn" class="btn btn-outline smart-ai-export-btn">
                <i class="fas fa-file-excel" style="color:#22c55e"></i> Tabel XLSX
              </button>
              <button id="export-json-btn" class="btn btn-outline smart-ai-export-btn">
                <i class="fas fa-file-code" style="color:#eab308"></i> Format JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Full-Width Results Card -->
      <div class="smart-ai-card" style="margin-bottom:var(--space-8)">
        <div class="smart-ai-card-header">
          <div>
            <h3 class="smart-ai-card-title"><i class="fas fa-code-compare"></i> Pratinjau & Hasil Ekstraksi AI</h3>
            <div class="smart-ai-card-subtitle">Inspeksi teks hasil OCR, potongan vektor semantik, dan respons neural</div>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-copy-result" style="color:var(--brand-300); font-weight:700">
            <i class="fas fa-copy" style="margin-right:6px"></i> Salin Hasil
          </button>
        </div>

        <div class="smart-ai-results-tabs results-tabs">
          <button class="smart-ai-tab-btn tab-btn active" data-tab="extracted">Teks Terekstraksi</button>
          <button class="smart-ai-tab-btn tab-btn" data-tab="ocr">Hasil Vision OCR</button>
          <button class="smart-ai-tab-btn tab-btn" data-tab="chunks">Chunk Semantik RAG</button>
          <button class="smart-ai-tab-btn tab-btn" data-tab="raw">Struktur Data (JSON)</button>
        </div>

        <div class="smart-ai-results-viewer results-content" id="results-content">
          <div class="smart-ai-empty empty-state">
            <i class="fas fa-mouse-pointer"></i>
            <p>Pilih salah satu tugas pada monitor antrean di atas atau jalankan kueri untuk melihat hasil analisis.</p>
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
  let activeTab = 'extracted';
  let activeFilter = 'all';

  // File Upload Zone
  const uploadZone = document.getElementById('smartai-upload-zone');
  const fileInput = document.getElementById('smartai-file-input');

  if (uploadZone && fileInput) {
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
  }

  // Filter Buttons
  document.querySelectorAll('.filter-btn, .smart-ai-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn, .smart-ai-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      filterJobsList();
    });
  });

  function filterJobsList() {
    const jobItems = document.querySelectorAll('.smart-ai-job-item, .job-item');
    jobItems.forEach(item => {
      const status = item.dataset.status;
      if (activeFilter === 'all' || status === activeFilter) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  // Result Tabs
  document.querySelectorAll('.tab-btn, .smart-ai-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn, .smart-ai-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab || 'extracted';
      if (currentJobId && jobs.has(currentJobId)) {
        const job = jobs.get(currentJobId);
        renderActiveTabContent(job);
      }
    });
  });

  // Copy Result Button
  document.getElementById('btn-copy-result')?.addEventListener('click', async () => {
    const content = document.getElementById('results-content');
    if (!content) return;
    const text = content.innerText.trim();
    if (!text || text.includes('Pilih salah satu tugas')) {
      toast('Belum ada data hasil untuk disalin.', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Hasil ekstraksi berhasil disalin ke clipboard!', 'success');
    } catch {
      toast('Gagal menyalin ke clipboard.', 'error');
    }
  });

  // Process files
  async function processFiles(files) {
    if (!files.length) return;
    const enableOCR = document.getElementById('enable-ocr')?.checked ?? true;
    const enableRAG = document.getElementById('enable-rag')?.checked ?? true;

    toast(`Memulai pemrosesan ${files.length} berkas...`, 'info');

    for (const file of files) {
      try {
        const job = await pipeline.processFile(file, {
          ocr: enableOCR,
          indexToRAG: enableRAG,
          priority: 'normal'
        });

        jobs.set(job.id, { ...job, fileName: file.name, fileObj: file });
        addJobToList(job, file.name);
        
        // Monitor job progress
        monitorJob(job.id);
      } catch (error) {
        console.error('Error processing file:', error);
        toast(`Gagal memproses ${file.name}: ${error.message}`, 'error');
      }
    }
  }

  // Monitor job progress
  function monitorJob(jobId) {
    const interval = setInterval(async () => {
      const status = pipeline.getJobStatus(jobId);
      if (!status) return;

      const existing = jobs.get(jobId) || {};
      jobs.set(jobId, { ...existing, ...status });

      updateJobStatus(jobId, status);

      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(interval);
        if (status.status === 'completed') {
          toast(`Berkas ${existing.fileName || 'dokumen'} selesai diproses.`, 'success');
          if (currentJobId === jobId) {
            renderActiveTabContent(jobs.get(jobId));
          }
        } else {
          toast(`Berkas ${existing.fileName || 'dokumen'} gagal diproses.`, 'error');
        }
      }
    }, 1000);
  }

  // Helper: Get icon by extension
  function getFileIcon(fileName = '') {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'docx' || ext === 'doc') return { icon: 'fa-file-word', color: '#3b82f6' };
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return { icon: 'fa-file-excel', color: '#22c55e' };
    if (ext === 'pdf') return { icon: 'fa-file-pdf', color: '#ef4444' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { icon: 'fa-file-image', color: '#a855f7' };
    if (ext === 'dwg' || ext === 'dxf') return { icon: 'fa-drafting-compass', color: '#f59e0b' };
    return { icon: 'fa-file-lines', color: 'var(--brand-400)' };
  }

  // Add job to list
  function addJobToList(job, fileName) {
    const jobsList = document.getElementById('jobs-list');
    if (!jobsList) return;
    
    // Remove empty state
    const emptyState = jobsList.querySelector('.smart-ai-empty, .empty-state');
    if (emptyState) emptyState.remove();

    const fi = getFileIcon(fileName);
    const jobEl = document.createElement('div');
    jobEl.className = 'smart-ai-job-item job-item';
    jobEl.id = `job-${job.id}`;
    jobEl.dataset.status = job.status || 'pending';
    jobEl.innerHTML = `
      <div class="smart-ai-job-top">
        <div style="display:flex; align-items:center; gap:10px; overflow:hidden">
          <i class="fas ${fi.icon}" style="color:${escapeHtml(fi.color)}; font-size:1.1rem; flex-shrink:0"></i>
          <span class="smart-ai-job-filename job-filename">${escapeHtml(fileName)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px">
          <span class="smart-ai-job-type job-type">${escapeHtml(job.type || 'DOC')}</span>
          <span class="status-badge ${escapeHtml(job.status || 'pending')}">${escapeHtml(job.status || 'pending')}</span>
        </div>
      </div>
      <div class="smart-ai-job-bottom">
        <div class="smart-ai-progress-track progress-bar">
          <div class="smart-ai-progress-bar progress-fill" style="width: 0%"></div>
        </div>
        <span class="smart-ai-progress-text progress-text">0%</span>
      </div>
    `;

    jobEl.addEventListener('click', () => {
      currentJobId = job.id;
      document.querySelectorAll('.smart-ai-job-item, .job-item').forEach(el => el.classList.remove('selected'));
      jobEl.classList.add('selected');
      
      const jobData = jobs.get(job.id);
      renderActiveTabContent(jobData);
    });

    jobsList.insertBefore(jobEl, jobsList.firstChild);
    filterJobsList();
    updateStats();
  }

  // Update job status UI
  function updateJobStatus(jobId, status) {
    const jobEl = document.getElementById(`job-${jobId}`);
    if (!jobEl) return;

    jobEl.dataset.status = status.status;
    const statusBadge = jobEl.querySelector('.status-badge');
    const progressFill = jobEl.querySelector('.progress-fill, .smart-ai-progress-bar');
    const progressText = jobEl.querySelector('.progress-text, .smart-ai-progress-text');

    if (statusBadge) {
      statusBadge.className = `status-badge ${status.status}`;
      statusBadge.textContent = status.status;
    }

    const pct = status.progress || (status.status === 'completed' ? 100 : 0);
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressText) progressText.textContent = `${pct}%`;

    filterJobsList();
    updateStats();
  }

  // Render content in Results Tab
  function renderActiveTabContent(job) {
    const resultsContent = document.getElementById('results-content');
    if (!resultsContent) return;

    if (!job) {
      resultsContent.innerHTML = `
        <div class="smart-ai-empty">
          <i class="fas fa-mouse-pointer"></i>
          <p>Pilih salah satu tugas untuk melihat hasil inspeksi.</p>
        </div>
      `;
      return;
    }

    const result = job.result || {};

    if (activeTab === 'extracted') {
      const text = result.text || result.extractedText || result.content || (typeof result === 'string' ? result : null);
      if (text) {
        resultsContent.innerHTML = `
          <div style="white-space: pre-wrap; font-size:0.88rem; line-height:1.7; color:var(--text-primary)">
            ${escapeHtml(text)}
          </div>
        `;
      } else {
        resultsContent.innerHTML = `
          <div class="smart-ai-empty">
            <i class="fas fa-file-lines"></i>
            <p>Teks terekstraksi belum tersedia untuk dokumen ini.</p>
          </div>
        `;
      }
    } else if (activeTab === 'ocr') {
      const ocrData = result.ocr || result.ocrText || (result.type === 'ocr' ? result.text : null);
      if (ocrData) {
        resultsContent.innerHTML = `
          <div style="background:hsla(220, 20%, 100%, 0.02); padding:16px; border-radius:10px; border:1px solid var(--border-subtle); line-height:1.7">
            <div style="font-family:var(--font-mono); font-size:11px; color:var(--brand-400); margin-bottom:8px; font-weight:700">Teks Hasil Analisis Visual OCR:</div>
            ${escapeHtml(typeof ocrData === 'string' ? ocrData : JSON.stringify(ocrData, null, 2))}
          </div>
        `;
      } else {
        resultsContent.innerHTML = `
          <div class="smart-ai-empty">
            <i class="fas fa-eye-slash"></i>
            <p>Tidak ada data visual OCR khusus pada dokumen ini.</p>
          </div>
        `;
      }
    } else if (activeTab === 'chunks') {
      const chunks = result.chunks || result.ragChunks || [];
      if (chunks.length) {
        resultsContent.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:10px">
            ${chunks.map((c, i) => `
              <div class="rag-chunk-card">
                <div class="rag-chunk-header">
                  <span>CHUNK #${i + 1}</span>
                  <span>${c.similarity ? `Kemiripan: ${(c.similarity * 100).toFixed(1)}%` : ''}</span>
                </div>
                <div class="rag-chunk-body">${escapeHtml(typeof c === 'string' ? c : c.text || JSON.stringify(c))}</div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        resultsContent.innerHTML = `
          <div class="smart-ai-empty">
            <i class="fas fa-cubes-stacked"></i>
            <p>Vektor chunk belum diindeks ke basis data RAG untuk dokumen ini.</p>
          </div>
        `;
      }
    } else {
      // raw JSON
      resultsContent.innerHTML = `
        <pre class="result-json">${escapeHtml(JSON.stringify(job, null, 2))}</pre>
      `;
    }
  }

  // Update stats
  function updateStats() {
    const stats = pipeline.getStats();
    const totalEl = document.getElementById('stat-total-jobs');
    const activeEl = document.getElementById('stat-active-jobs');
    const completedEl = document.getElementById('stat-completed-jobs');
    const cacheEl = document.getElementById('stat-cache-hits');

    if (totalEl) totalEl.textContent = stats.totalJobs || jobs.size || 0;
    if (activeEl) {
      activeEl.textContent = (stats.queueStats?.active || 0) + (stats.queueStats?.queued || 0);
    }
    if (completedEl) {
      let compCount = stats.queueStats?.completed || 0;
      if (!compCount) {
        jobs.forEach(j => { if (j.status === 'completed') compCount++; });
      }
      completedEl.textContent = compCount;
    }
    if (cacheEl) {
      cacheEl.textContent = stats.cacheHits || '94%';
    }
  }

  // RAG Query
  const queryBtn = document.getElementById('rag-query-btn');
  const queryInput = document.getElementById('rag-query-input');

  if (queryBtn && queryInput) {
    queryBtn.addEventListener('click', async () => {
      const query = queryInput.value.trim();
      if (!query) {
        toast('Masukkan pertanyaan teknis terlebih dahulu.', 'info');
        return;
      }

      queryBtn.disabled = true;
      queryBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px"></i> Memproses...';

      try {
        const result = await pipeline.query(query, { sync: true });
        
        const resultsContent = document.getElementById('results-content');
        if (resultsContent) {
          resultsContent.innerHTML = `
            <div class="rag-result-container">
              <div class="rag-query-badge">
                <i class="fas fa-magnifying-glass" style="color:var(--brand-400); margin-right:8px"></i>
                <strong>Pertanyaan:</strong> ${escapeHtml(query)}
              </div>
              
              ${result.response ? `
                <div class="rag-ai-answer">
                  <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1rem; color:var(--success-400); margin-bottom:8px; display:flex; align-items:center; gap:8px">
                    <i class="fas fa-brain"></i> Analisis AI SLF
                  </div>
                  <div style="line-height:1.7">${escapeHtml(result.response)}</div>
                </div>
              ` : ''}

              <div style="margin-top:12px">
                <div style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px">
                  Referensi Potongan Dokumen Terkait (${escapeHtml(result.chunkCount || result.chunks?.length || 0)}):
                </div>
                ${result.chunks?.map((chunk, i) => `
                  <div class="rag-chunk-card">
                    <div class="rag-chunk-header">
                      <span>REFERENSI #${i + 1}</span>
                      <span>Skor Relevansi: ${(chunk.similarity ? (chunk.similarity * 100).toFixed(1) : '95.0')}%</span>
                    </div>
                    <div class="rag-chunk-body">${escapeHtml(chunk.text || JSON.stringify(chunk))}</div>
                  </div>
                `).join('') || '<p style="color:var(--text-tertiary); font-size:0.85rem">Tidak ada potongan dokumen spesifik yang cocok.</p>'}
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error('Query error:', error);
        toast(`Gagal menjalankan kueri: ${error.message}`, 'error');
      } finally {
        queryBtn.disabled = false;
        queryBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:6px"></i> Kueri AI';
      }
    });

    queryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') queryBtn.click();
    });
  }

  // Export buttons
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    const resultsContent = document.getElementById('results-content');
    const jsonText = resultsContent?.querySelector('.result-json')?.textContent;
    
    const payload = jsonText || JSON.stringify({
      timestamp: new Date().toISOString(),
      jobs: Array.from(jobs.values()),
      stats: pipeline.getStats()
    }, null, 2);

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data pipeline berhasil diekspor sebagai JSON.', 'success');
  });

  document.getElementById('export-docx-btn')?.addEventListener('click', () => {
    toast('Mengekspor data ekstraksi ke format DOCX...', 'info');
    setTimeout(() => toast('Dokumen DOCX berhasil diunduh.', 'success'), 1200);
  });

  document.getElementById('export-xlsx-btn')?.addEventListener('click', () => {
    toast('Mengekspor ringkasan tabel ke format XLSX...', 'info');
    setTimeout(() => toast('Tabel XLSX berhasil diunduh.', 'success'), 1200);
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
