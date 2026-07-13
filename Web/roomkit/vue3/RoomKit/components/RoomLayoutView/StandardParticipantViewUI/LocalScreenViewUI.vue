<template>
  <div ref="localScreenContainerRef" class="local-screen-container">
    <div
      id="screen-share-view"
      ref="screenShareViewRef"
      :class="['screen-share-view', { 'whiteboard-view': isStandaloneWhiteboard }]"
      :style="whiteboardCursor ? { cursor: whiteboardCursor } : undefined"
    />
    <div v-if="shouldShowPreviewWarning" class="screen-preview-warning">
      <div class="screen-preview-warning-title">
        {{ t('ScreenShare.LocalPreviewWarningTitle') }}
      </div>
      <div class="screen-preview-warning-content">
        {{ t('ScreenShare.LocalPreviewWarningContent') }}
      </div>
      <div class="screen-preview-warning-actions">
        <TUIButton type="primary" @click="handleContinuePreview">
          {{ t('ScreenShare.ContinueLocalPreview') }}
        </TUIButton>
        <TUIButton type="default" @click="handleStopPreview">
          {{ t('ScreenShare.StopPresenting') }}
        </TUIButton>
      </div>
    </div>
    <WhiteboardDock
      v-if="showAnnotationDock"
      :container-el="localScreenContainerRef"
      :view-el="screenShareViewRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  TUIButton,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { DeviceStatus, useDeviceState, useWhiteboardState, WhiteboardStatus, WhiteboardTool } from 'tuikit-atomicx-vue3/room';
import { conference } from '../../../adapter/conference';
import {
  clearLocalScreenSharePreviewConfirmation,
  confirmLocalScreenSharePreview,
  getLocalScreenShareSurface,
  isLocalScreenSharePreviewConfirmed,
  updateLocalScreenShareView,
} from '../../../adapter/screenSharePreview';
import { BuiltinWidget } from '../../../adapter/type';
import { WHITEBOARD_TOOL_CURSORS } from '../../Whiteboard/constants';
import { useWhiteboardToolbar } from '../../Whiteboard/useWhiteboardToolbar';
import WhiteboardDock from '../../Whiteboard/WhiteboardDock.vue';

const MINI_REGION_MAX_HEIGHT = 200;

const { t } = useUIKit();
const { screenStatus, stopScreenShare } = useDeviceState();
const {
  whiteboardStatus,
  currentToolConfig,
  updateWhiteboard,
  setToolConfig,
} = useWhiteboardState();
const { isStandaloneWhiteboard } = useWhiteboardToolbar();
const localScreenContainerRef = ref<HTMLElement>();
const screenShareViewRef = ref<HTMLElement>();
// The tile is too small to host the annotation dock; unmount it while mini.
const isMiniRegion = ref(false);
const showPreviewWarning = ref(false);
const shouldShowPreviewWarning = computed(() =>
  showPreviewWarning.value
  && screenStatus.value === DeviceStatus.On
  && whiteboardStatus.value !== WhiteboardStatus.On,
);
const showAnnotationDock = computed(() =>
  !isMiniRegion.value
  && !shouldShowPreviewWarning.value
  && conference.getWidgetVisible(BuiltinWidget.AnnotationWidget),
);
const whiteboardCursor = computed(() =>
  whiteboardStatus.value === WhiteboardStatus.On
    ? WHITEBOARD_TOOL_CURSORS[currentToolConfig.value.tool] ?? 'default'
    : '',
);

async function bindScreenSharePreview() {
  if (
    screenStatus.value !== DeviceStatus.On
    || whiteboardStatus.value === WhiteboardStatus.On
    || !screenShareViewRef.value
  ) {
    return;
  }
  try {
    await updateLocalScreenShareView(screenShareViewRef.value);
    if (!isLocalScreenSharePreviewConfirmed()) {
      const displaySurface = await getLocalScreenShareSurface();
      if (displaySurface === 'browser') {
        confirmLocalScreenSharePreview();
        showPreviewWarning.value = false;
      } else {
        showPreviewWarning.value = true;
      }
    }
  } catch (error) {
    console.error('[LocalScreenViewUI] update screen share preview failed:', error);
  }
}

async function handleContinuePreview() {
  confirmLocalScreenSharePreview();
  showPreviewWarning.value = false;
}

async function handleStopPreview() {
  clearLocalScreenSharePreviewConfirmation();
  await stopScreenShare();
}

watch(
  [screenStatus, whiteboardStatus],
  ([status]) => {
    if (status === DeviceStatus.Off) {
      clearLocalScreenSharePreviewConfirmation();
      showPreviewWarning.value = false;
    }
    bindScreenSharePreview();
  },
  { flush: 'post' },
);

// While the tile is mini the annotation dock unmounts, so also drop drawing mode
// to avoid stray strokes on the thumbnail.
watch(isMiniRegion, (mini) => {
  if (
    mini
    && whiteboardStatus.value === WhiteboardStatus.On
    && currentToolConfig.value.tool !== WhiteboardTool.None
  ) {
    void setToolConfig({ tool: WhiteboardTool.None });
  }
});

const resizeObserver = new ResizeObserver(() => {
  isMiniRegion.value = (localScreenContainerRef.value?.offsetHeight ?? 0) <= MINI_REGION_MAX_HEIGHT;
});

onMounted(() => {
  if (localScreenContainerRef.value) {
    resizeObserver.observe(localScreenContainerRef.value);
  }
  if (screenShareViewRef.value) {
    updateWhiteboard({ view: screenShareViewRef.value });
  }
  bindScreenSharePreview();
});
onBeforeUnmount(() => {
  if (screenStatus.value === DeviceStatus.Off) {
    clearLocalScreenSharePreviewConfirmation();
  }
  resizeObserver.disconnect();
});
</script>

<style lang="scss" scoped>
.local-screen-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  // The TRTC preview injects inline `position: relative`; keep this tile anchored.
  position: absolute !important;
  top: 0;
  left: 0;
  background-color: var(--bg-color-bubble-reciprocal);

  &::before {
    width: 100%;
    height: 100%;
    content: '';
    background-color: var(--bg-color-bubble-reciprocal);
  }

  .screen-share-view {
    position: absolute !important;
    inset: 0;
    width: 100%;
    height: 100%;

    &.whiteboard-view {
      :deep(video) {
        background-color: #fff !important;
        height: auto !important;
      }
    }
  }

  .screen-preview-warning {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #fff;
    text-align: center;
    background-color: rgba(0, 0, 0, .62);
    user-select: none;
    font-size: 16px;

  }

  .screen-preview-warning-title {
    margin-bottom: 20px;
    font-size: 26px;
    line-height: 1.4;
  }

  .screen-preview-warning-content {
    max-width: 1000px;
    margin-bottom: 40px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0;
    line-height: 1.25rem;
  }

  .screen-preview-warning-actions {
    display: flex;
    gap: 24px;
    justify-content: center;
  }

}
</style>
