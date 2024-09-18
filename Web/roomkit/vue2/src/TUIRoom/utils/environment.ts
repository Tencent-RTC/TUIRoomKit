import { getPlatform } from '@tencentcloud/universal-api';

declare const uni: any;

export const isPC = getPlatform() === 'pc';

export const isH5 = getPlatform() === 'h5';

export const isWeChat = getPlatform() === 'wechat';

export const isApp = getPlatform() === 'app';

export const isUniFrameWork = typeof uni !== 'undefined';

// H5, small programs, apps are considered mobile products, if you need to unify the mobile UI style, you can directly use isMobile to control
export const isMobile = isH5 || isWeChat || isApp;

export const isElectron =
  navigator.userAgent?.toLowerCase().indexOf(' electron/') > -1;

// WeiXinBrowser
export const isWeiXinBrowser =
  navigator &&
  navigator.userAgent?.toLocaleLowerCase().indexOf('micromessenger') > -1;
