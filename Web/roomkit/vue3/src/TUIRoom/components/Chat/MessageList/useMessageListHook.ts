import { watch, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../../../stores/chat';
import { useBasicStore } from '../../../stores/basic';
import { useI18n } from '../../../locales';
import TUIRoomEngine, {
  TencentCloudChat,
} from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';

export default function useMessageList() {
  const { t } = useI18n();
  const roomEngine = useGetRoomEngine();
  const chatStore = useChatStore();
  const basicStore = useBasicStore();
  const { roomId } = storeToRefs(basicStore);
  const { messageList, isCompleted, nextReqMessageId } = storeToRefs(chatStore);

  watch(
    isCompleted,
    value => {
      isCompleted.value = value;
    },
    { immediate: true, deep: true }
  );

  async function handleGetHistoryMessageList() {
    const tim = roomEngine.instance?.getTIM();
    const imResponse = await tim?.getMessageList({
      conversationID: `GROUP${roomId.value}`,
      nextReqMessageID: nextReqMessageId.value,
    });
    const {
      nextReqMessageID: middleReqMessageId,
      messageList: historyMessageList,
      isCompleted,
    } = imResponse.data;
    messageList.value.splice(0, 0, ...historyMessageList);
    const currentMessageList = messageList.value.filter(
      item => item.type === 'TIMTextElem'
    );
    chatStore.setMessageListInfo(
      currentMessageList,
      isCompleted,
      middleReqMessageId
    );
  }

  async function getMessageList(): Promise<{
    currentMessageList: any[];
    isCompleted: boolean;
    nextReqMessageId: string;
  }> {
    let count = 0;
    const result: {
      currentMessageList: any[];
      isCompleted: boolean;
      nextReqMessageId: string;
    } = {
      currentMessageList: [],
      isCompleted: false,
      nextReqMessageId: '',
    };
    const tim: any = roomEngine.instance?.getTIM();
    const getIMMessageList = async () => {
      const conversationData: {
        conversationID: string;
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
  }

  const onReceiveMessage = (options: { data: any }) => {
    if (!options || !options.data) {
      return;
    }
    const currentConversationId = `GROUP${roomId.value}`;
    options.data.forEach((message: any) => {
      if (
        message.conversationID !== currentConversationId ||
        message.type !== TencentCloudChat.TYPES.MSG_TEXT
      ) {
        return;
      }
      const {
        ID,
        payload: { text },
        nick: userName,
        from: userId,
      } = message;
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

  async function setMessageListInfo() {
    const { currentMessageList, isCompleted, nextReqMessageId } =
      await getMessageList();
    const filterCurrentMessageList = currentMessageList.filter(
      (item: any) => item.type === 'TIMTextElem'
    );
    chatStore.setMessageListInfo(
      filterCurrentMessageList,
      isCompleted,
      nextReqMessageId
    );
  }

  function getDisplaySenderName(index: number) {
    if (index === 0) return true;
    return messageList.value[index].from !== messageList.value[index - 1].from;
  }

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
    handleGetHistoryMessageList,
    messageList,
    getMessageList,
    setMessageListInfo,
    getDisplaySenderName,
    isCompleted,
  };
}
