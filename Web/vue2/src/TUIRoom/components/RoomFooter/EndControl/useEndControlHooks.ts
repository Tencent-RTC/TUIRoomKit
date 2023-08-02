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
  const showLeaveRoom = computed(() => (
    roomStore.isMaster && remoteAnchorList.value.length > 0)
  || !roomStore.isMaster);

  const selectedUser: Ref<string> = ref('');

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
  const { sidebarName } = storeToRefs(basicStore);

  function toggleMangeMemberSidebar() {
    if (basicStore.setSidebarOpenStatus && sidebarName.value === 'transfer-leave') {
      basicStore.setSidebarOpenStatus(false);
      basicStore.setSidebarName('');
      return;
    }

    basicStore.setSidebarOpenStatus(true);
    basicStore.setSidebarName('transfer-leave');
  }

  async function closeMediaBeforeLeave() {
    if (localUser.value.hasAudioStream) {
      await roomEngine.instance?.closeLocalMicrophone();
      await roomEngine.instance?.stopPushLocalAudio();
    }
    if (localUser.value.hasVideoStream) {
      await roomEngine.instance?.closeLocalCamera();
      await roomEngine.instance?.stopPushLocalVideo();
    }
  }

  return {
    t,
    basicStore,
    showLeaveRoom,
    sidebarName,
    roomStore,
    roomEngine,
    toggleMangeMemberSidebar,
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
  };
}
