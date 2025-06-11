<template>
  <div class="mirror-icon">
    <IconMirror
      v-tap="toggleMirrorStatus"
      :custom-style="{ backgroundSize: '50%' }"
    />
  </div>
</template>
<script setup lang="ts">
import { IconMirror } from '@tencentcloud/uikit-base-component-vue3';
import vTap from '../../../directives/vTap';
import { useVideoDeviceState } from '../../../core';
const { isLocalMirror, camera } = useVideoDeviceState();

function toggleMirrorStatus() {
  camera.switchMirror({ mirror: !isLocalMirror });
}
</script>
<style lang="scss" scoped>
.mirror-icon {
  display: flex;
}
</style>
