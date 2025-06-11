import { createVNode, render } from 'vue';

import TUIMessageBox, { Action } from './index.vue';

export type MessageProps = {
  title: string;
  message: string;
  callback?: (action: Action) => void;
  duration?: number;
  cancelButtonText?: string;
  confirmButtonText?: string;
};
const MessageBox = ({
  title,
  message,
  callback,
  duration,
  cancelButtonText,
  confirmButtonText,
}: MessageProps) => {
  const container = document.createElement('div');
  const fullscreenElement =
    document.fullscreenElement ||
    document.getElementById('roomContainer') ||
    document.getElementById('pre-conference-container') ||
    document.querySelector('body');
  if (!fullscreenElement) return;
  fullscreenElement.appendChild(container);

  const onRemove = () => {
    render(null, container);
    fullscreenElement.removeChild(container);
  };

  const vnode = createVNode(TUIMessageBox, {
    title,
    message,
    callback,
    duration,
    cancelButtonText,
    confirmButtonText,
    remove: onRemove,
  });
  render(vnode, container);
};

export default MessageBox;
