import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
          // React JSX runtime entries need to stay external as well
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
        ];
        return externalDeps.some(dep => id === dep || id.startsWith(`${dep}/`));
      },
      // Main kit entry + isolated debug subpath (UserSig helper for quickstart only)
      input: ['RoomKit/index.ts', 'RoomKit/debug/index.ts'],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].mjs',
          preserveModules: true,
          preserveModulesRoot: 'RoomKit',
          exports: 'named',
          dir: 'es',
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
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
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      ],
    },
    lib: {
      entry: {
        index: './RoomKit/index.ts',
        'debug/index': './RoomKit/debug/index.ts',
      },
      name: 'TUIRoomKit',
    },
  },
  plugins: [
    react(),
    viteCommonjs(),
    cssInjectedByJsPlugin(),
    dts({
      entryRoot: './RoomKit',
      outDir: ['lib/', 'es/'],
    }),
  ],
  resolve: {},
});
