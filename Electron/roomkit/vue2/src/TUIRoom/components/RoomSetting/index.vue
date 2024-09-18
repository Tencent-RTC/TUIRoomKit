<template>
  <div
    v-if="showSettingDialog"
    class="overlay-container overlay"
    @click="handleOverlayClick"
  >
    <div class="setting-container">
      <div class="setting-header">
        <span class="setting-title">{{ t('Settings') }}</span>
        <svg-icon
          class="close-icon"
          :icon="CloseIcon"
          @click="handleCloseSettingDialog"
        />
      </div>
      <div class="setting-body">
        <div class="setting-tabs">
          <div
            v-for="(item, index) in settingTabsTitleList"
            :key="index"
            :class="[
              'tabs-title',
              `${activeSettingTab === item.value ? 'active' : ''}`,
            ]"
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
          />
          <video-setting-tab
            v-else-if="activeSettingTab === 'video'"
            class="setting-tab"
            :with-preview="true"
            theme="white"
          />
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
import CloseIcon from '../common/icons/CloseIcon.vue';

const { t } = useI18n();

const basicStore = useBasicStore();

const { showSettingDialog, activeSettingTab } = storeToRefs(basicStore);

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
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2007;

  &.overlay {
    background-color: rgba(15, 16, 20, 0.6);
  }
}

.setting-container {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: 610px;
  height: 590px;
  background-color: #fff;
  border-radius: 20px;
  transform: translate(-50%, -50%);

  .setting-header {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 64px;
    border-bottom: 1px solid rgba(235, 240, 247, 1);
    box-shadow: 0 7px 10px -5px rgba(230, 236, 245, 0.8);

    .close-icon {
      position: absolute;
      top: 50%;
      right: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      color: #4f586b;
      cursor: pointer;
      transform: translateY(-50%);
    }

    .setting-title {
      display: inline-block;
      padding: 20px 0 20px 24px;
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 24px;
      color: #000;
    }
  }

  .setting-body {
    display: flex;
    height: 100%;

    .setting-tabs {
      width: 170px;
      padding-top: 7px;
      background-color: #f0f3fa;
      border-bottom-left-radius: 10px;

      .tabs-title {
        position: relative;
        width: 100%;
        height: 36px;
        padding-left: 32px;
        font-size: 14px;
        font-weight: 400;
        line-height: 36px;
        color: #4f586b;
        cursor: pointer;

        &.active {
          font-weight: 400;
          color: #fff;
          background-color: #1c66e5;
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
