import { createVNode, render, VNode } from 'vue';
import TUINotification from './index.vue';

export type NotificationProps = {
  message: string;
  confirm?: () => Promise<void>;
  cancel?: () => Promise<void>;
  confirmButtonText?: string;
  cancelButtonText?: string;
};

let notificationInstance: VNode | null = null;
let container: Element | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

const Notification = ({
  message,
  confirm,
  cancel,
  confirmButtonText,
  cancelButtonText,
}: NotificationProps) => {
  const fullscreenElement =
    document.fullscreenElement ||
    document.getElementById('roomContainer') ||
    document.body;

  if (!notificationInstance) {
    container = document.createElement('div');
    fullscreenElement.appendChild(container);
  }

  const close = () => {
    if (container) {
      render(null, container);
      fullscreenElement.removeChild(container);
      notificationInstance = null;
      container = null;
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const vnode = createVNode(TUINotification, {
    message,
    confirm,
    cancel,
    confirmButtonText,
    cancelButtonText,
    close,
  });

  if (container) {
    render(vnode, container);
    notificationInstance = vnode;
  }

  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(close, 3000);

  return {
    close,
  };
};

export default Notification;
