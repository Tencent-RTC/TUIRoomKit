import { useRef, useSyncExternalStore } from 'react';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  DeviceError,
  DeviceStatus,
  RoomParticipantRole,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
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

/** Module scoped so toolbar, overflow, and the stage overlay share one in-flight guard. */
let isBusy = false;
const busyListeners = new Set<() => void>();

function setBusy(next: boolean) {
  isBusy = next;
  busyListeners.forEach(listener => listener());
}

function subscribeBusy(listener: () => void): () => void {
  busyListeners.add(listener);
  return () => {
    busyListeners.delete(listener);
  };
}

function getBusy(): boolean {
  return isBusy;
}

let shareSystemAudioValue = true;
const shareSystemAudioListeners = new Set<() => void>();

/**
 * Settings writes it, the next share reads it; the engine takes it only at start time.
 * Components subscribe with `useSyncExternalStore(shareSystemAudio.subscribe, shareSystemAudio.getSnapshot)`.
 */
export const shareSystemAudio = {
  get value(): boolean {
    return shareSystemAudioValue;
  },
  set value(next: boolean) {
    if (next === shareSystemAudioValue) {
      return;
    }
    shareSystemAudioValue = next;
    shareSystemAudioListeners.forEach(listener => listener());
  },
  subscribe(listener: () => void): () => void {
    shareSystemAudioListeners.add(listener);
    return () => {
      shareSystemAudioListeners.delete(listener);
    };
  },
  getSnapshot(): boolean {
    return shareSystemAudioValue;
  },
};

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
  const busy = useSyncExternalStore(subscribeBusy, getBusy, getBusy);

  const isLocalSharing = screenStatus === DeviceStatus.On;
  const sharerId = participantWithScreen?.userId;
  const isRemoteSharing = Boolean(sharerId) && sharerId !== loginUserInfo?.userId;
  const isSharing = isLocalSharing || isRemoteSharing;
  const hasScreenFault = screenLastError !== DeviceError.NoError;
  const isScreenCaptureUnsupported = screenLastError === DeviceError.NotSupportCapture;

  /**
   * Ownership reads from the room record; admin falls back to the local participant.
   * The participant list can stay empty until something calls getParticipantList(),
   * so a missing local row must fail closed rather than treat the user as a member
   * who is allowed to share.
   */
  const canShareScreen = (() => {
    if (!currentRoom?.isAllScreenShareDisabled) {
      return true;
    }
    const userId = loginUserInfo?.userId;
    if (!userId) {
      return false;
    }
    if (currentRoom.roomOwner?.userId === userId) {
      return true;
    }
    return localParticipant?.role === RoomParticipantRole.Admin;
  })();

  // Callers may invoke the actions after awaiting a confirm, so they read the latest render.
  const latestRef = useRef({ isLocalSharing, isRemoteSharing, isScreenCaptureUnsupported, canShareScreen });
  latestRef.current = { isLocalSharing, isRemoteSharing, isScreenCaptureUnsupported, canShareScreen };

  async function startScreenShare(): Promise<ScreenShareFailure | undefined> {
    const latest = latestRef.current;
    if (isBusy || latest.isLocalSharing) {
      return undefined;
    }
    if (!latest.canShareScreen) {
      return 'not-allowed';
    }
    if (latest.isRemoteSharing) {
      return 'remote-sharing';
    }
    if (latest.isScreenCaptureUnsupported) {
      // Synthesised because the engine reported this through state, not a thrown error.
      handleScreenShareError({ name: 'NotSupportedError' });
      return 'capture';
    }
    setBusy(true);
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
      setBusy(false);
    }
  }

  async function stopScreenShare(): Promise<ScreenShareFailure | undefined> {
    if (isBusy || !latestRef.current.isLocalSharing) {
      return undefined;
    }
    setBusy(true);
    try {
      await stop();
      return undefined;
    } catch (error) {
      console.error('[RoomKit.stopScreenShare] Failed to stop screen share:', error);
      return 'failed';
    } finally {
      setBusy(false);
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
    isBusy: busy,
    startScreenShare,
    stopScreenShare,
  };
}
