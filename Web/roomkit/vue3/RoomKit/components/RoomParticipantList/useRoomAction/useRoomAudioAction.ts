import { reactive, computed, defineComponent } from 'vue';
import { TUIToast, TOAST_TYPE, TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { DeviceType } from 'tuikit-atomicx-vue3';

const { currentRoom } = useRoomState();

const { disableAllDevices } = useRoomParticipantState();

export default function useRoomAudioAction(): {
  key: string;
  label: string;
  handler: () => void;
} {
  const { t } = useUIKit();
  let stateForAllAudio = false;

  // TODO: 测试在点击确定期间有其他管理员改变状态的 case
  function toggleRoomAudio() {
    stateForAllAudio = !currentRoom.value?.isAllMicrophoneDisabled;
    TUIMessageBox.confirm({
      title: currentRoom.value?.isAllMicrophoneDisabled
        ? t('ParticipantList.UnmuteAll')
        : t('ParticipantList.MuteAllTip'),
      content: currentRoom.value?.isAllMicrophoneDisabled
        ? t('ParticipantList.UnmuteAllDesc')
        : t('ParticipantList.MicDisabledTip'),
      confirmText: currentRoom.value?.isAllMicrophoneDisabled ? t('ParticipantList.ConfirmUnlock') : t('ParticipantList.MuteAll'),
      cancelText: t('ParticipantList.Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          doToggleRoomAudio();
        }
      },
    });
  }

  async function doToggleRoomAudio() {
    if (currentRoom.value?.isAllMicrophoneDisabled === stateForAllAudio) {
      const tipMessage = stateForAllAudio
        ? t('ParticipantList.AudioDisabled')
        : t('ParticipantList.AudioEnabled');
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: tipMessage,
      });
      return;
    }
    await disableAllDevices({
      deviceType: DeviceType.Microphone,
      disable: stateForAllAudio,
    });
  }

  const roomAudioAction = reactive({
    key: 'RoomAudioAction',
    icon: defineComponent({}),
    label: computed(() =>
      currentRoom.value?.isAllMicrophoneDisabled
        ? t('ParticipantList.UnmuteAll')
        : t('ParticipantList.MuteAll'),
    ),
    handler: toggleRoomAudio,
  });
  return roomAudioAction;
}
