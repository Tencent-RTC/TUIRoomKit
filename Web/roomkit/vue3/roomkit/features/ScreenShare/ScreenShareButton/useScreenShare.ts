import { computed, readonly, ref } from 'vue';
import type { Component, InjectionKey } from 'vue';
import {
  DeviceError,
  DeviceStatus,
  RoomParticipantRole,
  TUIErrorCode,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { useDeviceFault } from '../../Device/useDeviceFault';

/** Webinar speaker-count ceiling from RoomEngine; kept named so it is not a magic number. */
const ERROR_SPEAKER_LIMIT_EXCEEDED = 100253;

export type ScreenShareFailure =
  | 'not-allowed'
  | 'remote-sharing'
  | 'canceled'
  | 'need-permission'
  | 'frequency-limit'
  | 'speaker-limit'
  | 'capture'
  | 'failed';

/** Another kind of share that rides on the share control, registered from its default slot. */
export interface ScreenShareEntry {
  act: string;
  label: string;
  icon: Component;
  /** This entry is the share in progress; the control then ends it instead of opening the menu. */
  active: boolean;
  stopLabel: string;
  run: () => void;
  stop: () => void;
}

export const SCREEN_SHARE_ENTRY_KEY: InjectionKey<(source: () => ScreenShareEntry) => () => void>
  = Symbol('rk-screen-share-entry');

/** Module scoped so toolbar, overflow, and the stage overlay share one in-flight guard. */
const isBusy = ref(false);
/** Settings writes it, the next share reads it; the engine takes it only at start time. */
export const shareSystemAudio = ref(true);

function classifyScreenShareError(error: unknown): ScreenShareFailure {
  const err = error as { code?: number; name?: string; message?: string };
  if (err.name === 'NotAllowedError' && !err.message?.includes('Permission denied by system')) {
    return 'canceled';
  }
  if (err.code === TUIErrorCode.ERR_OPEN_SCREEN_SHARE_NEED_PERMISSION_FROM_ADMIN) {
    return 'need-permission';
  }
  if (err.code === TUIErrorCode.ERR_FREQ_LIMIT) {
    return 'frequency-limit';
  }
  if (err.code === ERROR_SPEAKER_LIMIT_EXCEEDED) {
    return 'speaker-limit';
  }
  return 'failed';
}

/** Sharing is a permission, not a role: widening who may start a share stays a ScreenShare-only change. */
export function useScreenShare() {
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const {
    screenStatus,
    screenLastError,
    startScreenShare: start,
    stopScreenShare: stop,
  } = useDeviceState();
  const { localParticipant, participantWithScreen } = useRoomParticipantState();
  const { handleScreenShareError } = useDeviceFault();

  const isLocalSharing = computed(() => screenStatus.value === DeviceStatus.On);
  const isRemoteSharing = computed(() => {
    const sharerId = participantWithScreen.value?.userId;
    return Boolean(sharerId) && sharerId !== loginUserInfo.value?.userId;
  });
  const isSharing = computed(() => isLocalSharing.value || isRemoteSharing.value);
  const hasScreenFault = computed(() => screenLastError.value !== DeviceError.NoError);
  const isScreenCaptureUnsupported = computed(() => screenLastError.value === DeviceError.NotSupportCapture);

  /**
   * Ownership reads from the room record; admin falls back to the local participant.
   * The participant list can stay empty until something calls getParticipantList(),
   * so a missing local row must fail closed rather than treat the user as a member
   * who is allowed to share.
   */
  const canShareScreen = computed(() => {
    if (!currentRoom.value?.isAllScreenShareDisabled) {
      return true;
    }
    const userId = loginUserInfo.value?.userId;
    if (!userId) {
      return false;
    }
    if (currentRoom.value.roomOwner?.userId === userId) {
      return true;
    }
    return localParticipant.value?.role === RoomParticipantRole.Admin;
  });

  async function startScreenShare(): Promise<ScreenShareFailure | undefined> {
    if (isBusy.value || isLocalSharing.value) {
      return undefined;
    }
    if (!canShareScreen.value) {
      return 'not-allowed';
    }
    if (isRemoteSharing.value) {
      return 'remote-sharing';
    }
    if (isScreenCaptureUnsupported.value) {
      // Synthesised because the engine reported this through state, not a thrown error.
      handleScreenShareError({ name: 'NotSupportedError' });
      return 'capture';
    }
    isBusy.value = true;
    try {
      await start({ screenAudio: shareSystemAudio.value });
      return undefined;
    } catch (error) {
      if (handleScreenShareError(error)) {
        return 'capture';
      }
      const reason = classifyScreenShareError(error);
      if (reason === 'failed') {
        console.error('[RoomKit.startScreenShare] Failed to start screen share:', error);
      }
      return reason;
    } finally {
      isBusy.value = false;
    }
  }

  async function stopScreenShare(): Promise<ScreenShareFailure | undefined> {
    if (isBusy.value || !isLocalSharing.value) {
      return undefined;
    }
    isBusy.value = true;
    try {
      await stop();
      return undefined;
    } catch (error) {
      console.error('[RoomKit.stopScreenShare] Failed to stop screen share:', error);
      return 'failed';
    } finally {
      isBusy.value = false;
    }
  }

  return {
    canShareScreen,
    hasScreenFault,
    isScreenCaptureUnsupported,
    isLocalSharing,
    isRemoteSharing,
    isSharing,
    sharer: participantWithScreen,
    isBusy: readonly(isBusy),
    startScreenShare,
    stopScreenShare,
  };
}
