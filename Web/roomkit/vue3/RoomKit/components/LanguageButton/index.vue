<template>
  <div class="icon-button-container" @click="handleClickLanguageIcon">
    <IconLanguage />
    <span>{{ language === 'en-US' ? 'English' : '中文' }}</span>
  </div>
</template>

<script setup lang="ts">
import { IconLanguage, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { setLanguage, language } = useUIKit();

const handleClickLanguageIcon = () => {
  const newLanguage = language.value === 'en-US' ? 'zh-CN' : 'en-US';
  setLanguage(newLanguage);
  localStorage.setItem('tuiRoom-language', newLanguage);
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
