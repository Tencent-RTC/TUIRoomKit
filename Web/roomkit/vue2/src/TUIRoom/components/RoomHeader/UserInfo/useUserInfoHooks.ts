import { ref, onMounted, onUnmounted, Ref } from 'vue';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
export default function useUserInfo() {
  const { t } = useI18n();
  const basicStore = useBasicStore();
  const { userName } = storeToRefs(basicStore);

  const userInfoRef = ref();
  const showUserControl = ref(false);
  const showUserNameEdit: Ref<boolean> = ref(false);

  const tempUserName = ref('');
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

  /**
     * Show change name dialog
     *
    **/
  function showEditUserNameDialog() {
    showUserNameEdit.value = true;
    tempUserName.value = userName.value;
  }

  /**
     * Close the modify name dialog
     *
    **/
  function closeEditUserNameDialog() {
    showUserNameEdit.value = false;
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
    showUserNameEdit,
    userInfoRef,
    tempUserName,
    handleUserControl,
    showEditUserNameDialog,
    closeEditUserNameDialog,
  };
}
