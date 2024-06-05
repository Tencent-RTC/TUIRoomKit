import { computed, ref } from 'vue';
import { UserInfo, useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { TUIRole } from '@tencentcloud/tuiroom-engine-electron';

// The user ID that needs to display the operation panel
const showUserId = ref('');

export default function useMemberItem(userInfo: UserInfo) {
  const roomStore = useRoomStore();
  const { isMaster, isAdmin } = storeToRefs(roomStore);
  // Does the current user have permission to operate
  const isCanOperateCurrentMember = computed(() => {
    const isTargetUserRoomOwner = userInfo.userRole === TUIRole.kRoomOwner;
    const isTargetUserGeneral = userInfo.userRole === TUIRole.kGeneralUser;
    return (isMaster.value && !isTargetUserRoomOwner) || (isAdmin.value && isTargetUserGeneral);
  });
  const isMemberControlAccessible = computed(() => (
    // Only the homeowner or administrator can open the control panel
    userInfo.userId === showUserId.value) && isCanOperateCurrentMember.value);

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
  };
}


