import { ref, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

export function useRoomToolbar(
  containerRef: Ref<HTMLElement | null>,
  autoHideDelay = 5000,
  mouseMoveThrottle = 1000,
) {
  const showToolbar = ref(true);
  const hideToolTimer = ref<number | null>(null);
  const throttleTimer = ref<number | null>(null);
  const isThrottled = ref(false);

  const clearHideTimer = () => {
    if (hideToolTimer.value !== null) {
      clearTimeout(hideToolTimer.value);
      hideToolTimer.value = null;
    }
  };

  const clearThrottleTimer = () => {
    if (throttleTimer.value !== null) {
      clearTimeout(throttleTimer.value);
      throttleTimer.value = null;
    }
  };

  const setHideTimer = () => {
    clearHideTimer();
    hideToolTimer.value = window.setTimeout(() => {
      showToolbar.value = false;
    }, autoHideDelay);
  };

  const handleMouseEnter = () => {
    showToolbar.value = true;
    setHideTimer();
  };

  const handleMouseMoveThrottled = () => {
    if (isThrottled.value) {
      return;
    }

    showToolbar.value = true;
    setHideTimer();

    isThrottled.value = true;
    throttleTimer.value = window.setTimeout(() => {
      isThrottled.value = false;
    }, mouseMoveThrottle);
  };

  const handleMouseLeave = () => {
    clearHideTimer();
    clearThrottleTimer();
    isThrottled.value = false;
    showToolbar.value = false;
  };

  const addEventListeners = () => {
    const container = containerRef.value;
    if (!container) {
      return;
    }

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mousemove', handleMouseMoveThrottled);
    container.addEventListener('mouseleave', handleMouseLeave);
  };

  const removeEventListeners = () => {
    const container = containerRef.value;
    if (!container) {
      return;
    }

    container.removeEventListener('mouseenter', handleMouseEnter);
    container.removeEventListener('mousemove', handleMouseMoveThrottled);
    container.removeEventListener('mouseleave', handleMouseLeave);
  };

  onMounted(() => {
    addEventListeners();
    setHideTimer();
  });

  onUnmounted(() => {
    clearHideTimer();
    clearThrottleTimer();
    removeEventListeners();
  });

  return {
    showToolbar,
  };
}
