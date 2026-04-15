/**
 * Contoh Penggunaan Loading Components
 * Dokumentasi cara menggunakan komponen loading
 */

import {
  LoadingLogo,
  LoadingSpinner,
  LoadingScreen,
  LoadingSkeleton,
  LoadingDots,
  PageTransitionLoader,
  SmartLoading
} from './LoadingComponents.js';

// ============================================================================
// CONTOH 1: Loading Logo Sederhana
// ============================================================================

function contohLoadingLogo() {
  // Loading logo dengan ukuran default
  const loader1 = LoadingLogo({});
  document.getElementById('container').appendChild(loader1);
  
  // Loading logo dengan ukuran custom
  const loader2 = LoadingLogo({ 
    size: 80, 
    text: 'Memuat data bangunan...' 
  });
  document.getElementById('container').appendChild(loader2);
  
  // Loading logo tanpa teks
  const loader3 = LoadingLogo({ 
    size: 60, 
    showText: false 
  });
  document.getElementById('container').appendChild(loader3);
}

// ============================================================================
// CONTOH 2: Loading dengan Progress
// ============================================================================

function contohLoadingProgress() {
  // Spinner tanpa progress
  const spinner1 = LoadingSpinner({ 
    text: 'Sedang memproses...' 
  });
  document.body.appendChild(spinner1);
  
  // Spinner dengan progress (0-100)
  const spinner2 = LoadingSpinner({ 
    progress: 45, 
    text: 'Mengunggah file...' 
  });
  document.body.appendChild(spinner2);
  
  // Update progress secara dinamis
  setTimeout(() => {
    // Hapus spinner lama
    spinner2.remove();
    
    // Buat spinner baru dengan progress 75
    const spinner3 = LoadingSpinner({ 
      progress: 75, 
      text: 'Mengunggah file...' 
    });
    document.body.appendChild(spinner3);
  }, 2000);
}

// ============================================================================
// CONTOH 3: Full Screen Loading
// ============================================================================

function contohFullScreenLoading() {
  // Tampilkan loading screen saat aplikasi init
  const loadingScreen = LoadingScreen({ 
    message: 'Inisialisasi sistem SMART AI',
    showDots: true 
  });
  document.body.appendChild(loadingScreen);
  
  // Sembunyikan setelah 3 detik
  setTimeout(() => {
    loadingScreen.classList.add('loading-fade-out');
    setTimeout(() => loadingScreen.remove(), 300);
  }, 3000);
}

// ============================================================================
// CONTOH 4: Skeleton Loading untuk Konten
// ============================================================================

function contohSkeletonLoading() {
  // Skeleton untuk card
  const cardSkeleton = LoadingSkeleton({ 
    type: 'card' 
  });
  document.getElementById('content-area').appendChild(cardSkeleton);
  
  // Skeleton untuk teks (3 baris)
  const textSkeleton = LoadingSkeleton({ 
    type: 'text', 
    lines: 3 
  });
  document.getElementById('content-area').appendChild(textSkeleton);
  
  // Skeleton untuk tabel (5 baris)
  const tableSkeleton = LoadingSkeleton({ 
    type: 'table', 
    rows: 5 
  });
  document.getElementById('table-container').appendChild(tableSkeleton);
  
  // Skeleton untuk form
  const formSkeleton = LoadingSkeleton({ 
    type: 'form' 
  });
  document.getElementById('form-container').appendChild(formSkeleton);
}

// ============================================================================
// CONTOH 5: Smart Loading (Loading Pintar)
// ============================================================================

function contohSmartLoading() {
  // Loading untuk upload file dengan progress
  const fileUploadLoader = SmartLoading({
    type: 'spinner',
    progress: 0,
    text: 'Mengunggah dokumen SLF...',
    target: document.getElementById('upload-area')
  });
  
  // Update progress saat upload berjalan
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    fileUploadLoader.updateProgress(progress);
    fileUploadLoader.updateText(`Mengunggah... ${progress}%`);
    
    if (progress >= 100) {
      clearInterval(interval);
      fileUploadLoader.updateText('Upload selesai!');
      setTimeout(() => fileUploadLoader.remove(), 500);
    }
  }, 500);
}

// ============================================================================
// CONTOH 6: Loading Dots Inline
// ============================================================================

function contohLoadingDots() {
  // Gunakan dalam teks
  const statusElement = document.createElement('div');
  statusElement.innerHTML = 'Sistem sedang memproses';
  statusElement.appendChild(LoadingDots({ color: '#aa3bff', size: 6 }));
  document.body.appendChild(statusElement);
  
  // Atau dengan warna custom
  const button = document.createElement('button');
  button.innerHTML = 'Menyimpan';
  button.appendChild(LoadingDots({ color: '#ffffff', size: 4 }));
  button.disabled = true;
  document.body.appendChild(button);
}

// ============================================================================
// CONTOH 7: Page Transition
// ============================================================================

function contohPageTransition() {
  // Saat navigasi antar halaman
  window.addEventListener('beforeunload', () => {
    const transition = PageTransitionLoader();
    document.body.appendChild(transition);
  });
}

// ============================================================================
// CONTOH 8: Loading untuk API Calls
// ============================================================================

async function contohLoadingAPI() {
  // Tampilkan loading sebelum fetch
  const loader = SmartLoading({
    type: 'logo',
    text: 'Memuat data pengkajian...',
    fullscreen: false,
    target: document.getElementById('assessment-container')
  });
  
  try {
    // Simulasi API call
    const response = await fetch('/api/assessment/123');
    const data = await response.json();
    
    // Update text sebelum remove
    loader.updateText('Data berhasil dimuat!');
    
    // Tunggu sebentar lalu hapus
    setTimeout(() => {
      loader.remove();
      // Render data
      renderAssessmentData(data);
    }, 500);
    
  } catch (error) {
    loader.updateText('Gagal memuat data. Silakan coba lagi.');
    setTimeout(() => loader.remove(), 2000);
  }
}

// ============================================================================
// CONTOH 9: Loading untuk Form Submit
// ============================================================================

function contohLoadingFormSubmit() {
  const form = document.getElementById('slf-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Tampilkan loading fullscreen
    const loader = SmartLoading({
      type: 'screen',
      text: 'Menyimpan data pengkajian...',
      fullscreen: true
    });
    
    try {
      // Submit form
      const formData = new FormData(form);
      const response = await fetch('/api/assessment', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        loader.updateText('Data berhasil disimpan!');
        setTimeout(() => {
          loader.remove();
          window.location.href = '/assessment/success';
        }, 1000);
      } else {
        throw new Error('Submit failed');
      }
      
    } catch (error) {
      loader.updateText('Terjadi kesalahan. Silakan coba lagi.');
      setTimeout(() => loader.remove(), 2000);
    }
  });
}

// ============================================================================
// CONTOH 10: Loading untuk Proses Berat (ETABS, Simulasi)
// ============================================================================

function contohLoadingProsesBerat() {
  // Untuk proses yang memakan waktu seperti import ETABS
  const loader = SmartLoading({
    type: 'spinner',
    progress: 0,
    text: 'Mengimpor data ETABS...',
    fullscreen: true
  });
  
  // Simulasi progress bertahap
  const steps = [
    { progress: 10, text: 'Membaca file ETABS...' },
    { progress: 25, text: 'Menganalisis struktur...' },
    { progress: 40, text: 'Mengekstrak data beban...' },
    { progress: 60, text: 'Memproses hasil analisis...' },
    { progress: 80, text: 'Menyimpan ke database...' },
    { progress: 100, text: 'Import selesai!' }
  ];
  
  let stepIndex = 0;
  const interval = setInterval(() => {
    if (stepIndex < steps.length) {
      const step = steps[stepIndex];
      loader.updateProgress(step.progress);
      loader.updateText(step.text);
      stepIndex++;
    } else {
      clearInterval(interval);
      setTimeout(() => loader.remove(), 1000);
    }
  }, 1500);
}

// ============================================================================
// CONTOH 11: Multiple Loading States
// ============================================================================

class AssessmentPageLoader {
  constructor() {
    this.loaders = {};
  }
  
  showInitialLoad() {
    this.loaders.initial = SmartLoading({
      type: 'screen',
      text: 'Memuat halaman pengkajian...'
    });
  }
  
  showDataLoad() {
    this.loaders.data = SmartLoading({
      type: 'spinner',
      text: 'Mengambil data bangunan...',
      target: document.getElementById('building-info')
    });
  }
  
  showCalculationLoad() {
    this.loaders.calc = SmartLoading({
      type: 'logo',
      size: 60,
      text: 'Menghitung skor...',
      target: document.getElementById('score-section')
    });
  }
  
  hideAll() {
    Object.values(this.loaders).forEach(loader => {
      if (loader && loader.remove) loader.remove();
    });
    this.loaders = {};
  }
}

// Penggunaan
const pageLoader = new AssessmentPageLoader();

// Saat halaman dimuat
pageLoader.showInitialLoad();

// Setelah initial load selesai
setTimeout(() => {
  pageLoader.loaders.initial.remove();
  pageLoader.showDataLoad();
}, 2000);

// ============================================================================
// INTEGRASI DENGAN APP UTAMA
// ============================================================================

export function initLoadingSystem() {
  // Tambahkan event listeners global
  
  // Auto show loading saat fetch API
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const loader = SmartLoading({
      type: 'dots',
      target: document.body
    });
    
    try {
      const response = await originalFetch(...args);
      loader.remove();
      return response;
    } catch (error) {
      loader.remove();
      throw error;
    }
  };
  
  // Show loading saat window load
  window.addEventListener('load', () => {
    const initialLoader = LoadingScreen({
      message: 'Memuat SMART AI Pengkaji SLF'
    });
    document.body.appendChild(initialLoader);
    
    // Hide setelah app ready
    setTimeout(() => {
      initialLoader.classList.add('loading-fade-out');
      setTimeout(() => initialLoader.remove(), 300);
    }, 1500);
  });
}

// ============================================================================
// CSS IMPORT
// ============================================================================

// Import CSS di file utama aplikasi:
// import './LoadingAnimations.css';

// Atau di HTML:
// <link rel="stylesheet" href="/src/components/common/LoadingAnimations.css">
