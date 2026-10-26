import { useEffect, useRef } from 'react';
import { useDeviceState } from 'tuikit-atomicx-react/room';
import { IconCheck, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import './index.scss';

const SPEAKER_TEST_URL
  = 'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
const LEVEL_BAR_COUNT = 16;

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
    currentMicVolume,
    testingMicVolume,
    isMicrophoneTesting,
    speakerList,
    currentSpeaker,
    isSpeakerTesting,
    getMicrophoneList,
    getSpeakerList,
    setCurrentMicrophone,
    setCurrentSpeaker,
    startSpeakerTest,
    stopSpeakerTest,
  } = useDeviceState();

  const isSpeakerTestingRef = useRef(isSpeakerTesting);
  isSpeakerTestingRef.current = isSpeakerTesting;

  /** Device test reports its own volume; the published-mic value is empty before a room. */
  const micVolume = isMicrophoneTesting ? testingMicVolume : currentMicVolume;

  const activeBarCount = Math.round((Math.min(100, Math.max(0, micVolume)) / 100) * LEVEL_BAR_COUNT);

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

  async function toggleSpeakerTest() {
    try {
      if (isSpeakerTesting) {
        await stopSpeakerTest();
        return;
      }
      await startSpeakerTest({ filePath: SPEAKER_TEST_URL });
    } catch {
      TUIToast.error(t('Device.SpeakerTestFailed'));
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
    return () => {
      if (isSpeakerTestingRef.current) {
        stopSpeakerTest();
      }
    };
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

      <div className="device-menu-level">
        <div className="device-menu-bars" aria-label={t('Device.MicLevel')}>
          {Array.from({ length: LEVEL_BAR_COUNT }, (_, i) => i + 1).map(index => (
            <span
              key={index}
              className={index <= activeBarCount ? 'device-menu-bar-on' : undefined}
            />
          ))}
        </div>
      </div>

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

      <div className="device-menu-row">
        <span className="device-menu-label">
          <span>{t('Device.SpeakerTest')}</span>
          <span className="device-menu-sub">{t('Device.SpeakerTestHint')}</span>
        </span>
        <button
          className={['device-menu-test', isSpeakerTesting ? 'is-playing' : ''].filter(Boolean).join(' ')}
          type="button"
          onClick={toggleSpeakerTest}
        >
          {isSpeakerTesting ? t('Device.Stop') : t('Device.Test')}
        </button>
      </div>
    </div>
  );
}

export default AudioDeviceMenu;
