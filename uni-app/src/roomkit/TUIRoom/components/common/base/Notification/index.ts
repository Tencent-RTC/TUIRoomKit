const Notification = (params:
  {
    appendToRoomContainer?: boolean,
    message: string,
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirm?: () => void;
    cancel?: () => void;
    duration?: number
  }) => {
  const { message = '', duration = 5000 } = params;
  return uni.showToast({
    title: message,
    icon: 'none',
    image: '',
    duration,
    mask: false,
    position: 'top',
  });
};

export default Notification;
