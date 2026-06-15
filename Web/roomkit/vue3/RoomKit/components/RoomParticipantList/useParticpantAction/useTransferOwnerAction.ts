import type { Component } from 'vue';
import { reactive, markRaw, computed, ref } from 'vue';
import { TUIToast, TOAST_TYPE, IconTransferOwner, TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useAITranscriberState, useDeviceState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { DeviceStatus, RealtimeTranscriberEvent, RoomParticipantRole } from 'tuikit-atomicx-vue3';
import type { RealtimeTranscriberEventInfoMap, RoomParticipant } from 'tuikit-atomicx-vue3';

const { currentRoom } = useRoomState();
const { t } = useUIKit();
const { localParticipant, transferOwner } = useRoomParticipantState();
const { stopScreenShare } = useDeviceState();
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
    if (localParticipant.value?.role === RoomParticipantRole.Owner) {
      try {
        // todo: 测试这里的开着屏幕分享转交房主，是否停止屏幕分享
        if (
          localParticipant.value?.screenShareStatus === DeviceStatus.On
          && currentRoom.value?.isAllScreenShareDisabled
        ) {
          stopScreenShare();
        }
        if (options?.shouldStopAsr && hasStartedAsr.value) {
          await stopRealtimeTranscriber();
        }
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
  }

  const transferOwnerAction = reactive({
    key: 'transferOwner',
    icon: markRaw(IconTransferOwner),
    label: t('ParticipantList.TransferHost'),
    handler: transferOwnerFunc,
  });
  return transferOwnerAction;
}
