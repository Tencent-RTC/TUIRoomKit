<template>
  <div
    v-if="isRecording"
    class="cloud-recording-status"
    :class="{ 'is-clickable': canRecord }"
    role="status"
    @click="handleClick"
  >
    <span class="cloud-recording-status-dot" aria-hidden="true" />
    <span>{{ t('CloudRecording.StatusLabel') }}</span>
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

/** Same fail-closed rule as CloudRecordingButton: owner from the room record, admin from the local row. */
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

/** Another host stopping the recording, or a demotion, answers the pending question for us. */
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
.cloud-recording-status {
  box-sizing: border-box;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: var(--rk-danger);
  user-select: none;
  background: color-mix(in srgb, var(--rk-danger) 14%, transparent);
  border-radius: 8px;
}

.cloud-recording-status.is-clickable {
  cursor: pointer;
}

.cloud-recording-status.is-clickable:hover {
  opacity: 0.9;
}

.cloud-recording-status-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  background: var(--rk-danger);
  border-radius: 50%;

  /* steps(10) approximates the old breathing pulse with fewer GPU blends. */
  animation: cloud-recording-status-pulse 1.2s steps(10, end) infinite;
}

@keyframes cloud-recording-status-pulse {
  0%,
  15%,
  100% { opacity: 1; }

  50%,
  65% { opacity: 0.3; }
}
</style>
