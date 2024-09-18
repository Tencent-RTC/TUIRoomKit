import {
  app,
  BrowserWindow,
  shell,
  screen,
  systemPreferences,
  crashReporter,
  ipcMain,
} from 'electron';
import { release } from 'os';
import { join, resolve } from 'path';
import { initWhiteboardWindow } from './whiteboard';
import { initAnnotationWindow } from './annotation';

// Enable crash capture
crashReporter.start({
  productName: 'electron-tui-room',
  companyName: 'Tencent Cloud',
  submitURL: 'https://www.xxx.com',
  uploadToServer: false,
  ignoreSystemCrashHandler: false,
});

let crashFilePath = '';
let crashDumpsDir = '';
try {
  // Low version of electron
  crashFilePath = join(app.getPath('temp'), `${app.getName()} Crashes`);
  console.log('————————crash path:', crashFilePath);

  // High version of electron
  crashDumpsDir = app.getPath('crashDumps');
  console.log('————————crashDumpsDir:', crashDumpsDir);
} catch (e) {
  console.error('Failed to get path to crashed file', e);
}

const PROTOCOL = 'tuiroom';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let isHasScreen = false;
async function checkAndApplyDevicePrivilege() {
  const cameraPrivilege = systemPreferences.getMediaAccessStatus('camera');

  if (cameraPrivilege !== 'granted') {
    await systemPreferences.askForMediaAccess('camera');
  }

  const micPrivilege = systemPreferences.getMediaAccessStatus('microphone');

  if (micPrivilege !== 'granted') {
    await systemPreferences.askForMediaAccess('microphone');
  }

  const screenPrivilege = systemPreferences.getMediaAccessStatus('screen');
  console.log(screenPrivilege);
  if (screenPrivilege === 'granted') {
    isHasScreen = true;
  }
}

let mainWin: BrowserWindow | null = null;
let schemeRoomId = '';

function registerScheme() {
  const args = [];
  if (!app.isPackaged) {
    // If you are in the development phase, you need to add the absolute path of our script to the parameter
    args.push(resolve(process.argv[1]));
  }
  // Add a `--` to ensure that subsequent arguments are not processed by Electron.
  args.push('--');
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, args);
  handleArgv(process.argv);
}

function handleArgv(argv: string[]) {
  const prefix = `${PROTOCOL}:`;
  // development phase, skipping the first two parameters（`electron.exe .`）
  // After packing, skip the first parameter（`myapp.exe`）
  const offset = app.isPackaged ? 1 : 2;
  const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
  if (url) handleUrl(url);
}

function handleUrl(url: string) {
  // tuiroom://joinroom?roomId=123
  const urlObj = new URL(url);
  const { searchParams } = urlObj;
  schemeRoomId = searchParams.get('roomId') || '';
  if (mainWin && mainWin.webContents) {
    mainWin?.webContents.send('launch-room', schemeRoomId);
  }
}

async function createWindow() {
  await checkAndApplyDevicePrivilege();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWin = new BrowserWindow({
    title: 'Main window',
    width,
    height,
    minWidth: 1200,
    minHeight: 640,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWin.on('close', () => {
    mainWin = null;
  });

  if (app.isPackaged) {
    if (schemeRoomId) {
      mainWin.loadFile(join(__dirname, `../renderer/index.html`), {
        hash: `home?roomId=${schemeRoomId}`,
      });
    } else {
      mainWin.loadFile(join(__dirname, '../renderer/index.html'));
    }
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const installExtension = require('electron-devtools-installer');
    installExtension
      .default(installExtension.VUEJS_DEVTOOLS)
      .then(() => {})
      .catch((err: Error) => {
        console.log('Unable to install `vue-devtools`: \n', err);
      });
    // eslint-disable-next-line
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`;

    mainWin.loadURL(url);
    // mainWin.webContents.openDevTools();
  }

  // Test active push message to Renderer-process
  mainWin.webContents.on('did-finish-load', () => {
    mainWin?.webContents.send('main-process-message', {
      isHasScreen,
    });
  });

  // Make all links open with the browser, not with the application
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  initWhiteboardWindow(mainWin);
  initAnnotationWindow(mainWin);
}

registerScheme();
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  mainWin = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (mainWin) {
    // Focus on the main window if the user tried to open another
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// When started via protocol URL on macOS, the master instance receives this URL via the open-url event
app.on('open-url', (event, urlStr) => {
  handleUrl(urlStr);
});

// new window example arg: new windows url
ipcMain.handle('open-win', (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
    },
  });

  if (app.isPackaged) {
    childWindow.loadFile(join(__dirname, `../renderer/index.html`), {
      hash: `${arg}`,
    });
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_SERVER_PORT}/#${arg}`;
    childWindow.loadURL(url);
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
});

ipcMain.on('app-exit', () => {
  mainWin?.close();
  app.exit();
});
