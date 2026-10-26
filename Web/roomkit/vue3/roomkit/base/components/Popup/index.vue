<template>
  <Teleport v-if="host" :to="host">
    <div
      v-if="present"
      class="rk-popup-root"
      :class="{ 'is-open': shown }"
      :style="{ zIndex }"
    >
      <div
        ref="maskRef"
        class="rk-popup-mask"
        :class="{ 'is-dragging': dragging }"
        @click="onOverlay"
      />
      <div
        ref="panelRef"
        class="rk-popup"
        :class="{ 'is-open': shown, 'is-auto': isAuto, 'is-dragging': dragging }"
        :style="sheetStyle"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-labelledby="labelledBy"
        @transitionend="onSheetTransitionEnd"
      >
        <div class="rk-popup-handle" aria-hidden="true">
          <i />
        </div>
        <div v-if="showHead" class="rk-popup-head">
          <slot name="header">
            <span v-if="title" :id="titleId" class="rk-popup-title">{{ title }}</span>
            <button
              v-if="closable"
              class="rk-popup-close"
              type="button"
              aria-label="Close"
              @click="requestClose"
            >
              <IconClose :size="14" />
            </button>
          </slot>
        </div>
        <div class="rk-popup-body">
          <slot />
        </div>
        <div v-if="slots.footer" class="rk-popup-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from 'vue';
import { useModality } from '../../headless/useModality';
import { useOverlay } from '../../headless/useOverlay';
import { IconClose } from '../../icons';

defineOptions({ name: 'TUIPopup' });

const props = withDefaults(defineProps<{
  open: boolean;
  title?: string;
  /**
   * Sheet height. `auto` follows the content and caps at 78%.
   * Participant and chat sheets in the H5 design use `84%`.
   */
  height?: string | number;
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
}>(), {
  title: '',
  height: '70%',
  closable: false,
  closeOnOverlay: true,
  closeOnEsc: true,
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  'close': [];
}>();

const DRAG_START_PX = 10;
const DISMISS_DISTANCE_PX = 120;
const DISMISS_DISTANCE_RATIO = 0.2;
const DISMISS_VELOCITY = 0.55;
const SHEET_MS = 320;

const titleId = `rk-popup-title-${Math.random().toString(36).slice(2)}`;

const slots = useSlots();
const present = ref(false);
const shown = ref(false);
const dragging = ref(false);
const panelRef = ref<HTMLElement | null>(null);
const maskRef = ref<HTMLElement | null>(null);
const isAuto = computed(() => props.height === 'auto');
const showHead = computed(() => Boolean(props.title) || props.closable || !!slots.header);
const labelledBy = computed(() => (props.title && !slots.header ? titleId : undefined));
const sheetStyle = computed(() => {
  if (isAuto.value) return undefined;
  const height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return { height };
});

function requestClose() {
  emit('update:open', false);
  emit('close');
}

const { host, zIndex, ctx } = useOverlay({
  lane: 'dialog',
  open: present,
  closeOnOutside: false,
  closeOnEsc: props.closeOnEsc,
  modal: true,
  onClose: requestClose,
});

useModality(present, panelRef, ctx?.root);

let closeTimer = 0;
let settleTimer = 0;
let settleDone: (() => void) | null = null;
let armed = false;
let dragMoved = false;
let fromChrome = false;
let startX = 0;
let startY = 0;
let lastY = 0;
let lastT = 0;
let dy = 0;
let velocity = 0;

function sheetZoom(popup: HTMLElement) {
  const layoutHeight = popup.offsetHeight;
  const visualHeight = popup.getBoundingClientRect().height;
  return layoutHeight && visualHeight ? visualHeight / layoutHeight : 1;
}

function setOffset(cssY: number) {
  const popup = panelRef.value;
  const mask = maskRef.value;
  if (!popup) return;
  const offset = Math.max(0, cssY);
  popup.style.transform = `translateY(${offset}px)`;
  if (!mask) return;
  const progress = Math.min(1, offset / (popup.offsetHeight || 1));
  mask.style.opacity = String(1 - progress);
}

function clearInline() {
  const popup = panelRef.value;
  const mask = maskRef.value;
  dragging.value = false;
  popup?.classList.remove('is-dragging');
  mask?.classList.remove('is-dragging');
  if (popup) popup.style.transform = '';
  if (mask) mask.style.opacity = '';
}

function finishDismiss() {
  settleDone = null;
  window.clearTimeout(settleTimer);
  shown.value = false;
  present.value = false;
  requestClose();
}

function finishDrag(dismiss: boolean) {
  const popup = panelRef.value;
  const mask = maskRef.value;
  dragging.value = false;
  popup?.classList.remove('is-dragging');
  mask?.classList.remove('is-dragging');
  if (!popup) {
    if (dismiss) finishDismiss();
    return;
  }
  // Apply the resting transition before the next transform, or the close snaps.
  void popup.offsetHeight;
  popup.style.transform = dismiss ? 'translateY(100%)' : 'translateY(0)';
  if (mask) mask.style.opacity = dismiss ? '0' : '1';

  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    settleDone = null;
    window.clearTimeout(settleTimer);
    if (dismiss) finishDismiss();
    else clearInline();
  };
  settleDone = done;
  settleTimer = window.setTimeout(done, SHEET_MS);
}

/** Content may scroll in a nested list rather than the body itself. */
function hasScrolledAncestor(target: Element) {
  for (let el: Element | null = target; el && el !== panelRef.value; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

function onPointerDown(event: PointerEvent) {
  const popup = panelRef.value;
  if (!popup || !shown.value || (event.button && event.button !== 0)) return;
  const { target } = event;
  if (!(target instanceof Element)) return;
  fromChrome = !!target.closest('.rk-popup-handle, .rk-popup-head');
  const onBodyTop = !!target.closest('.rk-popup-body') && !hasScrolledAncestor(target);
  const interactive = target.closest('input, textarea, button, a, [contenteditable]');
  if (interactive && !fromChrome) return;
  if (!fromChrome && !onBodyTop) return;
  armed = true;
  dragMoved = false;
  startX = event.clientX;
  startY = event.clientY;
  lastY = event.clientY;
  lastT = performance.now();
  velocity = 0;
  dy = 0;
}

function onPointerMove(event: PointerEvent) {
  if (!armed) return;
  const popup = panelRef.value;
  const mask = maskRef.value;
  if (!popup) return;
  const y = event.clientY;
  const now = performance.now();
  const raw = y - startY;
  velocity = (y - lastY) / (now - lastT || 16);
  lastY = y;
  lastT = now;
  if (!dragMoved) {
    if (!fromChrome && raw < -DRAG_START_PX) {
      armed = false;
      return;
    }
    if (raw < DRAG_START_PX) return;
    dragMoved = true;
    dragging.value = true;
    popup.classList.add('is-dragging');
    mask?.classList.add('is-dragging');
    try {
      popup.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already be released.
    }
  }
  event.preventDefault();
  dy = raw;
  setOffset(raw / sheetZoom(popup));
}

function onPointerUp() {
  if (!armed) return;
  const moved = dragMoved;
  armed = false;
  dragMoved = false;
  if (!moved) return;
  const visualHeight = panelRef.value?.getBoundingClientRect().height || 400;
  const distance = Math.min(DISMISS_DISTANCE_PX, visualHeight * DISMISS_DISTANCE_RATIO);
  finishDrag(dy > distance || velocity > DISMISS_VELOCITY);
}

// Touch panning cancels the pointer stream as soon as the browser scrolls, so an
// armed downward pull has to claim the gesture before that happens.
function onTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  if (!armed || !touch) return;
  const moveX = touch.clientX - startX;
  const moveY = touch.clientY - startY;
  if (moveY > 0 && moveY >= Math.abs(moveX) && event.cancelable) event.preventDefault();
}

function bindSheet(popup: HTMLElement) {
  popup.addEventListener('pointerdown', onPointerDown);
  popup.addEventListener('pointermove', onPointerMove, { passive: false });
  popup.addEventListener('pointerup', onPointerUp);
  popup.addEventListener('pointercancel', onPointerUp);
  popup.addEventListener('touchmove', onTouchMove, { passive: false });
}

function unbindSheet(popup: HTMLElement | null) {
  if (!popup) return;
  popup.removeEventListener('pointerdown', onPointerDown);
  popup.removeEventListener('pointermove', onPointerMove);
  popup.removeEventListener('pointerup', onPointerUp);
  popup.removeEventListener('pointercancel', onPointerUp);
  popup.removeEventListener('touchmove', onTouchMove);
}

watch(panelRef, (popup, previous) => {
  if (previous) unbindSheet(previous);
  if (popup) bindSheet(popup);
});

function onSheetTransitionEnd(event: TransitionEvent) {
  if (event.target !== panelRef.value || event.propertyName !== 'transform') return;
  if (settleDone) {
    settleDone();
    return;
  }
  if (!props.open && !dragging.value) {
    window.clearTimeout(closeTimer);
    present.value = false;
  }
}

function onOverlay() {
  if (!props.closeOnOverlay || dragging.value) return;
  requestClose();
}

watch(() => props.open, (open) => {
  if (open) {
    window.clearTimeout(closeTimer);
    present.value = true;
    shown.value = false;
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (props.open) shown.value = true;
        });
      });
    });
    return;
  }
  if (!present.value) return;
  settleDone = null;
  window.clearTimeout(settleTimer);
  armed = false;
  dragMoved = false;
  shown.value = false;
  nextTick(() => {
    if (props.open) return;
    clearInline();
  });
  window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => {
    if (!props.open) present.value = false;
  }, SHEET_MS);
}, { immediate: true });

onBeforeUnmount(() => {
  window.clearTimeout(closeTimer);
  window.clearTimeout(settleTimer);
  settleDone = null;
  unbindSheet(panelRef.value);
});
</script>

<style scoped lang="scss">
.rk-popup-root {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.rk-popup-root.is-open {
  pointer-events: auto;
}

.rk-popup-mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgb(0 0 0 / 40%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.rk-popup-root.is-open .rk-popup-mask {
  pointer-events: auto;
  opacity: 1;
}

.rk-popup {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 70%;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  overflow: hidden;
  color: var(--rk-text-primary);
  pointer-events: auto;
  background: var(--rk-bg-surface);
  border-top: 1px solid var(--rk-border);
  border-radius: 16px 16px 0 0;
  transform: translateY(100%);
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.rk-popup-root.is-open .rk-popup {
  transform: translateY(0);
}

.rk-popup.is-auto {
  height: auto;
  max-height: 78%;
}

.rk-popup.is-dragging,
.rk-popup-mask.is-dragging {
  transition: none;
}

.rk-popup.is-dragging {
  touch-action: none;
}

.rk-popup-handle {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  padding: 10px 0 6px;
  touch-action: none;
  cursor: grab;
}

.rk-popup.is-dragging .rk-popup-handle {
  cursor: grabbing;
}

.rk-popup-handle i {
  display: block;
  width: 36px;
  height: 4px;
  background: var(--rk-border-strong);
  border-radius: 2px;
}

.rk-popup-head {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  padding: 4px 16px 10px;
  touch-action: none;
}

.rk-popup-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--rk-fs-lg);
  font-weight: 600;
  color: var(--rk-text-primary);
  white-space: nowrap;
}

.rk-popup-close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  margin-left: auto;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: var(--rk-bg-hover);
  border: none;
  border-radius: 50%;
}

.rk-popup-body {
  flex: 1;
  min-height: 0;
  padding: 0 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.rk-popup-footer {
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .rk-popup,
  .rk-popup-mask {
    transition-duration: 0.01s;
  }
}
</style>
