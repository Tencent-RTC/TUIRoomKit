import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';

/** Observes the border-box width of one element; 0 until it mounts. */
export function useElementWidth(target: Ref<HTMLElement | null>) {
  const width = ref(0);
  let observer: ResizeObserver | null = null;

  onMounted(() => {
    observer = new ResizeObserver(([entry]) => {
      width.value = entry.contentRect.width;
    });
    if (target.value) {
      observer.observe(target.value);
      width.value = target.value.clientWidth;
    }
  });

  onBeforeUnmount(() => observer?.disconnect());

  return { width };
}
