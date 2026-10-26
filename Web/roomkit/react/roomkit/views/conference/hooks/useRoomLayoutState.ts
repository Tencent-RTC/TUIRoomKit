import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  RoomType,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { RoomLayoutTemplate } from '../../../core/types';

/** Conference-view layout template; owned by conference/index and passed down. */
let layoutTemplate: RoomLayoutTemplate = RoomLayoutTemplate.GridLayout;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLayoutTemplate(): RoomLayoutTemplate {
  return layoutTemplate;
}

function writeLayoutTemplate(template: RoomLayoutTemplate): void {
  if (layoutTemplate === template) {
    return;
  }
  layoutTemplate = template;
  listeners.forEach(listener => listener());
}

/**
 * Mirror RoomLayoutView auto-switch rules for standard rooms:
 * - screen share present → sidebar speaker
 * - only one stream left → grid
 *
 * Conference/index calls this hook while RoomKit is still mounting the entry
 * overlay, so both rules wait for a roomId before acting on participant state.
 */
export function useRoomLayoutState() {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom?.roomId;
  const roomType = currentRoom?.roomType;
  const template = useSyncExternalStore(subscribe, getLayoutTemplate, getLayoutTemplate);
  const { participantList, participantWithScreen } = useRoomParticipantState();

  useEffect(() => {
    if (!roomId) {
      return;
    }
    if (roomType === RoomType.Standard && participantWithScreen) {
      writeLayoutTemplate(RoomLayoutTemplate.SidebarLayout);
    }
  }, [roomId, roomType, participantWithScreen]);

  const streamCount = participantList.length + (participantWithScreen ? 1 : 0);
  // Last stream count seen for the current room; the rule only reacts to changes.
  const streamCountRef = useRef<{ roomId: string; count: number } | null>(null);
  useEffect(() => {
    if (!roomId) {
      streamCountRef.current = null;
      return;
    }
    const previous = streamCountRef.current;
    streamCountRef.current = { roomId, count: streamCount };
    if (!previous || previous.roomId !== roomId || previous.count === streamCount) {
      return;
    }
    if (
      roomType === RoomType.Standard
      && streamCount === 1
      && getLayoutTemplate() !== RoomLayoutTemplate.GridLayout
    ) {
      writeLayoutTemplate(RoomLayoutTemplate.GridLayout);
    }
  }, [roomId, roomType, streamCount]);

  const setLayoutTemplate = useCallback((next: RoomLayoutTemplate) => {
    writeLayoutTemplate(next);
  }, []);

  return {
    layoutTemplate: template,
    setLayoutTemplate,
  };
}
