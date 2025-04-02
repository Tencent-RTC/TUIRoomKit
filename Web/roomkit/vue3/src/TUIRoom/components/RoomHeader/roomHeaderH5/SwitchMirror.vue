<template>
  <div class="mirror-icon">
    <svg-icon
      v-tap="toggleMirrorStatus"
      :icon="MirrorIcon"
      :custom-style="{ backgroundSize: '50%' }"
    />
  </div>
</template>
<script setup lang="ts">
import SvgIcon from '../../common/base/SvgIcon.vue';
import MirrorIcon from '../../common/icons/MirrorIcon.vue';
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
