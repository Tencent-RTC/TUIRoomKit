
const IS_LOCAL = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

const BASE_HOST = 'web.sdk.qcloud.com';
const SECOND_HOST = 'web.sdk.tencent.cn';
const THIRD_HOST = 'web.sdk.cloud.tencent.cn';

export const isUploadAegis = IS_LOCAL || [BASE_HOST, SECOND_HOST, THIRD_HOST].indexOf(location.host) >= 0;

export const aegisId = 'iHWefAYqtDYnHsxOaR';
