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

interface Props {
  audioVolume?: number,
  isMuted?: boolean,
  size?: string,
}

const props = defineProps<Props>();

const iconName = computed(() => (props.isMuted ? 'mic-off' : 'mic-on'));

const showAudioLevel = computed(() => {
  if (props.isMuted || !props.audioVolume) {
    return 0;
  }
  return ((props.audioVolume * 4) / 100) * 5;
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
  }
}

</style>
