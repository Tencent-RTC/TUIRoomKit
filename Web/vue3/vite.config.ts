import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
const path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
  // 静态资源基础路径 base: './' || '',
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@TUIRoom': path.resolve(__dirname, 'src/TUIRoom'),
    },
  },
  plugins: [
    vue({
      // 说明：解决了引入生成userSig 文件的问题
      // reactivityTransform: true,
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
  // https://cn.vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
  optimizeDeps: {
    include: ['@tencentcloud/tuiroom-engine-js'],
  },
  build: {
    commonjsOptions: {
      exclude: ['@tencentcloud/tuiroom-engine-js'],
      include: [],
    },
  },
});
