<template>
  <div class="camera-icon">
    <IconCameraSwitch v-tap="handleSwitchCamera" size="20" />
  </div>
</template>
<script setup lang="ts">
import { IconCameraSwitch } from '@tencentcloud/uikit-base-component-vue3';
import vTap from '../../../directives/vTap';
import { useVideoDeviceState } from '../../../core';

const { isFrontCamera, camera } = useVideoDeviceState();

async function handleSwitchCamera() {
  camera.switchCamera({ isFrontCamera: !isFrontCamera.value });
}
</script>
<style scoped>
.camera-icon {
  display: flex;
  background-size: cover;
}
</style>
