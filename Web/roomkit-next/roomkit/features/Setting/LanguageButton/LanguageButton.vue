<template>
  <span class="language-button">
    <TopbarButton placement="bottom-end" :label="t('Settings.Language')" :aria-label="t('Settings.Language')">
      <IconGlobe :size="14" />
      <span>{{ label }}</span>
      <IconChevron class="language-caret" :size="10" />
      <template #dropdown="{ close }">
        <div class="language-menu" role="listbox">
          <div
            v-for="option in options"
            :key="option.code"
            class="language-menu-item"
            :class="{ 'is-active': language === option.code }"
            role="option"
            :aria-selected="language === option.code"
            @click="selectLanguage(option.code, close)"
          >
            <span>{{ option.label }}</span>
            <IconCheck class="language-check" :size="12" />
          </div>
        </div>
      </template>
    </TopbarButton>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconCheck, IconChevron, IconGlobe, useI18n } from '../../../base';
import TopbarButton from '../../../layouts/TopbarButton.vue';

const LANGUAGE_STORAGE_KEY = 'tuiRoom-language';
const options = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' },
];

const { language, setLanguage, t } = useI18n();
const label = computed(() => (language.value === 'en-US' ? 'English' : '中文'));

function selectLanguage(code: string, close: () => void) {
  if (code !== language.value) {
    setLanguage(code);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  }
  close();
}
</script>

<style scoped lang="scss">
.language-button {
  display: inline-flex;
}

.language-button :deep(.topbar-button) {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
}

.language-button :deep(.topbar-button:hover),
.language-button :deep(.topbar-button-active),
.language-button :deep(.topbar-button:focus-visible) {
  color: var(--rk-brand);
  background: var(--rk-bg-hover);
  outline: none;
}

.language-button :deep(.rk-icon) {
  opacity: 0.7;
  transition: opacity 0.15s;
}

.language-button :deep(.topbar-button:hover) .rk-icon,
.language-button :deep(.topbar-button-active) .rk-icon {
  opacity: 1;
}

.language-caret {
  transition: transform 0.18s ease;
}

.language-button :deep(.topbar-button-active) .language-caret {
  transform: rotate(180deg);
}

:global(.rk-popover:has(.language-menu)) {
  min-width: 168px;
  border-radius: 12px;
}

.language-menu {
  min-width: 168px;
  max-height: 280px;
  padding: 6px;
  overflow-y: auto;
}

.language-menu-item {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--rk-text-primary);
  cursor: pointer;
  border-radius: 8px;
}

.language-menu-item:hover {
  background: var(--rk-bg-hover);
}

.language-menu-item.is-active {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
}

.language-check {
  flex: none;
  color: var(--rk-brand);
  opacity: 0;
}

.language-menu-item.is-active .language-check {
  opacity: 1;
}
</style>
