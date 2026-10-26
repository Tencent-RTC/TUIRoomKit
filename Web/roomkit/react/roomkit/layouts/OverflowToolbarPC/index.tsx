import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import OverflowMenu from './OverflowMenu';
import { hasOverflowSubmenu, OVERFLOW_SUBMENU_READY, readOverflowSubmenu } from './overflowSubmenu';
import type { OverflowSubmenu } from './overflowSubmenu';
import { measureAvailableWidth, resolveVisibleCount } from './useToolbarOverflow';
import type { OverflowMenuEntry } from './useToolbarOverflow';
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
  const [overflowActions, setOverflowActions] = useState<OverflowMenuEntry[]>([]);
  const [submenuHost, setSubmenuHost] = useState<HTMLElement | null>(null);
  const submenu: OverflowSubmenu | null = submenuHost ? readOverflowSubmenu(submenuHost) : null;

  // Layout runs from observers bound once; it reads the latest sizing props here.
  const sizingRef = useRef({ gap, moreWidth });
  sizingRef.current = { gap, moreWidth };

  const stateRef = useRef({
    itemElements: [] as HTMLElement[],
    cachedWidths: [] as number[],
    layoutFrame: 0,
    lastVisibleCount: -1,
  });

  function readLabel(element: HTMLElement): string {
    return element.getAttribute('aria-label')
      || element.querySelector<HTMLElement>('[aria-label]')?.getAttribute('aria-label')
      || element.querySelector('.toolbar-button-label')?.textContent?.trim()
      || element.querySelector('.participant-button-tip')?.textContent?.trim()
      || '';
  }

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
    state.itemElements = items;
    if (items.length === 0) {
      setOverflowActions([]);
      state.cachedWidths = [];
      state.lastVisibleCount = -1;
      setSubmenuHost(null);
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

    if (visibleCount === state.lastVisibleCount && !submenuFlagsStale(items)) {
      return;
    }
    state.lastVisibleCount = visibleCount;

    const overflow: OverflowMenuEntry[] = [];
    items.forEach((element, index) => {
      const hidden = index >= visibleCount;
      const { style: itemStyle } = element;
      itemStyle.display = hidden ? 'none' : '';
      if (!hidden) {
        return;
      }
      overflow.push({
        id: String(index),
        label: readLabel(element) || `Item ${index + 1}`,
        icon: '',
        hasSubmenu: hasOverflowSubmenu(element),
      });
    });
    setOverflowActions(overflow);
    if (submenuHost && !overflow.some(entry => items[Number(entry.id)] === submenuHost)) {
      setSubmenuHost(null);
    }
  }

  function submenuFlagsStale(items: HTMLElement[]): boolean {
    return overflowActions.some((entry) => {
      const element = items[Number(entry.id)];
      return !!element && Boolean(entry.hasSubmenu) !== hasOverflowSubmenu(element);
    });
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

  function activate(id: string) {
    const index = Number(id);
    const element = stateRef.current.itemElements[index];
    if (!element || hasOverflowSubmenu(element)) {
      return;
    }
    element.querySelector<HTMLElement>('button, [role="button"]')?.click();
  }

  function drill(id: string) {
    const element = stateRef.current.itemElements[Number(id)];
    if (!element || !hasOverflowSubmenu(element)) {
      return;
    }
    setSubmenuHost(element);
  }

  function leaveSubmenu() {
    setSubmenuHost(null);
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
    const items = itemsRef.current;
    if (items) {
      itemsObserver = new MutationObserver(() => {
        state.cachedWidths = [];
        state.lastVisibleCount = -1;
        scheduleLayoutRef.current();
      });
      itemsObserver.observe(items, { childList: true });
      items.addEventListener(OVERFLOW_SUBMENU_READY, onSubmenuReady);
    }

    function onSubmenuReady() {
      state.lastVisibleCount = -1;
      scheduleLayoutRef.current();
    }

    scheduleLayoutRef.current();

    return () => {
      barObserver.disconnect();
      itemsObserver?.disconnect();
      items?.removeEventListener(OVERFLOW_SUBMENU_READY, onSubmenuReady);
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
          {children}
        </div>

        <OverflowMenu
          actions={overflowActions}
          submenu={submenu}
          fullscreen={fullscreen}
          minimizable={minimizable}
          onAction={activate}
          onDrill={drill}
          onLeave={leaveSubmenu}
          onClose={leaveSubmenu}
          onMinimize={() => onMinimize?.()}
          onFullscreen={() => onFullscreen?.()}
        />
      </div>
    </div>
  );
}

export default OverflowToolbarPC;
