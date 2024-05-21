const { app, BrowserWindow, systemPreferences, crashReporter } = require('electron');
const path = require('path');

// Enable crash capture
crashReporter.start({
  productName: 'electron-tui-room-vue2',
  companyName: 'Tencent',
  submitURL: 'https://www.xxx.com',
  uploadToServer: false,
  ignoreSystemCrashHandler: false,
});

// Enable crash capture
let crashFilePath = '';
let crashDumpsDir = '';
try {
  // Low version of electron
  crashFilePath = path.join(app.getPath('temp'), `${app.getName()} Crashes`);
  console.log('————————crash path:', crashFilePath);

  // High version of electron
  crashDumpsDir = app.getPath('crashDumps');
  console.log('————————crashDumpsDir:', crashDumpsDir);
} catch (e) {
  console.error('Failed to get path to crashed file', e);
}

let win = null;

function logBothProcess(msg) {
  console.log(msg);
  if (win && win.webContents) {
    win.webContents.executeJavaScript(`console.log("${msg.toString()}")`);
  }
}

function getParam() {
  const param = {
    BIN_PATH: '',
    APP_PATH: '',
    TRTC_ENV: 'production',
  };
  const tmp = Array.from(process.argv);
  param.BIN_PATH = tmp[0];
  param.APP_PATH = tmp[1];
  tmp.forEach((value, index) => {
    if (index <= 1) return;
    const splitValue = value.split('=');
    const key = splitValue[0].replace(/--/g, '').replace(/\s/g, '')
      .toUpperCase();
    const val = splitValue[1].replace(/\s/g, '');
    if (typeof param[key] !== 'undefined') {
      param[key] = val;
    }
  });
  return param;
}
const param = getParam();
console.log('electron param:', param);
const portStart = 8080;
function gerServer() {
  return `http://localhost:${portStart}`;
}
let isHasScreen = false;
async function checkAndApplyDeviceAccessPrivilege() {
  const cameraPrivilege = systemPreferences.getMediaAccessStatus('camera');
  console.log(`checkAndApplyDeviceAccessPrivilege before apply cameraPrivilege: ${cameraPrivilege}`);
  if (cameraPrivilege !== 'granted') {
    await systemPreferences.askForMediaAccess('camera');
  }

  const micPrivilege = systemPreferences.getMediaAccessStatus('microphone');
  console.log(`checkAndApplyDeviceAccessPrivilege before apply micPrivilege: ${micPrivilege}`);
  if (micPrivilege !== 'granted') {
    await systemPreferences.askForMediaAccess('microphone');
  }

  const screenPrivilege = systemPreferences.getMediaAccessStatus('screen');
  console.log(`checkAndApplyDeviceAccessPrivilege before apply screenPrivilege: ${screenPrivilege}`);
  if (screenPrivilege === 'granted') {
    isHasScreen = true;
  }
}

async function createWindow() {
  await checkAndApplyDeviceAccessPrivilege();
  // Creating a Browser Window
  win = new BrowserWindow({
    width: 1366,
    height: 1024,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.electron.js'),
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
    },
  });

  // After running npm run start, the window is often displayed, but the code is not yet built,
  // The did-fail-load event is captured at this point, and the reload is delayed afterwards.
  win.webContents.on('did-fail-load', () => {
    console.log(`createWindow: did-fail-load, reload ${param.TRTC_ENV} soon...`);
    setTimeout(() => {
      win.reload();
    }, 1000);
    logBothProcess('did-fail-load occur');
  });

  win.webContents.on('did-finish-load', () =>  {
    win.webContents.send('crash-file-path', `${crashFilePath}|${crashDumpsDir}`);
    win?.webContents.send('main-process-message', {
      isHasScreen,
    });
  });

  if (param.TRTC_ENV === 'production') {
    win.loadFile('dist/index.html');
  } else {
    win.loadURL(gerServer());
  }
}

app.whenReady().then(createWindow);
