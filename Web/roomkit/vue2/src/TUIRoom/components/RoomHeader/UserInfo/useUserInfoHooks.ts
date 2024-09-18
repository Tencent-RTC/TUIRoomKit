import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../../locales';
export default function useUserInfo() {
  const { t } = useI18n();

  const userInfoRef = ref();
  const showUserControl = ref(false);

  /**
   * Whether to display the user information operation box
   *
   **/
  function handleUserControl() {
    showUserControl.value = !showUserControl.value;
  }

  /**
   * Hide the user information action box
   *
   **/
  function hideUserControl(event: Event) {
    if (!userInfoRef.value?.contains(event.target)) {
      showUserControl.value = false;
    }
  }

  onMounted(() => {
    window.addEventListener('click', hideUserControl);
  });

  onUnmounted(() => {
    window.removeEventListener('click', hideUserControl);
  });
  return {
    t,
    showUserControl,
    userInfoRef,
    handleUserControl,
  };
}
