import { ref, onMounted, computed, onUnmounted, Ref } from 'vue';
import { ICON_NAME } from '../../../constants/icon';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
import { ElMessage } from '../../../elementComp';
import { MESSAGE_DURATION } from '../../../constants/message';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-electron';
import { useRoomStore } from '../../../stores/room';
import { isInnerScene } from '../../../utils/constants';
export default function useUserInfo() {
  const { t } = useI18n();
  const basicStore = useBasicStore();
  const { userName } = storeToRefs(basicStore);

  const userInfoRef = ref();
  const showUserControl = ref(false);
  const showUserNameEdit: Ref<boolean> = ref(false);

  const showEditNameItem: Ref<boolean> = ref(isInnerScene);

  const tempUserName = ref('');
  const roomStore = useRoomStore();

  const iconName = computed(() => (showUserControl.value ? ICON_NAME.LineArrowUp : ICON_NAME.LineArrowDown));

  /**
     * Whether to display the user information operation box
     *
     * 是否显示用户信息操作框
    **/
  function handleUserControl() {
    showUserControl.value = !showUserControl.value;
  }

  /**
     * Hide the user information action box
     *
     * 隐藏用户信息操作框
    **/
  function hideUserControl(event: Event) {
    if (!userInfoRef.value.contains(event.target)) {
      showUserControl.value = false;
    }
  }

  /**
     * Show change name dialog
     *
     * 展示修改名字 dialog
    **/
  function showEditUserNameDialog() {
    showUserNameEdit.value = true;
    tempUserName.value = userName.value;
  }

  /**
     * Close the modify name dialog
     *
     * 关闭修改名字的 dialog
    **/
  function closeEditUserNameDialog() {
    showUserNameEdit.value = false;
  }

  /**
     * Save the new userName
     *
     * 保存新的 userName
    **/
  async function handleSaveUserName(userName: string) {
    if (userName.length === 0) {
      ElMessage({
        type: 'warning',
        message: t('Username length should be greater than 0'),
        duration: MESSAGE_DURATION.NORMAL,
      });
      return;
    }
    basicStore.setUserName(userName);
    TUIRoomEngine.setSelfInfo({ userName, avatarUrl: roomStore.localUser.avatarUrl || '' });
    roomStore.setLocalUser({ userName });
    closeEditUserNameDialog();
  }


  onMounted(() => {
    window.addEventListener('click', hideUserControl);
  });

  onUnmounted(() => {
    window.removeEventListener('click', hideUserControl);
  });
  return {
    t,
    showEditNameItem,
    showUserControl,
    iconName,
    showUserNameEdit,
    userInfoRef,
    tempUserName,
    handleUserControl,
    showEditUserNameDialog,
    closeEditUserNameDialog,
    handleSaveUserName,
  };
}
