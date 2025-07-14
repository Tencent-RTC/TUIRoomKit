let appPath = '';
let pluginDirectory = '';
let resourcePath = '';
let pluginPath = '';

const system = process.platform;
const { arch } = process;

export function getAppPath() {
  if (appPath === '') {
    if (process.env.NODE_ENV === 'production') {
      appPath = process.resourcesPath;
    } else {
      appPath = process.cwd();
    }
  }
  return appPath;
}

export function getPluginDirectory() {
  if (pluginDirectory === '') {
    const appPath = getAppPath();
    if (process.env.NODE_ENV === 'production') {
      if (system === 'win32') {
        pluginDirectory = `${appPath}\\plugin\\XMagic\\win`;
      } else {
        pluginDirectory = `${appPath}/plugin/XMagic/mac`;
      }
    } else {
      if (system === 'win32') {
        pluginDirectory = `${appPath}\\node_modules\\@tencentcloud\\roomkit-electron-vue3\\node_modules\\trtc-electron-plugin-xmagic\\plugin\\XMagic\\win`;
      } else {
        pluginDirectory = `${appPath}/node_modules/@tencentcloud/roomkit-electron-vue3/node_modules/trtc-electron-plugin-xmagic/plugin/XMagic/mac`;
      }
    }
  }
  return pluginDirectory;
}

export function getResourcePath() {
  if (resourcePath === '') {
    const pluginDirectory = getPluginDirectory();
    if (system === 'win32') {
      resourcePath = `${pluginDirectory}\\res\\`;
    } else {
      resourcePath = `${pluginDirectory}/resources/`;
    }
  }
  return resourcePath;
}

export function getPluginPath() {
  if (pluginPath === '') {
    const pluginDirectory = getPluginDirectory();
    if (system === 'win32') {
      if (arch === 'x64') {
        pluginPath = `${pluginDirectory}\\x64\\TRTCElectronXmagicBeautyPlugin.dll`;
      } else {
        pluginPath = `${pluginDirectory}\\ia32\\TRTCElectronXmagicBeautyPlugin.dll`;
      }
    } else {
      pluginPath = `${pluginDirectory}/XmagicMac.dylib`;
    }
  }
  return pluginPath;
}
