<template>
  <div ref="barRef" class="overflow-toolbar-mobile" :style="{ gap: `${gap}px` }">
    <OverflowItemMobile
      v-for="(node, index) in items()"
      :key="node.key ?? index"
      :overflowed="overflowedIndexes.has(index)"
      :target="gridRef"
      :order="index"
      @update:present="setPresent(index, $event)"
    >
      <component :is="node" />
    </OverflowItemMobile>

    <ToolbarButtonMobile
      v-if="showMore"
      :label="t('Room.More')"
      :active="moreOpen"
      :pressed="moreOpen"
      @click="moreOpen = !moreOpen"
    >
      <IconMore />
    </ToolbarButtonMobile>

    <TUIPopup v-model:open="moreOpen" height="auto">
      <div ref="gridRef" class="overflow-toolbar-mobile-grid" @click.capture="closeOnAction" />
    </TUIPopup>
  </div>
</template>

<script setup lang="ts">
import { Comment, Fragment, computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import type { VNode } from 'vue';
import { IconMore, TUIPopup, t } from '../../base';
import ToolbarButtonMobile from '../ToolbarButtonMobile/ToolbarButtonMobile.vue';
import OverflowItemMobile from './OverflowItemMobile.vue';
import { measureMobileAvailableWidth, resolveMobileOverflow } from './resolveMobileOverflow';

const props = withDefaults(defineProps<{
  gap?: number;
  /** Every phone toolbar control is a circle of this size; see ToolbarButtonMobile */
  itemWidth?: number;
}>(), {
  gap: 12,
  itemWidth: 44,
});

const slots = defineSlots<{
  default?(): VNode[];
}>();

const barRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);
const moreOpen = ref(false);
const presence = reactive<Record<number, boolean>>({});
const availableWidth = ref(Number.POSITIVE_INFINITY);

function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) => {
    if (node.type === Comment) {
      return [];
    }
    if (node.type === Fragment && Array.isArray(node.children)) {
      return flatten(node.children as VNode[]);
    }
    return [node];
  });
}

function items(): VNode[] {
  return flatten(slots.default?.() ?? []);
}

function setPresent(index: number, present: boolean) {
  presence[index] = present;
}

const presentIndexes = computed(() => Object.keys(presence)
  .map(Number)
  .filter(index => presence[index])
  .sort((a, b) => a - b));

const overflow = computed(() => resolveMobileOverflow(
  presentIndexes.value.length,
  availableWidth.value,
  props.itemWidth,
  props.gap,
));

const overflowedIndexes = computed(() => new Set(presentIndexes.value.slice(overflow.value.visible)));
const showMore = computed(() => overflow.value.more);

watch(showMore, (more) => {
  if (!more) {
    moreOpen.value = false;
  }
});

function measure() {
  const bar = barRef.value;
  const parent = bar?.parentElement;
  if (!bar || !parent) {
    return;
  }
  const style = getComputedStyle(parent);
  const contentWidth = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const siblingWidths = Array.from(parent.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement && child !== bar)
    .map(child => child.getBoundingClientRect().width)
    .filter(width => width > 0);
  availableWidth.value = measureMobileAvailableWidth(contentWidth, siblingWidths, parseFloat(style.columnGap) || 0);
}

/** Only an action closes the sheet; a tap on the padding between cells does not. */
function closeOnAction(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('[role="button"], button')) {
    moreOpen.value = false;
  }
}

let resizeObserver: ResizeObserver | null = null;

watch(barRef, (bar) => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (!bar?.parentElement) {
    return;
  }
  resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(bar.parentElement);
  void nextTick(measure);
}, { flush: 'post', immediate: true });

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped lang="scss">
.overflow-toolbar-mobile {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  min-width: 0;
}

/* Spaced from the sheet edge on its own, over TUIPopup's 16px body padding. */
.overflow-toolbar-mobile-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 4px;
  padding: 6px 8px 14px;
  margin: 0 -16px;
}
</style>
