<template>
  <icon-button
    v-if="languageConfig.visible"
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
import LanguageIcon from '../../assets/icons/LanguageIcon.svg';
import { useBasicStore } from '../../stores/basic';
import i18n from '../../locales/index';
import { computed } from 'vue';
import { roomService } from '../../services';

const basicStore = useBasicStore();

const title = computed(() => (basicStore.lang === 'en-US' ? 'English' : '中文'));
const languageConfig = roomService.getComponentConfig('Language');

const handleChange = (): void => {
  switch (i18n.global.locale.value) {
    case 'en-US':
      i18n.global.locale.value = 'zh-CN';
      basicStore.setLang('zh-CN');
      uni.setStorageSync('tuiRoom-language', 'zh-CN');
      break;
    case 'zh-CN':
      i18n.global.locale.value = 'en-US';
      basicStore.setLang('en-US');
      uni.setStorageSync('tuiRoom-language', 'en-US');
      break;
  }
};

</script>

<style>
</style>
