console.log(`[preload.js] node version: ${process.versions.node}`);
console.log(`[preload.js] chrome version: ${process.versions.chrome}`);
console.log(`[preload.js] electron version: ${process.versions.electron}`);
console.log(`[preload.js] process.cwd(): ${process.cwd()}`);
console.log(`[preload.js] __dirname: ${__dirname}`);
console.log(`[preload.js] env.NODE_ENV: ${process.env.NODE_ENV}`);

const { ipcRenderer } = require('electron');
// Print the directory where the crash dump file from the master process is stored
ipcRenderer.on('crash-file-path', (event, args) => {
  console.warn('crash-file-path:', args);
});

// // crash test
// setTimeout(() => {
//   console.warn('---------------test crash');
//   process.crash();
// }, 10 * 1000);
