import { createVNode, render, VNode } from 'vue';
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
  message: invitationInfo;
  onConfirm?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  confirmButtonText?: string;
  cancelButtonText?: string;
  duration?: number;
};

function NotificationFactory() {
  let notificationInstance: VNode | null = null;
  let container: HTMLElement | null = null;
  let timer: NodeJS.Timer | null = null;
  let fullscreenElement: HTMLElement | null = null;

  function openInviteNotification(options: NotificationProps) {
    if (document.getElementById(options.appendTo)) {
      fullscreenElement = document.getElementById(
        options.appendTo
      ) as HTMLElement;
    } else {
      fullscreenElement = document.fullscreenElement || document.body;
    }
    if (!notificationInstance) {
      container = document.createElement('div');
      container.className = 'tui-room-notification';
      fullscreenElement?.appendChild(container);
    }

    const {
      appendTo,
      customClass,
      message,
      onConfirm,
      onCancel,
      confirmButtonText,
      cancelButtonText,
    } = options;
    const vnode = createVNode(TUINotification, {
      appendTo,
      customClass,
      message,
      onConfirm,
      onCancel,
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
    timer = setTimeout(close, options.duration || 30000);
  }

  function close() {
    if (container) {
      render(null, container);
      fullscreenElement?.removeChild(container);
      notificationInstance = null;
      container = null;
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    openInviteNotification,
  };
}

export const inviteNotification = NotificationFactory();
