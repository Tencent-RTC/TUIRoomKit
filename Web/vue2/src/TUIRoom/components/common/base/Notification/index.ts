import Vue from 'vue';
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
    vm.$destroy();
    document.body.removeChild(container);
  };

  const NotificationConstruct = Vue.extend({
    render: (h: any) => h(TUINotification, {
      props: {
        type,
        message,
        confirm,
        cancel,
        confirmButtonText,
        cancelButtonText,
        remove: onRemove,
        appendToRoomContainer,
      },
      on: {
        remove: onRemove,
      },
    }),
  });
  const vm = new NotificationConstruct({ el: document.createElement('div') }).$mount();
  container.appendChild(vm.$el);
};

export default Notification;
