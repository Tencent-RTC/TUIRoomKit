/**
 * 需要配置 isUploadLoaded, aegisId, projectName
 * isUploadLoaded: 上传 loaded 事件
 * isUploadDetailEvent: 上传 loaded 及其他操作事件
 * aegisId: aegis Id
 * projectName: 项目名称
 */

const IS_LOCAL = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const IS_OFFICIAL_DEMO = location.host === 'web.sdk.qcloud.com';

const isUploadLoaded = IS_LOCAL || IS_OFFICIAL_DEMO;

const isUploadDetailEvent = IS_OFFICIAL_DEMO;

const aegisId = 'iHWefAYqooXkVQhcyK';

const projectName = 'RoomKit-Electron-vue2';

export {
  isUploadLoaded,
  isUploadDetailEvent,
  aegisId,
  projectName,
};
