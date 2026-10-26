<template>
  <span
    ref="referenceRef"
    class="rk-dropdown-anchor"
    @click="onClick"
    @contextmenu="onContextMenu"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <slot />
  </span>
  <Teleport v-if="host && isOpen" :to="host">
    <div
      ref="floatingRef"
      class="rk-float rk-dropdown"
      :class="{ 'has-arrow': showArrow }"
      role="menu"
      :data-placement="placement"
      :style="{
        left: `${x}px`,
        top: `${y}px`,
        zIndex,
        maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        '--rk-float-max': maxHeight ? `${maxHeight}px` : undefined,
      }"
      @keydown="onKeydown"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    >
      <span
        v-if="showArrow"
        ref="arrowRef"
        class="rk-dropdown-arrow"
        :style="arrowStyle"
      >
        <!-- Outer triangle is the border. The fill sits 1px inside it and
             runs one pixel into the panel, covering the border under the arrow. -->
        <svg viewBox="0 0 16 8" aria-hidden="true">
          <path class="rk-dropdown-arrow-stroke" d="M0 7 L8 0 L16 7 Z" />
          <path class="rk-dropdown-arrow-fill" d="M0.66 7 L8 1.33 L15.34 7 L15.34 8 L0.66 8 Z" />
        </svg>
      </span>
      <div class="rk-dropdown-body">
        <slot name="menu" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, provide, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useFloating } from '../../headless/useFloating';
import { useOverlay } from '../../headless/useOverlay';
import { useRovingFocus } from '../../headless/useRovingFocus';
import { DROPDOWN_CONTEXT_KEY } from '../../tokens';
import type { DropdownItemRecord, Placement } from '../../tokens';

defineOptions({ name: 'TUIDropdown' });

const props = withDefaults(defineProps<{
  open?: boolean;
  trigger?: 'click' | 'hover';
  placement?: Placement;
  offset?: number;
  disabled?: boolean;
  closeOnSelect?: boolean;
  showArrow?: boolean;
  /** Right-click opens the menu at the pointer. A later click anchors it to the trigger. */
  contextmenu?: boolean;
  virtualReference?: { x: number; y: number } | null;
}>(), {
  trigger: 'click',
  placement: 'bottom-start',
  offset: 6,
  closeOnSelect: true,
  showArrow: false,
  contextmenu: false,
});

const emit = defineEmits<{
  'command': [command: string | number];
  'update:open': [open: boolean];
}>();

const referenceRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);
const innerOpen = ref(false);
const pointer = ref<{ x: number; y: number } | null>(null);
const items = ref<DropdownItemRecord[]>([]);
let leaveTimer = 0;
const instance = getCurrentInstance();

function pointReference(point: { x: number; y: number }) {
  return {
    getBoundingClientRect: () => ({
      left: point.x,
      top: point.y,
      width: 0,
      height: 0,
      right: point.x,
      bottom: point.y,
      x: point.x,
      y: point.y,
      toJSON: () => ({}),
    }),
    closest: () => null,
    ownerDocument: document,
  } as unknown as HTMLElement;
}

const virtualRef = computed<HTMLElement | null>(() => {
  if (pointer.value) return pointReference(pointer.value);
  if (props.virtualReference) return pointReference(props.virtualReference);
  return referenceRef.value;
});

const isControlled = computed(() => {
  const passed = instance?.vnode.props;
  return !!passed && 'open' in passed;
});
const isOpen = computed(() => (isControlled.value ? !!props.open : innerOpen.value));
const { highlighted, onKeydown } = useRovingFocus(items);

function setOpen(next: boolean) {
  if (props.disabled) return;
  if (!isControlled.value) innerOpen.value = next;
  emit('update:open', next);
}

const { host, zIndex } = useOverlay({
  lane: 'dropdown',
  open: isOpen,
  closeOnOutside: true,
  closeOnEsc: true,
  onClose: () => setOpen(false),
}, [referenceRef, floatingRef]);

const { x, y, placement, maxHeight, arrowX, arrowY, update } = useFloating({
  reference: virtualRef,
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

provide(DROPDOWN_CONTEXT_KEY, {
  onCommand: (command) => {
    emit('command', command);
    if (props.closeOnSelect) setOpen(false);
  },
  close: () => setOpen(false),
  register: (item) => {
    items.value = [...items.value, item];
  },
  unregister: (value) => {
    items.value = items.value.filter(item => item.value !== value);
  },
  highlighted,
});

watch(isOpen, async (open) => {
  if (!open) {
    pointer.value = null;
    highlighted.value = null;
    return;
  }
  await nextTick();
  update();
  highlighted.value = null;
});

function onClick() {
  if (props.trigger !== 'click') return;
  pointer.value = null;
  setOpen(!isOpen.value);
}

function onContextMenu(event: MouseEvent) {
  if (!props.contextmenu) return;
  event.preventDefault();
  if (props.disabled) return;
  pointer.value = { x: event.clientX, y: event.clientY };
  setOpen(true);
}

function onEnter() {
  if (props.trigger !== 'hover') return;
  window.clearTimeout(leaveTimer);
  setOpen(true);
}

function onLeave() {
  if (props.trigger !== 'hover') return;
  leaveTimer = window.setTimeout(() => setOpen(false), 120);
}
</script>

<style scoped lang="scss">
.rk-dropdown-anchor {
  display: inline-flex;
}

.rk-dropdown {
  --rk-dropdown-pad: 6px;

  display: flex;
  flex-direction: column;
  min-width: 168px;
  padding: var(--rk-dropdown-pad);
  overflow: visible;
}

.rk-root .rk-float.rk-dropdown.has-arrow {
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.rk-root .rk-float.rk-dropdown.has-arrow .rk-dropdown-body {
  box-sizing: border-box;
  max-height: var(--rk-float-max);
  padding: var(--rk-dropdown-pad);
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-dropdown-radius, var(--rk-radius-md));
  box-shadow: var(--rk-shadow-pop);
}

.rk-root.is-h5 .rk-float.rk-dropdown.has-arrow .rk-dropdown-body {
  background: var(--rk-h5-popover-bg);
}

.rk-root.is-h5 .rk-float.rk-dropdown.has-arrow .rk-dropdown-arrow-fill {
  fill: var(--rk-h5-popover-bg);
}

.rk-dropdown-body {
  flex: 1 1 auto;
  min-height: 0;
  max-height: calc(var(--rk-float-max) - 2 * var(--rk-dropdown-pad) - 2px);
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.rk-dropdown-arrow {
  position: absolute;
  z-index: 1;
  display: block;
  width: 16px;
  height: 8px;
  pointer-events: none;
}

.rk-dropdown-arrow svg {
  display: block;
  width: 16px;
  height: 8px;
  overflow: visible;
}

.rk-dropdown-arrow-fill {
  fill: var(--rk-bg-surface);
}

.rk-dropdown-arrow-stroke {
  fill: var(--rk-border);
}

/* 7px of the 8px graphic sits outside the panel; the last 1px covers its border. */
.rk-dropdown[data-placement^='bottom'] .rk-dropdown-arrow {
  top: -7px;
  transform: translateX(-50%);
}

.rk-dropdown[data-placement^='top'] .rk-dropdown-arrow {
  bottom: -7px;
  transform: translateX(-50%) rotate(180deg);
}

.rk-dropdown[data-placement^='left'] .rk-dropdown-arrow,
.rk-dropdown[data-placement^='right'] .rk-dropdown-arrow {
  width: 8px;
  height: 16px;
}

.rk-dropdown[data-placement^='left'] .rk-dropdown-arrow svg,
.rk-dropdown[data-placement^='right'] .rk-dropdown-arrow svg {
  position: absolute;
  top: 50%;
  left: 50%;
}

.rk-dropdown[data-placement^='right'] .rk-dropdown-arrow {
  right: -7px;
  transform: translateY(-50%);
}

.rk-dropdown[data-placement^='right'] .rk-dropdown-arrow svg {
  transform: translate(-50%, -50%) rotate(90deg);
}

.rk-dropdown[data-placement^='left'] .rk-dropdown-arrow {
  left: -7px;
  transform: translateY(-50%);
}

.rk-dropdown[data-placement^='left'] .rk-dropdown-arrow svg {
  transform: translate(-50%, -50%) rotate(-90deg);
}
</style>
