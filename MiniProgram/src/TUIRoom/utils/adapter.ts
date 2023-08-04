import { isWeChat } from './useMediaValue';


export const clipBoard = (data: any): Promise<{
  code: number,
  data?: any,
  err?: any
}> => new Promise((resolve) => {
  if (!isWeChat) {
    try {
      navigator.clipboard.writeText(`${data}`);
      resolve({ code: 0, data });
    } catch (err) {
      resolve({ code: -1, err });
    }
    return;
  }
  uni.setClipboardData({
    data,
    success() {
      uni.getClipboardData({
        success(data) {
          resolve({ code: 0, data });
        },
        fail(err) {
          resolve({ code: -1, err });
        },
      });
    },
    fail(err) {
      resolve({ code: -1, err });
    },
  });
});


