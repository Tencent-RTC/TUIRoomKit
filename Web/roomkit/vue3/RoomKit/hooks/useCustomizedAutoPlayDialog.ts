import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { useUIKit, TUIMessageBox } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomEngine } from 'tuikit-atomicx-vue3/room';

const roomEngine = useRoomEngine();

let isShowAutoPlayDialog = false;

export default function useCustomizedAutoPlayDialog() {
  const { t } = useUIKit();
  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onAutoPlayFailed, () => {
      if (!isShowAutoPlayDialog) {
        isShowAutoPlayDialog = true;
        TUIMessageBox.alert({
          title: t('RoomCommon.Attention'),
          content: t('RoomNotifications.AudioPlaybackFailed'),
          showClose: false,
          modal: false,
          confirmText: t('Confirm'),
          callback: () => {
            isShowAutoPlayDialog = false;
          },
        });
      }
    });
  });
}

export { useCustomizedAutoPlayDialog };
