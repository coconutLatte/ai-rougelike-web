import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
