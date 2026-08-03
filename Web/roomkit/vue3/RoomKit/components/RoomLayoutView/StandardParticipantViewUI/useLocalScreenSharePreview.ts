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
  const { whiteboardStatus } = useWhiteboardState();
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

  async function bindScreenSharePreview(): Promise<void> {
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
      isScreenSharePreviewReady.value = isLocalScreenSharePreviewConfirmed();
    } catch (error) {
      isScreenSharePreviewReady.value = false;
      console.error('[useLocalScreenSharePreview] update screen share preview failed:', error);
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
      bindScreenSharePreview();
    },
    { flush: 'post' },
  );

  onMounted(() => {
    bindScreenSharePreview();
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
