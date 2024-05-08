import { app, BrowserWindow, shell, screen, systemPreferences, crashReporter, ipcMain } from 'electron'
import { release } from 'os'
import { join, resolve } from 'path'

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
  crashFilePath = join(app.getPath('temp'), app.getName() + ' Crashes');
  console.log('————————crash path:', crashFilePath);

  crashDumpsDir = app.getPath('crashDumps');
  console.log('————————crashDumpsDir:', crashDumpsDir);
} catch (e) {
  console.error('Failed to get path to crashed file', e);
}

const PROTOCOL = 'tuiroom';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

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

let win: BrowserWindow | null = null
let schemeRoomId = '';

function registerScheme() {
  const args = [];
  if (!app.isPackaged) {
    args.push(resolve(process.argv[1]));
  }
  args.push('--');
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, args);
  handleArgv(process.argv);
}

function handleArgv(argv: string[]) {
  const prefix = `${PROTOCOL}:`;
  const offset = app.isPackaged ? 1 : 2;
  const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
  if (url) handleUrl(url);
}

function handleUrl(url: string) {
  // tuiroom://joinroom?roomId=123
  const urlObj = new URL(url);
  const { searchParams } = urlObj;
  schemeRoomId = searchParams.get('roomId') || '';
  if (win && win.webContents) {
    win?.webContents.send('launch-room', schemeRoomId);
  }
}

async function createWindow() {
  await checkAndApplyDevicePrivilege();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
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
  })

  if (app.isPackaged) {
    if (schemeRoomId) {
      win.loadFile(join(__dirname, `../renderer/index.html`), {
        hash: `home?roomId=${schemeRoomId}`
      });
    } else {
      win.loadFile(join(__dirname, '../renderer/index.html'))
    }
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const installExtension = require('electron-devtools-installer')
    installExtension.default(installExtension.VUEJS_DEVTOOLS)
      .then(() => {})
      .catch((err: Error) => {
        console.log('Unable to install `vue-devtools`: \n', err)
      });
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`

    win.loadURL(url)
    // win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', {
      isHasScreen
    })
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

registerScheme();
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

app.on('open-url', (event, urlStr) => {
  handleUrl(urlStr);
});

// new window example arg: new windows url
ipcMain.handle("open-win", (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
    },
  });

  if (app.isPackaged) {
    childWindow.loadFile(join(__dirname, `../renderer/index.html`), {
      hash: `${arg}`,
    })
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}/#${arg}`
    childWindow.loadURL(url);
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
});

ipcMain.on('app-exit', () => {
  win?.close();
  app.exit();
})
