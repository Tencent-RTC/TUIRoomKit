const replace = require('replace');
const fs = require('fs');
const path = require('path');
const targetDir = '../../TUIRoomKit/Electron/vue3';
const packagePath = path.resolve(`../${targetDir}/package.json`);
// 修改 package.json 中的 script 内容
const JsonContent = JSON.parse(fs.readFileSync(packagePath));
const newScript = {
  "dev": "cross-env VITE_RUNTIME_ENV=github node scripts/watch.mjs",
  "prebuild": "node scripts/build.mjs",
  "build": "electron-builder"
};
JsonContent.scripts = newScript;
fs.writeFile(packagePath, JSON.stringify(JsonContent," ",2),(err) => {
  console.log(err);
});