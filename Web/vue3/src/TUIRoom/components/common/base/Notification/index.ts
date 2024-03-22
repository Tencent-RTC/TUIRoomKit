import { createVNode, render } from 'vue';

import TUINotification from './index.vue';

export type NotificationProps = {
    type?: string,
    message: string,
    confirm?: () => Promise<void>,
    cancel?: () => Promise<void>,
    appendToRoomContainer?: boolean,
    confirmButtonText?: string,
    cancelButtonText?: string,
}
const Notification = ({
  type, message, confirm, cancel, appendToRoomContainer, confirmButtonText, cancelButtonText,
}: NotificationProps) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const onRemove = () => {
    render(null, container);
    document.body.removeChild(container);
  };

  const vnode = createVNode(TUINotification, {
    type,
    message,
    confirm,
    cancel,
    confirmButtonText,
    cancelButtonText,
    remove: onRemove,
    appendToRoomContainer,
  });
  render(vnode, container);
};

export default Notification;
