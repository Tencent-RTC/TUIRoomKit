<!--
  * Name: IconButton
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <audio-control /> in the template
  *
-->
<template>
  <div>
    <audio-media-control
      :has-more="hasMore"
      :is-muted="!localUser.hasAudioStream"
      :is-disabled="isLocalAudioIconDisable"
      :audio-volume="userVolumeObj[localUser.userId]"
      @click="handleAudioMediaClick"
    />
    <Dialog
      v-model="showRequestOpenMicDialog"
      :title="t('Tips')"
      :modal="true"
      :show-close="false"
      :close-on-click-modal="false"
      width="500px"
      :append-to-room-container="true"
      :confirm-button="t('Turn on the microphone')"
      :cancel-button="t('Keep it closed')"
      @confirm="handleAccept"
      @cancel="handleReject"
    >
      <span>{{ dialogContent }}</span>
      <template #footer>
        <tui-button class="agree-button" size="default" @click="handleAccept">
          {{ t('Turn on the microphone') }}
        </tui-button>
        <tui-button
          class="cancel-button"
          size="default"
          type="primary"
          @click="handleReject"
        >
          {{ t('Keep it closed') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, onUnmounted, computed, defineEmits } from 'vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../common/base/Message/index';
import Dialog from '../common/base/Dialog';
import { useRoomStore } from '../../stores/room';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';
import { useI18n } from '../../locales';
import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRequest,
  TUIRequestAction,
  TUIRole,
} from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../hooks/useRoomEngine';
import { isMobile, isWeChat } from '../../utils/environment';
import TuiButton from '../common/base/Button.vue';
import AudioMediaControl from '../common/AudioMediaControl.vue';
import { useBasicStore } from '../../stores/basic';
import TUIMessageBox from '../common/base/MessageBox/index';

const roomEngine = useRoomEngine();

const roomStore = useRoomStore();
const basicStore = useBasicStore();

const {
  isAudience,
  localUser,
  isLocalAudioIconDisable,
  isMicrophoneDisableForAllUser,
  userVolumeObj,
} = storeToRefs(roomStore);

const emits = defineEmits(['click']);
const hasMore = computed(() => !isMobile);
const { t } = useI18n();
const dialogContent: Ref<string> = ref('');

function handleAudioMediaClick() {
  emits('click');
  toggleMuteAudio();
}

async function toggleMuteAudio() {
  if (isLocalAudioIconDisable.value) {
    let warningMessage = '';
    if (isAudience.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_AUDIENCE;
    } else if (isMicrophoneDisableForAllUser.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_MUTE_ALL;
    }
    TUIMessage({
      type: 'warning',
      message: t(warningMessage),
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }
  if (localUser.value.hasAudioStream) {
    await roomEngine.instance?.muteLocalAudio();
    // If everyone is muted, the user will not be able to turn the microphone back on after voluntarily turning it off.
    if (roomStore.isMicrophoneDisableForAllUser) {
      roomStore.setCanControlSelfAudio(false);
    }
  } else {
    const microphoneList = await roomEngine.instance?.getMicDevicesList();
    const hasMicrophoneDevice = microphoneList.length > 0;
    if (!hasMicrophoneDevice && !isWeChat) {
      TUIMessageBox({
        title: t('Note'),
        message: t('Microphone not detected on current device'),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    // There is a microphone list and permissions
    await roomEngine.instance?.unmuteLocalAudio();
    if (!basicStore.isOpenMic) {
      roomEngine.instance?.openLocalMicrophone();
      basicStore.setIsOpenMic(true);
    }
  }
}

/**
 * Handling host or administrator turn on/off microphone signalling
 **/
const showRequestOpenMicDialog: Ref<boolean> = ref(false);
const requestOpenMicRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { userId, requestAction, requestId } = eventInfo.request;
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteMicrophone) {
    const userRole =
      roomStore.getUserRole(userId) === TUIRole.kRoomOwner
        ? t('RoomOwner')
        : t('Admin');
    dialogContent.value = t('Sb invites you to turn on the microphone', {
      role: userRole,
    });
    requestOpenMicRequestId.value = requestId;
    showRequestOpenMicDialog.value = true;
  }
}
// Accept the host invitation and turn on the microphone
async function handleAccept() {
  roomStore.setCanControlSelfAudio(true);
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenMicRequestId.value,
    agree: true,
  });
  requestOpenMicRequestId.value = '';
  showRequestOpenMicDialog.value = false;
}

// keep mute
async function handleReject() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenMicRequestId.value,
    agree: false,
  });
  requestOpenMicRequestId.value = '';
  showRequestOpenMicDialog.value = false;
}

// Request canceled
async function onRequestCancelled(eventInfo: { requestId: string }) {
  const { requestId } = eventInfo;
  if (requestOpenMicRequestId.value === requestId) {
    showRequestOpenMicDialog.value = false;
  }
}
TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.off(
    TUIRoomEvents.onRequestCancelled,
    onRequestCancelled
  );
});
</script>

<style lang="scss" scoped>
.cancel-button {
  margin-left: 20px;
}
</style>
