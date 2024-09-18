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
  isMessageDisabled: boolean;
  unReadCount: number;
  isCompleted: boolean;
  // Is the list of all messages pulled
  nextReqMessageId: string;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messageList: [],
    isMessageDisabled: false,
    unReadCount: 0,
    isCompleted: false,
    nextReqMessageId: '',
  }),
  getters: {},
  actions: {
    updateMessageList(message: MessageItem) {
      const messageIds = this.messageList.map(message => message.ID);
      if (messageIds.indexOf(message.ID) === -1) {
        this.messageList = this.messageList.concat([message]);
      }
    },
    setMessageListInfo(
      messageList: MessageItem[],
      isCompleted: boolean,
      nextReqMessageId: string
    ) {
      this.messageList = messageList;
      this.isCompleted = isCompleted;
      this.nextReqMessageId = nextReqMessageId;
    },
    updateUnReadCount(count: number) {
      this.unReadCount = count;
    },
    addHistoryMessages(messageList: MessageItem[]) {
      const messageIds = this.messageList.map(message => message.ID);
      const filteredMessageList = messageList.filter(
        message => messageIds.indexOf(message.ID) === -1
      );
      this.messageList = filteredMessageList
        .concat(this.messageList)
        .sort(
          (messageA: MessageItem, messageB: MessageItem) =>
            messageA.sequence - messageB.sequence
        );
    },
    setSendMessageDisableChanged(isDisable: boolean) {
      this.isMessageDisabled = isDisable;
    },
    reset() {
      this.messageList = [];
      this.unReadCount = 0;
      this.isMessageDisabled = false;
    },
  },
});
