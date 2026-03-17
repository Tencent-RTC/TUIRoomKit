import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import type { Ref } from 'vue';
import { conference } from '../adapter/conference';

const DEFAULT_AUTO_HIDE_DELAY = 5000;
const TOOLBAR_SAFE_LAYER_SELECTOR = '[class*="emoji-picker__list"]';

export function useRoomToolbar(
  containerRef: Ref<HTMLElement | null>,
  mouseMoveThrottle = 1000,
) {
  const toolbarConfig = computed(() => conference.getFeatureConfig('toolbar'));
  const alwaysShow = computed(() => toolbarConfig.value?.alwaysShow === true);
  const autoHideDelay = computed(() => toolbarConfig.value?.autoHideDelay ?? DEFAULT_AUTO_HIDE_DELAY);

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

  const isToolbarSafeLayerElement = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
      return false;
    }
    return Boolean(target.closest(TOOLBAR_SAFE_LAYER_SELECTOR));
  };

  const setHideTimer = () => {
    if (alwaysShow.value) {
      return;
    }
    clearHideTimer();
    hideToolTimer.value = window.setTimeout(() => {
      showToolbar.value = false;
    }, autoHideDelay.value);
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

  const handleMouseLeave = (event: MouseEvent) => {
    if (alwaysShow.value) {
      return;
    }
    if (isToolbarSafeLayerElement(event.relatedTarget)) {
      return;
    }
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

  // Watch alwaysShow changes: when switching to always-show, clear timers and show toolbar
  watch(alwaysShow, (newVal) => {
    if (newVal) {
      clearHideTimer();
      clearThrottleTimer();
      showToolbar.value = true;
    } else {
      setHideTimer();
    }
  });

  onMounted(() => {
    addEventListeners();
    if (!alwaysShow.value) {
      setHideTimer();
    }
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
