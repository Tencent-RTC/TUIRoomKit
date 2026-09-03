<template>
  <div
    ref="dockRef"
    :class="['cap-dock-h5', {
      'cap-dock-h5--centered': !dockPosition,
      'cap-dock-h5--dragging': isDragging,
      'cap-dock-h5--idle': isIdle,
      'cap-dock-h5--above-toolbar': stayAboveToolbar,
    }]"
    :style="dockStyle"
    @pointerdown="handlePointerDown"
  >
    <div
      v-if="showDockActions"
      class="cap-dock-h5__actions"
    >
      <button
        v-if="showTranscriptAction"
        class="cap-dock-h5__transcript"
        type="button"
        :class="{ 'is-active': recViewOpen }"
        :aria-label="t('AITools.RealtimeMessageList')"
        @click="toggleRecords"
      >
        <IconAITranscription :size="16" />
        <span>{{ t('AITools.RealtimeMessageList') }}</span>
      </button>
      <button
        v-if="asrOn && !enableHintVisible && !isTransNone"
        class="cap-dock-h5__action"
        type="button"
        :class="{ 'is-active': showTrans }"
        :aria-label="showTrans ? t('ASRTools.HideTranslation') : t('ASRTools.ShowTranslation')"
        @click="showTrans = !showTrans"
      >
        <IconTranslate :size="16" />
      </button>
      <button
        v-if="asrOn && !enableHintVisible"
        class="cap-dock-h5__action"
        type="button"
        :class="{ 'is-active': settingsOpen }"
        :aria-label="t('AITools.Settings')"
        @click="emit('settings')"
      >
        <IconSettings :size="16" />
      </button>
      <button
        v-if="showHideAction"
        class="cap-dock-h5__action"
        type="button"
        :aria-label="t('ASRTools.Hide')"
        @click="hideCaptionOverlay"
      >
        <IconClose :size="16" />
      </button>
    </div>
    <Subtitle
      v-if="asrOn || isStoppedHint"
      :key="isStoppedHint ? 'stopped' : 'live'"
      :target-language="targetLanguage"
      :caption-mode="captionDisplayMode"
      :font-size="fontSize"
      layout="h5"
      :pinned="isOverlayHeld"
      :placeholder-key="isStoppedHint ? 'ASRTools.SubtitleStoppedPlaceholder' : 'ASRTools.SubtitlePlaceholder'"
      :force-placeholder="isStoppedHint"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { IconAITranscription, IconClose, IconSettings, IconTranslate, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDraggableDock } from '../../../hooks/useDraggableDock';
import { useRoomToolbarH5 } from '../../../hooks/useRoomToolbarH5';
import { useASRToolsState } from '../useASRToolsState';
import { useCaptionDockChrome } from './useCaptionDockChrome';
import { useSubtitleViewState } from '../useSubtitleViewState';
import Subtitle from './Subtitle.vue';

const props = defineProps<{
  settingsOpen?: boolean;
}>();

const emit = defineEmits<{
  settings: [];
}>();

const { t } = useUIKit();
const { showToolbar } = useRoomToolbarH5();
const {
  recViewOpen,
  showTrans,
  fontSize,
  dockPosition,
  enableHintVisible,
  hideCaptionOverlay,
} = useSubtitleViewState();
const {
  targetLanguage,
  isTransNone,
  asrOn,
  captionDisplayMode,
} = useASRToolsState();

const dockRef = ref<HTMLElement>();
const containerRef = ref<HTMLElement>();

const {
  dockStyle,
  isDragging,
  position,
  startDragging,
  syncPosition,
} = useDraggableDock(containerRef, dockRef, {
  bottomChromeSelector: '.room-footer',
});

// Position is owned by the view state so it survives the dock being re-created
// when the toolbar recalculates its overflow.
position.value = dockPosition.value;
watch(position, (next) => {
  dockPosition.value = next;
});

// Opening the records sheet hides the toolbar; keep an undragged dock where
// it was so the full-transcript button does not drop by the toolbar height.
const stayAboveToolbar = computed(
  () => (showToolbar.value || recViewOpen.value) && !dockPosition.value,
);

// Settings hold the overlay; the transcript sheet does not — it is a
// separate surface and must not pin captions or block idle.
const isOverlayHeld = computed(() => Boolean(props.settingsOpen));

const {
  isStoppedHint,
  showTranscriptAction,
  showHideAction,
  showDockActions,
  isIdle,
  wake,
} = useCaptionDockChrome(isOverlayHeld);

function toggleRecords() {
  recViewOpen.value = !recViewOpen.value;
}

function handlePointerDown(event: PointerEvent) {
  wake();
  // Controls keep their own behaviour; only the caption surface is a drag handle.
  if ((event.target as HTMLElement | null)?.closest('button')) {
    return;
  }
  startDragging(event);
}

let containerResizeObserver: ResizeObserver | null = null;
let footerMutationObserver: MutationObserver | null = null;

onMounted(async () => {
  // Teleported into .room-container, which is both the containing block and
  // the region the dock may be dragged within.
  containerRef.value = dockRef.value?.parentElement ?? undefined;

  await nextTick();
  syncPosition();

  if (containerRef.value) {
    containerResizeObserver = new ResizeObserver(syncPosition);
    containerResizeObserver.observe(containerRef.value);

    const footer = containerRef.value
      .closest('.room-page')
      ?.querySelector<HTMLElement>('.room-footer');
    if (footer) {
      containerResizeObserver.observe(footer);
      footerMutationObserver = new MutationObserver(syncPosition);
      footerMutationObserver.observe(footer, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
  }
});

onBeforeUnmount(() => {
  containerResizeObserver?.disconnect();
  footerMutationObserver?.disconnect();
  containerResizeObserver = null;
  footerMutationObserver = null;
});
</script>

<style lang="scss" scoped>
.cap-dock-h5 {
  position: absolute;
  left: 16px;
  // Clears the home indicator on notched devices.
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  z-index: 11;
  box-sizing: border-box;
  width: calc(100% - 32px);
  max-width: 480px;
  pointer-events: auto;
  touch-action: none;
  text-align: initial;
  transform: translateY(var(--cap-y, 0px));
  // Opacity matches the prototype idle fade; transform also covers the toolbar step.
  transition: opacity 0.2s ease, transform 0.3s ease;
}

// Default anchor is the bottom center; dragging replaces it with left/top.
.cap-dock-h5--centered {
  left: 50%;
  transform: translateX(-50%) translateY(var(--cap-y, 0px));
}

// The toolbar only fades, so an undragged caption has to step over it on its own.
// After a drag the user chose the spot, so it no longer follows the toolbar.
.cap-dock-h5--above-toolbar {
  --cap-y: -80px;
}

// Finger tracking must not fight the toolbar/idle transform transition.
.cap-dock-h5--dragging {
  transition: none;
}

// After a drag, left/top is the source of truth. A leftover toolbar
// transform would slide the dock after the finger.
.cap-dock-h5:not(.cap-dock-h5--centered) {
  transform: none;
}

.cap-dock-h5--idle {
  pointer-events: none;
  opacity: 0;
  transform: translateY(calc(var(--cap-y, 0px) + 12px));
}

.cap-dock-h5--centered.cap-dock-h5--idle {
  transform: translateX(-50%) translateY(calc(var(--cap-y, 0px) + 12px));
}

.cap-dock-h5:not(.cap-dock-h5--centered).cap-dock-h5--idle {
  transform: translateY(12px);
}

.cap-dock-h5__actions {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 1;
  display: flex;
  gap: 2px;
  align-items: center;
}

.cap-dock-h5__transcript {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 28px;
  padding: 0 8px;
  color: var(--text-color-button);
  font-size: 12px;
  line-height: 28px;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 999px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--uikit-color-white-7);
  }

  &.is-active {
    background: var(--uikit-color-white-6);
    border-color: rgb(255 255 255 / 40%);
  }
}

.cap-dock-h5__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--text-color-button);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  // Buttons still need their own taps while the dock itself is a drag surface.
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--uikit-color-white-7);
  }

  // Stronger than press so an open panel stays visible while the finger lifts.
  &.is-active {
    background: var(--uikit-color-white-6);
  }
}
</style>
