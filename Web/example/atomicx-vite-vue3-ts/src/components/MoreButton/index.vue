<template>
  <div ref="containerRef" class="more-button-container">
    <template v-if="shouldShowAllButtons">
      <slot />
    </template>
    <div
      v-else
      v-click-outside="handleClickOutside"
      class="more-button-wrapper"
    >
      <icon-button
        :is-active="showMenu"
        :title="t('RoomMore.Title')"
        @click-icon="toggleMenu"
      >
        <IconMore :size="24" />
      </icon-button>
      <transition name="menu-fade">
        <div
          v-show="showMenu"
          class="dropdown-menu"
          @click="handleClickOutside"
        >
          <slot />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  useUIKit,
  IconMore,
} from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';

interface Props {
  breakpoint?: number;
}

const props = withDefaults(defineProps<Props>(), {
  breakpoint: 1300,
});

const { t } = useUIKit();

const containerRef = ref<HTMLElement | null>(null);
const shouldShowAllButtons = ref(true);
const showMenu = ref(false);

const updateButtonDisplay = () => {
  const roomPage = document.getElementById('roomPage');
  if (roomPage) {
    const roomPageWidth = roomPage.offsetWidth;
    shouldShowAllButtons.value = roomPageWidth >= props.breakpoint;
  }
};

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function handleClickOutside() {
  showMenu.value = false;
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  updateButtonDisplay();

  const roomPage = document.getElementById('roomPage');
  if (roomPage) {
    resizeObserver = new ResizeObserver(updateButtonDisplay);
    resizeObserver.observe(roomPage);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    const roomPage = document.getElementById('roomPage');
    if (roomPage) {
      resizeObserver.unobserve(roomPage);
    }
    resizeObserver.disconnect();
  }
});
</script>

<style lang="scss" scoped>
.more-button-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.more-button-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-color-operate);
  border: 1px solid var(--stroke-color-primary);
  border-radius: 8px;
  padding: 8px;
  box-sizing: border-box;
  gap: 16px;
  max-width: 272px;
  display: flex;
  box-shadow: 0 4px 12px var(--uikit-color-black-16);
  z-index: 1000;
  overflow: hidden;
  > * {
    max-width: 74px;
  }
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-enter-to,
.menu-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>

<style lang="scss">
</style>
