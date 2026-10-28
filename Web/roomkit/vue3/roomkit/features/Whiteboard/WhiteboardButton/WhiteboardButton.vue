<script setup lang="ts">
import { inject, onBeforeUnmount } from 'vue';
import { DeviceStatus, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconWhiteboard, TUIMessageBox, TUIToast, t } from '../../../base';
import { useWhiteboardState } from '../WhiteboardState';
import { SCREEN_SHARE_ENTRY_KEY } from '../../ScreenShare/ScreenShareButton/useScreenShare';

/** Only works inside the default slot of `ScreenShareButton`; renders nothing of its own. */
defineOptions({ render: () => null });

const { screenStatus } = useDeviceState();
const { isWhiteboardOn, startWhiteboard, stopWhiteboard } = useWhiteboardState();

async function openBoard() {
  if (screenStatus.value === DeviceStatus.On || isWhiteboardOn.value) {
    TUIToast.warning(t('Whiteboard.CloseScreenShareFirst'));
    return;
  }
  try {
    await startWhiteboard();
  } catch (error: unknown) {
    console.warn('[WhiteboardButton] open whiteboard failed:', error);
  }
}

async function closeBoard() {
  const confirmed = await TUIMessageBox.danger({
    title: t('Whiteboard.CloseConfirmTitle'),
    message: t('Whiteboard.CloseConfirmContent'),
    confirmText: t('Whiteboard.Close'),
    cancelText: t('ScreenShare.Cancel'),
  });
  if (confirmed) {
    await stopWhiteboard();
  }
}

const register = inject(SCREEN_SHARE_ENTRY_KEY, null);
if (!register) {
  console.warn('[WhiteboardButton] place it inside <ScreenShareButton>.');
}
const unregister = register?.(() => ({
  act: 'whiteboard',
  label: t('ScreenShare.TabWhiteboard'),
  icon: IconWhiteboard,
  active: isWhiteboardOn.value,
  stopLabel: t('Whiteboard.Close'),
  run: () => void openBoard(),
  stop: () => void closeBoard(),
}));
onBeforeUnmount(() => unregister?.());
</script>
