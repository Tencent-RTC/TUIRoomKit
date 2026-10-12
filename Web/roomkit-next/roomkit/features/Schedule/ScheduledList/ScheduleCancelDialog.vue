<template>
  <TUIDialog
    :open="open"
    :title="t('Schedule.CancelRoom')"
    width="380px"
    confirm-text=""
    cancel-text=""
    :close-on-overlay="!busy"
    :close-on-esc="!busy"
    @update:open="$emit('update:open', $event)"
  >
    <p class="cal-cancel-desc">
      {{ t('Schedule.CancelRoomDesc') }}
    </p>
    <template #footer>
      <div class="cal-cancel-actions">
        <TUIButton
          class="cal-cancel-button"
          variant="secondary"
          :disabled="busy"
          @click="$emit('update:open', false)"
        >
          {{ t('Schedule.CancelThink') }}
        </TUIButton>
        <TUIButton
          class="cal-cancel-button is-primary"
          variant="primary"
          :disabled="busy"
          @click="$emit('confirm')"
        >
          {{ t('Schedule.CancelConfirm') }}
        </TUIButton>
      </div>
    </template>
  </TUIDialog>
</template>

<script setup lang="ts">
import { TUIButton, TUIDialog } from '../../../base';
import { t } from '../../../i18n';

defineProps<{
  open: boolean;
  busy?: boolean;
}>();
defineEmits<{
  'update:open': [open: boolean];
  'confirm': [];
}>();
</script>

<style scoped lang="scss">
.cal-cancel-desc {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--rk-text-tertiary);
}

.cal-cancel-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
}

.cal-cancel-button {
  height: 36px;
  padding: 0 16px;
  border-radius: 12px;
}
</style>
