import { isElectron, isWeChat, isWeiXinBrowser } from './environment';
import { isFunction } from './utils';

export const isGetUserMediaSupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return navigator && navigator?.mediaDevices && isFunction(navigator?.mediaDevices.getUserMedia);
}());

export const isGetDisplaySupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return navigator && navigator?.mediaDevices && isFunction(navigator?.mediaDevices.getDisplayMedia);
}());

export const isScreenShareSupported = isGetDisplaySupported && !isWeiXinBrowser;

export const isEnumerateDevicesSupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return navigator
    && navigator?.mediaDevices && isFunction(navigator?.mediaDevices.enumerateDevices);
}());
