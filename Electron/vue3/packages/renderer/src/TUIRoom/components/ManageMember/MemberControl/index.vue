<template>
  <div v-if="!isMe" class="member-control-container">
    <Button class="button" size="default" @click="singleControl.func(userInfo)">
      {{ singleControl.title }}
    </Button>
    <div ref="moreBtnRef" class="more-container">
      <Button class="button" type="primary" @click="toggleClickMoreBtn">
        {{ t('More') }}
        <svg-icon
          size="12"
          :class="['more-arrow', showMoreControl ? 'up' : 'down']"
          :icon="ArrowUpIcon"
        />
      </Button>
      <div
        v-show="showMoreControl"
        id="operate-list"
        ref="operateListRef"
        :class="['user-operate-list', 'tui-theme-white', dropdownClass ]"
      >
        <div
          v-for="item, index in controlList"
          :key="index"
          class="user-operate-item"
          @click="item.func(userInfo)"
        >
          <svg-icon :icon="item.icon"></svg-icon>
          <span class="operate-text">{{ item.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from '../../../locales';
import { UserInfo, useRoomStore } from '../../../stores/room';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useBasicStore } from '../../../stores/basic';
import useMasterApplyControl from '../../../hooks/useMasterApplyControl';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-electron';
import Button from '../../common/base/Button.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import ArrowUpIcon from '../../common/icons/ArrowUpIcon.vue';
import AudioOpenIcon from '../../common/icons/AudioOpenIcon.vue';
import VideoOpenIcon from '../../common/icons/VideoOpenIcon.vue';
import ChatForbiddenIcon from '../../common/icons/ChatForbiddenIcon.vue';
import KickOutIcon from '../../common/icons/KickOutIcon.vue';
import OnStageIcon from '../../common/icons/OnStageIcon.vue';
import OffStageIcon from '../../common/icons/OffStageIcon.vue';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const dropdownClass = ref('down');
const moreBtnRef = ref();
const operateListRef = ref();
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
  showMemberControl: boolean,
}

const props = defineProps<Props>();

watch(() => props.showMemberControl, (val) => {
  if (!val) {
    showMoreControl.value = false;
  }
});

const showMoreControl = ref(false);
const isMe = computed(() => basicStore.userId === props.userInfo.userId);
const isAnchor = computed(() => props.userInfo.onSeat === true);
const isAudience = computed(() => props.userInfo.onSeat !== true);
const isFreeSpeechMode = computed(() => roomStore.isFreeSpeakMode);
const isSpeakAfterTakingSeat = computed(() => roomStore.isSpeakAfterTakingSeatMode);
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

// todo: 房间内移交主持人
// const transferOwner = computed(() => ({
//   icon: UserStrokeIcon,
//   title: t('Transfer owner'),
//   func: handleTransferOwner,
// }));

const kickUser = computed(() => ({
  icon: KickOutIcon,
  title: t('Kick out'),
  func: kickOffUser,
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

const singleControl = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let control = { title: '', func: (userInfo: UserInfo) => {} };
  if (isFreeSpeechMode.value) {
    control = audioControl.value;
  } else if (isSpeakAfterTakingSeat.value) {
    if (isAnchor.value) {
      control = audioControl.value;
    } else if (isAudience.value) {
      if (props.userInfo.isUserApplyingToAnchor) {
        control = agreeOnStage.value;
      } else {
        control = inviteOnStage.value;
      }
    }
  }
  return control;
});

const controlList = computed(() => {
  const list = [chatControl.value, kickUser.value];
  if (isFreeSpeechMode.value) {
    list.unshift(videoControl.value);
  }
  if (isAnchor.value && isSpeakAfterTakingSeat.value) {
    list.unshift(videoControl.value);
    list.splice(1, 0, makeOffStage.value);
  }
  if (isAudience.value && props.userInfo.isUserApplyingToAnchor) {
    list.splice(0, 0, denyOnStage.value);
  }
  return list;
});

function toggleClickMoreBtn() {
  if (showMoreControl.value) {
    showMoreControl.value = false;
  } else {
    handleDropDownPosition();
    showMoreControl.value = true;
  }
}

// 根据页面位置确定下拉框的定位
function handleDropDownPosition() {
  const { top, bottom } = moreBtnRef.value?.getBoundingClientRect();
  const containerBottom = document.getElementById('memberListContainer')?.getBoundingClientRect()?.bottom;
  if (!containerBottom) {
    return;
  }
  const bottomSize = containerBottom - bottom;
  let dropDownContainerHeight = 0;
  if (!showMoreControl.value) {
    operateListRef.value.style = 'display:block;position:absolute;z-index:-1000';
    dropDownContainerHeight = operateListRef.value.offsetHeight;
    operateListRef.value.style = '';
  } else {
    dropDownContainerHeight = operateListRef.value?.offsetHeight;
  }
  if (bottomSize < top && bottomSize < dropDownContainerHeight) {
    dropdownClass.value = 'up';
  }
}

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

/**
 * 转移房主给用户
 */
// function handleTransferOwner(userInfo: UserInfo) {
//   roomEngine.instance?.changeUserRole({
//     userId: userInfo.userId,
//     userRole: TUIRole.kRoomOwner,
//   });
// }

</script>

<style lang="scss" scoped>

.tui-theme-black .user-operate-list {
  --operation-font-color: var(--font-color-1);
  --operation-box-shadow: 0px 3px 8px rgba(34, 38, 46, 0.30), 0px 6px 40px rgba(34, 38, 46, 0.30);
}

.tui-theme-white .user-operate-list {
  --operation-font-color: #6B758A;
  --operation-box-shadow: 0px 3px 8px #E9F0FB, 0px 6px 40px rgba(0, 0, 0, 0.10);
}

.member-control-container {
  display: flex;
  flex-direction: row;
  .button {
    height: 32px;
    padding: 0 10px;
    margin-left: 10px;
    .more-arrow {
      margin-left: 2px;
      &.down {
        transform: rotate(180deg);
      }
    }
  }
  .more-container {
    position: relative;
    .user-operate-list {
      position: absolute;
      padding: 20px;
      min-width: 160px;
      background: var(--background-color-1);
      border-radius: 8px;
      box-shadow: var(--operation-box-shadow);
      z-index: 1;
      &::before {
        content: '';
        position: absolute;
        width: 0px;
        border-top: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid var(--background-color-1);
        border-left: 10px solid transparent;
      }
      &::after {
        content: '';
        width: 100%;
        height: 20px;
        position: absolute;
        background-color: transparent;
      }
      .user-operate-item {
        cursor: pointer;
        color: var(--operation-font-color);
        height: 20px;
        display: flex;
        align-items: center;
        .operate-text {
          margin-left: 10px;
          font-size: 14px;
          white-space: nowrap;
        }
        &:not(:first-child) {
          margin-top: 20px;
        }
      }
    }
    .down {
      top: calc(100% + 15px);
      right: 0;
      &::before {
        right: 20px;
        top: -20px;
      }
      &::after {
        left: 0px;
        top: -20px;
      }
    }
    .up {
      bottom: calc(100% + 15px);
      right: 0;
      &::before {
        bottom: -20px;
        right: 20px;
        transform: rotate(180deg);
      }
      &::after {
        left: 0px;
        bottom: -20px;
      }
    }
  }
}
</style>
