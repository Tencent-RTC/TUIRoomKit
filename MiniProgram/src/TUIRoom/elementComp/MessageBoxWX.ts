class MessageBox {
  alert(
    message?: string,
    title?: string,
    params?: {
          confirmButtonText?: string;
          cancelButtonText?: string;
          callback?: any;
          [key: string]: any;
        },
  ) {
    const { confirmButtonText = '确定', cancelButtonText = '取消', callback } = params || {};
    return uni.showModal({
      title,
      content: message,
      confirmText: confirmButtonText,
      cancelText: cancelButtonText,
      success: callback,
      fail: () => {
        throw Error('user cancel');
      },
    });
  }
}
const messageBox = new MessageBox();
export default messageBox;
