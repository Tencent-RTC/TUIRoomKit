import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';

/** Tracks and toggles the Fullscreen API for one element. */
export function useFullscreen(target: Ref<HTMLElement | null>) {
  const fullscreen = ref(false);

  function sync() {
    fullscreen.value = document.fullscreenElement === target.value;
  }

  async function toggle() {
    if (document.fullscreenElement === target.value) {
      await document.exitFullscreen?.();
      return;
    }
    await target.value?.requestFullscreen?.();
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', sync);
    sync();
  });

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', sync);
  });

  return {
    fullscreen,
    toggle,
  };
}
