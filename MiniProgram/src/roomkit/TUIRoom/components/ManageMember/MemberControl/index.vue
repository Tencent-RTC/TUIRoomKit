<template>
  <div v-if="!isMe" class="member-control-container">
    <div class="member-title">
      <img class="avatar-url" :src="userInfo.avatarUrl || defaultAvatar" />
      <div class="member-title-content">{{ userInfo.userName || userInfo.userId }}</div>
      <!-- TODO: 完善 @tap 的 .stop 修饰符 -->
      <span v-if="isWeChat" @tap.stop="handleCloseControl" class="cancel">{{ t('Cancel') }}</span>
    </div>
    <div
      v-for="item, index in controlList"
      :key="index"
      @tap="() => item.func(userInfo)"
      class="user-operate-item"
    >
      <svg-icon :icon-name="item.iconName" class="icon-svg"></svg-icon>
      <div class="control-title">{{ item.title }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../../../locales';

import { UserInfo, useRoomStore } from '../../../stores/room';
import defaultAvatar from '../../../assets/imgs/avatar.png';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useBasicStore } from '../../../stores/basic';
import SvgIcon from '../../common/SvgIcon.vue';
import useMasterApplyControl from '../../../hooks/useMasterApplyControl';
import { isWeChat } from '../../../utils/useMediaValue';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-wx';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
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

interface Props {
  userInfo: UserInfo,
}
const emit = defineEmits(['on-close-control']);
const props = defineProps<Props>();

const isMe = computed(() => basicStore.userId === props.userInfo.userId);
const isAnchor = computed(() => props.userInfo.onSeat === true);
const isAudience = computed(() => props.userInfo.onSeat !== true);
const isFreeSpeechMode = computed(() => roomStore.isFreeSpeakMode);
const isSpeakAfterTakingSeat = computed(() => roomStore.isSpeakAfterTakingSeatMode);

const requestStageTitle = computed(() => (
  isAnchor.value
    ? t('Step down')
    : props.userInfo.isInvitingUserToAnchor
      ?  t('Cancel stage')
      : t('Invite stage')
));

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

// 邀请上台 / 取消邀请上台
const toggleInviteStage = computed(() => ({ iconName: 'apply', title: requestStageTitle.value, func: toggleInviteUserOnStage }));

// 邀请下台
const makeOffStage = computed(() => ({ iconName: 'apply', title: t('Step down'), func: kickUserOffStage }));

// 同意上台
const agreeOnStage = computed(() => ({ iconName: 'apply', title: t('Agree to the stage'), func: agreeUserOnStage }));

// 拒绝上台
const denyOnStage = computed(() => ({ iconName: 'apply', title: t('Refuse stage'), func: denyUserOnStage }));

const audioControlTitle = computed(() => (
  props.userInfo.hasAudioStream
    ? t('Mute')
    : (props.userInfo.isRequestingUserOpenMic
      ? t('Cancel Unmute')
      : t('Unmute'))
));
const audioControl = computed(() => ({ iconName: 'mic-on', title: audioControlTitle.value, func: muteUserAudio }));

const videoControlTitle = computed(() => {
  if (props.userInfo.hasVideoStream) {
    return t('Disable video');
  }
  if (props.userInfo.isRequestingUserOpenCamera) {
    return t('Cancel Enable video');
  }
  return t('Enable video');
});
const videoControl = computed(() => ({ iconName: 'camera-on', title: videoControlTitle.value, func: muteUserVideo }));

const chatControlTitle = computed(() => (props.userInfo.isChatMutedByMaster ? t('Enable chat') : t('Disable chat')));
const forbidChat = computed(() => ({ iconName: 'chat', title: chatControlTitle.value, func: disableUserChat }));

const kickUser = computed(() => ({ iconName: 'invite', title: t('Kick out'), func: kickOffUser }));

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
 * 禁言/解除禁言/取消解除禁言  禁画/解除禁画/取消解除禁画
 *                         禁止聊天
 *                         踢出房间
 *
 * 举手发言模式
 * 1. 当前用户为主播：
 * 禁言/解除禁言/取消解除禁言  禁画/解除禁画/取消解除禁画
 *                         邀请下台
 *                         禁止聊天
 *                         踢出房间
 *
 * 2. 观众没有申请上麦：
 * 邀请上台/取消邀请上台   禁止聊天
 *                      踢出房间
 *
 * 3. 观众正在申请上麦：
 * 同意上台      拒绝上台
 *              禁止聊天
 *              踢出房间
**/
const controlList = computed(() => {
  const controlRelationObj = {
    freeSpeech: [audioControl.value, videoControl.value, forbidChat.value, kickUser.value],
    applySpeechAndAnchor:
      [audioControl.value, videoControl.value, makeOffStage.value, forbidChat.value, kickUser.value],
    applySpeechAndIsApplyingToAnchor: [agreeOnStage.value, denyOnStage.value, forbidChat.value, kickUser.value],
    applySpeechAndAudience: [toggleInviteStage.value, forbidChat.value, kickUser.value],
    default: [forbidChat.value, kickUser.value],
  };

  if (isFreeSpeechMode.value) {
    return controlRelationObj.freeSpeech;
  }
  if (isSpeakAfterTakingSeat.value && isAnchor.value) {
    return controlRelationObj.applySpeechAndAnchor;
  }
  if (isSpeakAfterTakingSeat.value && isAudience.value && props.userInfo.isUserApplyingToAnchor) {
    return controlRelationObj.applySpeechAndIsApplyingToAnchor;
  }
  if (isSpeakAfterTakingSeat.value && isAudience.value && !props.userInfo.isUserApplyingToAnchor) {
    return controlRelationObj.applySpeechAndAudience;
  }
  return controlRelationObj.default;
});

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
      const requestId = userInfo.requestUserOpenMicRequestId;
      requestId && await roomEngine.instance?.cancelRequest({ requestId });
      roomStore.setRequestUserOpenMic({ userId: userInfo.userId, isRequesting: false });
    } else {
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kMicrophone,
        timeout: 0,
        requestCallback: () => {
          // 处理请求超时，应答，拒绝的情况
          roomStore.setRequestUserOpenMic({ userId: userInfo.userId, isRequesting: false });
        },
      });
      if (request && request.requestId) {
        roomStore.setRequestUserOpenMic({ userId: userInfo.userId, isRequesting: true, requestId: request.requestId });
      }
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
      const requestId = userInfo.requestUserOpenCameraRequestId;
      requestId && await roomEngine.instance?.cancelRequest({ requestId });
      roomStore.setRequestUserOpenCamera({ userId: userInfo.userId, isRequesting: false });
    } else {
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
      }
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
function kickOffUser(userInfo: UserInfo) {
  roomEngine.instance?.kickRemoteUserOutOfRoom({
    userId: userInfo.userId,
  });
}

function handleCloseControl() {
  emit('on-close-control');
}
</script>

<style lang="scss" scoped>
.member-control-container {
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 2;
  padding: 22px 16px;
  background: var(--member-control-background-color-h5);
  border-radius: 15px 15px 0px 0px;
  display: flex;
  flex-direction: column !important;
  animation-duration: 100ms;
  animation-name: popup;
  @keyframes popup {
    from {
      height: 0;
    }
    to {
      height: 30%;
    }
  }
  .member-title{
    display: flex;
    flex-direction: row;
    width: 100%;
    margin-bottom: 10px;
    align-items: center;
    .avatar-url{
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    .member-title-content{
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      color: var(--member-title-content-h5);
      margin-left: 10px;
    }
  }
  .user-operate-item {
    width: 100%;
    display: flex;
    margin-top: 10px;
    align-items: center;
    .control-title {
      margin-left: 10px;
    }
  }
}
.cancel{
  flex: 1;
  text-align: end;
  padding-right: 30px
}
</style>

