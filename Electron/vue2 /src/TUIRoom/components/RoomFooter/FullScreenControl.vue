<template>
  <div class="fullscreen-control-container">
    <icon-button
      :is-active="isFullScreen"
      :title="title"
      :icon-name="iconName"
      @click-icon="toggleScreen"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import IconButton from '../common/IconButton.vue';
import { setFullScreen, exitFullScreen } from '../../utils/utils';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from '../../locales';

const { t } = useI18n();

/**
 * Whether the current state is full screen, default is false
 *
 * 当前是否为全屏状态, 默认为 false
**/
const isFullScreen = ref(false);

const title = computed((): string => (isFullScreen.value ? t('Exit') : t('Full screen')));
const iconName = computed((): string => (isFullScreen.value ?  ICON_NAME.ExitFullScreen : ICON_NAME.FullScreen));

function toggleScreen() {
  if (isFullScreen.value) {
    exitFullScreen();
  } else  {
    const roomContainer = document.getElementById('roomContainer');
    roomContainer && setFullScreen(roomContainer);
  }
}

function handleFullScreenChange() {
  isFullScreen.value = !isFullScreen.value;
}

onMounted(() => {
  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'].forEach((item) => {
    window.addEventListener(item, handleFullScreenChange);
  });
});

onUnmounted(() => {
  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'].forEach((item) => {
    window.removeEventListener(item, handleFullScreenChange);
  });
});
</script>

<style lang="scss" scoped>

</style>
