<template>
  <div class="fullscreen-control-container">
    <icon-button
      :title="title"
      :icon-name="iconName"
      @click="toggleScreen"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import IconButton from '../common/IconButton.vue';
import { setFullScreen, exitFullScreen } from '../../utils/utils';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from 'vue-i18n';

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
  document.addEventListener('fullscreenchange', handleFullScreenChange);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullScreenChange);
});
</script>

<style lang="scss" scoped>

</style>
