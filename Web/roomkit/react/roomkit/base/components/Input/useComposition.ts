import { useRef } from 'react';
import type { CompositionEvent } from 'react';

export function useComposition() {
  const composing = useRef(false);

  const onCompositionStart = () => {
    composing.current = true;
  };

  const onCompositionEnd = (
    event: CompositionEvent<HTMLInputElement | HTMLTextAreaElement>,
    next: (value: string) => void,
  ) => {
    composing.current = false;
    next((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  };

  return { composing, onCompositionStart, onCompositionEnd };
}
