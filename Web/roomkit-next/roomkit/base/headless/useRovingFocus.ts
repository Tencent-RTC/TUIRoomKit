import { ref } from 'vue';
import type { Ref } from 'vue';

export function useRovingFocus(items: Ref<Array<{ value: string | number; disabled?: boolean; el?: HTMLElement | null }>>) {
  const highlighted = ref<string | number | null>(null);

  const enabled = () => items.value.filter(item => !item.disabled);

  const move = (delta: number) => {
    const list = enabled();
    if (!list.length) return;
    const index = list.findIndex(item => item.value === highlighted.value);
    const next = index === -1
      ? (delta > 0 ? list[0] : list[list.length - 1])
      : list[(index + delta + list.length) % list.length];
    highlighted.value = next.value;
    next.el?.focus?.();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const first = enabled()[0];
      if (first) highlighted.value = first.value;
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = enabled().at(-1);
      if (last) highlighted.value = last.value;
    } else if (event.key.length === 1) {
      const match = enabled().find(item => String(item.value).toLowerCase().startsWith(event.key.toLowerCase()));
      if (match) highlighted.value = match.value;
    }
  };

  return { highlighted, onKeydown };
}
