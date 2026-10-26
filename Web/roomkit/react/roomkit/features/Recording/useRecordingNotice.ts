import { useEffect, useRef } from 'react';
import {
  RecordingStatus,
  RecordingStopReason,
  RoomEvent,
  useLoginState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import type { RoomUser } from 'tuikit-atomicx-react/room';
import { TUIMessageBox, TUIToast } from '../../base';
import type { MessageBoxHandle } from '../../base/components/MessageBox';
import { t } from '../../i18n';

/**
 * Consent notice for cloud recording.
 *
 * Call this from a component that mounts before the room is joined. Someone joining a
 * room that already records is told through a replayed onRecordingStarted, which the
 * SDK delivers while the join is still running; the meeting chrome only renders once
 * the join finishes, so a subscription living there would never hear it.
 */
export function useRecordingNotice(options: { onLeave: () => void | Promise<void> }) {
  const { currentRoom, subscribeEvent, unsubscribeEvent } = useRoomState();
  const { loginUserInfo } = useLoginState();

  const isRecording = currentRoom?.recordingInfo?.status === RecordingStatus.Recording;

  // Event handlers are bound once, so they read the latest values through this ref.
  // Same as vue-next: leaving the room is the caller's (useRoomTips) responsibility.
  const latestRef = useRef({ loginUserInfo, onLeave: options.onLeave });
  latestRef.current = { loginUserInfo, onLeave: options.onLeave };

  const noticeRef = useRef<MessageBoxHandle | null>(null);
  /** One prompt per recording session: the room record and the start event both report it. */
  const promptedRef = useRef(false);

  function isLocalUser(user: RoomUser) {
    return user.userId === latestRef.current.loginUserInfo?.userId;
  }

  function displayName(user: RoomUser) {
    return user.userName || user.userId;
  }

  function dismissNotice() {
    noticeRef.current?.close();
    noticeRef.current = null;
  }

  function askToStayOrLeave(operator: RoomUser) {
    dismissNotice();
    noticeRef.current = TUIMessageBox.confirm({
      title: t('CloudRecording.NotifyTitle'),
      message: t('CloudRecording.NotifyContent', { name: displayName(operator) }),
      confirmText: t('CloudRecording.NotifyConfirm'),
      cancelText: t('CloudRecording.NotifyCancel'),
      callback: async (action) => {
        noticeRef.current = null;
        if (action === 'cancel') {
          await latestRef.current.onLeave();
        }
      },
    });
  }

  function promptOnce(operator: RoomUser | undefined) {
    if (!operator || promptedRef.current) {
      return;
    }
    // The session counts as handled either way, so a later start event stays quiet.
    promptedRef.current = true;
    if (isLocalUser(operator)) {
      return;
    }
    void askToStayOrLeave(operator);
  }

  const actionsRef = useRef({ promptOnce, dismissNotice, isLocalUser });
  actionsRef.current = { promptOnce, dismissNotice, isLocalUser };

  /**
   * The replayed event is the reliable path, but it only exists for as long as the SDK
   * keeps replaying it. The room record reports the same recording, so reading it keeps
   * the notice on the same footing as the status chip.
   */
  useEffect(() => {
    if (!isRecording) {
      promptedRef.current = false;
      return;
    }
    // The start event always names an operator, the room record does not have to. The
    // owner stands in for a missing one, because the notice has to tell people who is
    // recording them, and a nameless notice would be worse than naming the host.
    // React RecordingInfo types the field as `operator`, Vue as `operatorUser`; the engine
    // record shape is not typed, so accept either.
    const recordingInfo = currentRoom?.recordingInfo as
      | (NonNullable<typeof currentRoom>['recordingInfo'] & { operatorUser?: RoomUser })
      | undefined;
    actionsRef.current.promptOnce(recordingInfo?.operator ?? recordingInfo?.operatorUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  useEffect(() => {
    function handleRecordingStarted({ operator }: { operator: RoomUser }) {
      actionsRef.current.promptOnce(operator);
    }

    function handleRecordingStopped({ operator, reason }: { operator: RoomUser; reason: RecordingStopReason }) {
      promptedRef.current = false;
      actionsRef.current.dismissNotice();
      // An interrupted recording is news to the operator too, unlike a stop they asked for.
      if (reason === RecordingStopReason.RecorderLeftRoom) {
        TUIToast.warning(t('CloudRecording.EndAbnormal'));
        return;
      }
      if (actionsRef.current.isLocalUser(operator)) {
        return;
      }
      TUIToast.info(t('CloudRecording.EndTitle'));
    }

    subscribeEvent(RoomEvent.onRecordingStarted, handleRecordingStarted);
    subscribeEvent(RoomEvent.onRecordingStopped, handleRecordingStopped);

    return () => {
      actionsRef.current.dismissNotice();
      unsubscribeEvent(RoomEvent.onRecordingStarted, handleRecordingStarted);
      unsubscribeEvent(RoomEvent.onRecordingStopped, handleRecordingStopped);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
