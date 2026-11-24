import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  // Packaged app loads index.html over file://, so assets must use relative paths.
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // The test userSig service allows CORS only for whitelisted origins such as http://localhost:5174.
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    outDir: path.resolve(__dirname, 'renderer'),
    emptyOutDir: true,
  },
  plugins: [vue()],
});
