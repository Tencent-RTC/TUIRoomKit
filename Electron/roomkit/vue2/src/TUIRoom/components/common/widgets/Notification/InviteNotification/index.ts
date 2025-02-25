import Vue, { VueConstructor } from 'vue';
import TUINotification from './index.vue';

export type invitationInfo = {
  userId: string;
  userName: string;
  avatarUrl: string;
  roomName: string;
  roomMemberCount: number;
  roomOwner: string;
  roomId: string;
};

export type NotificationProps = {
  appendTo: string;
  customClass?: string;
  message: string;
  onConfirm?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  confirmButtonText?: string;
  cancelButtonText?: string;
  duration?: number;
};

function NotificationFactory() {
  let notificationInstance: VueConstructor<Vue> | null = null;
  let container: Element | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let fullscreenElement: Element | null = null;

  function openInviteNotification(options: NotificationProps) {
    if (document.getElementById(options.appendTo)) {
      fullscreenElement = document.getElementById(options.appendTo);
    } else {
      fullscreenElement = document.fullscreenElement || document.body;
    }

    if (!notificationInstance) {
      container = document.createElement('div');
      container.setAttribute('class', 'tui-room-notification');
      fullscreenElement?.appendChild(container);
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

    const {
      appendTo,
      customClass,
      message,
      onConfirm,
      onCancel,
      confirmButtonText,
      cancelButtonText,
    } = options;
    const NotificationConstruct = Vue.extend({
      render: (h: any) =>
        h(TUINotification, {
          props: {
            appendTo,
            customClass,
            message,
            onConfirm,
            onCancel,
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
    timer = setTimeout(close, options.duration || 30000);
  }

  return {
    openInviteNotification,
  };
}

export const inviteNotification = NotificationFactory();
