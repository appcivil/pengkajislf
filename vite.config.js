import { defineConfig } from 'vite';

export default defineConfig({
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
    rollupOptions: {
      input: { main: './index.html' },
      output: {
        manualChunks: {
          // Vendor chunks — diload sekali dan di-cache browser
          'supabase':   ['@supabase/supabase-js'],
          'docx':       ['docx', 'file-saver'],
          'markdown':   ['marked'],
          'dompurify':  ['dompurify'],
          // INSPECTION MODULES: Bundle semua inspection pages bersama
          // untuk mengurangi HTTP requests dan memastikan tab switching lancar
          'inspection-modules': [
            './src/pages/fire-protection-inspection.js',
            './src/pages/building-intensity-inspection.js',
            './src/pages/architectural-inspection.js',
            './src/pages/egress-inspection.js',
            './src/pages/lps-inspection.js',
            './src/pages/electrical-inspection.js',
            './src/pages/environmental-inspection.js',
          ],
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy ke Supabase Edge Function saat development
      '/functions': {
        target: 'https://hrzplcqeadhvbrfhlfuh.supabase.co',
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
});
