<template>
  <IconButtonH5 :title="t('Settings.Title')" @click="isSettingPopupVisible = true">
    <IconSetting size="24" />
  </IconButtonH5>

  <SettingPopup
    v-if="isSettingPopupVisible"
    @close="isSettingPopupVisible = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IconSetting,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import IconButtonH5 from '../base/IconButtonH5.vue';
import SettingPopup from './SettingPopup.vue';

const { t } = useUIKit();

const isSettingPopupVisible = ref(false);
</script>
