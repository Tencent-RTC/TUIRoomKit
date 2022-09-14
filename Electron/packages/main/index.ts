import { app, BrowserWindow, shell, screen, systemPreferences, crashReporter } from 'electron'
import { release } from 'os'
import path from 'path'

// 开启crash捕获
crashReporter.start({
  productName: 'trtc-tuiroom-electron',
  companyName: 'Tencent Cloud',
  submitURL: 'https://www.xxx.com',
  uploadToServer: false,
  ignoreSystemCrashHandler: false,
});

let crashFilePath = '';
let crashDumpsDir = '';
try {
  // electron 低版本
  crashFilePath = path.join(app.getPath('temp'), app.getName() + ' Crashes');
  console.log('————————crash path:', crashFilePath); 

  // electron 高版本
  crashDumpsDir = app.getPath('crashDumps');
  console.log('————————crashDumpsDir:', crashDumpsDir);
} catch (e) {
  console.error('获取奔溃文件路径失败', e);
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

let win: BrowserWindow | null = null
let schemeRoomId = '';

function registerScheme() {
  const args = [];
  if (!app.isPackaged) {
    // 如果是开发阶段，需要把我们的脚本的绝对路径加入参数中
    args.push(path.resolve(process.argv[1]));
  }
  // 加一个 `--` 以确保后面的参数不被 Electron 处理
  args.push('--');
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, args);
  handleArgv(process.argv);
}

function handleArgv(argv: string[]) {
  const prefix = `${PROTOCOL}:`;
  // 开发阶段，跳过前两个参数（`electron.exe .`）
  // 打包后，跳过第一个参数（`myapp.exe`）
  const offset = app.isPackaged ? 1 : 2;
  const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
  if (url) handleUrl(url);
}

function handleUrl(url: string) {
  // tuiroom://joinroom?roomId=123
  const urlObj = new URL(url);
  const { searchParams } = urlObj;
  schemeRoomId = searchParams.get('roomId') || '';
}

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
      preload: path.join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (app.isPackaged) {
    if (schemeRoomId) {
      win.loadFile(path.join(__dirname, `../renderer/index.html`), {
        hash: `home?roomId=${schemeRoomId}`
      });
    } else {
      win.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}/#/home`

    win.loadURL(url)
    win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())

    win?.webContents.send('crash-file-path', `${crashFilePath}|${crashDumpsDir}`);
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

app.on('second-instance', (event, argv) => {
  if (process.platform === 'win32') {
    // Windows
    handleArgv(argv);
  }
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

// macOS 下通过协议URL启动时，主实例会通过 open-url 事件接收这个 URL
app.on('open-url', (event, urlStr) => {
  handleUrl(urlStr);
});

app.on('gpu-process-crashed', (event, kill) => {
  console.warn('app:gpu-process-crashed', event, kill);
});

app.on('renderer-process-crashed', (event, webContents, kill) => {
  console.warn('app:renderer-process-crashed', event, webContents, kill);
});

app.on('render-process-gone', (event, webContents, details) => {
  console.warn('app:render-process-gone', event, webContents, details);
});

app.on('child-process-gone', (event, details) => {
  console.warn('app:child-process-gone', event, details);
});

