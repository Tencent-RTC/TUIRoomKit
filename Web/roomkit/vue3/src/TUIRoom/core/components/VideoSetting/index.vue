<template>
  <div>
    <video-media-control
      v-if="
        displayMode === MediaSettingDisplayMode.Icon ||
        displayMode === MediaSettingDisplayMode.IconWithPanel
      "
      @click-icon="handleVideoMediaClick"
    />
    <video-setting-tab v-if="displayMode === MediaSettingDisplayMode.Panel" />
    <video-request-dialog
      v-if="displayMode !== MediaSettingDisplayMode.Panel"
    />
  </div>
</template>

<script setup lang="ts">
import { defineEmits, withDefaults, defineProps, provide, reactive } from 'vue';
import VideoMediaControl from './VideoMediaControl.vue';
import VideoRequestDialog from './VideoRequestDialog.vue';
import VideoSettingTab from './VideoSettingTab.vue';
import { VideoSettingProps } from '../../type';

const emits = defineEmits(['click-icon']);
function handleVideoMediaClick() {
  emits('click-icon');
}

enum MediaSettingDisplayMode {
  Icon = 'Icon',
  IconWithPanel = 'IconWithPanel',
  Panel = 'Panel',
}

const props = withDefaults(defineProps<VideoSettingProps>(), {
  supportSwitchCamera: true,
  supportSwitchResolution: true,
  supportVideoPreview: true,
  supportSwitchMirror: true,
});

provide('videoSettingProps', reactive(props));
</script>

<style lang="scss" scoped>
.cancel-button {
  margin-left: 20px;
}
</style>
