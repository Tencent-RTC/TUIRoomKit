import { useEffect, useRef } from 'react';
import {
  MirrorType,
  VideoQuality,
  useDeviceState,
} from 'tuikit-atomicx-react/room';
import { IconCheck, TUISwitch, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import type { SettingsTab } from '../../Setting/SettingsDialogPC/SettingsDialogPC';
import './index.scss';

export interface VideoDeviceMenuProps {
  /* Kept for the CameraButton contract; its only caller was the out-of-scope video effect entry. */
  onOpenSetting?: (tab: SettingsTab) => void;
}

/** Same copy as the resolution row in the settings dialog, so both read from one set of keys */
const qualityOptions = [
  { labelKey: 'Settings.Quality1080P', value: VideoQuality.Quality1080P },
  { labelKey: 'Settings.Quality720P', value: VideoQuality.Quality720P },
  { labelKey: 'Settings.Quality540P', value: VideoQuality.Quality540P },
  { labelKey: 'Settings.Quality360P', value: VideoQuality.Quality360P },
];

export function VideoDeviceMenu(props: VideoDeviceMenuProps) {
  const { onOpenSetting } = props;
  const { t } = useI18n();

  const cameraListRef = useRef<HTMLDivElement | null>(null);

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

  async function selectCamera(deviceId: string) {
    try {
      await setCurrentCamera({ deviceId });
    } catch {
      TUIToast.error(t('Device.SwitchCamFailed'));
    }
  }

  async function selectVideoQuality(quality: VideoQuality) {
    try {
      await updateVideoQuality({ quality });
    } catch {
      TUIToast.error(t('Device.SwitchQualityFailed'));
    }
  }

  async function toggleMirror(enabled: boolean) {
    try {
      await switchMirror({
        mirror: enabled ? MirrorType.Auto : MirrorType.Disable,
      });
    } catch {
      TUIToast.error(t('Device.SwitchMirrorFailed'));
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        await getCameraList();
      } catch {
        TUIToast.error(t('Device.GetCameraListFailed'));
        return;
      }
      // Wait for the refreshed list to commit before looking for the active row.
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
      /** A long list often keeps the current camera below the fold; open with it in view. */
      cameraListRef.current
        ?.querySelector('.device-menu-item-active')
        ?.scrollIntoView({ block: 'nearest' });
    })();
  }, []);

  return (
    <div className="device-menu is-video">
      <div className="device-menu-title">
        {t('Device.Camera')}
      </div>
      {cameraList.length
        ? (
          <div ref={cameraListRef} className="device-menu-list">
            {cameraList.map(device => (
              <button
                key={device.deviceId}
                className={[
                  'device-menu-item',
                  device.deviceId === currentCamera?.deviceId ? 'device-menu-item-active' : '',
                ].filter(Boolean).join(' ')}
                type="button"
                onClick={() => selectCamera(device.deviceId)}
              >
                <span className="device-menu-name">
                  <span className="device-menu-name-text">{device.deviceName}</span>
                </span>
                {device.deviceId === currentCamera?.deviceId && (
                  <IconCheck
                    size={16}
                    className="device-menu-check"
                  />
                )}
              </button>
            ))}
          </div>
        )
        : (
          <div className="device-menu-empty">
            {t('Device.NoCamera')}
          </div>
        )}

      <div className="device-menu-divider" />

      <div className="device-menu-title">
        {t('Device.Resolution')}
      </div>
      <div className="device-menu-list">
        {qualityOptions.map(option => (
          <button
            key={option.value}
            className={[
              'device-menu-item',
              option.value === localVideoQuality ? 'device-menu-item-active' : '',
            ].filter(Boolean).join(' ')}
            type="button"
            onClick={() => selectVideoQuality(option.value)}
          >
            <span className="device-menu-name">
              <span className="device-menu-name-text">{t(option.labelKey)}</span>
            </span>
            {option.value === localVideoQuality && (
              <IconCheck
                size={16}
                className="device-menu-check"
              />
            )}
          </button>
        ))}
      </div>

      <div className="device-menu-divider" />

      <div className="device-menu-row">
        <span className="device-menu-label">
          <span>{t('Device.Mirror')}</span>
        </span>
        <TUISwitch
          modelValue={mirrorEnabled}
          size="sm"
          onChange={toggleMirror}
        />
      </div>

      <div className="device-menu-divider" />

      <button
        className="device-menu-item"
        type="button"
        onClick={() => onOpenSetting?.('videoEffect')}
      >
        <span className="device-menu-name">
          <span className="device-menu-name-text">{t('Settings.TabVideoEffect')}</span>
        </span>
      </button>
    </div>
  );
}

export default VideoDeviceMenu;
