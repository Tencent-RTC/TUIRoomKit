import { ref } from 'vue';

export function useRoomToolbarH5() {
  const showToolbar = ref(true);

  function toggleToolbar(event: MouseEvent | TouchEvent) {
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
