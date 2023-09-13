<template>
  <div class="camera-icon">
    <svg-icon
      v-tap="handleSwitchCamera"
      icon-name="camera"
      size="custom"
      :custom-style="{
        backgroundSize: '50%'
      }"
    ></svg-icon>
  </div>
</template>
<script setup lang="ts">
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import SvgIcon from '../../common/SvgIcon.vue';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../../stores/basic';
import '../../../directives/vTap';
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
    width: 40px;
    height: 36px;
 }
</style>
