<template>
  <div ref="barRef" class="overflow-toolbar">
    <div class="overflow-toolbar-actions" :style="{ gap: `${gap}px` }">
      <div ref="itemsRef" class="overflow-toolbar-items" :style="{ gap: `${gap}px` }">
        <slot />
      </div>

      <OverflowMenu
        :entries="overflowEntries"
        :fullscreen="fullscreen"
        :minimizable="minimizable"
        @minimize="emit('minimize')"
        @fullscreen="emit('fullscreen')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, watch } from 'vue';
import OverflowMenu from './OverflowMenu.vue';
import { OVERFLOW_ITEM_KEY } from './overflowItem';
import type { OverflowMenuEntry, RegisteredOverflowItem } from './overflowItem';
import { measureAvailableWidth, resolveOverflowEntries, resolveVisibleCount } from './toolbarOverflow';

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

// Toolbar controls describe themselves here; the menu never reads meaning off the DOM.
const sources = shallowRef<Array<() => RegisteredOverflowItem | null>>([]);
provide(OVERFLOW_ITEM_KEY, (source) => {
  sources.value = [...sources.value, source];
  return () => {
    sources.value = sources.value.filter(item => item !== source);
  };
});

/** Slot children hidden by the last layout, in toolbar order. */
const collapsed = shallowRef<HTMLElement[]>([]);

const childIds = new WeakMap<HTMLElement, string>();
let childSeed = 0;
function idOf(element: HTMLElement): string {
  let id = childIds.get(element);
  if (!id) {
    childSeed += 1;
    id = `item-${childSeed}`;
    childIds.set(element, id);
  }
  return id;
}

const overflowEntries = computed<OverflowMenuEntry[]>(() => resolveOverflowEntries(
  collapsed.value,
  sources.value.map(source => source()).filter((item): item is RegisteredOverflowItem => !!item),
  idOf,
));

let barObserver: ResizeObserver | null = null;
let itemsObserver: MutationObserver | null = null;
let cachedWidths: number[] = [];
let layoutFrame = 0;
let lastVisibleCount = -1;

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
    items.forEach(({ style }) => {
      Object.assign(style, { display: '', flexShrink: '0' });
    });
    cachedWidths = items.map(element => element.getBoundingClientRect().width);
    return cachedWidths;
  }

  items.forEach((element, index) => {
    if (element.style.display === 'none') {
      return;
    }
    const { width } = element.getBoundingClientRect();
    if (width > 0) {
      cachedWidths[index] = width;
    }
  });
  return cachedWidths;
}

function layout() {
  const items = itemChildren();
  if (items.length === 0) {
    collapsed.value = [];
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

  items.forEach(({ style }, index) => {
    Object.assign(style, { display: index >= visibleCount ? 'none' : '' });
  });
  collapsed.value = items.slice(visibleCount);
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
