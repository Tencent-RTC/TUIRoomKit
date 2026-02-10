<template>
  <div :class="['audio-icon-container', { 'small': props.size === 'small' }]">
    <div class="audio-level-container">
      <div class="audio-level" :style="audioLevelStyle" />
    </div>
    <IconMicOff
      v-if="props.isMuted"
      class="audio-icon"
      size="24"
    />
    <IconMicOn
      v-else
      class="audio-icon"
      size="24"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconMicOn, IconMicOff } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  userId?: string;
  audioVolume?: number;
  isMuted?: boolean;
  size?: string;
  isDisabled?: boolean;
}

const props = defineProps<Props>();

const audioLevelStyle = computed(() => {
  if (props.isMuted || !props.audioVolume) {
    return '';
  }
  return `height: ${props.audioVolume * 4}%`;
});
</script>

<style lang="scss" scoped>
.audio-icon-container {
  position: relative;
  width: 24px;
  height: 24px;

  &.small {
    transform: scale(0.8);
  }

  .audio-level-container {
    position: absolute;
    top: 2px;
    left: 7px;
    display: flex;
    flex-flow: column-reverse wrap;
    justify-content: space-between;
    width: 10px;
    height: 14px;
    overflow: hidden;
    border-radius: 4px;

    .audio-level {
      width: 100%;
      background-color: var(--text-color-success);
      transition: height 0.2s;
    }
  }

  .audio-icon {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
