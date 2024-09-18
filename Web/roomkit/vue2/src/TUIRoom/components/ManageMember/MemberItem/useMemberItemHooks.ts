import { computed, ref } from 'vue';
import { UserInfo, useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';

// The user ID that needs to display the operation panel
const showUserId = ref('');

export default function useMemberItem(userInfo: UserInfo) {
  const roomStore = useRoomStore();
  const { isMaster, isAdmin } = storeToRefs(roomStore);
  // Does the current user have permission to operate
  const isCanOperateCurrentMember = computed(() => {
    const isTargetUserRoomOwner = userInfo.userRole === TUIRole.kRoomOwner;
    const isTargetUserGeneral = userInfo.userRole === TUIRole.kGeneralUser;
    const isTargetUserMySelf = userInfo.userId === roomStore.localUser.userId;
    return (
      (isMaster.value && !isTargetUserRoomOwner) ||
      (isAdmin.value && isTargetUserGeneral) ||
      isTargetUserMySelf
    );
  });

  const isCanOperateMySelf = computed(() => {
    return userInfo.userId === roomStore.localUser.userId;
  });
  const isMemberControlAccessible = computed(
    () =>
      userInfo.userId === showUserId.value &&
      (isCanOperateMySelf.value || isCanOperateCurrentMember.value)
  );

  function openMemberControl() {
    showUserId.value = userInfo.userId;
  }

  function closeMemberControl() {
    showUserId.value = '';
  }

  return {
    isMemberControlAccessible,
    openMemberControl,
    closeMemberControl,
    isCanOperateMySelf,
  };
}
