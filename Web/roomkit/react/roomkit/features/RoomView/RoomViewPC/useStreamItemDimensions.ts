import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface StreamItemDimensionsOptions {
  containerRef: RefObject<HTMLElement | null>;
  columns: number;
  rows: number;
  itemCount: number;
  gap?: number;
  aspectRatio?: number;
  padding?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  /** Primitive values; a change recalculates after the DOM has been updated. Keep the length constant. */
  watchDependencies?: unknown[];
}

export interface StreamItemStyle {
  width?: string;
  height?: string;
}

/** Fit N×M tiles into a container while keeping aspect ratio. */
export function useStreamItemDimensions(options: StreamItemDimensionsOptions) {
  const { containerRef, watchDependencies = [] } = options;

  const [itemStyle, setItemStyle] = useState<StreamItemStyle>({});
  const itemStyleRef = useRef<StreamItemStyle>(itemStyle);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const updateItemStyle = useCallback((next: StreamItemStyle) => {
    itemStyleRef.current = next;
    setItemStyle(next);
  }, []);

  const calculateDimensions = useCallback(() => {
    const {
      containerRef: container,
      columns,
      rows,
      itemCount,
      gap = 0,
      aspectRatio = 16 / 9,
      padding = {},
    } = optionsRef.current;
    if (!container.current) {
      return;
    }

    const containerRect = container.current.getBoundingClientRect();
    const colNumber = columns;
    const rowNumber = rows;
    const count = itemCount;

    if (count <= 0 || colNumber <= 0 || rowNumber <= 0) {
      if (itemStyleRef.current.width !== undefined || itemStyleRef.current.height !== undefined) {
        updateItemStyle({});
      }
      return;
    }

    const computedStyle = window.getComputedStyle(container.current);
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
    if (itemStyleRef.current.width === width && itemStyleRef.current.height === height) {
      return;
    }
    updateItemStyle({ width, height });
  }, [updateItemStyle]);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    function handleWindowResize() {
      calculateDimensions();
    }

    calculateDimensions();
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        calculateDimensions();
      });
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [calculateDimensions, containerRef]);

  const isFirstWatchRef = useRef(true);
  useEffect(() => {
    if (isFirstWatchRef.current) {
      isFirstWatchRef.current = false;
      return;
    }
    if (watchDependencies.length > 0) {
      calculateDimensions();
    }
  }, watchDependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    itemStyle,
    calculateDimensions,
  };
}
