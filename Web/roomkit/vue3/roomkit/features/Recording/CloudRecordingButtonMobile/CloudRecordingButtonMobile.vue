<template>
  <ToolbarButtonMobile
    v-if="canRecord"
    :label="label"
    :disabled="isBusy"
    @click="handleClick"
  >
    <IconRecording v-if="isRecording" :size="20" />
    <IconRecord v-else :size="20" />
  </ToolbarButtonMobile>
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
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';
import { getRoomErrorKey } from '../../../utils/roomError';

/** Cloud recording is enabled per SDKAppID in the console; the engine reports that gap with this code. */
const ERROR_RECORDING_NOT_ENABLED = 101072;

const emit = defineEmits<{ click: [] }>();

const { currentRoom, startRecording, stopRecording } = useRoomState();
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

const label = computed(() => t(isRecording.value ? 'CloudRecording.RecordingLabel' : 'CloudRecording.RecordLabel'));

let actionConfirm: ReturnType<typeof TUIMessageBox.confirm> | null = null;

watch([isRecording, canRecord], () => {
  actionConfirm?.close();
  actionConfirm = null;
});

async function handleClick() {
  if (!canRecord.value || isBusy.value) {
    return;
  }
  emit('click');
  const stop = isRecording.value;
  const pending = TUIMessageBox.confirm(stop
    ? {
      title: t('CloudRecording.StopTitle'),
      message: t('CloudRecording.StopContent'),
      confirmText: t('CloudRecording.StopConfirm'),
      cancelText: t('CloudRecording.Cancel'),
    }
    : {
      title: t('CloudRecording.StartTitle'),
      message: t('CloudRecording.StartContent'),
      confirmText: t('CloudRecording.StartConfirm'),
      cancelText: t('CloudRecording.Cancel'),
    });
  actionConfirm = pending;
  const confirmed = await pending;
  if (actionConfirm === pending) {
    actionConfirm = null;
  }
  if (!confirmed) {
    return;
  }
  isBusy.value = true;
  try {
    if (stop) {
      await stopRecording();
      TUIToast.success(t('CloudRecording.EndTitle'));
    } else {
      await startRecording();
    }
  } catch (error) {
    console.error('[RoomKit.cloudRecording] Failed to toggle cloud recording:', error);
    TUIToast.error(t(getRoomErrorKey(error, stop
      ? { fallback: 'CloudRecording.StopError' }
      : {
        featureErrors: { [ERROR_RECORDING_NOT_ENABLED]: 'CloudRecording.StartError_101072' },
        fallback: 'CloudRecording.StartError',
      })));
  } finally {
    isBusy.value = false;
  }
}
</script>
