<template>
  <icon-button
    :title="title"
    :layout="IconButtonLayout.HORIZONTAL"
    :icon="LanguageIcon"
    @click-icon="handleChange"
  >
  </icon-button>
</template>

<script setup lang="ts">
import IconButton from './base/IconButton.vue';
import { IconButtonLayout } from '../../constants/room';
import LanguageIcon from './icons/LanguageIcon.vue';
import { useBasicStore } from '../../stores/basic';
import i18n from '../../locales/index';
import { computed } from 'vue';

const basicStore = useBasicStore();

const title = computed(() => (basicStore.lang === 'en-US' ? 'English' : '中文'));

const handleChange = (): void => {
  switch (i18n.global.locale.value) {
    case 'en-US':
      i18n.global.locale.value = 'zh-CN';
      basicStore.setLang('zh-CN');
      localStorage.setItem('tuiRoom-language', 'zh-CN');
      break;
    case 'zh-CN':
      i18n.global.locale.value = 'en-US';
      basicStore.setLang('en-US');
      localStorage.setItem('tuiRoom-language', 'en-US');
      break;
  }
};

</script>

<style>
</style>
