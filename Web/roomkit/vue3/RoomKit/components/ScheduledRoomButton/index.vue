<template>
  <div class="room-button">
    <TUIButton
      class="button"
      size="large"
      type="primary"
      :icon="IconScheduleRoom"
      @click="handleScheduleRoom"
    >
      {{ t('Button.ScheduleRoom') }}
    </TUIButton>

    <TUIDialog
      v-model:visible="showSchedulePanel"
      :title="t('Button.ScheduleMeeting')"
    >
      <ScheduleRoomPanel @cancel="handleCancel" @confirm="handleConfirm" />
      <template #footer>
        <div />
      </template>
    </TUIDialog>

    <RoomInviteSuccessDialog
      v-model:visible="showSuccessDialog"
      :room-id="scheduledRoomId"
      :password="scheduledPassword"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconScheduleRoom, TUIButton, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ScheduleRoomPanel, useLoginState } from 'tuikit-atomicx-vue3/room';
import RoomInviteSuccessDialog from './RoomInviteSuccessDialog.vue';
import type { ScheduleRoomOptions } from 'tuikit-atomicx-vue3/types';

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();

const showSchedulePanel = ref(false);
const showSuccessDialog = ref(false);
const scheduledRoomId = ref<string>('');
const scheduledPassword = ref<string>('');

const handleScheduleRoom = () => {
  if (!loginUserInfo.value?.userId) {
    TUIToast.error({ message: t('Button.PleaseLoginFirst') });
    return;
  }
  showSchedulePanel.value = true;
};

const handleCancel = () => {
  showSchedulePanel.value = false;
};

const handleConfirm = async (roomId: string, scheduleOptions: ScheduleRoomOptions) => {
  showSchedulePanel.value = false;
  scheduledRoomId.value = roomId;
  scheduledPassword.value = scheduleOptions.password || '';
  showSuccessDialog.value = true;
};
</script>

<style lang="scss" scoped>
.room-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  .button {
    width: 100%;
    height: 100%;
  }
}
</style>
