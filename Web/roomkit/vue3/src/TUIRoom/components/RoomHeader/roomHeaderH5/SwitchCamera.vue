<template>
  <div class="camera-icon">
    <svg-icon v-tap="handleSwitchCamera" :icon="CameraSwitchIcon" />
  </div>
</template>
<script setup lang="ts">
import SvgIcon from '../../common/base/SvgIcon.vue';
import CameraSwitchIcon from '../../common/icons/CameraSwitchIcon.vue';
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
