<script setup lang="ts">
import { inject, onBeforeUnmount } from 'vue';
import { IconWhiteboard, TUIMessageBox, t } from '../../../base';
import { useWhiteboardState } from '../WhiteboardState';
import { SCREEN_SHARE_ENTRY_KEY, useScreenShare } from '../../ScreenShare/useScreenShare';

/** Only works inside the default slot of `ScreenShareButton`; renders nothing of its own. */
defineOptions({ render: () => null });

const { holder } = useScreenShare();
const { startWhiteboard, stopWhiteboard } = useWhiteboardState();

/** The share control only offers the board while the slot is free and the user may take it. */
async function openBoard() {
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
  command: 'whiteboard',
  label: t('ScreenShare.TabWhiteboard'),
  icon: IconWhiteboard,
  // From the click on, like every other reader of the slot, so the control and the more menu agree.
  active: holder.value === 'local-board',
  stopLabel: t('Whiteboard.Close'),
  run: () => void openBoard(),
  stop: () => void closeBoard(),
}));
onBeforeUnmount(() => unregister?.());
</script>
