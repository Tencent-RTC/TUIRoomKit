import { createContext, useContext, useMemo, useState } from 'react';
import type { MessageInfo } from 'tuikit-atomicx-react/chat';
import { MessageStatus } from 'tuikit-atomicx-react/chat';

export interface MessageOverlay {
  status?: MessageStatus;
  timestamp?: Date;
}

export interface MessageOverlayApi {
  overlays: Map<string, MessageOverlay>;
  patch(id: string, next: MessageOverlay): void;
  clear(id: string): void;
  statusOf(message: MessageInfo): MessageStatus;
  timestampOf(message: MessageInfo): Date | undefined;
}

export const MESSAGE_OVERLAY_KEY = createContext<MessageOverlayApi | null>(null);

/**
 * Owns the overlay map; render the result through `<MESSAGE_OVERLAY_KEY.Provider value={api}>`.
 * The api identity changes whenever the map changes so consumers re-render.
 */
export function provideMessageOverlay(): MessageOverlayApi {
  const [overlays, setOverlays] = useState(() => new Map<string, MessageOverlay>());

  return useMemo<MessageOverlayApi>(() => {
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

    return {
      overlays,
      patch(id, next) {
        setOverlays((prev) => {
          const map = new Map(prev);
          map.set(id, { ...prev.get(id), ...next });
          return map;
        });
      },
      clear(id) {
        setOverlays((prev) => {
          if (!prev.has(id)) return prev;
          const map = new Map(prev);
          map.delete(id);
          return map;
        });
      },
      statusOf,
      timestampOf,
    };
  }, [overlays]);
}

export function useMessageOverlay() {
  return useContext(MESSAGE_OVERLAY_KEY);
}
