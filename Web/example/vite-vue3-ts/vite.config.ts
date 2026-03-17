import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import legacy from '@vitejs/plugin-legacy';

const path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
  // Static Resource Base Path base: './' || '',
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Custom Split Strategy
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
    legacy({
      targets: ['ie >= 11'], // Specify the browser targets here
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'], // Optional polyfills
    }),
  ],
});
