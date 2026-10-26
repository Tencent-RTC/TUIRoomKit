import { ref, watch } from 'vue';
import {
  RoomType,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { RoomLayoutTemplate } from '../../../core/types';

/** Conference-view layout template; owned by conference/index and passed down. */
const layoutTemplate = ref<RoomLayoutTemplate>(RoomLayoutTemplate.GridLayout);

/**
 * Mirror RoomLayoutView auto-switch rules for standard rooms:
 * - screen share present → sidebar speaker
 * - only one stream left → grid
 *
 * useRoomParticipantState() constructs CallEventManager. Conference/index calls
 * this hook while RoomKit is still mounting the entry overlay, so wait for a
 * roomId before touching participant state.
 */
export function useRoomLayoutState() {
  const { currentRoom } = useRoomState();

  watch(
    () => currentRoom.value?.roomId,
    (roomId, _previousRoomId, onCleanup) => {
      if (!roomId) {
        return;
      }
      const { participantList, participantWithScreen } = useRoomParticipantState();

      const stopScreenShare = watch(
        [
          () => currentRoom.value?.roomType,
          participantWithScreen,
        ],
        ([roomType, screenParticipant]) => {
          if (roomType === RoomType.Standard && screenParticipant) {
            layoutTemplate.value = RoomLayoutTemplate.SidebarLayout;
          }
        },
        { immediate: true },
      );

      const stopStreamCount = watch(
        () => participantList.value.length + (participantWithScreen.value ? 1 : 0),
        (streamCount) => {
          if (
            currentRoom.value?.roomType === RoomType.Standard
            && streamCount === 1
            && layoutTemplate.value !== RoomLayoutTemplate.GridLayout
          ) {
            layoutTemplate.value = RoomLayoutTemplate.GridLayout;
          }
        },
      );

      onCleanup(() => {
        stopScreenShare();
        stopStreamCount();
      });
    },
    { immediate: true },
  );

  function setLayoutTemplate(template: RoomLayoutTemplate) {
    layoutTemplate.value = template;
  }

  return {
    layoutTemplate,
    setLayoutTemplate,
  };
}
