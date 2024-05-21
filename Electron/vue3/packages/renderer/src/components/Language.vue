<template>
  <icon-button
    :title="title"
    :layout="IconButtonLayout.HORIZONTAL"
    :icon="LanguageIcon"
    theme="black"
    @click-icon="handleChange"
  >
  </icon-button>
</template>

<script setup lang="ts">
import { IconButton } from '@tencentcloud/roomkit-electron-vue3';
import { IconButtonLayout } from '@tencentcloud/roomkit-electron-vue3/es/constants/room';
import LanguageIcon from './icons/LanguageIcon.vue';
import i18n from '../locales/index';
import { computed } from 'vue';

const title = computed(() => (i18n.global.locale.value === 'en-US' ? 'English' : '中文'));

const handleChange = (): void => {
  switch (i18n.global.locale.value) {
    case 'en-US':
      i18n.global.locale.value = 'zh-CN';
      break;
    case 'zh-CN':
      i18n.global.locale.value = 'en-US';
      break;
  }
};

</script>

<style>
</style>
