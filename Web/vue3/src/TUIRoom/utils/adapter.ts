import { isWeChat } from './useMediaValue';
declare let uni: any;

export const clipBoard = (data: any): Promise<{
  code: number,
  data?: any,
  err?: any
}> => new Promise((resolve, reject) => {
  if (!isWeChat) {
    try {
      navigator.clipboard.writeText(`${data}`);
      resolve({ code: 0, data });
    } catch (err) {
      reject({ code: -1, err });
    }
    return;
  }
  uni.setClipboardData({
    data,
    success() {
      uni.getClipboardData({
        success(data: any) {
          resolve({ code: 0, data });
        },
        fail(err: any) {
          reject({ code: -1, err });
        },
      });
    },
    fail(err: any) {
      reject({ code: -1, err });
    },
  });
});


