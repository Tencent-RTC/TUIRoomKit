import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Ref } from 'vue';

export interface StreamItemDimensionsOptions {
  containerRef: Ref<HTMLElement | null>;
  columns: Ref<number> | number;
  rows: Ref<number> | number;
  itemCount: Ref<number> | number;
  gap?: number;
  aspectRatio?: number;
  padding?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  watchDependencies?: Array<Ref<unknown> | (() => unknown)>;
}

export interface StreamItemStyle {
  width?: string;
  height?: string;
}

/** Fit N×M tiles into a container while keeping aspect ratio. */
export function useStreamItemDimensions(options: StreamItemDimensionsOptions) {
  const {
    containerRef,
    columns,
    rows,
    itemCount,
    gap = 0,
    aspectRatio = 16 / 9,
    padding = {},
    watchDependencies = [],
  } = options;

  const itemStyle = ref<StreamItemStyle>({});

  function calculateDimensions() {
    if (!containerRef.value) {
      return;
    }

    const containerRect = containerRef.value.getBoundingClientRect();
    const colNumber = typeof columns === 'number' ? columns : columns.value;
    const rowNumber = typeof rows === 'number' ? rows : rows.value;
    const count = typeof itemCount === 'number' ? itemCount : itemCount.value;

    if (count <= 0 || colNumber <= 0 || rowNumber <= 0) {
      if (itemStyle.value.width !== undefined || itemStyle.value.height !== undefined) {
        itemStyle.value = {};
      }
      return;
    }

    const computedStyle = window.getComputedStyle(containerRef.value);
    const availableWidth = containerRect.width
      - (parseFloat(computedStyle.paddingLeft) || 0)
      - (parseFloat(computedStyle.paddingRight) || 0)
      - (padding.left || 0)
      - (padding.right || 0);
    const availableHeight = containerRect.height
      - (parseFloat(computedStyle.paddingTop) || 0)
      - (parseFloat(computedStyle.paddingBottom) || 0)
      - (padding.top || 0)
      - (padding.bottom || 0);

    const itemWidthByWidth = (availableWidth - (colNumber - 1) * gap) / colNumber;
    const itemHeightByWidth = itemWidthByWidth / aspectRatio;
    const itemHeightByHeight = (availableHeight - (rowNumber - 1) * gap) / rowNumber;
    const itemWidthByHeight = itemHeightByHeight * aspectRatio;

    let finalWidth: number;
    let finalHeight: number;
    if (itemHeightByWidth <= availableHeight / rowNumber) {
      finalWidth = itemWidthByWidth;
      finalHeight = itemHeightByWidth;
    } else {
      finalWidth = itemWidthByHeight;
      finalHeight = itemHeightByHeight;
    }

    const width = `${Math.floor(finalWidth)}px`;
    const height = `${Math.floor(finalHeight)}px`;
    if (itemStyle.value.width === width && itemStyle.value.height === height) {
      return;
    }
    itemStyle.value = { width, height };
  }

  let resizeObserver: ResizeObserver | null = null;

  function setupResizeObserver() {
    if (!containerRef.value) {
      return;
    }
    resizeObserver = new ResizeObserver(() => {
      calculateDimensions();
    });
    resizeObserver.observe(containerRef.value);
  }

  function handleWindowResize() {
    calculateDimensions();
  }

  onMounted(() => {
    nextTick(() => {
      calculateDimensions();
      setupResizeObserver();
      window.addEventListener('resize', handleWindowResize);
    });
  });

  onUnmounted(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    window.removeEventListener('resize', handleWindowResize);
  });

  if (watchDependencies.length > 0) {
    watch(
      watchDependencies,
      () => {
        nextTick(() => {
          calculateDimensions();
        });
      },
      { deep: true },
    );
  }

  return {
    itemStyle,
    calculateDimensions,
  };
}
