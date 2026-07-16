import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { dependencies, peerDependencies } from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      // Support sub-path imports for dependencies and peer dependencies
      external: (id: string) => {
        const externalDeps = [
          ...Object.keys(dependencies || {}),
          ...Object.keys(peerDependencies || {}),
        ];
        return externalDeps.some(dep => id === dep || id.startsWith(`${dep}/`));
      },
      input: ['RoomKit/index.ts'],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].mjs',
          preserveModules: true,
          preserveModulesRoot: 'RoomKit',
          exports: 'named',
          dir: 'es',
          globals: {
            vue: 'Vue',
          },
        },
        {
          format: 'cjs',
          entryFileNames: '[name].js',
          preserveModules: true,
          preserveModulesRoot: 'RoomKit',
          exports: 'named',
          dir: 'lib',
          globals: {
            vue: 'Vue',
          },
        },
      ],
    },
    lib: {
      entry: './RoomKit/index.ts',
      name: 'TUIRoomKit',
    },
  },
  plugins: [
    vue(),
    viteCommonjs(),
    cssInjectedByJsPlugin(),
    dts({
      entryRoot: './RoomKit',
      outDir: ['lib/', 'es/'],
    }),
  ],
  resolve: {},
});
