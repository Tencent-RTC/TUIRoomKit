<template>
  <icon-button
    :title="t('Theme.Title')"
    layout="horizontal"
    @click-icon="handleClickThemeIcon"
  >
    <IconSwitchTheme size="20" />
  </icon-button>
</template>

<script setup lang="ts">
import { IconSwitchTheme, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../base/IconButton.vue';

const { t, setTheme, theme } = useUIKit();

const handleClickThemeIcon = () => {
  setTheme(theme.value === 'dark' ? 'light' : 'dark');
};
</script>
