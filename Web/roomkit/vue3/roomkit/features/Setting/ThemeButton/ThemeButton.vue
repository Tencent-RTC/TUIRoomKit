<template>
  <span class="theme-button" :class="{ 'is-dark': uiConfig.theme === 'dark' }">
    <TopbarButton :label="label" @click="toggleTheme">
      <span class="theme-icon-wrap">
        <IconSun class="theme-icon is-sun" :size="16" />
        <IconMoon class="theme-icon is-moon" :size="16" />
      </span>
    </TopbarButton>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconMoon, IconSun, useI18n, useUIConfig } from '../../../base';
import TopbarButton from '../../../layouts/TopbarButton.vue';

const { t } = useI18n();
const { uiConfig, setUIConfig } = useUIConfig();

/** The tip names what the click does, like the device toggles, not which theme is on. */
const label = computed(() =>
  (uiConfig.theme === 'dark' ? t('Settings.ThemeToLight') : t('Settings.ThemeToDark')),
);

function toggleTheme() {
  setUIConfig({ theme: uiConfig.theme === 'dark' ? 'light' : 'dark' });
}
</script>

<style scoped lang="scss">
.theme-button {
  display: inline-flex;
}

.theme-button :deep(.topbar-button) {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
}

.theme-button :deep(.topbar-button:hover),
.theme-button :deep(.topbar-button:focus-visible) {
  color: var(--rk-brand);
  background: var(--rk-bg-hover);
  outline: none;
}

.theme-icon-wrap {
  position: relative;
  width: 16px;
  height: 16px;
}

.theme-icon {
  position: absolute;
  inset: 0;
  transition:
    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.35s ease;
}

.theme-icon.is-sun {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.theme-icon.is-moon {
  opacity: 0;
  transform: rotate(90deg) scale(0);
}

.theme-button.is-dark .theme-icon.is-sun {
  opacity: 0;
  transform: rotate(-90deg) scale(0);
}

.theme-button.is-dark .theme-icon.is-moon {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}
</style>
