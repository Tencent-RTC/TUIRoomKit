import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-js';
import { RoomAction } from '../../../type';
import { useI18n } from '../../../../locales';
import { useRoomStore } from '../../../../stores/room';
import TUIMessageBox from '../../../../components/common/base/MessageBox';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import useRoomEngine from '../../../../hooks/useRoomEngine';
import { MESSAGE_DURATION } from '../../../../constants/message';
import { reactive, computed, defineComponent } from 'vue';

export default function useRoomAudioAction() {
  const { t } = useI18n();
  const roomStore = useRoomStore();
  const roomEngine = useRoomEngine();
  let stateForAllAudio = false;

  // todo: 测试在点击确定期间有其他管理员改变状态的 case

  function toggleRoomAudio() {
    stateForAllAudio = !roomStore.isMicrophoneDisableForAllUser;
    TUIMessageBox({
      title: roomStore.isMicrophoneDisableForAllUser
        ? t('Enable all audios')
        : t('All current and new members will be muted'),
      message: roomStore.isMicrophoneDisableForAllUser
        ? t('After unlocking, users can freely turn on the microphone')
        : t('Members will not be able to open the microphone'),
      confirmButtonText: t('Confirm'),
      cancelButtonText: t('Cancel'),
      callback: async action => {
        if (action === 'confirm') {
          doToggleRoomAudio();
        }
      },
    });
  }

  async function doToggleRoomAudio() {
    if (roomStore.isMicrophoneDisableForAllUser === stateForAllAudio) {
      const tipMessage = stateForAllAudio
        ? t('All audios disabled')
        : t('All audios enabled');
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: tipMessage,
        duration: MESSAGE_DURATION.NORMAL,
      });
      return;
    }
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForAllAudio,
      device: TUIMediaDevice.kMicrophone,
    });
    roomStore.setDisableMicrophoneForAllUserByAdmin(stateForAllAudio);
  }

  const roomAudioAction = reactive({
    key: RoomAction.AudioAction,
    icon: defineComponent({}),
    label: computed(() =>
      roomStore.isMicrophoneDisableForAllUser
        ? t('Lift all mute')
        : t('All mute')
    ),
    handler: toggleRoomAudio,
  });
  return roomAudioAction;
}
