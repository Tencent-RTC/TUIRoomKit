<template>
  <div>
    <div class="apply-control-container">
      <icon-button :title="iconTitle" @click-icon="toggleApplySpeechDebounce">
        <IconStepDown v-if="localUser.onSeat" size="24" />
        <IconCancelStage
          v-else-if="!localUser.onSeat && isApplyingOnSeat"
          size="24"
        />
        <IconApplyStage v-else size="24" />
      </icon-button>
      <div v-if="showMemberApplyAttention" class="attention member-attention">
        <span :class="isMobile ? 'mobile-info' : 'info'">{{
          t('Please raise your hand to apply')
        }}</span>
        <IconClose class="close" size="26" @click="hideApplyAttention" />
      </div>
    </div>
    <Dialog
      v-model="showDialog"
      :title="currentDialogTitle"
      :modal="true"
      :show-close="false"
      :close-on-click-modal="false"
      width="500px"
      :append-to-room-container="true"
      :confirm-button="currentDialogInfo.confirmButtonText"
      :cancel-button="currentDialogInfo.cancelButtonText"
      @confirm="currentDialogInfo.handleConfirm"
      @cancel="currentDialogInfo.handleCancel"
    >
      <span>{{ currentDialogInfo.content }}</span>
      <template #footer>
        <TUIButton
          @click="currentDialogInfo.handleConfirm"
          type="default"
          style="min-width: 88px"
        >
          {{ currentDialogInfo.confirmButtonText }}
        </TUIButton>
        <TUIButton
          @click="currentDialogInfo.handleCancel"
          style="min-width: 88px"
        >
          {{ currentDialogInfo.cancelButtonText }}
        </TUIButton>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch, onBeforeUnmount, computed } from 'vue';
import { isMobile } from '../../../utils/environment';
import IconButton from '../../common/base/IconButton.vue';
import Dialog from '../../common/base/Dialog';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import logger from '../../../utils/common/logger';
import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRequest,
  TUIRequestAction,
  TUIRequestCallbackType,
  TUIRole,
  TUIErrorCode,
} from '@tencentcloud/tuiroom-engine-js';
import {
  TUIButton,
  TUIToast,
  TOAST_TYPE,
  IconClose,
  IconStepDown,
  IconApplyStage,
  IconCancelStage,
} from '@tencentcloud/uikit-base-component-vue3';
import { debounce } from '../../../utils/utils';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { lang } = storeToRefs(basicStore);
const { localUser, isGeneralUser, isAdmin } = storeToRefs(roomStore);

const isApplyingOnSeat: Ref<boolean> = ref(false);
const showMemberApplyAttention: Ref<boolean> = ref(true);
const iconTitle: Ref<string> = ref('');
const applyToAnchorRequestId: Ref<string> = ref('');
const inviteToAnchorRequestId: Ref<string> = ref('');
const showDialog: Ref<boolean> = ref(false);
const currentDialogTitle: Ref<string> = ref('');
const currentConfirmButton: Ref<string> = ref('');
type DialogType = 'inviteDialog' | 'leaveSeatDialog';
const currentDialogType: Ref<DialogType> = ref('inviteDialog');

watch(
  [localUser, isApplyingOnSeat, lang],
  ([localUser, isApplyingOnSeat]) => {
    if (localUser.onSeat) {
      iconTitle.value = t('Step down');
      hideApplyAttention();
    } else {
      if (isApplyingOnSeat) {
        iconTitle.value = t('Cancel Apply');
      } else {
        iconTitle.value = t('Apply for the stage');
      }
    }
  },
  { immediate: true, deep: true }
);

const toggleApplySpeechDebounce = debounce(toggleApplySpeech, 300);

async function toggleApplySpeech() {
  hideApplyAttention();
  if (localUser.value.onSeat) {
    handleStepDownDialogVisible();
  } else {
    isApplyingOnSeat.value ? cancelSeatApplication() : sendSeatApplication();
  }
}

const inviteDialogInfo = computed(() => ({
  content: t('You can turn on the microphone and camera once you are on stage'),
  confirmButtonText: t('Agree to the stage'),
  cancelButtonText: t('Reject'),
  handleConfirm: () => handleInvite(true),
  handleCancel: () => handleInvite(false),
}));

const leaveSeatDialogInfo = computed(() => ({
  content:
    localUser.value.userRole === TUIRole.kAdministrator
      ? t('To go on stage again, a new application needs to be initiated')
      : t(
          'To go on stage again, you need to reapply and wait for the roomOwner/administrator to approve'
        ),
  confirmButtonText: t('Step down'),
  cancelButtonText: t('Cancel'),
  handleConfirm: () => leaveSeat(),
  handleCancel: () => handleStepDownDialogVisible(),
}));

const currentDialogInfo = computed(() =>
  currentDialogType.value === 'inviteDialog'
    ? inviteDialogInfo.value
    : leaveSeatDialogInfo.value
);

/**
 * Send a request to be on the stage
 **/
async function sendSeatApplication() {
  if (isAdmin.value) {
    await roomEngine.instance?.takeSeat({ seatIndex: -1, timeout: 0 });
    TUIToast({ type: TOAST_TYPE.SUCCESS, message: t('Succeed on stage') });
    return;
  }
  if (isGeneralUser.value) {
    TUIToast({
      type: TOAST_TYPE.INFO,
      message: `${t('The request to go on stage has been sent out, please wait for the roomOwner/administrator to approve it')}`,
      duration: MESSAGE_DURATION.NORMAL,
    });
  }
  const request = await roomEngine.instance?.takeSeat({
    seatIndex: -1,
    timeout: 60,
    requestCallback: (callbackInfo: {
      requestCallbackType: TUIRequestCallbackType;
    }) => {
      isApplyingOnSeat.value = false;
      const { requestCallbackType } = callbackInfo;
      switch (requestCallbackType) {
        case TUIRequestCallbackType.kRequestAccepted:
          TUIToast({
            type: TOAST_TYPE.SUCCESS,
            message: t('Succeed on stage'),
          });
          break;
        case TUIRequestCallbackType.kRequestRejected:
          TUIToast({
            type: TOAST_TYPE.WARNING,
            message: t('Application to go on stage was rejected'),
          });
          break;
        case TUIRequestCallbackType.kRequestTimeout:
          TUIToast({
            type: TOAST_TYPE.WARNING,
            message: t('The request to go on stage has timed out'),
          });
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
 * Cancellation of application stage
 **/
async function cancelSeatApplication() {
  TUIToast({
    type: TOAST_TYPE.INFO,
    message: `${t('Canceled application to go on stage')}`,
    duration: MESSAGE_DURATION.NORMAL,
  });
  try {
    await roomEngine.instance?.cancelRequest({
      requestId: applyToAnchorRequestId.value,
    });
    isApplyingOnSeat.value = false;
  } catch (error) {
    logger.log('member cancelSpeechApplication', error);
  }
}

/**
 * User Down stage
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
 **/
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const {
    request: { userId, requestId, requestAction },
  } = eventInfo;
  if (requestAction === TUIRequestAction.kRequestRemoteUserOnSeat) {
    inviteToAnchorRequestId.value = requestId;
    const userRole =
      roomStore.getUserRole(userId as string) === TUIRole.kRoomOwner
        ? t('RoomOwner')
        : t('Admin');
    currentDialogTitle.value = t('Sb invites you to speak on stage', {
      role: userRole,
    });
    currentConfirmButton.value = t('Agree to the stage');
    showDialog.value = true;
    currentDialogType.value = 'inviteDialog';
  }
}

/**
 * The host canceled the invitation to the stage
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
 **/
async function handleInvite(agree: boolean) {
  try {
    await roomEngine.instance?.responseRemoteRequest({
      requestId: inviteToAnchorRequestId.value,
      agree,
    });
  } catch (error: any) {
    if (error.code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('The stage is full, please contact the host'),
      });
    } else {
      logger.error(
        'Failure of a user to accept/reject a roomOwner invitation',
        error
      );
    }
  } finally {
    showDialog.value = false;
  }
}

/**
 * Kicked off the stage by the host
 */
async function onKickedOffSeat() {
  TUIToast({
    type: TOAST_TYPE.WARNING,
    message: t(
      'You have been invited by the host to step down, please raise your hand if you need to speak'
    ),
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
  roomEngine.instance?.off(
    TUIRoomEvents.onRequestCancelled,
    onRequestCancelled
  );
  roomEngine.instance?.off(TUIRoomEvents.onKickedOffSeat, onKickedOffSeat);
});
</script>

<style lang="scss" scoped>
.apply-control-container {
  position: relative;

  .attention {
    position: absolute;
    bottom: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--text-color-link);
    border-radius: 8px;
    box-shadow: 0 4px 16px 0 var(--uikit-color-black-8);

    &::after {
      position: absolute;
      top: 100%;
      left: 10%;
      display: block;
      content: '';
      border: 5px solid transparent;
      border-top-color: var(--text-color-link);
      transform: translateX(-50%);
    }
  }

  .member-attention {
    padding: 12px;

    .info,
    .mobile-info {
      background: var(--uikit-color-transparent);
      height: 20px;
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      color: var(--uikit-color-white-1);
      white-space: nowrap;
    }

    .mobile-info {
      min-width: 50vw;
    }

    .close {
      padding-left: 12px;
      color: var(--uikit-color-white-1);
      cursor: pointer;
    }
  }
}
</style>
