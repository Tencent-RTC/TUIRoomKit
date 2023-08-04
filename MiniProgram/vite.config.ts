import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

import path from 'path';

function resolve(dir) {
  return path.join(__dirname, dir);
}

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['circlerich-trtc-cloud-wx'],
  },
  plugins: [
    uni(),
  ],
  resolve: {
    alias: {
      '@': resolve('src'),
      '@TUIRoom': resolve('src/TUIRoom'),
    },
  },
  build: {
    // rollupOptions: {
    //   external: 'circlerich-trtc-cloud-wx'
    // }
  },
});
