import { computed, onUnmounted, watch } from 'vue';
import {
  RecordingStatus,
  RecordingStopReason,
  RoomEvent,
  useLoginState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomUser } from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, TUIToast } from '../../base';
import type { MessageBoxHandle } from '../../base/components/MessageBox';
import { t } from '../../i18n';
import { useRoomExit } from '../RoomInfo/LeaveRoomButton/useRoomExit';

/**
 * Consent notice for cloud recording.
 *
 * Call this from a component that mounts before the room is joined. Someone joining a
 * room that already records is told through a replayed onRecordingStarted, which the
 * SDK delivers while the join is still running; the meeting chrome only renders once
 * the join finishes, so a subscription living there would never hear it.
 */
export function useRecordingNotice(options: { onLeave: () => void }) {
  const { currentRoom, subscribeEvent, unsubscribeEvent } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const { leaveRoom } = useRoomExit();

  const isRecording = computed(
    () => currentRoom.value?.recordingInfo?.status === RecordingStatus.Recording,
  );

  function isLocalUser(user: RoomUser) {
    return user.userId === loginUserInfo.value?.userId;
  }

  function displayName(user: RoomUser) {
    return user.userName || user.userId;
  }

  let notice: MessageBoxHandle | null = null;

  function dismissNotice() {
    notice?.close();
    notice = null;
  }

  function askToStayOrLeave(operator: RoomUser) {
    dismissNotice();
    notice = TUIMessageBox.confirm({
      title: t('CloudRecording.NotifyTitle'),
      message: t('CloudRecording.NotifyContent', { name: displayName(operator) }),
      confirmText: t('CloudRecording.NotifyConfirm'),
      cancelText: t('CloudRecording.NotifyCancel'),
      callback: async (action) => {
        notice = null;
        if (action === 'cancel') {
          await leaveRoom();
          options.onLeave();
        }
      },
    });
  }

  /** One prompt per recording session: the room record and the start event both report it. */
  let prompted = false;

  function promptOnce(operator: RoomUser | undefined) {
    if (!operator || prompted) {
      return;
    }
    // The session counts as handled either way, so a later start event stays quiet.
    prompted = true;
    if (isLocalUser(operator)) {
      return;
    }
    void askToStayOrLeave(operator);
  }

  /**
   * The replayed event is the reliable path, but it only exists for as long as the SDK
   * keeps replaying it. The room record reports the same recording, so reading it keeps
   * the notice on the same footing as the status chip.
   */
  watch(isRecording, (recording) => {
    if (!recording) {
      prompted = false;
      return;
    }
    // The start event always names an operator, the room record does not have to. The
    // owner stands in for a missing one, because the notice has to tell people who is
    // recording them, and a nameless notice would be worse than naming the host.
    promptOnce(currentRoom.value?.recordingInfo?.operatorUser);
  }, { immediate: true });

  function handleRecordingStarted({ operator }: { operator: RoomUser }) {
    promptOnce(operator);
  }

  function handleRecordingStopped({ operator, reason }: { operator: RoomUser; reason: RecordingStopReason }) {
    prompted = false;
    dismissNotice();
    // An interrupted recording is news to the operator too, unlike a stop they asked for.
    if (reason === RecordingStopReason.RecorderLeftRoom) {
      TUIToast.warning(t('CloudRecording.EndAbnormal'));
      return;
    }
    if (isLocalUser(operator)) {
      return;
    }
    TUIToast.info(t('CloudRecording.EndTitle'));
  }

  subscribeEvent(RoomEvent.onRecordingStarted, handleRecordingStarted);
  subscribeEvent(RoomEvent.onRecordingStopped, handleRecordingStopped);

  onUnmounted(() => {
    dismissNotice();
    unsubscribeEvent(RoomEvent.onRecordingStarted, handleRecordingStarted);
    unsubscribeEvent(RoomEvent.onRecordingStopped, handleRecordingStopped);
  });
}
