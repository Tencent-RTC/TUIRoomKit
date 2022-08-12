/* eslint-disable require-jsdoc */
import * as env from './environment';

const browserInfoMap = new Map([
  [env.IS_FIREFOX, ['Firefox', env.FIREFOX_VERSION]],
  [env.IS_EDG, ['Edg', env.EDG_VERSION]],
  [env.IS_CHROME, ['Chrome', env.CHROME_VERSION]],
  [env.IS_SAFARI, ['Safari', env.SAFARI_VERSION]],
  [env.IS_TBS, ['TBS', env.TBS_VERSION]],
  [env.IS_XWEB, ['XWEB', env.XWEB_VERSION]],
  [env.IS_WECHAT && env.IS_IPHONE, ['WeChat', env.WECHAT_VERSION]],
  [env.IS_WQQB, ['QQ(Win)', env.WQQB_VERSION]],
  [env.IS_MQQB, ['QQ(Mobile)', env.MQQB_VERSION]],
  [env.IS_X5MQQB, ['QQ(Mobile X5)', env.MQQB_VERSION]],
  [env.IS_MACQQB, ['QQ(Mac)', env.MACQQB_VERSION]],
  [env.IS_IPADQQB, ['QQ(iPad)', env.IPADQQB_VERSION]],
  [env.IS_MIBROWSER, ['MI', env.MI_VERSION]],
  [env.IS_HUAWEIBROWSER, ['HW', env.HUAWEI_VERSION]],
  [env.IS_SAMSUNGBROWSER, ['Samsung', env.SAMSUNG_VERSION]],
  [env.IS_OPPOBROWSER, ['OPPO', env.OPPO_VERSION]],
  [env.IS_VIVOBROWSER, ['VIVO', env.VIVO_VERSION]],
  [env.IS_EDGE, ['EDGE', env.EDGE_VERSION]],
  [env.IS_SOGOUM, ['SogouMobile', env.SOGOUM_VERSION]],
  [env.IS_SOGOU, ['Sogou', env.SOGOU_VERSION]],
]);

export function getBrowserInfo() {
  let browserName = 'unknown';
  let browserVersion = 'unknown';
  if (browserInfoMap.get(true)) {
    [browserName] = browserInfoMap.get(true);
    // eslint-disable-next-line prefer-destructuring
    browserVersion = browserInfoMap.get(true)[1];
  }
  return { browserName, browserVersion };
}

// 支持chrome浏览器，safari浏览器，firefox浏览器（M56+）, edge浏览器（M80+）
export const isBrowserSupported = function () {
  const MIN_FIREFOX_VERSION = 56;
  const MIN_EDG_VERSION = 80;
  if (env.IS_UCBROWSER || env.IS_EDGE) {
    return false;
  }
  if (env.IS_EDG && env.EDG_VERSION < MIN_EDG_VERSION) {
    return false;
  }
  if (env.IS_FIREFOX && env.FIREFOX_VERSION < MIN_FIREFOX_VERSION) {
    return false;
  }
  return true;
};

const OSNameMap = new Map([
  [env.IS_ANDROID, 'Android'],
  [env.IS_IOS, 'iOS'],
  [env.IS_WIN, 'Windows'],
  [env.IS_MAC, 'MacOS'],
  [env.IS_LINUX, 'Linux'],
]);

export const getOSName = function () {
  let osName = 'unknown';
  if (OSNameMap.get(true)) {
    osName = OSNameMap.get(true);
  }
  return osName;
};

export function basis() {
  const basisInformation = {
    browser: `${getBrowserInfo().browserName}/${getBrowserInfo().browserVersion}`,
    os: getOSName(),
    isElectron: env.IS_ELECTRON,
  };
  return basisInformation;
}
