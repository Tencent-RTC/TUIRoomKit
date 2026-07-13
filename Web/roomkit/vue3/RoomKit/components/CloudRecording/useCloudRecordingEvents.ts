import { onMounted, onUnmounted } from 'vue';
import { TUIMessageBox, TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState, useLoginState, RoomEvent, RecordingStopReason } from 'tuikit-atomicx-vue3/room';
import { RoomEvent as RoomKitEvent } from '../../adapter/type';
import { getRoomErrorKey } from '../../utils/errorHandler';
import { eventCenter } from '../../utils/eventCenter';
import type { MessageBoxHandle } from '@tencentcloud/uikit-base-component-vue3';
import type { RoomInfo, RoomUser } from 'tuikit-atomicx-vue3/room';

const getRoomPage = () => document.getElementById('roomPage') ?? document.body;

/**
 * Subscribes to cloud recording SDK events and shows the corresponding
 * notification dialogs. Call this only from Status components (PC + H5)
 * to ensure exactly one subscription exists per view.
 */
export function useCloudRecordingEvents() {
  const { t } = useUIKit();
  const { loginUserInfo } = useLoginState();
  const { leaveRoom, subscribeEvent, unsubscribeEvent } = useRoomState();

  // Tracks the currently visible event-notification dialog so we can dismiss it
  // before showing a new one, preventing dialog pile-up.
  let activeDialogHandle: MessageBoxHandle | null = null;

  function showRecordingDialog(show: () => MessageBoxHandle) {
    activeDialogHandle?.close();
    activeDialogHandle = show();
  }

  function showRecordingNotifyDialog(operator: RoomUser) {
    if (operator.userId === loginUserInfo.value?.userId) {
      return;
    }
    showRecordingDialog(() => TUIMessageBox.confirm({
      title: t('CloudRecording.NotifyTitle'),
      content: t('CloudRecording.NotifyContent', { name: operator.userName || operator.userId }),
      confirmText: t('CloudRecording.NotifyConfirm'),
      cancelText: t('CloudRecording.NotifyCancel'),
      appendTo: getRoomPage(),
      callback: async (action?: string) => {
        if (action === 'cancel') {
          try {
            await leaveRoom();
            eventCenter.emit(RoomKitEvent.ROOM_LEAVE);
          } catch (_error: any) {
            TUIToast({ message: t(getRoomErrorKey(_error)), type: TOAST_TYPE.ERROR });
          }
        }
      },
    }));
  }

  function showRecordingEndToast(operator: RoomUser, reason: RecordingStopReason) {
    if (operator.userId === loginUserInfo.value?.userId) {
      return;
    }
    activeDialogHandle?.close();
    activeDialogHandle = null;

    const isAbnormal = reason === RecordingStopReason.RecorderLeftRoom;
    TUIToast({
      message: t(isAbnormal ? 'CloudRecording.EndAbnormal' : 'CloudRecording.EndTitle'),
      type: isAbnormal ? TOAST_TYPE.WARNING : TOAST_TYPE.INFO,
    });
  }

  const onRecordingStarted = ({ operator }: { roomInfo: RoomInfo; operator: RoomUser }) => {
    showRecordingNotifyDialog(operator);
  };

  const onRecordingStopped = ({ operator, reason }: { roomInfo: RoomInfo; operator: RoomUser; reason: RecordingStopReason }) => {
    showRecordingEndToast(operator, reason);
  };

  onMounted(() => {
    subscribeEvent(RoomEvent.onRecordingStarted, onRecordingStarted);
    subscribeEvent(RoomEvent.onRecordingStopped, onRecordingStopped);
  });

  onUnmounted(() => {
    activeDialogHandle?.close();
    activeDialogHandle = null;
    unsubscribeEvent(RoomEvent.onRecordingStarted, onRecordingStarted);
    unsubscribeEvent(RoomEvent.onRecordingStopped, onRecordingStopped);
  });
}
