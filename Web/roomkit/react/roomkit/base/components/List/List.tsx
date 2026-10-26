import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { IconChevron } from '../../icons';
import { flattenVNodes } from './flattenVNodes';
import {
  canCommitRowHeight,
  nextStickToBottom,
  nextViewportHeight,
  shouldDeferBottomPin,
  useWindowedRows as windowedRows,
} from './listWindow';
import './List.scss';

type Align = 'start' | 'center' | 'end';

export interface ListProps {
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
  /** Show a control that returns to the last row once that row has left the viewport. */
  jumpToEnd?: boolean;
  jumpLabel?: string;
  onScroll?: (offset: number) => void;
  /** Mirrors the Vue `update:stickToBottom` emit; fired whenever the follow state changes. */
  onStickToBottomChange?: (value: boolean) => void;
  emptySlot?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface ListExpose {
  scrollTo: (index: number, align?: Align) => void;
  scrollToOffset: (offset: number) => void;
  scrollToKey: (key: PropertyKey, align?: Align) => void;
  scrollToBottom: () => void;
  isNearBottom: () => boolean;
  distanceFromBottom: () => number;
  rowHeight: (key: PropertyKey) => number;
}

function rowKey(vnode: ReactElement, index: number) {
  return String(vnode.key ?? index);
}

function toCssSize(value?: number | string) {
  if (value == null) {
    return undefined;
  }
  return typeof value === 'number' ? `${value}px` : value;
}

export const TUIList = forwardRef<ListExpose, ListProps>((props, ref) => {
  const {
    width,
    height,
    maxRows,
    itemHeight = 48,
    itemSize = 'fixed',
    variant = 'default',
    overscan = 4,
    emptyText = 'No data',
    scrollbar = false,
    stickToBottom = false,
    atBottomThreshold = 4,
    jumpToEnd = false,
    jumpLabel = '',
    onScroll,
    onStickToBottomChange,
    emptySlot,
    children: slotChildren,
    className,
    style,
  } = props;

  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const [endHidden, setEndHidden] = useState(false);
  const jumpToEndRef = useRef(jumpToEnd);
  jumpToEndRef.current = jumpToEnd;
  const propsRef = useRef({ height, maxRows, itemHeight, itemSize, overscan, stickToBottom, atBottomThreshold });
  propsRef.current = { height, maxRows, itemHeight, itemSize, overscan, stickToBottom, atBottomThreshold };
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;
  const onStickToBottomChangeRef = useRef(onStickToBottomChange);
  onStickToBottomChangeRef.current = onStickToBottomChange;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const heightMapRef = useRef(new Map<string, number>());
  const rowElsRef = useRef(new Map<string, HTMLElement>());
  const childrenRef = useRef<ReactElement[]>([]);
  const offsetsCacheRef = useRef<{
    rows: ReactElement[];
    map: Map<string, number>;
    auto: boolean;
    itemHeight: number;
    prefix: number[];
  } | null>(null);
  const tickQueueRef = useRef<Array<() => void>>([]);
  const local = useRef({
    observer: null as ResizeObserver | null,
    rowObserver: null as ResizeObserver | null,
    following: false,
    pinning: false,
    pinRelease: 0,
    pendingBottomPin: false,
    wasDisplayed: false,
    layoutPinPending: false,
    layoutPinScheduled: false,
    // Set when the user scrolls up while a pin cycle is still running; the
    // break is applied once the pin settles so follow can never trap the viewport.
    userInterruptedPin: false,
    lastTouchY: 0,
    warnedMissingKey: false,
  }).current;

  // Runs the callback after the next commit, like Vue nextTick after a render flush.
  function nextTick(cb: () => void) {
    tickQueueRef.current.push(cb);
    forceRender();
  }

  function setScrollTop(value: number) {
    if (scrollTopRef.current === value) {
      return;
    }
    scrollTopRef.current = value;
    forceRender();
  }

  function setViewportHeight(value: number) {
    if (viewportHeightRef.current === value) {
      return;
    }
    viewportHeightRef.current = value;
    forceRender();
  }

  function setHeightMap(map: Map<string, number>) {
    heightMapRef.current = map;
    forceRender();
  }

  function isAuto() {
    return propsRef.current.itemSize === 'auto';
  }

  function isVirtualized() {
    const p = propsRef.current;
    return windowedRows(p.height != null || p.maxRows != null);
  }

  function heightOf(key: string) {
    if (!isAuto()) {
      return propsRef.current.itemHeight;
    }
    return heightMapRef.current.get(key) ?? propsRef.current.itemHeight;
  }

  function getOffsets() {
    const rows = childrenRef.current;
    const map = heightMapRef.current;
    const auto = isAuto();
    const ih = propsRef.current.itemHeight;
    const cache = offsetsCacheRef.current;
    if (cache && cache.rows === rows && cache.map === map && cache.auto === auto && cache.itemHeight === ih) {
      return cache.prefix;
    }
    const prefix = [0];
    let sum = 0;
    for (let i = 0; i < rows.length; i += 1) {
      sum += heightOf(rowKey(rows[i], i));
      prefix.push(sum);
    }
    offsetsCacheRef.current = { rows, map, auto, itemHeight: ih, prefix };
    return prefix;
  }

  function getTotalHeight() {
    return getOffsets()[childrenRef.current.length] ?? 0;
  }

  function findStart(top: number) {
    const prefix = getOffsets();
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

  function getRange() {
    const count = childrenRef.current.length;
    const p = propsRef.current;
    const scrollTop = scrollTopRef.current;
    const viewportHeight = viewportHeightRef.current;
    if (count === 0) {
      return { start: 0, end: 0 };
    }
    if (!isAuto()) {
      const start = Math.max(0, Math.floor(scrollTop / p.itemHeight) - p.overscan);
      const visibleCount = Math.ceil(viewportHeight / p.itemHeight) + p.overscan * 2;
      return { start, end: Math.min(count, start + visibleCount) };
    }
    const start = Math.max(0, findStart(scrollTop) - p.overscan);
    let end = start;
    const limit = scrollTop + viewportHeight;
    const prefix = getOffsets();
    while (end < count && prefix[end] < limit) {
      end += 1;
    }
    return { start, end: Math.min(count, end + p.overscan) };
  }

  function measureViewport() {
    const node = rootRef.current;
    const measured = node?.clientHeight ?? 0;
    const displayed = isScrollerDisplayed();
    const next = nextViewportHeight({
      current: viewportHeightRef.current,
      measured,
      displayed,
    });
    const changed = next !== viewportHeightRef.current;
    const revealed = displayed && !local.wasDisplayed;
    local.wasDisplayed = displayed;
    setViewportHeight(next);
    if (!displayed || measured <= 0) {
      return;
    }
    if (local.pendingBottomPin || (revealed && propsRef.current.stickToBottom && local.following)) {
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
    const node = rootRef.current;
    if (!node) {
      return false;
    }
    return node.clientHeight > 0 && node.getClientRects().length > 0;
  }

  function distanceFromBottom() {
    const node = rootRef.current;
    if (!node) {
      return 0;
    }
    return node.scrollHeight - node.scrollTop - node.clientHeight;
  }

  function isAtBottom() {
    return distanceFromBottom() < propsRef.current.atBottomThreshold;
  }

  function syncEndHidden() {
    if (!jumpToEndRef.current) {
      setEndHidden(false);
      return;
    }
    const rows = childrenRef.current;
    const last = rows[rows.length - 1];
    if (!last) {
      setEndHidden(false);
      return;
    }
    const distance = distanceFromBottom();
    if (distance < propsRef.current.atBottomThreshold) {
      setEndHidden(false);
      return;
    }
    setEndHidden(distance >= heightOf(rowKey(last, rows.length - 1)));
  }

  function isNearBottom() {
    return isAtBottom();
  }

  /** Mirrors Vue setFollow: track the follow state and notify on change. */
  function setFollow(nextFollow: boolean) {
    if (nextFollow === local.following) {
      return;
    }
    local.following = nextFollow;
    onStickToBottomChangeRef.current?.(nextFollow);
  }

  /**
   * Break follow from raw user input (wheel / touch) instead of derived scroll
   * events. Scroll events only count as gestures outside pin cycles, so a user
   * scrolling up while messages keep arriving could have every break attempt
   * swallowed by the pin window and get yanked back to the bottom forever.
   */
  function breakFollowFromUser() {
    if (!local.following) {
      return;
    }
    if (local.pinning || local.layoutPinPending || local.pendingBottomPin) {
      local.userInterruptedPin = true;
      return;
    }
    setFollow(false);
  }

  function onUserWheel(event: WheelEvent) {
    // Only scrolling up breaks follow; scrolling down lets the at-bottom
    // re-follow logic resume tracking naturally.
    if (event.deltaY >= 0) {
      return;
    }
    breakFollowFromUser();
  }

  function onUserTouch(event: TouchEvent) {
    const y = event.touches[0]?.pageY ?? 0;
    if (local.lastTouchY !== 0 && y > local.lastTouchY + 1) {
      breakFollowFromUser();
    }
    local.lastTouchY = y;
  }

  function onUserTouchEnd() {
    local.lastTouchY = 0;
  }

  function rowHeight(key: PropertyKey) {
    return heightOf(String(key));
  }

  function beginPin() {
    local.pinning = true;
    window.clearTimeout(local.pinRelease);
    local.pinRelease = window.setTimeout(() => {
      local.pinning = false;
      if (local.userInterruptedPin) {
        local.userInterruptedPin = false;
        setFollow(false);
      }
    }, 32);
  }

  function contentHeight() {
    const node = rootRef.current;
    if (!isVirtualized() && node) {
      return node.scrollHeight;
    }
    return getTotalHeight();
  }

  function maxScrollTop() {
    const node = rootRef.current;
    const viewport = node?.clientHeight ?? viewportHeightRef.current;
    return Math.max(0, contentHeight() - viewport);
  }

  function scheduleLayoutPin() {
    local.layoutPinPending = true;
    if (local.layoutPinScheduled) {
      return;
    }
    local.layoutPinScheduled = true;
    nextTick(() => {
      pinToBottom();
      requestAnimationFrame(() => {
        local.layoutPinPending = false;
        local.layoutPinScheduled = false;
        if (local.userInterruptedPin) {
          local.userInterruptedPin = false;
          setFollow(false);
        }
        onScrollRef.current?.(rootRef.current?.scrollTop ?? 0);
      });
    });
  }

  function setHeight(key: string, next: number) {
    if (!isAuto()) {
      return;
    }
    if (!canCommitRowHeight({
      viewportHeight: viewportHeightRef.current,
      displayed: isScrollerDisplayed(),
      measuredHeight: next,
    })) {
      return;
    }
    const rounded = Math.max(1, Math.round(next));
    const previous = heightMapRef.current.get(key) ?? propsRef.current.itemHeight;
    if (previous === rounded) {
      return;
    }
    const rows = childrenRef.current;
    const index = rows.findIndex((vnode, i) => rowKey(vnode, i) === key);
    const rowTop = index >= 0 ? (getOffsets()[index] ?? 0) : 0;
    const delta = rounded - previous;
    const hadMeasuredHeight = heightMapRef.current.has(key);
    const trackingFollow = propsRef.current.stickToBottom && local.following;
    const shouldShift = !trackingFollow
      && hadMeasuredHeight
      && index >= 0
      && rowTop < scrollTopRef.current
      && delta !== 0;

    const map = new Map(heightMapRef.current);
    map.set(key, rounded);
    setHeightMap(map);

    if (trackingFollow) {
      scheduleLayoutPin();
    }
    if (shouldShift) {
      const node = rootRef.current;
      if (node) {
        node.scrollTop += delta;
        setScrollTop(node.scrollTop);
      }
    }
  }

  function bindRow(el: HTMLElement | null, key: string) {
    if (!el) {
      // React calls callback refs with null on every re-render. Unbinding here
      // remeasures every row on each parent update and fights user scroll.
      return;
    }
    const node = el;
    const rowEls = rowElsRef.current;
    const prev = rowEls.get(key);
    if (prev === node) {
      return;
    }
    if (prev) {
      local.rowObserver?.unobserve(prev);
    }
    rowEls.set(key, node);
    if (!isAuto()) {
      return;
    }
    local.rowObserver?.observe(node);
    setHeight(key, measureRowHeight(node));
  }

  function handleScroll() {
    const node = rootRef.current;
    const next = node?.scrollTop ?? 0;
    const prev = scrollTopRef.current;
    const measuredViewport = node?.clientHeight ?? 0;
    const viewportGrew = measuredViewport > viewportHeightRef.current + 0.5;
    if (viewportGrew) {
      setViewportHeight(measuredViewport);
    }
    const displayed = isScrollerDisplayed();
    const sticky = propsRef.current.stickToBottom;
    const gesture = !local.pinning && !local.layoutPinPending && displayed && !viewportGrew;
    if (gesture) {
      setFollow(nextStickToBottom({
        stickToBottom: local.following,
        nearBottom: isAtBottom(),
        offset: next,
        previousOffset: prev,
      }));
    } else if (!local.pinning && displayed && isAtBottom()) {
      setFollow(true);
    }
    syncEndHidden();
    if (Math.abs(next - prev) < 1) {
      return;
    }
    setScrollTop(next);
    if (!displayed || viewportGrew) {
      if (viewportGrew && sticky && local.following) {
        nextTick(pinToBottomIfNeeded);
      }
      return;
    }
    if (local.layoutPinPending) {
      return;
    }
    onScrollRef.current?.(next);
  }

  function scrollToOffset(offset: number) {
    const node = rootRef.current;
    if (!node) {
      return;
    }
    const max = maxScrollTop();
    node.scrollTop = Math.min(Math.max(0, offset), max);
    setScrollTop(node.scrollTop);
  }

  function scrollTo(index: number, align: Align = 'start') {
    const prefix = getOffsets();
    const start = prefix[index] ?? 0;
    const h = heightOf(rowKey(childrenRef.current[index], index));
    let next = start;
    if (align === 'center') {
      next -= (viewportHeightRef.current - h) / 2;
    }
    if (align === 'end') {
      next -= viewportHeightRef.current - h;
    }
    scrollToOffset(next);
  }

  function scrollToKey(key: PropertyKey, align: Align = 'start') {
    const index = childrenRef.current.findIndex((vnode, i) => rowKey(vnode, i) === String(key));
    if (index < 0) {
      return;
    }
    scrollTo(index, align);
  }

  function pinToBottom() {
    const node = rootRef.current;
    local.following = true;
    const viewport = node?.clientHeight ?? 0;
    if (!node || shouldDeferBottomPin(isScrollerDisplayed(), viewport)) {
      local.pendingBottomPin = true;
      return;
    }
    local.pendingBottomPin = false;
    beginPin();
    if (!isVirtualized()) {
      node.scrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
      setScrollTop(node.scrollTop);
      return;
    }
    nextTick(() => {
      scrollToOffset(Number.MAX_SAFE_INTEGER);
    });
  }

  function pinToBottomIfNeeded() {
    if (!propsRef.current.stickToBottom || !local.following) {
      return;
    }
    pinToBottom();
  }

  /** Mirrors Vue jumpToEnd: clear the flag, resume following, then pin. */
  function jumpToLast() {
    setEndHidden(false);
    setFollow(true);
    pinToBottom();
  }

  const children = flattenVNodes(slotChildren);
  childrenRef.current = children;
  const auto = itemSize === 'auto';
  const offsets = getOffsets();
  const totalHeight = offsets[children.length] ?? 0;
  const capByRows = maxRows != null ? maxRows * itemHeight : null;
  const constrained = height != null || maxRows != null;
  const virtualized = windowedRows(constrained);
  const range = getRange();
  const visible = children.slice(range.start, range.end).map((vnode, offset) => {
    const index = range.start + offset;
    return {
      vnode,
      index,
      key: rowKey(vnode, index),
    };
  });
  const offsetY = auto ? (offsets[range.start] ?? 0) : range.start * itemHeight;
  const fixedRowStyle: CSSProperties | undefined = auto ? undefined : { height: `${itemHeight}px` };
  const virtualRowStyle: CSSProperties | undefined = auto ? undefined : { height: `${itemHeight}px` };
  const frameStyle = {
    width: toCssSize(width),
    height: toCssSize(height),
    ...(auto ? {} : { '--rk-list-row-height': `${itemHeight}px` }),
  } as CSSProperties;
  const scrollerStyle: CSSProperties | undefined = capByRows != null && height == null
    ? { height: `${capByRows}px` }
    : undefined;
  const keys = children.map((vnode, index) => rowKey(vnode, index));
  const keysSignature = JSON.stringify(keys);

  const keyWarnFirstRun = useRef(true);
  useEffect(() => {
    if (keyWarnFirstRun.current) {
      keyWarnFirstRun.current = false;
      return;
    }
    if (!virtualized || local.warnedMissingKey) {
      return;
    }
    if (children.some(vnode => vnode.key == null)) {
      local.warnedMissingKey = true;
      console.warn('[RoomKit] List virtualization needs a key on each ListItem. Keep Input / local state in the parent and v-model by id.');
    }
  });

  useLayoutEffect(() => {
    local.following = stickToBottom;
  }, [stickToBottom]);

  useLayoutEffect(() => {
    measureViewport();
    const observer = new ResizeObserver(measureViewport);
    local.observer = observer;
    const scrollerNode = rootRef.current;
    if (scrollerNode) {
      observer.observe(scrollerNode);
      scrollerNode.addEventListener('wheel', onUserWheel, { passive: true });
      scrollerNode.addEventListener('touchmove', onUserTouch, { passive: true });
      scrollerNode.addEventListener('touchend', onUserTouchEnd, { passive: true });
    }
    const rowObserver = new ResizeObserver((entries) => {
      if (!isAuto()) {
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
    local.rowObserver = rowObserver;
    if (isAuto()) {
      rowElsRef.current.forEach((node) => {
        rowObserver.observe(node);
      });
    }
    return () => {
      window.clearTimeout(local.pinRelease);
      observer.disconnect();
      rowObserver.disconnect();
      local.observer = null;
      local.rowObserver = null;
      scrollerNode?.removeEventListener('wheel', onUserWheel);
      scrollerNode?.removeEventListener('touchmove', onUserTouch);
      scrollerNode?.removeEventListener('touchend', onUserTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lengthFirstRun = useRef(true);
  useLayoutEffect(() => {
    if (lengthFirstRun.current) {
      lengthFirstRun.current = false;
      return;
    }
    nextTick(() => {
      pinToBottomIfNeeded();
      syncEndHidden();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children.length]);

  const sizeFirstRun = useRef(true);
  useLayoutEffect(() => {
    if (sizeFirstRun.current) {
      sizeFirstRun.current = false;
      return;
    }
    measureViewport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemHeight, maxRows, height]);

  const virtualizedFirstRun = useRef(true);
  useLayoutEffect(() => {
    if (virtualizedFirstRun.current) {
      virtualizedFirstRun.current = false;
      return;
    }
    nextTick(pinToBottomIfNeeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualized]);

  const keysFirstRun = useRef(true);
  useLayoutEffect(() => {
    if (keysFirstRun.current) {
      keysFirstRun.current = false;
      return;
    }
    const alive = new Set(keys);
    const map = new Map(heightMapRef.current);
    let changed = false;
    map.forEach((_, key) => {
      if (!alive.has(key)) {
        map.delete(key);
        changed = true;
      }
    });
    const rowEls = rowElsRef.current;
    rowEls.forEach((node, key) => {
      if (!alive.has(key)) {
        local.rowObserver?.unobserve(node);
        rowEls.delete(key);
      }
    });
    if (!changed) {
      return;
    }
    setHeightMap(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSignature]);

  useLayoutEffect(() => {
    if (tickQueueRef.current.length === 0) {
      return;
    }
    const queue = tickQueueRef.current.splice(0);
    queue.forEach(cb => cb());
  });

  useImperativeHandle(ref, () => ({
    scrollTo,
    scrollToOffset,
    scrollToKey,
    scrollToBottom: pinToBottom,
    isNearBottom,
    distanceFromBottom,
    rowHeight,
  }));

  return (
    <div
      className={[
        'rk-list',
        variant === 'plain' ? 'rk-list-plain' : '',
        auto ? 'rk-list-auto' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{ ...frameStyle, ...style }}
    >
      <div
        ref={rootRef}
        className={[
          'rk-list-scroller',
          constrained ? 'rk-list-constrained' : '',
          height != null ? 'rk-list-fill' : '',
          !scrollbar ? 'rk-list-no-scrollbar' : '',
        ].filter(Boolean).join(' ')}
        style={scrollerStyle}
        role="list"
        onScroll={handleScroll}
      >
        {(() => {
          if (children.length === 0) {
            return (
              <div className="rk-list-empty">
                {emptySlot != null ? emptySlot : emptyText}
              </div>
            );
          }
          if (!virtualized) {
            return children.map((vnode, index) => {
              const key = rowKey(vnode, index);
              return (
                <div
                  key={key}
                  ref={el => bindRow(el, key)}
                  className="rk-list-row"
                  role="listitem"
                  data-key={key}
                  style={fixedRowStyle}
                >
                  {vnode}
                </div>
              );
            });
          }
          return (
            <div
              className="rk-list-spacer"
              style={{ height: `${totalHeight}px` }}
            >
              <div className="rk-list-window" style={{ transform: `translateY(${offsetY}px)` }}>
                {visible.map(row => (
                  <div
                    key={row.key}
                    ref={el => bindRow(el, row.key)}
                    className="rk-list-row"
                    role="listitem"
                    data-key={row.key}
                    style={virtualRowStyle}
                  >
                    {row.vnode}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
      {endHidden
        ? (
          <button
            type="button"
            className="rk-list-jump"
            aria-label={jumpLabel}
            onClick={jumpToLast}
          >
            <IconChevron size={14} />
          </button>
        )
        : null}
    </div>
  );
});

TUIList.displayName = 'TUIList';

export default TUIList;
