<template>
  <div class="camera-icon">
    <svg-icon v-tap="handleSwitchCamera" :icon="CameraSwitchIcon" />
  </div>
</template>
<script setup lang="ts">
import useDeviceManager from '../../../hooks/useDeviceManager';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { storeToRefs } from 'pinia';
import CameraSwitchIcon from '../../common/icons/CameraSwitchIcon.vue';
import { useBasicStore } from '../../../stores/basic';
import vTap from '../../../directives/vTap';
const basicStore = useBasicStore();
const { isFrontCamera } = storeToRefs(basicStore);
const { deviceManager } = useDeviceManager();

async function handleSwitchCamera() {
  await deviceManager.instance?.switchCamera({
    isFrontCamera: !isFrontCamera.value,
  });
  basicStore.setIsFrontCamera(!isFrontCamera.value);
}
</script>
<style scoped>
.camera-icon {
  display: flex;
  background-size: cover;
}
</style>
