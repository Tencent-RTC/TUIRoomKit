<template>
  <div class="setting-control-container">
    <icon-button
      :is-active="showSettingDialog"
      :title="t('Settings.Title')"
      @click-icon="handleShowSettingDialog"
    >
      <IconSetting size="24" />
    </icon-button>
  </div>
  <SettingDialog v-if="showSettingDialog" :visible="showSettingDialog" @close="handleClose" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconSetting, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../base/IconButton.vue';
import SettingDialog from './SettingDialog.vue';

const { t } = useUIKit();

const showSettingDialog = ref(false);

function handleShowSettingDialog() {
  showSettingDialog.value = true;
}

function handleClose() {
  showSettingDialog.value = false;
}
</script>

<style lang="scss" scoped></style>
