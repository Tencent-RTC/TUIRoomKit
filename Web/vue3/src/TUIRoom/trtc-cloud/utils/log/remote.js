/* eslint-disable require-jsdoc */
import axios from 'axios';
import raf from '../raf';
import { getTimestamp, getCurrentTime } from '../time';
import { getKibanaLoggerUrl, isFunction, isString } from '../utils';

let CIRCULAR_ERROR_MESSAGE;

// https://github.com/nodejs/node/blob/master/lib/util.js
function tryStringify(arg) {
  try {
    return JSON.stringify(arg);
  } catch (error) {
    // Populate the circular error message lazily
    if (!CIRCULAR_ERROR_MESSAGE) {
      try {
        const a = {};
        a.a = a;
        JSON.stringify(a);
      } catch (circular) {
        CIRCULAR_ERROR_MESSAGE = circular.message;
      }
    }
    if (error.message === CIRCULAR_ERROR_MESSAGE) {
      return '[Circular]';
    }
    throw error;
  }
}

function getConstructorName(obj) {
  if (!Object.getOwnPropertyDescriptor || !Object.getPrototypeOf) {
    return Object.prototype.toString.call(obj).slice(8, -1);
  }

  // https://github.com/nodejs/node/blob/master/lib/internal/util.js
  while (obj) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, 'constructor');
    if (descriptor !== undefined && isFunction(descriptor.value) && descriptor.value.name !== '') {
      return descriptor.value.name;
    }

    obj = Object.getPrototypeOf(obj);
  }

  return '';
}

function interpolate(array) {
  let result = '';
  let index = 0;

  if (array.length > 1 && isString(array[0])) {
    result = array[0].replace(/(%?)(%([sdjo]))/g, (match, escaped, ptn, flag) => {
      if (!escaped) {
        index += 1;
        const arg = array[index];
        let a = '';
        switch (flag) {
          case 's':
            a += arg;
            break;
          case 'd':
            a += +arg;
            break;
          case 'j':
            a = tryStringify(arg);
            break;
          case 'o': {
            let obj = tryStringify(arg);
            if (obj[0] !== '{' && obj[0] !== '[') {
              obj = `<${obj}>`;
            }
            a = getConstructorName(arg) + obj;
            break;
          }
        }
        return a;
      }
      return match;
    });

    // update escaped %% values
    result = result.replace(/%{2,2}/g, '%');

    index += 1;
  }

  // arguments remaining after formatting
  if (array.length > index) {
    if (result) result += ' ';
    result += array.slice(index).join(' ');
  }

  return result;
}

const { hasOwnProperty } = Object.prototype;

// Light deep Object.assign({}, ...sources)
function assign() {
  const target = {};
  for (let s = 0; s < arguments.length; s += 1) {
    const source = Object(arguments[s]);
    for (const key in source) {
      if (hasOwnProperty.call(source, key)) {
        target[key] =          typeof source[key] === 'object' && !Array.isArray(source[key])
          ? assign(target[key], source[key])
          : source[key];
      }
    }
  }
  return target;
}

function getStacktrace() {
  try {
    throw new Error();
  } catch (trace) {
    return trace.stack;
  }
}

function Queue(capacity) {
  let queue = []; // 等待发送的日志队列
  let sent = []; // 正在发送的日志

  this.length = () => queue.length;
  this.sent = () => sent.length;

  this.push = (message) => {
    queue.push(message);
    if (queue.length > capacity) {
      queue.shift();
    }
  };

  this.send = () => {
    if (!sent.length) {
      sent = queue;
      queue = [];
    }
    return sent;
  };

  this.confirm = () => {
    // 清理正在发送的日志
    sent = [];
    this.content = '';
  };

  this.fail = () => {
    // 发送失败，将正在发送的日志，发到队列头，下个定时器再发送
    queue = sent.concat(queue);
    this.confirm();
    const overflow = 1 + queue.length + sent.length - capacity;

    if (overflow > 0) {
      sent.splice(0, overflow);
      queue = sent.concat(queue);
      this.confirm();
    }
    // if (queue.length + sent.length >= capacity) this.confirm();
  };
}

const hasStacktraceSupport = !!getStacktrace();

let loglevel;
let originalFactory;
let pluginFactory;

function plain(log) {
  return `[${log.timestamp}] <${log.level.label.toUpperCase()}>${
    log.logger ? ` (${log.logger})` : ''
  }: ${log.message}${log.stacktrace ? `\n${log.stacktrace}` : ''}`;
}

function json(log) {
  log.level = log.level.label;
  return log;
}

const defaultCapacity = 500;
const defaults = {
  // url: 'https://ilivelog.qcloud.com/', // this url of kibana is maintained by neal's team
  // this is the url of kibana maintained by backend team
  // url: 'https://yun.tim.qq.com/v5/AVQualityReportSvc/C2S?sdkappid=1&cmdtype=jssdk_log',
  // url: 'https://test.tim.qq.com/v5/AVQualityReportSvc/C2S?sdkappid=1&cmdtype=jssdk_log',
  interval: 1000,
  level: 'trace',
  capacity: 0,
  stacktrace: {
    levels: ['trace', 'warn', 'error'],
    depth: 3,
    excess: 0,
  },
  timestamp: () => new Date().toISOString(),
  format: plain,
};

let uploadInterval = -1;
let isUploadConfigured = false;
let sdkAppId = '';
let userId = '';
let version = '';
const remote = {
  plain,
  json,
  setConfig(config) {
    if (isUploadConfigured) return;

    // ensure all fields are type of string
    sdkAppId = `${config.sdkAppId}`;
    userId = `${config.userId}`;
    version = `${config.version}`;
    isUploadConfigured = true;
  },
  apply(logger, options) {
    if (!logger || !logger.getLogger) {
      throw new TypeError('Argument is not a root loglevel object');
    }

    if (loglevel) {
      throw new Error('You can assign a plugin only one time');
    }

    loglevel = logger;

    const config = assign(defaults, options);

    config.capacity = config.capacity || defaultCapacity;

    const { interval } = config;
    let contentType;
    let isJSON;

    uploadInterval = raf.setInterval(send, interval);

    const queue = new Queue(config.capacity);

    function uploadLog(message) {
      if (!isUploadConfigured) return;

      const toUpload = JSON.stringify({
        // timestamp: defaults.timestamp(),
        timestamp: getTimestamp(),
        sdkAppId,
        userId,
        version,
        log: message,
      });
      axios
        .post(getKibanaLoggerUrl(), toUpload)
        .then(() => {
          queue.confirm();
        })
        .catch(() => {
          queue.fail();
        });
    }

    function send() {
      if (!isUploadConfigured) return;
      if (!queue.sent()) {
        if (!queue.length()) {
          return;
        }

        const logs = queue.send();

        queue.content = isJSON ? `{"logs":[${logs.join(',')}]}` : logs.join('\n');
        uploadLog(queue.content);
      }
    }

    originalFactory = logger.methodFactory;

    pluginFactory = function remoteMethodFactory(methodName, logLevel, loggerName) {
      const rawMethod = originalFactory(methodName, logLevel, loggerName);
      const needStack =        hasStacktraceSupport && config.stacktrace.levels.some(level => level === methodName);
      const levelVal = loglevel.levels[methodName.toUpperCase()];

      return (...args) => {
        const message = interpolate(args);
        // levelVal 为当前日志函数的 level 值
        // logLevel 为当前设定的 level 值
        // 例如： setLogLevel(3)，则不输出 levelVal < 3 的日志
        const needLog = levelVal >= logLevel;
        // 默认都需要上传 Kibana
        const needUpload = true;
        if (needLog) {
          const now = new Date();
          now.setTime(getCurrentTime());
          const timestamp =            `${now.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1')
          }:${now.getMilliseconds()}`;
          const consoleOutput = `[${timestamp}] <${methodName.toUpperCase()}> ${message}`;
          rawMethod.apply(undefined, [consoleOutput]);
        }
        if (needUpload) {
          // const timestamp = config.timestamp();
          // const timestamp = new Date().toLocaleString();
          const timestamp = getTimestamp();

          let stacktrace = needStack ? getStacktrace() : '';
          if (stacktrace) {
            const lines = stacktrace.split('\n');
            lines.splice(0, config.stacktrace.excess + 3);
            const { depth } = config.stacktrace;
            if (depth && lines.length !== depth + 1) {
              const shrink = lines.splice(0, depth);
              stacktrace = shrink.join('\n');
              if (lines.length) stacktrace += `\n    and ${lines.length} more`;
            } else {
              stacktrace = lines.join('\n');
            }
          }

          const log = config.format({
            message,
            level: {
              label: methodName,
              value: levelVal,
            },
            logger: loggerName || '',
            timestamp,
            stacktrace,
          });

          if (isJSON === undefined) {
            isJSON = !isString(log);
            contentType = isJSON ? 'application/json' : 'text/plain'; // eslint-disable-line
          }

          let content = '';
          if (isJSON) {
            try {
              content += JSON.stringify(log);
            } catch (error) {
              rawMethod(...args);
              loglevel.getLogger('logger').error(error);
              return;
            }
          } else {
            content += log;
          }

          // queue it for uploading when interval timer is fired.
          queue.push(content);

          // if (!isUploadConfigured) {
          //   // log upload is not ready yet, queue it for later process
          //   queue.push(content);
          // } else {
          //   if (queue.length()) {
          //     // drain the queue
          //     send();
          //   }
          //   uploadLog(content);
          // }
        }
      };
    };

    logger.methodFactory = pluginFactory;
    logger.setLevel(logger.getLevel());

    return logger;
  },
  disable() {
    if (!loglevel) {
      throw new Error('You can\'t disable a not appled plugin');
    }

    if (pluginFactory !== loglevel.methodFactory) {
      throw new Error('You can\'t disable a plugin after appling another plugin');
    }

    loglevel.methodFactory = originalFactory;
    loglevel.setLevel(loglevel.getLevel());
    loglevel = undefined;
    raf.clearInterval(uploadInterval);
  },
};

export default remote;
