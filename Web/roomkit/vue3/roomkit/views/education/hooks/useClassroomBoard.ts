import { computed, readonly, ref, watch } from 'vue';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, TUIToast, t, useUIConfig } from '../../../base';
import { roomEntry } from '../../../core/session';
import { useWhiteboardState } from '../../../features/Whiteboard/WhiteboardState';
import { useScreenShare } from '../../../features/ScreenShare/ScreenShareButton/useScreenShare';
import type { ScreenShareFailure } from '../../../features/ScreenShare/ScreenShareButton/useScreenShare';
import { confirmStopScreenShare } from '../../../features/ScreenShare/ScreenShareButton/confirmStopScreenShare';
import { useClassroom } from '../classroomData';

export interface BoardOpenState {
  inRoom: boolean;
  isTeacher: boolean;
  /** Anyone's share is up, the local board included. */
  sharing: boolean;
  sessionActive: boolean;
  /** The board was closed to make room for a screen share that has not started yet. */
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

function notifyShareFailure(reason: ScreenShareFailure) {
  // A capture fault already raised its own dialog.
  if (reason === 'capture') {
    return;
  }
  TUIToast[reason === 'failed' ? 'error' : 'warning'](t(`ScreenShare.Failure.${reason}`));
}

/**
 * Every classroom board rule, mounted once per classroom view:
 * - Teacher: the board opens on entry and comes back whenever a screen share ends. The board
 *   and a screen share hold the same share slot, so sharing the screen closes the board first.
 * - Student: draws on the teacher's share while the teacher allows it.
 * - Both: the board is read-only, toolbar hidden, while it sits in the side seat.
 *
 * `boardOnStage` reports whether this view shows the board in the main area; H5 always does.
 * `root` is the scene's RoomKitProvider root, read for the board color.
 */
export function useClassroomBoard(
  boardOnStage: () => boolean = () => true,
  root: () => HTMLElement | null = () => null,
) {
  const { phase } = roomEntry;
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const { isTeacher, selfBoardAuthorized, sharer, teacherTile, authNotice } = useClassroom();
  const {
    isAnnotationOn,
    isSessionActive,
    startWhiteboard,
    stopWhiteboard,
    startAnnotation,
    stopAnnotation,
    setInteractive,
  } = useWhiteboardState();
  const { uiConfig } = useUIConfig();
  const { isBusy, hasScreenFault, isLocalSharing, startScreenShare, stopScreenShare } = useScreenShare();

  const switching = ref(false);
  const failed = ref(false);

  async function openBoard() {
    try {
      await startWhiteboard({ backgroundColor: readBoardSurface(root()), theme: uiConfig.theme });
    } catch (error) {
      console.error('[RoomKit.education] Failed to open the whiteboard:', error);
      failed.value = true;
      TUIToast.error(t('Education.BoardFailed'));
    }
  }

  watch(() => currentRoom.value?.roomId, () => {
    failed.value = false;
  });

  watch(() => shouldOpenBoard({
    inRoom: phase.value === 'idle' && !!currentRoom.value?.roomId,
    isTeacher: isTeacher.value,
    sharing: isLocalSharing.value || !!sharer.value,
    sessionActive: isSessionActive.value,
    switching: switching.value,
    failed: failed.value,
  }), (open) => {
    if (open) {
      void openBoard();
    }
  }, { immediate: true });

  watch(boardOnStage, (onStage) => {
    void setInteractive(onStage);
  }, { immediate: true });

  /** Clearing the failure lets the watcher open the board again. */
  function retry() {
    failed.value = false;
  }

  async function toggleScreenShare() {
    if (isLocalSharing.value) {
      await confirmStopScreenShare(stopScreenShare);
      return;
    }
    if (switching.value) {
      return;
    }
    const confirmed = await TUIMessageBox.confirm({
      title: t('ScreenShare.StartTitle'),
      message: t('ScreenShare.StartMessage'),
      confirmText: t('ScreenShare.StartConfirm'),
      cancelText: t('ScreenShare.Cancel'),
    });
    if (!confirmed) {
      return;
    }
    switching.value = true;
    try {
      await stopWhiteboard();
      const failure = await startScreenShare();
      if (failure) {
        notifyShareFailure(failure);
      }
    } catch (error) {
      console.error('[RoomKit.education] Failed to switch to screen share:', error);
      notifyShareFailure('failed');
    } finally {
      switching.value = false;
    }
  }

  const canDraw = computed(() => {
    const selfId = loginUserInfo.value?.userId ?? '';
    const sharerId = sharer.value?.userId;
    return !isTeacher.value && selfBoardAuthorized.value && !!sharerId && sharerId !== selfId;
  });

  /** A failed start is not retried until the permission or the share changes. */
  let blocked = false;
  watch(() => [canDraw.value, sharer.value?.userId], () => {
    blocked = false;
  });

  // The session also follows the share: a board swapped for a screen share ends the annotation
  // while the permission stays on, so a lapsed session restarts on the new share.
  watch([canDraw, isSessionActive], async ([draw, active]) => {
    try {
      if (draw && !active && !blocked) {
        // Set before the await: a failed start flips the session back first and re-runs this.
        blocked = true;
        await startAnnotation();
        blocked = false;
      } else if (!draw && isAnnotationOn.value) {
        await stopAnnotation();
      }
    } catch (error) {
      console.warn('[RoomKit.education] Board annotation failed:', error);
    }
  }, { immediate: true });

  watch(authNotice, (notice) => {
    if (notice) {
      TUIToast.info(t(notice.on ? 'Education.AuthOnSelf' : 'Education.AuthOffSelf', { actor: teacherTile.value.name }));
    }
  });

  /** The teacher's topbar share control. */
  const shareButton = computed(() => ({
    label: t(isLocalSharing.value ? 'ScreenShare.StopConfirm' : 'ScreenShare.Share'),
    active: isLocalSharing.value,
    loading: isBusy.value || switching.value,
    notice: hasScreenFault.value,
  }));

  return {
    failed: readonly(failed),
    /** The share slot holds the teacher's own screen, not the board. */
    isScreenSharing: computed(() => isLocalSharing.value),
    shareButton,
    retry,
    toggleScreenShare,
  };
}
