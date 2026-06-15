<template>
  <TUIDialog
    :visible="isShowDialog"
    :title="t('ParticipantList.ChangeName')"
    :confirmDisabled="isConfirmButtonDisable"
    :cancel-text="t('ParticipantList.Cancel')"
    :confirm-text="t('ParticipantList.Confirm')"
    @confirm="handleConfirm"
    @cancel="handleCancel"
    @close="handleCancel"
  >
    <TUIInput
      :model-value="inputUserName"
      class="dialog-input"
      :placeholder="t('ParticipantList.InputUserName')"
      @input="inputUserName = $event"
    />
  </TUIDialog>
</template>

<script setup lang="ts">
import { ref, defineProps, computed } from 'vue';
import { TUIDialog, TUIInput, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

interface Props {
  userInfo: RoomParticipant;
  confirmFunction: (name: string) => void;
}

const props = defineProps<Props>();
const { t } = useUIKit();

const inputUserName = ref(props.userInfo.nameCard || props.userInfo.userName || '');
const isShowDialog = ref(true);
const isConfirmButtonDisable = computed(() => !inputUserName.value.trim());

async function handleConfirm() {
  await props.confirmFunction(inputUserName.value);
  isShowDialog.value = false;
}

function handleCancel() {
  inputUserName.value
    = props.userInfo.nameCard || props.userInfo.userName || '';
  isShowDialog.value = false;
}
</script>

<style lang="scss" scoped>
</style>
