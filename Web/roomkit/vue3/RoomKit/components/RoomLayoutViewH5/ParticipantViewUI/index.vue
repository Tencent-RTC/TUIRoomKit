<template>
  <div
    ref="streamCoverRef"
    class="stream-cover-container"
    :class="{
      border: activeSpeaking,
      'standalone-whiteboard': isScreenStream && isStandaloneWhiteboard,
    }"
    @contextmenu.prevent
  >
    <div
      v-if="isScreenStream"
      ref="whiteboardViewRef"
      :class="['whiteboard-view', { active: ownsWhiteboardSession }]"
      :style="whiteboardViewStyle"
      @click.stop
      @pointerdown.stop
      @pointermove.stop
      @pointerup.stop
      @pointercancel.stop
      @touchstart="handleWhiteboardTouchStart"
      @touchmove="handleWhiteboardTouchMove"
      @touchend="handleWhiteboardTouchEnd"
      @touchcancel="handleWhiteboardTouchCancel"
    />
    <WhiteboardDockH5
      v-if="showAnnotationDock"
      ref="whiteboardDockRef"
      :view-el="whiteboardViewRef"
      :participant-user-id="participant.userId"
    />
    <div
      v-if="
        streamType === VideoStreamType.Camera &&
        participant.cameraStatus === DeviceStatus.Off
      "
      class="center-user-info-container"
    >
      <Avatar
        class="avatar-region"
        size="xl"
        :src="participant.avatarUrl"
        :user-id="participant.userId"
      />
    </div>
    <div
      v-if="!(isScreenStream && isStandaloneWhiteboard)"
      class="corner-user-info-container"
    >
      <div
        v-if="showIcon"
        :class="showMasterIcon ? 'master-icon' : 'admin-icon'"
      >
        <IconUser />
      </div>
      <div v-if="!isScreenStream" :class="['audio-icon-container']">
        <div class="audio-level-container">
          <div class="audio-level" :style="audioLevelStyle"></div>
        </div>
        <IconMicOff
          v-if="participant.microphoneStatus === DeviceStatus.Off"
          class="audio-icon"
          size="20"
        />
        <IconMicOn v-else class="audio-icon" size="20" />
      </div>
      <IconScreenOpen v-if="isScreenStream" class="screen-icon" size="18" />
      <span :class="['user-name', 'is-pc']" :title="displayName">
        {{ displayName }}
      </span>
      <span v-if="isScreenStream" class="screen-info">
        {{ t('RoomView.IsSharingTheirScreen') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import {
  IconScreenOpen,
  IconUser,
  IconMicOff,
  IconMicOn,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  Avatar,
  RoomType,
  RoomParticipantRole,
  DeviceStatus,
  VideoStreamType,
  useRoomParticipantState,
  useRoomState,
  useWhiteboardState,
  WhiteboardStatus,
  WhiteboardTool,
} from 'tuikit-atomicx-vue3/room';
import { conference } from '../../../adapter/conference';
import { BuiltinWidget } from '../../../adapter/type';
import { useWhiteboardSessionContext } from '../../Whiteboard/useWhiteboardSessionContext';
import { useWhiteboardToolbar } from '../../Whiteboard/useWhiteboardToolbar';
import WhiteboardDockH5 from '../../Whiteboard/WhiteboardDockH5.vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { currentRoom } = useRoomState();

interface Props {
  participant: RoomParticipant;
  streamType: VideoStreamType;
}
const props = defineProps<Props>();

const {
  speakingUsers,
  localParticipant,
} = useRoomParticipantState();
const {
  whiteboardStatus,
  currentToolConfig,
  setToolConfig,
  updateWhiteboard,
} = useWhiteboardState();
const {
  sessionOwnerUserId,
  isHostWhiteboard,
  isGuestWhiteboard,
} = useWhiteboardSessionContext();
const { isStandaloneWhiteboard } = useWhiteboardToolbar();

const WHITEBOARD_ASPECT_RATIO = 16 / 9;
const streamCoverRef = ref<HTMLElement>();
const whiteboardViewRef = ref<HTMLElement>();
const whiteboardDockRef = ref<InstanceType<typeof WhiteboardDockH5>>();
const whiteboardViewStyle = ref<Record<string, string>>({});
let resizeObserver: ResizeObserver | null = null;
let isWhiteboardPinchGesture = false;

// Drawing tools own single-finger touches; the select tool leaves them to the
// tile so the shared screen can still be panned and swiped.
const isWhiteboardDrawing = computed(() =>
  currentToolConfig.value.tool !== WhiteboardTool.None,
);

// Pinch-to-zoom scales the tile through a CSS transform while the whiteboard
// keeps its own coordinate mapping, so strokes drawn during the gesture drift
// away from the fingers. Fall back to the select tool and collapse the toolbar
// so a two-finger gesture only ever zooms.
function beginWhiteboardPinchGesture() {
  if (isWhiteboardPinchGesture) {
    return;
  }
  isWhiteboardPinchGesture = true;
  whiteboardDockRef.value?.collapse();
  if (!isWhiteboardDrawing.value) {
    return;
  }
  setToolConfig({ tool: WhiteboardTool.None }).catch((error) => {
    console.error('[ParticipantViewUIH5] reset whiteboard tool on pinch failed:', error);
  });
}

function handleWhiteboardTouchStart(event: TouchEvent) {
  if (event.touches.length >= 2) {
    beginWhiteboardPinchGesture();
    return;
  }
  if (isWhiteboardDrawing.value) {
    event.stopPropagation();
  }
}

function handleWhiteboardTouchMove(event: TouchEvent) {
  if (isWhiteboardPinchGesture || event.touches.length >= 2) {
    beginWhiteboardPinchGesture();
    return;
  }
  if (!isWhiteboardDrawing.value) {
    return;
  }
  event.stopPropagation();
  event.preventDefault();
}

function handleWhiteboardTouchEnd(event: TouchEvent) {
  if (isWhiteboardPinchGesture) {
    if (event.touches.length === 0) {
      isWhiteboardPinchGesture = false;
    }
    return;
  }
  if (isWhiteboardDrawing.value) {
    event.stopPropagation();
  }
}

function handleWhiteboardTouchCancel(event: TouchEvent) {
  if (isWhiteboardPinchGesture) {
    isWhiteboardPinchGesture = false;
    return;
  }
  if (isWhiteboardDrawing.value) {
    event.stopPropagation();
  }
}

const activeSpeaking = computed(() => {
  const hasSpeakVolume = speakingUsers.value.get(props.participant.userId);
  if (!hasSpeakVolume) {
    return false;
  } else
  return hasSpeakVolume > 0 && props.streamType === VideoStreamType.Camera && props.participant.microphoneStatus !== DeviceStatus.Off;
});

const speakingAudioVolume = computed(
  () => speakingUsers.value.get(props.participant.userId) || 0
);

const audioLevelStyle = computed(() => {
  if (
    props.participant.microphoneStatus === DeviceStatus.Off ||
    !activeSpeaking.value
  ) {
    return '';
  }
  return `height: ${speakingAudioVolume.value * 4}%`;
});

const displayName = computed(
  () =>
    props.participant.nameCard ||
    props.participant.userName ||
    props.participant.userId
);

const showMasterIcon = computed(() => {
  const { role } = props.participant;
  return (
    role === RoomParticipantRole.Owner &&
    props.streamType === VideoStreamType.Camera
  );
});

const showAdminIcon = computed(() => {
  const { role } = props.participant;
  return (
    role === RoomParticipantRole.Admin &&
    props.streamType === VideoStreamType.Camera
  );
});

const showIcon = computed(() => showMasterIcon.value || showAdminIcon.value);
const isScreenStream = computed(
  () => props.streamType === VideoStreamType.Screen
);

const isLocalParticipant = computed(() =>
  props.participant.userId === localParticipant.value?.userId,
);
const ownsWhiteboardSession = computed(() => {
  if (!isScreenStream.value) {
    return false;
  }
  if (isLocalParticipant.value) {
    return isHostWhiteboard.value;
  }
  return isGuestWhiteboard.value
    && sessionOwnerUserId.value === props.participant.userId;
});
const showAnnotationDock = computed(() =>
  isScreenStream.value
  && currentRoom.value?.roomType !== RoomType.Webinar
  && conference.getWidgetVisible(BuiltinWidget.AnnotationWidget)
  && (
    whiteboardStatus.value === WhiteboardStatus.Off
    || ownsWhiteboardSession.value
  ),
);

function updateWhiteboardViewRect() {
  const container = streamCoverRef.value;
  if (!container || !isScreenStream.value) {
    return;
  }

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  if (!containerWidth || !containerHeight) {
    return;
  }

  let width = containerWidth;
  let height = Math.round(width / WHITEBOARD_ASPECT_RATIO);
  if (height > containerHeight) {
    height = containerHeight;
    width = Math.round(height * WHITEBOARD_ASPECT_RATIO);
  }

  whiteboardViewStyle.value = {
    width: `${width}px`,
    height: `${height}px`,
    left: `${Math.round((containerWidth - width) / 2)}px`,
    top: `${Math.round((containerHeight - height) / 2)}px`,
  };
}

async function bindWhiteboardView() {
  updateWhiteboardViewRect();
  await nextTick();

  const view = whiteboardViewRef.value;
  if (!ownsWhiteboardSession.value || !view) {
    return;
  }
  try {
    await updateWhiteboard({
      view,
    });
  } catch (error) {
    console.error('[ParticipantViewUIH5] update whiteboard view failed:', error);
  }
}

watch(
  [ownsWhiteboardSession, whiteboardViewRef],
  () => {
    void bindWhiteboardView();
  },
  { flush: 'post', immediate: true },
);

onMounted(() => {
  updateWhiteboardViewRect();
  if (streamCoverRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateWhiteboardViewRect();
    });
    resizeObserver.observe(streamCoverRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style lang="scss" scoped>
.stream-cover-container {
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;

  * {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  $border-width: 2px;

  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: $border-width solid transparent;
  border-radius: 8px;
  pointer-events: none;
  z-index: 1;
  transform: translateZ(0);
  will-change: transform;

  &.standalone-whiteboard {
    background: #fff;
  }

  &.border {
    border: $border-width solid var(--uikit-color-green-5);
  }

  .whiteboard-view {
    position: absolute;
    z-index: 1;
    pointer-events: none;

    &.active {
      pointer-events: auto;
    }
  }

  .center-user-info-container {
    position: absolute;
    top: 0 - $border-width;
    left: 0 - $border-width;
    width: calc(100% + $border-width * 2);
    height: calc(100% + $border-width * 2);
    background-color: var(--bg-color-operate);

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      content: '';
      background-color: var(--bg-color-operate);
    }

    .avatar-region {
      position: absolute;
      top: 50%;
      left: 50%;
      max-width: 96px;
      max-height: 96px;
      transform: translate(-50%, -50%);
    }
  }

  .corner-user-info-container {
    position: absolute;
    bottom: 4px;
    left: 4px;
    display: flex;
    align-content: center;
    align-items: center;
    box-sizing: border-box;
    max-width: calc(100% - 8px);
    padding-right: 10px;
    height: 24px;
    overflow: hidden;
    font-size: 14px;
    color: var(--uikit-color-white-1);
    border-radius: 16px;
    background-color: var(--uikit-color-black-5);
    z-index: 2;

    .master-icon,
    .admin-icon {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin-left: 0;
      border-radius: 50%;
      background-color: var(--button-color-primary-default);
    }

    .admin-icon {
      background-color: var(--text-color-warning);
    }

    .audio-icon-container {
      margin-left: 4px;
      position: relative;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      min-width: 20px;
      &:first-child {
        margin-left: 8px;
      }
      .audio-level-container {
        position: absolute;
        top: 2px;
        left: 6px;
        display: flex;
        flex-flow: column-reverse wrap;
        justify-content: space-between;
        width: 8px;
        height: 12px;
        overflow: hidden;
        border-radius: 4px;

        .audio-level {
          width: 100%;
          background-color: var(--text-color-success);
          transition: height 0.2s;
        }
      }

      .audio-icon {
        position: absolute;
        top: 0;
        left: 0;
      }
    }

    .user-name {
      margin-left: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .screen-icon {
      flex-shrink: 0;
      min-width: 0;
      color: var(--uikit-color-white-1);
      margin-left: 4px;
      margin-right: 2px;
    }

    .screen-info {
      margin-left: 4px;
      font-size: 12px;
      color: var(--uikit-color-white-1);
      flex-shrink: 0;
      min-width: 0;
    }
  }
}
</style>
