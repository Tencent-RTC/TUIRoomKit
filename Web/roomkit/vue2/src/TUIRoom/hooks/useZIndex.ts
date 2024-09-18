import { computed, ref } from 'vue';

const zIndex = ref(0);
const defaultInitialZIndex = 3000;

export default function () {
  const currentZIndex = computed(() => defaultInitialZIndex + zIndex.value);

  const nextZIndex = () => {
    zIndex.value = zIndex.value + 1;
    return currentZIndex.value;
  };

  return {
    currentZIndex: currentZIndex.value,
    nextZIndex,
  };
}
