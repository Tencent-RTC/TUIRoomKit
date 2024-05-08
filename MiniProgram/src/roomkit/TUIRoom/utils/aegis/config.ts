import { isMobile }  from '../environment';

const IS_LOCAL = location?.protocol === 'file:' || location?.hostname === 'localhost' || location?.hostname === '127.0.0.1';
const IS_OFFICIAL_DEMO = location?.host === 'web.sdk.qcloud.com';

const isUploadLoaded = IS_LOCAL || IS_OFFICIAL_DEMO;

const isUploadDetailEvent = IS_OFFICIAL_DEMO;

const aegisId = 'iHWefAYqCFrCVqqyIZ';

const projectName = isMobile ? 'TUIRoomKit-H5-vue3' : 'TUIRoomKit-Web';

export {
  isUploadLoaded,
  isUploadDetailEvent,
  aegisId,
  projectName,
};
