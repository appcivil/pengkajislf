/**
 * Image Editor Component
 * Provides a canvas-based drawing interface for annotating inspection photos.
 */
import { openModal, closeModal } from './modal.js';

/**
 * Opens the image editor for a given image file or data URL.
 * @param {File|string} source - The image file or data URL to edit.
 * @returns {Promise<string>} - Resolves with the base64 data URL of the edited image.
 */
export async function openImageEditor(source) {
  return new Promise((resolve, reject) => {
    let imgSrc = '';
    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => startEditor(e.target.result, resolve, reject);
      reader.readAsDataURL(source);
    } else {
      startEditor(source, resolve, reject);
    }
  });
}

function startEditor(imgSrc, resolve, reject) {
  const canvasId = 'annotation-canvas';
  const body = `
    <div class="image-editor-container" style="display:flex; flex-direction:column; gap:12px;">
      <div class="editor-toolbar" style="display:flex; align-items:center; gap:12px; padding:8px; background:var(--bg-elevated); border-radius:var(--radius-md);">
        <div class="tool-group" style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:0.75rem; font-weight:600; color:var(--text-tertiary);">PENA:</label>
          <button class="btn btn-icon btn-sm active" id="tool-pen" title="Pena Gambar"><i class="fas fa-pen"></i></button>
          <input type="color" id="pen-color" value="#ef4444" style="width:30px; height:30px; border:none; border-radius:4px; cursor:pointer; background:none;">
          <select id="pen-size" class="form-select" style="width:80px; padding:4px 8px; font-size:0.75rem;">
            <option value="2">Tipis</option>
            <option value="5" selected>Sedang</option>
            <option value="10">Tebal</option>
            <option value="20">Sangat Tebal</option>
          </select>
        </div>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" id="tool-undo" title="Urungkan"><i class="fas fa-undo"></i></button>
        <button class="btn btn-secondary btn-sm" id="tool-clear" title="Hapus Semua"><i class="fas fa-trash-can"></i></button>
      </div>
      
      <div id="canvas-wrapper" style="position:relative; width:100%; height:450px; background:#000; border-radius:var(--radius-md); overflow:hidden; display:flex; align-items:center; justify-content:center; cursor:crosshair;">
        <canvas id="${canvasId}" style="max-width:100%; max-height:100%; object-fit:contain;"></canvas>
      </div>
      
      <div class="editor-hint" style="font-size:0.7rem; color:var(--text-tertiary); text-align:center;">
        <i class="fas fa-info-circle"></i> Gunakan pena merah untuk menandai area kritis (retak, korosi, lendutan, dll) sebelum dianalisis AI.
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="editor-cancel">Batal</button>
    <button class="btn btn-primary" id="editor-save">Simpan & Analisis AI <i class="fas fa-arrow-right"></i></button>
  `;

  openModal({
    title: 'Anotasi Foto Lapangan',
    body,
    footer,
    size: 'lg',
    onClose: () => resolve(null)
  });

  // Initialize Canvas Logic
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  let isDrawing = false;
  let history = [];
  
  img.onload = () => {
    // Set canvas dimensions based on image aspect ratio
    const maxWidth = 800; // Consistent max working size
    const scale = Math.min(maxWidth / img.width, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    saveHistory(); // Initial state
  };
  img.src = imgSrc;

  function saveHistory() {
    if (history.length > 20) history.shift();
    history.push(canvas.toDataURL());
  }

  function undo() {
    if (history.length > 1) {
      history.pop();
      const prev = new Image();
      prev.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(prev, 0, 0);
      };
      prev.src = history[history.length - 1];
    }
  }

  const getPointerPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    isDrawing = true;
    const pos = getPointerPos(e.touches ? e.touches[0] : e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = document.getElementById('pen-size').value;
    ctx.lineCap = 'round';
    ctx.strokeStyle = document.getElementById('pen-color').value;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPointerPos(e.touches ? e.touches[0] : e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      isDrawing = false;
      ctx.closePath();
      saveHistory();
    }
  };

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);
  
  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
  window.addEventListener('touchend', stopDrawing);

  // Toolbar events
  document.getElementById('tool-undo').onclick = undo;
  document.getElementById('tool-clear').onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  document.getElementById('editor-cancel').onclick = () => {
    closeModal();
    resolve(null);
  };

  document.getElementById('editor-save').onclick = () => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    closeModal();
    resolve(dataUrl);
  };
}
