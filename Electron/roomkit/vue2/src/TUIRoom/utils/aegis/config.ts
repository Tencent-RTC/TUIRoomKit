/**
 * Configuration required isUploadLoaded, aegisId, projectName
 * isUploadLoaded: Upload loaded event
 * isUploadDetailEvent: Upload loaded and other events
 * aegisId: aegis Id
 * projectName: projectName
 */

const IS_LOCAL =
  location.protocol === 'file:' ||
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1';
const IS_OFFICIAL_DEMO = location.host === 'web.sdk.qcloud.com';

const isUploadLoaded = IS_LOCAL || IS_OFFICIAL_DEMO;

const isUploadDetailEvent = IS_OFFICIAL_DEMO;

const aegisId = 'iHWefAYqooXkVQhcyK';

const projectName = 'RoomKit-Electron-vue2';

export { isUploadLoaded, isUploadDetailEvent, aegisId, projectName };
