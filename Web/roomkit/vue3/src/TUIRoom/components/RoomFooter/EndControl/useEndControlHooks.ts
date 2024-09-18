import { ref, Ref, computed, onUnmounted } from 'vue';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore, UserInfo } from '../../../stores/room';
import { useChatStore } from '../../../stores/chat';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import TUIRoomEngine, {
  TUIRole,
  TUIRoomEvents,
} from '@tencentcloud/tuiroom-engine-js';
import logger from '../../../utils/common/logger';
import TUIMessage from '../../common/base/Message/index';
import { roomService } from '../../../services';

export default function useEndControl() {
  const { t } = useI18n();
  enum DialogType {
    BasicDialog,
    TransferDialog,
  }
  const currentDialogType = ref(DialogType.BasicDialog);

  const logPrefix = '[EndControl]';
  const roomEngine = useGetRoomEngine();
  const visible: Ref<boolean> = ref(false);
  const basicStore = useBasicStore();
  const chatStore = useChatStore();
  logger.log(`${logPrefix} basicStore:`, basicStore);

  const roomStore = useRoomStore();
  const { localUser, remoteEnteredUserList, applyToAnchorList } =
    storeToRefs(roomStore);
  const title = computed(() =>
    currentDialogType.value === DialogType.BasicDialog
      ? t('Leave room?')
      : t('Select a new host')
  );
  const isShowLeaveRoomDialog = computed(
    () =>
      (roomStore.isMaster && remoteEnteredUserList.value.length > 0) ||
      !roomStore.isMaster
  );
  const { isSidebarOpen, sidebarName } = storeToRefs(basicStore);
  const showSideBar = computed(
    () => isSidebarOpen.value && sidebarName.value === 'transfer-leave'
  );
  const selectedUser: Ref<string> = ref('');
  const showTransfer = ref(false);
  const searchName = ref('');
  const filteredList = computed(() =>
    remoteEnteredUserList.value.filter(
      searchUser =>
        searchUser.nameCard?.includes(searchName.value) ||
        searchUser.userId.includes(searchName.value) ||
        searchUser.userName?.includes(searchName.value)
    )
  );
  const hasNoData = computed(() => filteredList.value.length === 0);
  const isMasterWithOneRemoteUser = computed(
    () => remoteEnteredUserList.value.length === 1
  );
  const isMasterWithRemoteUser = computed(
    () => remoteEnteredUserList.value.length > 0
  );
  const isMasterWithoutRemoteUser = computed(
    () => roomStore.isMaster && remoteEnteredUserList.value.length === 0
  );
  const showEndButtonContent = computed(() =>
    roomStore.isMaster ? t('EndPC') : t('Leave')
  );
  const showEndDialogContent = computed(() =>
    roomStore.isMaster
      ? isMasterWithoutRemoteUser.value
        ? t(
            'You are currently the host of the room, please choose the corresponding operation. If you choose "End Room", the current room will be disbanded and all members will be removed.'
          )
        : t(
            'You are currently the host of the room, please choose the corresponding operation. If you choose "End Room", the current room will be disbanded and all members will be removed. If you choose "Leave Room", the current room will not be disbanded, and your hosting privileges will be transferred to other members.'
          )
      : t('Are you sure you want to leave this room?')
  );
  function toggleMangeMemberSidebar() {
    if (
      basicStore.setSidebarOpenStatus &&
      sidebarName.value === 'transfer-leave'
    ) {
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

  async function handleUpdateSeatApplicationList() {
    if (!roomStore.isSpeakAfterTakingSeatMode) {
      return;
    }
    if (applyToAnchorList.value.length > 0) {
      applyToAnchorList.value.forEach((user: UserInfo) => {
        user.applyToAnchorRequestId &&
          roomStore.removeApplyToAnchorUser(user.applyToAnchorRequestId);
      });
    }
    const applicationList = await roomEngine.instance?.getSeatApplicationList();
    if (applicationList && applicationList.length > 0) {
      for (const applicationInfo of applicationList) {
        const { userId, requestId, timestamp } = applicationInfo;
        roomStore.addApplyToAnchorUser({ userId, requestId, timestamp });
      }
    }
  }

  const onUserRoleChanged = async (eventInfo: {
    userId: string;
    userRole: TUIRole;
  }) => {
    const { userId, userRole } = eventInfo;
    const isLocal = roomStore.localUser.userId === userId;
    const oldUserRole = roomStore.getUserRole(userId);
    roomStore.updateUserInfo({ userId, userRole });
    switch (userRole) {
      case TUIRole.kGeneralUser:
        if (isLocal) {
          if (
            roomStore?.isMicrophoneDisableForAllUser &&
            !roomStore.localStream.hasAudioStream
          ) {
            roomStore.setCanControlSelfAudio(false);
          }
          if (
            roomStore?.isCameraDisableForAllUser &&
            !roomStore.localStream.hasVideoStream
          ) {
            roomStore.setCanControlSelfVideo(false);
          }
          if (oldUserRole === TUIRole.kAdministrator) {
            TUIMessage({
              type: 'warning',
              message: t('Your administrator status has been revoked'),
            });
          }
          if (roomStore.localStream.hasAudioStream) {
            roomStore.setCanControlSelfAudio(true);
          }
          if (roomStore.localStream.hasVideoStream) {
            roomStore.setCanControlSelfVideo(true);
          }
        }
        break;
      case TUIRole.kAdministrator:
        if (isLocal) {
          TUIMessage({
            type: 'success',
            message: t('You have become a administrator'),
          });
          roomStore.setCanControlSelfAudio(true);
          roomStore.setCanControlSelfVideo(true);
          if (roomStore.isSpeakAfterTakingSeatMode) {
            handleUpdateSeatApplicationList();
          }
        }
        break;
      case TUIRole.kRoomOwner: {
        roomStore.setMasterUserId(userId);
        if (isLocal) {
          TUIMessage({
            type: 'success',
            message: `${t('You are now a room owner')}`,
          });
          if (roomStore.isSpeakAfterTakingSeatMode) {
            if (!roomStore.isAnchor) {
              await roomEngine.instance?.takeSeat({
                seatIndex: -1,
                timeout: 0,
              });
            }
            handleUpdateSeatApplicationList();
          }
          if (chatStore.isMessageDisabled) {
            roomEngine.instance?.disableSendingMessageByAdmin({
              userId,
              isDisable: false,
            });
          }
        }
        break;
      }
    }
  };

  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onUserRoleChanged, onUserRoleChanged);
  });
  const handleMount = () => {
    const { userRole } = roomService.roomStore.localUser;
    if (
      userRole === TUIRole.kRoomOwner ||
      userRole === TUIRole.kAdministrator
    ) {
      handleUpdateSeatApplicationList();
    }
  };
  roomService.lifeCycleManager.on('mount', handleMount);
  onUnmounted(() => {
    roomEngine.instance?.off(
      TUIRoomEvents.onUserRoleChanged,
      onUserRoleChanged
    );
    roomService.lifeCycleManager.off('mount', handleMount);
  });
  return {
    t,
    basicStore,
    isShowLeaveRoomDialog,
    roomStore,
    roomEngine,
    localUser,
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
    isMasterWithOneRemoteUser,
    isMasterWithRemoteUser,
    remoteEnteredUserList,
  };
}
