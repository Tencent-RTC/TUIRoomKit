import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { DeviceError, useDeviceState, useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import { TUIToast, t, useUIConfig } from '../../../base';
import type { ElementRef } from '../../../base/headless/types';
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
  boardOnStage: boolean,
  root: ElementRef,
  /** False when a custom toolbar replaces the SDK's built-in one, e.g. the H5 classroom dock. */
  builtinToolbar = true,
) {
  const { phase } = useSyncExternalStore(roomEntry.subscribe, roomEntry.getSnapshot, roomEntry.getSnapshot);
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
  const roomId = currentRoom?.roomId;

  const [failed, setFailed] = useState(false);
  // Effects that run after an await read the latest render here.
  const latestRef = useRef({ theme: uiConfig.theme, isAnnotationOn });
  latestRef.current = { theme: uiConfig.theme, isAnnotationOn };

  useEffect(() => {
    setFailed(false);
  }, [roomId]);

  const open = shouldOpenBoard({
    inRoom: phase === 'idle' && !!roomId,
    isTeacher,
    sharing: holder !== 'none',
    sessionActive: isSessionActive,
    // Any slot operation, including the gap inside a board-to-screen handoff when the slot is briefly free.
    switching: isBusy,
    failed,
  });
  useEffect(() => {
    if (!open) {
      return;
    }
    void (async () => {
      try {
        await startWhiteboard({
          backgroundColor: readBoardSurface(root.current),
          theme: latestRef.current.theme,
          builtinToolbar,
        });
      } catch (error) {
        console.error('[RoomKit.education] Failed to open the whiteboard:', error);
        setFailed(true);
        toastRoomError(error, { fallback: 'Education.BoardFailed' });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isInteractive = boardOnStage && (isTeacher || selfBoardAuthorized);
  useEffect(() => {
    void setInteractive(isInteractive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInteractive]);

  /** Clearing the failure lets the effect open the board again. */
  function retry() {
    setFailed(false);
  }

  /** The share slot closes the board itself once the user confirms the screen share. */
  async function toggleScreenShare() {
    await (holder === 'local-screen' ? stopScreenShare() : startScreenShare());
  }

  const selfId = loginUserInfo?.userId ?? '';
  const sharerId = sharer?.userId;
  // The student can hold an annotation on the teacher's share, drawing or not.
  // The sharer's row turns on before its stream plays, and a stale row never plays.
  const canAnnotate = !isTeacher && !!sharerId && sharerId !== selfId && playingSharerId === sharerId;

  /** A failed start is not retried until the permission, the share or its playback changes. */
  const blockedRef = useRef(false);
  useEffect(() => {
    blockedRef.current = false;
  }, [canAnnotate, selfBoardAuthorized, sharerId]);

  // A grant starts the session and a revoke leaves it running read-only: a new session cannot
  // erase the strokes of an earlier one. The session also follows the share: a board swapped for
  // a screen share ends the annotation while the permission stays on, so it restarts on the new share.
  useEffect(() => {
    const isStarting = canAnnotate && selfBoardAuthorized && !isSessionActive && !blockedRef.current;
    void (async () => {
      try {
        if (isStarting) {
          // Set before the await: a failed start flips the session back first and re-runs this.
          blockedRef.current = true;
          await startAnnotation({ theme: latestRef.current.theme, builtinToolbar });
          blockedRef.current = false;
        } else if (!canAnnotate && latestRef.current.isAnnotationOn) {
          await stopAnnotation();
        }
      } catch (error) {
        console.warn('[RoomKit.education] Board annotation failed:', error);
        // `blockedRef` keeps a failed start from retrying, so this toasts once per grant.
        if (isStarting) {
          toastRoomError(error, { fallback: 'Whiteboard.AnnotationStartFailed' });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAnnotate, selfBoardAuthorized, isSessionActive]);

  useEffect(() => {
    if (authNotice) {
      TUIToast.info(t(authNotice.on ? 'Education.AuthOnSelf' : 'Education.AuthOffSelf', { operatorName: t('Education.Teacher') }));
    }
    // Only a new notice toasts; the name is read as it stands then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authNotice]);

  /** The teacher's topbar share control. */
  const shareButton = {
    label: t(holder === 'local-screen' ? 'ScreenShare.StopConfirm' : 'ScreenShare.Share'),
    active: holder === 'local-screen',
    loading: isBusy,
    notice: screenLastError !== DeviceError.NoError,
  };

  return {
    failed,
    /** The share slot holds the teacher's own screen, not the board. */
    isScreenSharing: holder === 'local-screen',
    shareButton,
    retry,
    toggleScreenShare,
  };
}
