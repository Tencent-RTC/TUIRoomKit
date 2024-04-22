import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
const path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
  // 静态资源基础路径 base: './' || '',
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
        // 自定义拆分策略
        manualChunks: {
          roomEngine: ['@tencentcloud/tuiroom-engine-js'],
          roomkit: ['@tencentcloud/roomkit-web-vue3'],
        },
      },
    },
  },
  plugins: [
    vue({
      // 说明：解决了引入生成userSig 文件的问题
      // reactivityTransform: true,
    }),
    visualizer({
      // open: true,
    }),
  ],
  server: {
    open: true,
    // 解决 whistle 代理之后无限刷新页面问题
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
    },
  },
});
