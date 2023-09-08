/**
 * 这个常量定义模块，即用于 main 目录下各个 ts 模块，也用 main/preload.js 模块，
 * 此处定义为 node.js module 格式，以上两类模块都可使用。
 *
 * 如果此处定义为 ES 6 模块（使用 import/export )，则 preload.js 模块无法使用，
 * 原因是 preload.js 文件是一个原生 node.js module 执行文件，后续如果 preload.js
 * 承担职责过多，代码复杂度较大，可以考虑使用。
 */
export enum EUserEventNames {
  ON_CHANGE_LOG_LEVEL = 'onChangeLogLevel',
}
  
export default {
  EUserEventNames,
};
  