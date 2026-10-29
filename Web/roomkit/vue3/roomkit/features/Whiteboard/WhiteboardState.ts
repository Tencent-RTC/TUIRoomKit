import { computed, effectScope, nextTick, readonly, ref, watch } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import {
  DeviceStatus,
  RoomParticipantRole,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';

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

function createWhiteboard() {
  const { screenStatus } = useDeviceState();
  const { localParticipant, participantWithScreen } = useRoomParticipantState();
  const { currentRoom } = useRoomState();

  const sessionKind = ref<SessionKind>('none');
  /** An annotation start is in flight; held until the session is on, so the two read as one. */
  const annotationStarting = ref(false);
  /** True from the click until the local board start settles. The share tile is already up. */
  const opening = ref(false);
  /** The first canvas bind of this board has finished, so a layout remount does not replay the cover. */
  const viewReady = ref(false);
  let guestUserId = '';
  let startPromise: Promise<void> | null = null;
  let stopPromise: Promise<void> | null = null;
  /** The local board is shown through a fake local share this kit owns until the board ends. */
  let holdsLocalShare = false;

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
    releaseLocalShare();
  }

  async function setBuiltinToolbar(enable: boolean): Promise<void> {
    await requireTrtc().updatePlugin('Whiteboard', { ui: { toolBar: { enable, placement: TOOLBAR_PLACEMENT } } });
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
          annotationStarting.value = true;
          await nextTick();
        }
        await start(requireTrtc());
        await setBuiltinToolbar(true).catch((error: unknown) => {
          console.warn('[WhiteboardState] enable toolbar failed:', error);
        });
        sessionKind.value = kind;
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

  function startHostAnnotation(): Promise<void> {
    return runStart('annotation-host', trtc => trtc.startAnnotation());
  }

  function isCurrentSession(event: SdkStateEvent): boolean {
    if (sessionKind.value === 'none') {
      return false;
    }
    return sessionKind.value === 'annotation-guest' ? event.userId === guestUserId : event.userId === '';
  }

  const onSdkState: SdkStateHandler = (event) => {
    const reason = event.payload?.reason;
    // The share stopped or the followed sharer ended it: the SDK already tore the session down.
    if (event.type === 'unavailable' && reason === 'end' && isCurrentSession(event) && !stopPromise) {
      resetSession();
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
        boundTrtc = trtc;
      }
      if (previousRoomId && !roomId) {
        opening.value = false;
        stopSession().catch((error: unknown) => {
          console.warn('[WhiteboardState] stop whiteboard on room exit failed:', error);
        });
      }
    },
    { immediate: true },
  );

  // A board is a share the engine cannot see, so the share ban has to end it here.
  watch(
    () => currentRoom.value?.isAllScreenShareDisabled,
    (disabled, previousDisabled) => {
      if (
        disabled && !previousDisabled
        && (isWhiteboardOn.value || opening.value)
        && localParticipant.value?.role === RoomParticipantRole.GeneralUser
      ) {
        stopSession().catch((error: unknown) => {
          console.warn('[WhiteboardState] stop whiteboard on share ban failed:', error);
        });
      }
    },
  );

  /** Opens the local board. Does nothing while any share or session is up, or a start is in flight. */
  async function startWhiteboard(): Promise<void> {
    const sharerId = participantWithScreen.value?.userId;
    const othersSharing = !!sharerId && sharerId !== localParticipant.value?.userId;
    if (opening.value || sessionKind.value !== 'none' || screenStatus.value === DeviceStatus.On || othersSharing) {
      return;
    }
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
      opening.value = false;
    }
  }

  async function stopWhiteboard(): Promise<void> {
    if (isWhiteboardOn.value) {
      await stopSession();
    }
  }

  /** Draws on the local screen share, or on the remote sharer's. */
  async function startAnnotation(): Promise<void> {
    if (sessionKind.value !== 'none' || startPromise) {
      return;
    }
    if (screenStatus.value === DeviceStatus.On) {
      await startHostAnnotation();
      return;
    }
    const sharerId = participantWithScreen.value?.userId;
    if (!sharerId || sharerId === localParticipant.value?.userId) {
      return;
    }
    await runStart('annotation-guest', async (trtc) => {
      await trtc.startAnnotation({ userId: sharerId });
      guestUserId = sharerId;
    });
  }

  async function stopAnnotation(): Promise<void> {
    if (isAnnotationOn.value) {
      await stopSession();
    }
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
      startWhiteboard,
      stopWhiteboard,
      startAnnotation,
      stopAnnotation,
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
