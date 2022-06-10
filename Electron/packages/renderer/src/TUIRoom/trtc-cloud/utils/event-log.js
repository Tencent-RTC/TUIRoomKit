import axios from 'axios';
import { getTimestamp } from './time';
import { IS_LOCAL } from './environment';
import { getKibanaLoggerUrl, getBackendEventUrl, isUndefined } from './utils';

const config = {
  sdkAppId: '',
  userId: '',
  version: '',
  env: 'qcloud',
  browserVersion: '',
  ua: '',
};

export const setLogEventConfig = function (options) {
  config.sdkAppId = `${options.sdkAppId}`;
  config.version = `${options.version}`;
  config.env = options.env;
  config.userId = options.userId;
  config.browserVersion = options.browserVersion;
  config.ua = options.ua;
};

export const uploadEvent = function (msg, error) {
  const toUpload = {
    timestamp: getTimestamp(),
    sdkAppId: config.sdkAppId,
    userId: config.userId,
    version: config.version,
    log: msg,
  };
  if (error) {
    toUpload.errorInfo = error.message;
  }
  axios.post(getKibanaLoggerUrl(), JSON.stringify(toUpload)).catch(() => {
    // ignore
  });
};

const uploadEventToKibana = function (event) {
  let msg = `stat-${event.eventType}-${event.result}`;
  if (event.eventType === 'delta-join' || event.eventType === 'delta-leave' || event.eventType === 'delta-publish') {
    msg = `${event.eventType}:${event.delta}`;
  }
  if (event.result === 'failed') {
    msg = `stat-${event.eventType}-${event.result}-${event.code}`;
    uploadEvent(msg, event.error);
  }
};

// logEvent is used to upload the key events to remote server so that it can check
// the overall connection stats from http://monitor.server.com/link/graph/viewid:18025
export /**
 * 上报到后台秒级监控
 * @param {*} event
 */
const logEvent = function (event) {
  if (IS_LOCAL) {
    return;
  }
  const message = { ...event, ...config };
  if (isUndefined(message.code)) {
    // message.code = message.result === 'failed' ? ErrorCode.UNKNOWN : 0;
  }
  axios.post(getBackendEventUrl(), JSON.stringify(message)).catch(() => {
    // ignore
  });
};

export const logSuccessEvent = function (event) {
  if (IS_LOCAL) {
    return;
  }
  logEvent({ ...event, result: 'success' });
  // 上报到 kibana，在 kibana 统计成功率，以及失败的错误信息
  if (config.env === 'qcloud') {
    // collect cloud env's stats only
    uploadEventToKibana({ ...event, result: 'success' });
  }
};

export const logFailedEvent = function (event) {
  if (IS_LOCAL) {
    return;
  }
  const { eventType, code, error } = event; // eslint-disable-line
  const data = {
    eventType,
    result: 'failed',
    // code:
    //   code ||
    //   (error instanceof RtcError ? error.getExtraCode() || error.getCode() : ErrorCode.UNKNOWN),
  };
  // 上报给后台
  logEvent(data);

  // 上报到 kibana，在 kibana 统计成功率，以及失败的错误信息
  if (config.env === 'qcloud') {
    // collect cloud env's stats only
    uploadEventToKibana({ ...data, error });
  }
};
