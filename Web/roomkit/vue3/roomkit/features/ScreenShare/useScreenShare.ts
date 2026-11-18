import { computed, effectScope, readonly, ref, shallowRef, watch } from 'vue';
import type { Component, InjectionKey, Ref } from 'vue';
import { TRTCVideoResolution, TRTCVideoResolutionMode } from '@tencentcloud/tuiroom-engine-js';
import {
  DeviceError,
  DeviceStatus,
  RoomParticipantRole,
  TUIErrorCode,
  useDeviceState,
  useLoginState,
  useRoomEngine,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, TUIToast, t } from '../../base';
import { hasInterceptor, runInterceptors } from '../../core/interceptors';
import { useDeviceFault } from '../Device/useDeviceFault';

/** Webinar speaker-count ceiling from RoomEngine; kept named so it is not a magic number. */
const ERROR_SPEAKER_LIMIT_EXCEEDED = 100253;

/** Screen share encoding; the engine reads it only when a share starts. Bitrate is in kbps. */
const SCREEN_SHARE_ENCODER_PARAM = {
  videoResolution: TRTCVideoResolution.TRTCVideoResolution_1920_1080,
  resMode: TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
  videoFps: 15,
  videoBitrate: 5000,
};

/**
 * Who holds the share slot. A room carries one share at a time, and a local board takes the
 * same slot a screen share does (token, sub stream, the participant's share status).
 */
type ShareSlotHolder = 'none' | 'local-screen' | 'local-board' | 'remote';

/** How the slot sees and ends a local board; the board's own feature registers it. */
interface ShareSlotBoard {
  /** Starting or running. */
  active: Readonly<Ref<boolean>>;
  /** Ends the board, including one still starting. */
  stop: () => Promise<void>;
}

/** Another kind of share that rides on the share control, registered from its default slot. */
export interface ScreenShareEntry {
  command: string;
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

/** Desktop Safari; every other desktop browser also carries "Safari" in its UA. */
const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|FxiOS|Edg|Android/i.test(navigator.userAgent);

/** Settings writes it, the next share reads it; the engine takes it only at start time. */
export const shareSystemAudio = ref(true);

function createScreenShare() {
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const {
    screenStatus,
    screenLastError,
    startScreenShare: startEngine,
    stopScreenShare: stopEngine,
  } = useDeviceState();
  const { localParticipant, participantWithScreen } = useRoomParticipantState();
  const { handleScreenShareError } = useDeviceFault();
  const roomEngine = useRoomEngine();

  const board = shallowRef<ShareSlotBoard | null>(null);
  /**
   * atomicx gap: DeviceState has no in-flight status. One lock for every operation that takes
   * the slot: screen starts and stops, board starts, and the board-to-screen handoff.
   */
  const isBusy = ref(false);

  /** A local board marks the local share on, so it never reads as a remote share. */
  const holder = computed<ShareSlotHolder>(() => {
    if (screenStatus.value === DeviceStatus.On) {
      return 'local-screen';
    }
    if (board.value?.active.value) {
      return 'local-board';
    }
    const sharerId = participantWithScreen.value?.userId;
    return sharerId && sharerId !== loginUserInfo.value?.userId ? 'remote' : 'none';
  });

  /**
   * Sharing is a permission, not a role, and it covers the board too. Ownership reads from the
   * room record. atomicx gap: `localParticipant` can stay empty until something calls
   * getParticipantList(), so a missing row fails closed instead of allowing a share.
   */
  const canShare = computed(() => {
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

  /**
   * Turning the share ban on ends a barred user's board, as the engine does for a screen share;
   * the engine cannot see a board, so it has to happen here. A role change keeps the board on
   * purpose: the engine also ends a screen share then, which is expected to change.
   */
  watch(() => Boolean(currentRoom.value?.isAllScreenShareDisabled), (disabled, wasDisabled) => {
    if (disabled && !wasDisabled && !canShare.value && holder.value === 'local-board') {
      board.value?.stop().catch((error: unknown) => {
        console.warn('[RoomKit.screenShare] Failed to end the board on a share ban:', error);
      });
    }
  });

  /** Runs one slot operation under the shared lock; a second one while busy is dropped. */
  async function runLocked(run: () => Promise<void>): Promise<boolean> {
    if (isBusy.value) {
      return false;
    }
    isBusy.value = true;
    try {
      await run();
      return true;
    } finally {
      isBusy.value = false;
    }
  }

  /** Says why the local user cannot take the slot instead of failing silently. */
  function ensureCanStart(): boolean {
    if (!canShare.value) {
      TUIToast.warning(t('ScreenShare.Failure.not-allowed'));
      return false;
    }
    if (holder.value === 'remote') {
      TUIToast.warning(t('ScreenShare.Failure.remote-sharing'));
      return false;
    }
    return true;
  }

  function confirmStart(): Promise<boolean> {
    return hasInterceptor('startScreenShare')
      ? runInterceptors('startScreenShare')
      : TUIMessageBox.confirm({
        title: t('ScreenShare.StartTitle'),
        message: t('ScreenShare.StartMessage'),
        confirmText: t('ScreenShare.StartConfirm'),
        cancelText: t('ScreenShare.Cancel'),
      });
  }

  async function startScreenShare() {
    if (isBusy.value || holder.value === 'local-screen' || !ensureCanStart()) {
      return;
    }
    if (screenLastError.value === DeviceError.NotSupportCapture) {
      // Synthesised because the engine reported this through state, not a thrown error.
      handleScreenShareError({ name: 'NotSupportedError' });
      return;
    }
    /**
     * Safari only lets getDisplayMedia run from a click with no server round trip in between,
     * and closing the board waits on one. There the board closes first and the confirm click
     * starts the share; the lock stays held across the dialog so the board is not reopened.
     */
    const isBoardClosedFirst = isSafari && holder.value === 'local-board';
    if (!isBoardClosedFirst && !(await confirmStart())) {
      return;
    }
    await runLocked(async () => {
      // The room may have moved on while the dialog was open.
      if (holder.value === 'local-screen' || !ensureCanStart()) {
        return;
      }
      // The local board holds the slot; it gives way only once the user has confirmed.
      if (holder.value === 'local-board') {
        try {
          await board.value!.stop();
        } catch (error) {
          console.error('[RoomKit.startScreenShare] Failed to free the share slot:', error);
          TUIToast.error(t('ScreenShare.Failure.failed'));
          return;
        }
      }
      if (isBoardClosedFirst && (!(await confirmStart()) || !ensureCanStart())) {
        return;
      }
      /**
       * No success toast: when two people start sharing at once the engine keeps
       * only one stream, so a toast here would confirm a share that is about to be
       * dropped. Silence means success; the active button state is the feedback.
       */
      try {
        await roomEngine.instance?.getTRTCCloud().setSubStreamEncoderParam(SCREEN_SHARE_ENCODER_PARAM);
      } catch (error) {
        console.warn('[RoomKit.startScreenShare] Failed to set the screen share encoder param:', error);
      }
      try {
        await startEngine({ screenAudio: shareSystemAudio.value });
      } catch (error) {
        // A capture fault raises its own dialog; a closed picker is the user's own cancel.
        const err = error as { code?: number; name?: string };
        if (handleScreenShareError(error) || err.name === 'NotAllowedError') {
          return;
        }
        // atomicx gap: the engine throws raw errors, so the failure is read from the code here.
        if (err.code === TUIErrorCode.ERR_OPEN_SCREEN_SHARE_NEED_PERMISSION_FROM_ADMIN) {
          // The ban can land between our check and the engine's.
          TUIToast.warning(t('ScreenShare.Failure.not-allowed'));
        } else if (err.code === TUIErrorCode.ERR_FREQ_LIMIT) {
          TUIToast.warning(t('ScreenShare.Failure.frequency-limit'));
        } else if (err.code === ERROR_SPEAKER_LIMIT_EXCEEDED) {
          TUIToast.warning(t('ScreenShare.Failure.speaker-limit'));
        } else {
          console.error('[RoomKit.startScreenShare] Failed to start screen share:', error);
          TUIToast.error(t('ScreenShare.Failure.failed'));
        }
      }
    });
  }

  /** Asks first, then ends the local screen share. */
  async function stopScreenShare() {
    if (isBusy.value || holder.value !== 'local-screen') {
      return;
    }
    const confirmed = await TUIMessageBox.danger({
      title: t('ScreenShare.StopTitle'),
      message: t('ScreenShare.StopMessage'),
      confirmText: t('ScreenShare.StopConfirm'),
      cancelText: t('ScreenShare.Cancel'),
    });
    if (!confirmed) {
      return;
    }
    await runLocked(async () => {
      // The browser's own stop button may have ended it while the dialog was open.
      if (holder.value !== 'local-screen') {
        return;
      }
      try {
        await stopEngine();
      } catch (error) {
        console.error('[RoomKit.stopScreenShare] Failed to stop screen share:', error);
        TUIToast.error(t('ScreenShare.Failure.failed'));
      }
    });
  }

  /**
   * For the board's own feature only. The slot then reads the board as the local share, ends
   * it on a share ban or to make room for a screen share. Returns the slot lock, under which
   * the board runs its start so it cannot race a screen share.
   */
  function registerBoard(adapter: ShareSlotBoard): (run: () => Promise<void>) => Promise<boolean> {
    board.value = adapter;
    return runLocked;
  }

  return {
    holder,
    canShare,
    isBusy: readonly(isBusy),
    ensureCanStart,
    startScreenShare,
    stopScreenShare,
    registerBoard,
  };
}

let screenShare: ReturnType<typeof createScreenShare> | null = null;

/**
 * The only way into sharing. Reads who holds the share slot and whether the local user may
 * take it; starts and stops a screen share with the checks, the `startScreenShare`
 * interceptor, confirm dialogs, the board handoff and failure toasts all handled here.
 * Detached so the ban rule outlives whichever component first asked for it.
 */
export function useScreenShare() {
  screenShare ??= effectScope(true).run(createScreenShare)!;
  return screenShare;
}
