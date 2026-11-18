import { useEffect, useMemo, useSyncExternalStore } from 'react';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import {
  DeviceStatus,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { i18n } from '../../base';
import { readShareSlot, registerBoard, useScreenShare } from '../ScreenShare/useScreenShare';

/** Omitted = the local host; set = follow that user's screen share. */
type SdkSessionOptions = { userId?: string };

type SdkStateEvent = {
  userId: string;
  type: string;
  payload?: { reason?: string; available?: boolean } | boolean;
};

type SdkStateHandler = (event: SdkStateEvent) => void;

type SdkPlayStateEvent = {
  userId: string;
  streamType: string;
  state: string;
};

type SdkPlayStateHandler = (event: SdkPlayStateEvent) => void;

/** `backgroundColor` is also the composite's fill, so remote viewers see it too. */
type WhiteboardOption = {
  /** Encoding of the published board stream; `bitrate` is in kbps. */
  profile?: { width: number; height: number; frameRate: number; bitrate: number };
  backgroundColor?: string;
  theme?: 'dark' | 'light';
};

type AnnotationOption = Pick<WhiteboardOption, 'theme'>;

/** trtc-sdk-v5 whiteboard tool update; every field is partial. */
type WhiteboardToolOptions = {
  name?: 'pen' | 'eraserObject';
  color?: string;
  lineWidth?: number;
  clearScope?: 'self' | 'all';
};

/** The plugin update payload; `operation` is an imperative undo / redo / clear. */
type WhiteboardPluginUpdate = {
  view?: HTMLElement;
  ui?: { toolBar: { enable: boolean; placement?: 'auto' | 'left' | 'right' | 'top' | 'bottom' } };
  tool?: WhiteboardToolOptions;
  /** The plugin follows the browser language unless told otherwise. */
  config?: { language: 'zh-CN' | 'en' };
  operation?: 'undo' | 'redo' | 'clear';
};

/**
 * trtc-sdk-v5 ships the whiteboard / annotation API untyped, and the instance only
 * exists as trtc-cloud's private `_trtc`. Everything that leans on it stays in this file.
 */
type SdkTrtc = {
  startWhiteboard(options: { view?: HTMLElement; option?: WhiteboardOption }): Promise<void>;
  stopScreenShare(): Promise<void>;
  startAnnotation(options?: SdkSessionOptions & { option?: AnnotationOption }): Promise<void>;
  stopAnnotation(options?: SdkSessionOptions): Promise<void>;
  updateWhiteboard(options: SdkSessionOptions & { option: { interactive: boolean } }): Promise<void>;
  updateAnnotation(options: SdkSessionOptions & { option: { interactive: boolean } }): Promise<void>;
  updatePlugin(plugin: 'Whiteboard', options: WhiteboardPluginUpdate): Promise<unknown>;
  on(event: string, handler: SdkStateHandler | SdkPlayStateHandler): void;
  off(event: string, handler: SdkStateHandler | SdkPlayStateHandler): void;
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
const DEFAULT_LINE_WIDTH = 8;
/** Applied when the caller passes no `profile`; a caller profile replaces it whole. */
const DEFAULT_BOARD_PROFILE = { width: 1920, height: 1080, frameRate: 15, bitrate: 5000 };

const SDK_STATE_EVENTS = ['annotation-state-changed', 'whiteboard-state-changed'];
const SDK_PLAY_STATE_EVENT = 'video-play-state-changed';

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
  /**
   * The user whose screen share is playing here. A guest annotation needs the stream playing in a
   * view, which lands after the sharer's row turns on, so a start on the row alone fails.
   */
  playingSharerId: string;
  canUndo: boolean;
  canRedo: boolean;
}

let state: WhiteboardSnapshot = {
  sessionKind: 'none',
  annotationStarting: false,
  opening: false,
  viewReady: false,
  holdsLocalShare: false,
  playingSharerId: '',
  canUndo: false,
  canRedo: false,
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
  sharerId: '',
};

let guestUserId = '';
let startPromise: Promise<void> | null = null;
let stopPromise: Promise<void> | null = null;
/** Whether the local user may draw. The SDK resets it to true on every session start. */
let interactive = true;

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
  patch({ sessionKind: 'none', viewReady: false, holdsLocalShare: false, canUndo: false, canRedo: false });
}

async function setBuiltinToolbar(enable: boolean): Promise<void> {
  await requireTrtc().updatePlugin('Whiteboard', enable
    ? { ui: { toolBar: { enable: true, placement: TOOLBAR_PLACEMENT } } }
    : { ui: { toolBar: { enable: false } }, tool: { name: 'pen' } });
}

/** Lets React commit a state change before the next SDK call. */
function nextRender(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function readBoardLanguage(): 'zh-CN' | 'en' {
  return i18n.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

// A session started earlier keeps its language; a later switch reaches the open toolbar here.
i18n.on('languageChanged', () => {
  if (state.sessionKind === 'none') {
    return;
  }
  requireTrtc().updatePlugin('Whiteboard', { config: { language: readBoardLanguage() } }).catch((error: unknown) => {
    console.warn('[WhiteboardState] update language failed:', error);
  });
});

/** The SDK breaks on a start issued while a stop is still running, so a start waits for it. */
async function runStart(kind: Exclude<SessionKind, 'none'>, start: (trtc: SdkTrtc) => Promise<void>, builtinToolbar = true): Promise<void> {
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
      await setBuiltinToolbar(builtinToolbar).catch((error: unknown) => {
        console.warn('[WhiteboardState] enable toolbar failed:', error);
      });
      await requireTrtc().updatePlugin('Whiteboard', {
        tool: { lineWidth: DEFAULT_LINE_WIDTH },
        config: { language: readBoardLanguage() },
      }).catch((error: unknown) => {
        console.warn('[WhiteboardState] set default line width and language failed:', error);
      });
      patch({ sessionKind: kind });
      if (!interactive) {
        await applyInteractive();
      }
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
  const reason = typeof event.payload === 'object' ? event.payload?.reason : undefined;
  const available = typeof event.payload === 'boolean' ? event.payload : event.payload?.available === true;
  if (isCurrentSession(event) && event.type === 'undo-state') patch({ canUndo: available });
  if (isCurrentSession(event) && event.type === 'redo-state') patch({ canRedo: available });
  // The SDK ends the session before the share stops playing, so a restart in between would bind
  // to the dying stream. Wait for the next share to play instead.
  if (event.type === 'unavailable' && reason === 'end' && event.userId === state.playingSharerId) {
    patch({ playingSharerId: '' });
  }
  // The share stopped or the followed sharer ended it: the SDK already tore the session down.
  if (event.type === 'unavailable' && reason === 'end' && isCurrentSession(event) && !stopPromise) {
    resetSession();
  }
};

const onPlayState: SdkPlayStateHandler = (event) => {
  if (event.streamType !== 'sub') {
    return;
  }
  if (event.state === 'PLAYING') {
    patch({ playingSharerId: event.userId });
  } else if (event.userId === state.playingSharerId) {
    patch({ playingSharerId: '' });
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
    boundTrtc?.off(SDK_PLAY_STATE_EVENT, onPlayState);
    trtc?.on(SDK_PLAY_STATE_EVENT, onPlayState);
    boundTrtc = trtc;
  }
  patch({ playingSharerId: '' });
  if (previousRoomId && !roomId) {
    interactive = true;
    patch({ opening: false });
    stopSession().catch((error: unknown) => {
      console.warn('[WhiteboardState] stop whiteboard on room exit failed:', error);
    });
  }
}

/** Ends the local board, including one still starting. */
async function stopWhiteboard(): Promise<void> {
  if (state.opening || state.sessionKind === 'board-host') {
    await stopSession();
  }
}

// The board takes the share slot from the click on. The slot ends it to make room for a
// screen share or on a share ban; a board still starting is ended once its start settles.
const runInSlot = registerBoard({
  isActive: () => state.opening || state.sessionKind === 'board-host',
  subscribe,
  stop: stopWhiteboard,
});

/**
 * Opens the local board under the share slot lock. Does nothing unless the slot is free and
 * the local user may take it, or while an annotation runs or any slot operation is in flight.
 * `opening` is not a guard here; it tells the view and the slot that the board is starting.
 */
async function startWhiteboard(option?: WhiteboardOption & { builtinToolbar?: boolean }): Promise<void> {
  const { holder, canShare } = readShareSlot();
  if (state.sessionKind !== 'none' || holder !== 'none' || !canShare) {
    return;
  }
  const { builtinToolbar = true, profile = DEFAULT_BOARD_PROFILE, ...sdkOption } = option ?? {};
  await runInSlot(async () => {
    // The tile has to exist before the start returns, so the view can show a loading cover.
    patch({ opening: true, viewReady: false, holdsLocalShare: true });
    try {
      await runStart('board-host', async (trtc) => {
        await callRoomStore('roomStore.requestScreenSharingToken');
        try {
          // The canvas is attached later through bindView, once the tile renders it.
          await trtc.startWhiteboard({ option: { ...sdkOption, profile } });
        } catch (error) {
          await callRoomStore('roomStore.releaseScreenSharingToken').catch(() => {});
          throw error;
        }
      }, builtinToolbar);
    } catch (error) {
      releaseLocalShare();
      throw error;
    } finally {
      patch({ opening: false });
    }
  });
}

/** Draws on the local screen share, or on the remote sharer's. */
async function startAnnotation(options?: AnnotationOption & { builtinToolbar?: boolean }): Promise<void> {
  const { builtinToolbar: toolbarFlag, ...annotationOption } = options ?? {};
  const builtinToolbar = toolbarFlag !== false;
  const option = Object.keys(annotationOption).length > 0 ? annotationOption : undefined;
  if (state.sessionKind !== 'none' || startPromise) {
    return;
  }
  const { holder } = readShareSlot();
  if (holder === 'local-screen') {
    await runStart('annotation-host', trtc => trtc.startAnnotation(option ? { option } : undefined), builtinToolbar);
    return;
  }
  const { sharerId } = room;
  if (holder !== 'remote' || !sharerId) {
    return;
  }
  await runStart('annotation-guest', async (trtc) => {
    await trtc.startAnnotation({ userId: sharerId, option });
    guestUserId = sharerId;
  }, builtinToolbar);
}

async function stopAnnotation(): Promise<void> {
  if (isAnnotationKind(state.sessionKind)) {
    await stopSession();
  }
}

/** A read-only session hides its toolbar too. A guest stays read-only without leaving the session. */
async function applyInteractive(): Promise<void> {
  const kind = state.sessionKind;
  if (kind === 'none') {
    return;
  }
  const option = { interactive };
  try {
    const trtc = requireTrtc();
    if (kind === 'board-host') {
      await trtc.updateWhiteboard({ option });
    } else {
      await trtc.updateAnnotation(kind === 'annotation-guest' ? { userId: guestUserId, option } : { option });
    }
  } catch (error) {
    console.warn('[WhiteboardState] update interactive failed:', error);
  }
}

/** Allows or blocks local drawing now and for later sessions, e.g. while the board sits in a small seat. */
async function setInteractive(enable: boolean): Promise<void> {
  interactive = enable;
  await applyInteractive();
}

/** Sends tool picks and undo / redo / clear to the current session; the custom classroom dock uses this. */
async function updatePlugin(options: Pick<WhiteboardPluginUpdate, 'tool' | 'operation'>): Promise<void> {
  await requireTrtc().updatePlugin('Whiteboard', options);
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
  const { participantWithScreen } = useRoomParticipantState();
  const { currentRoom } = useRoomState();
  // Keeps the share slot mirrored, and its share-ban rule running, for as long as the room shows.
  useScreenShare();
  const roomId = currentRoom?.roomId;

  room.sharerId = participantWithScreen?.userId ?? '';

  useEffect(() => {
    syncRoom(roomId);
  }, [roomId]);

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
    canUndo: snapshot.canUndo,
    canRedo: snapshot.canRedo,
    isWhiteboardOn: snapshot.sessionKind === 'board-host',
    isAnnotationOn,
    /** A board or an annotation is starting or running. */
    isSessionActive: snapshot.opening || snapshot.annotationStarting || snapshot.sessionKind !== 'none',
    playingSharerId: snapshot.playingSharerId,
    startWhiteboard,
    stopWhiteboard,
    startAnnotation,
    stopAnnotation,
    setInteractive,
    updatePlugin,
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
