import { ref, watch, onUnmounted } from 'vue';
import { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from 'tuikit-atomicx-vue3/room';
import { useBarrageState } from '../useBarrageState';
import type { Barrage } from '../types';

interface IMessageGroupTip {
  avatarUrl: string;
  nameCard: string;
  roomCustomInfo: Record<string, any>;
  userId: string;
  userName: string;
  userRole: number;
  displayAction: 'enter' | 'leave';
}

const MAX_MESSAGE_COUNT = 1000;
const MESSAGE_GROUP_TIP_AUTO_CLEAR_DELAY = 2000;
const MESSAGE_QUEUE_PROCESS_DELAY = 1000;
const BATCH_SIZE = 20;
// const MAX_WAIT_TIME = 1000; todo
const MESSAGE_GROUP_TIP_QUEUE_MAX_LENGTH = 10;
const MESSAGE_GROUP_TIP_QUEUE_REMAIN_LENGTH = 2;

/** roomId is a snapshot; parent should remount with :key="roomId" on room switch. */
function useBarrageListState(roomId?: string) {
  const { messageList } = useBarrageState(roomId);
  const roomEngine = useRoomEngine();

  const messageGroupTipRef = ref<IMessageGroupTip>();
  const messageListRef = ref<Barrage[]>([]);
  const messageListCursor = ref<number>(0);
  const messageUpdateQueue = ref<Barrage[][]>([]);
  const isProcessingQueue = ref<boolean>(false);
  const messageGroupTipQueue = ref<IMessageGroupTip[]>([]);
  const isProcessingMessageGroupTipQueue = ref<boolean>(false);
  let disposed = false;

  let enterRoomListener: ((params: any) => void) | null = null;
  let leaveRoomListener: ((params: any) => void) | null = null;

  const clearEventListeners = () => {
    if (roomEngine.instance && enterRoomListener) {
      roomEngine.instance.off(TUIRoomEvents.onRemoteUserEnterRoom, enterRoomListener);
      enterRoomListener = null;
    }
    if (roomEngine.instance && leaveRoomListener) {
      roomEngine.instance.off(TUIRoomEvents.onRemoteUserLeaveRoom, leaveRoomListener);
      leaveRoomListener = null;
    }
  };

  const shouldAcceptRoomEvent = (eventRoomId?: string) => {
    if (roomId && eventRoomId && eventRoomId !== roomId) {
      return false;
    }
    return true;
  };

  const truncateMessageList = (messages: Barrage[]) => {
    if (messages.length <= MAX_MESSAGE_COUNT) {
      return messages;
    }
    const excessCount = messages.length - MAX_MESSAGE_COUNT;
    return messages.slice(excessCount);
  };

  const resetDerivedState = () => {
    messageListRef.value = [];
    messageListCursor.value = 0;
    messageUpdateQueue.value = [];
    messageGroupTipQueue.value = [];
    messageGroupTipRef.value = undefined;
  };

  const processMessageQueue = async () => {
    if (disposed || isProcessingQueue.value || messageUpdateQueue.value.length === 0) {
      return;
    }

    isProcessingQueue.value = true;

    try {
      let currentBatch: Barrage[] = [];

      while (!disposed && messageUpdateQueue.value.length > 0) {
        const messages = messageUpdateQueue.value.splice(0, 1)[0];
        currentBatch.push(...messages);

        const newMessageList = [...(messageListRef.value || []), ...currentBatch];
        messageListRef.value = truncateMessageList(newMessageList);
        currentBatch = [];

        if (messageUpdateQueue.value.length > 0) {
          // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
          await new Promise(resolve => setTimeout(resolve, MESSAGE_QUEUE_PROCESS_DELAY));
        }
      }
    } finally {
      isProcessingQueue.value = false;
    }
  };

  const processedMessageListUpdate = (list: Barrage[]) => {
    if (disposed) {
      return;
    }
    const newList = list.slice(messageListCursor.value);
    messageListCursor.value = list.length;

    if (newList.length === 0) {
      messageListRef.value = list;
      return;
    }

    for (let i = 0; i < newList.length; i += BATCH_SIZE) {
      messageUpdateQueue.value.push(newList.slice(i, i + BATCH_SIZE));
    }

    processMessageQueue();
  };

  const processMessageGroupTipQueue = async () => {
    if (disposed || isProcessingMessageGroupTipQueue.value || messageGroupTipQueue.value.length === 0) {
      return;
    }

    isProcessingMessageGroupTipQueue.value = true;

    try {
      while (!disposed && messageGroupTipQueue.value.length > 0) {
        const tip = messageGroupTipQueue.value.splice(0, 1)[0];
        messageGroupTipRef.value = tip;
        // eslint-disable-next-line no-await-in-loop, @stylistic/block-spacing, @stylistic/brace-style, @stylistic/max-statements-per-line
        await new Promise((resolve) => { setTimeout(resolve, MESSAGE_GROUP_TIP_AUTO_CLEAR_DELAY); });
        if (!disposed) {
          messageGroupTipRef.value = undefined;
        }
      }
    } catch (error) {
      console.error('[BarrageListState] processMessageGroupTipQueue error', error);
    } finally {
      isProcessingMessageGroupTipQueue.value = false;
    }
  };

  const processMessageGroupTipUpdate = (tip: IMessageGroupTip) => {
    if (disposed) {
      return;
    }
    messageGroupTipQueue.value.push(tip);
    if (messageGroupTipQueue.value.length > MESSAGE_GROUP_TIP_QUEUE_MAX_LENGTH) {
      messageGroupTipQueue.value = messageGroupTipQueue.value.slice(-MESSAGE_GROUP_TIP_QUEUE_REMAIN_LENGTH);
    }
    processMessageGroupTipQueue();
  };

  const initWatchers = () => {
    clearEventListeners();

    enterRoomListener = ({ roomId: eventRoomId, userInfo }) => {
      if (!shouldAcceptRoomEvent(eventRoomId)) {
        return;
      }
      processMessageGroupTipUpdate({
        avatarUrl: userInfo.avatarUrl,
        nameCard: userInfo.nameCard,
        roomCustomInfo: userInfo.roomCustomInfo,
        userId: userInfo.userId,
        userName: userInfo.userName,
        userRole: userInfo.userRole,
        displayAction: 'enter',
      });
    };

    leaveRoomListener = ({ roomId: eventRoomId, userInfo }) => {
      if (!shouldAcceptRoomEvent(eventRoomId)) {
        return;
      }
      processMessageGroupTipUpdate({
        avatarUrl: userInfo.avatarUrl,
        nameCard: userInfo.nameCard,
        roomCustomInfo: userInfo.roomCustomInfo,
        userId: userInfo.userId,
        userName: userInfo.userName,
        userRole: userInfo.userRole,
        displayAction: 'leave',
      });
    };

    roomEngine.instance?.on(TUIRoomEvents.onRemoteUserEnterRoom, enterRoomListener);
    roomEngine.instance?.on(TUIRoomEvents.onRemoteUserLeaveRoom, leaveRoomListener);
  };

  initWatchers();

  watch(() => messageList.value.length, (length) => {
    if (length > 0) {
      processedMessageListUpdate(messageList.value);
    } else if (!disposed) {
      messageListRef.value = [];
      messageListCursor.value = 0;
    }
  }, {
    immediate: true,
  });

  onUnmounted(() => {
    disposed = true;
    resetDerivedState();
    clearEventListeners();
  });

  return {
    messageList: messageListRef,
    messageGroupTip: messageGroupTipRef,
  };
}

export { useBarrageListState };
