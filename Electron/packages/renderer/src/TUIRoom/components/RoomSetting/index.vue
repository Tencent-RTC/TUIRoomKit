<template>
  <div v-if="showSettingDialog" class="setting-dialog">
    <div class="dialog-tabs">
      <span class="dialog-title">{{ t('Settings') }}</span>
      <div
        v-for="(item, index) in settingTabsTitleList"
        :key="index"
        :class="['tabs-title', `${activeSettingTab === item.value ? 'active' : ''}`]"
        @click="handleUpdateActiveTab(item.value)"
      >
        {{ item.label }}
      </div>
    </div>
    <div class="dialog-content">
      <audio-setting-tab v-if="activeSettingTab === 'audio'" :mode="SettingMode.DETAIL"></audio-setting-tab>
      <video-setting-tab v-if="activeSettingTab === 'video'" :mode="SettingMode.DETAIL"></video-setting-tab>
    </div>
    <svg-icon
      class="close-icon"
      icon-name="close"
      size="medium"
      @click="handleCloseSettingDialog"
    ></svg-icon>
  </div>
</template>

<script setup lang="ts">
// import { ref } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';
import AudioSettingTab from '../base/AudioSettingTab.vue';
import VideoSettingTab from '../base/VideoSettingTab.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { SettingMode } from '../../constants/render';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();

const basicStore = useBasicStore();

const { showSettingDialog, activeSettingTab } = storeToRefs(basicStore);

/**
 * TODO: Refine the rest of the settings Tab
 *
 * TODO: 完善其余设置 Tab
**/
const settingTabsTitleList = computed(() => [
  { label: t('Audio settings'), value: 'audio' },
  { label: t('Camera settings'), value: 'video' },
  // { label: '美颜和虚拟设置', value: 'beauty' },
  // { label: '统计功能', value: 'static' },
  // { label: '录制', value: 'record' },
]);

function handleUpdateActiveTab(tabTitle: string) {
  basicStore.setActiveSettingTab(tabTitle);
}

function handleCloseSettingDialog() {
  basicStore.setShowSettingDialog(false);
}

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.setting-dialog {
  width: 660px;
  height: 574px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  background-color: $toolBarBackgroundColor;
  .dialog-tabs {
    width: 194px;
    height: 574px;
    background-color: $dialogTitleBackgroundColor;
    .dialog-title {
      display: inline-block;
      font-weight: 500;
      font-size: 20px;
      line-height: 24px;
      margin: 32px 0 20px 32px;
    }
    .tabs-title {
      width: 100%;
      height: 36px;
      padding-left: 32px;
      margin-bottom: 10px;
      font-weight: 400;
      font-size: 14px;
      color: $inactiveColor;
      line-height: 36px;
      position: relative;
      cursor: pointer;
      &.active {
        background-color: $activeBackgroundColor;
        color: $activeColor;
        font-weight: 500;
        &:before{
          content: '';
          display: block;
          position: absolute;
          left: 0;
          top: 0;
          width: 2px;
          height: 36px;
          background: $activeStateColor;
        }
        &:after{
          content: '';
          display: block;
          position: absolute;
          left: 0;
          top: 0;
          width: 23px;
          height: 36px;
          opacity: 0.59;
          background: $activeBlurBackgroundColor;
          filter: blur(16px);
        }
      }
    }
  }
  .dialog-content {
    flex-grow: 1;
    padding: 32px;
  }
  .close-icon {
    position: absolute;
    top: 20px;
    right: 20px;
    cursor: pointer;
  }
}
</style>
