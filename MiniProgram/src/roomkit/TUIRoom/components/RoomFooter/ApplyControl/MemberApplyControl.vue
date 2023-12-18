<template>
  <div>
    <div class="apply-control-container">
      <icon-button
        :title="iconTitle"
        :icon="ApplyIcon"
        @click-icon="toggleApplySpeech"
      />
      <div v-if="showMemberApplyAttention" class="attention member-attention">
        <span class="info">{{ t('Please raise your hand to apply') }}</span>
        <svg-icon style="display: flex" :icon="CloseIcon" class="close" @click="hideApplyAttention"></svg-icon>
      </div>
    </div>
    <Dialog
      v-model="showInviteDialog"
      :title="t('The host invites you to speak on stage')"
      :modal="true"
      :show-close="false"
      :close-on-click-modal="false"
      width="500px"
      :append-to-room-container="true"
    >
      <span>
        {{ t('The host invites you to speak on stage and once on stage you can turn on the camera and unmute it.') }}
      </span>
      <template v-if="isMobile" #cancel>
        <tui-button class="cancel" size="default" type="text" @click="handleInvite(false)">{{ t('Reject') }}</tui-button>
      </template>
      <template v-if="isMobile" #agree>
        <tui-button class="agree" size="default" type="text" :custom-style="customStyle" @click="handleInvite(true)">{{ t('Agree to the stage') }}</tui-button>
      </template>
      <template v-if="!isMobile" #footer>
        <tui-button class="agree-button" size="default" @click="handleInvite(true)">{{ t('Agree to the stage') }}</tui-button>
        <tui-button class="cancel-button" size="default" type="primary" @click="handleInvite(false)">{{ t('Reject') }}</tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch, onBeforeUnmount } from 'vue';
import { ICON_NAME } from '../../../constants/icon';
import IconButton from '../../common/base/IconButton.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import ApplyIcon from '../../../assets/icons/ApplyIcon.svg';
import CloseIcon from '../../../assets/icons/CloseIcon.svg';
import Dialog from '../../common/base/Dialog/index.vue';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import logger from '../../../utils/common/logger';
import { TUIRoomEngine, TUIRoomEvents, TUIRequest, TUIRequestAction, TUIRequestCallbackType } from '@tencentcloud/tuiroom-engine-wx';
import { isMobile } from '../../../utils/useMediaValue';
import TuiButton from '../../common/base/Button.vue';
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
const showInviteDialog: Ref<boolean> = ref(false);

const applyToAnchorRequestId: Ref<string> = ref('');
const inviteToAnchorRequestId: Ref<string> = ref('');
const customStyle = { color: '#1C66E5' };


watch([localUser, isApplyingOnSeat, lang], ([localUser, isApplyingOnSeat]) => {
  if (localUser.onSeat) {
    iconName.value = ICON_NAME.GoOffSeat;
    iconTitle.value = t('Step down');
    showMemberApplyAttention.value = false;
  } else {
    if (isApplyingOnSeat) {
      iconName.value = ICON_NAME.ApplyActive;
      iconTitle.value = t('Hand down');
    } else {
      iconName.value = ICON_NAME.ApplyOnSeat;
      iconTitle.value = t('Raise hand');
      showMemberApplyAttention.value = true;
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
    const request = await roomEngine.instance?.takeSeat({
      seatIndex: -1,
      timeout: 0,
      requestCallback: (callbackInfo: { requestCallbackType: TUIRequestCallbackType }) => {
        isApplyingOnSeat.value = false;
        const { requestCallbackType } = callbackInfo;
        switch (requestCallbackType) {
          case TUIRequestCallbackType.kRequestAccepted:
            TUIMessage({
              type: 'success',
              message: t('The host has approved your application'),
              duration: MESSAGE_DURATION.NORMAL,
            });
            break;
          case TUIRequestCallbackType.kRequestRejected:
            TUIMessage({
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
    if (request && request.requestId) {
      applyToAnchorRequestId.value = request.requestId;
    }
    isApplyingOnSeat.value = true;
  } catch (error) {
    logger.log('member sendSpeechApplication error', error);
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
    logger.log('member cancelSpeechApplication', error);
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
}

/**
   * The host canceled the invitation to the microphone
   *
   * 主持人取消邀请上麦
  **/
function onRequestCancelled(eventInfo: { requestId: string, userId: string }) {
  const { requestId } = eventInfo;
  if (inviteToAnchorRequestId.value === requestId) {
    inviteToAnchorRequestId.value = '';
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
 * Kicked off the seat by the host
 * 被主持人踢下麦
 */
async function onKickedOffSeat() {
  // 被主持人踢下麦
  TUIMessage({
    type: 'warning',
    message: t('You have been invited by the host to step down, please raise your hand if you need to speak'),
    duration: MESSAGE_DURATION.NORMAL,
  });
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
  roomEngine.instance?.on(TUIRoomEvents.onKickedOffSeat, onKickedOffSeat);
});

onBeforeUnmount(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.off(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
  roomEngine.instance?.off(TUIRoomEvents.onKickedOffSeat, onKickedOffSeat);
});

</script>

<style lang="scss" scoped>
.apply-control-container {
  position: relative;
  .attention {
    background: rgba(19, 124, 253, 0.96);
    box-shadow: 0 4px 16px 0 rgba(47, 48, 164, 0.1);
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
      border-top-color: rgba(19, 124, 253, 0.96);
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  .member-attention {
    padding: 7px 12px;
    .info {
      width: 210px;
      height: 20px;
      font-weight: 400;
      font-size: 14px;
      color: #ffffff;
      line-height: 20px;
    }
    .close {
      cursor: pointer;
      color: #ffffff;
    }
  }
}
.agree, .cancel {
  padding: 14px;
  width: 50%;
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  justify-content: center;
  color: var(--active-color-1);
}
.cancel {
  color: var(--font-color-4);
}
.cancel-button {
  margin-left: 20px;
}
</style>
