import { computed, ref, watch } from 'vue';
import {
  DeviceStatus,
  RoomParticipantRole,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
  useWhiteboardState,
  WhiteboardStatus,
  WhiteboardTool,
} from 'tuikit-atomicx-vue3/room';
import type { WhiteboardToolStyle } from './constants';

const { whiteboardStatus, stopWhiteboard } = useWhiteboardState();
const { screenStatus } = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();

// Shared toolbar session state kept at module level. The screen tile is rendered
// through RoomView's `participantViewUI` scoped slot, so a layout change (e.g.
// entering/leaving the mini thumbnail region, or Sidebar <-> Grid) remounts the
// toolbar component. Module-level state survives those remounts within a session;
// it is reset when the whiteboard session ends (whiteboardStatus -> Off).
const selectedShape = ref<'rect' | 'ellipse'>('rect');
const toolStyles = ref<Partial<Record<WhiteboardTool, WhiteboardToolStyle>>>({});

watch(whiteboardStatus, (status) => {
  if (status === WhiteboardStatus.Off) {
    selectedShape.value = 'rect';
    toolStyles.value = {};
  }
});

// Standalone whiteboard: whiteboard is running while the local device is not
// really sharing its screen. Annotation: whiteboard runs over a real screen share.
const isStandaloneWhiteboard = computed(() =>
  whiteboardStatus.value === WhiteboardStatus.On && screenStatus.value === DeviceStatus.Off,
);

function setLocalWhiteboardScreen(on: boolean): void {
  const participant = localParticipant.value;
  if (participant) {
    participant.screenShareStatus = on ? DeviceStatus.On : DeviceStatus.Off;
  }
}

// Keep the local participant's screenShareStatus faked to `On` while a standalone
// whiteboard session is active so its tile stays mounted, and revert it when the
// session ends. `screenStatus` is read as a guard only (NOT a dependency): during
// annotation the real screen share must never be touched, and excluding it avoids
// a transient mis-fake at the moment a shared screen stops.
watch(
  () => [whiteboardStatus.value, localParticipant.value?.screenShareStatus] as const,
  ([status, participantScreen]) => {
    if (screenStatus.value === DeviceStatus.On) {
      return;
    }
    if (status === WhiteboardStatus.On && participantScreen !== DeviceStatus.On) {
      setLocalWhiteboardScreen(true);
    } else if (status === WhiteboardStatus.Off && participantScreen === DeviceStatus.On) {
      setLocalWhiteboardScreen(false);
    }
  },
  { immediate: true },
);

// Auto-stop the whiteboard when leaving the room.
watch(
  () => currentRoom.value?.roomId,
  (roomId, previousRoomId) => {
    if (previousRoomId && !roomId && whiteboardStatus.value === WhiteboardStatus.On) {
      stopWhiteboard();
    }
  },
);

// Auto-stop annotation when the underlying screen share ends.
watch(screenStatus, (status, previousStatus) => {
  if (
    previousStatus === DeviceStatus.On
    && status === DeviceStatus.Off
    && whiteboardStatus.value === WhiteboardStatus.On
  ) {
    stopWhiteboard();
  }
});

watch(
  () => currentRoom.value?.isAllScreenShareDisabled,
  (disabled, previousDisabled) => {
    if (
      disabled
      && !previousDisabled
      && isStandaloneWhiteboard.value
      && localParticipant.value?.role === RoomParticipantRole.GeneralUser
    ) {
      stopWhiteboard();
    }
  },
);

export function useWhiteboardToolbar() {
  return {
    selectedShape,
    toolStyles,
    isStandaloneWhiteboard,
  };
}
