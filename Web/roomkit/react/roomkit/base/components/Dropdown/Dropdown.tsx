import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFloating } from '../../headless/useFloating';
import { useOverlay } from '../../headless/useOverlay';
import { useRovingFocus } from '../../headless/useRovingFocus';
import { DROPDOWN_CONTEXT_KEY } from '../../tokens';
import type { DropdownContext, DropdownItemRecord, Placement } from '../../tokens';
import './Dropdown.scss';

/** Builds a zero-size virtual element anchored at the given point. */
function pointReference(x: number, y: number): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      left: x,
      top: y,
      width: 0,
      height: 0,
      right: x,
      bottom: y,
      x,
      y,
      toJSON: () => ({}),
    }),
    closest: () => null,
    ownerDocument: document,
  } as unknown as HTMLElement;
}

/** Items write the highlight on hover; `DropdownContext.highlighted` alone is read-only. */
export interface TUIDropdownProps {
  open?: boolean;
  trigger?: 'click' | 'hover';
  placement?: Placement;
  offset?: number;
  disabled?: boolean;
  closeOnSelect?: boolean;
  showArrow?: boolean;
  /** Right-click opens the menu at the pointer. A later click anchors it to the trigger. */
  contextmenu?: boolean;
  virtualReference?: { x: number; y: number } | null;
  onCommand?: (command: string | number) => void;
  onUpdateOpen?: (open: boolean) => void;
  children?: ReactNode;
  menuSlot?: ReactNode;
}

export function TUIDropdown(props: TUIDropdownProps) {
  const {
    open,
    trigger = 'click',
    placement: placementProp = 'bottom-start',
    offset = 6,
    disabled = false,
    closeOnSelect = true,
    showArrow = false,
    contextmenu = false,
    virtualReference,
    onCommand,
    onUpdateOpen,
    children,
    menuSlot,
  } = props;

  const referenceRef = useRef<HTMLSpanElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLSpanElement | null>(null);
  const [innerOpen, setInnerOpen] = useState(false);
  const [items, setItems] = useState<DropdownItemRecord[]>([]);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const leaveTimerRef = useRef(0);

  const vx = virtualReference?.x;
  const vy = virtualReference?.y;
  const virtualEl = useMemo<HTMLElement | null>(() => {
    if (pointer) return pointReference(pointer.x, pointer.y);
    if (vx == null || vy == null) return null;
    return pointReference(vx, vy);
  }, [pointer, vx, vy]);
  const virtualElRef = useRef(virtualEl);
  virtualElRef.current = virtualEl;
  const virtualRef = useMemo(() => ({
    get current(): HTMLElement | null {
      return virtualElRef.current ?? referenceRef.current;
    },
  }), []);

  const isControlled = 'open' in props;
  const isOpen = isControlled ? !!open : innerOpen;
  const { highlighted, setHighlighted, onKeydown } = useRovingFocus(items);

  // Handlers bound into the context read the latest props through this ref.
  const latestRef = useRef({ disabled, isControlled, closeOnSelect, onCommand, onUpdateOpen });
  latestRef.current = { disabled, isControlled, closeOnSelect, onCommand, onUpdateOpen };

  const setOpen = useCallback((next: boolean) => {
    const latest = latestRef.current;
    if (latest.disabled) return;
    if (!latest.isControlled) setInnerOpen(next);
    latest.onUpdateOpen?.(next);
  }, []);

  const { host, zIndex } = useOverlay({
    lane: 'dropdown',
    open: isOpen,
    closeOnOutside: true,
    closeOnEsc: true,
    onClose: () => setOpen(false),
  }, [referenceRef, floatingRef]);

  const hostRef = useRef<HTMLElement | null>(host);
  hostRef.current = host;

  const { x, y, placement, maxHeight, arrowX, arrowY, update } = useFloating({
    reference: virtualRef,
    floating: floatingRef,
    placement: placementProp,
    offset,
    arrow: arrowRef,
    boundary: hostRef,
    enabled: isOpen,
    constrainHeight: true,
  });

  const arrowStyle: CSSProperties = {
    left: placement.startsWith('left') || placement.startsWith('right') ? undefined : `${arrowX}px`,
    top: placement.startsWith('top') || placement.startsWith('bottom') ? undefined : `${arrowY}px`,
  };

  const ctxValue = useMemo<DropdownContext>(() => ({
    onCommand: (command) => {
      latestRef.current.onCommand?.(command);
      if (latestRef.current.closeOnSelect) setOpen(false);
    },
    close: () => setOpen(false),
    register: (item) => {
      setItems(prev => [...prev, item]);
    },
    unregister: (value) => {
      setItems(prev => prev.filter(item => item.value !== value));
    },
    highlighted,
    setHighlighted,
  }), [highlighted, setHighlighted, setOpen]);

  const isFirstRunRef = useRef(true);
  useLayoutEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (!isOpen) {
      setPointer(null);
      setHighlighted(null);
      return;
    }
    update();
    setHighlighted(null);
  }, [isOpen]);

  function onClick() {
    if (trigger !== 'click') return;
    setPointer(null);
    setOpen(!isOpen);
  }

  function onContextMenu(event: ReactMouseEvent) {
    if (!contextmenu) return;
    event.preventDefault();
    if (disabled) return;
    setPointer({ x: event.clientX, y: event.clientY });
    setOpen(true);
  }

  function onEnter() {
    if (trigger !== 'hover') return;
    window.clearTimeout(leaveTimerRef.current);
    setOpen(true);
  }

  function onLeave() {
    if (trigger !== 'hover') return;
    leaveTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  }

  return (
    <DROPDOWN_CONTEXT_KEY.Provider value={ctxValue}>
      <span
        ref={referenceRef}
        className="rk-dropdown-anchor"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {children}
      </span>
      {host && isOpen && createPortal(
        <div
          ref={floatingRef}
          className={['rk-float', 'rk-dropdown', showArrow ? 'has-arrow' : ''].filter(Boolean).join(' ')}
          role="menu"
          data-placement={placement}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            zIndex,
            maxHeight: maxHeight ? `${maxHeight}px` : undefined,
            ['--rk-float-max' as string]: maxHeight ? `${maxHeight}px` : undefined,
          }}
          onKeyDown={onKeydown}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        >
          {showArrow && (
            <span
              ref={arrowRef}
              className="rk-dropdown-arrow"
              style={arrowStyle}
            >
              {/* Outer triangle is the border. The fill sits 1px inside it and
                  runs one pixel into the panel, covering the border under the arrow. */}
              <svg viewBox="0 0 16 8" aria-hidden="true">
                <path className="rk-dropdown-arrow-stroke" d="M0 7 L8 0 L16 7 Z" />
                <path className="rk-dropdown-arrow-fill" d="M0.66 7 L8 1.33 L15.34 7 L15.34 8 L0.66 8 Z" />
              </svg>
            </span>
          )}
          <div className="rk-dropdown-body">
            {menuSlot}
          </div>
        </div>,
        host,
      )}
    </DROPDOWN_CONTEXT_KEY.Provider>
  );
}

export default TUIDropdown;
