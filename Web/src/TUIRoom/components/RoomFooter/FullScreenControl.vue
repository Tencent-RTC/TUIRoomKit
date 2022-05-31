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

const fullScreenIcon = 'full-screen';
const  exitFullScreenIcon = 'exit-fullscreen';

// 当前是否为全屏状态, 默认为 false
const isFullScreen = ref(false);

const title = computed((): string => (isFullScreen.value ? '退出全屏' : '全屏'));
const iconName = computed((): string => (isFullScreen.value ?  exitFullScreenIcon : fullScreenIcon));

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
