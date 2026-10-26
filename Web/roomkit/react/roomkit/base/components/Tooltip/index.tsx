import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFloating } from '../../headless/useFloating';
import { useOverlay } from '../../headless/useOverlay';
import type { Placement } from '../../tokens';
import './index.scss';

export interface TUITooltipProps {
  content?: string;
  placement?: Placement;
  disabled?: boolean;
  delay?: number;
  children?: ReactNode;
  contentSlot?: ReactNode;
}

export function TUITooltip(props: TUITooltipProps) {
  const {
    content,
    placement = 'top',
    disabled,
    delay = 200,
    children,
    contentSlot,
  } = props;

  const referenceRef = useRef<HTMLSpanElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(0);

  const { host, zIndex } = useOverlay({
    lane: 'tooltip',
    open: isOpen,
    closeOnOutside: false,
    closeOnEsc: true,
    onClose: () => {
      setIsOpen(false);
    },
  }, [referenceRef]);

  const [tooltipHost, setTooltipHost] = useState<HTMLElement | null>(null);
  const tooltipHostRef = useRef<HTMLElement | null>(tooltipHost);
  tooltipHostRef.current = tooltipHost;

  function resolveTooltipHost() {
    const reference = referenceRef.current;
    if (!reference || !host || host.ownerDocument === reference.ownerDocument) {
      return host;
    }
    return reference.ownerDocument.body;
  }

  const { x, y, update } = useFloating({
    reference: referenceRef,
    floating: floatingRef,
    placement,
    offset: 8,
    boundary: tooltipHostRef,
    enabled: isOpen,
  });

  const openWatchedRef = useRef(false);
  useLayoutEffect(() => {
    if (!openWatchedRef.current) {
      openWatchedRef.current = true;
      return;
    }
    if (!isOpen) return;
    update();
  }, [isOpen, update]);

  function show() {
    if (disabled) return;
    window.clearTimeout(timerRef.current);
    const nextHost = resolveTooltipHost();
    tooltipHostRef.current = nextHost;
    setTooltipHost(nextHost);
    timerRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, delay);
  }

  function onFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement | null;
    if (!target?.matches(':focus-visible')) {
      return;
    }
    show();
  }

  function hide() {
    window.clearTimeout(timerRef.current);
    setIsOpen(false);
  }

  // Native listeners on the anchor so events from portals rendered by the children
  // do not bubble into it through the React tree.
  const handlersRef = useRef({ show, onFocusIn, hide });
  handlersRef.current = { show, onFocusIn, hide };
  useEffect(() => {
    const el = referenceRef.current;
    if (!el) return;
    const handleEnter = () => handlersRef.current.show();
    const handleLeave = () => handlersRef.current.hide();
    const handleFocusIn = (event: FocusEvent) => handlersRef.current.onFocusIn(event);
    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);
    el.addEventListener('focusin', handleFocusIn);
    el.addEventListener('focusout', handleLeave);
    return () => {
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
      el.removeEventListener('focusin', handleFocusIn);
      el.removeEventListener('focusout', handleLeave);
    };
  }, []);

  return (
    <>
      <span
        ref={referenceRef}
        className="rk-tooltip-anchor"
      >
        {children}
      </span>
      {tooltipHost && isOpen
        ? createPortal(
          <div
            ref={floatingRef}
            className="rk-tooltip"
            role="tooltip"
            style={{ left: `${x}px`, top: `${y}px`, zIndex }}
          >
            {contentSlot != null ? contentSlot : content}
          </div>,
          tooltipHost,
        )
        : null}
    </>
  );
}

export default TUITooltip;
