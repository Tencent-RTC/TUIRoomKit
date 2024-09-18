import { isElectron, isWeChat, isWeiXinBrowser } from './environment';
import { isFunction } from './utils';

// Whether to support getUserMedia to capture audio and video streams
// Unsupported Browsers: qq Browser
export const isGetUserMediaSupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return (
    navigator &&
    navigator.mediaDevices &&
    isFunction(navigator.mediaDevices.getUserMedia)
  );
})();

// Whether or not getDisplayMedia is supported to capture screen sharing
export const isGetDisplaySupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return (
    navigator &&
    navigator.mediaDevices &&
    isFunction(navigator.mediaDevices.getDisplayMedia)
  );
})();

// Whether or not screen sharing capability is supported
// Unsupported Browsers: mac 360 Browser
export const isScreenShareSupported = isGetDisplaySupported && !isWeiXinBrowser;

// Whether or not getting a list of devices is supported
// Unsupported Browsers: mac 360 Browser
export const isEnumerateDevicesSupported = (function () {
  if (isElectron || isWeChat) {
    return true;
  }
  return (
    navigator &&
    navigator.mediaDevices &&
    isFunction(navigator.mediaDevices.enumerateDevices)
  );
})();
