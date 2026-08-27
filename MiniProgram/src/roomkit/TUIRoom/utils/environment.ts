import { getPlatform } from '@tencentcloud/universal-api';

declare const uni: any;
declare const wx: any;

export const isPC = getPlatform() === 'pc';

export const isH5 = getPlatform() === 'h5';

export const isWeChat = getPlatform() === 'wechat';

export const isApp = getPlatform() === 'app';

export const isUniFrameWork = typeof uni !== 'undefined';

function readSystemInfo(): Record<string, any> {
  try {
    if (
      typeof uni !== 'undefined' &&
      typeof uni.getSystemInfoSync === 'function'
    ) {
      return uni.getSystemInfoSync() || {};
    }
    if (
      typeof wx !== 'undefined' &&
      typeof wx.getSystemInfoSync === 'function'
    ) {
      return wx.getSystemInfoSync() || {};
    }
  } catch {
    return {};
  }
  return {};
}

/**
 * WeChat mini program on HarmonyOS. live-pusher swallows parent touch/tap
 * events, so RoomKit only mounts the gesture cover-view on this platform.
 */
export const isHarmonyOS = (() => {
  const info = readSystemInfo();
  const platform = String(info.platform || '').toLowerCase();
  const system = String(info.system || '').toLowerCase();
  const osName = String(info.osName || '').toLowerCase();
  return (
    platform === 'ohos' ||
    platform === 'harmonyos' ||
    osName === 'ohos' ||
    osName === 'harmonyos' ||
    system.includes('harmony')
  );
})();

// H5, small programs, apps are considered mobile products, if you need to unify the mobile UI style, you can directly use isMobile to control
export const isMobile = isH5 || isWeChat || isApp;

export const isElectron =
  navigator?.userAgent?.toLowerCase().indexOf(' electron/') > -1;

// WeiXinBrowser
export const isWeiXinBrowser =
  navigator &&
  navigator?.userAgent?.toLocaleLowerCase().indexOf('micromessenger') > -1;
