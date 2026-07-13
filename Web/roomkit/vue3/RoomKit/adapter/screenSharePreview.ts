import { useRoomEngine } from 'tuikit-atomicx-vue3/room';

interface TRTCInstanceLike {
  updateScreenShare(config: {
    view: string | HTMLElement | HTMLElement[] | null;
  }): Promise<void>;
  getVideoTrack(config: {
    streamType: 'sub';
  }): MediaStreamTrack | null;
}

interface TRTCCloudWithInternalInstance {
  _trtc?: TRTCInstanceLike;
}

const roomEngine = useRoomEngine();
let localScreenSharePreviewConfirmed = false;

export async function updateLocalScreenShareView(view: HTMLElement): Promise<void> {
  const trtcCloud = roomEngine.instance?.getTRTCCloud() as TRTCCloudWithInternalInstance | undefined;
  const trtc = trtcCloud?._trtc;

  if (!trtc?.updateScreenShare) {
    throw new Error('[ScreenSharePreview] TRTC instance is unavailable');
  }

  await trtc.updateScreenShare({ view });
}

export async function getLocalScreenShareSurface(timeout = 2000): Promise<string | undefined> {
  const interval = 100;
  const attempts = Math.ceil(timeout / interval);

  for (let index = 0; index < attempts; index += 1) {
    const trtcCloud = roomEngine.instance?.getTRTCCloud() as TRTCCloudWithInternalInstance | undefined;
    const screenTrack = trtcCloud?._trtc?.getVideoTrack?.({ streamType: 'sub' });
    const settings = screenTrack?.getSettings() as MediaTrackSettings & {
      displaySurface?: string;
    } | undefined;
    if (settings?.displaySurface) {
      return settings.displaySurface;
    }
    await new Promise(resolve => window.setTimeout(resolve, interval));
  }

  return undefined;
}

export function isLocalScreenSharePreviewConfirmed(): boolean {
  return localScreenSharePreviewConfirmed;
}

export function confirmLocalScreenSharePreview(): void {
  localScreenSharePreviewConfirmed = true;
}

export function clearLocalScreenSharePreviewConfirmation(): void {
  localScreenSharePreviewConfirmed = false;
}
