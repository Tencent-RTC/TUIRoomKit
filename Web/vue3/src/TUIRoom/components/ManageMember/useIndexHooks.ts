import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { UserInfo, useRoomStore } from '../../stores/room';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-js';
import { Ref, computed, nextTick, ref } from 'vue';
import TUIMessage from '../common/base/Message/index';
import { MESSAGE_DURATION } from '../../constants/message';

export default function useIndex() {
  const roomEngine = useGetRoomEngine();

  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const {
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
  const dialogContent: Ref<string> = ref('');
  const dialogTitle: Ref<string> = ref('');
  const dialogActionInfo: Ref<string> = ref('');
  let stateForAllAudio: boolean = false;
  let stateForAllVideo: boolean = false;

  enum ManageControlType {
    AUDIO = 'audio',
    VIDEO = 'video',
  }
  const currentControlType: Ref<ManageControlType> = ref(ManageControlType.AUDIO);

  async function toggleManageAllMember(type: ManageControlType) {
    showManageAllUserDialog.value = true;
    currentControlType.value = type;
    switch (type) {
      case ManageControlType.AUDIO:
        dialogTitle.value = roomStore.isMicrophoneDisableForAllUser
          ? t('Enable all audios') : t('All current and new members will be muted');
        dialogContent.value = roomStore.isMicrophoneDisableForAllUser
          ? t('After unlocking, users can freely turn on the microphone')
          : t('Members will not be able to open the microphone');
        stateForAllAudio =  !roomStore.isMicrophoneDisableForAllUser;
        // 小程序更新视图
        await nextTick();
        dialogActionInfo.value = audioManageInfo.value;
        break;
      case ManageControlType.VIDEO:
        dialogTitle.value = roomStore.isCameraDisableForAllUser
          ? t('Enable all videos') : t('All and new members will be banned from the camera');
        dialogContent.value = roomStore.isCameraDisableForAllUser
          ? t('After unlocking, users can freely turn on the camera')
          : t('Members will not be able to open the camera');
        stateForAllVideo = !roomStore.isCameraDisableForAllUser;
        // 小程序更新视图
        await nextTick();
        dialogActionInfo.value = videoManageInfo.value;
        break;
      default:
        break;
    }
  }

  async function doToggleManageAllMember() {
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
    if (roomStore.isMicrophoneDisableForAllUser === stateForAllAudio) {
      const tipMessage = stateForAllAudio ? t('All audios disabled') : t('All audios enabled');
      TUIMessage({
        type: 'success',
        message: tipMessage,
        duration: MESSAGE_DURATION.NORMAL,
      });
      return;
    }
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForAllAudio,
      device: TUIMediaDevice.kMicrophone,
    });
    roomStore.setMicrophoneDisableState(stateForAllAudio);
  }

  async function toggleAllVideo() {
    if (roomStore.isCameraDisableForAllUser === stateForAllVideo) {
      const tipMessage = stateForAllVideo ? t('All videos disabled') : t('All videos enabled');
      TUIMessage({
        type: 'success',
        message: tipMessage,
        duration: MESSAGE_DURATION.NORMAL,
      });
      return;
    }
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForAllVideo,
      device: TUIMediaDevice.kCamera,
    });
    roomStore.setCameraDisableState(stateForAllVideo);
  }
  return {
    showApplyUserLit,
    searchText,
    showUserList,
    handleInvite,
    t,
    toggleManageAllMember,
    doToggleManageAllMember,
    audioManageInfo,
    videoManageInfo,
    showManageAllUserDialog,
    dialogContent,
    dialogTitle,
    dialogActionInfo,
    ManageControlType,
  };
}
