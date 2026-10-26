<template>
  <div class="general-settings">
    <div class="general-settings-row">
      <span class="general-settings-row-title">{{ t('Settings.Theme') }}</span>
      <span class="general-settings-row-control">
        <div class="general-settings-theme" role="radiogroup" :aria-label="t('Settings.Theme')">
          <button
            v-for="option in THEME_OPTIONS"
            :key="option.value"
            class="general-settings-theme-option"
            :class="{ 'is-selected': theme === option.value }"
            type="button"
            role="radio"
            :aria-checked="theme === option.value"
            @click="selectTheme(option.value)"
          >
            {{ t(option.labelKey) }}
          </button>
        </div>
      </span>
    </div>

    <div class="general-settings-row">
      <span class="general-settings-row-title">{{ t('Settings.Language') }}</span>
      <span class="general-settings-row-control">
        <TUISelect :model-value="i18n.language" size="sm" @change="selectLanguage">
          <TUIOption
            v-for="option in LANGUAGE_OPTIONS"
            :key="option.value"
            :value="option.value"
            :label="t(option.labelKey)"
          />
        </TUISelect>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUIOption, TUISelect, useUIConfig, i18n, t } from '../../../base';
import type { Language } from '../../../base';

const LANGUAGE_OPTIONS: Array<{ value: Language; labelKey: string }> = [
  { value: 'zh-CN', labelKey: 'Settings.LanguageZhCN' },
  { value: 'en-US', labelKey: 'Settings.LanguageEnUS' },
];

const THEME_OPTIONS = [
  { value: 'light' as const, labelKey: 'Settings.ThemeLight' },
  { value: 'dark' as const, labelKey: 'Settings.ThemeDark' },
];

const { uiConfig, setUIConfig } = useUIConfig();
const theme = computed(() => uiConfig.theme);

function selectTheme(nextTheme: typeof THEME_OPTIONS[number]['value']) {
  setUIConfig({ theme: nextTheme });
}

function selectLanguage(language: string | number | null) {
  const next = LANGUAGE_OPTIONS.find(option => option.value === language);
  if (!next) {
    return;
  }
  i18n.changeLanguage(next.value);
}
</script>

<style scoped lang="scss">
.general-settings-row {
  display: flex;
  gap: var(--rk-space-4);
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: var(--rk-space-2) 0;
}

.general-settings-row-title {
  min-width: 0;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-primary);
}

.general-settings-row-control {
  display: flex;
  flex: 1 1 120px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  max-width: 240px;
}

.general-settings-row-control :deep(.rk-select) {
  width: 100%;
  min-width: 0;
}

.general-settings-theme {
  display: inline-flex;
  padding: 3px;
  background: var(--rk-bg-muted);
  border-radius: var(--rk-radius-pill);
}

.general-settings-theme-option {
  padding: 5px 12px;
  font: inherit;
  font-size: var(--rk-fs-sm);
  line-height: 1.2;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--rk-radius-pill);
}

.general-settings-theme-option.is-selected {
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  box-shadow: 0 1px 2px color-mix(in srgb, #000 12%, transparent);
}

@container settings-dialog (max-width: 560px) {
  .general-settings-row {
    flex-wrap: wrap;
  }

  .general-settings-row-control {
    flex: 1 1 100%;
    justify-content: flex-start;
    max-width: none;
  }
}
</style>
