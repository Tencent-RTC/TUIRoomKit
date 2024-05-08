<template>
  <div v-if="showSettingDialog" class="overlay-container overlay" @click="handleOverlayClick">
    <div class="setting-container">
      <div class="setting-header">
        <span class="setting-title">{{ t('Settings') }}</span>
        <svg-icon style="display: flex" class="close-icon" :icon="CloseIcon" @click="handleCloseSettingDialog" />
      </div>
      <div class="setting-body">
        <div class="setting-tabs">
          <div
            v-for="(item, index) in settingTabsTitleList"
            :key="index"
            :class="['tabs-title', `${activeSettingTab === item.value ? 'active' : ''}`]"
            @click="handleUpdateActiveTab(item.value)"
          >
            {{ item.label }}
          </div>
        </div>
        <div class="divide-line"></div>
        <div class="setting-content">
          <audio-setting-tab
            v-if="activeSettingTab === 'audio'"
            class="setting-tab"
            :mode="SettingMode.DETAIL"
            theme="white"
          ></audio-setting-tab>
          <video-setting-tab
            v-else-if="activeSettingTab === 'video'"
            class="setting-tab"
            :with-preview="true"
            theme="white"
          ></video-setting-tab>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { ref } from 'vue';
import SvgIcon from '../common/base/SvgIcon.vue';
import AudioSettingTab from '../common/AudioSettingTab.vue';
import VideoSettingTab from '../common/VideoSettingTab.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { SettingMode } from '../../constants/render';
import { useI18n } from '../../locales';
import { computed } from 'vue';
import CloseIcon from '../../assets/icons/CloseIcon.svg';

const { t } = useI18n();

const basicStore = useBasicStore();

const { showSettingDialog, activeSettingTab } = storeToRefs(basicStore);

/**
 * TODO: Refine the rest of the settings Tab
 *
 **/
const settingTabsTitleList = computed(() => [
  { label: t('Audio settings'), value: 'audio' },
  { label: t('Camera settings'), value: 'video' },
]);

function handleUpdateActiveTab(tabTitle: string) {
  basicStore.setActiveSettingTab(tabTitle);
}

function handleCloseSettingDialog() {
  basicStore.setShowSettingDialog(false);
}

function handleOverlayClick(event: any) {
  if (event.target !== event.currentTarget) {
    return;
  }
  handleCloseSettingDialog();
}
</script>

<style lang="scss" scoped>
.overlay-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2007;
  &.overlay {
    background-color: rgba(15, 16, 20, 0.6);
  }
}

.setting-container {
  width: 610px;
  height: 590px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  background-color: #ffffff;
  border-radius: 20px;
  flex-direction: column;

  .setting-header {
    height: 64px;
    border-bottom: 1px solid rgba(235, 240, 247, 1);
    box-shadow: 0px 7px 10px -5px rgba(230, 236, 245, 0.8);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    position: relative;
    .close-icon {
      width: 32px;
      height: 32px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #4f586b;
      cursor: pointer;
    }
    .setting-title {
      display: inline-block;
      font-weight: 500;
      line-height: 24px;
      color: #000;
      padding: 20px 0 20px 24px;
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 24px;
    }
  }
  .setting-body {
    height: 100%;
    display: flex;
    .setting-tabs {
      width: 170px;
      background-color: #f0f3fa;
      padding-top: 7px;
      border-bottom-left-radius: 10px;

      .tabs-title {
        width: 100%;
        height: 36px;
        padding-left: 32px;
        font-weight: 400;
        font-size: 14px;
        color: #4f586b;
        line-height: 36px;
        position: relative;
        cursor: pointer;
        &.active {
          background-color: #1c66e5;
          color: #fff;
          font-weight: 400;
        }
      }
    }
    .divide-line {
      width: 1px;
      height: 100%;
      background: var(--divide-line-color-setting);
    }
    .setting-content {
      flex-grow: 1;
      padding: 16px 30px;
      .setting-tab {
        width: 100%;
      }
    }
  }
}
</style>
