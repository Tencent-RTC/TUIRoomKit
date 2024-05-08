
import { getPlatform } from '@tencentcloud/universal-api';


declare const uni: any;

export const isPC = getPlatform() === 'pc';

export const isH5 = getPlatform() === 'h5';

export const isWeChat = getPlatform() === 'wechat';

export const isApp = getPlatform() === 'app';

export const isUniFrameWork = typeof uni !== 'undefined';

export const isMobile = isH5 || isWeChat || isApp;

export const isElectron = navigator.userAgent?.toLowerCase().indexOf(' electron/') > -1;

export const isWeiXinBrowser = navigator && navigator.userAgent?.toLocaleLowerCase().indexOf('micromessenger') > -1;
