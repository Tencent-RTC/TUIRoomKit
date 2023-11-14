import Vue, { ref } from "vue";
import Message from "./Message.vue";
import indexManager from "../../../../hooks/useZIndex";

export interface MessageProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
  zIndex?: number;
}
const activeMessages = [] as any;

const createInstance = async ({
  type,
  message,
  duration = 3000,
}: MessageProps) => {
  const container = document.createElement("div");
  container.setAttribute("class", "t-message-container");
  const fullscreenElement = document.fullscreenElement || document.body;
  fullscreenElement.appendChild(container);
  const uniqueKey = `message-${Date.now()}-${Math.random()}`;

  const updateTopValues = () => {
    activeMessages.forEach((msg: any, index: number) => {
      msg.updateTop(`calc(6% + ${index * 6}%)`);
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
    vm.$destroy();
    fullscreenElement.removeChild(container);
    removeMessage(messageInstance);
  };
  const topValue = ref(`calc(6% + ${activeMessages.length * 6}%)`);
  const messageInstance = {
    key: uniqueKey,
    updateTop: (newTop: string) => {
      topValue.value = newTop;
    },
  };
  activeMessages.push(messageInstance);
  const zIndex = indexManager().nextZIndex()
  const messageConstruct = Vue.extend({
    render: (h: any) =>
      h(Message, {
        key: uniqueKey,
        props: {
          type,
          message,
          duration,
          remove: onRemove,
          top: topValue,
          zIndex,
        },
      }),
  });

  const vm = new messageConstruct({el: document.createElement('div')}).$mount()
  container.appendChild(vm.$el)
};

export default createInstance;
