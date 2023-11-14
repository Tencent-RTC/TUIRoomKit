<template>
  <div class="camera-icon">
    <svg-icon
      v-tap="handleSwitchCamera"
      :icon="CameraSwitchIcon"
    ></svg-icon>
  </div>
</template>
<script setup lang="ts">
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { storeToRefs } from 'pinia';
import CameraSwitchIcon from '../../common/icons/CameraSwitchIcon.vue';
import { useBasicStore } from '../../../stores/basic';
import vTap from '../../../directives/vTap';
const basicStore = useBasicStore();
const { isFrontCamera } = storeToRefs(basicStore);
const roomEngine = useGetRoomEngine();

async function handleSwitchCamera() {
  await roomEngine.instance?.switchCamera({ isFrontCamera: !isFrontCamera.value });
  basicStore.setIsFrontCamera(!isFrontCamera.value);
}
</script>
<style scoped>
 .camera-icon{
    display: flex;
    background-size: cover;
 }
</style>
