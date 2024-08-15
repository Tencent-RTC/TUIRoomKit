import Vue from 'vue';
import TUIMessageBox from './index.vue';
export type MessageProps = {
    title: string,
    message: string,
    callback?: () => void,
    cancelButtonText?: string,
    confirmButtonText?: string,
}

const MessageBox = ({ title, message, callback, cancelButtonText, confirmButtonText }: MessageProps) => {
  const container = document.createElement('div');
  const fullscreenElement = document.fullscreenElement || document.getElementById('roomContainer') || document.getElementById('pre-conference-container');
  if (!fullscreenElement) return;
  fullscreenElement.appendChild(container);

  const onRemove = () => {
    vm.$destroy();
    fullscreenElement.removeChild(container);
  };
  const MessageBoxConstruct = Vue.extend({
    render: (h: any) => h(TUIMessageBox, {
      props: {
        title,
        message,
        callback,
        cancelButtonText,
        confirmButtonText,
        remove: onRemove,
      },
    }),
  });
  const vm = new MessageBoxConstruct({ el: document.createElement('div') }).$mount();
  container.appendChild(vm.$el);
};
export default MessageBox;
