import { useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { TUISwitch } from '../../../base';
import { useI18n } from '../../../i18n';
import { shareSystemAudio } from '../ScreenShareButton/useScreenShare';
import './ShareSettings.scss';

export interface ShareSettingsProps {
  className?: string;
  style?: CSSProperties;
}

export function ShareSettings(props: ShareSettingsProps) {
  const { className, style } = props;
  const { t } = useI18n();
  const shareSystemAudioValue = useSyncExternalStore(
    shareSystemAudio.subscribe,
    shareSystemAudio.getSnapshot,
    shareSystemAudio.getSnapshot,
  );

  return (
    <div className={['share-settings', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <div className="share-settings-row">
        <span className="share-settings-row-label">
          <span className="share-settings-row-title">{t('Settings.ShareSystemAudio')}</span>
          <span className="share-settings-row-description">{t('Settings.ShareSystemAudioDesc')}</span>
        </span>
        <span className="share-settings-row-control">
          <TUISwitch
            modelValue={shareSystemAudioValue}
            onUpdateModelValue={(value) => {
              shareSystemAudio.value = value;
            }}
          />
        </span>
      </div>
    </div>
  );
}

export default ShareSettings;
