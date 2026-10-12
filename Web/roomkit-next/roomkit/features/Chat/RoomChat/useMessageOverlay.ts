import { inject, provide, reactive } from 'vue';
import type { InjectionKey } from 'vue';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import { MessageStatus } from 'tuikit-atomicx-vue3/chat';

export interface MessageOverlay {
  status?: MessageStatus;
  timestamp?: Date;
}

export interface MessageOverlayApi {
  overlays: Map<string, MessageOverlay>;
  patch(id: string, next: MessageOverlay): void;
  clear(id: string): void;
  peek(id: string): MessageOverlay | undefined;
  statusOf(message: MessageInfo): MessageStatus;
  timestampOf(message: MessageInfo): Date | undefined;
}

export const MESSAGE_OVERLAY_KEY: InjectionKey<MessageOverlayApi> = Symbol('room-chat-message-overlay');

export function provideMessageOverlay(): MessageOverlayApi {
  const overlays = reactive(new Map<string, MessageOverlay>());

  function peek(id: string) {
    return overlays.get(id);
  }

  function statusOf(message: MessageInfo) {
    const actual = message.status;
    if (actual === MessageStatus.Recalled || actual === MessageStatus.Deleted) {
      return actual;
    }
    return peek(message.id)?.status ?? actual;
  }

  function timestampOf(message: MessageInfo) {
    return peek(message.id)?.timestamp ?? message.timestamp;
  }

  const api: MessageOverlayApi = {
    overlays,
    patch(id, next) {
      overlays.set(id, { ...overlays.get(id), ...next });
    },
    clear(id) {
      overlays.delete(id);
    },
    peek,
    statusOf,
    timestampOf,
  };

  provide(MESSAGE_OVERLAY_KEY, api);
  return api;
}

export function useMessageOverlay() {
  return inject(MESSAGE_OVERLAY_KEY, null);
}
