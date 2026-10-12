<template>
  <div
    class="rk-list"
    :class="{
      'rk-list-plain': variant === 'plain',
      'rk-list-auto': itemSize === 'auto',
    }"
    :style="frameStyle"
  >
    <div
      ref="rootRef"
      class="rk-list-scroller"
      :class="{
        'rk-list-constrained': constrained,
        'rk-list-fill': height != null,
        'rk-list-no-scrollbar': !scrollbar,
      }"
      :style="scrollerStyle"
      role="list"
      @scroll.passive="onScroll"
    >
      <div v-if="children.length === 0" class="rk-list-empty">
        <slot name="empty">
          {{ emptyText }}
        </slot>
      </div>
      <template v-else-if="!virtualized">
        <div
          v-for="(vnode, index) in children"
          :key="rowKey(vnode, index)"
          :ref="el => bindRow(el, rowKey(vnode, index))"
          class="rk-list-row"
          role="listitem"
          :data-key="rowKey(vnode, index)"
          :style="fixedRowStyle"
        >
          <component :is="vnode" />
        </div>
      </template>
      <div
        v-else
        class="rk-list-spacer"
        :style="{ height: `${totalHeight}px` }"
      >
        <div class="rk-list-window" :style="{ transform: `translateY(${offsetY}px)` }">
          <div
            v-for="row in visible"
            :key="row.key"
            :ref="el => bindRow(el, row.key)"
            class="rk-list-row"
            role="listitem"
            :data-key="row.key"
            :style="virtualRowStyle"
          >
            <component :is="row.vnode" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useSlots, watch } from 'vue';
import type { ComponentPublicInstance, VNode } from 'vue';
import { flattenVNodes } from './flattenVNodes';
import {
  canCommitRowHeight,
  nextViewportHeight,
  shouldBreakFollow,
  shouldDeferBottomPin,
  useWindowedRows,
} from './listWindow';

defineOptions({ name: 'TUIList' });

type Align = 'start' | 'center' | 'end';
type RowEl = Element | ComponentPublicInstance | null;

const props = withDefaults(defineProps<{
  width?: number | string;
  height?: number | string;
  maxRows?: number;
  itemHeight?: number;
  /** `auto` measures each row when heights vary. */
  itemSize?: 'fixed' | 'auto';
  variant?: 'default' | 'plain';
  overscan?: number;
  emptyText?: string;
  /** Keep native overflow scrolling while hiding the scrollbar. */
  scrollbar?: boolean;
  /** Follow newly appended rows while the user stays at the bottom. */
  stickToBottom?: boolean;
  /** Distance from the bottom that still counts as "at bottom" for follow. */
  atBottomThreshold?: number;
}>(), {
  width: undefined,
  height: undefined,
  maxRows: undefined,
  itemHeight: 48,
  itemSize: 'fixed',
  variant: 'default',
  overscan: 4,
  emptyText: 'No data',
  scrollbar: false,
  stickToBottom: false,
  atBottomThreshold: 4,
});

const emit = defineEmits<{
  scroll: [offset: number];
}>();

const slots = useSlots();
const rootRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(0);
const heightMap = shallowRef(new Map<string, number>());
const rowEls = new Map<string, HTMLElement>();
let observer: ResizeObserver | null = null;
let rowObserver: ResizeObserver | null = null;
let following = false;
let pinning = false;
let pinRelease = 0;
let pendingBottomPin = false;
let wasDisplayed = false;
let layoutPinPending = false;
let layoutPinScheduled = false;

const children = computed(() => flattenVNodes(slots.default?.() ?? []));
const isAuto = computed(() => props.itemSize === 'auto');

function rowKey(vnode: VNode, index: number) {
  return String(vnode.key ?? index);
}

function heightOf(key: string) {
  if (!isAuto.value) {
    return props.itemHeight;
  }
  return heightMap.value.get(key) ?? props.itemHeight;
}

const offsets = computed(() => {
  const rows = children.value;
  const prefix = [0];
  let sum = 0;
  for (let i = 0; i < rows.length; i += 1) {
    sum += heightOf(rowKey(rows[i], i));
    prefix.push(sum);
  }
  return prefix;
});

const totalHeight = computed(() => offsets.value[children.value.length] ?? 0);
const capByRows = computed(() => (
  props.maxRows != null ? props.maxRows * props.itemHeight : null
));
const constrained = computed(() => props.height != null || props.maxRows != null);
const virtualized = computed(() => useWindowedRows(constrained.value));

function findStart(top: number) {
  const prefix = offsets.value;
  let lo = 0;
  let hi = Math.max(0, prefix.length - 2);
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (prefix[mid] <= top) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

const range = computed(() => {
  const count = children.value.length;
  if (count === 0) {
    return { start: 0, end: 0 };
  }
  if (!isAuto.value) {
    const start = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan);
    const visibleCount = Math.ceil(viewportHeight.value / props.itemHeight) + props.overscan * 2;
    return { start, end: Math.min(count, start + visibleCount) };
  }
  const start = Math.max(0, findStart(scrollTop.value) - props.overscan);
  let end = start;
  const limit = scrollTop.value + viewportHeight.value;
  const prefix = offsets.value;
  while (end < count && prefix[end] < limit) {
    end += 1;
  }
  return { start, end: Math.min(count, end + props.overscan) };
});

const visible = computed(() => {
  const { start, end } = range.value;
  return children.value.slice(start, end).map((vnode, offset) => {
    const index = start + offset;
    return {
      vnode,
      index,
      key: rowKey(vnode, index),
    };
  });
});

const offsetY = computed(() => {
  if (!isAuto.value) {
    return range.value.start * props.itemHeight;
  }
  return offsets.value[range.value.start] ?? 0;
});

const fixedRowStyle = computed(() => (
  isAuto.value ? undefined : { height: `${props.itemHeight}px` }
));

const virtualRowStyle = computed(() => (
  isAuto.value ? undefined : { height: `${props.itemHeight}px` }
));

let warnedMissingKey = false;
watch([virtualized, children], ([on, rows]) => {
  if (!on || warnedMissingKey) {
    return;
  }
  if (rows.some(vnode => vnode.key == null)) {
    warnedMissingKey = true;
    console.warn('[RoomKit] List virtualization needs a key on each ListItem. Keep Input / local state in the parent and v-model by id.');
  }
});

function toCssSize(value?: number | string) {
  if (value == null) {
    return undefined;
  }
  return typeof value === 'number' ? `${value}px` : value;
}

const frameStyle = computed(() => ({
  width: toCssSize(props.width),
  height: toCssSize(props.height),
  ...(isAuto.value ? {} : { '--rk-list-row-height': `${props.itemHeight}px` }),
}));

const scrollerStyle = computed(() => (
  capByRows.value != null && props.height == null
    ? { height: `${capByRows.value}px` }
    : undefined
));

function measureViewport() {
  const node = rootRef.value;
  const measured = node?.clientHeight ?? 0;
  const displayed = isScrollerDisplayed();
  const next = nextViewportHeight({
    current: viewportHeight.value,
    measured,
    displayed,
  });
  const changed = next !== viewportHeight.value;
  const revealed = displayed && !wasDisplayed;
  wasDisplayed = displayed;
  viewportHeight.value = next;
  if (!displayed || measured <= 0) {
    return;
  }
  if (pendingBottomPin || (revealed && props.stickToBottom && following)) {
    nextTick(pinToBottom);
    return;
  }
  if (changed) {
    nextTick(pinToBottomIfNeeded);
  }
}

function measureRowHeight(node: HTMLElement) {
  return Math.round(node.getBoundingClientRect().height);
}

function isScrollerDisplayed() {
  const node = rootRef.value;
  if (!node) {
    return false;
  }
  return node.clientHeight > 0 && node.getClientRects().length > 0;
}

function distanceFromBottom() {
  const node = rootRef.value;
  if (!node) {
    return 0;
  }
  return node.scrollHeight - node.scrollTop - node.clientHeight;
}

function isAtBottom() {
  return distanceFromBottom() < props.atBottomThreshold;
}

function isNearBottom() {
  return isAtBottom();
}

function rowHeight(key: PropertyKey) {
  return heightOf(String(key));
}

function beginPin() {
  pinning = true;
  window.clearTimeout(pinRelease);
  pinRelease = window.setTimeout(() => {
    pinning = false;
  }, 32);
}

function contentHeight() {
  const node = rootRef.value;
  if (!virtualized.value && node) {
    return node.scrollHeight;
  }
  return totalHeight.value;
}

function maxScrollTop() {
  const node = rootRef.value;
  const viewport = node?.clientHeight ?? viewportHeight.value;
  return Math.max(0, contentHeight() - viewport);
}

function scheduleLayoutPin() {
  layoutPinPending = true;
  if (layoutPinScheduled) {
    return;
  }
  layoutPinScheduled = true;
  nextTick(() => {
    pinToBottom();
    requestAnimationFrame(() => {
      layoutPinPending = false;
      layoutPinScheduled = false;
      emit('scroll', rootRef.value?.scrollTop ?? 0);
    });
  });
}

function setHeight(key: string, next: number) {
  if (!isAuto.value) {
    return;
  }
  if (!canCommitRowHeight({
    viewportHeight: viewportHeight.value,
    displayed: isScrollerDisplayed(),
    measuredHeight: next,
  })) {
    return;
  }
  const rounded = Math.max(1, Math.round(next));
  const previous = heightMap.value.get(key) ?? props.itemHeight;
  if (previous === rounded) {
    return;
  }
  const rows = children.value;
  const index = rows.findIndex((vnode, i) => rowKey(vnode, i) === key);
  const rowTop = index >= 0 ? (offsets.value[index] ?? 0) : 0;
  const delta = rounded - previous;
  const hadMeasuredHeight = heightMap.value.has(key);
  const trackingFollow = props.stickToBottom && following;
  const shouldShift = !trackingFollow
    && hadMeasuredHeight
    && index >= 0
    && rowTop < scrollTop.value
    && delta !== 0;

  const map = new Map(heightMap.value);
  map.set(key, rounded);
  heightMap.value = map;

  if (trackingFollow) {
    scheduleLayoutPin();
  }
  if (shouldShift) {
    const node = rootRef.value;
    if (node) {
      node.scrollTop += delta;
      scrollTop.value = node.scrollTop;
    }
  }
}

function bindRow(el: RowEl, key: string) {
  if (!el) {
    // Vue calls function refs with null before patching. Unbinding here
    // remeasures every row on each parent update and fights user scroll.
    return;
  }
  const node = (el as ComponentPublicInstance).$el
    ? (el as ComponentPublicInstance).$el as HTMLElement
    : el as HTMLElement;
  if (!(node instanceof HTMLElement)) {
    return;
  }
  const prev = rowEls.get(key);
  if (prev === node) {
    return;
  }
  if (prev) {
    rowObserver?.unobserve(prev);
  }
  rowEls.set(key, node);
  if (!isAuto.value) {
    return;
  }
  rowObserver?.observe(node);
  setHeight(key, measureRowHeight(node));
}

function onScroll() {
  const node = rootRef.value;
  const next = node?.scrollTop ?? 0;
  const prev = scrollTop.value;
  const measuredViewport = node?.clientHeight ?? 0;
  const viewportGrew = measuredViewport > viewportHeight.value + 0.5;
  if (viewportGrew) {
    viewportHeight.value = measuredViewport;
  }
  const displayed = isScrollerDisplayed();
  if (props.stickToBottom && shouldBreakFollow({
    pinning,
    layoutPinPending,
    displayed,
    nextOffset: next,
    previousOffset: prev,
    viewportGrew,
  })) {
    following = false;
  } else if (props.stickToBottom && !pinning && displayed && isAtBottom()) {
    following = true;
  }
  if (Math.abs(next - prev) < 1) {
    return;
  }
  scrollTop.value = next;
  if (!displayed || viewportGrew) {
    if (viewportGrew && props.stickToBottom && following) {
      nextTick(pinToBottomIfNeeded);
    }
    return;
  }
  if (layoutPinPending) {
    return;
  }
  emit('scroll', next);
}

function scrollToOffset(offset: number) {
  const node = rootRef.value;
  if (!node) {
    return;
  }
  const max = maxScrollTop();
  node.scrollTop = Math.min(Math.max(0, offset), max);
  scrollTop.value = node.scrollTop;
}

function scrollTo(index: number, align: Align = 'start') {
  const prefix = offsets.value;
  const start = prefix[index] ?? 0;
  const rowHeight = heightOf(rowKey(children.value[index], index));
  let next = start;
  if (align === 'center') {
    next -= (viewportHeight.value - rowHeight) / 2;
  }
  if (align === 'end') {
    next -= viewportHeight.value - rowHeight;
  }
  scrollToOffset(next);
}

function scrollToKey(key: PropertyKey, align: Align = 'start') {
  const index = children.value.findIndex((vnode, i) => rowKey(vnode, i) === String(key));
  if (index < 0) {
    return;
  }
  scrollTo(index, align);
}

function pinToBottom() {
  const node = rootRef.value;
  following = true;
  const viewport = node?.clientHeight ?? 0;
  if (!node || shouldDeferBottomPin(isScrollerDisplayed(), viewport)) {
    pendingBottomPin = true;
    return;
  }
  pendingBottomPin = false;
  beginPin();
  if (!virtualized.value) {
    node.scrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
    scrollTop.value = node.scrollTop;
    return;
  }
  nextTick(() => {
    scrollToOffset(Number.MAX_SAFE_INTEGER);
  });
}

function pinToBottomIfNeeded() {
  if (!props.stickToBottom || !following) {
    return;
  }
  pinToBottom();
}

onMounted(() => {
  measureViewport();
  observer = new ResizeObserver(measureViewport);
  if (rootRef.value) {
    observer.observe(rootRef.value);
  }
  rowObserver = new ResizeObserver((entries) => {
    if (!isAuto.value) {
      return;
    }
    for (const entry of entries) {
      const { key } = (entry.target as HTMLElement).dataset;
      if (key != null) {
        setHeight(key, measureRowHeight(entry.target as HTMLElement));
      }
    }
    nextTick(pinToBottomIfNeeded);
  });
  if (isAuto.value) {
    rowEls.forEach((node) => {
      rowObserver?.observe(node);
    });
  }
});

watch(() => children.value.length, () => {
  nextTick(pinToBottomIfNeeded);
});

watch(() => [props.itemHeight, props.maxRows, props.height], () => {
  measureViewport();
});

watch(virtualized, () => {
  nextTick(pinToBottomIfNeeded);
});

watch(() => props.stickToBottom, (on) => {
  following = on;
}, { immediate: true });

watch(() => children.value.map((vnode, index) => rowKey(vnode, index)), (keys) => {
  const alive = new Set(keys);
  const map = new Map(heightMap.value);
  let changed = false;
  map.forEach((_, key) => {
    if (!alive.has(key)) {
      map.delete(key);
      changed = true;
    }
  });
  rowEls.forEach((node, key) => {
    if (!alive.has(key)) {
      rowObserver?.unobserve(node);
      rowEls.delete(key);
    }
  });
  if (!changed) {
    return;
  }
  heightMap.value = map;
});

onBeforeUnmount(() => {
  window.clearTimeout(pinRelease);
  observer?.disconnect();
  rowObserver?.disconnect();
  rowEls.clear();
});

defineExpose({
  scrollTo,
  scrollToOffset,
  scrollToKey,
  scrollToBottom: pinToBottom,
  isNearBottom,
  distanceFromBottom,
  rowHeight,
});
</script>

<style scoped lang="scss">
.rk-list {
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-md);
}

.rk-list-scroller {
  flex: 0 0 auto;
  min-height: 0;
  width: 100%;
}

.rk-list-fill {
  flex: 1 1 auto;
  height: 100%;
}

.rk-list-constrained {
  overflow: auto;
  overflow-anchor: none;
  overscroll-behavior: contain;
}

.rk-list-no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.rk-list-plain {
  background: transparent;
  border: 0;
  border-radius: 0;
  overflow: visible;
}

.rk-list-spacer {
  position: relative;
  flex: none;
  width: 100%;
}

.rk-list-window {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  flex-direction: column;
}

.rk-list-row {
  display: flex;
  flex: none;
  align-items: center;
  box-sizing: border-box;
  height: var(--rk-list-row-height, auto);
}

.rk-list-row + .rk-list-row {
  border-top: 1px solid var(--rk-border);
}

.rk-list-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: 16px;
  font-size: 13px;
  color: var(--rk-text-secondary);
}

.rk-list-auto .rk-list-row {
  height: auto;
}

.rk-list-plain .rk-list-empty {
  min-height: 0;
  padding: 12px 0;
}

.rk-list-plain .rk-list-row + .rk-list-row {
  border-top: 0;
}
</style>
