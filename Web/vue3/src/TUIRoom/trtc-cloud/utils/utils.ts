import { loggerProxy, loggerDomain, auxiliaryStream } from '../common/constants';

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
  return `${userId}-main`;
}
export function userIdAuxiliary(userId: string): string {
  return `${userId}-${auxiliaryStream}`;
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
