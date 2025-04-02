<template>
  <tui-dialog
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
      <TUIButton @click="handleAccept" type="primary">
        {{ t('Turn on the microphone') }}
      </TUIButton>
      <TUIButton @click="handleReject">
        {{ t('Keep it closed') }}
      </TUIButton>
    </template>
  </tui-dialog>
</template>

<script setup lang="ts">
import { ref, Ref, onUnmounted } from 'vue';
import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRequest,
  TUIRequestAction,
  TUIRole,
} from '@tencentcloud/tuiroom-engine-js';
import TuiDialog from '../../../components/common/base/Dialog';
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import useRoomEngine from '../../../hooks/useRoomEngine';

const roomEngine = useRoomEngine();
const roomStore = useRoomStore();
const { t } = useI18n();
const dialogContent: Ref<string> = ref('');

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
