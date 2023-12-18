import { computed, ref } from 'vue';
import { useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';

const showUserId = ref(''); // 需要展示操作面板的用户id
export default function useMemberItem(userId: string) {
  const roomStore = useRoomStore();
  const { isMaster } = storeToRefs(roomStore);
  const isMemberControlAccessible = computed(() => (userId === showUserId.value) && isMaster.value); // 只有房主才打开操作面板
  function openMemberControl() {
    showUserId.value = userId;
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


