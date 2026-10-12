<template>
  <span ref="referenceRef" class="rk-dropdown-anchor" @click="onClick" @mouseenter="onEnter" @mouseleave="onLeave">
    <slot />
  </span>
  <Teleport v-if="host && isOpen" :to="host">
    <div
      ref="floatingRef"
      class="rk-float rk-dropdown"
      role="menu"
      :data-placement="placement"
      :style="{ left: `${x}px`, top: `${y}px`, zIndex, maxHeight: maxHeight ? `${maxHeight}px` : undefined }"
      @keydown="onKeydown"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    >
      <div
        v-if="showArrow"
        ref="arrowRef"
        class="rk-dropdown-arrow"
        :style="arrowStyle"
      />
      <slot name="menu" />
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
  virtualReference?: { x: number; y: number } | null;
}>(), {
  trigger: 'click',
  placement: 'bottom-start',
  offset: 6,
  closeOnSelect: true,
  showArrow: false,
});

const emit = defineEmits<{
  command: [command: string | number];
  'update:open': [open: boolean];
}>();

const referenceRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);
const innerOpen = ref(false);
const items = ref<DropdownItemRecord[]>([]);
let leaveTimer = 0;
const instance = getCurrentInstance();

const virtualRef = computed<HTMLElement | null>(() => {
  if (!props.virtualReference) return referenceRef.value;
  return {
    getBoundingClientRect: () => ({
      left: props.virtualReference!.x,
      top: props.virtualReference!.y,
      width: 0,
      height: 0,
      right: props.virtualReference!.x,
      bottom: props.virtualReference!.y,
      x: props.virtualReference!.x,
      y: props.virtualReference!.y,
      toJSON: () => ({}),
    }),
    closest: () => null,
    ownerDocument: document,
  } as unknown as HTMLElement;
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
    highlighted.value = null;
    return;
  }
  await nextTick();
  update();
  highlighted.value = null;
});

function onClick() {
  if (props.trigger !== 'click') return;
  setOpen(!isOpen.value);
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
  display: flex;
  flex-direction: column;
  min-width: 168px;
  padding: 6px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.rk-dropdown-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--rk-bg-surface);
  border: 0;
  transform: translate(-50%, -50%) rotate(45deg);
}

.rk-dropdown[data-placement^='bottom'] .rk-dropdown-arrow {
  top: 0;
  border-top: 1px solid var(--rk-border);
  border-left: 1px solid var(--rk-border);
}

.rk-dropdown[data-placement^='top'] .rk-dropdown-arrow {
  bottom: -12px;
  border-right: 1px solid var(--rk-border);
  border-bottom: 1px solid var(--rk-border);
}

.rk-dropdown[data-placement^='right'] .rk-dropdown-arrow {
  left: 0;
  border-bottom: 1px solid var(--rk-border);
  border-left: 1px solid var(--rk-border);
}

.rk-dropdown[data-placement^='left'] .rk-dropdown-arrow {
  right: -12px;
  border-top: 1px solid var(--rk-border);
  border-right: 1px solid var(--rk-border);
}
</style>
