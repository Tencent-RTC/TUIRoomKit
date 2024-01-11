import { isElectron, isWeChat, isWeiXinBrowser } from './environment';
import { isFunction } from './utils';

// 是否支持 getUserMedia 采集音视频流
// 不支持浏览器：qq 浏览器
export const isGetUserMediaSupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return navigator && navigator.mediaDevices && isFunction(navigator.mediaDevices.getUserMedia);
}());

// 是否支持 getDisplayMedia 采集屏幕分享
export const isGetDisplaySupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return navigator && navigator.mediaDevices && isFunction(navigator.mediaDevices.getDisplayMedia);
}());

// 是否支持屏幕分享能力
// 不支持浏览器：mac 360 浏览器
export const isScreenShareSupported = isGetDisplaySupported && !isWeiXinBrowser;

// 是否支持获取设备列表
// 不支持浏览器：mac 360 浏览器
export const isEnumerateDevicesSupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return navigator
    && navigator.mediaDevices && isFunction(navigator.mediaDevices.enumerateDevices);
}());
