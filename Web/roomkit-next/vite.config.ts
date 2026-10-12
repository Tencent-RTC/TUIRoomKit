import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { dependencies, peerDependencies } from './package.json';
import type { Plugin } from 'vite';

const STYLE_FILE_NAME = 'style.css';

// Styles stay in a standalone, overridable style.css, but the entry pulls it in
// so hosts do not have to import it themselves.
function importStylesFromEntry(): Plugin {
  return {
    name: 'rk-import-styles-from-entry',
    // Runs after vite:css-post has emitted the stylesheet asset
    enforce: 'post',
    generateBundle(options, bundle) {
      const hasStyles = Object.values(bundle).some(
        file => file.type === 'asset' && file.fileName === STYLE_FILE_NAME,
      );
      if (!hasStyles) {
        return;
      }

      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && file.isEntry) {
          if (options.format !== 'cjs') {
            file.code = `import './${STYLE_FILE_NAME}';\n${file.code}`;
          } else {
            // Keep the directive prologue first so strict mode still applies
            const prologue = '"use strict";\n';
            const body = file.code.startsWith(prologue)
              ? file.code.slice(prologue.length)
              : file.code;
            const directive = file.code.startsWith(prologue) ? prologue : '';

            file.code = `${directive}require('./${STYLE_FILE_NAME}');\n${body}`;
          }
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    // One standalone stylesheet keeps every rule interceptable and overridable
    cssCodeSplit: false,
    rollupOptions: {
      // Support sub-path imports for dependencies and peer dependencies
      external: (id: string) => {
        const externalDeps = [
          ...Object.keys(dependencies || {}),
          ...Object.keys(peerDependencies || {}),
        ];
        return externalDeps.some(dep => id === dep || id.startsWith(`${dep}/`));
      },
      input: ['roomkit/index.ts'],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].mjs',
          assetFileNames: 'style.css',
          preserveModules: true,
          preserveModulesRoot: 'roomkit',
          exports: 'named',
          dir: 'es',
          globals: {
            vue: 'Vue',
          },
        },
        {
          format: 'cjs',
          entryFileNames: '[name].js',
          assetFileNames: 'style.css',
          preserveModules: true,
          preserveModulesRoot: 'roomkit',
          exports: 'named',
          dir: 'lib',
          globals: {
            vue: 'Vue',
          },
        },
      ],
    },
    lib: {
      entry: './roomkit/index.ts',
      name: 'TUIRoomKit',
    },
  },
  plugins: [
    vue(),
    viteCommonjs(),
    importStylesFromEntry(),
    dts({
      entryRoot: './roomkit',
      outDir: ['lib/', 'es/'],
      exclude: ['node_modules/**', 'test/**'],
    }),
  ],
  resolve: {},
});
