const Notification = (params: {
  message: string,
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirm?: () => void;
  cancel?: () => void;
  duration?: number;
}) => {
  const message = params.message || '';
  const duration = params.duration || 3000;

  const showToast = () => {
    uni.showToast({
      title: message,
      icon: 'none',
      image: '',
      duration,
      mask: false,
      position: 'top',
    });
  };

  showToast();

  const close = () => {
    uni.hideToast();
  };

  return {
    close,
  };
};

export default Notification;
