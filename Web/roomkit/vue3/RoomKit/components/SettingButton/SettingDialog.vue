<template>
  <TUIDialog
    :title="t('Settings.Title')"
    :visible="visible"
    :customClasses="['custom-setting-dialog']"
    appendTo="#roomPage"
    @close="handleClose"
  >
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
        <AudioSettingPanel
          v-if="activeSettingTab === 'audio'"
          :outputVolumeVisible="false"
          class="setting-tab"
        />
        <VideoSettingPanel
          v-if="activeSettingTab === 'video'"
          class="setting-tab"
        />
      </div>
    </div>
    <template #footer>
      <div></div>
    </template>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUIKit, TUIDialog } from '@tencentcloud/uikit-base-component-vue3';
import { AudioSettingPanel, VideoSettingPanel } from 'tuikit-atomicx-vue3/room';

defineProps<{
  visible: boolean;
}>();

const { t } = useUIKit();

const emit = defineEmits(['close']);
const activeSettingTab = ref('audio');

const settingTabsTitleList = computed(() => [
  { label: t('Setting.AudioSetting'), value: 'audio' },
  { label: t('Setting.VideoSetting'), value: 'video' },
]);

function handleClose() {
  emit('close');
}

function handleUpdateActiveTab(tabTitle: string) {
  activeSettingTab.value = tabTitle;
}
</script>

<style lang="scss">
.custom-setting-dialog {
  width: 610px !important;
  height: 590px !important;
  padding: 0 !important;
  .tui-dialog-header,
  .dialog-header {
    padding: 24px 24px 20px;
  }
}
</style>

<style lang="scss" scoped>
.setting-body {
  display: flex;
  width: 100%;
  height: 100%;

  .setting-tabs {
    text-align: initial;
    width: 170px;
    padding-top: 7px;
    border-bottom-left-radius: 10px;
    background-color: var(--bg-color-default);
    box-sizing: border-box;

    .tabs-title {
      position: relative;
      width: 100%;
      height: 36px;
      padding-left: 32px;
      font-size: 14px;
      font-weight: 400;
      line-height: 36px;
      box-sizing: border-box;
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
</style>
