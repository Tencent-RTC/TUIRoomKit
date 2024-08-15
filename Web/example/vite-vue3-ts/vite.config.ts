import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
const path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
  // Static Resource Base Path base: './' || '',
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      pinia: path.resolve(__dirname, './node_modules/pinia'),
      '@TUIRoom': path.resolve(__dirname, 'src/TUIRoom'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Custom Split Strategy
        manualChunks: {
          roomEngine: ['@tencentcloud/tuiroom-engine-js'],
          roomkit: ['@tencentcloud/roomkit-web-vue3'],
        },
      },
    },
  },
  plugins: [
    vue({
      // Explanation: Solved the problem of introducing the generation of userSig files.
      // reactivityTransform: true,
    }),
    visualizer({
      // open: true,
    }),
  ],
  server: {
    open: true,
    // Solve the problem of infinite page refresh after whistle proxy
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
    },
    proxy: {
      '/api': {
        target: 'https://service.trtc.qcloud.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
});
