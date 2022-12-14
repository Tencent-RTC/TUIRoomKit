import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
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
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver({
        importStyle: 'sass',
      })],
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "./src/assets/style/global.scss" as *;
        `,
      },
    },
  },
  server: {
    open: true,
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
