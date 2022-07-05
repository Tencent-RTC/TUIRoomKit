import { isLocalStorageEnabled } from '../environment';
import { isFunction, isNumber, isString } from '../utils';

/* eslint-disable require-jsdoc */
const logger = (function () {
  // Slightly dubious tricks to cut down minimized file size
  const noop = function () {};
  const undefinedType = 'undefined';

  const logMethods = ['trace', 'debug', 'info', 'warn', 'error'];

  // Cross-browser bind equivalent that works at least back to IE6
  function bindMethod(obj, methodName) {
    const method = obj[methodName];
    if (isFunction(method.bind)) {
      return method.bind(obj);
    }
    try {
      return Function.prototype.bind.call(method, obj);
    } catch (error) {
      // Missing bind shim or IE8 + Modernizr, fallback to wrapping
      return function () {
        return Function.prototype.apply.apply(method, [obj, arguments]);
      };
    }
  }

  // Build the best logging method possible for this env
  // Wherever possible we want to bind, not wrap, to preserve stack traces
  function realMethod(methodName) {
    if (methodName === 'debug') {
      methodName = 'log';
    }

    if (typeof console === undefinedType) {
      return false; // No method possible, for now - fixed later by enableLoggingWhenConsoleArrives
    }
    if (console[methodName] !== undefined) {
      return bindMethod(console, methodName);
    }
    if (console.log !== undefined) {
      return bindMethod(console, 'log');
    }
    return noop;
  }

  // These private functions always need `this` to be set properly

  function replaceLoggingMethods(level, loggerName) {
    /* jshint validthis:true */
    for (let i = 0; i < logMethods.length; i++) {
      const methodName = logMethods[i];
      // v4.6.2 版本 setLogLevel 时，会将低于目标 level 的日志函数(如 info, warning, error 等)赋值为空函数: noop。
      // 为实现上传 kibana 与日志输出分离，此处去掉 noop 赋值。
      this[methodName] = this.methodFactory(methodName, level, loggerName);
    }

    // Define log.log as an alias for log.debug
    this.log = this.debug;
  }

  // In old IE versions, the console isn't present until you first open it.
  // We build realMethod() replacements here that regenerate logging methods
  function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
    return function () {
      if (typeof console !== undefinedType) {
        replaceLoggingMethods.call(this, level, loggerName);
        this[methodName].apply(this, arguments);
      }
    };
  }

  // By default, we use closely bound real methods wherever possible, and
  // otherwise we wait for a console to appear, and then try again.
  function defaultMethodFactory(methodName, level, loggerName) { // eslint-disable-line
    /* jshint validthis:true */
    return realMethod(methodName) || enableLoggingWhenConsoleArrives.apply(this, arguments);
  }

  function Logger(name, defaultLevel, factory) {
    const self = this;
    let currentLevel;
    let storageKey = 'loglevel';
    if (name) {
      storageKey += `:${name}`;
    }

    function persistLevelIfPossible(levelNum) {
      const levelName = (logMethods[levelNum] || 'silent').toUpperCase();

      if (typeof window === undefinedType) return;

      // Use localStorage if available
      try {
        if (isLocalStorageEnabled()) {
          window.localStorage[storageKey] = levelName;
        }
        return;
      } catch (ignore) {
        // ignore
      }
    }

    function getPersistedLevel() {
      let storedLevel;

      if (typeof window === undefinedType) return;

      try {
        if (isLocalStorageEnabled()) {
          storedLevel = window.localStorage[storageKey];
        }
      } catch (ignore) {
        // ignore
      }

      // If the stored level is not valid, treat it as if nothing was stored.
      if (self.levels[storedLevel] === undefined) {
        storedLevel = undefined;
      }

      return storedLevel;
    }

    /*
     *
     * Public logger API - see https://github.com/pimterry/loglevel for details
     *
     */

    self.name = name;

    self.levels = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, SILENT: 5 };

    self.methodFactory = factory || defaultMethodFactory;

    self.getLevel = function () {
      return currentLevel;
    };

    self.setLevel = function (level, persist) {
      if (isString(level) && self.levels[level.toUpperCase()] !== undefined) {
        level = self.levels[level.toUpperCase()];
      }
      if (isNumber(level) && level >= 0 && level <= self.levels.SILENT) {
        currentLevel = level;
        if (persist !== false) {
          // defaults to true
          persistLevelIfPossible(level);
        }
        replaceLoggingMethods.call(self, level, name);
        if (typeof console === undefinedType && level < self.levels.SILENT) {
          return 'No console available for logging';
        }
      } else {
        throw `log.setLevel() called with invalid level: ${level}`;
      }
    };

    self.setDefaultLevel = function (level) {
      if (!getPersistedLevel()) {
        self.setLevel(level, false);
      }
    };

    self.enableAll = function (persist) {
      self.setLevel(self.levels.TRACE, persist);
    };

    self.disableAll = function (persist) {
      self.setLevel(self.levels.SILENT, persist);
    };

    // Initialize with the right level
    let initialLevel = getPersistedLevel();
    if (initialLevel == null) {
      initialLevel = defaultLevel == null ? 'WARN' : defaultLevel;
    }
    self.setLevel(initialLevel, false);
  }

  /*
   *
   * Top-level API
   *
   */

  const defaultLogger = new Logger();

  const _loggersByName = {};
  defaultLogger.getLogger = function getLogger(name) {
    if (!isString(name) || name === '') {
      throw new TypeError('You must supply a name when creating a logger.');
    }

    let logger = _loggersByName[name];
    if (!logger) {
      _loggersByName[name] = new Logger(
        name,
        defaultLogger.getLevel(),
        defaultLogger.methodFactory,
      );
      logger = _loggersByName[name];
    }
    return logger;
  };

  // Grab the current global log variable in case of overwrite
  const _log = typeof window !== undefinedType ? window.log : undefined;
  defaultLogger.noConflict = function () {
    if (typeof window !== undefinedType && window.log === defaultLogger) {
      window.log = _log;
    }

    return defaultLogger;
  };

  defaultLogger.getLoggers = function getLoggers() {
    return _loggersByName;
  };

  return defaultLogger;
}());

export default logger;
