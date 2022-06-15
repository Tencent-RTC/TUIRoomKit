import { IError } from './IError';


export const jsExecuteError: IError = {
  code: -1000,
  message: 'js 执行报错',
};
export const ParametersError: IError = {
  code: -1001,
  message: '参数错误, 请检查参数格式、是否非空等',
};
export const enterRoomError: IError = {
  code: -1002,
  message: '进房失败：进房中或已进房',
};
export const exitRoomError: IError = {
  code: -1003,
  message: '退房失败：未进房或退房中',
};
export const conditionsError: IError = {
  code: -1004,
  message: '调用该函数所需要条件不满足',
};
