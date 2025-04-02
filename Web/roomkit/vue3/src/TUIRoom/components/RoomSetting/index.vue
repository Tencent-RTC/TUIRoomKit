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
          <audio-setting
            v-if="activeSettingTab === 'audio'"
            :display-mode="MediaSettingDisplayMode.Panel"
            class="setting-tab"
          />
          <video-setting
            v-else-if="activeSettingTab === 'video'"
            :display-mode="MediaSettingDisplayMode.Panel"
            class="setting-tab"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from '../common/base/SvgIcon.vue';
import {
  AudioSetting,
  VideoSetting,
  MediaSettingDisplayMode,
} from '../../core';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
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
    background-color: var(--uikit-color-black-3);
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
  border-radius: 20px;
  transform: translate(-50%, -50%);
  background-color: var(--bg-color-dialog);

  .setting-header {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 64px;
    border-bottom: 1px solid var(--stroke-color-primary);

    .close-icon {
      position: absolute;
      top: 50%;
      right: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      cursor: pointer;
      transform: translateY(-50%);
      color: var(--text-color-primary);
    }

    .setting-title {
      display: inline-block;
      padding: 20px 0 20px 24px;
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 24px;
      color: var(--text-color-primary);
    }
  }

  .setting-body {
    display: flex;
    height: 100%;

    .setting-tabs {
      width: 170px;
      padding-top: 7px;
      border-bottom-left-radius: 10px;
      background-color: var(--bg-color-default);

      .tabs-title {
        position: relative;
        width: 100%;
        height: 36px;
        padding-left: 32px;
        font-size: 14px;
        font-weight: 400;
        line-height: 36px;
        cursor: pointer;
        color: var(--text-color-secondary);

        &.active {
          font-weight: 400;
          color: var(--uikit-color-white-1);
          background-color: var(--uikit-color-theme-5);
        }
      }
    }

    .divide-line {
      width: 1px;
      height: 100%;
      background: var(--stroke-color-primary);
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
