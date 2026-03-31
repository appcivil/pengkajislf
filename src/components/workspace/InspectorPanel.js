/**
 * WORKSPACE INSPECTOR PANEL
 * The "Heart" of the workspace providing deep document intelligence.
 */
import { store, updateWorkspace } from '../../lib/store.js';
import { escHtml } from '../../lib/utils.js';

export function renderInspector() {
  const { workspace, files, ui } = store.get();
  if (!ui.inspectorOpen) return `<div class="workspace-inspector collapsed"></div>`;

  const file = (files.documents || []).find(f => f.id === workspace.selectedFileId);

  if (!file) {
    return `
      <div class="workspace-inspector p-6 animate-fade-in">
         <div class="flex-column gap-6">
            <div class="p-6 bg-brand-50 rounded-xl border border-brand-100 text-center">
               <i class="fas fa-heartbeat text-3xl text-brand-500 mb-3"></i>
               <h3 class="font-bold">Project Health</h3>
               <p class="text-xs text-secondary mt-1">Audit kelengkapan dokumen SIMBG untuk proyek ini.</p>
               <button class="btn btn-primary btn-sm mt-4 w-full" onclick="window._triggerProjectAudit()">
                  <i class="fas fa-stethoscope"></i> Jalankan Audit
               </button>
            </div>

            <div id="project-audit-results" class="flex-column gap-4">
               <div class="text-xs opacity-0.4 italic text-center p-8">Pilih berkas untuk melihat detail AI, atau jalankan audit proyek untuk melihat ringkasan kesehatan data.</div>
            </div>
         </div>
      </div>
    `;
  }

  const tabs = [
    { id: 'preview', label: 'Preview', icon: 'fa-eye' },
    { id: 'ai', label: 'AI Insight', icon: 'fa-bolt' },
    { id: 'info', label: 'Details', icon: 'fa-info' },
    { id: 'evidence', label: 'Evidence', icon: 'fa-camera' },
    { id: 'versions', label: 'Versions', icon: 'fa-history' }
  ];

  return `
    <div class="workspace-inspector animate-slide-in">
       <!-- Header -->
       <div class="flex-column gap-2 p-6 border-bottom">
          <div class="fm-file-icon has-file ${file.name.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : ''}" style="width:100%; height:120px; margin-bottom:12px; border-radius:12px">
             <i class="fas ${file.name.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file'}" style="font-size:2rem"></i>
          </div>
          <h3 class="font-extrabold text-h truncate" title="${file.subcategory}">${escHtml(file.subcategory)}</h3>
          <div class="flex-between items-center">
             <div class="flex items-center gap-2">
                <div class="status-dot ${file.status === 'Final' ? 'green' : 'yellow'}"></div>
                <span class="text-xs font-bold">${file.status || 'Draft'}</span>
             </div>
             <span class="text-xs text-tertiary">v${file.version || 1.0}</span>
          </div>
       </div>

       <!-- Tab Controls -->
       <div class="inspector-tabs">
          ${tabs.map(t => `
            <button class="inspector-tab-btn ${workspace.activeInspectorTab === t.id ? 'active shadow-sm' : ''}" 
                    onclick="window._handleInspectorTab('${t.id}')">
               ${t.label}
            </button>
          `).join('')}
       </div>

       <!-- Tab Content -->
       <div class="inspector-content p-6 flex-1 overflow-y-auto">
          ${renderTabContent(file, workspace.activeInspectorTab)}
       </div>

       <!-- Footer Actions -->
       <div class="p-6 border-top flex gap-2">
          <button class="btn btn-primary btn-sm flex-1 font-bold" onclick="window.open('${file.file_url}', '_blank')">
             <i class="fas fa-external-link-alt"></i> Open File
          </button>
          <button class="btn btn-secondary btn-sm" title="Compare with another version" onclick="window._startCompare('${file.id}')">
             <i class="fas fa-columns"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window._analyzeFile('${file.id}')">
             <i class="fas fa-sync"></i>
          </button>
       </div>
    </div>
  `;
}

function renderTabContent(file, activeId) {
  switch (activeId) {
    case 'ai':
      return `
        <div class="ai-insight-card animate-slide-in" style="border-left:4px solid #8b5cf6">
           <h4 class="text-brand-500"><i class="fas fa-magic"></i> AI Assessment</h4>
           <div class="text-xs text-secondary leading-relaxed mb-4">
              ${file.ai_summary || "AI is analyzing this document. It looks like a building structure calculation report."}
           </div>
           
           <h4 class="mt-6"><i class="fas fa-tasks"></i> Validation Results</h4>
           <ul class="text-xs list-none p-0 flex-column gap-3">
              <li class="flex items-center gap-2">
                 <i class="fas fa-check-circle text-success"></i>
                 <span>Structure Consistency Check passed</span>
              </li>
              <li class="flex items-center gap-2">
                 <i class="fas fa-exclamation-triangle text-warning"></i>
                 <span>Missing soil investigation attachment</span>
              </li>
              <li class="flex items-center gap-2">
                 <i class="fas fa-check-circle text-success"></i>
                 <span>Standard SNI 1726:2019 reference detected</span>
              </li>
           </ul>

           <h4 class="mt-6"><i class="fas fa-lightbulb"></i> Recommendations</h4>
           <div class="text-xs p-3 rounded-lg" style="background:#f5f3ff; color:#5b21b6; border:1px solid #ddd6fe">
             Periksa kembali bagian perhitungan balok bentang panjang di halaman 45.
           </div>
        </div>
      `;
    case 'info':
      return `
         <div class="metadata-grid flex-column gap-4">
            <div class="flex-column">
               <span class="form-label">File Type</span>
               <span class="text-sm font-bold uppercase">${file.name.split('.').pop()}</span>
            </div>
            <div class="flex-column">
               <span class="form-label">Size</span>
               <span class="text-sm font-bold">2.4 MB</span>
            </div>
            <div class="flex-column">
               <span class="form-label">Workspace Path</span>
               <span class="text-xs text-tertiary truncate">/projects/audit/structure</span>
            </div>
            <div class="flex-column">
               <span class="form-label">Created At</span>
               <span class="text-sm font-bold">${new Date(file.created_at).toLocaleString()}</span>
            </div>
            <div class="flex-column">
               <span class="form-label">Tags</span>
               <div class="flex gap-1 mt-1 flex-wrap">
                  ${(file.metadata?.tags || ['Structural', 'Audit 2026']).map(t => `<span class="badge badge-secondary" style="font-size:0.55rem; padding:1px 6px">${t}</span>`).join('')}
                  <button class="btn btn-ghost btn-xs" onclick="window._addTag('${file.id}')"><i class="fas fa-plus"></i></button>
               </div>
            </div>
         </div>
      `;
    case 'preview':
      return `
        <div style="height:100%; border-radius:12px; background:rgba(0,0,0,0.05); flex-center text-center p-8">
           <div class="flex-column gap-3">
              <i class="fas fa-file-pdf text-4xl opacity-0.2"></i>
              <p class="text-xs font-bold opacity-0.4">Preview not available in this view</p>
              <button class="btn btn-ghost btn-xs" onclick="window.open('${file.file_url}', '_blank')">View Full Screen</button>
           </div>
        </div>
      `;
    case 'evidence':
      return `
        <div class="evidence-grid flex-column gap-3">
           <div class="p-3 rounded-lg border flex gap-3 items-center bg-gray-50">
              <div style="width:40px; height:40px; background:#ddd; border-radius:4px" class="flex-center">
                 <i class="fas fa-image opacity-0.3"></i>
              </div>
              <div class="flex-column flex-1">
                 <span class="text-xs font-bold">Foto Retak Balok B1</span>
                 <span class="text-xs text-tertiary">Site Visit - 28 Mar 2026</span>
              </div>
              <i class="fas fa-link text-brand-500 text-xs"></i>
           </div>
           <div class="p-3 rounded-lg border flex gap-3 items-center bg-gray-50">
              <div style="width:40px; height:40px; background:#ddd; border-radius:4px" class="flex-center">
                 <i class="fas fa-image opacity-0.3"></i>
              </div>
              <div class="flex-column flex-1">
                 <span class="text-xs font-bold">Uji Core Drill Lantai 2</span>
                 <span class="text-xs text-tertiary">Lab Test - 25 Mar 2026</span>
              </div>
              <i class="fas fa-link text-brand-500 text-xs"></i>
           </div>
           <button class="btn btn-ghost btn-xs mt-2" onclick="alert('Pilih foto dari Evidence Vault untuk dihubungkan.')">
              <i class="fas fa-plus"></i> Hubungkan Evidence Baru
           </button>
        </div>
      `;
    case 'versions':
      return `
        <div class="timeline flex-column gap-4">
           <div class="flex gap-4 items-start pb-4 border-bottom">
              <div class="status-dot green mt-2"></div>
              <div class="flex-column">
                 <span class="text-sm font-bold">Current Version (3.0)</span>
                 <span class="text-xs text-tertiary">31 Mar 2026, 17:45</span>
                 <p class="text-xs mt-1">Finalized calculation results</p>
              </div>
           </div>
           <div class="flex gap-4 items-start pb-4 border-bottom opacity-0.6">
              <div class="status-dot yellow mt-2"></div>
              <div class="flex-column">
                 <span class="text-sm font-bold">Revision 2 (2.4)</span>
                 <span class="text-xs text-tertiary">25 Mar 2026, 10:20</span>
                 <p class="text-xs mt-1">Updated loading parameters</p>
              </div>
           </div>
        </div>
      `;
    default: return '';
  }
}

window._handleInspectorTab = (id) => {
  updateWorkspace({ activeInspectorTab: id });
};

window._analyzeFile = (id) => {
   const btn = event.currentTarget;
   btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
   setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-sync"></i>';
      alert("AI Analysis completed for file " + id);
   }, 1500);
};
