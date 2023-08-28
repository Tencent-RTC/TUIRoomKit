export { formatErrMsg, formatInfoMsg, formatWarnMsg } from './format';
type LogType = 'error' | 'warn' | 'info' | 'log';
export declare function output(type: LogType, msg: string): void;
