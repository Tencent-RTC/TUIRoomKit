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
  sequence: number;
}

interface ChatState {
  messageList: MessageItem[];
  isMuteChatByMater: boolean;
  unReadCount: number;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messageList: [],
    isMuteChatByMater: false,
    unReadCount: 0,
  }),
  getters: {

  },
  actions: {
    updateMessageList(message: MessageItem) {
      const messageIds = this.messageList.map(message => message.ID);
      if (messageIds.indexOf(message.ID) === -1) {
        this.messageList = this.messageList.concat([message]);
      }
    },
    updateUnReadCount(count: number) {
      this.unReadCount = count;
    },
    addHistoryMessages(messageList: MessageItem[]) {
      const messageIds = this.messageList.map(message => message.ID);
      const filteredMessageList = messageList.filter(message => messageIds.indexOf(message.ID) === -1);
      this.messageList = filteredMessageList.concat(
        this.messageList).sort((messageA: MessageItem, messageB: MessageItem) => messageA.sequence - messageB.sequence);
    },
    setIsMuteChatByMater(isMuteChatByMater: boolean) {
      this.isMuteChatByMater = isMuteChatByMater;
    },
    reset() {
      this.messageList = [];
      this.unReadCount = 0;
      this.isMuteChatByMater = false;
    },
  },
});
