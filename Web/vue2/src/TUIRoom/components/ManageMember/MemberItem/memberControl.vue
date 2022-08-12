<template>
  <div v-if="!isMe" class="member-control-container">
    <div
      class="mute-btn"
      @click="singleControl.func(userInfo)"
    >
      {{ singleControl.title }}
    </div>
    <div class="more-container">
      <div class="more-btn" @click="toggleClickMoreBtn">
        更多
        <svg-icon class="more-icon" :icon-name="ICON_NAME.ArrowBorderDown"></svg-icon>
      </div>
      <div v-show="showMoreControl" class="user-operate-list">
        <div
          v-for="item, index in controlList"
          :key="index"
          class="user-operate-item"
          @click="item.func(userInfo)"
        >
          {{ item.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { UserInfo, useRoomStore } from '../../../stores/room';
import { ICON_NAME } from '../../../constants/icon';
import TUIRoomCore, { ETUIRoomRole, ETUISpeechMode } from '../../../tui-room-core';
import { useBasicStore } from '../../../stores/basic';
import SvgIcon from '../../common/SvgIcon.vue';
import useMasterApplyControl from '../../../hooks/useMasterApplyControl';

const basicStore = useBasicStore();
const roomStore = useRoomStore();
// 举手发言功能相关函数
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

const props = defineProps<Props>();

const showMoreControl = ref(false);
const isMe = computed(() => basicStore.userId === props.userInfo.userId);
const isAnchor = computed(() => props.userInfo.role === ETUIRoomRole.ANCHOR);
const isAudience = computed(() => props.userInfo.role === ETUIRoomRole.AUDIENCE);
const isApplyRoomMode = computed(() => basicStore.roomMode === ETUISpeechMode.APPLY_SPEECH);

// 控制元素的集中匹配情况

// 自由发言模式
// 1.当前用户为主播：
// 禁言/解除禁言  禁画/解除禁画
//              禁止聊天
//              踢出房间

// 举手发言模式
// 1. 当前用户为主播：
// 禁言/解除禁言  禁画/解除禁画
//              邀请下台
//              禁止聊天
//              踢出房间

// 2. 观众没有申请上麦：
// 邀请上台/取消邀请上台      禁止聊天
//                         踢出房间

// 3. 观众正在申请上麦：
// 同意上台      拒绝上台
//              禁止聊天
//              踢出房间
const singleControl = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const control = { title: '', func: (userInfo: UserInfo) => {} };
  if (isAnchor.value) {
    control.title = props.userInfo.isAudioMutedByMaster ? '解除禁言' : '禁言';
    control.func = muteUserAudio;
  } else if (isAudience.value) {
    if (props.userInfo.isUserApplyingToAnchor) {
      control.title = '同意上台';
      control.func = agreeUserOnStage;
    } else {
      control.title = props.userInfo.isInvitingUserToAnchor ? '取消邀请上台' : '邀请上台';
      control.func = toggleInviteUserOnStage;
    }
  }
  return control;
});

const denyOnStage = { title: '拒绝上台', func: denyUserOnStage };
const makeOffStage = { title: '邀请下台', func: kickUserOffStage };

const videoControlTitle = computed(() => (props.userInfo.isVideoMutedByMaster ? '解除禁画' : '禁画'));
const videoControl = computed(() => ({ title: videoControlTitle.value, func: muteUserVideo }));

const chatControlTitle = computed(() => (props.userInfo.isChatMutedByMaster ? '允许文字聊天' : '禁止文字聊天'));
const forbidChat = computed(() => ({ title: chatControlTitle.value, func: muteUserChat }));

const kickUser = { title: '踢出房间', func: kickOffUser };
const controlList = computed(() => {
  const list = [forbidChat.value, kickUser];
  if (isAnchor.value) {
    list.unshift(videoControl.value);
  }
  if (isAnchor.value && isApplyRoomMode.value) {
    list.splice(1, 0, makeOffStage);
  }
  if (isAudience.value && props.userInfo.isUserApplyingToAnchor) {
    list.splice(0, 0, denyOnStage);
  }
  return list;
});

function toggleClickMoreBtn() {
  showMoreControl.value = !showMoreControl.value;
}


// 邀请上台/取消邀请上台
async function toggleInviteUserOnStage(userInfo: UserInfo) {
  const { userId, isInvitingUserToAnchor } = userInfo;
  if (isInvitingUserToAnchor) {
    roomStore.removeInviteToAnchorUser(userId);
    cancelInviteUserOnStage(userInfo);
  } else {
    roomStore.addInviteToAnchorUser(userId);
    inviteUserOnStage(userInfo);
  }
}

// 禁言/取消禁言
function muteUserAudio(userInfo: UserInfo) {
  const currentState = userInfo.isAudioMutedByMaster;
  roomStore.setMuteUserAudio(userInfo.userId, !currentState);
  TUIRoomCore.muteUserMicrophone(userInfo.userId, !currentState);
}

// 禁画/取消禁画
function muteUserVideo(userInfo: UserInfo) {
  const currentState = userInfo.isVideoMutedByMaster;
  roomStore.setMuteUserVideo(userInfo.userId, !currentState);
  TUIRoomCore.muteUserCamera(userInfo.userId, !currentState);
}

// 允许文字聊天/取消文字聊天
function muteUserChat(userInfo: UserInfo) {
  const currentState = userInfo.isChatMutedByMaster;
  roomStore.setMuteUserChat(userInfo.userId, !currentState);
  TUIRoomCore.muteUserChatRoom(userInfo.userId, !currentState);
}

// 将用户踢出房间
function kickOffUser(userInfo: UserInfo) {
  TUIRoomCore.kickOffUser(userInfo.userId);
}

</script>

<style lang="scss">
.member-control-container {
  display: flex;
  flex-direction: row;
  .more-btn, .mute-btn {
    height: 32px;
    border-radius: 2px;
    font-size: 14px;
    color: #FFFFFF;
    line-height: 32px;
    padding: 0 20px;
  }
  .mute-btn {
    background-image: linear-gradient(235deg, #1883FF 0%, #0062F5 100%);
  }
  .more-container {
    position: relative;
    .more-btn {
      display: flex;
      flex-direction: row;
      align-items: center;
      background: rgba(173,182,204,0.10);
      border: 1px solid #ADB6CC;
      margin-left: 12px;
      .more-icon {
        margin-left: 4px;
        width: 20px;
        height: 20px;
      }
    }
    .user-operate-list {
      position: absolute;
      padding: 4px 0;
      top: calc(100% + 10px);
      right: 0;
      min-width: 124px;
      background: #1D2029;
      border-radius: 4px;
      box-shadow: 0 1px 10px 0 rgba(0,0,0,0.30);
      .user-operate-item {
        cursor: pointer;
        padding: 0 20px;
        text-align: center;
        font-size: 14px;
        color: #CFD4E6;
        height: 40px;
        line-height: 40px;
      }
    }
  }
}
</style>

