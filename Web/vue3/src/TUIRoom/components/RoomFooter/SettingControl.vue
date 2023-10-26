<template>
  <div class="setting-control-container">
    <icon-button
      :is-active="showSettingDialog"
      :title="t('Settings')"
      @click-icon="handleShowSettingDialog"
    >
      <setting-icon></setting-icon>
    </icon-button>
  </div>
</template>

<script setup lang="ts">
import IconButton from '../common/base/IconButton.vue';
import SettingIcon from '../common/icons/SettingIcon.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';

const { t } = useI18n();

const basicStore = useBasicStore();
const { showSettingDialog } = storeToRefs(basicStore);

function handleShowSettingDialog() {
  basicStore.setShowSettingDialog(!basicStore.showSettingDialog);
}
</script>

<style lang="scss" scoped>

@import '../../assets/style/var.scss';

.setting-dialog {
  width: 660px;
  height: 574px;
  position: absolute;
  display: flex;
  .dialog-tabs {
    width: 194px;
    height: 574px;
    background-color: $toolBarBackgroundColor;
  }
  .dialog-content {
    flex-grow: 1;
  }
}
</style>
