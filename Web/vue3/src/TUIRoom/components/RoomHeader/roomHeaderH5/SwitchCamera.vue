<template>
  <div>
    <svg-icon
      class="camera-icon"
      size="custom"
      icon-name="camera"
      @click="handleSwitchCamera"
    ></svg-icon>
  </div>
</template>
<script setup lang="ts">
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import SvgIcon from '../../common/SvgIcon.vue';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../../stores/basic';
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
    background-size: cover;
    width: 18px;
    height: 16px;
 }
</style>
