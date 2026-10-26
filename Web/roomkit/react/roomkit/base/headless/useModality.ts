import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { ElementRef } from './types';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const rootLocks = new WeakMap<HTMLElement, { count: number; overflow: string }>();

function lockScroll(lock: boolean, root?: HTMLElement | null) {
  const rootEl = root ?? null;
  if (!rootEl) return;

  if (lock) {
    const rec = rootLocks.get(rootEl) ?? { count: 0, overflow: rootEl.style.overflow };
    if (rec.count === 0) rootEl.style.overflow = 'hidden';
    rec.count += 1;
    rootLocks.set(rootEl, rec);
    return;
  }

  const rec = rootLocks.get(rootEl);
  if (!rec) return;
  rec.count -= 1;
  if (rec.count <= 0) {
    rootEl.style.overflow = rec.overflow;
    rootLocks.delete(rootEl);
  }
}

export function useModality(open: boolean, panel: ElementRef, root?: HTMLElement | null) {
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const heldRef = useRef(false);
  // The keydown trap is bound once; it reads the latest inputs through refs.
  const openRef = useRef(open);
  openRef.current = open;
  const rootRef = useRef(root);
  rootRef.current = root;

  const setLock = useCallback((lock: boolean) => {
    if (lock) {
      if (heldRef.current) return;
      lockScroll(true, rootRef.current);
      heldRef.current = true;
      return;
    }
    if (!heldRef.current) return;
    lockScroll(false, rootRef.current);
    heldRef.current = false;
  }, []);

  const trap = useCallback((event: KeyboardEvent) => {
    if (!openRef.current || event.key !== 'Tab' || !panel.current) return;
    const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus({ preventScroll: true });
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus({ preventScroll: true });
      event.preventDefault();
    }
  }, [panel]);

  const focusPanel = (el: HTMLElement) => {
    const target = el.hasAttribute('tabindex')
      ? el
      : el.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus({ preventScroll: true });
  };

  useLayoutEffect(() => {
    if (open) {
      lastFocusRef.current = document.activeElement as HTMLElement | null;
      setLock(true);
      document.addEventListener('keydown', trap, true);
    } else {
      setLock(false);
      document.removeEventListener('keydown', trap, true);
      lastFocusRef.current?.focus?.({ preventScroll: true });
    }
  }, [open, setLock, trap]);

  // Mirrors a watch on [open, panel]: runs after every commit, acts only on change.
  const watchedRef = useRef<{ open: boolean; el: HTMLElement | null }>({ open, el: null });
  useLayoutEffect(() => {
    const el = panel.current;
    const prev = watchedRef.current;
    if (prev.open === open && prev.el === el) return;
    watchedRef.current = { open, el };
    if (!open || !el) return;
    requestAnimationFrame(() => focusPanel(el));
  });

  useEffect(() => () => {
    setLock(false);
    document.removeEventListener('keydown', trap, true);
  }, [setLock, trap]);
}
