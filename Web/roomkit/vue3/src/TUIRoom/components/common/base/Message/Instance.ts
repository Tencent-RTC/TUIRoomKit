import { h, render, ref } from 'vue';
import Message from './Message.vue';
import indexManager from '../../../../hooks/useZIndex';

export type MessageProps = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  zIndex?: number;
};
const activeMessages = [] as any;

const createInstance = ({ type, message, duration = 3000 }: MessageProps) => {
  const container = document.createElement('div');
  container.setAttribute('class', 't-message-container');
  const fullscreenElement =
    document.fullscreenElement ||
    document.getElementById('roomContainer') ||
    document.getElementById('pre-conference-container') ||
    document.body;
  fullscreenElement.appendChild(container);
  const uniqueKey = `message-${Date.now()}-${Math.random()}`;

  const updateTopValues = () => {
    activeMessages.forEach((msg: any, index: number) => {
      msg.updateTop(`calc(6% + ${index * 50}px)`);
    });
  };

  const removeMessage = (msg: any) => {
    const index = activeMessages.indexOf(msg);
    if (index !== -1) {
      activeMessages.splice(index, 1);
      updateTopValues();
    }
  };
  const onRemove = () => {
    render(null, container);
    fullscreenElement.removeChild(container);
    removeMessage(messageInstance);
  };
  const topValue = ref(`calc(6% + ${activeMessages.length * 50}px)`);

  const messageInstance = {
    key: uniqueKey,
    updateTop: (newTop: string) => {
      topValue.value = newTop;
    },
  };
  activeMessages.push(messageInstance);

  const vNode = h(Message, {
    key: uniqueKey,
    type,
    message,
    duration,
    remove: onRemove,
    top: topValue,
    zIndex: indexManager().nextZIndex(),
  });
  render(vNode, container);
};

export default createInstance;
