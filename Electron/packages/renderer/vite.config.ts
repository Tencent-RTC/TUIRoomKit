import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import resolve, { lib2esm } from 'vite-plugin-resolve'
import electron from 'vite-plugin-electron/renderer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvg } from './src/TUIRoom/assets/icons/index.js'
const path = require('path')
// @ts-ignore
import pkg from '../../package.json'

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@TUIRoom': path.resolve(__dirname, 'src/TUIRoom'),
    },
  },
  plugins: [
    vue({}),
    electron(),
    resolve(
      {
        'trtc-electron-sdk': lib2esm(
          'trtc-electron-sdk',
          Object.keys(require('trtc-electron-sdk')),
          { format: 'cjs' },
        ),
      }
    ),
    createSvg(path.join(path.resolve(__dirname, 'src/TUIRoom/assets/icons/svg/'), '/')),
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
          @use "@/assets/style/global.scss" as *;
          @use "@/TUIRoom/assets/style/element.scss" as *;
        `,
      },
    },
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
})
