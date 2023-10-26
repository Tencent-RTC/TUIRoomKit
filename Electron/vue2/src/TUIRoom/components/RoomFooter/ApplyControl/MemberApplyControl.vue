<template>
  <div>
    <div class="apply-control-container">
      <icon-button
        :title="iconTitle"
        :icon-name="iconName"
        @click-icon="toggleApplySpeech"
      />
      <div v-if="showMemberApplyAttention" class="attention member-attention">
        <span class="info">{{ t('Please raise your hand to apply') }}</span>
        <svg-icon icon-name="close" size="medium" class="close" @click="hideApplyAttention"></svg-icon>
      </div>
    </div>
    <Dialog
      :model-value="showInviteDialog"
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
        {{
          t('After agreeing to go on stage, you can turn on the camera and microphone. Do you agree to go on stage?')
        }}
      </span>
      <template #footer>
        <div :class="[isMobile ? 'button-container-mobile' : 'button-container-PC']">
          <span class="cancel" @click="handleInvite(false)">{{ t('Cancel') }}</span>
          <span class="agree" @click="handleInvite(true)">{{ t('Agree') }}</span>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch, onBeforeUnmount } from 'vue';
import { ICON_NAME } from '../../../constants/icon';
import IconButton from '../../common/IconButton.vue';
import SvgIcon from '../../common/SvgIcon.vue';
import { ElMessage } from '../../../elementComp';
import Dialog from '../../../elementComp/Dialog/index.vue';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import logger from '../../../utils/common/logger';
import TUIRoomEngine, { TUIRoomEvents, TUIRequest, TUIRequestAction, TUIRequestCallbackType } from '@tencentcloud/tuiroom-engine-electron';
import { isMobile } from '../../../utils/useMediaValue';
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

const applyToAnchorRequestId: Ref<string> = ref('');
const inviteToAnchorRequestId: Ref<string> = ref('');

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
    const request = await roomEngine.instance?.takeSeat({
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
  ElMessage({
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
      width: 210px;
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
.button-container-mobile{
  width: 100%;
  display: flex;
  .agree{
    padding: 14px;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #F2F2F2;
    color: #006EFF;
  }
  .cancel{
    padding: 14px;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #F2F2F2;
    color: #2B2E38;
    border-right: 1px solid #F2F2F2;
  }
}
.button-container-PC{
  .cancel{
    padding: 5px 20px;
    background: var(--create-room-option);
    border-radius: 2px;
    width: auto;
    display: initial;
    color: var(--color-font);
    border: 1px solid var(--choose-type);
  }
  .agree{
    padding: 5px 20px;
    background: #006EFF;
    color: white;
    margin-left: 14px;
    border-radius: 2px;
    width: auto;
    display: initial;
  }
}
</style>
