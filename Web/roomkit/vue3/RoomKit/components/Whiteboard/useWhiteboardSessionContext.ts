import { computed, ref, watch } from 'vue';
import {
  useRoomParticipantState,
  useWhiteboardState,
  WhiteboardStatus,
} from 'tuikit-atomicx-vue3/room';

const { whiteboardStatus } = useWhiteboardState();
const { localParticipant, participantWithScreen } = useRoomParticipantState();

// Capture the owner once per session. participantWithScreen becomes empty before
// guest teardown finishes when a remote presenter stops sharing; keeping the
// owner stable prevents that short interval from being mistaken for a host
// standalone whiteboard.
const sessionOwnerUserId = ref<string | null>(null);

watch(whiteboardStatus, (status) => {
  if (status === WhiteboardStatus.Off) {
    sessionOwnerUserId.value = null;
    return;
  }

  if (sessionOwnerUserId.value === null) {
    sessionOwnerUserId.value = participantWithScreen.value?.userId
      ?? localParticipant.value?.userId
      ?? null;
  }
}, { flush: 'sync', immediate: true });

const isHostWhiteboard = computed(() =>
  whiteboardStatus.value === WhiteboardStatus.On
  && sessionOwnerUserId.value !== null
  && sessionOwnerUserId.value === localParticipant.value?.userId,
);

const isGuestWhiteboard = computed(() =>
  whiteboardStatus.value === WhiteboardStatus.On
  && sessionOwnerUserId.value !== null
  && sessionOwnerUserId.value !== localParticipant.value?.userId,
);

export function useWhiteboardSessionContext() {
  return {
    sessionOwnerUserId,
    isHostWhiteboard,
    isGuestWhiteboard,
  };
}
