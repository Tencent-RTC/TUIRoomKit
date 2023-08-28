<template>
  <div>
    <svg-icon
      v-tap="handleSwitchCamera"
      class="camera-icon"
      size="custom"
      icon-name="camera"
    ></svg-icon>
  </div>
</template>
<script setup lang="ts">
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import SvgIcon from '../../common/SvgIcon.vue';
import { storeToRefs } from 'pinia';
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
    display: block;
    background-size: cover;
    width: 20px;
    height: 18px;
 }
</style>
