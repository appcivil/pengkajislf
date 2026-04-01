/**
 * SHARED UTILITIES
 * Generic helper functions used across the application.
 */

// Escape HTML to prevent XSS
export function escHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Format date to Indonesian locale
export function formatTanggal(s) {
  try {
    if (!s) return '-';
    return new Date(s).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return s || '-';
  }
}

// Risk level color mapping
export function riskColor(r) {
  const colors = {
    low:      'hsl(160,65%,46%)',
    medium:   'hsl(40,80%,55%)',
    high:     'hsl(0,74%,52%)',
    critical: 'hsl(330,75%,45%)'
  };
  return colors[r?.toLowerCase()] || 'hsl(200,80%,50%)';
}

// Risk level label mapping
export function riskLabel(r) {
  const labels = {
    low:      'Rendah',
    medium:   'Sedang',
    high:     'Tinggi',
    critical: 'Kritis'
  };
  return labels[r?.toLowerCase()] || r || '-';
}

// Simple debounce
export function debounce(fn, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Generate unique ID
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract a human-readable filename from a URL
 */
export function getFileNameFromUrl(url) {
  if (!url) return 'Unknown File';
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split('/');
    let last = parts[parts.length - 1];
    if (last.includes('?')) last = last.split('?')[0];
    
    // Clean up long numeric prefixes if they look like timestamps
    if (last.includes('_')) {
        const segments = last.split('_');
        if (segments.length > 2) return segments.slice(0, -1).join('_');
    }
    
    return last || 'Lampiran';
  } catch {
    return 'Berkas Lampiran';
  }
}
