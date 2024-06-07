<template>
  <div class="camera-icon" @click="handleSwitchCamera">
    <svg-icon icon="CameraSwitchIcon" size="20"></svg-icon>
  </div>
</template>
<script setup lang="ts">
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../../stores/basic';
const roomEngine = useGetRoomEngine();

const basicStore = useBasicStore();
const { isFrontCamera } = storeToRefs(basicStore);



 async function handleSwitchCamera() {
  const deviceManager = roomEngine.instance?.getMediaDeviceManager()
  await deviceManager?.switchCamera({ isFrontCamera: !isFrontCamera.value });
  basicStore.setIsFrontCamera(!isFrontCamera.value);
}
</script>
<style scoped>
 .camera-icon{
    display: flex;
    background-size: cover;
 }
</style>
