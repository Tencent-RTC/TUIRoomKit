<template>
  <button
    class="switch-camera"
    type="button"
    :aria-label="t('Device.FlipCamera')"
    @click="handleSwitchCamera"
  >
    <IconFlipCamera :size="20" />
  </button>
</template>

<script setup lang="ts">
import { MirrorType, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconFlipCamera, t } from '../../../base';

const { isFrontCamera, switchCamera, localMirrorType, switchMirror } = useDeviceState();

let lastLocalFrontCameraMirror = isFrontCamera.value ? localMirrorType.value : MirrorType.Auto;

async function handleSwitchCamera() {
  await switchCamera({ isFrontCamera: !isFrontCamera.value });
  const nowFront = isFrontCamera.value;
  if (nowFront) {
    await switchMirror({ mirror: lastLocalFrontCameraMirror });
  } else {
    lastLocalFrontCameraMirror = localMirrorType.value;
    await switchMirror({ mirror: MirrorType.Disable });
  }
}
</script>

<style scoped lang="scss">
.switch-camera {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.switch-camera :deep(svg) {
  width: 20px;
  height: 20px;
}
</style>
