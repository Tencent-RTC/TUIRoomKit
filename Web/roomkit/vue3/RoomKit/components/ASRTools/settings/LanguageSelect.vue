<template>
  <div
    ref="rootRef"
    class="lang-select"
  >
    <button
      ref="triggerRef"
      class="lang-select__trigger"
      type="button"
      :class="{ 'is-open': isOpen }"
      @click="toggle"
    >
      <span class="lang-select__value">{{ selectedLabel }}</span>
      <IconChevronRight :size="12" />
    </button>
    <!--
      Teleported to the body so neither the record panel's clipping nor the
      settings popover's bounds can cut the list off.
      Clicks are kept local: the host closes itself on outside clicks, and the
      teleported list would otherwise read as outside.
    -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="flyoutRef"
        class="lang-select__flyout"
        :style="flyoutStyle"
        @click.stop
        @touchend.stop
      >
        <button
          v-for="option in visibleOptions"
          :key="option.value || 'none'"
          class="lang-select__option"
          type="button"
          :class="{ 'is-selected': option.value === modelValue }"
          @click="select(option.value)"
        >
          <span class="lang-select__option-label">{{ option.label }}</span>
          <IconCheck v-if="option.value === modelValue" :size="14" />
        </button>
        <button
          v-if="isFoldable"
          class="lang-select__more"
          type="button"
          @click="isExpanded = !isExpanded"
        >
          <span>{{ isExpanded ? t('AITools.ShowLess') : t('AITools.ShowMore') }}</span>
          <IconChevronDown
            class="lang-select__more-arrow"
            :class="{ 'is-flipped': isExpanded }"
            :size="12"
          />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { LANGUAGE_COLLAPSE_COUNT } from '../constants';
import type { ASRSettingsOption } from 'tuikit-atomicx-vue3/room';

/** Distance between the trigger and the flyout it opens. */
const FLYOUT_GAP = 8;
/** Smallest gap the flyout keeps to the viewport edges. */
const VIEWPORT_MARGIN = 8;

const props = withDefaults(defineProps<{
  modelValue: string;
  options: ASRSettingsOption<string>[];
  /**
   * `bottom` is a regular dropdown. `side` opens beside the host card
   * (`[data-asr-flyout-host]`) so the remaining setting rows stay readable.
   */
  placement?: 'bottom' | 'side';
}>(), {
  placement: 'bottom',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useUIKit();

const rootRef = ref<HTMLElement>();
const triggerRef = ref<HTMLElement>();
const flyoutRef = ref<HTMLElement>();
const flyoutStyle = ref<Record<string, string>>({});

const isOpen = ref(false);
const isExpanded = ref(false);

const selectedLabel = computed(
  () => props.options.find(option => option.value === props.modelValue)?.label ?? '',
);
const isFoldable = computed(() => props.options.length > LANGUAGE_COLLAPSE_COUNT);
const visibleOptions = computed(() => (
  isFoldable.value && !isExpanded.value
    ? props.options.slice(0, LANGUAGE_COLLAPSE_COUNT)
    : props.options
));

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

/**
 * Right-aligned under the trigger, flipping above it when the space below is
 * too short for the list.
 */
function bottomPosition(triggerRect: DOMRect, width: number, height: number) {
  const belowTop = triggerRect.bottom + FLYOUT_GAP;
  const fitsBelow = belowTop + height <= window.innerHeight - VIEWPORT_MARGIN;
  return {
    left: triggerRect.right - width,
    top: fitsBelow ? belowTop : triggerRect.top - FLYOUT_GAP - height,
  };
}

/**
 * The settings card the flyout must not cover. Side placement sits beside this
 * box (not the trigger), so flipping left on a right-edge panel stays outside
 * the popover instead of burying its labels.
 */
function getHostRect(): DOMRect | null {
  const host = rootRef.value?.closest('[data-asr-flyout-host]');
  return host instanceof HTMLElement ? host.getBoundingClientRect() : null;
}

/**
 * Beside the host card and centred on the trigger, so the other setting rows
 * stay readable. Prefers the side with more room — a record panel on the
 * window's right edge therefore opens over the video, not over itself.
 */
function sidePosition(triggerRect: DOMRect, width: number, height: number) {
  const box = getHostRect() ?? triggerRect;
  const spaceRight = window.innerWidth - VIEWPORT_MARGIN - box.right;
  const spaceLeft = box.left - VIEWPORT_MARGIN;
  const openRight = spaceRight >= width || spaceRight >= spaceLeft;
  return {
    left: openRight ? box.right + FLYOUT_GAP : box.left - FLYOUT_GAP - width,
    top: triggerRect.top + triggerRect.height / 2 - height / 2,
  };
}

function updatePosition() {
  const trigger = triggerRef.value;
  const flyout = flyoutRef.value;
  if (!trigger || !flyout) {
    return;
  }

  const triggerRect = trigger.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = flyout;
  const { left, top } = props.placement === 'side'
    ? sidePosition(triggerRect, width, height)
    : bottomPosition(triggerRect, width, height);

  flyoutStyle.value = {
    left: `${clamp(left, VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN)}px`,
    top: `${clamp(top, VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN)}px`,
  };
}

function handleOutsidePointerDown(event: Event) {
  const target = event.target as Node | null;
  if (!target || rootRef.value?.contains(target) || flyoutRef.value?.contains(target)) {
    return;
  }
  close();
}

function attachListeners() {
  // Capture phase closes the flyout before a drag on the caption dock starts.
  document.addEventListener('pointerdown', handleOutsidePointerDown, true);
  window.addEventListener('resize', updatePosition);
  // Capture phase also covers scrolling inside the host panel.
  window.addEventListener('scroll', updatePosition, true);
}

function detachListeners() {
  document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
}

// Reopening starts folded again: the list is long, and the first entries cover
// the common cases.
watch(isOpen, async (open) => {
  if (!open) {
    isExpanded.value = false;
    detachListeners();
    return;
  }
  await nextTick();
  updatePosition();
  attachListeners();
});

// Folding changes the height, which can push the list past the viewport edge.
watch(isExpanded, async () => {
  await nextTick();
  updatePosition();
});

onBeforeUnmount(detachListeners);

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function select(value: string) {
  isOpen.value = false;
  if (value !== props.modelValue) {
    emit('update:modelValue', value);
  }
}
</script>

<style lang="scss" scoped>
.lang-select__trigger {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 30px;
  padding: 0 8px 0 10px;
  color: var(--text-color-primary);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  background: var(--bg-color-input);
  border: none;
  border-radius: 7px;

  &:hover {
    box-shadow: inset 0 0 0 1px var(--stroke-color-primary);
  }

  &.is-open {
    box-shadow: inset 0 0 0 1.5px var(--text-color-link);
  }
}

.lang-select__value {
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Positioned in viewport coordinates by `updatePosition`; the caps keep a long
// language list inside the window on short or narrow screens, and reserve the
// same 8px edge margin the script clamps to.
.lang-select__flyout {
  position: fixed;
  z-index: 1000;
  box-sizing: border-box;
  width: max-content;
  min-width: 180px;
  max-width: min(280px, calc(100vw - 16px));
  max-height: min(320px, calc(100vh - 16px));
  padding: 6px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--stroke-color-secondary) transparent;
  background: var(--bg-color-operate);
  border: 1px solid var(--stroke-color-primary);
  border-radius: 12px;
  box-shadow:
    0 1px 2px var(--uikit-color-black-7),
    0 8px 28px var(--uikit-color-black-6);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--stroke-color-secondary);
    border-radius: 3px;
  }
}

.lang-select__option {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  color: var(--text-color-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;

  &:hover {
    background: var(--button-color-secondary-hover);
  }

  &.is-selected {
    color: var(--text-color-link);
    font-weight: 600;
  }
}

.lang-select__option-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lang-select__more {
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 34px;
  color: var(--text-color-link);
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;

  &:hover {
    background: var(--button-color-secondary-hover);
  }
}

// One chevron for both states: flipping it reads as the list folding back up.
.lang-select__more-arrow {
  transition: transform 0.2s ease;

  &.is-flipped {
    transform: rotate(180deg);
  }
}
</style>
