import { computed, Ref, ref } from 'vue';
import { useI18n } from '../../../locales';
import { UserInfo, useRoomStore } from '../../../stores/room';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useBasicStore } from '../../../stores/basic';
import useMasterApplyControl from '../../../hooks/useMasterApplyControl';
import {
  TUIMediaDevice,
  TUIRole,
  TUIRequestCallbackType,
  TUIErrorCode,
} from '@tencentcloud/tuiroom-engine-js';
import AudioOpenIcon from '../../common/icons/AudioOpenIcon.vue';
import VideoOpenIcon from '../../common/icons/VideoOpenIcon.vue';
import ChatForbiddenIcon from '../../common/icons/ChatForbiddenIcon.vue';
import KickOutIcon from '../../common/icons/KickOutIcon.vue';
import InviteOnStageIcon from '../../common/icons/InviteOnStageIcon.vue';
import DenyOnStageIcon from '../../common/icons/DenyOnStageIcon.vue';
import OnStageIcon from '../../common/icons/OnStageIcon.vue';
import OffStageIcon from '../../common/icons/OffStageIcon.vue';
import TransferOwnerIcon from '../../common/icons/TransferOwnerIcon.vue';
import SetAdminIcon from '../../common/icons/SetAdminIcon.vue';
import RevokeAdminIcon from '../../common/icons/RevokeAdminIcon.vue';
import EditNameCardIcon from '../../common/icons/EditNameCardIcon.vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message';
import { MESSAGE_DURATION } from '../../../constants/message';
import eventBus from '../../../hooks/useMitt';
import useMemberItemHooks from '../MemberItem/useMemberItemHooks';
import { roomService } from '../../../services';
import { isMobile } from '../../../utils/environment';
import { calculateByteLength } from '../../../utils/utils';
interface ObjectType {
  [key: string]: any;
}

type ActionType = 'transferOwner' | 'kickUser' | 'changeUserNameCard' | '';
export default function useMemberControl(props?: any) {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const isDialogVisible: Ref<boolean> = ref(false);
  const isShowInput: Ref<boolean> = ref(false);
  const editorInputEle = ref();
  const editorInputEleContainer = ref();
  const tempUserName = ref(props.userInfo.nameCard || props.userInfo.userName);
  const dialogData: Ref<{
    title: string;
    content: string;
    confirmText: string;
    actionType: ActionType;
    showInput: boolean;
  }> = ref({
    title: '',
    content: '',
    confirmText: '',
    actionType: '' as ActionType,
    showInput: false,
  });
  const kickOffDialogContent = computed(() =>
    t('whether to kick sb off the room', {
      name: roomService.getDisplayName(props.userInfo),
    })
  );
  const transferOwnerTitle = computed(() =>
    t('Transfer the roomOwner to sb', {
      name: roomService.getDisplayName(props.userInfo),
    })
  );
  const {
    isFreeSpeakMode,
    isSpeakAfterTakingSeatMode,
    localUser,
    isGeneralUser,
    anchorUserList,
    maxSeatCount,
  } = storeToRefs(roomStore);
  /**
   * Functions related to the Raise Your Hand function
   **/
  const {
    agreeUserOnStage,
    denyUserOnStage,
    inviteUserOnStage,
    cancelInviteUserOnStage,
    kickUserOffStage,
  } = useMasterApplyControl();

  const { isCanOperateMySelf } = useMemberItemHooks(props.userInfo);

  const isMe = computed(() => basicStore.userId === props.userInfo.userId);
  const isTargetUserAnchor = computed(() => props.userInfo.onSeat === true);
  const isTargetUserAudience = computed(() => props.userInfo.onSeat !== true);

  const controlList = computed(() => {
    if (isCanOperateMySelf.value) {
      return [changeUserNameCard.value];
    }
    const agreeOrDenyStageList = props.userInfo.isUserApplyingToAnchor
      ? [agreeOnStage.value, denyOnStage.value]
      : [];
    const inviteStageList =
      isTargetUserAudience.value && !props.userInfo.isUserApplyingToAnchor
        ? [inviteOnStage.value]
        : [];
    const onStageControlList = isTargetUserAnchor.value
      ? [audioControl.value, videoControl.value, makeOffStage.value]
      : [];

    const controlListObj: ObjectType = {
      freeSpeak: {
        [TUIRole.kRoomOwner]: [
          audioControl.value,
          videoControl.value,
          chatControl.value,
          setOrRevokeAdmin.value,
          transferOwner.value,
          kickUser.value,
          changeUserNameCard.value,
        ],
        [TUIRole.kAdministrator]: [
          audioControl.value,
          videoControl.value,
          chatControl.value,
          changeUserNameCard.value,
        ],
      },
      speakAfterTakeSeat: {
        [TUIRole.kRoomOwner]: [
          ...inviteStageList,
          ...onStageControlList,
          ...agreeOrDenyStageList,
          setOrRevokeAdmin.value,
          transferOwner.value,
          chatControl.value,
          kickUser.value,
          changeUserNameCard.value,
        ],
        [TUIRole.kAdministrator]: [
          ...inviteStageList,
          ...onStageControlList,
          ...agreeOrDenyStageList,
          chatControl.value,
          changeUserNameCard.value,
        ],
      },
    };
    if (isFreeSpeakMode.value) {
      return (
        controlListObj.freeSpeak[
          localUser.value.userRole as keyof ObjectType
        ] || []
      );
    }
    if (isSpeakAfterTakingSeatMode.value) {
      return (
        controlListObj.speakAfterTakeSeat[
          localUser.value.userRole as keyof ObjectType
        ] || []
      );
    }
    return [];
  });

  const audioControl = computed(() => ({
    key: 'audioControl',
    icon: AudioOpenIcon,
    title: props.userInfo.hasAudioStream ? t('Mute') : t('Unmute'),
    func: muteUserAudio,
  }));

  const videoControl = computed(() => {
    const videoControlTitle = props.userInfo.hasVideoStream
      ? t('Disable video')
      : t('Enable video');
    return {
      key: 'videoControl',
      icon: VideoOpenIcon,
      title: videoControlTitle,
      func: muteUserVideo,
    };
  });

  const chatControl = computed(() => ({
    key: 'chatControl',
    icon: ChatForbiddenIcon,
    title: props.userInfo.isMessageDisabled
      ? t('Enable chat')
      : t('Disable chat'),
    func: disableUserChat,
  }));

  const transferOwner = computed(() => ({
    key: 'transferOwner',
    icon: TransferOwnerIcon,
    title: t('Make host'),
    func: () => handleOpenDialog('transferOwner'),
  }));

  const setOrRevokeAdmin = computed(() => ({
    key: 'setOrRevokeAdmin',
    icon:
      props.userInfo.userRole === TUIRole.kAdministrator
        ? RevokeAdminIcon
        : SetAdminIcon,
    title:
      props.userInfo.userRole === TUIRole.kAdministrator
        ? t('Remove administrator')
        : t('Set as administrator'),
    func: handleSetOrRevokeAdmin,
  }));

  const kickUser = computed(() => ({
    key: 'kickUser',
    icon: KickOutIcon,
    title: t('Kick out'),
    func: () => handleOpenDialog('kickUser'),
  }));

  const inviteOnStage = computed(() => ({
    key: 'inviteOnStage',
    icon: props.userInfo.isInvitingUserToAnchor
      ? DenyOnStageIcon
      : InviteOnStageIcon,
    title: props.userInfo.isInvitingUserToAnchor
      ? t('Cancel stage')
      : t('Invite stage'),
    func: toggleInviteUserOnStage,
  }));

  const agreeOnStage = computed(() => ({
    key: 'agreeOnStage',
    icon: OnStageIcon,
    title: t('Agree to the stage'),
    func: agreeUserOnStage,
  }));

  const denyOnStage = computed(() => ({
    key: 'denyOnStage',
    icon: DenyOnStageIcon,
    title: t('Refuse stage'),
    func: denyUserOnStage,
  }));
  const makeOffStage = computed(() => ({
    key: 'makeOffStage',
    icon: OffStageIcon,
    title: t('Step down'),
    func: kickUserOffStage,
  }));

  const changeUserNameCard = computed(() => ({
    key: 'changeUserNameCard',
    icon: EditNameCardIcon,
    title: t('change name'),
    func: () => handleOpenDialog('changeUserNameCard'),
  }));
  /**
   * Invitation to the stage/uninvitation to the stage
   **/
  async function toggleInviteUserOnStage(userInfo: UserInfo) {
    const { isInvitingUserToAnchor } = userInfo;
    if (isInvitingUserToAnchor) {
      cancelInviteUserOnStage(userInfo);
    } else {
      if (anchorUserList.value.length === maxSeatCount.value) {
        TUIMessage({
          type: 'warning',
          message: `${t('The stage is full')}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      inviteUserOnStage(userInfo);
    }
  }

  /**
   * Banning/Unbanning
   **/
  async function muteUserAudio(userInfo: UserInfo) {
    if (userInfo.hasAudioStream) {
      await roomEngine.instance?.closeRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kMicrophone,
      });
    } else {
      if (userInfo.isRequestingUserOpenMic) {
        TUIMessage({
          type: 'info',
          message: `${t('An invitation to open the microphone has been sent to sb.', { name: roomService.getDisplayName(userInfo) })}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kMicrophone,
        timeout: 0,
        requestCallback: (callbackInfo: {
          requestCallbackType: TUIRequestCallbackType;
          code: TUIErrorCode;
        }) => {
          roomStore.setRequestUserOpenMic({
            userId: userInfo.userId,
            isRequesting: false,
          });
          const { requestCallbackType, code } = callbackInfo;
          switch (requestCallbackType) {
            case TUIRequestCallbackType.kRequestError:
              if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
                TUIMessage({
                  type: 'warning',
                  message: t(
                    'This member has already received the same request, please try again later'
                  ),
                  duration: MESSAGE_DURATION.NORMAL,
                });
              }
              break;
          }
        },
      });
      TUIMessage({
        type: 'info',
        message: `${t('An invitation to open the microphone has been sent to sb.', { name: roomService.getDisplayName(userInfo) })}`,
        duration: MESSAGE_DURATION.NORMAL,
      });
      if (request && request.requestId) {
        roomStore.setRequestUserOpenMic({
          userId: userInfo.userId,
          isRequesting: true,
          requestId: request.requestId,
        });
      }
    }
  }

  /**
   * Banned painting/unbanned painting
   **/
  async function muteUserVideo(userInfo: UserInfo) {
    if (userInfo.hasVideoStream) {
      await roomEngine.instance?.closeRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kCamera,
      });
    } else {
      if (userInfo.isRequestingUserOpenCamera) {
        TUIMessage({
          type: 'info',
          message: `${t('An invitation to open the camera has been sent to sb.', { name: roomService.getDisplayName(userInfo) })}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kCamera,
        timeout: 0,
        requestCallback: (callbackInfo: {
          requestCallbackType: TUIRequestCallbackType;
          code: TUIErrorCode;
        }) => {
          roomStore.setRequestUserOpenCamera({
            userId: userInfo.userId,
            isRequesting: false,
          });
          const { requestCallbackType, code } = callbackInfo;
          switch (requestCallbackType) {
            case TUIRequestCallbackType.kRequestError:
              if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
                TUIMessage({
                  type: 'warning',
                  message: t(
                    'This member has already received the same request, please try again later'
                  ),
                  duration: MESSAGE_DURATION.NORMAL,
                });
              }
              break;
          }
        },
      });
      TUIMessage({
        type: 'info',
        message: `${t('An invitation to open the camera has been sent to sb.', { name: roomService.getDisplayName(userInfo) })}`,
        duration: MESSAGE_DURATION.NORMAL,
      });
      if (request && request.requestId) {
        roomStore.setRequestUserOpenCamera({
          userId: userInfo.userId,
          isRequesting: true,
          requestId: request.requestId,
        });
      }
    }
  }
  /**
   * Allow text chat / Cancel text chat
   **/
  async function disableUserChat(userInfo: UserInfo) {
    const { isMessageDisabled } = userInfo;
    try {
      await roomEngine.instance?.disableSendingMessageByAdmin({
        userId: userInfo.userId,
        isDisable: !isMessageDisabled,
      });
      roomStore.setMuteUserChat(userInfo.userId, !isMessageDisabled);
    } catch (error) {
      TUIMessage({
        type: 'error',
        message: t('Failed to disable chat'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  /**
   * Kick the user out of the room
   **/
  async function kickOffUser(userInfo: UserInfo) {
    await roomEngine.instance?.kickRemoteUserOutOfRoom({
      userId: userInfo.userId,
    });
    roomStore.removeRemoteUser(userInfo.userId);
  }

  /**
   * Transfer host to user
   */
  async function handleTransferOwner(userInfo: UserInfo) {
    const roomInfo = await roomEngine.instance?.fetchRoomInfo();
    if (roomInfo?.roomOwner === roomStore.localUser.userId) {
      try {
        if (roomStore.localUser.hasScreenStream) {
          eventBus.emit('ScreenShare:stopScreenShare');
        }
        await roomEngine.instance?.changeUserRole({
          userId: userInfo.userId,
          userRole: TUIRole.kRoomOwner,
        });
        roomStore.setMasterUserId(userInfo.userId);
        TUIMessage({
          type: 'success',
          message: t('The room owner has been transferred to sb', {
            name: roomService.getDisplayName(userInfo),
          }),
          duration: MESSAGE_DURATION.NORMAL,
        });
      } catch (error) {
        TUIMessage({
          type: 'error',
          message: t('Make host failed, please try again.'),
          duration: MESSAGE_DURATION.NORMAL,
        });
      }
    }
  }

  /**
   * Set/Remove administrator permissions
   */
  async function handleSetOrRevokeAdmin(userInfo: UserInfo) {
    const newRole =
      userInfo.userRole === TUIRole.kGeneralUser
        ? TUIRole.kAdministrator
        : TUIRole.kGeneralUser;
    await roomEngine.instance?.changeUserRole({
      userId: userInfo.userId,
      userRole: newRole,
    });
    const updatedUserName = roomStore.getUserName(userInfo.userId);
    const tipMessage =
      newRole === TUIRole.kAdministrator
        ? `${t('sb has been set as administrator', { name: updatedUserName })}`
        : `${t('The administrator status of sb has been withdrawn', { name: updatedUserName })}`;
    TUIMessage({ type: 'success', message: tipMessage });
    roomStore.setRemoteUserRole(userInfo.userId, newRole);
    if (newRole === TUIRole.kGeneralUser && userInfo.hasScreenStream) {
      await roomEngine.instance?.closeRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kScreen,
      });
    }
  }

  function handleOpenDialog(action: string) {
    switch (action) {
      case 'kickUser':
        isDialogVisible.value = true;
        dialogData.value = {
          title: t('Note'),
          content: kickOffDialogContent.value,
          confirmText: t('Confirm'),
          actionType: action,
          showInput: false,
        };
        break;
      case 'transferOwner':
        isDialogVisible.value = true;
        dialogData.value = {
          title: transferOwnerTitle.value,
          content: t(
            'After transfer the room owner, you will become a general user'
          ),
          confirmText: t('Confirm transfer'),
          actionType: action,
          showInput: false,
        };
        break;
      case 'changeUserNameCard':
        if (isMobile) {
          isShowInput.value = true;
          document?.body?.appendChild(editorInputEleContainer.value);
        } else {
          isDialogVisible.value = true;
        }
        dialogData.value = {
          title: t('change name'),
          content: '',
          confirmText: t('Confirm'),
          actionType: action,
          showInput: true,
        };
        break;
    }
  }

  const nameCardCheck = () => {
    const result = calculateByteLength(tempUserName.value) <= 32;
    !result &&
      TUIMessage({
        type: 'warning',
        message: t('The user name cannot exceed 32 characters'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    return result;
  };

  /**
   * change UserNameCard
   */
  async function handleChangeUserNameCard(userInfo: UserInfo) {
    if (!nameCardCheck()) return;
    try {
      await roomEngine.instance?.changeUserNameCard({
        userId: userInfo.userId,
        nameCard: tempUserName.value,
      });
      TUIMessage({
        type: 'success',
        message: t('Name changed successfully'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    } catch (error) {
      TUIMessage({
        type: 'error',
        message: t('change name failed, please try again.'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  function handleAction(userInfo: UserInfo) {
    switch (dialogData.value.actionType) {
      case 'kickUser':
        kickOffUser(userInfo);
        break;
      case 'transferOwner':
        handleTransferOwner(userInfo);
        break;
      case 'changeUserNameCard':
        handleChangeUserNameCard(userInfo);
        isShowInput.value = false;
    }
    isDialogVisible.value = false;
  }

  function handleCancelDialog() {
    tempUserName.value = props.userInfo.nameCard || props.userInfo.userName;
    isDialogVisible.value = false;
  }

  return {
    props,
    isMe,
    isGeneralUser,
    controlList,
    kickOffDialogContent,
    handleCancelDialog,
    handleAction,
    isDialogVisible,
    dialogData,
    tempUserName,
    isShowInput,
    editorInputEle,
    editorInputEleContainer,
  };
}
