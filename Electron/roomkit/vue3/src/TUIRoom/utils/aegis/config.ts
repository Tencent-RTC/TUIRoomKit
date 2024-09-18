/**
 * Configuration required isUploadLoaded, aegisId, projectName
 * isUploadLoaded: Upload loaded event
 * isUploadDetailEvent: Upload loaded and other events
 * aegisId: aegis Id
 * projectName: projectName
 */

const { VITE_RUNTIME_ENV } = import.meta.env;
const isUploadLoaded = ['github', 'official'].indexOf(VITE_RUNTIME_ENV) !== -1;
const isUploadDetailEvent = VITE_RUNTIME_ENV === 'official';

const aegisId = 'iHWefAYqooXkVQhcyK';

const projectName = 'TUIRoomKit-Electron';

export { isUploadLoaded, isUploadDetailEvent, aegisId, projectName };
