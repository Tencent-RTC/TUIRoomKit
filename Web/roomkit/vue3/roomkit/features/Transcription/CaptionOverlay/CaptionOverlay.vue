<template>
  <div
    ref="dockRef"
    class="conference-caption cap-dock"
    :class="{
      'cap-dock-centered': !dockPosition,
      'cap-dock-dragging': isDragging,
      'cap-dock-resizing': isResizing,
      'cap-dock-custom-width': dockWidth != null,
      'cap-dock-idle': isIdle,
      'cap-dock-resetting': isResetting,
    }"
    :style="mergedDockStyle"
    @pointerdown="handlePointerDown"
    @pointerenter="handlePointerEnter"
    @pointerleave="isHovered = false"
    @dblclick="resetMovedPosition"
  >
    <div class="cap-dock-handle" aria-hidden="true" />
    <div ref="actionsRef">
      <div
        v-if="showDockActions"
        class="cap-dock-actions"
        :class="{ 'is-visible': areActionsVisible }"
      >
        <TUITooltip
          :content="t('AITools.RealtimeMessageList')"
          placement="bottom"
          :disabled="transcriptOpen"
        >
          <button
            class="cap-dock-action"
            type="button"
            :class="{ 'is-active': transcriptOpen }"
            :aria-label="t('AITools.RealtimeMessageList')"
            :aria-pressed="transcriptOpen"
            @click="emit('toggle-transcript')"
          >
            <IconTranscriptDoc :size="14" />
          </button>
        </TUITooltip>
        <div
          ref="settingsRef"
          class="cap-dock-settings"
        >
          <TUITooltip
            :content="t('AITools.GroupSubtitle')"
            placement="bottom"
            :disabled="isSettingsOpen"
          >
            <button
              class="cap-dock-action"
              type="button"
              :class="{ 'is-active': isSettingsOpen }"
              :aria-label="t('AITools.GroupSubtitle')"
              :aria-pressed="isSettingsOpen"
              @click="toggleSettings"
            >
              <IconSettings :size="14" />
            </button>
          </TUITooltip>
          <SubtitleSettings
            v-if="isSettingsOpen"
            :placement="settingsPlacement"
          />
        </div>
        <TUITooltip
          :content="t('AITools.SubtitlesClose')"
          placement="bottom"
        >
          <button
            class="cap-dock-action"
            type="button"
            :aria-label="t('AITools.SubtitlesClose')"
            @click="hideCaptionOverlay"
          >
            <IconClose :size="14" />
          </button>
        </TUITooltip>
      </div>
    </div>
    <button
      class="cap-dock-resize cap-dock-resize-left"
      type="button"
      tabindex="-1"
      :aria-label="t('ASRTools.ResizeCaptionWidth')"
      @pointerdown="handleResizePointerDown($event, 'left')"
    />
    <button
      class="cap-dock-resize cap-dock-resize-right"
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
import { IconClose, IconSettings, IconTranscriptDoc, TUITooltip, t } from '../../../base';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import SubtitleSettings from '../TranscriptList/SubtitleSettings.vue';
import { useCaptionDockChrome } from './useCaptionDockChrome';
import { useCaptionDockPosition } from './useCaptionDockPosition';
import { useCaptionDockResize } from './useCaptionDockResize';
import Subtitle from './Subtitle.vue';

const SETTINGS_POPOVER_HEIGHT = 320;
const SETTINGS_POPOVER_GAP = 8;

const emit = defineEmits<{
  'toggle-transcript': [];
}>();

defineProps<{
  transcriptOpen?: boolean;
}>();

const {
  fontSize,
  dockPosition,
  dockWidth,
  hideCaptionOverlay,
} = useSubtitleViewState();
const {
  targetLanguage,
  asrOn,
  captionDisplayMode,
} = useASRState();

const dockRef = ref<HTMLElement>();
const containerRef = ref<HTMLElement>();
const settingsRef = ref<HTMLElement>();
const actionsRef = ref<HTMLElement>();
const isHovered = ref(false);
const isResetting = ref(false);
const isSettingsOpen = ref(false);
const settingsPlacement = ref<'top' | 'bottom'>('top');
const blockPositionSync = { current: false };

const {
  dockStyle,
  isDragging,
  position,
  bottomGap,
  syncPosition,
} = useCaptionDockPosition(containerRef, dockRef, {
  handle: event => !((event.target as HTMLElement | null)?.closest('button, .cap-settings')),
  beforeSync: () => !blockPositionSync.current,
});

const {
  isResizing,
  startResize,
} = useCaptionDockResize({
  containerRef,
  dockRef,
  dockWidth,
  position,
  onResizeStart: () => {
    blockPositionSync.current = true;
    isSettingsOpen.value = false;
  },
  onResizeEnd: () => {
    blockPositionSync.current = false;
    void nextTick(syncPosition);
  },
});

position.value = dockPosition.value;
watch(position, (next) => {
  dockPosition.value = next;
});

function resetMovedPosition(event: MouseEvent) {
  const { target } = event;
  if (target instanceof Element && target.closest('button, a, .cap-settings, .cap-dock-actions')) {
    return;
  }
  event.preventDefault();
  isResetting.value = true;
  position.value = null;
  dockWidth.value = null;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isResetting.value = false;
    });
  });
}

const mergedDockStyle = computed(() => ({
  '--cap-dock-bottom': `${bottomGap.value}px`,
  ...dockStyle.value,
  ...(dockWidth.value != null
    ? { width: `${dockWidth.value}px` }
    : {}),
}));

const isOverlayHeld = computed(
  () => isSettingsOpen.value || isHovered.value || isDragging.value || isResizing.value,
);

const {
  isStoppedHint,
  showDockActions,
  isIdle,
  wake,
} = useCaptionDockChrome(isOverlayHeld);

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
  if ((event.target as HTMLElement | null)?.closest('button, .cap-settings')) {
    return;
  }
  closeSettings();
}

function closeSettings() {
  isSettingsOpen.value = false;
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (!isSettingsOpen.value || !target) {
    return;
  }
  if (actionsRef.value?.contains(target)) {
    return;
  }
  closeSettings();
}

function resolveSettingsPlacement() {
  const container = containerRef.value;
  const trigger = settingsRef.value;
  if (!container || !trigger) {
    settingsPlacement.value = 'top';
    return;
  }
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

watch(asrOn, (on) => {
  if (!on) {
    closeSettings();
  }
});

onMounted(async () => {
  containerRef.value = dockRef.value?.closest<HTMLElement>('.conference-stage')
    ?? dockRef.value?.parentElement
    ?? undefined;
  document.addEventListener('pointerdown', onDocumentPointerDown);
  await nextTick();
  syncPosition();
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
});
</script>

<style scoped lang="scss">
.cap-dock {
  position: absolute;
  bottom: var(--cap-dock-bottom, 86px);
  left: 16px;
  z-index: 2;
  box-sizing: border-box;
  width: min(720px, calc(100% - 32px));
  max-width: min(720px, calc(100% - 32px));
  text-align: initial;
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cap-dock-custom-width {
  min-width: 0;
  max-width: calc(100% - 32px);
}

.cap-dock-centered {
  left: 50%;
  transform: translateX(-50%);
}

.cap-dock-dragging {
  cursor: grabbing;
  transition: none;
}

.cap-dock-resizing {
  cursor: ew-resize;
  user-select: none;
  transition: none;
}

.cap-dock-idle {
  pointer-events: none;
  opacity: 0;
  transform: translateY(12px);
}

.cap-dock-centered.cap-dock-idle {
  transform: translateX(-50%) translateY(12px);
}

.cap-dock-resetting {
  transition: none;
}

.cap-dock-resize {
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

.cap-dock-resize-left {
  left: 0;
}

.cap-dock-resize-right {
  top: 36px;
  right: 0;
}

.cap-dock-handle {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 2;
  height: 11px;
  cursor: grab;
}

.cap-dock-handle::after {
  position: absolute;
  top: 4px;
  left: 50%;
  width: 32px;
  height: 3px;
  content: '';
  background: transparent;
  border-radius: 2px;
  transform: translateX(-50%);
  transition: background 0.15s ease;
}

.cap-dock:hover .cap-dock-handle::after {
  background: rgb(255 255 255 / 32%);
}

.cap-dock-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  gap: 4px;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.16s ease;
}

.cap-dock:hover .cap-dock-actions,
.cap-dock-actions.is-visible {
  opacity: 1;
}

.cap-dock-settings {
  position: relative;
  flex: none;
}

.cap-dock-action {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: rgb(255 255 255 / 78%);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: opacity 0.16s ease, background 0.12s ease, color 0.12s ease, transform 0.08s ease;
}

.cap-dock-action:hover {
  color: #fff;
  background: rgb(255 255 255 / 16%);
}

.cap-dock-action:active {
  background: rgb(255 255 255 / 22%);
  transform: scale(0.94);
}

.cap-dock-action.is-active {
  color: #fff;
  background: color-mix(in srgb, var(--rk-brand) 35%, transparent);
  opacity: 1;
}

</style>
