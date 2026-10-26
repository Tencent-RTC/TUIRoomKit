import { useEffect } from 'react';
import {
  MirrorType,
  VideoQuality,
  useDeviceState,
} from 'tuikit-atomicx-react/room';
import { TUIOption, TUISelect, TUISwitch, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import CameraPreview from './CameraPreview';
import './index.scss';

const QUALITY_OPTIONS = [
  { labelKey: 'Settings.Quality1080P', value: VideoQuality.Quality1080P },
  { labelKey: 'Settings.Quality720P', value: VideoQuality.Quality720P },
  { labelKey: 'Settings.Quality540P', value: VideoQuality.Quality540P },
  { labelKey: 'Settings.Quality360P', value: VideoQuality.Quality360P },
];

export function VideoSettings() {
  const { t } = useI18n();

  const {
    cameraList,
    currentCamera,
    localMirrorType,
    localVideoQuality,
    getCameraList,
    setCurrentCamera,
    switchMirror,
    updateVideoQuality,
  } = useDeviceState();

  const mirrorEnabled = localMirrorType !== MirrorType.Disable;

  async function selectCamera(deviceId: string | number | null) {
    if (typeof deviceId !== 'string') {
      return;
    }
    try {
      await setCurrentCamera({ deviceId });
    } catch {
      TUIToast.error(t('Settings.CameraFailed'));
    }
  }

  async function selectVideoQuality(quality: string | number | null) {
    if (typeof quality !== 'number') {
      return;
    }
    try {
      await updateVideoQuality({ quality: quality as VideoQuality });
    } catch {
      TUIToast.error(t('Settings.ResolutionFailed'));
    }
  }

  async function toggleMirror(enabled: boolean) {
    try {
      await switchMirror({
        mirror: enabled ? MirrorType.Auto : MirrorType.Disable,
      });
    } catch {
      TUIToast.error(t('Settings.MirrorFailed'));
    }
  }

  useEffect(() => {
    getCameraList().catch(() => TUIToast.error(t('Settings.CameraListFailed')));
  }, []);

  return (
    <div className="video-settings">
      <CameraPreview />

      <div className="video-settings-row">
        <span className="video-settings-row-label">
          <span className="video-settings-row-title">{t('Settings.Camera')}</span>
        </span>
        <span className="video-settings-row-control">
          <TUISelect
            modelValue={currentCamera?.deviceId ?? null}
            size="sm"
            placeholder={t('Settings.CameraEmpty')}
            disabled={!cameraList.length}
            emptyText={t('Settings.CameraEmpty')}
            onChange={selectCamera}
          >
            {cameraList.map(device => (
              <TUIOption
                key={device.deviceId}
                value={device.deviceId}
                label={device.deviceName}
              />
            ))}
          </TUISelect>
        </span>
      </div>

      <div className="video-settings-row">
        <span className="video-settings-row-label">
          <span className="video-settings-row-title">{t('Settings.Resolution')}</span>
          <span className="video-settings-row-description">{t('Settings.ResolutionDesc')}</span>
        </span>
        <span className="video-settings-row-control">
          <TUISelect
            modelValue={localVideoQuality}
            size="sm"
            onChange={selectVideoQuality}
          >
            {QUALITY_OPTIONS.map(option => (
              <TUIOption
                key={option.value}
                value={option.value}
                label={t(option.labelKey)}
              />
            ))}
          </TUISelect>
        </span>
      </div>

      <div className="video-settings-row">
        <span className="video-settings-row-label">
          <span className="video-settings-row-title">{t('Settings.Mirror')}</span>
          <span className="video-settings-row-description">{t('Settings.MirrorDesc')}</span>
        </span>
        <span className="video-settings-row-control">
          <TUISwitch modelValue={mirrorEnabled} onChange={toggleMirror} />
        </span>
      </div>
    </div>
  );
}

export default VideoSettings;
