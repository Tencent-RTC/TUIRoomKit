import { ref, Ref, computed } from 'vue';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import logger from '../../../utils/common/logger';

export default function useEndControl() {
  const { t } = useI18n();
  enum DialogType {
    BasicDialog,
    TransferDialog
  }
  const currentDialogType = ref(DialogType.BasicDialog);

  const logPrefix = '[EndControl]';
  const roomEngine = useGetRoomEngine();
  const visible: Ref<boolean> = ref(false);
  const basicStore = useBasicStore();
  logger.log(`${logPrefix} basicStore:`, basicStore);

  const roomStore = useRoomStore();
  const { localUser, remoteAnchorList } = storeToRefs(roomStore);
  const title = computed(() => (currentDialogType.value === DialogType.BasicDialog ? t('Leave room?') : t('Select a new host')));
  const isShowLeaveRoomDialog = computed(() => (
    roomStore.isMaster && remoteAnchorList.value.length > 0)
  || !roomStore.isMaster);
  const { isSidebarOpen, sidebarName } = storeToRefs(basicStore);
  const showSideBar = computed(() => isSidebarOpen.value && sidebarName.value === 'transfer-leave');
  const selectedUser: Ref<string> = ref('');
  const showTransfer = ref(false);
  const searchName = ref('');
  const filteredList = computed(() => remoteAnchorList.value.filter(searchUser => (
    searchUser.userId.includes(searchName.value)) || (searchUser.userName?.includes(searchName.value))));
  const hasNoData = computed(() => filteredList.value.length === 0);

  function toggleMangeMemberSidebar() {
    if (basicStore.setSidebarOpenStatus && sidebarName.value === 'transfer-leave') {
      basicStore.setSidebarOpenStatus(false);
      basicStore.setSidebarName('');
      return;
    }

    basicStore.setSidebarOpenStatus(true);
    basicStore.setSidebarName('transfer-leave');
  }

  function handleShowMemberControl(userId: string) {
    selectedUser.value = userId;
  }

  function resetState() {
    visible.value = false;
    currentDialogType.value = DialogType.BasicDialog;
  }

  function stopMeeting() {
    if (!visible.value) {
      visible.value = true;
    }
  }

  function cancel() {
    resetState();
  }

  async function closeMediaBeforeLeave() {
    if (localUser.value.hasAudioStream) {
      await roomEngine.instance?.closeLocalMicrophone();
    }
    if (localUser.value.hasVideoStream) {
      await roomEngine.instance?.closeLocalCamera();
    }
  }
  return {
    t,
    basicStore,
    isShowLeaveRoomDialog,
    roomStore,
    roomEngine,
    localUser,
    remoteAnchorList,
    stopMeeting,
    cancel,
    selectedUser,
    DialogType,
    logPrefix,
    title,
    currentDialogType,
    visible,
    closeMediaBeforeLeave,
    resetState,
    searchName,
    hasNoData,
    handleShowMemberControl,
    filteredList,
    toggleMangeMemberSidebar,
    showTransfer,
    sidebarName,
    showSideBar,
  };
}
