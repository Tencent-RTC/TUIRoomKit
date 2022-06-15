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
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messageList: [],
  }),
  getters: {

  },
  actions: {
    updateMessageList(message: MessageItem) {
      this.messageList = this.messageList.concat([message]);
    },
    reset() {
      this.messageList = [];
    },
  },
});
