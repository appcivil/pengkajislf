/**
 * CHECKLIST AI SERVICE (HYBRID MULTI-ENGINE)
 * Orchestrates Local JS, Backend Python, and LLM Reasoning.
 */
import { voiceService } from './voice-service.js';
import { analyzeChecklistImage, analyzeComparativeAudit } from './gemini.js';
import { uploadToGoogleDrive, fetchDriveFiles } from './drive.js';
import { store, updateChecklist } from './store.js';
import { getSettings } from './settings.js';
import { registerFileMetadata } from './file-service.js';
import { ADMIN_OPTIONS, CONDITION_OPTIONS } from './checklist-data.js';

// Import correctly from store
const getChecklistState = () => store.get().checklist;

let _activeStream = null;
let _currentFacingMode = 'environment';
let _currentCameraCtx = null; // { kode, nama, kategori }

/**
 * Open Live Camera Viewfinder
 */
export async function openLiveViewfinder(kode, nama, kategori) {
    _currentCameraCtx = { kode, nama, kategori };
    const modal = document.getElementById('camera-modal');
    if (!modal) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: _currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        
        _activeStream = stream;
        const video = document.getElementById('camera-video');
        video.srcObject = stream;
        modal.style.display = 'flex';
        
        // Start GPS tracking for watermark
        startGpsTracking();
        
        // Render Watermark Preview (UI Only)
        renderWmPreview();

    } catch (err) {
        showError("Gagal mengakses kamera: " + err.message);
    }
}

/**
 * Close Viewfinder
 */
export function closeViewfinder() {
    if (_activeStream) {
        _activeStream.getTracks().forEach(track => track.stop());
        _activeStream = null;
    }
    const modal = document.getElementById('camera-modal');
    if (modal) modal.style.display = 'none';
}

/**
 * Switch Camera (Front/Back)
 */
export async function flipCamera() {
    _currentFacingMode = _currentFacingMode === 'environment' ? 'user' : 'environment';
    closeViewfinder();
    const { kode, nama, kategori } = _currentCameraCtx;
    openLiveViewfinder(kode, nama, kategori);
}

/**
 * CAPTURE PHOTO WITH WATERMARK SYNTHESIS
 */
export async function takePhoto() {
    if (!_activeStream || !_currentCameraCtx) return;
    
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const settings = await getSettings();
    const wm = settings.watermark || {};
    
    // Set canvas size to video resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // 1. Draw Video Frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 2. Draw Watermark if enabled
    if (wm.enabled) {
        await drawWatermark(ctx, canvas.width, canvas.height, settings);
    }
    
    // 3. Convert to Blob & Process (SMART COMPRESSION)
    // 0.6 is the "sweet spot" for technical photos: 4x-5x smaller than raw, but clear enough for cracks.
    const quality = 0.65; 
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    
    // 4. Cleanup & Save
    closeViewfinder();
    
    // Standard Upload Flow
    const cleanB64 = dataUrl.split(',')[1];
    const imageData = [{ base64: cleanB64, mimeType: 'image/jpeg' }];
    const { kode, nama, kategori } = _currentCameraCtx;
    
    runVisionAnalysis(imageData, kode, nama, kategori, 'Teknis', true);
}

/**
 * THE WATERMARK ENGINE (Canvas Compositor)
 */
async function drawWatermark(ctx, w, h, settings) {
    const wm = settings.watermark;
    const padding = 30; // Increased padding for professional look
    const logoSize = 60;
    const contentPadding = 20;
    
    // 0. Prepare Data
    const projName = store.get().currentProyek?.nama_bangunan || 'NAMA BANGUNAN';
    const tagsArr = wm.custom_tags ? wm.custom_tags.split('\n').filter(t => t.trim()) : [];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }) + ' ' + 
                    new Date().toLocaleDateString('id-ID', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    
    // 1. Calculate Dynamic Height
    const lineSpacing = 26;
    const baseLines = 3; // GPS, Time, Project
    const totalLines = baseLines + tagsArr.length;
    const headerHeight = 80;
    const footerHeight = 40;
    const footerPadding = 15;
    const boxW = Math.min(w * 0.85, 520);
    const boxH = headerHeight + (totalLines * lineSpacing) + footerPadding + footerHeight;
    const x = padding;
    const y = h - boxH - padding;

    // 2. Draw Glassmorphism Box with Gradient
    ctx.save();
    
    // Draw Background Gradient
    const gradient = ctx.createLinearGradient(x, y, x + boxW, y + boxH);
    gradient.addColorStop(0, `rgba(10, 15, 25, ${wm.opacity || 0.85})`);
    gradient.addColorStop(1, `rgba(25, 30, 45, ${wm.opacity || 0.85})`);
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    
    // Rounded Rect Path
    const r = 20;
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+boxW-r, y); ctx.quadraticCurveTo(x+boxW, y, x+boxW, y+r);
    ctx.lineTo(x+boxW, y+boxH-r); ctx.quadraticCurveTo(x+boxW, y+boxH, x+boxW-r, y+boxH);
    ctx.lineTo(x+r, y+boxH); ctx.quadraticCurveTo(x, y+boxH, x, y+boxH-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    
    // Accent Border (Gold Left Stripe)
    ctx.fillStyle = '#f59e0b'; // Amber-500
    ctx.fillRect(x, y + r, 8, boxH - (r*2));
    ctx.restore();
    
    // 3. Draw Brand Header
    const logoSrc = wm.company_logo || settings.consultant?.logo;
    if (logoSrc) {
        try {
            const logoImg = await loadImage(logoSrc);
            const aspect = logoImg.width / logoImg.height;
            let drawW = logoSize;
            let drawH = logoSize / aspect;
            if (drawH > logoSize) { drawH = logoSize; drawW = logoSize * aspect; }
            ctx.drawImage(logoImg, x + contentPadding, y + contentPadding + (logoSize - drawH)/2, drawW, drawH);
        } catch(e) { console.warn("WM Logo failed", e); }
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(wm.company_name || 'INSTANSI PENGKAJI', x + contentPadding + logoSize + 15, y + contentPadding + 35);
    
    // Header Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); 
    ctx.moveTo(x + contentPadding, y + headerHeight); 
    ctx.lineTo(x + boxW - contentPadding, y + headerHeight); 
    ctx.stroke();
    
    // 4. Draw Metadata Lines
    ctx.font = '16px Inter, sans-serif';
    let lineY = y + headerHeight + 30;
    
    const drawLine = (icon, text) => {
        ctx.fillStyle = '#ffb300';
        ctx.fillText(icon, x + contentPadding, lineY);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(text, x + contentPadding + 25, lineY);
        lineY += lineSpacing;
    };
    
    drawLine('📍', window._currentGps || 'GPS NOT DETECTED');
    drawLine('🕒', timeStr);
    drawLine('📄', `${wm.activity_prefix || 'KEGIATAN:'} ${projName}`.toUpperCase());
    
    // Custom Tags
    tagsArr.forEach(tag => {
        drawLine('🏷️', tag.toUpperCase());
    });
    
    // 5. Draw Footer (Verified)
    const footerY = y + boxH - 25;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); 
    ctx.moveTo(x + contentPadding, y + boxH - 50); 
    ctx.lineTo(x + boxW - contentPadding, y + boxH - 50); 
    ctx.stroke();
    
    ctx.fillStyle = '#ffb300';
    ctx.font = 'bold 15px Inter, sans-serif';
    
    // Draw Shield Icon manually for high-quality
    const sx = x + contentPadding;
    const sy = footerY - 12;
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy);
    ctx.lineTo(sx, sy + 3);
    ctx.lineTo(sx, sy + 10);
    ctx.quadraticCurveTo(sx, sy + 16, sx + 8, sy + 20);
    ctx.quadraticCurveTo(sx + 16, sy + 16, sx + 16, sy + 10);
    ctx.lineTo(sx + 16, sy + 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillText(wm.verified_label || 'DIVERIFIKASI OLEH SMARTAI SLF', x + contentPadding + 24, footerY);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function startGpsTracking() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        window._currentGps = `${lat}°S, ${lng}°E`;
        // Removed standalone GPS status update as requested to fix double coordinate look
    }, null, { enableHighAccuracy: true });
}

export async function renderWmPreview() {
    const container = document.getElementById('camera-wm-preview');
    if (!container) return;
    
    const settings = await getSettings();
    const wm = settings.watermark || {};
    const projName = store.get().currentProyek?.nama_bangunan || 'NAMA BANGUNAN';
    const logoUrl = wm.company_logo || settings.consultant?.logo;
    
    // Split custom tags if any
    const tagsArr = wm.custom_tags ? wm.custom_tags.split('\n').filter(t => t.trim()) : [];
    
    container.innerHTML = `
      <div style="background:rgba(18,22,33,0.85); border-left:5px solid #ffb300; padding:16px; border-radius:12px; width:100%; max-width:400px; color:white; backdrop-filter:blur(12px); box-shadow: 0 10px 40px rgba(0,0,0,0.5); font-family: 'Inter', sans-serif;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
           ${logoUrl ? `<img src="${logoUrl}" style="height:40px; width:40px; object-fit:contain;">` : `<div style="height:40px; width:40px; background:rgba(255,255,255,0.1); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;"><i class="fas fa-building"></i></div>`}
           <div style="font-weight:bold; font-size:1rem; letter-spacing:0.02em;">${wm.company_name || 'INSTANSI PENGKAJI'}</div>
        </div>
        
        <div style="height:1px; background:rgba(255,255,255,0.1); margin-bottom:12px;"></div>
        
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:0.75rem; opacity:0.8; display:flex; align-items:center; gap:8px;"><i class="fas fa-location-dot" style="color:#ffb300; width:14px;"></i> ${window._currentGps || 'MENCARI GPS...'}</div>
          <div style="font-size:0.75rem; opacity:0.8; display:flex; align-items:center; gap:8px;"><i class="fas fa-calendar" style="color:#ffb300; width:14px;"></i> ${new Date().toLocaleDateString('id-ID', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}</div>
          <div style="font-size:0.75rem; opacity:0.8; display:flex; align-items:center; gap:8px;"><i class="fas fa-building" style="color:#ffb300; width:14px;"></i> ${wm.activity_prefix || 'KEGIATAN:'} ${projName.toUpperCase()}</div>
          
          ${tagsArr.map(tag => `
            <div style="font-size:0.75rem; opacity:0.8; display:flex; align-items:center; gap:8px;"><i class="fas fa-tag" style="color:#ffb300; width:14px;"></i> ${tag.toUpperCase()}</div>
          `).join('')}
        </div>
        
        <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:8px; color:#ffb300; font-weight:800; font-size:0.75rem;">
           <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px; height:16px;"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
           <span>${wm.verified_label || 'DIVERIFIKASI OLEH SMARTAI SLF'}</span>
        </div>
      </div>
    `;
}

/**
 * Handle File Selection & Upload (SAVES ONLY)
 */
export async function runVisionAnalysis(input, kode, componentName, kategori, aspek, isPreProcessed = false) {
  if (!input) return;
  const { currentProyekId, currentProyek } = store.get();
  try {
     showInfo(`Menyimpan bukti audit ${componentName}...`);
     let imagesData = [];
     if (isPreProcessed) {
         imagesData = input;
     } else {
         const files = Array.from(input).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
         if (files.length === 0) return;
         for (const file of files) {
            const b64 = await fileToBase64(file);
            imagesData.push({ base64: b64, mimeType: file.type });
         }
     }
     const payload = imagesData.map(img => ({ 
        base64: img.base64, 
        mimeType: img.mimeType, 
        name: `SLF_${kategori}_${kode}_${Date.now()}` 
     }));
     const driveResults = await uploadToGoogleDrive(payload, currentProyekId, aspek, kode, currentProyek.drive_proxy_url);
     if (driveResults?.length) {
          const checklist = getChecklistState();
          const currentItem = checklist.dataMap[kode] || { kode, kategori, aspek };
          const existingUrls = currentItem.foto_urls || [];
          const existingEvidence = currentItem.evidence_links || [];
          
          let newEvidence = [...existingEvidence];
          const newUrls = [...existingUrls];

          // Cross-Sync: Register to Global Files automatically
          for (const res of driveResults) {
              const fileRecord = await registerFileMetadata(currentProyekId, res.url, payload[0].name, 'lapangan', componentName, res.id);
              if (fileRecord) {
                newEvidence.push({ id: fileRecord.id, url: res.url, name: fileRecord.name });
              }
              newUrls.push(res.url);
          }

          const updatedItem = {
              ...currentItem,
              foto_urls: [...new Set(newUrls)],
              evidence_links: newEvidence,
              metadata: { ...(currentItem.metadata || {}), has_new_media: true }
          };
          updateChecklist({ dataMap: { ...checklist.dataMap, [kode]: updatedItem } });
          markDirty(kode);
          showSuccess(`Bukti ${componentName} berhasil diamankan.`);
     }
  } catch (err) {
     showError("Gagal sinkron bukti: " + err.message);
  }
}

/**
 * RESTORED: Auto fill from Multi-Agent Reasoning
 */
export async function autoFillFromAgents() {
  const { multiAgent, checklist } = store.get();
  if (!multiAgent?.logs?.length) {
    showInfo("Belum ada data dari Digital Agents untuk dipetakan.");
    return;
  }
  showInfo("Memetakan hasil analisis 15 Agen ke Daftar Simak...");
  const newMap = { ...checklist.dataMap };
  multiAgent.logs.forEach(log => {
      if (log.target_kode && newMap[log.target_kode]) {
          const item = newMap[log.target_kode];
          item.catatan = (item.catatan || '') + `\n[AGENT ${log.role}]: ${log.content}`;
          item.status = log.suggested_status || item.status;
          markDirty(log.target_kode);
      }
  });
  updateChecklist({ dataMap: newMap });
  showSuccess("Pemetaan Agen Digital selesai.");
}

/**
 * Helper to convert a remote/proxy URL to ImageData (base64 + mime)
 */
async function urlToImageData(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const b64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
        return { base64: b64, mimeType: blob.type };
    } catch (e) {
        console.error("Gagal convert URL to ImageData:", e);
        return null;
    }
}

/**
 * RESTORED: Smart Hybrid Engine (Batch Analysis)
 */
export async function runBatchSmartEngine(kategori) {
  const { checklist, currentProyekId, currentProyek } = store.get();
  const items = Object.values(checklist.dataMap).filter(it => it.kategori === kategori && it.foto_urls?.length);
  if (!items.length) {
    showInfo(`Tidak ada item dengan lampiran foto di kategori ${kategori}.`);
    return;
  }
  showInfo(`Menjalankan Smart Hybrid Engine untuk ${items.length} item...`);
  for (const item of items) {
    try {
      // Convert URL to Base64 for Gemini/AI
      const imageData = await urlToImageData(item.foto_urls[0]);
      if (!imageData) continue;

      const result = await analyzeChecklistImage([imageData], item.nama, item.kategori, item.aspek);
      console.log(`[AI Engine] Result for ${item.kode}:`, result);
      
      const currentItem = store.get().checklist.dataMap[item.kode] || { kode: item.kode };
      const oldCatatan = currentItem.catatan || '';
      const newCatatan = result.catatan ? (oldCatatan + (oldCatatan ? '\n' : '') + `[AI ANALYSIS]: ${result.catatan}`) : oldCatatan;
      
      const updatedItem = {
        ...currentItem,
        status: result.status || currentItem.status || 'Sesuai',
        catatan: newCatatan,
        rekomendasi: result.rekomendasi || result.recommendation || currentItem.rekomendasi || ''
      };
      const newMap = { ...store.get().checklist.dataMap, [item.kode]: updatedItem };
      updateChecklist({ dataMap: newMap });
      markDirty(item.kode);
    } catch (e) {
      console.warn(`Engine failed for ${item.kode}:`, e);
    }
  }
  showSuccess(`Analisis Smart Engine ${kategori} selesai.`);
}

/**
 * Lightbox Preview
 */
export function showLightbox(url) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.onclick = () => document.body.removeChild(overlay);
    const img = document.createElement('img');
    img.src = url;
    img.className = 'lightbox-content';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
}

/**
 * Handle Voice Note with Manual TOGGLE
 */
export async function toggleVoiceAudit(kode) {
    const checklist = getChecklistState();
    const item = checklist.dataMap[kode] || { kode };
    if (item.isRecording) {
        voiceService.stop();
        updateChecklist({ dataMap: { ...checklist.dataMap, [kode]: { ...item, isRecording: false } } });
        showInfo("Perekaman dihentikan.");
        return;
    }
    updateChecklist({ dataMap: { ...checklist.dataMap, [kode]: { ...item, isRecording: true } } });
    showInfo("Mendengarkan... Katakan temuan Bapak (Sebutkan 'Sesuai' atau 'Rusak' untuk set status).");
    
    voiceService.start(async (transcript) => {
        showInfo("Memproses narasi teknis...");
        try {
            // 1. Formalize Narrative
            const formal = await voiceService.formalize(transcript);
            
            // 2. Infer Status (Smart Command)
            const options = item.kategori === 'administrasi' ? ADMIN_OPTIONS : CONDITION_OPTIONS;
            const inferredStatus = await voiceService.inferStatus(transcript, options);

            const state = store.get().checklist;
            const currentItem = state.dataMap[kode] || { kode };
            
            const updatedItem = {
                ...currentItem,
                catatan: (currentItem.catatan ? currentItem.catatan + '\n' : '') + `[VOICE AUDIT]: ${formal}`,
                isRecording: false
            };

            // Apply inferred status if found
            if (inferredStatus) {
                updatedItem.status = inferredStatus;
                showInfo(`Status otomatis diatur ke: ${inferredStatus.replace('_', ' ').toUpperCase()}`);
            }

            updateChecklist({ dataMap: { ...state.dataMap, [kode]: updatedItem } });
            markDirty(kode);
            showSuccess("Catatan diperbarui dengan bahasa ahli.");
        } catch (e) { showError(e.message); }
    }, (err) => {
        const currentItem = getChecklistState().dataMap[kode] || { kode };
        updateChecklist({ dataMap: { ...getChecklistState().dataMap, [kode]: { ...currentItem, isRecording: false } } });
        showError("Gagal merekam: " + err);
    });
}

/**
 * FETCH AND SYNC ITEM DATA (INTELLIGENT EXTRACTION)
 * Scans local state (Photos/Voice) and Drive for evidence, then extracts findings.
 */
export async function fetchItemData(kode, nama) {
  const { currentProyekId, currentProyek, checklist } = store.get();
  if (!currentProyekId) return;

  try {
    const item = checklist.dataMap[kode] || { kode };
    
    // 1. Check for LOCAL evidence first (Photos from Camera/Upload)
    if (item.foto_urls?.length > 0 && !item.status) {
       showInfo(`Mengekstrak temuan dari foto yang ada...`);
       try {
           const imageData = await urlToImageData(item.foto_urls[0]);
           if (imageData) {
               const result = await analyzeChecklistImage([imageData], nama, item.kategori, item.aspek);
               console.log(`[AI Vision] Result for ${kode}:`, result);
               
               const state = store.get().checklist;
               const current = state.dataMap[kode] || { kode };
               
               const oldCatatan = current.catatan || '';
               const aiNote = result.catatan || result.findings || '';
               const aiRemedy = result.rekomendasi || result.recommendation || '';
               
               let finalAiNote = aiNote;
               if (!finalAiNote && aiRemedy) finalAiNote = `[TEMUAN TERDETEKSI]: Membutuhkan ${aiRemedy}`;
               
               const newCatatan = finalAiNote ? (oldCatatan + (oldCatatan ? '\n' : '') + `[AI VISION]: ${finalAiNote}`) : oldCatatan;

               const updated = {
                   ...current,
                   status: result.status || current.status || 'ada_sesuai',
                   catatan: newCatatan,
                   rekomendasi: aiRemedy || current.rekomendasi || '',
                   metadata: { ...(current.metadata || {}), ai_processed: true }
               };
               updateChecklist({ dataMap: { ...state.dataMap, [kode]: updated } });
               markDirty(kode);
               showSuccess("Temuan dari foto berhasil ditarik.");
           }
       } catch (e) {
           console.warn("Local photo analysis failed:", e);
       }
    }

    // 2. Fetch DISCOVERY from Drive Proyek (SIMBG)
    showInfo(`Mengkoneksikan berkas Drive untuk ${nama}...`);
    const files = await fetchDriveFiles(currentProyekId, currentProyek.drive_proxy_url);
    
    if (files?.length) {
      const matchingFiles = files.filter(f => 
        f.name.toUpperCase().includes(kode.toUpperCase()) || 
        f.name.toLowerCase().includes(kode.toLowerCase())
      );

      if (matchingFiles.length) {
        const urls = matchingFiles.map(f => f.url);
        const existingUrls = item.foto_urls || [];
        const uniqueUrls = [...new Set([...existingUrls, ...urls])];

        if (uniqueUrls.length > existingUrls.length) {
           const state = store.get().checklist;
           const current = state.dataMap[kode] || { kode, foto_urls: [] };
           
           const updatedItem = {
             ...current,
             foto_urls: uniqueUrls,
             metadata: { ...(current.metadata || {}), last_sync: new Date().toISOString() }
           };
           
           updateChecklist({ dataMap: { ...state.dataMap, [kode]: updatedItem } });
           markDirty(kode);
           showSuccess(`Sinkron Berhasil: ${matchingFiles.length} berkas Drive terdeteksi.`);

            // Auto-analyze NEW Drive Image if status still empty
            const firstImg = matchingFiles.find(f => f.mimeType.startsWith('image/'));
            if (firstImg && !updatedItem.status) {
               showInfo(`Mengekstrak temuan dari berkas Drive...`);
               const imageData = await urlToImageData(firstImg.url);
               if (imageData) {
                  const res = await analyzeChecklistImage([imageData], nama, updatedItem.kategori, updatedItem.aspek);
                  console.log(`[AI Drive] Result for ${kode}:`, res);
                  
                  const refreshedState = store.get().checklist;
                  const refreshedItem = refreshedState.dataMap[kode] || { kode };
                  
                   const oldCatatan = refreshedItem.catatan || '';
                  const aiNote = res.catatan || res.findings || '';
                  const aiRemedy = res.rekomendasi || res.recommendation || '';
                  
                  // Logic: If AI gives diagnosis/findings, use that. If empty but has remedy, use remedy as fallback notes.
                  let finalAiNote = aiNote;
                  if (!finalAiNote && aiRemedy) finalAiNote = `[TEMUAN TERDETEKSI]: Berdasarkan analisis, diperlukan: ${aiRemedy}`;
                  
                  const newCatatan = finalAiNote ? (oldCatatan + (oldCatatan ? '\n' : '') + `[AI DRIVE]: ${finalAiNote}`) : oldCatatan;

                  const updatedFull = { 
                        ...refreshedItem, 
                        status: res.status || refreshedItem.status || 'ada_sesuai',
                        catatan: newCatatan,
                        rekomendasi: aiRemedy || refreshedItem.rekomendasi || ''
                  };

                  updateChecklist({ 
                    dataMap: { 
                      ...refreshedState.dataMap, 
                      [kode]: updatedFull
                    } 
                  });
                  markDirty(kode);
               }
            }
        } else {
           showInfo(`Semua berkas Drive sudah sinkron.`);
        }
      } else {
        showInfo(`Tidak ditemukan berkas spesifik di Drive.`);
      }
    }

  } catch (err) {
    console.error("FetchItemData Error:", err);
    showError("Gagal sinkron data: " + err.message);
  }
}

/**
 * GLOBAL AI AUTO-SYNC (BATCH DISCOVERY)
 * Scans all project files and maps them to the checklist items automatically.
 */
export async function autoSyncProjectData() {
  const { currentProyekId, currentProyek, checklist } = store.get();
  if (!currentProyekId) return;

  try {
    showInfo("AI sedang memindai Drive Proyek untuk sinkronisasi otomatis...");
    
    // 1. Fetch ALL project files
    const files = await fetchDriveFiles(currentProyekId, currentProyek.drive_proxy_url);
    
    if (!files?.length) {
      showInfo("Tidak ditemukan berkas di Drive Proyek untuk disinkronisasi.");
      return;
    }

    showInfo(`Ditemukan ${files.length} berkas. Mencocokkan dengan Daftar Simak...`);
    
    const newMap = { ...checklist.dataMap };
    let matchCount = 0;
    const itemsToAnalyze = [];

    // 2. Iterate through all potential items (Admin & Teknis)
    // We only process items that are currently empty or don't have photos
    const allItems = Object.values(newMap);
    
    for (const item of allItems) {
      const kode = item.kode;
      const matchingFiles = files.filter(f => 
        f.name.toUpperCase().includes(kode.toUpperCase()) || 
        f.name.toLowerCase().includes(kode.toLowerCase())
      );

      if (matchingFiles.length > 0) {
        const urls = matchingFiles.map(f => f.url);
        const existingUrls = item.foto_urls || [];
        const uniqueUrls = [...new Set([...existingUrls, ...urls])];

        if (uniqueUrls.length > existingUrls.length) {
          let newEvidence = [...(item.evidence_links || [])];

          // Register in Global Files too (Consistency)
          for (const f of matchingFiles) {
             const fileRecord = await registerFileMetadata(currentProyekId, f.url, f.name, 'lapangan', item.nama, f.id);
             if (fileRecord) {
                newEvidence.push({ id: fileRecord.id, url: f.url, name: f.name });
             }
          }

          newMap[kode] = {
            ...item,
            foto_urls: uniqueUrls,
            evidence_links: newEvidence,
            metadata: { 
              ...(item.metadata || {}), 
              is_ai_draft: true,
              last_sync: new Date().toISOString() 
            }
          };
          matchCount++;
          markDirty(kode);
          
          // If it's a technical item and has no status, queue for AI analysis
          if (item.aspek === 'Teknis' && !item.status) {
            itemsToAnalyze.push({ kode, url: uniqueUrls[0], nama: item.nama });
          }
        }
      }
    }

    // 3. Update Store first with matches
    updateChecklist({ dataMap: newMap });
    
    if (matchCount > 0) {
      showSuccess(`Sinkronisasi Berhasil: ${matchCount} item diperbarui dari Drive.`);
    } else {
      showInfo("Semua item sudah tersinkronisasi dengan berkas Drive.");
      return;
    }

    // 4. Batch Analysis for matching technical items (Optional/Gradual)
    if (itemsToAnalyze.length > 0) {
      showInfo(`Menjalankan AI Vision pada ${itemsToAnalyze.length} bukti teknis yang ditemukan...`);
      
      // Limit to first 5 for performance/quota safety in batch
      const topItems = itemsToAnalyze.slice(0, 5);
      
      for (const task of topItems) {
        try {
          const imageData = await urlToImageData(task.url);
          if (imageData) {
            const currentItem = store.get().checklist.dataMap[task.kode] || { kode: task.kode };
            const result = await analyzeChecklistImage([imageData], task.nama, currentItem.kategori || 'teknis', currentItem.aspek || 'Teknis');
            const state = store.get().checklist;
            const current = state.dataMap[task.kode] || { kode: task.kode };
            if (current) {
              const oldCatatan = current.catatan || '';
              const aiNote = result.catatan || result.findings || '';
              const aiRemedy = result.rekomendasi || result.recommendation || '';
              
              let finalAiNote = aiNote;
              if (!finalAiNote && aiRemedy) finalAiNote = `[DRAF TEMUAN]: Membutuhkan ${aiRemedy}`;
              
              const newCatatan = finalAiNote ? (oldCatatan + (oldCatatan ? '\n' : '') + `[AI AUTO-DRAFT]: ${finalAiNote}`) : oldCatatan;

              const updated = {
                ...current,
                status: result.status || 'Sesuai',
                catatan: newCatatan,
                rekomendasi: aiRemedy || '',
                metadata: { ...(current.metadata || {}), ai_analyzed: true }
              };
              updateChecklist({ dataMap: { ...state.dataMap, [task.kode]: updated } });
              markDirty(task.kode);
            }
          }
        } catch (e) {
          console.warn(`Auto-analysis failed for ${task.kode}:`, e);
        }
      }
      showSuccess(`Otomasi draf checklist selesai.`);
    }

  } catch (err) {
    showError("Gagal sinkron otomasi: " + err.message);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}
