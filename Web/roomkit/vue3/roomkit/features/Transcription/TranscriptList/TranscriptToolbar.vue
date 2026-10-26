<template>
  <div
    class="transcript-toolbar"
    :class="{ 'transcript-toolbar-mobile': mobile }"
  >
    <TUIInput
      v-if="searchOpen"
      v-model="keyword"
      class="transcript-toolbar-search"
      size="sm"
      auto-focus
      :placeholder="t('AITools.SearchPlaceholder')"
      @keydown.esc="emit('close-search')"
    >
      <template #prefix>
        <IconSearch :size="14" />
      </template>
    </TUIInput>
    <span v-else class="transcript-toolbar-status" :class="{ 'is-off': !asrOn }">
      <i />
      {{ asrOn ? t('AITools.RecordStatusOn') : t('AITools.RecordStatusIdle') }}
    </span>
    <div class="transcript-toolbar-actions">
      <button
        class="transcript-toolbar-action"
        type="button"
        :class="{ 'is-on': searchOpen }"
        :aria-label="t('AITools.Search')"
        :aria-pressed="searchOpen"
        @click.stop="emit('toggle-search')"
      >
        <IconSearch :size="16" />
      </button>
      <button
        class="transcript-toolbar-action"
        type="button"
        :aria-label="keyword.trim() ? t('AITools.CopySearchResult') : t('AITools.CopyTranscript')"
        @click="emit('copy')"
      >
        <IconCopy :size="16" />
      </button>
      <div ref="settingsHostRef" class="transcript-toolbar-settings">
        <button
          class="transcript-toolbar-action"
          type="button"
          :class="{ 'is-on': settingsPressed }"
          :aria-label="t('AITools.SettingsTitle')"
          :aria-pressed="mobile ? undefined : settingsPressed"
          @click.stop="emit('settings')"
        >
          <IconSettings :size="16" />
        </button>
        <slot name="settings" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { IconCopy, IconSearch, IconSettings, TUIInput, t } from '../../../base';

const props = defineProps<{
  asrOn: boolean;
  mobile?: boolean;
  settingsPressed?: boolean;
}>();

const keyword = defineModel<string>('keyword', { required: true });
const searchOpen = defineModel<boolean>('searchOpen', { required: true });

const emit = defineEmits<{
  'toggle-search': [];
  'close-search': [];
  copy: [];
  settings: [];
  'close-settings': [];
}>();

const settingsHostRef = ref<HTMLElement>();

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (!props.settingsPressed || !target || settingsHostRef.value?.contains(target)) {
    return;
  }
  emit('close-settings');
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
});
</script>

<style scoped lang="scss">
.transcript-toolbar {
  box-sizing: border-box;
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  height: 46px;
  padding: 0 10px 0 16px;
  background: var(--rk-bg-surface);
}

.transcript-toolbar-mobile {
  height: 44px;
  background: transparent;
}

.transcript-toolbar-status {
  display: inline-flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--rk-text-secondary);
}

.transcript-toolbar-mobile .transcript-toolbar-status {
  font-size: var(--rk-fs-sm);
  line-height: 16px;
}

.transcript-toolbar-status i {
  flex: none;
  width: 7px;
  height: 7px;
  background: var(--rk-danger);
  border-radius: 50%;
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--rk-danger) 55%, transparent);
  animation: transcript-toolbar-pulse 2s ease-out infinite;
}

.transcript-toolbar-status.is-off i {
  background: var(--rk-text-tertiary);
  box-shadow: none;
  animation: none;
}

.transcript-toolbar-actions {
  display: inline-flex;
  flex: none;
  gap: 4px;
  align-items: center;
}

.transcript-toolbar-mobile .transcript-toolbar-actions {
  gap: 0;
}

.transcript-toolbar-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.transcript-toolbar-mobile .transcript-toolbar-action {
  width: 32px;
  height: 32px;
}

.transcript-toolbar-mobile .transcript-toolbar-action:active {
  background: var(--rk-bg-hover);
}

.transcript-toolbar:not(.transcript-toolbar-mobile) .transcript-toolbar-action:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.transcript-toolbar-action.is-on {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
}

.transcript-toolbar-mobile .transcript-toolbar-action.is-on {
  background: transparent;
}

.transcript-toolbar-settings {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
}

.transcript-toolbar-search {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  height: 32px;
  border-radius: var(--rk-radius-pill);
}

.transcript-toolbar-mobile .transcript-toolbar-search :deep(.rk-input-field) {
  font-size: var(--rk-fs-sm);
}

@keyframes transcript-toolbar-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--rk-danger) 55%, transparent);
  }

  70% {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--rk-danger) 0%, transparent);
  }

  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--rk-danger) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .transcript-toolbar-status i {
    animation: none;
  }
}
</style>
