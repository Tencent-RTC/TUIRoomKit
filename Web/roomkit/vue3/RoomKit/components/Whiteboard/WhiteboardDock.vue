<template>
  <div
    ref="dockRef"
    class="whiteboard-dock"
    :class="{ dragging: isDragging, centered: isToolbarCentered }"
    :style="dockStyle"
  >
    <WhiteboardButton
      v-show="!expanded"
      :disabled="isStartingAnnotation"
      @pointerdown="handleDockPointerDown($event, true)"
      @click="handleOpenAnnotation"
    />
    <WhiteboardToolbar
      v-if="whiteboardStatus === WhiteboardStatus.On"
      v-show="expanded"
      :settings-placement="toolbarSettingsPlacement"
      @collapse="expanded = false"
      @drag-start="handleDockPointerDown($event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useWhiteboardState, WhiteboardStatus } from 'tuikit-atomicx-vue3/room';
import { useDraggableDock } from '../../hooks/useDraggableDock';
import { SCREEN_ANNOTATION_CANVAS_COLOR } from './constants';
import WhiteboardButton from './WhiteboardButton.vue';
import WhiteboardToolbar from './WhiteboardToolbar.vue';

const props = defineProps<{
  // Positioned container that bounds the draggable dock.
  containerEl?: HTMLElement;
  // Screen-share view element the whiteboard annotates.
  viewEl?: HTMLElement;
}>();

const { t } = useUIKit();
const { whiteboardStatus, startWhiteboard } = useWhiteboardState();

const dockRef = ref<HTMLElement>();
const expanded = ref(false);
const isStartingAnnotation = ref(false);
const containerRef = toRef(props, 'containerEl');

const {
  dockStyle,
  isDragging,
  position: dockPosition,
  startDragging: handleDockPointerDown,
  syncPosition: syncDockPositionWithinView,
  consumeSuppressedClick,
} = useDraggableDock(containerRef, dockRef);

// Expanded toolbar snaps to bottom-center until the user drags it manually.
const isToolbarCentered = computed(() => expanded.value && !dockPosition.value);
const toolbarSettingsPlacement = computed<'top' | 'bottom'>(() => {
  if (!dockPosition.value) {
    return 'top';
  }
  const container = props.containerEl;
  const dock = dockRef.value;
  if (!container || !dock) {
    return 'top';
  }
  const spaceAbove = dockPosition.value.y;
  const spaceBelow = container.clientHeight - dockPosition.value.y - dock.offsetHeight;
  return spaceBelow > spaceAbove ? 'bottom' : 'top';
});

async function handleOpenAnnotation() {
  if (consumeSuppressedClick()) {
    return;
  }
  if (isStartingAnnotation.value) {
    return;
  }
  if (whiteboardStatus.value === WhiteboardStatus.On) {
    expanded.value = true;
    return;
  }

  isStartingAnnotation.value = true;
  try {
    if (!props.viewEl) {
      throw new Error('screen share view is not ready');
    }
    // Annotation draws over the shared screen on a black canvas.
    await startWhiteboard({
      view: props.viewEl,
      canvasColor: SCREEN_ANNOTATION_CANVAS_COLOR,
    });
    expanded.value = true;
  } catch (error) {
    console.error('[WhiteboardDock] start annotation failed:', error);
    TUIToast.warning({ message: t('Whiteboard.StartFailed') });
  } finally {
    isStartingAnnotation.value = false;
  }
}

watch(expanded, async () => {
  // Reset to the state default anchor: collapsed -> bottom-left, expanded -> bottom-center.
  dockPosition.value = null;
  await nextTick();
  syncDockPositionWithinView();
});

watch(
  whiteboardStatus,
  async (status, previousStatus) => {
    if (status === WhiteboardStatus.Off) {
      expanded.value = false;
      return;
    }
    if (previousStatus !== WhiteboardStatus.On) {
      expanded.value = true;
      await nextTick();
      syncDockPositionWithinView();
    }
  },
  { flush: 'post', immediate: true },
);
</script>

<style lang="scss" scoped>
.whiteboard-dock {
  position: absolute;
  left: 16px;
  bottom: calc(72px + 16px);
  z-index: 5;
  touch-action: none;

  // Expanded toolbar defaults to bottom-center; canceled once dragged (inline left/top wins).
  &.centered {
    left: 50%;
    transform: translateX(-50%);
  }

  &.dragging {
    cursor: grabbing;
  }
}
</style>
