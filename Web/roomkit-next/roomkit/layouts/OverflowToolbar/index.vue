<template>
  <div ref="barRef" class="overflow-toolbar">
    <div class="overflow-toolbar-actions" :style="{ gap: `${gap}px` }">
      <div ref="itemsRef" class="overflow-toolbar-items" :style="{ gap: `${gap}px` }">
        <slot />
      </div>

      <OverflowMenu
        :actions="overflowActions"
        :fullscreen="fullscreen"
        :minimizable="minimizable"
        @action="activate"
        @minimize="emit('minimize')"
        @fullscreen="emit('fullscreen')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import OverflowMenu from './OverflowMenu.vue';
import { measureAvailableWidth, resolveVisibleCount } from './useToolbarOverflow';
import type { OverflowMenuEntry } from './useToolbarOverflow';

const props = withDefaults(defineProps<{
  fullscreen?: boolean;
  minimizable?: boolean;
  gap?: number;
  moreWidth?: number;
}>(), {
  fullscreen: false,
  minimizable: true,
  gap: 8,
  moreWidth: 40,
});

const emit = defineEmits<{
  minimize: [];
  fullscreen: [];
}>();

defineSlots<{
  default?(): unknown;
}>();

const barRef = ref<HTMLElement | null>(null);
const itemsRef = ref<HTMLElement | null>(null);
const overflowActions = ref<OverflowMenuEntry[]>([]);

let barObserver: ResizeObserver | null = null;
let itemsObserver: MutationObserver | null = null;
let itemElements: HTMLElement[] = [];
let cachedWidths: number[] = [];
let layoutFrame = 0;
let lastVisibleCount = -1;

function readLabel(element: HTMLElement): string {
  return element.getAttribute('aria-label')
    || element.querySelector<HTMLElement>('[aria-label]')?.getAttribute('aria-label')
    || element.querySelector('.toolbar-button-label')?.textContent?.trim()
    || element.querySelector('.participant-button-tip')?.textContent?.trim()
    || '';
}

function itemChildren(): HTMLElement[] {
  if (!itemsRef.value) {
    return [];
  }
  return Array.from(itemsRef.value.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
}

function parentContentWidth(parent: HTMLElement): number {
  const style = getComputedStyle(parent);
  return Math.max(
    0,
    parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
  );
}

function siblingWidths(parent: HTMLElement): number[] {
  const bar = barRef.value;
  return Array.from(parent.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement && child !== bar)
    .map(child => child.getBoundingClientRect().width)
    .filter(width => width > 0);
}

function itemWidths(items: HTMLElement[]): number[] {
  if (cachedWidths.length !== items.length) {
    items.forEach((element) => {
      element.style.display = '';
      element.style.flexShrink = '0';
    });
    cachedWidths = items.map(element => element.getBoundingClientRect().width);
    return cachedWidths;
  }

  items.forEach((element, index) => {
    if (element.style.display === 'none') {
      return;
    }
    const width = element.getBoundingClientRect().width;
    if (width > 0) {
      cachedWidths[index] = width;
    }
  });
  return cachedWidths;
}

function layout() {
  const items = itemChildren();
  itemElements = items;
  if (items.length === 0) {
    overflowActions.value = [];
    cachedWidths = [];
    lastVisibleCount = -1;
    return;
  }

  const parent = barRef.value?.parentElement;
  const widths = itemWidths(items);
  const available = parent
    ? measureAvailableWidth(
      parentContentWidth(parent),
      siblingWidths(parent),
      parseFloat(getComputedStyle(parent).gap) || props.gap,
      props.moreWidth,
      props.gap,
    )
    : Math.max(0, (barRef.value?.clientWidth ?? 0) - props.moreWidth - props.gap);
  const visibleCount = resolveVisibleCount(widths, available, props.gap);

  if (visibleCount === lastVisibleCount) {
    return;
  }
  lastVisibleCount = visibleCount;

  const overflow: OverflowMenuEntry[] = [];
  items.forEach((element, index) => {
    const hidden = index >= visibleCount;
    element.style.display = hidden ? 'none' : '';
    if (!hidden) {
      return;
    }
    overflow.push({
      id: String(index),
      label: readLabel(element) || `Item ${index + 1}`,
      icon: '',
    });
  });
  overflowActions.value = overflow;
}

function scheduleLayout() {
  if (layoutFrame) {
    return;
  }
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    layout();
  });
}

function activate(id: string) {
  const index = Number(id);
  const element = itemElements[index];
  if (!element) {
    return;
  }
  element.querySelector<HTMLElement>('button, [role="button"]')?.click();
}

function observe() {
  barObserver?.disconnect();
  itemsObserver?.disconnect();

  barObserver = new ResizeObserver(() => {
    scheduleLayout();
  });

  if (barRef.value?.parentElement) {
    barObserver.observe(barRef.value.parentElement);
  }

  if (itemsRef.value) {
    itemsObserver = new MutationObserver(() => {
      cachedWidths = [];
      lastVisibleCount = -1;
      void nextTick(scheduleLayout);
    });
    itemsObserver.observe(itemsRef.value, { childList: true });
  }

  void nextTick(scheduleLayout);
}

watch([barRef, itemsRef], () => {
  observe();
}, { immediate: true, flush: 'post' });

onBeforeUnmount(() => {
  barObserver?.disconnect();
  itemsObserver?.disconnect();
  if (layoutFrame) {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = 0;
  }
});
</script>

<style scoped lang="scss">
.overflow-toolbar {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.overflow-toolbar-actions {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.overflow-toolbar-items {
  display: flex;
  align-items: center;
  min-width: 0;
}
</style>
