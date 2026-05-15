<script setup lang="ts">
import { UIKitProvider } from '@tencentcloud/uikit-base-component-vue3';
</script>

<template>
  <UIKitProvider :theme="{ themeStyle: 'light', primaryColor: 'theme' }">
    <router-view />
  </UIKitProvider>
</template>
