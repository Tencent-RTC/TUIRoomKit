import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFloating } from '../../headless/useFloating';
import { useOverlay } from '../../headless/useOverlay';
import type { ElementRef } from '../../headless/types';
import type { Placement } from '../../tokens';
import './index.scss';

export interface TUIPopoverProps {
  open?: boolean;
  trigger?: 'click' | 'hover';
  placement?: Placement;
  offset?: number;
  showArrow?: boolean;
  disabled?: boolean;
  /** Element used to position the floating panel. */
  reference?: HTMLElement | null;
  /** Set to false to let the content own its padding and width */
  padded?: boolean;
  children?: ReactNode;
  contentSlot?: ReactNode;
  onUpdateOpen?: (open: boolean) => void;
}

export function TUIPopover(props: TUIPopoverProps) {
  const {
    open,
    trigger = 'click',
    placement: placementProp = 'bottom-start',
    offset = 8,
    showArrow = false,
    disabled,
    reference,
    padded = true,
    children,
    contentSlot,
    onUpdateOpen,
  } = props;

  const referenceRef = useRef<HTMLSpanElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLSpanElement | null>(null);
  const [innerOpen, setInnerOpen] = useState(false);
  const leaveTimerRef = useRef(0);

  const referencePropRef = useRef(reference);
  referencePropRef.current = reference;
  const floatingReference = useMemo<ElementRef>(() => ({
    get current() {
      return referencePropRef.current ?? referenceRef.current;
    },
  }), []);

  const isControlled = 'open' in props;
  const isOpen = isControlled ? !!open : innerOpen;

  function setOpen(next: boolean) {
    if (disabled) {
      return;
    }
    if (!isControlled) {
      setInnerOpen(next);
    }
    onUpdateOpen?.(next);
  }

  const { host, zIndex } = useOverlay({
    lane: 'popover',
    open: isOpen,
    closeOnOutside: true,
    closeOnEsc: true,
    onClose: () => setOpen(false),
    reference: floatingReference,
  }, [referenceRef, floatingRef]);

  const hostRef = useRef(host);
  hostRef.current = host;

  const { x, y, placement, maxHeight, arrowX, arrowY, update } = useFloating({
    reference: floatingReference,
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

  const openWatchedRef = useRef(false);
  useLayoutEffect(() => {
    if (!openWatchedRef.current) {
      openWatchedRef.current = true;
      return;
    }
    if (!isOpen) {
      return;
    }
    update();
    requestAnimationFrame(update);
  }, [isOpen, update]);

  function onClick() {
    if (trigger !== 'click') {
      return;
    }
    setOpen(!isOpen);
  }

  function onEnter() {
    if (trigger !== 'hover') {
      return;
    }
    window.clearTimeout(leaveTimerRef.current);
    setOpen(true);
  }

  function onLeave() {
    if (trigger !== 'hover') {
      return;
    }
    leaveTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  }

  // Native listeners on the anchor so events from portals rendered by the children
  // do not bubble into it through the React tree.
  const handlersRef = useRef({ onClick, onEnter, onLeave });
  handlersRef.current = { onClick, onEnter, onLeave };
  useEffect(() => {
    const el = referenceRef.current;
    if (!el) return undefined;
    const handleClick = () => handlersRef.current.onClick();
    const handleEnter = () => handlersRef.current.onEnter();
    const handleLeave = () => handlersRef.current.onLeave();
    el.addEventListener('click', handleClick);
    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('click', handleClick);
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <>
      <span
        ref={referenceRef}
        className="rk-popover-anchor"
      >
        {children}
      </span>
      {host && isOpen
        ? createPortal(
          <div
            ref={floatingRef}
            className={['rk-float rk-popover', !padded ? 'rk-popover-flush' : '', showArrow ? 'has-arrow' : ''].filter(Boolean).join(' ')}
            data-placement={placement}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              zIndex,
              maxHeight: maxHeight ? `${maxHeight}px` : undefined,
              ['--rk-float-max' as string]: maxHeight ? `${maxHeight}px` : undefined,
            }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {showArrow && (
              <span
                ref={arrowRef}
                className="rk-popover-arrow"
                style={arrowStyle}
              >
                {/* Outer triangle is the border. The fill sits 1px inside it and
                  runs one pixel into the panel, covering the border under the arrow. */}
                <svg viewBox="0 0 16 8" aria-hidden="true">
                  <path className="rk-popover-arrow-stroke" d="M0 7 L8 0 L16 7 Z" />
                  <path className="rk-popover-arrow-fill" d="M0.66 7 L8 1.33 L15.34 7 L15.34 8 L0.66 8 Z" />
                </svg>
              </span>
            )}
            {/* The rounded fill cannot be the arrow's parent: phone browsers clip a
              transformed child to that curve. */}
            {showArrow
              ? (
                <div className="rk-popover-body">
                  {contentSlot}
                </div>
              )
              : contentSlot}
          </div>,
          host,
        )
        : null}
    </>
  );
}

export default TUIPopover;
