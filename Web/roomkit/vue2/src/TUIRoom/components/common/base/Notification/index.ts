import Vue, { VueConstructor } from 'vue';
import TUINotification from './index.vue';

export type NotificationProps = {
  message: string;
  confirm?: () => Promise<void>;
  cancel?: () => Promise<void>;
  confirmButtonText?: string;
  cancelButtonText?: string;
};

let notificationInstance: VueConstructor<Vue> | null = null;
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
    if (vm) {
      vm.$destroy();
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
        notificationInstance = null;
      }
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const NotificationConstruct = Vue.extend({
    render: (h: any) =>
      h(TUINotification, {
        props: {
          message,
          confirm,
          cancel,
          confirmButtonText,
          cancelButtonText,
          close,
        },
      }),
  });
  const vm = new NotificationConstruct({
    el: document.createElement('div'),
  }).$mount();
  container?.appendChild(vm.$el);
  notificationInstance = NotificationConstruct;

  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(close, 3000);

  return {
    close,
  };
};

export default Notification;
