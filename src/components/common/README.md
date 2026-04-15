# Loading Components - SMART AI Pengkaji SLF

Komponen loading animasi profesional dan modern menggunakan logo SMART AI Pengkaji SLF. Dengan implementasi **Light/Dark Mode penuh** yang otomatis dan dapat dikontrol manual.

## 🎯 Fitur

- **6 Jenis Loading**: Logo, Spinner, Full Screen, Skeleton, Dots, Page Transition
- **Tema Light/Dark**: Implementasi penuh dengan CSS variables dan auto-detection
- **Animasi Modern**: Pulse, fade, shimmer, bounce, glow effects, dan spinner dengan gradient
- **Progress Tracking**: Real-time progress indicator dengan persentase
- **Responsive**: Works di semua ukuran layar
- **Theme Manager**: Kontrol tema global dengan event listeners
- **Easy Integration**: Import dan gunakan langsung

## 📦 File Structure

```
src/components/common/
├── LoadingComponents.js      # Komponen utama dengan theme manager
├── LoadingAnimations.css     # CSS animations dengan CSS variables tema
├── LoadingUsageExample.js    # Contoh penggunaan
└── README.md                 # Dokumentasi ini
```

## 🚀 Quick Start

### 1. Import CSS (WAJIB)

Di file `src/style.css`, sudah ada import:

```css
@import './components/common/LoadingAnimations.css';
```

### 2. Import Components

```javascript
import {
  LoadingLogo,
  LoadingSpinner,
  LoadingScreen,
  SmartLoading,
  themeManager  // Theme manager untuk kontrol global
} from './components/common/LoadingComponents.js';
```

### 3. Gunakan Component (Auto Theme)

```javascript
// Loading dengan tema otomatis (mengikuti sistem)
const loader = LoadingLogo({ text: 'Memuat...' });
document.body.appendChild(loader);

// Hapus loading
loader.remove();
```

### 4. Kontrol Tema Manual

```javascript
// Set tema global
import { themeManager } from './components/common/LoadingComponents.js';

// Set tema manual
themeManager.setTheme('dark');  // 'light' | 'dark' | 'auto'

// Dengarkan perubahan tema
themeManager.onThemeChange((theme) => {
  console.log('Tema berubah ke:', theme);
});
```

## 🎨 Komponen Tersedia

Semua komponen mendukung properti `theme`: `'light'` | `'dark'` | `'auto'` (default)

### 1. LoadingLogo

Logo dengan animasi pulse, glow effect, dan tema support.

```javascript
LoadingLogo({
  size: 120,           // Ukuran logo (px)
  text: 'Memuat...',   // Teks loading
  showText: true,      // Tampilkan teks?
  theme: 'auto'        // 'light' | 'dark' | 'auto'
});
```

**Contoh:**
```javascript
// Auto theme (mengikuti sistem)
const logo = LoadingLogo({ 
  size: 80, 
  text: 'Memuat data bangunan...',
  theme: 'auto'
});

// Force dark theme
const logoDark = LoadingLogo({ 
  size: 80, 
  text: 'Memuat...',
  theme: 'dark'
});

document.getElementById('container').appendChild(logo);
```

### 2. LoadingSpinner

Spinner dengan progress indicator dan tema support.

```javascript
LoadingSpinner({
  progress: 45,        // Progress 0-100 (null = infinite)
  size: 80,            // Ukuran spinner
  text: 'Mengunggah...', // Teks loading
  theme: 'auto'        // 'light' | 'dark' | 'auto'
});
```

**Contoh:**
```javascript
// Dengan progress dan auto theme
const spinner = LoadingSpinner({ 
  progress: 45, 
  text: 'Mengunggah dokumen...',
  theme: 'auto'
});

// Force light theme
const spinnerLight = LoadingSpinner({ 
  size: 100,
  text: 'Memuat...',
  theme: 'light'
});
```

### 3. LoadingScreen

Full screen loading overlay dengan efek particles, glow, dan tema support.

```javascript
LoadingScreen({
  message: 'Sistem sedang memproses',
  showDots: true,     // Animasi dots
  theme: 'auto'       // 'light' | 'dark' | 'auto'
});
```

**Contoh:**
```javascript
// Full screen dengan auto theme
const screen = LoadingScreen({ 
  message: 'Inisialisasi SMART AI',
  showDots: true,
  theme: 'auto'
});
document.body.appendChild(screen);

// Dark mode splash screen
const darkScreen = LoadingScreen({ 
  message: 'Memuat aplikasi...',
  showDots: true,
  theme: 'dark'
});

// Hide setelah 3 detik
setTimeout(() => {
  screen.classList.add('loading-fade-out');
  setTimeout(() => screen.remove(), 300);
}, 3000);
```

### 4. LoadingSkeleton

Skeleton placeholder untuk konten dengan shimmer effect dan tema support.

```javascript
LoadingSkeleton({
  type: 'card',        // 'card' | 'text' | 'table' | 'form' | 'list'
  lines: 3,            // Untuk type 'text'
  rows: 5,             // Untuk type 'table'
  theme: 'auto'        // 'light' | 'dark' | 'auto'
});
```

**Contoh:**
```javascript
// Skeleton card dengan auto theme
const card = LoadingSkeleton({ 
  type: 'card',
  theme: 'auto'
});

// Skeleton table dark mode
const table = LoadingSkeleton({ 
  type: 'table', 
  rows: 5,
  theme: 'dark'
});

// Skeleton list
const list = LoadingSkeleton({ 
  type: 'list', 
  rows: 8,
  theme: 'auto'
});

document.getElementById('content').appendChild(card);
```

### 5. LoadingDots

Inline loading dots.

```javascript
LoadingDots({
  color: '#aa3bff',    // Warna dots
  size: 8              // Ukuran dots (px)
});
```

**Contoh:**
```javascript
const status = document.createElement('span');
status.textContent = 'Menyimpan';
status.appendChild(LoadingDots({ color: '#aa3bff', size: 6 }));
```

### 6. SmartLoading

Loading pintar dengan control methods dan tema support.

```javascript
SmartLoading({
  type: 'logo',        // 'logo' | 'spinner' | 'screen' | 'skeleton' | 'dots' | 'page'
  fullscreen: false,    // Fullscreen mode?
  progress: null,      // Progress 0-100
  text: 'Memuat...',   // Teks loading
  target: document.body, // Target container
  theme: 'auto',       // 'light' | 'dark' | 'auto'
  // Options untuk skeleton:
  skeletonType: 'card', // 'card' | 'text' | 'table' | 'form' | 'list'
  lines: 3,
  rows: 5
});
```

**Return Object Methods:**
- `updateProgress(value)` - Update progress (0-100)
- `updateText(text)` - Update teks loading
- `setTheme(theme)` - Update tema ('light' | 'dark')
- `remove()` - Hapus loading dengan fade out

**Contoh:**
```javascript
const loader = SmartLoading({
  type: 'spinner',
  progress: 0,
  text: 'Mengunggah...',
  target: document.body,
  theme: 'auto'
});

// Update progress
loader.updateProgress(50);
loader.updateText('50% selesai...');

// Ganti tema saat runtime
loader.setTheme('dark');

// Remove
loader.remove();
```

## 💡 Use Cases

### 1. API Call Loading

```javascript
async function fetchData() {
  const loader = SmartLoading({
    type: 'logo',
    text: 'Memuat data...',
    target: document.getElementById('content')
  });
  
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    renderData(data);
  } catch (error) {
    showError(error);
  } finally {
    loader.remove();
  }
}
```

### 2. Form Submit Loading

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const loader = SmartLoading({
    type: 'screen',
    text: 'Menyimpan data...'
  });
  
  try {
    await submitForm(formData);
    loader.updateText('Berhasil disimpan!');
    setTimeout(() => loader.remove(), 1000);
  } catch (error) {
    loader.updateText('Gagal menyimpan');
    setTimeout(() => loader.remove(), 2000);
  }
});
```

### 3. File Upload dengan Progress

```javascript
const loader = SmartLoading({
  type: 'spinner',
  progress: 0,
  text: 'Mengunggah...'
});

// Simulasi upload progress
let progress = 0;
const interval = setInterval(() => {
  progress += 10;
  loader.updateProgress(progress);
  
  if (progress >= 100) {
    clearInterval(interval);
    loader.remove();
  }
}, 500);
```

### 4. Initial App Loading

```javascript
window.addEventListener('load', () => {
  const loader = LoadingScreen({
    message: 'Memuat SMART AI Pengkaji SLF'
  });
  document.body.appendChild(loader);
  
  // Hide setelah app ready
  setTimeout(() => {
    loader.classList.add('loading-fade-out');
    setTimeout(() => loader.remove(), 300);
  }, 1500);
});
```

### 5. Button Loading State

```javascript
button.addEventListener('click', () => {
  button.classList.add('btn-loading');
  button.disabled = true;
  
  doAsyncWork().then(() => {
    button.classList.remove('btn-loading');
    button.disabled = false;
  });
});
```

## 🎭 CSS Utility Classes

### Loading States

```css
.is-loading          /* Elemen sedang loading */
.loading-overlay     /* Overlay loading */
.btn-loading        /* Button loading state */
.content-loading    /* Content placeholder */
.section-loading    /* Section loading state */
```

### Penggunaan

```html
<!-- Section loading -->
<div class="section-loading">
  <!-- Loading content akan muncul di tengah -->
</div>

<!-- Button loading -->
<button class="btn-loading">Simpan</button>

<!-- Content loading placeholder -->
<div class="content-loading" style="height: 100px;"></div>
```

## 🌓 Dark Mode Support

Loading components otomatis menyesuaikan dengan dark mode:

```css
@media (prefers-color-scheme: dark) {
  /* Warna loading akan menyesuaikan */
}
```

## 📱 Responsive

Loading components responsive di semua ukuran layar:

- Desktop: Full animasi
- Tablet: Adjusted sizes
- Mobile: Optimized for touch

## 🎯 Best Practices

1. **Jangan overuse loading** - Gunakan hanya untuk proses yang memang butuh waktu
2. **Progress indicator** - Untuk proses > 3 detik, gunakan progress bar
3. **Cancel option** - Untuk proses lama, sediakan tombol cancel
4. **Error handling** - Selalu handle error dan hide loading
5. **Accessibility** - Gunakan aria-live untuk screen readers

## 🔧 Customization

### Custom Colors

Edit `LoadingAnimations.css`:

```css
:root {
  --loading-primary: #aa3bff;    /* Primary brand color */
  --loading-secondary: #c084fc;  /* Secondary color */
}
```

### Custom Animation Speed

```css
.loading-logo-img {
  animation-duration: 3s; /* Default: 2s */
}
```

### Custom Size

```javascript
LoadingLogo({ size: 200 }); // Super large logo
```

## 🐛 Troubleshooting

### Logo tidak muncul

Pastikan path logo benar:
```javascript
// Check path
'/Logo SMART AI Pengkaji SLF (Small).png'
```

### Animasi tidak smooth

Pastikan CSS sudah diimport:
```css
@import './components/common/LoadingAnimations.css';
```

### Z-index issues

Tambahkan z-index jika perlu:
```css
.loading-screen-overlay {
  z-index: 9999 !important;
}
```

## 📚 Lihat Juga

- `LoadingUsageExample.js` - Contoh lengkap penggunaan
- `style.css` - Integrasi dengan app utama

## 🤝 Support

Untuk pertanyaan atau issues, hubungi tim development SMART AI Pengkaji SLF.
