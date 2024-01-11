import { computed, ref } from 'vue';
import { UserInfo, useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';

const showUserId = ref(''); // 需要展示操作面板的用户id

export default function useMemberItem(userInfo: UserInfo) {
  const roomStore = useRoomStore();
  const { isMaster, isAdmin } = storeToRefs(roomStore);
  // 是否有权限操作当前用户
  const isCanOperateCurrentMember = computed(() => {
    const isTargetUserRoomOwner = userInfo.userRole === TUIRole.kRoomOwner;
    const isTargetUserGeneral = userInfo.userRole === TUIRole.kGeneralUser;
    return (isMaster.value && !isTargetUserRoomOwner) || (isAdmin.value && isTargetUserGeneral);
  });
  const isMemberControlAccessible = computed(() => (
    userInfo.userId === showUserId.value) && isCanOperateCurrentMember.value); // 只有房主或管理员才打开操作面板

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


