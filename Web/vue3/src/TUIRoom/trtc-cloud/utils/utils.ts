import { loggerProxy, loggerDomain, NAME } from '../common/constants';

/**
 * 获取向下取整的 performance.now() 值
 * @export
 * @return {Number}
 */
// eslint-disable-next-line require-jsdoc
export function performanceNow() {
  return Math.floor(performance.now());
}

/**
 * 获取上报到 kibana 日志的 url
 * @return {String}
 */
export const getKibanaLoggerUrl = function (): string {
  return `${loggerProxy || loggerDomain}/v5/AVQualityReportSvc/C2S?sdkappid=1&cmdtype=jssdk_log`;
};

/**
 * 获取上报到秒级监控的 url
 * @return {String}
 */
export const getBackendEventUrl = function (): string {
  return `${loggerProxy || loggerDomain}/v5/AVQualityReportSvc/C2S?sdkappid=1&cmdtype=jssdk_event`;
};

export const isFunction = (param: any) => typeof param === 'function';
export const isUndefined = (param: any) => typeof param === 'undefined';
export const isString = (param: any) => typeof param === 'string';
export const isNumber = (param: any) => typeof param === 'number';
export const isBoolean = (param: any) => typeof param === 'boolean';

export function userIdMain(userId: string): string {
  return `${userId}-${NAME.MAIN}`;
}
export function userIdAuxiliary(userId: string): string {
  return `${userId}-${NAME.AUXILIARY}`;
}

/**
 *  mixins class
 */
export function MixinsClass(...mixins: any[]): any {
  class MixClass {
    constructor() {
      // eslint-disable-next-line no-restricted-syntax
      for (const Mixin of mixins) {
        copyProperties(this, new Mixin(this)); // 拷贝实例属性 同时执行内部初始化
      }
    }
  }
  const proto = MixClass.prototype;
  // eslint-disable-next-line no-restricted-syntax
  for (const mixin of mixins) {
    copyProperties(MixClass, mixin); // 拷贝静态属性
    copyProperties(proto, mixin.prototype); // 拷贝原型属性
  }
  return MixClass;
}

/**
 *
 * @param target
 * @param source
 */
function copyProperties(target: any, source: any) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Reflect.ownKeys(source)) {
    if (key !== 'constructor' && key !== 'prototype' && key !== 'name') {
      const desc = Object.getOwnPropertyDescriptor(source, key) || '';
      Object.defineProperty(target, key, desc);
    }
  }
}
/**
 * userId 和屏幕分享 shareUserId 是否相互包含
 * shareUserId 要求格式：`share_${userId}`，否则无法解析出来
 * @param {String} userId 用户 userId
 * @param {String} shareUserId 用户屏幕分享的 userId
 * @return {Boolean}
 */
export function isContained(userId: string = '', shareUserId: string) {
  if (shareUserId === `share_${userId}`) {
    return true;
  }
  return false;
}
/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {Number} delay 间隔时间, 毫秒
 * @returns function
 */
// eslint-disable-next-line no-unused-vars
export function debounce(fn: { apply: (arg0: any, arg1: any) => void; }, delay: number | undefined) {
  let timer: number;
  return function (this:any, ...args: any) {
    if (timer > 0) {
      clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      fn.apply(this, args);
      timer = -1;
    }, delay);
  };
}
