import type { Component } from 'vue';
import { reactive, markRaw, computed, ref } from 'vue';
import { TUIToast, TOAST_TYPE, IconTransferOwner, TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { DeviceStatus, RealtimeTranscriberEvent, RoomParticipantRole, useAITranscriberState, useDeviceState, useRoomParticipantState, useRoomState, useWhiteboardState, WhiteboardStatus } from 'tuikit-atomicx-vue3/room';
import type { RealtimeTranscriberEventInfoMap, RoomParticipant } from 'tuikit-atomicx-vue3/room';

const { currentRoom } = useRoomState();
const { t } = useUIKit();
const { localParticipant, transferOwner } = useRoomParticipantState();
const { screenStatus, stopScreenShare } = useDeviceState();
const { whiteboardStatus, stopWhiteboard } = useWhiteboardState();
const { subscribeEvent, stopRealtimeTranscriber } = useAITranscriberState();
const hasStartedAsr = ref(false);
let asrEventBound = false;

const onRealtimeTranscriberStartedHandler = (
  _eventInfo: RealtimeTranscriberEventInfoMap[RealtimeTranscriberEvent.onRealtimeTranscriberStarted],
) => {
  hasStartedAsr.value = true;
};

const onRealtimeTranscriberStoppedHandler = (
  _eventInfo: RealtimeTranscriberEventInfoMap[RealtimeTranscriberEvent.onRealtimeTranscriberStopped],
) => {
  hasStartedAsr.value = false;
};

if (!asrEventBound) {
  subscribeEvent(RealtimeTranscriberEvent.onRealtimeTranscriberStarted, onRealtimeTranscriberStartedHandler as any);
  subscribeEvent(RealtimeTranscriberEvent.onRealtimeTranscriberStopped, onRealtimeTranscriberStoppedHandler as any);
  asrEventBound = true;
}
export function useTransferOwnerAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const displayName = computed(() => targetParticipant.nameCard || targetParticipant.userName || targetParticipant.userId);

  function transferOwnerFunc() {
    const transferWarningContent = hasStartedAsr.value
      ? t('ParticipantList.TransferHostWithAsrWarning')
      : t('ParticipantList.TransferHostWarning');

    TUIMessageBox.confirm({
      title: t('ParticipantList.TransferHostTo', {
        name: displayName.value,
      }),
      content: transferWarningContent,
      confirmText: t('ParticipantList.ConfirmTransfer'),
      cancelText: t('ParticipantList.Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          handleTransferOwner({ shouldStopAsr: hasStartedAsr.value });
        }
      },
    });
  }

  async function handleTransferOwner(options?: { shouldStopAsr?: boolean }) {
    if (localParticipant.value?.role !== RoomParticipantRole.Owner) {
      return;
    }

    // Under host/admin-only sharing, the outgoing owner becomes a general user who
    // is no longer allowed to present, so end whatever it is presenting. A standalone
    // whiteboard has no real screen capture (screenStatus Off) and is published as a
    // screen-share stream, so it must be closed via stopWhiteboard; stopScreenShare
    // would be a no-op. A real screen share (with or without annotation) is closed via
    // stopScreenShare, which also tears down the annotation whiteboard.
    if (currentRoom.value?.isAllScreenShareDisabled) {
      if (whiteboardStatus.value === WhiteboardStatus.On && screenStatus.value === DeviceStatus.Off) {
        await stopWhiteboard().catch(() => {});
      } else if (localParticipant.value?.screenShareStatus === DeviceStatus.On) {
        await stopScreenShare().catch(() => {});
      }
    }

    if (options?.shouldStopAsr && hasStartedAsr.value) {
      await stopRealtimeTranscriber().catch(() => {});
    }

    try {
      await transferOwner({
        userId: targetParticipant.userId,
      });
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: t('ParticipantList.TransferHostSuccess', {
          name: displayName.value,
        }),
      });
    } catch (error: any) {
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t('ParticipantList.TransferHostFailed'),
      });
    }
  }

  const transferOwnerAction = reactive({
    key: 'transferOwner',
    icon: markRaw(IconTransferOwner),
    label: t('ParticipantList.TransferHost'),
    handler: transferOwnerFunc,
  });
  return transferOwnerAction;
}
