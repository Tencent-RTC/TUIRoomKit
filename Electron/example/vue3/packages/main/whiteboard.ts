import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'path';

let mainWin: BrowserWindow | null = null;
let whiteboardWin: BrowserWindow | null = null;

const WHITEBOARD_WINDOW_WIDTH = 1280;
const WHITEBOARD_WINDOW_HEIGHT = 720;

export function initWhiteboardWindow(win: BrowserWindow) {
  mainWin = win;
  createWhiteboardWindow();
  loadWhiteboardFile();
  monitoringWhiteboardWindowEvents();
  monitoringMainWindowEvents();
  monitoringIpcEvents();
}

function createWhiteboardWindow() {
  whiteboardWin = new BrowserWindow({
    width: WHITEBOARD_WINDOW_WIDTH,
    height: WHITEBOARD_WINDOW_HEIGHT,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  whiteboardWin.setMenuBarVisibility(false);
}

function loadWhiteboardFile() {
  if (app.isPackaged) {
    whiteboardWin?.loadFile(join(__dirname, `../renderer/index.html`), {
      hash: `whiteboard?isAnnotationWin=false`,
    });
  } else {
    // eslint-disable-next-line
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`;
    const whiteboardUrl = `${url}#/whiteboard?isAnnotationWin=false`;
    whiteboardWin?.loadURL(whiteboardUrl);
  }

  whiteboardWin?.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function monitoringMainWindowEvents() {
  app.on('window-all-closed', () => {
    mainWin = null;
    whiteboardWin = null;
  });

  mainWin?.on('close', () => {
    mainWin = null;
    if (whiteboardWin) {
      whiteboardWin.close();
      whiteboardWin = null;
    }
  });
}

function monitoringWhiteboardWindowEvents() {
  whiteboardWin?.on('close', event => {
    if (mainWin !== null) {
      whiteboardWin?.hide();
      mainWin?.webContents.send('whiteboard:window-closed');
      event.preventDefault();
    } else {
      whiteboardWin = null;
    }
  });

  ipcMain.on('whiteboard:stop-from-whiteboard-window', () => {
    if (whiteboardWin) {
      whiteboardWin.hide();
    }
    if (mainWin) {
      mainWin.webContents.send('whiteboard:stop-from-whiteboard-window');
    }
  });

  ipcMain.on('whiteboard:save-from-whiteboard-window', () => {
    if (mainWin) {
      mainWin.webContents.send('whiteboard:save-from-whiteboard-window');
    }
  });

  whiteboardWin?.webContents.on('did-finish-load', () => {
    whiteboardWin?.setTitle('Whiteboard window');
  });
}

function monitoringIpcEvents() {
  ipcMain.on('app-exit', () => {
    whiteboardWin?.close();
    whiteboardWin = null;
  });

  ipcMain.on('whiteboard:show-window', () => {
    if (whiteboardWin) {
      whiteboardWin.show();
    }
  });

  ipcMain.on('whiteboard:hide-window', () => {
    if (whiteboardWin) {
      whiteboardWin.webContents.send('whiteboard:clear');
      whiteboardWin.hide();
    }
  });
}
