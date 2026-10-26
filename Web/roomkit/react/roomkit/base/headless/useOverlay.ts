import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LANE_BASE, OVERLAY_CONTEXT_KEY } from '../tokens';
import type { OverlayHandle } from '../tokens';
import type { ElementRef, UseOverlayOptions } from './types';

function isInside(target: EventTarget | null, els: Array<HTMLElement | null | undefined>) {
  if (!(target instanceof Node)) return false;
  return els.some(el => el && el.contains(target));
}

/** Outermost `.rk-root` above `el` — the theme carrier and the positioning context. */
function themeRoot(el: HTMLElement): HTMLElement | null {
  let root: HTMLElement | null = null;
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (node.classList.contains('rk-root')) root = node;
  }
  return root;
}

export function useOverlay(options: UseOverlayOptions, ignoreEls: ElementRef[] = []) {
  const ctx = useContext(OVERLAY_CONTEXT_KEY);
  const [handle, setHandle] = useState<OverlayHandle | null>(null);
  const handleRef = useRef<OverlayHandle | null>(null);

  // Listeners are bound once; they read the latest options through this ref.
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const ignoreRef = useRef(ignoreEls);
  ignoreRef.current = ignoreEls;

  const zIndex = handle?.zIndex ?? LANE_BASE[options.lane];

  /* Seeded so dialogs that portal on their first render still have a target;
     `syncHost` refines it once the anchor exists. */
  const [host, setHost] = useState<HTMLElement | null>(ctx?.host ?? null);

  /* The provider's overlay stack lives in the opener document. An overlay anchored
     inside a picture-in-picture window has to stay in that window instead, so it
     falls back to the outermost `.rk-root` there: it is positioned and it carries
     the theme tokens the panel styles read. */
  const resolveHost = useCallback(() => {
    const providerHost = ctx?.host ?? null;
    const reference = optionsRef.current.reference?.current ?? null;
    if (!providerHost || !reference || providerHost.ownerDocument === reference.ownerDocument) {
      return providerHost;
    }
    return themeRoot(reference) ?? reference.ownerDocument.body;
  }, [ctx]);

  const close = useCallback(() => {
    optionsRef.current.onClose?.();
  }, []);

  const boundDocRef = useRef<Document | null>(null);

  const onPointerDown = useCallback((event: PointerEvent) => {
    const { current } = optionsRef;
    if (!current.open || current.closeOnOutside === false) return;
    const nodes = ignoreRef.current.map(item => item.current);
    if (isInside(event.target, nodes)) return;
    close();
  }, [close]);

  /* The provider's Esc handler is bound to its own document, so a key pressed in the
     picture-in-picture window never reaches it. Handle it here even when ctx exists. */
  const onForeignKeydown = useCallback((event: KeyboardEvent) => {
    const { current } = optionsRef;
    if (!current.open || current.closeOnEsc === false) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }, [close]);

  const bindForeignDoc = useCallback((doc: Document | null) => {
    const boundDoc = boundDocRef.current;
    if (boundDoc === doc) return;
    boundDoc?.removeEventListener('pointerdown', onPointerDown, true);
    boundDoc?.removeEventListener('keydown', onForeignKeydown, true);
    boundDocRef.current = doc;
    doc?.addEventListener('pointerdown', onPointerDown, true);
    doc?.addEventListener('keydown', onForeignKeydown, true);
  }, [onPointerDown, onForeignKeydown]);

  /* A portal can carry the anchor into another window without any ref changing
     value, so which document it belongs to cannot be tracked reactively. Resolve it
     on every open instead — by then the anchor sits where the user clicked it. */
  const syncHost = useCallback(() => {
    const next = resolveHost();
    setHost(next);
    const doc = next?.ownerDocument ?? null;
    bindForeignDoc(doc && doc !== document ? doc : null);
  }, [resolveHost, bindForeignDoc]);

  const release = useCallback(() => {
    if (!ctx || !handleRef.current) return;
    ctx.release(handleRef.current.id);
    handleRef.current = null;
    setHandle(null);
  }, [ctx]);

  const acquire = useCallback(() => {
    if (handleRef.current) return;
    if (!ctx) {
      console.warn(`[RoomKit] Overlay lane "${optionsRef.current.lane}" requires RoomKitProvider.`);
      return;
    }
    const next = ctx.acquire(optionsRef.current.lane, {
      closeOnEsc: optionsRef.current.closeOnEsc !== false,
      onClose: () => optionsRef.current.onClose?.(),
    });
    handleRef.current = next;
    setHandle(next);
  }, [ctx]);

  useLayoutEffect(() => {
    if (!options.open) {
      release();
      return;
    }
    syncHost();
    acquire();
  }, [options.open, release, syncHost, acquire]);

  useLayoutEffect(() => {
    syncHost();
  }, [ctx, syncHost]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      const { current } = optionsRef;
      if (ctx || !current.open || current.closeOnEsc === false) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeydown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeydown, true);
    };
  }, [ctx, close, onPointerDown]);

  useEffect(() => () => {
    bindForeignDoc(null);
    release();
  }, [bindForeignDoc, release]);

  return {
    ctx,
    host,
    zIndex,
  };
}
