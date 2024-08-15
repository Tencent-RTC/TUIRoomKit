import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import resolve from 'vite-plugin-resolve';
import electron from 'vite-plugin-electron/renderer';
import pkg from '../../package.json';

const path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      pinia: path.resolve(__dirname, '../../node_modules/pinia'),
    },
  },
  plugins: [
    vue({}),
    electron(),
    resolve({
      'trtc-electron-sdk': `
          const TRTCCloud = require("trtc-electron-sdk");
          const TRTCParams = TRTCCloud.TRTCParams;
          const TRTCAppScene = TRTCCloud.TRTCAppScene;
          const TRTCVideoStreamType = TRTCCloud.TRTCVideoStreamType;
          const TRTCScreenCaptureSourceType = TRTCCloud.TRTCScreenCaptureSourceType;
          const TRTCVideoEncParam = TRTCCloud.TRTCVideoEncParam;
          const Rect = TRTCCloud.Rect;
          const TRTCAudioQuality = TRTCCloud.TRTCAudioQuality;
          const TRTCScreenCaptureSourceInfo = TRTCCloud.TRTCScreenCaptureSourceInfo;
          const TRTCDeviceInfo = TRTCCloud.TRTCDeviceInfo;
          const TRTCVideoQosPreference = TRTCCloud.TRTCVideoQosPreference;
          const TRTCQualityInfo = TRTCCloud.TRTCQualityInfo;
          const TRTCQuality = TRTCCloud.TRTCQuality;
          const TRTCStatistics = TRTCCloud.TRTCStatistics;
          const TRTCVolumeInfo = TRTCCloud.TRTCVolumeInfo;
          const TRTCDeviceType = TRTCCloud.TRTCDeviceType;
          const TRTCDeviceState = TRTCCloud.TRTCDeviceState;
          const TRTCBeautyStyle = TRTCCloud.TRTCBeautyStyle;
          const TRTCVideoResolution = TRTCCloud.TRTCVideoResolution;
          const TRTCVideoResolutionMode = TRTCCloud.TRTCVideoResolutionMode;
          const TRTCVideoMirrorType = TRTCCloud.TRTCVideoMirrorType;
          const TRTCVideoRotation = TRTCCloud.TRTCVideoRotation;
          const TRTCVideoFillMode = TRTCCloud.TRTCVideoFillMode;
          const TRTCRoleType = TRTCCloud.TRTCRoleType;
          const TRTCScreenCaptureProperty = TRTCCloud.TRTCScreenCaptureProperty;
          export { 
            TRTCParams,
            TRTCAppScene,
            TRTCVideoStreamType,
            TRTCScreenCaptureSourceType,
            TRTCVideoEncParam,
            Rect,
            TRTCAudioQuality,
            TRTCScreenCaptureSourceInfo,
            TRTCDeviceInfo,
            TRTCVideoQosPreference,
            TRTCQualityInfo,
            TRTCStatistics,
            TRTCVolumeInfo,
            TRTCDeviceType,
            TRTCDeviceState,
            TRTCBeautyStyle,
            TRTCVideoResolution,
            TRTCVideoResolutionMode,
            TRTCVideoMirrorType,
            TRTCVideoRotation,
            TRTCVideoFillMode,
            TRTCRoleType,
            TRTCQuality,
            TRTCScreenCaptureProperty,
          };
          export default TRTCCloud.default;
        `,
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/assets/style/global.scss" as *;
        `,
      },
    },
  },
  optimizeDeps: {
    include: ['@tencentcloud/tuiroom-engine-electron'],
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: true,
    commonjsOptions: {
      exclude: ['@tencentcloud/tuiroom-engine-electron'],
      include: [],
    },
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
    proxy: {
      '/api': {
        target: 'https://service.trtc.qcloud.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
});
