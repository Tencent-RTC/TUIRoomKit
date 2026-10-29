import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  RoomParticipantEvent,
  RoomType,
  VideoStreamType,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import type { RoomUser } from 'tuikit-atomicx-react/room';
import { TUIToast } from '../../../base';
import { t } from '../../../i18n';
import { RoomLayoutTemplate } from '../../../core/types';
import { useShareParticipants, useWhiteboardState } from '../../../features';
import type { StreamInfo } from '../../../features';

interface LayoutSnapshot {
  layoutTemplate: RoomLayoutTemplate;
  /** The stream a double-click put on the speaker stage; resolved against live state on read. */
  selectedStream: { userId: string; streamType: VideoStreamType } | null;
  /** Whose camera holds the stage when nothing is picked; kept until that person leaves. */
  defaultStageUserId: string;
}

let state: LayoutSnapshot = {
  layoutTemplate: RoomLayoutTemplate.GridLayout,
  selectedStream: null,
  defaultStageUserId: '',
};
const listeners = new Set<() => void>();

function patch(next: Partial<LayoutSnapshot>): void {
  const changed = (Object.keys(next) as Array<keyof LayoutSnapshot>).some(key => next[key] !== state[key]);
  if (!changed) {
    return;
  }
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): LayoutSnapshot {
  return state;
}

function isSpeakerTemplate(template: RoomLayoutTemplate): boolean {
  return template === RoomLayoutTemplate.SidebarLayout || template === RoomLayoutTemplate.CinemaLayout;
}

/**
 * The conference stage: which template it uses, whether it may change, and what it puts on stage.
 *
 * Conference/index calls this hook while RoomKit is still mounting the entry overlay, so
 * every rule waits for a roomId before acting on participant state.
 */
export function useRoomLayoutState() {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom?.roomId;
  const roomType = currentRoom?.roomType;
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { participantListWithVideo, subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
  const { localParticipant, participantList, participantWithScreen } = useShareParticipants();
  const { isSessionActive } = useWhiteboardState();

  useEffect(() => {
    if (!roomId) {
      patch({ selectedStream: null, defaultStageUserId: '' });
    }
  }, [roomId]);

  /* Default stage: the first camera on, else self. Cameras turning on or off do not move
     it; only its owner leaving lets the next pick in. */
  useEffect(() => {
    if (!roomId) {
      return;
    }
    const holderId = state.defaultStageUserId;
    if (holderId && participantList.some(item => item.userId === holderId)) {
      return;
    }
    patch({ defaultStageUserId: (participantListWithVideo[0] ?? localParticipant)?.userId ?? '' });
  }, [roomId, participantList, participantListWithVideo, localParticipant]);

  /* Template: standard rooms switch to the sidebar when a share starts, and back to
     the grid once a single stream is left. */
  useEffect(() => {
    if (!roomId) {
      return;
    }
    if (roomType === RoomType.Standard && participantWithScreen) {
      patch({ layoutTemplate: RoomLayoutTemplate.SidebarLayout });
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
      && state.layoutTemplate !== RoomLayoutTemplate.GridLayout
    ) {
      patch({ layoutTemplate: RoomLayoutTemplate.GridLayout });
    }
  }, [roomId, roomType, streamCount]);

  /* Stage: a share taking or leaving the stage drops the pick. A new share outranks a
     picked camera, and a picked share is gone once it ends. */
  const sharerId = participantWithScreen?.userId;
  const sharerRef = useRef<{ roomId?: string; sharerId?: string } | null>(null);
  useEffect(() => {
    const previous = sharerRef.current;
    sharerRef.current = { roomId, sharerId };
    if (!roomId || !previous || previous.roomId !== roomId || previous.sharerId === sharerId) {
      return;
    }
    const selected = state.selectedStream;
    if (!selected) {
      return;
    }
    const stale = selected.streamType === VideoStreamType.Screen
      ? sharerId !== selected.userId
      : Boolean(sharerId);
    if (stale) {
      patch({ selectedStream: null });
    }
  }, [roomId, sharerId]);

  // Someone who left takes the pick with them, so coming back does not reclaim the stage.
  useEffect(() => {
    if (!roomId) {
      return undefined;
    }
    const handleParticipantLeft = ({ userInfo }: { userInfo: RoomUser }) => {
      if (userInfo.userId === state.selectedStream?.userId) {
        patch({ selectedStream: null });
      }
    };
    subscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
    return () => {
      unsubscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Lock: a board or an annotation only runs on the stage tile, and starting one already puts
     the share there. Holding the layout and the stage keeps it from landing in a thumbnail. */
  const layoutLocked = isSessionActive;
  const layoutLockedRef = useRef(layoutLocked);
  layoutLockedRef.current = layoutLocked;

  const setLayoutTemplate = useCallback((template: RoomLayoutTemplate) => {
    if (layoutLockedRef.current) {
      TUIToast.info(t('Layout.LockedByWhiteboard'));
      return;
    }
    patch({ layoutTemplate: template });
  }, []);

  /* Stage: the picked stream, then a share, then the default stage holder, then self. */
  const stageStream: StreamInfo | null = (() => {
    if (!roomId) {
      return null;
    }
    const selected = snapshot.selectedStream;
    if (selected?.streamType === VideoStreamType.Screen && participantWithScreen?.userId === selected.userId) {
      return { participant: participantWithScreen, streamType: VideoStreamType.Screen };
    }
    if (selected?.streamType === VideoStreamType.Camera) {
      // Someone who left is no longer in the list, so the pick falls through.
      const participant = participantList.find(item => item.userId === selected.userId);
      if (participant) {
        return { participant, streamType: VideoStreamType.Camera };
      }
    }
    if (participantWithScreen) {
      return { participant: participantWithScreen, streamType: VideoStreamType.Screen };
    }
    const participant = participantList.find(item => item.userId === snapshot.defaultStageUserId)
      ?? localParticipant;
    return participant ? { participant, streamType: VideoStreamType.Camera } : null;
  })();

  /** Only the speaker layouts have a stage to swap; the lock keeps it and says why. */
  const handleStreamDoubleClick = useCallback((streamInfo: StreamInfo) => {
    if (!isSpeakerTemplate(state.layoutTemplate)) {
      return;
    }
    if (layoutLockedRef.current) {
      TUIToast.info(t('Layout.StageLockedByWhiteboard'));
      return;
    }
    patch({ selectedStream: { userId: streamInfo.participant.userId, streamType: streamInfo.streamType } });
  }, []);

  return {
    layoutTemplate: snapshot.layoutTemplate,
    layoutLocked,
    stageStream,
    setLayoutTemplate,
    handleStreamDoubleClick,
  };
}
