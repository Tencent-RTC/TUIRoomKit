import { useEffect } from 'react';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from 'tuikit-atomicx-react/room';
import { TUIMessageBox } from '../../../base';
import type { MessageBoxHandle } from '../../../base/components/MessageBox';
import { t } from '../../../i18n';

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

  useEffect(() => {
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

    return () => {
      disposed = true;
      roomEngine.instance?.off(TUIRoomEvents.onAutoPlayFailed, onAutoPlayFailed);
      box?.close();
      box = null;
      pendingResumes.clear();
    };
  }, [roomEngine]);
}
