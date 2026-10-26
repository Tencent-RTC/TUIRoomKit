<template>
  <span class="mic-level-icon">
    <!-- Green bar shows through the hollow mic capsule and grows from its bottom -->
    <span class="mic-level-icon-track">
      <span class="mic-level-icon-fill" :style="{ height: `${levelPercent}%` }" />
    </span>
    <IconMic :size="size" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconMic } from '../../../base';

withDefaults(defineProps<{ size?: number }>(), { size: 22 });

const { currentMicVolume, testingMicVolume, isMicrophoneTesting } = useDeviceState();

/** Device test reports its own volume; the published-mic value is empty before a room. */
const levelPercent = computed(() => {
  const volume = isMicrophoneTesting.value ? testingMicVolume.value : currentMicVolume.value;
  return Math.min(100, Math.max(0, volume));
});
</script>

<style scoped lang="scss">
.mic-level-icon {
  position: relative;
  display: inline-flex;
}

/* Percentages map to the capsule cavity of IconMic (16x16 viewBox) */
.mic-level-icon-track {
  position: absolute;
  top: 12.5%;
  left: 34.375%;
  width: 31.25%;
  height: 53.125%;
  overflow: hidden;
  border-radius: var(--rk-radius-pill);
}

.mic-level-icon-fill {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  background: var(--rk-green-500);
  transition: height 0.2s;
}
</style>
