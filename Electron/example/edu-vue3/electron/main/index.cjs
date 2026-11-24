const path = require('path');
const {
  app,
  BrowserWindow,
  session,
  shell,
  systemPreferences,
} = require('electron');

// The RoomKit package ships the screen-share wiring: rk-electron IPC,
// setDisplayMediaRequestHandler and the media permission allowance. The
// picker itself lives in the renderer (ElectronScreenSourcePicker) and talks to
// this side through the package's preload.
const { setupRoomKitScreenShare } = require('@tencentcloud/roomkit-web-vue3/electron/main.cjs');
const ROOMKIT_PRELOAD_PATH
  = require.resolve('@tencentcloud/roomkit-web-vue3/electron/preload.cjs');

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_INDEX = path.join(__dirname, '../renderer/index.html');

// Camera, microphone, and screen share, plus the shell permissions the class UI needs.
// The RoomKit helper grants media and display-capture on the request path before this
// callback runs; the check handler below is the demo's own allowlist.
const DEMO_PERMISSIONS = new Set([
  'media',
  'display-capture',
  'mediaKeySystem',
  'fullscreen',
  'notifications',
  'clipboard-read',
  'clipboard-sanitized-write',
]);

let mainWindow = null;

async function requestMacMediaAccess() {
  if (process.platform !== 'darwin') {
    return;
  }
  await Promise.all(['camera', 'microphone'].map((mediaType) => {
    if (systemPreferences.getMediaAccessStatus(mediaType) === 'granted') {
      return true;
    }
    return systemPreferences.askForMediaAccess(mediaType);
  }));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'RoomKit Next Education',
    backgroundColor: '#0f1014',
    show: false,
    webPreferences: {
      preload: ROOMKIT_PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(RENDERER_INDEX);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    setupRoomKitScreenShare({
      onPermissionRequest: (permission, callback) => callback(DEMO_PERMISSIONS.has(permission)),
    });
    session.defaultSession.setPermissionCheckHandler(
      (_webContents, permission) => DEMO_PERMISSIONS.has(permission)
    );
    await requestMacMediaAccess();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
