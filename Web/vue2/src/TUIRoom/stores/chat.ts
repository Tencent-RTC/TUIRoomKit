import { defineStore } from 'pinia';

interface MessageItem {
  ID: string;
  type: string;
  payload: {
    text: string;
  };
  nick: string;
  from: string;
  flow: string;
}

interface ChatState {
  messageList: MessageItem[];
  isMuteChatByMater: boolean;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messageList: [],
    isMuteChatByMater: false
  }),
  getters: {

  },
  actions: {
    updateMessageList(message: MessageItem) {
      this.messageList = this.messageList.concat([message]);
    },
    setIsMuteChatByMater(isMuteChatByMater: boolean) {
      this.isMuteChatByMater = isMuteChatByMater;
    },
    reset() {
      this.messageList = [];
    },
  },
});
