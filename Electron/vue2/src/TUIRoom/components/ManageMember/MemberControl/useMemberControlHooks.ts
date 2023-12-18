import { computed, Ref, ref } from 'vue';
import { useI18n } from '../../../locales';
import { UserInfo, useRoomStore } from '../../../stores/room';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useBasicStore } from '../../../stores/basic';
import useMasterApplyControl from '../../../hooks/useMasterApplyControl';
import { TUIMediaDevice, TUIRole } from '@tencentcloud/tuiroom-engine-electron';
import AudioOpenIcon from '../../common/icons/AudioOpenIcon.vue';
import VideoOpenIcon from '../../common/icons/VideoOpenIcon.vue';
import ChatForbiddenIcon from '../../common/icons/ChatForbiddenIcon.vue';
import KickOutIcon from '../../common/icons/KickOutIcon.vue';
import OnStageIcon from '../../common/icons/OnStageIcon.vue';
import OffStageIcon from '../../common/icons/OffStageIcon.vue';
import TransferOwnerIcon from '../../common/icons/TransferOwnerIcon.vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message';
import { MESSAGE_DURATION } from '../../../constants/message';

export default function useMemberControl(props: any) {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const showKickOffDialog: Ref<boolean> = ref(false);
  const kickOffDialogContent = computed(() => t('whether to kick sb off the room', { name: props.userInfo.userName }));
  const { isFreeSpeakMode, isSpeakAfterTakingSeatMode } = storeToRefs(roomStore);
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
  const isAnchor = computed(() => props.userInfo.onSeat === true);
  const isAudience = computed(() => props.userInfo.onSeat !== true);

  /**
  * Control the centralized matching of elements
  *
  * Free speech mode
  * 1. Current user is the anchor.
  * Banning/unbanning Banning/unbanning drawing
  * Banning chat
  * Kicked out of the room
  *
  * Raise hand to speak mode
  * 1. Current user is the host.
  * Banning/unbanning Banning/unbanning drawing
  * Invite to step down
  * Ban chat
  * Kicked out of the room
  * 2.
  * 2. Audience did not request to be on the mic.
  * Invite on stage / Disinvite on stage * Ban chat
  * Kicked out of the room
  * 3.
  * 3. the audience is applying for the mic.
  * Agree to go on stage Deny go on stage
  * Ban chat
  * Kicked out of the room
  *
  * 控制元素的集中匹配情况
  *
  * 自由发言模式
  * 1.当前用户为主播：
  * 静音/解除静音  请求开启视频/关闭视频
  *              转交主持人
  *              停止共享
  *              禁言
  *              踢出房间
  *
  * 举手发言模式
  * 1. 当前用户为主播：
  * 禁言/解除禁言/取消解除禁言  请求开启视频/关闭视频
  *                         邀请下台
  *                         转交主持人
  *                         停止共享
  *                         禁言
  *                         踢出房间
  *
  * 2. 观众没有申请上麦：
  * 邀请上台/取消邀请上台   禁言
  *                      踢出房间
  *
  * 3. 观众正在申请上麦：
  * 同意上台      拒绝上台
  *              禁言
  *              踢出房间
  **/
  const controlList = computed(() => {
    const list = [transferOwner.value, chatControl.value, kickUser.value];
    if (isFreeSpeakMode.value) {
      list.unshift(...[audioControl.value, videoControl.value]);
    } else if (isSpeakAfterTakingSeatMode.value) {
      if (isAnchor.value) {
        list.unshift(...[audioControl.value, videoControl.value, makeOffStage.value]);
      } else if (isAudience.value) {
        if (props.userInfo.isUserApplyingToAnchor) {
          list.unshift(...[agreeOnStage.value, denyOnStage.value]);
        } else {
          list.unshift(inviteOnStage.value);
        }
      }
    }
    return list;
  });

  const audioControl = computed(() => ({
    icon: AudioOpenIcon,
    title: props.userInfo.hasAudioStream ? t('Mute') : t('Unmute'),
    func: muteUserAudio,
  }));


  const videoControl = computed(() => {
    const videoControlTitle = props.userInfo.hasVideoStream ? t('Disable video') : t('Enable video');
    return { icon: VideoOpenIcon, title: videoControlTitle, func: muteUserVideo };
  });

  const chatControl = computed(() => ({
    icon: ChatForbiddenIcon,
    title: props.userInfo.isChatMutedByMaster ? t('Enable chat') : t('Disable chat'),
    func: disableUserChat,
  }));

  const transferOwner = computed(() => ({
    icon: TransferOwnerIcon,
    title: t('Transfer owner'),
    func: handleTransferOwner,
  }));

  const kickUser = computed(() => ({
    icon: KickOutIcon,
    title: t('Kick out'),
    func: handleShowKickOffDialog,
  }));

  const inviteOnStage = computed(() => ({
    icon: AudioOpenIcon,
    title: props.userInfo.isInvitingUserToAnchor ?  t('Cancel stage') : t('Invite stage'),
    func: toggleInviteUserOnStage,
  }));

  const agreeOnStage = computed(() => ({
    icon: OnStageIcon,
    title: t('Agree to the stage'),
    func: agreeUserOnStage,
  }));

  const denyOnStage = computed(() => ({ icon: OffStageIcon, title: t('Refuse stage'), func: denyUserOnStage }));
  const makeOffStage = computed(() => ({ icon: OffStageIcon, title: t('Step down'), func: kickUserOffStage }));

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
    const currentState = userInfo.isChatMutedByMaster;
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

  return {
    props,
    isMe,
    controlList,
    showKickOffDialog,
    kickOffDialogContent,
    kickOffUser,
    handleCancelKickOffDialog,
  };
};
