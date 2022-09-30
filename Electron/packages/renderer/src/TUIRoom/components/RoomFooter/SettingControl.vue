<template>
  <div class="setting-control-container">
    <icon-button
      :title="t('Settings')"
      :icon-name="iconName"
      @click="handleShowSettingDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const basicStore = useBasicStore();
const { showSettingDialog } = storeToRefs(basicStore);

const iconName = computed(() => (showSettingDialog.value ? ICON_NAME.SettingActive : ICON_NAME.Setting));

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
