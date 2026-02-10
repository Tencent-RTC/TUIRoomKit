<template>
  <div class="icon-button-container" @click="handleClickThemeIcon">
    <IconSwitchTheme size="20" />
    <span>{{ t('Theme.Title') }}</span>
  </div>
</template>

<script setup lang="ts">
import { IconSwitchTheme, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t, setTheme, theme } = useUIKit();

const handleClickThemeIcon = () => {
  const newTheme = theme.value === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  localStorage.setItem('tuiRoom-theme', newTheme);
};
</script>

<style lang="scss" scoped>
.icon-button-container {
  gap: 4px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--text-color-primary);
  margin-left: 4px;
  font-size: 14px;
  font-weight: 500;
  line-height: 26px;
  white-space: nowrap;
  padding: 5px;
}
</style>
