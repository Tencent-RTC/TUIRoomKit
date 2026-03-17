import { ref, computed } from 'vue';
import { conference } from '../adapter/conference';

const showToolbar = ref(true);

export function useRoomToolbarH5() {
  const toolbarConfig = computed(() => conference.getFeatureConfig('toolbar'));
  const alwaysShow = computed(() => toolbarConfig.value?.alwaysShow === true);

  function toggleToolbar(event: MouseEvent | TouchEvent) {
    if (alwaysShow.value) {
      return;
    }
    const target = event.target as HTMLElement;
    // Toggle toolbar when clicking on the main area or video area
    // But exclude interactive elements like buttons
    if (
      target
      && !target.closest('button')
      && !target.closest('.control-bar')
      && !target.closest('.header')
      && !target.closest('.bottom-popup-overlay')
    ) {
      showToolbar.value = !showToolbar.value;
    }
  }

  return {
    showToolbar,
    toggleToolbar,
  };
}
