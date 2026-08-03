<template>
  <div
    ref="remoteScreenContainerRef"
    class="remote-screen-container"
    :style="whiteboardCursor ? { cursor: whiteboardCursor } : undefined"
  >
    <ParticipantViewUI
      :participant="participant"
      :stream-type="streamType"
    />
    <WhiteboardDock
      v-if="showAnnotationDock"
      :container-el="remoteScreenContainerRef"
      :view-el="whiteboardViewEl"
      :participant-user-id="participant.userId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  useWhiteboardState,
  useRoomState,
  RoomType,
  VideoStreamType,
  WhiteboardStatus,
  WhiteboardTool,
} from 'tuikit-atomicx-vue3/room';
import { conference } from '../../../adapter/conference';
import { BuiltinWidget } from '../../../adapter/type';
import { WHITEBOARD_TOOL_CURSORS } from '../../Whiteboard/constants';
import { useWhiteboardSessionContext } from '../../Whiteboard/useWhiteboardSessionContext';
import { useWhiteboardToolbar } from '../../Whiteboard/useWhiteboardToolbar';
import WhiteboardDock from '../../Whiteboard/WhiteboardDock.vue';
import ParticipantViewUI from './ParticipantViewUI.vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const { sessionOwnerUserId } = useWhiteboardSessionContext();
const { isGuestWhiteboard } = useWhiteboardToolbar();
const { currentRoom } = useRoomState();

const MINI_REGION_MAX_HEIGHT = 200;

const props = defineProps<{
  participant: RoomParticipant;
  streamType: VideoStreamType;
  annotationDisabled?: boolean;
}>();

const {
  whiteboardStatus,
  currentToolConfig,
  updateWhiteboard,
  setToolConfig,
} = useWhiteboardState();

const remoteScreenContainerRef = ref<HTMLElement>();
const whiteboardViewEl = ref<HTMLElement>();
// The tile is too small to host the annotation dock; unmount it while mini.
const isMiniRegion = ref(false);

const ownsGuestSession = computed(() =>
  isGuestWhiteboard.value
  && sessionOwnerUserId.value === props.participant.userId,
);

const showAnnotationDock = computed(() =>
  !props.annotationDisabled
  && !isMiniRegion.value
  && currentRoom.value?.roomType !== RoomType.Webinar
  && conference.getWidgetVisible(BuiltinWidget.AnnotationWidget)
  && (
    whiteboardStatus.value === WhiteboardStatus.Off
    || ownsGuestSession.value
  ),
);

const whiteboardCursor = computed(() =>
  !props.annotationDisabled
  && ownsGuestSession.value
    ? WHITEBOARD_TOOL_CURSORS[currentToolConfig.value.tool] ?? 'default'
    : '',
);

function resolveWhiteboardView(): HTMLElement | undefined {
  // StreamPlay renders the remote screen into the RoomParticipantView root
  // (parent of this overlay). The whiteboard plugin must share that container
  // so its previewCanvas sits on top of the already-playing video.
  return remoteScreenContainerRef.value?.parentElement ?? remoteScreenContainerRef.value;
}

async function bindGuestWhiteboardView() {
  const view = resolveWhiteboardView();
  whiteboardViewEl.value = view;
  if (!view || !ownsGuestSession.value) {
    return;
  }
  try {
    await updateWhiteboard({
      view,
    });
  } catch (error) {
    console.error('[RemoteScreenViewUI] update whiteboard view failed:', error);
  }
}

// While the tile is mini the annotation dock unmounts, so also drop drawing mode
// to avoid stray strokes on the thumbnail.
watch(isMiniRegion, (mini) => {
  if (
    mini
    && ownsGuestSession.value
    && currentToolConfig.value.tool !== WhiteboardTool.None
  ) {
    void setToolConfig({ tool: WhiteboardTool.None });
  }
});

watch(
  ownsGuestSession,
  (owned) => {
    if (owned) {
      void bindGuestWhiteboardView();
    }
  },
  { flush: 'post' },
);

const resizeObserver = new ResizeObserver(() => {
  isMiniRegion.value = (remoteScreenContainerRef.value?.offsetHeight ?? 0) <= MINI_REGION_MAX_HEIGHT;
});

onMounted(() => {
  if (remoteScreenContainerRef.value) {
    resizeObserver.observe(remoteScreenContainerRef.value);
  }
  whiteboardViewEl.value = resolveWhiteboardView();
  void bindGuestWhiteboardView();
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();
});
</script>

<style lang="scss" scoped>
.remote-screen-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
