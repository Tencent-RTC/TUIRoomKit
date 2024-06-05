const { exec } = require('child_process');

const { arch, platform } = process;

if (platform === 'darwin') {
  console.log('postinstall:', process.cwd());
  exec(`rsync -a ./node_modules/trtc-electron-sdk/build/mac-framework/${arch}/ ./node_modules/electron/dist/Electron.app/Contents/Frameworks`);
}
