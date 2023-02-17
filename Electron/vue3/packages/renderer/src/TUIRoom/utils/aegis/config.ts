/**
 * 需要配置 isUploadLoaded, aegisId, projectName
 * isUploadLoaded: 上传 loaded 事件
 * isUploadDetailEvent: 上传 loaded 及其他操作事件
 * aegisId: aegis Id
 * projectName: 项目名称
 */

const { VITE_RUNTIME_ENV } = import.meta.env;
const isUploadLoaded = ['github', 'official'].indexOf(VITE_RUNTIME_ENV) !== -1;
const isUploadDetailEvent = VITE_RUNTIME_ENV === 'official';

const aegisId = 'iHWefAYqooXkVQhcyK';

const projectName = 'TUIRoomKit-Electron';

export {
  isUploadLoaded,
  isUploadDetailEvent,
  aegisId,
  projectName,
};
