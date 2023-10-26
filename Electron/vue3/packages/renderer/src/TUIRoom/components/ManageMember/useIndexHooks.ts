import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { UserInfo, useRoomStore } from '../../stores/room';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-electron';
import { Ref, computed, nextTick, ref } from 'vue';
import { ElMessage } from '../../elementComp';
import { MESSAGE_DURATION } from '../../constants/message';

export default function useIndex() {
  const roomEngine = useGetRoomEngine();

  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const {
    isMicrophoneDisableForAllUser,
    isCameraDisableForAllUser,
    userList,
  } = storeToRefs(roomStore);

  const searchText = ref('');
  const showUserList = computed(() => {
    if (searchText.value === '') {
      return userList.value;
    }
    return userList.value.filter((item: UserInfo) => item.userName?.includes(searchText.value)
      || item.userId.includes(searchText.value));
  });

  function handleInvite() {
    basicStore.setSidebarName('invite');
  }

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
    const isMicrophoneDisable = !isMicrophoneDisableForAllUser.value;
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: isMicrophoneDisable,
      device: TUIMediaDevice.kMicrophone,
    });
    const tipMessage = isMicrophoneDisable ? t('The host has muted all') : t('The host has unmuted all');
    ElMessage({
      type: 'success',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    roomStore.setMicrophoneDisableState(isMicrophoneDisable);
  }

  async function toggleAllVideo() {
    const isCameraDisable = !isCameraDisableForAllUser.value;
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: isCameraDisable,
      device: TUIMediaDevice.kCamera,
    });
    const tipMessage = isCameraDisable ? t('The host has turned on the ban on all paintings') : t('The host has lifted the ban on all paintings');
    ElMessage({
      type: 'success',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    roomStore.setCameraDisableState(isCameraDisable);
  }
  return {
    showApplyUserLit,
    toggleAllAudio,
    toggleAllVideo,
    searchText,
    showUserList,
    handleInvite,
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
