<template>
  <tui-dialog
    v-model="showRequestOpenCameraDialog"
    :title="t('Tips')"
    :modal="true"
    :show-close="false"
    :close-on-click-modal="false"
    width="500px"
    :append-to-room-container="true"
    :confirm-button="t('Turn on the camera')"
    :cancel-button="t('Keep it closed')"
    @confirm="handleAccept"
    @cancel="handleReject"
  >
    <span>
      {{ dialogContent }}
    </span>
    <template #footer>
      <TUIButton @click="handleAccept" type="primary">
        {{ t('Turn on the camera') }}
      </TUIButton>
      <TUIButton @click="handleReject">
        {{ t('Keep it closed') }}
      </TUIButton>
    </template>
  </tui-dialog>
</template>

<script setup lang="ts">
import { ref, onUnmounted, Ref } from 'vue';
import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRequest,
  TUIRequestAction,
  TUIRole,
} from '@tencentcloud/tuiroom-engine-js';
import TuiDialog from '../../../components/common/base/Dialog';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
const roomEngine = useGetRoomEngine();

const roomStore = useRoomStore();
const dialogContent: Ref<string> = ref('');

const { t } = useI18n();

/**
 * Handling host or administrator turn on/off camera signalling
 **/
const showRequestOpenCameraDialog: Ref<boolean> = ref(false);
const requestOpenCameraRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { userId, requestAction, requestId } = eventInfo.request;
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteCamera) {
    const userRole =
      roomStore.getUserRole(userId) === TUIRole.kRoomOwner
        ? t('RoomOwner')
        : t('Admin');
    dialogContent.value = t('Sb invites you to turn on the camera', {
      role: userRole,
    });
    requestOpenCameraRequestId.value = requestId;
    showRequestOpenCameraDialog.value = true;
  }
}

// Accept the host invitation and turn on the camera
async function handleAccept() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenCameraRequestId.value,
    agree: true,
  });
  requestOpenCameraRequestId.value = '';
  showRequestOpenCameraDialog.value = false;
}

// keep mute
async function handleReject() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenCameraRequestId.value,
    agree: false,
  });
  requestOpenCameraRequestId.value = '';
  showRequestOpenCameraDialog.value = false;
}

// Request canceled
async function onRequestCancelled(eventInfo: { requestId: string }) {
  const { requestId } = eventInfo;
  if (requestOpenCameraRequestId.value === requestId) {
    showRequestOpenCameraDialog.value = false;
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
