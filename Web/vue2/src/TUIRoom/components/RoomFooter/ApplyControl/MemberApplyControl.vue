<template>
  <div>
    <div class="apply-control-container">
      <icon-button
        :title="iconTitle"
        :icon-name="iconName"
        @click-icon="toggleApplySpeech"
      />
      <div v-show="showMemberApplyAttention" class="attention member-attention">
        <span class="info">如果您想发言请先举手申请上麦</span>
        <svg-icon icon-name="close" size="medium" class="close" @click="hideApplyAttention"></svg-icon>
      </div>
    </div>
    <el-dialog
      v-model="showInviteDialog"
      title="主持人邀请您上台发言"
      :modal="false"
      :show-close="false"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="500px"
    >
      <span>同意上台后可打开摄像头和麦克风，是否同意上台？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleInvite(true)">同意</el-button>
          <el-button @click="handleInvite(false)">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { ICON_NAME } from '../../../constants/icon';
import IconButton from '../../common/IconButton.vue';
import SvgIcon from '../../common/SvgIcon.vue';
import TUIRoomCore, { ETUIRoomEvents, ETUISignalStatus, ETUIRoomRole } from '../../../tui-room-core';
import { Message } from 'element-ui';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';

const basicStore = useBasicStore();
const roomStore = useRoomStore();

enum STATE {
  OffSeat = 'offSeat',
  OnSeat = 'onSeat',
  Applying = 'applying',
};

const userState: Ref<STATE> = ref(STATE.OffSeat);
const showMemberApplyAttention: Ref<boolean> = ref(true);
const iconName: Ref<string> = ref('');
const iconTitle: Ref<string> = ref('');
const showInviteDialog: Ref<Boolean> = ref(false);

watch(userState, (val) => {
  if (val === STATE.OffSeat) {
    iconName.value = ICON_NAME.ApplyOnSeat;
    iconTitle.value = '举手';
  }
  if (userState.value === STATE.Applying) {
    iconName.value = ICON_NAME.ApplyActive;
    iconTitle.value = '手放下';
  }
  if (userState.value === STATE.OnSeat) {
    iconName.value = ICON_NAME.GoOffSeat;
    iconTitle.value = '下台';
  }
}, { immediate: true });

async function toggleApplySpeech() {
  hideApplyAttention();
  switch (userState.value) {
    case STATE.OffSeat:
      sendSeatApplication();
      break;
    case STATE.Applying:
      cancelSeatApplication();
      break;
    case STATE.OnSeat:
      leaveSeat();
      break;
    default:
      break;
  }
};

// 发送上麦申请
async function sendSeatApplication() {
  userState.value = STATE.Applying;
  try {
    const applyResponse = await TUIRoomCore.sendSpeechApplication();
    switch (applyResponse.code) {
      case ETUISignalStatus.ACCEPTED:
        handleApplyAccepted();
        break;
      case ETUISignalStatus.REJECTED:
        handleApplyRejected();
        break;
      case ETUISignalStatus.CANCELLED:
        break;
      default:
        break;
    }
  } catch (error) {
    console.log('member sendSpeechApplication error', error);
  }
}

// 取消上麦申请
async function cancelSeatApplication() {
  // 取消上麦申请
  try {
    await TUIRoomCore.cancelSpeechApplication();
    userState.value = STATE.OffSeat;
  } catch (error) {
    console.log('member cancelSpeechApplication', error);
  }
}

// 用户下麦
async function leaveSeat() {
  await TUIRoomCore.sendOffSpeaker();
  userState.value = STATE.OffSeat;
  basicStore.setRole(ETUIRoomRole.AUDIENCE);
  roomStore.setIsLocalAudioMuted(true);
  roomStore.setIsLocalVideoMuted(true);
  roomStore.updateLocalStream({
    isAudioStreamAvailable: false,
    isVideoStreamAvailable: false,
  });
  roomStore.setHasStartedMicrophone(false);
}

// 处理主持人接受申请
function handleApplyAccepted() {
  userState.value = STATE.OnSeat;
  basicStore.setRole(ETUIRoomRole.ANCHOR);
  Message({
    type: 'success',
    message: '主持人同意了你的上台申请',
    duration: MESSAGE_DURATION.NORMAL,
  });
}

// 处理主持人拒绝申请
function handleApplyRejected() {
  userState.value = STATE.OffSeat;
  Message({
    type: 'warning',
    message: '主持人拒绝了你的上台申请',
    duration: MESSAGE_DURATION.NORMAL,
  });
}

function hideApplyAttention() {
  showMemberApplyAttention.value = false;
}

function onReceiveSpeechInvitation() {
  // 收到主持人邀请上麦
  showInviteDialog.value = true;
}

function onReceiveInvitationCancelled() {
  // 主持人取消邀请上麦
  showInviteDialog.value = false;
}

function onUserKickOffStage() {
  Message({
    type: 'warning',
    message: '您已被主持人邀请下台，需要发言请先举手',
    duration: MESSAGE_DURATION.NORMAL,
  });
  // 被主持踢下麦
  leaveSeat();
}

// 用户接受/拒绝主讲人的邀请
function handleInvite(agree: boolean) {
  TUIRoomCore.replySpeechInvitation(agree);
  showInviteDialog.value = false;
  if (agree) {
    userState.value = STATE.OnSeat;
    basicStore.setRole(ETUIRoomRole.ANCHOR);
  }
}

// 用户进入 trtc 房间
function onUserAVEnabled(userInfo: { userId: string }) {
  const { userId } = userInfo;
  // 主播重新进入 trtc 房间，如果之前发送过请求上麦信令需要重新发送上麦申请
  if (userId === basicStore.masterUserId && userState.value === STATE.Applying) {
    sendSeatApplication();
  }
}

// 用户离开 trtc 房间
function onUserAVDisabled(userInfo: { userId: string }) {
  const { userId } = userInfo;
  // 主播离开 trtc 房间，如果正在进行上麦邀请，则不显示邀请框
  if (userId === basicStore.masterUserId && showInviteDialog.value) {
    showInviteDialog.value = false;
  }
}

onMounted(() => {
  TUIRoomCore.on(ETUIRoomEvents.onReceiveSpeechInvitation, onReceiveSpeechInvitation);
  TUIRoomCore.on(ETUIRoomEvents.onReceiveInvitationCancelled, onReceiveInvitationCancelled);
  TUIRoomCore.on(ETUIRoomEvents.onUserKickOffStage, onUserKickOffStage);
  TUIRoomCore.on(ETUIRoomEvents.onUserAVEnabled, onUserAVEnabled);
  TUIRoomCore.on(ETUIRoomEvents.onUserAVDisabled, onUserAVDisabled);
});

onBeforeUnmount(() => {
  TUIRoomCore.off(ETUIRoomEvents.onReceiveSpeechInvitation, onReceiveSpeechInvitation);
  TUIRoomCore.off(ETUIRoomEvents.onReceiveInvitationCancelled, onReceiveInvitationCancelled);
  TUIRoomCore.off(ETUIRoomEvents.onUserKickOffStage, onUserKickOffStage);
  TUIRoomCore.off(ETUIRoomEvents.onUserAVEnabled, onUserAVEnabled);
  TUIRoomCore.off(ETUIRoomEvents.onUserAVDisabled, onUserAVDisabled);
});

</script>

<style lang="scss" scoped>
.apply-control-container {
  position: relative;
  .attention {
    background: rgba(19,124,253,0.96);
    box-shadow: 0 4px 16px 0 rgba(47,48,164,0.10);
    position: absolute;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    top: -6px;
    left: 50%;
    transform: translate(-50%, -100%);
    &::after {
      content: '';
      display: block;
      border: 4px solid transparent;
      border-top-color: rgba(19,124,253,0.96);
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  .member-attention {
    padding: 7px 12px;
    .info {
      width: 196px;
      height: 20px;
      font-weight: 400;
      font-size: 14px;
      color: #FFFFFF;
      line-height: 20px;
    }
    .close {
      cursor: pointer;
    }
  }
}
</style>
