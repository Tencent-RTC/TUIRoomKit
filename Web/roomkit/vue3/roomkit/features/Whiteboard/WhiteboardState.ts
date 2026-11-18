import { computed, effectScope, nextTick, readonly, ref, watch } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import {
  DeviceStatus,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { useI18n } from '../../base';
import { useScreenShare } from '../ScreenShare/useScreenShare';

/** Omitted = the local host; set = follow that user's screen share. */
type SdkSessionOptions = { userId?: string };

type SdkStateEvent = {
  userId: string;
  type: string;
  /** A boolean or `{ available }` for undo / redo; `{ reason }` for session lifecycle. */
  payload?: { reason?: string; available?: boolean } | boolean;
};

/** The plugin reports undo / redo availability as a boolean or `{ available }`. */
function readHistoryAvailable(payload: SdkStateEvent['payload']): boolean {
  if (typeof payload === 'boolean') {
    return payload;
  }
  const available = payload?.available;
  return typeof available === 'boolean' ? available : false;
}

function readEventReason(payload: SdkStateEvent['payload']): string | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }
  return payload.reason;
}

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

function createWhiteboard() {
  const { screenStatus } = useDeviceState();
  const { localParticipant, participantWithScreen } = useRoomParticipantState();
  const { currentRoom } = useRoomState();
  const { holder, canShare, registerBoard } = useScreenShare();
  const { language } = useI18n();
  const boardLanguage = computed(() => (language.value.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'));

  const sessionKind = ref<SessionKind>('none');
  /** An annotation start is in flight; held until the session is on, so the two read as one. */
  const annotationStarting = ref(false);
  /** True from the click until the local board start settles. The share tile is already up. */
  const opening = ref(false);
  /** False until the plugin reports a step that can be undone or redone. A new stroke clears redo. */
  const canUndo = ref(false);
  const canRedo = ref(false);
  /** The first canvas bind of this board has finished, so a layout remount does not replay the cover. */
  const viewReady = ref(false);
  /**
   * The user whose screen share is playing here. A guest annotation needs the stream playing in a
   * view, which lands after the sharer's row turns on, so a start on the row alone fails.
   */
  const playingSharerId = ref('');
  let guestUserId = '';
  let startPromise: Promise<void> | null = null;
  let stopPromise: Promise<void> | null = null;
  /** The local board is shown through a fake local share this kit owns until the board ends. */
  let holdsLocalShare = false;
  /** Whether the local user may draw. The SDK resets it to true on every session start. */
  let interactive = true;

  const isWhiteboardOn = computed(() => sessionKind.value === 'board-host');
  const isAnnotationOn = computed(() => sessionKind.value === 'annotation-host'
    || sessionKind.value === 'annotation-guest');
  /** A board or an annotation is starting or running. */
  const isSessionActive = computed(() => opening.value || annotationStarting.value || sessionKind.value !== 'none');

  function setLocalShare(status: DeviceStatus): void {
    if (localParticipant.value) {
      localParticipant.value.screenShareStatus = status;
    }
  }

  function releaseLocalShare(): void {
    if (!holdsLocalShare) {
      return;
    }
    holdsLocalShare = false;
    if (screenStatus.value !== DeviceStatus.On) {
      setLocalShare(DeviceStatus.Off);
    }
  }

  // getUserList reports the local board as not sharing and replaces the row.
  // Put the fake status back in the same tick so the share tile never unmounts.
  watch(
    () => localParticipant.value?.screenShareStatus,
    (status) => {
      if (holdsLocalShare && status !== DeviceStatus.On && screenStatus.value !== DeviceStatus.On) {
        setLocalShare(DeviceStatus.On);
      }
    },
    { flush: 'sync' },
  );

  function resetSession(): void {
    sessionKind.value = 'none';
    guestUserId = '';
    viewReady.value = false;
    canUndo.value = false;
    canRedo.value = false;
    releaseLocalShare();
  }

  async function setBuiltinToolbar(enable: boolean): Promise<void> {
    await requireTrtc().updatePlugin('Whiteboard', enable
      ? { ui: { toolBar: { enable: true, placement: TOOLBAR_PLACEMENT } } }
      : { ui: { toolBar: { enable: false } }, tool: { name: 'pen' } });
  }

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
          annotationStarting.value = true;
          await nextTick();
        }
        await start(requireTrtc());
        await setBuiltinToolbar(builtinToolbar).catch((error: unknown) => {
          console.warn('[WhiteboardState] enable toolbar failed:', error);
        });
        await requireTrtc().updatePlugin('Whiteboard', {
          tool: { lineWidth: DEFAULT_LINE_WIDTH },
          config: { language: boardLanguage.value },
        }).catch((error: unknown) => {
          console.warn('[WhiteboardState] set default line width and language failed:', error);
        });
        sessionKind.value = kind;
        if (!interactive) {
          await applyInteractive();
        }
      } finally {
        annotationStarting.value = false;
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

  function startHostAnnotation(option?: AnnotationOption, builtinToolbar = true): Promise<void> {
    return runStart('annotation-host', trtc => trtc.startAnnotation(option ? { option } : undefined), builtinToolbar);
  }

  function isCurrentSession(event: SdkStateEvent): boolean {
    if (sessionKind.value === 'none') {
      return false;
    }
    return sessionKind.value === 'annotation-guest' ? event.userId === guestUserId : event.userId === '';
  }

  const onSdkState: SdkStateHandler = (event) => {
    if (isCurrentSession(event) && event.type === 'undo-state') {
      canUndo.value = readHistoryAvailable(event.payload);
    } else if (isCurrentSession(event) && event.type === 'redo-state') {
      canRedo.value = readHistoryAvailable(event.payload);
    }
    const reason = readEventReason(event.payload);
    // The SDK ends the session before the share stops playing, so a restart in between would bind
    // to the dying stream. Wait for the next share to play instead.
    if (event.type === 'unavailable' && reason === 'end' && event.userId === playingSharerId.value) {
      playingSharerId.value = '';
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
      playingSharerId.value = event.userId;
    } else if (event.userId === playingSharerId.value) {
      playingSharerId.value = '';
    }
  };

  // An annotation dies with the share it draws on, and stopScreenShare does not always relay
  // the SDK's end event, so the session follows the share itself.
  watch(
    () => (sessionKind.value === 'annotation-guest'
      ? participantWithScreen.value?.userId === guestUserId
      : screenStatus.value === DeviceStatus.On),
    (sharing) => {
      if (!sharing && isAnnotationOn.value && !startPromise && !stopPromise) {
        resetSession();
      }
    },
  );

  // A session started earlier keeps its language; a later switch reaches the open toolbar here.
  watch(boardLanguage, (next) => {
    if (sessionKind.value === 'none') {
      return;
    }
    requireTrtc().updatePlugin('Whiteboard', { config: { language: next } }).catch((error: unknown) => {
      console.warn('[WhiteboardState] update language failed:', error);
    });
  });

  async function stopSession(): Promise<void> {
    if (stopPromise) {
      return stopPromise;
    }
    if (startPromise) {
      await startPromise.catch(() => {});
    }
    const kind = sessionKind.value;
    if (kind === 'none') {
      return;
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
  watch(
    () => currentRoom.value?.roomId,
    (roomId, previousRoomId) => {
      const trtc = roomId ? findTrtc() : null;
      if (trtc !== boundTrtc) {
        SDK_STATE_EVENTS.forEach(event => boundTrtc?.off(event, onSdkState));
        SDK_STATE_EVENTS.forEach(event => trtc?.on(event, onSdkState));
        boundTrtc?.off(SDK_PLAY_STATE_EVENT, onPlayState);
        trtc?.on(SDK_PLAY_STATE_EVENT, onPlayState);
        boundTrtc = trtc;
      }
      if (roomId !== previousRoomId) {
        playingSharerId.value = '';
      }
      if (previousRoomId && !roomId) {
        opening.value = false;
        interactive = true;
        stopSession().catch((error: unknown) => {
          console.warn('[WhiteboardState] stop whiteboard on room exit failed:', error);
        });
      }
    },
    { immediate: true },
  );

  /** Ends the local board, including one still starting. */
  async function stopWhiteboard(): Promise<void> {
    if (opening.value || isWhiteboardOn.value) {
      await stopSession();
    }
  }

  // The board takes the share slot from the click on. The slot ends it to make room for a
  // screen share or on a share ban; a board still starting is ended once its start settles.
  const runInSlot = registerBoard({
    active: computed(() => opening.value || isWhiteboardOn.value),
    stop: stopWhiteboard,
  });

  /**
   * Opens the local board under the share slot lock. Does nothing unless the slot is free and
   * the local user may take it, or while an annotation runs or any slot operation is in flight.
   * `opening` is not a guard here; it tells the view and the slot that the board is starting.
   */
  async function startWhiteboard(option?: WhiteboardOption & { builtinToolbar?: boolean }): Promise<void> {
    if (sessionKind.value !== 'none' || holder.value !== 'none' || !canShare.value) {
      return;
    }
    const { builtinToolbar = true, profile = DEFAULT_BOARD_PROFILE, ...sdkOption } = option ?? {};
    await runInSlot(async () => {
      opening.value = true;
      viewReady.value = false;
      // The tile has to exist before the start returns, so the view can show a loading cover.
      holdsLocalShare = true;
      setLocalShare(DeviceStatus.On);
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
        opening.value = false;
      }
    });
  }

  /** Draws on the local screen share, or on the remote sharer's. */
  async function startAnnotation(options?: AnnotationOption & { builtinToolbar?: boolean }): Promise<void> {
    const { builtinToolbar: toolbarFlag, ...annotationOption } = options ?? {};
    const builtinToolbar = toolbarFlag !== false;
    const option = Object.keys(annotationOption).length > 0 ? annotationOption : undefined;
    if (sessionKind.value !== 'none' || startPromise) {
      return;
    }
    if (holder.value === 'local-screen') {
      await startHostAnnotation(option, builtinToolbar);
      return;
    }
    const sharerId = participantWithScreen.value?.userId;
    if (holder.value !== 'remote' || !sharerId) {
      return;
    }
    await runStart('annotation-guest', async (trtc) => {
      await trtc.startAnnotation({ userId: sharerId, option });
      guestUserId = sharerId;
    }, builtinToolbar);
  }

  async function stopAnnotation(): Promise<void> {
    if (isAnnotationOn.value) {
      await stopSession();
    }
  }

  /** A read-only session hides its toolbar too. A guest stays read-only without leaving the session. */
  async function applyInteractive(): Promise<void> {
    const kind = sessionKind.value;
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
      if (isWhiteboardOn.value) {
        viewReady.value = true;
      }
    }
  }

  return {
    state: {
      isWhiteboardOn,
      isAnnotationOn,
      isSessionActive,
      canUndo: readonly(canUndo),
      canRedo: readonly(canRedo),
      playingSharerId: readonly(playingSharerId),
      startWhiteboard,
      stopWhiteboard,
      startAnnotation,
      stopAnnotation,
      setInteractive,
      updatePlugin,
    },
    binding: {
      isOpening: readonly(opening),
      isLoading: computed(() => opening.value || !viewReady.value),
      bindView,
    },
  };
}

let whiteboard: ReturnType<typeof createWhiteboard> | null = null;

/** Detached so the store subscriptions outlive whichever component first asked for the state. */
function getWhiteboard(): ReturnType<typeof createWhiteboard> {
  whiteboard ??= effectScope(true).run(createWhiteboard)!;
  return whiteboard;
}

export function useWhiteboardState() {
  return getWhiteboard().state;
}

/** Feature-internal: only WhiteboardView binds the canvas. */
export function useWhiteboardViewBinding() {
  return getWhiteboard().binding;
}
