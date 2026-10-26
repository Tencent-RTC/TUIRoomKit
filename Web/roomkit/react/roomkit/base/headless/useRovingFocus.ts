import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

type RovingItem = { value: string | number; disabled?: boolean; el?: HTMLElement | null };

export function useRovingFocus(items: Array<RovingItem>) {
  const [highlighted, setHighlightedState] = useState<string | number | null>(null);
  // Keydown handlers read the latest items and highlight through refs.
  const highlightedRef = useRef<string | number | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const setHighlighted = useCallback((value: string | number | null) => {
    highlightedRef.current = value;
    setHighlightedState(value);
  }, []);

  const enabled = useCallback(() => itemsRef.current.filter(item => !item.disabled), []);

  const move = useCallback((delta: number) => {
    const list = enabled();
    if (!list.length) return;
    const index = list.findIndex(item => item.value === highlightedRef.current);
    const next = index === -1
      ? (delta > 0 ? list[0] : list[list.length - 1])
      : list[(index + delta + list.length) % list.length];
    setHighlighted(next.value);
    next.el?.focus?.();
  }, [enabled, setHighlighted]);

  const onKeydown = useCallback((event: KeyboardEvent | ReactKeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const first = enabled()[0];
      if (first) setHighlighted(first.value);
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = enabled().at(-1);
      if (last) setHighlighted(last.value);
    } else if (event.key.length === 1) {
      const match = enabled().find(item => String(item.value).toLowerCase().startsWith(event.key.toLowerCase()));
      if (match) setHighlighted(match.value);
    }
  }, [enabled, move, setHighlighted]);

  return { highlighted, setHighlighted, onKeydown };
}
