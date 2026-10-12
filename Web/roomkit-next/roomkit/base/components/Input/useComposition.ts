import { ref } from 'vue';

export function useComposition() {
  const composing = ref(false);

  const onCompositionStart = () => {
    composing.value = true;
  };

  const onCompositionEnd = (event: CompositionEvent, next: (value: string) => void) => {
    composing.value = false;
    next((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  };

  return { composing, onCompositionStart, onCompositionEnd };
}
