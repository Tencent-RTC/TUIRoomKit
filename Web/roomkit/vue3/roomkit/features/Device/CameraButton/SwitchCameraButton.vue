<template>
  <button
    class="switch-camera"
    :class="{ 'is-pending': isPending }"
    type="button"
    :disabled="isPending"
    :aria-label="t('Device.FlipCamera')"
    @click="handleSwitchCamera"
  >
    <IconFlipCamera :size="20" />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MirrorType, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconFlipCamera, t } from '../../../base';

const { isFrontCamera, switchCamera, localMirrorType, switchMirror } = useDeviceState();

let lastLocalFrontCameraMirror = isFrontCamera.value ? localMirrorType.value : MirrorType.Auto;

/* isFrontCamera only updates once switchCamera resolves, so overlapping flips would
   all aim the same way and save the back camera's Disable as the front setting.
   A flip that never settles frees the button after FLIP_TIMEOUT_MS; once a newer
   flip has started, the stale one neither applies its mirror nor clears the lock. */
const FLIP_TIMEOUT_MS = 5000;
const isPending = ref(false);
let flipId = 0;

async function handleSwitchCamera() {
  if (isPending.value) {
    return;
  }
  const id = ++flipId;
  isPending.value = true;
  const timer = setTimeout(() => {
    if (id === flipId) {
      isPending.value = false;
    }
  }, FLIP_TIMEOUT_MS);
  try {
    const toFront = !isFrontCamera.value;
    if (!toFront) {
      lastLocalFrontCameraMirror = localMirrorType.value;
    }
    await switchCamera({ isFrontCamera: toFront });
    if (id !== flipId) {
      return;
    }
    await switchMirror({ mirror: toFront ? lastLocalFrontCameraMirror : MirrorType.Disable });
  } finally {
    clearTimeout(timer);
    if (id === flipId) {
      isPending.value = false;
    }
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

.switch-camera.is-pending {
  cursor: default;
  opacity: 0.45;
}

.switch-camera :deep(svg) {
  width: 20px;
  height: 20px;
}
</style>
