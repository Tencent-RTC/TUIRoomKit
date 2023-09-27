<template>
  <div :class="['audio-icon-container', `${size == 'small' && 'small' }`]">
    <div class="audio-level">
      <div
        v-for="item, index in new Array(5).fill('')"
        :key="index"
        class="audio-level-item"
        :class="['audio-level-item', `${showAudioLevel > index && 'active'}`]"
      ></div>
    </div>
    <svg-icon class="audio-icon" :icon-name="iconName"></svg-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';
import { ICON_NAME } from '../../constants/icon';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';
import { isUndefined } from '../../utils/utils';

interface Props {
  userId?: string,
  audioVolume?: number,
  isMuted?: boolean,
  size?: string,
  isDisabled?: boolean,
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

const iconName = computed(() => {
  if (props.isDisabled) {
    return ICON_NAME.MicOffDisabled;
  }
  return props.isMuted ? ICON_NAME.MicOff : ICON_NAME.MicOn;
});

const showAudioLevel = computed(() => {
  if (props.isMuted || !currentAudioVolume.value) {
    return 0;
  }
  return ((currentAudioVolume.value * 4) / 100) * 5;
});

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.audio-icon-container {
  position: relative;
  width: 32px;
  height: 32px;
  &.small {
    transform: scale(0.8);
  }
  .audio-level {
    position: absolute;
    top: 4px;
    left: 11px;
    width: 10px;
    height: 16px;
    display: flex;
    flex-wrap: wrap;
    border-radius: 4px;
    overflow: hidden;
    flex-direction: column-reverse;
    justify-content: space-between;
    padding: 2px;
    .audio-level-item {
      width: 100%;
      height: 2px;
      border-radius: 50%;
      &.active {
        background-color: $levelHighLightColor;
      }
    }
  }

  .audio-icon {
    position: absolute;
    top: 0;
    left: 0;
  }
}

</style>
