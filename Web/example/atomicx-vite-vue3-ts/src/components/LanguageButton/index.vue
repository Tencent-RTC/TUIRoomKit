<template>
  <icon-button
    :title="language === 'en-US' ? 'English' : '中文'"
    layout="horizontal"
    @click-icon="handleClickLanguageIcon"
  >
    <IconLanguage />
  </icon-button>
</template>

<script setup lang="ts">
import { IconLanguage, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../base/IconButton.vue';

const { setLanguage, language } = useUIKit();

const handleClickLanguageIcon = () => {
  setLanguage(language.value === 'en-US' ? 'zh-CN' : 'en-US');
};
</script>

<style lang="scss" scoped></style>
