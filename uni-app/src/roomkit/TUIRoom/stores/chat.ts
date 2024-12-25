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
  isMessageDisableByAdmin: boolean;
  unReadCount: number;
  isCompleted: boolean;
  // 是否已经拉完所有消息列表
  // Is the list of all messages pulled
  nextReqMessageId: string;
  route: string;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messageList: [],
    isMessageDisableByAdmin: false,
    unReadCount: 0,
    isCompleted: false,
    nextReqMessageId: '',
    route: '',
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
    setMessageListInfo(messageList: MessageItem[], isCompleted: boolean, nextReqMessageId: string) {
      this.messageList = messageList;
      this.isCompleted = isCompleted;
      this.nextReqMessageId = nextReqMessageId;
    },
    updateUnReadCount(count: number) {
      this.unReadCount = count;
    },
    addHistoryMessages(messageList: MessageItem[]) {
      const messageIds = this.messageList.map(message => message.ID);
      const filteredMessageList = messageList.filter(message => messageIds.indexOf(message.ID) === -1);
      this.messageList = filteredMessageList.concat(this.messageList).sort((messageA: MessageItem, messageB: MessageItem) => messageA.sequence - messageB.sequence);
    },
    setSendMessageDisableChanged(isDisable: boolean) {
      this.isMessageDisableByAdmin = isDisable;
    },
    setCurrentsPage(route: string) {
      this.route = route;
    },
    reset() {
      this.messageList = [];
      this.unReadCount = 0;
      this.isMessageDisableByAdmin = false;
      this.route = '';
    },
  },
});
