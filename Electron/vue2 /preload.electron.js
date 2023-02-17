console.log(`[preload.js] node version: ${process.versions.node}`);
console.log(`[preload.js] chrome version: ${process.versions.chrome}`);
console.log(`[preload.js] electron version: ${process.versions.electron}`);
console.log(`[preload.js] process.cwd(): ${process.cwd()}`);
console.log(`[preload.js] __dirname: ${__dirname}`);
console.log(`[preload.js] env.NODE_ENV: ${process.env.NODE_ENV}`);

const { ipcRenderer } = require('electron');
// 打印来自主进程的奔溃 dump 文件存放目录
ipcRenderer.on('crash-file-path', (event, args) => {
  console.warn('crash-file-path:', args);
});

// // crash test
// setTimeout(() => {
//   console.warn('---------------test crash');
//   process.crash();
// }, 10 * 1000);
