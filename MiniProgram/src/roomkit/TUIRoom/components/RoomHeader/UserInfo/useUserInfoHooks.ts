import { ref, onMounted, onUnmounted, Ref } from 'vue';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import { TUIRoomEngine } from '@tencentcloud/tuiroom-engine-wx';
import { useRoomStore } from '../../../stores/room';
export default function useUserInfo() {
  const { t } = useI18n();
  const basicStore = useBasicStore();
  const { userName } = storeToRefs(basicStore);

  const userInfoRef = ref();
  const showUserControl = ref(false);
  const showUserNameEdit: Ref<boolean> = ref(false);

  const tempUserName = ref('');
  const roomStore = useRoomStore();

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
      TUIMessage({
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
    window?.addEventListener('click', hideUserControl);
  });

  onUnmounted(() => {
    window?.removeEventListener('click', hideUserControl);
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
    handleSaveUserName,
  };
}
