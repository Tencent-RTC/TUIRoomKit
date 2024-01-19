import { ref, Ref, computed, onUnmounted } from 'vue';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { TUIRoomEngine, TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-wx';
import logger from '../../../utils/common/logger';
import TUIMessage from '../../common/base/Message/index';

export default function useEndControl() {
  const { t } = useI18n();
  enum DialogType {
    BasicDialog,
    TransferDialog
  }
  const currentDialogType = ref(DialogType.BasicDialog);

  const logPrefix = '[EndControl]';
  const roomEngine = useGetRoomEngine();
  const visible: Ref<boolean> = ref(false);
  const basicStore = useBasicStore();
  logger.log(`${logPrefix} basicStore:`, basicStore);

  const roomStore = useRoomStore();
  const { localUser, remoteAnchorList } = storeToRefs(roomStore);
  const title = computed(() => (currentDialogType.value === DialogType.BasicDialog ? t('Leave room?') : t('Select a new host')));
  const isShowLeaveRoomDialog = computed(() => (
    roomStore.isMaster && remoteAnchorList.value.length > 0)
  || !roomStore.isMaster);
  const { isSidebarOpen, sidebarName } = storeToRefs(basicStore);
  const showSideBar = computed(() => isSidebarOpen.value && sidebarName.value === 'transfer-leave');
  const selectedUser: Ref<string> = ref('');
  const showTransfer = ref(false);
  const searchName = ref('');
  const filteredList = computed(() => remoteAnchorList.value.filter(searchUser => (
    searchUser.userId.includes(searchName.value)) || (searchUser.userName?.includes(searchName.value))));
  const hasNoData = computed(() => filteredList.value.length === 0);
  const isMasterWithOneRemoteAnchor = computed(() => remoteAnchorList.value.length === 1);
  const isMasterWithRemoteAnchors = computed(() => remoteAnchorList.value.length > 0);
  const isMasterWithoutRemoteAnchors = computed(() => roomStore.isMaster && remoteAnchorList.value.length === 0);
  const showEndButtonContent = computed(() => (roomStore.isMaster ? t('EndPC') : t('Leave')));
  const showEndDialogContent = computed(() => (
    roomStore.isMaster ? (isMasterWithoutRemoteAnchors.value
      ? t('You are currently the host of the room, please choose the corresponding operation. If you choose "End Room", the current room will be disbanded and all members will be removed.')
      : t('You are currently the host of the room, please choose the corresponding operation. If you choose "End Room", the current room will be disbanded and all members will be removed. If you choose "Leave Room", the current room will not be disbanded, and your hosting privileges will be transferred to other members.')
    )
      : t('Are you sure you want to leave this room?')));
  function toggleMangeMemberSidebar() {
    if (basicStore.setSidebarOpenStatus && sidebarName.value === 'transfer-leave') {
      basicStore.setSidebarOpenStatus(false);
      basicStore.setSidebarName('');
      return;
    }

    basicStore.setSidebarOpenStatus(true);
    basicStore.setSidebarName('transfer-leave');
  }

  function handleShowMemberControl(userId: string) {
    selectedUser.value = userId;
  }

  function resetState() {
    visible.value = false;
    currentDialogType.value = DialogType.BasicDialog;
  }

  function stopMeeting() {
    if (!visible.value) {
      visible.value = true;
    }
  }

  function cancel() {
    resetState();
  }

  function closeMediaBeforeLeave() {
    if (localUser.value.hasAudioStream) {
      roomEngine.instance?.closeLocalMicrophone();
    }
    if (localUser.value.hasVideoStream) {
      roomEngine.instance?.closeLocalCamera();
    }
  }

  const onUserRoleChanged = async (eventInfo: { userId: string, userRole: TUIRole }) => {
    const { userId, userRole } = eventInfo;
    const isLocal = roomStore.localUser.userId === userId;
    const oldUserRole = roomStore.getUserRole(userId);
    if (isLocal) {
      roomStore.setLocalUser({ userRole });
    } else {
      roomStore.setRemoteUserRole(userId, userRole);
    }
    switch (userRole) {
      case TUIRole.kGeneralUser:
        if (isLocal) {
          if (roomStore?.isCameraDisableForAllUser && !roomStore.localStream.hasAudioStream) {
            roomStore.setCanControlSelfAudio(false);
          }
          if (roomStore?.isMicrophoneDisableForAllUser && !roomStore.localStream.hasVideoStream) {
            roomStore.setCanControlSelfVideo(false);
          }
          if (oldUserRole === TUIRole.kAdministrator) {
            TUIMessage({ type: 'warning', message: t('The RoomOwner has withdrawn your administrator privileges') });
          }
        }
        break;
      case TUIRole.kAdministrator:
        if (isLocal) {
          TUIMessage({ type: 'success', message: t('You are now an administrator') });
          roomStore.setCanControlSelfAudio(true);
          roomStore.setCanControlSelfVideo(true);
        }
        break;
      case TUIRole.kRoomOwner: {
        roomStore.setMasterUserId(userId);
        const transferUserName = isLocal ? t('me') : roomStore.getUserName(userId) || userId;
        TUIMessage({ type: 'success', message: `${t('Moderator changed to sb', { name: transferUserName })}` });
        if (isLocal && roomStore.isSpeakAfterTakingSeatMode && !roomStore.isAnchor) {
          await roomEngine.instance?.takeSeat({ seatIndex: -1, timeout: 0 });
        }
        break;
      }
    }
  };

  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onUserRoleChanged, onUserRoleChanged);
  });

  onUnmounted(() => {
    roomEngine.instance?.off(TUIRoomEvents.onUserRoleChanged, onUserRoleChanged);
  });
  return {
    t,
    basicStore,
    isShowLeaveRoomDialog,
    roomStore,
    roomEngine,
    localUser,
    remoteAnchorList,
    stopMeeting,
    cancel,
    selectedUser,
    showEndButtonContent,
    DialogType,
    showEndDialogContent,
    logPrefix,
    title,
    currentDialogType,
    visible,
    closeMediaBeforeLeave,
    resetState,
    searchName,
    hasNoData,
    handleShowMemberControl,
    filteredList,
    toggleMangeMemberSidebar,
    showTransfer,
    sidebarName,
    showSideBar,
    isMasterWithOneRemoteAnchor,
    isMasterWithRemoteAnchors,
  };
}
