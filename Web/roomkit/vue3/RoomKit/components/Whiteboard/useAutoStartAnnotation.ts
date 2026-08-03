import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { DeviceStatus, useDeviceState } from 'tuikit-atomicx-vue3/room';

interface AutoStartAnnotationOptions {
  // Prefer a computed/ref, or a getter that reads reactive deps so the watch
  // re-runs when the local screen preview becomes ready.
  isReady: Ref<boolean> | (() => boolean);
  start: () => void | Promise<void>;
}

const autoStartRequested = ref(false);
const { screenStatus } = useDeviceState();

// A request belongs to the current local screen-share session only.
watch(screenStatus, (status) => {
  if (status === DeviceStatus.Off) {
    autoStartRequested.value = false;
  }
});

export function requestAutoStartAnnotation(): void {
  autoStartRequested.value = true;
}

function readReady(isReady: AutoStartAnnotationOptions['isReady']): boolean {
  return typeof isReady === 'function' ? isReady() : isReady.value;
}

export function useAutoStartAnnotation(options: AutoStartAnnotationOptions): void {
  watch(
    [autoStartRequested, () => readReady(options.isReady)],
    ([requested, ready]) => {
      if (!requested || !ready) {
        return;
      }
      autoStartRequested.value = false;
      options.start();
    },
    { flush: 'post', immediate: true },
  );
}
