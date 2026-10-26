import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentType, CSSProperties, ReactNode } from 'react';
import { IconClose } from '../../base';
import type { IconProps } from '../../base';
import { useI18n } from '../../i18n';
import './RoomSidePanelPC.scss';

export interface SidePanelTab {
  id: string;
  label: string;
  icon?: ComponentType<IconProps>;
}

export interface RoomSidePanelPCSlotScope {
  activeId: string | null;
  opened: string[];
}

/** `tabs` is the catalog; the scene holds which of them are open. */
export interface RoomSidePanelPCProps {
  tabs: SidePanelTab[];
  opened: string[];
  activeId: string | null;
  onUpdateOpened?: (ids: string[]) => void;
  onUpdateActiveId?: (id: string | null) => void;
  children?: ReactNode | ((scope: RoomSidePanelPCSlotScope) => ReactNode);
  className?: string;
  style?: CSSProperties;
}

export interface RoomSidePanelPCExpose {
  open: (id: string) => void;
  select: (id: string) => void;
  close: (id: string) => void;
  toggle: (id: string) => void;
  closeAll: () => void;
}

export const RoomSidePanelPC = forwardRef<RoomSidePanelPCExpose, RoomSidePanelPCProps>((props, ref) => {
  const {
    tabs,
    opened,
    activeId,
    onUpdateOpened,
    onUpdateActiveId,
    children,
    className,
    style,
  } = props;

  const { t } = useI18n();

  function isKnown(id: string) {
    return tabs.some(tab => tab.id === id);
  }

  function open(id: string) {
    if (!isKnown(id)) {
      return;
    }
    if (!opened.includes(id)) {
      onUpdateOpened?.([...opened, id]);
    }
    onUpdateActiveId?.(id);
  }

  function select(id: string) {
    if (!opened.includes(id)) {
      return;
    }
    onUpdateActiveId?.(id);
  }

  function close(id: string) {
    const index = opened.indexOf(id);
    if (index < 0) {
      return;
    }

    const next = opened.filter(item => item !== id);
    onUpdateOpened?.(next);
    if (activeId !== id) {
      return;
    }
    // Fall back to the tab that slid into this slot, else the one before it.
    onUpdateActiveId?.(next[index] ?? next[index - 1] ?? null);
  }

  function toggle(id: string) {
    if (activeId === id) {
      close(id);
      return;
    }
    open(id);
  }

  function closeAll() {
    onUpdateOpened?.([]);
    onUpdateActiveId?.(null);
  }

  const openedTabs = opened.flatMap(id => tabs.filter(tab => tab.id === id));

  const activeLabel = tabs.find(tab => tab.id === activeId)?.label ?? '';

  useImperativeHandle(ref, () => ({ open, select, close, toggle, closeAll }));

  // ---------------------------------------------------------------------------
  // Sliding tab indicator — mirrors .single-tab-indicator from the design reference.
  // Position is recalculated whenever the active tab or the tab list changes.
  // ---------------------------------------------------------------------------
  const tabsRef = useRef<HTMLElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: '0px', width: '0px' });

  function updateIndicator(): void {
    const nav = tabsRef.current;
    if (!nav || !activeId) {
      setIndicatorStyle({ left: '0px', width: '0px' });
      return;
    }
    const activeItem = nav.querySelector<HTMLElement>('.room-side-panel-tab-active');
    if (!activeItem) {
      setIndicatorStyle({ left: '0px', width: '0px' });
      return;
    }
    // Measure the full tab-item (including the close button) so the indicator
    // spans the same width as the clickable tab row item.
    const navRect = nav.getBoundingClientRect();
    const tabRect = activeItem.getBoundingClientRect();
    setIndicatorStyle({
      left: `${tabRect.left - navRect.left + nav.scrollLeft}px`,
      width: `${tabRect.width}px`,
    });
  }

  const openedTabsKey = openedTabs.map(tab => `${tab.id}:${tab.label}`).join('|');
  useLayoutEffect(() => {
    updateIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, openedTabsKey]);

  const slotContent = typeof children === 'function'
    ? children({ activeId, opened })
    : children;

  return (
    <aside
      className={['room-side-panel', !openedTabs.length ? 'is-closed' : '', className ?? ''].filter(Boolean).join(' ')}
      style={style}
      aria-label={t('Room.SidePanel')}
      aria-hidden={!openedTabs.length ? 'true' : undefined}
    >
      <header className="room-side-panel-header">
        <nav ref={tabsRef} className="room-side-panel-tabs" aria-label={t('Room.SidePanelNav')}>
          {openedTabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <div
                key={tab.id}
                className={['room-side-panel-tab-item', tab.id === activeId ? 'room-side-panel-tab-active' : ''].filter(Boolean).join(' ')}
              >
                <button className="room-side-panel-tab" type="button" onClick={() => select(tab.id)}>
                  {TabIcon && <TabIcon size={14} />}
                  {tab.label}
                </button>
                <button
                  className="room-side-panel-tab-close"
                  type="button"
                  aria-label={t('Room.CloseTab', { name: tab.label })}
                  onClick={(e) => {
                    e.stopPropagation();
                    close(tab.id);
                  }}
                >
                  <IconClose size={8} />
                </button>
              </div>
            );
          })}
          {/* Sliding active-tab indicator; left/width driven by JS like .single-tab-indicator */}
          <span className="room-side-panel-tab-indicator" style={indicatorStyle} aria-hidden="true" />
        </nav>

        <button
          className="room-side-panel-close"
          type="button"
          tabIndex={openedTabs.length ? undefined : -1}
          aria-label={t('Room.CloseSidePanel')}
          onClick={closeAll}
        >
          <IconClose size={12} />
        </button>
      </header>

      <div className="room-side-panel-body">
        {slotContent ?? (
          <div className="room-side-panel-placeholder">
            {activeLabel}
          </div>
        )}
      </div>
    </aside>
  );
});

RoomSidePanelPC.displayName = 'RoomSidePanelPC';

export default RoomSidePanelPC;
