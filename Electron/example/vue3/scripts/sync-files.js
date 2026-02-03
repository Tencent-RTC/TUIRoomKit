const fs = require('fs');
const path = require('path');
const { arch, platform } = process;

function rsyncQTDependency() {
  let sourcePath = '';
  if (platform === 'win32') {
    // windows
    const pluginPath = path.resolve(
      __dirname,
      `../node_modules/@tencentcloud/roomkit-electron-vue3/node_modules`
    );
    if(!fs.existsSync(pluginPath)) {
      sourcePath = path.resolve(
        __dirname,
        `../node_modules/trtc-electron-plugin-xmagic/plugin/XMagic/win/${arch}/platforms/qwindows.dll`
      );
    } else {
      sourcePath = path.resolve(
        __dirname,
        `../node_modules/@tencentcloud/roomkit-electron-vue3/node_modules/trtc-electron-plugin-xmagic/plugin/XMagic/win/${arch}/platforms/qwindows.dll`
      );
    }
    rsyncOnWindows(sourcePath);
  } else if (platform === 'darwin') {
    // mac os
  } else if (platform === 'linux') {
    // linux
  } else {
    console.error(
      `Platform "${platform}" is supported by trtc-electron-sdk and the beauty library.`
    );
  }
}

function rsyncOnWindows(sourcePath) {
  const electronFolder = path.resolve(
    __dirname,
    '../node_modules/electron/dist/'
  );
  const targetFolder = path.join(electronFolder, '/platforms');
  const targetPath = path.join(targetFolder, '/qwindows.dll');

  console.log('source:', sourcePath);
  console.log('target:', targetPath);

  if (fs.existsSync(electronFolder)) {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetFolder, { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
    } else {
      // 已经存在，不用同步
      console.log('already exist, not need rsync');
    }
  } else {
    console.error(
      'Electron not install correctly, make sure to install electron firstly'
    );
  }
}

rsyncQTDependency();
