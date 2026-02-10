<template>
  <IconCameraSwitch size="20" @click="handleSwitchCamera" />
</template>
<script setup lang="ts">
import { IconCameraSwitch } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, MirrorType } from 'tuikit-atomicx-vue3/room';

const { isFrontCamera, switchCamera, localMirrorType, switchMirror } = useDeviceState();

let lastLocalFrontCameraMirror = isFrontCamera.value ? localMirrorType.value : MirrorType.Auto;

const handleSwitchCamera = async () => {
  await switchCamera({ isFrontCamera: !isFrontCamera.value });
  const newIsFrontCamera = isFrontCamera.value;
  if (newIsFrontCamera) {
    await switchMirror({ mirror: lastLocalFrontCameraMirror });
  } else {
    lastLocalFrontCameraMirror = localMirrorType.value;
    await switchMirror({ mirror: MirrorType.Disable });
  }
};
</script>
