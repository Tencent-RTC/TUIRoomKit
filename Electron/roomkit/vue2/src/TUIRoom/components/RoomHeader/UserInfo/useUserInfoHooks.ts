import { ref, onMounted, onUnmounted, Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
export default function useUserInfo() {
  const { t } = useI18n();
  const basicStore = useBasicStore();
  const { userName } = storeToRefs(basicStore);

  const userInfoRef = ref();
  const showUserControl = ref(false);
  const isUserNameEditorVisible: Ref<boolean> = ref(false);

  const tempUserName = ref('');
  function handleUserControl() {
    showUserControl.value = !showUserControl.value;
  }

  function hideUserControl(event: Event) {
    if (!userInfoRef.value?.contains(event.target)) {
      showUserControl.value = false;
    }
  }

  function showEditUserNameDialog() {
    isUserNameEditorVisible.value = true;
    tempUserName.value = userName.value;
  }

  function closeUserNameEditor() {
    isUserNameEditorVisible.value = false;
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
    isUserNameEditorVisible,
    userInfoRef,
    tempUserName,
    handleUserControl,
    showEditUserNameDialog,
    closeUserNameEditor,
  };
}
