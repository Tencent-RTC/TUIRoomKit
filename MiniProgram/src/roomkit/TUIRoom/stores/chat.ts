import { defineStore } from 'pinia';

/**
 * History messages are kept as they come from the Chat SDK. Image info may
 * carry the url in either `url` or `imageUrl`, and file info may use either
 * `fileUrl`/`fileName`/`fileSize` or `url`/`name`/`size`.
 **/
export interface MessageImageInfo {
  imageUrl?: string;
  url?: string;
  width?: number;
  height?: number;
}

export interface MessageFileInfo {
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
}

interface MessageItem {
  ID: string;
  type: string;
  payload: {
    text?: string;
    imageInfoArray?: MessageImageInfo[];
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
  };
  nick: string;
  from: string;
  flow: string;
  sequence: number;
  // Upload progress of the local image or file message, from 0 to 1
  progress?: number;
}

interface ChatState {
  messageList: MessageItem[];
  isMessageDisabled: boolean;
  unReadCount: number;
  isCompleted: boolean;
  // Is the list of all messages pulled
  nextReqMessageId: string;
  isToolPanelOpen: boolean;
  // Height of the on-screen keyboard, in px. 0 means the keyboard is hidden.
  keyboardHeight: number;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messageList: [],
    isMessageDisabled: false,
    unReadCount: 0,
    isCompleted: false,
    nextReqMessageId: '',
    isToolPanelOpen: false,
    keyboardHeight: 0,
  }),
  getters: {},
  actions: {
    updateMessageList(message: MessageItem) {
      const messageIds = this.messageList.map(message => message.ID);
      if (messageIds.indexOf(message.ID) === -1) {
        this.messageList = this.messageList.concat([message]);
      }
    },
    updateMessageItem(ID: string, updates: Partial<MessageItem>) {
      this.messageList = this.messageList.map(message =>
        message.ID === ID ? { ...message, ...updates } : message
      );
    },
    removeMessage(ID: string) {
      this.messageList = this.messageList.filter(message => message.ID !== ID);
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
    setToolPanelOpen(isOpen: boolean) {
      this.isToolPanelOpen = isOpen;
    },
    setKeyboardHeight(height: number) {
      this.keyboardHeight = height;
    },
    reset() {
      this.messageList = [];
      this.unReadCount = 0;
      this.isMessageDisabled = false;
      this.isToolPanelOpen = false;
      this.keyboardHeight = 0;
    },
  },
});
