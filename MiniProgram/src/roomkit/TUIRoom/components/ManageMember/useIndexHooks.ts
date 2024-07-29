import { Ref, computed, nextTick, ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { UserInfo, useRoomStore } from '../../stores/room';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-wx';
import TUIMessage from '../common/base/Message/index';
import { MESSAGE_DURATION } from '../../constants/message';
import { isMobile } from '../../utils/environment';
import AllMembersShareScreenIcon from '../../assets/icons/AllMembersShareScreenIcon.svg';
import HostShareScreenIcon from '../../assets/icons/HostShareScreenIcon.svg';

export default function useIndex() {
  const roomEngine = useGetRoomEngine();

  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const {
    userList,
    anchorUserList,
    applyToAnchorList,
    isOnStateTabActive,
    generalUserScreenStreamList,
  } = storeToRefs(roomStore);

  enum ManageControlType {
    AUDIO = 'audio',
    VIDEO = 'video',
    SCREEN = 'screen',
  }

  const audienceUserList = computed(() => userList.value.filter(user => !anchorUserList.value.includes(user)));

  const searchText = ref('');
  const showMoreControl = ref(false);

  function handleToggleStaged() {
    isOnStateTabActive.value = !isOnStateTabActive.value;
    roomStore.setOnStageTabStatus(isOnStateTabActive.value);
  }

  const filteredUserList = computed(() => {
    let list: UserInfo[] = [];
    if (roomStore.isFreeSpeakMode) {
      list = userList.value;
    } else if (roomStore.isSpeakAfterTakingSeatMode) {
      list = isOnStateTabActive.value ? anchorUserList.value : audienceUserList.value;
    }
    if (!searchText.value) {
      return list;
    }
    return list.filter((item: UserInfo) => item.nameCard?.includes(searchText.value) || item.userName?.includes(searchText.value) || item.userId.includes(searchText.value));
  });
  const alreadyStaged = computed(() => `${t('Already on stage')} (${(anchorUserList.value.length)})`);
  const notStaged = computed(() => `${t('Not on stage')} (${(audienceUserList.value.length)})`);

  function handleInvite() {
    basicStore.setSidebarName('invite');
  }

  const audioManageInfo = computed(() => (roomStore.isMicrophoneDisableForAllUser ? t('Lift all mute') : t('All mute')));
  const videoManageInfo = computed(() => (roomStore.isCameraDisableForAllUser ? t('Lift stop all video') : t('All stop video')));

  const moreControlList = computed(() => ([
    {
      title: roomStore.isScreenShareDisableForAllUser ?  t('All members can share screen') :  t('Screen sharing for host/admin only'),
      icon: roomStore.isScreenShareDisableForAllUser ? AllMembersShareScreenIcon : HostShareScreenIcon,
      func: toggleManageAllMember,
      type: ManageControlType.SCREEN,
    },
  ]));

  const showManageAllUserDialog: Ref<boolean> = ref(false);
  const dialogContent: Ref<string> = ref('');
  const dialogTitle: Ref<string> = ref('');
  const dialogActionInfo: Ref<string> = ref('');
  let stateForAllAudio: boolean = false;
  let stateForAllVideo: boolean = false;
  let stateForScreenShare: boolean = false;

  const currentControlType: Ref<ManageControlType> = ref(ManageControlType.AUDIO);

  async function toggleManageAllMember(type: ManageControlType) {
    currentControlType.value = type;
    switch (type) {
      case ManageControlType.AUDIO:
        showManageAllUserDialog.value = true;
        dialogTitle.value = roomStore.isMicrophoneDisableForAllUser
          ? t('Enable all audios') : t('All current and new members will be muted');
        dialogContent.value = roomStore.isMicrophoneDisableForAllUser
          ? t('After unlocking, users can freely turn on the microphone')
          : t('Members will not be able to open the microphone');
        stateForAllAudio =  !roomStore.isMicrophoneDisableForAllUser;
        // Mini program update view
        await nextTick();
        dialogActionInfo.value = audioManageInfo.value;
        break;
      case ManageControlType.VIDEO:
        showManageAllUserDialog.value = true;
        dialogTitle.value = roomStore.isCameraDisableForAllUser
          ? t('Enable all videos') : t('All and new members will be banned from the camera');
        dialogContent.value = roomStore.isCameraDisableForAllUser
          ? t('After unlocking, users can freely turn on the camera')
          : t('Members will not be able to open the camera');
        stateForAllVideo = !roomStore.isCameraDisableForAllUser;
        // Mini program update view
        await nextTick();
        dialogActionInfo.value = videoManageInfo.value;
        break;
      case ManageControlType.SCREEN:
        stateForScreenShare = !roomStore.isScreenShareDisableForAllUser;
        if (generalUserScreenStreamList.value.length === 0) {
          toggleAllScreenShare();
          break;
        }
        showManageAllUserDialog.value = true;
        dialogTitle.value = t('Is it turned on that only the host/admin can share the screen?');
        dialogContent.value = t("Other member is sharing the screen is now, the member's sharing will be terminated after you turning on");
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
      case ManageControlType.SCREEN:
        await roomEngine.instance?.closeRemoteDeviceByAdmin({
          userId: generalUserScreenStreamList.value[0].userId,
          device: TUIMediaDevice.kScreen,
        });
        toggleAllScreenShare();
        break;
      default:
        break;
    }
    showManageAllUserDialog.value = false;
  }
  async function toggleAllScreenShare() {
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForScreenShare,
      device: TUIMediaDevice.kScreen,
    });
    roomStore.setDisableScreenShareForAllUserByAdmin(stateForScreenShare);
    showMoreControl.value = false;
  }
  function showApplyUserList() {
    if (isMobile) {
      basicStore.setSidebarOpenStatus(true);
      basicStore.setSidebarName('apply');
    } else {
      basicStore.setShowApplyUserList(true);
    }
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
    roomStore.setDisableMicrophoneForAllUserByAdmin(stateForAllAudio);
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
    roomStore.setDisableCameraForAllUserByAdmin(stateForAllVideo);
  }

  const applyToAnchorUserContent = computed(() => {
    const lastIndex = applyToAnchorList.value.length - 1;
    const userName = applyToAnchorList.value[lastIndex]?.nameCard || applyToAnchorList.value[lastIndex]?.userName || applyToAnchorList.value[lastIndex]?.userId;
    if (applyToAnchorList.value.length === 1) {
      return `${userName} ${t('Applying for the stage')}`;
    }
    return `${userName} ${t('and so on number people applying to stage', { number: applyToAnchorList.value.length })}`;
  });

  function toggleClickMoreBtn() {
    showMoreControl.value = !showMoreControl.value;
  }

  return {
    showApplyUserList,
    searchText,
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
    alreadyStaged,
    notStaged,
    filteredUserList,
    isOnStateTabActive,
    handleToggleStaged,
    applyToAnchorUserContent,
    toggleClickMoreBtn,
    showMoreControl,
    moreControlList,
  };
}
