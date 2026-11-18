import { useEffect, useRef } from 'react';
import { useDeviceState } from 'tuikit-atomicx-react/room';
import { IconCheck, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import './index.scss';

/** A long list often keeps the current device below the fold; open with it in view. */
function revealCurrentDevice(list: HTMLElement | null) {
  list?.querySelector('.device-menu-item-active')?.scrollIntoView({ block: 'nearest' });
}

export function AudioDeviceMenu() {
  const { t } = useI18n();

  const microphoneListRef = useRef<HTMLDivElement | null>(null);
  const speakerListRef = useRef<HTMLDivElement | null>(null);

  const {
    microphoneList,
    currentMicrophone,
    speakerList,
    currentSpeaker,
    getMicrophoneList,
    getSpeakerList,
    setCurrentMicrophone,
    setCurrentSpeaker,
  } = useDeviceState();

  async function selectMicrophone(deviceId: string) {
    try {
      await setCurrentMicrophone({ deviceId });
    } catch {
      TUIToast.error(t('Device.SwitchMicFailed'));
    }
  }

  async function selectSpeaker(deviceId: string) {
    try {
      await setCurrentSpeaker({ deviceId });
    } catch {
      TUIToast.error(t('Device.SwitchSpeakerFailed'));
    }
  }

  useEffect(() => {
    void (async () => {
      await Promise.allSettled([getMicrophoneList(), getSpeakerList()]);
      // Wait for the refreshed lists to commit before looking for the active row.
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
      revealCurrentDevice(microphoneListRef.current);
      revealCurrentDevice(speakerListRef.current);
    })();
  }, []);

  return (
    <div className="device-menu is-audio">
      <div className="device-menu-title">
        {t('Device.Microphone')}
      </div>
      {microphoneList.length
        ? (
          <div ref={microphoneListRef} className="device-menu-list">
            {microphoneList.map(device => (
              <button
                key={device.deviceId}
                className={[
                  'device-menu-item',
                  device.deviceId === currentMicrophone?.deviceId ? 'device-menu-item-active' : '',
                ].filter(Boolean).join(' ')}
                type="button"
                onClick={() => selectMicrophone(device.deviceId)}
              >
                <span className="device-menu-name">
                  <span className="device-menu-name-text">{device.deviceName}</span>
                </span>
                {device.deviceId === currentMicrophone?.deviceId && (
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
            {t('Device.NoMicrophone')}
          </div>
        )}

      <div className="device-menu-divider" />

      <div className="device-menu-title">
        {t('Device.Speaker')}
      </div>
      {speakerList.length
        ? (
          <div ref={speakerListRef} className="device-menu-list">
            {speakerList.map(device => (
              <button
                key={device.deviceId}
                className={[
                  'device-menu-item',
                  device.deviceId === currentSpeaker?.deviceId ? 'device-menu-item-active' : '',
                ].filter(Boolean).join(' ')}
                type="button"
                onClick={() => selectSpeaker(device.deviceId)}
              >
                <span className="device-menu-name">
                  <span className="device-menu-name-text">{device.deviceName}</span>
                </span>
                {device.deviceId === currentSpeaker?.deviceId && (
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
            {t('Device.NoSpeaker')}
          </div>
        )}
    </div>
  );
}

export default AudioDeviceMenu;
