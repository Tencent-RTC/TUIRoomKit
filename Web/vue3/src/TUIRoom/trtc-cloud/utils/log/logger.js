import logger from './loglevel';
import remote from './remote';

let uploadLogEnabled = false;

logger.setConfig = function (config) {
  remote.setConfig(config);
};

logger.setLogLevel = function (level) {
  // logger.info('TRTC LogLevel was set to: ' + level);
  logger.setLevel(level);
};

logger.getLogLevel = function (level) {
  return logger.getLevel(level);
};

logger.enableUploadLog = function () {
  if (!uploadLogEnabled) {
    // logger.info('enable upload log');
    remote.apply(logger);
    uploadLogEnabled = true;
  }
};

logger.disableUploadLog = function () {
  if (uploadLogEnabled) {
    logger.warn('disable upload log! Without log we are difficult to help you triage the issue you might run into!');
    remote.disable();
    uploadLogEnabled = false;
  }
};

// enable log upload by default
logger.enableUploadLog();
// default log level is 'INFO'
logger.setLevel('INFO');

export default logger;
