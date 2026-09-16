import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    // `scripts/**` ikut disertakan: skrip pemeriksa (gerbang rahasia, audit)
    // menentukan apakah build boleh jalan, jadi perilakunya perlu dikunci tes
    // seperti kode aplikasi.
    include: ['src/**/*.test.js', 'scripts/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/**/*.test.js',
        'src/**/index.js',
        'src/main.js',
        'src/pages/**/*.js',
        'src/components/**/*.js'
      ]
    },
    setupFiles: ['./src/tests/setup.js']
  },
  resolve: {
    alias: {
      '@': '/src',
      '@lib': '/src/lib',
      '@domain': '/src/domain',
      '@application': '/src/application',
      '@infrastructure': '/src/infrastructure'
    }
  }
});
