import { useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import OverflowMenu from './OverflowMenu';
import { OVERFLOW_ITEM_KEY } from './overflowItem';
import type { OverflowItemRegistry, OverflowMenuEntry, RegisteredOverflowItem } from './overflowItem';
import { measureAvailableWidth, resolveOverflowEntries, resolveVisibleCount } from './toolbarOverflow';
import './index.scss';

export interface OverflowToolbarPCProps {
  fullscreen?: boolean;
  minimizable?: boolean;
  gap?: number;
  moreWidth?: number;
  onMinimize?: () => void;
  onFullscreen?: () => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function OverflowToolbarPC(props: OverflowToolbarPCProps) {
  const {
    fullscreen = false,
    minimizable = true,
    gap = 8,
    moreWidth = 40,
    onMinimize,
    onFullscreen,
    children,
    className,
    style,
  } = props;

  const barRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<HTMLDivElement | null>(null);
  /** Slot children hidden by the last layout, in toolbar order. */
  const [collapsed, setCollapsed] = useState<HTMLElement[]>([]);
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;
  const [, refresh] = useReducer((tick: number) => tick + 1, 0);

  // Toolbar controls describe themselves here; the menu never reads meaning off the DOM.
  const sourcesRef = useRef<Array<() => RegisteredOverflowItem | null>>([]);
  const registry = useMemo<OverflowItemRegistry>(() => ({
    register: (source) => {
      sourcesRef.current = [...sourcesRef.current, source];
      refresh();
      return () => {
        sourcesRef.current = sourcesRef.current.filter(item => item !== source);
        refresh();
      };
    },
    // Only a collapsed control shows in the menu, so a visible one changing needs no render.
    refresh: () => {
      if (collapsedRef.current.length > 0) {
        refresh();
      }
    },
  }), []);

  const childIds = useRef(new WeakMap<HTMLElement, string>());
  const childSeed = useRef(0);
  function idOf(element: HTMLElement): string {
    let id = childIds.current.get(element);
    if (!id) {
      childSeed.current += 1;
      id = `item-${childSeed.current}`;
      childIds.current.set(element, id);
    }
    return id;
  }

  const overflowEntries: OverflowMenuEntry[] = resolveOverflowEntries(
    collapsed,
    sourcesRef.current.map(source => source()).filter((item): item is RegisteredOverflowItem => !!item),
    idOf,
  );

  // Layout runs from observers bound once; it reads the latest sizing props here.
  const sizingRef = useRef({ gap, moreWidth });
  sizingRef.current = { gap, moreWidth };

  const stateRef = useRef({
    cachedWidths: [] as number[],
    layoutFrame: 0,
    lastVisibleCount: -1,
  });

  function itemChildren(): HTMLElement[] {
    if (!itemsRef.current) {
      return [];
    }
    return Array.from(itemsRef.current.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement,
    );
  }

  function parentContentWidth(parent: HTMLElement): number {
    const computed = getComputedStyle(parent);
    return Math.max(
      0,
      parent.clientWidth - parseFloat(computed.paddingLeft) - parseFloat(computed.paddingRight),
    );
  }

  function siblingWidths(parent: HTMLElement): number[] {
    const bar = barRef.current;
    return Array.from(parent.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement && child !== bar)
      .map(child => child.getBoundingClientRect().width)
      .filter(width => width > 0);
  }

  function itemWidths(items: HTMLElement[]): number[] {
    const state = stateRef.current;
    if (state.cachedWidths.length !== items.length) {
      items.forEach((element) => {
        const { style: itemStyle } = element;
        itemStyle.display = '';
        itemStyle.flexShrink = '0';
      });
      state.cachedWidths = items.map(element => element.getBoundingClientRect().width);
      return state.cachedWidths;
    }

    items.forEach((element, index) => {
      if (element.style.display === 'none') {
        return;
      }
      const { width } = element.getBoundingClientRect();
      if (width > 0) {
        state.cachedWidths[index] = width;
      }
    });
    return state.cachedWidths;
  }

  function layout() {
    const state = stateRef.current;
    const { gap: itemGap, moreWidth: moreButtonWidth } = sizingRef.current;
    const items = itemChildren();
    if (items.length === 0) {
      setCollapsed([]);
      state.cachedWidths = [];
      state.lastVisibleCount = -1;
      return;
    }

    const parent = barRef.current?.parentElement;
    const widths = itemWidths(items);
    const available = parent
      ? measureAvailableWidth(
        parentContentWidth(parent),
        siblingWidths(parent),
        parseFloat(getComputedStyle(parent).gap) || itemGap,
        moreButtonWidth,
        itemGap,
      )
      : Math.max(0, (barRef.current?.clientWidth ?? 0) - moreButtonWidth - itemGap);
    const visibleCount = resolveVisibleCount(widths, available, itemGap);

    if (visibleCount === state.lastVisibleCount) {
      return;
    }
    state.lastVisibleCount = visibleCount;

    items.forEach((element, index) => {
      const { style: itemStyle } = element;
      itemStyle.display = index >= visibleCount ? 'none' : '';
    });
    setCollapsed(items.slice(visibleCount));
  }

  function scheduleLayout() {
    const state = stateRef.current;
    if (state.layoutFrame) {
      return;
    }
    state.layoutFrame = requestAnimationFrame(() => {
      state.layoutFrame = 0;
      layout();
    });
  }

  const scheduleLayoutRef = useRef(scheduleLayout);
  scheduleLayoutRef.current = scheduleLayout;

  useLayoutEffect(() => {
    const state = stateRef.current;
    const barObserver = new ResizeObserver(() => {
      scheduleLayoutRef.current();
    });

    if (barRef.current?.parentElement) {
      barObserver.observe(barRef.current.parentElement);
    }

    let itemsObserver: MutationObserver | null = null;
    if (itemsRef.current) {
      itemsObserver = new MutationObserver(() => {
        state.cachedWidths = [];
        state.lastVisibleCount = -1;
        scheduleLayoutRef.current();
      });
      itemsObserver.observe(itemsRef.current, { childList: true });
    }

    scheduleLayoutRef.current();

    return () => {
      barObserver.disconnect();
      itemsObserver?.disconnect();
      if (state.layoutFrame) {
        cancelAnimationFrame(state.layoutFrame);
        state.layoutFrame = 0;
      }
    };
  }, []);

  return (
    <div ref={barRef} className={['overflow-toolbar', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <div className="overflow-toolbar-actions" style={{ gap: `${gap}px` }}>
        <div ref={itemsRef} className="overflow-toolbar-items" style={{ gap: `${gap}px` }}>
          <OVERFLOW_ITEM_KEY.Provider value={registry}>
            {children}
          </OVERFLOW_ITEM_KEY.Provider>
        </div>

        <OverflowMenu
          entries={overflowEntries}
          fullscreen={fullscreen}
          minimizable={minimizable}
          onMinimize={() => onMinimize?.()}
          onFullscreen={() => onFullscreen?.()}
        />
      </div>
    </div>
  );
}

export default OverflowToolbarPC;
