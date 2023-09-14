import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { useRoomStore } from '../../stores/room';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-electron';
import { Ref, computed, nextTick, ref } from 'vue';

export default function useIndex() {
  const roomEngine = useGetRoomEngine();

  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();

  const {
    isMicrophoneDisableForAllUser,
    isCameraDisableForAllUser,
  } = storeToRefs(roomStore);
  const audioManageInfo = computed(() => (roomStore.isMicrophoneDisableForAllUser ? t('Lift all mute') : t('All mute')));
  const videoManageInfo = computed(() => (roomStore.isCameraDisableForAllUser ? t('Lift stop all video') : t('All stop video')));

  const showManageAllUserDialog: Ref<boolean> = ref(false);
  const dialogTitleInfo: Ref<string> = ref('');
  const dialogActionInfo: Ref<string> = ref('');

  enum ManageControlType {
    AUDIO = 'audio',
    VIDEO = 'video',
    Message = 'message',
  }
  const currentControlType: Ref<ManageControlType> = ref(ManageControlType.AUDIO);

  async function toggleManageMember(type: ManageControlType) {
    showManageAllUserDialog.value = true;
    currentControlType.value = type;
    switch (type) {
      case ManageControlType.AUDIO:
        dialogTitleInfo.value = roomStore.isMicrophoneDisableForAllUser
          ? t('Can you lift all mute')
          : t('All current and new members will be muted.');
        // 小程序更新视图
        await nextTick();
        dialogActionInfo.value = audioManageInfo.value;
        break;
      case ManageControlType.VIDEO:
        dialogTitleInfo.value = roomStore.isCameraDisableForAllUser
          ? t('Should we turn on the video for everyone')
          : t('All current and new members will turn off their videos.');
        await nextTick();
        dialogActionInfo.value = videoManageInfo.value;
        break;
      default:
        break;
    }
  }

  async function doToggleManageMember() {
    switch (currentControlType.value) {
      case ManageControlType.AUDIO:
        toggleAllAudio();
        break;
      case ManageControlType.VIDEO:
        toggleAllVideo();
        break;
      default:
        break;
    }
    showManageAllUserDialog.value = false;
  }
  function showApplyUserLit() {
    basicStore.setShowApplyUserList(true);
  }

  async function toggleAllAudio() {
    const microphoneDisableState = !isMicrophoneDisableForAllUser.value;
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: microphoneDisableState,
      device: TUIMediaDevice.kMicrophone,
    });
    roomStore.setMicrophoneDisableState(microphoneDisableState);
  }

  async function toggleAllVideo() {
    const cameraDisableState = !isCameraDisableForAllUser.value;
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: cameraDisableState,
      device: TUIMediaDevice.kCamera,
    });
    roomStore.setCameraDisableState(cameraDisableState);
  }
  return {
    showApplyUserLit,
    toggleAllAudio,
    toggleAllVideo,
    t,
    toggleManageMember,
    doToggleManageMember,
    audioManageInfo,
    videoManageInfo,
    showManageAllUserDialog,
    dialogTitleInfo,
    dialogActionInfo,
    ManageControlType,
  };
}
