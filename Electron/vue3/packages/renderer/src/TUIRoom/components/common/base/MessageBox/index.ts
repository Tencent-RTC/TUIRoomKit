import { createVNode, render } from 'vue';

import TUIMessageBox from './index.vue';

export type MessageProps = {
    title: string,
    message: string,
    callback?: () => Promise<void>,
    appendToRoomContainer?: boolean,
    confirmButtonText?: string,
}
const MessageBox = ({ title, message, callback, appendToRoomContainer, confirmButtonText }: MessageProps) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const onRemove = () => {
    render(null, container);
    document.body.removeChild(container);
  };

  const vnode = createVNode(TUIMessageBox, {
    title,
    message,
    callback,
    confirmButtonText,
    remove: onRemove,
    appendToRoomContainer,
  });
  render(vnode, container);
};

export default MessageBox;
