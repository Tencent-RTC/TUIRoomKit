<template>
  <ToolbarButtonPC
    v-if="canRecord"
    :label="label"
    overflow-key="CloudRecording.RecordLabel"
    :icon="isRecording ? IconRecording : IconRecord"
    :loading="isBusy"
    @click="handleClick"
  />
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
import { IconRecord, IconRecording, TUIMessageBox, TUIToast, t } from '../../../base';
import { getRoomErrorKey } from '../../../utils/roomError';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';

/** Cloud recording is enabled per SDKAppID in the console; the engine reports that gap with this code. */
const ERROR_RECORDING_NOT_ENABLED = 101072;

const START_RECORDING_ERROR = {
  featureErrors: { [ERROR_RECORDING_NOT_ENABLED]: 'CloudRecording.StartError_101072' },
  fallback: 'CloudRecording.StartError',
};

const STOP_RECORDING_ERROR = {
  fallback: 'CloudRecording.StopError',
};

const { currentRoom, startRecording, stopRecording } = useRoomState();
const { loginUserInfo } = useLoginState();
const { localParticipant } = useRoomParticipantState();

const isBusy = ref(false);

const isRecording = computed(
  () => currentRoom.value?.recordingInfo?.status === RecordingStatus.Recording,
);

/**
 * Ownership reads from the room record; admin falls back to the local participant.
 * The participant list stays empty until something calls getParticipantList(), so a
 * missing local row has to fail closed instead of handing out the control.
 */
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

const label = computed(() => t(isRecording.value ? 'CloudRecording.RecordingLabel' : 'CloudRecording.RecordLabel'));

let actionConfirm: ReturnType<typeof TUIMessageBox.confirm> | null = null;

/** Another host acting, or a demotion, answers the pending question for us. */
watch([isRecording, canRecord], () => {
  actionConfirm?.close();
  actionConfirm = null;
});

async function askConfirm(options: Parameters<typeof TUIMessageBox.confirm>[0]) {
  const pending = TUIMessageBox.confirm(options);
  actionConfirm = pending;
  const confirmed = await pending;
  if (actionConfirm === pending) {
    actionConfirm = null;
  }
  return confirmed;
}

async function startWithConfirm() {
  const confirmed = await askConfirm({
    title: t('CloudRecording.StartTitle'),
    message: t('CloudRecording.StartContent'),
    confirmText: t('CloudRecording.StartConfirm'),
    cancelText: t('CloudRecording.Cancel'),
  });
  if (!confirmed) {
    return;
  }
  isBusy.value = true;
  try {
    await startRecording();
  } catch (error) {
    console.error('[RoomKit.startRecording] Failed to start cloud recording:', error);
    TUIToast.error(t(getRoomErrorKey(error, START_RECORDING_ERROR)));
  } finally {
    isBusy.value = false;
  }
}

async function stopWithConfirm() {
  const confirmed = await askConfirm({
    title: t('CloudRecording.StopTitle'),
    message: t('CloudRecording.StopContent'),
    confirmText: t('CloudRecording.StopConfirm'),
    cancelText: t('CloudRecording.Cancel'),
  });
  if (!confirmed) {
    return;
  }
  isBusy.value = true;
  try {
    await stopRecording();
    TUIToast.success(t('CloudRecording.EndTitle'));
  } catch (error) {
    console.error('[RoomKit.stopRecording] Failed to stop cloud recording:', error);
    TUIToast.error(t(getRoomErrorKey(error, STOP_RECORDING_ERROR)));
  } finally {
    isBusy.value = false;
  }
}

function handleClick() {
  if (!canRecord.value) {
    return;
  }
  void (isRecording.value ? stopWithConfirm() : startWithConfirm());
}
</script>
