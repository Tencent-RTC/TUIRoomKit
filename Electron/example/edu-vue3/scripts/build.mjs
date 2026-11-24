import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The renderer ships as static files: vite already bundles every renderer-side dependency,
// so nothing renderer-related needs to travel in the package.
await build({
  configFile: path.join(projectRoot, 'vite.config.ts'),
});

// The main process runs the same source in dev and in the packaged app, so it is copied
// as-is. electron-builder then packs it together with the production dependencies declared
// in the project manifest — the same zero-extra-logic path a customer integrates with:
// `require('@tencentcloud/roomkit-web-vue3/electron/main.cjs')` resolves from node_modules
// in dev and from the asar's node_modules after packaging.
await Promise.all(['main'].map(async (dir) => {
  const target = path.join(projectRoot, dir);
  await fs.rm(target, { recursive: true, force: true });
  await fs.cp(path.join(projectRoot, 'electron', dir), target, { recursive: true });
}));

console.log('[electron] main and renderer ready');
