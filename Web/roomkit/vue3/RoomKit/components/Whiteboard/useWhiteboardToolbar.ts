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
import {
  DEFAULT_TOOL_STYLE,
  WHITEBOARD_GUEST_COLOR_PALETTE,
} from './constants';
import { useWhiteboardSessionContext } from './useWhiteboardSessionContext';
import type { WhiteboardToolStyle } from './constants';

const {
  whiteboardStatus,
  stopWhiteboard,
} = useWhiteboardState();
const { screenStatus } = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant, participantWithScreen } = useRoomParticipantState();
const {
  sessionOwnerUserId,
  isHostWhiteboard,
  isGuestWhiteboard,
} = useWhiteboardSessionContext();

// Shared toolbar session state kept at module level. The screen tile is rendered
// through RoomView's `participantViewUI` scoped slot, so a layout change (e.g.
// entering/leaving the mini thumbnail region, or Sidebar <-> Grid) remounts the
// toolbar component. Module-level state survives those remounts within a session;
// it is reset when the whiteboard session ends (whiteboardStatus -> Off).
const selectedShape = ref<'rect' | 'ellipse'>('rect');
const toolStyles = ref<Partial<Record<WhiteboardTool, WhiteboardToolStyle>>>({});
const isToolbarExpanded = ref(false);
// Screen annotation arms no tool, so the first opening is what starts drawing.
// Later an unarmed whiteboard means the user picked the select tool instead.
const hasOpenedToolbar = ref(false);

function getGuestDefaultColor(userId: string): string {
  let hash = 2166136261;
  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return WHITEBOARD_GUEST_COLOR_PALETTE[
    (hash >>> 0) % WHITEBOARD_GUEST_COLOR_PALETTE.length
  ];
}

const defaultToolStyle = computed<WhiteboardToolStyle>(() => {
  if (!isGuestWhiteboard.value) {
    return DEFAULT_TOOL_STYLE;
  }
  return {
    ...DEFAULT_TOOL_STYLE,
    color: getGuestDefaultColor(localParticipant.value?.userId ?? ''),
  };
});

watch(whiteboardStatus, (status) => {
  if (status === WhiteboardStatus.Off) {
    selectedShape.value = 'rect';
    toolStyles.value = {};
    isToolbarExpanded.value = false;
    hasOpenedToolbar.value = false;
  }
});

// Standalone whiteboard: local host whiteboard while the device is not really
// sharing its screen. Guest sessions must not be treated as standalone.
const isStandaloneWhiteboard = computed(() =>
  isHostWhiteboard.value
  && screenStatus.value === DeviceStatus.Off,
);

function setLocalWhiteboardScreen(on: boolean): void {
  const participant = localParticipant.value;
  if (participant) {
    participant.screenShareStatus = on ? DeviceStatus.On : DeviceStatus.Off;
  }
}

// Keep the local participant's screenShareStatus faked to `On` while a standalone
// whiteboard session is active so its tile stays mounted, and revert it when the
// session ends. Guest sessions never fake local screen status. `screenStatus` is
// read as a guard only (NOT a dependency): during annotation the real screen
// share must never be touched, and excluding it avoids a transient mis-fake at
// the moment a shared screen stops.
watch(
  () => [
    whiteboardStatus.value,
    sessionOwnerUserId.value,
    localParticipant.value?.screenShareStatus,
  ] as const,
  ([status, ownerUserId, participantScreen]) => {
    const isGuest = ownerUserId !== null
      && ownerUserId !== localParticipant.value?.userId;
    if (screenStatus.value === DeviceStatus.On || isGuest) {
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

// Auto-stop host annotation when the underlying local screen share ends.
watch(screenStatus, (status, previousStatus) => {
  if (
    previousStatus === DeviceStatus.On
    && status === DeviceStatus.Off
    && isHostWhiteboard.value
  ) {
    stopWhiteboard();
  }
});

// Auto-stop guest annotation when the remote host stops sharing / leaves.
watch(
  () => participantWithScreen.value?.userId,
  (hostUserId, previousHostUserId) => {
    if (
      !isGuestWhiteboard.value
      || !sessionOwnerUserId.value
    ) {
      return;
    }
    const target = sessionOwnerUserId.value;
    const lostTarget = previousHostUserId === target && hostUserId !== target;
    const idleWithoutTarget = !hostUserId;
    if (lostTarget || idleWithoutTarget) {
      stopWhiteboard();
    }
  },
);

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
    defaultToolStyle,
    isToolbarExpanded,
    hasOpenedToolbar,
    isStandaloneWhiteboard,
    isGuestWhiteboard,
  };
}
