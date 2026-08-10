import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import type { Ref } from 'vue';
import {
  DeviceStatus,
  useDeviceState,
  useWhiteboardState,
  WhiteboardStatus,
} from 'tuikit-atomicx-vue3/room';
import {
  clearLocalScreenSharePreviewConfirmation,
  confirmLocalScreenSharePreview,
  getLocalScreenShareSurface,
  isLocalScreenSharePreviewConfirmed,
  updateLocalScreenShareView,
} from '../../../adapter/screenSharePreview';

export function useLocalScreenSharePreview(
  screenShareViewRef: Ref<HTMLElement | undefined>,
) {
  const { screenStatus, stopScreenShare } = useDeviceState();
  const { whiteboardStatus, updateWhiteboard } = useWhiteboardState();
  const showPreviewWarning = ref(false);
  const isScreenSharePreviewReady = ref(false);

  const shouldShowPreviewWarning = computed(() =>
    showPreviewWarning.value
    && screenStatus.value === DeviceStatus.On
    && whiteboardStatus.value !== WhiteboardStatus.On,
  );

  function resetPreviewState(): void {
    clearLocalScreenSharePreviewConfirmation();
    showPreviewWarning.value = false;
    isScreenSharePreviewReady.value = false;
  }

  async function bindScreenSharePreview(view: HTMLElement): Promise<void> {
    await updateLocalScreenShareView(view);
    if (
      !isLocalScreenSharePreviewConfirmed()
      && whiteboardStatus.value !== WhiteboardStatus.On
    ) {
      const displaySurface = await getLocalScreenShareSurface();
      if (displaySurface === 'browser') {
        confirmLocalScreenSharePreview();
        showPreviewWarning.value = false;
      } else {
        showPreviewWarning.value = true;
      }
    }
    isScreenSharePreviewReady.value = isLocalScreenSharePreviewConfirmed();
  }
  async function bindLocalScreenViews(): Promise<void> {
    const view = screenShareViewRef.value;
    if (!view) {
      return;
    }

    if (screenStatus.value === DeviceStatus.On) {
      try {
        await bindScreenSharePreview(view);
      } catch (error) {
        isScreenSharePreviewReady.value = false;
        console.error('[useLocalScreenSharePreview] update screen share preview failed:', error);
      }
    }

    try {
      await updateWhiteboard({ view });
    } catch (error) {
      console.error('[useLocalScreenSharePreview] update whiteboard view failed:', error);
    }
  }

  function confirmScreenSharePreview(): void {
    confirmLocalScreenSharePreview();
    showPreviewWarning.value = false;
    isScreenSharePreviewReady.value = true;
  }

  async function stopScreenSharePreview(): Promise<void> {
    resetPreviewState();
    await stopScreenShare();
  }

  watch(
    [screenStatus, whiteboardStatus],
    ([status]) => {
      if (status === DeviceStatus.Off) {
        resetPreviewState();
      }
      bindLocalScreenViews();
    },
    { flush: 'post' },
  );

  onMounted(() => {
    bindLocalScreenViews();
  });

  onBeforeUnmount(() => {
    if (screenStatus.value === DeviceStatus.Off) {
      resetPreviewState();
    }
  });

  return {
    shouldShowPreviewWarning,
    isScreenSharePreviewReady,
    confirmScreenSharePreview,
    stopScreenSharePreview,
  };
}
