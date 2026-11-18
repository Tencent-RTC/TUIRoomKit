import { computed, readonly, ref, watch } from 'vue';
import { DeviceError, useDeviceState, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { TUIToast, t, useUIConfig } from '../../../base';
import { roomEntry } from '../../../core/session';
import { useWhiteboardState } from '../../../features/Whiteboard/WhiteboardState';
import { useScreenShare } from '../../../features/ScreenShare/useScreenShare';
import { useClassroom } from '../classroomData';
import { toastRoomError } from '../../../utils/roomError';

export interface BoardOpenState {
  inRoom: boolean;
  isTeacher: boolean;
  /** Anyone's share is up, the local board included. */
  sharing: boolean;
  sessionActive: boolean;
  /** A share slot operation is in flight, e.g. the board closed for a screen share not yet up. */
  switching: boolean;
  failed: boolean;
}

export function shouldOpenBoard(state: BoardOpenState): boolean {
  return state.inRoom
    && state.isTeacher
    && !state.sharing
    && !state.sessionActive
    && !state.switching
    && !state.failed;
}

/** The SDK paints a concrete color, so the chalkboard takes the resolved surface token of the scene root. */
function readBoardSurface(root: HTMLElement | null): string | undefined {
  const color = root ? getComputedStyle(root).getPropertyValue('--rk-bg-surface').trim() : '';
  return color || undefined;
}

/**
 * Every classroom board rule, mounted once per classroom view:
 * - Teacher: the board opens on entry and comes back whenever a screen share ends. The board
 *   and a screen share hold the same share slot, so sharing the screen closes the board first.
 * - Student: draws on the teacher's share while the teacher allows it. A revoke only turns the
 *   annotation read-only, so a later grant can still erase the strokes drawn before.
 * - Both: the board is read-only, toolbar hidden, while it sits in the side seat.
 *
 * `boardOnStage` reports whether this view shows the board in the main area; both PC and
 * H5 pass the class-wide swap state, so a swapped board goes read-only on every view.
 * `root` is the scene's RoomKitProvider root, read for the board color.
 */
export function useClassroomBoard(
  boardOnStage: () => boolean = () => true,
  root: () => HTMLElement | null = () => null,
  /** False when a custom toolbar replaces the SDK's built-in one, e.g. the H5 classroom dock. */
  builtinToolbar = true,
) {
  const { phase } = roomEntry;
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const { isTeacher, selfBoardAuthorized, sharer, authNotice } = useClassroom();
  const {
    isAnnotationOn,
    isSessionActive,
    playingSharerId,
    startWhiteboard,
    startAnnotation,
    stopAnnotation,
    setInteractive,
  } = useWhiteboardState();
  const { uiConfig } = useUIConfig();
  const { holder, isBusy, startScreenShare, stopScreenShare } = useScreenShare();
  const { screenLastError } = useDeviceState();

  const failed = ref(false);

  async function openBoard() {
    try {
      await startWhiteboard({
        backgroundColor: readBoardSurface(root()),
        theme: uiConfig.theme,
        builtinToolbar,
      });
    } catch (error) {
      console.error('[RoomKit.education] Failed to open the whiteboard:', error);
      failed.value = true;
      toastRoomError(error, { fallback: 'Education.BoardFailed' });
    }
  }

  watch(() => currentRoom.value?.roomId, () => {
    failed.value = false;
  });

  watch(() => shouldOpenBoard({
    inRoom: phase.value === 'idle' && !!currentRoom.value?.roomId,
    isTeacher: isTeacher.value,
    sharing: holder.value !== 'none',
    sessionActive: isSessionActive.value,
    // Any slot operation, including the gap inside a board-to-screen handoff when the slot is briefly free.
    switching: isBusy.value,
    failed: failed.value,
  }), (open) => {
    if (open) {
      void openBoard();
    }
  }, { immediate: true });

  watch(() => boardOnStage() && (isTeacher.value || selfBoardAuthorized.value), (isInteractive) => {
    void setInteractive(isInteractive);
  }, { immediate: true });

  /** Clearing the failure lets the watcher open the board again. */
  function retry() {
    failed.value = false;
  }

  /** The share slot closes the board itself once the user confirms the screen share. */
  async function toggleScreenShare() {
    await (holder.value === 'local-screen' ? stopScreenShare() : startScreenShare());
  }

  /** The student can hold an annotation on the teacher's share, drawing or not. */
  const canAnnotate = computed(() => {
    const selfId = loginUserInfo.value?.userId ?? '';
    const sharerId = sharer.value?.userId;
    // The sharer's row turns on before its stream plays, and a stale row never plays.
    return !isTeacher.value && !!sharerId && sharerId !== selfId
      && playingSharerId.value === sharerId;
  });

  /** A failed start is not retried until the permission, the share or its playback changes. */
  let blocked = false;
  watch(() => [canAnnotate.value, selfBoardAuthorized.value, sharer.value?.userId], () => {
    blocked = false;
  });

  // A grant starts the session and a revoke leaves it running read-only: a new session cannot
  // erase the strokes of an earlier one. The session also follows the share: a board swapped for
  // a screen share ends the annotation while the permission stays on, so it restarts on the new share.
  watch([canAnnotate, selfBoardAuthorized, isSessionActive], async ([annotate, authorized, active]) => {
    const isStarting = annotate && authorized && !active && !blocked;
    try {
      if (isStarting) {
        // Set before the await: a failed start flips the session back first and re-runs this.
        blocked = true;
        await startAnnotation({ theme: uiConfig.theme, builtinToolbar });
        blocked = false;
      } else if (!annotate && isAnnotationOn.value) {
        await stopAnnotation();
      }
    } catch (error) {
      console.warn('[RoomKit.education] Board annotation failed:', error);
      // `blocked` keeps a failed start from retrying, so this toasts once per grant.
      if (isStarting) {
        toastRoomError(error, { fallback: 'Whiteboard.AnnotationStartFailed' });
      }
    }
  }, { immediate: true });

  watch(authNotice, (notice) => {
    if (notice) {
      // Student-facing toasts name the actor by role ("老师"), not by display name.
      TUIToast.info(t(notice.on ? 'Education.AuthOnSelf' : 'Education.AuthOffSelf', { operatorName: t('Education.Teacher') }));
    }
  });

  /** The teacher's topbar share control. */
  const shareButton = computed(() => ({
    label: t(holder.value === 'local-screen' ? 'ScreenShare.StopConfirm' : 'ScreenShare.Share'),
    active: holder.value === 'local-screen',
    loading: isBusy.value,
    notice: screenLastError.value !== DeviceError.NoError,
  }));

  return {
    failed: readonly(failed),
    /** The share slot holds the teacher's own screen, not the board. */
    isScreenSharing: computed(() => holder.value === 'local-screen'),
    shareButton,
    retry,
    toggleScreenShare,
  };
}
