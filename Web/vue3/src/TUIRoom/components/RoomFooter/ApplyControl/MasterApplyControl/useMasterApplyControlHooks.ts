import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useBasicStore } from '../../../../stores/basic';
import { useRoomStore } from '../../../../stores/room';
import useMasterApplyControl from '../../../../hooks/useMasterApplyControl';
import { useI18n } from '../../../../locales';
import TUINotification from '../../../common/base/Notification/index';
import { isMobile } from '../../../../utils/environment';

export default function useMasterApplyControlHooks() {
  const { t } = useI18n();
  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const { handleUserApply, handleAllUserApply } = useMasterApplyControl();
  const { showApplyUserList } = storeToRefs(basicStore);
  const { applyToAnchorList } = storeToRefs(roomStore);

  const applyToAnchorUserCount = computed(() => applyToAnchorList.value.length);
  const noUserApply = computed(() => applyToAnchorUserCount.value === 0);

  const handleConfirm = async (onlyOneUserTakeStage: boolean, userId: string) => {
    if (isMobile) {
      basicStore.setSidebarOpenStatus(true);
      basicStore.setSidebarName('apply');
    } else {
      if (onlyOneUserTakeStage) {
        handleUserApply(userId, true);
      } else {
        basicStore.setShowApplyUserList(true);
      }
    }
  };

  const handleCancel = async (onlyOneUserTakeStage: boolean, userId: string) => {
    if (!isMobile && onlyOneUserTakeStage) {
      handleUserApply(userId, false);
    }
  };

  watch(applyToAnchorUserCount, (newVal, oldVal) => {
    if (newVal <= oldVal) return;
    const onlyOneUserTakeStage = newVal === 1;
    const firstUser = applyToAnchorList.value[0];
    const userName = firstUser?.userName || firstUser?.userId;
    const message = onlyOneUserTakeStage
      ? `${userName} ${t('Applying for the stage')}`
      : `${userName} ${t('and so on number people applying to stage', { number: applyToAnchorList.value.length })}`;
    TUINotification({
      message,
      appendToRoomContainer: true,
      confirmButtonText: isMobile ? t('Check') : (onlyOneUserTakeStage ? t('Agree to the stage') : t('Check')),
      cancelButtonText: isMobile ? undefined : (onlyOneUserTakeStage ? t('Reject') : t('Neglect')),
      confirm: () => handleConfirm(onlyOneUserTakeStage, firstUser?.userId),
      cancel: () => handleCancel(onlyOneUserTakeStage, firstUser?.userId),
    });
  });

  function hideApplyList() {
    basicStore.setShowApplyUserList(false);
  }

  return {
    t,
    roomStore,
    showApplyUserList,
    hideApplyList,
    applyToAnchorUserCount,
    applyToAnchorList,
    handleAllUserApply,
    handleUserApply,
    noUserApply,
  };
}
