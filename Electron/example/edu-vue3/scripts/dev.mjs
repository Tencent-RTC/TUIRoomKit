import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electronPath from 'electron';
import { createServer } from 'vite';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const server = await createServer({
  configFile: path.join(projectRoot, 'vite.config.ts'),
});
await server.listen();
server.printUrls();

const devServerUrl = server.resolvedUrls.local[0];

const electronProcess = spawn(electronPath, [path.join(projectRoot, 'electron/main/index.cjs')], {
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: devServerUrl },
});

electronProcess.on('exit', async (code) => {
  await server.close();
  process.exit(code ?? 0);
});

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => electronProcess.kill(signal));
});
