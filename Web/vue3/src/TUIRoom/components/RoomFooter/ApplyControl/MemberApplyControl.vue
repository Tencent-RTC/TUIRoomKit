<template>
  <div class="apply-control-container">
    <icon-button
      :title="iconTitle"
      :icon-name="iconName"
      @click-icon="toggleApplySpeech"
    />
    <div v-show="showMemberApplyAttention" class="attention member-attention">
      <span class="info">{{ t('Please raise your hand to apply') }}</span>
      <svg-icon icon-name="close" size="medium" class="close" @click="hideApplyAttention"></svg-icon>
    </div>
  </div>
  <el-dialog
    v-model="showInviteDialog"
    :title="t('The host invites you to speak on stage')"
    class="custom-element-class"
    :modal="false"
    :show-close="false"
    :append-to-body="true"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="500px"
  >
    <span>
      {{ t('After agreeing to go on stage, you can turn on the camera and microphone. Do you agree to go on stage?') }}
    </span>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleInvite(true)">{{ t('Agree') }}</el-button>
        <el-button @click="handleInvite(false)">{{ t('Cancel') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, Ref, watch, onBeforeUnmount } from 'vue';
import { ICON_NAME } from '../../../constants/icon';
import IconButton from '../../common/IconButton.vue';
import SvgIcon from '../../common/SvgIcon.vue';
import { ElMessage } from 'element-plus';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import TUIRoomEngine, { TUIRoomEvents, TUIRequest, TUIRequestAction, TUIRequestCallbackType } from '@tencentcloud/tuiroom-engine-js';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { lang } = storeToRefs(basicStore);
const { localUser } = storeToRefs(roomStore);

const isApplyingOnSeat: Ref<Boolean> = ref(false);
const showMemberApplyAttention: Ref<boolean> = ref(true);
const iconName: Ref<string> = ref('');
const iconTitle: Ref<string> = ref('');
const showInviteDialog: Ref<Boolean> = ref(false);

const applyToAnchorRequestId: Ref<number> = ref(0);
const inviteToAnchorRequestId: Ref<number> = ref(0);

watch([localUser, isApplyingOnSeat, lang], ([localUser, isApplyingOnSeat]) => {
  if (localUser.onSeat) {
    iconName.value = ICON_NAME.GoOffSeat;
    iconTitle.value = t('Step down');
  } else {
    if (isApplyingOnSeat) {
      iconName.value = ICON_NAME.ApplyActive;
      iconTitle.value = t('Hand down');
    } else {
      iconName.value = ICON_NAME.ApplyOnSeat;
      iconTitle.value = t('Raise hand');
    }
  }
}, { immediate: true, deep: true });

async function toggleApplySpeech() {
  hideApplyAttention();
  if (localUser.value.onSeat) {
    leaveSeat();
  } else {
    isApplyingOnSeat.value ? cancelSeatApplication() : sendSeatApplication();
  }
};

/**
 * Send a request to be on the mike
 *
 * 发送上麦申请
**/
async function sendSeatApplication() {
  try {
    const requestId = await roomEngine.instance?.takeSeat({
      seatIndex: -1,
      timeout: 0,
      requestCallback: (callbackInfo: { requestCallbackType: TUIRequestCallbackType }) => {
        isApplyingOnSeat.value = false;
        const { requestCallbackType } = callbackInfo;
        switch (requestCallbackType) {
          case TUIRequestCallbackType.kRequestAccepted:
            ElMessage({
              type: 'success',
              message: t('The host has approved your application'),
              duration: MESSAGE_DURATION.NORMAL,
            });
            break;
          case TUIRequestCallbackType.kRequestRejected:
            ElMessage({
              type: 'warning',
              message: t('The host has rejected your application for the stage'),
              duration: MESSAGE_DURATION.NORMAL,
            });
            break;
          case TUIRequestCallbackType.kRequestTimeout:
            break;
        }
      },
    });
    if (requestId) {
      applyToAnchorRequestId.value = requestId;
    }
    isApplyingOnSeat.value = true;
  } catch (error) {
    console.log('member sendSpeechApplication error', error);
  }
}

/**
 * Cancellation of on-mike application
 *
 * 处理点击【创建房间】
**/
// 取消上麦申请
async function cancelSeatApplication() {
  try {
    await roomEngine.instance?.cancelRequest({ requestId: applyToAnchorRequestId.value });
    isApplyingOnSeat.value = false;
  } catch (error) {
    console.log('member cancelSpeechApplication', error);
  }
}

/**
 * User Down Mack
 *
 * 用户下麦
**/
async function leaveSeat() {
  await roomEngine.instance?.leaveSeat();
}

function hideApplyAttention() {
  showMemberApplyAttention.value = false;
}

async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { request: { requestId, requestAction } } = eventInfo;
  // Received an invitation from the host to go on the microphone
  // 收到主持人邀请上麦
  if (requestAction === TUIRequestAction.kRequestRemoteUserOnSeat) {
    inviteToAnchorRequestId.value = requestId;
    showInviteDialog.value = true;
  }
  // todo: 需要有被踢下麦的通知
  // else if (requestAction === TUIRequestAction.kRequestRemoteUserLeaveSeat) {
  //   // 被主持人踢下麦
  //   ElMessage({
  //     type: 'warning',
  //     message: t('You have been invited by the host to step down, please raise your hand if you need to speak'),
  //     duration: MESSAGE_DURATION.NORMAL,
  //   });
  // }
}

/**
   * The host canceled the invitation to the microphone
   *
   * 主持人取消邀请上麦
  **/
function onRequestCancelled(eventInfo: { requestId: number, userId: string }) {
  const { requestId } = eventInfo;
  if (inviteToAnchorRequestId.value === requestId) {
    inviteToAnchorRequestId.value = 0;
    showInviteDialog.value = false;
  }
}

/**
 * User accepts/rejects the presenter's invitation
 *
 * 用户接受/拒绝主讲人的邀请
**/
async function handleInvite(agree: boolean) {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: inviteToAnchorRequestId.value,
    agree,
  });
  showInviteDialog.value = false;
  if (agree) {
    hideApplyAttention();
  }
}

/**
 * User access to trtc room
 *
 * 用户进入 trtc 房间
**/
function onUserAVEnabled(userInfo: { userId: string }) {
  const { userId } = userInfo;
  /**
   * If the host re-enters the trtc room, he/she needs to resend
   * the request to go to the mike if he/she has previously sent a request to go to the mike.
   *
   * 主播重新进入 trtc 房间，如果之前发送过请求上麦信令需要重新发送上麦申请
  **/
  if (userId === basicStore.masterUserId && isApplyingOnSeat.value) {
    sendSeatApplication();
  }
}

/**
 * User leaves trtc room
 *
 * 用户离开 trtc 房间
**/
function onUserAVDisabled(userInfo: { userId: string }) {
  const { userId } = userInfo;
  /**
   * If the host leaves the trtc room, the invitation box will not be displayed
   * if the invitation is being made to the mic.
   *
   * 主播离开 trtc 房间，如果正在进行上麦邀请，则不显示邀请框
  **/
  if (userId === basicStore.masterUserId && showInviteDialog.value) {
    showInviteDialog.value = false;
  }
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
});

onBeforeUnmount(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.off(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
});

</script>

<style lang="scss">
@import '../../../assets/style/element-custom.scss';

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
