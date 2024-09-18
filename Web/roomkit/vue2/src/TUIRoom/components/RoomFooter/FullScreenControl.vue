<template>
  <div v-if="fullScreenConfig.visible" class="fullscreen-control-container">
    <icon-button
      :is-active="isFullScreen"
      :title="title"
      @click-icon="toggleScreen"
    >
      <full-screen-icon />
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
import { roomService } from '../../services';

const { t } = useI18n();

const fullScreenConfig = roomService.getComponentConfig('FullScreen');

/**
 * Whether the current state is full screen, default is false
 **/
const isFullScreen = ref(false);

const title = computed((): string =>
  isFullScreen.value ? t('Exit') : t('Full screen')
);

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
  isFullScreen.value = !!document.fullscreenElement;
}

onMounted(() => {
  [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'msfullscreenchange',
  ].forEach(item => {
    window.addEventListener(item, handleFullScreenChange);
  });
});

onUnmounted(() => {
  [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'msfullscreenchange',
  ].forEach(item => {
    window.removeEventListener(item, handleFullScreenChange);
  });
});
</script>

<style lang="scss" scoped></style>
