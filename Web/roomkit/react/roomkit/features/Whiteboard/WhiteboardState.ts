import { useEffect, useMemo, useSyncExternalStore } from 'react';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import {
  DeviceStatus,
  RoomParticipantRole,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

/** Omitted = the local host; set = follow that user's screen share. */
type SdkSessionOptions = { userId?: string };

type SdkStateEvent = {
  userId: string;
  type: string;
  payload?: { reason?: string };
};

type SdkStateHandler = (event: SdkStateEvent) => void;

/**
 * trtc-sdk-v5 ships the whiteboard / annotation API untyped, and the instance only
 * exists as trtc-cloud's private `_trtc`. Everything that leans on it stays in this file.
 */
type SdkTrtc = {
  startWhiteboard(options: { view?: HTMLElement }): Promise<void>;
  stopScreenShare(): Promise<void>;
  startAnnotation(options?: SdkSessionOptions): Promise<void>;
  stopAnnotation(options?: SdkSessionOptions): Promise<void>;
  updatePlugin(
    plugin: 'Whiteboard',
    options:
      | { view?: HTMLElement }
      | { ui: { toolBar: { enable: boolean; placement?: 'auto' | 'left' | 'right' | 'top' | 'bottom' } } },
  ): Promise<unknown>;
  on(event: string, handler: SdkStateHandler): void;
  off(event: string, handler: SdkStateHandler): void;
};

type RoomEngineLike = {
  getTRTCCloud(): { _trtc?: SdkTrtc } | null | undefined;
  getRoomStoreManager?(): { call(command: string): Promise<unknown> } | null | undefined;
};

/**
 * board-host: a standalone board the local user publishes as its own share.
 * annotation-host: drawing on the local screen share.
 * annotation-guest: drawing on a remote user's screen share.
 */
type SessionKind = 'none' | 'board-host' | 'annotation-host' | 'annotation-guest';

/* Left on PC: the stage tile's top-right corner holds the annotation toggle. */
const TOOLBAR_PLACEMENT = 'auto';

const SDK_STATE_EVENTS = ['annotation-state-changed', 'whiteboard-state-changed'];

function getEngine(): RoomEngineLike | null {
  return (TUIRoomEngine.getInstance() as unknown as RoomEngineLike | null) ?? null;
}

/** trtc-cloud creates `_trtc` in its constructor and drops it on destroy, so read it per call. */
function findTrtc(): SdkTrtc | null {
  const trtc = getEngine()?.getTRTCCloud()?._trtc;
  return trtc?.startWhiteboard ? trtc : null;
}

function requireTrtc(): SdkTrtc {
  const trtc = findTrtc();
  if (!trtc) {
    throw new Error('[WhiteboardState] TRTC instance with the Whiteboard plugin is unavailable');
  }
  return trtc;
}

/** A board publishes behind the engine's back; holding the token keeps anyone else from sharing. */
async function callRoomStore(command: string): Promise<void> {
  await getEngine()?.getRoomStoreManager?.()?.call(command);
}

interface WhiteboardSnapshot {
  sessionKind: SessionKind;
  /** An annotation start is in flight; held until the session is on, so the two read as one. */
  annotationStarting: boolean;
  /** True from the click until the local board start settles. The share tile is already up. */
  opening: boolean;
  /** The first canvas bind of this board has finished, so a layout remount does not replay the cover. */
  viewReady: boolean;
  /**
   * The local board is shown as a local share this kit owns until the board ends.
   * atomicx-react state is read-only, so readers overlay it through `useShareParticipants`.
   */
  holdsLocalShare: boolean;
}

let state: WhiteboardSnapshot = {
  sessionKind: 'none',
  annotationStarting: false,
  opening: false,
  viewReady: false,
  holdsLocalShare: false,
};
const listeners = new Set<() => void>();

function patch(next: Partial<WhiteboardSnapshot>): void {
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): WhiteboardSnapshot {
  return state;
}

/** Room state mirrored from the latest render, for actions that run after an await. */
const room = {
  screenStatus: DeviceStatus.Off as DeviceStatus,
  sharerId: '',
  localUserId: '',
  isGeneralUser: false,
};

/** Shared across `useWhiteboardState` readers so a share ban is handled once, on its rising edge. */
let lastShareBanned: boolean | undefined;

let guestUserId = '';
let startPromise: Promise<void> | null = null;
let stopPromise: Promise<void> | null = null;

function isAnnotationKind(kind: SessionKind): boolean {
  return kind === 'annotation-host' || kind === 'annotation-guest';
}

function releaseLocalShare(): void {
  if (state.holdsLocalShare) {
    patch({ holdsLocalShare: false });
  }
}

function resetSession(): void {
  guestUserId = '';
  patch({ sessionKind: 'none', viewReady: false, holdsLocalShare: false });
}

async function setBuiltinToolbar(enable: boolean): Promise<void> {
  await requireTrtc().updatePlugin('Whiteboard', { ui: { toolBar: { enable, placement: TOOLBAR_PLACEMENT } } });
}

/** Lets React commit a state change before the next SDK call. */
function nextRender(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** The SDK breaks on a start issued while a stop is still running, so a start waits for it. */
async function runStart(kind: Exclude<SessionKind, 'none'>, start: (trtc: SdkTrtc) => Promise<void>): Promise<void> {
  if (stopPromise) {
    await stopPromise.catch(() => {});
  }
  const run = (async () => {
    const annotating = kind !== 'board-host';
    try {
      if (annotating) {
        // The SDK binds the annotation to a view the share already plays in. Any second view
        // (the mini window) has to unmount first, or the annotation follows it there and
        // every later screen op hangs once that window closes.
        patch({ annotationStarting: true });
        await nextRender();
      }
      await start(requireTrtc());
      await setBuiltinToolbar(true).catch((error: unknown) => {
        console.warn('[WhiteboardState] enable toolbar failed:', error);
      });
      patch({ sessionKind: kind });
    } finally {
      if (state.annotationStarting) {
        patch({ annotationStarting: false });
      }
    }
  })();
  startPromise = run;
  try {
    await run;
  } finally {
    if (startPromise === run) {
      startPromise = null;
    }
  }
}

function isCurrentSession(event: SdkStateEvent): boolean {
  if (state.sessionKind === 'none') {
    return false;
  }
  return state.sessionKind === 'annotation-guest' ? event.userId === guestUserId : event.userId === '';
}

const onSdkState: SdkStateHandler = (event) => {
  const reason = event.payload?.reason;
  // The share stopped or the followed sharer ended it: the SDK already tore the session down.
  if (event.type === 'unavailable' && reason === 'end' && isCurrentSession(event) && !stopPromise) {
    resetSession();
  }
};

async function stopSession(): Promise<void> {
  if (stopPromise) {
    return stopPromise;
  }
  if (startPromise) {
    await startPromise.catch(() => {});
  }
  const kind = state.sessionKind;
  if (kind === 'none') {
    return undefined;
  }
  const userId = guestUserId;
  stopPromise = (async () => {
    try {
      const trtc = requireTrtc();
      if (kind === 'board-host') {
        // Host stopWhiteboard() re-enters the SDK's screen op queue and throws; stopScreenShare()
        // runs the same teardown (stop board, unpublish the sub stream) without the reentry.
        try {
          await trtc.stopScreenShare();
        } finally {
          await callRoomStore('roomStore.releaseScreenSharingToken');
        }
      } else {
        // A stopped share took the annotation with it, so a failed stop leaves nothing behind.
        await trtc.stopAnnotation(kind === 'annotation-guest' ? { userId } : undefined).catch((error: unknown) => {
          console.warn('[WhiteboardState] stop annotation failed:', error);
        });
      }
    } finally {
      resetSession();
      stopPromise = null;
    }
  })();
  return stopPromise;
}

// The TRTC instance exists once a room is entered, which is always before a screen share.
// Leaving ends whatever session is left, since this state outlives the room.
let boundTrtc: SdkTrtc | null = null;
let watchedRoomId: string | undefined;
/** Mounted `useWhiteboardState` readers; the room view keeps at least one while in a room. */
let mountedCount = 0;

function syncRoom(roomId: string | undefined): void {
  if (roomId === watchedRoomId) {
    return;
  }
  const previousRoomId = watchedRoomId;
  watchedRoomId = roomId;
  const trtc = roomId ? findTrtc() : null;
  if (trtc !== boundTrtc) {
    SDK_STATE_EVENTS.forEach(event => boundTrtc?.off(event, onSdkState));
    SDK_STATE_EVENTS.forEach(event => trtc?.on(event, onSdkState));
    boundTrtc = trtc;
  }
  if (previousRoomId && !roomId) {
    lastShareBanned = undefined;
    patch({ opening: false });
    stopSession().catch((error: unknown) => {
      console.warn('[WhiteboardState] stop whiteboard on room exit failed:', error);
    });
  }
}

/** Opens the local board. Does nothing while any share or session is up, or a start is in flight. */
async function startWhiteboard(): Promise<void> {
  const { sharerId, localUserId, screenStatus } = room;
  const othersSharing = !!sharerId && sharerId !== localUserId;
  if (state.opening || state.sessionKind !== 'none' || screenStatus === DeviceStatus.On || othersSharing) {
    return;
  }
  // The tile has to exist before the start returns, so the view can show a loading cover.
  patch({ opening: true, viewReady: false, holdsLocalShare: true });
  try {
    await runStart('board-host', async (trtc) => {
      await callRoomStore('roomStore.requestScreenSharingToken');
      try {
        // The canvas is attached later through bindView, once the tile renders it.
        await trtc.startWhiteboard({});
      } catch (error) {
        await callRoomStore('roomStore.releaseScreenSharingToken').catch(() => {});
        throw error;
      }
    });
  } catch (error) {
    releaseLocalShare();
    throw error;
  } finally {
    patch({ opening: false });
  }
}

async function stopWhiteboard(): Promise<void> {
  if (state.sessionKind === 'board-host') {
    await stopSession();
  }
}

/** Draws on the local screen share, or on the remote sharer's. */
async function startAnnotation(): Promise<void> {
  if (state.sessionKind !== 'none' || startPromise) {
    return;
  }
  if (room.screenStatus === DeviceStatus.On) {
    await runStart('annotation-host', trtc => trtc.startAnnotation());
    return;
  }
  const { sharerId } = room;
  if (!sharerId || sharerId === room.localUserId) {
    return;
  }
  await runStart('annotation-guest', async (trtc) => {
    await trtc.startAnnotation({ userId: sharerId });
    guestUserId = sharerId;
  });
}

async function stopAnnotation(): Promise<void> {
  if (isAnnotationKind(state.sessionKind)) {
    await stopSession();
  }
}

/** Binds the canvas element. The cover lifts once it settles, even on failure, so it never sticks. */
async function bindView(view: HTMLElement): Promise<void> {
  try {
    await requireTrtc().updatePlugin('Whiteboard', { view });
  } finally {
    if (state.sessionKind === 'board-host') {
      patch({ viewReady: true });
    }
  }
}

function useWhiteboardSnapshot(): WhiteboardSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useWhiteboardState() {
  const snapshot = useWhiteboardSnapshot();
  const { screenStatus } = useDeviceState();
  const { localParticipant, participantWithScreen } = useRoomParticipantState();
  const { currentRoom } = useRoomState();
  const roomId = currentRoom?.roomId;

  room.screenStatus = screenStatus;
  room.sharerId = participantWithScreen?.userId ?? '';
  room.localUserId = localParticipant?.userId ?? '';
  room.isGeneralUser = localParticipant?.role === RoomParticipantRole.GeneralUser;
  const shareBanned = Boolean(currentRoom?.isAllScreenShareDisabled);

  useEffect(() => {
    syncRoom(roomId);
  }, [roomId]);

  // A board is a share the engine cannot see, so the share ban has to end it here.
  useEffect(() => {
    const previousBanned = lastShareBanned;
    lastShareBanned = shareBanned;
    if (
      shareBanned && !previousBanned
      && (state.sessionKind === 'board-host' || state.opening)
      && room.isGeneralUser
    ) {
      stopSession().catch((error: unknown) => {
        console.warn('[WhiteboardState] stop whiteboard on share ban failed:', error);
      });
    }
  }, [shareBanned]);

  useEffect(() => {
    mountedCount += 1;
    return () => {
      mountedCount -= 1;
      // A remount mounts again in the same commit; only a real teardown leaves no reader.
      setTimeout(() => {
        if (mountedCount === 0) {
          syncRoom(undefined);
        }
      }, 0);
    };
  }, []);

  const isAnnotationOn = isAnnotationKind(snapshot.sessionKind);

  // An annotation dies with the share it draws on, and stopScreenShare does not always relay
  // the SDK's end event, so the session follows the share itself.
  const sharing = snapshot.sessionKind === 'annotation-guest'
    ? participantWithScreen?.userId === guestUserId
    : screenStatus === DeviceStatus.On;
  useEffect(() => {
    if (!sharing && isAnnotationKind(state.sessionKind) && !startPromise && !stopPromise) {
      resetSession();
    }
  }, [sharing]);

  return {
    isWhiteboardOn: snapshot.sessionKind === 'board-host',
    isAnnotationOn,
    /** A board or an annotation is starting or running. */
    isSessionActive: snapshot.opening || snapshot.annotationStarting || snapshot.sessionKind !== 'none',
    startWhiteboard,
    stopWhiteboard,
    startAnnotation,
    stopAnnotation,
  };
}

/** Feature-internal: only WhiteboardView binds the canvas. */
export function useWhiteboardViewBinding() {
  const snapshot = useWhiteboardSnapshot();
  return {
    isOpening: snapshot.opening,
    isLoading: snapshot.opening || !snapshot.viewReady,
    bindView,
  };
}

/**
 * Participant state with the local board shown as the local share, for every surface that
 * decides on share tiles. A real local screen share always wins over the board.
 */
export function useShareParticipants() {
  const { holdsLocalShare } = useWhiteboardSnapshot();
  const { screenStatus } = useDeviceState();
  const participantState = useRoomParticipantState();
  const { localParticipant, participantList, participantWithScreen } = participantState;
  const faking = holdsLocalShare
    && screenStatus !== DeviceStatus.On
    && !!localParticipant
    && localParticipant.screenShareStatus !== DeviceStatus.On;

  return useMemo(() => {
    if (!faking || !localParticipant) {
      return { localParticipant, participantList, participantWithScreen };
    }
    const sharingLocal: RoomParticipant = { ...localParticipant, screenShareStatus: DeviceStatus.On };
    return {
      localParticipant: sharingLocal,
      participantList: participantList.map(item => (item.userId === sharingLocal.userId ? sharingLocal : item)),
      participantWithScreen: participantWithScreen ?? sharingLocal,
    };
  }, [faking, localParticipant, participantList, participantWithScreen]);
}
