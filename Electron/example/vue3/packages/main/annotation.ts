import { app, BrowserWindow, shell, ipcMain, screen } from 'electron';
import { join } from 'path';

let mainWin: BrowserWindow | null = null;
let annotationWin: BrowserWindow | null = null;

const SCREEN_POSITION_OFFSET = 100;

export function initAnnotationWindow(win: BrowserWindow) {
  mainWin = win;
  createAnnotationWindow();
  loadAnnotationFile();
  monitoringAnnotationWindowEvents();
  monitoringMainWindowEvents();
  monitoringIpcEvents();
}

function createAnnotationWindow() {
  annotationWin = new BrowserWindow({
    title: 'Annotation window',
    transparent: true,
    show: false,
    frame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    minimizable: false,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
}

function loadAnnotationFile() {
  if (app.isPackaged) {
    annotationWin?.loadFile(join(__dirname, `../renderer/index.html`), {
      hash: `whiteboard?isAnnotationWin=true`,
    });
  } else {
    // eslint-disable-next-line
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`;
    const annotationUrl = `${url}#/whiteboard?isAnnotationWin=true`;
    annotationWin?.loadURL(annotationUrl);
  }

  annotationWin?.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function monitoringAnnotationWindowEvents() {
  annotationWin?.on('close', event => {
    if (mainWin !== null) {
      event.preventDefault();
    } else {
      annotationWin = null;
    }
  });
}

function monitoringMainWindowEvents() {
  app.on('window-all-closed', () => {
    mainWin = null;
    annotationWin = null;
  });

  mainWin?.on('close', () => {
    mainWin = null;
    if (annotationWin) {
      annotationWin.close();
      annotationWin = null;
    }
  });
}

function monitoringIpcEvents() {
  ipcMain.on('app-exit', () => {
    annotationWin?.close();
    annotationWin = null;
  });

  ipcMain.on('annotation:start-annotating', () => {
    if (mainWin) {
      mainWin.minimize();
    }
    if (annotationWin) {
      annotationWin.setIgnoreMouseEvents(false);
      annotationWin.webContents.send('annotation:annotating-started');
      annotationWin.show();
    }
  });

  ipcMain.on('annotation:stop-annotating', () => {
    if (annotationWin) {
      annotationWin.setIgnoreMouseEvents(true);
      annotationWin.webContents.send('annotation:annotating-stopped');
    }
    if (mainWin) {
      mainWin.show();
    }
  });

  ipcMain.on('annotation:stop-from-annotation-window', () => {
    if (annotationWin) {
      annotationWin.setIgnoreMouseEvents(true);
      annotationWin.webContents.send('annotation:annotating-stopped');
    }
    if (mainWin) {
      mainWin.webContents.send('annotation:stop-from-annotation-window');
      mainWin.show();
    }
  });

  ipcMain.on('annotation:screen-share-started', (event, params) => {
    const { screenX, screenY } = caculateScreenPosition(params.x, params.y);
    let selectedScreen;
    screen.getAllDisplays().forEach(item => {
      if (
        Math.abs(screenX - item.workArea.x * item.scaleFactor) <
          SCREEN_POSITION_OFFSET &&
        Math.abs(screenY - item.workArea.y * item.scaleFactor) <
          SCREEN_POSITION_OFFSET
      ) {
        selectedScreen = item;
      }
    });

    if (annotationWin && selectedScreen) {
      annotationWin.setSize(100, 100);
      annotationWin.setPosition(
        selectedScreen.workArea.x,
        selectedScreen.workArea.y
      );
      const windowWidth = selectedScreen.workArea.width;
      const windowHeight = selectedScreen.workArea.height;
      annotationWin.setSize(windowWidth, windowHeight);
      annotationWin.setIgnoreMouseEvents(true);
      // annotationWin.setFullScreen(true);
      annotationWin.show();
    }
  });

  ipcMain.on('annotation:screen-share-stopped', () => {
    if (annotationWin) {
      annotationWin.setIgnoreMouseEvents(true);
      annotationWin.webContents.send('annotation:annotating-stopped');
      annotationWin.webContents.send('annotation:clear');
      annotationWin.hide();
    }
  });

  ipcMain.on('annotation:hide', () => {
    if (annotationWin) {
      annotationWin.webContents.send('annotation:annotating-stopped');
      annotationWin.webContents.send('annotation:clear');
      annotationWin.hide();
    }
  });
}

function caculateScreenPosition(
  screenPositionX: number,
  screenPositionY: number
) {
  const maxUInt32 = 4294967296;
  const checkSize = 4000000000;
  if (screenPositionX > checkSize) {
    // eslint-disable-next-line no-param-reassign
    screenPositionX -= maxUInt32;
  }
  if (screenPositionY > checkSize) {
    // eslint-disable-next-line no-param-reassign
    screenPositionY -= maxUInt32;
  }

  return {
    screenX: screenPositionX,
    screenY: screenPositionY,
  };
}
