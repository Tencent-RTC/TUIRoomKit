import log from './logger';

export default class IDLogger {
  /*
   * log with userId and local/remote prefix
   */
  constructor(options) {
    this.id_ = options.id;
    this.direction_ = options.direction; // local or remote
    this.type_ = options.type; // main or aux

    // simplify prefix to avoid floody loggings.
    this.directionPrefix_ = this.direction_ === 'local' ? '' : '*';
  }

  log(level, message) {
    log[level](`[${this.directionPrefix_}${this.id_}] ${this.type_} ${message}`);
  }

  setId(id) {
    this.id_ = id;
  }

  info(message) {
    this.log('info', message);
  }

  debug(message) {
    this.log('debug', message);
  }

  warn(message) {
    this.log('warn', message);
  }

  error(message) {
    this.log('error', message);
  }
}
