<template>
  <div :class="['audio-icon-container', `${size == 'small' && 'small' }`]">
    <div v-if="showAudioLevel" class="audio-level-container">
      <div class="audio-level" :style="audioLevelStyle"></div>
    </div>
    <svg-icon size="24" :icon="icon" :color="color" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SvgIcon from './base/SvgIcon.vue';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';
import { isUndefined } from '../../utils/utils';

interface Props {
  userId?: string,
  audioVolume?: number,
  isMuted?: boolean,
  size?: string,
  isDisabled?: boolean,
  color?: String,
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

const icon = computed(() => (props.isMuted ? 'MicOffIcon' : 'MicOnIcon'));

const showAudioLevel = computed(() => !props.isMuted && currentAudioVolume.value > 0);

const audioLevelStyle = computed(() => {
  if (showAudioLevel.value) {
    return `height: ${(currentAudioVolume.value / 100) * 14}px`;
  }
  return '';
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
    width: 10px;
    height: 14px;
    display: flex;
    flex-wrap: wrap;
    border-radius: 4px;
    overflow: hidden;
    flex-direction: column-reverse;
    justify-content: space-between;
    .audio-level {
      width: 10px;
      background-color: #27C39F;
      transition: height 0.2s;
      border-radius: 4px;
    }
  }
}

</style>
