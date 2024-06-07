declare let uni: any;

export const clipBoard = (data: any): Promise<{
  code: number,
  data?: any,
  err?: any
}> => new Promise((resolve, reject) => {
  uni.setClipboardData({
    data,
    success() {
      resolve({ code: 0, data });
    },
    fail(err: any) {
      reject({ code: -1, err });
    },
  });
});


