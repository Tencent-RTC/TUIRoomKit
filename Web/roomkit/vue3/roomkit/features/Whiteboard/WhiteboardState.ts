import { computed, effectScope, readonly, ref, watch } from 'vue';
import type { ComputedRef } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import {
  DeviceStatus,
  WhiteboardStatus,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
  useWhiteboardState as useSharedWhiteboardState,
} from 'tuikit-atomicx-vue3/room';
import type { WhiteboardOptions } from 'tuikit-atomicx-vue3/room';

type WhiteboardPluginHost = {
  updatePlugin(
    plugin: 'Whiteboard',
    options: { ui: { toolBar: { enable: boolean } } },
  ): Promise<unknown>;
};

type SharedWhiteboardState = ReturnType<typeof useSharedWhiteboardState>;

/** True from the click until the local board start settles. The share tile is already up. */
const whiteboardOpening = ref(false);
/** The first canvas bind of this open has finished, so a layout remount does not replay the cover. */
const whiteboardViewReady = ref(false);

let shared: SharedWhiteboardState | null = null;
let isWhiteboardOn: ComputedRef<boolean> | null = null;
let isAnnotationOn: ComputedRef<boolean> | null = null;
let installed = false;
/** True only until the shared session reports On. Keeps the tile up while start is in flight. */
let holdBeforeReady = false;
/** This kit owns the fake local share, so a later Off must clear it and not a real screen share. */
let localBoardOwned = false;

let toolbarEpoch = 0;
let toolbarTail: Promise<void> = Promise.resolve();

function requireShared(): SharedWhiteboardState {
  install();
  return shared as SharedWhiteboardState;
}

function setLocalShareStatus(status: DeviceStatus): void {
  const { localParticipant } = useRoomParticipantState();
  if (localParticipant.value) {
    localParticipant.value.screenShareStatus = status;
  }
}

function isLocalBoardStart(): boolean {
  const { screenStatus } = useDeviceState();
  const { localParticipant, participantWithScreen } = useRoomParticipantState();
  if (screenStatus.value === DeviceStatus.On) {
    return false;
  }
  const presenterUserId = participantWithScreen.value?.userId;
  return !presenterUserId || presenterUserId === localParticipant.value?.userId;
}

/** Annotation needs a real share to draw on: the local screen share or a remote sharer's. */
function hasAnnotationTarget(): boolean {
  const { screenStatus } = useDeviceState();
  const { localParticipant, participantWithScreen } = useRoomParticipantState();
  if (screenStatus.value === DeviceStatus.On) {
    return true;
  }
  const presenterUserId = participantWithScreen.value?.userId;
  return !!presenterUserId && presenterUserId !== localParticipant.value?.userId;
}

function releaseLocalBoard(): void {
  holdBeforeReady = false;
  localBoardOwned = false;
  setLocalShareStatus(DeviceStatus.Off);
}

/**
 * getUserList reports the local board as not sharing and replaces the row.
 * Put the fake status back in the same tick so the share tile never unmounts.
 * A real screen share, and the shared state's own Off cleanup, are left alone.
 */
function watchLocalBoardShare(status: SharedWhiteboardState['whiteboardStatus']): void {
  const { localParticipant } = useRoomParticipantState();
  const { screenStatus } = useDeviceState();
  watch(
    () => localParticipant.value?.screenShareStatus,
    (shareStatus) => {
      const keep = holdBeforeReady || (localBoardOwned && status.value === WhiteboardStatus.On);
      if (!keep || screenStatus.value === DeviceStatus.On) {
        return;
      }
      if (shareStatus !== DeviceStatus.On && localParticipant.value) {
        localParticipant.value.screenShareStatus = DeviceStatus.On;
      }
    },
    { flush: 'sync' },
  );
  watch(
    status,
    (next) => {
      if (next === WhiteboardStatus.On) {
        holdBeforeReady = false;
      }
      if (next !== WhiteboardStatus.Off) {
        return;
      }
      holdBeforeReady = false;
      whiteboardViewReady.value = false;
      const owned = localBoardOwned;
      localBoardOwned = false;
      if (owned && screenStatus.value !== DeviceStatus.On) {
        setLocalShareStatus(DeviceStatus.Off);
      }
    },
    { flush: 'sync' },
  );
}

/**
 * The shared whiteboard status is a module singleton and outlives the room, so it
 * stays On after leaving unless stopped here. The SDK session is usually gone with
 * the room already; the stop still resets the state when the SDK call fails.
 */
function watchRoomExit(stop: () => Promise<void>): void {
  const { currentRoom } = useRoomState();
  watch(
    () => currentRoom.value?.roomId,
    (roomId, previousRoomId) => {
      if (!previousRoomId || roomId) {
        return;
      }
      whiteboardOpening.value = false;
      whiteboardViewReady.value = false;
      stop().catch((error: unknown) => {
        console.warn('[WhiteboardState] stop whiteboard on room exit failed:', error);
      });
    },
  );
}

/** The SDK opens the annotation together with a local screen share; confirming it records the session in state. */
function watchLocalScreenShare(): void {
  const { screenStatus } = useDeviceState();
  watch(screenStatus, (status, previousStatus) => {
    if (status === DeviceStatus.On && previousStatus !== DeviceStatus.On) {
      startAnnotation().catch((error: unknown) => {
        console.warn('[WhiteboardState] confirm annotation failed:', error);
      });
    }
  });
}

function install(): void {
  if (installed) {
    return;
  }
  installed = true;
  // Detached so the store subscriptions outlive whichever component first asked for the state.
  effectScope(true).run(() => {
    shared = useSharedWhiteboardState();
    const { whiteboardStatus, stopWhiteboard: sharedStop } = shared;
    const { screenStatus } = useDeviceState();
    const { loginUserInfo } = useLoginState();
    const { participantWithScreen } = useRoomParticipantState();
    /** A local board is the only whiteboard session that runs without a real screen share. */
    isWhiteboardOn = computed(() => whiteboardStatus.value === WhiteboardStatus.On
      && screenStatus.value === DeviceStatus.Off
      && participantWithScreen.value?.userId === loginUserInfo.value?.userId);
    isAnnotationOn = computed(() => whiteboardStatus.value === WhiteboardStatus.On && !isWhiteboardOn?.value);
    watchLocalBoardShare(whiteboardStatus);
    watchRoomExit(sharedStop);
    watchLocalScreenShare();
  });
}

async function startLocalBoard(options: WhiteboardOptions): Promise<void> {
  const { whiteboardStatus, startWhiteboard: sharedStart } = requireShared();
  if (whiteboardStatus.value === WhiteboardStatus.On) {
    await sharedStart(options);
    setLocalShareStatus(DeviceStatus.On);
    return;
  }
  // The tile has to exist before the shared call returns, so the view can show a loading cover.
  localBoardOwned = true;
  holdBeforeReady = true;
  setLocalShareStatus(DeviceStatus.On);
  try {
    await sharedStart(options);
  } catch (error) {
    releaseLocalBoard();
    throw error;
  }
  if (whiteboardStatus.value !== WhiteboardStatus.On) {
    releaseLocalBoard();
  }
}

/** Opens the local board. Does nothing while a screen share is up or a start is in flight. */
async function startWhiteboard(options: WhiteboardOptions = {}): Promise<void> {
  if (whiteboardOpening.value || !isLocalBoardStart()) {
    return;
  }
  whiteboardOpening.value = true;
  whiteboardViewReady.value = false;
  try {
    await startLocalBoard(options);
  } finally {
    whiteboardOpening.value = false;
  }
}

async function stopWhiteboard(): Promise<void> {
  if (!isWhiteboardOn?.value) {
    return;
  }
  await requireShared().stopWhiteboard();
}

/** The shared state picks host or guest annotation from who shares. */
async function startAnnotation(options: WhiteboardOptions = {}): Promise<void> {
  if (!hasAnnotationTarget()) {
    return;
  }
  await requireShared().startWhiteboard(options);
}

async function stopAnnotation(): Promise<void> {
  if (!isAnnotationOn?.value) {
    return;
  }
  await requireShared().stopWhiteboard();
}

async function applyBuiltinToolbar(enable: boolean): Promise<void> {
  const cloud = TUIRoomEngine.getInstance()?.getTRTCCloud() as { _trtc?: WhiteboardPluginHost } | null | undefined;
  const trtc = cloud?._trtc;
  if (!trtc) {
    throw new Error('[WhiteboardState] TRTC instance with the Whiteboard plugin is unavailable');
  }
  await trtc.updatePlugin('Whiteboard', { ui: { toolBar: { enable } } });
}

/** Binds the canvas element. The cover lifts once it settles, even on failure, so it never sticks. */
async function bindView(view: HTMLElement): Promise<void> {
  const { whiteboardStatus, updateWhiteboard } = requireShared();
  try {
    await updateWhiteboard({ view });
  } finally {
    if (whiteboardStatus.value === WhiteboardStatus.On) {
      whiteboardViewReady.value = true;
    }
  }
}

/**
 * Toolbar updates from every tile share one queue. Only the latest one is sent,
 * so a thumbnail's in-flight disable cannot land after the stage turns the toolbar back on.
 * A view that has left the DOM by the time its turn comes is skipped.
 */
function applyToolbar(view: HTMLElement, enable: boolean): Promise<void> {
  const epoch = ++toolbarEpoch;
  toolbarTail = toolbarTail.then(async () => {
    if (epoch !== toolbarEpoch || !view.isConnected) {
      return;
    }
    await requireShared().updateWhiteboard({ builtinToolbar: enable });
    await applyBuiltinToolbar(enable);
  }).catch((error: unknown) => {
    console.warn('[WhiteboardState] toolbar update failed:', error);
  });
  return toolbarTail;
}

export function useWhiteboardState() {
  install();
  return {
    whiteboardStatus: readonly(requireShared().whiteboardStatus),
    isWhiteboardOn: isWhiteboardOn as ComputedRef<boolean>,
    isAnnotationOn: isAnnotationOn as ComputedRef<boolean>,
    startWhiteboard,
    stopWhiteboard,
    startAnnotation,
    stopAnnotation,
  };
}

/** Feature-internal: only WhiteboardView binds the canvas and drives the built-in toolbar. */
export function useWhiteboardViewBinding() {
  install();
  return {
    isOpening: readonly(whiteboardOpening),
    isLoading: computed(() => whiteboardOpening.value || !whiteboardViewReady.value),
    bindView,
    applyToolbar,
  };
}
