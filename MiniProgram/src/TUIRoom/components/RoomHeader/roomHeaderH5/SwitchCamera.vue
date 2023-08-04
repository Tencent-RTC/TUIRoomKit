<template>
  <div>
    <svg-icon class="camera-icon" icon-name="camera" @click="handleSwitchCamera"></svg-icon>
  </div>
</template>
<script setup lang="ts">
import { ref, Ref } from 'vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import SvgIcon from '../../common/SvgIcon.vue';
import { useBasicStore } from '../../../stores/basic';
const basicStore = useBasicStore();
const isFrontCamera: Ref<boolean> = ref(basicStore.isFrontCamera);

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
