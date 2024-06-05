console.log(`[preload] node version: ${process.versions.node}`);
console.log(`[preload] chrome version: ${process.versions.chrome}`);
console.log(`[preload] electron version: ${process.versions.electron}`);
console.log(`[preload] process.cwd(): ${process.cwd()}`);
console.log(`[preload] process.resourcesPath: ${process.resourcesPath}`);
console.log(`[preload] __dirname: ${__dirname}`);
console.log(`[preload] env.NODE_ENV: ${process.env.NODE_ENV}`);

import { domReady } from './utils'
import { useLoading } from './loading'

const { appendLoading, removeLoading } = useLoading()
window.removeLoading = removeLoading

domReady().then(appendLoading)
