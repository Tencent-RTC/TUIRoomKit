import { onScopeDispose } from 'vue';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, t } from '../../../base';
import type { MessageBoxHandle } from '../../../base';

interface AutoPlayFailedEvent {
  resume?: () => void;
}

/**
 * Browser autoplay policy blocks remote audio until a gesture. The engine reports
 * that once per stream; one dialog resumes every pending callback.
 * Subscribe once the engine exists. The event does not depend on the room record.
 */
export function useAutoPlayDialog() {
  const roomEngine = useRoomEngine();
  const pendingResumes = new Set<() => void>();
  let showing = false;
  let box: MessageBoxHandle | null = null;
  let disposed = false;

  function onAutoPlayFailed(event?: AutoPlayFailedEvent) {
    if (event?.resume) {
      pendingResumes.add(event.resume);
    }
    if (showing) {
      return;
    }
    showing = true;
    box = TUIMessageBox.alert({
      title: t('RoomNotifications.AudioPlaybackFailedTitle'),
      message: t('RoomNotifications.AudioPlaybackFailed'),
      confirmText: t('RoomNotifications.AudioPlaybackContinue'),
      closable: false,
      closeOnOverlay: false,
      callback: (action) => {
        showing = false;
        box = null;
        if (action === 'confirm') {
          pendingResumes.forEach(resume => resume());
        }
        pendingResumes.clear();
      },
    });
  }

  function attach() {
    if (disposed) {
      return;
    }
    const engine = roomEngine.instance;
    if (!engine) {
      return;
    }
    engine.off(TUIRoomEvents.onAutoPlayFailed, onAutoPlayFailed);
    engine.on(TUIRoomEvents.onAutoPlayFailed, onAutoPlayFailed);
  }

  attach();
  TUIRoomEngine.once('ready', attach);

  onScopeDispose(() => {
    disposed = true;
    roomEngine.instance?.off(TUIRoomEvents.onAutoPlayFailed, onAutoPlayFailed);
    box?.close();
    box = null;
    pendingResumes.clear();
  });
}
