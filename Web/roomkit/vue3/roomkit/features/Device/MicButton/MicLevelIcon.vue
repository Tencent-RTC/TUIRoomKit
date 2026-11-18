<template>
  <span class="mic-level-icon" :style="{ width: `${size}px`, height: `${size}px` }">
    <IconMic :size="size" />
    <svg
      v-if="volume > 0"
      class="mic-level-icon-core"
      viewBox="0 0 16 16"
      aria-hidden="true"
      :style="{ clipPath: `inset(${waveInset}% 0 0 0)` }"
    >
      <rect x="5.5" y="2" width="5" height="8.5" rx="2.5" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDeviceState, useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { IconMic } from '../../../base';

withDefaults(defineProps<{ size?: number }>(), { size: 22 });

const { currentMicVolume, testingMicVolume, isMicrophoneTesting } = useDeviceState();
const { localParticipant, speakingUsers } = useRoomParticipantState();

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

/**
 * Device test has its own meter. In a room, the tile reads `speakingUsers`
 * while `currentMicVolume` looks up the login id and stays 0 when the engine
 * reports the local user as "".
 */
const volume = computed(() => {
  if (isMicrophoneTesting.value) {
    return testingMicVolume.value;
  }
  const userId = localParticipant.value?.userId;
  const speaking = userId ? speakingUsers.value.get(userId) ?? 0 : 0;
  const localEngine = speakingUsers.value.get('') ?? 0;
  return Math.max(speaking, localEngine, currentMicVolume.value);
});

/**
 * Top inset of the whole icon. The fill is a viewBox rect of the capsule
 * (y 2, height 8.5), so the cut is measured on the icon, not on the rect.
 */
const waveInset = computed(() => {
  const level = Math.min(volume.value / SPEECH_PEAK, 1);
  const scale = WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level;
  const capsuleTop = 12.5;
  const capsuleHeight = 53.125;
  return (capsuleTop + (1 - scale) * capsuleHeight).toFixed(1);
});
</script>

<style scoped lang="scss">
.mic-level-icon {
  position: relative;
  display: inline-flex;
  flex: none;
}

/* Toolbars set every svg to a fixed px size. That draws the glyph in a
   different box from the level and shifts the green off the capsule. */
.mic-level-icon :deep(.rk-icon) {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
}

.mic-level-icon :deep(.rk-icon svg) {
  position: relative;
  z-index: 1;
  width: 100% !important;
  height: 100% !important;
}

/* Same viewBox as IconMic, so the rect is the capsule hole (x 5.5-10.5, y 2-10.5).
   Clipped from the top of the icon; scaling the rect would flatten its round bottom. */
.mic-level-icon-core {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100% !important;
  height: 100% !important;
  overflow: visible;
  pointer-events: none;
  transition: clip-path 0.2s ease-out;
}

.mic-level-icon-core rect {
  fill: var(--rk-success);
}
</style>
