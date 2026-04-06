/**
 * PHOTO DOCUMENTATION MODULE
 * WebRTC camera capture with EXIF/GPS metadata
 */

/**
 * Initialize camera with WebRTC
 */
export async function initCamera(videoElement, options = {}) {
  const constraints = {
    video: {
      facingMode: options.facingMode || 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  };
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    
    return {
      stream,
      stop: () => {
        stream.getTracks().forEach(track => track.stop());
      },
      flip: async () => {
        const currentFacing = constraints.video.facingMode;
        constraints.video.facingMode = currentFacing === 'environment' ? 'user' : 'environment';
        return initCamera(videoElement, constraints.video);
      }
    };
  } catch (error) {
    console.error('[Camera] Error:', error);
    throw new Error('Tidak dapat mengakses kamera: ' + error.message);
  }
}

/**
 * Capture photo from video element
 */
export function capturePhoto(videoElement, canvasElement, options = {}) {
  const canvas = canvasElement || document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set canvas dimensions to match video
  canvas.width = videoElement.videoWidth || 1920;
  canvas.height = videoElement.videoHeight || 1080;
  
  // Draw video frame to canvas
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  // Add watermark if requested
  if (options.watermark) {
    addWatermark(context, canvas.width, canvas.height, options.watermark);
  }
  
  // Get base64 image
  const imageData = canvas.toDataURL('image/jpeg', options.quality || 0.9);
  
  return {
    imageData,
    width: canvas.width,
    height: canvas.height,
    timestamp: new Date().toISOString()
  };
}

/**
 * Add watermark to photo
 */
function addWatermark(context, width, height, watermark) {
  context.save();
  context.fillStyle = 'rgba(255, 255, 255, 0.8)';
  context.font = 'bold 24px Arial';
  context.textAlign = 'right';
  
  const lines = Array.isArray(watermark) ? watermark : [watermark];
  let y = height - 20;
  
  // Draw background strip
  context.fillStyle = 'rgba(0, 0, 0, 0.5)';
  context.fillRect(0, y - 30, width, 50);
  
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  for (let i = lines.length - 1; i >= 0; i--) {
    context.fillText(lines[i], width - 20, y);
    y -= 28;
  }
  
  context.restore();
}

/**
 * Extract EXIF data from image
 */
export function extractEXIF(imageFile) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const exif = parseEXIFData(arrayBuffer);
      resolve(exif);
    };
    
    reader.onerror = () => resolve({});
    reader.readAsArrayBuffer(imageFile);
  });
}

function parseEXIFData(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  const exif = {};
  
  // Check for JPEG marker
  if (dataView.getUint16(0) !== 0xFFD8) {
    return exif;
  }
  
  let offset = 2;
  
  while (offset < dataView.byteLength) {
    const marker = dataView.getUint16(offset);
    
    if (marker === 0xFFE1) { // APP1 (EXIF)
      const length = dataView.getUint16(offset + 2);
      const exifOffset = offset + 4;
      
      // Check EXIF header
      const header = String.fromCharCode(
        dataView.getUint8(exifOffset),
        dataView.getUint8(exifOffset + 1),
        dataView.getUint8(exifOffset + 2),
        dataView.getUint8(exifOffset + 3),
        dataView.getUint8(exifOffset + 4),
        dataView.getUint8(exifOffset + 5)
      );
      
      if (header === 'Exif\x00\x00') {
        // Parse TIFF header
        const tiffOffset = exifOffset + 6;
        const littleEndian = dataView.getUint16(tiffOffset) === 0x4949;
        
        // Extract basic tags
        const ifdOffset = tiffOffset + dataView.getUint32(tiffOffset + 4, littleEndian);
        exif.timestamp = extractTimestamp(dataView, ifdOffset, littleEndian);
      }
      
      offset += 2 + length;
    } else if (marker === 0xFFD9) { // EOI
      break;
    } else {
      const length = dataView.getUint16(offset + 2);
      offset += 2 + length;
    }
  }
  
  return exif;
}

function extractTimestamp(dataView, ifdOffset, littleEndian) {
  const numEntries = dataView.getUint16(ifdOffset, littleEndian);
  let offset = ifdOffset + 2;
  
  for (let i = 0; i < numEntries; i++) {
    const tag = dataView.getUint16(offset, littleEndian);
    
    if (tag === 0x0132) { // DateTime
      const valueOffset = offset + 8;
      const bytes = [];
      for (let j = 0; j < 20; j++) {
        bytes.push(dataView.getUint8(valueOffset + j));
      }
      return String.fromCharCode(...bytes).replace(/\x00/g, '');
    }
    
    offset += 12;
  }
  
  return null;
}

/**
 * Get GPS position
 */
export function getGPSPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        });
      },
      (error) => {
        reject(new Error(`GPS Error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options
      }
    );
  });
}

/**
 * Create photo metadata object
 */
export async function createPhotoMetadata(options = {}) {
  const metadata = {
    timestamp: new Date().toISOString(),
    device: navigator.userAgent,
    itemCode: options.itemCode || null,
    itemName: options.itemName || null,
    category: options.category || null,
    notes: options.notes || null
  };
  
  // Try to get GPS
  try {
    const gps = await getGPSPosition();
    metadata.gps = gps;
  } catch (error) {
    metadata.gps = null;
    metadata.gpsError = error.message;
  }
  
  return metadata;
}

/**
 * Compress image before storage
 */
export function compressImage(base64Image, options = {}) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      const maxWidth = options.maxWidth || 1920;
      const maxHeight = options.maxHeight || 1080;
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressed = canvas.toDataURL('image/jpeg', options.quality || 0.8);
      resolve({
        imageData: compressed,
        width,
        height,
        originalSize: base64Image.length,
        compressedSize: compressed.length,
        compressionRatio: compressed.length / base64Image.length
      });
    };
    img.src = base64Image;
  });
}

/**
 * Photo gallery with before/after comparison
 */
export function createPhotoGallery(photos, options = {}) {
  const { showComparison = false, comparisonPairs = [] } = options;
  
  if (!photos || photos.length === 0) {
    return `<div style="text-align: center; padding: 40px; color: var(--text-tertiary);">
      <i class="fas fa-camera" style="font-size: 3rem; margin-bottom: 12px; opacity: 0.5;"></i>
      <p>Belum ada foto</p>
    </div>`;
  }
  
  if (showComparison && comparisonPairs.length > 0) {
    return renderComparisonGallery(comparisonPairs);
  }
  
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
      ${photos.map((photo, idx) => `
        <div class="photo-item" style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer;"
             onclick="window._showPhotoLightbox(${idx})">
          <img src="${photo.imageData || photo.url}" 
               style="width: 100%; height: 100%; object-fit: cover;"
               loading="lazy">
          ${photo.metadata?.gps ? `
            <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px;">
              <i class="fas fa-map-marker-alt" style="color: #ef4444; font-size: 12px;"></i>
            </div>
          ` : ''}
          <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 8px; background: linear-gradient(transparent, rgba(0,0,0,0.8));">
            <div style="font-size: 11px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${photo.metadata?.itemCode || 'Foto'}
            </div>
            <div style="font-size: 9px; color: rgba(255,255,255,0.7);">
              ${new Date(photo.metadata?.timestamp || photo.createdAt).toLocaleDateString('id-ID')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderComparisonGallery(pairs) {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      ${pairs.map((pair, idx) => `
        <div class="comparison-item" style="border: 1px solid hsla(220, 20%, 100%, 0.1); border-radius: 12px; overflow: hidden;">
          <div style="padding: 12px 16px; background: hsla(220, 20%, 100%, 0.03);">
            <span style="font-weight: 600; color: white;">${pair.title || 'Perbandingan'}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px;">
            <div style="position: relative;">
              <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: 4px 12px; border-radius: 4px; font-size: 12px; color: white;">
                Before
              </div>
              <img src="${pair.before.imageData || pair.before.url}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover;">
            </div>
            <div style="position: relative;">
              <div style="position: absolute; top: 8px; left: 8px; background: rgba(34,197,94,0.8); padding: 4px 12px; border-radius: 4px; font-size: 12px; color: white;">
                After
              </div>
              <img src="${pair.after.imageData || pair.after.url}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover;">
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Catalog kerusakan digital
 */
export const DAMAGE_CATALOG = {
  'retak_lentur': {
    label: 'Retak Lentur',
    icon: 'fa-wave-square',
    description: 'Retak pada daerah tarik akibat momen lentur',
    severity: ['ringan', 'sedang', 'berat'],
    color: '#eab308'
  },
  'retak_geser': {
    label: 'Retak Geser',
    icon: 'fa-bolt',
    description: 'Retak diagonal akibat gaya geser',
    severity: ['ringan', 'sedang', 'berat'],
    color: '#ef4444'
  },
  'spalling': {
    label: 'Spalling',
    icon: 'fa-cubes',
    description: 'Lepasnya concrete cover, tulangan terlihat',
    severity: ['ringan', 'sedang', 'berat'],
    color: '#f97316'
  },
  'korosi': {
    label: 'Korosi Tulangan',
    icon: 'fa-rust',
    description: 'Karat pada tulangan baja',
    severity: ['ringan', 'sedang', 'berat'],
    color: '#8b5cf6'
  },
  'deformasi': {
    label: 'Deformasi Berlebih',
    icon: 'fa-arrows-alt',
    description: 'Lendutan atau perubahan bentuk elemen',
    severity: ['ringan', 'sedang', 'berat'],
    color: '#3b82f6'
  },
  'penurunan': {
    label: 'Penurunan',
    icon: 'fa-arrow-down',
    description: 'Settlement pada fondasi/struktur',
    severity: ['ringan', 'sedang', 'berat'],
    color: '#ef4444'
  }
};

export function renderDamageCatalog() {
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
      ${Object.entries(DAMAGE_CATALOG).map(([key, damage]) => `
        <div class="damage-card" style="padding: 20px; background: hsla(220, 20%, 100%, 0.03); border: 1px solid hsla(220, 20%, 100%, 0.1); border-radius: 12px; cursor: pointer; transition: all 0.3s;"
             onclick="window._selectDamageType('${key}')">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: ${damage.color}20; display: flex; align-items: center; justify-content: center; color: ${damage.color}; font-size: 1.3rem;">
              <i class="fas ${damage.icon}"></i>
            </div>
            <div style="font-weight: 700; color: white; font-size: 1rem;">${damage.label}</div>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 12px;">
            ${damage.description}
          </div>
          <div style="display: flex; gap: 6px;">
            ${damage.severity.map(s => `
              <span style="font-size: 0.7rem; padding: 2px 8px; background: hsla(220, 20%, 100%, 0.1); border-radius: 4px; color: var(--text-tertiary); text-transform: capitalize;">${s}</span>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
