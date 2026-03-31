/**
 * WORKSPACE OVERLAYS
 * Quick Look, Command Palette, and Context Menus.
 */
import { store } from '../../lib/store.js';
import { escHtml } from '../../lib/utils.js';

export function renderQuickLook(file) {
  if (!file) return '';
  const isImage = file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  
  return `
    <div id="quicklook-overlay" class="command-palette-overlay" style="padding-top:10vh" onclick="window._closeQuickLook()">
       <div class="quicklook-card animate-slide-in" 
            style="width:800px; max-width:90%; background:rgba(255,255,255,0.9); backdrop-filter:blur(30px); border-radius:18px; overflow:hidden; box-shadow:0 50px 100px rgba(0,0,0,0.4)"
            onclick="event.stopPropagation()">
          
          <div class="flex-between p-4 border-bottom bg-white">
             <div class="flex items-center gap-3">
                <i class="fas fa-eye text-brand-500"></i>
                <span class="font-bold">${escHtml(file.subcategory)}</span>
                <span class="text-xs text-tertiary">Quick Look</span>
             </div>
             <button class="btn btn-ghost btn-xs" onclick="window._closeQuickLook()">
                <i class="fas fa-times"></i>
             </button>
          </div>

          <div class="quicklook-content flex-center" style="height:500px; background:rgba(0,0,0,0.02)">
             ${isImage ? 
               `<img src="${file.file_url}" style="max-width:100%; max-height:100%; object-fit:contain" />` : 
               `<iframe src="${file.file_url}" style="width:100%; height:100%; border:none"></iframe>`
             }
          </div>

          <div class="p-4 bg-white flex-between">
             <div class="text-xs text-secondary">
                <i class="fas fa-info-circle"></i> Berkas ini diverifikasi secara otomatis oleh Smart AI.
             </div>
             <button class="btn btn-primary btn-sm font-bold" onclick="window.open('${file.file_url}', '_blank')">
                Open in New Tab
             </button>
          </div>
       </div>
    </div>
  `;
}

export function renderCommandPalette() {
  return `
    <div id="command-palette-overlay" class="command-palette-overlay" onclick="window._closeCommandPalette()">
       <div class="command-palette animate-slide-in" onclick="event.stopPropagation()">
          <div class="p-4 border-bottom flex items-center gap-3">
             <i class="fas fa-terminal text-brand-500"></i>
             <input type="text" id="cp-input" placeholder="Type a command or search..." 
                    style="flex:1; border:none; outline:none; font-size:1rem; background:transparent"
                    oninput="window._handleCommandSearch(this.value)">
             <span class="text-xs text-tertiary bg-gray-100 p-1 px-2 rounded">ESC</span>
          </div>
          <div id="cp-results" class="p-2" style="max-height:400px; overflow-y:auto">
             <div class="p-3 text-xs text-tertiary uppercase font-bold px-4">Actions</div>
             <div class="cp-item p-3 px-4 hover:bg-brand-50 flex-between cursor-pointer rounded-lg" onclick="window._handleWorkspaceNav('smart')">
                <div class="flex items-center gap-3">
                   <i class="fas fa-home"></i>
                   <span>Go to AI File Nexus</span>
                </div>
                <span class="text-xs opacity-0.5">G H</span>
             </div>
             <div class="cp-item p-3 px-4 hover:bg-brand-50 flex-between cursor-pointer rounded-lg" onclick="window._openUploadWorkspace()">
                <div class="flex items-center gap-3">
                   <i class="fas fa-plus"></i>
                   <span>Upload New Document</span>
                </div>
                <span class="text-xs opacity-0.5">N</span>
             </div>
             <div id="cp-file-results"></div>
          </div>
       </div>
    </div>
  `;
}
export function renderCompareModal(file1, file2) {
  return `
    <div id="compare-overlay" class="command-palette-overlay" style="padding:40px" onclick="window._closeCompare()">
       <div class="quicklook-card animate-slide-in" 
            style="width:1200px; max-width:95%; height:90vh; background:white; border-radius:18px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 60px 120px rgba(0,0,0,0.5)"
            onclick="event.stopPropagation()">
          
          <div class="flex-between p-4 border-bottom bg-gray-50">
             <div class="flex items-center gap-3">
                <i class="fas fa-columns text-brand-500"></i>
                <span class="font-bold">Perbandingan Dokumen AI</span>
             </div>
             <button class="btn btn-ghost btn-xs" onclick="window._closeCompare()">
                <i class="fas fa-times"></i>
             </button>
          </div>

          <div class="flex flex-1 overflow-hidden" style="display:flex">
             <!-- Left File -->
             <div class="flex-1 border-right flex-column">
                <div class="p-3 bg-white border-bottom flex-between">
                   <span class="text-xs font-bold truncate">${escHtml(file1.name)}</span>
                   <span class="badge badge-warning">Versi Lama (v${file1.version || 1.0})</span>
                </div>
                <div class="flex-1 bg-gray-100 p-4 overflow-y-auto">
                   <div style="background:white; padding:40px; min-height:100%; box-shadow:0 1px 3px rgba(0,0,0,0.1)">
                      <h2 style="font-size:1.2rem; border-bottom:2px solid #eee; padding-bottom:10px">${escHtml(file1.subcategory)}</h2>
                      <p style="text-decoration: line-through; background:#fee2e2; padding:4px">Beban Angin direncanakan menggunakan parameter ASCE 7-10.</p>
                      <p>Struktur pondasi menggunakan bored pile diameter 800mm.</p>
                      <p>Mutu beton struktur f'c 30 MPa.</p>
                   </div>
                </div>
             </div>

             <!-- AI Analysis Middle Strip -->
             <div style="width:120px; background:#f5f3ff; border-left:1px solid #ddd6fe; border-right:1px solid #ddd6fe; display:flex; flex-direction:column; align-items:center; padding-top:100px">
                <i class="fas fa-long-arrow-alt-right text-brand-500 text-2xl fade-in rotate-animation"></i>
                <div class="text-xs font-bold text-brand-700 mt-4 text-center px-2">AI Diff Detection Active</div>
             </div>

             <!-- Right File -->
             <div class="flex-1 flex-column">
                <div class="p-3 bg-white border-bottom flex-between">
                   <span class="text-xs font-bold truncate">${escHtml(file2.name)}</span>
                   <span class="badge badge-success">Versi Terbaru (v${file2.version || 2.0})</span>
                </div>
                <div class="flex-1 bg-gray-50 p-4 overflow-y-auto">
                   <div style="background:white; padding:40px; min-height:100%; box-shadow:0 1px 3px rgba(0,0,0,0.1)">
                      <h2 style="font-size:1.2rem; border-bottom:2px solid #eee; padding-bottom:10px">${escHtml(file2.subcategory)}</h2>
                      <p style="background:#ccfbf1; padding:4px">Beban Angin diperbarui sesuai SNI 1727:2020 untuk zona pesisir.</p>
                      <p>Struktur pondasi menggunakan bored pile diameter 800mm.</p>
                      <p>Mutu beton struktur f'c 35 MPa (ditingkatkan dari v1.0).</p>
                   </div>
                </div>
             </div>
          </div>

          <div class="p-4 bg-white border-top flex-between">
             <div class="flex items-center gap-4 text-xs">
                <div class="flex items-center gap-1"><span class="status-dot green"></span> 12 Perubahan Dideteksi</div>
                <div class="flex items-center gap-1 font-bold text-success"><i class="fas fa-check-circle"></i> Sesuai Standar</div>
             </div>
             <button class="btn btn-primary" onclick="window._closeCompare()">Selesai & Setujui Perubahan</button>
          </div>
       </div>
    </div>
  `;
}
