import { computed } from 'vue';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantRole } from 'tuikit-atomicx-vue3';
import useRoomAudioAction from './useRoomAudioAction';
import useRoomScreenAction from './useRoomScreenAction';
import useRoomVideoAction from './useRoomVideoAction';

const { localParticipant } = useRoomParticipantState();

export default function useRoomActions() {
  const canOperate = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner || localParticipant.value?.role === RoomParticipantRole.Admin);
  const roomActionList = computed(() => {
    if (!canOperate.value) {
      return [];
    }
    return [useRoomAudioAction(), useRoomVideoAction(), useRoomScreenAction()];
  });

  return {
    canOperate,
    roomActionList,
  };
}
