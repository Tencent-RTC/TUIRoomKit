import { computed, Ref, ref } from 'vue';
import { useI18n } from '../../../locales';
import { UserInfo, useRoomStore } from '../../../stores/room';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useBasicStore } from '../../../stores/basic';
import useMasterApplyControl from '../../../hooks/useMasterApplyControl';
import { TUIMediaDevice, TUIRole, TUISpeechMode, TUIRequestAction } from '@tencentcloud/tuiroom-engine-wx';
import AudioOpenIcon from '../../../assets/icons/AudioOpenIcon.svg';
import VideoOpenIcon from '../../../assets/icons/VideoOpenIcon.svg';
import ChatForbiddenIcon from '../../../assets/icons/ChatForbiddenIcon.svg';
import KickOutIcon from '../../../assets/icons/KickOutIcon.svg';
import OnStageIcon from '../../../assets/icons/OnStageIcon.svg';
import OffStageIcon from '../../../assets/icons/OffStageIcon.svg';
import TransferOwnerIcon from '../../../assets/icons/TransferOwnerIcon.svg';
import SetAdminIcon from '../../../assets/icons/SetAdminIcon.svg';
import RevokeAdminIcon from '../../../assets/icons/RevokeAdminIcon.svg';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message';
import { MESSAGE_DURATION } from '../../../constants/message';

interface ObjectType {
  [key: number]: any;
}

export default function useMemberControl(props?: any) {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const showKickOffDialog: Ref<boolean> = ref(false);
  const kickOffDialogContent = computed(() => t('whether to kick sb off the room', { name: props.userInfo.userName }));
  const { speechMode, localUser, isGeneralUser, isSpeakAfterTakingSeatMode } = storeToRefs(roomStore);
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
      [TUISpeechMode.kFreeToSpeak]: {
        [TUIRole.kRoomOwner]: [audioControl.value, videoControl.value, chatControl.value,
          setOrRevokeAdmin.value, transferOwner.value, kickUser.value],
        [TUIRole.kAdministrator]: [audioControl.value, videoControl.value, chatControl.value],
      },
      [TUISpeechMode.kSpeakAfterTakingSeat]: {
        [TUIRole.kRoomOwner]: [...inviteStageList, ...onStageControlList, ...agreeOrDenyStageList,
          setOrRevokeAdmin.value, transferOwner.value, chatControl.value, kickUser.value],
        [TUIRole.kAdministrator]: [...inviteStageList, ...onStageControlList, ...agreeOrDenyStageList,
          chatControl.value],
      },
    };
    return controlListObj[speechMode.value as keyof ObjectType][localUser.value.userRole as keyof ObjectType] || [];
  });

  const audioControl = computed(() => ({
    key: 'audioControl',
    icon: AudioOpenIcon,
    title: props.userInfo.hasAudioStream ? t('Mute') : t('Unmute'),
    func: muteUserAudio,
  }));


  const videoControl = computed(() => {
    const videoControlTitle = props.userInfo.hasVideoStream ? t('Disable video') : t('Enable video');
    return { key: 'videoControl', icon: VideoOpenIcon, title: videoControlTitle, func: muteUserVideo };
  });

  const chatControl = computed(() => ({
    key: 'chatControl',
    icon: ChatForbiddenIcon,
    title: props.userInfo.isChatMutedByMasterOrAdmin ? t('Enable chat') : t('Disable chat'),
    func: disableUserChat,
  }));

  const transferOwner = computed(() => ({
    key: 'transferOwner',
    icon: TransferOwnerIcon,
    title: t('Transfer owner'),
    func: handleTransferOwner,
  }));

  const setOrRevokeAdmin = computed(() => ({
    key: 'setOrRevokeAdmin',
    icon: props.userInfo.userRole === TUIRole.kAdministrator ?  RevokeAdminIcon : SetAdminIcon,
    title: props.userInfo.userRole === TUIRole.kAdministrator ? t('Revoke administrator') : t('Set as administrator'),
    func: handleSetOrRevokeAdmin,
  }));

  const kickUser = computed(() => ({
    key: 'kickUser',
    icon: KickOutIcon,
    title: t('Kick out'),
    func: handleShowKickOffDialog,
  }));

  const inviteOnStage = computed(() => ({
    key: 'inviteOnStage',
    icon: AudioOpenIcon,
    title: props.userInfo.isInvitingUserToAnchor ?  t('Cancel stage') : t('Invite stage'),
    func: toggleInviteUserOnStage,
  }));

  const agreeOnStage = computed(() => ({
    key: 'agreeOnStage',
    icon: OnStageIcon,
    title: t('Agree to the stage'),
    func: agreeUserOnStage,
  }));

  const denyOnStage = computed(() => ({ key: 'denyOnStage', icon: OffStageIcon, title: t('Refuse stage'), func: denyUserOnStage }));
  const makeOffStage = computed(() => ({ key: 'makeOffStage', icon: OffStageIcon, title: t('Step down'), func: kickUserOffStage }));
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
        return;
      }
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kMicrophone,
        timeout: 0,
        requestCallback: () => {
          // 处理请求超时，应答，拒绝的情况
          roomStore.setRequestUserOpenMic({ userId: userInfo.userId, isRequesting: false });
        },
      });
      TUIMessage({
        type: 'info',
        message: `${t('An invitation to open the microphone has been sent to sb.', { name: userInfo.userName })}`,
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
        return;
      }
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kCamera,
        timeout: 0,
        requestCallback: () => {
          // 处理请求超时，应答，拒绝的情况
          roomStore.setRequestUserOpenCamera({ userId: userInfo.userId, isRequesting: false });
        },
      });
      if (request && request.requestId) {
        roomStore.setRequestUserOpenCamera({
          userId: userInfo.userId,
          isRequesting: true,
          requestId: request.requestId,
        });
        TUIMessage({
          type: 'info',
          message: `${t('An invitation to open the camera has been sent to sb.', { name: userInfo.userName })}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
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
  function handleShowKickOffDialog() {
    showKickOffDialog.value = true;
  }
  function handleCancelKickOffDialog() {
    showKickOffDialog.value = false;
  }
  async function kickOffUser(userInfo: UserInfo) {
    await roomEngine.instance?.kickRemoteUserOutOfRoom({
      userId: userInfo.userId,
    });
    showKickOffDialog.value = false;
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
        if (isSpeakAfterTakingSeatMode.value) {
          await roomEngine.instance?.leaveSeat();
        }
        roomStore.setMasterUserId(userInfo.userId);
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
    const action = newRole === TUIRole.kAdministrator ? 'Set' : 'Revoked';
    const tipMessage = `${t(`${action} the administrator role of sb`, { name: updatedUserName })}`;
    TUIMessage({ type: 'success', message: tipMessage });
    roomStore.setRemoteUserRole(userInfo.userId, newRole);
  }

  function getRequestIdList(requestType: TUIRequestAction) {
    const items = roomStore.requestObj[requestType] || [];
    return items.map(item => item.requestId);
  }

  function getRequestFirstUserId(requestType: TUIRequestAction) {
    const items = roomStore.requestObj[requestType] || [];
    return items.length > 0 ? items[0].userId : null;
  }

  return {
    props,
    isMe,
    isGeneralUser,
    controlList,
    showKickOffDialog,
    kickOffDialogContent,
    kickOffUser,
    handleCancelKickOffDialog,
    getRequestIdList,
    getRequestFirstUserId,
  };
};
