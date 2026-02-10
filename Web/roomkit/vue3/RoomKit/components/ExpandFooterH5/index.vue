<template>
  <div class="expand-footer-h5" :class="{ 'show-more-menu': showMoreMenu }">
    <div ref="controlBarRef" :class="['control-bar', { 'hide-more-menu': !showMoreMenu }]">
      <div ref="controlButtonsRef" class="control-buttons">
        <slot />
      </div>
      <MoreButtonH5
        v-if="showMoreButton"
        :show-more-menu="showMoreMenu"
        @toggle-more-menu="toggleMoreButton"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MoreButtonH5 from './MoreButton.vue';

const controlBarRef = ref<HTMLElement | null>(null);
const controlButtonsRef = ref<HTMLElement | null>(null);
const showMoreButton = ref(false);
const showMoreMenu = ref(false);

const BUTTON_ITEM_WIDTH = 52;
const BUTTON_ITEM_GAP = 10;
const MORE_BUTTON_WIDTH = 33;

function calculateMaxItems(width: number): number {
  if (width <= 0) {
    return 0;
  }
  return Math.floor((width + BUTTON_ITEM_GAP) / (BUTTON_ITEM_WIDTH + BUTTON_ITEM_GAP));
}

function calculateButtonsWidth() {
  if (!controlBarRef.value || !controlButtonsRef.value) {
    return;
  }

  const width = controlBarRef.value.offsetWidth;
  const itemsCount = controlButtonsRef.value.children.length;
  const maxItems = calculateMaxItems(width);
  let showCount = itemsCount;
  if (maxItems < itemsCount) {
    showCount = calculateMaxItems(width - MORE_BUTTON_WIDTH - BUTTON_ITEM_GAP);
    showMoreButton.value = true;
  } else {
    showMoreButton.value = false;
    showMoreMenu.value = false;
  }

  controlButtonsRef.value.style.width = `${showCount * BUTTON_ITEM_WIDTH + (showCount - 1) * BUTTON_ITEM_GAP}px`;
}

function toggleMoreButton() {
  showMoreMenu.value = !showMoreMenu.value;
}

let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;

onMounted(() => {
  calculateButtonsWidth();

  // Watch control-bar size changes
  if (controlBarRef.value) {
    resizeObserver = new ResizeObserver(() => {
      calculateButtonsWidth();
    });
    resizeObserver.observe(controlBarRef.value);
  }

  // Watch children count changes (slot content changes)
  if (controlButtonsRef.value) {
    mutationObserver = new MutationObserver(() => {
      calculateButtonsWidth();
    });
    mutationObserver.observe(controlButtonsRef.value, {
      childList: true,
      subtree: false,
    });
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
});
</script>

<style lang="scss" scoped>
.expand-footer-h5 {
  width: calc(100% - 16px);
  position: absolute;
  top: 8px;
  bottom: inherit;
  left: 8px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  box-sizing: border-box;
  padding: 8px;
  transition: height 0.3s ease;
  background-color: transparent;
  z-index: 11;
  &.show-more-menu {
    top: inherit;
    bottom: 20px;
    background-color: var(--bg-color-input);
    border-radius: 16px;
  }
}

.control-bar {
  transition: opacity 0.3s;
  display: flex;
  justify-content: center;
  align-content: space-around;
  gap: 10px;
  box-sizing: border-box;
  width: 100%;
  &.hide-more-menu {
    height: 160px;
    transition: height 0.3s ease;
  }

  .control-buttons {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 0;
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style>
