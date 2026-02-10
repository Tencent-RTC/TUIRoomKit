<template>
  <icon-button
    :title="t('ScreenShare.Title')"
    :disabled="isScreenShareDisabled"
    @click-icon="handleScreenShare"
  >
    <IconStopScreenShare v-if="screenStatus === DeviceStatus.On" size="24" />
    <IconScreenShare
      v-if="screenStatus === DeviceStatus.Off"
      size="24"
    />
    <IconUnSupport
      v-if="screenLastError !== DeviceError.NoError"
      class="un-support-icon"
      size="14"
    />
  </icon-button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconScreenShare, IconStopScreenShare, TUIMessageBox, TUIToast, useUIKit, IconUnSupport } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, DeviceStatus, useRoomState, useRoomParticipantState, RoomParticipantRole, DeviceError } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

const { currentRoom } = useRoomState();
const { localParticipant, participantWithScreen } = useRoomParticipantState();
const { screenStatus, screenLastError, startScreenShare, stopScreenShare } = useDeviceState();
const { t } = useUIKit();

const isLocalScreenShareUser = computed(() => participantWithScreen.value && participantWithScreen.value.userId === localParticipant.value?.userId);
const isScreenShareDisabled = computed(() => currentRoom.value?.isAllScreenShareDisabled && localParticipant.value?.role === RoomParticipantRole.GeneralUser && !isLocalScreenShareUser.value);

async function handleStartScreenShare() {
  try {
    await startScreenShare({ screenAudio: true });
  } catch (error: any) {
    let message = '';
    switch (error.name) {
      case 'NotReadableError':
        message = t('ScreenShare.SystemProhibitsAccessScreenContent');
        break;
      case 'NotAllowedError':
        if (error.message.includes('Permission denied by system')) {
          message = t('ScreenShare.SystemProhibitsAccessScreenContent');
        } else {
          message = t('ScreenShare.UserCanceledScreenSharing');
        }
        break;
      default:
        message = t('ScreenShare.UnknownErrorOccurredWhileSharing');
        break;
    }
    TUIToast.warning({
      message,
    });
  }
}

async function handleScreenShare() {
  if (screenStatus.value === DeviceStatus.On) {
    TUIMessageBox.confirm({
      title: t('ScreenShare.EndSharing'),
      content: t('ScreenShare.StopSharingConfirm'),
      callback: async (action: string) => {
        if (action === 'confirm') {
          await stopScreenShare();
        }
      },
    });
  } else {
    if (isScreenShareDisabled.value) {
      TUIToast.warning({
        message: t('ScreenShare.NotAllowedToShareScreen'),
      });
      return;
    }
    if (participantWithScreen.value) {
      TUIToast.warning({
        message: t('ScreenShare.AnotherIsSharingTheScreen'),
      });
      return;
    }
    if (screenLastError.value === DeviceError.NotSupportCapture) {
      TUIToast.warning({
        message: t('ScreenShare.BrowserDoesNotSupportScreenSharing'),
      });
      return;
    }
    TUIMessageBox.confirm({
      title: t('ScreenShare.StartSharing'),
      content: t('ScreenShare.StartSharingConfirm'),
      callback: async (action: string) => {
        if (action === 'confirm') {
          await handleStartScreenShare();
        }
      },
    });
  }
}
</script>

<style scoped lang="scss">
.un-support-icon {
  position: absolute;
  top: 13px;
  left: 26px;
}
</style>
