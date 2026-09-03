<template>
  <div
    ref="dockRef"
    :class="['cap-dock', {
      'cap-dock--centered': !dockPosition,
      'cap-dock--dragging': isDragging,
      'cap-dock--resizing': isResizing,
      'cap-dock--custom-width': appliedDockWidth != null,
      'cap-dock--idle': isIdle,
    }]"
    :style="mergedDockStyle"
    @pointerdown="handlePointerDown"
    @pointerenter="handlePointerEnter"
    @pointerleave="isHovered = false"
  >
    <!--
      Click-outside must wrap the gear and the popover, not the caption surface.
      A dock-level listener treats a caption click as inside and leaves settings open.
    -->
    <div v-click-outside="closeSettings">
      <div
        v-if="showDockActions"
        :class="['cap-dock__actions', { 'is-visible': areActionsVisible }]"
      >
        <button
          v-if="showTranscriptAction"
          class="cap-dock__transcript"
          type="button"
          @click="toggleRecords"
        >
          <IconAITranscription :size="16" />
          <span>{{ t('AITools.RealtimeMessageList') }}</span>
        </button>
        <button
          v-if="asrOn && !enableHintVisible && !isTransNone"
          class="cap-dock__action"
          type="button"
          :class="{ 'is-active': showTrans }"
          :data-tooltip="showTrans ? t('ASRTools.HideTranslation') : t('ASRTools.ShowTranslation')"
          :aria-label="showTrans ? t('ASRTools.HideTranslation') : t('ASRTools.ShowTranslation')"
          @click="showTrans = !showTrans"
        >
          <IconTranslate :size="16" />
        </button>
        <div
          v-if="asrOn && !enableHintVisible"
          ref="settingsRef"
          class="cap-dock__settings"
        >
          <button
            class="cap-dock__action"
            type="button"
            :class="{ 'is-active': isSettingsOpen }"
            :data-tooltip="t('AITools.Settings')"
            :aria-label="t('AITools.Settings')"
            :aria-pressed="isSettingsOpen"
            @click="toggleSettings"
          >
            <IconSettings :size="16" />
          </button>
          <SubtitleSettingsPopover
            v-if="isSettingsOpen"
            :placement="settingsPlacement"
          />
        </div>
        <button
          v-if="showHideAction"
          class="cap-dock__action"
          type="button"
          :data-tooltip="t('ASRTools.Hide')"
          :aria-label="t('ASRTools.Hide')"
          @click="hideCaptionOverlay"
        >
          <IconClose :size="16" />
        </button>
      </div>
    </div>
    <button
      class="cap-dock__resize cap-dock__resize--left"
      type="button"
      tabindex="-1"
      :aria-label="t('ASRTools.ResizeCaptionWidth')"
      @pointerdown="handleResizePointerDown($event, 'left')"
    />
    <button
      class="cap-dock__resize cap-dock__resize--right"
      type="button"
      tabindex="-1"
      :aria-label="t('ASRTools.ResizeCaptionWidth')"
      @pointerdown="handleResizePointerDown($event, 'right')"
    />
    <Subtitle
      v-if="asrOn || isStoppedHint"
      :key="isStoppedHint ? 'stopped' : 'live'"
      :target-language="targetLanguage"
      :caption-mode="captionDisplayMode"
      :font-size="fontSize"
      :pinned="isOverlayHeld"
      :placeholder-key="isStoppedHint ? 'ASRTools.SubtitleStoppedPlaceholder' : 'ASRTools.SubtitlePlaceholder'"
      :force-placeholder="isStoppedHint"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { IconAITranscription, IconClose, IconSettings, IconTranslate, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { BuiltinWidget } from '../../../adapter/type';
import { useDraggableDock } from '../../../hooks/useDraggableDock';
import { useRoomSidePanel } from '../../../hooks/useRoomSidePanel';
import { useASRToolsState } from '../useASRToolsState';
import {
  clampCaptionDockFrozenBox,
  clampCaptionDockWidth,
  useCaptionDockResize,
} from './useCaptionDockResize';
import { useCaptionDockChrome } from './useCaptionDockChrome';
import { useSubtitleViewState } from '../useSubtitleViewState';
import vClickOutside from '../../base/vClickOutside';
import SubtitleSettingsPopover from '../settings/SubtitleSettingsPopover.vue';
import Subtitle from './Subtitle.vue';

/** Rough popover height, used only to pick the side of the gear with room. */
const SETTINGS_POPOVER_HEIGHT = 320;
const SETTINGS_POPOVER_GAP = 8;

const { t } = useUIKit();
const { activeWidgetId, toggleWidgetPanel } = useRoomSidePanel();
const {
  showTrans,
  fontSize,
  dockPosition,
  dockWidth,
  dockFrozenBox,
  enableHintVisible,
  hideCaptionOverlay,
} = useSubtitleViewState();
const isRecordsOpen = computed(() => activeWidgetId.value === BuiltinWidget.AIToolsWidget);
const {
  targetLanguage,
  isTransNone,
  asrOn,
  captionDisplayMode,
} = useASRToolsState();

const dockRef = ref<HTMLElement>();
const containerRef = ref<HTMLElement>();
const settingsRef = ref<HTMLElement>();
const isHovered = ref(false);
const isSettingsOpen = ref(false);
const settingsPlacement = ref<'top' | 'bottom'>('top');

const {
  dockStyle,
  isDragging,
  position,
  startDragging,
  syncPosition,
} = useDraggableDock(containerRef, dockRef, {
  topChromeSelector: '.header',
  bottomChromeSelector: '.control-bar',
});

const {
  isResizing,
  containerWidth,
  measureContainer,
  startResize,
} = useCaptionDockResize({
  containerRef,
  dockRef,
  dockWidth,
  position,
  dockFrozenBox,
  onResizeStart: () => {
    isSettingsOpen.value = false;
  },
  onResizeEnd: () => {
    void nextTick(syncPosition);
  },
});

// Position is owned by the view state so it survives the dock being re-created
// when the toolbar recalculates its overflow.
position.value = dockPosition.value;
watch(position, (next) => {
  dockPosition.value = next;
});

const resolvedContainerWidth = computed(
  () => containerWidth.value || containerRef.value?.clientWidth || 0,
);

const appliedFrozenBox = computed(() => {
  const box = dockFrozenBox.value;
  if (!box) {
    return null;
  }
  if (!resolvedContainerWidth.value) {
    return box;
  }
  return clampCaptionDockFrozenBox(box, resolvedContainerWidth.value);
});

const appliedDockWidth = computed(() => {
  const raw = appliedFrozenBox.value?.width ?? dockWidth.value;
  if (raw == null) {
    return undefined;
  }
  if (!resolvedContainerWidth.value) {
    return raw;
  }
  return clampCaptionDockWidth(raw, resolvedContainerWidth.value);
});

// Opening records animates `.room-container` width. Pin the current center and
// width so `translateX(-50%)` stays put; skip the center once the user dragged.
// Window / container resize still re-clamps the pin so the dock cannot sit
// on top of the side panel after the video area shrinks.
const mergedDockStyle = computed(() => ({
  ...dockStyle.value,
  ...(appliedDockWidth.value != null
    ? { width: `${appliedDockWidth.value}px` }
    : {}),
  ...(appliedFrozenBox.value && !position.value
    ? { left: `${appliedFrozenBox.value.centerX}px` }
    : {}),
}));

// Settings, hover, drag, and resize all pin the overlay: captions must not
// idle-fade or expire while the pointer is still on them.
const isOverlayHeld = computed(
  () => isSettingsOpen.value || isHovered.value || isDragging.value || isResizing.value,
);

const {
  isStoppedHint,
  showTranscriptAction,
  showHideAction,
  showDockActions,
  isIdle,
  wake,
} = useCaptionDockChrome(isOverlayHeld);

// Chrome stays out of the way until the caption is deliberately approached.
const areActionsVisible = computed(
  () => isHovered.value || isDragging.value || isResizing.value || isSettingsOpen.value,
);

function handlePointerEnter() {
  isHovered.value = true;
  wake();
}

function handleResizePointerDown(event: PointerEvent, edge: 'left' | 'right') {
  wake();
  startResize(event, edge);
}

function handlePointerDown(event: PointerEvent) {
  wake();
  // Controls keep their own behaviour; only the caption surface is a drag handle.
  if ((event.target as HTMLElement | null)?.closest('button, .cap-settings')) {
    return;
  }
  // Dismiss before a drag starts so the popover does not follow the dock.
  closeSettings();
  startDragging(event);
}

function closeSettings() {
  isSettingsOpen.value = false;
}

function freezeDockBox() {
  const dock = dockRef.value;
  const container = containerRef.value;
  if (!dock || !container || dockFrozenBox.value) {
    return;
  }
  // Keep `translateX(-50%)` and pin the visual center. Switching to a left-edge
  // pixel and dropping the translate would animate transform and shake the dock
  // while `.room-container` width transitions.
  const containerRect = container.getBoundingClientRect();
  const dockRect = dock.getBoundingClientRect();
  dockFrozenBox.value = {
    centerX: dockRect.left - containerRect.left + dockRect.width / 2,
    width: dock.offsetWidth,
  };
}

function toggleRecords() {
  closeSettings();
  // Snapshot before the panel toggles: Vue will shrink the container on the
  // next flush, and a later remount must reuse this box rather than re-measure.
  if (!isRecordsOpen.value) {
    freezeDockBox();
  }
  toggleWidgetPanel(BuiltinWidget.AIToolsWidget);
}

const CONTAINER_WIDTH_TRANSITION_MS = 350;
let unfreezeTimer = 0;
let unfreezeTarget: HTMLElement | null = null;

function onContainerWidthTransitionEnd(event: TransitionEvent) {
  if (event.target !== unfreezeTarget || event.propertyName !== 'width') {
    return;
  }
  releaseDockBox();
}

function clearUnfreezeWait() {
  if (unfreezeTarget) {
    unfreezeTarget.removeEventListener('transitionend', onContainerWidthTransitionEnd);
    unfreezeTarget = null;
  }
  window.clearTimeout(unfreezeTimer);
  unfreezeTimer = 0;
}

function releaseDockBox() {
  clearUnfreezeWait();
  if (!isRecordsOpen.value) {
    dockFrozenBox.value = null;
  }
}

function releaseDockBoxAfterContainerGrow() {
  const container = containerRef.value;
  clearUnfreezeWait();
  if (!container) {
    dockFrozenBox.value = null;
    return;
  }
  // Keep the pin until `.room-container` finishes growing. Clearing it on the
  // same frame snaps the dock to 50% of the still-narrow width.
  unfreezeTarget = container;
  container.addEventListener('transitionend', onContainerWidthTransitionEnd);
  unfreezeTimer = window.setTimeout(releaseDockBox, CONTAINER_WIDTH_TRANSITION_MS);
}

watch(isRecordsOpen, (open) => {
  if (open) {
    clearUnfreezeWait();
    freezeDockBox();
    return;
  }
  releaseDockBoxAfterContainerGrow();
}, { flush: 'sync' });

function resolveSettingsPlacement() {
  const container = containerRef.value;
  const trigger = settingsRef.value;
  if (!container || !trigger) {
    settingsPlacement.value = 'top';
    return;
  }

  // Prefer above the gear. Flip below the icon only when the dock sits
  // too high for the card to fit.
  const containerRect = container.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const spaceAbove = triggerRect.top - containerRect.top;
  const spaceBelow = containerRect.bottom - triggerRect.bottom;
  const need = SETTINGS_POPOVER_HEIGHT + SETTINGS_POPOVER_GAP;
  settingsPlacement.value = spaceAbove >= need || spaceAbove >= spaceBelow
    ? 'top'
    : 'bottom';
}

function toggleSettings() {
  if (isSettingsOpen.value) {
    closeSettings();
    return;
  }

  resolveSettingsPlacement();
  isSettingsOpen.value = true;
  wake();
}

// Settings describe a running transcription; they must not reappear on restart.
watch(asrOn, (on) => {
  if (!on) {
    closeSettings();
  }
});

let containerResizeObserver: ResizeObserver | null = null;
let chromeMutationObserver: MutationObserver | null = null;

function persistClampedFrozenBox() {
  const current = dockFrozenBox.value;
  const next = appliedFrozenBox.value;
  if (!current || !next) {
    return;
  }
  if (current.width === next.width && current.centerX === next.centerX) {
    return;
  }
  dockFrozenBox.value = next;
}

function syncDockToContainer() {
  measureContainer();
  persistClampedFrozenBox();
  if (!isResizing.value) {
    syncPosition();
  }
}

onMounted(async () => {
  // Teleported into .room-container, which is both the containing block
  // (so undragged `left: 50%` is centered on the video area) and the region
  // the dock may be dragged within.
  containerRef.value = dockRef.value?.closest('.room-container')
    ?? dockRef.value?.parentElement
    ?? undefined;

  await nextTick();
  syncDockToContainer();
  // Overflow remounts drop in-flight transition listeners; resume the wait if
  // the panel already closed but the pin must outlive the width animation.
  if (dockFrozenBox.value && !isRecordsOpen.value) {
    releaseDockBoxAfterContainerGrow();
  }

  window.addEventListener('resize', syncDockToContainer);

  if (containerRef.value) {
    containerResizeObserver = new ResizeObserver(syncDockToContainer);
    containerResizeObserver.observe(containerRef.value);

    const roomPage = containerRef.value.closest('.room-page');
    const chromeNodes = ['.header', '.control-bar']
      .map((selector) => roomPage?.querySelector<HTMLElement>(selector))
      .filter((node): node is HTMLElement => Boolean(node));
    if (chromeNodes.length) {
      chromeMutationObserver = new MutationObserver(syncDockToContainer);
      chromeNodes.forEach((node) => {
        containerResizeObserver?.observe(node);
        chromeMutationObserver?.observe(node, {
          attributes: true,
          attributeFilter: ['class'],
        });
      });
    }
  }
});

onBeforeUnmount(() => {
  clearUnfreezeWait();
  window.removeEventListener('resize', syncDockToContainer);
  containerResizeObserver?.disconnect();
  chromeMutationObserver?.disconnect();
  containerResizeObserver = null;
  chromeMutationObserver = null;
});
</script>

<style lang="scss" scoped>
@import '../styles/asrTooltip';

.cap-dock {
  position: absolute;
  bottom: 88px;
  left: 16px;
  z-index: 11;
  box-sizing: border-box;
  width: 50%;
  min-width: min(360px, 100%);
  max-width: min(720px, calc(100% - 32px));
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
  text-align: initial;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

// Inline width is the source of truth after the user resizes; drop the
// default max so it cannot clamp a wider choice back to 720px.
.cap-dock--custom-width {
  min-width: 0;
  max-width: none;
}

// Default anchor is the bottom center of .room-container; dragging replaces
// it with an inline left/top pair.
.cap-dock--centered {
  left: 50%;
  transform: translateX(-50%);
}

// Finger tracking must not fight the idle/center transform transition.
.cap-dock--dragging {
  cursor: grabbing;
  transition: none;
}

.cap-dock--resizing {
  cursor: ew-resize;
  user-select: none;
  transition: none;
}

.cap-dock--idle {
  pointer-events: none;
  opacity: 0;
  transform: translateY(12px);
}

.cap-dock--centered.cap-dock--idle {
  transform: translateX(-50%) translateY(12px);
}

.cap-dock__resize {
  position: absolute;
  top: 8px;
  bottom: 8px;
  z-index: 2;
  width: 8px;
  padding: 0;
  cursor: ew-resize;
  background: transparent;
  border: none;
  appearance: none;
}

.cap-dock__resize--left {
  left: 0;
}

.cap-dock__resize--right {
  // Keep the top-right action strip clickable.
  top: 36px;
  right: 0;
}

.cap-dock__actions {
  position: absolute;
  top: 6px;
  right: 10px;
  z-index: 3;
  display: flex;
  gap: 10px;
  align-items: center;
  padding-right: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-visible {
    opacity: 1;
  }
}

.cap-dock__settings {
  position: relative;
  flex-shrink: 0;
  margin: 0 -4px;

  .cap-dock__action {
    margin: 0;
  }
}

.cap-dock__transcript {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  color: var(--text-color-button);
  font-size: 12px;
  line-height: 24px;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 999px;

  &:hover {
    background: var(--uikit-color-white-7);
  }
}

.cap-dock__action {
  position: relative;
  @include asr-tooltip;

  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  // Visual slot is 16px (24px chip + negative margin) so the 8px gap stays even.
  width: 24px;
  height: 24px;
  padding: 0;
  margin: 0 -4px;
  color: var(--text-color-button);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;

  &:hover {
    background: var(--uikit-color-white-7);
  }

  // Translation is the only persistent toggle; a filled chip reads clearer on video.
  &.is-active {
    background: var(--uikit-color-white-6);
  }
}
</style>
