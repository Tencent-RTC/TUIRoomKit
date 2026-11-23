<template>
  <TUIDialog
    :open="open"
    width="380px"
    :title="t('Preclass.CancelClass')"
    :confirm-text="t('Schedule.CancelConfirm')"
    :cancel-text="t('Schedule.CancelThink')"
    confirm-variant="danger"
    :confirm-loading="busy"
    :cancel-disabled="busy"
    @update:open="emit('update:open', $event)"
    @confirm="emit('confirm')"
  >
    <p class="preclass-cancel-desc">
      {{ t('Preclass.CancelClassDesc') }}
    </p>
  </TUIDialog>
</template>

<script setup lang="ts">
import { TUIDialog, t } from '@tencentcloud/roomkit-web-vue3';

defineProps<{
  open: boolean;
  busy: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'confirm': [];
}>();
</script>

<style scoped lang="scss">
.preclass-cancel-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--rk-text-secondary);
}
</style>
