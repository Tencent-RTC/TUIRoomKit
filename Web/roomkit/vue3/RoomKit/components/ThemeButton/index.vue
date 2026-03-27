<template>
  <IconButton
    layout="horizontal"
    :title="t('Theme.Title')"
    @click-icon="handleClickThemeIcon"
  >
    <IconSwitchTheme :size="20" />
  </IconButton>
</template>

<script setup lang="ts">
import { IconSwitchTheme, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../base/IconButton.vue';

const { t, setTheme, theme } = useUIKit();

const handleClickThemeIcon = () => {
  const newTheme = theme.value === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  localStorage.setItem('tuiRoom-theme', newTheme);
};
</script>
