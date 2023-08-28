import { ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../../stores/chat';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import useGetRoomEngine from '../../hooks/useRoomEngine';

export default function useMessageList() {
  const { t } = useI18n();
  const roomEngine = useGetRoomEngine();
  const chatStore = useChatStore();
  const basicStore = useBasicStore();
  const { roomId } = storeToRefs(basicStore);
  const { messageList, isCompleted, nextReqMessageId } = storeToRefs(chatStore);
  const historyMessageList = ref([]);
  const messageAimId = ref();
  const messageBottomEl = ref<HTMLInputElement | null>(null);
  /**
 * To solve the problem of scrolling up the message yourself,
 * to prevent others from sending messages keep scrolling down the message list
 *
 * 为了解决自己向上滚动浏览消息, 防止别人发的消息不停向下滚消息列表
**/
  let loadMore = false;
  let isScrollNotAtBottom = false;
  let isScrollToTop = false;
  const handleMessageListScroll = (e: Event) => {
    const messageContainer = e.target as HTMLElement;
    const bottom = messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight;
    if (bottom > 80) {
    /**
     * 30 is the threshold for determining whether to scroll up through the messages
     *
     * 30 为判断是否向上滚动浏览消息的阈值
    **/
      isScrollNotAtBottom = true;
    } else {
      isScrollNotAtBottom = false;
    }
    if (isScrollToTop) {
      messageContainer.scrollTop = 0;
      isScrollToTop = false;
    }

    if (messageContainer.scrollTop < 40 && loadMore) {
      handleGetHistoryMessageList();
    }
  };

  watch(isCompleted, (value) => {
    loadMore = !value;
  }, { immediate: true, deep: true });

  watch(messageList, async (newMessageList, oldMessageList) => { // eslint-disable-line
    await nextTick();
    if (isScrollNotAtBottom) {
      if (newMessageList.length >= 1) {
        const lastMessage = newMessageList[newMessageList.length - 1];
        const oldLastMessage = oldMessageList[oldMessageList.length - 1];
        if ((lastMessage as any).flow === 'out'  && lastMessage.ID !== oldLastMessage.ID) {
          /**
         * The latest one was sent by myself
         *
         * 最新一条是自己发送的
        **/
          messageBottomEl.value && messageBottomEl.value.scrollIntoView();
        }
      }
      return;
    }
    /**
   * If you don't scroll all the way to the bottom, show the latest news directly
   *
   * 如果没进行滚动一直在底部, 直接展示最新消息
  **/
    messageBottomEl.value && messageBottomEl.value.scrollIntoView();
  });

  async function handleGetHistoryMessageList() {
    const tim = roomEngine.instance?.getTIM();
    const imResponse = await tim.getMessageList({
      conversationID: `GROUP${roomId.value}`,
      nextReqMessageID: nextReqMessageId.value,
    });
    const { nextReqMessageID: middleReqMessageId, messageList: historyMessageList, isCompleted } = imResponse.data;
    messageList.value.splice(0, 0, ...historyMessageList);
    const currentMessageList = messageList.value.filter(item => item.type === 'TIMTextElem');
    chatStore.setMessageListInfo(currentMessageList, isCompleted, middleReqMessageId);
  }
  async function getMessageList(): Promise<{
    currentMessageList: any[];
    isCompleted: boolean,
    nextReqMessageId: string,
  }> {
    let count = 0;
    const result: {
      currentMessageList: any[],
      isCompleted: boolean,
      nextReqMessageId: string,
    } = {
      currentMessageList: [],
      isCompleted: false,
      nextReqMessageId: '',
    };
    const tim: any = roomEngine.instance?.getTIM();

    const getIMMessageList = async () => {
      const conversationData: {
        conversationID: string,
        nextReqMessageID?: string | undefined;
      } = {
        conversationID: `GROUP${roomId.value}`,
      };
      if (result.nextReqMessageId !== '') {
        conversationData.nextReqMessageID = result.nextReqMessageId;
      }
      const imResponse = await tim.getMessageList(conversationData);
      const { messageList, isCompleted, nextReqMessageID } = imResponse.data;
      result.currentMessageList.splice(0, 0, ...messageList);
      result.isCompleted = messageList.length > 0 ? isCompleted : true;
      result.nextReqMessageId = nextReqMessageID;
      if (result.isCompleted || result.currentMessageList.length >= 15) {
        return;
      }
      count += 1;
      if (count === 1) {
        await getIMMessageList();
      }
    };

    await getIMMessageList();

    return result;
  };
  const onReceiveTextMessage = (data: { roomId: string, message: any }) => {
    const { message } = data;
    chatStore.updateMessageList({
      ID: message.messageId,
      type: 'TIMTextElem',
      payload: {
        text: message.message,
      },
      nick: message?.userName || message.userId,
      from: message.userId,
      flow: 'in',
      sequence: Math.random(),
    });
  };
  return {
    t,
    roomEngine,
    historyMessageList,
    messageAimId,
    messageBottomEl,
    handleMessageListScroll,
    handleGetHistoryMessageList,
    onReceiveTextMessage,
    messageList,
    isScrollNotAtBottom,
    getMessageList,
  };
}
