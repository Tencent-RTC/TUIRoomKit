const Message = (params: { type?: string; message?: string; duration?: number }) => {
  const { type = '', message = '', duration = 2000 } = params;
  return uni.showToast({
    title: message,
    icon: formatType(type),
    image: '',
    duration,
    mask: false,
  });
};

const formatType = (type: string = '') => {
  switch (type) {
    case 'success':
    case 'error':
    case 'loading':
      return type;
    case 'info':
      return 'none';
    default:
      return 'none';
  }
};

export default Message;
