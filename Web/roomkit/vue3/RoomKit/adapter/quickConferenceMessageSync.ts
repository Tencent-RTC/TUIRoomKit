/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
import { effectScope, nextTick, watch } from 'vue';
import type { ComputedRef } from 'vue';
import { TUIConstants, TUICore } from '@tencentcloud/tui-core-lite';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { LoginStore, MessageStatus, useChatContext } from 'tuikit-atomicx-vue3/chat';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import type { ConversationInfo, CustomMessageInfo, MessageInfo } from 'tuikit-atomicx-vue3/chat';
import type { RoomUser } from 'tuikit-atomicx-vue3/room';

const CHAT_CHANNEL_ID = 'default';

interface QuickConferencePayload {
  businessID: string;
  owner: string;
  ownerName: string;
  roomId: string;
  roomState: 'creating' | 'created' | 'destroyed';
  userList: Array<{
    faceUrl: string;
    nickName: string;
    userId: string;
  }>;
}

const ROOM_LEFT_CONFIRM_DELAY = 300;
const pendingQuickConferencePayloadMap = new Map<string, Partial<QuickConferencePayload>>();
const dismissedRoomIdSet = new Set<string>();
const pendingRoomLeftTimerMap = new Map<string, ReturnType<typeof setTimeout>>();
const quickConferenceMessageIdCacheMap = new Map<string, string>();
const modifyingRoomIdSet = new Set<string>();

let messageList!: ComputedRef<readonly MessageInfo[] | undefined>;
let activeConversation!: ComputedRef<ConversationInfo | undefined>;
let getChat: () => any = () => null;

const chatStateScope = effectScope(true);
chatStateScope.run(() => {
  const chatContext = useChatContext(CHAT_CHANNEL_ID);
  messageList = chatContext.messageList as ComputedRef<readonly MessageInfo[] | undefined>;
  activeConversation = chatContext.activeConversation as ComputedRef<ConversationInfo | undefined>;
  const loginStore = LoginStore();
  getChat = () => loginStore.getChat();
});

const { loginUserInfo } = useLoginState();
const { getRoomInfo } = useRoomState();
const checkingQuickConferenceRoomIdSet = new Set<string>();

const getDefaultQuickConferencePayload = (): QuickConferencePayload => ({
  businessID: 'group_room_message',
  owner: '',
  ownerName: '',
  roomId: '',
  roomState: 'destroyed',
  userList: [],
});

const parseQuickConferencePayload = (message: MessageInfo): QuickConferencePayload => {
  try {
    const customData = (message as CustomMessageInfo)?.messagePayload?.customData;
    return {
      ...getDefaultQuickConferencePayload(),
      ...JSON.parse(customData || '{}'),
    };
  } catch {
    return getDefaultQuickConferencePayload();
  }
};

const findQuickConferenceMessage = (roomId: string): MessageInfo | undefined => {
  const currentMessageList = messageList.value || [];
  const cachedMessageId = quickConferenceMessageIdCacheMap.get(roomId);

  if (cachedMessageId) {
    const cachedMessage = currentMessageList.find(message => message.msgID === cachedMessageId);
    if (cachedMessage) {
      return cachedMessage;
    }
    quickConferenceMessageIdCacheMap.delete(roomId);
  }

  for (let index = currentMessageList.length - 1; index >= 0; index -= 1) {
    const message = currentMessageList[index];
    const payload = parseQuickConferencePayload(message);
    if (payload.businessID === 'group_room_message' && payload.roomId === roomId) {
      if (message.msgID) {
        quickConferenceMessageIdCacheMap.set(roomId, message.msgID);
      }
      return message;
    }
  }
  return undefined;
};

const mergePendingQuickConferencePayload = (roomId: string, partialPayload: Partial<QuickConferencePayload>) => {
  pendingQuickConferencePayloadMap.set(roomId, {
    ...(pendingQuickConferencePayloadMap.get(roomId) || {}),
    ...partialPayload,
  });
};

const updateQuickConferenceMessage = async (roomId: string, partialPayload: Partial<QuickConferencePayload>) => {
  if (!roomId) {
    return;
  }

  if (partialPayload.roomState === 'destroyed') {
    dismissedRoomIdSet.add(roomId);
  }

  const message = findQuickConferenceMessage(roomId);
  if (!message) {
    mergePendingQuickConferencePayload(roomId, partialPayload);
    return;
  }

  const currentPayload = parseQuickConferencePayload(message);
  const nextPayload = {
    ...currentPayload,
    ...partialPayload,
  };

  if (dismissedRoomIdSet.has(roomId)) {
    nextPayload.roomState = 'destroyed';
  }

  if (JSON.stringify(currentPayload) === JSON.stringify(nextPayload)) {
    pendingQuickConferencePayloadMap.delete(roomId);
    return;
  }

  if (message.status !== MessageStatus.SendSuccess) {
    mergePendingQuickConferencePayload(roomId, partialPayload);
    return;
  }

  if (modifyingRoomIdSet.has(roomId)) {
    mergePendingQuickConferencePayload(roomId, partialPayload);
    return;
  }

  const chat = getChat();
  const rawMessage = chat?.findMessage?.(message.msgID);
  if (!rawMessage) {
    mergePendingQuickConferencePayload(roomId, partialPayload);
    return;
  }

  modifyingRoomIdSet.add(roomId);
  pendingQuickConferencePayloadMap.delete(roomId);
  try {
    if (!rawMessage.payload) {
      rawMessage.payload = {};
    }
    rawMessage.payload.data = JSON.stringify(nextPayload);
    await chat.modifyMessage(rawMessage);
  } catch (error: any) {
    if (error?.code === 20026 || error?.code === 20027) {
      mergePendingQuickConferencePayload(roomId, partialPayload);
      return;
    }
    throw error;
  } finally {
    modifyingRoomIdSet.delete(roomId);
    // A newer payload (e.g. room destroyed) may have arrived while this
    // message was being modified and was queued as pending. Flush it here
    // instead of relying solely on the messageList watcher, since an in-place
    // modifyMessage does not always emit a new messageList reference.
    if (pendingQuickConferencePayloadMap.has(roomId)) {
      void Promise.resolve().then(() => flushPendingQuickConferenceMessages());
    }
  }
};

const flushPendingQuickConferenceMessages = async () => {
  const pendingEntries = Array.from(pendingQuickConferencePayloadMap.entries());
  for (const [roomId, partialPayload] of pendingEntries) {
    const message = findQuickConferenceMessage(roomId);
    if (!message || message.status !== MessageStatus.SendSuccess) {
      continue;
    }
    await updateQuickConferenceMessage(roomId, partialPayload);
  }
};

const getCurrentConversationQuickConferenceRoomIds = () => {
  const currentMessageList = messageList.value || [];
  return Array.from(new Set(
    currentMessageList
      .map(message => parseQuickConferencePayload(message))
      .filter(payload => (
        payload.businessID === 'group_room_message'
        && payload.roomId
        && payload.roomState !== 'destroyed'
      ))
      .map(payload => payload.roomId),
  ));
};

const isRoomNotExistError = (error: any) => error?.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST;

const reconcileActiveConversationQuickConferenceMessages = async (conversationID?: string) => {
  if (!conversationID) {
    return;
  }

  await nextTick();
  const roomIds = getCurrentConversationQuickConferenceRoomIds();
  for (const roomId of roomIds) {
    if (dismissedRoomIdSet.has(roomId) || checkingQuickConferenceRoomIdSet.has(roomId)) {
      continue;
    }

    checkingQuickConferenceRoomIdSet.add(roomId);
    try {
      await getRoomInfo({ roomId });
    } catch (error: any) {
      if (isRoomNotExistError(error)) {
        await updateQuickConferenceMessage(roomId, {
          roomState: 'destroyed',
        });
      }
    } finally {
      checkingQuickConferenceRoomIdSet.delete(roomId);
    }
  }
};

const clearPendingRoomLeftTimer = (roomId: string) => {
  const timer = pendingRoomLeftTimerMap.get(roomId);
  if (!timer) {
    return;
  }
  clearTimeout(timer);
  pendingRoomLeftTimerMap.delete(roomId);
};

watch(() => messageList.value, () => {
  flushPendingQuickConferenceMessages();
}, { deep: false });

watch(
  () => activeConversation.value?.conversationID,
  (conversationID, oldConversationID) => {
    if (!conversationID || conversationID === oldConversationID) {
      return;
    }
    reconcileActiveConversationQuickConferenceMessages(conversationID);
  },
  { immediate: true },
);

TUICore.registerEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.QUICK_CONFERENCE_MESSAGE_CREATED, {
  onNotifyEvent: (_eventName: string, subKey: string, params: { roomId: string; message?: MessageInfo }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.QUICK_CONFERENCE_MESSAGE_CREATED) {
      return;
    }
    if (params?.roomId && params?.message) {
      if (params.message.msgID) {
        quickConferenceMessageIdCacheMap.set(params.roomId, params.message.msgID);
      }
      flushPendingQuickConferenceMessages();
    }
  },
});

TUICore.registerEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_DISMISS, {
  onNotifyEvent: (_eventName: string, subKey: string, params: { roomInfo?: { roomId?: string } }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_DISMISS) {
      return;
    }
    const roomId = params?.roomInfo?.roomId || '';
    clearPendingRoomLeftTimer(roomId);
    updateQuickConferenceMessage(roomId, {
      roomState: 'destroyed',
    });
  },
});

TUICore.registerEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_NOT_EXIST, {
  onNotifyEvent: (_eventName: string, subKey: string, params: { roomId: string }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_NOT_EXIST) {
      return;
    }
    updateQuickConferenceMessage(params?.roomId || '', {
      roomState: 'destroyed',
    });
  },
});

TUICore.registerEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_LEFT, {
  onNotifyEvent: (_eventName: string, subKey: string, params: { roomId: string }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_LEFT) {
      return;
    }
    const roomId = params?.roomId || '';
    if (!roomId || dismissedRoomIdSet.has(roomId)) {
      return;
    }
    clearPendingRoomLeftTimer(roomId);
    const timer = setTimeout(() => {
      pendingRoomLeftTimerMap.delete(roomId);
      if (dismissedRoomIdSet.has(roomId)) {
        return;
      }
      const message = findQuickConferenceMessage(roomId);
      if (!message) {
        return;
      }
      const payload = parseQuickConferencePayload(message);
      updateQuickConferenceMessage(roomId, {
        userList: payload.userList.filter(item => item.userId !== loginUserInfo.value?.userId),
      });
    }, ROOM_LEFT_CONFIRM_DELAY);
    pendingRoomLeftTimerMap.set(roomId, timer);
  },
});

TUICore.registerEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.PARTICIPANT_LIST_CHANGE, {
  onNotifyEvent: (_eventName: string, subKey: string, params: { roomId: string; participantList: Array<{ avatarUrl: string; userName: string; userId: string }> }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.PARTICIPANT_LIST_CHANGE) {
      return;
    }
    const roomId = params?.roomId || '';
    if (!roomId || dismissedRoomIdSet.has(roomId)) {
      return;
    }
    updateQuickConferenceMessage(roomId, {
      userList: (params?.participantList || []).map(item => ({
        faceUrl: item.avatarUrl,
        nickName: item.userName,
        userId: item.userId,
      })),
    });
  },
});

TUICore.registerEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.OWNER_CHANGED, {
  onNotifyEvent: (_eventName: string, subKey: string, params: { roomId: string; newOwner: RoomUser }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.OWNER_CHANGED) {
      return;
    }
    const roomId = params?.roomId || '';
    if (!roomId || dismissedRoomIdSet.has(roomId)) {
      return;
    }
    updateQuickConferenceMessage(roomId, {
      owner: params?.newOwner?.userId || '',
    });
  },
});
