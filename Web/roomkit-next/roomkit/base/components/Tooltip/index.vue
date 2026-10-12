<template>
  <span
    ref="referenceRef"
    class="rk-tooltip-anchor"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="onFocusIn"
    @focusout="hide"
  >
    <slot />
  </span>
  <Teleport v-if="tooltipHost && isOpen" :to="tooltipHost">
    <div
      ref="floatingRef"
      class="rk-tooltip"
      role="tooltip"
      :style="{ left: `${x}px`, top: `${y}px`, zIndex }"
    >
      <slot name="content">{{ content }}</slot>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useFloating } from '../../headless/useFloating';
import { useOverlay } from '../../headless/useOverlay';
import type { Placement } from '../../tokens';

defineOptions({ name: 'TUITooltip' });

const props = withDefaults(defineProps<{
  content?: string;
  placement?: Placement;
  disabled?: boolean;
  delay?: number;
}>(), {
  placement: 'top',
  delay: 200,
});

const referenceRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
let timer = 0;

const { host, zIndex } = useOverlay({
  lane: 'tooltip',
  open: isOpen,
  closeOnOutside: false,
  closeOnEsc: true,
  onClose: () => { isOpen.value = false; },
}, [referenceRef]);

const tooltipHost = ref<HTMLElement | null>(null);

function resolveTooltipHost() {
  const reference = referenceRef.value;
  if (!reference || !host.value || host.value.ownerDocument === reference.ownerDocument) {
    return host.value;
  }
  return reference.ownerDocument.body;
}

const { x, y, update } = useFloating({
  reference: referenceRef,
  floating: floatingRef,
  placement: computed(() => props.placement),
  offset: 8,
  boundary: tooltipHost,
  enabled: isOpen,
});

watch(isOpen, async (open) => {
  if (!open) return;
  await nextTick();
  update();
});

function show() {
  if (props.disabled) return;
  window.clearTimeout(timer);
  tooltipHost.value = resolveTooltipHost();
  timer = window.setTimeout(() => { isOpen.value = true; }, props.delay);
}

function onFocusIn(event: FocusEvent) {
  const target = event.target as HTMLElement | null;
  if (!target?.matches(':focus-visible')) {
    return;
  }
  show();
}

function hide() {
  window.clearTimeout(timer);
  isOpen.value = false;
}
</script>

<style scoped lang="scss">
.rk-tooltip-anchor {
  display: inline-flex;
}

.rk-tooltip {
  position: absolute;
  pointer-events: none;
  max-width: 240px;
  padding: 6px 8px;
  border-radius: var(--rk-radius-sm);
  background: var(--rk-tooltip-bg, var(--rk-bg-surface));
  color: var(--rk-tooltip-fg, var(--rk-text-primary));
  border: var(--rk-tooltip-border, 1px solid var(--rk-border));
  font-size: var(--rk-tooltip-size, 11px);
  font-weight: var(--rk-tooltip-weight, 500);
  line-height: 1.4;
  box-shadow: var(--rk-shadow-pop);
}
</style>
