// import logger from './log/logger';
import { isUndefined } from './utils';

export const USER_AGENT = (window.navigator && window.navigator.userAgent) || '';
const webkitVersionMap = /AppleWebKit\/([\d.]+)/i.exec(USER_AGENT);
const appleWebkitVersion = webkitVersionMap ? parseFloat(webkitVersionMap.pop()) : null;
/*
 * Device is an iPhone
 *
 * @type {Boolean}
 * @constant
 * @private
 */
export const IS_IPAD = /iPad/i.test(USER_AGENT);

// The Facebook app's UIWebView identifies as both an iPhone and iPad, so
// to identify iPhones, we need to exclude iPads.
// http://artsy.github.io/blog/2012/10/18/the-perils-of-ios-user-agent-sniffing/
export const IS_IPHONE = /iPhone/i.test(USER_AGENT) && !IS_IPAD;
export const IS_IPOD = /iPod/i.test(USER_AGENT);
export const IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;

export const IOS_VERSION =  IS_IOS
  && (function () {
    const match = USER_AGENT.match(/OS (\d+)_/i);

    if (match && match[1]) {
      return match[1];
    }
    return null;
  }());

export const IS_ANDROID = /Android/i.test(USER_AGENT);
export const ANDROID_VERSION =  IS_ANDROID
  && (function () {
    // This matches Android Major.Minor.Patch versions
    // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
    const match = USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);

    if (!match) {
      return null;
    }

    const major = match[1] && parseFloat(match[1]);
    const minor = match[2] && parseFloat(match[2]);

    if (major && minor) {
      return parseFloat(`${match[1]}.${match[2]}`);
    } if (major) {
      return major;
    }
    return null;
  }());

// Old Android is defined as Version older than 2.3, and requiring a webkit version of the android browser
export const IS_OLD_ANDROID = IS_ANDROID && /webkit/i.test(USER_AGENT) && ANDROID_VERSION < 2.3;
export const IS_NATIVE_ANDROID = IS_ANDROID && ANDROID_VERSION < 5 && appleWebkitVersion < 537;

// Firefox
export const IS_FIREFOX = /Firefox/i.test(USER_AGENT);
export const FIREFOX_VERSION =  IS_FIREFOX
  && (function () {
    const match = USER_AGENT.match(/Firefox\/(\d+)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return null;
  }());

// old Edge
export const IS_EDGE = /Edge\//i.test(USER_AGENT);
export const EDGE_VERSION =  IS_EDGE
  && (function () {
    const match = USER_AGENT.match(/Edge\/(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
  }());
// new Edge
export const IS_EDG = /Edg\//i.test(USER_AGENT);
export const EDG_VERSION =  IS_EDG
  && (function () {
    const match = USER_AGENT.match(/Edg\/(\d+)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return null;
  }());

// sogou mobile
export const IS_SOGOUM = /SogouMobileBrowser\//i.test(USER_AGENT);
export const SOGOUM_VERSION =  IS_SOGOUM
  && (function () {
    const match = USER_AGENT.match(/SogouMobileBrowser\/(\d+)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return null;
  }());

// sogou desktop
export const IS_SOGOU = /MetaSr\s/i.test(USER_AGENT);
export const SOGOU_VERSION =  IS_SOGOU
  && (function () {
    const match = USER_AGENT.match(/MetaSr(\s\d+(\.\d+)+)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return null;
  }());

export const IS_TBS = /TBS\/\d+/i.test(USER_AGENT); // 仅X5内核，QQ浏览器默认x5内核，但是agent没有TBS
export const TBS_VERSION =  IS_TBS
  && (function () {
    const match = USER_AGENT.match(/TBS\/(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
  }()); // TBS内核版本

export const IS_XWEB = /XWEB\/\d+/i.test(USER_AGENT);
export const XWEB_VERSION =  IS_XWEB
  && (function () {
    const match = USER_AGENT.match(/XWEB\/(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
  }()); // XWEB内核版本

// IE
export const IS_IE8 = /MSIE\s8\.0/.test(USER_AGENT);
export const IS_IE = /MSIE\/\d+/i.test(USER_AGENT);
export const IE_VERSION =  IS_IE
  && (function () {
    const result = /MSIE\s(\d+)\.\d/.exec(USER_AGENT);
    let version = result && parseFloat(result[1]);

    if (!version && /Trident\/7.0/i.test(USER_AGENT) && /rv:11.0/.test(USER_AGENT)) {
      // IE 11 has a different user agent string than other IE versions
      version = 11.0;
    }

    return version;
  }());

export const IS_WECHAT = /(micromessenger|webbrowser)/i.test(USER_AGENT);
export const WECHAT_VERSION =  IS_WECHAT
  && (function () {
    const match = USER_AGENT.match(/MicroMessenger\/(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
  }());

export const IS_X5MQQB = !IS_TBS && /MQQBrowser\/\d+/i.test(USER_AGENT) && /COVC\/\d+/i.test(USER_AGENT); // 移动端 QQ X5 内核浏览器
export const IS_MQQB = !IS_TBS && /MQQBrowser\/\d+/i.test(USER_AGENT) && !/COVC\/\d+/i.test(USER_AGENT); // 移动端 QQ 浏览器
export const MQQB_VERSION =  (IS_MQQB || IS_X5MQQB)
  && (function () {
    const match = USER_AGENT.match(/ MQQBrowser\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());

export const IS_WQQB = !IS_TBS && / QQBrowser\/\d+/i.test(USER_AGENT); // windows端QQ浏览器
export const WQQB_VERSION =  IS_WQQB
  && (function () {
    const match = USER_AGENT.match(/ QQBrowser\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());

export const IS_MACQQB = !IS_TBS && /QQBrowserLite\/\d+/i.test(USER_AGENT); // Mac端QQ浏览器
export const MACQQB_VERSION =  IS_MACQQB
  && (function () {
    const match = USER_AGENT.match(/QQBrowserLite\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());

export const IS_IPADQQB = !IS_TBS && /MQBHD\/\d+/i.test(USER_AGENT); // iPad端QQ浏览器
export const IPADQQB_VERSION =  IS_IPADQQB
  && (function () {
    const match = USER_AGENT.match(/MQBHD\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());

export const IS_WIN = /Windows/i.test(USER_AGENT); // window系统
export const IS_MAC = !IS_IOS && /MAC OS X/i.test(USER_AGENT); // MAC系统，先检查IOS
export const IS_LINUX = !IS_ANDROID && /Linux/i.test(USER_AGENT);
export const IS_WX = /MicroMessenger/i.test(USER_AGENT); // 是否为微信环境
export const IS_UCBROWSER = /UCBrowser/i.test(USER_AGENT);
export const IS_ELECTRON = /Electron/i.test(USER_AGENT); // 是否为 electron

export const IS_MIBROWSER = /MiuiBrowser/i.test(USER_AGENT); // 小米浏览器
export const MI_VERSION =  IS_MIBROWSER
  && (function () {
    const match = USER_AGENT.match(/MiuiBrowser\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());
export const IS_HUAWEIBROWSER = /HuaweiBrowser/i.test(USER_AGENT); // 华为浏览器
export const IS_HUAWEI = /Huawei/i.test(USER_AGENT); // 华为设备
export const HUAWEI_VERSION =  IS_HUAWEIBROWSER
  && (function () {
    const match = USER_AGENT.match(/HuaweiBrowser\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());

export const IS_SAMSUNGBROWSER = /SamsungBrowser/i.test(USER_AGENT); // 三星浏览器
export const SAMSUNG_VERSION =  IS_SAMSUNGBROWSER
  && (function () {
    const match = USER_AGENT.match(/SamsungBrowser\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());
export const IS_OPPOBROWSER = /HeyTapBrowser/i.test(USER_AGENT); // OPPO浏览器
export const OPPO_VERSION =  IS_OPPOBROWSER
  && (function () {
    const match = USER_AGENT.match(/HeyTapBrowser\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());
export const IS_VIVOBROWSER = /VivoBrowser/i.test(USER_AGENT); // OPPO浏览器
export const VIVO_VERSION =  IS_VIVOBROWSER
  && (function () {
    const match = USER_AGENT.match(/VivoBrowser\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());

// Chrome
export const IS_CHROME_ONLY = /Chrome/i.test(USER_AGENT);
export const IS_CHROME =  !IS_EDGE
  && !IS_SOGOU
  && !IS_SOGOUM
  && !IS_TBS
  && !IS_XWEB
  && !IS_EDG
  && !IS_WQQB
  && !IS_MIBROWSER
  && !IS_HUAWEIBROWSER
  && !IS_SAMSUNGBROWSER
  && !IS_OPPOBROWSER
  && !IS_VIVOBROWSER
  && /Chrome/i.test(USER_AGENT);
export const CHROME_MAJOR_VERSION =  IS_CHROME
  && (function () {
    const match = USER_AGENT.match(/Chrome\/(\d+)/);

    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return null;
  }());
export const CHROME_VERSION =  IS_CHROME
  && (function () {
    const match = USER_AGENT.match(/Chrome\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());

// Safari
export const IS_SAFARI = !IS_CHROME_ONLY && !IS_MQQB && !IS_X5MQQB && !IS_MACQQB && !IS_IPADQQB && /Safari/i.test(USER_AGENT);
export const IS_ANY_SAFARI = IS_SAFARI || IS_IOS;
export const SAFARI_VERSION =  IS_SAFARI
  && (function () {
    const match = USER_AGENT.match(/Version\/([\d.]+)/);
    if (match && match[1]) return match[1];
    return null;
  }());

//
export const BROWSER_VERSION = IS_CHROME ? `Chrome/${CHROME_VERSION}` : IS_SAFARI ? `Safari/${SAFARI_VERSION}` : 'NotSupportedBrowser';

// 是否本地环境 file, localhost, ip 地址
export const IS_LOCAL = location.protocol === 'file:' || location.hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(location.hostname);

/**
 * 检测 LocalStorage 是否可用
 * @export
 * @return {Boolean}
 */
export const isLocalStorageEnabled = (() => {
  let result;
  return () => {
    if (isUndefined(result)) {
      try {
        result = window.localStorage;
      } catch (error) {
        result = false;
      }
    }
    return result;
  };
})();
