import { ref, watch, nextTick, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../../stores/chat';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import TUIRoomEngine, { TencentCloudChat } from '@tencentcloud/tuiroom-engine-electron';
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
  const onReceiveMessage = (options: { data: any }) => {
    if (!options || !options.data) {
      return;
    }
    options.data.forEach((message: any) => {
      if (message.type !== TencentCloudChat.TYPES.MSG_TEXT) {
        return;
      }
      const { ID, payload: { text }, nick: userName, from: userId } = message;
      chatStore.updateMessageList({
        ID,
        type: 'TIMTextElem',
        payload: {
          text,
        },
        nick: userName || userId,
        from: userId,
        flow: 'in',
        sequence: Math.random(),
      });
    });
  };

  let tim = roomEngine.instance?.getTIM();
  if (!tim) {
    tim = TencentCloudChat.create({ SDKAppID: basicStore.sdkAppId });
  }

  TUIRoomEngine.once('ready', () => {
    tim?.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onReceiveMessage);
  });
  onUnmounted(() => {
    tim?.off(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onReceiveMessage);
  });

  return {
    t,
    historyMessageList,
    messageAimId,
    messageBottomEl,
    handleMessageListScroll,
    handleGetHistoryMessageList,
    onReceiveMessage,
    messageList,
    isScrollNotAtBottom,
    getMessageList,
  };
}
