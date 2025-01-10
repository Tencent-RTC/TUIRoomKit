<template>
  <div>
    <div class="apply-control-container">
      <icon-button
        :title="iconTitle"
        :icon="iconName"
        @click-icon="toggleApplySpeech"
      />
      <div v-if="showRoomTool && showMemberApplyAttention" class="attention member-attention">
        <text :class="isMobile ? 'mobile-info' : 'info'">{{ t('Please raise your hand to apply') }}</text>
        <div class="close" @click="hideApplyAttention">
          <svg-icon style="display: flex" icon="CloseIcon" color="#FFFFFF"></svg-icon>
        </div>
      </div>
    </div>
    <Dialog
      v-model="showDialog"
      :title="currentDialogTitle"
      :modal="true"
      :show-close="false"
      :close-on-click-modal="false"
      width="480px"
      :append-to-room-container="true"
      :confirm-button="currentDialogInfo.confirmButtonText"
      :cancel-button="currentDialogInfo.cancelButtonText"
      @confirm="currentDialogInfo.handleConfirm"
      @cancel="currentDialogInfo.handleCancel"
    >
      <span>{{ currentDialogInfo.content }}</span>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch, onBeforeUnmount, computed, onMounted, inject } from 'vue';
import { isMobile } from '../../../utils/environment';
import IconButton from '../../common/base/IconButton.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import Dialog from '../../common/base/Dialog/index.vue';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import logger from '../../../utils/common/logger';
import { TUIRoomEngine, TUIRoomEvents, TUIRequest, TUIRequestAction, TUIRequestCallbackType, TUIRole, TUIErrorCode } from '@tencentcloud/tuiroom-engine-uniapp-app';
import TuiButton from '../../common/base/Button.vue';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { lang } = storeToRefs(basicStore);
const { localUser, isGeneralUser, isAdmin } = storeToRefs(roomStore);

const isApplyingOnSeat: Ref<Boolean> = ref(false);
const showMemberApplyAttention: Ref<boolean> = ref(true);
const iconName = ref();
const iconTitle: Ref<string> = ref('');
const applyToAnchorRequestId: Ref<string> = ref('');
const inviteToAnchorRequestId: Ref<string> = ref('');
const showDialog: Ref<boolean> = ref(false);
const currentDialogTitle: Ref<string> = ref('');
const currentConfirmButton: Ref<string> = ref('');
type DialogType = 'inviteDialog' | 'leaveSeatDialog';
const currentDialogType: Ref<DialogType> = ref('inviteDialog');

const showRoomTool = inject('showRoomTool');

watch([localUser, isApplyingOnSeat, lang], ([localUser, isApplyingOnSeat]) => {
  if (localUser.onSeat) {
    iconName.value = 'StepDownIcon';
    iconTitle.value = t('Step down');
    hideApplyAttention();
  } else {
    if (isApplyingOnSeat) {
      iconName.value = 'CancelStageIcon';
      iconTitle.value = t('Cancel Apply');
    } else {
      iconName.value = 'ApplyStageIcon';
      iconTitle.value = t('Apply for the stage');
    }
  }
}, { immediate: true, deep: true });

async function toggleApplySpeech() {
  hideApplyAttention();
  if (localUser.value.onSeat) {
    handleStepDownDialogVisible();
  } else {
    isApplyingOnSeat.value ? cancelSeatApplication() : sendSeatApplication();
  }
};

const inviteDialogInfo = {
  content: t('You can turn on the microphone and camera once you are on stage'),
  confirmButtonText: t('Agree to the stage'),
  cancelButtonText: t('Reject'),
  handleConfirm: () => handleInvite(true),
  handleCancel: () => handleInvite(false),
};

const leaveSeatDialogInfo = computed(() => ({
  content: (localUser.value.userRole === TUIRole.kAdministrator ? t('To go on stage again, a new application needs to be initiated') : t('To go on stage again, you need to reapply and wait for the roomOwner/administrator to approve')),
  confirmButtonText: t('Step down'),
  cancelButtonText: t('Cancel'),
  handleConfirm: () => leaveSeat(),
  handleCancel: () => handleStepDownDialogVisible(),
}));

const currentDialogInfo = computed(() => (currentDialogType.value === 'inviteDialog'
  ? inviteDialogInfo
  : leaveSeatDialogInfo.value));
/**
 * Send a request to be on the mike
 *
 * 发送上麦申请
**/
async function sendSeatApplication() {
  if (isAdmin.value) {
    await roomEngine.instance?.takeSeat({ seatIndex: -1, timeout: 0 });
    TUIMessage({ type: 'success', message: t('Succeed on stage') });
    return;
  }
  if (isGeneralUser.value) {
    TUIMessage({
      type: 'info',
      message: `${t('The request to go on stage has been sent out, please wait for the roomOwner/administrator to approve it')}`,
      duration: MESSAGE_DURATION.NORMAL,
    });
  }
  const request = await roomEngine.instance?.takeSeat({
    seatIndex: -1,
    timeout: 60,
    requestCallback: (callbackInfo: { requestCallbackType: TUIRequestCallbackType }) => {
      isApplyingOnSeat.value = false;
      const { requestCallbackType } = callbackInfo;
      switch (requestCallbackType) {
        case TUIRequestCallbackType.kRequestAccepted:
          TUIMessage({ type: 'success', message: t('Succeed on stage') });
          break;
        case TUIRequestCallbackType.kRequestRejected:
          TUIMessage({ type: 'warning', message: t('Application to go on stage was rejected') });
          break;
        case TUIRequestCallbackType.kRequestTimeout:
          TUIMessage({ type: 'warning', message: t('Failed to go on stage, invitation has timed out') });
          break;
      }
    },
  });
  if (request && request.requestId) {
    applyToAnchorRequestId.value = request.requestId;
  }
  isApplyingOnSeat.value = true;
}

/**
 * Cancellation of on-mike application
 *
 * 处理点击【创建房间】
**/
// 取消上麦申请
async function cancelSeatApplication() {
  TUIMessage({
    type: 'info',
    message: `${t('Canceled application to go on stage')}`,
    duration: MESSAGE_DURATION.NORMAL,
  });
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
function handleStepDownDialogVisible() {
  showDialog.value = !showDialog.value;
  currentDialogType.value = 'leaveSeatDialog';
  currentDialogTitle.value = t('Are you sure you want to step down');
}

async function leaveSeat() {
  await roomEngine.instance?.leaveSeat();
  showDialog.value = false;
}

function hideApplyAttention() {
  showMemberApplyAttention.value = false;
}

/**
 * Handling host or administrator invitation to on-stage signalling
 *
 * 处理主持人或管理员邀请上台信令
**/
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { userId, requestId, requestAction } = eventInfo.request;
  if (requestAction === TUIRequestAction.kRequestRemoteUserOnSeat) {
    inviteToAnchorRequestId.value = requestId;
    const userRole = roomStore.getUserRole(userId as string) === TUIRole.kRoomOwner ? t('RoomOwner') : t('Admin');
    currentDialogTitle.value = t('Sb invites you to speak on stage', { role: userRole });
    currentConfirmButton.value = t('Agree to the stage');
    showDialog.value = true;
    currentDialogType.value = 'inviteDialog';
  }
}

/**
   * The host canceled the invitation to the microphone
   *
   * 主持人取消邀请上麦
  **/
function onRequestCancelled(eventInfo: { requestId: string; userId: string }) {
  const { requestId } = eventInfo;
  if (inviteToAnchorRequestId.value === requestId) {
    inviteToAnchorRequestId.value = '';
    showDialog.value = false;
  }
}

/**
 * User accepts/rejects the presenter's invitation
 *
 * 用户接受/拒绝主讲人的邀请
**/
async function handleInvite(agree: boolean) {
  try {
    await roomEngine.instance?.responseRemoteRequest({
      requestId: inviteToAnchorRequestId.value,
      agree,
    });
  } catch (error: any) {
    if (error.code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
      TUIMessage({ type: 'warning', message: t('The current number of people on stage has reached the limit') });
    } else {
      logger.error('Failure of a user to accept/reject a roomOwner invitation', error);
    }
  } finally {
    showDialog.value = false;
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
onMounted(() => {
  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
    roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
    roomEngine.instance?.on(TUIRoomEvents.onKickedOffSeat, onKickedOffSeat);
  });
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
    background: #1C66E5;
    box-shadow: 0 4px 16px 0 rgba(47, 48, 164, 0.1);
    position: fixed;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    left: 10px;
    bottom: 90px;
    &::after {
      border: 5px solid transparent;
      border-top-color: #1C66E5;
      position: absolute;
      top: 100%;
      left: 10%;
      transform: translateX(-50%);
    }
  }
  .member-attention {
    padding: 12px;
		display: flex;
		flex-direction: row;
    .info, .mobile-info {
      height: 20px;
      font-weight: 500;
      font-size: 14px;
      color: #ffffff;
      line-height: 20px;
    }

    .close {
      color: #ffffff;
      padding-left: 12px;
    }
  }
}
.agree,
.cancel {
  padding: 14px;
  width: 50%;
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  justify-content: center;
  color: #1C66E5;
}
.cancel {
  color: #4F586B;
}
.cancel-button {
  margin-left: 20px;
}
</style>
