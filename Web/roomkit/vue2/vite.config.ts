import { defineConfig } from 'vite';
import vue2 from '@vitejs/plugin-vue2';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { dependencies, peerDependencies } from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // compressed
    minify: false,
    rollupOptions: {
      external: [
        ...Object.keys(dependencies),
        ...Object.keys(peerDependencies),
      ],
      input: ['src/TUIRoom/index.ts'],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].mjs',
          preserveModules: true,
          preserveModulesRoot: 'src/TUIRoom',
          exports: 'named',
          dir: 'es',
          globals: {
            vue: 'Vue',
            pinia: 'pinia',
          },
        },
        {
          format: 'cjs',
          entryFileNames: '[name].js',
          preserveModules: true,
          preserveModulesRoot: 'src/TUIRoom',
          exports: 'named',
          dir: 'lib',
          globals: {
            vue: 'Vue',
            pinia: 'pinia',
          },
        },
      ],
    },
    lib: {
      entry: './src/TUIRoom/index.ts',
      name: 'TUIRoomKit',
    },
  },
  plugins: [
    vue2(),
    viteCommonjs(),
    cssInjectedByJsPlugin(),
    dts({
      entryRoot: './src/TUIRoom',
      outDir: ['lib/', 'es/'],
    }),
  ],
  optimizeDeps: {
    include: ['dayjs'],
  },
});
