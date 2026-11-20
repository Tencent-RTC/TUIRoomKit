<template>
  <div class="profile-user-id" :class="`is-${size}`">
    <span class="profile-user-id-label">UserID</span>
    <code class="profile-user-id-value" :title="userId">{{ userId }}</code>
    <TUICopyButton
      :copied="isCopied"
      :size="size"
      :aria-label="isCopied ? t('Preclass.Copied') : t('Preclass.CopyUserId')"
      @click.stop="copy(COPY_KEY, userId)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { TUICopyButton, TUIToast, t, useCopyFeedback } from '@tencentcloud/roomkit-web-vue3';

const props = defineProps<{
  userId: string;
  /** sm: PC profile popover. lg: H5 account sheet. */
  size: 'sm' | 'lg';
}>();

const COPY_KEY = 'userId';

const { copiedKeys, isCopyFailed, copy } = useCopyFeedback(() => props.userId);
const isCopied = computed(() => copiedKeys.has(COPY_KEY));

watch(isCopyFailed, (isFailed) => {
  if (isFailed) {
    TUIToast.error(t('Preclass.CopyFailed'));
  }
});
</script>

<style scoped lang="scss">
.profile-user-id {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  color: var(--rk-text-tertiary);
  background: var(--rk-bg-hover);
}

.profile-user-id.is-sm {
  height: 36px;
  padding: 0 4px 0 10px;
  font-size: 13px;
  line-height: 18px;
  border-radius: 8px;
}

.profile-user-id.is-lg {
  height: 48px;
  padding: 0 8px 0 14px;
  font-size: 15px;
  line-height: 20px;
  border-radius: 12px;
}

.profile-user-id-label {
  flex: none;
}

.profile-user-id-value {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font: inherit;
  color: var(--rk-text-primary);
  text-align: end;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
