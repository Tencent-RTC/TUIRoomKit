<template>
  <div class="fullscreen-control-container">
    <icon-button
      :is-active="isFullScreen"
      :title="title"
      @click-icon="toggleScreen"
    >
      <full-screen-icon></full-screen-icon>
    </icon-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import FullScreenIcon from '../common/icons/FullScreenIcon.vue';
import { setFullScreen, exitFullScreen } from '../../utils/utils';
import { useI18n } from '../../locales';
import { isVue27 } from '../../utils/constants';

const { t } = useI18n();

/**
 * Whether the current state is full screen, default is false
 *
 * 当前是否为全屏状态, 默认为 false
**/
const isFullScreen = ref(false);

const title = computed((): string => (isFullScreen.value ? t('Exit') : t('Full screen')));

function toggleScreen() {
  if (isFullScreen.value) {
    exitFullScreen();
  } else {
    if (isVue27) {
      const roomContainer = document.body;
      roomContainer && setFullScreen(roomContainer);
    } else {
      const roomContainer = document.getElementById('roomContainer');
      roomContainer && setFullScreen(roomContainer);
    }
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
