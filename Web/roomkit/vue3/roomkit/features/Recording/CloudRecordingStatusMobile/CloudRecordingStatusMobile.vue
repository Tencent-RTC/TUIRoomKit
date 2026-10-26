<template>
  <div
    v-if="isRecording"
    class="cloud-recording-status-mobile"
    :class="{ 'is-clickable': canRecord }"
    role="status"
    @click="handleClick"
  >
    <span class="cloud-recording-status-mobile-dot" aria-hidden="true" />
    <span>{{ t('CloudRecording.RecordingLabel') }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  RecordingStatus,
  RoomParticipantRole,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, TUIToast, t } from '../../../base';
import { getRoomErrorKey } from '../../../utils/roomError';

const { currentRoom, stopRecording } = useRoomState();
const { loginUserInfo } = useLoginState();
const { localParticipant } = useRoomParticipantState();

const isBusy = ref(false);

const isRecording = computed(
  () => currentRoom.value?.recordingInfo?.status === RecordingStatus.Recording,
);

const canRecord = computed(() => {
  const userId = loginUserInfo.value?.userId;
  if (!userId) {
    return false;
  }
  if (currentRoom.value?.roomOwner?.userId === userId) {
    return true;
  }
  return localParticipant.value?.role === RoomParticipantRole.Admin;
});

let stopConfirm: ReturnType<typeof TUIMessageBox.confirm> | null = null;

watch([isRecording, canRecord], () => {
  stopConfirm?.close();
  stopConfirm = null;
});

async function handleClick() {
  if (!canRecord.value || isBusy.value) {
    return;
  }
  const pending = TUIMessageBox.confirm({
    title: t('CloudRecording.StopTitle'),
    message: t('CloudRecording.StopContent'),
    confirmText: t('CloudRecording.StopConfirm'),
    cancelText: t('CloudRecording.Cancel'),
  });
  stopConfirm = pending;
  const confirmed = await pending;
  if (stopConfirm === pending) {
    stopConfirm = null;
  }
  if (!confirmed) {
    return;
  }
  isBusy.value = true;
  try {
    await stopRecording();
    TUIToast.success(t('CloudRecording.EndTitle'));
  } catch (error) {
    console.error('[RoomKit.stopRecording] Failed to stop cloud recording:', error);
    TUIToast.error(t(getRoomErrorKey(error, { fallback: 'CloudRecording.StopError' })));
  } finally {
    isBusy.value = false;
  }
}
</script>

<style scoped lang="scss">
.cloud-recording-status-mobile {
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  color: var(--rk-danger);
  user-select: none;
  background: color-mix(in srgb, var(--rk-danger) 14%, transparent);
  border-radius: 999px;
  -webkit-tap-highlight-color: transparent;
}

.cloud-recording-status-mobile.is-clickable {
  cursor: pointer;
}

.cloud-recording-status-mobile.is-clickable:active {
  background: color-mix(in srgb, var(--rk-danger) 22%, transparent);
}

.cloud-recording-status-mobile-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  background: var(--rk-danger);
  border-radius: 50%;
  animation: cloud-recording-status-mobile-pulse 1.2s ease-in-out infinite;
}

@keyframes cloud-recording-status-mobile-pulse {
  50% { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .cloud-recording-status-mobile-dot {
    animation: none;
  }
}
</style>
