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
      :label="t('Whiteboard.Annotation')"
      @pointerdown="handleDockPointerDown($event, true)"
      @click="handleOpenAnnotation"
    />
    <WhiteboardToolbar
      v-if="expanded && isSessionOwner && whiteboardStatus === WhiteboardStatus.On"
      :settings-placement="toolbarSettingsPlacement"
      :container-el="containerEl"
      :dock-position="dockPosition"
      @collapse="expanded = false"
      @drag-start="handleDockPointerDown($event)"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  toRef,
  watch,
} from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  useRoomParticipantState,
  useWhiteboardState,
  WhiteboardStatus,
  WhiteboardTool,
} from 'tuikit-atomicx-vue3/room';
import { useDraggableDock } from '../../hooks/useDraggableDock';
import { SCREEN_ANNOTATION_CANVAS_COLOR } from './constants';
import { useAutoStartAnnotation } from './useAutoStartAnnotation';
import { useWhiteboardSessionContext } from './useWhiteboardSessionContext';
import { useWhiteboardToolbar } from './useWhiteboardToolbar';
import WhiteboardButton from './WhiteboardButton.vue';
import WhiteboardToolbar from './WhiteboardToolbar.vue';

const DOCK_EDGE_GAP = 16;

const props = defineProps<{
  // Positioned container that bounds the draggable dock.
  containerEl?: HTMLElement;
  // Screen-share view element the whiteboard annotates.
  viewEl?: HTMLElement;
  // Identity of the participant rendered by this screen tile. It is used only
  // to decide which remounted tile owns the shared toolbar.
  participantUserId?: string;
  // Local screen annotation starts automatically only after its preview is ready.
  autoStartEnabled?: boolean;
}>();

const { t } = useUIKit();
const {
  whiteboardStatus,
  startWhiteboard,
  setToolConfig,
} = useWhiteboardState();
const { localParticipant } = useRoomParticipantState();
const { sessionOwnerUserId } = useWhiteboardSessionContext();
const { isToolbarExpanded: expanded } = useWhiteboardToolbar();

const dockRef = ref<HTMLElement>();
const isStartingAnnotation = ref(false);
const defaultBottomOffset = ref(DOCK_EDGE_GAP);
const containerRef = toRef(props, 'containerEl');

const {
  dockStyle: draggedDockStyle,
  isDragging,
  position: dockPosition,
  startDragging: handleDockPointerDown,
  syncPosition: syncDockPositionWithinView,
  consumeSuppressedClick,
} = useDraggableDock(containerRef, dockRef);
const dockStyle = computed(() => ({
  '--whiteboard-dock-bottom': `${defaultBottomOffset.value}px`,
  ...(draggedDockStyle.value ?? {}),
}));
let containerResizeObserver: ResizeObserver | null = null;
let controlBarMutationObserver: MutationObserver | null = null;
let previousContainerSize: { width: number; height: number } | null = null;

function resolveControlBar(container: HTMLElement): HTMLElement | null {
  return container
    .closest<HTMLElement>('.room-page')
    ?.querySelector<HTMLElement>('.control-bar') ?? null;
}

function updateDefaultBottomOffset(container: HTMLElement) {
  const controlBar = resolveControlBar(container);
  if (!controlBar || controlBar.classList.contains('toolbar-hidden')) {
    defaultBottomOffset.value = DOCK_EDGE_GAP;
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const controlBarRect = controlBar.getBoundingClientRect();
  const overlapsHorizontally = (
    containerRect.left < controlBarRect.right
    && containerRect.right > controlBarRect.left
  );
  const overlapsVertically = (
    containerRect.top < controlBarRect.bottom
    && containerRect.bottom > controlBarRect.top
  );
  const overlapHeight = overlapsHorizontally && overlapsVertically
    ? Math.min(containerRect.bottom, controlBarRect.bottom)
      - Math.max(containerRect.top, controlBarRect.top)
    : 0;

  defaultBottomOffset.value = overlapHeight + DOCK_EDGE_GAP;
}

function handleContainerResize() {
  const container = containerRef.value;
  const dock = dockRef.value;
  if (!container) {
    return;
  }

  updateDefaultBottomOffset(container);

  const currentContainerSize = {
    width: container.clientWidth,
    height: container.clientHeight,
  };
  const previousSize = previousContainerSize;
  previousContainerSize = currentContainerSize;

  if (
    !previousSize
    || previousSize.width <= 0
    || previousSize.height <= 0
    || !dockPosition.value
    || !dock
  ) {
    syncDockPositionWithinView();
    return;
  }

  const widthDelta = currentContainerSize.width - previousSize.width;
  const heightDelta = currentContainerSize.height - previousSize.height;
  const dockCenterX = dockPosition.value.x + dock.offsetWidth / 2;
  const dockCenterY = dockPosition.value.y + dock.offsetHeight / 2;
  const horizontalPosition = dockCenterX / previousSize.width;

  let nextX = dockPosition.value.x;
  if (horizontalPosition > 2 / 3) {
    // Keep the distance to the right edge.
    nextX += widthDelta;
  } else if (horizontalPosition >= 1 / 3) {
    // Keep the position relative to the horizontal center.
    nextX += widthDelta / 2;
  }

  dockPosition.value = {
    x: nextX,
    // A dock in the lower half stays attached to the bottom edge; a dock in
    // the upper half keeps its distance to the top edge.
    y: dockCenterY > previousSize.height / 2
      ? dockPosition.value.y + heightDelta
      : dockPosition.value.y,
  };
  syncDockPositionWithinView();
}

watch(
  containerRef,
  (container) => {
    containerResizeObserver?.disconnect();
    controlBarMutationObserver?.disconnect();
    containerResizeObserver = null;
    controlBarMutationObserver = null;
    previousContainerSize = null;
    if (!container) {
      return;
    }

    handleContainerResize();
    containerResizeObserver = new ResizeObserver(handleContainerResize);
    containerResizeObserver.observe(container);

    const controlBar = resolveControlBar(container);
    if (controlBar) {
      containerResizeObserver.observe(controlBar);
      controlBarMutationObserver = new MutationObserver(handleContainerResize);
      controlBarMutationObserver.observe(controlBar, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
  },
  { flush: 'post', immediate: true },
);

onBeforeUnmount(() => {
  containerResizeObserver?.disconnect();
  controlBarMutationObserver?.disconnect();
  containerResizeObserver = null;
  controlBarMutationObserver = null;
  previousContainerSize = null;
});

// Only the tile that owns the active session mounts the shared toolbar.
const isSessionOwner = computed(() => {
  if (whiteboardStatus.value !== WhiteboardStatus.On) {
    return false;
  }
  const participantUserId = props.participantUserId ?? localParticipant.value?.userId;
  return Boolean(
    participantUserId
    && sessionOwnerUserId.value === participantUserId,
  );
});

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

async function ensureAnnotationSession(): Promise<boolean> {
  if (isSessionOwner.value) {
    return true;
  }
  // Starting already, or a session is running but on another tile.
  if (isStartingAnnotation.value || whiteboardStatus.value === WhiteboardStatus.On) {
    return false;
  }

  isStartingAnnotation.value = true;
  try {
    if (!props.viewEl) {
      throw new Error('screen share view is not ready');
    }
    await startWhiteboard({
      view: props.viewEl,
      canvasColor: SCREEN_ANNOTATION_CANVAS_COLOR,
    });
    return true;
  } catch (error) {
    console.error('[WhiteboardDock] start annotation failed:', error);
    TUIToast.warning({ message: t('Whiteboard.StartFailed') });
    return false;
  } finally {
    isStartingAnnotation.value = false;
  }
}

async function handleOpenAnnotation() {
  if (consumeSuppressedClick()) {
    return;
  }
  if (await ensureAnnotationSession()) {
    expanded.value = true;
  }
}

// `startWhiteboard` arms the pen, but the toolbar stays collapsed here: the canvas
// has to keep passing clicks through until the presenter opens it.
async function autoStartAnnotation() {
  if (whiteboardStatus.value !== WhiteboardStatus.Off) {
    return;
  }
  if (await ensureAnnotationSession()) {
    await setToolConfig({ tool: WhiteboardTool.None });
  }
}

watch(expanded, async () => {
  // Reset to the state default anchor: collapsed -> bottom-left, expanded -> bottom-center.
  dockPosition.value = null;
  await nextTick();
  syncDockPositionWithinView();
});

watch(
  isSessionOwner,
  async (owned) => {
    if (!owned) {
      return;
    }
    await nextTick();
    syncDockPositionWithinView();
  },
  { flush: 'post', immediate: true },
);

// ScreenShareButton only flips `requestAutoStartAnnotation()`; this dock runs it
// once view+preview are ready, leaving the toolbar collapsed.
const canAutoStart = computed(() => Boolean(
  props.autoStartEnabled
  && props.viewEl
  && props.participantUserId === undefined,
));

useAutoStartAnnotation({
  isReady: canAutoStart,
  start: autoStartAnnotation,
});
</script>

<style lang="scss" scoped>
.whiteboard-dock {
  position: absolute;
  left: 16px;
  bottom: var(--whiteboard-dock-bottom, 16px);
  z-index: 11;
  touch-action: none;
  pointer-events: auto;

  // Expanded toolbar defaults to bottom-center; canceled once dragged (inline left/top wins).
  &.centered {
    left: 50%;
    transform: translateX(-50%);
  }

  &.dragging {
    cursor: grabbing;

    :deep(.whiteboard-button) {
      cursor: grabbing;
    }
  }
}
</style>
