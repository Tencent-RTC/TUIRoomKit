import { useState } from 'react';
import { useI18n } from '../../../i18n';
import CameraPreview from '../../Device/VideoSettings/CameraPreview';
import BeautySettings from '../../VideoEffect/BeautySettings/BeautySettings';
import VirtualBackgroundSettings from '../../VideoEffect/VirtualBackgroundSettings/VirtualBackgroundSettings';
import './VideoEffectSettings.scss';

type EffectPanel = 'background' | 'beauty';

export function VideoEffectSettings() {
  const { t } = useI18n();
  const [panel, setPanel] = useState<EffectPanel>('background');
  const [isPreviewing, setIsPreviewing] = useState(false);

  return (
    <div className="video-effect-settings">
      <CameraPreview previewing={isPreviewing} onUpdatePreviewing={setIsPreviewing} />

      <div className="video-effect-tabs-wrap">
        <div className="video-effect-tabs" role="tablist">
          <button
            className={['video-effect-tab', panel === 'background' ? 'is-active' : ''].filter(Boolean).join(' ')}
            type="button"
            role="tab"
            aria-selected={panel === 'background'}
            onClick={() => setPanel('background')}
          >
            {t('VirtualBackground.Title')}
          </button>
          <button
            className={['video-effect-tab', panel === 'beauty' ? 'is-active' : ''].filter(Boolean).join(' ')}
            type="button"
            role="tab"
            aria-selected={panel === 'beauty'}
            onClick={() => setPanel('beauty')}
          >
            {t('Beauty.Title')}
          </button>
        </div>
      </div>

      <VirtualBackgroundSettings
        style={panel === 'background' ? undefined : { display: 'none' }}
        previewReady={isPreviewing}
      />
      <BeautySettings
        style={panel === 'beauty' ? undefined : { display: 'none' }}
        previewReady={isPreviewing}
      />
    </div>
  );
}

export default VideoEffectSettings;
