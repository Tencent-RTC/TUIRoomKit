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
      :class="{ 'rk-popover-flush': !padded }"
      :data-placement="placement"
      :style="{ left: `${x}px`, top: `${y}px`, zIndex, maxHeight: maxHeight ? `${maxHeight}px` : undefined }"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    >
      <div
        v-if="showArrow"
        ref="arrowRef"
        class="rk-popover-arrow"
        :style="arrowStyle"
      />
      <slot name="content" />
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

.rk-popover-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--rk-bg-surface);
  border: 0;
  transform: translate(-50%, -50%) rotate(45deg);
}

.rk-popover[data-placement^='bottom'] .rk-popover-arrow {
  top: 0;
  border-top: 1px solid var(--rk-border);
  border-left: 1px solid var(--rk-border);
}

.rk-popover[data-placement^='top'] .rk-popover-arrow {
  bottom: -12px;
  border-right: 1px solid var(--rk-border);
  border-bottom: 1px solid var(--rk-border);
}

.rk-popover[data-placement^='right'] .rk-popover-arrow {
  left: 0;
  border-bottom: 1px solid var(--rk-border);
  border-left: 1px solid var(--rk-border);
}

.rk-popover[data-placement^='left'] .rk-popover-arrow {
  right: -12px;
  border-top: 1px solid var(--rk-border);
  border-right: 1px solid var(--rk-border);
}
</style>
