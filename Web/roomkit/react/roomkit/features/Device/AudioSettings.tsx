import { useEffect, useRef } from 'react';
import { useDeviceState } from 'tuikit-atomicx-react/room';
import { TUIOption, TUISelect, TUIToast } from '../../base';
import { useI18n } from '../../i18n';
import './AudioSettings.scss';

const SPEAKER_TEST_URL
  = 'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
const LEVEL_BAR_COUNT = 30;
const MIC_TEST_INTERVAL = 200;

export function AudioSettings() {
  const { t } = useI18n();

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
    startMicrophoneTest,
    stopMicrophoneTest,
    startSpeakerTest,
    stopSpeakerTest,
  } = useDeviceState();

  const isMicrophoneTestingRef = useRef(isMicrophoneTesting);
  isMicrophoneTestingRef.current = isMicrophoneTesting;
  const isSpeakerTestingRef = useRef(isSpeakerTesting);
  isSpeakerTestingRef.current = isSpeakerTesting;

  /** The device test reports its own volume; the room's value only covers a published mic. */
  const micVolume = isMicrophoneTesting ? testingMicVolume : currentMicVolume;

  const activeBarCount = Math.round((Math.min(100, Math.max(0, micVolume)) / 100) * LEVEL_BAR_COUNT);

  async function selectMicrophone(deviceId: string | number | null) {
    if (typeof deviceId !== 'string') {
      return;
    }
    try {
      await setCurrentMicrophone({ deviceId });
    } catch {
      TUIToast.error(t('Settings.MicrophoneFailed'));
    }
  }

  async function selectSpeaker(deviceId: string | number | null) {
    if (typeof deviceId !== 'string') {
      return;
    }
    try {
      await setCurrentSpeaker({ deviceId });
    } catch {
      TUIToast.error(t('Settings.SpeakerFailed'));
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
      TUIToast.error(t('Settings.SpeakerTestFailed'));
    }
  }

  useEffect(() => {
    Promise.allSettled([getMicrophoneList(), getSpeakerList()]);
    // A blocked or missing microphone already shows up in the device list and its
    // error state, so a failed test leaves the meter flat instead of raising a toast.
    startMicrophoneTest({ interval: MIC_TEST_INTERVAL }).catch(() => {});
    return () => {
      if (isMicrophoneTestingRef.current) {
        stopMicrophoneTest();
      }
      if (isSpeakerTestingRef.current) {
        stopSpeakerTest();
      }
    };
  }, []);

  return (
    <div className="audio-settings">
      <div className="audio-settings-group-title">{t('Settings.AudioInput')}</div>

      <div className="audio-settings-row">
        <span className="audio-settings-row-title">{t('Settings.Microphone')}</span>
        <span className="audio-settings-row-control">
          <TUISelect
            modelValue={currentMicrophone?.deviceId ?? null}
            size="sm"
            placeholder={t('Settings.MicrophoneEmpty')}
            disabled={!microphoneList.length}
            emptyText={t('Settings.MicrophoneEmpty')}
            onChange={selectMicrophone}
          >
            {microphoneList.map(device => (
              <TUIOption
                key={device.deviceId}
                value={device.deviceId}
                label={device.deviceName}
              />
            ))}
          </TUISelect>
        </span>
      </div>

      <div className="audio-settings-row">
        <span className="audio-settings-row-title">{t('Settings.MicLevel')}</span>
        <span className="audio-settings-row-control">
          <div className="audio-settings-level" aria-label={t('Settings.MicLevelMeter')}>
            {Array.from({ length: LEVEL_BAR_COUNT }, (_, i) => i + 1).map(index => (
              <span
                key={index}
                className={index <= activeBarCount ? 'is-on' : undefined}
              />
            ))}
          </div>
        </span>
      </div>

      <div className="audio-settings-group-title">{t('Settings.AudioOutput')}</div>

      <div className="audio-settings-row">
        <span className="audio-settings-row-title">{t('Settings.Speaker')}</span>
        <span className="audio-settings-row-control">
          <TUISelect
            modelValue={currentSpeaker?.deviceId ?? null}
            size="sm"
            placeholder={t('Settings.SpeakerEmpty')}
            disabled={!speakerList.length}
            emptyText={t('Settings.SpeakerEmpty')}
            onChange={selectSpeaker}
          >
            {speakerList.map(device => (
              <TUIOption
                key={device.deviceId}
                value={device.deviceId}
                label={device.deviceName}
              />
            ))}
          </TUISelect>
        </span>
      </div>

      <div className="audio-settings-row is-inline">
        <span className="audio-settings-row-title">{t('Settings.SpeakerTest')}</span>
        <span className="audio-settings-row-control">
          <button
            className={['audio-settings-test', isSpeakerTesting ? 'is-playing' : ''].filter(Boolean).join(' ')}
            type="button"
            onClick={toggleSpeakerTest}
          >
            {isSpeakerTesting ? t('Settings.SpeakerTestStop') : t('Settings.SpeakerTestStart')}
          </button>
        </span>
      </div>
    </div>
  );
}

export default AudioSettings;
