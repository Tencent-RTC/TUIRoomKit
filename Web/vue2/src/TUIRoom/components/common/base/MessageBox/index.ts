import Vue from 'vue';
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
    vm.$destroy();
    document.body.removeChild(container);
  };
  const messageBoxConstruct = Vue.extend({
    render: (h: any) => h(TUIMessageBox, {
      props: {
        title,
        message,
        callback,
        confirmButtonText,
        remove: onRemove,
        appendToRoomContainer,
      },
      on: {
        remove: onRemove,
      },
    }),
  });
  const vm = new messageBoxConstruct({el: document.createElement('div')}).$mount()
  container.appendChild(vm.$el)
};
export default MessageBox;
