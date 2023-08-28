export const LogLevelType = {
  LOG_LEVEL_DEBUG: -1,
  LOG_LEVEL_LOG: 0,
  LOG_LEVEL_INFO: 1,
  LOG_LEVEL_WARN: 2,
  LOG_LEVEL_ERROR: 3,
  LOG_LEVEL_NON_LOGGING: 4, // 无日志记录级别，将不打印任何日志
};

export enum LogContext {
  MAIN = 'main-process',
  RENDER = 'render-process',
}

function padMs(ms: number) {
  const len = ms.toString().length;
  let ret;
  switch (len) {
    case 1:
      ret = `00${ms}`;
      break;
    case 2:
      ret = `0${ms}`;
      break;
    default:
      ret = ms;
      break;
  }

  return ret;
}

export function getLogPrefix(context: LogContext) {
  const date = new Date();
  return `${date.toLocaleTimeString('en-US', {
    hour12: false,
  })}.${padMs(date.getMilliseconds())} [${context}]:`;
}
