<template>
  <span
    ref="referenceRef"
    class="rk-popover-anchor"
    @click="onClick"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <slot />
  </span>
  <Teleport v-if="host && isOpen" :to="host">
    <div
      ref="floatingRef"
      class="rk-float rk-popover"
      :class="{ 'rk-popover-flush': !padded, 'has-arrow': showArrow }"
      :data-placement="placement"
      :style="{
        left: `${x}px`,
        top: `${y}px`,
        zIndex,
        maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        '--rk-float-max': maxHeight ? `${maxHeight}px` : undefined,
      }"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    >
      <span
        v-if="showArrow"
        ref="arrowRef"
        class="rk-popover-arrow"
        :style="arrowStyle"
      >
        <!-- Outer triangle is the border. The fill sits 1px inside it and
             runs one pixel into the panel, covering the border under the arrow. -->
        <svg viewBox="0 0 16 8" aria-hidden="true">
          <path class="rk-popover-arrow-stroke" d="M0 7 L8 0 L16 7 Z" />
          <path class="rk-popover-arrow-fill" d="M0.66 7 L8 1.33 L15.34 7 L15.34 8 L0.66 8 Z" />
        </svg>
      </span>
      <!-- The rounded fill cannot be the arrow's parent: phone browsers clip a
           transformed child to that curve. -->
      <div v-if="showArrow" class="rk-popover-body">
        <slot name="content" />
      </div>
      <slot v-else name="content" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useFloating } from '../../headless/useFloating';
import { useOverlay } from '../../headless/useOverlay';
import type { Placement } from '../../tokens';

defineOptions({ name: 'TUIPopover' });

const props = withDefaults(defineProps<{
  open?: boolean;
  trigger?: 'click' | 'hover';
  placement?: Placement;
  offset?: number;
  showArrow?: boolean;
  disabled?: boolean;
  /** Element used to position the floating panel. */
  reference?: HTMLElement | null;
  /** Set to false to let the content own its padding and width */
  padded?: boolean;
}>(), {
  trigger: 'click',
  placement: 'bottom-start',
  offset: 8,
  showArrow: false,
  padded: true,
});

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const referenceRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);
const innerOpen = ref(false);
const floatingReference = computed(() => props.reference ?? referenceRef.value);
let leaveTimer = 0;
const instance = getCurrentInstance();

const isControlled = computed(() => {
  const passed = instance?.vnode.props;
  return !!passed && 'open' in passed;
});
const isOpen = computed(() => (isControlled.value ? !!props.open : innerOpen.value));

function setOpen(next: boolean) {
  if (props.disabled) {
    return;
  }
  if (!isControlled.value) {
    innerOpen.value = next;
  }
  emit('update:open', next);
}

const { host, zIndex } = useOverlay({
  lane: 'popover',
  open: isOpen,
  closeOnOutside: true,
  closeOnEsc: true,
  onClose: () => setOpen(false),
  reference: floatingReference,
}, [referenceRef, floatingRef]);

const { x, y, placement, maxHeight, arrowX, arrowY, update } = useFloating({
  reference: floatingReference,
  floating: floatingRef,
  placement: computed(() => props.placement),
  offset: computed(() => props.offset),
  arrow: arrowRef,
  boundary: host,
  enabled: isOpen,
  constrainHeight: true,
});

const arrowStyle = computed<CSSProperties>(() => ({
  left: placement.value.startsWith('left') || placement.value.startsWith('right') ? undefined : `${arrowX.value}px`,
  top: placement.value.startsWith('top') || placement.value.startsWith('bottom') ? undefined : `${arrowY.value}px`,
}));

watch(isOpen, async (open) => {
  if (!open) {
    return;
  }
  await nextTick();
  update();
  requestAnimationFrame(update);
});

function onClick() {
  if (props.trigger !== 'click') {
    return;
  }
  setOpen(!isOpen.value);
}

function onEnter() {
  if (props.trigger !== 'hover') {
    return;
  }
  window.clearTimeout(leaveTimer);
  setOpen(true);
}

function onLeave() {
  if (props.trigger !== 'hover') {
    return;
  }
  leaveTimer = window.setTimeout(() => setOpen(false), 120);
}
</script>

<style scoped lang="scss">
.rk-popover-anchor {
  display: inline-flex;
}

/* Column so content that opts into `min-height: 0` shrinks inside the height cap
   `useFloating` hands down; anything else keeps its size and scrolls here instead. */
.rk-popover {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.rk-popover-flush {
  min-width: 0;
  padding: 0;
  border-radius: var(--rk-radius-lg);
}

/* Phone browsers clip a transformed child to an ancestor border-radius.
   The shell stays square; the rounded fill lives on the body. */
.rk-root .rk-float.rk-popover.has-arrow {
  padding: 0;
  overflow: visible;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.rk-root .rk-float.rk-popover.has-arrow .rk-popover-body {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 180px;
  max-height: var(--rk-float-max);
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: none;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-md);
  box-shadow: var(--rk-shadow-pop);

  &::-webkit-scrollbar {
    display: none;
  }
}

.rk-root .rk-float.rk-popover.has-arrow.rk-popover-flush .rk-popover-body {
  min-width: 0;
  padding: 0;
  border-radius: var(--rk-radius-lg);
}

.rk-root.is-h5 .rk-float.rk-popover.has-arrow .rk-popover-body {
  background: var(--rk-h5-popover-bg);
}

.rk-root.is-h5 .rk-float.rk-popover.has-arrow .rk-popover-arrow {
  background: transparent;
}

.rk-root.is-h5 .rk-float.rk-popover.has-arrow .rk-popover-arrow-fill {
  fill: var(--rk-h5-popover-bg);
}

.rk-popover-arrow {
  position: absolute;
  z-index: 1;
  display: block;
  width: 16px;
  height: 8px;
  pointer-events: none;
  background: transparent;
}

.rk-popover-arrow svg {
  display: block;
  width: 16px;
  height: 8px;
  overflow: visible;
}

.rk-popover-arrow-fill {
  fill: var(--rk-bg-surface);
}

.rk-popover-arrow-stroke {
  fill: var(--rk-border);
}

/* 7px of the 8px graphic sits outside the panel; the last 1px covers its border. */
.rk-popover[data-placement^='bottom'] .rk-popover-arrow {
  top: -7px;
  transform: translateX(-50%);
}

.rk-popover[data-placement^='top'] .rk-popover-arrow {
  bottom: -7px;
  transform: translateX(-50%) rotate(180deg);
}

.rk-popover[data-placement^='left'] .rk-popover-arrow,
.rk-popover[data-placement^='right'] .rk-popover-arrow {
  width: 8px;
  height: 16px;
}

.rk-popover[data-placement^='left'] .rk-popover-arrow svg,
.rk-popover[data-placement^='right'] .rk-popover-arrow svg {
  position: absolute;
  top: 50%;
  left: 50%;
}

.rk-popover[data-placement^='right'] .rk-popover-arrow {
  right: -7px;
  transform: translateY(-50%);
}

.rk-popover[data-placement^='right'] .rk-popover-arrow svg {
  transform: translate(-50%, -50%) rotate(90deg);
}

.rk-popover[data-placement^='left'] .rk-popover-arrow {
  left: -7px;
  transform: translateY(-50%);
}

.rk-popover[data-placement^='left'] .rk-popover-arrow svg {
  transform: translate(-50%, -50%) rotate(-90deg);
}
</style>
