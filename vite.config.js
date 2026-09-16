import { defineConfig, loadEnv } from 'vite';

// Target proxy dev untuk Edge Function. Diambil dari VITE_SUPABASE_URL
// (.env) supaya project ref TIDAK lagi di-hardcode di konfigurasi —
// sebelumnya semua orang yang meng-clone repo ini otomatis diarahkan
// ke database produksi milik pemilik repo.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseTarget = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  define: {
    global: 'window',
  },
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,   // Hapus semua console.log di production
        drop_debugger: true,
      }
    },
    // PERFORMANCE FIX: Manual chunk splitting untuk parallel loading
    //
    // Memakai bentuk FUNGSI (bukan objek) supaya pustaka berat dipisah
    // satu per satu ke chunk tersendiri. Efeknya:
    //   1. Chunk vendor besar jarang berubah → browser tidak perlu
    //      mengunduhnya ulang setiap kali kode aplikasi berubah.
    //   2. Halaman yang tidak memakai pustaka tertentu (mis. halaman
    //      tanpa grafik 3D) tidak ikut mengunduh chunk itu.
    // Pustaka di luar daftar dibiarkan mengikuti keputusan Rollup.
    rollupOptions: {
      input: { main: './index.html' },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Ambil nama paket, termasuk scope (@scope/nama)
          const match = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
          if (!match) return;
          const pkg = match[1];

          const GROUPS = {
            'three':      ['three'],
            'charts':     ['chart.js'],
            'xlsx':       ['xlsx'],
            'pdf':        ['jspdf', 'jspdf-autotable'],
            // Generator laporan dan penampil pratinjau dipisah: tab pratinjau
            // cukup memuat docx-preview saja, tanpa ikut menarik generator.
            'docx':       ['docx', 'docxtemplater', 'pizzip', 'file-saver'],
            'docx-preview': ['docx-preview'],
            'screenshot': ['html2canvas'],
            'ai-local':   ['@tensorflow/tfjs', '@xenova/transformers'],
            'markdown':   ['marked'],
            'dompurify':  ['dompurify'],
            'supabase':   ['@supabase/supabase-js'],
            'tesseract':  ['tesseract.js'],
          };

          for (const [chunkName, packages] of Object.entries(GROUPS)) {
            if (packages.includes(pkg)) return chunkName;
          }
          return undefined;   // sisanya biarkan Rollup yang mengatur
        }
      }
    }
  },
  optimizeDeps: {
    include: ['tesseract.js'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    // Host yang diizinkan mengakses server dev.
    //
    // Sejak Vite 5.4.12, permintaan dengan header Host yang tidak dikenal
    // ditolak (HTTP 403) sebagai perlindungan terhadap DNS rebinding. Server
    // dev di lingkungan kerja ini diakses lewat domain pratinjau
    // *.e2b.app — tanpa pendaftaran di bawah, halaman pratinjau selalu
    // gagal dimuat dengan pesan "Blocked request".
    //
    // `*.e2b.app` adalah domain pratinjau sandbox; localhost dan alamat IP
    // lokal sudah diizinkan Vite secara bawaan. Entri ini HANYA berlaku untuk
    // server dev dan tidak memengaruhi hasil build produksi.
    allowedHosts: ['localhost', '127.0.0.1', '.e2b.app', '.e2b.dev'],
    proxy: {
      // Proxy ke Supabase Edge Function saat development
      '/functions': {
        target: supabaseTarget,
        changeOrigin: true,
        secure: true,
      },
      // Proxy langsung ke AI APIs (hanya dev — di production pakai Edge Function)
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, '')
      },
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, '')
      },
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, '')
      },
      '/api/groq': {
        target: 'https://api.groq.com/openai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/groq/, '')
      },
      '/api/mistral': {
        target: 'https://api.mistral.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mistral/, '')
      },
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, '')
      },
    }
  }
};
});
