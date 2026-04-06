import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Check if HTTPS certs exist (for local dev with microphone)
const keyPath = path.resolve(__dirname, 'localhost-key.pem');
const certPath = path.resolve(__dirname, 'localhost-cert.pem');
const hasHttpsCerts = fs.existsSync(keyPath) && fs.existsSync(certPath);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    ...(hasHttpsCerts
      ? {
          https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          },
        }
      : {}),
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/audio': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // ── Build optimizations ──────────────────────────────────────────────────
  build: {
    target: 'es2020',
    // Enable CSS code splitting per async chunk
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Separate vendor chunks for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-state': ['zustand'],
        },
      },
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
