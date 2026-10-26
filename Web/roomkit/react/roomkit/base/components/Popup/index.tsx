import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, TransitionEvent } from 'react';
import { createPortal } from 'react-dom';
import { useModality } from '../../headless/useModality';
import { useOverlay } from '../../headless/useOverlay';
import { IconClose } from '../../icons';
import './index.scss';

const DRAG_START_PX = 10;
const DISMISS_DISTANCE_PX = 120;
const DISMISS_DISTANCE_RATIO = 0.2;
const DISMISS_VELOCITY = 0.55;
const SHEET_MS = 320;

export interface TUIPopupProps {
  open: boolean;
  title?: string;
  /**
   * Sheet height. `auto` follows the content and caps at 78%.
   * Participant and chat sheets in the H5 design use `84%`.
   */
  height?: string | number;
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
  children?: ReactNode;
  onUpdateOpen?: (open: boolean) => void;
  onClose?: () => void;
}

interface DragVisual {
  transform: string;
  maskOpacity: string;
}

export function TUIPopup(props: TUIPopupProps) {
  const {
    open,
    title = '',
    height = '70%',
    closable = false,
    closeOnOverlay = true,
    closeOnEsc = true,
    headerSlot,
    footerSlot,
    children,
    onUpdateOpen,
    onClose,
  } = props;

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null);
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visualTick, setVisualTick] = useState(0);

  const openRef = useRef(open);
  openRef.current = open;
  const presentRef = useRef(present);
  presentRef.current = present;
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;
  const closeOnOverlayRef = useRef(closeOnOverlay);
  closeOnOverlayRef.current = closeOnOverlay;
  const onUpdateOpenRef = useRef(onUpdateOpen);
  onUpdateOpenRef.current = onUpdateOpen;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dragVisualRef = useRef<DragVisual | null>(null);
  const settleDoneRef = useRef<(() => void) | null>(null);
  const clearInlineRef = useRef<() => void>(() => {});
  const closeTimerRef = useRef(0);
  const settleTimerRef = useRef(0);
  const armedRef = useRef(false);
  const dragMovedRef = useRef(false);
  const fromChromeRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTRef = useRef(0);
  const dyRef = useRef(0);
  const velocityRef = useRef(0);

  function requestClose() {
    onUpdateOpenRef.current?.(false);
    onCloseRef.current?.();
  }

  const { host, zIndex, ctx } = useOverlay({
    lane: 'dialog',
    open: present,
    closeOnOutside: false,
    closeOnEsc,
    modal: true,
    onClose: requestClose,
  }, [panelRef]);

  useModality(present, panelRef, ctx?.root);

  const isAuto = height === 'auto';
  const showHead = Boolean(title) || closable || headerSlot != null;
  const labelledBy = title && headerSlot == null ? titleId : undefined;
  const sheetStyle: CSSProperties = {};
  if (!isAuto) {
    sheetStyle.height = typeof height === 'number' ? `${height}px` : height;
  }
  // visualTick bumps after a drag frame so this render picks up dragVisualRef.
  if (visualTick >= 0 && dragVisualRef.current) {
    sheetStyle.transform = dragVisualRef.current.transform;
  }

  function publishVisual() {
    setVisualTick(tick => tick + 1);
  }

  function sheetZoom(popup: HTMLElement) {
    const layoutHeight = popup.offsetHeight;
    const visualHeight = popup.getBoundingClientRect().height;
    return layoutHeight && visualHeight ? visualHeight / layoutHeight : 1;
  }

  function setOffset(cssY: number) {
    const popup = panelRef.current;
    const mask = maskRef.current;
    if (!popup) return;
    const offset = Math.max(0, cssY);
    const transform = `translateY(${offset}px)`;
    const progress = Math.min(1, offset / (popup.offsetHeight || 1));
    const maskOpacity = String(1 - progress);
    popup.style.transform = transform;
    if (mask) mask.style.opacity = maskOpacity;
    dragVisualRef.current = { transform, maskOpacity };
  }

  function clearInline() {
    const popup = panelRef.current;
    const mask = maskRef.current;
    draggingRef.current = false;
    setDragging(false);
    popup?.classList.remove('is-dragging');
    mask?.classList.remove('is-dragging');
    if (popup) popup.style.transform = '';
    if (mask) mask.style.opacity = '';
    dragVisualRef.current = null;
    publishVisual();
  }

  clearInlineRef.current = clearInline;

  function finishDismiss() {
    settleDoneRef.current = null;
    window.clearTimeout(settleTimerRef.current);
    shownRef.current = false;
    presentRef.current = false;
    setShown(false);
    setPresent(false);
    requestClose();
  }

  const dragApiRef = useRef({
    setOffset: (_cssY: number) => {},
    finishDrag: (_dismiss: boolean) => {},
  });

  const unbindPanelRef = useRef<(() => void) | null>(null);
  const setPanelNode = useCallback((popup: HTMLDivElement | null) => {
    unbindPanelRef.current?.();
    unbindPanelRef.current = null;
    panelRef.current = popup;
    if (!popup) return;

    /** Content may scroll in a nested list rather than the body itself. */
    const hasScrolledAncestor = (target: Element) => {
      for (let el: Element | null = target; el && el !== panelRef.current; el = el.parentElement) {
        if (el.scrollTop > 0) return true;
      }
      return false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!shownRef.current || (event.button && event.button !== 0)) return;
      const { target } = event;
      if (!(target instanceof Element)) return;
      const fromChrome = !!target.closest('.rk-popup-handle, .rk-popup-head');
      const onBodyTop = !!target.closest('.rk-popup-body') && !hasScrolledAncestor(target);
      const interactive = target.closest('input, textarea, button, a, [contenteditable]');
      if (interactive && !fromChrome) return;
      if (!fromChrome && !onBodyTop) return;
      fromChromeRef.current = fromChrome;
      armedRef.current = true;
      dragMovedRef.current = false;
      startXRef.current = event.clientX;
      startYRef.current = event.clientY;
      lastYRef.current = event.clientY;
      lastTRef.current = performance.now();
      velocityRef.current = 0;
      dyRef.current = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!armedRef.current) return;
      const y = event.clientY;
      const now = performance.now();
      const raw = y - startYRef.current;
      velocityRef.current = (y - lastYRef.current) / (now - lastTRef.current || 16);
      lastYRef.current = y;
      lastTRef.current = now;
      if (!dragMovedRef.current) {
        if (!fromChromeRef.current && raw < -DRAG_START_PX) {
          armedRef.current = false;
          return;
        }
        if (raw < DRAG_START_PX) return;
        dragMovedRef.current = true;
        draggingRef.current = true;
        setDragging(true);
        popup.classList.add('is-dragging');
        maskRef.current?.classList.add('is-dragging');
        try {
          popup.setPointerCapture(event.pointerId);
        } catch {
          // The pointer may already be released.
        }
      }
      event.preventDefault();
      dyRef.current = raw;
      dragApiRef.current.setOffset(raw / sheetZoom(popup));
    };

    const onPointerUp = () => {
      if (!armedRef.current) return;
      const moved = dragMovedRef.current;
      armedRef.current = false;
      dragMovedRef.current = false;
      if (!moved) return;
      const visualHeight = popup.getBoundingClientRect().height || 400;
      const distance = Math.min(DISMISS_DISTANCE_PX, visualHeight * DISMISS_DISTANCE_RATIO);
      dragApiRef.current.finishDrag(dyRef.current > distance || velocityRef.current > DISMISS_VELOCITY);
    };

    // Touch panning cancels the pointer stream as soon as the browser scrolls, so an
    // armed downward pull has to claim the gesture before that happens.
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!armedRef.current || !touch) return;
      const moveX = touch.clientX - startXRef.current;
      const moveY = touch.clientY - startYRef.current;
      if (moveY > 0 && moveY >= Math.abs(moveX) && event.cancelable) event.preventDefault();
    };

    popup.addEventListener('pointerdown', onPointerDown);
    popup.addEventListener('pointermove', onPointerMove, { passive: false });
    popup.addEventListener('pointerup', onPointerUp);
    popup.addEventListener('pointercancel', onPointerUp);
    popup.addEventListener('touchmove', onTouchMove, { passive: false });
    unbindPanelRef.current = () => {
      popup.removeEventListener('pointerdown', onPointerDown);
      popup.removeEventListener('pointermove', onPointerMove);
      popup.removeEventListener('pointerup', onPointerUp);
      popup.removeEventListener('pointercancel', onPointerUp);
      popup.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  function finishDrag(dismiss: boolean) {
    const popup = panelRef.current;
    const mask = maskRef.current;
    draggingRef.current = false;
    setDragging(false);
    popup?.classList.remove('is-dragging');
    mask?.classList.remove('is-dragging');
    if (!popup) {
      if (dismiss) finishDismiss();
      return;
    }
    // Apply the resting transition before the next transform, or the close snaps.
    void popup.offsetHeight;
    const transform = dismiss ? 'translateY(100%)' : 'translateY(0)';
    const maskOpacity = dismiss ? '0' : '1';
    popup.style.transform = transform;
    if (mask) mask.style.opacity = maskOpacity;
    dragVisualRef.current = { transform, maskOpacity };
    publishVisual();

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      settleDoneRef.current = null;
      window.clearTimeout(settleTimerRef.current);
      if (dismiss) finishDismiss();
      else clearInline();
    };
    settleDoneRef.current = done;
    settleTimerRef.current = window.setTimeout(done, SHEET_MS);
  }

  dragApiRef.current.setOffset = setOffset;
  dragApiRef.current.finishDrag = finishDrag;

  useEffect(() => {
    if (open) {
      window.clearTimeout(closeTimerRef.current);
      presentRef.current = true;
      setPresent(true);
      shownRef.current = false;
      setShown(false);
      let frame2 = 0;
      const frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => {
          if (!openRef.current) return;
          shownRef.current = true;
          setShown(true);
        });
      });
      return () => {
        cancelAnimationFrame(frame1);
        cancelAnimationFrame(frame2);
      };
    }

    if (!presentRef.current) return undefined;
    settleDoneRef.current = null;
    window.clearTimeout(settleTimerRef.current);
    armedRef.current = false;
    dragMovedRef.current = false;
    shownRef.current = false;
    setShown(false);
    const clearFrame = requestAnimationFrame(() => {
      if (openRef.current) return;
      clearInlineRef.current();
    });
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      if (openRef.current) return;
      presentRef.current = false;
      setPresent(false);
    }, SHEET_MS);
    return () => {
      cancelAnimationFrame(clearFrame);
    };
  }, [open]);

  useEffect(() => () => {
    window.clearTimeout(closeTimerRef.current);
    window.clearTimeout(settleTimerRef.current);
    settleDoneRef.current = null;
  }, []);

  function onSheetTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.target !== panelRef.current || event.propertyName !== 'transform') return;
    const done = settleDoneRef.current;
    if (done) {
      done();
      return;
    }
    if (!openRef.current && !draggingRef.current) {
      window.clearTimeout(closeTimerRef.current);
      presentRef.current = false;
      setPresent(false);
    }
  }

  function onOverlay() {
    if (!closeOnOverlayRef.current || draggingRef.current) return;
    requestClose();
  }

  if (!host || !present) return null;

  return createPortal(
    <div
      className={['rk-popup-root', shown ? 'is-open' : ''].filter(Boolean).join(' ')}
      style={{ zIndex }}
    >
      <div
        ref={maskRef}
        className={['rk-popup-mask', dragging ? 'is-dragging' : ''].filter(Boolean).join(' ')}
        style={dragVisualRef.current ? { opacity: dragVisualRef.current.maskOpacity } : undefined}
        onClick={onOverlay}
      />
      <div
        ref={setPanelNode}
        className={[
          'rk-popup',
          shown ? 'is-open' : '',
          isAuto ? 'is-auto' : '',
          dragging ? 'is-dragging' : '',
        ].filter(Boolean).join(' ')}
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={labelledBy}
        onTransitionEnd={onSheetTransitionEnd}
      >
        <div className="rk-popup-handle" aria-hidden="true">
          <i />
        </div>
        {showHead && (
          <div className="rk-popup-head">
            {headerSlot ?? (
              <>
                {title && (
                  <span id={titleId} className="rk-popup-title">{title}</span>
                )}
                {closable && (
                  <button
                    className="rk-popup-close"
                    type="button"
                    aria-label="Close"
                    onClick={requestClose}
                  >
                    <IconClose size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        )}
        <div className="rk-popup-body">
          {children}
        </div>
        {footerSlot != null && (
          <div className="rk-popup-footer">
            {footerSlot}
          </div>
        )}
      </div>
    </div>,
    host,
  );
}

export default TUIPopup;
