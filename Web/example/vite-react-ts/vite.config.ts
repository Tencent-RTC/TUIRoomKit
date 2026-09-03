import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Static Resource Base Path base: './' || '',
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Force all packages to use the same React instance to avoid
      // "Invalid hook call" caused by multiple React copies in monorepo
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(
        __dirname,
        'node_modules/react/jsx-runtime'
      ),
    },
    dedupe: ['react', 'react-dom'],
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
    react(),
    visualizer({
      // open: true,
    }),
  ],
});
