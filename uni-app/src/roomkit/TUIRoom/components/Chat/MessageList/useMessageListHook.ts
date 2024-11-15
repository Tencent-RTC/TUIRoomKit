import { watch, onUnmounted, onMounted, ref, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../../../stores/chat';
import { useBasicStore } from '../../../stores/basic';
import TencentCloudChat from '@tencentcloud/chat';
import { roomService } from '../../../services/roomService';

export default function useMessageList() {
  const chatStore = useChatStore();
  const basicStore = useBasicStore();
  const { roomId } = storeToRefs(basicStore);
  const { messageList, isCompleted, nextReqMessageId } = storeToRefs(chatStore);
  const targetJumpMessage = ref('');
  const isAtBottom = ref(false);

  watch(isCompleted, (value) => {
    isCompleted.value = value;
  }, { immediate: true, deep: true });

  watch(messageList, async (val) => {
    if (val && val[val.length - 1].flow === 'out') {
      await nextTick();
      targetJumpMessage.value = `ID-${val[val.length - 1].ID}`;
    }
  });


  async function handleGetHistoryMessageList() {
    const imResponse = await roomService.tim.getMessageList({
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
      const imResponse = await roomService.tim.getMessageList(conversationData);
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
      const { ID, payload: { text }, nick: userName, from: userId, sequence } = message;
      chatStore.updateMessageList({
        ID,
        type: 'TIMTextElem',
        payload: {
          text,
        },
        nick: userName || userId,
        from: userId,
        flow: 'in',
        sequence,
      });
      if (isAtBottom.value) {
        targetJumpMessage.value = `ID-${message.ID}`;
      }
    });
  };

  async function setMessageListInfo() {
    const { currentMessageList, isCompleted, nextReqMessageId } = await getMessageList();
    const filterCurrentMessageList = currentMessageList.filter((item: any) => item.type === 'TIMTextElem');
    chatStore.setMessageListInfo(filterCurrentMessageList, isCompleted, nextReqMessageId);
    targetJumpMessage.value = `ID-${filterCurrentMessageList[filterCurrentMessageList.length - 1].ID}`;
  }

  function getDisplaySenderName(index: number) {
    if (index === 0) return true;
    return messageList.value[index].from !== messageList.value[index - 1].from;
  }

  const handleScrolltoupper = () => {
    isAtBottom.value = false;
    if (!isCompleted.value) {
      handleGetHistoryMessageList();
    }
  };

  const handleScrolltolower = () => {
    isAtBottom.value = true;
  };

  onMounted(() => {
    roomService.tim.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onReceiveMessage);
  });
  onUnmounted(() => {
    roomService.tim.off(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onReceiveMessage);
  });

  return {
    handleGetHistoryMessageList,
    messageList,
    getMessageList,
    setMessageListInfo,
    getDisplaySenderName,
    isCompleted,
    targetJumpMessage,
    handleScrolltoupper,
    handleScrolltolower,
  };
}
