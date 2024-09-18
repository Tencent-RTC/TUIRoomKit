<template>
  <div :class="['audio-icon-container', `${size == 'small' && 'small'}`]">
    <div class="audio-level-container">
      <div class="audio-level" :style="audioLevelStyle"></div>
    </div>
    <svg-icon class="audio-icon" :icon="icon" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SvgIcon from './base/SvgIcon.vue';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';
import { isUndefined } from '../../utils/utils';
import MicOnIcon from './icons/MicOnIcon.vue';
import MicOffIcon from './icons/MicOffIcon.vue';

interface Props {
  userId?: string;
  audioVolume?: number;
  isMuted?: boolean;
  size?: string;
  isDisabled?: boolean;
}

const roomStore = useRoomStore();
const { userVolumeObj } = storeToRefs(roomStore);

const currentAudioVolume = computed(() => {
  if (!isUndefined(props.audioVolume)) {
    return props.audioVolume;
  }
  if (userVolumeObj.value && props.userId) {
    return userVolumeObj.value[props.userId];
  }
  return 0;
});

const props = defineProps<Props>();

const icon = computed(() => (props.isMuted ? MicOffIcon : MicOnIcon));

const audioLevelStyle = computed(() => {
  if (props.isMuted || !currentAudioVolume.value) {
    return '';
  }
  return `height: ${currentAudioVolume.value * 4}%`;
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
      background-color: var(--green-color);
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
