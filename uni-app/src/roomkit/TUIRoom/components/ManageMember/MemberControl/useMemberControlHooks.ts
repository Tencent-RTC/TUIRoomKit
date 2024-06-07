import { computed, Ref, ref } from 'vue';
import { useI18n } from '../../../locales';
import { UserInfo, useRoomStore } from '../../../stores/room';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useBasicStore } from '../../../stores/basic';
import useMasterApplyControl from '../../../hooks/useMasterApplyControl';
import { TUIMediaDevice, TUIRole, TUIRequestCallbackType, TUIErrorCode } from '@tencentcloud/tuiroom-engine-uniapp-app';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message';
import { MESSAGE_DURATION } from '../../../constants/message';

interface ObjectType {
  [key: string]: any;
}

type ActionType = 'transferOwner' | 'kickUser' | '';
export default function useMemberControl(props?: any) {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const isDialogVisible: Ref<boolean> = ref(false);
  const dialogData: Ref<{ title: string; content: string; confirmText: string; actionType: ActionType }> = ref({
    title: '',
    content: '',
    confirmText: '',
    actionType: '' as ActionType,
  });
  const kickOffDialogContent = computed(() => t('whether to kick sb off the room', { name: props.userInfo.userName || props.userInfo.userId }));
  const transferOwnerTitle = computed(() => t('Transfer the roomOwner to sb', { name: props.userInfo.userName || props.userInfo.userId }));
  const { isFreeSpeakMode, isSpeakAfterTakingSeatMode, localUser, isGeneralUser } = storeToRefs(roomStore);
  /**
   * Functions related to the Raise Your Hand function
   *
   * 举手发言功能相关函数
  **/
  const {
    agreeUserOnStage,
    denyUserOnStage,
    inviteUserOnStage,
    cancelInviteUserOnStage,
    kickUserOffStage,
  } = useMasterApplyControl();

  const isMe = computed(() => basicStore.userId === props.userInfo.userId);
  const isTargetUserAnchor = computed(() => props.userInfo.onSeat === true);
  const isTargetUserAudience = computed(() => props.userInfo.onSeat !== true);

  const controlList = computed(() => {
    const agreeOrDenyStageList = props.userInfo.isUserApplyingToAnchor ? [agreeOnStage.value, denyOnStage.value] : [];
    const inviteStageList = isTargetUserAudience.value && !props.userInfo.isUserApplyingToAnchor
      ? [inviteOnStage.value] : [];
    const onStageControlList = isTargetUserAnchor.value
      ? [audioControl.value, videoControl.value, makeOffStage.value] : [];

    const controlListObj: ObjectType = {
      freeSpeak: {
        [TUIRole.kRoomOwner]: [
          audioControl.value, videoControl.value,
          setOrRevokeAdmin.value, transferOwner.value, kickUser.value,
        ],
        [TUIRole.kAdministrator]: [
          audioControl.value, videoControl.value,
        ],
      },
      speakAfterTakeSeat: {
        [TUIRole.kRoomOwner]: [
          ...inviteStageList, ...onStageControlList, ...agreeOrDenyStageList,
          setOrRevokeAdmin.value, transferOwner.value,
          kickUser.value,
        ],
        [TUIRole.kAdministrator]: [
          ...inviteStageList, ...onStageControlList, ...agreeOrDenyStageList,
        ],
      },
    };
    if (isFreeSpeakMode.value) {
      return controlListObj.freeSpeak[localUser.value.userRole as keyof ObjectType] || [];
    }
    if (isSpeakAfterTakingSeatMode.value) {
      return controlListObj.speakAfterTakeSeat[localUser.value.userRole as keyof ObjectType] || [];
    }
    return [];
  });

  const audioControl = computed(() => ({
    key: 'audioControl',
    icon: 'AudioOpenIcon',
    title: props.userInfo.hasAudioStream ? t('Mute') : t('Unmute'),
    func: muteUserAudio,
  }));


  const videoControl = computed(() => {
    const videoControlTitle = props.userInfo.hasVideoStream ? t('Disable video') : t('Enable video');
    return { key: 'videoControl', icon: 'VideoOpenIcon', title: videoControlTitle, func: muteUserVideo };
  });

  // const chatControl = computed(() => ({
  //   key: 'chatControl',
  //   icon: 'ChatForbiddenIcon',
  //   title: props.userInfo.isChatMutedByMasterOrAdmin ? t('Enable chat') : t('Disable chat'),
  //   func: disableUserChat,
  // }));

  const transferOwner = computed(() => ({
    key: 'transferOwner',
    icon: 'TransferOwnerIcon',
    title: t('Transfer owner'),
    func: () => handleOpenDialog('transferOwner'),
  }));

  const setOrRevokeAdmin = computed(() => ({
    key: 'setOrRevokeAdmin',
    icon: props.userInfo.userRole === TUIRole.kAdministrator ?  'RevokeAdminIcon' : 'SetAdminIcon',
    title: props.userInfo.userRole === TUIRole.kAdministrator ? t('Revoke administrator') : t('Set as administrator'),
    func: handleSetOrRevokeAdmin,
  }));

  const kickUser = computed(() => ({
    key: 'kickUser',
    icon: 'KickOutIcon',
    title: t('Kick out'),
    func: () => handleOpenDialog('kickUser'),
  }));

  const inviteOnStage = computed(() => ({
    key: 'inviteOnStage',
    icon: props.userInfo.isInvitingUserToAnchor ? 'DenyOnStageIcon' : 'InviteOnStageIcon',
    title: props.userInfo.isInvitingUserToAnchor ?  t('Cancel stage') : t('Invite stage'),
    func: toggleInviteUserOnStage,
  }));

  const agreeOnStage = computed(() => ({
    key: 'agreeOnStage',
    icon: 'OnStageIcon',
    title: t('Agree to the stage'),
    func: agreeUserOnStage,
  }));

  const denyOnStage = computed(() => ({ key: 'denyOnStage', icon: 'DenyOnStageIcon', title: t('Refuse stage'), func: denyUserOnStage }));
  const makeOffStage = computed(() => ({ key: 'makeOffStage', icon: 'OffStageIcon', title: t('Step down'), func: kickUserOffStage }));
  /**
   * Invitation to the stage/uninvitation to the stage
   *
   * 邀请上台/取消邀请上台
  **/
  async function toggleInviteUserOnStage(userInfo: UserInfo) {
    const { isInvitingUserToAnchor } = userInfo;
    if (isInvitingUserToAnchor) {
      cancelInviteUserOnStage(userInfo);
    } else {
      inviteUserOnStage(userInfo);
    }
  }

  /**
   * Banning/Unbanning
   *
   * 禁麦/邀请打开麦克风
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
          message: `${t('An invitation to open the microphone has been sent to sb.', { name: userInfo.userName || userInfo.userId })}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kMicrophone,
        timeout: 0,
        requestCallback: (callbackInfo: { requestCallbackType: TUIRequestCallbackType, code: TUIErrorCode }) => {
          roomStore.setRequestUserOpenMic({ userId: userInfo.userId, isRequesting: false });
          const { requestCallbackType, code } = callbackInfo;
          switch (requestCallbackType) {
            case TUIRequestCallbackType.kRequestError:
              if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
                TUIMessage({
                  type: 'warning',
                  message: t('This member has already received the same request, please try again later'),
                  duration: MESSAGE_DURATION.NORMAL,
                });
              }
              break;
          }
        },
      });
      TUIMessage({
        type: 'info',
        message: `${t('An invitation to open the microphone has been sent to sb.', { name: userInfo.userName || userInfo.userId })}`,
        duration: MESSAGE_DURATION.NORMAL,
      });
      if (request && request.requestId) {
        roomStore.setRequestUserOpenMic({ userId: userInfo.userId, isRequesting: true, requestId: request.requestId });
      }
    }
  }

  /**
   * Banned painting/unbanned painting
   *
   * 禁画/取消禁画
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
          message: `${t('An invitation to open the camera has been sent to sb.', { name: userInfo.userName || userInfo.userId })}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kCamera,
        timeout: 0,
        requestCallback: (callbackInfo: { requestCallbackType: TUIRequestCallbackType, code: TUIErrorCode }) => {
          roomStore.setRequestUserOpenCamera({ userId: userInfo.userId, isRequesting: false });
          const { requestCallbackType, code } = callbackInfo;
          switch (requestCallbackType) {
            case TUIRequestCallbackType.kRequestError:
              if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
                TUIMessage({
                  type: 'warning',
                  message: t('This member has already received the same request, please try again later'),
                  duration: MESSAGE_DURATION.NORMAL,
                });
              }
              break;
          }
        },
      });
      TUIMessage({
        type: 'info',
        message: `${t('An invitation to open the camera has been sent to sb.', { name: userInfo.userName || userInfo.userId })}`,
        duration: MESSAGE_DURATION.NORMAL,
      });
      if (request && request.requestId) {
        roomStore.setRequestUserOpenCamera({ userId: userInfo.userId, isRequesting: true, requestId: request.requestId });
      }
    }
  }
  /**
   * Allow text chat / Cancel text chat
   *
   * 允许文字聊天/取消文字聊天
  **/
  function disableUserChat(userInfo: UserInfo) {
    const currentState = userInfo.isChatMutedByMasterOrAdmin;
    roomStore.setMuteUserChat(userInfo.userId, !currentState);
    roomEngine.instance?.disableSendingMessageByAdmin({
      userId: userInfo.userId,
      isDisable: !currentState,
    });
  }

  /**
   * Kick the user out of the room
   *
   * 将用户踢出房间
  **/
  async function kickOffUser(userInfo: UserInfo) {
    await roomEngine.instance?.kickRemoteUserOutOfRoom({
      userId: userInfo.userId,
    });
  }

  /**
   * 转移房主给用户
   */
  async function handleTransferOwner(userInfo: UserInfo) {
    const roomInfo = await roomEngine.instance?.fetchRoomInfo();
    if (roomInfo?.roomOwner === roomStore.localUser.userId) {
      try {
        await roomEngine.instance?.changeUserRole({
          userId: userInfo.userId,
          userRole: TUIRole.kRoomOwner,
        });
        roomStore.setMasterUserId(userInfo.userId);
        TUIMessage({
          type: 'success',
          message: t('The room owner has been transferred to sb', { name: userInfo.userName || userInfo.userId }),
          duration: MESSAGE_DURATION.NORMAL,
        });
      } catch (error) {
        TUIMessage({
          type: 'error',
          message: t('Transfer owner failed, please try again.'),
          duration: MESSAGE_DURATION.NORMAL,
        });
      }
    }
  }

  /**
   * 设置/撤销管理员权限
   */
  async function handleSetOrRevokeAdmin(userInfo: UserInfo) {
    const newRole = userInfo.userRole === TUIRole.kGeneralUser ? TUIRole.kAdministrator : TUIRole.kGeneralUser;
    await roomEngine.instance?.changeUserRole({
      userId: userInfo.userId,
      userRole: newRole,
    });
    const updatedUserName = roomStore.getUserName(userInfo.userId);
    const tipMessage = newRole === TUIRole.kAdministrator
      ? `${t('sb has been set as administrator', { name: updatedUserName })}`
      : `${t('The administrator status of sb has been withdrawn', { name: updatedUserName })}`;
    TUIMessage({ type: 'success', message: tipMessage });
    roomStore.setRemoteUserRole(userInfo.userId, newRole);
  }

  function handleOpenDialog(action: string) {
    isDialogVisible.value = true;
    switch (action) {
      case 'kickUser':
        dialogData.value = {
          title: t('Note'),
          content: kickOffDialogContent.value,
          confirmText: t('Confirm'),
          actionType: action,
        };
        break;
      case 'transferOwner':
        dialogData.value = {
          title: transferOwnerTitle.value,
          content: t('After transfer the room owner, you will become a general user'),
          confirmText: t('Confirm transfer'),
          actionType: action,
        };
        break;
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
    } isDialogVisible.value = false;
  }

  function handleCancelDialog() {
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
  };
};
