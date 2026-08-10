import { ref } from 'vue';
import type { Ref } from 'vue';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine, useLoginState } from 'tuikit-atomicx-vue3/room';
import { BarrageType, BarrageEvent } from './types';
import type { Barrage, BarrageEventCallback } from './types';
import type { TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';

const { loginUserInfo } = useLoginState();
const roomEngine = useRoomEngine();

const DEFAULT_ROOM_KEY = 'default';
/** Max room stores kept in memory; oldest (LRU) is evicted when exceeded. */
const MAX_STORE_COUNT = 20;

type EventHandler = (...args: any[]) => void;

class SimpleEventEmitter {
  private listeners = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler) {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
  }

  off(event: string, handler: EventHandler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((handler) => {
      handler(...args);
    });
  }
}

type BarrageStore = {
  messageList: Ref<Barrage[]>;
  eventEmitter: SimpleEventEmitter;
};

// Insertion order is used as LRU: first key = oldest, last key = newest.
const storeMap = new Map<string, BarrageStore>();

function touchStore(roomKey: string, store: BarrageStore) {
  // Re-insert so this key becomes the most recently used.
  storeMap.delete(roomKey);
  storeMap.set(roomKey, store);
}

function evictOldestStores() {
  while (storeMap.size >= MAX_STORE_COUNT) {
    const oldestKey = storeMap.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    storeMap.delete(oldestKey);
  }
}

function getOrCreateStore(roomKey: string): BarrageStore {
  const existing = storeMap.get(roomKey);
  if (existing) {
    touchStore(roomKey, existing);
    return existing;
  }

  evictOldestStores();

  const store: BarrageStore = {
    messageList: ref<Barrage[]>([]),
    eventEmitter: new SimpleEventEmitter(),
  };
  storeMap.set(roomKey, store);
  return store;
}

function resolveRoomKey(roomId?: string | null) {
  return roomId || DEFAULT_ROOM_KEY;
}

const sendTextMessage = (options: {
  text: string;
  extensionInfo?: Record<string, string>;
}) => roomEngine.instance?.sendTextMessage({
  textContent: options.text,
  extensionInfo: options?.extensionInfo || {},
});

const sendCustomMessage = (options: {
  businessId: string;
  data: string;
}) => roomEngine.instance?.sendCustomMessage({
  businessId: options.businessId,
  data: options.data,
});

const onReceiveTextMessage = (message: {
  roomId: string;
  sender: TUIUserInfo;
  sequence: number;
  timestampInSecond: number;
  textContent: string;
  extensionInfo: Record<string, string> | null;
}) => {
  // Land in the room-scoped store so consumers remounted with :key="roomId"
  // can still read history that arrived before they mounted.
  const store = getOrCreateStore(resolveRoomKey(message.roomId));
  const sender = { ...message.sender };
  if (sender.userId === loginUserInfo.value?.userId) {
    sender.userName = sender.userName || loginUserInfo.value?.userName;
    sender.avatarUrl = sender.avatarUrl || loginUserInfo.value?.avatarUrl;
  }
  const barrage: Barrage = {
    roomId: message.roomId,
    sender,
    sequence: message.sequence,
    timestampInSecond: message.timestampInSecond,
    messageType: BarrageType.text,
    textContent: message.textContent,
    extensionInfo: message.extensionInfo,
  };
  store.messageList.value.push(barrage);
  store.eventEmitter.emit(BarrageEvent.onBarrageReceived, barrage);
};

const onReceiveCustomMessage = (message: {
  roomId: string;
  sender: TUIUserInfo;
  sequence: number;
  timestampInSecond: number;
  businessId: string;
  data: string;
}) => {
  const store = getOrCreateStore(resolveRoomKey(message.roomId));
  const sender = { ...message.sender };
  if (sender.userId === loginUserInfo.value?.userId) {
    sender.userName = sender.userName || loginUserInfo.value?.userName;
    sender.avatarUrl = sender.avatarUrl || loginUserInfo.value?.avatarUrl;
  }
  const barrage: Barrage = {
    roomId: message.roomId,
    sender,
    sequence: message.sequence,
    timestampInSecond: message.timestampInSecond,
    messageType: BarrageType.custom,
    businessId: message.businessId,
    data: message.data,
  };

  store.eventEmitter.emit(BarrageEvent.onCustomMessageReceived, barrage);
};

const events = [
  { event: TUIRoomEvents.onReceiveTextMessage, handler: onReceiveTextMessage },
  { event: TUIRoomEvents.onReceiveCustomMessage, handler: onReceiveCustomMessage },
];

const bindEvent = () => {
  events.forEach(({ event, handler }) => {
    roomEngine.instance?.on(event, handler);
  });
};

TUIRoomEngine.once('ready', () => {
  bindEvent();
});

/**
 * roomId is a snapshot for this component instance.
 * Remount with `:key="roomId"` (and prefer `v-if="roomId"`) when the room changes.
 */
export function useBarrageState(roomId?: string) {
  const roomKey = resolveRoomKey(roomId);
  const store = getOrCreateStore(roomKey);

  const appendLocalTip = (message: Barrage) => {
    store.messageList.value.push(message);
  };

  const subscribeEvent = <T extends BarrageEvent>(
    event: T,
    handler: BarrageEventCallback<T>,
  ) => {
    store.eventEmitter.on(event, handler);
  };

  const unsubscribeEvent = <T extends BarrageEvent>(
    event: T,
    handler: BarrageEventCallback<T>,
  ) => {
    store.eventEmitter.off(event, handler);
  };

  return {
    messageList: store.messageList,
    sendTextMessage,
    sendCustomMessage,
    appendLocalTip,
    subscribeEvent,
    unsubscribeEvent,
  };
}
